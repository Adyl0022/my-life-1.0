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
