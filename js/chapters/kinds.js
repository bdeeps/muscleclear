// Chapter 2: the three kinds of muscle side by side as tissue cut-outs, each contracting in its
// own way, with a live force trace for each.
// Sources (Guyton & Hall, Textbook of Medical Physiology, 14th ed., ch. 6, 8, 9, 63; OpenStax
// Anatomy & Physiology 2e, ch. 10.2, 10.7–10.8, 19.2):
//  - skeletal: long, cylindrical, striated fibres with many nuclei at the edge; voluntary; one
//    twitch about 0.1 s; nerve impulses at 20–50 a second fuse twitches into a smooth, stronger
//    pull (tetanus); a single twitch gives roughly a quarter to a third of full tetanic force;
//  - cardiac: striated, branched cells with one or two central nuclei, joined end to end by
//    intercalated discs (gap junctions let the signal spread cell to cell); its own pacemaker; the
//    action potential lasts about 0.25–0.3 s, so beats can never fuse; mitochondria fill about a
//    third of each cell, which is why it doesn't tire (Barth et al., J Mol Cell Cardiol 24:669, 1992);
//  - smooth: spindle-shaped cells with one central nucleus and no stripes; slow: a contraction
//    lasts about 1–3 s; can shorten to less than half its length (skeletal: about 30% at most);
//    holds tension with 1/10 to 1/300 of the energy skeletal muscle would need (the "latch" state);
//    small-intestine slow waves about 12 a minute in the duodenum.
import { THREE, M, clamp, lerp, smooth, canvasTexture } from '../kit.js';
import { stripeTexture, spindleGeo, aim, board, panel, tint, fitNarrow, compactReadout, inReel, rnd, twitchF, KINDS } from '../muscle.js';

const X = { skeletal: -4.9, cardiac: 0, smooth: 4.9 }, Y = 1.6;
const INFO = {
  skeletal: { title: 'Skeletal muscle', col: '#ff8a8a', rows: [['Control', 'voluntary: you decide'], ['Stripes', 'yes'], ['Cells', 'long fibres, many nuclei'], ['One twitch', 'about 0.1 s'], ['Tires?', 'yes, fast fibres in seconds']] },
  cardiac: { title: 'Cardiac muscle', col: '#ff9fc0', rows: [['Control', 'involuntary: its own pacemaker'], ['Stripes', 'yes'], ['Cells', 'branched, joined by discs'], ['One squeeze', 'about 0.3 s'], ['Tires?', 'no: a third of each cell is mitochondria']] },
  smooth: { title: 'Smooth muscle', col: '#ffb070', rows: [['Control', 'involuntary'], ['Stripes', 'none'], ['Cells', 'spindles, one nucleus each'], ['One squeeze', 'about 1–3 s'], ['Holding', 'up to 300× cheaper than skeletal']] },
};

function drawTraces(g, w, h, st) {
  panel(g, w, h);
  const rows = [['skeletal', 'Skeletal: on command'], ['cardiac', 'Cardiac: every beat'], ['smooth', 'Smooth: slow waves']];
  const L = 250, R = w - 30, rh = (h - 80) / 3;
  g.font = 'bold 34px sans-serif'; g.fillStyle = '#e8eef8'; g.fillText('Force over the last 8 seconds', 30, 50);
  rows.forEach(([k, name], i) => {
    const y0 = 80 + i * rh, base = y0 + rh - 16, top = y0 + 14, dim = st.focus !== 'all' && st.focus !== k;
    g.globalAlpha = dim ? 0.3 : 1;
    g.fillStyle = INFO[k].col; g.font = 'bold 30px sans-serif'; g.fillText(name.split(':')[0], 30, y0 + rh / 2 - 6); g.font = '24px sans-serif'; g.fillText(name.split(': ')[1], 30, y0 + rh / 2 + 26);
    g.strokeStyle = 'rgba(255,255,255,.12)'; g.beginPath(); g.moveTo(L, base); g.lineTo(R, base); g.stroke();
    const hist = st[k]; g.strokeStyle = INFO[k].col; g.lineWidth = 4; g.beginPath();
    hist.forEach((v, j) => { const x = L + (j / (hist.length - 1)) * (R - L), y = base - clamp(v, 0, 1) * (base - top); j ? g.lineTo(x, y) : g.moveTo(x, y); });
    g.stroke(); g.lineWidth = 1; g.globalAlpha = 1;
  });
}

export default {
  id: 'kinds',
  short: 'Three kinds',
  title: 'Three kinds of muscle',
  subtitle: 'Striped muscles you command, a heart that never stops, and slow squeezers in your gut.',
  view: { pos: [0.6, 4.6, 16.5], target: [0.6, 3.9, 0] },
  learn: `<p>Your body makes three kinds of muscle, and under a microscope they look different.</p>
    <p><b>Skeletal muscle</b> moves your bones. Its cells, called <b>fibres</b>, are long cylinders with many nuclei, and they are <b>striated</b>: striped with light and dark bands. It is <b>voluntary</b>: it contracts when your brain sends a signal down a nerve (see <a href="/nervousclear/#synapse">NervousClear</a>). One signal gives a quick <b>twitch</b> of about a tenth of a second; a stream of 20 to 50 signals a second fuses the twitches into a strong, smooth pull.</p>
    <p><b>Cardiac muscle</b> is found only in the heart. It is striped too, but its cells are short, <b>branched</b> and joined end to end by <b>intercalated discs</b> that pass the signal straight from cell to cell, so the whole heart squeezes together. It is <b>involuntary</b>: it has its own pacemaker. Each squeeze lasts about 0.3 s, and it can never lock into one long cramp. With a third of each cell packed with energy-making mitochondria, it beats about 1 lakh times a day and never rests (see <a href="/heartclear/">HeartClear</a>).</p>
    <p><b>Smooth muscle</b> lines your gut, blood vessels, bladder and airways, and even sets the size of your pupils. It has no stripes, and its cells are small spindles with one nucleus. It is slow, taking seconds to squeeze, but it can hold a squeeze for hours on very little energy. Waves of it push food along your gut (see <a href="/digestionclear/#journey">DigestionClear</a>).</p>
    <p class="tip"><b>Try it:</b> pick each kind to compare it. Send skeletal muscle a single order, then turn the heart rate up and watch the cardiac trace keep its gaps.</p>`,
  terms: [
    { t: 'Striated', d: 'Striped with light and dark bands, as skeletal and cardiac muscle are.' },
    { t: 'Voluntary muscle', d: 'Muscle you control on purpose: skeletal muscle.' },
    { t: 'Involuntary muscle', d: 'Muscle that works without you deciding: cardiac and smooth muscle.' },
    { t: 'Intercalated disc', d: 'The joint between heart muscle cells that lets the signal pass straight through.' },
    { t: 'Twitch', d: 'One quick contraction of a muscle fibre after one nerve signal.' },
    { t: 'Tetanus (in muscle)', d: 'Twitches fused into one smooth, strong pull by rapid nerve signals.' },
  ],
  defaults: { focus: 'all', hr: 72, auto: true, labels: true },
  controls: [
    { key: 'focus', type: 'seg', label: 'Look at', options: [{ v: 'all', label: 'All three' }, { v: 'skeletal', label: 'Skeletal' }, { v: 'cardiac', label: 'Cardiac' }, { v: 'smooth', label: 'Smooth' }] },
    { key: 'go', type: 'buttons', label: 'Skeletal muscle', items: [{ label: 'One signal: twitch', act: (s, inst) => inst.cmd?.(1) }, { label: 'Hold it: 30 signals a second', act: (s, inst) => inst.cmd?.(30) }] },
    { key: 'hr', type: 'range', label: 'Heart rate', min: 40, max: 180, step: 1, ends: ['40', '180'], fmt: (v) => Math.round(v) + ' beats/min' },
    { key: 'auto', type: 'toggle', label: 'Keep moving the skeletal muscle' },
    { key: 'labels', type: 'toggle', label: 'Labels' },
  ],
  quiz: [
    { q: 'Which kind of muscle can you control on purpose?', options: ['Cardiac', 'Smooth', 'Skeletal', 'All three'], answer: 2, why: 'Skeletal muscle is voluntary. Cardiac and smooth muscle work without you deciding.' },
    { q: 'Which kind has no stripes?', options: ['Smooth muscle', 'Skeletal muscle', 'Cardiac muscle', 'None of them'], answer: 0, why: 'Smooth muscle has the same proteins but not lined up in neat bands, so it looks plain.' },
    { q: 'Why can the heart never lock into one long cramp?', options: ['It is too small', 'Each beat has a long electrical signal that must end before the next can start', 'It has no nerves', 'It is made of smooth muscle'], answer: 1, why: 'Heart cells stay unexcitable for about 0.25 s after each beat, so beats cannot fuse the way skeletal twitches can.' },
  ],
  reel: [
    { ms: 5400, caption: 'Skeletal muscle is striped and obeys you; cardiac beats on its own; smooth muscle squeezes slowly.', set: { focus: 'all', hr: 72, auto: true, labels: false }, anim: { hr: [72, 130] }, view: { pos: [1.4, 4.2, 12], target: [1.4, 4.2, 0] }, spin: 0 },
  ],

  build({ stage }) {
    const root = new THREE.Group(); stage.root.add(root);
    const L = (h, p, c) => tint(stage.label(h, p, root), c);
    const tissues = {};
    const baseMat = (o) => { const m = new THREE.MeshStandardMaterial({ roughness: 0.5, transparent: true, ...o }); m.userData.op = m.opacity; return m; };

    // ---- skeletal: seven long striped fibres with nuclei at their edges
    {
      const g = new THREE.Group(); g.position.set(X.skeletal, Y, 0); root.add(g);
      const tex = stripeTexture(12); tex.center.set(0.5, 0.5); tex.rotation = Math.PI / 2; tex.repeat.set(1, 3);
      const mat = baseMat({ map: tex, color: 0xffffff, emissive: 0x5a1018, emissiveIntensity: 0.25, opacity: 1 });
      const nucMat = baseMat({ color: 0x6a4cc0, emissive: 0x2a1860, emissiveIntensity: 0.4, opacity: 1 });
      const inner = new THREE.Group(); g.add(inner);
      [[0, 0], [0.66, 0], [-0.66, 0], [0.33, 0.57], [-0.33, 0.57], [0.33, -0.57], [-0.33, -0.57]].forEach(([y, z], i) => {
        const f = new THREE.Mesh(new THREE.CylinderGeometry(0.32, 0.32, 3.8, 28), mat); f.rotation.z = Math.PI / 2; f.position.set(0, y, z); inner.add(f);
        for (let k = 0; k < 4; k++) { const a = rnd(i * 7 + k) * Math.PI * 2; const n = new THREE.Mesh(new THREE.SphereGeometry(1, 12, 8), nucMat); n.scale.set(0.2, 0.05, 0.07); n.position.set(-1.5 + k * 1.0 + rnd(i + k) * 0.3, y + Math.cos(a) * 0.31, z + Math.sin(a) * 0.31); inner.add(n); }
      });
      tissues.skeletal = { g, inner, mats: [mat, nucMat] };
    }
    // ---- cardiac: short branched striped cells joined by bright intercalated discs
    {
      const g = new THREE.Group(); g.position.set(X.cardiac, Y, 0); root.add(g);
      const tex = stripeTexture(12, '#b43f5e', '#e6849e', '#7a2240'); tex.center.set(0.5, 0.5); tex.rotation = Math.PI / 2; tex.repeat.set(1, 1);
      const mat = baseMat({ map: tex, color: 0xffffff, emissive: 0x5a1030, emissiveIntensity: 0.25, opacity: 0.88 });
      const disc = baseMat({ color: 0xfff2c0, emissive: 0xffe08a, emissiveIntensity: 0.8, opacity: 1 });
      const nucMat = baseMat({ color: 0x6a4cc0, emissive: 0x2a1860, emissiveIntensity: 0.5, opacity: 1 });
      const inner = new THREE.Group(); g.add(inner);
      const cell = (a, b, r = 0.27) => {
        const A = new THREE.Vector3(...a), B = new THREE.Vector3(...b);
        const m = new THREE.Mesh(new THREE.CylinderGeometry(r, r, A.distanceTo(B), 20), mat);
        m.position.copy(A).add(B).multiplyScalar(0.5); m.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), B.clone().sub(A).normalize()); inner.add(m);
        const n = new THREE.Mesh(new THREE.SphereGeometry(1, 12, 8), nucMat); n.scale.set(0.15, 0.1, 0.1); n.position.copy(m.position); inner.add(n);
      };
      const dsk = (x, y) => { const d = new THREE.Mesh(new THREE.CylinderGeometry(0.29, 0.29, 0.05, 20), disc); d.rotation.z = Math.PI / 2; d.position.set(x, y, 0); inner.add(d); };
      [-0.72, 0, 0.72].forEach((y, row) => {
        const off = row === 1 ? 0.55 : 0, xs = [-1.9 + off, -0.8 + off, 0.3 + off, 1.4 + off].filter((x) => x < 1.95);
        xs.forEach((x, i) => { const x1 = Math.min(1.9, (xs[i + 1] ?? 1.9)); cell([x + 0.03, y, 0], [x1 - 0.03, y, 0]); if (i) dsk(x, y); });
      });
      // branches between rows
      [[-1.2, -0.72, -0.5, 0], [0.8, 0, 1.3, 0.72], [-0.2, 0, 0.3, -0.72], [-1.6, 0.72, -1.1, 0]].forEach(([x0, y0, x1, y1]) => cell([x0, y0, 0], [x1, y1, 0], 0.2));
      tissues.cardiac = { g, inner, mats: [mat, disc, nucMat] };
    }
    // ---- smooth: overlapping spindle cells, no stripes, one central nucleus each
    {
      const g = new THREE.Group(); g.position.set(X.smooth, Y, 0); root.add(g);
      const mat = baseMat({ color: 0xe89a86, emissive: 0x5a2010, emissiveIntensity: 0.25, opacity: 0.9 });
      const nucMat = baseMat({ color: 0x6a4cc0, emissive: 0x2a1860, emissiveIntensity: 0.5, opacity: 1 });
      const inner = new THREE.Group(); g.add(inner);
      for (let row = 0; row < 6; row++) for (let k = 0; k < 3; k++) {
        const y = -1.0 + row * 0.4, x = -1.3 + k * 1.3 + (row % 2) * 0.65 - 0.3, z = (rnd(row * 3 + k) - 0.5) * 0.3;
        if (x > 1.4) continue;
        const c = aim(new THREE.Mesh(spindleGeo(), mat), [x - 1.0, y, z], [x + 1.0, y, z], 0.2, [0, 0, 1], 0.9); inner.add(c);
        const n = new THREE.Mesh(new THREE.SphereGeometry(1, 12, 8), nucMat); n.scale.set(0.28, 0.06, 0.06); n.position.set(x, y, z); inner.add(n);
      }
      tissues.smooth = { g, inner, mats: [mat, nucMat] };
    }

    const labs = {
      skeletal: L('Skeletal: striped fibres', [X.skeletal, Y - 1.8, 0.5], 'red'),
      cardiac: L('Cardiac: branched, striped', [X.cardiac, Y - 1.8, 0.5], 'pink'),
      smooth: L('Smooth: spindles, no stripes', [X.smooth, Y - 1.8, 0.5], 'orange'),
      nuc: L('Nuclei at the edge', [X.skeletal - 1.2, Y + 1.35, 0.4], 'purple'),
      disc: L('Intercalated discs', [X.cardiac + 1.1, Y + 1.35, 0.4], 'gold'),
      nuc2: L('One nucleus per cell', [X.smooth + 0.6, Y + 1.35, 0.4], 'purple'),
    };

    const st = { focus: 'all', skeletal: new Array(240).fill(0), cardiac: new Array(240).fill(0), smooth: new Array(240).fill(0) };
    const chart = canvasTexture(1000, 520, (g, w, h) => drawTraces(g, w, h, st));
    const cb = board(chart, 7.6, 7.6 * 520 / 1000); cb.position.set(4.3, 6.6, -0.4); root.add(cb);

    let t = 0, spikes = [], nextAuto = 0.6, beatT = 0, beatStart = -9, waveT = 0, acc = 0, fSk = 0, fCa = 0, fSm = 0;
    // A command: n signals a second for 0.6 s (n = 1 means a single twitch).
    const cmd = (n) => { if (n <= 1) spikes.push(t); else for (let k = 0; k < 0.6 * n; k++) spikes.push(t + k / n); };
    const fit = fitNarrow(stage, { pos: [0.6, 4.0, 19], target: [0.6, 4.0, 0] });
    return compactReadout(stage, {
      cmd,
      update(dt, s) {
        dt = Math.max(0, dt); t += dt;
        st.focus = s.focus;
        if (s.auto) { nextAuto -= dt; if (nextAuto <= 0) { cmd(30); nextAuto = 2.6; } }
        spikes = spikes.filter((ti) => t - ti < 0.6 || ti > t);
        // Skeletal: summed twitches (contraction time 60 ms), saturating towards full tetanic force.
        const sum = spikes.reduce((a, ti) => a + twitchF(t - ti, KINDS.skeletal.twitch), 0);
        fSk = 1 - Math.exp(-0.4 * sum);
        // Cardiac: a squeeze of about 0.3 s each beat (a little shorter at high rates).
        const period = 60 / s.hr, dur = KINDS.cardiac.beat * Math.sqrt(72 / s.hr);
        beatT += dt; if (beatT >= period) { beatT -= period; beatStart = t; }
        const bt = t - beatStart; fCa = bt >= 0 && bt < dur ? Math.pow(Math.sin(Math.PI * bt / dur), 2) : 0;
        // Smooth: one slow wave every 5 s (12 a minute); rises in about 0.9 s, fades over about 2 s.
        waveT = (waveT + dt) % (60 / KINDS.smooth.perMin);
        fSm = waveT < KINDS.smooth.rise ? smooth(waveT / KINDS.smooth.rise) : Math.exp(-(waveT - KINDS.smooth.rise) / (KINDS.smooth.fall / 2));
        // Shapes: skeletal shortens up to 14% here, cardiac about 15%, smooth up to 35%; volume kept.
        const shape = (T, f, maxS) => { const sx = 1 - maxS * f; T.inner.scale.set(sx, 1 / Math.sqrt(sx), 1 / Math.sqrt(sx)); };
        shape(tissues.skeletal, fSk, 0.14); shape(tissues.cardiac, fCa, 0.15); shape(tissues.smooth, fSm, 0.35);
        for (const k of Object.keys(tissues)) {
          const on = s.focus === 'all' || s.focus === k;
          tissues[k].mats.forEach((m) => { m.opacity = on ? m.userData.op : 0.18; m.depthWrite = on; });
        }
        acc += dt; if (acc > 1 / 30) { acc = 0; st.skeletal.push(fSk); st.skeletal.shift(); st.cardiac.push(fCa); st.cardiac.shift(); st.smooth.push(fSm); st.smooth.shift(); chart.redraw(); }
        const narrow = fit(), on = s.labels && !inReel();
        Object.entries(labs).forEach(([k, l]) => { l.visible = on && !narrow; });
        ['skeletal', 'cardiac', 'smooth'].forEach((k) => { labs[k].visible = on; });
      },
      readout: (s) => {
        if (s.focus === 'all') return `<div class="big">Three kinds of muscle</div>
          <div class="row"><span>Skeletal pull now</span><b>${Math.round(fSk * 100)}% of full</b></div>
          <div class="row"><span>Heart</span><b>${Math.round(s.hr)} beats/min · ${Math.round(s.hr * 1440).toLocaleString('en-IN')} a day</b></div>
          <div class="row"><span>Gut waves</span><b>about 12 a minute</b></div>
          <small>Striped and voluntary · striped and automatic · plain and slow.</small>`;
        const I = INFO[s.focus];
        return `<div class="big">${I.title}</div>${I.rows.map(([a, b]) => `<div class="row"><span>${a}</span><b>${b}</b></div>`).join('')}
          ${s.focus === 'cardiac' ? `<div class="row"><span>At ${Math.round(s.hr)} a minute</span><b>${Math.round(s.hr * 1440).toLocaleString('en-IN')} beats a day</b></div>` : ''}`;
      },
    });
  },
};
