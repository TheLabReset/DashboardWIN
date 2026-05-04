#!/usr/bin/env python3
"""
Genera iconos PWA con branding WIN.
Fondo naranja sólido, wordmark WIN en blanco centrado.

Uso: python3 scripts/generate-icons.py
Salida en la raíz del repo: icon-192.png, icon-512.png, icon-512-maskable.png
"""

from PIL import Image
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
LOGO_SRC = ROOT / "win-white.png"
ORANGE = (255, 107, 26, 255)  # --accent-1 = #ff6b1a

# Carga el logo blanco una sola vez. Mantiene el alpha del PNG transparente.
logo = Image.open(LOGO_SRC).convert("RGBA")
lw, lh = logo.size
ratio = lw / lh

def fit_logo(target_size, fill_ratio):
    """
    Crea un canvas cuadrado naranja de target_size px y pega el wordmark
    centrado, ocupando fill_ratio del lado más corto sin recortes.
    """
    canvas = Image.new("RGBA", (target_size, target_size), ORANGE)
    target_w = int(target_size * fill_ratio)
    target_h = int(target_w / ratio)
    if target_h > target_size * fill_ratio:
        # Si fuese muy alto, limitar por alto
        target_h = int(target_size * fill_ratio)
        target_w = int(target_h * ratio)
    resized = logo.resize((target_w, target_h), Image.LANCZOS)
    x = (target_size - target_w) // 2
    y = (target_size - target_h) // 2
    canvas.paste(resized, (x, y), resized)
    return canvas

# Iconos "any": el wordmark ocupa el 72% del lado para respirar bien
icon_192 = fit_logo(192, 0.72)
icon_192.save(ROOT / "icon-192.png", "PNG", optimize=True)

icon_512 = fit_logo(512, 0.72)
icon_512.save(ROOT / "icon-512.png", "PNG", optimize=True)

# Maskable: safe area Android es 80% del centro. El logo dentro al ~52% del lado.
icon_512_maskable = fit_logo(512, 0.52)
icon_512_maskable.save(ROOT / "icon-512-maskable.png", "PNG", optimize=True)

print("Iconos generados:")
for f in ("icon-192.png", "icon-512.png", "icon-512-maskable.png"):
    p = ROOT / f
    print(f"  {f}: {p.stat().st_size // 1024} KB")
