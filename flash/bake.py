#!/usr/bin/env python3
"""Bake the flash sheets into standalone animated SVGs.

Reads flash/flash-db.json (each entry's *saved* parameters) and writes
flash/sheet-01.svg ... sheet-09.svg — self-contained files: CSS keyframe
transforms + SMIL-stepped turbulence boil, no scripts, no controls. The
portfolio references them as plain <img>, so the motion travels but the
tuning stays on the machine that runs serve.py (which re-bakes on save).

CLI: python3 flash/bake.py
"""
import json, os

HERE = os.path.dirname(os.path.abspath(__file__))
DB = os.path.join(HERE, 'flash-db.json')

CELL_W, CELL_H = 862, 821
COLS, ROWS = 6, 4
W, H = CELL_W * COLS, CELL_H * ROWS

BASE_DUR = {'boil': 0, 'pulse': 3.2, 'sway': 3.8, 'bob': 3.4, 'spin': 26,
            'flicker': 2.6, 'shiver': .9, 'stalk': 1.9, 'crawl': 1.6, 'wave': 3}
ABS = [(0, 0, 0), (.012, 2, 9), (.007, 2, 18), (.004, 1, 34)]

STYLE = """
g[class^=an-]{transform-box:fill-box;transform-origin:50% 50%}
.an-sway,.an-stalk{transform-origin:50% 92%}
.an-pulse{animation:an-pulse var(--dur,3.2s) ease-in-out infinite}
@keyframes an-pulse{0%,100%{transform:scale(1)}50%{transform:scale(calc(1 + var(--am,1)*.024))}}
.an-sway{animation:an-sway var(--dur,3.8s) ease-in-out infinite}
@keyframes an-sway{0%,100%{transform:rotate(calc(var(--am,1)*-2.6deg))}50%{transform:rotate(calc(var(--am,1)*2.6deg))}}
.an-bob{animation:an-bob var(--dur,3.4s) ease-in-out infinite}
@keyframes an-bob{0%,100%{transform:translateY(calc(var(--am,1)*-8px))}50%{transform:translateY(calc(var(--am,1)*8px))}}
.an-spin{animation:an-spin var(--dur,26s) linear infinite}
@keyframes an-spin{to{transform:rotate(360deg)}}
.an-flicker{animation:an-flicker var(--dur,2.6s) linear infinite}
@keyframes an-flicker{0%,58%,64%,86%,92%,100%{opacity:1}61%{opacity:calc(1 - var(--am,1)*.55)}89%{opacity:calc(1 - var(--am,1)*.35)}}
.an-shiver{animation:an-shiver var(--dur,.9s) linear infinite}
@keyframes an-shiver{0%,100%{transform:translate(0,0) rotate(0)}12%{transform:translate(calc(var(--am,1)*5px),calc(var(--am,1)*-4px)) rotate(calc(var(--am,1)*.6deg))}25%{transform:translate(calc(var(--am,1)*-4px),calc(var(--am,1)*3px)) rotate(calc(var(--am,1)*-.5deg))}40%{transform:translate(calc(var(--am,1)*3px),calc(var(--am,1)*4px)) rotate(calc(var(--am,1)*.4deg))}55%{transform:translate(calc(var(--am,1)*-5px),calc(var(--am,1)*-2px)) rotate(calc(var(--am,1)*-.6deg))}70%{transform:translate(calc(var(--am,1)*4px),calc(var(--am,1)*2px)) rotate(calc(var(--am,1)*.5deg))}85%{transform:translate(calc(var(--am,1)*-2px),calc(var(--am,1)*-4px)) rotate(calc(var(--am,1)*-.3deg))}}
.an-stalk{animation:an-stalk var(--dur,1.9s) ease-in-out infinite}
@keyframes an-stalk{0%,100%{transform:rotate(calc(var(--am,1)*-2.2deg)) translateY(0)}25%{transform:rotate(0deg) translateY(calc(var(--am,1)*-9px))}50%{transform:rotate(calc(var(--am,1)*2.2deg)) translateY(0)}75%{transform:rotate(0deg) translateY(calc(var(--am,1)*-9px))}}
.an-crawl{animation:an-crawl var(--dur,1.6s) linear infinite}
@keyframes an-crawl{0%,100%{transform:translateX(0) rotate(0)}15%{transform:translateX(calc(var(--am,1)*8px)) rotate(calc(var(--am,1)*.5deg))}30%{transform:translateX(calc(var(--am,1)*3px)) rotate(calc(var(--am,1)*-.4deg))}50%{transform:translateX(calc(var(--am,1)*-8px)) rotate(calc(var(--am,1)*.4deg))}65%{transform:translateX(calc(var(--am,1)*-3px)) rotate(calc(var(--am,1)*-.5deg))}85%{transform:translateX(calc(var(--am,1)*5px)) rotate(0)}}
.an-wave{animation:an-wave var(--dur,3s) ease-in-out infinite}
@keyframes an-wave{0%,100%{transform:translateX(calc(var(--am,1)*-15px)) rotate(calc(var(--am,1)*-1.4deg))}50%{transform:translateX(calc(var(--am,1)*15px)) rotate(calc(var(--am,1)*1.4deg))}}
@media(prefers-reduced-motion:reduce){g[class^=an-]{animation:none!important}}
"""

SEEDS = [3, 11, 27, 5, 19, 33, 9, 23]


def esc(s):
    return s.replace('&', '&amp;').replace('<', '&lt;').replace('>', '&gt;')


def bake_all(quiet=False):
    with open(DB) as f:
        db = json.load(f)
    out = []
    for s in db['sheets']:
        sid = s['id']
        cells = [e for e in db['entries'] if e['sh'] == sid]
        parts = []
        parts.append('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 %d %d">' % (W, H))
        parts.append('<title>flash sheet</title>')  # no authored titles on public surfaces
        parts.append('<style>%s</style>' % STYLE)
        parts.append('<rect width="%d" height="%d" fill="#fff"/>' % (W, H))
        rules = []
        for i in range(1, COLS):
            rules.append('<line x1="%d" y1="0" x2="%d" y2="%d"/>' % (i * CELL_W, i * CELL_W, H))
        for j in range(1, ROWS):
            rules.append('<line x1="0" y1="%d" x2="%d" y2="%d"/>' % (j * CELL_H, W, j * CELL_H))
        parts.append('<g stroke="#1A1919" stroke-opacity=".32" stroke-width="4">%s</g>' % ''.join(rules))

        for e in cells:
            r, c = int(e['cell'][1]), int(e['cell'][3])
            vb = e['vb']
            p = e['cur']
            f = min(.8, max(.16, vb[2] / 862.0))
            w = f * CELL_W
            h = w * vb[3] / vb[2]
            if h > .8 * CELL_H:
                k = .8 * CELL_H / h
                w, h = w * k, h * k
            x = c * CELL_W + (CELL_W - w) / 2
            y = r * CELL_H + (CELL_H - h) / 2

            paths = ''.join(
                '<path d="%s"%s fill="#000"/>' % (
                    pp[0],
                    (' transform="translate(%s %s)"' % (pp[1], pp[2])) if (pp[1] or pp[2]) else '')
                for pp in e['p'])

            eid = int(e['id'])
            ab = ABS[p.get('ab', 1)] if 0 <= p.get('ab', 1) < len(ABS) else ABS[1]
            boil = p.get('bo', 0) > 0 and p.get('ab', 1) >= 1
            inner = paths
            defs = ''
            if boil:
                diag = max(vb[2], vb[3])
                bf = ab[0] * 600.0 / diag
                sc = p['bo'] * ab[2] * diag / 600.0
                ra = max(1, int(p.get('ra', 8)))
                dur = round(len(SEEDS) / float(ra), 3)
                rot = eid % len(SEEDS)
                vals = ';'.join(str(v) for v in (SEEDS[rot:] + SEEDS[:rot]))
                defs = ('<filter id="f%03d" x="-15%%" y="-15%%" width="130%%" height="130%%">'
                        '<feTurbulence type="fractalNoise" baseFrequency="%.4f" numOctaves="%d" seed="%d" result="n">'
                        '<animate attributeName="seed" values="%s" dur="%ss" calcMode="discrete" repeatCount="indefinite"/>'
                        '</feTurbulence>'
                        '<feDisplacementMap in="SourceGraphic" in2="n" scale="%.2f" xChannelSelector="R" yChannelSelector="G"/>'
                        '</filter>' % (eid, bf, ab[1], SEEDS[rot], vals, dur, sc))
                inner = '<g filter="url(#f%03d)">%s</g>' % (eid, paths)

            drawing = ('<svg x="%.1f" y="%.1f" width="%.1f" height="%.1f" viewBox="%s" overflow="visible">%s%s</svg>'
                       % (x, y, w, h, ' '.join(str(v) for v in vb), defs, inner))

            a = p.get('a', 'boil')
            if a != 'boil' and BASE_DUR.get(a):
                dur = BASE_DUR[a] / max(.05, p.get('sp', 1))
                delay = -(p.get('ph', 0) * dur)
                drawing = ('<g class="an-%s" style="--am:%s;--dur:%.3fs;animation-delay:%.3fs">%s</g>'
                           % (a, p.get('am', 1), dur, delay, drawing))
            parts.append(drawing)

        parts.append('</svg>')
        path = os.path.join(HERE, 'sheet-%s.svg' % sid)
        with open(path, 'w') as f:
            f.write(''.join(parts))
        out.append(path)
        if not quiet:
            print('baked sheet-%s.svg  (%d drawings, %.0fKB)'
                  % (sid, len(cells), os.path.getsize(path) / 1024))
    return out


if __name__ == '__main__':
    bake_all()
