package com.oneag.app.data.model

import org.junit.Assert.assertEquals
import org.junit.Assert.assertNotNull
import org.junit.Test

/**
 * Android Unit Tests for ONEAG Data Models and Security Invariants
 */
class ModelsTest {

    @Test
    fun userProfile_defaultWithdrawalStatus_isLocked() {
        val profile = UserProfile(
            uid = "usr_test_123",
            email = "user@example.com",
            displayName = "Test User"
        )

        // Safety invariant: withdrawalStatus must ALWAYS default to LOCKED
        assertEquals("LOCKED", profile.withdrawalStatus)
        assertEquals(0L, profile.pointsBalance)
        assertEquals("Bronze", profile.tier)
    }

    @Test
    fun referralRecord_defaultValues_areValidAndSecure() {
        val record = ReferralRecord(
            referrerUserId = "usr_referrer_001",
            referredUserId = "usr_referee_002",
            referralCode = "ONEAG2026"
        )

        assertEquals("usr_referrer_001", record.referrerUserId)
        assertEquals("usr_referee_002", record.referredUserId)
        assertEquals("android", record.platform)
        assertEquals("VERIFIED", record.status)
        assertNotNull(record.id)
    }

    @Test
    fun rewardsLedger_statusDefaultsToCredited() {
        val ledger = RewardsLedger(
            id = "ledg_001",
            userId = "usr_001",
            amount = 500L,
            type = "AFFILIATE_COMMISSION",
            description = "Commission reward"
        )

        assertEquals("ledg_001", ledger.id)
        assertEquals(500L, ledger.amount)
        assertEquals("CREDITED", ledger.status)
    }
}
