# BlockStop Android - Implementation Guide

## Quick Start

### 1. Environment Setup

```bash
# Clone the repository
cd /home/user/BlockStop-

# Navigate to Android project
cd BlockStop-Android

# Create local.properties with Android SDK path
echo "sdk.dir=/path/to/android-sdk" > local.properties

# Create gradle.properties with OAuth credentials (optional for dev)
cat >> gradle.properties <<EOF
oauth.client.id=YOUR_CLIENT_ID
oauth.client.secret=YOUR_CLIENT_SECRET
EOF
```

### 2. Build and Test

```bash
# Build the development variant
./gradlew buildDevDebug

# Run unit tests
./gradlew test

# Run instrumented tests (requires emulator/device)
./gradlew connectedAndroidTest

# Build and install on device
./gradlew installDevDebug
```

### 3. Open in Android Studio

1. Open Android Studio
2. File > Open > Select `/home/user/BlockStop-/BlockStop-Android`
3. Wait for Gradle sync to complete
4. Run app with Shift+F10 (or Play button)

## Project Structure Setup

### Core Module: Authentication

**File:** `feature/auth/src/main/kotlin/com/blockstop/feature/auth/presentation/screen/LoginScreen.kt`

```kotlin
package com.blockstop.feature.auth.presentation.screen

import androidx.compose.foundation.layout.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.hilt.navigation.compose.hiltViewModel
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Email
import androidx.compose.material.icons.filled.Lock
import com.blockstop.feature.auth.presentation.viewmodel.AuthViewModel

@Composable
fun LoginScreen(
    viewModel: AuthViewModel = hiltViewModel(),
    onLoginSuccess: () -> Unit
) {
    var email by remember { mutableStateOf("") }
    var password by remember { mutableStateOf("") }
    
    val authState by viewModel.authState.collectAsState()
    
    LaunchedEffect(authState) {
        if (authState is AuthState.Success) {
            onLoginSuccess()
        }
    }
    
    Column(
        modifier = Modifier
            .fillMaxSize()
            .padding(16.dp),
        verticalArrangement = Arrangement.Center,
        horizontalAlignment = Alignment.CenterHorizontally
    ) {
        Text("BlockStop Login", style = MaterialTheme.typography.headlineLarge)
        
        Spacer(modifier = Modifier.height(24.dp))
        
        OutlinedTextField(
            value = email,
            onValueChange = { email = it },
            label = { Text("Email") },
            leadingIcon = { Icon(Icons.Default.Email, null) },
            modifier = Modifier.fillMaxWidth()
        )
        
        Spacer(modifier = Modifier.height(12.dp))
        
        OutlinedTextField(
            value = password,
            onValueChange = { password = it },
            label = { Text("Password") },
            leadingIcon = { Icon(Icons.Default.Lock, null) },
            modifier = Modifier.fillMaxWidth()
        )
        
        Spacer(modifier = Modifier.height(24.dp))
        
        Button(
            onClick = { viewModel.login(email, password) },
            modifier = Modifier
                .fillMaxWidth()
                .height(48.dp),
            enabled = authState !is AuthState.Loading
        ) {
            if (authState is AuthState.Loading) {
                CircularProgressIndicator(modifier = Modifier.size(24.dp))
            } else {
                Text("Login")
            }
        }
        
        if (authState is AuthState.Error) {
            Text(
                (authState as AuthState.Error).message,
                color = MaterialTheme.colorScheme.error,
                modifier = Modifier.padding(top = 16.dp)
            )
        }
    }
}

sealed class AuthState {
    object Idle : AuthState()
    object Loading : AuthState()
    object Success : AuthState()
    data class Error(val message: String) : AuthState()
}
```

### Core Module: Email Scanning

**File:** `feature/email/src/main/kotlin/com/blockstop/feature/email/presentation/screen/EmailScanScreen.kt`

```kotlin
package com.blockstop.feature.email.presentation.screen

import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Mail
import androidx.compose.material.icons.filled.Refresh
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.hilt.navigation.compose.hiltViewModel
import com.blockstop.feature.email.presentation.viewmodel.EmailScanViewModel
import com.blockstop.feature.email.domain.model.Email

@Composable
fun EmailScanScreen(
    viewModel: EmailScanViewModel = hiltViewModel(),
    onEmailSelected: (String) -> Unit
) {
    val emails by viewModel.emails.collectAsState()
    val isLoading by viewModel.isLoading.collectAsState()
    
    Scaffold(
        topBar = {
            TopAppBar(
                title = { Text("Email Scan") },
                actions = {
                    IconButton(onClick = { viewModel.refreshEmails() }) {
                        Icon(Icons.Default.Refresh, contentDescription = "Refresh")
                    }
                }
            )
        },
        floatingActionButton = {
            FloatingActionButton(onClick = { viewModel.scanNewEmail() }) {
                Icon(Icons.Default.Mail, contentDescription = "Scan Email")
            }
        }
    ) { paddingValues ->
        when {
            isLoading -> {
                Box(Modifier.fillMaxSize(), contentAlignment = Alignment.Center) {
                    CircularProgressIndicator()
                }
            }
            emails.isEmpty() -> {
                Box(Modifier.fillMaxSize(), contentAlignment = Alignment.Center) {
                    Text("No emails to scan")
                }
            }
            else -> {
                LazyColumn(contentPadding = paddingValues) {
                    items(emails) { email ->
                        EmailCard(email = email) {
                            onEmailSelected(email.id)
                        }
                    }
                }
            }
        }
    }
}

@Composable
fun EmailCard(email: Email, onClick: () -> Unit) {
    Card(
        modifier = Modifier
            .fillMaxWidth()
            .padding(8.dp),
        onClick = onClick
    ) {
        Column(modifier = Modifier.padding(16.dp)) {
            Text(email.subject, style = MaterialTheme.typography.titleMedium)
            Text(email.from, style = MaterialTheme.typography.bodySmall)
            Spacer(modifier = Modifier.height(4.dp))
            
            val threatLevel = email.threatLevel
            Text(
                "Threat Level: $threatLevel",
                color = when (threatLevel) {
                    "HIGH" -> MaterialTheme.colorScheme.error
                    "MEDIUM" -> MaterialTheme.colorScheme.errorContainer
                    else -> MaterialTheme.colorScheme.secondary
                }
            )
        }
    }
}
```

### Core Module: File Scanning

**File:** `feature/files/src/main/kotlin/com/blockstop/feature/files/presentation/screen/FileScanScreen.kt`

```kotlin
package com.blockstop.feature.files.presentation.screen

import androidx.compose.foundation.layout.*
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Upload
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.hilt.navigation.compose.hiltViewModel
import com.blockstop.feature.files.presentation.viewmodel.FileScanViewModel
import com.blockstop.feature.files.domain.model.FileInfo

@Composable
fun FileScanScreen(
    viewModel: FileScanViewModel = hiltViewModel()
) {
    val scanResults by viewModel.scanResults.collectAsState()
    val uploadProgress by viewModel.uploadProgress.collectAsState()
    
    Scaffold(
        topBar = {
            TopAppBar(title = { Text("File Scan") })
        },
        floatingActionButton = {
            FloatingActionButton(onClick = { viewModel.pickFile() }) {
                Icon(Icons.Default.Upload, contentDescription = "Pick File")
            }
        }
    ) { paddingValues ->
        Column(
            modifier = Modifier
                .fillMaxSize()
                .padding(paddingValues)
                .padding(16.dp)
        ) {
            if (uploadProgress > 0) {
                LinearProgressIndicator(
                    progress = uploadProgress / 100f,
                    modifier = Modifier.fillMaxWidth()
                )
                Text("Uploading: ${uploadProgress}%")
            }
            
            LazyColumn {
                items(scanResults.size) { index ->
                    FileScanResultItem(scanResults[index])
                }
            }
        }
    }
}

@Composable
fun FileScanResultItem(fileInfo: FileInfo) {
    Card(modifier = Modifier.fillMaxWidth().padding(vertical = 8.dp)) {
        Column(modifier = Modifier.padding(16.dp)) {
            Text(fileInfo.name, style = MaterialTheme.typography.titleMedium)
            Text(
                "Size: ${fileInfo.sizeInMB} MB",
                style = MaterialTheme.typography.bodySmall
            )
            Text(
                "Status: ${fileInfo.scanStatus}",
                color = when (fileInfo.threatDetected) {
                    true -> MaterialTheme.colorScheme.error
                    false -> MaterialTheme.colorScheme.primary
                }
            )
        }
    }
}
```

### Core Module: Threat Analysis

**File:** `feature/threats/src/main/kotlin/com/blockstop/feature/threats/presentation/screen/ThreatDetailScreen.kt`

```kotlin
package com.blockstop.feature.threats.presentation.screen

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.ArrowBack
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.hilt.navigation.compose.hiltViewModel
import com.blockstop.feature.threats.presentation.viewmodel.ThreatDetailViewModel
import com.blockstop.feature.threats.domain.model.ThreatDetail

@Composable
fun ThreatDetailScreen(
    threatId: String,
    viewModel: ThreatDetailViewModel = hiltViewModel(),
    onBackClick: () -> Unit
) {
    LaunchedEffect(threatId) {
        viewModel.loadThreatDetail(threatId)
    }
    
    val threatDetail by viewModel.threatDetail.collectAsState()
    
    Scaffold(
        topBar = {
            TopAppBar(
                title = { Text("Threat Details") },
                navigationIcon = {
                    IconButton(onClick = onBackClick) {
                        Icon(Icons.Default.ArrowBack, contentDescription = "Back")
                    }
                }
            )
        }
    ) { paddingValues ->
        when (val detail = threatDetail) {
            null -> {
                Box(
                    Modifier
                        .fillMaxSize()
                        .padding(paddingValues),
                    contentAlignment = Alignment.Center
                ) {
                    CircularProgressIndicator()
                }
            }
            else -> {
                Column(
                    modifier = Modifier
                        .fillMaxSize()
                        .padding(paddingValues)
                        .verticalScroll(rememberScrollState())
                        .padding(16.dp)
                ) {
                    // Threat severity badge
                    val backgroundColor = when (detail.severity) {
                        "CRITICAL" -> Color(0xFFD32F2F)
                        "HIGH" -> Color(0xFFF57C00)
                        "MEDIUM" -> Color(0xFFFBC02D)
                        else -> Color(0xFF388E3C)
                    }
                    
                    Surface(
                        modifier = Modifier
                            .fillMaxWidth()
                            .background(backgroundColor)
                            .padding(16.dp)
                    ) {
                        Column {
                            Text(
                                detail.name,
                                style = MaterialTheme.typography.headlineSmall,
                                color = Color.White
                            )
                            Text(
                                "Severity: ${detail.severity}",
                                style = MaterialTheme.typography.bodyMedium,
                                color = Color.White
                            )
                        }
                    }
                    
                    Spacer(modifier = Modifier.height(16.dp))
                    
                    Text("Description", style = MaterialTheme.typography.titleMedium)
                    Text(detail.description, style = MaterialTheme.typography.bodyMedium)
                    
                    Spacer(modifier = Modifier.height(16.dp))
                    
                    Text("Recommendations", style = MaterialTheme.typography.titleMedium)
                    detail.recommendations.forEach { recommendation ->
                        Text("• $recommendation", style = MaterialTheme.typography.bodyMedium)
                    }
                    
                    Spacer(modifier = Modifier.height(16.dp))
                    
                    Button(
                        onClick = { viewModel.dismissThreat(threatId) },
                        modifier = Modifier.fillMaxWidth()
                    ) {
                        Text("Mark as Reviewed")
                    }
                }
            }
        }
    }
}
```

## Database Setup

**File:** `core/database/src/main/kotlin/com/blockstop/core/database/BlockStopDatabase.kt`

```kotlin
package com.blockstop.core.database

import android.content.Context
import androidx.room.Database
import androidx.room.Room
import androidx.room.RoomDatabase
import androidx.room.TypeConverters
import androidx.room.migration.Migration
import androidx.sqlite.db.SupportSQLiteDatabase
import com.blockstop.core.database.dao.*
import com.blockstop.core.database.entity.*

@Database(
    entities = [
        ThreatEntity::class,
        EmailEntity::class,
        FileEntity::class,
        ScanResultEntity::class
    ],
    version = 1,
    exportSchema = true
)
@TypeConverters(Converters::class)
abstract class BlockStopDatabase : RoomDatabase() {
    abstract fun threatDao(): ThreatDao
    abstract fun emailDao(): EmailDao
    abstract fun fileDao(): FileDao
    abstract fun scanResultDao(): ScanResultDao
    
    companion object {
        @Volatile
        private var instance: BlockStopDatabase? = null
        
        fun getInstance(context: Context): BlockStopDatabase =
            instance ?: synchronized(this) {
                instance ?: buildDatabase(context).also { instance = it }
            }
        
        private fun buildDatabase(context: Context): BlockStopDatabase =
            Room.databaseBuilder(
                context.applicationContext,
                BlockStopDatabase::class.java,
                "blockstop.db"
            )
            .addMigrations()
            .build()
    }
}

class Converters {
    @TypeConverter
    fun fromListToString(list: List<String>?): String? = list?.joinToString(",")
    
    @TypeConverter
    fun fromStringToList(data: String?): List<String>? = 
        data?.split(",")?.filter { it.isNotBlank() }
    
    @TypeConverter
    fun fromLongToDate(date: Long?): String? = date?.toString()
    
    @TypeConverter
    fun fromDateToLong(date: String?): Long? = date?.toLongOrNull()
}
```

## API Integration Setup

**File:** `core/network/src/main/kotlin/com/blockstop/core/network/api/ThreatApiService.kt`

```kotlin
package com.blockstop.core.network.api

import com.blockstop.core.network.model.*
import retrofit2.http.*

interface ThreatApiService {
    @GET("threats")
    suspend fun getThreats(
        @Query("page") page: Int = 1,
        @Query("limit") limit: Int = 20
    ): List<ThreatApiModel>
    
    @GET("threats/{id}")
    suspend fun getThreatDetail(@Path("id") threatId: String): ThreatDetailApiModel
    
    @DELETE("threats/{id}")
    suspend fun deleteThreat(@Path("id") threatId: String)
    
    @POST("threats/{id}/mark-reviewed")
    suspend fun markThreatReviewed(@Path("id") threatId: String): ApiResponse
}

interface EmailScanApiService {
    @POST("scan/email")
    suspend fun scanEmail(@Body request: EmailScanRequest): ScanResultApiModel
    
    @GET("email-scan-history")
    suspend fun getEmailScanHistory(
        @Query("limit") limit: Int = 50
    ): List<EmailApiModel>
}

interface FileScanApiService {
    @Multipart
    @POST("scan/file")
    suspend fun scanFile(
        @Part file: MultipartBody.Part,
        @Part("filename") filename: RequestBody
    ): ScanResultApiModel
    
    @GET("file-scan-history")
    suspend fun getFileScanHistory(
        @Query("limit") limit: Int = 50
    ): List<FileApiModel>
}

interface AuthApiService {
    @POST("auth/login")
    suspend fun login(@Body request: LoginRequest): AuthResponse
    
    @POST("auth/logout")
    suspend fun logout(): ApiResponse
    
    @POST("auth/refresh")
    suspend fun refreshToken(@Body request: RefreshTokenRequest): AuthResponse
}
```

## Authentication Flow Implementation

**File:** `feature/auth/src/main/kotlin/com/blockstop/feature/auth/data/repository/AuthRepositoryImpl.kt`

```kotlin
package com.blockstop.feature.auth.data.repository

import android.content.Context
import android.content.Intent
import android.net.Uri
import androidx.browser.customtabs.CustomTabsIntent
import com.blockstop.core.security.TokenManager
import com.blockstop.feature.auth.domain.model.User
import com.blockstop.feature.auth.domain.repository.AuthRepository
import javax.inject.Inject

class AuthRepositoryImpl @Inject constructor(
    private val context: Context,
    private val tokenManager: TokenManager,
    private val authApi: AuthApiService
) : AuthRepository {
    
    override suspend fun login(email: String, password: String): User {
        val response = authApi.login(LoginRequest(email, password))
        tokenManager.saveAccessToken(response.accessToken)
        tokenManager.saveRefreshToken(response.refreshToken)
        return response.user
    }
    
    override suspend fun logout() {
        authApi.logout()
        tokenManager.clearTokens()
    }
    
    override fun startOAuthFlow(onCallback: (code: String) -> Unit) {
        val builder = CustomTabsIntent.Builder()
        val customTabsIntent = builder.build()
        
        val oauthUrl = Uri.Builder()
            .scheme("https")
            .authority("auth.blockstop.io")
            .appendPath("oauth")
            .appendPath("authorize")
            .appendQueryParameter("client_id", BuildConfig.OAUTH_CLIENT_ID)
            .appendQueryParameter("redirect_uri", "https://auth.blockstop.io/oauth/callback")
            .appendQueryParameter("response_type", "code")
            .appendQueryParameter("scope", "read write")
            .build()
        
        customTabsIntent.launchUrl(context, oauthUrl)
    }
}
```

## Building and Deployment

### Debug Build
```bash
./gradlew assembleDevDebug
# Output: app/build/outputs/apk/devDebug/app-devDebug.apk
```

### Release Build (with signing)
```bash
./gradlew assembleRelease
# Output: app/build/outputs/apk/release/app-release.apk
```

### Android App Bundle (for Play Store)
```bash
./gradlew bundleRelease
# Output: app/build/outputs/bundle/release/app-release.aab
```

## Testing

### Unit Tests
```bash
./gradlew test
```

### Integration Tests
```bash
./gradlew connectedAndroidTest
```

### Test Coverage Report
```bash
./gradlew jacocoTestReport
# Report: app/build/reports/jacoco/index.html
```

## Offline Mode Implementation

The app automatically caches data locally and works offline:

1. **Automatic Sync** - When device reconnects, syncs pending changes
2. **Conflict Resolution** - Server data takes precedence
3. **Queue Management** - Failed requests queued for retry
4. **User Notification** - UI indicates offline status

**Implementation:**
```kotlin
class SyncWorker : CoroutineWorker() {
    override suspend fun doWork(): Result = try {
        withContext(Dispatchers.IO) {
            // Sync pending items
            repository.syncPendingThreats()
            Result.success()
        }
    } catch (e: Exception) {
        Result.retry()
    }
}
```

## Tier-Based Feature Gating

```kotlin
class FeatureGateManager @Inject constructor(
    private val userRepository: UserRepository
) {
    suspend fun canScanEmail(): Boolean {
        val tier = userRepository.getUserTier()
        return tier in listOf(UserTier.PRO, UserTier.NEO, UserTier.MAX)
    }
    
    suspend fun getRemainingEmailScans(): Int {
        val tier = userRepository.getUserTier()
        val dailyUsage = userRepository.getDailyEmailScanCount()
        return when (tier) {
            UserTier.PRO -> maxOf(0, 5 - dailyUsage)
            UserTier.NEO -> maxOf(0, 50 - dailyUsage)
            UserTier.MAX -> Int.MAX_VALUE
            UserTier.FREE -> 0
        }
    }
}
```

---

**Last Updated:** June 21, 2026
