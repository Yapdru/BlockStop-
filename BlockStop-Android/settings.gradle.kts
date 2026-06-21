pluginManagement {
    repositories {
        google()
        mavenCentral()
        gradlePluginPortal()
    }
}

dependencyResolutionManagement {
    repositoriesMode.set(RepositoriesMode.FAIL_ON_PROJECT_REPOS)
    repositories {
        google()
        mavenCentral()
        maven { url = java.net.URI("https://jitpack.io") }
    }
}

rootProject.name = "blockstop-android"

include(":app")
include(":data")
include(":domain")
include(":presentation")

// Feature modules
include(":feature:auth")
include(":feature:email")
include(":feature:files")
include(":feature:threats")
include(":feature:settings")
include(":feature:dashboard")

// Core modules
include(":core:common")
include(":core:network")
include(":core:database")
include(":core:security")
