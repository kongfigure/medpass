import SwiftUI

@main
struct MedPassApp: App {
    @State private var store = AppStore()

    var body: some Scene {
        WindowGroup {
            ContentView()
                .environment(store)
        }
    }
}

struct ContentView: View {
    var body: some View {
        TabView {
            MedsView()
                .tabItem { Label("My meds", systemImage: "pills") }
            CheckView()
                .tabItem { Label("Check", systemImage: "checkmark.circle") }
            BuddyView()
                .tabItem { Label("Buddy", systemImage: "face.smiling") }
        }
    }
}
