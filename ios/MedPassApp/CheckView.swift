import MedKit
import SwiftUI

private struct CheckResult {
    let checked: String
    let report: CheckReport
    let avoidHits: [AvoidItem]
}

struct CheckView: View {
    @Environment(AppStore.self) private var store
    @State private var candidate = ""
    @State private var result: CheckResult?

    var body: some View {
        NavigationStack {
            Form {
                Section {
                    DrugNameField(title: "New medicine", text: $candidate)
                    Button("Check against my list", action: run)
                        .disabled(candidate.trimmingCharacters(in: .whitespaces).isEmpty)
                } header: {
                    Text("Before I take something new")
                } footer: {
                    Text("A doctor, dentist, or pharmacist offers you a new medicine. Type it here to compare it with your list.")
                }

                if let result {
                    Section("Result for \(result.checked)") {
                        ForEach(result.avoidHits) { hit in
                            VStack(alignment: .leading, spacing: 6) {
                                Label("On your avoid list", systemImage: "nosign")
                                    .font(.subheadline.weight(.bold))
                                    .foregroundStyle(Color(hex: "#B4235A"))
                                Text(hit.name).font(.headline)
                                Text(hit.reason.isEmpty ? "You noted this medicine to avoid." : hit.reason)
                                Text("**What to do:** Tell the person offering it, and ask for an alternative.")
                            }
                        }
                        ReportView(report: result.report)
                    }
                    Section {
                        Text(medKitDisclaimer).font(.footnote).foregroundStyle(.secondary)
                    }
                }
            }
            .navigationTitle("Check")
        }
    }

    private func run() {
        let name = candidate.trimmingCharacters(in: .whitespaces)
        guard !name.isEmpty else { return }
        result = CheckResult(
            checked: name,
            report: store.checker.checkNewMedication(current: store.medNames, new: name),
            avoidHits: store.avoid.filter { store.checker.matchesAvoidEntry(newMed: name, avoidName: $0.name) }
        )
    }
}
