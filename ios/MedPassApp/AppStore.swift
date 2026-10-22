import Foundation
import MedKit
import Observation
import SwiftUI

struct Med: Identifiable, Codable, Hashable {
    var id = UUID()
    var name: String
    var dose: String = ""
    var prescriber: String = ""
    var notes: String = ""
}

struct AvoidItem: Identifiable, Codable, Hashable {
    var id = UUID()
    var name: String
    var reason: String = ""
}

struct BuddyConfig: Codable, Equatable {
    var name = "Mochi"
    var colorHex = "#B9A8FF"
    var accessories: [String] = []
}

private struct SavedState: Codable {
    var owner: String
    var meds: [Med]
    var avoid: [AvoidItem]
    var buddy: BuddyConfig
}

/// All data stays on the device, in a JSON file in Application Support. No account, no network.
/// Views call `save()` after changing anything.
@Observable
final class AppStore {
    var owner = ""
    var meds: [Med] = []
    var avoid: [AvoidItem] = []
    var buddy = BuddyConfig()

    let checker: Checker
    @ObservationIgnored private let fileURL: URL

    init() {
        checker = Checker(dataset: (try? Dataset.bundled()) ?? .empty)
        let dir = FileManager.default.urls(for: .applicationSupportDirectory, in: .userDomainMask)[0]
        try? FileManager.default.createDirectory(at: dir, withIntermediateDirectories: true)
        fileURL = dir.appendingPathComponent("medpass.json")
        if let data = try? Data(contentsOf: fileURL),
           let saved = try? JSONDecoder().decode(SavedState.self, from: data) {
            owner = saved.owner
            meds = saved.meds
            avoid = saved.avoid
            buddy = saved.buddy
        }
    }

    func save() {
        let state = SavedState(owner: owner, meds: meds, avoid: avoid, buddy: buddy)
        guard let data = try? JSONEncoder().encode(state) else { return }
        try? data.write(to: fileURL, options: [.atomic, .completeFileProtection])
    }

    var medNames: [String] { meds.map(\.name) }
}

extension Color {
    /// "#RRGGBB"
    init(hex: String) {
        let cleaned = hex.trimmingCharacters(in: CharacterSet(charactersIn: "#"))
        var value: UInt64 = 0
        Scanner(string: cleaned).scanHexInt64(&value)
        self.init(
            red: Double((value >> 16) & 0xFF) / 255,
            green: Double((value >> 8) & 0xFF) / 255,
            blue: Double(value & 0xFF) / 255
        )
    }
}
