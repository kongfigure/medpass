import SwiftUI

let buddyColors: [(hex: String, name: String)] = [
    ("#B9A8FF", "Lavender"), ("#FFB3C7", "Strawberry milk"), ("#9BE3C8", "Mint"), ("#FFD27A", "Butter"),
    ("#8FC9FF", "Sky"), ("#FFB08A", "Peach"), ("#E9E4F5", "Cloud"), ("#C7E58A", "Pistachio"),
]

let buddyAccessories: [(id: String, name: String)] = [
    ("bow", "Bow"), ("glasses", "Round glasses"), ("beanie", "Beanie"), ("sprout", "Leaf sprout"), ("scarf", "Scarf"),
]

struct BuddyView: View {
    @Environment(AppStore.self) private var store

    var body: some View {
        @Bindable var store = store
        NavigationStack {
            Form {
                Section {
                    BlobView(config: store.buddy)
                        .frame(maxWidth: .infinity)
                        .frame(height: 220)
                    TextField("Name", text: $store.buddy.name)
                        .onChange(of: store.buddy) { store.save() }
                }
                Section("Color") {
                    LazyVGrid(columns: [GridItem(.adaptive(minimum: 52))], spacing: 12) {
                        ForEach(buddyColors, id: \.hex) { option in
                            Button {
                                store.buddy.colorHex = option.hex
                            } label: {
                                Circle()
                                    .fill(Color(hex: option.hex))
                                    .frame(width: 44, height: 44)
                                    .overlay(Circle().stroke(Color.primary, lineWidth: store.buddy.colorHex == option.hex ? 3 : 0))
                            }
                            .buttonStyle(.plain)
                            .accessibilityLabel(option.name)
                            .accessibilityAddTraits(store.buddy.colorHex == option.hex ? .isSelected : [])
                        }
                    }
                }
                Section("Accessories") {
                    ForEach(buddyAccessories, id: \.id) { accessory in
                        Toggle(accessory.name, isOn: Binding(
                            get: { store.buddy.accessories.contains(accessory.id) },
                            set: { on in
                                if on { store.buddy.accessories.append(accessory.id) }
                                else { store.buddy.accessories.removeAll { $0 == accessory.id } }
                            }
                        ))
                    }
                }
            }
            .navigationTitle("Your buddy")
        }
    }
}
