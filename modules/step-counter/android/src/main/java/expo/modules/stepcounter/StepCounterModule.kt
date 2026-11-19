package expo.modules.stepcounter

import android.content.Context
import android.hardware.Sensor
import android.hardware.SensorEvent
import android.hardware.SensorEventListener
import android.hardware.SensorManager
import android.os.Handler
import android.os.Looper
import expo.modules.kotlin.Promise
import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition

// Reads the phone's own step counter: the total steps since the phone was last switched on.
// The phone keeps counting this even while the app is closed.
// Gives the total, or a negative code: -1 no step sensor, -2 sensor could not be started (permission), -3 no reading in 4 seconds, -4 error.
class StepCounterModule : Module() {
  override fun definition() = ModuleDefinition {
    Name("StepCounter")

    // Tells the Quick Settings tile when sleep started (0 = not sleeping).
    Function("setSleepTile") { start: Double ->
      try { appContext.reactContext?.let { SleepTile.set(it, start.toLong()) } } catch (e: Throwable) {}
    }

    // The sleep timer, run by Android itself (see SleepNative). sleepState gives "start;s:e,s:e": when the current sleep began (0 = not sleeping) and finished sleeps not yet saved.
    Function("sleepStart") { try { appContext.reactContext?.let { SleepNative.start(it) } } catch (e: Throwable) {} }
    Function("sleepEnd") { try { appContext.reactContext?.let { SleepNative.end(it) } } catch (e: Throwable) {} }
    Function("sleepState") {
      val c = appContext.reactContext
      if (c == null) "0;" else SleepTile.start(c).toString() + ";" + SleepNative.pending(c)
    }
    Function("sleepClearPending") { try { appContext.reactContext?.let { SleepNative.clearPending(it) } } catch (e: Throwable) {} }

    // Android 13+: shows the system "Add tile?" prompt. Gives 2 added, 1 already there, 0 not added, -1 not available.
    AsyncFunction("addSleepTile") { promise: Promise ->
      try {
        val ctx = appContext.reactContext
        if (ctx == null || android.os.Build.VERSION.SDK_INT < 33) {
          promise.resolve(-1)
        } else {
          val sbm = ctx.getSystemService(android.app.StatusBarManager::class.java)
          sbm.requestAddTileService(
            android.content.ComponentName(ctx, SleepTileService::class.java),
            "Going to sleep",
            android.graphics.drawable.Icon.createWithResource(ctx, R.drawable.ic_sleep_tile),
            ctx.mainExecutor
          ) { result -> promise.resolve(result) }
        }
      } catch (e: Throwable) {
        promise.resolve(-1)
      }
    }

    AsyncFunction("getTotal") { promise: Promise ->
      try {
        val ctx = appContext.reactContext
        val sm = ctx?.getSystemService(Context.SENSOR_SERVICE) as? SensorManager
        val sensor = sm?.getDefaultSensor(Sensor.TYPE_STEP_COUNTER)
        if (sm == null || sensor == null) {
          promise.resolve(-1.0)
        } else {
          val handler = Handler(Looper.getMainLooper())
          var done = false
          val listener = object : SensorEventListener {
            override fun onSensorChanged(event: SensorEvent) {
              if (done) return
              done = true
              sm.unregisterListener(this)
              handler.removeCallbacksAndMessages(null)
              promise.resolve(event.values[0].toDouble())
            }
            override fun onAccuracyChanged(sensor: Sensor?, accuracy: Int) {}
          }
          val ok = sm.registerListener(listener, sensor, SensorManager.SENSOR_DELAY_NORMAL, handler)
          if (!ok) {
            done = true
            promise.resolve(-2.0)
          } else {
            handler.postDelayed({
              if (!done) {
                done = true
                sm.unregisterListener(listener)
                promise.resolve(-3.0)
              }
            }, 4000)
          }
        }
      } catch (e: Throwable) {
        promise.resolve(-4.0)
      }
    }
  }
}
