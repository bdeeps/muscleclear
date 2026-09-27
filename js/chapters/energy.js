// Chapter 5: where the ATP comes from, and why muscles tire. Three "tanks" feed one small pool of
// ATP: phosphocreatine (PCr), anaerobic glycolysis (sugar without oxygen, making lactate) and
// aerobic respiration (with oxygen, in mitochondria). A clock runs an all-out effort; a board shows
// each system's share over time. Beside it, a slice of calf muscle shows the fibre-type mix of a
// sprinter, a marathoner and most people.
// Model: energyRates / energyTotals in muscle.js, calibrated to Gastin, Sports Med 31:725 (2001).
// Other sources:
//  - Muscle holds only enough ATP for a few seconds of hard work (about 2–3 s) and PCr for about
//    another 8–10 s (Guyton & Hall, 14th ed., ch. 85 "Sports physiology": ATP 5.2 mmol/L of cell,
//    enough for about 3 s of maximal effort; PCr about 5 times more).
//  - Fibre types: type I (slow, red, many mitochondria, fatigue-resistant) and type II (fast,
//    pale, powerful, tire quickly; IIa is in between, IIx the fastest). See ATHLETES in muscle.js.
//  - Lactate is not the cause of next-day soreness: it is cleared from the blood within about an
//    hour after exercise and is itself a fuel (Brooks, Cell Metab 27:757, 2018). Delayed-onset
//    muscle soreness (DOMS) follows unaccustomed, especially eccentric, exercise, peaking at about
//    24–72 h (Cheung, Hume & Maxwell, Sports Med 33:145, 2003).
//  - Cramps: the cause is not fully known; the leading ideas are over-excited nerve endings in
//    tired muscle, with dehydration and salt loss less well supported (Schwellnus, Br J Sports Med
//    43:401, 2009; Miller et al., Sports Health 14:476, 2022).
//  - Training makes fibres bigger (hypertrophy); adult humans add few if any new fibres
//    (hyperplasia) (Schoenfeld, J Strength Cond Res 24:2857, 2010; Jorgenson et al., Cells 9:1658,
//    2020).
import { THREE, M, clamp, lerp, smooth, canvasTexture, swarm } from '../kit.js';
import { energyRates, energyTotals, ATHLETES, board, panel, tint, fitNarrow, compactReadout, inReel, rnd } from '../muscle.js';

const SYS = [
  { k: 'pcr', name: 'ATP–PCr', col: '#ffd166', hex: 0xffd166, note: 'instant, about 10 s' },
  { k: 'gly', name: 'Glycolysis', col: '#ff8a5c', hex: 0xff8a5c, note: 'fast, 1–2 min, makes lactate' },
  { k: 'aer', name: 'Aerobic', col: '#6ee7a8', hex: 0x6ee7a8, note: 'slow to start, lasts hours' },
];
const TMAX = 180;
const TX = (i) => -0.6 + i * 2.2;         // tank positions

function drawShares(g, w, h, st) {
  panel(g, w, h);
  const L0 = 96, R0 = w - 36, T0 = 96, B0 = h - 72;
  const x = (t) => L0 + (t / TMAX) * (R0 - L0), y = (v) => B0 - v * (B0 - T0);
  g.fillStyle = '#e8eef8'; g.font = 'bold 30px sans-serif'; g.fillText('Where the energy comes from (all-out)', 32, 52);
  // stacked shares, drawn as bands
  const N = 180, prev = new Array(N + 1).fill(0);
  SYS.forEach((sy) => {
    g.fillStyle = sy.col; g.globalAlpha = 0.75; g.beginPath();
    const top = [];
    for (let i = 0; i <= N; i++) { const t = (i / N) * TMAX, r = energyRates(Math.max(0.01, t)), v = r[sy.k] / r.total; top.push(prev[i] + v); }
    for (let i = 0; i <= N; i++) g.lineTo(x((i / N) * TMAX), y(top[i]));
    for (let i = N; i >= 0; i--) g.lineTo(x((i / N) * TMAX), y(prev[i]));
    g.closePath(); g.fill(); g.globalAlpha = 1;
    for (let i = 0; i <= N; i++) prev[i] = top[i];
  });
  g.fillStyle = 'rgba(255,255,255,.6)'; g.font = '22px sans-serif';
  [0, 30, 60, 90, 120, 150, 180].forEach((t) => g.fillText(t + ' s', x(t) - 16, B0 + 32));
  ['0', '50%', '100%'].forEach((l, i) => g.fillText(l, 20, y(i / 2) + 8));
  g.font = 'bold 22px sans-serif'; g.fillStyle = '#1a1206';
  g.fillText('PCr', x(1), y(0.9)); g.fillText('Glycolysis', x(8), y(0.62)); g.fillText('Aerobic', x(110), y(0.45));
  // time cursor
  g.strokeStyle = '#ffffff'; g.lineWidth = 4; g.beginPath(); g.moveTo(x(st.t), T0 - 12); g.lineTo(x(st.t), B0); g.stroke(); g.lineWidth = 1;
  g.fillStyle = '#ffffff'; g.font = 'bold 24px sans-serif'; const s = `${Math.round(st.t)} s`; g.fillText(s, clamp(x(st.t) - 20, L0, R0 - 50), T0 - 20);
}

export default {
  id: 'energy',
  short: 'Energy and fatigue',
  title: 'Fuel, fibres and fatigue',
  subtitle: 'Three ways to make ATP, fast and slow fibres, and what cramps and soreness really are.',
  view: { pos: [1.6, 6.4, 22], target: [1.8, 6.0, 0] },
  learn: `<p>Every myosin stroke spends one <b>ATP</b>, yet a muscle holds only enough ATP for about <b>2–3 seconds</b> of hard work. So it keeps remaking it, three ways.</p>
    <p>First, <b>phosphocreatine</b> (PCr) hands its phosphate straight to ADP. It is instant but runs out in about <b>10 seconds</b>: a 100 m sprint. Next, <b>anaerobic glycolysis</b> splits glucose without oxygen. It is fast and powers efforts of up to about <b>1–2 minutes</b>, like a 400 m, and makes <b>lactate</b> on the way. Last, <b>aerobic respiration</b> burns sugar and fat with oxygen in the mitochondria. It is slow to get going but can run for hours. By about <b>75 seconds</b> of an all-out effort, half the energy has come from oxygen.</p>
    <p>Muscles have two main kinds of fibre. <b>Slow-twitch</b> (type I) fibres are red with blood vessels and mitochondria and hardly tire. <b>Fast-twitch</b> (type II) fibres are paler, contract several times faster and are more powerful, but tire fast. Most people are about half and half; top <b>marathoners</b> can be three quarters slow, <b>sprinters</b> three quarters fast. Genes set much of the mix; training tunes it.</p>
    <p>Some myths. Lactate does <b>not</b> cause next-day soreness: it is cleared within about an hour and even used as fuel. <b>DOMS</b>, the ache 1–3 days later, comes from tiny damage after unfamiliar exercise, especially lowering weights or running downhill, and it fades as muscles adapt. <b>Cramps</b> are sudden locked contractions; the cause isn't fully known, but tired, over-excited nerve endings are the leading idea, and gentle stretching helps. Training makes muscle bigger by making each fibre thicker (<b>hypertrophy</b>), not by adding many new fibres.</p>
    <p class="tip"><b>Try it:</b> run the clock and watch PCr drain in seconds while the aerobic green band grows. Then compare a sprinter's calf with a marathoner's.</p>`,
  terms: [
    { t: 'ATP', d: 'Adenosine triphosphate, the energy coin every muscle stroke spends.' },
    { t: 'Phosphocreatine (PCr)', d: 'A quick store that remakes ATP instantly for about 10 seconds.' },
    { t: 'Anaerobic glycolysis', d: 'Splitting glucose without oxygen: fast, short-lived, makes lactate.' },
    { t: 'Aerobic respiration', d: 'Burning sugar and fat with oxygen in mitochondria: slow to start, lasts for hours.' },
    { t: 'Slow- and fast-twitch fibres', d: 'Type I fibres are tireless and steady; type II are quick and powerful but tire fast.' },
    { t: 'DOMS', d: 'Delayed-onset muscle soreness, peaking 1–3 days after unfamiliar exercise.' },
    { t: 'Hypertrophy', d: 'Growth of muscle by making each fibre thicker.' },
  ],
  defaults: { t: 0, run: true, who: 'avg', labels: true },
  controls: [
    { key: 't', type: 'range', label: 'Time into an all-out effort', min: 0, max: TMAX, step: 1, ends: ['start', '3 min'], fmt: (v) => Math.round(v) + ' s' },
    { key: 'run', type: 'toggle', label: 'Run the clock' },
    { key: 'who', type: 'seg', label: 'Whose calf muscle?', options: Object.entries(ATHLETES).map(([v, a]) => ({ v, label: a.label })), fmt: (v) => ATHLETES[v].note },
    { key: 'labels', type: 'toggle', label: 'Labels' },
  ],
  quiz: [
    { q: 'Which energy system powers a 100 m sprint most?', options: ['Aerobic respiration', 'Phosphocreatine and ATP', 'Burning fat', 'Digesting breakfast'], answer: 1, why: 'For about the first 10 seconds, phosphocreatine remakes ATP almost instantly. Aerobic energy is too slow to start.' },
    { q: 'What mostly causes the ache a day or two after a new workout?', options: ['Lactic acid left in the muscle', 'Tiny damage from unfamiliar, often lengthening, exercise', 'Broken bones', 'Too much protein'], answer: 1, why: 'Lactate clears within about an hour. DOMS comes from small injuries and the repair that follows, peaking 1–3 days later.' },
    { q: 'How does strength training mostly make muscles bigger?', options: ['By adding lots of new fibres', 'By making each fibre thicker', 'By filling them with water', 'By turning fat into muscle'], answer: 1, why: 'Fibres add more myofibrils and grow thicker (hypertrophy). Adults make few if any new fibres.' },
  ],
  reel: [
    { ms: 5600, caption: 'Phosphocreatine lasts about ten seconds, glycolysis a minute or two, and oxygen keeps you going for hours.', set: { t: 0, run: false, who: 'avg', labels: false }, anim: { t: [0, 150] }, view: { pos: [5.0, 4.2, 13], target: [5.0, 3.6, 0] }, spin: 0 },
  ],

  build({ stage }) {
    const root = new THREE.Group(); stage.root.add(root);
    const std = (o) => new THREE.MeshStandardMaterial({ roughness: 0.45, ...o });

    // ---- three tanks feeding one small ATP pool
    const tanks = SYS.map((sy, i) => {
      const g = new THREE.Group(); g.position.set(TX(i), 0.2, 0); root.add(g);
      const glass = new THREE.Mesh(new THREE.CylinderGeometry(0.7, 0.7, 3, 36, 1, true), std({ color: 0xcfe8ff, transparent: true, opacity: 0.18, side: THREE.DoubleSide, depthWrite: false }));
      glass.position.y = 1.5; g.add(glass);
      const fill = new THREE.Mesh(new THREE.CylinderGeometry(0.64, 0.64, 1, 36), std({ color: sy.hex, emissive: sy.hex, emissiveIntensity: 0.35, transparent: true, opacity: 0.85 }));
      g.add(fill);
      const pipe = new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3([new THREE.Vector3(TX(i), 3.3, 0), new THREE.Vector3(TX(i), 4.2, 0), new THREE.Vector3(TX(1), 4.9, 0)]), 30, 0.08, 8), M.glow(sy.hex));
      root.add(pipe);
      return { g, fill, pipe, sy };
    });
    const pool = new THREE.Mesh(new THREE.SphereGeometry(0.55, 32, 20), std({ color: 0xffe9a8, emissive: 0xffd166, emissiveIntensity: 0.6 })); pool.position.set(TX(1), 5.3, 0); root.add(pool);
    // flow dots along the pipes
    const dots = swarm(60, new THREE.SphereGeometry(0.07, 8, 6), M.glow(0xffffff)); dots.frustumCulled = false; root.add(dots);
    const curves = tanks.map((tk, i) => new THREE.CatmullRomCurve3([new THREE.Vector3(TX(i), 3.3, 0.1), new THREE.Vector3(TX(i), 4.2, 0.1), new THREE.Vector3(TX(1), 4.9, 0.1)]));
    const lact = swarm(40, new THREE.SphereGeometry(0.08, 8, 6), M.glow(0xff8a5c)); lact.frustumCulled = false; root.add(lact);

    // ---- a slice of calf muscle: slow (red) and fast (pale) fibres
    const slice = new THREE.Group(); slice.position.set(-5.6, 3.0, 0); root.add(slice);
    const NF = 169, fibres = [];
    const slowM = std({ color: 0xa01828, emissive: 0x500810, emissiveIntensity: 0.4 }), fastM = std({ color: 0xf2c0c4, emissive: 0x402024, emissiveIntensity: 0.2 });
    const fGeo = new THREE.CylinderGeometry(0.19, 0.19, 0.5, 6);
    let n = 0;
    for (let r = -7; r <= 7 && n < NF; r++) for (let c = -8; c <= 8 && n < NF; c++) {
      const x = (c + (r % 2 ? 0.5 : 0)) * 0.38, y = r * 0.33;
      if (x * x + y * y > 2.55 * 2.55) continue;
      const m = new THREE.Mesh(fGeo, fastM); m.rotation.x = Math.PI / 2; m.position.set(x, y, 0); m.userData.k = rnd(n * 13 + 5); slice.add(m); fibres.push(m); n++;
    }
    const rim = new THREE.Mesh(new THREE.TorusGeometry(2.75, 0.06, 8, 64), std({ color: 0xf1ead8 })); slice.add(rim);

    const st = { t: 0 };
    const chart = canvasTexture(1000, 560, (g, w, h) => drawShares(g, w, h, st));
    const cb = board(chart, 7.0, 7.0 * 560 / 1000); cb.position.set(8.9, 3.6, -0.3); cb.rotation.y = -0.12; root.add(cb);

    const L = (h, p, c) => tint(stage.label(h, p, root), c);
    const labs = [L('PCr', [TX(0), -0.4, 0.8], 'gold'), L('Glycolysis', [TX(1), -1.0, 0.8], 'orange'), L('Aerobic', [TX(2), -0.4, 0.8], 'good'), L('ATP pool: about 3 s worth', [TX(1), 6.2, 0], 'gold'),
      L('Calf slice: red = slow, pale = fast', [-5.6, 0.0, 0.5], 'red')];

    let t = 0, acc = 0, lastKey = '';
    const fit = fitNarrow(stage, { pos: [1.2, 5.2, 24], target: [1.2, 4.6, 0] });
    return compactReadout(stage, {
      update(dt, s) {
        dt = Math.max(0, dt); t += dt;
        if (s.run && !inReel()) { s.t = (s.t + dt * 12) % (TMAX + 12); }   // 12 s of effort per real second, then a short pause and restart
        const T = clamp(s.t, 0, TMAX);
        const r = energyRates(Math.max(0.01, T)), tot = energyTotals(T);
        // tank levels: PCr drains; glycolysis "tank" is glycogen (barely dents in 3 min); aerobic stays full
        const lv = [tot.pcrLeft, 1 - 0.12 * clamp(tot.gly / 40, 0, 1), 1];
        tanks.forEach((tk, i) => { const hgt = Math.max(0.02, 2.9 * lv[i]); tk.fill.scale.y = hgt; tk.fill.position.y = hgt / 2 + 0.05; tk.pipe.material.color.setHex(tk.sy.hex).multiplyScalar(0.25 + 0.75 * clamp(r[tk.sy.k] / r.total * 1.6, 0, 1)); });
        let di = 0;
        tanks.forEach((tk, i) => { const share = r[tk.sy.k] / r.total, nDots = Math.round(share * 20); for (let k = 0; k < 20; k++) { const u = (t * 0.5 + k / 20) % 1; dots.place(di++, k < nDots ? curves[i].getPoint(u).toArray() : [0, -50, 0], null, k < nDots ? 1 : 0.001); } });
        dots.done();
        const lactN = Math.round(clamp((tot.lactate - 1) / 16, 0, 1) * 40);
        for (let k = 0; k < 40; k++) { const a = rnd(k) * Math.PI * 2, rr = 0.3 + rnd(k + 9) * 0.5; lact.place(k, k < lactN ? [TX(1) + Math.cos(a) * rr * 2, 1.8 + Math.sin(t * 0.8 + k) * 1.2, 0.9 + Math.sin(a) * rr] : [0, -50, 0], null, k < lactN ? 1 : 0.001); }
        lact.done();
        pool.scale.setScalar(0.9 + 0.1 * Math.sin(t * 8));
        // fibre mix
        const slow = ATHLETES[s.who].slow;
        if (s.who !== lastKey) { lastKey = s.who; fibres.forEach((f) => { f.material = f.userData.k < slow ? slowM : fastM; }); }
        st.t = T; acc += dt; if (acc > 0.1) { acc = 0; chart.redraw(); }
        const narrow = fit();
        labs.forEach((l) => { l.visible = s.labels && !inReel() && !narrow; });
      },
      readout: (s) => {
        const T = clamp(s.t, 0, TMAX), r = energyRates(Math.max(0.01, T)), tot = energyTotals(T);
        const shares = SYS.map((sy) => [sy, r[sy.k] / r.total]);
        const main = shares.reduce((a, b) => (b[1] > a[1] ? b : a))[0];
        const a = ATHLETES[s.who];
        const cum = tot.aer / (tot.aer + tot.pcr + tot.gly || 1);
        return `<div class="big">${Math.round(T)} s: mostly ${main.name}</div>
          ${shares.map(([sy, v]) => `<div class="row"><span>${sy.name} now</span><b>${Math.round(v * 100)}%</b></div>`).join('')}
          <div class="row"><span>Phosphocreatine left</span><b>${Math.round(tot.pcrLeft * 100)}%</b></div>
          <div class="row"><span>From oxygen so far</span><b>${Math.round(cum * 100)}%</b></div>
          <div class="row"><span>Blood lactate (rough)</span><b>about ${Math.round(tot.lactate)} mmol/L</b></div>
          <div class="row"><span>${a.label}: slow fibres</span><b>about ${Math.round(a.slow * 100)}%</b></div>
          <small>Model fitted to measured shares for all-out efforts (Gastin 2001). Real people vary.</small>`;
      },
    });
  },
};
