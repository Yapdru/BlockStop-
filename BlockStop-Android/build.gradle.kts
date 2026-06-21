// BlockStop Android - Root Build Configuration
// Gradle 8.0+

import org.gradle.api.artifacts.VersionCatalog

plugins {
    id("com.android.application") version "8.1.0" apply false
    id("com.android.library") version "8.1.0" apply false
    id("org.jetbrains.kotlin.android") version "1.9.0" apply false
    id("org.jetbrains.kotlin.plugin.serialization") version "1.9.0" apply false
    id("com.google.dagger.hilt.android") version "2.46" apply false
    id("com.google.gms.google-services") version "4.3.15" apply false
    id("com.google.firebase.crashlytics") version "2.9.7" apply false
    id("com.diffplug.spotless") version "6.20.0" apply false
}

buildscript {
    repositories {
        google()
        mavenCentral()
    }
    dependencies {
        classpath("com.google.gms:google-services:4.3.15")
        classpath("com.google.firebase:firebase-crashlytics-gradle:2.9.7")
    }
}

subprojects {
    apply(plugin = "com.diffplug.spotless")

    spotless {
        kotlin {
            target("**/*.kt")
            ktlint().setEditorConfigPath(rootDir)
        }
    }
}

// Version catalog for dependency management
val javaVersion = JavaVersion.VERSION_11
val compileSdkVersion = 34
val minSdkVersion = 28
val targetSdkVersion = 34

ext {
    set("java_version", javaVersion)
    set("compile_sdk_version", compileSdkVersion)
    set("min_sdk_version", minSdkVersion)
    set("target_sdk_version", targetSdkVersion)
}

// Dependency versions
ext {
    // Kotlin
    set("kotlin_version", "1.9.0")

    // Android
    set("androidx_core_version", "1.12.0")
    set("androidx_appcompat_version", "1.6.1")
    set("androidx_compose_version", "1.6.0")
    set("androidx_lifecycle_version", "2.6.2")
    set("androidx_room_version", "2.6.0")
    set("androidx_datastore_version", "1.0.0")
    set("androidx_hilt_version", "1.1.0")
    set("androidx_security_version", "1.1.0-alpha06")
    set("androidx_work_version", "2.8.1")

    // Networking
    set("retrofit_version", "2.9.0")
    set("okhttp_version", "4.11.0")
    set("kotlinx_serialization_version", "1.6.0")

    // Dependency Injection
    set("hilt_version", "2.46")
    set("dagger_version", "2.46")

    // Firebase
    set("firebase_bom_version", "32.4.0")

    // Testing
    set("junit_version", "4.13.2")
    set("junit_ext_version", "1.1.5")
    set("espresso_version", "3.5.1")
    set("mockk_version", "1.13.7")
    set("coroutines_test_version", "1.7.3")
    set("compose_ui_test_version", "1.6.0")

    // Utilities
    set("timber_version", "5.0.1")
    set("json_version", "20231013")
}

// Common repositories
allprojects {
    repositories {
        google()
        mavenCentral()
        maven { url = uri("https://jitpack.io") }
    }
}

// Common configuration
subprojects {
    tasks.withType<JavaCompile>().configureEach {
        sourceCompatibility = javaVersion
        targetCompatibility = javaVersion
    }
}

// Task to clean all
task("clean") {
    delete(rootProject.buildDir)
}
