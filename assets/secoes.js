// Seções do site (depois do hero). Sem dependências.
// 01 Corte: plano de corte por produto · 02 Montagem: janela explodida com medidas calculadas
// 03 Etiqueta: código de barras + contadores · 06 Depoimentos · links que abrem um produto
(function () {
    'use strict';
    const NS = 'http://www.w3.org/2000/svg';
    const reduzido = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const el = (tag, attrs = {}, pai) => {
        const e = document.createElementNS(NS, tag);
        for (const k in attrs) e.setAttribute(k, attrs[k]);
        if (pai) pai.appendChild(e);
        return e;
    };
    const fmt = (n) => Math.round(n).toLocaleString('pt-BR');

    /* ------------------------------------------------------------------ 01 · CORTE */
    const PLANOS = {
        // chapa 3210 × 2250 mm; peças [código, nome, x, y, largura, altura] em mm
        glass: {
            nome: 'ECG Glass',
            pecas: [['G01', 'Orçamento', 0, 0, 1600, 1250], ['G02', 'Projeto', 1600, 0, 1000, 1250], ['G06', 'Fiscal', 2600, 0, 610, 1400],
                    ['G03', 'Estoque', 0, 1250, 1100, 1000], ['G04', 'Financeiro', 1100, 1250, 900, 1000], ['G05', 'RH', 2000, 1250, 600, 1000]],
            sobra: [2600, 1400, 610, 850, 'sobra → retalho'],
            ordem: [0, 1, 3, 4, 5, 2],   // índice do módulo na lista para cada peça
        },
        temper: {
            nome: 'ECG Temper',
            pecas: [['T01', 'Administrativo', 0, 0, 1800, 1300], ['T02', 'Produção', 1800, 0, 1410, 1500], ['T03', 'Almoxarifado', 0, 1300, 1800, 950]],
            sobra: [1800, 1500, 1410, 750, 'sobra → retalho'],
            ordem: [0, 1, 2],
        },
    };
    const planoFig = document.getElementById('plano');
    const planoSvg = document.getElementById('plano-svg');
    function desenharPlano(produto, animar) {
        if (!planoSvg) return;
        const d = PLANOS[produto], E = 0.19, OX = 74, OY = 52, K = 2.2;   // escala, origem, meio "kerf" em px
        planoSvg.textContent = '';
        const defs = el('defs', {}, planoSvg);
        const pat = el('pattern', { id: 'hachura', width: 7, height: 7, patternUnits: 'userSpaceOnUse', patternTransform: 'rotate(45)' }, defs);
        el('line', { x1: 0, y1: 0, x2: 0, y2: 7, stroke: 'rgba(11,31,61,.28)', 'stroke-width': 1 }, pat);
        const W = 3210 * E, H = 2250 * E;
        el('rect', { class: 'chapa-contorno', x: OX - 6, y: OY - 6, width: W + 12, height: H + 12, rx: 2 }, planoSvg);
        // cotas da chapa
        const cota = el('g', { class: 'cota' }, planoSvg);
        el('line', { x1: OX, y1: OY - 26, x2: OX + W, y2: OY - 26 }, cota);
        el('line', { x1: OX, y1: OY - 32, x2: OX, y2: OY - 14 }, cota);
        el('line', { x1: OX + W, y1: OY - 32, x2: OX + W, y2: OY - 14 }, cota);
        el('text', { x: OX + W / 2, y: OY - 32, 'text-anchor': 'middle' }, cota).textContent = '3210';
        el('line', { x1: OX - 26, y1: OY, x2: OX - 26, y2: OY + H }, cota);
        el('line', { x1: OX - 32, y1: OY, x2: OX - 14, y2: OY }, cota);
        el('line', { x1: OX - 32, y1: OY + H, x2: OX - 14, y2: OY + H }, cota);
        el('text', { x: OX - 34, y: OY + H / 2, 'text-anchor': 'middle', transform: `rotate(-90 ${OX - 34} ${OY + H / 2})` }, cota).textContent = '2250';
        const peca = (x, y, w, h, i, classe) => {
            const g = el('g', { class: classe, style: `--i:${i}` }, planoSvg);
            const r = el('rect', { x: OX + x * E + K, y: OY + y * E + K, width: w * E - 2 * K, height: h * E - 2 * K }, g);
            r.style.setProperty('--perim', 2 * (w * E + h * E));
            return g;
        };
        d.pecas.forEach(([cod, nome, x, y, w, h], i) => {
            const g = peca(x, y, w, h, i, 'peca');
            g.dataset.peca = d.ordem[i];
            const cx = OX + (x + w / 2) * E, cy = OY + (y + h / 2) * E;
            el('text', { class: 'cod', x: OX + x * E + 12, y: OY + y * E + 22 }, g).textContent = cod;
            el('text', { class: 'nome', x: cx, y: cy + 2, 'text-anchor': 'middle' }, g).textContent = nome;
            el('text', { class: 'medida', x: cx, y: cy + 20, 'text-anchor': 'middle' }, g).textContent = `${w} × ${h}`;
        });
        const [sx, sy, sw, sh, st] = d.sobra;
        const gs = peca(sx, sy, sw, sh, d.pecas.length, 'sobra');
        el('text', { x: OX + (sx + sw / 2) * E, y: OY + (sy + sh / 2) * E + 4, 'text-anchor': 'middle' }, gs).textContent = st;
        planoFig.dataset.produto = produto;
        document.getElementById('plano-legenda').textContent = `Plano de corte · chapa 3210 × 2250 mm · ${d.nome}`;
        if (animar && !reduzido) { planoFig.classList.remove('cortando'); void planoFig.offsetWidth; planoFig.classList.add('cortando'); }
    }
    function realcar(produto, idx) {
        planoSvg.querySelectorAll('.peca').forEach((g) => g.classList.toggle('ativa', idx !== null && g.dataset.peca === String(idx)));
        document.querySelectorAll(`#painel-${produto} .modulos li`).forEach((li) => li.classList.toggle('ativo', idx !== null && li.dataset.peca === String(idx)));
    }
    let produtoAtual = 'glass';
    function escolherProduto(produto, animar = true) {
        produtoAtual = produto;
        document.querySelectorAll('.chapa-btn').forEach((b) => {
            const sim = b.dataset.produto === produto;
            b.setAttribute('aria-selected', sim); b.tabIndex = sim ? 0 : -1;
        });
        document.querySelectorAll('.produto-painel').forEach((p) => { p.hidden = p.id !== `painel-${produto}`; });
        desenharPlano(produto, animar);
    }
    if (planoSvg) {
        const abas = [...document.querySelectorAll('.chapa-btn')];
        abas.forEach((b) => b.addEventListener('click', () => escolherProduto(b.dataset.produto)));
        document.querySelector('.corte-seletor').addEventListener('keydown', (e) => {
            if (!['ArrowLeft', 'ArrowRight'].includes(e.key)) return;
            const i = abas.findIndex((b) => b.dataset.produto === produtoAtual);
            const prox = abas[(i + (e.key === 'ArrowRight' ? 1 : abas.length - 1)) % abas.length];
            escolherProduto(prox.dataset.produto); prox.focus();
        });
        document.querySelectorAll('.modulos li').forEach((li) => {
            li.addEventListener('mouseenter', () => realcar(produtoAtual, li.dataset.peca));
            li.addEventListener('mouseleave', () => realcar(produtoAtual, null));
        });
        planoSvg.addEventListener('mouseover', (e) => { const g = e.target.closest('.peca'); if (g) realcar(produtoAtual, g.dataset.peca); });
        planoSvg.addEventListener('mouseleave', () => realcar(produtoAtual, null));
        desenharPlano('glass', false);
        // o primeiro corte acontece quando o plano aparece na tela
        new IntersectionObserver((ent, obs) => {
            if (ent[0].isIntersecting) { desenharPlano(produtoAtual, true); obs.disconnect(); }
        }, { threshold: 0.35 }).observe(planoFig);
        document.querySelectorAll('[data-abrir-produto]').forEach((a) => a.addEventListener('click', () => escolherProduto(a.dataset.abrirProduto)));
    }

    /* ------------------------------------------------------------------ 02 · MONTAGEM */
    const expSvg = document.getElementById('explodida-svg');
    if (expSvg) {
        const C = Math.cos(Math.PI / 6), S = 0.5;
        let k = 1;
        const proj = (x, y, z) => [(x - z) * C * k, (x + z) * S * k - y * k];
        const L = 1500, A = 1200, D = 70, t = 45, f = 40;          // geometria do desenho (fixa)
        const fw = 725, fh = 1100, fy0 = t + 5;
        const xa0 = t, xb0 = L - t - fw;                             // folha A (trás) e B (frente)
        const caixa = (x0, x1, y0, y1, z0, z1) => ({ x0, x1, y0, y1, z0, z1 });
        const quadro = (x0, y0, w, h, z0, z1) => [                   // 4 perfis de uma folha
            caixa(x0, x0 + w, y0 + h - f, y0 + h, z0, z1), caixa(x0, x0 + w, y0, y0 + f, z0, z1),
            caixa(x0, x0 + f, y0 + f, y0 + h - f, z0, z1), caixa(x0 + w - f, x0 + w, y0 + f, y0 + h - f, z0, z1)];
        const vidro = (x0, z) => caixa(x0 + f - 12, x0 + fw - f + 12, fy0 + f - 12, fy0 + fh - f + 12, z - 3, z + 3);
        const roldanas = (x0, zc) => [caixa(x0 + 70, x0 + 130, fy0 - 26, fy0, zc - 9, zc + 9), caixa(x0 + fw - 130, x0 + fw - 70, fy0 - 26, fy0, zc - 9, zc + 9)];
        // peças: [id, caixas, explosão (mm), tipo]
        const PECAS = [
            ['vidroA', [vidro(xa0, 20)], [0, 40, -620], 'vidro'],
            ['folhaA', quadro(xa0, fy0, fw, fh, 8, 32), [0, 40, -330], 'perfil'],
            ['roldA', roldanas(xa0, 20), [0, -170, -330], 'perfil'],
            ['montE', [caixa(0, t, t, A - t, 0, D)], [-300, 0, 0], 'perfil'],
            ['trilhoI', [caixa(0, L, 0, t, 0, D)], [0, -330, 0], 'perfil'],
            ['trilhoS', [caixa(0, L, A - t, A, 0, D)], [0, 330, 0], 'perfil'],
            ['montD', [caixa(L - t, L, t, A - t, 0, D)], [300, 0, 0], 'perfil'],
            ['folhaB', quadro(xb0, fy0, fw, fh, 38, 62), [0, 40, 330], 'perfil'],
            ['roldB', roldanas(xb0, 50), [0, -170, 330], 'perfil'],
            ['fecho', [caixa(xb0 + 6, xb0 + 30, 560, 680, 62, 74)], [-120, 0, 520], 'perfil'],
            ['vidroB', [vidro(xb0, 50)], [0, 40, 640], 'vidro'],
            ['puxador', [caixa(xb0 + fw - 32, xb0 + fw - 10, 520, 720, 62, 96)], [150, 0, 820], 'perfil'],
        ];
        // âncoras das chamadas (ponto da peça, em mm)
        const ANCORA = {
            trilhoS: [L * 0.7, A, D / 2], trilhoI: [L * 0.35, 0, D], montD: [L, A * 0.62, D / 2], folhaA: [xa0 + fw * 0.15, fy0 + fh, 20],
            folhaB: [xb0 + fw * 0.5, fy0 + fh, 62], vidroB: [xb0 + fw * 0.5, fy0 + fh * 0.55, 53], vidroA: [xa0 + fw * 0.6, fy0 + fh * 0.75, 23],
            roldB: [xb0 + 100, fy0 - 26, 59], fecho: [xb0 + 18, 620, 74], puxador: [xb0 + fw - 21, 720, 96],
        };
        const ROTULOS = [   // [peça, nome, valor(m), destaque]
            ['trilhoS', 'TRILHO SUPERIOR', (m) => `corte ${fmt(m.L)} mm`],
            ['folhaA', 'ESCOVA DE VEDAÇÃO', (m) => `${m.escova} m`],
            ['vidroA', 'BORRACHA EPDM', (m) => `${m.borracha} m`],
            ['montD', 'MONTANTE', (m) => `2 × ${fmt(m.mont)} mm`],
            ['folhaB', 'FOLHA', (m) => `2 × ${fmt(m.fw)} × ${fmt(m.fh)} mm`],
            ['vidroB', 'VIDRO TEMPERADO 8 MM', (m) => `2 × ${fmt(m.vw)} × ${fmt(m.vh)} mm`, true],
            ['puxador', 'PUXADOR', () => '1 un.'],
            ['fecho', 'FECHO', () => '1 un.'],
            ['roldB', 'ROLDANA', () => '4 un.', true],
            ['trilhoI', 'TRILHO INFERIOR', (m) => `corte ${fmt(m.L)} mm`],
        ];
        const medidas = () => {
            const Lr = Math.min(3000, Math.max(600, +document.getElementById('m-largura').value || 1500));
            const Ar = Math.min(2400, Math.max(500, +document.getElementById('m-altura').value || 1200));
            const mfw = Math.round((Lr - 90 + 40) / 2), mfh = Ar - 100, vw = mfw - 74, vh = mfh - 74;
            return { L: Lr, mont: Ar - 90, fw: mfw, fh: mfh, vw, vh,
                     borracha: (2 * 2 * (vw + vh) / 1000).toLocaleString('pt-BR', { maximumFractionDigits: 1 }),
                     escova: (2 * 2 * (mfw + mfh) / 1000).toLocaleString('pt-BR', { maximumFractionDigits: 1 }) };
        };

        // escala: o desenho explodido ocupa ~560 unidades de largura no viewBox
        const limites = (p) => {
            let mnx = 1e9, mxx = -1e9, mny = 1e9, mxy = -1e9;
            PECAS.forEach(([, cx, ex]) => cx.forEach((c) => {
                for (const x of [c.x0, c.x1]) for (const y of [c.y0, c.y1]) for (const z of [c.z0, c.z1]) {
                    const [sx, sy] = proj(x + ex[0] * p, y + ex[1] * p, z + ex[2] * p);
                    mnx = Math.min(mnx, sx); mxx = Math.max(mxx, sx); mny = Math.min(mny, sy); mxy = Math.max(mxy, sy);
                }
            }));
            return [mnx, mxx, mny, mxy];
        };
        let [a0, a1] = limites(1); k = 540 / (a1 - a0);
        const [bx0, bx1, by0, by1] = limites(1);
        const COL = 200;   // largura das colunas de rótulos
        // em telas estreitas os rótulos ficariam ilegíveis: o desenho usa toda a largura e as medidas vão para uma lista
        const estreito = window.matchMedia('(max-width: 640px)');
        const enquadrar = () => {
            const c = estreito.matches ? 12 : COL;
            expSvg.setAttribute('viewBox', `${bx0 - c} ${by0 - 20} ${bx1 - bx0 + 2 * c} ${by1 - by0 + 40}`);
            expSvg.classList.toggle('sem-rotulos', estreito.matches);
        };
        enquadrar();
        estreito.addEventListener('change', enquadrar);
        const lista = document.createElement('dl');
        lista.className = 'pecas-lista';
        expSvg.parentNode.appendChild(lista);

        const defs = el('defs', {}, expSvg);
        const lg = el('linearGradient', { id: 'vidro-grad', x1: 0, y1: 0, x2: 1, y2: 1 }, defs);
        el('stop', { offset: '0', 'stop-color': 'rgba(214,240,240,.75)' }, lg);
        el('stop', { offset: '.5', 'stop-color': 'rgba(190,226,230,.45)' }, lg);
        el('stop', { offset: '.52', 'stop-color': 'rgba(255,255,255,.75)' }, lg);
        el('stop', { offset: '.56', 'stop-color': 'rgba(190,226,230,.42)' }, lg);
        el('stop', { offset: '1', 'stop-color': 'rgba(160,210,214,.55)' }, lg);
        const camEixos = el('g', {}, expSvg), camPecas = el('g', {}, expSvg), camChamadas = el('g', {}, expSvg);

        const pts = (lista) => lista.map((v) => proj(...v).map((n) => n.toFixed(1)).join(',')).join(' ');
        const grupos = {};
        PECAS.forEach(([id, cx, , tipo]) => {
            const g = el('g', {}, camPecas);
            cx.forEach((c) => {
                const { x0, x1, y0, y1, z0, z1 } = c;
                const topo = [[x0, y1, z0], [x1, y1, z0], [x1, y1, z1], [x0, y1, z1]];
                const lado = [[x1, y0, z0], [x1, y1, z0], [x1, y1, z1], [x1, y0, z1]];
                const frente = [[x0, y0, z1], [x1, y0, z1], [x1, y1, z1], [x0, y1, z1]];
                if (tipo === 'vidro') {
                    el('polygon', { class: 'vidro-borda', points: pts(topo) }, g);
                    el('polygon', { class: 'vidro-borda', points: pts(lado) }, g);
                    el('polygon', { class: 'vidro-face', points: pts(frente) }, g);
                    const i = 14;   // borracha EPDM em volta do vidro
                    el('polygon', { class: 'borracha', points: pts([[x0 + i, y0 + i, z1], [x1 - i, y0 + i, z1], [x1 - i, y1 - i, z1], [x0 + i, y1 - i, z1]]) }, g);
                } else {
                    el('polygon', { class: 'face-topo aresta', points: pts(topo) }, g).setAttribute('style', 'fill:#fbfcfd');
                    el('polygon', { class: 'face-lado aresta', points: pts(lado) }, g).setAttribute('style', 'fill:#e7ecf1');
                    el('polygon', { class: 'face-frente aresta', points: pts(frente) }, g).setAttribute('style', 'fill:#f1f4f7');
                }
            });
            const cen = cx.reduce((a, c) => [a[0] + (c.x0 + c.x1) / 2, a[1] + (c.y0 + c.y1) / 2, a[2] + (c.z0 + c.z1) / 2], [0, 0, 0]).map((v) => v / cx.length);
            grupos[id] = { g, cen, eixo: el('line', { class: 'eixo' }, camEixos) };
        });

        // posição final dos rótulos: esquerda ou direita conforme a âncora, sem sobreposição
        const rotulos = ROTULOS.map(([id, nome, valor, destaque]) => {
            const ex = PECAS.find((p) => p[0] === id)[2];
            const [ax, ay] = proj(...ANCORA[id].map((v, i) => v + ex[i]));
            return { id, nome, valor, destaque, ax, ay, lado: ax < (bx0 + bx1) / 2 ? -1 : 1 };
        });
        [-1, 1].forEach((lado) => {
            const col = rotulos.filter((r) => r.lado === lado).sort((a, b) => a.ay - b.ay);
            let y = by0 + 10;
            col.forEach((r) => { r.ly = Math.max(r.ay, y); y = r.ly + 44; });
            // se passou do fim, empurra de baixo para cima
            let limite = by1 - 6;
            for (let i = col.length - 1; i >= 0; i--) { col[i].ly = Math.min(col[i].ly, limite); limite = col[i].ly - 44; }
        });
        rotulos.forEach((r) => {
            const xTexto = r.lado < 0 ? bx0 - COL + 6 : bx1 + 40;
            r.ch = el('g', { class: 'chamada' }, camChamadas);
            r.linha = el('polyline', { fill: 'none', stroke: '#1b2b44', 'stroke-width': .8 }, r.ch);
            r.ponto = el('circle', { r: 2.4 }, r.ch);
            r.gr = el('g', { class: 'rotulo' + (r.destaque ? ' destaque' : '') }, camChamadas);
            if (r.destaque) r.fundo = el('rect', { x: xTexto - 6, y: r.ly - 16, height: 38, rx: 1 }, r.gr);
            r.tNome = el('text', { class: 'r-nome', x: xTexto, y: r.ly - 2 }, r.gr); r.tNome.textContent = r.nome;
            r.tValor = el('text', { class: 'r-valor', x: xTexto, y: r.ly + 14 }, r.gr);
            r.xLinha = r.lado < 0 ? xTexto + 154 : xTexto - 10;
        });
        const escreverValores = () => {
            const m = medidas();
            lista.innerHTML = ROTULOS.map(([, nome, valor]) => `<div><dt>${nome}</dt><dd>${valor(m)}</dd></div>`).join('');
            rotulos.forEach((r) => {
                r.tValor.textContent = r.valor(m);
                if (r.fundo) r.fundo.setAttribute('width', Math.max(r.tNome.getComputedTextLength(), r.tValor.getComputedTextLength()) + 12);
            });
        };
        escreverValores();
        ['m-largura', 'm-altura'].forEach((id) => document.getElementById(id).addEventListener('input', escreverValores));

        let pAtual = -1;
        const aplicar = (p) => {
            if (Math.abs(p - pAtual) < 0.002) return;
            pAtual = p;
            const ordem = [];
            PECAS.forEach(([id, , ex]) => {
                const gr = grupos[id];
                const [dx, dy] = proj(ex[0] * p, ex[1] * p, ex[2] * p);
                gr.g.setAttribute('transform', `translate(${dx.toFixed(1)} ${dy.toFixed(1)})`);
                const [ox, oy] = proj(...gr.cen), [nx, ny] = [ox + dx, oy + dy];
                gr.eixo.setAttribute('x1', ox); gr.eixo.setAttribute('y1', oy); gr.eixo.setAttribute('x2', nx); gr.eixo.setAttribute('y2', ny);
                gr.eixo.style.opacity = p > 0.05 ? 1 : 0;
                // ordem de desenho: o que está mais perto de quem olha vai por último
                ordem.push([gr.cen[0] + gr.cen[1] + gr.cen[2] + (ex[0] + ex[1] + ex[2]) * p + (id.startsWith('vidro') ? 1 : 0), gr.g]);
            });
            ordem.sort((a, b) => a[0] - b[0]).forEach(([, g]) => camPecas.appendChild(g));
            const op = Math.min(1, Math.max(0, (p - 0.6) / 0.3));
            rotulos.forEach((r) => {
                const ex = PECAS.find((q) => q[0] === r.id)[2];
                const [ax, ay] = proj(...ANCORA[r.id].map((v, i) => v + ex[i] * p));
                r.ponto.setAttribute('cx', ax); r.ponto.setAttribute('cy', ay);
                r.linha.setAttribute('points', `${ax},${ay} ${r.xLinha + (r.lado < 0 ? 14 : -14)},${r.ly - 4} ${r.xLinha},${r.ly - 4}`);
                r.ch.style.opacity = op; r.gr.style.opacity = op;
            });
        };
        if (reduzido) aplicar(1);
        else {
            const mesa = document.querySelector('.montagem-mesa');
            let pedido = false;
            const medir = () => {
                pedido = false;
                const r = mesa.getBoundingClientRect(), vh = window.innerHeight;
                // monta-se ao entrar na tela e termina de desmontar quando o desenho chega ao meio
                const p = (vh * 0.95 - r.top) / (vh * 0.95 - (vh - r.height) / 2);
                const c = Math.min(1, Math.max(0, p));
                aplicar(c * c * (3 - 2 * c));
            };
            const agendar = () => { if (!pedido) { pedido = true; requestAnimationFrame(medir); } };
            window.addEventListener('scroll', agendar, { passive: true });
            window.addEventListener('resize', agendar);
            medir();
        }
    }

    /* ------------------------------------------------------------------ 03 · ETIQUETA */
    const barras = document.getElementById('barras');
    if (barras) {
        // código de barras decorativo e sempre igual (semente fixa)
        let s = 2008, x = 0;
        const rnd = () => { s = (s * 16807) % 2147483647; return s / 2147483647; };
        while (x < 226) {
            const w = [1, 1, 2, 3][Math.floor(rnd() * 4)];
            el('rect', { x, y: 0, width: w, height: 46, fill: '#111' }, barras);
            x += w + [1, 2, 2, 3][Math.floor(rnd() * 4)];
        }
    }
    const contadores = document.querySelectorAll('[data-conta]');
    if (contadores.length && !reduzido && 'IntersectionObserver' in window) {
        const etiqueta = document.querySelector('.etiqueta');
        contadores.forEach((c) => { c.textContent = '0'; });
        new IntersectionObserver((ent, obs) => {
            if (!ent[0].isIntersecting) return;
            obs.disconnect();
            const t0 = performance.now(), dur = 1600;
            const passo = (agora) => {
                const q = Math.min(1, (agora - t0) / dur), e = 1 - Math.pow(1 - q, 3);
                contadores.forEach((c) => { c.textContent = fmt(+c.dataset.conta * e); });
                if (q < 1) requestAnimationFrame(passo);
            };
            requestAnimationFrame(passo);
        }, { threshold: 0.4 }).observe(etiqueta);
    }

    /* ------------------------------------------------------------------ 06 · DEPOIMENTOS */
    const depo = document.getElementById('depo');
    if (depo) {
        const botoes = [...depo.querySelectorAll('[data-depo]')];
        const slides = [...depo.querySelectorAll('.depo-slide')];
        const TEMPO = 7000;
        depo.style.setProperty('--depo-tempo', TEMPO + 'ms');
        let atual = 0, timer = null, pausado = false, visivel = false;
        const mostrar = (i) => {
            atual = i;
            slides.forEach((s, j) => { s.hidden = j !== i; });
            botoes.forEach((b, j) => { if (j === i) b.setAttribute('aria-current', 'true'); else b.removeAttribute('aria-current'); });
            const s = slides[i]; s.classList.add('entrando'); requestAnimationFrame(() => requestAnimationFrame(() => s.classList.remove('entrando')));
            programar();
        };
        const programar = () => {
            clearTimeout(timer);
            if (reduzido || pausado || !visivel) return;
            timer = setTimeout(() => mostrar((atual + 1) % slides.length), TEMPO);
        };
        botoes.forEach((b, i) => b.addEventListener('click', () => mostrar(i)));
        depo.addEventListener('mouseenter', () => { pausado = true; programar(); });
        depo.addEventListener('mouseleave', () => { pausado = false; programar(); });
        depo.addEventListener('focusin', () => { pausado = true; programar(); });
        depo.addEventListener('focusout', () => { pausado = false; programar(); });
        new IntersectionObserver((ent) => { visivel = ent[0].isIntersecting; if (visivel) mostrar(atual); else clearTimeout(timer); }, { threshold: 0.3 }).observe(depo);
    }
})();
