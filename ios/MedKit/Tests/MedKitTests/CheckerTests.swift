import XCTest
@testable import MedKit

final class CheckerTests: XCTestCase {
    private var checker: Checker!

    override func setUpWithError() throws {
        checker = Checker(dataset: try Dataset.bundled())
    }

    // MARK: Dataset integrity

    func testDatasetReferencesAreValid() {
        let drugIDs = Set(checker.dataset.drugs.map(\.id))
        let classIDs = Set(checker.dataset.classes.map(\.id))
        for i in checker.dataset.interactions {
            for side in [i.a, i.b] {
                if side.hasPrefix("class:") {
                    XCTAssertTrue(classIDs.contains(String(side.dropFirst(6))), "\(i.id): \(side)")
                } else {
                    XCTAssertTrue(drugIDs.contains(side), "\(i.id): \(side)")
                }
            }
            XCTAssertTrue(i.source.url.hasPrefix("https://"), i.id)
        }
        for cls in checker.dataset.classes {
            for member in cls.members { XCTAssertTrue(drugIDs.contains(member), "\(cls.id): \(member)") }
        }
    }

    // MARK: Name resolution

    func testResolvesGenericBrandAndDose() {
        XCTAssertEqual(checker.resolveDrug("Ibuprofen")?.id, "ibuprofen")
        XCTAssertEqual(checker.resolveDrug("Advil")?.id, "ibuprofen")
        XCTAssertEqual(checker.resolveDrug("Ibuprofen 200 mg tablets")?.id, "ibuprofen")
        XCTAssertEqual(checker.resolveDrug("  COUMADIN 5mg ")?.id, "warfarin")
        XCTAssertNil(checker.resolveDrug("zzzmed"))
        XCTAssertNil(checker.resolveDrug("   "))
    }

    func testDoesNotGuessWhenTwoDrugsNamed() {
        XCTAssertNil(checker.resolveDrug("ibuprofen and warfarin"))
    }

    func testSuggestsTyposButDoesNotAutoResolve() {
        XCTAssertNil(checker.resolveDrug("ibuprofin"))
        XCTAssertTrue(checker.suggestDrugs("ibuprofin").contains { $0.id == "ibuprofen" })
    }

    // MARK: Checks

    func testFlagsNSAIDForWarfarinPatient() {
        let report = checker.checkNewMedication(current: ["Warfarin 5 mg"], new: "Ibuprofen 400 mg")
        XCTAssertTrue(report.findings.contains { $0.interaction.id == "warfarin-nsaid" })
        XCTAssertEqual(report.findings.first?.interaction.severity, .major)
    }

    func testFlagsMetronidazoleForWarfarinPatient() {
        let report = checker.checkNewMedication(current: ["Coumadin"], new: "Flagyl")
        XCTAssertEqual(report.findings.map(\.interaction.id), ["warfarin-metronidazole"])
    }

    func testMatchesBothDirections() {
        let forward = checker.checkNewMedication(current: ["Plavix"], new: "Prilosec")
        let reverse = checker.checkNewMedication(current: ["Prilosec"], new: "Plavix")
        XCTAssertEqual(forward.findings.first?.interaction.id, "clopidogrel-omeprazole")
        XCTAssertEqual(reverse.findings.first?.interaction.id, "clopidogrel-omeprazole")
        XCTAssertEqual(forward.findings.first?.interaction.severity, .avoid)
    }

    func testClassToClassPair() {
        let report = checker.checkNewMedication(current: ["Xanax"], new: "Percocet")
        XCTAssertEqual(report.findings.map(\.interaction.id), ["opioid-benzodiazepine"])
    }

    func testMostSeriousFirst() {
        let report = checker.checkNewMedication(current: ["Plavix", "Zoloft", "Warfarin"], new: "Prilosec")
        XCTAssertEqual(report.findings.first?.interaction.severity, .avoid)
    }

    func testNeverSelfInteracts() {
        XCTAssertTrue(checker.checkNewMedication(current: ["Ibuprofen"], new: "Advil").findings.isEmpty)
    }

    func testNoConflictNeverSaysSafe() {
        let report = checker.checkNewMedication(current: ["Warfarin"], new: "Vitamin D")
        XCTAssertTrue(report.findings.isEmpty)
        XCTAssertTrue(report.statement.contains("No known conflict found in our sources"))
        XCTAssertTrue(report.statement.contains("does not mean the combination is safe"))
        XCTAssertEqual(report.unrecognized, ["Vitamin D"])
    }

    func testReportsUnrecognizedNames() {
        let report = checker.checkNewMedication(current: ["Warfarin", "Mystery Pill"], new: "Ibuprofen")
        XCTAssertEqual(report.findings.count, 1)
        XCTAssertEqual(report.unrecognized, ["Mystery Pill"])
    }

    func testListCheckDeduplicates() {
        let report = checker.checkMedicationList(["Warfarin", "Coumadin", "Advil", "Eliquis"])
        XCTAssertEqual(report.findings.map(\.interaction.id).sorted(), ["apixaban-nsaid", "warfarin-nsaid"])
    }

    func testAvoidMatching() {
        XCTAssertTrue(checker.matchesAvoidEntry(newMed: "Advil", avoidName: "Ibuprofen 200mg"))
        XCTAssertFalse(checker.matchesAvoidEntry(newMed: "Naproxen", avoidName: "Ibuprofen"))
        XCTAssertTrue(checker.matchesAvoidEntry(newMed: "Mystery Pill", avoidName: "mystery pill"))
        XCTAssertFalse(checker.matchesAvoidEntry(newMed: "", avoidName: ""))
    }
}
