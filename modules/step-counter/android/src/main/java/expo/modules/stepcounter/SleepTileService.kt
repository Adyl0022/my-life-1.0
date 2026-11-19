package expo.modules.stepcounter

import android.content.ComponentName
import android.content.Context
import android.graphics.drawable.Icon
import android.os.Build
import android.service.quicksettings.Tile
import android.service.quicksettings.TileService
import java.text.SimpleDateFormat
import java.util.Date
import java.util.Locale

// Quick Settings tile: "Going to sleep" / "I'm awake". Tapping it starts or stops the sleep timer right here (see SleepNative),
// without opening the app. The app saves the hours the next time it is opened.
class SleepTileService : TileService() {
  override fun onStartListening() { refresh() }

  override fun onClick() {
    val go = {
      try { if (SleepTile.start(this) > 0L) SleepNative.end(this) else SleepNative.start(this) } catch (e: Throwable) {}
      refresh()
    }
    if (isLocked) unlockAndRun(Runnable { go() }) else go()
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
    // Moon while you are awake, sun while you are sleeping (tap = I'm awake).
    t.icon = Icon.createWithResource(this, if (start > 0L) R.drawable.ic_awake_tile else R.drawable.ic_sleep_tile)
    t.updateTile()
  }
}

object SleepTile {
  private const val P = "mylife_sleep_tile"
  fun start(c: Context): Long = c.getSharedPreferences(P, Context.MODE_PRIVATE).getLong("start", 0L)
  fun set(c: Context, start: Long) {
    c.getSharedPreferences(P, Context.MODE_PRIVATE).edit().putLong("start", start).commit()
    try { TileService.requestListeningState(c, ComponentName(c, SleepTileService::class.java)) } catch (e: Throwable) {}
  }
}
