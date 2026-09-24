(() => {
  let ctx = null;
  let master = null;

  function ensure() {
    if (ctx) {
      if (ctx.state === 'suspended') ctx.resume().catch(()=>{});
      return true;
    }
    try {
      ctx = new (window.AudioContext || window.webkitAudioContext)();
      master = ctx.createGain();
      master.gain.value = 0.13;
      master.connect(ctx.destination);
      return true;
    } catch (_) {
      return false;
    }
  }

  function enabled() { return GameSettings.get().sound !== false; }

  function tone(freq=440, duration=.06, type='sine', volume=.35, slide=0) {
    if (!enabled() || !ensure()) return;
    const now=ctx.currentTime;
    const osc=ctx.createOscillator(), gain=ctx.createGain();
    osc.type=type;
    osc.frequency.setValueAtTime(freq,now);
    if(slide) osc.frequency.exponentialRampToValueAtTime(Math.max(40,freq+slide),now+duration);
    gain.gain.setValueAtTime(Math.max(.0001,volume),now);
    gain.gain.exponentialRampToValueAtTime(.0001,now+duration);
    osc.connect(gain);gain.connect(master);
    osc.start(now);osc.stop(now+duration+.015);
  }

  const api = {
    unlock: ensure,
    click(){ tone(520,.035,'square',.16,40); },
    jump(){ tone(150,.055,'triangle',.18,120); },
    checkpoint(){ tone(540,.07,'sine',.22,250); setTimeout(()=>tone(760,.08,'sine',.16,120),55); },
    fail(){ tone(180,.18,'sawtooth',.16,-90); },
    finish(){ tone(440,.09,'triangle',.18,220); setTimeout(()=>tone(660,.10,'triangle',.18,260),80); setTimeout(()=>tone(880,.14,'triangle',.16,300),165); },
    record(){ tone(660,.08,'sine',.16,220); setTimeout(()=>tone(990,.16,'sine',.18,300),90); }
  };
  window.GameSound=api;
})();