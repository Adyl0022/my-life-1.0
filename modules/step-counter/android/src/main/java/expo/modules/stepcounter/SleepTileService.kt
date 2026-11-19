package expo.modules.stepcounter

import android.app.PendingIntent
import android.content.ComponentName
import android.content.Context
import android.content.Intent
import android.graphics.drawable.Icon
import android.net.Uri
import android.os.Build
import android.service.quicksettings.Tile
import android.service.quicksettings.TileService
import java.text.SimpleDateFormat
import java.util.Date
import java.util.Locale

// Quick Settings tile: "Going to sleep" / "I'm awake". Tapping opens the app on mylife://sleeptile,
// which starts or ends the sleep timer. The app tells the tile when sleep starts or ends (see SleepTile).
class SleepTileService : TileService() {
  override fun onStartListening() { refresh() }

  override fun onClick() {
    val i = Intent(Intent.ACTION_VIEW, Uri.parse("mylife://sleeptile")).setPackage(packageName).addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
    try {
      if (Build.VERSION.SDK_INT >= 34) {
        startActivityAndCollapse(PendingIntent.getActivity(this, 0, i, PendingIntent.FLAG_IMMUTABLE or PendingIntent.FLAG_UPDATE_CURRENT))
      } else {
        @Suppress("DEPRECATION") startActivityAndCollapse(i)
      }
    } catch (e: Throwable) {}
  }

  private fun refresh() {
    val t = qsTile ?: return
    val start = SleepTile.start(this)
    if (start > 0L) {
      t.state = Tile.STATE_ACTIVE
      t.label = "I'm awake"
      if (Build.VERSION.SDK_INT >= 29) t.subtitle = "Since " + SimpleDateFormat("h:mm a", Locale.US).format(Date(start))
    } else {
      t.state = Tile.STATE_INACTIVE
      t.label = "Going to sleep"
      if (Build.VERSION.SDK_INT >= 29) t.subtitle = "Tap to start"
    }
    t.icon = Icon.createWithResource(this, R.drawable.ic_sleep_tile)
    t.updateTile()
  }
}

object SleepTile {
  private const val P = "mylife_sleep_tile"
  fun start(c: Context): Long = c.getSharedPreferences(P, Context.MODE_PRIVATE).getLong("start", 0L)
  fun set(c: Context, start: Long) {
    c.getSharedPreferences(P, Context.MODE_PRIVATE).edit().putLong("start", start).apply()
    try { TileService.requestListeningState(c, ComponentName(c, SleepTileService::class.java)) } catch (e: Throwable) {}
  }
}
