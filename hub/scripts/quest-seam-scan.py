#!/usr/bin/env python3
"""Helper for quest-plates-verify.mjs (Wave K acceptance): given a screenshot
PNG of one split scene and the page's own resolved --bg-secondary colour,
prints the worst-case fraction of any single row that matches the background
colour within tolerance. A real gap between the sky and land plates would
show as a near-100% background-coloured row (the only flat-colour element in
a photographic composite); this never happens if the two plates always
overlap. No new npm dependency: Pillow is already used elsewhere in this lab
(scanner/OCR contour) and ships with the system Python this repo's other
one-shot scripts already call.

Usage: python quest-seam-scan.py <png_path> <r> <g> <b>
Prints a single float: the worst-case row match fraction, 0..1.
"""
import sys
from PIL import Image

def main():
    path, r, g, b = sys.argv[1], int(sys.argv[2]), int(sys.argv[3]), int(sys.argv[4])
    im = Image.open(path).convert('RGB')
    w, h = im.size
    px = im.load()
    worst = 0.0
    tol = 2
    for y in range(h):
        matches = 0
        total = 0
        for x in range(0, w, 2):
            total += 1
            pr, pg, pb = px[x, y]
            if abs(pr - r) <= tol and abs(pg - g) <= tol and abs(pb - b) <= tol:
                matches += 1
        frac = matches / total if total else 0
        if frac > worst:
            worst = frac
    print(f'{worst:.4f}')

if __name__ == '__main__':
    main()
