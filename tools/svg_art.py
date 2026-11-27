"""YUTA & YU 招待状のベクター素材を生成する（すべてオリジナルの図形）。

出力:
  hero_scene.svg.part  … index.html に埋め込むメイン風景（アニメーション用クラス付き）
  images/*.svg         … デモ写真（ポートレート2枚・ギャラリー6枚）
"""
import math
import random
import sys
from pathlib import Path

OUT = Path(sys.argv[1])
IMG = OUT / "images"
IMG.mkdir(parents=True, exist_ok=True)

P = {
    "sky1": "#1673c4", "sky2": "#4aa6ea", "sky3": "#bfe3fa",
    "sea1": "#1597b8", "sea2": "#43c1d6",
    "far": "#7fa9a3", "ridge1": "#5f9c6b", "ridge2": "#3f7f4f",
    "lawn1": "#86c24b", "lawn2": "#5d9f34",
    "leaf1": "#2f6b3a", "leaf2": "#4c8f43", "leaf3": "#7cb653",
    "trunk": "#e6dccb", "trunkS": "#c9bba3",
    "wood": "#7a5034", "woodD": "#4f3322", "roof": "#3b3f3d",
    "glass1": "#8fc6e6", "glass2": "#d8eefb", "glow": "#ffd89a",
    "suit": "#1f2f4d", "dress": "#ffffff", "skin": "#efcdb0", "hairD": "#2b211c", "hairB": "#4a3226",
    "ink": "#17323a", "plY": "#ffcf4a",
}


def f(x):
    return f"{x:.1f}".rstrip("0").rstrip(".")


# ---------- 部品 ----------
def cloud(x, y, s, cls="", shade=True):
    """平らで丸い雲（円の組み合わせ＋底を平らに）"""
    bumps = [(-0.9, 0.1, 0.45), (-0.45, -0.25, 0.6), (0.1, -0.42, 0.72), (0.65, -0.18, 0.55), (1.05, 0.12, 0.38)]
    def blob(dy, fill):
        circles = "".join(f'<circle cx="{f(x + bx * s)}" cy="{f(y + by * s + dy)}" r="{f(r * s)}"/>' for bx, by, r in bumps)
        base = f'<rect x="{f(x - 1.3 * s)}" y="{f(y + dy)}" width="{f(2.75 * s)}" height="{f(0.5 * s)}" rx="{f(0.25 * s)}"/>'
        return f'<g fill="{fill}">{circles}{base}</g>'
    inner = (blob(0.12 * s, "#d6e9f7") if shade else "") + blob(0, "#ffffff")
    return f'<g class="{cls}">{inner}</g>'


def canopy(cx, cy, w, h, seed, tones=("leaf1", "leaf2", "leaf3")):
    """ユーカリのような大きな樹冠：濃い層→中間→明るいハイライトの3層"""
    rnd = random.Random(seed)
    out = []
    for layer, tone in enumerate(tones):
        n = [16, 14, 9][layer]
        shrink = [1.0, 0.82, 0.55][layer]
        lift = [0, -0.06, -0.14][layer]
        g = []
        for _ in range(n):
            a = rnd.uniform(0, math.tau)
            rx = math.cos(a) * w * 0.5 * shrink * rnd.uniform(0.3, 1)
            ry = math.sin(a) * h * 0.5 * shrink * rnd.uniform(0.3, 1)
            r = rnd.uniform(0.16, 0.26) * w * shrink
            g.append(f'<circle cx="{f(cx + rx - layer * w * 0.03)}" cy="{f(cy + ry + lift * h)}" r="{f(r)}"/>')
        out.append(f'<g fill="{P[tone]}">{"".join(g)}</g>')
    return "".join(out)


def eucalyptus(x, base, height, spread, seed, cls="tree"):
    rnd = random.Random(seed)
    top = base - height
    lean = rnd.uniform(-0.08, 0.08) * height
    trunk_w = height * 0.035
    trunk = (f'<path d="M{f(x - trunk_w)} {f(base)} C{f(x - trunk_w * .6)} {f(base - height * .4)} {f(x + lean * .5 - trunk_w * .4)} {f(top + height * .45)} {f(x + lean - trunk_w * .25)} {f(top + height * .3)} '
             f'L{f(x + lean + trunk_w * .25)} {f(top + height * .3)} C{f(x + lean * .5 + trunk_w * .4)} {f(top + height * .45)} {f(x + trunk_w * .6)} {f(base - height * .4)} {f(x + trunk_w)} {f(base)} Z" fill="{P["trunk"]}"/>')
    shade = (f'<path d="M{f(x + trunk_w * .2)} {f(base)} C{f(x + trunk_w * .3)} {f(base - height * .4)} {f(x + lean * .5 + trunk_w * .1)} {f(top + height * .45)} {f(x + lean + trunk_w * .25)} {f(top + height * .3)} '
             f'L{f(x + lean + trunk_w * .25)} {f(top + height * .3)} C{f(x + lean * .5 + trunk_w * .4)} {f(top + height * .45)} {f(x + trunk_w * .6)} {f(base - height * .4)} {f(x + trunk_w)} {f(base)} Z" fill="{P["trunkS"]}"/>')
    branches = ""
    for k in range(3):
        bx = x + lean * (0.55 + k * 0.1)
        by = top + height * (0.42 - k * 0.06)
        dx = (-1) ** k * spread * rnd.uniform(0.18, 0.3)
        branches += f'<path d="M{f(bx)} {f(by)} Q{f(bx + dx * .5)} {f(by - height * .05)} {f(bx + dx)} {f(by - height * .14)}" stroke="{P["trunk"]}" stroke-width="{f(trunk_w * .55)}" fill="none" stroke-linecap="round"/>'
    crown = canopy(x + lean, top + height * 0.12, spread, height * 0.5, seed)
    return f'<g class="{cls}">{trunk}{shade}{branches}{crown}</g>'


def palm(x, base, height, seed, lean=0.12, cls="palm", color="#1f4a33"):
    """ヤシ：しなる幹＋垂れ下がる葉（中心の軸から細い小葉が左右に出る）"""
    rnd = random.Random(seed)
    tx, ty = x + lean * height, base - height
    qx, qy = x + lean * height * .15, base - height * .55
    trunk = (f'<path d="M{f(x - height * .024)} {f(base)} Q{f(qx - height * .01)} {f(qy)} {f(tx - height * .011)} {f(ty)} '
             f'L{f(tx + height * .011)} {f(ty)} Q{f(qx + height * .022)} {f(qy)} {f(x + height * .024)} {f(base)} Z"/>')
    rings = ""
    for i in range(1, 12):
        t = i / 12
        px = (1 - t) ** 2 * x + 2 * (1 - t) * t * qx + t * t * tx
        py = (1 - t) ** 2 * base + 2 * (1 - t) * t * qy + t * t * ty
        w = height * (.023 - .011 * t)
        rings += f'<path d="M{f(px - w)} {f(py)} q{f(w)} {f(height * .007)} {f(2 * w)} 0" stroke="rgba(255,255,255,.14)" stroke-width="1.3" fill="none"/>'
    fronds = []
    angles = [-172, -150, -128, -104, -80, -56, -32, -10]
    for ang in angles:
        a = math.radians(ang + rnd.uniform(-5, 5))
        L = height * rnd.uniform(.40, .52)
        side = 1 if math.cos(a) >= 0 else -1
        # 先端は重力で垂れる
        ex = tx + math.cos(a) * L
        ey = ty + math.sin(a) * L * .5 + L * (.55 if abs(math.cos(a)) > .5 else .25)
        cx1 = tx + math.cos(a) * L * .55
        cy1 = ty + math.sin(a) * L * .75 - L * .08
        rach = f'M{f(tx)} {f(ty)} Q{f(cx1)} {f(cy1)} {f(ex)} {f(ey)}'
        leaflets = []
        N = 17
        for i in range(2, N):
            t = i / N
            px = (1 - t) ** 2 * tx + 2 * (1 - t) * t * cx1 + t * t * ex
            py = (1 - t) ** 2 * ty + 2 * (1 - t) * t * cy1 + t * t * ey
            dx = 2 * (1 - t) * (cx1 - tx) + 2 * t * (ex - cx1)
            dy = 2 * (1 - t) * (cy1 - ty) + 2 * t * (ey - cy1)
            ln = math.hypot(dx, dy) or 1
            ux, uy = dx / ln, dy / ln
            nx, ny = -uy, ux
            ll = L * .30 * math.sin(math.pi * min(1, t * 1.05)) + L * .03
            for sgn in (1, -1):
                # 小葉は先端方向へ流れ、下へ少し垂れる
                vx = nx * sgn * .75 + ux * .55
                vy = ny * sgn * .75 + uy * .55 + .35
                vl = math.hypot(vx, vy)
                lx, ly = px + vx / vl * ll, py + vy / vl * ll
                leaflets.append(f'M{f(px)} {f(py)} Q{f((px + lx) / 2 + ux * ll * .12)} {f((py + ly) / 2 - ll * .05)} {f(lx)} {f(ly)}')
        sw = max(2.2, height * .011)
        fronds.append(f'<path d="{rach}" stroke="{color}" stroke-width="{f(sw * 1.5)}" fill="none" stroke-linecap="round"/>'
                      f'<path d="{" ".join(leaflets)}" stroke="{color}" stroke-width="{f(sw)}" fill="none" stroke-linecap="round"/>')
    nuts = "".join(f'<circle cx="{f(tx + dx * height / 380)}" cy="{f(ty + (6 + dy) * height / 380)}" r="{f(height * .016)}"/>' for dx, dy in [(-7, 2), (6, 3), (0, 10)])
    return f'<g class="{cls}" fill="{color}">{trunk}{rings}<g class="palm__fronds">{"".join(fronds)}</g>{nuts}</g>'


def house(x, y, s):
    """オシポフ風ミッドセンチュリー邸宅：低い屋根、木の壁、大きなガラス、ラナイ"""
    g = []
    # 屋根（浅い切妻）
    g.append(f'<path d="M{f(x - 1.12 * s)} {f(y - .62 * s)} L{f(x - .05 * s)} {f(y - .9 * s)} L{f(x + 1.12 * s)} {f(y - .62 * s)} L{f(x + 1.08 * s)} {f(y - .57 * s)} L{f(x - .05 * s)} {f(y - .83 * s)} L{f(x - 1.08 * s)} {f(y - .57 * s)} Z" fill="{P["roof"]}"/>')
    # 破風の内側（木）
    g.append(f'<path d="M{f(x - .98 * s)} {f(y - .58 * s)} L{f(x - .05 * s)} {f(y - .82 * s)} L{f(x + .98 * s)} {f(y - .58 * s)} Z" fill="{P["woodD"]}"/>')
    # 上階のガラス面
    g.append(f'<rect x="{f(x - .95 * s)}" y="{f(y - .58 * s)}" width="{f(1.9 * s)}" height="{f(.36 * s)}" fill="{P["wood"]}"/>')
    for i in range(6):
        gx = x - .88 * s + i * .3 * s
        g.append(f'<rect x="{f(gx)}" y="{f(y - .55 * s)}" width="{f(.26 * s)}" height="{f(.3 * s)}" fill="url(#glass)"/>')
        g.append(f'<path d="M{f(gx + .03 * s)} {f(y - .53 * s)} l{f(.08 * s)} 0 l-{f(.06 * s)} {f(.26 * s)} l-{f(.02 * s)} 0 Z" fill="rgba(255,255,255,.45)"/>')
    # ラナイ（手すり）
    g.append(f'<rect x="{f(x - 1.02 * s)}" y="{f(y - .23 * s)}" width="{f(2.04 * s)}" height="{f(.035 * s)}" fill="{P["woodD"]}"/>')
    for i in range(21):
        g.append(f'<rect x="{f(x - 1.0 * s + i * .1 * s)}" y="{f(y - .3 * s)}" width="{f(.012 * s)}" height="{f(.07 * s)}" fill="{P["woodD"]}"/>')
    g.append(f'<rect x="{f(x - 1.02 * s)}" y="{f(y - .31 * s)}" width="{f(2.04 * s)}" height="{f(.014 * s)}" fill="{P["woodD"]}"/>')
    # 下階（あたたかい室内の光）
    g.append(f'<rect x="{f(x - .55 * s)}" y="{f(y - .195 * s)}" width="{f(1.45 * s)}" height="{f(.195 * s)}" fill="{P["wood"]}"/>')
    for i in range(4):
        gx = x - .48 * s + i * .34 * s
        g.append(f'<rect class="house__glow" x="{f(gx)}" y="{f(y - .17 * s)}" width="{f(.29 * s)}" height="{f(.15 * s)}" fill="{P["glow"]}"/>')
    # 柱
    g.append(f'<rect x="{f(x - .92 * s)}" y="{f(y - .2 * s)}" width="{f(.03 * s)}" height="{f(.2 * s)}" fill="{P["woodD"]}"/>')
    return f'<g class="house">{"".join(g)}</g>'


def couple(x, y, s, cls="couple"):
    """新郎（濃紺のスーツ）と新婦（白いドレスとベール）"""
    g = [
        # 新郎
        f'<circle cx="{f(x - .2 * s)}" cy="{f(y - .9 * s)}" r="{f(.075 * s)}" fill="{P["hairD"]}"/>',
        f'<path d="M{f(x - .3 * s)} {f(y - .8 * s)} Q{f(x - .2 * s)} {f(y - .84 * s)} {f(x - .1 * s)} {f(y - .8 * s)} L{f(x - .11 * s)} {f(y - .38 * s)} L{f(x - .13 * s)} {f(y)} L{f(x - .19 * s)} {f(y)} L{f(x - .2 * s)} {f(y - .36 * s)} L{f(x - .22 * s)} {f(y)} L{f(x - .28 * s)} {f(y)} L{f(x - .3 * s)} {f(y - .38 * s)} Z" fill="{P["suit"]}"/>',
        f'<path d="M{f(x - .22 * s)} {f(y - .8 * s)} L{f(x - .2 * s)} {f(y - .7 * s)} L{f(x - .18 * s)} {f(y - .8 * s)} Z" fill="#fff"/>',
        # 新婦
        f'<path d="M{f(x + .02 * s)} {f(y - .86 * s)} Q{f(x + .2 * s)} {f(y - .9 * s)} {f(x + .2 * s)} {f(y - .7 * s)} Q{f(x + .3 * s)} {f(y - .35 * s)} {f(x + .4 * s)} {f(y)} L{f(x + .02 * s)} {f(y)} Z" fill="rgba(255,255,255,.55)"/>',
        f'<circle cx="{f(x + .08 * s)}" cy="{f(y - .88 * s)}" r="{f(.07 * s)}" fill="{P["hairB"]}"/>',
        f'<path d="M{f(x + .02 * s)} {f(y - .8 * s)} L{f(x + .14 * s)} {f(y - .8 * s)} L{f(x + .13 * s)} {f(y - .55 * s)} Q{f(x + .3 * s)} {f(y - .1 * s)} {f(x + .32 * s)} {f(y)} L{f(x - .1 * s)} {f(y)} Q{f(x - .06 * s)} {f(y - .2 * s)} {f(x + .03 * s)} {f(y - .55 * s)} Z" fill="{P["dress"]}"/>',
        f'<circle cx="{f(x + .13 * s)}" cy="{f(y - .93 * s)}" r="{f(.025 * s)}" fill="{P["plY"]}"/>',
    ]
    return f'<g class="{cls}">{"".join(g)}</g>'


def plumeria(cx, cy, r, rot=0, cls="plumeria"):
    petals = "".join(
        f'<path transform="rotate({f(rot + k * 72)} {f(cx)} {f(cy)})" d="M{f(cx)} {f(cy)} C{f(cx + .42 * r)} {f(cy - .1 * r)} {f(cx + .72 * r)} {f(cy - .62 * r)} {f(cx + .38 * r)} {f(cy - .98 * r)} C{f(cx + .1 * r)} {f(cy - 1.18 * r)} {f(cx - .26 * r)} {f(cy - .8 * r)} {f(cx)} {f(cy)} Z" fill="url(#petal)"/>'
        for k in range(5))
    return f'<g class="{cls}">{petals}<circle cx="{f(cx)}" cy="{f(cy)}" r="{f(.16 * r)}" fill="#ffbf2e"/></g>'


def ridge(points_y, w, h, fill, y0, cls=""):
    n = len(points_y) - 1
    d = f"M0 {f(h)} L0 {f(y0 + points_y[0])}"
    for i in range(n):
        x1, x2 = w * i / n, w * (i + 1) / n
        y1, y2 = y0 + points_y[i], y0 + points_y[i + 1]
        mx = (x1 + x2) / 2
        d += f" C{f(mx)} {f(y1)} {f(mx)} {f(y2)} {f(x2)} {f(y2)}"
    d += f" L{f(w)} {f(h)} Z"
    return f'<path class="{cls}" d="{d}" fill="{fill}"/>'


def defs():
    return f'''<defs>
<linearGradient id="sky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="{P["sky1"]}"/><stop offset=".55" stop-color="{P["sky2"]}"/><stop offset="1" stop-color="{P["sky3"]}"/></linearGradient>
<linearGradient id="sea" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="{P["sea2"]}"/><stop offset="1" stop-color="{P["sea1"]}"/></linearGradient>
<linearGradient id="lawn" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="{P["lawn1"]}"/><stop offset="1" stop-color="{P["lawn2"]}"/></linearGradient>
<linearGradient id="glass" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="{P["glass2"]}"/><stop offset="1" stop-color="{P["glass1"]}"/></linearGradient>
<radialGradient id="petal" cx=".5" cy=".9" r=".9"><stop offset="0" stop-color="#ffd257"/><stop offset=".35" stop-color="#fff6d8"/><stop offset="1" stop-color="#ffffff"/></radialGradient>
<radialGradient id="sunGlow" cx=".5" cy=".5" r=".5"><stop offset="0" stop-color="#fffbe8"/><stop offset=".35" stop-color="#fff3c2" stop-opacity=".95"/><stop offset="1" stop-color="#fff3c2" stop-opacity="0"/></radialGradient>
</defs>'''


def demo_tag(w, h):
    return (f'<g transform="translate({f(w - 118)} {f(h - 58)})"><rect width="96" height="34" rx="17" fill="rgba(23,50,58,.72)"/>'
            f'<text x="48" y="23" text-anchor="middle" font-family="Arial, Helvetica, sans-serif" font-size="15" font-weight="700" letter-spacing="2" fill="#fff">DEMO</text></g>')


# ---------- メイン風景（index.html に埋め込み） ----------
def hero_scene():
    W, H = 1600, 1000
    rnd = random.Random(3)
    parts = [f'<svg class="scene" viewBox="0 0 {W} {H}" preserveAspectRatio="xMidYMax slice" aria-hidden="true" focusable="false">', defs()]
    parts.append(f'<rect width="{W}" height="{H}" fill="url(#sky)"/>')
    # 太陽と光
    rays = "".join(f'<path d="M-14 -96 L0 -250 L14 -96 Z" transform="rotate({k * 30})" fill="rgba(255,250,220,.16)"/>' for k in range(12))
    parts.append(f'<g class="sun" transform="translate(1320 150)"><g class="sun__rays">{rays}</g><circle r="150" fill="url(#sunGlow)"/><circle r="54" fill="#fffbea"/></g>')
    # 雲（3層で速さを変える）
    parts.append('<g class="layer layer--clouds-far">' + cloud(260, 170, 46, "cloud cloud--a") + cloud(980, 120, 38, "cloud cloud--b") + cloud(1450, 300, 34, "cloud cloud--c") + "</g>")
    parts.append('<g class="layer layer--clouds-near">' + cloud(560, 250, 70, "cloud cloud--d") + cloud(1180, 380, 56, "cloud cloud--e") + "</g>")
    # 鳥
    birds = "".join(f'<path class="bird bird--{i}" d="M0 0 q9 -9 18 0 q9 -9 18 0" transform="translate({x} {y}) scale({s})" fill="none" stroke="#17323a" stroke-width="2.4" stroke-linecap="round"/>'
                    for i, (x, y, s) in enumerate([(300, 330, .9), (345, 310, .7), (380, 345, .6)]))
    parts.append(f'<g class="birds">{birds}</g>')
    # 海とダイヤモンドヘッド
    parts.append('<g class="layer layer--sea">')
    parts.append(f'<rect x="0" y="600" width="{W}" height="200" fill="url(#sea)"/>')
    parts.append(f'<path d="M1020 604 C1060 560 1110 548 1150 556 C1190 520 1250 520 1290 552 C1330 548 1380 570 1420 604 Z" fill="{P["far"]}"/>')
    shimmer = "".join(f'<path class="shimmer shimmer--{k % 3}" d="M{x} {y} h{l}" stroke="rgba(255,255,255,.55)" stroke-width="2" stroke-linecap="round"/>'
                      for k, (x, y, l) in enumerate([(rnd.randint(0, W - 120), rnd.randint(615, 690), rnd.randint(30, 110)) for _ in range(26)]))
    parts.append(shimmer + "</g>")
    # 丘（奥→手前）
    parts.append('<g class="layer layer--ridge">' + ridge([0, -40, -10, -70, -30, 10, -20], W, H, P["ridge1"], 650) + "</g>")
    parts.append('<g class="layer layer--ridge2">' + ridge([30, -10, 20, -30, 0, 30], W, H, P["ridge2"], 700) + "</g>")
    # 木・ヤシ・邸宅・二人
    parts.append('<g class="layer layer--trees">')
    parts.append(eucalyptus(170, 900, 640, 420, 11, "tree tree--1"))
    parts.append(eucalyptus(430, 860, 470, 300, 12, "tree tree--2"))
    parts.append(eucalyptus(1540, 880, 520, 300, 13, "tree tree--3"))
    parts.append(palm(1190, 845, 420, 21, .1, "palm palm--hero"))
    parts.append("</g>")
    parts.append('<g class="layer layer--house">' + house(930, 828, 250) + "</g>")
    parts.append('<g class="layer layer--lawn">')
    parts.append(ridge([20, 0, -10, -20, -6, 14], W, H, "url(#lawn)", 830))
    parts.append(couple(860, 845, 92, "couple"))
    parts.append(ridge([30, 18, 34, 22, 40], W, H, P["lawn2"], 925))
    flowers = "".join(plumeria(x, y, r, rot, "plumeria plumeria--lawn") for x, y, r, rot in [(120, 955, 22, 10), (175, 975, 16, 40), (1480, 965, 20, 25), (1530, 945, 14, 60)])
    parts.append(flowers + "</g>")
    parts.append("</svg>")
    return "".join(parts)


# ---------- デモ：ポートレート ----------
def portrait(bride):
    W = H = 600
    g = [f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {W} {H}">', defs()]
    g.append(f'<rect width="{W}" height="{H}" fill="url(#sky)"/>')
    g.append(cloud(150, 150, 34, shade=True) + cloud(470, 110, 26))
    g.append(ridge([0, -20, 10, -14, 6], W, H, P["ridge1"], 440))
    g.append(palm(520 if not bride else 80, 470, 260, 5 if bride else 7, -.12 if not bride else .12, "palm", "#2a5a3a"))
    g.append(ridge([10, 0, -6, 4], W, H, "url(#lawn)", 500))
    cx = 300
    if bride:
        g.append(f'<path d="M{cx - 120} 180 Q{cx} 120 {cx + 120} 180 L{cx + 210} {H} L{cx - 210} {H} Z" fill="rgba(255,255,255,.55)"/>')  # ベール
    # 首・肩
    g.append(f'<rect x="{cx - 26}" y="300" width="52" height="70" rx="20" fill="{P["skin"]}"/>')
    if bride:
        g.append(f'<path d="M{cx - 170} {H} C{cx - 170} 420 {cx - 110} 372 {cx - 60} 365 L{cx + 60} 365 C{cx + 110} 372 {cx + 170} 420 {cx + 170} {H} Z" fill="{P["skin"]}"/>')
        g.append(f'<path d="M{cx - 175} {H} C{cx - 172} 470 {cx - 140} 430 {cx - 100} 425 Q{cx - 50} 455 {cx} 432 Q{cx + 50} 455 {cx + 100} 425 C{cx + 140} 430 {cx + 172} 470 {cx + 175} {H} Z" fill="#ffffff"/>')
        g.append(f'<path d="M{cx - 100} 425 Q{cx - 50} 455 {cx} 432 Q{cx + 50} 455 {cx + 100} 425" fill="none" stroke="#e9e4dc" stroke-width="3"/>')
    else:
        g.append(f'<path d="M{cx - 175} {H} C{cx - 172} 430 {cx - 120} 380 {cx - 58} 372 L{cx + 58} 372 C{cx + 120} 380 {cx + 172} 430 {cx + 175} {H} Z" fill="{P["suit"]}"/>')
        g.append(f'<path d="M{cx - 40} 372 L{cx} 470 L{cx + 40} 372 Z" fill="#ffffff"/>')
        g.append(f'<path d="M{cx - 9} 388 L{cx + 9} 388 L{cx + 7} 470 L{cx} 482 L{cx - 7} 470 Z" fill="#2f6b3a"/>')
        g.append(f'<path d="M{cx - 58} 372 L{cx - 4} 470 L{cx - 70} 430 Z M{cx + 58} 372 L{cx + 4} 470 L{cx + 70} 430 Z" fill="#16233b"/>')
        g.append(plumeria(cx + 98, 450, 26, 12))
    # 顔
    g.append(f'<ellipse cx="{cx}" cy="250" rx="82" ry="96" fill="{P["skin"]}"/>')
    g.append(f'<ellipse cx="{cx - 84}" cy="262" rx="12" ry="18" fill="{P["skin"]}"/><ellipse cx="{cx + 84}" cy="262" rx="12" ry="18" fill="{P["skin"]}"/>')
    if bride:
        g.append(f'<path d="M{cx - 88} 262 C{cx - 100} 160 {cx - 40} 140 {cx} 142 C{cx + 60} 140 {cx + 104} 170 {cx + 88} 262 C{cx + 70} 200 {cx + 20} 190 {cx - 10} 168 C{cx - 30} 200 {cx - 70} 210 {cx - 88} 262 Z" fill="{P["hairB"]}"/>')
        g.append(f'<circle cx="{cx + 40}" cy="136" r="42" fill="{P["hairB"]}"/>')
        g.append(plumeria(cx + 80, 168, 34, 8))
    else:
        g.append(f'<path d="M{cx - 86} 240 C{cx - 96} 160 {cx - 40} 136 {cx + 6} 138 C{cx + 70} 138 {cx + 100} 176 {cx + 86} 240 C{cx + 70} 196 {cx + 10} 186 {cx - 30} 190 C{cx - 60} 194 {cx - 78} 214 {cx - 86} 240 Z" fill="{P["hairD"]}"/>')
    g.append(f'<path d="M{cx - 22} 300 Q{cx} 316 {cx + 22} 300" fill="none" stroke="#b9876b" stroke-width="4" stroke-linecap="round"/>')
    g.append(f'<circle cx="{cx - 52}" cy="282" r="12" fill="#f4a9a0" opacity=".45"/><circle cx="{cx + 52}" cy="282" r="12" fill="#f4a9a0" opacity=".45"/>')
    g.append(demo_tag(W, H))
    g.append("</svg>")
    return "".join(g)


# ---------- デモ：ギャラリー ----------
def frame(W, H, body):
    return f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {W} {H}">{defs()}{body}{demo_tag(W, H)}</svg>'


def g_house():
    W, H = 800, 1000
    b = [f'<rect width="{W}" height="{H}" fill="url(#sky)"/>', cloud(170, 170, 40), cloud(600, 260, 32)]
    b.append(ridge([0, -30, 10, -20], W, H, P["ridge1"], 660))
    b.append(eucalyptus(130, 860, 620, 330, 31))
    b.append(eucalyptus(700, 820, 420, 230, 32))
    b.append(house(470, 800, 230))
    b.append(ridge([10, -6, -14, 4], W, H, "url(#lawn)", 800))
    b.append(couple(420, 815, 80))
    b.append(ridge([20, 30, 16, 34], W, H, P["lawn2"], 900))
    return frame(W, H, "".join(b))


def g_ocean():
    W, H = 800, 1000
    b = [f'<rect width="{W}" height="{H}" fill="url(#sky)"/>', cloud(200, 180, 44), cloud(620, 120, 30)]
    b.append(f'<rect x="0" y="560" width="{W}" height="440" fill="url(#sea)"/>')
    b.append(f'<path d="M260 564 C320 500 380 486 430 498 C480 452 560 456 610 494 C660 490 720 520 780 564 Z" fill="{P["far"]}"/>')
    for k in range(16):
        y = 590 + k * 22
        b.append(f'<path d="M{(k * 97) % 600} {y} h{60 + (k * 37) % 120}" stroke="rgba(255,255,255,.5)" stroke-width="3" stroke-linecap="round"/>')
    b.append(ridge([60, 30, 50], W, H, "url(#lawn)", 840))
    b.append(palm(110, 900, 600, 41, .14, "palm", "#1f4a33"))
    return frame(W, H, "".join(b))


def g_flowers():
    W, H = 800, 1000
    rnd = random.Random(51)
    b = [f'<rect width="{W}" height="{H}" fill="#2f6b3a"/>']
    for _ in range(16):
        x, y = rnd.uniform(-60, W + 60), rnd.uniform(-60, H + 60)
        a = rnd.uniform(0, 180)
        b.append(f'<ellipse cx="{f(x)}" cy="{f(y)}" rx="{f(rnd.uniform(110, 170))}" ry="{f(rnd.uniform(34, 52))}" transform="rotate({f(a)} {f(x)} {f(y)})" fill="{rnd.choice([P["leaf2"], "#3c7d3e", "#25583a"])}"/>')
    for x, y, r, rot in [(240, 260, 120, 8), (560, 420, 100, 40), (300, 650, 110, 20), (620, 800, 80, 60), (130, 880, 70, 12), (660, 150, 70, 30)]:
        b.append(plumeria(x, y, r, rot))
    return frame(W, H, "".join(b))


def g_ceremony():
    W, H = 800, 1000
    b = [f'<rect width="{W}" height="{H}" fill="url(#sky)"/>', cloud(180, 150, 40), cloud(630, 210, 34)]
    b.append(ridge([0, -30, -10, -24], W, H, P["ridge1"], 600))
    b.append(eucalyptus(90, 720, 520, 260, 61))
    b.append(eucalyptus(720, 700, 480, 240, 62))
    b.append(ridge([0, -6, 6, 0], W, H, "url(#lawn)", 690))
    # 花のアーチ
    b.append('<path d="M290 700 L290 470 Q400 360 510 470 L510 700" fill="none" stroke="#ffffff" stroke-width="10"/>')
    rnd = random.Random(7)
    for k in range(30):
        t = k / 29
        ang = math.pi * (1 - t)
        x = 400 + math.cos(ang) * 110 + rnd.uniform(-8, 8)
        y = 470 - math.sin(ang) * 110 + rnd.uniform(-8, 8)
        if 0.05 < t < 0.95:
            b.append(plumeria(x, y, rnd.uniform(14, 20), rnd.uniform(0, 72)))
    for side in (290, 510):
        for k in range(6):
            b.append(plumeria(side + rnd.uniform(-10, 10), 520 + k * 30, rnd.uniform(12, 17), rnd.uniform(0, 72)))
    # バージンロードと椅子
    b.append('<path d="M370 700 L300 1000 L500 1000 L430 700 Z" fill="#f5efe4"/>')
    for row in range(4):
        y = 760 + row * 62
        sc = 1 + row * .18
        for side in (-1, 1):
            for k in range(3):
                x = 400 + side * (95 + row * 22 + k * 62 * sc)
                b.append(f'<rect x="{f(x - 22 * sc)}" y="{f(y)}" width="{f(44 * sc)}" height="{f(40 * sc)}" rx="{f(8 * sc)}" fill="#ffffff" stroke="#e5ddd0" stroke-width="2"/>')
    b.append(couple(400, 690, 120))
    return frame(W, H, "".join(b))


def g_golden():
    W, H = 800, 1000
    b = [f'''<linearGradient id="gold" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#6aa9e0"/><stop offset=".5" stop-color="#ffc48a"/><stop offset=".72" stop-color="#ff9a6b"/></linearGradient>''',
         f'<rect width="{W}" height="{H}" fill="url(#gold)"/>', f'<circle cx="420" cy="590" r="120" fill="url(#sunGlow)"/><circle cx="420" cy="590" r="56" fill="#fff4d2"/>',
         f'<rect x="0" y="620" width="{W}" height="380" fill="#2b6f8c"/>']
    for k in range(12):
        b.append(f'<path d="M{360 - k * 4} {640 + k * 18} h{120 + k * 8}" stroke="rgba(255,214,160,.6)" stroke-width="4" stroke-linecap="round"/>')
    b.append(ridge([40, 20, 50, 30], W, H, "#1e4a33", 820))
    b.append(palm(680, 880, 560, 71, -.16, "palm", "#183c2a"))
    b.append(couple(300, 830, 150))
    return frame(W, H, "".join(b))


def g_night():
    W, H = 800, 1000
    rnd = random.Random(81)
    b = ['<linearGradient id="night" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#0b1d3a"/><stop offset=".6" stop-color="#23406d"/><stop offset="1" stop-color="#3b5f8f"/></linearGradient>',
         f'<rect width="{W}" height="{H}" fill="url(#night)"/>']
    for _ in range(70):
        b.append(f'<circle cx="{f(rnd.uniform(0, W))}" cy="{f(rnd.uniform(0, 520))}" r="{f(rnd.uniform(.8, 2.4))}" fill="#ffffff" opacity="{f(rnd.uniform(.4, 1))}"/>')
    b.append('<circle cx="640" cy="150" r="40" fill="#fff6dc"/><circle cx="656" cy="140" r="38" fill="#0e2346"/>')
    b.append(f'<rect x="0" y="600" width="{W}" height="400" fill="#102a4c"/>')
    b.append('<path d="M480 604 C520 560 570 552 610 560 C650 530 710 534 750 560 C770 566 790 584 800 604 Z" fill="#1a3557"/>')
    for _ in range(260):
        x = rnd.uniform(0, W)
        y = 600 + abs(rnd.gauss(0, 34))
        b.append(f'<circle cx="{f(x)}" cy="{f(y)}" r="{f(rnd.uniform(1, 2.6))}" fill="{rnd.choice(["#ffd88a", "#fff1c9", "#ffb85c"])}"/>')
    b.append(ridge([60, 40, 60, 50], W, H, "#0a1a2e", 760))
    b.append('<rect x="0" y="840" width="800" height="12" fill="#2b1f18"/>')
    for k in range(18):
        b.append(f'<rect x="{k * 46}" y="852" width="8" height="70" fill="#2b1f18"/>')
    b.append(couple(560, 840, 150))
    return frame(W, H, "".join(b))


(OUT / "hero_scene.svg.part").write_text(hero_scene(), encoding="utf-8")
(IMG / "groom.svg").write_text(portrait(False), encoding="utf-8")
(IMG / "bride.svg").write_text(portrait(True), encoding="utf-8")
for name, fn in [("gallery1", g_house), ("gallery2", g_ocean), ("gallery3", g_ceremony), ("gallery4", g_flowers), ("gallery5", g_golden), ("gallery6", g_night)]:
    (IMG / f"{name}.svg").write_text(fn(), encoding="utf-8")
print("ok")
