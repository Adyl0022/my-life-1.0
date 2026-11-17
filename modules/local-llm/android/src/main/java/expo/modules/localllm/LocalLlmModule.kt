package expo.modules.localllm

import android.app.ActivityManager
import android.content.Context
import com.google.mediapipe.tasks.genai.llminference.LlmInference
import expo.modules.kotlin.Promise
import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition
import java.io.File
import java.io.FileOutputStream
import java.net.HttpURLConnection
import java.net.URL
import java.util.concurrent.atomic.AtomicBoolean
import java.util.concurrent.atomic.AtomicLong

// A small language model that runs on the phone. The model file is downloaded once (about 550 MB); after that answers are made on the
// phone with no internet, and what is asked never leaves it.
class LocalLlmModule : Module() {
  private val done = AtomicLong(0)
  private val total = AtomicLong(0)
  private val stop = AtomicBoolean(false)
  private val busy = AtomicBoolean(false)
  private var llm: LlmInference? = null
  private val lock = Any()

  private fun ctx(): Context = appContext.reactContext ?: throw IllegalStateException("no context")
  private fun dir(): File = File(ctx().filesDir, "llm").also { it.mkdirs() }
  private fun file(): File = File(dir(), "model.task")

  override fun definition() = ModuleDefinition {
    Name("LocalLlm")

    // Memory of the phone in MB, so the app can hide the feature on phones that are too small for it.
    Function("ramMb") {
      try {
        val am = ctx().getSystemService(Context.ACTIVITY_SERVICE) as ActivityManager
        val mi = ActivityManager.MemoryInfo()
        am.getMemoryInfo(mi)
        (mi.totalMem / (1024 * 1024)).toInt()
      } catch (e: Throwable) { 0 }
    }

    Function("ready") {
      try { file().exists() && file().length() > 100L * 1024 * 1024 } catch (e: Throwable) { false }
    }

    // [bytes done, total bytes] of the download in progress.
    Function("partial") { try { ParallelDownload.saved(File(dir(), "model.task.part")).toDouble() } catch (e: Throwable) { 0.0 } }

    Function("progress") { listOf(done.get().toDouble(), total.get().toDouble()) }

    AsyncFunction("download") { url: String, promise: Promise ->
      if (!busy.compareAndSet(false, true)) { promise.resolve(false); return@AsyncFunction }
      stop.set(false); done.set(0); total.set(0)
      Thread {
        var ok = false
        val part = File(dir(), "model.task.part")
        try {
          if (ParallelDownload.run(url, part, stop, done, total, dir())) { file().delete(); ok = part.renameTo(file()); if (ok) try { File(part.path + ".meta").delete() } catch (e: Throwable) { } }
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
        synchronized(lock) { try { llm?.close() } catch (e: Throwable) { }; llm = null }
        file().delete(); ParallelDownload.clear(File(dir(), "model.task.part"))
        promise.resolve(true)
      } catch (e: Throwable) { promise.resolve(false) }
    }

    // Frees the memory the model uses. The next question loads it again.
    AsyncFunction("unload") { promise: Promise ->
      synchronized(lock) { try { llm?.close() } catch (e: Throwable) { }; llm = null }
      promise.resolve(true)
    }

    // Writes an answer for a prompt. Resolves an empty text if anything goes wrong, so the app can fall back to its own words.
    AsyncFunction("generate") { prompt: String, promise: Promise ->
      Thread {
        try {
          val r = synchronized(lock) {
            if (llm == null) {
              val o = LlmInference.LlmInferenceOptions.builder()
                .setModelPath(file().absolutePath)
                .setMaxTokens(2048)
                .build()
              llm = LlmInference.createFromOptions(ctx(), o)
            }
            llm!!.generateResponse(prompt)
          }
          promise.resolve(r ?: "")
        } catch (e: Throwable) {
          promise.resolve("")
        }
      }.start()
    }
  }
}
