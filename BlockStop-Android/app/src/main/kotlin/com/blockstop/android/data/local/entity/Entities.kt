package com.blockstop.android.data.local.entity

import androidx.room.Entity
import androidx.room.Index
import androidx.room.PrimaryKey
import java.util.Date

/**
 * Room database entities for BlockStop Android
 */

@Entity(
    tableName = "threats",
    indices = [
        Index("severity"),
        Index("createdAt"),
        Index("source")
    ]
)
data class ThreatEntity(
    @PrimaryKey val id: String,
    val name: String,
    val description: String,
    val severity: String, // "LOW", "MEDIUM", "HIGH", "CRITICAL"
    val source: String,
    val category: String,
    val detectionRate: Int,
    val hash: String?,
    val createdAt: Date = Date(),
    val updatedAt: Date = Date(),
    val isSynced: Boolean = false,
    val metadata: String = "" // JSON string
)

@Entity(
    tableName = "scan_results",
    indices = [
        Index("scanTime"),
        Index("status")
    ]
)
data class ScanResultEntity(
    @PrimaryKey val id: String,
    val scanType: String, // "EMAIL", "FILE", "SYSTEM"
    val itemsScanned: Int,
    val threatsFound: Int,
    val scanTime: Date = Date(),
    val duration: Long, // milliseconds
    val status: String, // "COMPLETED", "FAILED", "CANCELLED"
    val sourceId: String?,
    val metadata: String = "" // JSON string
)

@Entity(
    tableName = "sync_metadata",
    indices = [
        Index("deviceId"),
        Index("isSynced")
    ]
)
data class SyncMetadataEntity(
    @PrimaryKey val id: String,
    val lastModified: Date = Date(),
    val version: Int = 1,
    val deviceId: String,
    val isSynced: Boolean = false,
    val vectorClock: String = "" // JSON string
)

@Entity(
    tableName = "notifications",
    indices = [
        Index("timestamp"),
        Index("type")
    ]
)
data class NotificationEntity(
    @PrimaryKey val id: String,
    val type: String, // "THREAT", "SCAN", "SYSTEM"
    val title: String,
    val message: String,
    val timestamp: Date = Date(),
    val read: Boolean = false,
    val actionUrl: String? = null,
    val metadata: String = "" // JSON string
)

@Entity(
    tableName = "offline_cache",
    indices = [
        Index("key", unique = true),
        Index("expiresAt")
    ]
)
data class OfflineCacheEntity(
    @PrimaryKey val id: String,
    val key: String,
    val data: String, // JSON string
    val createdAt: Date = Date(),
    val expiresAt: Date,
    val priority: Int = 0
)

@Entity(
    tableName = "users",
    indices = [
        Index("email", unique = true)
    ]
)
data class UserEntity(
    @PrimaryKey val id: String,
    val email: String,
    val name: String?,
    val tier: String, // "FREE", "NEO", "PRO", "OFFICE", "HEALTH", "MAX"
    val createdAt: Date = Date(),
    val lastLogin: Date? = null,
    val isSynced: Boolean = false
)
