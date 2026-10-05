// swift-tools-version: 5.9
// The swift-tools-version declares the minimum version of Swift required to build this package.

import PackageDescription

let package = Package(
    name: "ONEAG",
    platforms: [
        .iOS(.v16),
        .macOS(.v13)
    ],
    products: [
        .library(
            name: "ONEAG",
            targets: ["ONEAG"]
        ),
    ],
    dependencies: [
        // Standard dependencies (Firebase iOS SDK can be linked when provisioning target)
    ],
    targets: [
        .target(
            name: "ONEAG",
            dependencies: [],
            path: "ONEAG"
        ),
        .testTarget(
            name: "ONEAGTests",
            dependencies: ["ONEAG"],
            path: "Tests/ONEAGTests"
        ),
    ]
)
