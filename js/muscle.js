// MuscleClear's shared models: a ghosted, clearly stylised human figure with its main skeletal
// muscles laid on top of faint bones, plus the muscle physiology numbers the chapters share.
//
// Orientation: we face the person (anterior view), as in an anatomy atlas, so their RIGHT is on
// YOUR LEFT. Axes: +x = the person's left, +y = up, +z = forwards (towards you). One model unit is
// 10 cm, so the figure is about 1.75 m tall with the feet on the floor (y = 0). The proportions
// match the other Glassbox body boxes (NervousClear, CirculationClear) so the figures line up.
//
// Muscle placement follows standard surface anatomy (Gray's Anatomy, 42nd ed.; Moore, Clinically
// Oriented Anatomy, 8th ed.; Britannica "Human muscle system"). Shapes are simplified bellies with
// their tendons; sizes are exaggerated a little where that helps them read.
import { THREE, clamp, lerp, smooth } from './kit.js';

export const RED = 0xd4424e, TENDON = 0xf1ead8, BONE = 0xe8e2d0, GOLD = 0xffd166, CA = 0x8ef0ff, ATP = 0xffd166;

// ---------------------------------------------------------------- shared physiology numbers
// Whole body. "More than 600" skeletal muscles: counts run from about 600 to 650+ depending on
// how pairs and parts are counted (Britannica "muscle"; Cleveland Clinic "Muscle"). Skeletal muscle
// mass: about 38% of body mass in men and 31% in women (Janssen et al., J Appl Physiol 89:81, 2000,
// MRI of 468 adults), so "about a third to two fifths".
export const BODY = { count: '600+', shareMen: 38, shareWomen: 31 };

// Sarcomere geometry and the length–tension curve (Guyton & Hall, Textbook of Medical Physiology,
// 14th ed., ch. 6, fig. 6-8; Gordon, Huxley & Julian, J Physiol 184:170, 1966): thick (myosin)
// filament about 1.6 µm long with a bare zone about 0.2 µm in the middle; thin (actin) filaments
// about 1.0 µm from each Z-disc. Full tension on the plateau 2.0–2.25 µm (every head can reach
// actin); falls to zero at about 3.65 µm when the filaments no longer overlap; falls below 2.0 µm as
// the thin filaments overlap each other, and steeply below about 1.65 µm as the thick filaments
// hit the Z-discs. Rest length in the body is roughly 2.0–2.8 µm (Burkholder & Lieber, J Exp Biol
// 204:1529, 2001).
export const SARC = { thick: 1.6, bare: 0.2, thin: 1.0, min: 1.6, max: 3.7, rest: 2.5, short: 2.0 };
const LT = [[1.27, 0], [1.67, 0.84], [2.0, 1], [2.25, 1], [3.65, 0]];
export function tension(L) {
  if (L <= LT[0][0] || L >= LT.at(-1)[0]) return 0;
  for (let i = 1; i < LT.length; i++) if (L <= LT[i][0]) { const [a, fa] = LT[i - 1], [b, fb] = LT[i]; return lerp(fa, fb, (L - a) / (b - a)); }
  return 0;
}
// Cross-bridges: one ATP per stroke; each stroke moves the thin filament about 5–10 nm (Finer,
// Simmons & Spudich, Nature 368:113, 1994, optical trap: about 11 nm and 3–4 pN per stroke).
export const XB = { stepNm: 8, pN: 3.5 };

// The three kinds of muscle (Guyton & Hall ch. 6, 8, 9; OpenStax Anatomy & Physiology 2e, ch. 10):
//  - skeletal: a single twitch lasts about 0.1 s in fast fibres (contraction time about 25–40 ms)
//    and up to about 0.2 s in slow ones; nerve impulses at 20–50 per second fuse twitches into a
//    smooth pull (tetanus);
//  - cardiac: the ventricular action potential lasts about 0.25–0.3 s, and the long refractory
//    period stops the heart ever fusing beats into tetanus;
//  - smooth: contraction starts 50–100 ms after excitation, peaks about 0.5 s later and lasts
//    1–3 s, about 30 times a skeletal twitch; gut slow waves run at about 3 a minute in the stomach
//    and 8–12 a minute in the small intestine (Guyton & Hall ch. 63).
export const KINDS = {
  skeletal: { twitch: 0.06 },
  cardiac: { beat: 0.3 },
  smooth: { rise: 0.9, fall: 1.8, perMin: 12 },
};
export const twitchF = (t, tc) => (t <= 0 ? 0 : (t / tc) * Math.exp(1 - t / tc));

// Energy systems in an all-out effort. Rates are in units of the aerobic maximum. Calibrated so the
// running total from aerobic sources matches Gastin's review (Sports Med 31:725, 2001, table 3):
// about 6% at 10 s, 27% at 30 s, 45% at 60 s, 51% at 75 s, 63% at 120 s and 73% at 180 s (this
// model gives 9, 26, 45, 51, 64, 73). Phosphocreatine is largely spent in about 10 s; anaerobic
// glycolysis peaks within seconds and fades over one to two minutes.
export const EN = { ta: 22, pp: 2.5, tp: 8, pg: 1.0, tg: 40 };
export function energyRates(t) {
  const aer = 1 - Math.exp(-t / EN.ta), pcr = EN.pp * Math.exp(-t / EN.tp), gly = EN.pg * (1 - Math.exp(-t / 2.5)) * Math.exp(-t / EN.tg);
  return { pcr, gly, aer, total: pcr + gly + aer };
}
// Integrate from 0 to t (for PCr left and lactate made). Blood lactate starts near 1 mmol/L and
// can pass 15 mmol/L after a flat-out 400 m or 800 m (Goodwin et al., J Diabetes Sci Technol
// 1:558, 2007; Hirvonen et al., Eur J Appl Physiol 65:47, 1992); the 0.45 scale is a rough fit.
export function energyTotals(t) {
  let pcr = 0, gly = 0, aer = 0; const n = Math.max(1, Math.ceil(t / 0.25)), h = t / n;
  for (let i = 0; i < n; i++) { const r = energyRates((i + 0.5) * h); pcr += r.pcr * h; gly += r.gly * h; aer += r.aer * h; }
  return { pcr, gly, aer, pcrLeft: clamp(1 - pcr / (EN.pp * EN.tp), 0, 1), lactate: 1 + 0.45 * gly };
}
// Fibre-type mix (share of slow type I fibres). Average untrained thigh about 50%; elite distance
// runners about 70–80% slow in the calf, sprinters about 25% (Costill et al., J Appl Physiol
// 40:149, 1976; Staron et al. and later reviews, e.g. Plotkin et al., Sports Med 2021).
export const ATHLETES = {
  avg: { label: 'Most people', slow: 0.5, note: 'about half slow, half fast' },
  sprint: { label: 'Sprinter', slow: 0.25, note: 'mostly fast-twitch: power for seconds' },
  marathon: { label: 'Marathoner', slow: 0.78, note: 'mostly slow-twitch: steady for hours' },
};

// Forearm lever (elbow flexion). Sizes for an adult of about 70 kg (de Leva, J Biomech 29:1223,
// 1996; Winter, Biomechanics and Motor Control of Human Movement, 4th ed.): upper arm about 30 cm,
// forearm about 26 cm, grip about 33 cm from the elbow; forearm + hand about 2.2% of body mass
// (about 1.5 kg) with its centre of mass about 15 cm from the elbow. Biceps inserts on the radius
// about 4.5–5 cm from the elbow (Murray, Delp & Buchanan, J Biomech 28:513, 1995: peak flexor
// moment arm about 4–5 cm near 90–100°); the triceps pulls on the olecranon about 2–2.5 cm behind
// the joint. Moment arms here come from that geometry, not a table.
export const ARM = { upper: 0.30, fore: 0.26, grip: 0.33, massF: 1.5, comF: 0.15, bicIns: 0.048, bicOrigFwd: 0.015, triIns: 0.022, g: 9.81 };
// Distance (m) from the elbow to the line of pull from origin O to insertion I (2D points).
export const momentArm = (O, I) => Math.abs(O[0] * I[1] - O[1] * I[0]) / Math.hypot(O[0] - I[0], O[1] - I[1]);
// phi: elbow bend in degrees (0 = arm straight down, 90 = forearm level). Upper arm hangs straight
// down from the shoulder, so gravity's lever arm is the horizontal distance, L sin(phi).
export function armForces(phiDeg, loadKg, mode = 'lift') {
  const p = (phiDeg * Math.PI) / 180, d = [Math.sin(p), -Math.cos(p)], n = [Math.cos(p), Math.sin(p)];   // along and in front of the forearm
  // Origins on the upper arm (elbow at 0,0, shoulder straight above); the biceps tuberosity sits
  // a little in front of the radius, the olecranon behind and beyond the joint.
  const O = [ARM.bicOrigFwd, ARM.upper - 0.02], I = [d[0] * ARM.bicIns + n[0] * 0.012, d[1] * ARM.bicIns + n[1] * 0.012];
  const Ot = [-0.012, ARM.upper - 0.04], It = [-d[0] * ARM.triIns - n[0] * 0.015, -d[1] * ARM.triIns - n[1] * 0.015];
  // The triceps wraps round the back of the elbow, so its lever stays about 2 cm at every angle
  // (Murray et al. 1995); the simple straight-line model would underestimate it when bent.
  const rB = momentArm(O, I), rT = Math.max(0.02, momentArm(Ot, It));
  const W = loadKg * ARM.g, armT = ARM.massF * ARM.g * ARM.comF * Math.sin(p);
  if (mode === 'push') {
    // Pushing down on a table with the hand: the table pushes up on the hand and tries to bend
    // the elbow, so the triceps must pull to hold it; the forearm's own weight helps a little.
    const torque = Math.max(0, W * ARM.grip * Math.sin(p) - armT);
    return { rB, rT, W, torque, fB: 0, fT: torque / rT, O, I, Ot, It, d, n };
  }
  const torque = W * ARM.grip * Math.sin(p) + armT;
  return { rB, rT, W, torque, fB: torque / rB, fT: 0, O, I, Ot, It, d, n };
}

// Ageing (sarcopenia): muscle mass falls about 3–8% per decade after about 30, faster after 60
// (Volpi, Nazemi & Fujita, Curr Opin Clin Nutr Metab Care 7:405, 2004). The model uses 3% per
// decade at 30 rising smoothly to 8% per decade by 70. Strength training can slow the loss and
// even add muscle in the very old (Fiatarone et al., JAMA 263:3029, 1990); halving the rate for an
// active person is an illustration, not a measured constant.
export function muscleLeft(age, active) {
  let m = 1;
  for (let a = 30; a < age; a += 0.5) { const r = lerp(0.03, 0.08, smooth((a - 30) / 40)) / 10; m *= 1 - r * 0.5 * (active ? 0.5 : 1); }
  return m;
}

// ---------------------------------------------------------------- label and board helpers
const TINT = { red: '#ff8a8a', gold: '#ffd166', side: '#8ef0ff', cyan: '#8ef0ff', good: '#6ee7a8', pink: '#ff9fc0', purple: '#c9a7ff', blue: '#9db4ff', white: '#e8eef8', orange: '#ffb070' };
export function tint(l, cls) { const c = TINT[cls]; if (c) { l.element.style.borderColor = c; l.element.style.color = c; } return l; }
export const inReel = () => document.body.classList.contains('gb-reel');
export function sideLabels(stage, parent, y, x, z = 1.2) {
  return [tint(stage.label('← Their right', [-x, y, z], parent), 'side'), tint(stage.label('Their left →', [x, y, z], parent), 'side')];
}
// On a phone-width stage the readout covers the upper left: re-centre once, unless orbited.
export function fitNarrow(stage, view) {
  let done = false;
  return () => {
    const narrow = stage.host.clientWidth < 560;
    if (narrow && !done && !stage.moved && !inReel()) { stage.setView(view.pos, view.target, 0.01); done = true; }
    return narrow;
  };
}
// On phones keep only the readout's headline and two rows.
export function compactReadout(stage, api) {
  const full = api.readout;
  if (!full) return api;
  api.readout = (s) => {
    const html = full(s);
    if (stage.host.clientWidth >= 560 || !html) return html;
    let rows = 0;
    return html.replace(/<small>[\s\S]*?<\/small>/g, '').replace(/<div class="row">[\s\S]*?<\/div>/g, (m) => (++rows <= 2 ? m : ''));
  };
  return api;
}
export function board(ct, w, h) {
  return new THREE.Mesh(new THREE.PlaneGeometry(w, h), new THREE.MeshBasicMaterial({ map: ct.tex, transparent: true, toneMapped: false, side: THREE.DoubleSide, depthWrite: false }));
}
export function rrect(g, x, y, w, h, r) { g.beginPath(); g.moveTo(x + r, y); g.arcTo(x + w, y, x + w, y + h, r); g.arcTo(x + w, y + h, x, y + h, r); g.arcTo(x, y + h, x, y, r); g.arcTo(x, y, x + w, y, r); g.closePath(); }
export function panel(g, w, h) { g.clearRect(0, 0, w, h); g.fillStyle = 'rgba(10,12,18,.88)'; rrect(g, 0, 0, w, h, 20); g.fill(); }
export const rnd = (i) => { const x = Math.sin(i * 127.1 + 311.7) * 43758.5453; return x - Math.floor(x); };

// ---------------------------------------------------------------- geometry helpers
export const V = (p) => (p.isVector3 ? p.clone() : new THREE.Vector3(...p));
export function capsule(a, b, r, mat) {
  const A = V(a), B = V(b), len = A.distanceTo(B);
  const m = new THREE.Mesh(new THREE.CapsuleGeometry(r, len, 8, 20), mat);
  m.position.copy(A).add(B).multiplyScalar(0.5);
  m.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), B.clone().sub(A).normalize());
  return m;
}
export function blob(r, pos, mat, seg = 32) {
  const m = new THREE.Mesh(new THREE.SphereGeometry(1, seg, Math.round(seg * 0.7)), mat);
  m.scale.set(...r); m.position.set(...pos);
  return m;
}
// A muscle belly: a spindle of unit length along +Y, centred on the origin, fat in the middle and
// tapering to its tendons. Scale it and aim it with aim().
const SPINDLE = (() => {
  const pts = [];
  for (let i = 0; i <= 24; i++) { const t = i / 24; pts.push(new THREE.Vector2(0.02 + Math.pow(Math.sin(Math.PI * t), 0.75), t - 0.5)); }
  const g = new THREE.LatheGeometry(pts, 28); g.computeVertexNormals(); return g;
})();
export const spindleGeo = () => SPINDLE;
// Place a unit spindle between A and B with half-width r; its flat side (flat < 1) faces `out`.
export function aim(m, A, B, r, out = [0, 0, 1], flat = 1) {
  const a = V(A), b = V(B), y = b.clone().sub(a), len = y.length(); y.normalize();
  let z = V(out); z.sub(y.clone().multiplyScalar(z.dot(y)));
  if (z.lengthSq() < 1e-6) z = new THREE.Vector3(1, 0, 0).cross(y);
  z.normalize();
  const x = new THREE.Vector3().crossVectors(y, z);
  m.quaternion.setFromRotationMatrix(new THREE.Matrix4().makeBasis(x, y, z));
  m.position.copy(a).add(b).multiplyScalar(0.5);
  m.scale.set(r, len, r * flat);
  return m;
}

// Striated muscle texture: repeating light (I) and dark (A) bands with a thin Z line.
export function stripeTexture(bands = 16, base = '#b8434e', light = '#e8848c', dark = '#7e2430') {
  const c = document.createElement('canvas'); c.width = 512; c.height = 64;
  const g = c.getContext('2d');
  g.fillStyle = base; g.fillRect(0, 0, 512, 64);
  const w = 512 / bands;
  for (let i = 0; i < bands; i++) {
    const x = i * w;
    g.fillStyle = light; g.fillRect(x, 0, w * 0.35, 64);
    g.fillStyle = dark; g.fillRect(x + w * 0.4, 0, w * 0.5, 64);
    g.fillStyle = 'rgba(40,10,14,.9)'; g.fillRect(x + w * 0.16, 0, 2, 64);
  }
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.wrapS = t.wrapT = THREE.RepeatWrapping; t.anisotropy = 4;
  return t;
}
// Fibre-direction texture for the body muscles: fine lengthwise grain.
function grainTexture() {
  const c = document.createElement('canvas'); c.width = 128; c.height = 256;
  const g = c.getContext('2d');
  g.fillStyle = '#c24552'; g.fillRect(0, 0, 128, 256);
  for (let i = 0; i < 40; i++) { const x = rnd(i) * 128; g.fillStyle = i % 2 ? 'rgba(255,170,170,.28)' : 'rgba(90,10,20,.35)'; g.fillRect(x, 0, 1 + rnd(i + 9) * 2, 256); }
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.wrapS = t.wrapT = THREE.RepeatWrapping;
  return t;
}

// ---------------------------------------------------------------- the figure
// Joint centres (x for the person's left side; mirror for the right).
export const J = {
  shoulder: [1.85, 14.35, 0], elbow: [2.2, 11.8, 0.05], wrist: [2.45, 9.45, 0.1], hand: [2.56, 8.72, 0.08],
  hip: [0.78, 9.0, 0], knee: [0.95, 4.8, 0], ankle: [0.97, 0.75, -0.05],
};
const TORSO = [[15.1, 0.02], [15.0, 0.55], [14.75, 1.45], [14.35, 1.8], [13.6, 1.72], [12.4, 1.55], [11.3, 1.32], [10.4, 1.35], [9.6, 1.55], [9.0, 1.5], [8.55, 1.05], [8.4, 0.02]];
export function torsoR(y) {
  for (let i = 1; i < TORSO.length; i++) if (y >= TORSO[i][0]) { const [y0, r0] = TORSO[i - 1], [y1, r1] = TORSO[i]; return lerp(r0, r1, (y0 - y) / (y0 - y1)); }
  return 0.02;
}
const mir = (p, sx) => [p[0] * sx, p[1], p[2]];

function skinFigure(mat) {
  const g = new THREE.Group();
  g.add(blob([0.78, 1.0, 0.88], [0, 16.45, 0.05], mat));
  g.add(capsule([0, 14.9, -0.02], [0, 15.6, 0.0], 0.4, mat));
  const tg = new THREE.LatheGeometry(TORSO.map(([y, r]) => new THREE.Vector2(r, y)), 48);
  tg.scale(1, 1, 0.62); tg.computeVertexNormals();
  g.add(new THREE.Mesh(tg, mat));
  for (const sx of [1, -1]) {
    const P = (k) => mir(J[k], sx);
    g.add(capsule(P('shoulder'), P('elbow'), 0.4, mat));
    g.add(capsule(P('elbow'), P('wrist'), 0.31, mat));
    g.add(blob([0.24, 0.48, 0.13], P('hand'), mat));
    g.add(capsule([sx * 0.8, 9.0, 0], P('knee'), 0.64, mat));
    g.add(capsule(P('knee'), P('ankle'), 0.46, mat));
    g.add(blob([0.34, 0.2, 0.62], [sx * 1.0, 0.24, 0.35], mat));
  }
  return g;
}

function bones(mat) {
  const g = new THREE.Group();
  g.add(blob([0.62, 0.78, 0.72], [0, 16.55, 0.02], mat));                                  // skull
  g.add(blob([0.42, 0.22, 0.4], [0, 15.75, 0.25], mat));                                   // jaw
  const sp = new THREE.Mesh(new THREE.CylinderGeometry(0.13, 0.17, 6.6, 12), mat); sp.position.set(0, 12.1, -0.5); g.add(sp);  // spine
  for (let k = 0; k < 9; k++) {                                                            // ribs
    const y = 14.0 - k * 0.3, R = torsoR(y) * 0.86;
    const rib = new THREE.Mesh(new THREE.TorusGeometry(1, 0.035, 6, 40), mat);
    rib.rotation.x = Math.PI / 2 + 0.25; rib.scale.set(R, R * 0.6, 1); rib.position.set(0, y, -0.05); g.add(rib);
  }
  g.add(capsule([0, 14.1, 0.95], [0, 12.6, 0.85], 0.07, mat));                             // sternum
  const pel = new THREE.Mesh(new THREE.TorusGeometry(0.85, 0.16, 10, 32), mat); pel.rotation.x = Math.PI / 2 - 0.35; pel.scale.set(1.2, 0.8, 1); pel.position.set(0, 9.35, -0.05); g.add(pel);
  for (const sx of [1, -1]) {
    const P = (k) => mir(J[k], sx);
    g.add(capsule([sx * 0.2, 14.75, 0.55], [sx * 1.75, 14.7, 0.05], 0.05, mat));          // clavicle
    g.add(capsule(P('shoulder'), P('elbow'), 0.09, mat));                                  // humerus
    g.add(capsule(mir([2.17, 11.7, 0.13], sx), mir([2.47, 9.5, 0.16], sx), 0.05, mat));    // radius
    g.add(capsule(mir([2.22, 11.75, -0.06], sx), mir([2.42, 9.45, 0.02], sx), 0.05, mat)); // ulna
    g.add(capsule([sx * 0.95, 9.05, 0], P('knee'), 0.12, mat));                            // femur
    g.add(capsule(P('knee'), P('ankle'), 0.1, mat));                                       // tibia
    g.add(capsule(mir([1.12, 4.6, -0.05], sx), mir([1.1, 0.85, -0.08], sx), 0.04, mat));   // fibula
    g.add(blob([0.22, 0.12, 0.5], [sx * 1.0, 0.3, 0.3], mat));                             // foot
  }
  return g;
}

// The muscles. Each entry: key, group, name, belly A → B, half-width, the outward direction (for
// explode and for the flat side), flatness, and tendon stubs. Left-side coordinates; mirrored.
const MUSCLES = [
  // shoulders and arms
  { k: 'deltoid', grp: 'arms', A: [1.72, 14.8, 0.05], B: [2.08, 13.25, 0.08], r: 0.44, out: [1, 0.25, 0], flat: 0.62 },
  { k: 'biceps', grp: 'arms', A: [1.98, 13.55, 0.26], B: [2.23, 11.95, 0.32], r: 0.25, out: [0, 0, 1], flat: 0.85, tend: [[2.25, 11.95, 0.3], [2.28, 11.55, 0.24]] },
  { k: 'triceps', grp: 'arms', A: [1.95, 14.0, -0.24], B: [2.2, 12.05, -0.27], r: 0.27, out: [0, 0, -1], flat: 0.8, tend: [[2.2, 12.05, -0.27], [2.22, 11.75, -0.2]] },
  { k: 'forearmF', grp: 'arms', A: [2.24, 11.55, 0.2], B: [2.42, 9.95, 0.2], r: 0.2, out: [0, 0, 1], flat: 0.8 },
  { k: 'forearmE', grp: 'arms', A: [2.28, 11.55, -0.12], B: [2.47, 9.95, -0.06], r: 0.18, out: [0.6, 0, -1], flat: 0.8 },
  // trunk, front
  { k: 'pecs', grp: 'trunk', A: [0.18, 13.55, 0.98], B: [1.68, 13.95, 0.5], r: 0.54, out: [0.25, 0, 1], flat: 0.32 },
  { k: 'obliques', grp: 'trunk', A: [1.22, 12.35, 0.55], B: [0.9, 9.9, 0.62], r: 0.36, out: [1, 0, 0.7], flat: 0.35 },
  { k: 'scm', grp: 'trunk', A: [0.45, 15.7, -0.05], B: [0.1, 14.85, 0.42], r: 0.09, out: [0.5, 0, 1], flat: 1 },
  // trunk, back
  { k: 'lats', grp: 'trunk', A: [0.45, 11.1, -0.8], B: [1.55, 13.45, -0.45], r: 0.56, out: [0.4, 0, -1], flat: 0.3 },
  { k: 'glutes', grp: 'legs', A: [0.55, 9.75, -0.75], B: [0.75, 8.35, -0.72], r: 0.6, out: [0.2, 0, -1], flat: 0.62 },
  // legs
  { k: 'quadRF', grp: 'legs', A: [0.86, 8.7, 0.36], B: [0.93, 5.3, 0.38], r: 0.3, out: [0, 0, 1], flat: 0.85, tend: [[0.94, 5.3, 0.4], [0.95, 4.75, 0.5], [0.96, 4.2, 0.36]] },
  { k: 'quadVL', grp: 'legs', A: [1.22, 8.4, 0.08], B: [1.1, 5.25, 0.22], r: 0.3, out: [1, 0, 0.35], flat: 0.8 },
  { k: 'quadVM', grp: 'legs', A: [0.6, 7.3, 0.24], B: [0.8, 5.15, 0.32], r: 0.25, out: [-0.6, 0, 0.8], flat: 0.85 },
  { k: 'hamL', grp: 'legs', A: [0.98, 8.35, -0.36], B: [1.08, 5.1, -0.34], r: 0.25, out: [0.3, 0, -1], flat: 0.85 },
  { k: 'hamM', grp: 'legs', A: [0.7, 8.35, -0.36], B: [0.82, 5.1, -0.34], r: 0.24, out: [-0.3, 0, -1], flat: 0.85 },
  { k: 'calfL', grp: 'legs', A: [1.07, 4.55, -0.3], B: [1.02, 2.55, -0.32], r: 0.24, out: [0.3, 0, -1], flat: 0.85, tend: [[0.99, 2.55, -0.33], [0.98, 0.55, -0.34]] },
  { k: 'calfM', grp: 'legs', A: [0.83, 4.55, -0.3], B: [0.93, 2.7, -0.32], r: 0.25, out: [-0.3, 0, -1], flat: 0.85 },
  { k: 'tibAnt', grp: 'legs', A: [1.07, 4.35, 0.26], B: [1.02, 1.3, 0.3], r: 0.15, out: [0.2, 0, 1], flat: 0.9 },
];
// Rectus abdominis ("six-pack"): 4 blocks each side, split by tendinous bands.
const ABS = [12.35, 11.72, 11.08, 10.35];
export const NAMES = {
  deltoid: 'Deltoid', biceps: 'Biceps', triceps: 'Triceps', forearmF: 'Forearm flexors', forearmE: 'Forearm extensors', pecs: 'Pectorals',
  obliques: 'Obliques', scm: 'Neck (sternocleidomastoid)', lats: 'Latissimus dorsi', glutes: 'Gluteus maximus', quadRF: 'Quadriceps', quadVL: 'Quadriceps', quadVM: 'Quadriceps',
  hamL: 'Hamstrings', hamM: 'Hamstrings', calfL: 'Calf (gastrocnemius)', calfM: 'Calf (gastrocnemius)', tibAnt: 'Shin (tibialis anterior)', abs: 'Abdominals', trap: 'Trapezius', diaphragm: 'Diaphragm',
};

// Options: labels (true), organs (heart and stomach as cardiac and smooth muscle).
export function makeBody(stage, opts = {}) {
  const o = { labels: true, organs: true, ...opts };
  const root = new THREE.Group();
  const G = {};
  ['skin', 'bones', 'muscles', 'organs'].forEach((k) => { G[k] = new THREE.Group(); root.add(G[k]); });

  const skinMat = new THREE.MeshStandardMaterial({ color: 0xd9a47e, transparent: true, opacity: 0.12, roughness: 0.65, depthWrite: false, side: THREE.DoubleSide });
  G.skin.add(skinFigure(skinMat));
  const boneMat = new THREE.MeshStandardMaterial({ color: BONE, transparent: true, opacity: 0.2, roughness: 0.7, depthWrite: false });
  G.bones.add(bones(boneMat));

  const grain = grainTexture();
  const mMat = () => new THREE.MeshStandardMaterial({ color: 0xffffff, map: grain, roughness: 0.55, emissive: RED, emissiveIntensity: 0.08, transparent: true, opacity: 1 });
  const tMat = new THREE.MeshStandardMaterial({ color: TENDON, roughness: 0.4, emissive: 0x3a3428, emissiveIntensity: 0.3, transparent: true, opacity: 1 });
  const list = [];            // { k, grp, mesh, mat, home: {pos, scale}, out: Vector3, act }
  const add = (k, grp, mesh, mat, out) => {
    const e = { k, grp, mesh, mat, out: V(out).normalize(), act: 0, home: { pos: mesh.position.clone(), scale: mesh.scale.clone() }, tend: [] };
    mesh.userData.muscle = e; list.push(e); G.muscles.add(mesh); return e;
  };
  for (const sx of [1, -1]) {
    for (const m of MUSCLES) {
      const mat = mMat();
      const mesh = aim(new THREE.Mesh(SPINDLE, mat), mir(m.A, sx), mir(m.B, sx), m.r, mir(m.out, sx), m.flat);
      const e = add(m.k, m.grp, mesh, mat, mir(m.out, sx));
      if (m.tend) for (let i = 1; i < m.tend.length; i++) { const t = capsule(mir(m.tend[i - 1], sx), mir(m.tend[i], sx), m.k === 'calfL' ? 0.07 : 0.05, tMat); G.muscles.add(t); e.tend.push({ mesh: t, home: t.position.clone() }); }
    }
    ABS.forEach((y, i) => {
      const z = torsoR(y) * 0.62 - 0.02, mat = mMat();
      const mesh = blob([0.25, i === 3 ? 0.36 : 0.27, 0.11], [sx * 0.29, y, z], mat, 20);
      add('abs', 'trunk', mesh, mat, [sx * 0.15, 0, 1]);
    });
  }
  // trapezius: one diamond over the upper back and neck
  { const mat = mMat(); const mesh = blob([1.25, 1.2, 0.16], [0, 14.1, -0.92], mat, 28); mesh.rotation.x = -0.12; add('trap', 'trunk', mesh, mat, [0, 0.2, -1]); }
  // the diaphragm: a dome under the lungs, shown ghosted inside
  const diaMat = new THREE.MeshStandardMaterial({ color: 0xff8a9a, emissive: 0xff5a6a, emissiveIntensity: 0.25, transparent: true, opacity: 0.55, side: THREE.DoubleSide, depthWrite: false, roughness: 0.5 });
  const dia = new THREE.Mesh(new THREE.SphereGeometry(1, 40, 20, 0, Math.PI * 2, 0, Math.PI / 2), diaMat);
  dia.scale.set(1.32, 0.62, 0.78); dia.position.set(0, 11.55, -0.05);
  const diaE = add('diaphragm', 'breath', dia, diaMat, [0, 0, 1]); diaE.inner = true;

  // organs made of the other two kinds of muscle
  const organ = {};
  if (o.organs) {
    organ.heart = blob([0.4, 0.55, 0.36], [0.25, 12.55, 0.3], new THREE.MeshPhysicalMaterial({ color: 0xb8323f, roughness: 0.4, clearcoat: 0.6, emissive: 0x551018, emissiveIntensity: 0.6, transparent: true, opacity: 0.9 }), 28);
    organ.heart.rotation.z = 0.7;
    organ.stomach = blob([0.52, 0.36, 0.3], [0.6, 11.0, 0.3], new THREE.MeshStandardMaterial({ color: 0xe8a08a, transparent: true, opacity: 0.4, roughness: 0.6, emissive: 0xe8a08a, emissiveIntensity: 0.15, depthWrite: false }), 24);
    organ.stomach.rotation.z = -0.5;
    Object.values(organ).forEach((m) => G.organs.add(m));
  }

  // ---- labels (the person's right side on your left)
  const labels = [];
  const L = (html, pos, cls = 'red') => { const l = tint(stage.label(html, pos, root), cls); labels.push(l); return l; };
  if (o.labels) {
    L('Deltoid', [-3.3, 14.6, 0.4]); L('Biceps', [-3.3, 12.8, 0.6]); L('Pectorals', [3.2, 13.9, 0.8]);
    L('Abdominals', [-2.9, 11.2, 1.0]); L('Obliques', [3.0, 11.2, 0.8]); L('Forearm muscles', [3.7, 9.7, 0.4]);
    L('Quadriceps', [-2.6, 7.0, 0.8]); L('Shin', [2.5, 3.2, 0.6]); L('Calf', [-2.5, 3.5, 0.2]);
    L('Diaphragm', [2.9, 12.2, 0.6], 'pink');
    if (o.organs) L('Heart: cardiac muscle', [2.9, 12.9, 0.6], 'pink');
  }
  const backLabels = [];
  if (o.labels) [['Trapezius', [3.0, 14.6, -1.0]], ['Triceps', [-3.3, 12.9, -0.6]], ['Latissimus dorsi', [3.2, 12.2, -1.0]], ['Gluteus maximus', [-3.2, 8.9, -1.0]], ['Hamstrings', [3.0, 6.8, -0.8]], ['Achilles tendon', [-3.0, 1.4, -0.6]]].forEach(([h, p]) => { const l = tint(stage.label(h, p, root), 'red'); backLabels.push(l); });

  // ---- state
  let xr = { skin: 1, bone: 0.2, mus: 1 };
  const api = {
    root, G, list, organ, labels, backLabels, dia: diaE,
    // layer: 0 = skin on, 1 = muscles (skin ghosted), 2 = bones (muscles ghosted)
    setLayer(k) {
      const skin = lerp(0.62, 0.1, clamp(k, 0, 1)), mus = lerp(1, 0.22, clamp(k - 1, 0, 1)), bone = lerp(0.12, 0.85, clamp(k - 1, 0, 1));
      skinMat.opacity = skin; skinMat.depthWrite = skin > 0.5;
      boneMat.opacity = bone; boneMat.depthWrite = bone > 0.6;
      list.forEach((e) => { e.mat.opacity = e.inner ? 0.55 * (k < 1 ? k : 1) : mus; e.mat.depthWrite = mus > 0.9 && !e.inner; });
      tMat.opacity = mus;
      if (organ.stomach) { organ.heart.visible = k > 0.4; organ.stomach.visible = k > 0.4; }
      xr = { skin, bone, mus };
    },
    setExplode(k) {
      const e2 = smooth(clamp(k, 0, 1)) * 1.5;
      list.forEach((e) => { if (e.inner) return; e.mesh.position.copy(e.home.pos).addScaledVector(e.out, e2); e.tend.forEach((t) => t.mesh.position.copy(t.home).addScaledVector(e.out, e2)); });
    },
    // act: 0–1 contraction; a contracting belly shortens and fattens (its volume stays about the same).
    setAct(e, a) {
      e.act = a;
      if (e.k === 'diaphragm') { e.mesh.scale.set(e.home.scale.x, e.home.scale.y * (1 - 0.45 * a), e.home.scale.z); e.mesh.position.y = e.home.pos.y - 0.12 * a; return; }
      const sh = 1 - 0.12 * a, fat = 1 / Math.sqrt(sh);
      e.mesh.scale.set(e.home.scale.x * fat, e.home.scale.y * sh, e.home.scale.z * fat);
      e.mat.emissiveIntensity = 0.08 + 0.55 * a;
    },
    highlight(fn) { list.forEach((e) => { if (e.inner) return; const on = fn(e); e.mat.color.setHex(on ? 0xffffff : 0x8a6a6e); if (!on) e.mat.emissiveIntensity = 0.02; }); },
    shrink(k) { list.forEach((e) => { if (e.inner) return; const f = Math.sqrt(k); e.mesh.scale.set(e.home.scale.x * f, e.home.scale.y, e.home.scale.z * f); }); },
    // Muscles on the far side of the body are dimmed so the near ones read clearly.
    face(camPos) {
      const q = root.getWorldQuaternion(new THREE.Quaternion()), w = new THREE.Vector3(), o = new THREE.Vector3();
      list.forEach((e) => {
        if (e.inner) return;
        o.copy(e.out).applyQuaternion(q); e.mesh.getWorldPosition(w);
        const k = o.dot(camPos.clone().sub(w).normalize());
        const f = k < -0.15 ? 0.22 : k < 0.1 ? 0.6 : 1;
        e.mat.opacity = xr.mus * f; e.mat.depthWrite = xr.mus * f > 0.9;
      });
    },
    showLabels(front, back) { labels.forEach((l) => { l.visible = front; }); backLabels.forEach((l) => { l.visible = back; }); },
  };
  api.setLayer(1);
  return api;
}
