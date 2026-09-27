// Chapter 4: muscles only pull, so they come in opposing pairs. A side view of an arm: the biceps
// in front bends the elbow, the triceps behind straightens it. The forearm is a lever with the
// elbow as its pivot; the biceps pulls about 5 cm from the pivot, while the load sits about 33 cm
// away, so the biceps must pull several times harder than the weight in your hand.
// Model: armForces() in muscle.js (torque balance about the elbow, moment arms from the attachment
// geometry, forearm + hand 1.5 kg with its centre of mass 15 cm out). The "biceps" force is for all
// the elbow flexors together (biceps, brachialis and brachioradialis share the work in life).
// Strength: maximal elbow-flexion torque at 90° is roughly 60–80 N·m in untrained adult men and
// 30–45 N·m in women (e.g. Frontera et al., J Appl Physiol 71:644, 1991; Gallagher et al., Med
// Sci Sports Exerc 29:1052, 1997), which the readout uses to flag "too heavy to hold".
// Concentric (shortening), eccentric (lengthening while pulling) and isometric (holding) are the
// standard terms (e.g. OpenStax Anatomy & Physiology 2e, 10.4).
import { THREE, M, clamp, lerp, smooth, canvasTexture, arrow, beam } from '../kit.js';
import { armForces, ARM, spindleGeo, aim, board, panel, tint, fitNarrow, compactReadout, inReel, capsule, blob } from '../muscle.js';

const E = new THREE.Vector3(0, 5, 0), K = 20;               // elbow; 20 model units per metre (1 unit = 5 cm)
const W = (p) => new THREE.Vector3(E.x + p[0] * K, E.y + p[1] * K, 0);

function drawCurve(g, w, h, st) {
  panel(g, w, h);
  const L0 = 110, R0 = w - 36, T0 = 90, B0 = h - 70;
  const pts = []; let max = 1;
  for (let a = 5; a <= 145; a += 2) { const f = armForces(a, st.load, st.mode); const F = st.mode === 'push' ? f.fT : f.fB; pts.push([a, F]); max = Math.max(max, F); }
  max = Math.max(200, Math.ceil(max / 200) * 200);
  const x = (a) => L0 + ((a - 5) / 140) * (R0 - L0), y = (F) => B0 - (F / max) * (B0 - T0);
  g.fillStyle = '#e8eef8'; g.font = 'bold 30px sans-serif'; g.fillText(st.mode === 'push' ? 'Triceps pull at every angle' : 'Biceps pull at every angle', 36, 52);
  g.strokeStyle = 'rgba(255,255,255,.18)'; g.beginPath(); g.moveTo(L0, T0 - 10); g.lineTo(L0, B0); g.lineTo(R0, B0); g.stroke();
  g.fillStyle = 'rgba(255,255,255,.55)'; g.font = '22px sans-serif';
  [0, 45, 90, 135].forEach((a) => g.fillText(a + '°', x(Math.max(5, a)) - 14, B0 + 32));
  g.fillText('elbow bend', R0 - 118, B0 + 60);
  [0, max / 2, max].forEach((F) => g.fillText(Math.round(F) + ' N', 12, y(F) + 8));
  g.strokeStyle = st.mode === 'push' ? '#9db4ff' : '#ff8a8a'; g.lineWidth = 5; g.beginPath();
  pts.forEach(([a, F], i) => (i ? g.lineTo(x(a), y(F)) : g.moveTo(x(a), y(F)))); g.stroke(); g.lineWidth = 1;
  // the load itself, for comparison
  const Wn = st.load * ARM.g; g.strokeStyle = 'rgba(255,209,102,.8)'; g.setLineDash([10, 8]); g.beginPath(); g.moveTo(L0, y(Wn)); g.lineTo(R0, y(Wn)); g.stroke(); g.setLineDash([]);
  g.fillStyle = '#ffd166'; g.fillText(st.mode === 'push' ? 'your push' : 'the load', R0 - 110, y(Wn) - 10);
  g.fillStyle = '#ffffff'; g.beginPath(); g.arc(x(st.phi), y(st.F), 11, 0, 7); g.fill();
}

export default {
  id: 'pairs',
  short: 'Pairs and levers',
  title: 'Muscles only pull',
  subtitle: 'Why they work in pairs, and why your biceps pulls far harder than the weight you lift.',
  view: { pos: [-3.4, 5.6, 24], target: [-3.9, 4.6, 0] },
  learn: `<p>A muscle can only <b>pull</b>. It shortens and tugs on its tendon, but it can never push. So to move a joint both ways you need two muscles working against each other: an <b>antagonist pair</b>.</p>
    <p>At the elbow, the <b>biceps</b> in front bends the arm and the <b>triceps</b> behind straightens it. While one works, the other relaxes and is stretched. At the knee, the <b>quadriceps</b> straighten the leg and the <b>hamstrings</b> bend it. The pull reaches the bone through a <b>tendon</b>; the joints and bones themselves are SkeletonClear's story.</p>
    <p>Your forearm is a <b>lever</b> with the elbow as its pivot (see <a href="/forceclear/#machines">ForceClear</a> for levers and forces). The biceps tendon grips the forearm only about <b>5 cm</b> from the elbow, but your hand is about <b>33 cm</b> away. To balance the turning effect, the biceps must pull roughly <b>7 times</b> harder than the weight in your hand: holding a 5 kg bag with your forearm level takes a pull of about 400 N, like holding up 40 kg. You pay in force, but you win in speed: a small shortening of the muscle swings your hand a long way, fast.</p>
    <p>The biceps also works when you <b>lower</b> a weight: it pulls while it gets longer, braking the fall (an <b>eccentric</b> contraction). Lifting is <b>concentric</b> (shortening) and holding still is <b>isometric</b>.</p>
    <p class="tip"><b>Try it:</b> set the elbow to 90° and add load. Then straighten the arm and watch the biceps force change. Switch to "Push down" to make the triceps do the work.</p>`,
  terms: [
    { t: 'Antagonist pair', d: 'Two muscles that pull a joint in opposite directions, like biceps and triceps.' },
    { t: 'Lever', d: 'A rigid bar that turns about a pivot; the forearm turns about the elbow.' },
    { t: 'Moment arm', d: 'The shortest distance from the pivot to the line of a force: how much turning effect it gets.' },
    { t: 'Torque', d: 'Turning effect: force × moment arm, in newton-metres (N·m).' },
    { t: 'Concentric, eccentric, isometric', d: 'Pulling while shortening, pulling while lengthening, and pulling while holding still.' },
  ],
  defaults: { mode: 'lift', phi: 90, load: 5, auto: false, labels: true },
  controls: [
    { key: 'mode', type: 'seg', label: 'What the arm does', options: [{ v: 'lift', label: 'Hold a weight' }, { v: 'push', label: 'Push down' }] },
    { key: 'load', type: 'range', label: 'Load in the hand', min: 0, max: 20, step: 0.5, ends: ['0 kg', '20 kg'], fmt: (v, s) => (s.mode === 'push' ? `pushing with ${v} kg of force` : `${v} kg`) },
    { key: 'phi', type: 'range', label: 'Elbow bend', min: 5, max: 145, step: 1, ends: ['straight', 'fully bent'], fmt: (v) => Math.round(v) + '°' },
    { key: 'auto', type: 'toggle', label: 'Lift and lower (curls)' },
    { key: 'labels', type: 'toggle', label: 'Labels' },
  ],
  quiz: [
    { q: 'Why do muscles work in pairs?', options: ['One is a spare', 'Muscles can only pull, so each direction needs its own muscle', 'They share blood', 'To look even'], answer: 1, why: 'A muscle can pull but never push. The triceps pulls the elbow straight; the biceps pulls it bent.' },
    { q: 'Holding a 5 kg bag with your forearm level, roughly how hard does the biceps pull?', options: ['About 50 N', 'About 400 N', 'About 5 N', 'Exactly 5 kg'], answer: 1, why: 'The biceps pulls about 5 cm from the elbow, the bag hangs about 33 cm away, so the biceps needs roughly 7 times the bag’s 49 N.' },
    { q: 'When you slowly lower a heavy book, which muscle controls it?', options: ['The triceps, pushing', 'The biceps, pulling while it lengthens', 'No muscle at all', 'The deltoid'], answer: 1, why: 'Gravity pulls the book down; the biceps brakes it by pulling while it gets longer. That is an eccentric contraction.' },
  ],
  reel: [
    { ms: 5000, caption: 'Muscles can only pull, so the biceps bends your elbow and the triceps straightens it.', set: { mode: 'lift', phi: 20, load: 3, auto: false, labels: false }, anim: { phi: [20, 120] }, view: { pos: [1.8, 8.0, 19], target: [1.8, 7.8, 0] }, spin: 0 },
    { ms: 5200, caption: 'The biceps pulls just 5 cm from the elbow, so it needs about seven times the weight in your hand.', set: { mode: 'lift', phi: 90, load: 2, auto: false, labels: false }, anim: { load: [2, 12] }, view: { pos: [3.8, 8.0, 20], target: [3.8, 7.6, 0] }, spin: 0 },
  ],

  build({ stage }) {
    const root = new THREE.Group(); stage.root.add(root);
    const std = (o) => new THREE.MeshStandardMaterial({ roughness: 0.5, ...o });
    // ghost body: torso and head seen from the side, behind the arm
    const ghost = std({ color: 0xd9a47e, transparent: true, opacity: 0.1, depthWrite: false, side: THREE.DoubleSide });
    root.add(capsule([-0.4, 6.2, -2.6], [-0.4, 11.4, -2.6], 2.1, ghost), blob([1.5, 1.9, 1.5], [-0.1, 14.6, -2.6], ghost));
    const skin = std({ color: 0xd9a47e, transparent: true, opacity: 0.1, depthWrite: false });
    const upperSkin = capsule([0, 11, 0], [0, 5, 0], 1.05, skin); root.add(upperSkin);
    const foreSkin = new THREE.Mesh(new THREE.CapsuleGeometry(0.85, 5.6, 8, 20), skin); root.add(foreSkin);
    // bones
    const boneM = std({ color: 0xe8e2d0, roughness: 0.7 });
    root.add(capsule([0, 11, 0], [0, 5.1, 0], 0.26, boneM), blob([0.6, 0.6, 0.6], [0, 11.1, 0], boneM));
    const fore = new THREE.Group(); fore.position.copy(E); root.add(fore);         // forearm frame: +Y along the forearm towards the hand
    fore.add(capsule([0.1, 0.1, 0.12], [0.12, 5.2, 0.14], 0.14, boneM), capsule([-0.1, -0.1, -0.1], [-0.08, 5.2, -0.1], 0.14, boneM));
    const olec = blob([0.3, 0.35, 0.3], [0, -0.35, 0], boneM); fore.add(olec);
    const hand = blob([0.55, 0.9, 0.35], [0, 6.3, 0], std({ color: 0xd9a47e, transparent: true, opacity: 0.45 })); fore.add(hand);
    // the load: a dumbbell whose plates grow with the mass; or a table for pushing
    const bell = new THREE.Group(); root.add(bell);
    const plateM = std({ color: 0x3a3f4a, metalness: 0.6, roughness: 0.35 });
    const bar = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.12, 3.2, 12), std({ color: 0xb9bec8, metalness: 0.9, roughness: 0.3 })); bar.rotation.x = Math.PI / 2; bell.add(bar);
    const plates = [-1, 1].map((sz) => { const p = new THREE.Mesh(new THREE.CylinderGeometry(1, 1, 0.35, 28), plateM); p.rotation.x = Math.PI / 2; p.position.z = sz * 1.25; bell.add(p); return p; });
    const table = new THREE.Mesh(new THREE.BoxGeometry(7, 0.35, 4), std({ color: 0x8a6a4a, roughness: 0.8 })); root.add(table);

    // muscles: a belly between two tendons, re-aimed every frame
    const mk = (col) => { const m = std({ color: col, emissive: col, emissiveIntensity: 0.1 }); return { mat: m, belly: new THREE.Mesh(spindleGeo(), m), t1: beam([0, 0, 0], [0, 1, 0], 0.07, std({ color: 0xf1ead8 })), t2: beam([0, 0, 0], [0, 1, 0], 0.08, std({ color: 0xf1ead8 })) }; };
    const bic = mk(0xd4424e), tri = mk(0xb8394a);
    [bic, tri].forEach((m) => root.add(m.belly, m.t1, m.t2));
    const setBeam = (b, A, B) => { const d = B.clone().sub(A); b.position.copy(A).addScaledVector(d, 0.5); b.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), d.clone().normalize()); b.scale.set(1, Math.max(0.01, d.length()), 1); };
    const place = (m, O, I, bulgeDir, len0, r0, act) => {
      const d = I.clone().sub(O), len = d.length(), n = bulgeDir.clone().sub(d.clone().multiplyScalar(bulgeDir.dot(d) / (len * len))).normalize();
      const A = O.clone().addScaledVector(d, 0.14).addScaledVector(n, 0.55), B = O.clone().addScaledVector(d, 0.8).addScaledVector(n, 0.55);
      // volume stays the same: a shorter belly is a fatter one; working muscle is a little firmer and brighter
      const r = r0 * Math.sqrt(len0 / len) * (1 + 0.08 * act);
      aim(m.belly, A, B, r, [0, 0, 1], 0.9);
      setBeam(m.t1, O, A); setBeam(m.t2, B, I);
      m.mat.emissiveIntensity = 0.08 + 0.7 * act; m.mat.color.setHex(act > 0.1 ? 0xe04856 : 0x9a5a62);
    };
    // arrows
    const aLoad = arrow(0xffd166, 2, 0.4, 0.07); root.add(aLoad);
    const aBic = arrow(0xff8a8a, 2, 0.45, 0.08); root.add(aBic);
    const aTri = arrow(0x9db4ff, 2, 0.45, 0.08); root.add(aTri);
    const pointArrow = (a, from, dir, len) => { a.position.copy(from); a.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), dir.clone().normalize()); a.set(len); };

    const L = (h, p, c) => tint(stage.label(h, p, root), c);
    const labs = { bic: L('Biceps', [0, 0, 0], 'red'), tri: L('Triceps', [0, 0, 0], 'blue'), elbow: L('Elbow: the pivot', [-1.4, 4.2, 0.6], 'white'), load: L('', [0, 0, 0], 'gold'), fB: L('', [0, 0, 0], 'red'), tendon: L('Tendon', [0, 0, 0], 'white') };

    const st = { mode: 'lift', load: 5, phi: 90, F: 0 };
    const chart = canvasTexture(900, 600, (g, w, h) => drawCurve(g, w, h, st));
    const cb = board(chart, 7.2, 7.2 * 600 / 900); cb.position.set(-9.0, 0.6, -0.5); cb.rotation.y = 0.12; root.add(cb);

    let t = 0, phi = 90, prevPhi = 90, vel = 0, acc = 0, key = '', f = armForces(90, 5);
    const len0B = 5.6, len0T = 5.4;
    const fit = fitNarrow(stage, { pos: [2.0, 6.5, 19], target: [2.0, 6.0, 0] });
    return compactReadout(stage, {
      update(dt, s) {
        dt = Math.max(0, dt); t += dt;
        const target = s.auto ? lerp(25, 130, 0.5 - 0.5 * Math.cos(t * 2 * Math.PI / 4)) : s.phi;
        prevPhi = phi; phi += (target - phi) * Math.min(1, dt * (s.auto ? 20 : 6));
        vel = dt > 0 ? (phi - prevPhi) / dt : 0;
        if (s.auto) s.phi = Math.round(phi);
        const push = s.mode === 'push';
        f = armForces(phi, s.load, s.mode);
        const p = (phi * Math.PI) / 180, d = new THREE.Vector3(Math.sin(p), -Math.cos(p), 0);
        fore.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), d);
        foreSkin.position.copy(E).addScaledVector(d, 3.2); foreSkin.quaternion.copy(fore.quaternion);
        const handP = E.clone().addScaledVector(d, ARM.grip * K);
        bell.visible = !push && s.load > 0; table.visible = push;
        const pr = 0.45 + 0.07 * s.load; plates.forEach((pl) => pl.scale.set(pr, 1, pr));
        bell.position.copy(handP);
        table.position.set(handP.x, handP.y - 0.6, 0);
        // attachment points from the same geometry the forces use
        const O = W(f.O), I = W(f.I), Ot = W(f.Ot), It = W(f.It);
        const bicAct = push ? 0.05 : clamp(f.fB / 900, 0.12, 1), triAct = push ? clamp(f.fT / 900, 0.12, 1) : 0.03;
        place(bic, O, I, new THREE.Vector3(1, 0, 0), len0B, 0.55, bicAct);
        place(tri, Ot, It, new THREE.Vector3(-1, 0, 0), len0T, 0.6, triAct);
        // arrows: the load (or the table's push) at the hand, the working muscle's pull at its tendon
        const Wlen = clamp(f.W * 0.02, 0, 4);
        if (push) pointArrow(aLoad, handP.clone().add(new THREE.Vector3(0, -0.2 - Wlen, 0.8)), new THREE.Vector3(0, 1, 0), Wlen);
        else pointArrow(aLoad, handP.clone().add(new THREE.Vector3(0, -0.9, 0.9)), new THREE.Vector3(0, -1, 0), Wlen);
        pointArrow(aBic, I.clone().add(new THREE.Vector3(0, 0, 0.9)), O.clone().sub(I), clamp(f.fB * 0.004, 0, 6));
        pointArrow(aTri, It.clone().add(new THREE.Vector3(0, 0, 0.9)), Ot.clone().sub(It), clamp(f.fT * 0.004, 0, 6));
        aBic.visible = !push && f.fB > 5; aTri.visible = push && f.fT > 5;
        // chart
        const F = push ? f.fT : f.fB, k2 = `${s.mode}|${s.load}|${Math.round(phi)}`;
        st.mode = s.mode; st.load = s.load; st.phi = phi; st.F = F;
        acc += dt; if (k2 !== key && acc > 0.05) { key = k2; acc = 0; chart.redraw(); }
        // labels
        const narrow = fit(), on = s.labels && !inReel() && !narrow;
        labs.bic.position.copy(O.clone().lerp(I, 0.45)).add(new THREE.Vector3(1.9, 0, 0.5));
        labs.tri.position.copy(Ot.clone().lerp(It, 0.5)).add(new THREE.Vector3(-2.0, 0, 0.5));
        labs.tendon.position.copy(I).add(new THREE.Vector3(0.6, -0.8, 0.6));
        labs.load.position.copy(handP).add(new THREE.Vector3(0, push ? -1.5 : -2.2, 0.8));
        labs.load.element.textContent = push ? `Table pushes up: ${Math.round(f.W)} N` : `Load: ${Math.round(f.W)} N`;
        labs.fB.position.copy(push ? It : I).add(new THREE.Vector3(push ? -1.6 : 1.6, push ? 1.2 : 1.6, 0.8));
        labs.fB.element.textContent = `${push ? 'Triceps' : 'Biceps'} pulls ${Math.round(F)} N`;
        Object.values(labs).forEach((l) => { l.visible = on; });
        labs.load.visible = on && s.load > 0;
      },
      readout: (s) => {
        const push = s.mode === 'push', F = push ? f.fT : f.fB, r = push ? f.rT : f.rB;
        const moving = Math.abs(vel) > 3 ? (vel > 0 ? 'bending' : 'straightening') : 'still';
        const how = push ? 'triceps holds, biceps relaxed' : moving === 'bending' ? 'biceps shortens as it pulls (concentric)' : moving === 'straightening' ? 'biceps lengthens as it pulls (eccentric)' : 'biceps holds still (isometric)';
        const tooHeavy = f.torque > 70;
        return `<div class="big">${push ? 'Triceps' : 'Biceps'} pulls ${Math.round(F)} N</div>
          <div class="row"><span>${push ? 'Your push' : 'Load'}</span><b>${s.load} kg · ${Math.round(f.W)} N</b></div>
          <div class="row"><span>Turning effect at the elbow</span><b>${f.torque.toFixed(1)} N·m</b></div>
          <div class="row"><span>${push ? 'Triceps' : 'Biceps'} lever (moment arm)</span><b>${(r * 100).toFixed(1)} cm vs ${Math.round(ARM.grip * 100)} cm to the hand</b></div>
          <div class="row"><span>Pull ÷ load</span><b>${f.W > 1 ? (F / f.W).toFixed(1) + '×' : 'just the forearm'}</b></div>
          <div class="row"><span>Now</span><b>${how}</b></div>
          <small>${tooHeavy ? 'More than most adults can hold with a bent elbow (about 40–80 N·m).' : 'The pull is shared by all the elbow flexors. Forearm and hand weigh about 1.5 kg.'}</small>`;
      },
    });
  },
};
