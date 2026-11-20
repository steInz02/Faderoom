// Draw from the plan itself so the download stays sharp at any screen size.
function exportCard(plan, done) {
  const canvas = document.createElement('canvas');
  canvas.width = 1100;
  canvas.height = 320 + plan.sections.length * 86;
  const ctx = canvas.getContext('2d');
  const ink = '#262721';
  ctx.fillStyle = '#f5f2e9';
  ctx.fillRect(0,0,canvas.width,canvas.height);
  ctx.fillStyle = ink;
  ctx.fillRect(0,0,1100,184);
  ctx.fillStyle = '#ff783d';
  ctx.font = 'bold 22px monospace';
  ctx.fillText('FADEROOM  /  FR–01',48,54);
  ctx.fillStyle = '#f5f2e9';
  ctx.font = 'bold 50px sans-serif';
  ctx.fillText(plan.title,48,134,1000);
  ctx.fillStyle = ink;
  ctx.font = '20px monospace';
  ctx.fillText('ELAPSED TIME',48,236);
  ctx.fillText('SECTION / SPEAKER',352,236);
  let start = 0;
  plan.sections.forEach((s,i) => {
    const y = 264 + i * 86;
    ctx.fillStyle = '#c2bfb3';
    ctx.fillRect(48,y,1004,2);
    ctx.fillStyle = Mixer.tones[i];
    ctx.fillRect(48,y+17,9,38);
    ctx.fillStyle = ink;
    ctx.font = 'bold 24px monospace';
    ctx.fillText(Mixer.clock(start) + ' – ' + Mixer.clock(start+s.ticks),72,y+45);
    ctx.font = 'bold 29px sans-serif';
    ctx.fillText(s.name,352,y+46,690);
    start += s.ticks;
  });
  ctx.font = 'bold 20px monospace';
  ctx.fillText('END OF PROGRAM  /  ' + Mixer.clock(start),48,canvas.height-32);
  canvas.toBlob(blob => {
    if (!blob) { done(false); return; }
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.download = (plan.title.replace(/[^\p{L}\p{N}]+/gu,'-').replace(/^-|-$/g,'') || 'program') + '-cue-sheet.png';
    link.href = url;
    document.body.append(link);
    link.click();
    link.remove();
    setTimeout(() => URL.revokeObjectURL(url),60000);
    done(true);
  },'image/png');
}
