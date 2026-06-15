# Encarte WhatsApp — "Safra Cartográfica" — iContábil IA Simulador
# 1080x1350 (4:5), desenhado em 2x e reduzido p/ acabamento fino.
import math
from PIL import Image, ImageDraw, ImageFont, ImageFilter

S = 2
W, H = 1080 * S, 1350 * S
FD = r"C:\Users\Usuario\AppData\Roaming\Claude\local-agent-mode-sessions\skills-plugin\298f4871-2665-4203-a320-ed6ebf114fb6\22216074-6601-483b-b4ba-69e0ba00b4aa\skills\canvas-design\canvas-fonts"

def F(name, size):
    return ImageFont.truetype(f"{FD}\\{name}", int(size * S))

# paleta
BG       = (5, 9, 8)
GRID     = (18, 30, 24)
GREEN_LO = (24, 74, 50)    # lavoura conhecida (escuro)
GREEN_HI = (46, 125, 84)
NEON_G   = (61, 224, 140)  # neon marca
VIOLET   = (142, 108, 241)
VIOLET_S = (167, 139, 250)
INK      = (234, 246, 238) # texto principal
DIM      = (126, 148, 138) # texto apagado
DIM2     = (86, 104, 95)

img = Image.new("RGB", (W, H), BG)
d = ImageDraw.Draw(img)

# ---------- fundo: leve gradiente vertical ----------
top_l, bot_l = (8, 13, 11), (4, 7, 6)
for y in range(H):
    t = y / H
    c = tuple(int(top_l[i] + (bot_l[i] - top_l[i]) * t) for i in range(3))
    d.line([(0, y), (W, y)], fill=c)

# ---------- retícula de levantamento ----------
for gx in range(0, 1081, 60):
    d.line([(gx * S, 0), (gx * S, H)], fill=GRID, width=1)
for gy in range(0, 1351, 60):
    d.line([(0, gy * S), (W, gy * S)], fill=GRID, width=1)

# marcas de registro nos cantos
def reg_mark(cx, cy):
    cx, cy = cx * S, cy * S
    a = 9 * S
    d.line([(cx - a, cy), (cx + a, cy)], fill=DIM2, width=S)
    d.line([(cx, cy - a), (cx, cy + a)], fill=DIM2, width=S)
for (mx, my) in [(54, 54), (1026, 54), (54, 1296), (1026, 1296)]:
    reg_mark(mx, my)

# ---------- helpers de texto ----------
def tracked(draw, x, y, text, font, fill, tracking, anchor_center=False):
    widths = [draw.textbbox((0, 0), ch, font=font)[2] for ch in text]
    total = sum(widths) + tracking * S * (len(text) - 1)
    cx = x - total / 2 if anchor_center else x
    for ch, w in zip(text, widths):
        draw.text((cx, y), ch, font=font, fill=fill)
        cx += w + tracking * S
    return total

def center(draw, y, text, font, fill):
    bb = draw.textbbox((0, 0), text, font=font)
    draw.text(((W - (bb[2] - bb[0])) / 2 - bb[0], y), text, font=font, fill=fill)

# ---------- topo: marca ----------
f_brand = F("GeistMono-Bold.ttf", 30)
bw = tracked(d, W / 2, 96 * S, "iCONTÁBIL IA", f_brand, INK, 10, anchor_center=True)
# ponto neon respirando após a marca
dot_x = W / 2 + bw / 2 + 18 * S
d.ellipse([(dot_x, 117 * S), (dot_x + 8 * S, 125 * S)], fill=NEON_G)

f_tag = F("DMMono-Regular.ttf", 15)
tracked(d, W / 2, 142 * S, "LEVANTAMENTO Nº 001 — REFORMA TRIBUTÁRIA · IBS / CBS", f_tag, DIM, 3, anchor_center=True)

# régua fina com vão central — o Norte mora no vão (marca de agrimensor)
ry = 182 * S
d.line([(84 * S, ry), (W / 2 - 20 * S, ry)], fill=DIM2, width=1)
d.line([(W / 2 + 20 * S, ry), (W - 84 * S, ry)], fill=DIM2, width=1)
f_norte = F("DMMono-Regular.ttf", 15)
bbn = d.textbbox((0, 0), "N", font=f_norte)
d.text((W / 2 - (bbn[2] - bbn[0]) / 2 - bbn[0], ry - (bbn[3] - bbn[1]) / 2 - bbn[1]), "N", font=f_norte, fill=DIM)

# ---------- o pivô ----------
CX, CY, R = 540 * S, 560 * S, 300 * S
SEAM = 5  # graus de vão na costura

layer = Image.new("RGBA", (W, H), (0, 0, 0, 0))
ld = ImageDraw.Draw(layer)

n_rings = 24
for i in range(n_rings):
    t = i / (n_rings - 1)
    r = int(56 * S + t * (R - 56 * S))
    bbox = [CX - r, CY - r, CX + r, CY + r]
    # esquerda: lavoura conhecida (90..270 no PIL = metade esquerda)
    gl = tuple(int(GREEN_LO[k] + (GREEN_HI[k] - GREEN_LO[k]) * t) for k in range(3))
    alpha_l = int(150 + 70 * t)
    ld.arc(bbox, 90 + SEAM, 270 - SEAM, fill=gl + (alpha_l,), width=max(2, int(2.6 * S)))
    # direita: o novo (neon verde -> violeta, de fora p/ dentro)
    u = 1 - t
    gr = tuple(int(NEON_G[k] + (VIOLET[k] - NEON_G[k]) * u) for k in range(3))
    alpha_r = int(165 + 80 * t)
    ld.arc(bbox, 270 + SEAM, 450 - SEAM, fill=gr + (alpha_r,), width=max(2, int(2.6 * S)))

# brilho contido sob a metade neon
glow = layer.filter(ImageFilter.GaussianBlur(7 * S))
img.paste(Image.composite(glow, Image.new("RGBA", glow.size, (0, 0, 0, 0)),
                          glow.split()[3].point(lambda a: int(a * 0.55))).convert("RGB"),
          (0, 0), glow.split()[3].point(lambda a: int(a * 0.55)))
img.paste(layer.convert("RGB"), (0, 0), layer.split()[3])
d = ImageDraw.Draw(img)

# costura central (carreador)
d.line([(CX, CY - R + 14 * S), (CX, CY + R - 14 * S)], fill=(10, 16, 13), width=int(3 * S))

# centro do pivô
d.ellipse([(CX - 5 * S, CY - 5 * S), (CX + 5 * S, CY + 5 * S)], fill=INK)
d.ellipse([(CX - 11 * S, CY - 11 * S), (CX + 11 * S, CY + 11 * S)], outline=DIM, width=S)

# ---------- anel goniométrico ----------
RP = R + 34 * S
for a in range(0, 360, 6):
    a0 = math.radians(a)
    a1 = math.radians(a + 2.6)
    d.arc([CX - RP, CY - RP, CX + RP, CY + RP], a, a + 2.6, fill=DIM2, width=S)
# ticks a cada 15°, maiores nos cardeais
for a in range(0, 360, 15):
    rad = math.radians(a)
    long = a % 90 == 0
    r1 = RP + 6 * S
    r2 = RP + (20 if long else 12) * S
    x1, y1 = CX + r1 * math.cos(rad), CY + r1 * math.sin(rad)
    x2, y2 = CX + r2 * math.cos(rad), CY + r2 * math.sin(rad)
    d.line([(x1, y1), (x2, y2)], fill=DIM if long else DIM2, width=S)


# ---------- legendas A / B ----------
f_lab = F("DMMono-Regular.ttf", 17)
ly = 922 * S
# A — esquerda
ax = 318 * S
d.rectangle([(ax, ly + 3 * S), (ax + 10 * S, ly + 13 * S)], fill=GREEN_HI)
d.text((ax + 20 * S, ly), "A · SIMPLES PURO", font=f_lab, fill=DIM)
# B — direita
btxt = "B · SIMPLES HÍBRIDO"
bb = d.textbbox((0, 0), btxt, font=f_lab)
bx = 762 * S - (bb[2] - bb[0]) / 2
d.rectangle([(bx - 20 * S, ly + 3 * S), (bx - 10 * S, ly + 13 * S)], fill=VIOLET_S)
d.text((bx, ly), btxt, font=f_lab, fill=DIM)

# ---------- headline ----------
f_big = F("BigShoulders-Bold.ttf", 116)
center(d, 968 * S, "PURO OU HÍBRIDO?", f_big, INK)

f_sub = F("Jura-Light.ttf", 27)
center(d, 1106 * S, "Descubra grátis, em 2 minutos, o regime que paga menos.", f_sub, DIM)

# ---------- CTA ----------
f_cta = F("GeistMono-Bold.ttf", 31)
cta = "simulador.icontabil.shop"
bb = d.textbbox((0, 0), cta, font=f_cta)
tw = bb[2] - bb[0]
pad_x, pad_y = 38 * S, 20 * S
cy0 = 1168 * S
x0 = (W - tw) / 2 - pad_x
x1 = (W + tw) / 2 + pad_x
y1 = cy0 + (bb[3] - bb[1]) + 2 * pad_y
d.rounded_rectangle([(x0, cy0), (x1, y1)], radius=14 * S, outline=NEON_G, width=int(1.5 * S))
d.text(((W - tw) / 2 - bb[0], cy0 + pad_y - bb[1]), cta, font=f_cta, fill=NEON_G)

f_prazo = F("DMMono-Regular.ttf", 15)
tracked(d, W / 2, 1252 * S, "PRAZO DE DECISÃO · 30/SET", f_prazo, VIOLET_S, 3, anchor_center=True)

# ---------- rodapé ----------
f_foot = F("DMMono-Regular.ttf", 13)
d.text((84 * S, 1296 * S), "iCONTÁBIL IA · CRC BA 024.174/O-3", font=f_foot, fill=DIM2)
coords = "12°05'S 45°48'W · OESTE DA BAHIA"
bb = d.textbbox((0, 0), coords, font=f_foot)
d.text((W - 84 * S - (bb[2] - bb[0]), 1296 * S), coords, font=f_foot, fill=DIM2)

# ---------- vinheta + grão ----------
vig = Image.radial_gradient("L").resize((W, H))
vig = vig.point(lambda v: int(v * 0.22))
img = Image.composite(Image.new("RGB", (W, H), (0, 0, 0)), img, vig)

noise = Image.effect_noise((W, H), 14).convert("L")
img = Image.blend(img, Image.merge("RGB", (noise, noise, noise)), 0.03)

# ---------- saída ----------
out = img.resize((1080, 1350), Image.LANCZOS)
out.save(r"C:\Users\Usuario\Documents\icontabil-simulador\marketing\encarte-whatsapp-simulador.png", "PNG")
print("OK encarte gerado")
