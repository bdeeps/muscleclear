// Chapter 1: the body's main skeletal muscles in a ghosted figure, on top of faint bones. Layers
// peel from skin to muscle to bone, explode lifts each muscle off the body, and a group control
// makes one set of muscles contract. The diaphragm breathes all the time.
// Numbers:
//  - more than 600 skeletal muscles (counts vary from about 600 to 650+ with how parts are
//    counted; Britannica "Muscle"; Cleveland Clinic "Muscles");
//  - skeletal muscle is about 38% of body mass in men and 31% in women (Janssen et al., J Appl
//    Physiol 89:81, 2000), so about a third or more;
//  - largest: gluteus maximus; smallest: the stapedius in the middle ear, about 1 mm (Britannica;
//    Gray's Anatomy, 42nd ed.); longest: sartorius, across the thigh;
//  - quiet breathing: the diaphragm moves down about 1–2 cm, up to about 10 cm in a deep breath;
//    it does about 75% of the work of quiet breathing (Guyton & Hall, 14th ed., ch. 38); about
//    12–16 breaths a minute at rest.
import { THREE } from '../kit.js';
import { makeBody, sideLabels, fitNarrow, compactReadout, inReel, tint } from '../muscle.js';
import { toast } from '../ui.js';

const GROUPS = {
  all: { label: 'All', rows: [['Skeletal muscles', 'more than 600'], ['Share of body mass', 'about 31–38%'], ['Largest', 'gluteus maximus'], ['Smallest', 'stapedius, about 1 mm'], ['Diaphragm', 'about 15 breaths a minute']] },
  arms: { label: 'Arms', rows: [['Deltoid', 'lifts the arm out to the side'], ['Biceps', 'bends the elbow, turns the palm up'], ['Triceps', 'straightens the elbow'], ['Forearm muscles', 'grip and move the fingers']] },
  trunk: { label: 'Trunk', rows: [['Pectorals', 'pull the arm across the chest'], ['Abdominals', 'bend you forward, brace the spine'], ['Latissimus dorsi', 'pulls the arm down and back'], ['Trapezius', 'shrugs and steadies the shoulders']] },
  legs: { label: 'Legs', rows: [['Gluteus maximus', 'straightens the hip: climbing, standing up'], ['Quadriceps', 'straighten the knee'], ['Hamstrings', 'bend the knee, pull the hip back'], ['Calves', 'push you up on your toes']] },
  breath: { label: 'Breathing', rows: [['Diaphragm', 'drops about 1–2 cm each quiet breath'], ['Share of quiet breathing', 'about three quarters'], ['Deep breath', 'up to about 10 cm'], ['Abdominals', 'push air out hard when you cough']] },
};

export default {
  id: 'anatomy',
  short: 'The muscles',
  title: 'More than 600 motors under your skin',
  subtitle: 'Where the big muscles sit, and how much of you they make up.',
  view: { pos: [-5.0, 9.2, 25], target: [-7.0, 8.8, 0] },
  learn: `<p>Every move you make, from a blink to a sprint, is a <b>muscle</b> pulling. You have <b>more than 600 skeletal muscles</b>, the ones fixed to your bones, and together they make up about <b>a third of your body mass</b>: about 38% in men and 31% in women, on average.</p>
    <p>We are facing the person, so their <b>right</b> side is on <b>your left</b>. Across the shoulder sits the <b>deltoid</b>; in front of the upper arm the <b>biceps</b>, behind it the <b>triceps</b>. The chest has the <b>pectorals</b>, the belly the <b>abdominals</b> (the "six-pack", split by bands of tendon) and the <b>obliques</b> at the sides. Turn the body round to see the <b>trapezius</b>, the wide <b>latissimus dorsi</b>, and the <b>gluteus maximus</b>, your biggest muscle. The thigh has the <b>quadriceps</b> in front and the <b>hamstrings</b> behind; the <b>calf</b> pulls on the heel through the <b>Achilles tendon</b>, the strongest tendon in the body.</p>
    <p>Each muscle is joined to bone by a <b>tendon</b>, a tough white cord. Your smallest muscle, the <b>stapedius</b> in the ear, is about 1 mm long (see EarClear). And one of your hardest-working muscles is hidden inside: the <b>diaphragm</b>, a dome under the lungs that pulls down to suck air in, about 15 times a minute, all your life (see LungsClear).</p>
    <p>The heart and the walls of your gut are muscle too, of different kinds. The next chapter compares them, and <a href="/heartclear/">HeartClear</a> shows the heart at work.</p>
    <p class="tip"><b>Try it:</b> peel the layers from skin to muscle to bone. Pick "Legs" and watch them contract, then turn the body round to see the back.</p>`,
  terms: [
    { t: 'Skeletal muscle', d: 'Muscle fixed to bones by tendons, which you move when you choose to.' },
    { t: 'Tendon', d: 'A tough cord of collagen that joins a muscle to a bone.' },
    { t: 'Quadriceps', d: 'The four muscles on the front of the thigh that straighten the knee.' },
    { t: 'Hamstrings', d: 'The muscles on the back of the thigh that bend the knee.' },
    { t: 'Gluteus maximus', d: 'The big muscle of the buttock, the largest in the body.' },
    { t: 'Diaphragm', d: 'A dome of muscle under the lungs; it pulls down to breathe in.' },
  ],
  defaults: { layer: 1, explode: 0, group: 'all', side: 'front', labels: true },
  controls: [
    { key: 'layer', type: 'range', label: 'X-ray: peel the layers', min: 0, max: 2, step: 0.01, ends: ['skin', 'bones'], fmt: (v) => (v < 0.5 ? 'skin' : v < 1.5 ? 'muscles' : 'bones') },
    { key: 'explode', type: 'range', label: 'Take it apart', min: 0, max: 1, step: 0.01, ends: ['on the body', 'lifted off'], fmt: (v) => Math.round(v * 100) + '%' },
    { key: 'group', type: 'seg', label: 'Contract a group', options: Object.entries(GROUPS).map(([v, g]) => ({ v, label: g.label })) },
    { key: 'side', type: 'seg', label: 'Look at', options: [{ v: 'front', label: 'Front' }, { v: 'back', label: 'Back' }] },
    { key: 'labels', type: 'toggle', label: 'Labels' },
  ],
  quiz: [
    { q: 'About how much of your body mass is skeletal muscle?', options: ['About 5%', 'About a third', 'About 80%', 'Almost none'], answer: 1, why: 'MRI studies find about 38% in men and 31% in women: roughly a third of you is skeletal muscle.' },
    { q: 'What joins a muscle to a bone?', options: ['A ligament', 'A tendon', 'A nerve', 'Cartilage'], answer: 1, why: 'Tendons join muscle to bone. Ligaments join bone to bone.' },
    { q: 'Which muscle does most of the work when you breathe quietly?', options: ['The pectorals', 'The diaphragm', 'The biceps', 'The heart'], answer: 1, why: 'The diaphragm, a dome under the lungs, pulls down and sucks air in. It does about three quarters of the work of quiet breathing.' },
  ],
  reel: [
    { ms: 5200, caption: 'More than 600 muscles pull on your bones, and together they make up about a third of you.', set: { layer: 0.2, explode: 0, group: 'all', side: 'front', labels: false }, anim: { layer: [0.2, 1.1] }, view: { pos: [0.4, 9.4, 23], target: [0, 8.9, 0] }, spin: 0.5 },
    { ms: 5000, caption: 'Big ones like the quadriceps and the glutes move your legs; the diaphragm moves your breath.', set: { layer: 1, explode: 0, group: 'legs', side: 'front', labels: false }, anim: { explode: [0, 0.8] }, view: { pos: [0.4, 7.5, 21], target: [0, 7.4, 0] }, spin: 0.9 },
  ],

  build({ stage }) {
    const root = new THREE.Group(); stage.root.add(root);
    const body = makeBody(stage);
    root.add(body.root);
    const sides = sideLabels(stage, root, 2.6, 3.1, 1.4);
    stage.pickables.push(...body.list.map((e) => e.mesh), body.organ.heart, body.organ.stomach);
    const groupL = tint(stage.label('', [0, 18.2, 0], root), 'gold');
    let t = 0, lastToast = -9, rot = 0, layer = 1;
    const fit = fitNarrow(stage, { pos: [0, 15.2, 21], target: [0, 14.6, 0] });
    const ABOUT = {
      Biceps: 'The biceps bends your elbow. Chapter 4 works out how hard it pulls.',
      Triceps: 'The triceps straightens your elbow: the biceps’ partner.',
      Diaphragm: 'The diaphragm pulls down to breathe in. <a href="/lungsclear/">LungsClear</a> shows the lungs it fills.',
      'Gluteus maximus': 'The gluteus maximus is your largest muscle. It straightens the hip when you climb or stand up.',
    };
    return compactReadout(stage, {
      pick(o) {
        if (t - lastToast < 0.8) return; lastToast = t;
        if (o === body.organ.heart) { toast('The heart is cardiac muscle. <a href="/heartclear/">Open HeartClear</a> to see it pump.'); return; }
        if (o === body.organ.stomach) { toast('The stomach wall is smooth muscle. <a href="/digestionclear/">DigestionClear</a> shows it squeezing food along.'); return; }
        const e = o.userData.muscle; if (!e) return;
        const n = { deltoid: 'Deltoid', biceps: 'Biceps', triceps: 'Triceps', forearmF: 'Forearm flexors', forearmE: 'Forearm extensors', pecs: 'Pectorals', obliques: 'Obliques', scm: 'Sternocleidomastoid', lats: 'Latissimus dorsi', glutes: 'Gluteus maximus', quadRF: 'Quadriceps', quadVL: 'Quadriceps', quadVM: 'Quadriceps', hamL: 'Hamstrings', hamM: 'Hamstrings', calfL: 'Calf', calfM: 'Calf', tibAnt: 'Tibialis anterior', abs: 'Abdominals', trap: 'Trapezius', diaphragm: 'Diaphragm' }[e.k];
        toast(`<b>${n}</b>. ${ABOUT[n] || ''}`);
      },
      update(dt, s, time) {
        dt = Math.max(0, dt); t = time;
        layer += (s.layer - layer) * Math.min(1, dt * 6);
        body.setLayer(layer);
        body.setExplode(s.explode);
        body.face(stage.camera.position);
        const want = s.side === 'back' ? Math.PI : 0;
        rot += (want - rot) * Math.min(1, dt * 4);
        body.root.rotation.y = rot;
        // Breathing: about 15 breaths a minute, the diaphragm flattening on each breath in.
        const br = 0.5 - 0.5 * Math.cos((time * 2 * Math.PI * 15) / 60);
        // The chosen group contracts and relaxes about once every 1.6 s.
        const pulse = Math.pow(0.5 - 0.5 * Math.cos(time * 2 * Math.PI / 1.6), 2);
        body.highlight((e) => s.group === 'all' || e.grp === s.group || (s.group === 'breath' && e.k === 'abs'));
        body.list.forEach((e) => {
          if (e.k === 'diaphragm') { body.setAct(e, s.group === 'breath' ? pulse : br * 0.6); return; }
          const on = s.group !== 'all' && (e.grp === s.group || (s.group === 'breath' && e.k === 'abs'));
          body.setAct(e, on ? pulse : 0);
        });
        const narrow = fit();
        const lab = s.labels && !inReel() && !narrow && s.explode < 0.35;
        const back = Math.abs(rot) > Math.PI / 2;
        body.showLabels(lab && !back, lab && back);
        sides.forEach((l) => { l.visible = s.labels && !narrow && !inReel() && !back; });
        groupL.element.textContent = s.group === 'all' ? '' : `${GROUPS[s.group].label}: contracting`;
        groupL.visible = s.labels && !inReel() && s.group !== 'all';
      },
      readout: (s) => {
        const g = GROUPS[s.group];
        return `<div class="big">${s.group === 'all' ? 'More than 600 muscles' : g.label}</div>
          ${g.rows.map(([a, b]) => `<div class="row"><span>${a}</span><b>${b}</b></div>`).join('')}
          <small>${s.layer > 1.5 ? 'Bones show through: SkeletonClear covers them.' : 'Red: skeletal muscle. White: tendons. Pink: the diaphragm and the heart.'}</small>`;
      },
    });
  },
};
