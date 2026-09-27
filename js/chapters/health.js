// Chapter 6: keeping muscles healthy. The ghosted body shows where common problems happen; an
// age slider shrinks the muscles as they would with age, with and without strength training.
// Always "see a doctor": no diagnosis or dosing advice.
// Sources:
//  - Strains: most often the hamstrings, quadriceps, calf and groin; graded I (a few fibres) to III
//    (a full tear) (NHS "Sprains and strains"; Cleveland Clinic "Muscle strain"). Seek care for a
//    popping sound, being unable to walk or bear weight, severe pain or swelling, or no improvement
//    in a couple of weeks (NHS).
//  - Sarcopenia: muscle mass falls about 3–8% per decade after 30, faster after 60 (Volpi et al.,
//    Curr Opin Clin Nutr Metab Care 7:405, 2004); the model is muscleLeft() in muscle.js. The term
//    was coined by Irwin Rosenberg in 1988–89. Strength training helps at any age: frail people in
//    their 90s gained about 174% in strength in 8 weeks (Fiatarone et al., JAMA 263:3029, 1990).
//  - Warm-up: raising muscle temperature improves power, roughly 4% per °C (Bergh & Ekblom, Acta
//    Physiol Scand 107:33, 1979); about 10–20 minutes of easy movement raises it by 1–3 °C.
//  - WHO Guidelines on physical activity and sedentary behaviour (2020): adults, muscle-strengthening
//    activity for all major muscle groups on 2 or more days a week; children 5–17, on at least
//    3 days a week; older adults, also balance and strength work on 3 or more days.
//  - Protein: ICMR-NIN Nutrient Requirements for Indians (2020): an adult needs about 0.8 g of
//    protein per kg of body weight a day (0.83 g/kg safe level). Protein works with exercise; it
//    does not build muscle on its own.
//  - Duchenne muscular dystrophy: a genetic condition that affects about 1 in 3,500–5,000 boys
//    born, in which the protein dystrophin is missing (MedlinePlus Genetics; NIH NINDS).
import { THREE, M, clamp, lerp, smooth, canvasTexture } from '../kit.js';
import { makeBody, muscleLeft, board, panel, tint, fitNarrow, compactReadout, inReel } from '../muscle.js';

const COND = {
  strain: { label: 'Strains', title: 'A pulled muscle (strain)', hot: ['hamL', 'hamM', 'calfL', 'calfM', 'quadRF'],
    rows: [['What happens', 'fibres overstretch and tear'], ['Common in', 'hamstrings, calf, thigh, groin'], ['Grades', 'I: a few fibres · III: a full tear'], ['Usually', 'better in weeks with rest']],
    small: 'See a doctor for a pop, if you can’t walk on it, or if pain and swelling are bad or last.' },
  age: { label: 'Ageing', title: 'Sarcopenia: muscle loss with age', hot: null,
    rows: [], small: 'Strength training slows the loss at any age. Talk to a doctor before starting if you are frail or unwell.' },
  warm: { label: 'Warm-up', title: 'Warm up, cool down', hot: ['quadRF', 'quadVL', 'quadVM', 'hamL', 'hamM', 'calfL', 'calfM', 'glutes'],
    rows: [['Warm-up', '10–20 min of easy movement'], ['Muscle temperature', 'up about 1–3 °C'], ['Power', 'about 4% more per °C'], ['Then', 'stretch gently when warm']],
    small: 'Warm muscles are more elastic and faster, and a gentle start readies the heart and joints too.' },
  build: { label: 'Build it', title: 'Exercise and protein', hot: ['biceps', 'triceps', 'deltoid', 'pecs', 'abs', 'quadRF', 'quadVL', 'quadVM', 'glutes', 'hamL', 'hamM', 'lats'],
    rows: [['Adults (WHO)', 'strength work 2+ days a week'], ['Ages 5–17 (WHO)', 'strong muscles and bones 3 days a week'], ['Protein (ICMR-NIN)', 'about 0.8 g per kg a day'], ['Good sources', 'dal, milk, curd, paneer, eggs, fish, nuts']],
    small: 'Protein supports exercise; it does not build muscle alone. Sleep matters too.' },
};

function drawAge(g, w, h, st) {
  panel(g, w, h);
  const L0 = 100, R0 = w - 40, T0 = 92, B0 = h - 70, x = (a) => L0 + ((a - 20) / 70) * (R0 - L0), y = (m) => B0 - ((m - 0.5) / 0.5) * (B0 - T0);
  g.fillStyle = '#e8eef8'; g.font = 'bold 30px sans-serif'; g.fillText('Muscle mass with age', 36, 52);
  g.strokeStyle = 'rgba(255,255,255,.18)'; g.beginPath(); g.moveTo(L0, T0 - 10); g.lineTo(L0, B0); g.lineTo(R0, B0); g.stroke();
  g.fillStyle = 'rgba(255,255,255,.55)'; g.font = '22px sans-serif';
  [20, 40, 60, 80].forEach((a) => g.fillText(a, x(a) - 12, B0 + 32)); g.fillText('age', R0 - 40, B0 + 60);
  [0.5, 0.75, 1].forEach((m) => g.fillText(Math.round(m * 100) + '%', 22, y(m) + 8));
  [[false, '#ff8a8a', 'inactive'], [true, '#6ee7a8', 'strength training']].forEach(([act, col, name]) => {
    g.strokeStyle = col; g.lineWidth = act === st.active ? 6 : 3; g.globalAlpha = act === st.active ? 1 : 0.5; g.beginPath();
    for (let a = 20; a <= 90; a += 1) { const X = x(a), Y = y(muscleLeft(a, act)); a === 20 ? g.moveTo(X, Y) : g.lineTo(X, Y); }
    g.stroke(); g.globalAlpha = 1; g.lineWidth = 1;
    g.fillStyle = col; g.fillText(name, x(62), y(muscleLeft(88, act)) - (act ? 14 : -30));
  });
  g.fillStyle = '#ffffff'; g.beginPath(); g.arc(x(st.age), y(muscleLeft(st.age, st.active)), 11, 0, 7); g.fill();
}

export default {
  id: 'health',
  short: 'Keeping them strong',
  title: 'Looking after your muscles',
  subtitle: 'Strains, muscle loss with age, warming up, and what exercise and protein do.',
  view: { pos: [-3.4, 9.0, 25], target: [-5.4, 8.6, 0] },
  learn: `<p>This chapter explains common muscle problems in general; it cannot tell you what is happening in your own body. For pain, weakness or an injury that worries you, <b>see a doctor</b>.</p>
    <p>A <b>strain</b>, or pulled muscle, is fibres overstretched or torn, often in the <b>hamstrings</b>, calf or thigh during a sprint or a sudden stretch. Most mild strains get better in a few weeks with rest and then gentle movement. See a doctor if you heard a pop, can't walk on it, or the pain and swelling are bad or don't improve.</p>
    <p>From about age 30, muscle slowly shrinks: about <b>3–8% each decade</b>, faster after 60. Severe loss that weakens a person is called <b>sarcopenia</b>, and it raises the risk of falls. The good news: strength training helps at any age. In one famous study, people in their 90s nearly <b>tripled</b> their strength in 8 weeks.</p>
    <p>A <b>warm-up</b> of 10–20 minutes of easy movement raises muscle temperature by a degree or two, and warm muscle is more elastic and a few per cent more powerful per degree. The WHO suggests <b>strength activities</b> for all the big muscle groups on at least <b>2 days a week</b> for adults and <b>3 days</b> for ages 5 to 17: push-ups, squats, climbing, carrying, yoga, dancing or sport all count. Muscles are built from <b>protein</b>: Indian guidelines suggest about <b>0.8 g per kg</b> of body weight a day for adults, from dal, milk, curd, paneer, eggs, fish or nuts. Protein only helps if the muscle is also used.</p>
    <p>Some conditions are genetic. In <b>Duchenne muscular dystrophy</b>, which affects about 1 boy in every 3,500–5,000, a missing protein called dystrophin lets muscle fibres break down over time.</p>
    <p class="tip"><b>Try it:</b> pick "Ageing" and slide the age from 20 to 90, then switch on strength training and compare the curves.</p>`,
  terms: [
    { t: 'Strain', d: 'A pulled muscle: fibres overstretched or torn.' },
    { t: 'Sarcopenia', d: 'Loss of muscle mass and strength with age, enough to weaken a person.' },
    { t: 'Warm-up', d: 'Easy movement before exercise that warms the muscles and readies the heart.' },
    { t: 'Protein', d: 'The building material of muscle fibres, from food such as dal, milk, eggs and fish.' },
    { t: 'Muscular dystrophy', d: 'A group of genetic conditions in which muscle fibres weaken and break down.' },
  ],
  defaults: { cond: 'age', age: 30, active: false, labels: true },
  controls: [
    { key: 'cond', type: 'seg', label: 'Topic', options: Object.entries(COND).map(([v, c]) => ({ v, label: c.label })) },
    { key: 'age', type: 'range', label: 'Age', min: 20, max: 90, step: 1, ends: ['20', '90'], fmt: (v) => Math.round(v) + ' years' },
    { key: 'active', type: 'toggle', label: 'Strength training twice a week', hint: 'The training curve is an illustration: halving the loss rate.' },
    { key: 'labels', type: 'toggle', label: 'Labels' },
  ],
  quiz: [
    { q: 'After about age 30, how fast does muscle mass usually fall without training?', options: ['About 3–8% per decade', 'About half every year', 'It never changes', 'It doubles'], answer: 0, why: 'Studies find a loss of roughly 3–8% per decade after 30, speeding up after 60.' },
    { q: 'What does the WHO suggest for adults’ muscles?', options: ['Nothing', 'Strength activities on at least 2 days a week', 'Only walking', 'Protein powder every day'], answer: 1, why: 'WHO advises muscle-strengthening activities for all major muscle groups on 2 or more days a week.' },
    { q: 'You feel a pop in your calf while sprinting and cannot walk on it. What should you do?', options: ['Keep running', 'Stop and see a doctor', 'Stretch it hard', 'Ignore it'], answer: 1, why: 'A pop and being unable to bear weight can mean a bad tear. Stop, rest it and get it checked.' },
  ],
  reel: [
    { ms: 5200, caption: 'From about thirty, muscle shrinks by 3 to 8 percent a decade, but strength training slows it at any age.', set: { cond: 'age', age: 30, active: false, labels: false }, anim: { age: [30, 85] }, view: { pos: [-2.4, 9.2, 24], target: [-3.6, 8.8, 0] }, spin: 0 },
  ],

  build({ stage }) {
    const root = new THREE.Group(); stage.root.add(root);
    const body = makeBody(stage, { labels: false, organs: false });
    root.add(body.root);
    const st = { age: 30, active: false };
    const chart = canvasTexture(900, 600, (g, w, h) => drawAge(g, w, h, st));
    const cb = board(chart, 6.2, 6.2 * 600 / 900); cb.position.set(-11.6, 4.2, -0.5); cb.rotation.y = 0.15; root.add(cb);
    const L = (h, p, c) => tint(stage.label(h, p, root), c);
    const tag = { strain: L('Common strain sites', [-2.8, 5.6, 0.6], 'red'), warm: L('Warm the big leg muscles first', [-3.2, 6.5, 0.6], 'orange'), build: L('All the major groups, 2+ days a week', [0, 18.3, 0], 'good') };
    let t = 0, acc = 0, key = '';
    const fit = fitNarrow(stage, { pos: [0, 15.2, 21], target: [0, 14.6, 0] });
    return compactReadout(stage, {
      update(dt, s) {
        dt = Math.max(0, dt); t += dt;
        const c = COND[s.cond];
        body.setLayer(1);
        // ageing shrinks every belly's cross-section in proportion to the mass left
        const m = s.cond === 'age' ? muscleLeft(s.age, s.active) : 1;
        body.shrink(m);
        body.face(stage.camera.position);
        const pulse = 0.5 + 0.5 * Math.sin(t * 4);
        body.highlight((e) => !c.hot || c.hot.includes(e.k));
        body.list.forEach((e) => { if (e.inner) return; const hot = c.hot && c.hot.includes(e.k); e.mat.emissiveIntensity = hot ? (s.cond === 'strain' ? 0.25 + 0.6 * pulse : 0.45) : 0.06; if (s.cond === 'strain' && hot) e.mat.color.setHex(0xff9aa0); });
        cb.visible = s.cond === 'age';
        st.age = s.age; st.active = s.active;
        const k2 = `${s.age}|${s.active}`; acc += dt; if (k2 !== key && acc > 0.05) { key = k2; acc = 0; chart.redraw(); }
        const narrow = fit(), on = s.labels && !inReel() && !narrow;
        Object.entries(tag).forEach(([k, l]) => { l.visible = on && s.cond === k; });
      },
      readout: (s) => {
        const c = COND[s.cond];
        if (s.cond === 'age') {
          const a = muscleLeft(s.age, false), b = muscleLeft(s.age, true);
          return `<div class="big">Muscle at ${Math.round(s.age)}</div>
            <div class="row"><span>Compared with age 30</span><b>${Math.round((s.active ? b : a) * 100)}%</b></div>
            <div class="row"><span>Loss rate now, inactive</span><b>${s.age < 30 ? 'none yet' : `about ${lerp(3, 8, smooth((s.age - 30) / 40)).toFixed(1)}% per decade`}</b></div>
            <div class="row"><span>Inactive · training</span><b>${Math.round(a * 100)}% · ${Math.round(b * 100)}%</b></div>
            <small>${c.small}</small>`;
        }
        return `<div class="big">${c.title}</div>${c.rows.map(([x, y]) => `<div class="row"><span>${x}</span><b>${y}</b></div>`).join('')}<small>${c.small}</small>`;
      },
    });
  },
};
