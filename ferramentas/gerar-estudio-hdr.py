# Gera assets/estudio.hdr: ambiente de estúdio fotográfico (equirretangular, Radiance RGBE com RLE)
# para os reflexos do vidro no hero — sala escura, duas faixas verticais e um softbox de cima.
# As luzes ficam acima de ~20° de elevação: o tampo plano da chapa (visto a 16°) reflete só o escuro.
# Uso: python3 ferramentas/gerar-estudio-hdr.py assets/estudio.hdr [claro|vitrine]
#   vitrine: estúdio escuro com softboxes largos e suaves (reflexos amplos, sem cintilar no giro)
#   claro: estúdio branco com painéis escuros nas laterais (desenham as bordas do vidro)
import math, sys
W, H = 512, 256
MODO = sys.argv[2] if len(sys.argv) > 2 else ''
CLARO = MODO == 'claro'

def caixa(u, v, u0, u1, v0, v1, suave):
    du = max(u0 - u, 0, u - u1); dv = max(v0 - v, 0, v - v1)
    return max(0.0, 1.0 - math.hypot(du, dv) / suave)

def pixel_claro(u, v):
    r = g = b = 0.85 if v < 0.5 else 0.62                    # estúdio branco (piso um pouco mais escuro)
    b += 0.03
    for u0 in (0.10, 0.62):                                   # painéis pretos: linhas escuras nas bordas do vidro
        k = caixa(u, v, u0, u0 + 0.06, 0.16, 0.56, 0.03)
        r, g, b = r * (1 - 0.97 * k), g * (1 - 0.97 * k), b * (1 - 0.95 * k)
    k = caixa(u, v, 0.38, 0.62, 0.01, 0.14, 0.05) * 4.0       # softbox de cima
    return r + k, g + k, b + k

def pixel_vitrine(u, v):
    r = g = b = 0.004 if v < 0.5 else 0.002                    # sala escura
    k = caixa(u, v, 0.10, 0.20, 0.10, 0.40, 0.09) * 3.2         # softbox largo à esquerda, frio
    r += k * 0.88; g += k * 0.94; b += k
    k = caixa(u, v, 0.76, 0.86, 0.10, 0.40, 0.09) * 2.6         # softbox largo à direita, neutro-quente
    r += k; g += k * 0.95; b += k * 0.86
    k = caixa(u, v, 0.35, 0.65, 0.00, 0.10, 0.10) * 2.0         # teto: a luz do spot espalhada
    r += k; g += k * 0.97; b += k * 0.92
    return r, g, b

def pixel(u, v):
    if MODO == 'vitrine':
        return pixel_vitrine(u, v)
    if CLARO:
        return pixel_claro(u, v)
    fundo = (0.11, 0.13, 0.17) if v < 0.5 else (0.05, 0.06, 0.08)   # sala cinza-escura: dá corpo ao vidro
    r, g, b = fundo
    k = caixa(u, v, 0.16, 0.19, 0.08, 0.36, 0.02) * 14.0   # faixa esquerda, fria
    r += k * 0.86; g += k * 0.93; b += k * 1.00
    k = caixa(u, v, 0.81, 0.84, 0.08, 0.36, 0.02) * 11.0   # faixa direita, levemente quente
    r += k * 1.00; g += k * 0.90; b += k * 0.74
    k = caixa(u, v, 0.0, 1.0, 0.27, 0.34, 0.03) * 2.2      # anel alto: desenha as bordas do vidro
    r += k * 0.92; g += k * 0.96; b += k
    k = caixa(u, v, 0.40, 0.60, 0.02, 0.12, 0.04) * 6.0    # softbox de cima
    r += k; g += k; b += k
    return r, g, b

def rgbe(r, g, b):
    v = max(r, g, b)
    if v < 1e-32:
        return (0, 0, 0, 0)
    m, e = math.frexp(v)
    s = m * 256.0 / v
    return (int(r * s), int(g * s), int(b * s), e + 128)

def rle(canal):
    out = bytearray(); i = 0; n = len(canal)
    while i < n:
        j = i
        while j < n and j - i < 127 and canal[j] == canal[i]:
            j += 1
        if j - i >= 3:
            out += bytes([128 + (j - i), canal[i]]); i = j; continue
        j = i; lit = bytearray()
        while j < n and len(lit) < 128:
            if j + 2 < n and canal[j] == canal[j + 1] == canal[j + 2]:
                break
            lit.append(canal[j]); j += 1
        out += bytes([len(lit)]) + lit; i = j
    return out

dados = bytearray(f'#?RADIANCE\nFORMAT=32-bit_rle_rgbe\n\n-Y {H} +X {W}\n'.encode())
for y in range(H):
    v = (y + 0.5) / H
    linha = [rgbe(*pixel((x + 0.5) / W, v)) for x in range(W)]
    dados += bytes([2, 2, W >> 8, W & 255])
    for c in range(4):
        dados += rle([p[c] for p in linha])
open(sys.argv[1], 'wb').write(dados)
