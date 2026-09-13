"""
Generate synthetic Kerala flood satellite sample images for the Vision demo.
Each image is designed to produce distinct, realistic analysis results from
the segmentation service (different flood coverage levels).

Run from backend/:
    python generate_samples.py
"""
import struct, zlib, os, math, random

OUTPUT_DIR = os.path.join(os.path.dirname(__file__), "..", "frontend", "public", "samples")
os.makedirs(OUTPUT_DIR, exist_ok=True)

# Each sample: (filename, flood_fraction, description)
SAMPLES = [
    ("alappuzha_2018_08_17.jpg",  0.62, "Alappuzha coastal belt — severe inundation"),
    ("kuttanad_2018_08_18.jpg",   0.48, "Kuttanad backwaters — widespread flooding"),
    ("ernakulam_2018_08_16.jpg",  0.31, "Ernakulam urban fringe — moderate flooding"),
    ("pathanamthitta_2018.jpg",   0.55, "Pathanamthitta river delta — critical flood"),
]

W, H = 512, 512


def _png_chunk(name: bytes, data: bytes) -> bytes:
    c = zlib.crc32(name + data) & 0xFFFFFFFF
    return struct.pack(">I", len(data)) + name + data + struct.pack(">I", c)


def _write_png(path: str, pixels: list[list[tuple]]) -> None:
    """Write a W×H RGB PNG from a list-of-rows of (r,g,b) tuples."""
    raw = b""
    for row in pixels:
        raw += b"\x00"  # filter type None
        for r, g, b in row:
            raw += bytes([r, g, b])
    compressed = zlib.compress(raw, 6)
    data = (
        b"\x89PNG\r\n\x1a\n"
        + _png_chunk(b"IHDR", struct.pack(">IIBBBBB", W, H, 8, 2, 0, 0, 0))
        + _png_chunk(b"IDAT", compressed)
        + _png_chunk(b"IEND", b"")
    )
    with open(path, "wb") as f:
        f.write(data)


def _flood_color(intensity: float) -> tuple:
    """Map flood intensity 0-1 to a water/mud colour."""
    if intensity > 0.7:
        # Deep water — dark blue
        return (int(20 + intensity * 30), int(60 + intensity * 40), int(120 + intensity * 80))
    elif intensity > 0.4:
        # Shallow flood — murky brown-blue
        return (int(60 + intensity * 40), int(90 + intensity * 30), int(100 + intensity * 50))
    else:
        # Wet soil / vegetation
        return (int(80 + intensity * 60), int(100 + intensity * 40), int(60 + intensity * 30))


def _land_color(x: int, y: int, rng: random.Random) -> tuple:
    """Varied land — green fields, roads, buildings."""
    v = rng.random()
    if v < 0.55:
        # Vegetation — greens
        g = rng.randint(90, 160)
        return (rng.randint(40, 80), g, rng.randint(30, 70))
    elif v < 0.75:
        # Urban / rooftop — greys
        c = rng.randint(100, 180)
        return (c, c - rng.randint(0, 20), c - rng.randint(0, 30))
    elif v < 0.88:
        # Bare soil / road
        b = rng.randint(120, 170)
        return (b, int(b * 0.85), int(b * 0.65))
    else:
        # Shadow
        c = rng.randint(30, 60)
        return (c, c, c)


def _make_noise(seed: int, scale: float = 0.015) -> list[list[float]]:
    """Simple smooth noise field using sine harmonics."""
    rng = random.Random(seed)
    offsets = [(rng.uniform(0, 100), rng.uniform(0, 100), rng.uniform(0.5, 2.0)) for _ in range(6)]
    grid = []
    for y in range(H):
        row = []
        for x in range(W):
            v = sum(
                math.sin((x * scale * f + ox) * math.pi) * math.cos((y * scale * f + oy) * math.pi)
                for ox, oy, f in offsets
            ) / len(offsets)
            row.append((v + 1) / 2)  # normalise to 0-1
        grid.append(row)
    return grid


def generate_image(filename: str, flood_fraction: float, seed: int) -> None:
    rng = random.Random(seed)
    noise = _make_noise(seed)
    # Threshold: pixels with noise > (1 - flood_fraction) are flooded
    threshold = 1.0 - flood_fraction

    pixels = []
    for y in range(H):
        row = []
        for x in range(W):
            n = noise[y][x]
            if n >= threshold:
                intensity = (n - threshold) / flood_fraction
                r, g, b = _flood_color(intensity)
                # Add slight noise
                r = max(0, min(255, r + rng.randint(-8, 8)))
                g = max(0, min(255, g + rng.randint(-8, 8)))
                b = max(0, min(255, b + rng.randint(-8, 8)))
                row.append((r, g, b))
            else:
                row.append(_land_color(x, y, rng))
        pixels.append(row)

    path = os.path.join(OUTPUT_DIR, filename.replace(".jpg", ".png"))
    _write_png(path, pixels)
    # Also save as .jpg name (copy the png bytes — browsers accept PNG regardless of extension)
    jpg_path = os.path.join(OUTPUT_DIR, filename)
    import shutil
    shutil.copy(path, jpg_path)
    os.remove(path)
    print(f"  OK {filename}  ({int(flood_fraction*100)}% flood coverage)")


if __name__ == "__main__":
    print("Generating Kerala flood sample images…")
    for i, (fname, frac, desc) in enumerate(SAMPLES):
        generate_image(fname, frac, seed=42 + i * 7)
    print(f"Done — saved to {OUTPUT_DIR}")
