package com.blockstop.android.presentation.notifications

import android.app.NotificationChannel
import android.app.NotificationManager
import android.app.PendingIntent
import android.content.Context
import android.content.Intent
import android.graphics.Bitmap
import android.media.RingtoneManager
import android.net.Uri
import android.os.Build
import androidx.core.app.NotificationCompat
import androidx.core.graphics.drawable.IconCompat
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.withContext
import java.util.*

/**
 * Advanced notification system with rich media, custom actions, and delivery optimization
 */
class AdvancedNotificationManager(private val context: Context) {

    companion object {
        const val CHANNEL_THREATS = "blockstop_threats"
        const val CHANNEL_SCANS = "blockstop_scans"
        const val CHANNEL_SYSTEM = "blockstop_system"
        const val CHANNEL_UPDATES = "blockstop_updates"
    }

    // Types
    enum class NotificationType {
        THREAT_DETECTED,
        SCAN_COMPLETE,
        OFFLINE_ALERT,
        UPDATE_AVAILABLE,
        MALWARE_FOUND,
        PHISHING_ALERT,
        SYSTEM_MESSAGE
    }

    enum class NotificationPriority {
        LOW, NORMAL, HIGH, MAX
    }

    data class RichNotification(
        val id: UUID = UUID.randomUUID(),
        val type: NotificationType,
        val title: String,
        val subtitle: String,
        val body: String,
        val largeIcon: Bitmap? = null,
        val bigPicture: Bitmap? = null,
        val sound: Uri? = null,
        val priority: NotificationPriority = NotificationPriority.HIGH,
        val actions: List<NotificationAction> = emptyList(),
        val autoCancel: Boolean = true,
        val vibrate: Boolean = true,
        val metadata: Map<String, String> = emptyMap()
    )

    data class NotificationAction(
        val id: String,
        val title: String,
        val icon: Int? = null,
        val requestCode: Int
    )

    data class NotificationStatus(
        val id: UUID,
        val isDelivered: Boolean,
        val timestamp: Long
    )

    // Properties
    private val notificationManager: NotificationManager =
        context.getSystemService(Context.NOTIFICATION_SERVICE) as NotificationManager

    private val _notificationStatusFlow = MutableStateFlow<Map<UUID, NotificationStatus>>(emptyMap())
    val notificationStatusFlow: StateFlow<Map<UUID, NotificationStatus>> = _notificationStatusFlow

    private var nextNotificationId = 1000

    init {
        createNotificationChannels()
    }

    // Public methods
    suspend fun showNotification(notification: RichNotification) {
        withContext(Dispatchers.Main) {
            try {
                val builder = NotificationCompat.Builder(context, getChannelId(notification.type))
                    .setContentTitle(notification.title)
                    .setContentText(notification.body)
                    .setSubText(notification.subtitle)
                    .setAutoCancel(notification.autoCancel)
                    .setPriority(getPriority(notification.priority))

                // Set icon
                builder.setSmallIcon(android.R.drawable.ic_dialog_info)

                // Set large icon
                notification.largeIcon?.let {
                    builder.setLargeIcon(it)
                }

                // Set big picture style for image notifications
                notification.bigPicture?.let {
                    val bigPictureStyle = NotificationCompat.BigPictureStyle()
                        .bigPicture(it)
                        .setShowBigPictureWhenCollapsed(true)
                    builder.setStyle(bigPictureStyle)
                }

                // Set sound
                val soundUri = notification.sound ?: RingtoneManager.getDefaultUri(RingtoneManager.TYPE_NOTIFICATION)
                builder.setSound(soundUri)

                // Set vibration
                if (notification.vibrate) {
                    builder.setVibrate(longArrayOf(0, 250, 250, 250))
                }

                // Add actions
                for ((index, action) in notification.actions.withIndex()) {
                    val intent = Intent(context, NotificationActionReceiver::class.java).apply {
                        action = "com.blockstop.NOTIFICATION_ACTION"
                        putExtra("notification_id", notification.id.toString())
                        putExtra("action_id", action.id)
                    }

                    val pendingIntent = PendingIntent.getBroadcast(
                        context,
                        action.requestCode,
                        intent,
                        PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
                    )

                    builder.addAction(
                        action.icon ?: 0,
                        action.title,
                        pendingIntent
                    )
                }

                // Set content intent
                val contentIntent = Intent(context, NotificationOpenReceiver::class.java).apply {
                    action = "com.blockstop.NOTIFICATION_OPEN"
                    putExtra("notification_id", notification.id.toString())
                }

                val contentPendingIntent = PendingIntent.getBroadcast(
                    context,
                    notification.id.hashCode(),
                    contentIntent,
                    PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
                )

                builder.setContentIntent(contentPendingIntent)

                // Add metadata
                for ((key, value) in notification.metadata) {
                    builder.setRemoteInputHistory(arrayOf(value))
                }

                val notificationId = nextNotificationId++
                notificationManager.notify(notificationId, builder.build())

                updateNotificationStatus(notification.id, true)

            } catch (e: Exception) {
                updateNotificationStatus(notification.id, false)
            }
        }
    }

    suspend fun showThreatNotification(
        threatName: String,
        severity: String,
        source: String
    ) {
        val notification = RichNotification(
            type = NotificationType.THREAT_DETECTED,
            title = "Security Threat Detected",
            subtitle = severity.uppercase(),
            body = "Detected: $threatName from $source",
            priority = NotificationPriority.MAX,
            actions = listOf(
                NotificationAction(
                    id = "view_threat",
                    title = "View Details",
                    requestCode = 100
                ),
                NotificationAction(
                    id = "dismiss",
                    title = "Dismiss",
                    requestCode = 101
                )
            )
        )
        showNotification(notification)
    }

    suspend fun showMalwareNotification(
        fileName: String,
        detectionRate: Int
    ) {
        val notification = RichNotification(
            type = NotificationType.MALWARE_FOUND,
            title = "Malware Detected",
            subtitle = "Action Required",
            body = "Malware detected in $fileName - $detectionRate% detection rate",
            priority = NotificationPriority.MAX,
            actions = listOf(
                NotificationAction(
                    id = "quarantine",
                    title = "Quarantine",
                    requestCode = 102
                ),
                NotificationAction(
                    id = "delete",
                    title = "Delete",
                    requestCode = 103
                )
            )
        )
        showNotification(notification)
    }

    suspend fun showScanCompleteNotification(
        scannedItems: Int,
        threatsFound: Int
    ) {
        val notification = RichNotification(
            type = NotificationType.SCAN_COMPLETE,
            title = "Scan Complete",
            subtitle = "Results ready",
            body = "Scanned $scannedItems items, $threatsFound threats found",
            priority = NotificationPriority.NORMAL
        )
        showNotification(notification)
    }

    suspend fun cancelNotification(id: UUID) {
        withContext(Dispatchers.Main) {
            val status = _notificationStatusFlow.value[id]
            if (status != null) {
                notificationManager.cancel(id.hashCode())
                val updatedMap = _notificationStatusFlow.value.toMutableMap()
                updatedMap.remove(id)
                _notificationStatusFlow.value = updatedMap
            }
        }
    }

    suspend fun cancelAllNotifications() {
        withContext(Dispatchers.Main) {
            notificationManager.cancelAll()
            _notificationStatusFlow.value = emptyMap()
        }
    }

    // Private methods
    private fun createNotificationChannels() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            val threatChannel = NotificationChannel(
                CHANNEL_THREATS,
                "Security Threats",
                NotificationManager.IMPORTANCE_MAX
            ).apply {
                description = "Notifications about detected security threats"
                enableVibration(true)
            }

            val scanChannel = NotificationChannel(
                CHANNEL_SCANS,
                "Scan Results",
                NotificationManager.IMPORTANCE_HIGH
            ).apply {
                description = "Notifications about scan results"
            }

            val systemChannel = NotificationChannel(
                CHANNEL_SYSTEM,
                "System",
                NotificationManager.IMPORTANCE_DEFAULT
            ).apply {
                description = "System messages and alerts"
            }

            val updateChannel = NotificationChannel(
                CHANNEL_UPDATES,
                "Updates",
                NotificationManager.IMPORTANCE_LOW
            ).apply {
                description = "Update notifications"
            }

            notificationManager.createNotificationChannels(
                listOf(threatChannel, scanChannel, systemChannel, updateChannel)
            )
        }
    }

    private fun getChannelId(type: NotificationType): String {
        return when (type) {
            NotificationType.THREAT_DETECTED,
            NotificationType.MALWARE_FOUND,
            NotificationType.PHISHING_ALERT -> CHANNEL_THREATS
            NotificationType.SCAN_COMPLETE -> CHANNEL_SCANS
            NotificationType.UPDATE_AVAILABLE -> CHANNEL_UPDATES
            else -> CHANNEL_SYSTEM
        }
    }

    private fun getPriority(priority: NotificationPriority): Int {
        return when (priority) {
            NotificationPriority.LOW -> NotificationCompat.PRIORITY_LOW
            NotificationPriority.NORMAL -> NotificationCompat.PRIORITY_DEFAULT
            NotificationPriority.HIGH -> NotificationCompat.PRIORITY_HIGH
            NotificationPriority.MAX -> NotificationCompat.PRIORITY_MAX
        }
    }

    private fun updateNotificationStatus(id: UUID, delivered: Boolean) {
        val updatedMap = _notificationStatusFlow.value.toMutableMap()
        updatedMap[id] = NotificationStatus(
            id = id,
            isDelivered = delivered,
            timestamp = System.currentTimeMillis()
        )
        _notificationStatusFlow.value = updatedMap
    }
}

/**
 * Broadcast receiver for notification actions
 */
class NotificationActionReceiver : android.content.BroadcastReceiver() {
    override fun onReceive(context: Context, intent: Intent) {
        val notificationId = intent.getStringExtra("notification_id") ?: return
        val actionId = intent.getStringExtra("action_id") ?: return

        // Handle notification action
        when (actionId) {
            "view_threat" -> {
                // Navigate to threat details
            }
            "quarantine" -> {
                // Quarantine file
            }
            "delete" -> {
                // Delete file
            }
        }
    }
}

/**
 * Broadcast receiver for notification open
 */
class NotificationOpenReceiver : android.content.BroadcastReceiver() {
    override fun onReceive(context: Context, intent: Intent) {
        val notificationId = intent.getStringExtra("notification_id") ?: return
        // Navigate to notification details
    }
}
