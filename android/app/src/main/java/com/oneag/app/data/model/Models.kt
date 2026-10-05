package com.oneag.app.data.model

data class UserProfile(
    val uid: String = "",
    val email: String = "",
    val displayName: String = "",
    val photoURL: String? = null,
    val referralCode: String = "",
    val referredBy: String? = null,
    val referredByUid: String? = null,
    val pointsBalance: Long = 0,
    val tier: String = "Bronze",
    val totalReferrals: Long = 0,
    val withdrawalStatus: String = "LOCKED",
    val createdAt: String = "",
    val updatedAt: String = ""
)

/**
 * Secure Referral Ledger Model adhering to production specification
 */
data class ReferralRecord(
    val referrerUserId: String = "",
    val referredUserId: String = "",
    val referralCode: String = "",
    val platform: String = "android",
    val status: String = "VERIFIED",
    val createdAt: String = "",
    val verifiedAt: String = "",
    val rewardLedgerId: String = ""
)

data class RewardsLedger(
    val id: String = "",
    val userId: String = "",
    val amount: Long = 0,
    val type: String = "",
    val description: String = "",
    val status: String = "CREDITED",
    val createdAt: String = ""
)
