package com.blockstop.android.data.local.sync

import android.content.Context
import androidx.room.Room
import com.blockstop.android.data.local.db.AppDatabase
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.withContext
import java.util.*
import java.util.concurrent.ConcurrentHashMap

/**
 * Manages offline synchronization with conflict resolution using CRDT principles
 * Implements optimistic updates and eventual consistency
 */
class OfflineSyncManager(private val context: Context) {

    companion object {
        private const val DB_NAME = "blockstop_sync.db"
        const val SYNC_BATCH_SIZE = 100
        const val SYNC_TIMEOUT_MS = 30000L
    }

    // Types
    data class SyncMetadata(
        val id: String,
        val lastModified: Long = System.currentTimeMillis(),
        val version: Int = 1,
        val deviceId: String,
        val isSynced: Boolean = false,
        val vectorClock: Map<String, Int> = emptyMap()
    )

    data class ConflictResolution(
        val sourceId: String,
        val targetId: String,
        val resolution: ResolutionStrategy,
        val timestamp: Long = System.currentTimeMillis()
    )

    enum class ResolutionStrategy {
        LAST_WRITE,
        LATEST_VERSION,
        MERGE,
        CUSTOM
    }

    data class SyncStatus(
        val isActive: Boolean = false,
        val progress: Double = 0.0,
        val totalItems: Int = 0,
        val syncedItems: Int = 0
    )

    // Properties
    private val database: AppDatabase = Room.databaseBuilder(
        context,
        AppDatabase::class.java,
        DB_NAME
    ).build()

    private val deviceId = UUID.randomUUID().toString()
    private val syncQueue = Collections.synchronizedList(mutableListOf<String>())
    private val conflictLog = Collections.synchronizedList(mutableListOf<ConflictResolution>())
    private val pendingChanges = ConcurrentHashMap<String, SyncMetadata>()

    private val _syncStatusFlow = MutableStateFlow(SyncStatus())
    val syncStatusFlow: Flow<SyncStatus> = _syncStatusFlow.asStateFlow()

    // Sync operations
    suspend fun synchronize(
        localData: Map<String, Any>,
        remoteData: Map<String, Any>
    ): Map<String, Any> = withContext(Dispatchers.IO) {
        _syncStatusFlow.value = SyncStatus(isActive = true, progress = 0.0)

        try {
            val result = localData.toMutableMap()
            val conflicts = mutableListOf<Pair<String, Pair<Int, Int>>>()

            remoteData.forEach { (key, remoteValue) ->
                if (localData.containsKey(key)) {
                    val (resolved, hasConflict) = resolveConflict(
                        key = key,
                        local = localData[key]!!,
                        remote = remoteValue
                    )

                    if (hasConflict) {
                        conflicts.add(Triple(key, extractVersion(localData[key]!!), extractVersion(remoteValue)).let {
                            it.first to (it.second to it.third)
                        })
                    }

                    result[key] = resolved
                } else {
                    result[key] = remoteValue
                }

                val progress = result.size.toDouble() / (localData.size + remoteData.size).toDouble()
                _syncStatusFlow.value = SyncStatus(
                    isActive = true,
                    progress = progress,
                    totalItems = localData.size + remoteData.size,
                    syncedItems = result.size
                )
            }

            // Mark as synced
            result.keys.forEach { key ->
                pendingChanges[key]?.let {
                    pendingChanges[key] = it.copy(isSynced = true)
                }
            }

            _syncStatusFlow.value = SyncStatus(
                isActive = false,
                progress = 1.0,
                totalItems = result.size,
                syncedItems = result.size
            )

            result
        } catch (e: Exception) {
            _syncStatusFlow.value = SyncStatus(isActive = false, progress = 0.0)
            throw SyncException("Synchronization failed: ${e.message}", e)
        }
    }

    suspend fun queueChange(
        key: String,
        data: Any,
        recordType: String = "BlockStopData"
    ) = withContext(Dispatchers.IO) {
        val metadata = SyncMetadata(
            id = key,
            deviceId = deviceId,
            version = (pendingChanges[key]?.version ?: 0) + 1,
            vectorClock = mapOf(deviceId to 1)
        )

        pendingChanges[key] = metadata
        syncQueue.add(key)

        persistChange(key, data)
    }

    suspend fun getPendingChanges(): Map<String, SyncMetadata> =
        withContext(Dispatchers.IO) {
            pendingChanges.toMap()
        }

    suspend fun clearSyncedChanges() = withContext(Dispatchers.IO) {
        pendingChanges.entries.removeAll { it.value.isSynced }
        syncQueue.removeAll { !pendingChanges.containsKey(it) }
    }

    // Conflict resolution
    private fun resolveConflict(
        key: String,
        local: Any,
        remote: Any
    ): Pair<Any, Boolean> {
        val localVersion = extractVersion(local)
        val remoteVersion = extractVersion(remote)

        return when {
            localVersion == remoteVersion -> local to false
            remoteVersion > localVersion -> remote to true
            else -> local to true
        }
    }

    private fun extractVersion(value: Any): Int {
        return if (value is Map<*, *>) {
            (value["version"] as? Int) ?: 0
        } else {
            0
        }
    }

    private suspend fun persistChange(key: String, data: Any) =
        withContext(Dispatchers.IO) {
            val sharedPref = context.getSharedPreferences(
                "blockstop_sync",
                Context.MODE_PRIVATE
            )

            // Serialize and store (simplified - in production use proper serialization)
            val serialized = data.toString()
            sharedPref.edit().putString("sync_$key", serialized).apply()
        }

    // Custom Exception
    class SyncException(message: String, cause: Throwable? = null) :
        Exception(message, cause)
}

/**
 * Vector Clock implementation for tracking concurrent events
 */
data class VectorClock(
    val timestamps: MutableMap<String, Int> = mutableMapOf()
) {
    fun increment(deviceId: String) {
        timestamps[deviceId] = (timestamps[deviceId] ?: 0) + 1
    }

    fun happensBefore(other: VectorClock): Boolean {
        if (timestamps.isEmpty() || other.timestamps.isEmpty()) {
            return timestamps.size < other.timestamps.size
        }

        var isLess = false
        for ((key, value) in timestamps) {
            val otherValue = other.timestamps[key] ?: 0
            if (value > otherValue) {
                return false
            }
            if (value < otherValue) {
                isLess = true
            }
        }
        return isLess
    }

    fun concurrent(other: VectorClock): Boolean {
        return !happensBefore(other) && !other.happensBefore(this)
    }
}
