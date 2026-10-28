// Vitrine do hero: o busto de vidro sob um spot de cima, num piso polido (three.js 0.183, sem model-viewer).
// Outros modelos via query string: ?vidro=original | normal | holograma
// - spot real (luz física) iluminando o busto e formando a poça de luz no piso
// - "sombra de vidro": a silhueta do busto vista pela luz vira uma sombra colorida com cáusticas,
//   recalculada a cada quadro (gira junto com o busto)
// - sala de simulação: piso e paredes com malha de papel milimetrado (folha de projeto)
// - piso polido: reflexo real (espelho) desfocado e esmaecendo com a distância
// - letras em vidro colorido pela espessura, acesas por dentro (sem bloom: o brilho exagerava os reflexos do vidro)
// Carga: enquanto o 3D prepara, o hero mostra uma foto do primeiro quadro (CSS de .hv-palco). O canvas só aparece
// depois que modelo e estúdio chegaram, os shaders compilaram e o primeiro quadro foi desenhado. Se algo falhar
// (rede, WebGL indisponível ou derrubado pelo navegador), a foto continua no lugar.
import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { HDRLoader } from 'three/addons/loaders/HDRLoader.js';
import { Reflector } from 'three/addons/objects/Reflector.js';

const P = Object.assign({
    fundo: '#081a33', piso: '#36475c', spot: 30, ambiente: 0.6, reflexo: 0.38, cone: 0.012, linha: '#9cc4ff',
    giro: 10, // graus por segundo
}, window.VITRINE || {});

const canvas = document.getElementById('vitrine');
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, powerPreference: 'high-performance' });
renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
renderer.toneMapping = THREE.AgXToneMapping;
renderer.toneMappingExposure = 1.0;

const cena = new THREE.Scene();
const corFundo = new THREE.Color(P.fundo);
// fundo como cúpula dentro da cena, sem ajuste de tons: no three a névoa é aplicada depois do ajuste de tons,
// então cúpula e piso com névoa só batem assim (horizonte sem emenda). Cor final na tela = P.fundo.
const cupula = new THREE.Mesh(new THREE.SphereGeometry(20, 32, 16), new THREE.MeshBasicMaterial({ color: corFundo, side: THREE.BackSide, fog: false, depthWrite: false, toneMapped: false }));
cena.add(cupula);
cena.fog = new THREE.Fog(corFundo, 4.2, 12.5);
const pmrem = new THREE.PMREMGenerator(renderer);
// estúdio escuro com faixas de luz: desenham as bordas do vidro (iluminação de campo escuro, como em foto de cristal)
let estudio = null;   // guardado para refazer o ambiente se o navegador derrubar o WebGL
function montarAmbiente() { if (estudio) cena.environment = pmrem.fromEquirectangular(estudio).texture; }
cena.environmentIntensity = P.ambiente;

const camera = new THREE.PerspectiveCamera(30, 1, 0.05, 40);
const ALVO = new THREE.Vector3(0, 0.27, 0);
const ELEV = THREE.MathUtils.degToRad(15);
const DIST = 3.7;
camera.position.set(0, ALVO.y + Math.sin(ELEV) * DIST, Math.cos(ELEV) * DIST);
camera.lookAt(ALVO);

// ---------- spot de cima, levemente atrás (a luz atravessa o busto e cai à frente, para quem olha) ----------
const spot = new THREE.SpotLight(0xfff4e6, P.spot, 0, THREE.MathUtils.degToRad(14), 0.5, 2);
spot.position.set(0.25, 3.5, -0.75);
spot.target.position.copy(ALVO).setY(0.12);
cena.add(spot, spot.target);
// (sem luz de recorte: os softboxes do estúdio já desenham as bordas do vidro; uma luz atrás refletia no piso como faixa no horizonte)

// cone de luz no ar (bem sutil)
const coneGeo = new THREE.ConeGeometry(Math.tan(spot.angle) * 3.4, 3.4, 64, 1, true);
coneGeo.translate(0, -1.7, 0);
const coneMat = new THREE.ShaderMaterial({
    transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide,
    uniforms: { forca: { value: P.cone }, cor: { value: new THREE.Color(0xfff1dc) } },
    vertexShader: `varying float vY; varying vec3 vN; varying vec3 vV;
        void main(){ vY = position.y; vec4 mv = modelViewMatrix * vec4(position,1.); vN = normalize(normalMatrix*normal); vV = normalize(-mv.xyz); gl_Position = projectionMatrix*mv; }`,
    fragmentShader: `uniform float forca; uniform vec3 cor; varying float vY; varying vec3 vN; varying vec3 vV;
        void main(){ float h = clamp(-vY/3.4,0.,1.); float borda = pow(abs(dot(vN,vV)),4.);
          float a = forca * borda * smoothstep(0.,0.25,h) * (1.-smoothstep(0.75,1.,h));
          gl_FragColor = vec4(cor*a, 1.); }`
});
const cone = new THREE.Mesh(coneGeo, coneMat);
cone.position.copy(spot.position);
const coneAltura = spot.position.distanceTo(spot.target.position);
cone.lookAt(spot.target.position);
cone.rotateX(-Math.PI / 2);
cena.add(cone);

// ---------- busto ----------
const busto = new THREE.Group();
cena.add(busto);
const LARGURA = 1.06, ALTURA_MAX = 0.62; // tamanho do busto na cena (metros)
let raioX = 0.53, raioZ = 0.18; // meia-largura da base (atualizado ao carregar)

// ---------- sombra de vidro: silhueta colorida vista pela luz + cáusticas ----------
const camLuz = new THREE.PerspectiveCamera(THREE.MathUtils.radToDeg(spot.angle) * 2, 1, 0.5, 10);
camLuz.position.copy(spot.position);
camLuz.lookAt(spot.target.position);
camLuz.updateMatrixWorld();
const cenaSilhueta = new THREE.Scene();
const silhueta = new THREE.Group();
cenaSilhueta.add(silhueta);
const rtTinta = new THREE.WebGLRenderTarget(512, 512, { type: THREE.HalfFloatType, samples: 4 });
const rtLuz = new THREE.WebGLRenderTarget(512, 512, { type: THREE.HalfFloatType });
const quad = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), new THREE.ShaderMaterial({
    uniforms: { tinta: { value: rtTinta.texture }, angulo: { value: 0 }, centro: { value: new THREE.Vector2(0.5, 0.5) } },
    vertexShader: 'varying vec2 vUv; void main(){ vUv = uv; gl_Position = vec4(position.xy,0.,1.); }',
    fragmentShader: `
        uniform sampler2D tinta; uniform float angulo; uniform vec2 centro; varying vec2 vUv;
        vec2 h2(vec2 p){ p = vec2(dot(p,vec2(127.1,311.7)), dot(p,vec2(269.5,183.3))); return fract(sin(p)*43758.5453); }
        float bordas(vec2 p){ vec2 i=floor(p), f=fract(p); float d1=8., d2=8.;
            for(int y=-1;y<=1;y++) for(int x=-1;x<=1;x++){ vec2 g=vec2(x,y); vec2 o=h2(i+g); o=.5+.4*sin(6.2831*o);
                float d=length(g+o-f); if(d<d1){d2=d1;d1=d;} else if(d<d2){d2=d;} }
            return d2-d1; }
        void main(){
            // borra a silhueta: a sombra de uma luz pequena é nítida perto da base e suave nas pontas
            vec3 t = vec3(0.); float n = 0.;
            for(int y=-2;y<=2;y++) for(int x=-2;x<=2;x++){ t += texture2D(tinta, vUv + vec2(x,y)/512.*1.6).rgb; n += 1.; }
            t /= n;
            float cobre = clamp((1. - min(t.r, min(t.g, t.b))) * 3.5, 0., 1.);
            // cáusticas de uma base lisa: faixas largas e suaves de luz concentrada, presas ao busto (giram com ele)
            vec2 q = vUv - centro; float c = cos(angulo), s = sin(angulo);
            q = vec2(c*q.x - s*q.y, s*q.x + c*q.y) * 5.;
            q += .45*vec2(sin(q.y*1.7 + 1.3), cos(q.x*1.4 + .4));
            float e1 = bordas(q), e2 = bordas(q*1.6 + 7.1);
            float caust = .65*pow(1. - smoothstep(0., .32, e1), 2.) + .35*pow(1. - smoothstep(0., .25, e2), 2.);
            // vidro é claro: a sombra deixa passar boa parte da luz, tingida pela cor de cada peça
            vec3 luz = mix(vec3(1.), t * (0.62 + 1.25*caust), cobre);
            gl_FragColor = vec4(luz, 1.);
        }`
}));
const cenaQuad = new THREE.Scene(); cenaQuad.add(quad);
const camQuad = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
const multiplicar = (cor) => new THREE.MeshBasicMaterial({
    color: cor, depthTest: false, depthWrite: false, side: THREE.FrontSide,
    blending: THREE.CustomBlending, blendEquation: THREE.AddEquation, blendSrc: THREE.ZeroFactor, blendDst: THREE.SrcColorFactor,
});

// ---------- malha (papel milimetrado) ----------
const MALHA_GLSL = `
    float malha1(vec2 p, float passo, float esp) {
        vec2 q = p / passo; vec2 w = fwidth(q);
        vec2 a = abs(fract(q - .5) - .5) / (w * esp);
        float l = 1. - min(min(a.x, a.y), 1.);
        return l * (1. - smoothstep(.12, .45, max(w.x, w.y)));
    }
    float grade(vec2 p) { return max(malha1(p, .1, 1.) * .32, malha1(p, .5, 1.5) * .9); }`;

// ---------- piso polido com reflexo ----------
const espelho = new Reflector(new THREE.PlaneGeometry(30, 30), {
    textureWidth: 1024, textureHeight: 1024, clipBias: 0.002, color: 0xffffff, multisample: 4
});
espelho.rotation.x = -Math.PI / 2;
espelho.material.colorWrite = false;
espelho.material.depthWrite = false;
espelho.renderOrder = -10;
cena.add(espelho);

const pisoMat = new THREE.MeshStandardMaterial({ color: P.piso, roughness: 0.55, metalness: 0, envMapIntensity: 0 }); // o piso só recebe o spot; o reflexo vem do espelho
const U = {
    uRefl: { value: espelho.getRenderTarget().texture },
    uReflMat: { value: espelho.material.uniforms.textureMatrix.value },
    uReflForca: { value: P.reflexo },
    uLuzMat: { value: new THREE.Matrix4() },
    uLuzMap: { value: rtLuz.texture },
    uAngulo: { value: 0 },
    uRaio: { value: new THREE.Vector2(raioX, raioZ) },
    uAmbPiso: { value: corFundo.clone().multiplyScalar(0.9) },
    uLinha: { value: new THREE.Color(P.linha) },
};
pisoMat.onBeforeCompile = (sh) => {
    Object.assign(sh.uniforms, U);
    sh.vertexShader = sh.vertexShader
        .replace('#include <common>', '#include <common>\nvarying vec3 vMundo;')
        .replace('#include <worldpos_vertex>', '#include <worldpos_vertex>\nvMundo = (modelMatrix * vec4(transformed,1.)).xyz;');
    sh.fragmentShader = sh.fragmentShader
        .replace('#include <common>', `#include <common>
            varying vec3 vMundo; uniform sampler2D uRefl, uLuzMap; uniform mat4 uReflMat, uLuzMat; uniform float uReflForca, uAngulo; uniform vec2 uRaio; uniform vec3 uAmbPiso, uLinha;
            ${MALHA_GLSL}`)
        .replace('#include <opaque_fragment>', `
            // penumbra: fora da luz, o piso pega um pouco da cor da sala (não fica preto)
            outgoingLight += uAmbPiso * diffuseColor.rgb * 6.;
            // sombra de vidro + cáusticas (projetadas a partir da luz)
            vec4 lp = uLuzMat * vec4(vMundo, 1.);
            vec2 luv = lp.xy / lp.w * .5 + .5;
            if (lp.w > 0. && all(greaterThan(luv, vec2(0.))) && all(lessThan(luv, vec2(1.)))) outgoingLight *= texture2D(uLuzMap, luv).rgb;
            // contato: o piso escurece logo junto da base (no espaço do busto, gira com ele)
            float c = cos(uAngulo), s = sin(uAngulo);
            vec2 l = vec2(c*vMundo.x - s*vMundo.z, s*vMundo.x + c*vMundo.z) / uRaio;
            outgoingLight *= 1. - .55 * smoothstep(1.18, .96, length(l));
            // malha da folha: tinta clara (acende onde a luz bate) + leve brilho próprio (sala de simulação)
            float g = grade(vMundo.xz);
            outgoingLight *= 1. + g * 2.2;
            outgoingLight += uLinha * g * .006;
            // reflexo desfocado, mais forte perto do busto
            vec4 ru = uReflMat * vec4(vMundo, 1.);
            vec2 r = ru.xy / ru.w; vec3 refl = vec3(0.);
            for (int i = 0; i < 12; i++) { float a = float(i) * 2.39996; float rr = sqrt(float(i) + .5) / 3.5;
                refl += texture2D(uRefl, r + vec2(cos(a), sin(a)) * rr * .0065).rgb; }
            refl /= 12.;
            float perto = 1. - smoothstep(.4, 2.6, length(vMundo.xz));
            outgoingLight += refl * uReflForca * perto;
            #include <opaque_fragment>`);
};
// o ambiente da cena ilumina só o busto: o piso usa um ambiente próprio, preto (só o spot e o espelho contam)
pisoMat.envMap = new THREE.CubeTexture(); pisoMat.envMapIntensity = 0;
const piso = new THREE.Mesh(new THREE.PlaneGeometry(30, 30), pisoMat);
piso.rotation.x = -Math.PI / 2;
cena.add(piso);
// o piso não pode aparecer dentro do próprio reflexo
const refletirOriginal = espelho.onBeforeRender;
espelho.onBeforeRender = function (r, s, c) { piso.visible = false; cone.visible = false; refletirOriginal.call(this, r, s, c); piso.visible = true; cone.visible = true; };

// ---------- paredes da sala (mesma malha) ----------
const SALA = { fundo: -2.6, esquerda: -4.6, direita: 4.6, altura: 4 };
function parede(largura, altura, eixos) {
    const m = new THREE.MeshStandardMaterial({ color: P.piso, roughness: 0.9, metalness: 0 });
    m.envMap = new THREE.CubeTexture(); m.envMapIntensity = 0;
    m.onBeforeCompile = (sh) => {
        Object.assign(sh.uniforms, { uAmbPiso: U.uAmbPiso, uLinha: U.uLinha });
        sh.vertexShader = sh.vertexShader
            .replace('#include <common>', '#include <common>\nvarying vec3 vMundo;')
            .replace('#include <worldpos_vertex>', '#include <worldpos_vertex>\nvMundo = (modelMatrix * vec4(transformed,1.)).xyz;');
        sh.fragmentShader = sh.fragmentShader
            .replace('#include <common>', `#include <common>\nvarying vec3 vMundo; uniform vec3 uAmbPiso, uLinha;\n${MALHA_GLSL}`)
            .replace('#include <opaque_fragment>', `
                outgoingLight += uAmbPiso * diffuseColor.rgb * 5.;
                float g = grade(vMundo.${eixos});
                outgoingLight *= 1. + g * 2.2;
                outgoingLight += uLinha * g * .006;
                #include <opaque_fragment>`);
    };
    return new THREE.Mesh(new THREE.PlaneGeometry(largura, altura), m);
}
const paredeFundo = parede(SALA.direita - SALA.esquerda, SALA.altura, 'xy');
paredeFundo.position.set(0, SALA.altura / 2, SALA.fundo);
const paredeEsq = parede(10, SALA.altura, 'zy');
paredeEsq.rotation.y = Math.PI / 2; paredeEsq.position.set(SALA.esquerda, SALA.altura / 2, SALA.fundo + 5);
const paredeDir = parede(10, SALA.altura, 'zy');
paredeDir.rotation.y = -Math.PI / 2; paredeDir.position.set(SALA.direita, SALA.altura / 2, SALA.fundo + 5);
cena.add(paredeFundo, paredeEsq, paredeDir);

// ---------- carga do modelo ----------
const OUTROS = {
    original: ['./assets/modelo_ecg_vidro.glb', 'Logotipo da ECG Sistemas esculpido em vidro'],
    normal: ['./assets/modelo_ecg.glb', 'Logotipo da ECG Sistemas em 3D'],
    holograma: ['./assets/modelo_device_hologram_v14.glb', 'Monitor e tablet holográficos com o sistema ECG'],
};
const escolhido = OUTROS[new URLSearchParams(location.search).get('vidro')];
if (escolhido) { canvas.dataset.modelo = escolhido[0]; canvas.setAttribute('aria-label', escolhido[1]); }
// baixa com novas tentativas (uma falha de rede passageira não deixa o hero vazio)
function baixar(loader, url, tentativas = 3) {
    return new Promise((ok, falha) => {
        const tentar = (resta) => loader.load(url, ok, undefined, (erro) => {
            if (resta > 1) setTimeout(() => tentar(resta - 1), 700 * (tentativas - resta + 1)); else falha(erro);
        });
        tentar(tentativas);
    });
}
Promise.all([baixar(new HDRLoader(), canvas.dataset.estudio), baixar(new GLTFLoader(), canvas.dataset.modelo)])
    .then(([hdr, gltf]) => {
        hdr.mapping = THREE.EquirectangularReflectionMapping;
        estudio = hdr; montarAmbiente();
        montarBusto(gltf);
        return preparar();
    })
    .catch((erro) => console.warn('Vitrine 3D: não carregou, a imagem estática continua no lugar.', erro));

function montarBusto(gltf) {
    const m = gltf.scene;
    const bruto = new THREE.Box3().setFromObject(m).getSize(new THREE.Vector3());
    m.scale.setScalar(Math.min(LARGURA / bruto.x, ALTURA_MAX / bruto.y));
    const caixa = new THREE.Box3().setFromObject(m);
    m.position.y = -caixa.min.y;
    m.position.x = -(caixa.min.x + caixa.max.x) / 2;
    m.position.z = -(caixa.min.z + caixa.max.z) / 2;
    raioX = (caixa.max.x - caixa.min.x) / 2; raioZ = (caixa.max.z - caixa.min.z) / 2;
    U.uRaio.value.set(raioX, raioZ);
    m.traverse((o) => {
        if (!o.isMesh || !o.material) return;
        // entalhe: é uma abertura no vidro, não fica "atrás" dele. Desenhado depois do vidro, direto na tela
        // (o que fica atrás de um vidro passa por um filtro de suavização e sairia borrado)
        if (o.material.name === 'entalhe_jateado') { o.material.transparent = true; o.material.depthWrite = true; o.renderOrder = 3; return; }
        if (/base_matte|base_borda/.test(o.material.name)) o.material.depthWrite = false;
        // topo da base: reflexo mais contido (num topo plano o estúdio inteiro aparece e vira um disco cinza);
        // quem desenha os limites são o chanfro e a lateral, no material da borda (verde do float)
        if (o.material.name === 'base_matte') { o.material.specularIntensity = 0.3; o.material.envMapIntensity = 0.5; }
        if (o.material.name === 'base_borda') { o.material.envMapIntensity = 1.6; o.material.roughness = 0; }
        // o miolo de neon do modelo fica oculto: quem brilha é a própria letra (abaixo), como acrílico iluminado pela borda
        if (/neon/.test(o.material.name)) { o.visible = false; return; }
        if (o.material.transmission === undefined) return;
        const mt = o.material;
        const letra = /blue|orange|dark/.test(mt.name);
        o.renderOrder = letra ? 2 : 1;   // ordem fixa entre as peças de vidro: nada "salta" ao girar
        if (letra) {
            // vidro colorido de verdade: a cor vem da espessura atravessada (mais intensa no miolo, mais clara nas bordas),
            // não de uma "pintura" da superfície (que dava cara de acrílico)
            const tinta = /blue/.test(mt.name) ? '#2a74e0' : /orange/.test(mt.name) ? '#f29a26' : '#3a64a8';
            mt.color.set(0xffffff);
            mt.transmission = 1; mt.metalness = 0; mt.ior = 1.5;
            mt.roughness = 0.015;
            mt.attenuationColor.set(tinta);
            mt.attenuationDistance = /dark/.test(mt.name) ? 0.03 : 0.02;   // em metros: ~2 cm já tinge forte
            mt.clearcoat = 0;                                               // vidro não tem verniz: a 2ª camada de brilho era "plástica"
            mt.dispersion = 1.2;                                            // arco-íris discreto nas quinas, como em vidro lapidado
            mt.specularIntensity = 1;
            // luz dentro do próprio vidro: a cor brilha, e os reflexos e a refração continuam por cima
            mt.emissive.set(tinta);
            mt.emissiveIntensity = /dark/.test(mt.name) ? 0.55 : 0.7;
            mt.needsUpdate = true;
        }
    });
    busto.add(m);
    // silhueta: mesmas geometrias, com a cor que cada vidro deixa passar
    const tintas = { blue: 0x4f86e8, orange: 0xffa64a, dark: 0x6d82ad, base: 0xd2ebe6, borda: 0xc0e2da, entalhe: 0x9aa4ad };
    const sil = m.clone(true);
    sil.traverse((o) => {
        if (!o.isMesh) return;
        const nome = (o.material && o.material.name) || '';
        if (/neon/.test(nome)) { o.visible = false; return; }
        const chave = /blue/.test(nome) ? 'blue' : /orange/.test(nome) ? 'orange' : /dark/.test(nome) ? 'dark'
            : /borda/.test(nome) ? 'borda' : /entalhe/.test(nome) ? 'entalhe' : 'base';
        o.material = multiplicar(tintas[chave]);
    });
    silhueta.add(sil);
}

// compila os shaders sem travar a página (o vidro físico é pesado de compilar, principalmente no Safari),
// desenha o primeiro quadro e só então mostra o canvas por cima da foto
async function preparar() {
    ajustar();
    try { await renderer.compileAsync(cena, camera); await renderer.compileAsync(cenaSilhueta, camLuz); } catch (e) { /* compila no 1º quadro */ }
    desenhar();
    requestAnimationFrame(() => { canvas.classList.add('pronto'); ligar(); });
}

// ---------- giro: o busto gira (não a câmera), então luz, sombra e reflexo respondem de verdade ----------
const reduzido = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
let angulo = THREE.MathUtils.degToRad(-35), arrastando = false, xAnt = 0, tAnt = 0, ultimo = performance.now();
const vAuto = reduzido ? 0 : THREE.MathUtils.degToRad(P.giro);
let velocidade = vAuto;   // rad/s
canvas.addEventListener('pointerdown', (e) => { arrastando = true; xAnt = e.clientX; tAnt = performance.now(); canvas.setPointerCapture(e.pointerId); canvas.style.cursor = 'grabbing'; });
canvas.addEventListener('pointermove', (e) => {
    if (!arrastando) return;
    const agora = performance.now(), d = (e.clientX - xAnt) * 0.007, dt = Math.max(8, agora - tAnt) / 1000;
    angulo += d;
    velocidade = THREE.MathUtils.lerp(velocidade, THREE.MathUtils.clamp(d / dt, -3.5, 3.5), 0.5);
    xAnt = e.clientX; tAnt = agora;
});
const soltar = () => { if (!arrastando) return; arrastando = false; canvas.style.cursor = ''; if (performance.now() - tAnt > 90) velocidade = vAuto * 0.3; };
canvas.addEventListener('pointerup', soltar); canvas.addEventListener('pointercancel', soltar);

// ---------- enquadramento ----------
function ajustar() {
    const w = canvas.clientWidth, h = canvas.clientHeight;
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    const largo = w > 1024;
    camera.fov = largo ? 30 : 34;
    // no desktop o busto fica no terço direito; o texto ocupa a esquerda
    if (largo) camera.setViewOffset(w, h, -w * 0.21, 0, w, h); else camera.clearViewOffset();
    camera.updateProjectionMatrix();
}
new ResizeObserver(ajustar).observe(canvas);

let visivel = true, rodando = false;
function quadro(agora) {
    if (!visivel || document.hidden) { rodando = false; return; }
    const dt = Math.min(0.05, (agora - ultimo) / 1000); ultimo = agora;
    if (!arrastando) {
        velocidade += (vAuto - velocidade) * (1 - Math.exp(-dt * 2.6));
        angulo += velocidade * dt;
    }
    desenhar();
    if (reduzido && !arrastando && Math.abs(velocidade) < 1e-3) { rodando = false; return; }
    requestAnimationFrame(quadro);
}
function desenhar() {
    busto.rotation.y = angulo;
    silhueta.rotation.y = angulo;
    // 1) silhueta vista pela luz  2) vira mapa de luz com cáusticas  3) cena final
    renderer.setRenderTarget(rtTinta);
    renderer.setClearColor(0xffffff, 1); renderer.clear();
    renderer.render(cenaSilhueta, camLuz);
    renderer.setClearColor(corFundo, 1);   // o espelho do piso enxerga além da cúpula em ângulo rasante: lá tem que ser fundo, não branco
    quad.material.uniforms.angulo.value = -angulo;
    renderer.setRenderTarget(rtLuz);
    renderer.render(cenaQuad, camQuad);
    renderer.setRenderTarget(null);
    U.uLuzMat.value.multiplyMatrices(camLuz.projectionMatrix, camLuz.matrixWorldInverse);
    U.uAngulo.value = angulo;
    renderer.render(cena, camera);
}
function ligar() { if (!rodando && canvas.classList.contains('pronto')) { rodando = true; ultimo = performance.now(); requestAnimationFrame(quadro); } }
new IntersectionObserver(([e]) => { visivel = e.isIntersecting; if (visivel) ligar(); }).observe(canvas);
document.addEventListener('visibilitychange', () => { if (!document.hidden) ligar(); });
canvas.addEventListener('pointerdown', ligar);
// se o navegador derrubar o WebGL (falta de memória de vídeo, muitas abas com 3D), a foto volta a aparecer
// e a cena volta sozinha quando o contexto for restaurado
canvas.addEventListener('webglcontextlost', () => canvas.classList.remove('pronto'));
canvas.addEventListener('webglcontextrestored', () => { montarAmbiente(); if (busto.children.length) requestAnimationFrame(() => { desenhar(); canvas.classList.add('pronto'); ligar(); }); });
