package com.oneag.app.security

import android.content.Context
import com.google.android.play.core.integrity.IntegrityManager
import com.google.android.play.core.integrity.IntegrityManagerFactory
import com.google.android.play.core.integrity.IntegrityTokenRequest
import com.google.android.play.core.integrity.IntegrityTokenResponse
import kotlinx.coroutines.tasks.await

/**
 * ONEAG Play Integrity Architecture
 * 
 * Secure Native Device Attestation Flow:
 * 1. Client requests a cryptographic, single-use, time-bound nonce from ONEAG backend.
 * 2. Client passes the nonce to Google Play Integrity API via IntegrityManager.
 * 3. Client receives encrypted integrity token signed by Google.
 * 4. Client transmits token to ONEAG backend (/api/security/integrity/verify).
 * 5. Backend validates the token via Google Play Developer API and verifies:
 *    - App licensing (genuine install from Google Play)
 *    - App integrity (genuine unmodified binary with matching SHA256 certificate)
 *    - Device integrity (meets basic integrity, strong integrity, unrooted)
 * 
 * Security Rule: Zero secrets or Google service account credentials are stored in client code.
 */
class PlayIntegrityManager(
    private val context: Context,
    private val cloudProjectNumber: Long = 0L // Populated dynamically or server-provided
) {
    private val integrityManager: IntegrityManager by lazy {
        IntegrityManagerFactory.create(context.applicationContext)
    }

    /**
     * Obtains an encrypted integrity token using a server-provided cryptographic nonce.
     *
     * @param serverProvidedNonce Base64-encoded nonce from server
     * @return Raw encrypted token to be sent to backend verification endpoint
     */
    suspend fun requestIntegrityToken(serverProvidedNonce: String): Result<String> {
        return try {
            if (cloudProjectNumber <= 0L) {
                return Result.failure(
                    IllegalStateException("Play Integrity: Project number must be configured via server configuration.")
                )
            }

            val request = IntegrityTokenRequest.builder()
                .setCloudProjectNumber(cloudProjectNumber)
                .setNonce(serverProvidedNonce)
                .build()

            val response: IntegrityTokenResponse = integrityManager.requestIntegrityToken(request).await()
            Result.success(response.token())
        } catch (e: Exception) {
            Result.failure(e)
        }
    }
}
