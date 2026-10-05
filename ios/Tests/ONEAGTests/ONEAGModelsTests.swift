import XCTest
@testable import ONEAG

final class ONEAGModelsTests: XCTestCase {
    
    func testUserProfile_DefaultWithdrawalStatus_IsLocked() throws {
        let json = """
        {
            "uid": "usr_ios_001",
            "email": "ios.user@example.com",
            "displayName": "iOS User",
            "photoURL": null,
            "referralCode": "ONEAGIOS",
            "referredBy": null,
            "referredByUid": null,
            "pointsBalance": 0,
            "tier": "Bronze",
            "totalReferrals": 0,
            "withdrawalStatus": "LOCKED",
            "createdAt": "2026-09-26T12:00:00Z",
            "updatedAt": "2026-09-26T12:00:00Z"
        }
        """.data(using: .utf8)!
        
        let decoder = JSONDecoder()
        let profile = try decoder.decode(UserProfile.self, from: json)
        
        XCTAssertEqual(profile.uid, "usr_ios_001")
        XCTAssertEqual(profile.withdrawalStatus, "LOCKED")
        XCTAssertEqual(profile.pointsBalance, 0)
    }
    
    func testReferralRecord_Serialization() throws {
        let record = ReferralRecord(
            referrerUserId: "usr_ref_1",
            referredUserId: "usr_ref_2",
            referralCode = "ONEAG99",
            platform: "ios",
            status: "VERIFIED",
            createdAt: "2026-09-26T12:00:00Z",
            verifiedAt: "2026-09-26T12:00:00Z",
            rewardLedgerId: "ledg_001"
        )
        
        XCTAssertEqual(record.id, "usr_ref_1_usr_ref_2")
        XCTAssertEqual(record.platform, "ios")
        XCTAssertEqual(record.status, "VERIFIED")
    }
    
    func testRewardsLedger_Decodable() throws {
        let json = """
        {
            "id": "ledg_ios_99",
            "userId": "usr_ios_001",
            "amount": 250,
            "type": "PURCHASE_REWARD",
            "description": "Cashback points",
            "status": "CREDITED",
            "createdAt": "2026-09-26T12:00:00Z"
        }
        """.data(using: .utf8)!
        
        let ledger = try JSONDecoder().decode(RewardsLedger.self, from: json)
        XCTAssertEqual(ledger.id, "ledg_ios_99")
        XCTAssertEqual(ledger.amount, 250)
        XCTAssertEqual(ledger.status, "CREDITED")
    }
}
