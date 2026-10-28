// Gera o busto de vidro "cristal" a partir do modelo original (assets/modelo_ecg_vidro.glb).
// A forma da logo é a original; o script só troca materiais e mexe na base.
//
//   --base=redonda   só a base redonda original, cristalina, com o verde do float nas laterais (padrão)
//   --base=chapa     sem a base redonda: as letras apoiadas direto numa chapa de vidro float
//   --altura-base=0.75   altura da base redonda em relação à original (o topo fica no lugar)
//   --lapidar[=1.1]  refaz a base redonda lapidada: mesmo contorno, laterais retas e chanfro polido (bisotê) nas arestas
//   --neon           miolo luminoso dentro das letras, nas cores da logo (neon em vidro)
//   --gravar=TEXTO --fonte=arquivo.woff   texto jateado na lateral da base redonda, frente e verso
//
// Uso (num diretório com as dependências):
//   npm i @gltf-transform/core@4.1.1 @gltf-transform/extensions@4.1.1 @gltf-transform/functions@4.1.1 three@0.183.0 opentype.js@1.3.4
//   node gerar-modelo-cristal.mjs assets/modelo_ecg_vidro.glb assets/modelo_ecg_cristal.glb --base=redonda --neon \
//        --gravar=Sistemas --fonte=inter-latin-600-normal.woff   (Inter SemiBold, @fontsource/inter, licença OFL)
import { NodeIO } from '@gltf-transform/core';
import {
  ALL_EXTENSIONS, KHRMaterialsTransmission, KHRMaterialsVolume, KHRMaterialsIOR,
  KHRMaterialsSpecular, KHRMaterialsClearcoat, KHRMaterialsEmissiveStrength
} from '@gltf-transform/extensions';
import { prune, dedup, weld, quantize } from '@gltf-transform/functions';
import * as THREE from 'three';
import { toCreasedNormals } from 'three/examples/jsm/utils/BufferGeometryUtils.js';
import opentype from 'opentype.js';
import fs from 'fs';

const args = process.argv.slice(2);
const [src, dst] = args.filter(a => !a.startsWith('--'));
const opcao = (nome, padrao) => (args.find(a => a.startsWith(`--${nome}=`)) || `=${padrao}`).split('=')[1];
const BASE = opcao('base', 'redonda');
const NEON = args.includes('--neon');
const ALTURA_BASE = parseFloat(opcao('altura-base', '1'));
const GRAVAR = opcao('gravar', '');
const LAPIDAR = args.some(a => a === '--lapidar' || a.startsWith('--lapidar=')) ? parseFloat(opcao('lapidar', '1.1')) || 1.1 : 0;
const FONTE = opcao('fonte', '');

const io = new NodeIO().registerExtensions(ALL_EXTENSIONS);
const doc = await io.read(src);
const root = doc.getRoot();
const buf = root.listBuffers()[0];
const tx = doc.createExtension(KHRMaterialsTransmission);
const vol = doc.createExtension(KHRMaterialsVolume);
const iorX = doc.createExtension(KHRMaterialsIOR);
const spec = doc.createExtension(KHRMaterialsSpecular);
const cc = doc.createExtension(KHRMaterialsClearcoat);
const brilho = doc.createExtension(KHRMaterialsEmissiveStrength);
const linear = h => [1, 3, 5].map(i => { const c = parseInt(h.slice(i, i + 2), 16) / 255; return c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4; });

function vidro(mat, { cor = '#ffffff', rugo = 0.0, trans = 1, ior = 1.5, espessura = 1, tinta = '#ffffff', dist = Infinity, verniz = 0 }) {
  mat.setBaseColorFactor([...linear(cor), 1]).setRoughnessFactor(rugo).setMetallicFactor(0)
     .setBaseColorTexture(null).setMetallicRoughnessTexture(null).setNormalTexture(null).setAlphaMode('OPAQUE');
  mat.setExtension('KHR_materials_transmission', tx.createTransmission().setTransmissionFactor(trans));
  mat.setExtension('KHR_materials_ior', iorX.createIOR().setIOR(ior));
  mat.setExtension('KHR_materials_volume', vol.createVolume().setThicknessFactor(espessura).setAttenuationColor(linear(tinta)).setAttenuationDistance(dist));
  mat.setExtension('KHR_materials_specular', spec.createSpecular().setSpecularFactor(1).setSpecularColorFactor([1, 1, 1]));
  mat.setExtension('KHR_materials_clearcoat', verniz ? cc.createClearcoat().setClearcoatFactor(verniz).setClearcoatRoughnessFactor(0.0) : null);
  return mat;
}
function luz(nome, cor, forca) {
  const m = doc.createMaterial(nome).setBaseColorFactor([0, 0, 0, 1]).setEmissiveFactor(linear(cor)).setRoughnessFactor(1).setMetallicFactor(0);
  m.setExtension('KHR_materials_emissive_strength', brilho.createEmissiveStrength().setEmissiveStrength(forca));
  return m;
}
const M = n => root.listMaterials().find(m => m.getName() === n);
const N = n => root.listNodes().find(x => x.getName() === n);
const pai = root.listNodes().find(n => n.listChildren().includes(N('base_glass')));

// Letras: vidro polido com verniz (clearcoat); com neon ficam mais transparentes para mostrar o miolo
const tr = NEON ? 0.82 : 0.75;
vidro(M('blue_matte'),   { cor: '#2a7ad6', trans: tr, ior: 1.52, espessura: 3, tinta: '#4d93e6', dist: 6, verniz: 1 });
vidro(M('orange_matte'), { cor: '#f7a531', trans: tr, ior: 1.52, espessura: 3, tinta: '#ffc061', dist: 6, verniz: 1 });
vidro(M('dark_matte'),   { cor: '#2a4a7a', trans: NEON ? 0.85 : 0.7, ior: 1.52, espessura: 3, tinta: '#3a5f99', dist: NEON ? 7 : 4, verniz: 1 });

// ---------- entalhe: "Sistemas" como cavidade logo abaixo da superfície da base, frente e verso ----------
// A base fica intacta (superfície lisa). A cavidade é o "buraco" do corte visto por dentro:
// paredes e fundo jateados, com as faces voltadas para quem olha.
function cavidade(pos, nor) {
  // contorno da base visto de cima: para cada x, o z mais à frente e o mais atrás (interpolado).
  // Só vértices da lateral (normal horizontal): na base lapidada, os do chanfro e da tampa ficam recuados e
  // fariam o contorno "saltar" (as letras sairiam quebradas)
  const mapas = { 1: new Map(), [-1]: new Map() };
  for (let i = 0; i < pos.length; i += 3) {
    if (Math.abs(nor[i + 1]) > 0.3) continue;
    const [x, z] = [pos[i], pos[i + 2]], k = Math.round(x * 2) / 2, m = mapas[z > 0 ? 1 : -1];
    m.set(k, z > 0 ? Math.max(m.get(k) ?? -1e9, z) : Math.min(m.get(k) ?? 1e9, z));
  }
  const pontos = { 1: [...mapas[1].entries()].sort((a, b) => a[0] - b[0]), [-1]: [...mapas[-1].entries()].sort((a, b) => a[0] - b[0]) };
  const perfil = (lado, x) => {
    const pts = pontos[lado]; const i = pts.findIndex(p => p[0] >= x);
    if (i <= 0) return pts[Math.max(i, 0)][1];
    const [x0, z0] = pts[i - 1], [x1, z1] = pts[i];
    return z0 + (z1 - z0) * (x - x0) / (x1 - x0);
  };
  const fonte = opentype.parse(new Uint8Array(fs.readFileSync(FONTE)).buffer);
  const ALTURA = 4.4;                                         // altura das maiúsculas (unidades do modelo)
  const tam = ALTURA / (fonte.tables.os2.sCapHeight / fonte.unitsPerEm);
  const sp = new THREE.ShapePath();
  for (const c of fonte.getPath(GRAVAR, 0, 0, tam).commands) {
    if (c.type === 'M') sp.moveTo(c.x, -c.y);
    else if (c.type === 'L') sp.lineTo(c.x, -c.y);
    else if (c.type === 'Q') sp.quadraticCurveTo(c.x1, -c.y1, c.x, -c.y);
    else if (c.type === 'C') sp.bezierCurveTo(c.x1, -c.y1, c.x2, -c.y2, c.x, -c.y);
  }
  const PROF = 0.45, RASO = 0.035;                            // ~1,3 mm de corte; a boca fica rente à superfície
  const solido = new THREE.ExtrudeGeometry(sp.toShapes(false), { depth: PROF, curveSegments: 8, bevelEnabled: false });
  solido.computeBoundingBox();
  const bb = solido.boundingBox, cx = (bb.min.x + bb.max.x) / 2, cy = (bb.min.y + bb.max.y) / 2;
  let ymin = 1e9, ymax = -1e9; for (let i = 1; i < pos.length; i += 3) { ymin = Math.min(ymin, pos[i]); ymax = Math.max(ymax, pos[i]); }
  const Y_CENTRO = (ymin + ymax) / 2 - 0.4;                   // meio da lateral (um pouco abaixo, pela borda arredondada do topo)
  const saida = { pos: [], nor: [] };
  for (const lado of [1, -1]) {
    const g = solido.clone().toNonIndexed(); g.deleteAttribute('uv'); g.deleteAttribute('normal');
    const p = g.getAttribute('position');
    for (let i = 0; i < p.count; i++) {
      const xt = p.getX(i) - cx, y = p.getY(i) - cy + Y_CENTRO, zl = p.getZ(i);
      const x = lado > 0 ? xt : -xt;                          // verso espelhado para ler de trás
      const z = perfil(lado, x), dz = perfil(lado, x + 0.5) - perfil(lado, x - 0.5);
      const n = new THREE.Vector3(-dz * lado, 0, lado).normalize();
      const d = zl - PROF - RASO;                             // de -PROF-RASO (fundo) até -RASO (boca)
      p.setXYZ(i, x + n.x * d, y, z + n.z * d);
    }
    // vira as faces para dentro: de fora vê-se o interior da cavidade (paredes e fundo), não uma "tampa"
    const a = p.array;
    for (let t = 0; t < a.length; t += 9) for (let k = 0; k < 3; k++) [a[t + 3 + k], a[t + 6 + k]] = [a[t + 6 + k], a[t + 3 + k]];
    const liso = toCreasedNormals(g, THREE.MathUtils.degToRad(40));
    // a tampa (boca) sai: só paredes e fundo
    const lp = liso.getAttribute('position').array, ln = liso.getAttribute('normal').array;
    for (let t = 0; t < lp.length; t += 9) {
      const centro = new THREE.Vector3(lp[t] + lp[t + 3] + lp[t + 6], lp[t + 1] + lp[t + 4] + lp[t + 7], lp[t + 2] + lp[t + 5] + lp[t + 8]).divideScalar(3);
      const zc = perfil(lado, centro.x);
      if (Math.abs(Math.abs(centro.z - zc) - RASO) < 0.004 && Math.abs(ln[t + 1]) < 0.9) {
        const nz = ln[t + 2] * lado; if (nz < -0.9) continue;   // face da boca (normal para dentro após virar)
      }
      for (let k = 0; k < 9; k++) { saida.pos.push(lp[t + k]); saida.nor.push(ln[t + k]); }
    }
  }
  return { pos: new Float32Array(saida.pos), nor: new Float32Array(saida.nor) };
}

// ---------- base ----------
function lado(nx, ny, nz) { return Math.abs(ny) < (LAPIDAR ? 0.95 : 0.55); } // lateral (normal quase horizontal); na base lapidada, o chanfro também
if (BASE === 'redonda') {
  const malha = N('base_glass').getMesh();
  const p0 = malha.listPrimitives()[0];
  let pos = p0.getAttribute('POSITION').getArray(), nor = p0.getAttribute('NORMAL').getArray();
  if (ALTURA_BASE !== 1) {
    // rebaixa a base mantendo o topo (onde as letras se apoiam); normais corrigidas para a nova proporção
    let topo = -1e9; for (let i = 1; i < pos.length; i += 3) topo = Math.max(topo, pos[i]);
    for (let i = 0; i < pos.length; i += 3) {
      pos[i + 1] = topo - (topo - pos[i + 1]) * ALTURA_BASE;
      const n = new THREE.Vector3(nor[i], nor[i + 1] / ALTURA_BASE, nor[i + 2]).normalize();
      nor[i] = n.x; nor[i + 1] = n.y; nor[i + 2] = n.z;
    }
    p0.getAttribute('POSITION').setArray(pos); p0.getAttribute('NORMAL').setArray(nor);
  }
  if (LAPIDAR) {
    // base lapidada: o mesmo contorno visto de cima, laterais retas e um chanfro reto polido (bisotê) nas arestas
    // de cima e de baixo. Sem ele a aresta viva some no vidro transparente; o chanfro pega a luz e desenha os limites.
    let ymin = 1e9, ymax = -1e9;
    for (let i = 1; i < pos.length; i += 3) { ymin = Math.min(ymin, pos[i]); ymax = Math.max(ymax, pos[i]); }
    const topo = [];
    for (let i = 0; i < pos.length; i += 3) if (pos[i + 1] > ymax - 0.05) topo.push([pos[i], pos[i + 2]]);
    // contorno = envoltória convexa dos vértices do topo (a base é uma elipse; ignora vértices internos da tampa)
    const ord = [...topo].sort((a, b) => a[0] - b[0] || a[1] - b[1]);
    const cruz = (o, a, b) => (a[0] - o[0]) * (b[1] - o[1]) - (a[1] - o[1]) * (b[0] - o[0]);
    const baixo = [], cima = [];
    for (const p of ord) { while (baixo.length >= 2 && cruz(baixo[baixo.length - 2], baixo[baixo.length - 1], p) <= 0) baixo.pop(); baixo.push(p); }
    for (const p of [...ord].reverse()) { while (cima.length >= 2 && cruz(cima[cima.length - 2], cima[cima.length - 1], p) <= 0) cima.pop(); cima.push(p); }
    const contorno = baixo.slice(0, -1).concat(cima.slice(0, -1));
    const forma = new THREE.Shape(contorno.map(([x, z]) => new THREE.Vector2(x, -z)));
    const C = LAPIDAR;
    const g = new THREE.ExtrudeGeometry(forma, { depth: ymax - ymin - 2 * C, bevelEnabled: true, bevelThickness: C, bevelSize: C, bevelOffset: -C, bevelSegments: 1, curveSegments: 4 });
    g.rotateX(-Math.PI / 2); g.translate(0, ymin + C, 0);
    g.deleteAttribute('uv');
    const lisa = toCreasedNormals(g, THREE.MathUtils.degToRad(30));   // laterais lisas, quinas do chanfro vivas
    pos = lisa.getAttribute('position').array; nor = lisa.getAttribute('normal').array;
    for (const sem of p0.listSemantics()) if (sem !== 'POSITION' && sem !== 'NORMAL') p0.setAttribute(sem, null);
    p0.getAttribute('POSITION').setArray(new Float32Array(pos)); p0.getAttribute('NORMAL').setArray(new Float32Array(nor));
    p0.setIndices(null);
    console.log('base lapidada: contorno com', contorno.length, 'pontos, chanfro', C);
  }
  const idx = p0.getIndices() ? p0.getIndices().getArray() : Uint32Array.from({ length: pos.length / 3 }, (_, i) => i);
  // topo/fundo cristalinos; laterais com o verde da espessura do float
  const faces = { topo: [], lado: [] };
  for (let t = 0; t < idx.length; t += 3) {
    const [a, b, c] = [idx[t], idx[t + 1], idx[t + 2]];
    const ny = (nor[a * 3 + 1] + nor[b * 3 + 1] + nor[c * 3 + 1]) / 3;
    (lado(0, ny, 0) ? faces.lado : faces.topo).push(a, b, c);
  }
  // espessura baixa no material: no motor em tempo real, valores altos deslocam demais o que se vê através do vidro
  const face = vidro(M('base_matte'), { ior: 1.5, espessura: 1, tinta: '#e6f6f2', dist: 120 });
  const borda = vidro(doc.createMaterial('base_borda'), { cor: '#eef8f5', ior: 1.52, espessura: 1, tinta: '#a9dccf', dist: 6 });
  const novo = (lista, mat) => {
    const pr = doc.createPrimitive().setMaterial(mat);
    for (const sem of p0.listSemantics()) if (sem !== 'TEXCOORD_0') pr.setAttribute(sem, p0.getAttribute(sem));
    return pr.setIndices(doc.createAccessor().setType('SCALAR').setArray(new Uint32Array(lista)).setBuffer(buf));
  };
  malha.removePrimitive(p0);
  malha.addPrimitive(novo(faces.topo, face)).addPrimitive(novo(faces.lado, borda));
  if (GRAVAR) {
    const cav = cavidade(pos, nor);
    const jateado = doc.createMaterial('entalhe_jateado').setBaseColorFactor([...linear('#e6ebf0'), 1]).setRoughnessFactor(0.9).setMetallicFactor(0);
    malha.addPrimitive(doc.createPrimitive().setMaterial(jateado)
      .setAttribute('POSITION', doc.createAccessor().setType('VEC3').setArray(cav.pos).setBuffer(buf))
      .setAttribute('NORMAL', doc.createAccessor().setType('VEC3').setArray(cav.nor).setBuffer(buf)));
    console.log('entalhe: triângulos da cavidade', cav.pos.length / 9);
  }
} else {
  // só a chapa: a base redonda sai e as letras pousam direto na chapa
  N('base_glass').dispose();
  const [x0, x1, y0, y1, z0, z1] = [-60, 60, -4.6, 0.65, -22, 22];
  const caixa = (faces, mat) => {
    const pos = [], nor = [], idx = [];
    for (const f of faces) { const b = pos.length / 3; f.v.forEach(v => { pos.push(...v); nor.push(...f.n); }); idx.push(b, b + 1, b + 2, b, b + 2, b + 3); }
    return doc.createPrimitive().setMaterial(mat)
      .setAttribute('POSITION', doc.createAccessor().setType('VEC3').setArray(new Float32Array(pos)).setBuffer(buf))
      .setAttribute('NORMAL', doc.createAccessor().setType('VEC3').setArray(new Float32Array(nor)).setBuffer(buf))
      .setIndices(doc.createAccessor().setType('SCALAR').setArray(new Uint16Array(idx)).setBuffer(buf));
  };
  const F = {
    topo: { n: [0, 1, 0], v: [[x0, y1, z1], [x1, y1, z1], [x1, y1, z0], [x0, y1, z0]] },
    fundo: { n: [0, -1, 0], v: [[x0, y0, z0], [x1, y0, z0], [x1, y0, z1], [x0, y0, z1]] },
    frente: { n: [0, 0, 1], v: [[x0, y0, z1], [x1, y0, z1], [x1, y1, z1], [x0, y1, z1]] },
    tras: { n: [0, 0, -1], v: [[x1, y0, z0], [x0, y0, z0], [x0, y1, z0], [x1, y1, z0]] },
    dir: { n: [1, 0, 0], v: [[x1, y0, z1], [x1, y0, z0], [x1, y1, z0], [x1, y1, z1]] },
    esq: { n: [-1, 0, 0], v: [[x0, y0, z0], [x0, y0, z1], [x0, y1, z1], [x0, y1, z0]] }
  };
  const face = vidro(doc.createMaterial('chapa_face'), { ior: 1.52, espessura: 5, tinta: '#e6f6f2', dist: 80 });
  const borda = vidro(doc.createMaterial('chapa_borda'), { cor: '#cfeee6', ior: 1.52, espessura: 5, tinta: '#4fae9b', dist: 6 });
  const malha = doc.createMesh('chapa').addPrimitive(caixa([F.topo, F.fundo], face)).addPrimitive(caixa([F.frente, F.tras, F.dir, F.esq], borda));
  pai.addChild(doc.createNode('chapa').setMesh(malha));
}

// ---------- neon: miolo luminoso dentro de cada letra ----------
if (NEON) {
  const RECUO = 1.15; // quanto o miolo fica para dentro da superfície do vidro (unidades do modelo)
  const nucleos = { e_blue: luz('neon_azul', '#2f8cff', 3), e_orange: luz('neon_ambar', '#ffa620', 3), cg_dark: luz('neon_branco', '#cfe0ff', 2.2) };
  for (const [nome, mat] of Object.entries(nucleos)) {
    const no = N(nome); if (!no) continue;
    const malha = doc.createMesh(nome + '_neon');
    for (const p of no.getMesh().listPrimitives()) {
      const pos = p.getAttribute('POSITION').getArray(), nor = p.getAttribute('NORMAL').getArray();
      const dentro = new Float32Array(pos.length);
      for (let i = 0; i < pos.length; i++) dentro[i] = pos[i] - nor[i] * RECUO;
      const pr = doc.createPrimitive().setMaterial(mat)
        .setAttribute('POSITION', doc.createAccessor().setType('VEC3').setArray(dentro).setBuffer(buf))
        .setAttribute('NORMAL', p.getAttribute('NORMAL'));
      if (p.getIndices()) pr.setIndices(p.getIndices());
      malha.addPrimitive(pr);
    }
    const filho = doc.createNode(nome + '_neon').setMesh(malha)
      .setTranslation(no.getTranslation()).setRotation(no.getRotation()).setScale(no.getScale());
    pai.addChild(filho);
  }
}

await doc.transform(weld(), prune(), dedup(), quantize({ quantizeNormal: 16 }));
await io.write(dst, doc);
console.log('gerado:', dst, '| base:', BASE, '| neon:', NEON);
