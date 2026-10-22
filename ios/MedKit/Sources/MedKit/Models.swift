import Foundation

/// How serious a documented interaction warning is.
/// `avoid`: the label says not to combine. `major`: serious risk, ask first.
/// `monitor`: the label advises monitoring or checking with a clinician.
public enum Severity: String, Codable, Sendable, Comparable {
    case avoid, major, monitor

    private var rank: Int {
        switch self {
        case .avoid: return 0
        case .major: return 1
        case .monitor: return 2
        }
    }

    public static func < (lhs: Severity, rhs: Severity) -> Bool {
        lhs.rank < rhs.rank
    }

    public var label: String {
        switch self {
        case .avoid: return "Do not combine"
        case .major: return "Serious caution"
        case .monitor: return "Ask before combining"
        }
    }
}

public struct DrugClass: Codable, Sendable, Hashable {
    public let id: String
    public let name: String
    public let members: [String]
}

public struct Drug: Codable, Sendable, Hashable, Identifiable {
    public let id: String
    public let name: String
    public let aliases: [String]
}

public struct Source: Codable, Sendable, Hashable {
    public let title: String
    public let section: String
    public let url: String
    public let note: String?
    public let retrievedOn: String
}

public struct Interaction: Codable, Sendable, Hashable, Identifiable {
    public let id: String
    /// A drug id, or "class:<classId>".
    public let a: String
    /// A drug id, or "class:<classId>".
    public let b: String
    public let severity: Severity
    public let summary: String
    public let why: String
    public let action: String
    public let source: Source
}

public struct DatasetMeta: Codable, Sendable, Hashable {
    public let version: String
    public let reviewedOn: String
    public let scope: String
}

public struct Dataset: Codable, Sendable {
    public let meta: DatasetMeta
    public let classes: [DrugClass]
    public let drugs: [Drug]
    public let interactions: [Interaction]

    public static let empty = Dataset(
        meta: DatasetMeta(version: "0", reviewedOn: "", scope: ""),
        classes: [], drugs: [], interactions: []
    )

    /// Load the dataset bundled with this package (a copy of data/interactions.json).
    public static func bundled() throws -> Dataset {
        guard let url = Bundle.module.url(forResource: "interactions", withExtension: "json") else {
            throw CocoaError(.fileNoSuchFile)
        }
        return try JSONDecoder().decode(Dataset.self, from: Data(contentsOf: url))
    }
}

public struct Finding: Sendable, Identifiable {
    public let interaction: Interaction
    /// The drug on the patient's list (or the first drug in a pair check).
    public let drugA: Drug
    /// The drug being checked against it.
    public let drugB: Drug

    public var id: String { "\(interaction.id)-\(drugA.id)-\(drugB.id)" }
}

public struct CheckReport: Sendable {
    public let findings: [Finding]
    /// Names that could not be identified, so they were NOT checked.
    public let unrecognized: [String]
    /// Never says a combination is safe.
    public let statement: String
    public let disclaimer: String
}
