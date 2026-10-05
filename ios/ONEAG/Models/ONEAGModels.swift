import Foundation

public struct UserProfile: Codable, Identifiable {
    public var id: String { uid }
    public let uid: String
    public let email: String
    public let displayName: String
    public let photoURL: String?
    public let referralCode: String
    public let referredBy: String?
    public let referredByUid: String?
    public let pointsBalance: Int
    public let tier: String
    public let totalReferrals: Int
    public let withdrawalStatus: String
    public let createdAt: String
    public let updatedAt: String
}

/**
 * Secure Referral Ledger Model adhering to production specification
 */
public struct ReferralRecord: Codable, Identifiable {
    public var id: String { "\(referrerUserId)_\(referredUserId)" }
    public let referrerUserId: String
    public let referredUserId: String
    public let referralCode: String
    public let platform: String
    public let status: String
    public let createdAt: String
    public let verifiedAt: String
    public let rewardLedgerId: String
}

public struct RewardsLedger: Codable, Identifiable {
    public let id: String
    public let userId: String
    public let amount: Int
    public let type: String
    public let description: String
    public let status: String
    public let createdAt: String
}
