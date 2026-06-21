# BlockStop Android ProGuard/R8 Rules
# Keep main application class and entry points

# Keep Application class
-keep class com.blockstop.android.BlockStopApp { *; }

# Keep Activity classes
-keep class com.blockstop.android.MainActivity { *; }
-keep class com.blockstop.android.ui.screens.** { *; }

# Keep Services
-keep class com.blockstop.android.service.** { *; }
-keep class com.blockstop.android.receiver.** { *; }

# Keep ViewModels
-keep class com.blockstop.android.viewmodel.** { *; }
-keep class androidx.lifecycle.ViewModel { *; }

# Keep Data classes and Models
-keep class com.blockstop.android.model.** { *; }
-keep class com.blockstop.android.data.model.** { *; }
-keep class com.blockstop.android.domain.model.** { *; }

# Keep Repository interfaces and implementations
-keep interface com.blockstop.android.data.repository.** { *; }
-keep class com.blockstop.android.data.repository.** { *; }

# Keep Network/API classes
-keep class com.blockstop.android.data.remote.** { *; }
-keep interface com.blockstop.android.data.remote.api.** { *; }

# Keep Database/Room classes
-keep class com.blockstop.android.data.local.db.** { *; }
-keep class * extends androidx.room.RoomDatabase { *; }
-keep @androidx.room.Entity class * { *; }
-keep @androidx.room.Dao class * { *; }

# Retrofit
-keep class retrofit2.** { *; }
-keep interface retrofit2.** { *; }
-keepattributes Signature
-keepattributes *Annotation*

# OkHttp
-keep class okhttp3.** { *; }
-keep interface okhttp3.** { *; }
-dontwarn okhttp3.**
-dontwarn javax.annotation.**

# Kotlinx Serialization
-keep class kotlinx.serialization.** { *; }
-keepattributes *Annotation*
-keepattributes Signature
-keep class kotlin.Metadata { *; }

# Hilt/Dagger
-keep class dagger.** { *; }
-keep class javax.inject.** { *; }
-keep class * extends dagger.hilt.internal.GeneratedComponent
-keep class **_Factory { *; }
-keep class **_Provide { *; }
-keep class **_MembersInjector { *; }
-keep class hilt_aggregated_deps.** { *; }
-keepattributes *Annotation*

# Jetpack Compose
-keep class androidx.compose.** { *; }
-keep interface androidx.compose.** { *; }
-keep class androidx.compose.material3.** { *; }

# Firebase
-keep class com.google.firebase.** { *; }
-keep interface com.google.firebase.** { *; }
-keepattributes Exceptions

# Enum classes
-keepclassmembers enum * {
    public static **[] values();
    public static ** valueOf(java.lang.String);
}

# Parcelable
-keep class * implements android.os.Parcelable {
    public static final android.os.Parcelable$Creator *;
}

# Serializable
-keepclassmembers class * implements java.io.Serializable {
    static final long serialVersionUID;
    private static final java.io.ObjectStreamField[] serialPersistentFields;
    private void writeObject(java.io.ObjectOutputStream);
    private void readObject(java.io.ObjectInputStream);
    java.lang.Object writeReplace();
    java.lang.Object readResolve();
}

# Keep BuildConfig
-keep class com.blockstop.android.BuildConfig { *; }

# Keep R classes
-keepclassmembers class **.R$* {
    public static <fields>;
}

# Keep native methods
-keepclasseswithmembernames class * {
    native <methods>;
}

# Kotlin
-keep class kotlin.** { *; }
-keep interface kotlin.** { *; }
-dontwarn kotlin.**
-keepclassmembers class kotlin.Metadata {
    public <methods>;
}

# Androidx
-keep class androidx.** { *; }
-keep interface androidx.** { *; }

# Keep annotations
-keepattributes AnnotationDefault
-keepattributes InnerClasses
-keepattributes SourceFile,LineNumberTable
-keepattributes EnclosingMethod

# Keep line numbers for crash reporting
-keepattributes SourceFile,LineNumberTable
-renamesourcefileattribute SourceFile

# Optimization
-optimizationpasses 5
-dontusemixedcaseclassnames
-verbose

# Remove logging calls
-assumenosideeffects class android.util.Log {
    public static *** d(...);
    public static *** v(...);
    public static *** i(...);
}

# Keep test classes for testing
-dontwarn junit.**
-dontwarn org.junit.**
-dontwarn org.mockito.**

# Don't warn about missing classes from external libraries
-dontwarn com.google.**
-dontwarn org.apache.**
-dontwarn java.lang.invoke.**
-dontwarn sun.misc.Unsafe
-dontwarn sun.reflect.**
-dontwarn com.sun.**
