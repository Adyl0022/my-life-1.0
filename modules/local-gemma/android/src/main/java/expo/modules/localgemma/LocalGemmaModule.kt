package expo.modules.localgemma

import android.content.Context
import com.google.ai.edge.litertlm.Backend
import com.google.ai.edge.litertlm.Contents
import com.google.ai.edge.litertlm.Conversation
import com.google.ai.edge.litertlm.ConversationConfig
import com.google.ai.edge.litertlm.SamplerConfig
import com.google.ai.edge.litertlm.Message
import com.google.ai.edge.litertlm.MessageCallback
import com.google.ai.edge.litertlm.Engine
import com.google.ai.edge.litertlm.EngineConfig
import expo.modules.kotlin.Promise
import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition
import java.io.File
import java.io.FileOutputStream
import java.net.HttpURLConnection
import java.net.URL
import java.util.concurrent.CountDownLatch
import java.util.concurrent.TimeUnit
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

  // What the model has written so far. The app reads it while the answer is being made, so the words can appear one by one.
  private val live = StringBuffer()
  private var gpuActive = false
  private fun prefs() = ctx().getSharedPreferences("local_gemma", Context.MODE_PRIVATE)

  private fun build(gpu: Boolean): Engine {
    val cfg = EngineConfig(
      modelPath = file().absolutePath,
      backend = if (gpu) Backend.GPU() else Backend.CPU(),
      cacheDir = ctx().cacheDir.path,
    )
    val e = Engine(cfg)
    e.initialize()
    return e
  }

  // Loads the model on the phone's normal processor. (The graphics chip was tried, but on some phones it closes the whole app on the first
  // question, so it is switched off.)
  private fun ensure() {
    if (engine != null) return
    gpuActive = false
    engine = build(false)
  }

  private fun gpuWorked() { if (gpuActive) prefs().edit().putString("gpu", "ok").commit() }
  private fun gpuFailed() { prefs().edit().putString("gpu", "bad").commit(); gpuActive = false }

  private fun stream(conv: Conversation, prompt: String): String {
    live.setLength(0)
    val latch = CountDownLatch(1)
    var err: Throwable? = null
    var looping = false
    conv.sendMessageAsync(prompt, object : MessageCallback {
      override fun onMessage(message: Message) {
        if (looping) return
        val t = message.toString()
        val cur = live.toString()
        // Some versions send the whole text so far, others only the new piece.
        if (cur.isNotEmpty() && t.length > cur.length && t.startsWith(cur)) live.setLength(0)
        live.append(t)
        // A small model can get stuck repeating itself. If the last 60 characters already appeared earlier, cut the repeat and stop.
        if (live.length > 160) {
          val tail = live.substring(live.length - 60)
          val at = live.indexOf(tail)
          if (at >= 0 && at < live.length - 60) {
            looping = true
            live.setLength(live.length - 60)
            try { conv.javaClass.getMethod("cancelProcess").invoke(conv) } catch (x: Throwable) { }
            latch.countDown()
          }
        }
      }
      override fun onDone() { latch.countDown() }
      override fun onError(throwable: Throwable) { err = throwable; latch.countDown() }
    })
    latch.await(240, TimeUnit.SECONDS)
    val e = err
    if (e != null && !looping) throw e
    return live.toString()
  }

  private fun runOnce(prompt: String, system: String = ""): String = synchronized(lock) {
    ensure()
    // Some randomness and a limit on the length stop the model from repeating the same sentence over and over.
    val conv = engine!!.createConversation(ConversationConfig(systemInstruction = if (system.isNotBlank()) Contents.of(system) else null, samplerConfig = SamplerConfig(topK = 20, topP = 0.8, temperature = 0.8), maxOutputToken = 1500))
    try { stream(conv, prompt) } finally { try { conv.close() } catch (x: Throwable) { } }
  }

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

    Function("live") { live.toString() }

    // Loads the model in the background, so the first question is not slow. A short test question also proves the graphics chip works.
    AsyncFunction("warm") { promise: Promise ->
      Thread {
        try {
          if (!(file().exists() && file().length() > 500L * 1024 * 1024)) { promise.resolve(false); return@Thread }
          synchronized(lock) { ensure() }
          if (gpuActive) { runOnce("Hi"); gpuWorked() }
          promise.resolve(true)
        } catch (e: Throwable) {
          if (gpuActive) gpuFailed()
          synchronized(lock) { closeEngine() }
          promise.resolve(false)
        }
      }.start()
    }

    // Writes an answer for a prompt. Resolves an empty text if anything goes wrong, so the app can fall back to its own words.
    AsyncFunction("generate") { prompt: String, system: String, promise: Promise ->
      Thread {
        var r = ""
        try {
          r = runOnce(prompt, system)
          gpuWorked()
        } catch (e: Throwable) {
          val wasGpu = gpuActive
          synchronized(lock) { closeEngine() }
          if (wasGpu) {
            // The graphics chip failed: use the normal processor and try once more.
            gpuFailed()
            try { r = runOnce(prompt, system) } catch (x: Throwable) { synchronized(lock) { closeEngine() }; r = "" }
          }
        }
        promise.resolve(r)
      }.start()
    }
  }
}
