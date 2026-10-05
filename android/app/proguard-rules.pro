# ==============================================================================
# ONEAG Production ProGuard / R8 Hardening Rules
# ==============================================================================

# Keep Core Data Models and Serialization
-keepclassmembers class * implements java.io.Serializable {
    static final long serialVersionUID;
    private static final java.io.ObjectStreamField[] serialPersistentFields;
    !static !transient <fields>;
    !private <fields>;
    !private <methods>;
    private void writeObject(java.io.ObjectOutputStream);
    private void readObject(java.io.ObjectInputStream);
    java.lang.Object writeReplace();
    java.lang.Object readResolve();
}

# Keep ONEAG Data Models for Firebase Firestore deserialization
-keep class com.oneag.app.data.model.** { *; }
-keepclassmembers class com.oneag.app.data.model.** { *; }

# Keep Firebase Auth and Firestore
-keep class com.google.firebase.** { *; }
-dontwarn com.google.firebase.**

# Keep Play Integrity
-keep class com.google.android.play.core.integrity.** { *; }
-dontwarn com.google.android.play.core.integrity.**

# Keep Kotlin Coroutines & Reflection
-keep class kotlinx.coroutines.** { *; }
-dontwarn kotlinx.coroutines.**

# Compose Rules
-keep class androidx.compose.runtime.** { *; }
-dontwarn androidx.compose.**

# Security: Strip debug logging in release builds
-assumenosideeffects class android.util.Log {
    public static boolean isLoggable(java.lang.String, int);
    public static int v(...);
    public static int d(...);
}

# Preserve Line Numbers and Source File for crash reporting without exposing internals
-renamesourcefileattribute SourceFile
-keepattributes SourceFile,LineNumberTable
