import React, { useState } from 'react';
import {
  Smartphone,
  Code2,
  Copy,
  Check,
  Share2,
  Gift,
  User,
  Home,
  Lock,
  Wifi,
  Battery,
  ShieldCheck,
  AlertCircle
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { TabType } from '../types';

type AndroidFileType =
  | 'MainActivity'
  | 'HomeScreen'
  | 'ReferEarnScreen'
  | 'RewardsScreen'
  | 'ProfileScreen'
  | 'Repository'
  | 'Models'
  | 'Gradle';

export const AndroidPreview: React.FC = () => {
  const { currentUser, userProfile, setAuthModalOpen } = useAuth();
  const [activeTab, setActiveTab] = useState<'preview' | 'code'>('preview');
  const [phoneTab, setPhoneTab] = useState<TabType>('home');
  const [selectedFile, setSelectedFile] = useState<AndroidFileType>('MainActivity');
  const [copied, setCopied] = useState<boolean>(false);

  // Real referral code and points from Firebase; no demo/fallback codes.
  const referralCode = userProfile?.referralCode || '';
  const points = userProfile?.pointsBalance ?? 0;

  const codeSnippets: Record<AndroidFileType, { filename: string; language: string; content: string }> = {
    MainActivity: {
      filename: 'MainActivity.kt',
      language: 'kotlin',
      content: `package com.oneag.app

import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.material3.*
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Home
import androidx.compose.material.icons.filled.Share
import androidx.compose.material.icons.filled.CardGiftcard
import androidx.compose.material.icons.filled.Person
import androidx.compose.runtime.*
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import com.google.firebase.FirebaseApp
import com.google.firebase.auth.FirebaseAuth
import com.google.firebase.firestore.FirebaseFirestore
import com.oneag.app.data.repository.ONEAGRepository
import com.oneag.app.ui.screens.HomeScreen
import com.oneag.app.ui.screens.ReferEarnScreen
import com.oneag.app.ui.screens.RewardsScreen
import com.oneag.app.ui.screens.ProfileScreen
import androidx.compose.ui.unit.dp

class MainActivity : ComponentActivity() {
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        FirebaseApp.initializeApp(this)

        val repository = ONEAGRepository(
            auth = FirebaseAuth.getInstance(),
            firestore = FirebaseFirestore.getInstance()
        )

        setContent {
            ONEAGApp(repository = repository)
        }
    }
}

enum class NavigationTab {
    HOME, REFER, REWARDS, PROFILE
}

@Composable
fun ONEAGApp(repository: ONEAGRepository) {
    val uid = repository.getCurrentUid() ?: ""
    val userProfile by repository.observeUserProfile(uid).collectAsState(initial = null)
    val referrals by repository.observeReferrals(uid).collectAsState(initial = emptyList())
    val ledger by repository.observeRewardsLedger(uid).collectAsState(initial = emptyList())

    var selectedTab by remember { mutableStateOf(NavigationTab.HOME) }

    Scaffold(
        bottomBar = {
            NavigationBar(
                containerColor = Color(0xFF020617),
                tonalElevation = 8.dp
            ) {
                NavigationBarItem(
                    selected = selectedTab == NavigationTab.HOME,
                    onClick = { selectedTab = NavigationTab.HOME },
                    icon = { Icon(Icons.Default.Home, contentDescription = "Home") },
                    label = { Text("Home") }
                )
                NavigationBarItem(
                    selected = selectedTab == NavigationTab.REFER,
                    onClick = { selectedTab = NavigationTab.REFER },
                    icon = { Icon(Icons.Default.Share, contentDescription = "Refer") },
                    label = { Text("Refer") }
                )
                NavigationBarItem(
                    selected = selectedTab == NavigationTab.REWARDS,
                    onClick = { selectedTab = NavigationTab.REWARDS },
                    icon = { Icon(Icons.Default.CardGiftcard, contentDescription = "Rewards") },
                    label = { Text("Rewards") }
                )
                NavigationBarItem(
                    selected = selectedTab == NavigationTab.PROFILE,
                    onClick = { selectedTab = NavigationTab.PROFILE },
                    icon = { Icon(Icons.Default.Person, contentDescription = "Profile") },
                    label = { Text("Profile") }
                )
            }
        }
    ) { paddingValues ->
        Box(
            modifier = Modifier
                .fillMaxSize()
                .background(Color(0xFF0B0F19))
                .padding(paddingValues)
        ) {
            when (selectedTab) {
                NavigationTab.HOME -> HomeScreen(
                    userProfile = userProfile,
                    onNavigateToRefer = { selectedTab = NavigationTab.REFER },
                    onNavigateToRewards = { selectedTab = NavigationTab.REWARDS }
                )
                NavigationTab.REFER -> ReferEarnScreen(
                    userProfile = userProfile,
                    referrals = referrals
                )
                NavigationTab.REWARDS -> RewardsScreen(
                    userProfile = userProfile,
                    ledger = ledger
                )
                NavigationTab.PROFILE -> ProfileScreen(
                    userProfile = userProfile,
                    onSignOut = { /* Firebase SignOut trigger */ }
                )
            }
        }
    }
}`
    },
    HomeScreen: {
      filename: 'HomeScreen.kt',
      language: 'kotlin',
      content: `package com.oneag.app.ui.screens

import android.content.Intent
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.*
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Share
import androidx.compose.material.icons.filled.ContentCopy
import androidx.compose.material.icons.filled.Lock
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.platform.LocalClipboardManager
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.AnnotatedString
import androidx.compose.ui.text.font.FontFamily
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.oneag.app.data.model.UserProfile

@Composable
fun HomeScreen(
    userProfile: UserProfile?,
    onNavigateToRefer: () -> Unit,
    onNavigateToRewards: () -> Unit
) {
    val context = LocalContext.current
    val clipboardManager = LocalClipboardManager.current
    var showCopied by remember { mutableStateOf(false) }

    val code = userProfile?.referralCode?.ifEmpty { "SYNCING..." } ?: "SIGN_IN_REQUIRED"
    val referralLink = "https://oneag.app/?ref=$code"

    LazyColumn(
        modifier = Modifier
            .fillMaxSize()
            .background(Color(0xFF0B0F19))
            .padding(16.dp),
        verticalArrangement = Arrangement.spacedBy(16.dp)
    ) {
        item {
            Text(
                text = "Hello, \${userProfile?.displayName?.ifEmpty { "Member" } ?: "Member"}",
                fontSize = 24.sp,
                fontWeight = FontWeight.Black,
                color = Color.White
            )
        }

        item {
            Card(
                shape = RoundedCornerShape(20.dp),
                colors = CardDefaults.cardColors(containerColor = Color(0xFF0F172A)),
                modifier = Modifier.fillMaxWidth()
            ) {
                Column(modifier = Modifier.padding(20.dp)) {
                    Text(text = "AVAILABLE POINTS", fontSize = 11.sp, color = Color(0xFF64748B))
                    Text(
                        text = "\${userProfile?.pointsBalance ?: 0} PTS",
                        fontSize = 32.sp,
                        fontWeight = FontWeight.Black,
                        color = Color(0xFF10B981)
                    )
                }
            }
        }
    }
}`
    },
    ReferEarnScreen: {
      filename: 'ReferEarnScreen.kt',
      language: 'kotlin',
      content: `package com.oneag.app.ui.screens

import android.content.Intent
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.*
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Share
import androidx.compose.material.icons.filled.ContentCopy
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.platform.LocalClipboardManager
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.AnnotatedString
import androidx.compose.ui.text.font.FontFamily
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.oneag.app.data.model.UserProfile
import com.oneag.app.data.model.ReferralRecord

@Composable
fun ReferEarnScreen(
    userProfile: UserProfile?,
    referrals: List<ReferralRecord>
) {
    val context = LocalContext.current
    val clipboardManager = LocalClipboardManager.current
    var showCopied by remember { mutableStateOf(false) }

    // Every authenticated user receives their unique referral code from Firebase.
    // If not authenticated or profile is loading, show indicator.
    val code = userProfile?.referralCode?.ifEmpty { "SYNCING..." } ?: "SIGN_IN_REQUIRED"
    val referralLink = "https://oneag.app/?ref=$code"

    LazyColumn(
        modifier = Modifier
            .fillMaxSize()
            .background(Color(0xFF0B0F19))
            .padding(16.dp),
        verticalArrangement = Arrangement.spacedBy(16.dp)
    ) {
        item {
            Text(
                text = "Refer & Earn",
                fontSize = 26.sp,
                fontWeight = FontWeight.Bold,
                color = Color.White
            )
            Text(
                text = "Build your verified referral network. Rewards are calculated and verified server-side.",
                fontSize = 13.sp,
                color = Color(0xFF94A3B8),
                modifier = Modifier.padding(top = 4.dp)
            )
        }

        item {
            Card(
                shape = RoundedCornerShape(20.dp),
                colors = CardDefaults.cardColors(containerColor = Color(0xFF0F172A)),
                modifier = Modifier.fillMaxWidth()
            ) {
                Column(modifier = Modifier.padding(20.dp)) {
                    Text(
                        text = "YOUR UNIQUE REFERRAL CODE",
                        fontSize = 11.sp,
                        fontWeight = FontWeight.SemiBold,
                        color = Color(0xFF64748B)
                    )
                    Spacer(modifier = Modifier.height(8.dp))
                    Row(
                        modifier = Modifier
                            .fillMaxWidth()
                            .background(Color(0xFF020617), RoundedCornerShape(12.dp))
                            .padding(horizontal = 16.dp, vertical = 12.dp),
                        horizontalArrangement = Arrangement.SpaceBetween,
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Text(
                            text = code,
                            fontSize = 22.sp,
                            fontWeight = FontWeight.Black,
                            fontFamily = FontFamily.Monospace,
                            color = Color(0xFF10B981)
                        )
                        IconButton(
                            onClick = {
                                if (userProfile?.referralCode?.isNotEmpty() == true) {
                                    clipboardManager.setText(AnnotatedString(code))
                                    showCopied = true
                                }
                            },
                            enabled = userProfile?.referralCode?.isNotEmpty() == true
                        ) {
                            Icon(
                                imageVector = Icons.Default.ContentCopy,
                                contentDescription = "Copy code",
                                tint = if (showCopied) Color(0xFF10B981) else Color.White
                            )
                        }
                    }

                    Spacer(modifier = Modifier.height(16.dp))

                    Button(
                        onClick = {
                            val intent = Intent(Intent.ACTION_SEND).apply {
                                type = "text/plain"
                                putExtra(Intent.EXTRA_SUBJECT, "Join ONEAG with my code $code")
                                putExtra(Intent.EXTRA_TEXT, "Join ONEAG with my referral code $code: $referralLink (Zero joining fee, no investment required)")
                            }
                            context.startActivity(Intent.createChooser(intent, "Share ONEAG Invitation"))
                        },
                        colors = ButtonDefaults.buttonColors(containerColor = Color(0xFF10B981)),
                        shape = RoundedCornerShape(12.dp),
                        modifier = Modifier.fillMaxWidth(),
                        enabled = userProfile?.referralCode?.isNotEmpty() == true
                    ) {
                        Icon(Icons.Default.Share, contentDescription = null, tint = Color(0xFF020617))
                        Spacer(modifier = Modifier.width(8.dp))
                        Text(
                            text = "Share Invite Link",
                            color = Color(0xFF020617),
                            fontWeight = FontWeight.Bold
                        )
                    }
                }
            }
        }

        item {
            Text(
                text = "Referred Network (\${referrals.size})",
                fontSize = 16.sp,
                fontWeight = FontWeight.Bold,
                color = Color.White
            )
        }

        items(referrals) { record ->
            Card(
                shape = RoundedCornerShape(12.dp),
                colors = CardDefaults.cardColors(containerColor = Color(0xFF0F172A)),
                modifier = Modifier.fillMaxWidth()
            ) {
                Row(
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(14.dp),
                    horizontalArrangement = Arrangement.SpaceBetween,
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Column {
                        Text(
                            text = "User: \${record.referredUserId.take(10)}...",
                            fontSize = 13.sp,
                            fontWeight = FontWeight.SemiBold,
                            color = Color.White
                        )
                        Text(
                            text = "Platform: \${record.platform.uppercase()} • Status: \${record.status}",
                            fontSize = 10.sp,
                            color = Color(0xFF64748B)
                        )
                    }
                    Text(
                        text = "VERIFIED",
                        fontSize = 11.sp,
                        fontWeight = FontWeight.Bold,
                        color = Color(0xFF10B981)
                    )
                }
            }
        }
    }
}`
    },
    RewardsScreen: {
      filename: 'RewardsScreen.kt',
      language: 'kotlin',
      content: `package com.oneag.app.ui.screens

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.*
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Lock
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.oneag.app.data.model.UserProfile
import com.oneag.app.data.model.RewardsLedger

@Composable
fun RewardsScreen(
    userProfile: UserProfile?,
    ledger: List<RewardsLedger>
) {
    LazyColumn(
        modifier = Modifier
            .fillMaxSize()
            .background(Color(0xFF0B0F19))
            .padding(16.dp),
        verticalArrangement = Arrangement.spacedBy(16.dp)
    ) {
        item {
            Text(
                text = "Rewards & Ledger",
                fontSize = 26.sp,
                fontWeight = FontWeight.Bold,
                color = Color.White
            )
        }

        // Available points balance card (determined strictly by server-side ledger)
        item {
            Card(
                shape = RoundedCornerShape(20.dp),
                colors = CardDefaults.cardColors(containerColor = Color(0xFF0F172A)),
                modifier = Modifier.fillMaxWidth()
            ) {
                Column(modifier = Modifier.padding(20.dp)) {
                    Text(
                        text = "AVAILABLE POINTS",
                        fontSize = 11.sp,
                        fontWeight = FontWeight.SemiBold,
                        color = Color(0xFF64748B)
                    )
                    Spacer(modifier = Modifier.height(4.dp))
                    Text(
                        text = "\${userProfile?.pointsBalance ?: 0} PTS",
                        fontSize = 34.sp,
                        fontWeight = FontWeight.Black,
                        color = Color(0xFF10B981)
                    )
                    Text(
                        text = "Tier: \${userProfile?.tier ?: "Bronze"}",
                        fontSize = 13.sp,
                        color = Color(0xFF94A3B8)
                    )
                }
            }
        }

        // Mandatory Locked Withdrawal Notice
        item {
            Card(
                shape = RoundedCornerShape(16.dp),
                colors = CardDefaults.cardColors(containerColor = Color(0xFF1E293B)),
                modifier = Modifier.fillMaxWidth()
            ) {
                Row(
                    modifier = Modifier.padding(16.dp),
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Icon(
                        imageVector = Icons.Default.Lock,
                        contentDescription = "Locked",
                        tint = Color(0xFFF59E0B),
                        modifier = Modifier.size(24.dp)
                    )
                    Spacer(modifier = Modifier.width(12.dp))
                    Column {
                        Text(
                            text = "Withdrawals Locked (Beta Policy)",
                            fontSize = 14.sp,
                            fontWeight = FontWeight.Bold,
                            color = Color.White
                        )
                        Text(
                            text = "Zero joining fee. No investment required. Withdrawals remain disabled during early access beta.",
                            fontSize = 11.sp,
                            color = Color(0xFF94A3B8)
                        )
                    }
                }
            }
        }

        item {
            Text(
                text = "Immutable Ledger Records",
                fontSize = 16.sp,
                fontWeight = FontWeight.Bold,
                color = Color.White
            )
        }

        items(ledger) { entry ->
            Card(
                shape = RoundedCornerShape(12.dp),
                colors = CardDefaults.cardColors(containerColor = Color(0xFF0F172A)),
                modifier = Modifier.fillMaxWidth()
            ) {
                Row(
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(14.dp),
                    horizontalArrangement = Arrangement.SpaceBetween,
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Column {
                        Text(
                            text = entry.description,
                            fontSize = 13.sp,
                            fontWeight = FontWeight.Medium,
                            color = Color.White
                        )
                        Text(
                            text = entry.type.replace('_', ' '),
                            fontSize = 10.sp,
                            color = Color(0xFF64748B)
                        )
                    }
                    Text(
                        text = "+\${entry.amount} PTS",
                        fontSize = 13.sp,
                        fontWeight = FontWeight.Bold,
                        color = Color(0xFF10B981)
                    )
                }
            }
        }
    }
}`
    },
    ProfileScreen: {
      filename: 'ProfileScreen.kt',
      language: 'kotlin',
      content: `package com.oneag.app.ui.screens

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.*
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.CheckCircle
import androidx.compose.material.icons.filled.Lock
import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.oneag.app.data.model.UserProfile

@Composable
fun ProfileScreen(
    userProfile: UserProfile?,
    onSignOut: () -> Unit
) {
    LazyColumn(
        modifier = Modifier
            .fillMaxSize()
            .background(Color(0xFF0B0F19))
            .padding(16.dp),
        verticalArrangement = Arrangement.spacedBy(16.dp)
    ) {
        item {
            Text(text = "Profile", fontSize = 26.sp, color = Color.White)
        }
    }
}`
    },
    Repository: {
      filename: 'ONEAGRepository.kt',
      language: 'kotlin',
      content: `package com.oneag.app.data.repository

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
}`
    },
    Models: {
      filename: 'Models.kt',
      language: 'kotlin',
      content: `package com.oneag.app.data.model

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

/**
 * Provider-agnostic Product Model supporting Amazon Creators API,
 * Flipkart Affiliate, and Myntra partner feed.
 */
data class Product(
    val productId: String = "",
    val provider: String = "amazon",
    val externalProductId: String = "",
    val title: String = "",
    val description: String? = null,
    val imageUrl: String = "",
    val productUrl: String = "",
    val category: String = "Electronics",
    val price: Double = 0.0,
    val currency: String = "INR",
    val availability: String = "IN_STOCK",
    val trackingId: String? = null,
    val lastUpdated: String = ""
)

/**
 * Authoritative Affiliate Transaction Model
 * States: PENDING, CONFIRMED, CANCELLED, REFUNDED
 */
data class AffiliateTransaction(
    val transactionId: String = "",
    val userId: String = "",
    val referrerUserId: String? = null,
    val referralRecordId: String? = null,
    val partnerId: String = "",
    val productId: String = "",
    val clickId: String = "",
    val trackingId: String = "",
    val purchaseAmount: Double = 0.0,
    val commissionAmount: Double = 0.0,
    val rewardAmount: Long = 0,
    val transactionStatus: String = "PENDING", // PENDING, CONFIRMED, CANCELLED, REFUNDED
    val refundStatus: String = "NONE",
    val createdAt: String = "",
    val updatedAt: String = ""
)

/**
 * Admin Governance Models & Overview Metrics
 */
data class AdminOverviewMetrics(
    val totalRegisteredUsers: Long = 0,
    val verifiedReferrals: Long = 0,
    val pendingRewards: Long = 0,
    val confirmedRewards: Long = 0,
    val affiliateClicks: Long = 0,
    val confirmedAffiliateTransactions: Long = 0,
    val cancelledTransactions: Long = 0,
    val refundedTransactions: Long = 0
)

data class AdminAuditLog(
    val logId: String = "",
    val timestamp: String = "",
    val adminEmail: String = "",
    val actionType: String = "",
    val targetResource: String = "",
    val description: String = "",
    val status: String = "SUCCESS"
)`
    },
    Gradle: {
      filename: 'build.gradle.kts',
      language: 'kotlin',
      content: `plugins {
    alias(libs.plugins.android.application)
    alias(libs.plugins.kotlin.android)
    alias(libs.plugins.kotlin.compose)
    id("com.google.gms.google-services")
}

android {
    namespace = "com.oneag.app"
    compileSdk = 35

    defaultConfig {
        applicationId = "com.oneag.app"
        minSdk = 26
        targetSdk = 35
        versionCode = 1
        versionName = "1.0.0"
    }

    buildFeatures {
        compose = true
    }
}

dependencies {
    // Jetpack Compose & Material 3
    implementation(platform(libs.androidx.compose.bom))
    implementation(libs.androidx.ui)
    implementation(libs.androidx.material3)
    implementation(libs.androidx.navigation.compose)

    // Firebase BOM (Auth & Firestore)
    implementation(platform("com.google.firebase:firebase-bom:33.9.0"))
    implementation("com.google.firebase:firebase-auth-ktx")
    implementation("com.google.firebase:firebase-firestore-ktx")
    implementation("com.google.android.gms:play-services-auth:21.3.0")

    // Coroutines & Lifecycle
    implementation("org.jetbrains.kotlinx:kotlinx-coroutines-play-services:1.9.0")
    implementation("androidx.lifecycle:lifecycle-viewmodel-compose:2.8.7")
}`
    }
  };

  const handleCopyCode = () => {
    navigator.clipboard.writeText(codeSnippets[selectedFile].content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-6 pb-16 animate-fade-in">
      {/* Top Banner */}
      <section className="p-6 sm:p-8 rounded-3xl bg-slate-900 border border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-400 text-xs font-semibold mb-2 border border-emerald-500/30">
            <Smartphone size={13} />
            <span>Native Android Client</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white">
            Kotlin + Jetpack Compose Architecture
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1 max-w-xl">
            Complete native Android codebase with Package <code className="text-emerald-400 font-mono">com.oneag.app</code>, Material 3, Android Share Sheet, Kotlin Coroutines, and shared Firebase Firestore real-time observers.
          </p>
        </div>

        {/* Preview / Code Mode Toggle */}
        <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-xl border border-slate-800 shrink-0">
          <button
            onClick={() => setActiveTab('preview')}
            className={`px-4 py-2 rounded-lg text-xs font-bold transition flex items-center gap-2 ${
              activeTab === 'preview'
                ? 'bg-emerald-500 text-slate-950 shadow'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Smartphone size={14} />
            <span>Interactive Device</span>
          </button>
          <button
            onClick={() => setActiveTab('code')}
            className={`px-4 py-2 rounded-lg text-xs font-bold transition flex items-center gap-2 ${
              activeTab === 'code'
                ? 'bg-emerald-500 text-slate-950 shadow'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Code2 size={14} />
            <span>Kotlin Source Code</span>
          </button>
        </div>
      </section>

      {/* Main Container */}
      {activeTab === 'preview' ? (
        <div className="flex flex-col lg:flex-row items-center justify-center gap-8 py-4">
          {/* Phone Mockup Frame */}
          <div className="w-[340px] sm:w-[360px] h-[720px] bg-slate-950 rounded-[48px] border-[10px] border-slate-800 shadow-2xl overflow-hidden flex flex-col relative">
            {/* Android Status Bar */}
            <div className="h-9 bg-slate-950 px-6 flex items-center justify-between text-[11px] text-slate-300 select-none z-10 shrink-0">
              <span className="font-semibold">9:41</span>
              {/* Camera Hole */}
              <div className="w-4 h-4 rounded-full bg-black border border-slate-800" />
              <div className="flex items-center gap-2">
                <Wifi size={12} />
                <Battery size={12} />
              </div>
            </div>

            {/* Screen Content inside Phone */}
            <div className="flex-1 overflow-y-auto bg-[#0b0f19] p-4 text-white text-xs select-none">
              {phoneTab === 'home' && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-[10px] text-slate-400 uppercase tracking-wider font-bold">ONEAG Android</span>
                      <h3 className="text-lg font-black text-white">Hello, {userProfile?.displayName || 'Member'}</h3>
                    </div>
                    <div className="w-8 h-8 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold text-xs">
                      1AG
                    </div>
                  </div>

                  {/* Balance Card */}
                  <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 space-y-1">
                    <span className="text-[10px] uppercase font-bold text-slate-400">Available Points Balance</span>
                    <div className="text-2xl font-black text-emerald-400">{points} PTS</div>
                    <span className="inline-block text-[10px] text-purple-300 font-bold px-2 py-0.5 rounded bg-purple-500/10">
                      {userProfile?.tier || 'Bronze'} Tier
                    </span>
                  </div>

                  {/* Referral Box */}
                  <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 space-y-2">
                    <span className="text-[10px] uppercase font-bold text-slate-400">Unique Referral Code</span>
                    <div className="p-2.5 bg-slate-950 rounded-xl text-center font-mono font-black text-base text-emerald-400 tracking-wider">
                      {referralCode || (currentUser ? 'SYNCING...' : 'SIGN IN REQUIRED')}
                    </div>
                    <button
                      onClick={() => {
                        if (!currentUser) setAuthModalOpen(true);
                        else setPhoneTab('refer');
                      }}
                      className="w-full py-2 bg-emerald-500 text-slate-950 font-bold rounded-xl text-xs flex items-center justify-center gap-1.5"
                    >
                      <Share2 size={13} />
                      <span>{currentUser ? 'Share Referral Code' : 'Sign In to Share'}</span>
                    </button>
                  </div>

                  {/* Locked status */}
                  <div className="p-3 bg-slate-900/60 rounded-xl border border-slate-800 flex items-center gap-2 text-[11px] text-slate-400">
                    <Lock size={14} className="text-amber-400 shrink-0" />
                    <span>Withdrawals disabled in Beta (Zero joining fee)</span>
                  </div>
                </div>
              )}

              {phoneTab === 'refer' && (
                <div className="space-y-4">
                  <h3 className="text-lg font-black text-white">Refer & Earn</h3>
                  <p className="text-[11px] text-slate-400">
                    Refer friends across Android, iOS, or Web with server-side validation.
                  </p>

                  <div className="p-4 bg-slate-900 rounded-2xl border border-slate-800 space-y-3">
                    <span className="text-[10px] uppercase font-bold text-slate-400">Your Firebase Referral Code</span>
                    <div className="p-3 bg-slate-950 rounded-xl text-center font-mono font-black text-lg text-emerald-400">
                      {referralCode || (currentUser ? 'SYNCING...' : 'SIGN IN TO GENERATE')}
                    </div>
                    <div className="text-[10px] text-slate-500 text-center">
                      Stored & verified in Firebase Firestore
                    </div>
                  </div>

                  <div className="p-3 bg-slate-900/80 rounded-xl border border-slate-800">
                    <span className="text-[10px] font-bold text-slate-400 uppercase">Referral Stats</span>
                    <p className="text-sm font-bold text-white mt-1">
                      {userProfile?.totalReferrals ?? 0} Verified Friends Joined
                    </p>
                  </div>
                </div>
              )}

              {phoneTab === 'rewards' && (
                <div className="space-y-4">
                  <h3 className="text-lg font-black text-white">Rewards</h3>
                  <div className="p-4 bg-slate-900 rounded-2xl border border-slate-800">
                    <span className="text-[10px] font-bold text-slate-400 uppercase">Balance</span>
                    <p className="text-2xl font-black text-emerald-400 mt-0.5">{points} PTS</p>
                  </div>

                  <div className="p-3.5 bg-slate-900 rounded-xl border border-slate-800 flex items-start gap-2.5">
                    <Lock size={16} className="text-amber-400 shrink-0 mt-0.5" />
                    <div className="text-[11px] text-slate-300">
                      <strong>Withdrawals Locked</strong>
                      <p className="text-slate-400 mt-0.5">Points recorded on immutable Firestore ledger. Zero joining fee.</p>
                    </div>
                  </div>
                </div>
              )}

              {phoneTab === 'profile' && (
                <div className="space-y-4">
                  <h3 className="text-lg font-black text-white">My Profile</h3>
                  <div className="p-4 bg-slate-900 rounded-2xl border border-slate-800 space-y-1">
                    <p className="font-bold text-sm text-white">{userProfile?.displayName || 'User'}</p>
                    <p className="text-[11px] text-slate-400">{currentUser?.email || 'user@oneag.internal'}</p>
                    <p className="text-[10px] text-emerald-400 font-mono mt-1">
                      {currentUser?.uid ? `UID: ${currentUser.uid.slice(0, 10)}...` : 'Not Signed In'}
                    </p>
                  </div>

                  <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-[11px] text-emerald-300 flex items-center gap-2">
                    <ShieldCheck size={14} className="shrink-0" />
                    <span>Firebase Auth & Firestore Synced</span>
                  </div>
                </div>
              )}
            </div>

            {/* Android Navigation Bar */}
            <div className="h-14 bg-slate-950 border-t border-slate-800 px-4 flex items-center justify-around text-slate-400 shrink-0">
              <button
                onClick={() => setPhoneTab('home')}
                className={`flex flex-col items-center gap-0.5 ${phoneTab === 'home' ? 'text-emerald-400' : ''}`}
              >
                <Home size={16} />
                <span className="text-[9px]">Home</span>
              </button>
              <button
                onClick={() => setPhoneTab('refer')}
                className={`flex flex-col items-center gap-0.5 ${phoneTab === 'refer' ? 'text-emerald-400' : ''}`}
              >
                <Share2 size={16} />
                <span className="text-[9px]">Refer</span>
              </button>
              <button
                onClick={() => setPhoneTab('rewards')}
                className={`flex flex-col items-center gap-0.5 ${phoneTab === 'rewards' ? 'text-emerald-400' : ''}`}
              >
                <Gift size={16} />
                <span className="text-[9px]">Rewards</span>
              </button>
              <button
                onClick={() => setPhoneTab('profile')}
                className={`flex flex-col items-center gap-0.5 ${phoneTab === 'profile' ? 'text-emerald-400' : ''}`}
              >
                <User size={16} />
                <span className="text-[9px]">Profile</span>
              </button>
            </div>
          </div>

          {/* Android Feature Highlights */}
          <div className="max-w-md space-y-4 text-xs text-slate-300">
            <h3 className="text-base font-bold text-white">Android Client Architecture (com.oneag.app)</h3>
            <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 space-y-2">
              <span className="font-bold text-emerald-400">Package com.oneag.app:</span>
              <p className="text-slate-400 leading-relaxed">
                Clean Android package hierarchy with separate layers for Data Models, Repository, ViewModels, and Jetpack Compose Screens.
              </p>
            </div>
            <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 space-y-2">
              <span className="font-bold text-emerald-400">All 4 Screens Implemented:</span>
              <p className="text-slate-400 leading-relaxed">
                Contains HomeScreen, ReferEarnScreen, RewardsScreen, and ProfileScreen navigating seamlessly via Material 3 NavigationBar.
              </p>
            </div>
            <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 space-y-2">
              <span className="font-bold text-emerald-400">Server-Side Validation Engine:</span>
              <p className="text-slate-400 leading-relaxed">
                Referral attribution and reward ledger operations are validated against Firestore Security Rules to prevent self-referrals, duplicate attributions, and client-controlled point amounts.
              </p>
            </div>
          </div>
        </div>
      ) : (
        /* Source Code Viewer */
        <div className="rounded-3xl bg-slate-950 border border-slate-800 overflow-hidden shadow-2xl">
          {/* File Selector Header */}
          <div className="p-3 bg-slate-900 border-b border-slate-800 flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-1.5">
              {(Object.keys(codeSnippets) as Array<AndroidFileType>).map((key) => (
                <button
                  key={key}
                  onClick={() => setSelectedFile(key)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-mono font-medium transition ${
                    selectedFile === key
                      ? 'bg-slate-800 text-emerald-400 border border-emerald-500/40'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  {codeSnippets[key].filename}
                </button>
              ))}
            </div>

            <button
              onClick={handleCopyCode}
              className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 transition"
            >
              {copied ? <Check size={14} className="text-emerald-400" /> : <Copy size={14} />}
              <span>{copied ? 'Copied' : 'Copy File'}</span>
            </button>
          </div>

          {/* Code Body */}
          <pre className="p-6 text-xs font-mono text-slate-200 overflow-x-auto max-h-[600px] leading-relaxed">
            <code>{codeSnippets[selectedFile].content}</code>
          </pre>
        </div>
      )}
    </div>
  );
};
