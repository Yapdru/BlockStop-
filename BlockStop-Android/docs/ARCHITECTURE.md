# BlockStop Android Architecture

## Overview

BlockStop Android follows a **clean architecture** with clear separation of concerns:

```
┌─────────────────────────────────────────┐
│         Presentation Layer (UI)         │
│   (Jetpack Compose, ViewModels, State)  │
└──────────────┬──────────────────────────┘
               │
┌──────────────▼──────────────────────────┐
│          Domain Layer (Logic)           │
│   (Use Cases, Repository Interfaces)    │
└──────────────┬──────────────────────────┘
               │
┌──────────────▼──────────────────────────┐
│           Data Layer (Storage)          │
│  (Repositories, API, Database, Cache)   │
└─────────────────────────────────────────┘
```

## Layers Detailed

### 1. Presentation Layer (`presentation/`)

**Responsibility:** Handle UI rendering and user interactions

**Components:**
- **Screens** - Full page UI compositions
- **Components** - Reusable UI building blocks
- **ViewModels** - State holders and business logic
- **Navigation** - Screen routing and navigation
- **Theme** - Material Design 3 theming

**Technologies:**
- Jetpack Compose for UI
- ViewModel for state management
- StateFlow for reactive state
- Navigation Compose for routing

**State Management Pattern:**
```kotlin
// ViewModel manages state
class ThreatViewModel : ViewModel() {
    private val _threats = MutableStateFlow<List<Threat>>(emptyList())
    val threats: StateFlow<List<Threat>> = _threats.asStateFlow()
    
    fun fetchThreats() {
        viewModelScope.launch {
            val result = getThreatUseCase.execute()
            _threats.value = result
        }
    }
}

// UI collects state
@Composable
fun ThreatScreen(viewModel: ThreatViewModel) {
    val threats by viewModel.threats.collectAsState()
    ThreatList(threats = threats)
}
```

### 2. Domain Layer (`domain/`)

**Responsibility:** Contain business logic independent of UI/Framework

**Components:**
- **Use Cases** - Business operations (GetThreatsUseCase, ScanEmailUseCase)
- **Repositories** - Abstraction of data sources
- **Models** - Domain entities (Threat, Email, File)

**Key Principle:** Domain layer is independent of Android Framework

**Use Case Example:**
```kotlin
class GetThreatsUseCase @Inject constructor(
    private val threatRepository: ThreatRepository,
    private val dispatcher: CoroutineDispatcher
) {
    suspend operator fun invoke(): List<Threat> = withContext(dispatcher) {
        threatRepository.getThreats()
    }
}
```

### 3. Data Layer (`data/`)

**Responsibility:** Manage data sources and provide repositories

**Components:**

**a) Remote Data Source (API)**
```
data/remote/
├── api/
│   ├── ThreatApiService.kt      # Retrofit API interface
│   ├── ScanApiService.kt        # Scanning endpoints
│   └── AuthApiService.kt        # Authentication endpoints
├── models/
│   ├── ThreatApiModel.kt        # API DTOs
│   └── ScanResultApiModel.kt
└── interceptor/
    ├── AuthInterceptor.kt       # Adds auth tokens
    └── ErrorInterceptor.kt      # Handles API errors
```

**b) Local Data Source (Database)**
```
data/local/
├── db/
│   ├── BlockStopDatabase.kt     # Room database
│   ├── dao/
│   │   ├── ThreatDao.kt
│   │   ├── EmailDao.kt
│   │   └── ScanResultDao.kt
│   └── entity/
│       ├── ThreatEntity.kt
│       ├── EmailEntity.kt
│       └── FileEntity.kt
└── datastore/
    └── UserPreferences.kt       # DataStore for settings
```

**c) Repository Implementation**
```
data/repository/
├── ThreatRepositoryImpl.kt
├── ScanRepositoryImpl.kt
└── AuthRepositoryImpl.kt
```

**Repository Pattern Example:**
```kotlin
class ThreatRepositoryImpl @Inject constructor(
    private val threatApi: ThreatApiService,
    private val threatDao: ThreatDao,
    private val dispatcher: CoroutineDispatcher
) : ThreatRepository {
    
    override suspend fun getThreats(): List<Threat> = withContext(dispatcher) {
        return try {
            // Fetch from API
            val apiThreats = threatApi.getThreats()
            // Cache in local database
            threatDao.insertAll(apiThreats.map { it.toEntity() })
            // Convert to domain models
            apiThreats.map { it.toDomain() }
        } catch (e: Exception) {
            // Fallback to local cache
            threatDao.getAllThreats().map { it.toDomain() }
        }
    }
}
```

## Core Modules

### 1. Core Network (`core/network/`)

**Responsibility:** HTTP client setup, interceptors, networking utilities

**Contents:**
- Retrofit client initialization
- OkHttp configuration
- Network interceptors (auth, logging, error handling)
- Certificate pinning
- Request/response models

**Network Setup:**
```kotlin
@Provides
fun provideHttpClient(): OkHttpClient = OkHttpClient.Builder()
    .addInterceptor(AuthInterceptor(tokenManager))
    .addInterceptor(HttpLoggingInterceptor())
    .addNetworkInterceptor(certificatePinner())
    .connectTimeout(30, TimeUnit.SECONDS)
    .readTimeout(30, TimeUnit.SECONDS)
    .build()

@Provides
fun provideRetrofit(httpClient: OkHttpClient): Retrofit = Retrofit.Builder()
    .baseUrl(BuildConfig.API_BASE_URL)
    .client(httpClient)
    .addConverterFactory(
        Json.asConverterFactory("application/json".toMediaType())
    )
    .build()
```

### 2. Core Database (`core/database/`)

**Responsibility:** Room database setup and migrations

**Contents:**
- Database class definition
- Entity classes
- DAO interfaces
- Database migrations
- Encryption setup

**Database Setup:**
```kotlin
@Database(
    entities = [ThreatEntity::class, EmailEntity::class, FileEntity::class],
    version = 1,
    exportSchema = true
)
@TypeConverters(Converters::class)
abstract class BlockStopDatabase : RoomDatabase() {
    abstract fun threatDao(): ThreatDao
    abstract fun emailDao(): EmailDao
    abstract fun fileDao(): FileDao
    
    companion object {
        fun create(context: Context): BlockStopDatabase = 
            Room.databaseBuilder(context, BlockStopDatabase::class.java, "blockstop.db")
                .addMigrations(*allMigrations)
                .build()
    }
}
```

### 3. Core Security (`core/security/`)

**Responsibility:** Encryption, token management, secure storage

**Contents:**
- Token encryption and storage
- EncryptedSharedPreferences
- Keystore management
- Secure HTTP setup
- Biometric authentication setup

**Token Management:**
```kotlin
class TokenManager @Inject constructor(context: Context) {
    private val encryptedPrefs = EncryptedSharedPreferences.create(
        context,
        "blockstop_tokens",
        MasterKey.Builder(context).setKeyScheme(MasterKey.KeyScheme.AES256_GCM).build(),
        EncryptedSharedPreferences.PrefKeyEncryptionScheme.AES256_SIV,
        EncryptedSharedPreferences.PrefValueEncryptionScheme.AES256_GCM
    )
    
    fun saveAccessToken(token: String) {
        encryptedPrefs.edit().putString("access_token", token).apply()
    }
    
    fun getAccessToken(): String? = 
        encryptedPrefs.getString("access_token", null)
}
```

### 4. Core Common (`core/common/`)

**Responsibility:** Shared utilities, extensions, constants

**Contents:**
- Extension functions
- Utility functions
- Constants and configurations
- Common models (Result, Error)
- Date/time utilities

## Feature Modules

Each feature is self-contained with its own:
- Screens and components
- ViewModels
- Use cases
- Local and remote data sources

### Example: Auth Feature

```
feature/auth/
├── src/main/kotlin/com/blockstop/feature/auth/
│   ├── presentation/
│   │   ├── screen/
│   │   │   ├── LoginScreen.kt
│   │   │   └── SignUpScreen.kt
│   │   ├── viewmodel/
│   │   │   └── AuthViewModel.kt
│   │   └── navigation/
│   │       └── AuthNavigation.kt
│   ├── domain/
│   │   ├── model/
│   │   │   ├── User.kt
│   │   │   └── AuthToken.kt
│   │   ├── repository/
│   │   │   └── AuthRepository.kt
│   │   └── usecase/
│   │       ├── LoginUseCase.kt
│   │       └── SignUpUseCase.kt
│   └── data/
│       ├── remote/
│       │   ├── AuthApiService.kt
│       │   └── model/
│       │       └── LoginRequest.kt
│       ├── local/
│       │   └── UserPreference.kt
│       └── repository/
│           └── AuthRepositoryImpl.kt
```

## Dependency Injection with Hilt

**Hilt** manages dependency injection across the app

**Module Structure:**
```kotlin
// NetworkModule - Provides network dependencies
@Module
@InstallIn(SingletonComponent::class)
object NetworkModule {
    @Provides
    @Singleton
    fun provideHttpClient(): OkHttpClient = ...
    
    @Provides
    @Singleton
    fun provideRetrofit(httpClient: OkHttpClient): Retrofit = ...
}

// DatabaseModule - Provides database dependencies
@Module
@InstallIn(SingletonComponent::class)
object DatabaseModule {
    @Provides
    @Singleton
    fun provideDatabase(context: Context): BlockStopDatabase = ...
    
    @Provides
    fun provideThreatDao(db: BlockStopDatabase): ThreatDao = db.threatDao()
}

// RepositoryModule - Provides repository implementations
@Module
@InstallIn(SingletonComponent::class)
interface RepositoryModule {
    @Binds
    @Singleton
    fun bindThreatRepository(impl: ThreatRepositoryImpl): ThreatRepository
}
```

**Usage in ViewModels:**
```kotlin
@HiltViewModel
class ThreatViewModel @Inject constructor(
    private val getThreatUseCase: GetThreatsUseCase,
    private val deleteThreatUseCase: DeleteThreatUseCase,
    savedStateHandle: SavedStateHandle
) : ViewModel() {
    // ...
}
```

## Data Flow Example

**Scenario:** Fetching threats

```
1. User triggers action in UI
   ↓
2. ThreatScreen calls viewModel.fetchThreats()
   ↓
3. ViewModel calls getThreatUseCase.execute()
   ↓
4. UseCase calls threatRepository.getThreats()
   ↓
5. Repository tries to fetch from API
   ├─ Success: Cache in DB and return
   └─ Failure: Return cached data from DB
   ↓
6. Data flows back up through UseCase → ViewModel
   ↓
7. ViewModel updates StateFlow
   ↓
8. UI collects updated state and recomposes
```

## Async Programming

Uses **Kotlin Coroutines** with **ViewModelScope**

```kotlin
class ThreatViewModel(getThreatUseCase: GetThreatsUseCase) : ViewModel() {
    
    fun fetchThreats() {
        viewModelScope.launch {
            try {
                val threats = withContext(Dispatchers.Default) {
                    getThreatUseCase.execute()
                }
                _threatState.value = ThreatState.Success(threats)
            } catch (e: Exception) {
                _threatState.value = ThreatState.Error(e)
            }
        }
    }
}
```

**Dispatchers:**
- `Dispatchers.Main` - UI updates
- `Dispatchers.IO` - Network/Database
- `Dispatchers.Default` - CPU-intensive work

## Testing Strategy

### Unit Tests (Domain/UseCase Layer)
```kotlin
class GetThreatsUseCaseTest {
    @Test
    fun `should return threats from repository`() = runTest {
        // Arrange
        val mockRepository = mockk<ThreatRepository>()
        coEvery { mockRepository.getThreats() } returns listOf(mockThreat)
        val useCase = GetThreatsUseCase(mockRepository)
        
        // Act
        val result = useCase()
        
        // Assert
        assertTrue(result.isNotEmpty())
    }
}
```

### Integration Tests (Data Layer)
```kotlin
class ThreatRepositoryTest {
    @Test
    fun `should cache API response in database`() = runTest {
        val threat = mockThreat
        coEvery { threatApi.getThreats() } returns listOf(threat)
        
        val result = threatRepository.getThreats()
        
        val cached = threatDao.getAllThreats()
        assertTrue(cached.isNotEmpty())
    }
}
```

### UI Tests (Presentation Layer)
```kotlin
@RunWith(AndroidJUnit4::class)
class ThreatScreenTest {
    @get:Rule
    val composeTestRule = createComposeRule()
    
    @Test
    fun displayThreats() {
        composeTestRule.setContent {
            ThreatScreen(threats = listOf(mockThreat))
        }
        
        composeTestRule.onNodeWithText("Threat 1").assertIsDisplayed()
    }
}
```

## Build Flavors and Variants

**Flavors:** dev, staging, prod  
**Build Types:** debug, release

**Variant Examples:**
- `devDebug` - Development with debug logs
- `stagingDebug` - Staging environment
- `prodRelease` - Production with optimization

## Gradle Configuration

### Settings
- Kotlin Compiler Extension Version: 1.5.3
- Target SDK: 34
- Min SDK: 28
- Java Version: 11

### Key Dependencies
- Compose: 1.6.0
- Room: 2.6.0
- Retrofit: 2.9.0
- Hilt: 2.46
- Firebase: Latest BOM

## Performance Considerations

1. **Database Queries** - Use pagination and filtering
2. **Image Loading** - Implement efficient image caching
3. **Network Requests** - Use request caching and compression
4. **Compose Recomposition** - Optimize with `remember` and `derivedStateOf`
5. **Memory** - Proper cleanup in ViewModels and Activities

## Security Best Practices

1. **Network Security:**
   - TLS 1.2+ for all requests
   - Certificate pinning
   - HTTPS only

2. **Data Storage:**
   - Encrypted SharedPreferences for tokens
   - SQLite encryption with Room
   - No sensitive data in logs

3. **Authentication:**
   - OAuth 2.0 with PKCE
   - Secure token rotation
   - Automatic token refresh

4. **Code Security:**
   - R8/ProGuard minification
   - String obfuscation
   - No hardcoded credentials

---

**Last Updated:** June 21, 2026
