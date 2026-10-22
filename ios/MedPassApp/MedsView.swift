import MedKit
import SwiftUI

struct MedsView: View {
    @Environment(AppStore.self) private var store
    @State private var showAddMed = false
    @State private var showAddAvoid = false

    var body: some View {
        NavigationStack {
            List {
                Section("My medicines") {
                    if store.meds.isEmpty {
                        Text("Nothing here yet. Add the medicines you take now, including ones from past surgeries or other clinics.")
                            .foregroundStyle(.secondary)
                    }
                    ForEach(store.meds) { med in
                        VStack(alignment: .leading, spacing: 2) {
                            Text(med.name).font(.headline)
                            if !med.dose.isEmpty { Text(med.dose) }
                            let extra = [med.prescriber.isEmpty ? nil : "Prescribed by \(med.prescriber)",
                                         med.notes.isEmpty ? nil : med.notes].compactMap { $0 }
                            if !extra.isEmpty {
                                Text(extra.joined(separator: ". ")).font(.footnote).foregroundStyle(.secondary)
                            }
                        }
                    }
                    .onDelete { offsets in
                        store.meds.remove(atOffsets: offsets)
                        store.save()
                    }
                }

                if store.meds.count > 1 {
                    Section("Checks on my list") {
                        ReportView(report: store.checker.checkMedicationList(store.medNames))
                    }
                }

                Section {
                    if store.avoid.isEmpty {
                        Text("Write down anything that caused you or your family trouble, and why.")
                            .foregroundStyle(.secondary)
                    }
                    ForEach(store.avoid) { item in
                        VStack(alignment: .leading, spacing: 2) {
                            Text(item.name).font(.headline)
                            if !item.reason.isEmpty { Text(item.reason).foregroundStyle(.secondary) }
                        }
                    }
                    .onDelete { offsets in
                        store.avoid.remove(atOffsets: offsets)
                        store.save()
                    }
                } header: {
                    Text("Medicines to avoid")
                } footer: {
                    Text("MedPass is an organizer, not medical advice. Confirm every medicine decision with your doctor or pharmacist.")
                }
            }
            .navigationTitle("MedPass")
            .toolbar {
                ToolbarItem(placement: .primaryAction) {
                    Menu {
                        Button("Add a medicine") { showAddMed = true }
                        Button("Add one to avoid") { showAddAvoid = true }
                    } label: {
                        Label("Add", systemImage: "plus")
                    }
                }
            }
            .sheet(isPresented: $showAddMed) { AddMedSheet() }
            .sheet(isPresented: $showAddAvoid) { AddAvoidSheet() }
        }
    }
}

/// Shows whether a typed name is recognized, offers typo suggestions, and never guesses silently.
struct DrugNameField: View {
    @Environment(AppStore.self) private var store
    let title: String
    @Binding var text: String

    var body: some View {
        let trimmed = text.trimmingCharacters(in: .whitespaces)
        let drug = trimmed.isEmpty ? nil : store.checker.resolveDrug(trimmed)
        let suggestions = (trimmed.isEmpty || drug != nil) ? [] : store.checker.suggestDrugs(trimmed)

        TextField(title, text: $text)
            .textInputAutocapitalization(.words)
            .autocorrectionDisabled()
        if let drug {
            Text("Recognized as \(drug.name). It can be checked.").font(.footnote).foregroundStyle(.green)
        } else if !suggestions.isEmpty {
            HStack {
                Text("Did you mean").font(.footnote)
                ForEach(suggestions) { s in
                    Button(s.name) { text = s.name }.font(.footnote).buttonStyle(.bordered)
                }
            }
        } else if !trimmed.isEmpty {
            Text("Not in our starter list, so it can be saved but not checked for interactions.")
                .font(.footnote).foregroundStyle(.secondary)
        }
    }
}

struct AddMedSheet: View {
    @Environment(AppStore.self) private var store
    @Environment(\.dismiss) private var dismiss
    @State private var name = ""
    @State private var dose = ""
    @State private var prescriber = ""
    @State private var notes = ""

    var body: some View {
        NavigationStack {
            Form {
                Section { DrugNameField(title: "Medicine name", text: $name) }
                Section {
                    TextField("Dose and how often", text: $dose)
                    TextField("Prescribed by", text: $prescriber)
                    TextField("Notes", text: $notes)
                }
            }
            .navigationTitle("Add a medicine")
            .toolbar {
                ToolbarItem(placement: .cancellationAction) { Button("Cancel") { dismiss() } }
                ToolbarItem(placement: .confirmationAction) {
                    Button("Add") {
                        store.meds.append(Med(name: name.trimmingCharacters(in: .whitespaces), dose: dose, prescriber: prescriber, notes: notes))
                        store.save()
                        dismiss()
                    }
                    .disabled(name.trimmingCharacters(in: .whitespaces).isEmpty)
                }
            }
        }
    }
}

struct AddAvoidSheet: View {
    @Environment(AppStore.self) private var store
    @Environment(\.dismiss) private var dismiss
    @State private var name = ""
    @State private var reason = ""

    var body: some View {
        NavigationStack {
            Form {
                Section { DrugNameField(title: "Medicine name", text: $name) }
                Section { TextField("What happened", text: $reason, axis: .vertical) }
            }
            .navigationTitle("Add one to avoid")
            .toolbar {
                ToolbarItem(placement: .cancellationAction) { Button("Cancel") { dismiss() } }
                ToolbarItem(placement: .confirmationAction) {
                    Button("Add") {
                        store.avoid.append(AvoidItem(name: name.trimmingCharacters(in: .whitespaces), reason: reason))
                        store.save()
                        dismiss()
                    }
                    .disabled(name.trimmingCharacters(in: .whitespaces).isEmpty)
                }
            }
        }
    }
}
