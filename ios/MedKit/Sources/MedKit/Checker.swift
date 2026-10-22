import Foundation

public let medKitDisclaimer =
    "MedPass is an organizer and conversation starter, not medical advice. "
    + "Always confirm with your pharmacist or doctor before starting, stopping, or combining medicines."

/// Finds documented interaction warnings. Port of packages/core/src/matcher.ts.
/// Names it cannot identify are reported, never silently ignored.
public struct Checker: Sendable {
    public let dataset: Dataset
    private let index: [String: Drug]
    private let classMembers: [String: Set<String>]

    public init(dataset: Dataset) {
        self.dataset = dataset
        var idx: [String: Drug] = [:]
        for drug in dataset.drugs {
            idx[normalizeName(drug.id)] = drug
            idx[normalizeName(drug.name)] = drug
            for alias in drug.aliases { idx[normalizeName(alias)] = drug }
        }
        index = idx
        var members: [String: Set<String>] = [:]
        for cls in dataset.classes { members[cls.id] = Set(cls.members) }
        classMembers = members
    }

    // MARK: Name resolution

    /// Exact matches only: a wrong guess could hide a real interaction.
    public func resolveDrug(_ input: String) -> Drug? {
        let normalized = normalizeName(input)
        guard !normalized.isEmpty else { return nil }
        if let direct = index[normalized] { return direct }
        var found: [String: Drug] = [:]
        for word in normalized.split(separator: " ") {
            if let hit = index[String(word)] { found[hit.id] = hit }
        }
        return found.count == 1 ? found.values.first : nil
    }

    /// Near-miss suggestions for typos. Suggestions only: never used to run a check automatically.
    public func suggestDrugs(_ input: String, limit: Int = 3) -> [Drug] {
        let normalized = normalizeName(input)
        guard normalized.count >= 4 else { return [] }
        let threshold = normalized.count >= 8 ? 2 : 1
        var scored: [(drug: Drug, score: Int)] = []
        for drug in dataset.drugs {
            let names = ([drug.id, drug.name] + drug.aliases).map(normalizeName)
            let best = names.map { editDistance(normalized, $0) }.min() ?? Int.max
            if best > 0 && best <= threshold { scored.append((drug, best)) }
        }
        return scored.sorted { $0.score < $1.score }.prefix(limit).map { $0.drug }
    }

    // MARK: Checks

    /// Check a NEW medicine against the patient's current list.
    public func checkNewMedication(current: [String], new newMed: String) -> CheckReport {
        var unrecognized: [String] = []
        let candidate = resolveDrug(newMed)
        if candidate == nil { unrecognized.append(newMed) }

        var existing: [Drug] = []
        for name in current {
            if let drug = resolveDrug(name) { existing.append(drug) } else { unrecognized.append(name) }
        }

        var findings: [Finding] = []
        if let candidate {
            for drug in existing {
                for interaction in dataset.interactions where interactionBetween(interaction, drug, candidate) {
                    findings.append(Finding(interaction: interaction, drugA: drug, drugB: candidate))
                }
            }
        }
        return report(findings, unrecognized)
    }

    /// Check every pair on a medication list.
    public func checkMedicationList(_ meds: [String]) -> CheckReport {
        var unrecognized: [String] = []
        var resolved: [Drug] = []
        for name in meds {
            if let drug = resolveDrug(name) {
                if !resolved.contains(where: { $0.id == drug.id }) { resolved.append(drug) }
            } else {
                unrecognized.append(name)
            }
        }

        var findings: [Finding] = []
        for i in resolved.indices {
            for j in resolved.indices where j > i {
                for interaction in dataset.interactions where interactionBetween(interaction, resolved[i], resolved[j]) {
                    findings.append(Finding(interaction: interaction, drugA: resolved[i], drugB: resolved[j]))
                }
            }
        }
        return report(findings, unrecognized)
    }

    /// Does a medicine about to be taken match something on the patient's own avoid list?
    /// Brand and generic names count as the same drug. Related drugs are not inferred.
    public func matchesAvoidEntry(newMed: String, avoidName: String) -> Bool {
        let a = resolveDrug(newMed)
        let b = resolveDrug(avoidName)
        if let a, let b { return a.id == b.id }
        if a != nil || b != nil { return false }
        let n = normalizeName(newMed)
        return !n.isEmpty && n == normalizeName(avoidName)
    }

    // MARK: Private

    private func matches(_ side: String, _ drug: Drug) -> Bool {
        if side.hasPrefix("class:") {
            return classMembers[String(side.dropFirst("class:".count))]?.contains(drug.id) ?? false
        }
        return side == drug.id
    }

    private func interactionBetween(_ interaction: Interaction, _ x: Drug, _ y: Drug) -> Bool {
        if x.id == y.id { return false }
        return (matches(interaction.a, x) && matches(interaction.b, y))
            || (matches(interaction.a, y) && matches(interaction.b, x))
    }

    private func report(_ findings: [Finding], _ unrecognized: [String]) -> CheckReport {
        // Most serious first; ties keep dataset order.
        let ordered = findings.enumerated().sorted { l, r in
            if l.element.interaction.severity != r.element.interaction.severity {
                return l.element.interaction.severity < r.element.interaction.severity
            }
            return l.offset < r.offset
        }.map { $0.element }

        let statement: String
        if !ordered.isEmpty {
            statement = "Found \(ordered.count) known interaction warning\(ordered.count == 1 ? "" : "s") in our sources."
        } else {
            let unchecked = unrecognized.isEmpty
                ? ""
                : " We could not identify: \(unrecognized.joined(separator: ", ")), so \(unrecognized.count == 1 ? "it was" : "they were") not checked."
            statement = "No known conflict found in our sources. This does not mean the combination is safe: "
                + "our list is a small starter set and is not exhaustive." + unchecked
        }
        return CheckReport(
            findings: ordered,
            unrecognized: unrecognized,
            statement: statement,
            disclaimer: medKitDisclaimer
        )
    }
}
