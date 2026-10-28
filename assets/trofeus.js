// 05 · Gravação: a estante de prêmios da ECG em 3D (three.js 0.183), fiel à foto da coleção real.
// Cenário: um nicho moderno recortado na parede azul da seção: cimento queimado grafite, moldura de alumínio preto,
// prateleiras flutuantes de vidro temperado (borda verde do float acesa por LED) e spots embutidos (leques de luz, sombras).
// - placas do Jornal do Vidro: latão dourado com "JV" e a estatueta vazados, base preta arredondada
// - estatuetas douradas (estilo Oscar) em pedestal dourado de degraus e/ou bloco de madeira com plaquinha
// - os 7 prêmios ficam numa legenda à parte (no HTML): não afirmamos qual troféu é de qual prêmio
// - tela larga: uma prateleira com os 6; tela estreita: duas prateleiras de 3 (tudo à vista, sem rolar de lado)
// - mouse/toque acende o troféu apontado; só carrega perto da seção; pausa fora da tela
import * as THREE from 'three';

const raiz = document.getElementById('trofeus');
if (raiz) {
    const palco = raiz.querySelector('.trofeus-palco');
    const canvas = raiz.querySelector('.trofeus-cena');
    const reduzido = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    let comecou = false;
    const perto = new IntersectionObserver(([e]) => {
        if (!e.isIntersecting || comecou) return;
        comecou = true; perto.disconnect();
        montar().catch((erro) => console.warn('Troféus 3D: não carregou, ficam os nomes.', erro));
    }, { rootMargin: '700px 0px' });
    perto.observe(raiz);

    async function montar() {
        const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, powerPreference: 'high-performance' });
        renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.75));
        renderer.toneMapping = THREE.AgXToneMapping;
        renderer.toneMappingExposure = 1.1;
        renderer.shadowMap.enabled = true;
        renderer.shadowMap.type = THREE.PCFShadowMap;
        const FUNDO = new THREE.Color('#071528');   // = fundo da seção
        const cena = new THREE.Scene();
        cena.background = FUNDO;
        const camera = new THREE.PerspectiveCamera(24, 2.5, 0.1, 60);
        cena.add(new THREE.HemisphereLight(0xcfdcff, 0x2a1a10, 0.35));

        // estúdio de rebatedores (só reflexo): desenha as faixas de luz no metal dourado
        const pmrem = new THREE.PMREMGenerator(renderer);
        const estudio = new THREE.Scene();
        estudio.background = new THREE.Color(0x0b0f18);
        const rebatedor = (w, h, x, y, z, forca, cor = [1, 0.97, 0.92]) => {
            const m = new THREE.Mesh(new THREE.PlaneGeometry(w, h), new THREE.MeshBasicMaterial({ color: new THREE.Color(...cor).multiplyScalar(forca), side: THREE.DoubleSide }));
            m.position.set(x, y, z); m.lookAt(0, 0.8, 0); estudio.add(m);
        };
        rebatedor(1.1, 7, -4.2, 1.2, 1.6, 6);
        rebatedor(1.1, 7, 4.2, 1.2, 1.6, 6);
        rebatedor(7, 1.2, 0, 6, 0.5, 5, [1, 0.88, 0.7]);    // teto do nicho, luz quente
        rebatedor(10, 2, 0, 0.6, -4.5, 1.1, [0.55, 0.57, 0.62]);   // o fundo grafite do nicho
        rebatedor(2.2, 3.2, -2.6, 2.4, 5.4, 2.2);
        rebatedor(1.6, 1.2, 2.4, 0.6, 5.6, 0.7);
        rebatedor(5, 3, 0, 1.4, 6.5, 1.6);   // de frente, largo: as placas JV nunca ficam escuras
        cena.environment = pmrem.fromScene(estudio, 0.015).texture;

        // ---------- materiais ----------
        const matOuroEscovado = new THREE.MeshPhysicalMaterial({   // placa JV: latão acetinado
            color: 0xd6a548, metalness: 1, roughness: 0.2, anisotropy: 0.6, anisotropyRotation: Math.PI / 2,
            clearcoat: 0.25, clearcoatRoughness: 0.12, envMapIntensity: 1.7,
        });
        const matOuroPolido = new THREE.MeshPhysicalMaterial({ color: 0xebb64c, metalness: 1, roughness: 0.24, clearcoat: 0.5, clearcoatRoughness: 0.1, envMapIntensity: 2.1 });
        const matPreto = new THREE.MeshPhysicalMaterial({ color: 0x0a0b0d, metalness: 0, roughness: 0.22, clearcoat: 1, clearcoatRoughness: 0.06, envMapIntensity: 1 });
        const veio = (base, claro, escuro, vertical) => textura(256, 512, (g, w, h) => {
            g.fillStyle = base; g.fillRect(0, 0, w, h);
            for (let i = 0; i < 90; i++) {
                const p = Math.random() * (vertical ? w : h), a = 0.05 + Math.random() * 0.14;
                g.strokeStyle = Math.random() < 0.5 ? `rgba(${escuro},${a})` : `rgba(${claro},${a})`;
                g.lineWidth = 0.6 + Math.random() * 2.4;
                g.beginPath();
                for (let q = 0; q <= (vertical ? h : w); q += 16) {
                    const o = Math.sin(q * 0.025 + i) * 2.5;
                    if (vertical) g.lineTo(p + o, q); else g.lineTo(q, p + o);
                }
                g.stroke();
            }
        });
        const matMadeira = new THREE.MeshPhysicalMaterial({ map: veio('#3a2216', '110,62,36', '20,10,5', false), roughness: 0.42, clearcoat: 0.7, clearcoatRoughness: 0.18, envMapIntensity: 0.8 });
        // cimento queimado grafite: fosco, com manchas suaves (recebe bem os leques de luz e as sombras)
        const tCimento = textura(512, 512, (g, w, h) => {
            g.fillStyle = '#2a2e35'; g.fillRect(0, 0, w, h);
            for (let i = 0; i < 320; i++) {
                const x = Math.random() * w, y = Math.random() * h, r = 6 + Math.random() * 34;
                const gr = g.createRadialGradient(x, y, 0, x, y, r);
                const c = Math.random() < 0.5 ? '255,255,255' : '0,0,0';
                gr.addColorStop(0, `rgba(${c},${0.012 + Math.random() * 0.022})`); gr.addColorStop(1, `rgba(${c},0)`);
                g.fillStyle = gr; g.fillRect(x - r, y - r, r * 2, r * 2);
            }
            const img = g.getImageData(0, 0, w, h), d = img.data;
            for (let i = 0; i < d.length; i += 4) { const n = (Math.random() - 0.5) * 7; d[i] += n; d[i + 1] += n; d[i + 2] += n; }
            g.putImageData(img, 0, 0);
        });
        tCimento.wrapS = tCimento.wrapT = THREE.RepeatWrapping;
        tCimento.repeat.set(2, 2);
        const matCimento = new THREE.MeshStandardMaterial({ map: tCimento, roughness: 0.82, envMapIntensity: 0.18 });
        const matAluminio = new THREE.MeshPhysicalMaterial({ color: 0x15171b, metalness: 0.85, roughness: 0.32, clearcoat: 0.3, envMapIntensity: 1 });   // perfil anodizado preto
        // vidro temperado: incolor, com o verde do float aparecendo na espessura
        const matVidro = new THREE.MeshPhysicalMaterial({
            color: 0xffffff, metalness: 0, roughness: 0.04, transmission: 1, thickness: 0.02, ior: 1.52,
            attenuationColor: new THREE.Color('#5fbfae'), attenuationDistance: 0.35, specularIntensity: 1, envMapIntensity: 1,
        });
        const matLedVerde = new THREE.MeshBasicMaterial({ color: 0xbaf7e8, transparent: true, opacity: 0.9, toneMapped: false });
        const matParede = new THREE.MeshBasicMaterial({ color: FUNDO, toneMapped: false });   // a parede da seção, sem luz: igual ao fundo da página
        const matLed = new THREE.MeshBasicMaterial({ color: 0xfff0d6 });
        const tPlaquinha = textura(256, 96, (g, w, h) => {   // plaquinha prateada gravada (texto miúdo, ilegível de propósito)
            const gr = g.createLinearGradient(0, 0, w, h); gr.addColorStop(0, '#d9dde2'); gr.addColorStop(0.5, '#9aa1a9'); gr.addColorStop(1, '#cfd4da');
            g.fillStyle = gr; g.fillRect(0, 0, w, h);
            g.strokeStyle = 'rgba(30,34,40,.75)'; g.lineWidth = 3; g.strokeRect(6, 6, w - 12, h - 12);
            g.fillStyle = 'rgba(30,34,40,.7)';
            [[0.5, 0.36, 0.56, 7], [0.5, 0.56, 0.7, 5], [0.5, 0.72, 0.42, 5]].forEach(([cx, cy, lw, lh]) => g.fillRect(w * (cx - lw / 2), h * cy - lh / 2, w * lw, lh));
        });
        const matPlaquinha = new THREE.MeshPhysicalMaterial({ map: tPlaquinha, metalness: 0.9, roughness: 0.3, envMapIntensity: 1.2 });
        const geoPlacaJV = placaJV(), geoFigura = figura();

        // ---------- a coleção ----------
        const E = (degraus, bloco, giro) => ({ tipo: 'estatueta', degraus, bloco, giro });
        const JV = (giro) => ({ tipo: 'jv', giro });
        const LAYOUTS = {
            largo: [[E(2, 0.2, 0.32), E(3, 0.16, 0.12), JV(0.16), JV(-0.14), E(2, 0.15, -0.1), E(0, 0.34, -0.3)]],   // ordem da foto
            alto: [[E(2, 0.2, 0.28), JV(0.1), E(0, 0.34, -0.28)], [E(3, 0.16, 0.24), JV(-0.1), E(2, 0.15, -0.24)]],    // de cima para baixo
        };
        const ESP = 0.84, VAO = 1.5, TABUA = 0.06, FUNDO_Z = -0.78, FRENTE_Z = 0.42, TROF_Z = -0.18;

        let estante = null, layout = '', trofeus = [], alvosRaio = [], centro = new THREE.Vector3(), distancia = 6, dims = [6, 2];
        function construir(nome) {
            if (estante) cena.remove(estante);
            layout = nome; trofeus = []; alvosRaio = [];
            estante = new THREE.Group();
            const linhas = LAYOUTS[nome];
            const W = Math.max(...linhas.map((l) => l.length)) * ESP + 0.5;
            const H = linhas.length * VAO + (linhas.length - 1) * TABUA;
            const PISO = -0.16;   // o fundo do nicho fica abaixo da prateleira de vidro de baixo (ela flutua)
            const D = FRENTE_Z - FUNDO_Z;
            const caixa = (w, h, d, mat, x, y, z, sombra = true) => {
                const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat);
                m.position.set(x, y, z); m.receiveShadow = sombra; estante.add(m); return m;
            };
            // fundo, laterais, teto e piso do nicho: cimento queimado grafite
            const HT = H - PISO, CY = (H + PISO) / 2, CZ = (FUNDO_Z + FRENTE_Z) / 2;
            caixa(W, HT, 0.02, matCimento, 0, CY, FUNDO_Z - 0.01);
            caixa(0.04, HT, D, matCimento, -W / 2 - 0.02, CY, CZ);
            caixa(0.04, HT, D, matCimento, W / 2 + 0.02, CY, CZ);
            caixa(W + 0.08, TABUA, D, matCimento, 0, H + TABUA / 2, CZ);
            caixa(W + 0.08, TABUA, D, matCimento, 0, PISO - TABUA / 2, CZ);
            // filetes de LED verticais nos cantos do fundo (detalhe de móvel planejado moderno)
            caixa(0.012, HT - 0.06, 0.01, matLed, -W / 2 + 0.03, CY, FUNDO_Z + 0.01, false);
            caixa(0.012, HT - 0.06, 0.01, matLed, W / 2 - 0.03, CY, FUNDO_Z + 0.01, false);
            // parede da seção em volta da abertura (o nicho parece recortado nela) + a quina iluminada da abertura
            const P = 8;
            caixa(W + 2 * P, P, 0.1, matParede, 0, H + TABUA + P / 2, FRENTE_Z + 0.05, false);
            caixa(W + 2 * P, P, 0.1, matParede, 0, PISO - TABUA - P / 2, FRENTE_Z + 0.05, false);
            caixa(P, HT + 2 * TABUA, 0.1, matParede, -W / 2 - 0.04 - P / 2, CY, FRENTE_Z + 0.05, false);
            caixa(P, HT + 2 * TABUA, 0.1, matParede, W / 2 + 0.04 + P / 2, CY, FRENTE_Z + 0.05, false);
            // moldura de alumínio preto na abertura
            const M = 0.035;
            caixa(W + 0.08 + 2 * M, M, 0.05, matAluminio, 0, H + TABUA + M / 2, FRENTE_Z + 0.01, false);
            caixa(W + 0.08 + 2 * M, M, 0.05, matAluminio, 0, PISO - TABUA - M / 2, FRENTE_Z + 0.01, false);
            caixa(M, HT + 2 * TABUA, 0.05, matAluminio, -W / 2 - 0.04 - M / 2, CY, FRENTE_Z + 0.01, false);
            caixa(M, HT + 2 * TABUA, 0.05, matAluminio, W / 2 + 0.04 + M / 2, CY, FRENTE_Z + 0.01, false);
            // luz principal (de frente, do alto): a que projeta as sombras dos troféus no fundo
            const chave = new THREE.SpotLight(0xfff1de, 17 * linhas.length, 0, 0.5, 0.85, 2);
            chave.position.set(-0.6, H + 2.2, 3.4); chave.target.position.set(0, H * 0.45, FUNDO_Z);
            chave.castShadow = true; chave.shadow.mapSize.set(1024, 1024); chave.shadow.bias = -0.0004; chave.shadow.normalBias = 0.02; chave.shadow.radius = 3;
            chave.shadow.camera.near = 1; chave.shadow.camera.far = 12;
            estante.add(chave, chave.target);
            // prateleiras: de cima para baixo; cada vão tem a faixa de LED na frente do teto e um spot embutido por troféu
            linhas.forEach((linha, k) => {
                const topoVao = H - k * (VAO + TABUA), baseVao = topoVao - VAO;
                // prateleira flutuante de vidro temperado, com a borda da frente acesa (o verde do float)
                const vidro = caixa(W - 0.02, 0.024, D - 0.16, matVidro, 0, baseVao - 0.012, CZ - 0.05, false);
                vidro.renderOrder = 1;
                caixa(W - 0.02, 0.022, 0.004, matLedVerde, 0, baseVao - 0.012, CZ - 0.05 + (D - 0.16) / 2 + 0.003, false);
                caixa(W - 0.12, 0.012, 0.02, matLed, 0, topoVao - 0.008, FRENTE_Z - 0.1, false);
                linha.forEach((m, j) => {
                    const x = (j - (linha.length - 1) / 2) * ESP;
                    const grupo = new THREE.Group(); grupo.position.set(x, baseVao, TROF_Z);
                    const peca = new THREE.Group(); peca.rotation.y = m.giro; grupo.add(peca);
                    const t = m.tipo === 'jv' ? trofeuJV(peca) : estatueta(peca, m);
                    peca.traverse((o) => { if (o.isMesh) { o.castShadow = true; o.receiveShadow = true; } });
                    estante.add(grupo);
                    // spot embutido no teto do vão, encostado no fundo: leque de luz no fundo + brilho no troféu
                    const luz = new THREE.SpotLight(0xffdcae, 11, 0, 0.55, 0.75, 2);
                    luz.position.set(x, topoVao - 0.02, FUNDO_Z + 0.22); luz.target.position.set(x, baseVao, FUNDO_Z + 0.05);
                    estante.add(luz, luz.target);
                    alvosRaio.push(...t.alvos);
                    trofeus.push({ ...t, luz, i: trofeus.length });
                });
            });
            cena.add(estante);
            centro.set(0, CY, 0);
            dims = [W + 0.3, HT + 0.3];
            enquadrar(...dims);
        }
        function enquadrar(W, H) {
            const tg = Math.tan(THREE.MathUtils.degToRad(camera.fov / 2));
            distancia = Math.max(H / 2 / tg, W / 2 / (tg * camera.aspect)) + FRENTE_Z;
        }

        // placa JV (0,56 × 0,84) levemente inclinada para trás, numa base preta arredondada
        function trofeuJV(peca) {
            const base = new THREE.Mesh(new THREE.CylinderGeometry(0.36, 0.38, 0.07, 64), matPreto);
            base.scale.z = 0.42; base.position.y = 0.035;
            const placa = new THREE.Mesh(geoPlacaJV, matOuroEscovado.clone());
            placa.position.set(0, 0.045, 0); placa.rotation.x = -0.1;
            peca.add(base, placa);
            return { brilho: placa.material, env: 1.7, alvos: [base, placa] };
        }
        // estatueta dourada sobre degraus dourados e/ou bloco de madeira com plaquinha
        function estatueta(peca, m) {
            let y = 0; const alvos = [];
            const bloco = new THREE.Mesh(extrudar(retangulo(0.36, m.bloco), 0.3, 0.01), matMadeira);
            peca.add(bloco); alvos.push(bloco); y += m.bloco;
            const plaq = new THREE.Mesh(new THREE.PlaneGeometry(0.24, 0.085), matPlaquinha);
            plaq.position.set(0, m.bloco * 0.5, 0.1515); peca.add(plaq);
            const ouro = matOuroPolido.clone();
            for (let d = 0; d < m.degraus; d++) {
                const w = 0.25 - d * 0.055, h = 0.055;
                const deg = new THREE.Mesh(extrudar(retangulo(w, h), w, 0.006), ouro);
                deg.position.y = y; peca.add(deg); alvos.push(deg); y += h;
            }
            const fig = new THREE.Mesh(geoFigura, ouro);
            fig.scale.setScalar(1.5);   // na foto a estatueta é bem mais alta que a placa JV
            fig.position.y = y; peca.add(fig); alvos.push(fig);
            return { brilho: ouro, env: 2.1, alvos };
        }

        // ---------- foco: o troféu apontado (mouse ou toque) ganha brilho; os outros recuam um pouco ----------
        let emFoco = -1, focoFixo = -1;
        const raio = new THREE.Raycaster(), ndc = new THREE.Vector2();
        function trofeuNoPonto(e) {
            const r = canvas.getBoundingClientRect();
            ndc.set((e.clientX - r.left) / r.width * 2 - 1, -((e.clientY - r.top) / r.height) * 2 + 1);
            raio.setFromCamera(ndc, camera);
            const hit = raio.intersectObjects(alvosRaio, false)[0];
            return hit ? trofeus.find((t) => t.alvos.includes(hit.object)).i : -1;
        }
        const focar = (i) => { if (i !== emFoco) { emFoco = i; ligar(); } };
        const ponteiro = { x: 0, y: 0 };
        canvas.addEventListener('pointermove', (e) => {
            if (e.pointerType !== 'mouse') return;
            const r = canvas.getBoundingClientRect();
            ponteiro.x = (e.clientX - r.left) / r.width * 2 - 1; ponteiro.y = (e.clientY - r.top) / r.height * 2 - 1;
            const i = trofeuNoPonto(e);
            canvas.style.cursor = i >= 0 ? 'pointer' : '';
            focar(i >= 0 ? i : focoFixo);
        });
        canvas.addEventListener('pointerleave', () => { ponteiro.x = ponteiro.y = 0; focar(focoFixo); });
        canvas.addEventListener('click', (e) => { const i = trofeuNoPonto(e); focoFixo = i === focoFixo ? -1 : i; focar(focoFixo); });

        // ---------- tamanho: tela larga = uma prateleira; estreita = duas ----------
        let visivel = true, rodando = false, ultimo = performance.now(), t = 0, camX = 0, camY = 0, parado = 0;
        function ajustar() {
            const w = palco.clientWidth, h = palco.clientHeight;
            if (!w || !h) return;
            renderer.setSize(w, h, false);
            camera.aspect = w / h; camera.updateProjectionMatrix();
            const nome = camera.aspect >= 1.4 ? 'largo' : 'alto';
            if (nome !== layout) { emFoco = focoFixo = -1; construir(nome); }
            else enquadrar(...dims);
            ligar();
        }
        new ResizeObserver(ajustar).observe(palco);
        ajustar();

        // ---------- quadro ----------
        function desenhar(dt) {
            t += dt;
            const k = 1 - Math.exp(-dt * 2.5), kf = 1 - Math.exp(-dt * 6);
            const amp = layout === 'largo' ? 1 : 0.5;
            const ax = reduzido ? 0 : (ponteiro.x * 0.3 + Math.sin(t * 0.17) * 0.16) * amp, ay = reduzido ? 0 : -ponteiro.y * 0.1 * amp;
            camX += (ax - camX) * k; camY += (ay - camY) * k;
            camera.position.set(centro.x + camX, centro.y + 0.12 + camY, distancia);
            camera.lookAt(centro.x, centro.y - 0.04, 0);
            let mexendo = Math.abs(ax - camX) > 1e-4 || Math.abs(ay - camY) > 1e-4;
            trofeus.forEach((tr) => {
                const f = emFoco < 0 ? 0 : tr.i === emFoco ? 1 : -1;
                const alvoEnv = f > 0 ? tr.env * 1.45 : f < 0 ? tr.env * 0.75 : tr.env;
                const alvoLuz = f > 0 ? 24 : f < 0 ? 7 : 11;
                if (Math.abs(alvoEnv - tr.brilho.envMapIntensity) > 0.005 || Math.abs(alvoLuz - tr.luz.intensity) > 0.05) mexendo = true;
                tr.brilho.envMapIntensity += (alvoEnv - tr.brilho.envMapIntensity) * kf;
                tr.luz.intensity += (alvoLuz - tr.luz.intensity) * kf;
            });
            renderer.render(cena, camera);
            parado = mexendo || !reduzido ? 0 : parado + 1;
        }
        function quadro(agora) {
            if (!visivel || document.hidden) { rodando = false; return; }
            const dt = Math.min(0.05, (agora - ultimo) / 1000); ultimo = agora;
            desenhar(dt);
            if (parado > 2) { rodando = false; return; }
            requestAnimationFrame(quadro);
        }
        function ligar() { if (!rodando && visivel && canvas.classList.contains('pronto')) { rodando = true; parado = 0; ultimo = performance.now(); requestAnimationFrame(quadro); } }
        new IntersectionObserver(([e]) => { visivel = e.isIntersecting; ligar(); }).observe(raiz);
        document.addEventListener('visibilitychange', ligar);

        // compila sem travar a página, desenha o 1º quadro e só então mostra
        try { await renderer.compileAsync(cena, camera); } catch (e) { /* compila no 1º quadro */ }
        desenhar(0);
        raiz.classList.add('trofeus-3d');
        requestAnimationFrame(() => { canvas.classList.add('pronto'); ligar(); });
    }

    // ---------- geometria ----------
    function retangulo(w, h) {
        const s = new THREE.Shape();
        s.moveTo(-w / 2, 0); s.lineTo(w / 2, 0); s.lineTo(w / 2, h); s.lineTo(-w / 2, h); s.closePath();
        return s;
    }
    function extrudar(perfil, d, chanfro) {
        const g = new THREE.ExtrudeGeometry(perfil, { depth: d - chanfro * 2, bevelEnabled: true, bevelThickness: chanfro, bevelSize: chanfro, bevelSegments: 2, curveSegments: 24 });
        g.translate(0, chanfro, -(d - chanfro * 2) / 2);   // apoia no chão (o chanfro não afunda) e centra na espessura
        return g;
    }
    // estatueta estilo Oscar (0,62 de altura): torneada, achatada de frente para trás, com a cabeça e os braços cruzados no peito
    function figura() {
        const perfil = [   // [raio, altura]
            [0, 0], [0.034, 0], [0.034, 0.03], [0.026, 0.035], [0.02, 0.06], [0.026, 0.15], [0.022, 0.22], [0.034, 0.3],
            [0.043, 0.35], [0.04, 0.39], [0.052, 0.44], [0.06, 0.49], [0.058, 0.515], [0.04, 0.532], [0.016, 0.54], [0.014, 0.552], [0, 0.552],
        ].map(([r, y]) => new THREE.Vector2(r, y));
        const corpo = new THREE.LatheGeometry(perfil, 48);
        corpo.scale(1, 1, 0.66);
        const cabeca = new THREE.SphereGeometry(0.033, 32, 20); cabeca.scale(0.92, 1.12, 0.92); cabeca.translate(0, 0.588, 0);
        const braco = (lado) => { const b = new THREE.CapsuleGeometry(0.013, 0.07, 6, 12); b.rotateZ(lado * 1.15); b.translate(0, 0.452, 0.028); return b; };
        return mesclar([corpo, cabeca, braco(1), braco(-1)]);
    }
    function mesclar(geos) {   // junta geometrias não indexadas numa só (sem depender de BufferGeometryUtils)
        const partes = geos.map((g) => (g.index ? g.toNonIndexed() : g));
        let n = 0; partes.forEach((g) => { n += g.attributes.position.count; });
        const pos = new Float32Array(n * 3), nor = new Float32Array(n * 3);
        let o = 0;
        partes.forEach((g) => { pos.set(g.attributes.position.array, o * 3); nor.set(g.attributes.normal.array, o * 3); o += g.attributes.position.count; });
        const r = new THREE.BufferGeometry();
        r.setAttribute('position', new THREE.BufferAttribute(pos, 3)); r.setAttribute('normal', new THREE.BufferAttribute(nor, 3));
        return r;
    }
    // placa do Jornal do Vidro: os furos são o "JV" entre aspas (no alto) e a silhueta da estatueta (no meio)
    function placaJV() {
        const W = 0.56, H = 0.84, s = new THREE.Shape();
        s.moveTo(-W / 2, 0); s.lineTo(W / 2, 0); s.lineTo(W / 2, H); s.lineTo(-W / 2, H); s.closePath();
        const furo = (pts) => { const p = new THREE.Path(); p.moveTo(pts[0][0], pts[0][1]); pts.slice(1).forEach(([x, y]) => p.lineTo(x, y)); p.closePath(); s.holes.push(p); };
        const T = 0.79, B = 0.6, e = 0.052;   // topo e pé das letras, espessura do traço
        // J (haste à direita, gancho embaixo à esquerda)
        const a = -0.165;
        furo([[a + 0.07, T], [a + 0.07 + e, T], [a + 0.07 + e, B + 0.035], [a + 0.085, B], [a, B], [a, B + e], [a + 0.07, B + e]]);
        // V
        const v0 = -0.035, v1 = 0.165, vm = (v0 + v1) / 2;
        furo([[v0, T], [v0 + e, T], [vm, B + 0.075], [v1 - e, T], [v1, T], [vm + 0.032, B], [vm - 0.032, B]]);
        // aspas
        const aspa = (q) => furo([[q, T], [q + 0.022, T], [q + 0.01, T - 0.058], [q - 0.012, T - 0.058]]);
        aspa(-0.245); aspa(-0.21); aspa(0.19); aspa(0.225);
        // estatueta: pedestal em dois degraus, pernas, quadril, braços cruzados no peito, ombros, pescoço e cabeça (um furo só)
        const f = new THREE.Path();
        const lado = (sx) => [   // contorno de um lado, de baixo para cima (sx = 1 direita, -1 esquerda)
            ['l', 0.045, 0.122], ['l', 0.03, 0.122], ['l', 0.03, 0.14], ['l', 0.016, 0.14],
            ['b', 0.02, 0.2, 0.024, 0.26, 0.034, 0.3],
            ['b', 0.037, 0.318, 0.031, 0.336, 0.041, 0.358],
            ['b', 0.05, 0.38, 0.057, 0.398, 0.055, 0.418],
            ['q', 0.052, 0.442, 0.014, 0.449],
            ['l', 0.0125, 0.462],
        ].map((c) => [c[0], ...c.slice(1).map((v, i) => (i % 2 === 0 ? v * sx : v))]);
        f.moveTo(-0.045, 0.1); f.lineTo(0.045, 0.1);
        const aplicar = (c) => { if (c[0] === 'l') f.lineTo(c[1], c[2]); else if (c[0] === 'q') f.quadraticCurveTo(c[1], c[2], c[3], c[4]); else f.bezierCurveTo(c[1], c[2], c[3], c[4], c[5], c[6]); };
        lado(1).forEach(aplicar);
        const r = Math.hypot(0.0125, 0.03), cy = 0.462 + 0.03;
        f.absarc(0, cy, r, Math.atan2(-0.03, 0.0125), Math.atan2(-0.03, -0.0125) + Math.PI * 2, false);
        // lado esquerdo, de cima para baixo (o mesmo contorno espelhado e invertido)
        const esq = lado(-1), pontos = [[-0.045, 0.1], ...esq.map((c) => [c[c.length - 2], c[c.length - 1]])];
        for (let i = esq.length - 1; i >= 0; i--) {
            const c = esq[i], destino = pontos[i];
            if (c[0] === 'l') f.lineTo(destino[0], destino[1]);
            else if (c[0] === 'q') f.quadraticCurveTo(c[1], c[2], destino[0], destino[1]);
            else f.bezierCurveTo(c[3], c[4], c[1], c[2], destino[0], destino[1]);
        }
        f.closePath();
        s.holes.push(f);
        const g = new THREE.ExtrudeGeometry(s, { depth: 0.018, bevelEnabled: true, bevelThickness: 0.002, bevelSize: 0.002, bevelSegments: 1, curveSegments: 24 });
        g.translate(0, 0, -0.009);
        return g;
    }
    function textura(w, h, pintar) {
        const c = document.createElement('canvas'); c.width = w; c.height = h;
        pintar(c.getContext('2d'), w, h);
        const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 4;
        return t;
    }
}
