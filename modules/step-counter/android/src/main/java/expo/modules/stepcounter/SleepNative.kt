package expo.modules.stepcounter

import android.app.Notification
import android.app.NotificationChannel
import android.app.NotificationManager
import android.app.PendingIntent
import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent
import android.content.pm.PackageManager
import android.graphics.drawable.Icon
import android.os.Build
import java.text.SimpleDateFormat
import java.util.Calendar
import java.util.Date
import java.util.Locale

// The sleep timer, done by Android itself so nothing has to open the app:
// "Going to sleep" starts it, "I'm awake" (notification button or Quick Settings tile) stops it and shows the result.
// The finished sleeps wait in a small list (start:end,start:end) until the app opens and saves them into the Sleep Tracker.
object SleepNative {
  private const val P = "mylife_sleep_native"
  private const val CH_NOW = "sleep_timer"
  private const val CH_DONE = "sleep_result"
  private const val ID_NOW = 7101
  private const val ID_DONE = 7102
  const val ACT_AWAKE = "expo.modules.stepcounter.SLEEP_AWAKE"

  fun pending(c: Context): String = c.getSharedPreferences(P, Context.MODE_PRIVATE).getString("pending", "") ?: ""
  fun clearPending(c: Context) { c.getSharedPreferences(P, Context.MODE_PRIVATE).edit().remove("pending").commit() }
  private fun addPending(c: Context, s: Long, e: Long) {
    val old = pending(c)
    c.getSharedPreferences(P, Context.MODE_PRIVATE).edit().putString("pending", (if (old.isEmpty()) "" else "$old,") + "$s:$e").commit()
  }

  fun start(c: Context) {
    if (SleepTile.start(c) > 0L) return
    val now = System.currentTimeMillis()
    SleepTile.set(c, now)
    try { postNow(c, now) } catch (e: Throwable) {}
  }

  fun end(c: Context) {
    val s = SleepTile.start(c)
    if (s <= 0L) return
    val e = System.currentTimeMillis()
    SleepTile.set(c, 0L)
    try { nm(c).cancel(ID_NOW) } catch (x: Throwable) {}
    addPending(c, s, e)
    try { postResult(c, s, e) } catch (x: Throwable) {}
  }

  private fun nm(c: Context) = c.getSystemService(Context.NOTIFICATION_SERVICE) as NotificationManager

  private fun canPost(c: Context): Boolean =
    Build.VERSION.SDK_INT < 33 || c.checkSelfPermission(android.Manifest.permission.POST_NOTIFICATIONS) == PackageManager.PERMISSION_GRANTED

  private fun channels(c: Context) {
    val m = nm(c)
    val a = NotificationChannel(CH_NOW, "Sleep timer", NotificationManager.IMPORTANCE_LOW)
    a.setShowBadge(false); a.enableVibration(false); a.setSound(null, null)
    val b = NotificationChannel(CH_DONE, "Sleep result", NotificationManager.IMPORTANCE_DEFAULT)
    b.setShowBadge(false); b.enableVibration(false); b.setSound(null, null)
    m.createNotificationChannel(a); m.createNotificationChannel(b)
  }

  private fun openApp(c: Context): PendingIntent? {
    val i = c.packageManager.getLaunchIntentForPackage(c.packageName) ?: return null
    return PendingIntent.getActivity(c, 0, i, PendingIntent.FLAG_IMMUTABLE or PendingIntent.FLAG_UPDATE_CURRENT)
  }

  private fun postNow(c: Context, start: Long) {
    if (!canPost(c)) return
    channels(c)
    val awake = PendingIntent.getBroadcast(c, 1, Intent(c, SleepActionReceiver::class.java).setAction(ACT_AWAKE), PendingIntent.FLAG_IMMUTABLE or PendingIntent.FLAG_UPDATE_CURRENT)
    val n = Notification.Builder(c, CH_NOW)
      .setSmallIcon(R.drawable.ic_sleep_tile)
      .setContentTitle("Sleeping since " + SimpleDateFormat("h:mm a", Locale.US).format(Date(start)))
      .setContentText("Tap I'm awake when you wake up.")
      .setColor(0xFFB794FF.toInt())
      .setOngoing(true)
      .setOnlyAlertOnce(true)
      .setShowWhen(true).setWhen(start).setUsesChronometer(true)
      .setCategory(Notification.CATEGORY_STATUS)
      .setContentIntent(openApp(c))
      .addAction(Notification.Action.Builder(Icon.createWithResource(c, R.drawable.ic_awake_tile), "I'm awake", awake).build())
      .build()
    nm(c).notify(ID_NOW, n)
  }

  private fun dur(ms: Long): String { val m = Math.round(ms / 60000.0); return (m / 60).toString() + "h " + (m % 60).toString().padStart(2, '0') + "m" }

  private fun postResult(c: Context, s: Long, e: Long) {
    if (!canPost(c)) return
    channels(c)
    val ms = e - s
    val h = Calendar.getInstance().apply { timeInMillis = e }.get(Calendar.HOUR_OF_DAY)
    var title = when { h in 5..11 -> "Good morning"; h in 12..16 -> "Good afternoon"; h >= 17 -> "Good evening"; else -> "Hello" }
    var msg: String
    if (ms < 10 * 60000L) msg = "That was under 10 minutes, so it was not saved."
    else if (ms > 16 * 3600000L) msg = "That was over 16 hours, so it was not saved. You can type your sleep by hand."
    else {
      val hrs = Math.round(ms / 360000.0) / 10.0
      msg = "You slept " + dur(ms) + "."
      if (hrs < 6) { title = "Short sleep"; msg += " Less than 6 hours is not enough. Try to get more rest next time." }
      else if (hrs > 9) { title = "Long sleep"; msg += " More than 9 hours is a lot. Try to keep your sleep steady." }
    }
    val n = Notification.Builder(c, CH_DONE)
      .setSmallIcon(R.drawable.ic_awake_tile)
      .setContentTitle(title)
      .setContentText(msg)
      .setStyle(Notification.BigTextStyle().bigText(msg))
      .setColor(0xFFB794FF.toInt())
      .setAutoCancel(true)
      .setContentIntent(openApp(c))
      .build()
    nm(c).notify(ID_DONE, n)
  }
}

class SleepActionReceiver : BroadcastReceiver() {
  override fun onReceive(context: Context, intent: Intent?) {
    if (intent?.action == SleepNative.ACT_AWAKE) { try { SleepNative.end(context) } catch (e: Throwable) {} }
  }
}
