// Each tick is 15 seconds. Integer arithmetic keeps cue boundaries exact.
const Mixer = (() => {
  const LIMIT = 240; // One hour per program.
  const tones = ['#ff783d', '#dbd5bd', '#a9b99a', '#a2b8c6', '#c6a4aa', '#d7b37e'];
  const example = () => ({
    title: 'Fairview capstone defense',
    sections: [
      { name: 'Mika · The problem', ticks: 6, locked: false },
      { name: 'Paolo · Prototype', ticks: 16, locked: false },
      { name: 'Bea · User testing', ticks: 10, locked: false },
      { name: 'Luis · Findings', ticks: 8, locked: false }
    ]
  });
  const total = sections => sections.reduce((sum, s) => sum + s.ticks, 0);
  function clock(ticks) {
    const seconds = ticks * 15;
    return String(Math.floor(seconds / 60)).padStart(2, '0') + ':' + String(seconds % 60).padStart(2, '0');
  }
  function parseClock(value) {
    if (!/^\d{1,2}:[0-5]\d$/.test(value)) return NaN;
    const [min, sec] = value.split(':').map(Number);
    return (min * 60 + sec) / 15;
  }
  const cleanName = value => typeof value === 'string' && value.trim().length > 0 && value.length <= 48;
  function valid(plan) {
    return plan && cleanName(plan.title) && Array.isArray(plan.sections) &&
      plan.sections.length >= 2 && plan.sections.length <= 6 &&
      plan.sections.every(s => s && cleanName(s.name) && Number.isInteger(s.ticks) &&
        s.ticks >= 1 && typeof s.locked === 'boolean') && total(plan.sections) <= LIMIT;
  }
  // Reserve one tick per receiver, then share the rest in proportion to
  // spare ticks. Give rounding leftovers to the largest fractional shares.
  function distribute(sections, budget) {
    if (!sections.length || budget < sections.length) return;
    let weights = sections.map(s => s.ticks - 1);
    if (!weights.some(Boolean)) weights = weights.map(() => 1);
    const sum = weights.reduce((a,b) => a+b, 0);
    const shares = weights.map(w => (budget - sections.length) * w / sum);
    sections.forEach((s,i) => { s.ticks = 1 + Math.floor(shares[i]); });
    const ranked = shares.map((v,i) => ({i, fraction:v % 1}))
      .sort((a,b) => b.fraction - a.fraction || a.i - b.i);
    const leftover = budget - total(sections);
    for (let i = 0; i < leftover; i++) sections[ranked[i].i].ticks++;
  }
  function peers(plan, index) {
    return plan.sections.filter((s,i) => i !== index && !s.locked);
  }
  function maximum(plan, index) {
    const others = peers(plan,index);
    return plan.sections[index].ticks + total(others) - others.length;
  }
  function move(plan, index, value) {
    const target = plan.sections[index], others = peers(plan,index);
    if (target.locked || !others.length || !Number.isInteger(value)) return;
    const next = Math.max(1, Math.min(maximum(plan,index), value));
    distribute(others, total(others) + target.ticks - next);
    target.ticks = next;
  }
  function resize(plan, delta) {
    const open = plan.sections.filter(s => !s.locked);
    const budget = total(open) + delta;
    if (!open.length || budget < open.length || total(plan.sections) + delta > LIMIT) return;
    distribute(open,budget);
  }
  return {LIMIT, tones, example, clock, parseClock, valid, total, maximum, peers, move, resize};
})();
