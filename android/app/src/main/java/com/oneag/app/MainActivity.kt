package com.oneag.app

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
                    label = { Text("Home") },
                    colors = NavigationBarItemDefaults.colors(
                        selectedIconColor = Color(0xFF10B981),
                        selectedTextColor = Color(0xFF10B981),
                        unselectedIconColor = Color(0xFF64748B),
                        unselectedTextColor = Color(0xFF64748B),
                        indicatorColor = Color(0x2610B981)
                    )
                )
                NavigationBarItem(
                    selected = selectedTab == NavigationTab.REFER,
                    onClick = { selectedTab = NavigationTab.REFER },
                    icon = { Icon(Icons.Default.Share, contentDescription = "Refer") },
                    label = { Text("Refer") },
                    colors = NavigationBarItemDefaults.colors(
                        selectedIconColor = Color(0xFF10B981),
                        selectedTextColor = Color(0xFF10B981),
                        unselectedIconColor = Color(0xFF64748B),
                        unselectedTextColor = Color(0xFF64748B),
                        indicatorColor = Color(0x2610B981)
                    )
                )
                NavigationBarItem(
                    selected = selectedTab == NavigationTab.REWARDS,
                    onClick = { selectedTab = NavigationTab.REWARDS },
                    icon = { Icon(Icons.Default.CardGiftcard, contentDescription = "Rewards") },
                    label = { Text("Rewards") },
                    colors = NavigationBarItemDefaults.colors(
                        selectedIconColor = Color(0xFF10B981),
                        selectedTextColor = Color(0xFF10B981),
                        unselectedIconColor = Color(0xFF64748B),
                        unselectedTextColor = Color(0xFF64748B),
                        indicatorColor = Color(0x2610B981)
                    )
                )
                NavigationBarItem(
                    selected = selectedTab == NavigationTab.PROFILE,
                    onClick = { selectedTab = NavigationTab.PROFILE },
                    icon = { Icon(Icons.Default.Person, contentDescription = "Profile") },
                    label = { Text("Profile") },
                    colors = NavigationBarItemDefaults.colors(
                        selectedIconColor = Color(0xFF10B981),
                        selectedTextColor = Color(0xFF10B981),
                        unselectedIconColor = Color(0xFF64748B),
                        unselectedTextColor = Color(0xFF64748B),
                        indicatorColor = Color(0x2610B981)
                    )
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
}
