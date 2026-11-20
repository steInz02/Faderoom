'use strict';
const $ = id => document.getElementById(id);
const KEY = 'faderoom.plan.v1';
const clone = value => JSON.parse(JSON.stringify(value));
let plan = Mixer.example();
let storageOK = true;
try {
  const raw = localStorage.getItem(KEY);
  if (raw) {
    const restored = JSON.parse(raw);
    if (!Mixer.valid(restored)) throw new Error('Invalid draft');
    plan = restored;
  }
} catch {
  $('status').textContent = 'Your draft could not be loaded. The example is ready.';
}
function save() {
  try { localStorage.setItem(KEY, JSON.stringify(plan)); storageOK = true; }
  catch { storageOK = false; }
  $('storage').textContent = storageOK ? 'Saved locally' : 'Session only';
}
function make(tag, className, content) {
  const el = document.createElement(tag);
  if (className) el.className = className;
  if (content !== undefined) el.textContent = content;
  return el;
}
// Keep the range elements mounted while dragging, so pointer capture and
// keyboard focus survive every live update.
function buildChannels() {
  $('channels').replaceChildren();
  plan.sections.forEach((s,i) => {
    const row = make('div','channel');
    row.style.setProperty('--tone',Mixer.tones[i]);
    const track = make('div','track');
    const fader = make('input');
    fader.type = 'range'; fader.min = 1; fader.step = 1;
    fader.setAttribute('aria-label','Time for ' + s.name);
    let beforeDrag = null;
    fader.onpointerdown = () => { beforeDrag = clone(plan); };
    fader.onpointerup = fader.onpointercancel = fader.onblur = () => { beforeDrag = null; };
    fader.oninput = () => {
      const value = Number(fader.value);
      if (beforeDrag) plan = clone(beforeDrag);
      Mixer.move(plan,i,value);
      refresh();
    };
    const lock = make('button','lock');
    lock.onclick = () => { plan.sections[i].locked = !plan.sections[i].locked; refresh(); };
    track.append(fader);
    row.append(make('span','num',String(i+1).padStart(2,'0')),make('strong','',s.name),track,make('span','time'),lock);
    $('channels').append(row);
  });
  refresh();
}
function refresh() {
  const sum = Mixer.total(plan.sections);
  $('total').textContent = $('slot').textContent = Mixer.clock(sum);
  $('screenTitle').textContent = plan.title;
  const open = plan.sections.filter(s => !s.locked);
  $('summary').textContent = plan.sections.length + ' CHANNELS  /  ' + (plan.sections.length-open.length) + ' LOCKED';
  $('minus').disabled = Mixer.total(open) <= open.length;
  $('plus').disabled = !open.length || sum >= Mixer.LIMIT;
  const timeline = document.querySelector('.timeline');
  timeline.replaceChildren(); $('cues').replaceChildren();
  let start = 0;
  plan.sections.forEach((s,i) => {
    const row = $('channels').children[i], slider = row.querySelector('input'), lock = row.querySelector('button');
    slider.max = Mixer.maximum(plan,i); slider.value = s.ticks;
    slider.disabled = s.locked || !Mixer.peers(plan,i).length || Number(slider.max) <= 1;
    slider.setAttribute('aria-valuetext',Mixer.clock(s.ticks));
    row.querySelector('.time').textContent = Mixer.clock(s.ticks);
    lock.textContent = s.locked ? 'Locked' : 'Lock';
    lock.setAttribute('aria-label','Lock duration for ' + s.name);
    lock.setAttribute('aria-pressed',s.locked);
    const bar = make('i'); bar.style.background = Mixer.tones[i]; bar.style.flex = s.ticks;
    timeline.append(bar);
    const cue = make('li');
    cue.append(make('b','',Mixer.clock(start)+' – '+Mixer.clock(start+s.ticks)),make('span','',s.name));
    $('cues').append(cue);
    start += s.ticks;
  });
  save();
}
$('minus').onclick = () => { Mixer.resize(plan,-1); refresh(); };
$('plus').onclick = () => { Mixer.resize(plan,1); refresh(); };
function loadExample() {
  plan = Mixer.example(); buildChannels(); $('status').textContent = 'Example loaded. Try locking the prototype and shortening the slot.';
}
$('example').onclick = () => {
  if (JSON.stringify(plan) === JSON.stringify(Mixer.example())) loadExample();
  else $('confirm').showModal();
};
$('keep').onclick = () => $('confirm').close();
$('load').onclick = () => { $('confirm').close(); loadExample(); };
$('export').onclick = () => exportCard(clone(plan),ok => {
  $('status').textContent = ok ? 'Cue sheet exported as PNG.' : 'Export failed. Please try again.';
});
function updateRows() {
  $('form').querySelectorAll('input').forEach(input => input.setCustomValidity(''));
  const rows = [...$('rows').children];
  rows.forEach((row,i) => {
    const inputs = row.querySelectorAll('input');
    inputs[0].setAttribute('aria-label','Name of section ' + (i+1));
    inputs[1].setAttribute('aria-label','Duration of section ' + (i+1));
    const remove = row.querySelector('button');
    remove.disabled = rows.length <= 2;
    remove.setAttribute('aria-label','Remove section ' + (i+1));
  });
  $('add').disabled = rows.length >= 6;
}
function addRow(name,time) {
  const row = make('div','edit-row'), label = make('input'), duration = make('input');
  label.value = name; label.maxLength = 48; label.required = true;
  duration.value = time; duration.required = true; duration.placeholder = '02:00';
  const remove = make('button','','×'); remove.type = 'button';
  remove.onclick = () => { row.remove(); updateRows(); };
  row.append(label,duration,remove); $('rows').append(row); updateRows();
  return label;
}
$('edit').onclick = () => {
  $('name').setCustomValidity('');
  $('name').value = plan.title; $('rows').replaceChildren();
  plan.sections.forEach(s => addRow(s.name,Mixer.clock(s.ticks)));
  $('editor').showModal();
};
$('add').onclick = () => addRow('','01:00').focus();
$('cancel').onclick = () => $('editor').close();
$('form').oninput = () => $('form').querySelectorAll('input').forEach(el => el.setCustomValidity(''));
$('form').onsubmit = event => {
  event.preventDefault();
  const title = $('name').value.trim();
  if (!title) $('name').setCustomValidity('Enter a program name.');
  const sections = [...$('rows').children].map(row => {
    const [label,duration] = row.querySelectorAll('input');
    const name = label.value.trim(), ticks = Mixer.parseClock(duration.value.trim());
    if (!name) label.setCustomValidity('Enter a section or speaker name.');
    if (!Number.isInteger(ticks) || ticks < 1) duration.setCustomValidity('Use MM:SS in 15-second steps, such as 01:45.');
    return {name,ticks,locked:false};
  });
  if (Mixer.total(sections) > Mixer.LIMIT) $('rows').lastChild.querySelectorAll('input')[1].setCustomValidity('The entire slot must fit within 60 minutes.');
  if (!$('form').reportValidity()) return;
  plan = {title,sections}; $('editor').close(); buildChannels();
  $('status').textContent = 'Program applied.';
};
buildChannels();
