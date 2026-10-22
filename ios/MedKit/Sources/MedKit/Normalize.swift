import Foundation

private let dosePattern =
    #"\b\d+(\.\d+)?\s*(mg|mcg|µg|g|ml|iu|units?|%)\b(\s*/\s*\d+(\.\d+)?\s*(mg|mcg|g|ml))?"#
private let formWords =
    #"\b(tablets?|tabs?|capsules?|caps?|er|xr|sr|cr|dr|hcl|hydrochloride|sodium|oral|daily|twice|once)\b"#

/// Lowercase, strip doses/forms/punctuation, collapse whitespace.
/// Mirrors normalizeName in packages/core so both platforms agree.
public func normalizeName(_ input: String) -> String {
    var s = input.lowercased()
    s = s.replacingOccurrences(of: dosePattern, with: " ", options: [.regularExpression, .caseInsensitive])
    s = s.replacingOccurrences(of: formWords, with: " ", options: [.regularExpression, .caseInsensitive])
    s = s.replacingOccurrences(of: #"[^a-z0-9\- ]+"#, with: " ", options: .regularExpression)
    s = s.replacingOccurrences(of: #"\s+"#, with: " ", options: .regularExpression)
    return s.trimmingCharacters(in: .whitespaces)
}

func editDistance(_ a: String, _ b: String) -> Int {
    let a = Array(a), b = Array(b)
    if a.isEmpty { return b.count }
    if b.isEmpty { return a.count }
    var previous = Array(0...b.count)
    for i in 1...a.count {
        var current = [i] + Array(repeating: 0, count: b.count)
        for j in 1...b.count {
            current[j] = a[i - 1] == b[j - 1]
                ? previous[j - 1]
                : 1 + min(previous[j - 1], previous[j], current[j - 1])
        }
        previous = current
    }
    return previous[b.count]
}
