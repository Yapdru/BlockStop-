package com.blockstop.android.domain.biometric

import android.content.Context
import android.security.keystore.KeyGenParameterSpec
import android.security.keystore.KeyProperties
import androidx.biometric.BiometricManager
import androidx.biometric.BiometricManager.Authenticators
import androidx.biometric.BiometricPrompt
import androidx.fragment.app.FragmentActivity
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import java.io.IOException
import java.security.KeyStore
import javax.crypto.Cipher
import javax.crypto.KeyGenerator
import javax.crypto.SecretKey

/**
 * Advanced biometric authentication with fallback support
 * Handles fingerprint, face recognition, and device credentials
 */
class AdvancedBiometricManager(private val context: Context) {

    // Types
    enum class BiometricType {
        FINGERPRINT,
        FACE,
        IRIS,
        DEVICE_CREDENTIAL,
        UNAVAILABLE;

        val displayName: String
            get() = when (this) {
                FINGERPRINT -> "Fingerprint"
                FACE -> "Face Recognition"
                IRIS -> "Iris Scan"
                DEVICE_CREDENTIAL -> "Device Credential"
                UNAVAILABLE -> "Authentication Unavailable"
            }
    }

    enum class BiometricError {
        BIOMETRIC_UNAVAILABLE,
        BIOMETRIC_LOCKED,
        BIOMETRIC_CANCELLED,
        NO_BIOMETRIC_ENROLLED,
        AUTHENTICATION_FAILED,
        KEYSTORE_ERROR,
        CIPHER_ERROR
    }

    data class AuthenticationResult(
        val success: Boolean,
        val biometricType: BiometricType,
        val timestamp: Long = System.currentTimeMillis(),
        val evaluationTime: Long = 0
    )

    data class BiometricStatus(
        val available: Boolean,
        val type: BiometricType,
        val enrolledCount: Int = 0
    )

    // Properties
    private val biometricManager: BiometricManager = BiometricManager.from(context)
    private val keyStore: KeyStore = KeyStore.getInstance("AndroidKeyStore").apply { load(null) }

    private val _biometricStatusFlow = MutableStateFlow(BiometricStatus(false, BiometricType.UNAVAILABLE))
    val biometricStatusFlow: StateFlow<BiometricStatus> = _biometricStatusFlow.asStateFlow()

    private val _authenticationResultFlow = MutableStateFlow<AuthenticationResult?>(null)
    val authenticationResultFlow: StateFlow<AuthenticationResult?> = _authenticationResultFlow.asStateFlow()

    init {
        updateBiometricStatus()
        createCipherKey()
    }

    // Authentication methods
    fun authenticate(
        activity: FragmentActivity,
        reason: String = "Authenticate to access BlockStop",
        allowDeviceCredential: Boolean = true
    ): BiometricPrompt {
        val authenticators = when {
            allowDeviceCredential -> Authenticators.BIOMETRIC_STRONG or Authenticators.DEVICE_CREDENTIAL
            else -> Authenticators.BIOMETRIC_STRONG
        }

        val promptInfo = BiometricPrompt.PromptInfo.Builder()
            .setTitle("BlockStop Authentication")
            .setSubtitle(reason)
            .setAllowedAuthenticators(authenticators)
            .setNegativeButtonText("Cancel")
            .build()

        val biometricPrompt = BiometricPrompt(
            activity,
            MainThreadExecutor(),
            object : BiometricPrompt.AuthenticationCallback() {
                override fun onAuthenticationSucceeded(result: BiometricPrompt.AuthenticationResult) {
                    super.onAuthenticationSucceeded(result)

                    val biometricType = when {
                        biometricManager.canAuthenticate(Authenticators.BIOMETRIC_STRONG) == BiometricManager.BIOMETRIC_SUCCESS -> {
                            determineBiometricType()
                        }
                        else -> BiometricType.DEVICE_CREDENTIAL
                    }

                    _authenticationResultFlow.value = AuthenticationResult(
                        success = true,
                        biometricType = biometricType
                    )
                }

                override fun onAuthenticationError(errorCode: Int, errString: CharSequence) {
                    super.onAuthenticationError(errorCode, errString)
                    _authenticationResultFlow.value = AuthenticationResult(
                        success = false,
                        biometricType = BiometricType.UNAVAILABLE
                    )
                }

                override fun onAuthenticationFailed() {
                    super.onAuthenticationFailed()
                    // User cancelled or authentication failed
                }
            }
        )

        biometricPrompt.authenticate(promptInfo, BiometricPrompt.CryptoObject(getCipher()))
        return biometricPrompt
    }

    fun isAuthenticated(): Boolean = _authenticationResultFlow.value?.success ?: false

    // Credential storage
    fun storeCredential(account: String, credential: String) {
        val sharedPref = context.getSharedPreferences(
            "blockstop_biometric",
            Context.MODE_PRIVATE
        )

        val cipher = getCipher()
        cipher.init(Cipher.ENCRYPT_MODE, getKey())

        val encryptedCredential = cipher.doFinal(credential.toByteArray())
        val iv = cipher.iv

        sharedPref.edit().apply {
            putString("credential_$account", encryptedCredential.joinToString(",") { it.toString() })
            putString("iv_$account", iv.joinToString(",") { it.toString() })
            apply()
        }
    }

    fun retrieveCredential(account: String, cipher: Cipher): String? {
        val sharedPref = context.getSharedPreferences(
            "blockstop_biometric",
            Context.MODE_PRIVATE
        )

        val encryptedStr = sharedPref.getString("credential_$account", null) ?: return null
        val ivStr = sharedPref.getString("iv_$account", null) ?: return null

        return try {
            val encrypted = encryptedStr.split(",").map { it.toByte() }.toByteArray()
            val iv = ivStr.split(",").map { it.toByte() }.toByteArray()

            val spec = javax.crypto.spec.IvParameterSpec(iv)
            cipher.init(Cipher.DECRYPT_MODE, getKey(), spec)

            val decrypted = cipher.doFinal(encrypted)
            String(decrypted)
        } catch (e: Exception) {
            null
        }
    }

    fun deleteCredential(account: String) {
        val sharedPref = context.getSharedPreferences(
            "blockstop_biometric",
            Context.MODE_PRIVATE
        )

        sharedPref.edit().apply {
            remove("credential_$account")
            remove("iv_$account")
            apply()
        }
    }

    // Status methods
    fun updateBiometricStatus() {
        val available = when (biometricManager.canAuthenticate(Authenticators.BIOMETRIC_STRONG)) {
            BiometricManager.BIOMETRIC_SUCCESS -> true
            else -> false
        }

        val biometricType = if (available) determineBiometricType() else BiometricType.UNAVAILABLE

        _biometricStatusFlow.value = BiometricStatus(
            available = available,
            type = biometricType
        )
    }

    fun isBiometricAvailable(): Boolean = _biometricStatusFlow.value.available

    fun getCurrentBiometricType(): BiometricType = _biometricStatusFlow.value.type

    // Private methods
    private fun determineBiometricType(): BiometricType {
        val canAuthenticateWithFace = biometricManager.canAuthenticate(Authenticators.BIOMETRIC_WEAK) == BiometricManager.BIOMETRIC_SUCCESS
        val canAuthenticateWithFingerprint = biometricManager.canAuthenticate(Authenticators.BIOMETRIC_STRONG) == BiometricManager.BIOMETRIC_SUCCESS

        return when {
            canAuthenticateWithFace -> BiometricType.FACE
            canAuthenticateWithFingerprint -> BiometricType.FINGERPRINT
            else -> BiometricType.UNAVAILABLE
        }
    }

    private fun createCipherKey() {
        try {
            val keyGenerator = KeyGenerator.getInstance(
                KeyProperties.KEY_ALGORITHM_AES,
                "AndroidKeyStore"
            )

            val keyGenParameterSpec = KeyGenParameterSpec.Builder(
                "blockstop_key",
                KeyProperties.PURPOSE_ENCRYPT or KeyProperties.PURPOSE_DECRYPT
            )
                .setBlockModes(KeyProperties.BLOCK_MODE_CBC)
                .setEncryptionPaddings(KeyProperties.ENCRYPTION_PADDING_PKCS7)
                .setUserAuthenticationRequired(true)
                .setUserAuthenticationValidityDurationSeconds(300)
                .build()

            keyGenerator.init(keyGenParameterSpec)
            keyGenerator.generateKey()
        } catch (e: Exception) {
            throw BiometricException("Failed to create cipher key", e)
        }
    }

    private fun getKey(): SecretKey {
        return keyStore.getKey("blockstop_key", null) as SecretKey
    }

    private fun getCipher(): Cipher {
        return Cipher.getInstance(
            "${KeyProperties.KEY_ALGORITHM_AES}/${KeyProperties.BLOCK_MODE_CBC}/${KeyProperties.ENCRYPTION_PADDING_PKCS7}"
        )
    }

    class BiometricException(message: String, cause: Throwable? = null) :
        Exception(message, cause)
}

/**
 * MainThreadExecutor for biometric operations
 */
class MainThreadExecutor : java.util.concurrent.Executor {
    private val handler = android.os.Handler(android.os.Looper.getMainLooper())

    override fun execute(command: Runnable) {
        handler.post(command)
    }
}
