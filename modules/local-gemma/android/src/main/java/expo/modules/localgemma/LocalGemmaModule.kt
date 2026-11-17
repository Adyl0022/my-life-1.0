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
    Function("partial") { try { ParallelDownload.saved(part()).toDouble() } catch (e: Throwable) { 0.0 } }

    // [bytes done, total bytes] of the download in progress.
    Function("progress") { listOf(done.get().toDouble(), total.get().toDouble()) }

    AsyncFunction("download") { url: String, promise: Promise ->
      if (!busy.compareAndSet(false, true)) { promise.resolve(false); return@AsyncFunction }
      stop.set(false); done.set(0); total.set(0)
      Thread {
        var ok = false
        val p = part()
        try {
          if (ParallelDownload.run(url, p, stop, done, total, dir())) { closeEngine(); file().delete(); ok = p.renameTo(file()); if (ok) try { File(p.path + ".meta").delete() } catch (e: Throwable) { } }
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
        file().delete(); ParallelDownload.clear(part())
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
