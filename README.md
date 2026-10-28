# ECG Sistemas — Redesign de Landing Page

> Proposta de novo layout para o site institucional da **ECG Sistemas**, empresa catarinense com 16+ anos no mercado de software para vidraçarias, esquadrias de alumínio e indústrias de têmpera.

**[Ver demo ao vivo →](https://amazingbits.github.io/ecg_novo_layout/)**

---

## Sobre o projeto

A ECG Sistemas é referência no setor vidreiro brasileiro, com mais de **4.000 usuários ativos**, **241 cidades atendidas** e múltiplos prêmios do Jornal do Vidro. O objetivo deste redesign foi modernizar a presença digital da empresa com uma landing page de alto impacto, mantendo a credibilidade e identidade consolidada da marca.

### Problema

O site anterior não comunicava adequadamente o posicionamento premium da empresa nem destacava os diferenciais competitivos dos dois principais produtos: **ECG Glass** e **ECG Temper**. A experiência mobile era deficiente e não havia elementos visuais modernos que transmitissem inovação tecnológica.

### Solução

Landing page completamente nova, desenvolvida com HTML, CSS e JavaScript puros (zero dependências de framework), otimizada para conversão e com atenção a cada detalhe de UX.

---

## Destaques técnicos

### Hero: vitrine 3D
O hero é uma vitrine em **three.js** (`assets/vitrine.js`, sem model-viewer): o busto de vidro da ECG sob um spot de luz, numa **sala de simulação quadriculada** (piso e paredes com malha de papel milimetrado, como uma folha de projeto), em azul-marinho.

- **Spot de cima** formando a poça de luz no piso; ambiente de estúdio próprio (`assets/estudio-vitrine.hdr`, softboxes largos) desenhando as bordas do vidro.
- **Sombra de vidro**: a silhueta do busto vista pela luz vira, a cada quadro, uma sombra clara tingida pelas cores das peças, com cáusticas. Gira junto com o busto.
- **Piso polido** com reflexo real, desfocado e esmaecendo com a distância.
- **Malha da sala**: linhas finas a cada 10 cm e grossas a cada 50 cm, suavizadas (não cintilam no giro); acendem onde a luz bate.
- **Letras em vidro colorido pela espessura** (mais intenso no miolo, claro nas bordas), sem verniz, com dispersão nas quinas e acesas por dentro. O miolo de neon que o modelo traz fica oculto na vitrine.
- **Giro**: o busto gira devagar; arrastar dá embalo e ele volta suavemente ao giro automático.
- Pausa fora da tela e respeita `prefers-reduced-motion`.
- **Carga**: o three.js 0.183 vem junto com o site (`assets/three/`, só os arquivos usados, licença MIT inclusa), sem depender de CDN. Modelo e estúdio são baixados com até 3 tentativas; os shaders do vidro compilam sem travar a página e o canvas só aparece (classe `pronto`, CSS `#vitrine.pronto`) depois do primeiro quadro. Se o navegador derrubar o WebGL, o canvas some e volta sozinho quando o contexto é restaurado.

O busto padrão é o modelo "cristal": a logo original em vidro polido com **neon interno** nas cores da marca, sobre a base redonda lapidada (25% mais baixa que a original, com chanfro polido nas arestas) com **"Sistemas" entalhado** na frente e no verso (cavidade de ~1,3 mm logo abaixo da superfície; a malha da base fica intacta). Outros modelos via query string:

| Parâmetro URL | Modelo carregado |
|---|---|
| _(nenhum)_ — padrão | `modelo_ecg_cristal.glb` — vidro polido + neon + base gravada |
| `?vidro=original` | `modelo_ecg_vidro.glb` — o busto de vidro original |
| `?vidro=normal` | `modelo_ecg.glb` — mesma logo, versão opaca |
| `?vidro=holograma` | `modelo_device_hologram_v14.glb` — monitor + tablet holográficos |

O modelo cristal é gerado a partir do original (a forma da logo não muda):

```
node ferramentas/gerar-modelo-cristal.mjs assets/modelo_ecg_vidro.glb assets/modelo_ecg_cristal.glb \
     --base=redonda --altura-base=0.75 --lapidar --neon --gravar=Sistemas --fonte=ferramentas/fontes/inter-latin-600-normal.woff
```

Opções: `--base=redonda|chapa`, `--altura-base=N` (proporção da altura original, topo fixo), `--lapidar[=1.1]` (refaz a base com o mesmo contorno, laterais retas e chanfro polido nas arestas, que desenha os limites do vidro), `--neon`, `--gravar=TEXTO --fonte=arquivo.woff`. Dependências: `@gltf-transform/*@4.1.1`, `three@0.183.0`, `opentype.js@1.3.4`. A fonte do entalhe é a Inter SemiBold (OFL), em `ferramentas/fontes/`. O estúdio é gerado por `ferramentas/gerar-estudio-hdr.py assets/estudio-vitrine.hdr vitrine`.

A cor do hero (`--noite: #0c1e36`) é a cor do fundo da cena como aparece na tela (`fundo: '#081a33'` em `vitrine.js`); se mudar uma, recalibrar a outra.

### Performance e SEO
- **Zero frameworks** — HTML/CSS/JS puros, carregamento instantâneo
- Fontes carregadas com `preconnect` + `display=swap`
- Schema.org: Organization/LocalBusiness, SoftwareApplication (ECG Glass e ECG Temper) e FAQPage
- Open Graph completo para compartilhamento em redes sociais
- Meta tags de SEO semântico com keywords do setor

### Design system
- CSS custom properties para consistência total de tokens (cores, sombras, raios, transições)
- Paleta: azul-marinho da vitrine (`--noite`), azul institucional (`#05377B`) e o âmbar da logo como destaque (`--ambar`)
- Tipografia: **Plus Jakarta Sans** (títulos) + **Inter** (corpo) + **IBM Plex Mono** (anotações técnicas, cotas, etiquetas)
- Linguagem de vidro e desenho técnico: botões "chapa" (bisotê + verde do vidro float) e "perfil" (jateado em perfil U), papel milimetrado, régua, cotas

### Animações e interações
- Plano de corte que se desenha ao escolher o produto
- Janela explodida guiada pela rolagem, com medidas recalculadas ao digitar largura e altura
- Estante de troféus em 3D na seção de prêmios
- Contadores da etiqueta, depoimentos com troca automática (pausa ao passar o mouse)
- Mapa interativo do Brasil com destaque dos estados atendidos
- Tudo respeita `prefers-reduced-motion` e pausa fora da tela

### Seções da página

O site percorre a vida de uma peça de vidro: cada seção é uma etapa, numerada no cabeçalho (`01 Corte`, `02 Montagem`…). As seções claras são uma folha de projeto (papel milimetrado); hero, mapa e rodapé são o azul-marinho da vitrine.

| # | Seção | O que mostra |
|---|---|---|
| — | **Hero** | Vitrine 3D do busto de vidro (`assets/vitrine.js`) |
| 01 | **Corte** (`#produtos`) | ECG Glass × ECG Temper como duas chapas; ao escolher, um plano de corte desenha os módulos como peças (passar o mouse liga peça ↔ módulo) |
| 02 | **Montagem** (`#como-funciona`) | Janela de correr explodida em desenho técnico; ao rolar ela se desmonta e cada peça mostra a medida calculada. Largura e altura são editáveis. Embaixo, o fluxo orçamento → nota fiscal |
| 03 | **Etiqueta** (`#numeros`) | Os números do ECG numa etiqueta de produção com código de barras e carimbo |
| 04 | **Entrega** (`#cobertura`) | Mapa do Brasil: tocar/clicar num estado o seleciona (laranja) e os números passam a ser dele; tocar fora, no mesmo estado, Esc ou "Ver Brasil" desfaz. Mouse mostra prévia. Em telas ≤1024 px os números ficam logo abaixo do mapa (2 × 2) |
| 05 | **Gravação** (`#premios`) | A estante de prêmios da ECG em 3D (`assets/trofeus.js`, three.js), fiel à foto da coleção real: 2 placas do Jornal do Vidro (latão dourado com "JV" e a estatueta vazados, base preta arredondada) e 4 estatuetas douradas (pedestal dourado em degraus e/ou bloco de madeira com plaquinha), num nicho moderno recortado na parede da seção (cimento queimado grafite, moldura de alumínio preto, prateleiras flutuantes de vidro temperado com a borda verde acesa, spots embutidos com leques de luz e sombra dos troféus). Abaixo, a linha do tempo 2018–2022 com os 7 prêmios (horizontal no desktop, vertical no celular; a cena não afirma qual troféu é de qual prêmio). Os prêmios também estão no JSON-LD (`award`). Mouse/toque acende o troféu apontado; câmera acompanha o mouse. Tela estreita: duas prateleiras de 3 (tudo à vista, sem rolar de lado). Carrega só perto da seção e pausa fora da tela |
| 06 | **Instalação** (`#depoimentos`) | Uma citação grande por vez, com a lista de clientes |
| 07 | **Pós-venda** (`#faq`) | Perguntas frequentes (`<details>`), o mesmo texto vai para o JSON-LD |
| 08 | **Obra entregue** (`#teste-gratis`, no rodapé) | Chamada para o teste grátis + rodapé com contatos, páginas do site oficial e o aplicativo |

O código das seções fica em `assets/secoes.js` (sem dependências). O FAQ e os dados estruturados são gerados do mesmo texto: se editar uma pergunta no HTML, edite também o JSON-LD do `<head>`.

---

## Stack

```
HTML5 · CSS3 (custom properties, grid, flexbox, animations)
JavaScript ES6+ (vanilla, sem frameworks)
three.js 0.183 (vitrine 3D do hero, servido de assets/three/)
Google Fonts (Inter + Plus Jakarta Sans)
```

---

## Como rodar localmente

Abra via algum servidor local válido, como o Live Server no VSCode.

---

## Sobre o autor

Desenvolvido por **Guilherme Andrade** como proposta de redesign para a ECG Sistemas.

[![LinkedIn](https://img.shields.io/badge/LinkedIn-0077B5?style=flat&logo=linkedin&logoColor=white)](https://www.linkedin.com/in/devguiandrade/)
