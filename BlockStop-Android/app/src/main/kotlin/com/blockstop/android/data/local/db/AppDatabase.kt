package com.blockstop.android.data.local.db

import android.content.Context
import androidx.room.Database
import androidx.room.Room
import androidx.room.RoomDatabase
import androidx.room.TypeConverters
import com.blockstop.android.data.local.entity.*

/**
 * Room database for offline data storage and sync
 */
@Database(
    entities = [
        ThreatEntity::class,
        ScanResultEntity::class,
        SyncMetadataEntity::class,
        NotificationEntity::class,
        OfflineCacheEntity::class,
        UserEntity::class
    ],
    version = 1,
    exportSchema = true
)
@TypeConverters(Converters::class)
abstract class AppDatabase : RoomDatabase() {

    abstract fun threatDao(): ThreatDao
    abstract fun scanResultDao(): ScanResultDao
    abstract fun syncMetadataDao(): SyncMetadataDao
    abstract fun notificationDao(): NotificationDao
    abstract fun offlineCacheDao(): OfflineCacheDao
    abstract fun userDao(): UserDao

    companion object {
        private const val DATABASE_NAME = "blockstop_database"

        @Volatile
        private var instance: AppDatabase? = null

        fun getInstance(context: Context): AppDatabase =
            instance ?: synchronized(this) {
                instance ?: buildDatabase(context).also { instance = it }
            }

        private fun buildDatabase(context: Context): AppDatabase =
            Room.databaseBuilder(
                context.applicationContext,
                AppDatabase::class.java,
                DATABASE_NAME
            )
                .enableMultiInstanceInvalidation()
                .build()
    }
}

/**
 * Type converters for Room database
 */
import androidx.room.TypeConverter
import com.google.gson.Gson
import java.util.*

class Converters {
    private val gson = Gson()

    @TypeConverter
    fun fromTimestamp(value: Long?): Date? = value?.let { Date(it) }

    @TypeConverter
    fun dateToTimestamp(date: Date?): Long? = date?.time

    @TypeConverter
    fun fromJson(value: String?): Map<String, String>? =
        value?.let { gson.fromJson(it, Map::class.java) as? Map<String, String> }

    @TypeConverter
    fun mapToJson(map: Map<String, String>?): String? = map?.let { gson.toJson(it) }

    @TypeConverter
    fun fromStringList(value: String?): List<String>? =
        value?.split(",")?.filter { it.isNotEmpty() }

    @TypeConverter
    fun stringListToString(list: List<String>?): String? = list?.joinToString(",")
}

/**
 * Data Access Objects (DAOs)
 */
import androidx.room.*
import kotlinx.coroutines.flow.Flow

// Threat DAO
@Dao
interface ThreatDao {
    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insert(threat: ThreatEntity)

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insertAll(threats: List<ThreatEntity>)

    @Update
    suspend fun update(threat: ThreatEntity)

    @Delete
    suspend fun delete(threat: ThreatEntity)

    @Query("SELECT * FROM threats WHERE id = :id")
    suspend fun getThreat(id: String): ThreatEntity?

    @Query("SELECT * FROM threats ORDER BY createdAt DESC")
    fun getAllThreats(): Flow<List<ThreatEntity>>

    @Query("SELECT * FROM threats WHERE severity = :severity ORDER BY createdAt DESC")
    fun getThreatsBySeverity(severity: String): Flow<List<ThreatEntity>>

    @Query("SELECT COUNT(*) FROM threats")
    fun getThreatCount(): Flow<Int>

    @Query("DELETE FROM threats WHERE createdAt < :timestamp")
    suspend fun deleteOlderThan(timestamp: Long)
}

// Scan Result DAO
@Dao
interface ScanResultDao {
    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insert(scanResult: ScanResultEntity)

    @Update
    suspend fun update(scanResult: ScanResultEntity)

    @Delete
    suspend fun delete(scanResult: ScanResultEntity)

    @Query("SELECT * FROM scan_results WHERE id = :id")
    suspend fun getScanResult(id: String): ScanResultEntity?

    @Query("SELECT * FROM scan_results ORDER BY scanTime DESC LIMIT :limit")
    fun getRecentScans(limit: Int = 10): Flow<List<ScanResultEntity>>

    @Query("SELECT COUNT(*) FROM scan_results")
    suspend fun getScanCount(): Int
}

// Sync Metadata DAO
@Dao
interface SyncMetadataDao {
    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insert(metadata: SyncMetadataEntity)

    @Query("SELECT * FROM sync_metadata WHERE id = :id")
    suspend fun getMetadata(id: String): SyncMetadataEntity?

    @Query("SELECT * FROM sync_metadata WHERE isSynced = 0")
    suspend fun getPendingChanges(): List<SyncMetadataEntity>

    @Update
    suspend fun update(metadata: SyncMetadataEntity)

    @Query("DELETE FROM sync_metadata WHERE isSynced = 1")
    suspend fun clearSyncedMetadata()
}

// Notification DAO
@Dao
interface NotificationDao {
    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insert(notification: NotificationEntity)

    @Query("SELECT * FROM notifications ORDER BY timestamp DESC LIMIT :limit")
    suspend fun getRecentNotifications(limit: Int = 50): List<NotificationEntity>

    @Delete
    suspend fun delete(notification: NotificationEntity)

    @Query("DELETE FROM notifications WHERE timestamp < :timestamp")
    suspend fun deleteOlderThan(timestamp: Long)
}

// Offline Cache DAO
@Dao
interface OfflineCacheDao {
    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insert(cache: OfflineCacheEntity)

    @Query("SELECT * FROM offline_cache WHERE key = :key")
    suspend fun get(key: String): OfflineCacheEntity?

    @Query("SELECT * FROM offline_cache")
    suspend fun getAll(): List<OfflineCacheEntity>

    @Delete
    suspend fun delete(cache: OfflineCacheEntity)

    @Query("DELETE FROM offline_cache WHERE expiresAt < :timestamp")
    suspend fun deleteExpired(timestamp: Long)
}

// User DAO
@Dao
interface UserDao {
    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insert(user: UserEntity)

    @Query("SELECT * FROM users WHERE id = :id")
    suspend fun getUser(id: String): UserEntity?

    @Update
    suspend fun update(user: UserEntity)

    @Delete
    suspend fun delete(user: UserEntity)
}
