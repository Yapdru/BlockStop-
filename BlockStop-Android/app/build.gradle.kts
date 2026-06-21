plugins {
    id("com.android.application")
    id("org.jetbrains.kotlin.android")
    id("org.jetbrains.kotlin.plugin.serialization")
    id("com.google.dagger.hilt.android")
    id("com.google.gms.google-services")
    id("com.google.firebase.crashlytics")
    id("kotlin-kapt")
}

android {
    namespace = "com.blockstop.android"
    compileSdk = rootProject.ext.get("compile_sdk_version") as Int

    defaultConfig {
        applicationId = "com.blockstop.android"
        minSdk = rootProject.ext.get("min_sdk_version") as Int
        targetSdk = rootProject.ext.get("target_sdk_version") as Int
        versionCode = 1
        versionName = "1.0.0"

        testInstrumentationRunner = "androidx.test.runner.AndroidJUnitRunner"

        vectorDrawables {
            useSupportLibrary = true
        }

        buildConfigField(
            "String",
            "API_BASE_URL",
            "\"https://api.blockstop.io/v1\""
        )
        buildConfigField(
            "String",
            "OAUTH_CLIENT_ID",
            "\"${project.findProperty("oauth.client.id") ?: "DEFAULT"}\""
        )
        buildConfigField(
            "String",
            "OAUTH_CLIENT_SECRET",
            "\"${project.findProperty("oauth.client.secret") ?: "DEFAULT"}\""
        )
    }

    signingConfigs {
        create("release") {
            storeFile = file(project.findProperty("release.keystore.path") ?: "release.keystore")
            storePassword = project.findProperty("release.keystore.password") as? String
            keyAlias = project.findProperty("release.key.alias") as? String ?: "blockstop"
            keyPassword = project.findProperty("release.key.password") as? String
        }
    }

    buildTypes {
        debug {
            isDebuggable = true
            isMinifyEnabled = false
            proguardFiles(
                getDefaultProguardFile("proguard-android-optimize.txt"),
                "proguard-rules.pro"
            )
            buildConfigField("String", "API_BASE_URL", "\"https://staging-api.blockstop.io/v1\"")
        }

        release {
            isDebuggable = false
            isMinifyEnabled = true
            isShrinkResources = true
            proguardFiles(
                getDefaultProguardFile("proguard-android-optimize.txt"),
                "proguard-rules.pro"
            )
            signingConfig = signingConfigs.getByName("release")
        }
    }

    flavorDimensions += listOf("environment")

    productFlavors {
        create("dev") {
            dimension = "environment"
            applicationIdSuffix = ".dev"
            versionNameSuffix = "-dev"
            buildConfigField(
                "String",
                "API_BASE_URL",
                "\"https://dev-api.blockstop.io/v1\""
            )
        }

        create("staging") {
            dimension = "environment"
            applicationIdSuffix = ".staging"
            versionNameSuffix = "-staging"
            buildConfigField(
                "String",
                "API_BASE_URL",
                "\"https://staging-api.blockstop.io/v1\""
            )
        }

        create("prod") {
            dimension = "environment"
            buildConfigField(
                "String",
                "API_BASE_URL",
                "\"https://api.blockstop.io/v1\""
            )
        }
    }

    compileOptions {
        sourceCompatibility = JavaVersion.VERSION_11
        targetCompatibility = JavaVersion.VERSION_11
    }

    kotlinOptions {
        jvmTarget = "11"
    }

    buildFeatures {
        compose = true
        buildConfig = true
    }

    composeOptions {
        kotlinCompilerExtensionVersion = "1.5.3"
    }

    packagingOptions {
        resources {
            excludes += "/META-INF/{AL2.0,LGPL2.1}"
        }
    }

    testOptions {
        unitTests {
            isIncludeAndroidResources = true
        }
    }

    lint {
        checkReleaseBuilds = true
        abortOnError = false
        disable += listOf(
            "MissingTranslation",
            "ExtraTranslation"
        )
    }
}

dependencies {
    // Core Android
    implementation("androidx.core:androidx-core:${rootProject.ext.get("androidx_core_version")}")
    implementation("androidx.appcompat:appcompat:${rootProject.ext.get("androidx_appcompat_version")}")
    implementation("androidx.lifecycle:lifecycle-runtime-ktx:${rootProject.ext.get("androidx_lifecycle_version")}")
    implementation("androidx.lifecycle:lifecycle-viewmodel-compose:${rootProject.ext.get("androidx_lifecycle_version")}")

    // Jetpack Compose
    implementation("androidx.compose.ui:ui:${rootProject.ext.get("androidx_compose_version")}")
    implementation("androidx.compose.ui:ui-graphics:${rootProject.ext.get("androidx_compose_version")}")
    implementation("androidx.compose.ui:ui-tooling-preview:${rootProject.ext.get("androidx_compose_version")}")
    implementation("androidx.compose.material3:material3:1.1.1")
    implementation("androidx.compose.material:material-icons-extended:${rootProject.ext.get("androidx_compose_version")}")
    implementation("androidx.activity:activity-compose:1.8.0")

    // Data storage
    implementation("androidx.room:room-runtime:${rootProject.ext.get("androidx_room_version")}")
    kapt("androidx.room:room-compiler:${rootProject.ext.get("androidx_room_version")}")
    implementation("androidx.room:room-ktx:${rootProject.ext.get("androidx_room_version")}")

    implementation("androidx.datastore:datastore-preferences:${rootProject.ext.get("androidx_datastore_version")}")
    implementation("androidx.security:security-crypto:${rootProject.ext.get("androidx_security_version")}")

    // Networking
    implementation("com.squareup.retrofit2:retrofit:${rootProject.ext.get("retrofit_version")}")
    implementation("com.squareup.retrofit2:converter-kotlinx-serialization:${rootProject.ext.get("retrofit_version")}")
    implementation("com.squareup.okhttp3:okhttp:${rootProject.ext.get("okhttp_version")}")
    implementation("com.squareup.okhttp3:logging-interceptor:${rootProject.ext.get("okhttp_version")}")
    implementation("org.jetbrains.kotlinx:kotlinx-serialization-json:${rootProject.ext.get("kotlinx_serialization_version")}")

    // Dependency Injection - Hilt
    implementation("com.google.dagger:hilt-android:${rootProject.ext.get("hilt_version")}")
    kapt("com.google.dagger:hilt-compiler:${rootProject.ext.get("hilt_version")}")
    implementation("androidx.hilt:hilt-navigation-compose:${rootProject.ext.get("androidx_hilt_version")}")

    // Firebase
    val firebaseBom = platform("com.google.firebase:firebase-bom:${rootProject.ext.get("firebase_bom_version")}")
    implementation(firebaseBom)
    implementation("com.google.firebase:firebase-messaging-ktx")
    implementation("com.google.firebase:firebase-crashlytics-ktx")
    implementation("com.google.firebase:firebase-analytics-ktx")

    // Logging
    implementation("com.jakewharton.timber:timber:${rootProject.ext.get("timber_version")}")

    // JSON parsing
    implementation("org.json:json:${rootProject.ext.get("json_version")}")

    // Work scheduling
    implementation("androidx.work:work-runtime-ktx:${rootProject.ext.get("androidx_work_version")}")
    implementation("androidx.hilt:hilt-work:${rootProject.ext.get("androidx_hilt_version")}")

    // Navigation
    implementation("androidx.navigation:navigation-compose:2.7.4")

    // Testing
    testImplementation("junit:junit:${rootProject.ext.get("junit_version")}")
    testImplementation("io.mockk:mockk:${rootProject.ext.get("mockk_version")}")
    testImplementation("org.jetbrains.kotlinx:kotlinx-coroutines-test:${rootProject.ext.get("coroutines_test_version")}")

    androidTestImplementation("androidx.test.ext:junit:${rootProject.ext.get("junit_ext_version")}")
    androidTestImplementation("androidx.test.espresso:espresso-core:${rootProject.ext.get("espresso_version")}")
    androidTestImplementation("androidx.compose.ui:ui-test-junit4:${rootProject.ext.get("compose_ui_test_version")}")
    debugImplementation("androidx.compose.ui:ui-tooling:${rootProject.ext.get("androidx_compose_version")}")
    debugImplementation("androidx.compose.ui:ui-test-manifest:${rootProject.ext.get("compose_ui_test_version")}")
}

kapt {
    correctErrorTypes = true
}
