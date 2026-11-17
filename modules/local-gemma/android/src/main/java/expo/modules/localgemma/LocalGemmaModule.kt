package expo.modules.localgemma

import android.content.Context
import com.google.ai.edge.litertlm.Backend
import com.google.ai.edge.litertlm.Engine
import com.google.ai.edge.litertlm.EngineConfig
import expo.modules.kotlin.Promise
import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition
import java.io.File
import java.io.FileOutputStream
import java.net.HttpURLConnection
import java.net.URL
import java.util.concurrent.atomic.AtomicBoolean
import java.util.concurrent.atomic.AtomicLong

// Gemma 4 on the phone (Google LiteRT-LM). The model file (about 2.6 GB) is downloaded once, and can be resumed if it stops half way.
// After that answers are made on the phone with no internet, and what is asked never leaves it.
class LocalGemmaModule : Module() {
  private val done = AtomicLong(0)
  private val total = AtomicLong(0)
  private val stop = AtomicBoolean(false)
  private val busy = AtomicBoolean(false)
  private var engine: Engine? = null
  private val lock = Any()

  private fun ctx(): Context = appContext.reactContext ?: throw IllegalStateException("no context")
  private fun dir(): File = File(ctx().filesDir, "gemma").also { it.mkdirs() }
  private fun file(): File = File(dir(), "model.litertlm")
  private fun part(): File = File(dir(), "model.litertlm.part")

  private fun closeEngine() { try { engine?.close() } catch (e: Throwable) { }; engine = null }

  override fun definition() = ModuleDefinition {
    Name("LocalGemma")

    Function("ready") {
      try { file().exists() && file().length() > 500L * 1024 * 1024 } catch (e: Throwable) { false }
    }

    // Bytes already on the phone from an unfinished download, so the app can say "resume".
    Function("partial") { try { part().length().toDouble() } catch (e: Throwable) { 0.0 } }

    // [bytes done, total bytes] of the download in progress.
    Function("progress") { listOf(done.get().toDouble(), total.get().toDouble()) }

    AsyncFunction("download") { url: String, promise: Promise ->
      if (!busy.compareAndSet(false, true)) { promise.resolve(false); return@AsyncFunction }
      stop.set(false); done.set(0); total.set(0)
      Thread {
        var ok = false
        val p = part()
        try {
          val have = if (p.exists()) p.length() else 0L
          var u = url
          var c: HttpURLConnection? = null
          var hops = 0
          while (hops < 6) {
            c = URL(u).openConnection() as HttpURLConnection
            c.instanceFollowRedirects = false
            c.connectTimeout = 20000
            c.readTimeout = 30000
            if (have > 0) c.setRequestProperty("Range", "bytes=$have-")
            val code = c.responseCode
            if (code in 300..399) { u = c.getHeaderField("Location") ?: break; c.disconnect(); hops++ } else break
          }
          val code = c?.responseCode ?: 0
          if (c != null && (code == 200 || code == 206)) {
            val resumed = code == 206 && have > 0
            val len = c.contentLengthLong
            val all = if (len > 0) (if (resumed) have + len else len) else 0L
            total.set(all)
            done.set(if (resumed) have else 0L)
            val need = if (all > 0) all - (if (resumed) have else 0L) else 0L
            if (need > 0 && dir().usableSpace < need + 200L * 1024 * 1024) throw IllegalStateException("no space")
            c.inputStream.use { inp ->
              FileOutputStream(p, resumed).use { out ->
                val buf = ByteArray(128 * 1024)
                while (true) {
                  if (stop.get()) throw InterruptedException()
                  val n = inp.read(buf)
                  if (n < 0) break
                  out.write(buf, 0, n)
                  done.addAndGet(n.toLong())
                }
              }
            }
            if (all <= 0 || p.length() == all) { closeEngine(); file().delete(); ok = p.renameTo(file()) }
          }
        } catch (e: InterruptedException) {
          ok = false // cancelled: the part file is kept so the download can be resumed
        } catch (e: Throwable) {
          ok = false
        }
        busy.set(false)
        promise.resolve(ok)
      }.start()
    }

    Function("cancel") { stop.set(true); true }

    AsyncFunction("remove") { promise: Promise ->
      try {
        synchronized(lock) { closeEngine() }
        file().delete(); part().delete()
        promise.resolve(true)
      } catch (e: Throwable) { promise.resolve(false) }
    }

    // Frees the memory the model uses. The next question loads it again.
    AsyncFunction("unload") { promise: Promise ->
      synchronized(lock) { closeEngine() }
      promise.resolve(true)
    }

    // Writes an answer for a prompt. Resolves an empty text if anything goes wrong, so the app can fall back to its own words.
    AsyncFunction("generate") { prompt: String, promise: Promise ->
      Thread {
        try {
          val r = synchronized(lock) {
            if (engine == null) {
              val cfg = EngineConfig(
                modelPath = file().absolutePath,
                backend = Backend.CPU(),
                cacheDir = ctx().cacheDir.path,
              )
              val e = Engine(cfg)
              e.initialize()
              engine = e
            }
            val conv = engine!!.createConversation()
            try { conv.sendMessage(prompt).text } finally { try { conv.close() } catch (x: Throwable) { } }
          }
          promise.resolve(r ?: "")
        } catch (e: Throwable) {
          synchronized(lock) { closeEngine() }
          promise.resolve("")
        }
      }.start()
    }
  }
}
