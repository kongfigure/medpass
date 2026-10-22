import MedKit
import SwiftUI

/// Severity is shown with a text label AND a distinct symbol, never color alone.
private func symbol(for severity: Severity) -> String {
    switch severity {
    case .avoid: return "nosign"
    case .major: return "exclamationmark.triangle.fill"
    case .monitor: return "info.circle.fill"
    }
}

private func tint(for severity: Severity) -> Color {
    switch severity {
    case .avoid: return Color(hex: "#B4235A")
    case .major: return Color(hex: "#8F4B00")
    case .monitor: return Color(hex: "#1D5FA8")
    }
}

struct FindingRow: View {
    let finding: Finding

    var body: some View {
        let i = finding.interaction
        VStack(alignment: .leading, spacing: 8) {
            Label(i.severity.label, systemImage: symbol(for: i.severity))
                .font(.subheadline.weight(.bold))
                .foregroundStyle(tint(for: i.severity))
            Text("\(finding.drugA.name) and \(finding.drugB.name)")
                .font(.headline)
            Text(i.summary).fontWeight(.semibold)
            Text(i.why)
            Text("**What to do:** \(i.action)")
            if let url = URL(string: i.source.url) {
                Link("Source: \(i.source.title), \(i.source.section). Checked \(i.source.retrievedOn).", destination: url)
                    .font(.footnote)
            }
            if let note = i.source.note {
                Text(note).font(.footnote).foregroundStyle(.secondary)
            }
        }
        .padding(.vertical, 6)
        .accessibilityElement(children: .contain)
    }
}

struct ReportView: View {
    let report: CheckReport

    var body: some View {
        Text(report.statement).fontWeight(.semibold)
        if !report.unrecognized.isEmpty && !report.findings.isEmpty {
            Text("Not checked, because we could not identify: \(report.unrecognized.joined(separator: ", ")).")
                .foregroundStyle(.secondary)
        }
        ForEach(report.findings) { FindingRow(finding: $0) }
    }
}
