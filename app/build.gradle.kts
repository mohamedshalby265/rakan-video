plugins {
    id("com.android.application")
    id("org.jetbrains.kotlin.android")
}

val runNo = (System.getenv("RUN_NUMBER") ?: "1").toInt()

android {
    namespace = "com.rakan.app"
    compileSdk = 34

    defaultConfig {
        applicationId = "com.exercise.exercise_app"
        minSdk = 24
        targetSdk = 34
        versionCode = runNo
        versionName = "v$runNo"
    }

    signingConfigs {
        create("rakan") {
            storeFile = file("rakan.jks")
            storeType = "pkcs12"
            storePassword = "android"
            keyAlias = "androiddebugkey"
            keyPassword = "android"
        }
    }

    buildTypes {
        release {
            isMinifyEnabled = false
            signingConfig = signingConfigs.getByName("rakan")
        }
    }

    compileOptions {
        sourceCompatibility = JavaVersion.VERSION_17
        targetCompatibility = JavaVersion.VERSION_17
    }
    kotlinOptions {
        jvmTarget = "17"
    }
    lint {
        abortOnError = false
        checkReleaseBuilds = false
    }
}

dependencies {
    implementation("androidx.core:core-ktx:1.13.1")
    implementation("androidx.activity:activity-ktx:1.9.3")
}
