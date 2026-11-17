# MediaPipe LLM Inference uses generated protocol buffer classes and native code that reads them by name.
-dontwarn com.google.protobuf.**
-dontwarn com.google.mediapipe.**
-keep class com.google.mediapipe.** { *; }
-keep class com.google.protobuf.** { *; }
