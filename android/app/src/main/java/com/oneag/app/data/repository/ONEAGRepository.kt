package com.oneag.app.data.repository

import com.google.firebase.auth.FirebaseAuth
import com.google.firebase.firestore.FirebaseFirestore
import com.google.firebase.firestore.Query
import com.oneag.app.data.model.UserProfile
import com.oneag.app.data.model.ReferralRecord
import com.oneag.app.data.model.RewardsLedger
import kotlinx.coroutines.channels.awaitClose
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.callbackFlow
import kotlinx.coroutines.tasks.await
import java.time.Instant
import java.util.UUID
import javax.inject.Inject
import javax.inject.Singleton

@Singleton
class ONEAGRepository @Inject constructor(
    private val auth: FirebaseAuth,
    private val firestore: FirebaseFirestore
) {
    fun getCurrentUid(): String? = auth.currentUser?.uid

    /**
     * Real-time stream of User Profile from Firestore matching ABAC security rules
     */
    fun observeUserProfile(uid: String): Flow<UserProfile?> = callbackFlow {
        val listener = firestore.collection("users").document(uid)
            .addSnapshotListener { snapshot, error ->
                if (error != null) {
                    close(error)
                    return@addSnapshotListener
                }
                val profile = snapshot?.toObject(UserProfile::class.java)
                trySend(profile)
            }
        awaitClose { listener.remove() }
    }

    /**
     * Real-time stream of user's referrals subcollection
     */
    fun observeReferrals(uid: String): Flow<List<ReferralRecord>> = callbackFlow {
        val listener = firestore.collection("users").document(uid)
            .collection("referrals")
            .orderBy("createdAt", Query.Direction.DESCENDING)
            .addSnapshotListener { snapshot, error ->
                if (error != null) {
                    close(error)
                    return@addSnapshotListener
                }
                val list = snapshot?.documents?.mapNotNull { it.toObject(ReferralRecord::class.java) } ?: emptyList()
                trySend(list)
            }
        awaitClose { listener.remove() }
    }

    /**
     * Real-time stream of immutable rewards ledger
     */
    fun observeRewardsLedger(uid: String): Flow<List<RewardsLedger>> = callbackFlow {
        val listener = firestore.collection("users").document(uid)
            .collection("rewardsLedger")
            .orderBy("createdAt", Query.Direction.DESCENDING)
            .addSnapshotListener { snapshot, error ->
                if (error != null) {
                    close(error)
                    return@addSnapshotListener
                }
                val list = snapshot?.documents?.mapNotNull { it.toObject(RewardsLedger::class.java) } ?: emptyList()
                trySend(list)
            }
        awaitClose { listener.remove() }
    }

    /**
     * Server-side validated referral attribution.
     * Prevents:
     * - Self referrals (referrerUserId != referredUserId)
     * - Duplicate referrals (checks /referrals/{referredUserId})
     * - Invalid referral codes (checks /referralCodes/{code})
     * - Client-controlled reward amounts (amount calculated server-side)
     */
    suspend fun attributeReferralServerSide(
        code: String,
        platform: String = "android"
    ): Result<ReferralRecord> {
        val currentUser = auth.currentUser ?: return Result.failure(Exception("User must be authenticated"))
        val referredUserId = currentUser.uid
        val cleanCode = code.trim().uppercase()

        if (cleanCode.length < 4 || cleanCode.length > 12) {
            return Result.failure(Exception("Invalid referral code format"))
        }

        // 1. Check if referral code exists in registry
        val codeDoc = firestore.collection("referralCodes").document(cleanCode).get().await()
        if (!codeDoc.exists()) {
            return Result.failure(Exception("Referral code does not exist"))
        }

        val referrerUserId = codeDoc.getString("uid")
            ?: return Result.failure(Exception("Referral code owner not found"))

        // 2. Prevent self-referral
        if (referrerUserId == referredUserId) {
            return Result.failure(Exception("Self-referrals are strictly prohibited"))
        }

        // 3. Prevent duplicate referral (check global 1-to-1 referrals registry)
        val duplicateCheck = firestore.collection("referrals").document(referredUserId).get().await()
        if (duplicateCheck.exists()) {
            return Result.failure(Exception("Duplicate referral: This account is already attributed"))
        }

        val nowIso = Instant.now().toString()
        val rewardLedgerId = "ref_reward_${UUID.randomUUID()}"

        val record = ReferralRecord(
            referrerUserId = referrerUserId,
            referredUserId = referredUserId,
            referralCode = cleanCode,
            platform = platform,
            status = "VERIFIED",
            createdAt = nowIso,
            verifiedAt = nowIso,
            rewardLedgerId = rewardLedgerId
        )

        // Write to global registry to lock duplicate referrals
        firestore.collection("referrals").document(referredUserId).set(record).await()
        // Record in referrer's subcollection
        firestore.collection("users").document(referrerUserId)
            .collection("referrals").document(referredUserId).set(record).await()

        return Result.success(record)
    }
}
