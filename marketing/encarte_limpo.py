# Encarte LIMPO/CLARO para grupos de WhatsApp — marca iContábil em destaque.
# 1080x1350 (4:5), desenhado em 2x e reduzido p/ acabamento fino.
from PIL import Image, ImageDraw, ImageFont

S = 2
W, H = 1080 * S, 1350 * S
FD = r"C:\Users\Usuario\AppData\Roaming\Claude\local-agent-mode-sessions\skills-plugin\298f4871-2665-4203-a320-ed6ebf114fb6\22216074-6601-483b-b4ba-69e0ba00b4aa\skills\canvas-design\canvas-fonts"
def F(name, size): return ImageFont.truetype(f"{FD}\\{name}", int(size * S))

# Paleta clara / marca iContábil
BG       = (255, 255, 255)
BG_SOFT  = (244, 250, 247)
INK      = (23, 33, 39)     # texto escuro
GRAY     = (104, 122, 134)  # texto secundário
GREEN    = (22, 163, 74)
GREEN_HI = (34, 197, 94)
GREEN_LT = (226, 245, 234)  # fundo suave verde
VIOLET   = (147, 95, 224)
VIOLET_LT= (240, 233, 251)  # fundo suave violeta
LINE     = (228, 235, 231)

img = Image.new("RGB", (W, H), BG)
d = ImageDraw.Draw(img)

# fundo: faixa clara suave no topo
for y in range(int(360 * S)):
    t = y / (360 * S)
    c = tuple(int(BG_SOFT[i] + (BG[i] - BG_SOFT[i]) * t) for i in range(3))
    d.line([(0, y), (W, y)], fill=c)

def ctr(y, text, font, fill):
    bb = d.textbbox((0, 0), text, font=font)
    d.text(((W - (bb[2] - bb[0])) / 2 - bb[0], y), text, font=font, fill=fill)
    return bb[3] - bb[1]

def tracked(cx, y, text, font, fill, tr):
    widths = [d.textbbox((0, 0), ch, font=font)[2] for ch in text]
    total = sum(widths) + tr * S * (len(text) - 1)
    x = cx - total / 2
    for ch, w in zip(text, widths):
        d.text((x, y), ch, font=font, fill=fill); x += w + tr * S

def grad_rrect(box, r, c1, c2):
    x0, y0, x1, y1 = box; w, h = int(x1 - x0), int(y1 - y0)
    g = Image.new("RGB", (w, h))
    gd = ImageDraw.Draw(g)
    for i in range(w):
        t = i / max(1, w - 1)
        gd.line([(i, 0), (i, h)], fill=tuple(int(c1[k] + (c2[k] - c1[k]) * t) for k in range(3)))
    m = Image.new("L", (w, h), 0)
    ImageDraw.Draw(m).rounded_rectangle([0, 0, w - 1, h - 1], radius=r, fill=255)
    img.paste(g, (int(x0), int(y0)), m)

# ---------- marca: símbolo + wordmark ----------
mk = 96 * S
mx0 = (W - mk) / 2
grad_rrect([mx0, 88 * S, mx0 + mk, 88 * S + mk], 26 * S, GREEN_HI, VIOLET)
# símbolo: 3 barras ascendentes (crescimento) em branco
bw = 11 * S
bx = mx0 + 24 * S
for i, bh in enumerate([26, 40, 56]):
    d.rounded_rectangle([bx + i * (bw + 8 * S), 88 * S + mk - 24 * S - bh * S,
                         bx + i * (bw + 8 * S) + bw, 88 * S + mk - 24 * S], radius=3 * S, fill=(255, 255, 255))

# wordmark "iContábil IA"
fw = F("Outfit-Bold.ttf", 46)
word1, word2 = "iContábil ", "IA"
w1 = d.textbbox((0, 0), word1, font=fw)[2]
w2 = d.textbbox((0, 0), word2, font=fw)[2]
wx = (W - (w1 + w2)) / 2
yw = 212 * S
d.text((wx, yw), word1, font=fw, fill=INK)
d.text((wx + w1, yw), word2, font=fw, fill=GREEN)
tracked(W / 2, 278 * S, "CONTABILIDADE · REFORMA TRIBUTÁRIA", F("WorkSans-Bold.ttf", 17), GRAY, 4)

# divisor curto
d.line([(W / 2 - 40 * S, 322 * S), (W / 2 + 40 * S, 322 * S)], fill=LINE, width=2 * S)

# ---------- eyebrow + headline ----------
tracked(W / 2, 388 * S, "SEU CLIENTE NO SIMPLES NACIONAL", F("WorkSans-Bold.ttf", 19), GREEN, 3)
# "Puro ou híbrido?" com cores
fh = F("Outfit-Bold.ttf", 92)
parts = [("Puro ", INK), ("ou ", INK), ("híbrido?", VIOLET)]
tot = sum(d.textbbox((0, 0), t, font=fh)[2] for t, _ in parts)
hx = (W - tot) / 2; hy = 430 * S
for t, col in parts:
    d.text((hx, hy), t, font=fh, fill=col); hx += d.textbbox((0, 0), t, font=fh)[2]

# subtítulo (2 linhas)
fs = F("InstrumentSans-Regular.ttf", 30)
ctr(572 * S, "Descubra grátis, em 2 minutos, qual regime", fs, GRAY)
ctr(612 * S, "faz pagar menos — já com IBS/CBS oficial.", fs, GRAY)

# ---------- dois cartões de comparação ----------
cy0, ch = 700 * S, 150 * S
gap = 30 * S
cw = (W - 2 * 110 * S - gap) / 2
lx, rx = 110 * S, 110 * S + cw + gap
d.rounded_rectangle([lx, cy0, lx + cw, cy0 + ch], radius=20 * S, fill=GREEN_LT)
d.rounded_rectangle([rx, cy0, rx + cw, cy0 + ch], radius=20 * S, fill=VIOLET_LT)
fcl = F("Outfit-Bold.ttf", 30); fcs = F("InstrumentSans-Regular.ttf", 21)
def card(x, titulo, sub, col):
    bb = d.textbbox((0, 0), titulo, font=fcl)
    d.text((x + (cw - (bb[2] - bb[0])) / 2, cy0 + 36 * S), titulo, font=fcl, fill=col)
    bb2 = d.textbbox((0, 0), sub, font=fcs)
    d.text((x + (cw - (bb2[2] - bb2[0])) / 2, cy0 + 88 * S), sub, font=fcs, fill=GRAY)
card(lx, "SIMPLES PURO", "tudo no DAS", GREEN)
card(rx, "HÍBRIDO", "IBS/CBS por fora", VIOLET)
# "ou" no meio
fo = F("Outfit-Bold.ttf", 26)
ob = d.textbbox((0, 0), "ou", font=fo)
d.ellipse([W / 2 - 26 * S, cy0 + ch / 2 - 26 * S, W / 2 + 26 * S, cy0 + ch / 2 + 26 * S], fill=(255, 255, 255), outline=LINE, width=2 * S)
d.text((W / 2 - (ob[2] - ob[0]) / 2, cy0 + ch / 2 - (ob[3] - ob[1]) / 2 - ob[1]), "ou", font=fo, fill=INK)

# ---------- benefícios ----------
fb = F("InstrumentSans-Regular.ttf", 27)
beneficios = ["Grátis para testar", "Resultado na hora, em 2 minutos", "Alíquota oficial da Receita (IBS/CBS)"]
by = 912 * S
for i, b in enumerate(beneficios):
    y = by + i * 56 * S
    bb = d.textbbox((0, 0), b, font=fb)
    total = 42 * S + (bb[2] - bb[0])
    x = (W - total) / 2
    d.ellipse([x, y + 2 * S, x + 30 * S, y + 32 * S], fill=GREEN_HI)
    cx, cyc = x + 15 * S, y + 17 * S  # check desenhado (nítido)
    d.line([(cx - 6 * S, cyc), (cx - 1 * S, cyc + 6 * S), (cx + 7 * S, cyc - 6 * S)],
           fill=(255, 255, 255), width=int(3 * S), joint="curve")
    d.text((x + 42 * S, y), b, font=fb, fill=INK)

# ---------- CTA ----------
tracked(W / 2, 1098 * S, "ACESSE GRÁTIS E SIMULE AGORA", F("WorkSans-Bold.ttf", 18), GRAY, 3)
fc = F("Outfit-Bold.ttf", 34); cta = "simulador.icontabil.shop"
cb = d.textbbox((0, 0), cta, font=fc); tw = cb[2] - cb[0]
px, py = 46 * S, 24 * S; bx0 = (W - tw) / 2 - px; by0 = 1140 * S
grad_rrect([bx0, by0, (W + tw) / 2 + px, by0 + (cb[3] - cb[1]) + 2 * py], 16 * S, GREEN_HI, GREEN)
d.text(((W - tw) / 2 - cb[0], by0 + py - cb[1]), cta, font=fc, fill=(255, 255, 255))

# ---------- prazo + rodapé ----------
fp = F("WorkSans-Bold.ttf", 22); prazo = "A escolha vence em 30 de setembro"
pb = d.textbbox((0, 0), prazo, font=fp); pw = pb[2] - pb[0]
ppx = 28 * S; py0 = 1248 * S
d.rounded_rectangle([(W - pw) / 2 - ppx, py0, (W + pw) / 2 + ppx, py0 + (pb[3] - pb[1]) + 26 * S], radius=24 * S, fill=VIOLET_LT)
d.text(((W - pw) / 2 - pb[0], py0 + 13 * S - pb[1]), prazo, font=fp, fill=VIOLET)
ctr(1316 * S, "Carlos A. Silva  ·  CRC BA 024.174/O-3  ·  Oeste da Bahia", F("WorkSans-Regular.ttf", 16), GRAY)

img.resize((1080, 1350), Image.LANCZOS).save(
    r"C:\Users\Usuario\Documents\icontabil-simulador\marketing\encarte-limpo-whatsapp.png", "PNG")
print("OK encarte limpo gerado")
