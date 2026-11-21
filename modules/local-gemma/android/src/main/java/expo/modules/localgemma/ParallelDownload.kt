package expo.modules.localgemma

import java.io.File
import java.io.RandomAccessFile
import java.net.HttpURLConnection
import java.net.URL
import java.nio.ByteBuffer
import java.util.concurrent.atomic.AtomicBoolean
import java.util.concurrent.atomic.AtomicLong

// Downloads a big file in several parts at the same time (faster than one connection) and keeps a small note
// of how far each part got, so a stopped download carries on where it stopped.
object ParallelDownload {
  private const val PARTS = 4

  private fun open(url: String, from: Long, to: Long): HttpURLConnection? {
    var u = url
    var hops = 0
    while (hops < 6) {
      val c = URL(u).openConnection() as HttpURLConnection
      c.instanceFollowRedirects = false
      c.connectTimeout = 20000
      c.readTimeout = 30000
      c.setRequestProperty("Range", if (to >= 0) "bytes=$from-$to" else "bytes=$from-")
      val code = c.responseCode
      if (code in 300..399) { u = c.getHeaderField("Location") ?: return null; c.disconnect(); hops++ } else return c
    }
    return null
  }

  private fun meta(part: File) = File(part.path + ".meta")

  // Bytes already saved by an unfinished download.
  fun saved(part: File): Long {
    return try {
      val l = meta(part).readLines()
      if (l.size < 2 || !part.exists()) 0L else {
        val total = l[0].toLong(); val n = l[1].toInt()
        val seg = (total + n - 1) / n
        var s = 0L
        for (i in 0 until n) s += (l[2 + i].toLong() - i * seg).coerceAtLeast(0)
        s
      }
    } catch (e: Throwable) { 0L }
  }

  fun clear(part: File) { try { part.delete(); meta(part).delete() } catch (e: Throwable) { } }

  // Returns true when the whole file is in `part`.
  fun run(url: String, part: File, stop: AtomicBoolean, done: AtomicLong, total: AtomicLong, spaceDir: File): Boolean {
    // 1. find the size (and whether the server allows parts)
    val c0 = open(url, 0, 0) ?: return false
    val code = c0.responseCode
    val size: Long = if (code == 206) (c0.getHeaderField("Content-Range")?.substringAfter('/')?.trim()?.toLongOrNull() ?: 0L) else 0L
    c0.disconnect()
    if (size <= 0) return single(url, part, stop, done, total, spaceDir)
    total.set(size)

    // 2. pick up an unfinished download, or start a new one
    val n = PARTS
    val seg = (size + n - 1) / n
    val cur = LongArray(n) { it * seg }
    var resumed = false
    try {
      val l = meta(part).readLines()
      if (part.exists() && part.length() == size && l.size >= 2 + n && l[0].toLong() == size && l[1].toInt() == n) {
        for (i in 0 until n) cur[i] = l[2 + i].toLong()
        resumed = true
      }
    } catch (e: Throwable) { }
    if (!resumed) {
      if (spaceDir.usableSpace < size + 200L * 1024 * 1024) throw IllegalStateException("no space")
      clear(part)
      RandomAccessFile(part, "rw").use { it.setLength(size) }
    }
    val end = LongArray(n) { minOf((it + 1) * seg, size) - 1 }
    var d = 0L
    for (i in 0 until n) d += (cur[i] - i * seg).coerceAtLeast(0)
    done.set(d)

    val raf = RandomAccessFile(part, "rw")
    val ch = raf.channel
    val failed = AtomicBoolean(false)
    val threads = (0 until n).map { i ->
      Thread {
        var tries = 0
        while (cur[i] <= end[i] && !stop.get() && !failed.get() && tries < 6) {
          try {
            val c = open(url, cur[i], end[i])
            if (c == null || c.responseCode != 206) { c?.disconnect(); throw IllegalStateException("bad") }
            c.inputStream.use { inp ->
              val buf = ByteArray(128 * 1024)
              while (cur[i] <= end[i]) {
                if (stop.get() || failed.get()) break
                val want = minOf(buf.size.toLong(), end[i] - cur[i] + 1).toInt()
                val r = inp.read(buf, 0, want)
                if (r < 0) break
                ch.write(ByteBuffer.wrap(buf, 0, r), cur[i])
                cur[i] += r.toLong()
                done.addAndGet(r.toLong())
                tries = 0
              }
            }
          } catch (e: Throwable) {
            tries++
            try { Thread.sleep(1000L * tries) } catch (x: InterruptedException) { }
          }
        }
        if (cur[i] <= end[i] && !stop.get()) failed.set(true)
      }.also { it.start() }
    }
    fun save() { try { meta(part).writeText(size.toString() + "\n" + n + "\n" + cur.joinToString("\n")) } catch (e: Throwable) { } }
    while (threads.any { it.isAlive }) {
      try { Thread.sleep(1000) } catch (e: InterruptedException) { }
      save()
    }
    save()
    try { ch.close(); raf.close() } catch (e: Throwable) { }
    val all = (0 until n).all { cur[it] > end[it] }
    if (all) { try { meta(part).delete() } catch (e: Throwable) { } }
    return all && !stop.get()
  }

  // Server does not allow parts: plain single download.
  private fun single(url: String, part: File, stop: AtomicBoolean, done: AtomicLong, total: AtomicLong, spaceDir: File): Boolean {
    clear(part)
    val c = open(url, 0, -1) ?: return false
    if (c.responseCode != 200 && c.responseCode != 206) return false
    val len = c.contentLengthLong
    total.set(if (len > 0) len else 0L); done.set(0)
    if (len > 0 && spaceDir.usableSpace < len + 200L * 1024 * 1024) throw IllegalStateException("no space")
    c.inputStream.use { inp ->
      part.outputStream().use { out ->
        val buf = ByteArray(128 * 1024)
        while (true) {
          if (stop.get()) return false
          val r = inp.read(buf)
          if (r < 0) break
          out.write(buf, 0, r)
          done.addAndGet(r.toLong())
        }
      }
    }
    return len <= 0 || part.length() == len
  }
}
