// Optional developer check: node tests/mixer.test.cjs (no packages needed).
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const source = fs.readFileSync(path.join(__dirname, '../js/mixer.js'), 'utf8');
const m = vm.runInNewContext(source + '\nMixer');
const sample = m.example();
assert.equal(m.total(sample.sections), 40);
sample.sections[1].locked = true;
for (let i = 0; i < 8; i++) m.resize(sample, -1);
assert.equal(m.clock(m.total(sample.sections)), '08:00');
assert.equal(m.clock(sample.sections[1].ticks), '04:00');
assert(m.valid(JSON.parse(JSON.stringify(sample))));
for (const bad of [null, {}, { ...sample, title: '  ' }, { ...sample, sections: [] }]) {
  assert(!m.valid(bad));
}
assert(Number.isNaN(m.parseClock('2:60')));
assert(!Number.isInteger(m.parseClock('01:17')));
assert.equal(m.parseClock('00:15'), 1);

// Enumerate every lock pattern and fader target, including out-of-range values.
let cases = 0;
for (let mask = 0; mask < 16; mask++) {
  for (let channel = 0; channel < 4; channel++) {
    for (let value = -1; value <= 42; value++) {
      const plan = m.example();
      plan.sections.forEach((s,i) => { s.locked = Boolean(mask & (1 << i)); });
      const before = plan.sections.map(s => s.ticks);
      m.move(plan, channel, value);
      assert(m.valid(plan));
      assert.equal(m.total(plan.sections), 40);
      plan.sections.forEach((s,i) => { if (s.locked) assert.equal(s.ticks,before[i]); });
      cases++;
    }
  }
}
console.log(cases + ' fader cases passed, plus sample, restore schema, and time parsing checks.');
