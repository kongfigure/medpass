// swift-tools-version: 5.9
import PackageDescription

let package = Package(
    name: "MedKit",
    platforms: [.iOS(.v17), .macOS(.v14)],
    products: [
        .library(name: "MedKit", targets: ["MedKit"]),
    ],
    targets: [
        .target(
            name: "MedKit",
            resources: [.copy("Resources/interactions.json")]
        ),
        .testTarget(
            name: "MedKitTests",
            dependencies: ["MedKit"]
        ),
    ]
)
