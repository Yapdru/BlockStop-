package com.blockstop.android.data.local.sync

import android.content.Context
import io.mockk.mockk
import kotlinx.coroutines.runBlocking
import org.junit.Before
import org.junit.Test
import kotlin.test.assertEquals
import kotlin.test.assertTrue

class OfflineSyncManagerTest {

    private lateinit var context: Context
    private lateinit var syncManager: OfflineSyncManager

    @Before
    fun setUp() {
        context = mockk(relaxed = true)
        syncManager = OfflineSyncManager(context)
    }

    // MARK: - Synchronization Tests

    @Test
    fun testSynchronizeWithoutConflict() = runBlocking {
        val localData = mapOf(
            "user" to mapOf("version" to 1, "name" to "John")
        )
        val remoteData = mapOf(
            "settings" to mapOf("theme" to "dark")
        )

        val result = syncManager.synchronize(localData, remoteData)

        assertEquals("John", (result["user"] as? Map<*, *>)?.get("name"))
        assertEquals("dark", (result["settings"] as? Map<*, *>)?.get("theme"))
    }

    @Test
    fun testSynchronizeWithConflict() = runBlocking {
        val localData = mapOf(
            "data" to mapOf("version" to 2, "value" to "local")
        )
        val remoteData = mapOf(
            "data" to mapOf("version" to 1, "value" to "remote")
        )

        val result = syncManager.synchronize(localData, remoteData)

        assertEquals("local", (result["data"] as? Map<*, *>)?.get("value"))
    }

    @Test
    fun testQueueChange() = runBlocking {
        syncManager.queueChange(
            mapOf("name" to "Test"),
            "testKey"
        )

        val pending = syncManager.getPendingChanges()
        assertTrue(pending.containsKey("testKey"))
        assertEquals(false, pending["testKey"]?.isSynced)
    }

    @Test
    fun testClearSyncedChanges() = runBlocking {
        syncManager.queueChange(
            mapOf("name" to "Test1"),
            "key1"
        )
        syncManager.queueChange(
            mapOf("name" to "Test2"),
            "key2"
        )

        var pending = syncManager.getPendingChanges()
        assertEquals(2, pending.size)

        syncManager.clearSyncedChanges()

        pending = syncManager.getPendingChanges()
        assertEquals(0, pending.size)
    }

    // MARK: - Vector Clock Tests

    @Test
    fun testVectorClockHappensBefore() {
        val clock1 = VectorClock(mutableMapOf("device1" to 1, "device2" to 0))
        val clock2 = VectorClock(mutableMapOf("device1" to 2, "device2" to 0))

        assertTrue(clock1.happensBefore(clock2))
    }

    @Test
    fun testVectorClockConcurrency() {
        val clock1 = VectorClock(mutableMapOf("device1" to 1, "device2" to 0))
        val clock2 = VectorClock(mutableMapOf("device1" to 0, "device2" to 1))

        assertTrue(clock1.concurrent(clock2))
    }

    @Test
    fun testVectorClockIncrement() {
        val clock = VectorClock()
        clock.increment("device1")
        clock.increment("device1")

        assertEquals(2, clock.timestamps["device1"])
    }

    // MARK: - Performance Tests

    @Test
    fun testSyncPerformanceWithLargeDataset() = runBlocking {
        val largeData = mutableMapOf<String, Any>()
        for (i in 0..999) {
            largeData["item_$i"] = mapOf("version" to i, "value" to "test")
        }

        val startTime = System.currentTimeMillis()
        syncManager.synchronize(largeData, largeData)
        val elapsed = System.currentTimeMillis() - startTime

        assertTrue(elapsed < 5000, "Sync should complete within 5 seconds")
    }
}
