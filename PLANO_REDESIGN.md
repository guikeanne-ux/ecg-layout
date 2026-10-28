# Plano do redesign — ECG Sistemas (v2)

> **28/10/2026:** hero aprovado; seções 01–08 construídas conforme a tabela da seção 3 (aguardando revisão do Guilherme).

Status: proposta pessoal, não é produto da empresa. Este arquivo define **estrutura e conteúdo**.
O vocabulário visual (cores, botões, cards, tipografia) só é fechado depois das referências do Guilherme.

---

## 1. Conceito

**O site é feito de vidro, e percorre o caminho que o vidro faz dentro do sistema.**

O ECG gerencia a vida de uma peça de vidro: orçamento → projeto → corte → têmpera → produção → instalação → nota fiscal.
O site usa essa mesma ordem como espinha: cada seção é uma etapa, e o visitante "processa a chapa" enquanto rola.

Regras do conceito:

- Vidro de verdade, não "glassmorphism": refração (o fundo distorce), borda com espessura, reflexo que reage ao mouse e ao scroll.
- Detalhes de quem é do setor: a borda levemente verde do vidro float, o bisotê (borda lapidada), o vidro jateado, a etiqueta de produção com código de barras, o plano de corte.
- **O produto é desenhado em código**, já que não há vídeo/print bom: plano de corte otimizado (SVG animado), etiqueta de peça, croqui de medição, linha de produção. São ilustrações vivas, sem usar print feio do sistema.
- Nada de receita repetida. Cada seção tem uma forma própria. Proibido: etiqueta em pílula acima de todo título, título centralizado + subtítulo cinza em toda seção, grade de cards com ícone em quadradinho, checklist com ✓ verde, faixa azul com brilho.

---

## 2. Hero

Fica: **o busto de vidro 3D** (padrão já trocado).

Sai: a foto de fundo (`custom-bg.png`) e o azul-claro lavado.

Direção: o fundo vira **luz atravessando o busto** — cáusticas (os desenhos de luz que o vidro projeta no chão) geradas em código, reagindo à rotação. O busto deixa de "flutuar sobre uma foto" e passa a ser a fonte de luz da página.

**Feito (28/10/2026, piloto):** fundo escuro `--noite`, feixe de luz e cáusticas azul/âmbar em WebGL girando com o busto, busto em vidro cristalino sobre chapa float de borda verde (`modelo_ecg_cristal.glb`), botões "chapa" (bisotê + verde do float) e "perfil" (jateado em perfil U), fatos como cotas de desenho técnico, selo gravado. Escolhas do Lote 1: G2 escuro + chapa verde; G1 traço + vidro real.

Pendências do hero: hospedar o HDR do ambiente (hoje vem de modelviewer.dev); definir a tipografia (Plus Jakarta é a "cara de template"); `custom-bg.png` não é mais usado.

---

## 3. Nova ordem das seções

| # | Seção | Etapa do vidro | O que mostra | Forma (sem cara de template) |
|---|---|---|---|---|
| 1 | Hero | A chapa | Promessa + busto 3D | Busto como fonte de luz; 1 botão principal, 1 secundário discreto |
| 2 | Produtos | Corte | ECG Glass × ECG Temper | Duas "chapas" lado a lado; ao escolher uma, ela é "cortada" em módulos. Sai a grade 3×2 com "ECG GLASS" repetido |
| 3 | Como funciona | Produção | Orçamento → projeto → corte → produção → instalação → nota | Linha de produção horizontal com a peça passando; cada parada = 1 módulo (substitui "Diferenciais" + checklist) |
| 4 | Números | Etiqueta | Orçamentos/mês, projetos/mês, empresas, usuários | Números impressos como etiqueta de produção (código de barras, lote). Sai a faixa de números solta após o hero |
| 5 | Cobertura | Entrega | Mapa do Brasil | **Mantém** (ajustes depois das referências) |
| 6 | Prêmios | Gravação | Jornal do Vidro + José Alves | Prêmios gravados em vidro jateado, como troféus/placas. Sai o "jornal" de cards e a faixa azul |
| 7 | Depoimentos | Instalação | Clientes reais | Citação grande, uma por vez, com o nome da empresa e cidade (no mapa?). Sai o carrossel genérico |
| 8 | FAQ | Pós-venda | Dúvidas reais do site atual | Lista limpa, sem botões "+" em bolinha |
| 9 | Fechamento + Rodapé | Nota fiscal | Teste grátis + contato | CTA final fundido ao rodapé (rodapé **mantém**). Sai o bloco "Quero testar" do meio da página |

Saem de vez: barra de números pós-hero (vira seção 4), bloco "Quero testar" intermediário, faixa "Reconhecimento consistente".

---

## 4. Conteúdo que falta (veio do site atual)

- Segmentos: vidraçaria, serralheria, esquadrias de alumínio **e PVC**, decoração, têmpera, laminadora.
- Linhas atendidas: Suprema, Gold, Aluprime, Linha 25, Linha 30, Alump, Esquadrimax, Vidromax, VitralSul, Decamp, Perfil.
- ECG Temper: geração de DXF, etiquetas, leitura de código de barras, separação por setor, exportação para otimização.
- Integração com **Corte Certo** e **Optima** (exportação de peças).
- Otimização de barras com IA.
- **Aplicativo** (App Store e Google Play), hoje ausente na proposta.
- 8 depoimentos (Vidroform, AL Esquadrias, WM Vidro, All Pro, Imperatriz Vidros, Alusul, Mondrian Coberturas, Dividros).
- Blog (3 posts em destaque).

---

## 5. SEO

- Manter: `lang="pt-BR"`, canonical, Open Graph, schema de FAQPage, H1 único.
- **Remover o `AggregateRating` (4.9 / 152)** do schema até ter o número real do Google. Nota inventada em dado estruturado pode gerar penalidade.
- Adicionar schema `SoftwareApplication` para ECG Glass e ECG Temper (com `operatingSystem` e link do app) e `LocalBusiness` com o endereço de Palhoça/SC.
- H2 com palavras que as pessoas buscam: "software para vidraçaria", "sistema para esquadrias de alumínio e PVC", "sistema para têmpera". Hoje os H2 são frases de efeito ("Quem usa, recomenda") que não rankeiam nada.
- O site atual tem páginas próprias "Software para vidraçaria" e "Software para esquadrias". Num redesign completo elas precisam existir (ou redirecionar) para não perder posição.
- Animações e 3D não podem atrasar o carregamento: busto e cáusticas carregam depois do texto do hero; `prefers-reduced-motion` respeitado.

---

## 6. Números para confirmar com a empresa

A proposta e o site atual se contradizem. Um número oficial para cada:

| Dado | Proposta atual | Site atual |
|---|---|---|
| Empresas | 662+ | 708+ |
| Cidades | 241 e 300+ (na mesma página) | não carrega |
| Usuários | 4,1 mil | "milhares" |
| Nota no Google | 4.9 / 152 avaliações | não informado |
| CNPJ | `XX.XXX.XXX/0001-XX` | não informado |
| Anos dos prêmios | não informado | não informado |

---

## 7. Próximos passos

1. Guilherme traz as referências visuais.
2. Fechamos juntos: cor, tipografia, botão, cartão, tratamento do vidro.
3. Hero novo (fundo de luz) como piloto do visual.
4. Seções na ordem da tabela, uma por vez, validando cada uma.
5. Revisão de SEO e desempenho (Lighthouse) no fim.
