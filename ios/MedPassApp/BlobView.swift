import SwiftUI

/// The fluffy buddy, drawn in a 200x200 space (same geometry as the web version).
/// Swap this view for final art later; only `config` and `mood` are inputs.
struct BlobView: View {
    enum Mood { case happy, concerned, sleepy }

    var config: BuddyConfig
    var mood: Mood = .happy

    var body: some View {
        Canvas { context, size in
            let scale = min(size.width, size.height) / 200
            var c = context
            c.translateBy(x: (size.width - 200 * scale) / 2, y: (size.height - 200 * scale) / 2)
            c.scaleBy(x: scale, y: scale)
            draw(in: &c)
        }
        .aspectRatio(1, contentMode: .fit)
        .accessibilityElement()
        .accessibilityLabel("\(config.name), your buddy")
    }

    private let ink = Color(hex: "#231F3D")

    private func has(_ id: String) -> Bool { config.accessories.contains(id) }

    private func fluff(cx: Double, cy: Double, rx: Double, ry: Double, bumps: Int, puff: Double) -> Path {
        func point(_ angle: Double, _ scale: Double) -> CGPoint {
            let sy = sin(angle) > 0 ? 0.92 : 1.0
            return CGPoint(x: cx + cos(angle) * rx * scale, y: cy + sin(angle) * ry * sy * scale)
        }
        var path = Path()
        let step = Double.pi * 2 / Double(bumps)
        path.move(to: point(0, 1))
        for i in 0..<bumps {
            path.addQuadCurve(to: point(step * Double(i + 1), 1), control: point(step * (Double(i) + 0.5), puff))
        }
        path.closeSubpath()
        return path
    }

    private func line(_ points: [(Double, Double)]) -> Path {
        var path = Path()
        for (index, p) in points.enumerated() {
            let point = CGPoint(x: p.0, y: p.1)
            if index == 0 { path.move(to: point) } else { path.addLine(to: point) }
        }
        return path
    }

    private func curve(from a: (Double, Double), to b: (Double, Double), control: (Double, Double)) -> Path {
        var path = Path()
        path.move(to: CGPoint(x: a.0, y: a.1))
        path.addQuadCurve(to: CGPoint(x: b.0, y: b.1), control: CGPoint(x: control.0, y: control.1))
        return path
    }

    private func oval(_ cx: Double, _ cy: Double, _ rx: Double, _ ry: Double) -> Path {
        Path(ellipseIn: CGRect(x: cx - rx, y: cy - ry, width: rx * 2, height: ry * 2))
    }

    private func draw(in c: inout GraphicsContext) {
        let body = fluff(cx: 100, cy: 108, rx: 70, ry: 62, bumps: 16, puff: 1.13)
        let round = StrokeStyle(lineWidth: 3.5, lineCap: .round)

        c.fill(oval(100, 176, 48, 7), with: .color(.black.opacity(0.12)))
        c.fill(body.offsetBy(dx: 0, dy: 4), with: .color(.black.opacity(0.18)))
        c.fill(body, with: .color(Color(hex: config.colorHex)))
        c.fill(oval(78, 72, 20, 10), with: .color(.white.opacity(0.28)))

        if has("scarf") {
            var scarf = Path()
            scarf.move(to: CGPoint(x: 52, y: 128))
            scarf.addQuadCurve(to: CGPoint(x: 148, y: 128), control: CGPoint(x: 100, y: 150))
            scarf.addLine(to: CGPoint(x: 151, y: 142))
            scarf.addQuadCurve(to: CGPoint(x: 49, y: 142), control: CGPoint(x: 100, y: 166))
            scarf.closeSubpath()
            c.fill(scarf, with: .color(Color(hex: "#E4577A")))
            c.fill(line([(128, 136), (136, 166), (147, 168), (142, 135)]).closedSubpath(), with: .color(Color(hex: "#C93E63")))
        }

        // Eyes
        if mood == .sleepy {
            c.stroke(curve(from: (70, 108), to: (86, 108), control: (78, 114)), with: .color(ink), style: round)
            c.stroke(curve(from: (114, 108), to: (130, 108), control: (122, 114)), with: .color(ink), style: round)
        } else {
            c.fill(oval(78, 108, 6, 8), with: .color(ink))
            c.fill(oval(122, 108, 6, 8), with: .color(ink))
            c.fill(oval(80, 105, 2.2, 2.2), with: .color(.white))
            c.fill(oval(124, 105, 2.2, 2.2), with: .color(.white))
        }
        if mood == .concerned {
            c.stroke(line([(68, 92), (86, 88)]), with: .color(ink), style: StrokeStyle(lineWidth: 3, lineCap: .round))
            c.stroke(line([(132, 92), (114, 88)]), with: .color(ink), style: StrokeStyle(lineWidth: 3, lineCap: .round))
        }

        // Cheeks and mouth
        c.fill(oval(62, 124, 8, 5), with: .color(Color(hex: "#FF8FB0").opacity(0.55)))
        c.fill(oval(138, 124, 8, 5), with: .color(Color(hex: "#FF8FB0").opacity(0.55)))
        switch mood {
        case .happy: c.stroke(curve(from: (91, 124), to: (109, 124), control: (100, 133)), with: .color(ink), style: round)
        case .concerned: c.stroke(curve(from: (92, 130), to: (108, 130), control: (100, 124)), with: .color(ink), style: round)
        case .sleepy: c.fill(oval(100, 128, 4, 3), with: .color(ink))
        }

        if has("glasses") {
            c.stroke(oval(78, 108, 15, 15), with: .color(ink), lineWidth: 3)
            c.stroke(oval(122, 108, 15, 15), with: .color(ink), lineWidth: 3)
            c.stroke(curve(from: (93, 107), to: (107, 107), control: (100, 103)), with: .color(ink), lineWidth: 3)
        }

        if has("bow") {
            let pink = Color(hex: "#FF6F9C")
            c.fill(line([(142, 56), (164, 44), (164, 72)]).closedSubpath(), with: .color(pink))
            c.fill(line([(142, 56), (120, 44), (120, 72)]).closedSubpath(), with: .color(pink))
            c.fill(oval(142, 56, 7, 7), with: .color(Color(hex: "#E04A7C")))
        }

        if has("beanie") {
            var cap = Path()
            cap.move(to: CGPoint(x: 54, y: 66))
            cap.addCurve(to: CGPoint(x: 146, y: 66), control1: CGPoint(x: 58, y: 24), control2: CGPoint(x: 142, y: 24))
            cap.addQuadCurve(to: CGPoint(x: 54, y: 66), control: CGPoint(x: 100, y: 52))
            cap.closeSubpath()
            c.fill(cap, with: .color(Color(hex: "#4C6FD9")))
            c.fill(Path(roundedRect: CGRect(x: 52, y: 62, width: 96, height: 14), cornerRadius: 7), with: .color(Color(hex: "#3A58B8")))
            c.fill(oval(100, 22, 9, 9), with: .color(.white))
        } else if has("sprout") {
            c.stroke(line([(100, 52), (100, 38)]), with: .color(Color(hex: "#3E9B62")), style: StrokeStyle(lineWidth: 4, lineCap: .round))
            var left = Path()
            left.move(to: CGPoint(x: 100, y: 40))
            left.addQuadCurve(to: CGPoint(x: 78, y: 20), control: CGPoint(x: 80, y: 38))
            left.addQuadCurve(to: CGPoint(x: 100, y: 40), control: CGPoint(x: 98, y: 18))
            var right = Path()
            right.move(to: CGPoint(x: 100, y: 40))
            right.addQuadCurve(to: CGPoint(x: 122, y: 20), control: CGPoint(x: 120, y: 38))
            right.addQuadCurve(to: CGPoint(x: 100, y: 40), control: CGPoint(x: 102, y: 18))
            c.fill(left, with: .color(Color(hex: "#5CC585")))
            c.fill(right, with: .color(Color(hex: "#47AE72")))
        }
    }
}

private extension Path {
    func closedSubpath() -> Path {
        var copy = self
        copy.closeSubpath()
        return copy
    }
}
