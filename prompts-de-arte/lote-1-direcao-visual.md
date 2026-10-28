# Prompts de arte — Lote 1: direção visual

Objetivo: **descobrir a cara do site**, não produzir arte final. Cada geração devolve uma grade com 4 a 6 variações,
para você apontar "essa sim, essa não". Com as escolhas, o Lote 2 gera o que vai de fato para o site.

## Orçamento

| # | Geração | Anexar (pasta `referencias/`) | Decide |
|---|---|---|---|
| 1 | Esquadria explodida — 4 estilos | `01-switch-montado.png`, `02-switch-explodido.png` | Estilo da seção "Como funciona" |
| 2 | Hero — busto de vidro em 4 luzes | `03-busto-de-vidro.png`, `04-logo-ecg.png` | Cor e luz do hero (e do site) |
| 3 | Componentes de interface em vidro | `03-busto-de-vidro.png` | Botões, cards, etiquetas |
| 4 | Detalhes do setor vidreiro (materiais) | nenhum | Texturas e pequenos detalhes |

**Total: 4 gerações.** Se uma sair ruim, refaça só ela (no máximo +1 por item). Salve as imagens em
`prompts-de-arte/gerados/` com o nome `g1.png`, `g2.png`… e me avise. Eu avalio junto com você.

Dica: cole o prompt inteiro, em inglês, numa conversa nova para cada geração (o ChatGPT não "contamina" uma com a outra).

---

## Geração 1 — Esquadria explodida (4 estilos)

**Anexar:** `referencias/01-switch-montado.png` e `referencias/02-switch-explodido.png`

```
STYLE BIBLE — ECG Sistemas website. ECG is a Brazilian software company (since 2008) whose software runs glass shops, aluminium window fabricators and glass tempering plants. The website concept: "a website built out of glass" — every element feels like it was cut, polished, tempered and assembled like real architectural glass and aluminium. Brand colours: deep navy #05377B, bright blue #1E6FC4, warm amber #F7941E, slate #3D5577. Tone: precise, engineered, calm, premium — the opposite of a generic SaaS template. No people, no stock-photo look, no neon, no purple gradients.

TASK: The attached images show an exploded technical illustration of a keyboard switch with leader lines and small labels. Use the same idea, composition logic and level of precision, but the object is a two-panel SLIDING ALUMINIUM WINDOW (Brazilian "janela de correr 2 folhas"), shown in isometric view, exploded vertically and slightly sideways so every part floats apart along dashed alignment lines.

Parts to show, separated and in assembly order:
1. outer aluminium frame: top track, bottom track, two side jambs
2. two sliding sashes, each with its own aluminium sash profiles
3. two panes of 8 mm tempered glass (one per sash)
4. black EPDM rubber glazing gaskets around each pane
5. pile weatherstrip brushes
6. small nylon rollers (two per sash, at the bottom)
7. a lock/latch and a recessed handle
8. a few stainless steel screws

Each part has a thin leader line ending in a short uppercase label in a monospaced font. Use these exact Portuguese labels: "TRILHO SUPERIOR", "TRILHO INFERIOR", "MONTANTE", "FOLHA", "VIDRO TEMPERADO 8 MM", "BORRACHA EPDM", "ESCOVA DE VEDAÇÃO", "ROLDANA", "FECHO", "PUXADOR", "PARAFUSO". Two of the labels ("VIDRO TEMPERADO 8 MM" and "ROLDANA") are highlighted as solid dark boxes with white text, like the highlighted labels in the reference.

OUTPUT: ONE single landscape image divided into a 2×2 grid of four equal panels, thin white gutters between them, same window, same camera angle, same explosion in all four. Only the rendering style changes:
- Top-left: pure technical line art exactly like the reference — off-white background with a very subtle dot grid, thin dark grey outlines, flat light-grey fills, dashed alignment lines.
- Top-right: same line art, but the two glass panes are rendered as REAL glass — clear, slightly refractive, with the faint green tint visible on the cut edges of float glass, and soft reflections. Aluminium stays as line art.
- Bottom-left: blueprint version — deep navy #05377B background, crisp white and light-blue lines, labels in white.
- Bottom-right: soft studio render — all metal and rubber parts in matte white "clay", the glass panes as real clear glass with green edges, soft contact shadows, light grey background.

No title, no logo, no watermark, no extra text besides the part labels.
```

**Como avaliar:** qual dos 4 estilos você colocaria no site? Os rótulos em português saíram certos? (Se não, tudo bem: no site os rótulos serão texto de verdade, por cima do desenho, o que ainda ajuda o SEO.)

---

## Geração 2 — Hero: o busto de vidro em 4 luzes

**Anexar:** `referencias/03-busto-de-vidro.png` e `referencias/04-logo-ecg.png`

```
STYLE BIBLE — ECG Sistemas website. ECG is a Brazilian software company (since 2008) whose software runs glass shops, aluminium window fabricators and glass tempering plants. The website concept: "a website built out of glass" — every element feels like it was cut, polished, tempered and assembled like real architectural glass and aluminium. Brand colours: deep navy #05377B, bright blue #1E6FC4, warm amber #F7941E, slate #3D5577. Tone: precise, engineered, calm, premium — the opposite of a generic SaaS template. No people, no stock-photo look, no neon, no purple gradients.

TASK: The first attached image is our 3D hero object: the ECG logo (a blue and yellow circular arrow forming an "e", followed by the letters "CG") standing on a thick round base of clear glass. The second image is the flat logo for reference. Keep the logo shape, letters and colours EXACTLY as they are — do not redraw, restyle or misspell it.

Explore the LIGHT and BACKGROUND around this object for the hero section of the website. The object is the light source of the page: light passes through the glass base and the logo and projects caustics (the bright, rippling light patterns that glass casts on a surface) onto the floor and the background.

OUTPUT: ONE single landscape image divided into a 2×2 grid of four equal 16:9 panels, thin white gutters. In every panel the object sits on the RIGHT third of the frame, leaving the left half calm and empty (that is where the headline will go). Same object, same camera angle; only light and background change:
- Top-left: bright daylight — warm off-white surface and background, sun coming from the back-left, crisp blue and amber caustics spilling forward across the floor.
- Top-right: dark — deep blue-black graphite background, a single narrow beam of light hits the glass from above, caustics glow blue and amber on a dark floor, very cinematic but not neon.
- Bottom-left: behind the object, a large pane of sandblasted (frosted) glass, through which the blurred silhouette of an aluminium window frame and soft daylight are visible.
- Bottom-right: the object stands on a thick slab of float glass whose polished edge shows the characteristic green tint; cool, clean, almost white background, subtle reflections.

Photorealistic product photography, physically correct glass, shallow depth of field. No text, no UI, no watermark.
```

**Como avaliar:** claro ou escuro? Qual cor de luz combina com a marca? Os desenhos de luz (cáusticas) serão feitos em código, então aqui o que importa é a **atmosfera**, não a precisão.

---

## Geração 3 — Componentes de interface feitos de vidro

**Anexar:** `referencias/03-busto-de-vidro.png` (só para o ChatGPT entender o material e as cores)

```
STYLE BIBLE — ECG Sistemas website. ECG is a Brazilian software company (since 2008) whose software runs glass shops, aluminium window fabricators and glass tempering plants. The website concept: "a website built out of glass" — every element feels like it was cut, polished, tempered and assembled like real architectural glass and aluminium. Brand colours: deep navy #05377B, bright blue #1E6FC4, warm amber #F7941E, slate #3D5577. Tone: precise, engineered, calm, premium — the opposite of a generic SaaS template. No people, no stock-photo look, no neon, no purple gradients.

TASK: Design a sheet of website UI components that are made from REAL glass, as if a glazier had cut and finished them in a workshop. IMPORTANT: this is NOT generic "glassmorphism" (no blurry white rounded rectangles with a white border). Use real glass-craft techniques: polished bevelled edges ("bisotê"), sandblasted/frosted etching, the green tint of float-glass edges, laminated layers, tempered-glass corner stamps, metal standoff bolts, aluminium profiles holding the glass.

OUTPUT: ONE single landscape image, a 3×2 grid of six components photographed from the front with a slight 3/4 angle, on a light neutral grey studio background with soft shadows. Each component in its own cell:
1. Primary button: a small rectangular glass slab with a wide polished bevel, a deep navy (#05377B) back-painted layer, and the text "Quero testar grátis" etched in white.
2. Secondary button: clear glass with only the text "Ver produtos" sandblasted (frosted) into it, held by a thin aluminium U-profile at the bottom.
3. Content card: a thick clear glass panel with visible green edge, a frosted title area reading "Orçamentos", fixed to the wall with four small stainless standoff bolts.
4. Small tag / label: a production label sticker on a glass corner, like the ones glass factories use, with a barcode, a batch number and the text "ECG TEMPER".
5. Big statistic: the number "708" engraved deep into a thick glass block so that light catches the engraving, with the small text "empresas" frosted below.
6. Navigation bar: a long thin strip of laminated glass (two layers with a coloured interlayer in deep navy), with the words "Produtos  Prêmios  Cobertura  Contato" frosted on it.

Photorealistic, physically correct glass, clean studio lighting. Keep all text exactly as written. No logo, no watermark.
```

**Como avaliar:** que técnica de vidro vira botão, qual vira card? Talvez nenhuma vá literal para o site. Serve para escolher a **linguagem** (bisotê, jateado, laminado, etiqueta…).

---

## Geração 4 — Detalhes do setor vidreiro (painel de materiais)

**Anexar:** nada.

```
STYLE BIBLE — ECG Sistemas website. ECG is a Brazilian software company (since 2008) whose software runs glass shops, aluminium window fabricators and glass tempering plants. The website concept: "a website built out of glass" — every element feels like it was cut, polished, tempered and assembled like real architectural glass and aluminium. Brand colours: deep navy #05377B, bright blue #1E6FC4, warm amber #F7941E, slate #3D5577. Tone: precise, engineered, calm, premium — the opposite of a generic SaaS template. No people, no stock-photo look, no neon, no purple gradients.

TASK: A material and detail board for the website's art direction: six extreme close-up macro photographs of real details from the glass and aluminium window industry.

OUTPUT: ONE single landscape image, a 3×2 grid of six square macro photos, thin white gutters, consistent soft daylight, shallow depth of field, editorial product-photography quality:
1. The stacked cut edges of several sheets of float glass, showing the deep green-blue tint of the edge.
2. A wide polished bevel ("bisotê") on a mirror or glass edge, catching the light in a thin bright line.
3. A sandblasted (frosted) pattern etched on clear glass, sharp border between frosted and clear areas.
4. The small etched safety stamp found in the corner of every tempered glass pane (a generic stamp with a little circle and the text "TEMPERADO" — no real brand names).
5. A cross-section of an extruded aluminium window profile, showing its precise internal chambers, satin anodised finish.
6. Caustics: bright rippling light patterns cast by sunlight passing through thick glass onto a pale surface, with a hint of blue and amber.

No people, no logos, no watermark, no other text.
```

**Como avaliar:** que cores, texturas e detalhes viram elemento do site? Uma ideia, por exemplo: o **selo de têmpera** (todo vidro temperado tem um gravado no canto) virar a "assinatura" discreta no canto de cada seção.

---

## Depois do Lote 1

Com as escolhas, escrevo o **Lote 2** (arte que vai para o site). Possíveis itens, a confirmar:

- Peças da esquadria **isoladas numa folha**, todas no mesmo ângulo, para eu recortar e animar camada por camada (a janela se montando com a rolagem).
- Placas de prêmio em vidro jateado (seção Prêmios).
- Textura de vidro jateado e fundo de luz, se não ficarem bons feitos em código.
