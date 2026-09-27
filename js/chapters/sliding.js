// Chapter 3: from a whole muscle down to the molecules that pull. A zoom runs through six levels,
// each about five times closer than the last (the real steps are bigger; see the readout for true
// sizes): muscle → fascicle → fibre → myofibril → sarcomere → actin and myosin.
// The sarcomere and the cross-bridge close-up are live: a nerve signal releases calcium from the
// sarcoplasmic reticulum (SR), calcium moves tropomyosin off actin's binding sites, and myosin
// heads cycle, one ATP per stroke, sliding the thin filaments towards the middle.
// Sources:
//  - Huxley & Niedergerke, Nature 173:971, and Huxley & Hanson, Nature 173:973 (both 22 May
//    1954): the bands keep their A-band width while the I band and H zone shrink, so the filaments
//    slide rather than shorten.
//  - Filament lengths and the length–tension curve: see SARC in muscle.js (Gordon, Huxley &
//    Julian 1966; Guyton & Hall 14th ed. ch. 6).
//  - Sizes (OpenStax Anatomy & Physiology 2e, 10.2; Guyton & Hall ch. 6): fascicle up to about
//    1 mm across; fibre about 10–100 µm across and up to many centimetres long; myofibril about
//    1–2 µm across; thick filament about 15 nm wide; thin filament about 7 nm wide.
//  - Actin helix: about 2.75 nm rise and −166° per subunit, 13 subunits in 6 turns (about 36 nm);
//    troponin–tropomyosin every 7 subunits (about 38.5 nm) (Alberts, Molecular Biology of the Cell,
//    6th ed., ch. 16).
//  - Cross-bridge cycle (Lymn & Taylor, Biochemistry 10:4617, 1971; Rayment et al., Science
//    261:58, 1993): ATP binding releases the head from actin; ATP → ADP + Pi re-cocks it; the head
//    binds, releases Pi and swings its lever (the power stroke, about 5–10 nm); ADP leaves, and the
//    head stays locked until the next ATP. With no ATP heads stay locked: rigor mortis.
//  - Real sarcomeres shorten at a few µm per second (about 2–6 sarcomere lengths per second in
//    human fibres; Bottinelli et al., J Physiol 495:573, 1996); the model runs slower so you can
//    see it.
import { THREE, M, clamp, lerp, smooth, canvasTexture } from '../kit.js';
import { SARC, tension, XB, stripeTexture, spindleGeo, aim, board, panel, rrect, tint, fitNarrow, compactReadout, inReel, rnd } from '../muscle.js';

const LEVELS = [
  { name: 'Muscle', size: 'a biceps, about 30 cm long' },
  { name: 'Fascicle', size: 'a bundle of fibres, up to about 1 mm across' },
  { name: 'Fibre', size: 'one muscle cell, about 0.05 mm across' },
  { name: 'Myofibril', size: 'about 1–2 µm across, a chain of sarcomeres' },
  { name: 'Sarcomere', size: 'one unit, about 2–2.5 µm long' },
  { name: 'Actin and myosin', size: 'filaments 7–15 nm wide' },
];
const STEP = 5;               // each level is shown 5× closer than the last
const U = 3;                  // sarcomere level: model units per µm
const C = [-0.6, 2.5, 0];     // where every level is centred

function drawLT(g, w, h, st) {
  panel(g, w, h);
  const L0 = 90, R0 = w - 36, T0 = 90, B0 = h - 76, x = (L) => L0 + ((L - 1.2) / (3.9 - 1.2)) * (R0 - L0), y = (f) => B0 - f * (B0 - T0);
  g.fillStyle = '#e8eef8'; g.font = 'bold 30px sans-serif'; g.fillText('Force vs sarcomere length', 36, 50);
  g.strokeStyle = 'rgba(255,255,255,.18)'; g.beginPath(); g.moveTo(L0, T0 - 10); g.lineTo(L0, B0); g.lineTo(R0, B0); g.stroke();
  g.fillStyle = 'rgba(255,255,255,.55)'; g.font = '22px sans-serif';
  [1.5, 2.0, 2.5, 3.0, 3.5].forEach((L) => g.fillText(L.toFixed(1), x(L) - 16, B0 + 30));
  g.fillText('µm', R0 - 30, B0 + 58); g.fillText('100%', 18, y(1) + 8); g.fillText('0', 60, B0 + 6);
  g.fillStyle = 'rgba(110,231,168,.12)'; g.fillRect(x(2.0), T0 - 10, x(2.25) - x(2.0), B0 - T0 + 10);
  g.strokeStyle = '#ffd166'; g.lineWidth = 5; g.beginPath();
  for (let L = 1.2; L <= 3.9; L += 0.01) { const X = x(L), Y = y(tension(L)); L === 1.2 ? g.moveTo(X, Y) : g.lineTo(X, Y); }
  g.stroke(); g.lineWidth = 1;
  g.fillStyle = '#6ee7a8'; g.font = '21px sans-serif'; g.fillText('best overlap', x(2.0) - 8, T0 - 16);
  g.fillStyle = 'rgba(255,255,255,.6)'; g.fillText('too squashed', x(1.28), y(0.35)); g.fillText('too stretched: little overlap', x(2.62), y(0.72));
  // current point
  g.fillStyle = '#ffffff'; g.beginPath(); g.arc(x(st.L), y(tension(st.L)), 9, 0, 7); g.fill();
  g.strokeStyle = '#8ef0ff'; g.lineWidth = 3; g.beginPath(); g.arc(x(st.L), y(st.f), 14, 0, 7); g.stroke(); g.lineWidth = 1;
  g.fillStyle = '#8ef0ff'; g.font = 'bold 24px sans-serif';
  const s = `${st.L.toFixed(2)} µm · ${Math.round(st.f * 100)}% force`; g.fillText(s, R0 - g.measureText(s).width, 50);
}

export default {
  id: 'sliding',
  short: 'Sliding filaments',
  title: 'Millions of tiny tugs',
  subtitle: 'Zoom from a muscle to the molecules that pull, and watch them slide.',
  view: { pos: [2.4, 3.9, 15.5], target: [2.0, 3.3, 0] },
  learn: `<p>A muscle is bundles inside bundles. The muscle is made of <b>fascicles</b>; each fascicle is a bundle of <b>fibres</b>, and each fibre is one long cell. Inside a fibre run hundreds of <b>myofibrils</b>, and each myofibril is a chain of tiny units about <b>2.5 µm</b> long, called <b>sarcomeres</b>. They make the stripes.</p>
    <p>A sarcomere runs from one <b>Z-disc</b> to the next. Thin filaments of <b>actin</b> reach in from each Z-disc, and thick filaments of <b>myosin</b> sit in the middle, bristling with little <b>heads</b>. When a nerve signal arrives (see <a href="/nervousclear/#synapse">NervousClear</a>), the <b>sarcoplasmic reticulum</b> around each myofibril releases <b>calcium</b>. Calcium moves a guard protein, <b>tropomyosin</b>, off actin, and the myosin heads grab on.</p>
    <p>Each head then pulls in a <b>cross-bridge cycle</b>: grab, swing (the <b>power stroke</b>, about 8 nm), let go, re-cock. Letting go needs one molecule of <b>ATP</b>, the cell's energy coin. Millions of heads tugging out of step slide the actin towards the middle, so the sarcomere shortens from about <b>2.5 to 2.0 µm</b>. Nothing gets shorter itself: the filaments slide past each other. That idea, the <b>sliding filament theory</b>, was published in 1954 in two papers side by side.</p>
    <p>A sarcomere pulls hardest at about <b>2.0–2.25 µm</b>, where every head can reach actin. Stretch it too far and the filaments barely overlap; squash it and they crowd each other. With no ATP at all, the heads cannot let go and the muscle locks: that is <b>rigor mortis</b>. WorkClear's <a href="/workclear/#limits">tired-muscle scene</a> shows why even holding still costs energy.</p>
    <p class="tip"><b>Try it:</b> slide the zoom all the way in. Send a nerve signal and watch the I bands shrink while the dark A band stays the same. Then drag the starting length and see where the force is biggest, and switch off ATP.</p>`,
  terms: [
    { t: 'Sarcomere', d: 'The repeating unit of a myofibril, from one Z-disc to the next: about 2–2.5 µm.' },
    { t: 'Actin', d: 'The thin filament, anchored at the Z-disc, that myosin pulls on.' },
    { t: 'Myosin', d: 'The thick filament; its heads grab actin and swing, using ATP.' },
    { t: 'Cross-bridge cycle', d: 'Grab, pull, release, re-cock: one ATP per cycle for each myosin head.' },
    { t: 'Sarcoplasmic reticulum', d: 'A sleeve of tubes round each myofibril that stores calcium and releases it on a signal.' },
    { t: 'Tropomyosin', d: 'A strand along actin that covers the binding sites until calcium moves it.' },
    { t: 'Sliding filament theory', d: 'Muscles shorten because actin and myosin slide past each other, not because they shrink.' },
  ],
  defaults: { zoom: 4, L0: 2.5, stim: false, auto: true, atp: true, labels: true },
  controls: [
    { key: 'zoom', type: 'range', label: 'Zoom in', min: 0, max: 5, step: 0.01, ends: ['muscle', 'molecules'], fmt: (v) => LEVELS[Math.round(v)].name },
    { key: 'go', type: 'buttons', label: 'Nerve signal', items: [{ label: 'Send a signal', act: (s, inst) => inst.pulse?.() }] },
    { key: 'auto', type: 'toggle', label: 'Keep signalling (on 2 s, off 2 s)' },
    { key: 'L0', type: 'range', label: 'Starting sarcomere length', min: 1.7, max: 3.6, step: 0.01, ends: ['1.7 µm', '3.6 µm'], fmt: (v) => v.toFixed(2) + ' µm' },
    { key: 'atp', type: 'toggle', label: 'ATP available', hint: 'Switch it off to see rigor: heads stuck on actin.' },
    { key: 'labels', type: 'toggle', label: 'Labels' },
  ],
  quiz: [
    { q: 'When a muscle contracts, what happens to the actin and myosin filaments?', options: ['They both get shorter', 'They slide past each other', 'They melt together', 'They grow longer'], answer: 1, why: 'The filaments keep their length. Myosin heads pull the actin towards the middle, so the sarcomere shortens.' },
    { q: 'What does calcium do in a muscle fibre?', options: ['Makes the bones stronger', 'Moves tropomyosin so myosin heads can grab actin', 'Carries oxygen', 'Breaks down ATP'], answer: 1, why: 'Calcium from the sarcoplasmic reticulum binds troponin, which pulls tropomyosin off the binding sites on actin.' },
    { q: 'Why does the body stiffen after death (rigor mortis)?', options: ['Too much calcium and no ATP, so myosin heads cannot let go', 'The bones fuse', 'The blood freezes', 'Nerves keep firing'], answer: 0, why: 'A myosin head needs a fresh ATP to release actin. Without ATP the heads stay locked on.' },
  ],
  reel: [
    { ms: 5600, caption: 'Zoom into a muscle: bundles of fibres, each packed with myofibrils made of tiny sarcomeres.', set: { zoom: 0, L0: 2.5, stim: false, auto: true, atp: true, labels: false }, anim: { zoom: [0, 4] }, view: { pos: [0.2, 3.2, 13], target: [-0.3, 2.9, 0] }, spin: 0 },
    { ms: 5600, caption: 'Myosin heads grab actin and pull, one ATP per stroke, so each sarcomere shortens from 2.5 to 2.0 µm.', set: { zoom: 4, L0: 2.5, stim: false, auto: true, atp: true, labels: false }, anim: { zoom: [4, 5] }, view: { pos: [0.0, 3.0, 12.5], target: [-0.4, 2.7, 0] }, spin: 0 },
  ],

  build({ stage }) {
    const root = new THREE.Group(); stage.root.add(root);
    const levels = LEVELS.map(() => { const g = new THREE.Group(); g.position.set(...C); root.add(g); return g; });
    const Lb = (lvl, h, p, c) => { const l = tint(stage.label(h, p, levels[lvl]), c); l.userData.lvl = lvl; return l; };
    const labs = [];
    const std = (o) => new THREE.MeshStandardMaterial({ roughness: 0.5, transparent: true, ...o });
    const muscleRed = () => std({ color: 0xc8404c, emissive: 0x4a0e14, emissiveIntensity: 0.3 });
    const tendonMat = std({ color: 0xf1ead8, emissive: 0x3a3428, emissiveIntensity: 0.3 });

    // ---- level 0: a whole muscle, fascicles showing through its sheath, tendons at each end
    {
      const g = levels[0];
      const sheath = aim(new THREE.Mesh(spindleGeo(), std({ color: 0xe0a0a8, opacity: 0.22, depthWrite: false, side: THREE.DoubleSide })), [-4, 0, 0], [4, 0, 0], 1.35, [0, 0, 1], 1); g.add(sheath);
      const fmat = muscleRed(), hot = std({ color: 0xff7a86, emissive: 0x802030, emissiveIntensity: 0.6 });
      [[0, 0], ...Array.from({ length: 6 }, (_, i) => [0.62 * Math.cos(i * 1.047), 0.62 * Math.sin(i * 1.047)]), ...Array.from({ length: 6 }, (_, i) => [0.95 * Math.cos(i * 1.047 + 0.52), 0.95 * Math.sin(i * 1.047 + 0.52)])]
        .forEach(([y, z], i) => g.add(aim(new THREE.Mesh(spindleGeo(), i ? fmat : hot), [-3.7, y * 0.6, z * 0.6], [3.7, y * 0.6, z * 0.6], 0.3 * (1 - 0.2 * Math.hypot(y, z)), [0, 0, 1], 1)));
      g.add(new THREE.Mesh(new THREE.CapsuleGeometry(0.16, 1.4, 6, 12), tendonMat).rotateZ(Math.PI / 2).translateY(4.4));
      g.add(new THREE.Mesh(new THREE.CapsuleGeometry(0.16, 1.4, 6, 12), tendonMat).rotateZ(Math.PI / 2).translateY(-4.4));
      labs.push(Lb(0, 'Tendon', [-4.6, 0.7, 0], 'white'), Lb(0, 'Fascicles inside the sheath', [0.6, 1.8, 0.4], 'red'));
    }
    // ---- level 1: a fascicle, a bundle of 19 fibres with a capillary
    {
      const g = levels[1];
      const tex = stripeTexture(10); tex.center.set(0.5, 0.5); tex.rotation = Math.PI / 2; tex.repeat.set(1, 18);
      const fm = std({ map: tex, color: 0xffffff, emissive: 0x3a0a10, emissiveIntensity: 0.25 });
      const hot = std({ map: tex, color: 0xffffff, emissive: 0x802030, emissiveIntensity: 0.55 });
      const pts = [[0, 0]]; for (let r = 1; r <= 2; r++) for (let i = 0; i < 6 * r; i++) { const a = (i / (6 * r)) * Math.PI * 2; pts.push([r * 0.58 * Math.cos(a), r * 0.58 * Math.sin(a)]); }
      pts.forEach(([y, z], i) => { const m = new THREE.Mesh(new THREE.CylinderGeometry(0.27, 0.27, 8, 20), i ? fm : hot); m.rotation.z = Math.PI / 2; m.position.set(0, y, z); g.add(m); });
      const sh = new THREE.Mesh(new THREE.CylinderGeometry(1.5, 1.5, 8.1, 40, 1, true), std({ color: 0xf0d0d4, opacity: 0.16, depthWrite: false, side: THREE.DoubleSide })); sh.rotation.z = Math.PI / 2; g.add(sh);
      const cap = new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3([[-4, 1.1, 0.8], [-1.5, 0.95, 1.1], [1, 1.2, 0.7], [4, 0.9, 1.0]].map((p) => new THREE.Vector3(...p))), 60, 0.07, 8), std({ color: 0xff3b4a, emissive: 0xa01020, emissiveIntensity: 0.5 })); g.add(cap);
      labs.push(Lb(1, 'Muscle fibres (cells)', [2.6, 1.9, 0.4], 'red'), Lb(1, 'Capillary', [-3.2, 1.6, 1.0], 'red'));
    }
    // ---- level 2: one fibre, see-through, with myofibrils inside, nuclei and a nerve ending
    let fibreTex;
    {
      const g = levels[2];
      fibreTex = stripeTexture(10); fibreTex.center.set(0.5, 0.5); fibreTex.rotation = Math.PI / 2; fibreTex.repeat.set(1, 6);
      const skin = new THREE.Mesh(new THREE.CylinderGeometry(1.45, 1.45, 8, 48, 1, true), std({ map: fibreTex, color: 0xffffff, opacity: 0.35, depthWrite: false, side: THREE.DoubleSide, emissive: 0x3a0a10, emissiveIntensity: 0.2 }));
      skin.rotation.z = Math.PI / 2; g.add(skin);
      const mfm = std({ map: fibreTex, color: 0xffffff, emissive: 0x3a0a10, emissiveIntensity: 0.3 });
      const hot = std({ map: fibreTex, color: 0xffffff, emissive: 0x902838, emissiveIntensity: 0.6 });
      for (let i = 0; i < 34; i++) {
        const r = i ? 0.25 + 0.95 * Math.sqrt(rnd(i)) : 0, a = rnd(i + 50) * Math.PI * 2;
        const m = new THREE.Mesh(new THREE.CylinderGeometry(0.13, 0.13, 7.9, 10), i ? mfm : hot); m.rotation.z = Math.PI / 2; m.position.set(0, r * Math.cos(a), r * Math.sin(a)); g.add(m);
      }
      const nm = std({ color: 0x7a5cd0, emissive: 0x2a1860, emissiveIntensity: 0.5 });
      [[-2.6, 1.0], [0.4, 2.3], [2.9, 4.2]].forEach(([x, a]) => { const n = new THREE.Mesh(new THREE.SphereGeometry(1, 16, 10), nm); n.scale.set(0.55, 0.13, 0.22); n.position.set(x, 1.45 * Math.cos(a), 1.45 * Math.sin(a)); n.lookAt(n.position.clone().multiplyScalar(2)); g.add(n); });
      const nerve = new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3([[-1.6, 3.6, 0.4], [-1.0, 2.4, 0.3], [-0.6, 1.55, 0.2]].map((p) => new THREE.Vector3(...p))), 30, 0.09, 8), std({ color: 0xffd166, emissive: 0xffb547, emissiveIntensity: 0.6 }));
      const end = new THREE.Mesh(new THREE.SphereGeometry(0.28, 16, 10), std({ color: 0xffd166, emissive: 0xffb547, emissiveIntensity: 0.6 })); end.scale.set(1.3, 0.4, 1); end.position.set(-0.6, 1.5, 0.2);
      g.add(nerve, end);
      labs.push(Lb(2, 'Motor nerve ending', [-1.9, 3.8, 0.4], 'gold'), Lb(2, 'Myofibrils', [3.4, -1.9, 0.4], 'red'), Lb(2, 'Nuclei', [0.9, 1.9, 1.4], 'purple'));
    }
    // ---- level 3: three myofibrils with live bands; SR sleeve and T-tubules round the middle one
    const myo = { tex: null, canvas: null, L: 0 };
    let srMat;
    const trings = [];
    {
      const g = levels[3];
      const c = document.createElement('canvas'); c.width = 512; c.height = 32; myo.canvas = c;
      myo.tex = new THREE.CanvasTexture(c); myo.tex.colorSpace = THREE.SRGBColorSpace; myo.tex.wrapS = myo.tex.wrapT = THREE.RepeatWrapping;
      myo.tex.center.set(0.5, 0.5); myo.tex.rotation = Math.PI / 2;
      const mm = std({ map: myo.tex, color: 0xffffff, emissive: 0x3a0a10, emissiveIntensity: 0.25 });
      [-1.45, 0, 1.45].forEach((y) => { const m = new THREE.Mesh(new THREE.CylinderGeometry(0.55, 0.55, 8, 32), mm); m.rotation.z = Math.PI / 2; m.position.set(0, y, 0); g.add(m); });
      // SR: a lacy sleeve (canvas lattice as an alpha texture)
      const lc = document.createElement('canvas'); lc.width = 256; lc.height = 128; const lg = lc.getContext('2d');
      lg.fillStyle = '#000'; lg.fillRect(0, 0, 256, 128); lg.strokeStyle = '#fff'; lg.lineWidth = 5;
      for (let i = 0; i < 8; i++) { lg.beginPath(); lg.moveTo(0, i * 16 + 8); for (let x = 0; x <= 256; x += 16) lg.lineTo(x, i * 16 + 8 + ((x / 16) % 2 ? 5 : -5)); lg.stroke(); }
      for (let x = 0; x < 256; x += 64) { lg.lineWidth = 9; lg.beginPath(); lg.moveTo(x, 0); lg.lineTo(x, 128); lg.stroke(); }
      const at = new THREE.CanvasTexture(lc); at.wrapS = at.wrapT = THREE.RepeatWrapping; at.repeat.set(1, 3);
      srMat = std({ color: 0x8ef0ff, emissive: 0x2a8aa0, emissiveIntensity: 0.3, alphaMap: at, opacity: 0.7, side: THREE.DoubleSide, depthWrite: false });
      const sr = new THREE.Mesh(new THREE.CylinderGeometry(0.7, 0.7, 8, 32, 1, true), srMat); sr.rotation.z = Math.PI / 2; g.add(sr);
      const tm = std({ color: 0xc9a7ff, emissive: 0x5a3aa0, emissiveIntensity: 0.4 });
      for (let i = 0; i < 12; i++) { const r = new THREE.Mesh(new THREE.TorusGeometry(0.74, 0.04, 8, 32), tm); r.rotation.y = Math.PI / 2; g.add(r); trings.push(r); }
      labs.push(Lb(3, 'Sarcoplasmic reticulum: stores calcium', [0.4, 2.6, 0.4], 'cyan'), Lb(3, 'T-tubules carry the signal inside', [-2.8, -2.4, 0.4], 'purple'));
    }
    // ---- level 4: one sarcomere
    const S = { thick: [], thin: [], z: [] };
    const THICK_Y = [-1.2, -0.4, 0.4, 1.2], THIN_Y = [-1.6, -0.8, 0, 0.8, 1.6];
    let heads, headInfo = [], caSw, caPos = [];
    {
      const g = levels[4];
      const thickMat = std({ color: 0xe0506a, emissive: 0x601020, emissiveIntensity: 0.4 });
      const thinMat = std({ color: 0x6ec8ff, emissive: 0x104a70, emissiveIntensity: 0.45 });
      const zMat = std({ color: 0xe8eef8, emissive: 0x404858, emissiveIntensity: 0.4 });
      THICK_Y.forEach((y) => { const m = new THREE.Mesh(new THREE.CylinderGeometry(0.075, 0.075, SARC.thick * U, 12), thickMat); m.rotation.z = Math.PI / 2; m.position.set(0, y, 0); g.add(m); S.thick.push(m); });
      for (const side of [-1, 1]) {
        const zd = new THREE.Mesh(new THREE.BoxGeometry(0.1, 3.9, 1.2), zMat); g.add(zd); S.z.push({ m: zd, side });
        THIN_Y.forEach((y) => { const m = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, SARC.thin * U, 8), thinMat); m.rotation.z = Math.PI / 2; g.add(m); S.thin.push({ m, side, y }); });
      }
      const mline = new THREE.Mesh(new THREE.BoxGeometry(0.06, 2.9, 0.8), std({ color: 0xffb0c0, opacity: 0.5, depthWrite: false })); g.add(mline);
      // myosin heads: along each thick filament outside the bare zone, pointing to the thin filaments above and below
      const hx = []; for (let x = SARC.bare * U / 2 + 0.1; x < SARC.thick * U / 2 - 0.05; x += 0.17) hx.push(x);
      THICK_Y.forEach((y, r) => hx.forEach((x) => [-1, 1].forEach((side) => [-1, 1].forEach((dir) => headInfo.push({ x: side * x, y, side, dir, ph: rnd(headInfo.length * 3 + 1) })))));
      heads = new THREE.InstancedMesh(new THREE.CapsuleGeometry(0.035, 0.26, 4, 8), std({ color: 0xff8aa0, emissive: 0x802040, emissiveIntensity: 0.5 }), headInfo.length);
      heads.instanceMatrix.setUsage(THREE.DynamicDrawUsage); heads.frustumCulled = false; g.add(heads);
      caSw = new THREE.InstancedMesh(new THREE.SphereGeometry(0.06, 8, 6), M.glow(0x8ef0ff), 70); caSw.instanceMatrix.setUsage(THREE.DynamicDrawUsage); caSw.frustumCulled = false; g.add(caSw);
      for (let i = 0; i < 70; i++) caPos.push(new THREE.Vector3((rnd(i) - 0.5) * 7, (rnd(i + 7) - 0.5) * 3.8, 0.5 + rnd(i + 3) * 0.6));
      labs.push(Lb(4, 'Z-disc', [-3.9, 2.35, 0], 'white'), Lb(4, 'Actin (thin)', [-3.1, -2.3, 0.3], 'blue'), Lb(4, 'Myosin (thick) with heads', [1.6, -2.3, 0.3], 'pink'), Lb(4, 'M-line', [0, 2.2, 0], 'pink'), Lb(4, 'Calcium', [2.6, 2.3, 0.5], 'cyan'));
    }
    // ---- level 5: a close-up of actin and three myosin heads
    const X5 = { acts: null, trop: null, heads: [], ca: [], atp: [], pi: [], shift: 0 };
    const RISE = 0.44, TWIST = (-166.15 * Math.PI) / 180, REPEAT = 13 * RISE;
    {
      const g = levels[5];
      const act = new THREE.Group(); g.add(act); X5.acts = act;
      const beadA = std({ color: 0x6ec8ff, emissive: 0x104a70, emissiveIntensity: 0.4 }), beadB = std({ color: 0x9ad8ff, emissive: 0x104a70, emissiveIntensity: 0.4 });
      const N = 64;
      const bead = new THREE.SphereGeometry(0.27, 16, 10);
      for (let i = 0; i < N; i++) { const a = i * TWIST, m = new THREE.Mesh(bead, i % 2 ? beadA : beadB); m.position.set(-15 + i * RISE, 1.1 + 0.26 * Math.cos(a), 0.26 * Math.sin(a)); act.add(m); }
      // tropomyosin strand along the groove, with troponin blobs every 7 subunits
      const tpts = []; for (let i = 0; i < N; i += 4) tpts.push(new THREE.Vector3(-15 + i * RISE, 1.1, 0.42));
      X5.trop = new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(tpts), 120, 0.07, 8), std({ color: 0xffd166, emissive: 0x806010, emissiveIntensity: 0.5 }));
      act.add(X5.trop);
      for (let i = 0; i < N; i += 7) { const tn = new THREE.Mesh(new THREE.SphereGeometry(0.14, 12, 8), std({ color: 0x6ee7a8, emissive: 0x2a7050, emissiveIntensity: 0.5 })); tn.position.set(-15 + i * RISE, 1.1, 0.55); act.add(tn); X5.ca.push(tn); }
      // thick filament backbone and three heads
      const back = new THREE.Mesh(new THREE.CylinderGeometry(0.4, 0.4, 8.4, 24), std({ color: 0xe0506a, emissive: 0x601020, emissiveIntensity: 0.4 })); back.rotation.z = Math.PI / 2; back.position.y = -1.9; g.add(back);
      const lever = std({ color: 0xff8aa0, emissive: 0x802040, emissiveIntensity: 0.4 }), headM = std({ color: 0xff6f8e, emissive: 0x902040, emissiveIntensity: 0.5 });
      [-2.4, 0, 2.4].forEach((x, i) => {
        const piv = new THREE.Group(); piv.position.set(x, -1.5, 0); g.add(piv);
        const arm = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.08, 1.3, 10), lever); arm.position.y = 0.65; piv.add(arm);
        const hd = new THREE.Mesh(new THREE.SphereGeometry(1, 18, 12), headM); hd.scale.set(0.5, 0.36, 0.34); hd.position.set(0.15, 1.45, 0); piv.add(hd);
        X5.heads.push({ piv, hd, off: i / 3 });
      });
      const mol = (c) => { const m = new THREE.Mesh(new THREE.SphereGeometry(0.13, 10, 8), M.glow(c)); g.add(m); return m; };
      X5.heads.forEach(() => { X5.atp.push(mol(0xffd166)); X5.pi.push(mol(0xff8a5c)); });
      labs.push(Lb(5, 'Actin', [-4.6, 1.9, 0], 'blue'), Lb(5, 'Tropomyosin', [3.8, 1.9, 0.6], 'gold'), Lb(5, 'Myosin head', [4.2, 0.0, 0], 'pink'), Lb(5, 'ATP', [-4.2, -0.5, 0.5], 'gold'));
    }
    labs.forEach((l) => { l.element.style.pointerEvents = 'none'; });
    // the actin filament is long so it can slide forever; clip it to the close-up's width
    stage.renderer.localClippingEnabled = true;
    const clipL = new THREE.Plane(new THREE.Vector3(1, 0, 0), 0), clipR = new THREE.Plane(new THREE.Vector3(-1, 0, 0), 0);
    X5.acts.traverse((o) => { if (o.material) o.material.clippingPlanes = [clipL, clipR]; });
    const stageL = tint(stage.label('', [C[0] + 5.2, C[1] + 3.3, 0], root), 'gold');

    // fade materials per level
    const mats = levels.map((g) => { const set = new Set(); g.traverse((o) => { if (o.material) set.add(o.material); }); return [...set].map((m) => { m.transparent = true; m.userData.op = m.opacity; return m; }); });

    // ---- board
    const st = { L: 2.5, f: 0 };
    const chart = canvasTexture(900, 620, (g, w, h) => drawLT(g, w, h, st));
    const cb = board(chart, 5.0, 5.0 * 620 / 900); cb.position.set(6.9, 3.6, 0); cb.rotation.y = -0.2; root.add(cb);

    // ---- dynamics
    let t = 0, Ls = 2.5, act = 0, stimUntil = -1, autoT = 0, cyc = 0, lastL0 = 2.5, acc = 0;
    const pulse = () => { stimUntil = t + 2; };
    const o3 = new THREE.Object3D();
    const drawMyo = (L) => {
      // one sarcomere per canvas width: Z-line at the edges, A band (fixed 1.6 µm) in the middle, H zone inside it
      const g = myo.canvas.getContext('2d'), w = 512, a = (SARC.thick / L) * w;
      g.fillStyle = '#e8a0a8'; g.fillRect(0, 0, w, 32);                              // I band (light)
      g.fillStyle = '#8a2c3a'; g.fillRect((w - a) / 2, 0, a, 32);                      // A band (dark)
      const hz = Math.max(0, L - 2 * SARC.thin) / L * w;                              // H zone: no actin overlap
      g.fillStyle = '#b8505e'; g.fillRect((w - hz) / 2, 0, hz, 32);
      g.fillStyle = '#2a0a10'; g.fillRect(0, 0, 5, 32); g.fillRect(w - 5, 0, 5, 32);   // Z lines
      myo.tex.needsUpdate = true;
    };
    const fit = fitNarrow(stage, { pos: [2.6, 3.6, 13], target: [2.6, 3.2, 0] });

    return compactReadout(stage, {
      pulse,
      update(dt, s) {
        dt = Math.max(0, dt); t += dt;
        // nerve signal → calcium → activation
        if (s.auto) { autoT = (autoT + dt) % 4; if (autoT < 2) stimUntil = Math.max(stimUntil, t + 0.05); }
        const on = t < stimUntil;
        act = clamp(act + ((on ? 1 : 0) - act) * Math.min(1, dt * (on ? 8 : 3)), 0, 1);
        // sarcomere length: shortens towards 2.0 µm (or by 0.5 µm) while active, springs back when relaxed
        if (Math.abs(s.L0 - lastL0) > 1e-4 && act < 0.05) Ls = s.L0;
        lastL0 = s.L0;
        const target = Math.max(Math.min(s.L0, SARC.short), s.L0 - 0.5);
        if (s.atp) Ls = act > 0.2 ? Math.max(target, Ls - dt * 0.35 * act) : Math.min(s.L0, Ls + dt * 0.5 * (1 - act));
        const force = tension(Ls) * (s.atp ? act : Math.max(act, 0.3));
        st.L = Ls; st.f = force;
        acc += dt; if (acc > 0.08) { acc = 0; chart.redraw(); }

        // zoom: each level scaled by STEP^(zoom − i), faded out away from its own zoom
        levels.forEach((g, i) => {
          const d = s.zoom - i, k = Math.pow(STEP, d), fade = clamp(1.25 - Math.abs(d) * 1.6, 0, 1);
          g.scale.setScalar(k); g.visible = fade > 0.01;
          mats[i].forEach((m) => { m.opacity = m.userData.op * fade; m.depthWrite = fade > 0.95 && m.userData.op >= 1; });
        });
        const lvl = Math.round(clamp(s.zoom, 0, 5));
        const narrow = fit();
        labs.forEach((l) => { l.visible = s.labels && !inReel() && !narrow && Math.abs(s.zoom - l.userData.lvl) < 0.3; });
        stageL.element.textContent = LEVELS[lvl].name;
        stageL.visible = !inReel() && s.labels;

        // level 2–3: stripes and SR glow follow the sarcomere
        if (Math.abs(myo.L - Ls) > 0.004) { myo.L = Ls; drawMyo(Ls); myo.tex.repeat.set(1, 8 / (1.5 * Ls / 2.5)); fibreTex.repeat.set(1, 6 * 2.5 / Ls); }
        srMat.emissiveIntensity = 0.3 + 1.6 * act;
        const sl = 1.5 * Ls / 2.5;                                                      // sarcomere length at level 3
        trings.forEach((r, i) => { const n = i >> 1, cx = (n - 2.5) * sl, x = cx + (i % 2 ? 1 : -1) * (SARC.thick / 2 / Ls) * sl; r.position.x = x; r.visible = Math.abs(x) < 3.9; });

        // level 4: place Z-discs and thin filaments for this length
        const half = (Ls / 2) * U;
        S.z.forEach(({ m, side }) => { m.position.x = side * half; });
        S.thin.forEach(({ m, side, y }) => { m.position.set(side * (half - (SARC.thin * U) / 2), y, 0); });
        if (s.zoom > 3.2 && s.zoom < 4.8) {
          const tipX = half - SARC.thin * U;                                              // how far in the actin reaches
          if (act > 0.05 && s.atp) cyc += dt * 2.2;
          headInfo.forEach((h, i) => {
            const reach = Math.abs(h.x) >= tipX - 0.05;                                   // is there actin over this head?
            const ph = (cyc + h.ph) % 1, bound = reach && (s.atp ? act > 0.2 && ph < 0.55 : true);
            const lean = bound ? (s.atp ? lerp(0.7, -0.7, smooth(ph / 0.55)) : -0.7) : 0.6 + 0.1 * Math.sin(t * 6 + i);
            const a = h.dir > 0 ? 0 : Math.PI;                                            // up or down
            o3.position.set(h.x + h.side * -0.12 * lean + 0.0, h.y + h.dir * (bound ? 0.22 : 0.17), 0);
            o3.rotation.set(0, 0, a + h.dir * h.side * -lean * 0.8);
            o3.scale.setScalar(1); o3.updateMatrix(); heads.setMatrixAt(i, o3.matrix);
          });
          heads.instanceMatrix.needsUpdate = true;
          caPos.forEach((p, i) => { o3.position.set(p.x + Math.sin(t * 2 + i) * 0.15, p.y + Math.cos(t * 1.7 + i) * 0.15, p.z); o3.rotation.set(0, 0, 0); o3.scale.setScalar(act > 0.05 ? act : 0.001); o3.updateMatrix(); caSw.setMatrixAt(i, o3.matrix); });
          caSw.instanceMatrix.needsUpdate = true;
        }

        // level 5: tropomyosin guards the sites until calcium arrives; heads cycle with ATP
        if (s.zoom > 4.2) {
          X5.trop.position.set(0, 0.28 * act, -0.28 * act);
          X5.ca.forEach((c) => c.material.emissiveIntensity = 0.3 + act * 1.2);
          const running = act > 0.2 && s.atp;
          X5.heads.forEach((h, i) => {
            const ph = (cyc * 0.25 + h.off) % 1;
            let lean, up, atpK = -1, piK = -1;
            if (!s.atp && act > 0.05) { lean = -0.55; up = 1; }                                   // rigor: stuck on actin
            else if (!running) { lean = 0.5; up = 0; }                                            // cocked, waiting
            else if (ph < 0.12) { lean = 0.5; up = ph / 0.12; }                                   // bind
            else if (ph < 0.45) { lean = lerp(0.5, -0.55, smooth((ph - 0.12) / 0.33)); up = 1; piK = (ph - 0.12) / 0.33; }   // power stroke, Pi leaves
            else if (ph < 0.6) { lean = -0.55; up = 1; atpK = (ph - 0.45) / 0.15; }               // ATP arrives
            else if (ph < 0.7) { lean = -0.55; up = 1 - (ph - 0.6) / 0.1; }                     // let go
            else { lean = lerp(-0.55, 0.5, smooth((ph - 0.7) / 0.3)); up = 0; }                   // re-cock
            h.piv.rotation.z = -lean; h.piv.position.y = -1.5 + 0.18 * up;
            const hp = h.hd.getWorldPosition(new THREE.Vector3()); levels[5].worldToLocal(hp);
            X5.atp[i].visible = atpK >= 0; if (atpK >= 0) X5.atp[i].position.set(hp.x - 1.4 * (1 - atpK), hp.y - 1.2 * (1 - atpK), 0.5);
            X5.pi[i].visible = piK >= 0; if (piK >= 0) X5.pi[i].position.set(hp.x + 0.2, hp.y - 0.4 - piK * 1.2, 0.6 + piK);
          });
          // actin slides left by one step for each power stroke (three heads, out of step)
          // (a stroke moves it XB.stepNm at 0.16 units per nm, over a third of a 1.8 s cycle)
          if (running) X5.shift += dt * X5.heads.filter((h) => { const p = (cyc * 0.25 + h.off) % 1; return p >= 0.12 && p < 0.45; }).length * (XB.stepNm * 0.16) / (0.33 / 0.55);
          X5.acts.position.x = -(X5.shift % REPEAT);
          const k5 = levels[5].scale.x; clipL.constant = -(C[0] - 4.6 * k5); clipR.constant = C[0] + 4.6 * k5;
        }
      },
      readout: (s) => {
        const lvl = Math.round(clamp(s.zoom, 0, 5)), fibreN = Math.round(0.1 / (s.L0 * 1e-6)), cm = (fibreN * (s.L0 - st.L)) / 1e4;
        return `<div class="big">${LEVELS[lvl].name}</div>
          <div class="row"><span>Real size</span><b>${LEVELS[lvl].size}</b></div>
          <div class="row"><span>Sarcomere length</span><b>${st.L.toFixed(2)} µm</b></div>
          <div class="row"><span>Force</span><b>${Math.round(st.f * 100)}% of the most</b></div>
          <div class="row"><span>Calcium</span><b>${act > 0.2 ? 'released: heads cycling' : 'stored in the SR'}</b></div>
          <div class="row"><span>A 10 cm fibre</span><b>${fibreN.toLocaleString('en-IN')} sarcomeres · ${cm > 0.05 ? `now ${cm.toFixed(1)} cm shorter` : 'at rest'}</b></div>
          <small>${s.atp ? `One ATP per stroke; each stroke moves actin about ${XB.stepNm} nm. Shown in slow motion.` : 'No ATP: the heads cannot let go. This is rigor mortis.'}</small>`;
      },
    });
  },
};
