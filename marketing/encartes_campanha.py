# Encartes da campanha — "Safra Cartográfica" — variações do iContábil IA Simulador.
# Mesmo acabamento do encarte original (pivô central, retícula, anel goniométrico),
# mudando só a mensagem (tag/headline/subtítulo/rodapé). 1080x1350 (4:5), 2x e reduz.
import math
from PIL import Image, ImageDraw, ImageFont, ImageFilter

S = 2
W, H = 1080 * S, 1350 * S
FD = r"C:\Users\Usuario\AppData\Roaming\Claude\local-agent-mode-sessions\skills-plugin\298f4871-2665-4203-a320-ed6ebf114fb6\22216074-6601-483b-b4ba-69e0ba00b4aa\skills\canvas-design\canvas-fonts"

def F(name, size):
    return ImageFont.truetype(f"{FD}\\{name}", int(size * S))

BG = (5, 9, 8); GRID = (18, 30, 24)
GREEN_LO = (24, 74, 50); GREEN_HI = (46, 125, 84)
NEON_G = (61, 224, 140); VIOLET = (142, 108, 241); VIOLET_S = (167, 139, 250)
INK = (234, 246, 238); DIM = (126, 148, 138); DIM2 = (86, 104, 95)


def gerar(out, tag, headline, subtitle, rodape):
    img = Image.new("RGB", (W, H), BG)
    d = ImageDraw.Draw(img)

    # fundo gradiente
    top_l, bot_l = (8, 13, 11), (4, 7, 6)
    for y in range(H):
        t = y / H
        d.line([(0, y), (W, y)], fill=tuple(int(top_l[i] + (bot_l[i] - top_l[i]) * t) for i in range(3)))
    # retícula
    for gx in range(0, 1081, 60):
        d.line([(gx * S, 0), (gx * S, H)], fill=GRID, width=1)
    for gy in range(0, 1351, 60):
        d.line([(0, gy * S), (W, gy * S)], fill=GRID, width=1)
    # marcas de registro
    for (mx, my) in [(54, 54), (1026, 54), (54, 1296), (1026, 1296)]:
        cx, cy, a = mx * S, my * S, 9 * S
        d.line([(cx - a, cy), (cx + a, cy)], fill=DIM2, width=S)
        d.line([(cx, cy - a), (cx, cy + a)], fill=DIM2, width=S)

    def tracked(x, y, text, font, fill, tr, center=False):
        widths = [d.textbbox((0, 0), ch, font=font)[2] for ch in text]
        total = sum(widths) + tr * S * (len(text) - 1)
        cx = x - total / 2 if center else x
        for ch, w in zip(text, widths):
            d.text((cx, y), ch, font=font, fill=fill); cx += w + tr * S
        return total

    def ctr(y, text, font, fill):
        bb = d.textbbox((0, 0), text, font=font)
        d.text(((W - (bb[2] - bb[0])) / 2 - bb[0], y), text, font=font, fill=fill)

    def fit(text, fontfile, maxw, start, mins=58):
        s = start
        while s > mins:
            bb = d.textbbox((0, 0), text, font=F(fontfile, s))
            if bb[2] - bb[0] <= maxw:
                return F(fontfile, s)
            s -= 2
        return F(fontfile, mins)

    # marca
    bw = tracked(W / 2, 96 * S, "iCONTÁBIL IA", F("GeistMono-Bold.ttf", 30), INK, 10, center=True)
    dot_x = W / 2 + bw / 2 + 18 * S
    d.ellipse([(dot_x, 117 * S), (dot_x + 8 * S, 125 * S)], fill=NEON_G)
    tracked(W / 2, 142 * S, tag, F("DMMono-Regular.ttf", 15), DIM, 3, center=True)
    # régua com N
    ry = 182 * S
    d.line([(84 * S, ry), (W / 2 - 20 * S, ry)], fill=DIM2, width=1)
    d.line([(W / 2 + 20 * S, ry), (W - 84 * S, ry)], fill=DIM2, width=1)
    fn = F("DMMono-Regular.ttf", 15); bbn = d.textbbox((0, 0), "N", font=fn)
    d.text((W / 2 - (bbn[2] - bbn[0]) / 2 - bbn[0], ry - (bbn[3] - bbn[1]) / 2 - bbn[1]), "N", font=fn, fill=DIM)

    # pivô
    CX, CY, R, SEAM = 540 * S, 560 * S, 300 * S, 5
    layer = Image.new("RGBA", (W, H), (0, 0, 0, 0)); ld = ImageDraw.Draw(layer)
    n = 24
    for i in range(n):
        t = i / (n - 1); r = int(56 * S + t * (R - 56 * S)); bbox = [CX - r, CY - r, CX + r, CY + r]
        gl = tuple(int(GREEN_LO[k] + (GREEN_HI[k] - GREEN_LO[k]) * t) for k in range(3))
        ld.arc(bbox, 90 + SEAM, 270 - SEAM, fill=gl + (int(150 + 70 * t),), width=max(2, int(2.6 * S)))
        u = 1 - t; gr = tuple(int(NEON_G[k] + (VIOLET[k] - NEON_G[k]) * u) for k in range(3))
        ld.arc(bbox, 270 + SEAM, 450 - SEAM, fill=gr + (int(165 + 80 * t),), width=max(2, int(2.6 * S)))
    glow = layer.filter(ImageFilter.GaussianBlur(7 * S))
    a55 = glow.split()[3].point(lambda v: int(v * 0.55))
    img.paste(Image.composite(glow, Image.new("RGBA", glow.size, (0, 0, 0, 0)), a55).convert("RGB"), (0, 0), a55)
    img.paste(layer.convert("RGB"), (0, 0), layer.split()[3])
    d = ImageDraw.Draw(img)
    d.line([(CX, CY - R + 14 * S), (CX, CY + R - 14 * S)], fill=(10, 16, 13), width=int(3 * S))
    d.ellipse([(CX - 5 * S, CY - 5 * S), (CX + 5 * S, CY + 5 * S)], fill=INK)
    d.ellipse([(CX - 11 * S, CY - 11 * S), (CX + 11 * S, CY + 11 * S)], outline=DIM, width=S)
    RP = R + 34 * S
    for ang in range(0, 360, 6):
        d.arc([CX - RP, CY - RP, CX + RP, CY + RP], ang, ang + 2.6, fill=DIM2, width=S)
    for ang in range(0, 360, 15):
        rad = math.radians(ang); lng = ang % 90 == 0
        r1, r2 = RP + 6 * S, RP + (20 if lng else 12) * S
        d.line([(CX + r1 * math.cos(rad), CY + r1 * math.sin(rad)), (CX + r2 * math.cos(rad), CY + r2 * math.sin(rad))],
               fill=DIM if lng else DIM2, width=S)

    # legenda A/B
    flab = F("DMMono-Regular.ttf", 17); ly = 922 * S
    d.rectangle([(318 * S, ly + 3 * S), (328 * S, ly + 13 * S)], fill=GREEN_HI)
    d.text((338 * S, ly), "A · SIMPLES PURO", font=flab, fill=DIM)
    btxt = "B · SIMPLES HÍBRIDO"; bb = d.textbbox((0, 0), btxt, font=flab); bx = 762 * S - (bb[2] - bb[0]) / 2
    d.rectangle([(bx - 20 * S, ly + 3 * S), (bx - 10 * S, ly + 13 * S)], fill=VIOLET_S)
    d.text((bx, ly), btxt, font=flab, fill=DIM)

    # headline (auto-fit) + subtítulo
    ctr(966 * S, headline, fit(headline, "BigShoulders-Bold.ttf", (1080 - 130) * S, 116), INK)
    ctr(1106 * S, subtitle, F("Jura-Light.ttf", 26), DIM)

    # CTA
    fcta = F("GeistMono-Bold.ttf", 31); cta = "simulador.icontabil.shop"
    bb = d.textbbox((0, 0), cta, font=fcta); tw = bb[2] - bb[0]; px, py = 38 * S, 20 * S; cy0 = 1168 * S
    d.rounded_rectangle([((W - tw) / 2 - px, cy0), ((W + tw) / 2 + px, cy0 + (bb[3] - bb[1]) + 2 * py)],
                        radius=14 * S, outline=NEON_G, width=int(1.5 * S))
    d.text(((W - tw) / 2 - bb[0], cy0 + py - bb[1]), cta, font=fcta, fill=NEON_G)
    tracked(W / 2, 1252 * S, rodape, F("DMMono-Regular.ttf", 15), VIOLET_S, 3, center=True)

    # rodapé
    ff = F("DMMono-Regular.ttf", 13)
    d.text((84 * S, 1296 * S), "iCONTÁBIL IA · CRC BA 024.174/O-3", font=ff, fill=DIM2)
    coords = "12°05'S 45°48'W · OESTE DA BAHIA"; bb = d.textbbox((0, 0), coords, font=ff)
    d.text((W - 84 * S - (bb[2] - bb[0]), 1296 * S), coords, font=ff, fill=DIM2)

    # vinheta + grão
    vig = Image.radial_gradient("L").resize((W, H)).point(lambda v: int(v * 0.22))
    img2 = Image.composite(Image.new("RGB", (W, H), (0, 0, 0)), img, vig)
    noise = Image.effect_noise((W, H), 14).convert("L")
    img2 = Image.blend(img2, Image.merge("RGB", (noise, noise, noise)), 0.03)
    img2.resize((1080, 1350), Image.LANCZOS).save(out, "PNG")
    print("gerado:", out.split("\\")[-1])


base = r"C:\Users\Usuario\Documents\icontabil-simulador\marketing"
# Variação 1 — para o CONTADOR (audiência: amigos contadores)
gerar(base + r"\encarte-contador.png",
      "FERRAMENTA GRÁTIS · PARA O CONTADOR",
      "E OS SEUS CLIENTES?",
      "Simule o regime ideal de cada cliente — puro vs. híbrido, em 2 minutos.",
      "PRAZO DE DECISÃO · 30/SET")
# Variação 2 — PRAZO 30/set (urgência, cliente final)
gerar(base + r"\encarte-prazo.png",
      "REFORMA TRIBUTÁRIA · O PRAZO ESTÁ CORRENDO",
      "30 DE SETEMBRO",
      "É o prazo pra escolher o regime IBS/CBS. Simule agora — grátis, em 2 min.",
      "SIMULAÇÃO GRATUITA · SEM COMPROMISSO")
