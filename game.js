(() => {
  'use strict';

  const $ = (s) => document.querySelector(s);
  const canvas = $('#game');
  const gl = canvas.getContext('webgl', { antialias: true, alpha: false, powerPreference: 'high-performance' });
  const fatal = $('#fatal');
  if (!gl) {
    fatal.classList.remove('hidden');
    fatal.textContent = 'WebGL недоступен. Включите аппаратное ускорение браузера.';
    return;
  }

  // ---------- UI ----------
  const hud = $('#hud'), startScreen = $('#startScreen'), pauseScreen = $('#pauseScreen'), finishScreen = $('#finishScreen');
  const timerEl = $('#timer'), bestEl = $('#best'), speedEl = $('#speed'), cpLabel = $('#cpLabel'), cpFill = $('#cpFill');
  const finishTimeEl = $('#finishTime'), recordBadge = $('#recordBadge');
  const playBtn = $('#playBtn'), resumeBtn = $('#resumeBtn'), againBtn = $('#againBtn');
  const restartBtn = $('#restartBtn'), pauseBtn = $('#pauseBtn'), pauseRestartBtn = $('#pauseRestartBtn');

  const isTouch = matchMedia('(pointer: coarse)').matches || navigator.maxTouchPoints > 0;

  const formatTime = (ms) => {
    if (!Number.isFinite(ms)) return '--:--.---';
    const total = Math.max(0, Math.floor(ms));
    const min = Math.floor(total / 60000);
    const sec = Math.floor((total % 60000) / 1000);
    const milli = total % 1000;
    return `${String(min).padStart(2,'0')}:${String(sec).padStart(2,'0')}.${String(milli).padStart(3,'0')}`;
  };

  // ---------- WebGL ----------
  const vsrc = `
    attribute vec3 aPos;
    attribute vec3 aNormal;
    uniform vec3 uCenter;
    uniform vec3 uSize;
    uniform vec3 uCamPos;
    uniform vec3 uCamRight;
    uniform vec3 uCamUp;
    uniform vec3 uCamForward;
    uniform float uAspect;
    uniform float uTanHalf;
    uniform float uNear;
    uniform float uFar;
    varying vec3 vNormal;
    varying float vDist;
    void main(){
      vec3 world = aPos * uSize + uCenter;
      vec3 rel = world - uCamPos;
      vec3 view = vec3(dot(rel,uCamRight), dot(rel,uCamUp), dot(rel,uCamForward));
      float z = max(view.z, 0.001);
      float A = (uFar + uNear) / (uFar - uNear);
      float B = (-2.0 * uFar * uNear) / (uFar - uNear);
      gl_Position = vec4(view.x/(uAspect*uTanHalf), view.y/uTanHalf, A*z+B, z);
      vNormal = aNormal;
      vDist = length(rel);
    }
  `;
  const fsrc = `
    precision mediump float;
    uniform vec3 uColor;
    uniform vec3 uFog;
    varying vec3 vNormal;
    varying float vDist;
    void main(){
      vec3 light = normalize(vec3(-0.35,0.86,-0.38));
      float diff = max(0.0, dot(normalize(vNormal), light));
      float shade = 0.48 + diff*0.52;
      vec3 col = uColor * shade;
      float fog = smoothstep(42.0, 115.0, vDist);
      col = mix(col, uFog, fog);
      gl_FragColor = vec4(col,1.0);
    }
  `;

  function compile(type, src){
    const sh = gl.createShader(type); gl.shaderSource(sh,src); gl.compileShader(sh);
    if (!gl.getShaderParameter(sh,gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(sh));
    return sh;
  }
  const program = gl.createProgram();
  gl.attachShader(program, compile(gl.VERTEX_SHADER,vsrc));
  gl.attachShader(program, compile(gl.FRAGMENT_SHADER,fsrc));
  gl.linkProgram(program);
  if (!gl.getProgramParameter(program,gl.LINK_STATUS)) throw new Error(gl.getProgramInfoLog(program));
  gl.useProgram(program);

  const loc = {};
  ['aPos','aNormal','uCenter','uSize','uCamPos','uCamRight','uCamUp','uCamForward','uAspect','uTanHalf','uNear','uFar','uColor','uFog'].forEach(n => {
    loc[n] = n[0] === 'a' ? gl.getAttribLocation(program,n) : gl.getUniformLocation(program,n);
  });

  const verts = [];
  function face(nx,ny,nz,a,b,c,d){
    [a,b,c,a,c,d].forEach(p => verts.push(...p,nx,ny,nz));
  }
  const p000=[-.5,-.5,-.5], p001=[-.5,-.5,.5], p010=[-.5,.5,-.5], p011=[-.5,.5,.5];
  const p100=[.5,-.5,-.5], p101=[.5,-.5,.5], p110=[.5,.5,-.5], p111=[.5,.5,.5];
  face( 1,0,0,p100,p110,p111,p101); face(-1,0,0,p000,p001,p011,p010);
  face(0, 1,0,p010,p011,p111,p110); face(0,-1,0,p000,p100,p101,p001);
  face(0,0, 1,p001,p101,p111,p011); face(0,0,-1,p000,p010,p110,p100);
  const vbo = gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER,vbo); gl.bufferData(gl.ARRAY_BUFFER,new Float32Array(verts),gl.STATIC_DRAW);
  gl.enableVertexAttribArray(loc.aPos); gl.vertexAttribPointer(loc.aPos,3,gl.FLOAT,false,24,0);
  gl.enableVertexAttribArray(loc.aNormal); gl.vertexAttribPointer(loc.aNormal,3,gl.FLOAT,false,24,12);
  gl.enable(gl.DEPTH_TEST); gl.depthFunc(gl.LEQUAL); gl.disable(gl.CULL_FACE);

  const fog = [0.035,0.055,0.078];
  gl.uniform1f(loc.uNear,.05); gl.uniform1f(loc.uFar,140); gl.uniform3fv(loc.uFog,fog); gl.uniform1f(loc.uTanHalf,Math.tan(76*Math.PI/360));

  function resize(){
    const dpr = Math.min(devicePixelRatio || 1, isTouch ? 1.5 : 2);
    const w = Math.max(1, Math.floor(innerWidth*dpr)), h = Math.max(1, Math.floor(innerHeight*dpr));
    if (canvas.width!==w || canvas.height!==h){canvas.width=w;canvas.height=h;gl.viewport(0,0,w,h);}
    gl.uniform1f(loc.uAspect,w/h);
  }
  addEventListener('resize',resize); resize();

  const COLOR = {
    concrete:[0.26,0.29,0.34], dark:[0.12,0.15,0.18], acid:[0.68,0.85,0.08], cyan:[0.08,0.52,0.65], red:[0.74,0.12,0.19], metal:[0.38,0.43,0.48], black:[0.035,0.045,0.058]
  };
  const boxes = [];
  const addBox = (x,y,z,sx,sy,sz,color='concrete',solid=true,tag='') => boxes.push({x,y,z,sx,sy,sz,color:COLOR[color]||color,solid,tag});

  // ---------- Course ----------
  addBox(0,0,0,12,2,14,'concrete',true,'start');
  addBox(0,-2,55,70,1,130,'black',false,'void-floor');
  // LEVEL 1: intentionally forgiving tutorial line.
  // Wide pads, short gaps and small side offsets let new players learn
  // holding jump + gentle A/D air-strafes before later levels get technical.
  const course = [
    [ 0.0,1.0, 11, 9.0,1.3,6.0],
    [-0.8,1.25,18, 8.2,1.2,6.0],
    [ 0.9,1.45,25, 8.0,1.1,5.8],
    [ 0.0,1.65,32, 8.5,1.0,5.8],
    [-1.2,1.65,39, 7.6,1.0,5.5],
    [ 1.3,1.65,46, 7.6,1.0,5.5],
    [ 0.0,1.65,53, 7.4,1.0,5.4],
    [ 0.0,1.45,61,10.0,1.0,6.0],
    [ 1.5,1.65,69, 7.2,1.0,5.2],
    [-0.7,1.85,76, 7.2,1.0,5.2],
    [-1.6,2.00,83, 7.0,1.0,5.0],
    [ 0.7,2.00,90, 7.4,1.0,5.0],
    [ 1.7,1.85,97, 7.2,1.0,5.0],
    [ 0.0,1.70,104, 8.2,1.0,5.4],
    [ 0.0,1.20,114,12.0,2.0,12.0]
  ];
  course.forEach((q,i)=>addBox(...q, i===14?'metal':(i%4===1?'cyan':'concrete'),true,`p${i+1}`));

  // Side architecture for depth and speed sensation.
  for(let z=4;z<122;z+=10){
    addBox(-13,3.5,z,3,9,6, z%20===4?'dark':'metal',false,'deco');
    addBox( 13,3.5,z+4,3,9,6, z%20===4?'metal':'dark',false,'deco');
  }
  for(let z=8;z<118;z+=16){
    addBox(-8,-.3,z,1.0,3.2,1.0,'acid',false,'beacon');
    addBox( 8,-.3,z,1.0,3.2,1.0,'cyan',false,'beacon');
  }
  // Start / finish gates.
  addBox(-4.8,4.2,4.5,.6,6,1,'acid',false); addBox(4.8,4.2,4.5,.6,6,1,'acid',false); addBox(0,7.0,4.5,10.2,.5,1,'acid',false);
  addBox(-4.8,6.0,111,.6,8,1,'acid',false); addBox(4.8,6.0,111,.6,8,1,'acid',false); addBox(0,9.8,111,10.2,.5,1,'acid',false);

  function drawBox(b){
    gl.uniform3f(loc.uCenter,b.x,b.y,b.z); gl.uniform3f(loc.uSize,b.sx,b.sy,b.sz); gl.uniform3fv(loc.uColor,b.color);
    gl.drawArrays(gl.TRIANGLES,0,36);
  }

  // ---------- Player / physics ----------
  const player = {x:0,y:1.05,z:-3.8,vx:0,vy:0,vz:0,yaw:0,pitch:0,onGround:false,r:.34,h:1.72};
  const spawn = {x:0,y:1.05,z:-3.8,yaw:0};
  const keys = Object.create(null);
  let paused = true, started = false, finished = false, runStarted = false;
  let runStartPerf = 0, accumulatedPause = 0, pauseStarted = 0, bestMs = null;
  let checkpoint = 0, finishCooldown = 0, readySent = false;

  function resetPlayer(startNow=false){
    player.x=spawn.x;player.y=spawn.y;player.z=spawn.z;player.vx=player.vy=player.vz=0;player.yaw=spawn.yaw;player.pitch=0;player.onGround=false;
    finished=false;runStarted=false;runStartPerf=performance.now();accumulatedPause=0;checkpoint=0;finishCooldown=.5;
    timerEl.textContent='00:00.000';speedEl.textContent='0';cpLabel.textContent='START';cpFill.style.width='0%';recordBadge.classList.add('hidden');
    if(startNow){paused=false;started=true;hud.classList.add('ready');YandexBridge.gameplayStart();}
  }

  function horizontalSpeed(){return Math.hypot(player.vx,player.vz)}
  function applyFriction(dt){
    const speed=horizontalSpeed(); if(speed<.01)return;
    const control=Math.max(speed,5.2), drop=control*7.1*dt, next=Math.max(0,speed-drop), k=next/speed;
    player.vx*=k;player.vz*=k;
  }
  function accelerate(wx,wz,wishSpeed,accel,dt){
    const current=player.vx*wx+player.vz*wz, add=wishSpeed-current; if(add<=0)return;
    const acc=Math.min(accel*wishSpeed*dt,add); player.vx+=acc*wx;player.vz+=acc*wz;
  }

  function wishDir(){
    let f=(keys.KeyW?1:0)-(keys.KeyS?1:0), s=(keys.KeyD?1:0)-(keys.KeyA?1:0);
    if(isTouch){f=Math.max(-1,Math.min(1,-mobileStick.y));s=Math.max(-1,Math.min(1,mobileStick.x));}
    let len=Math.hypot(f,s); if(len>1){f/=len;s/=len;len=1;}
    const sy=Math.sin(player.yaw), cy=Math.cos(player.yaw);
    const wx=sy*f+cy*s, wz=cy*f-sy*s;
    return {x:wx,z:wz,m:len};
  }

  const solidBoxes = () => boxes.filter(b=>b.solid);
  function overlapXZ(b,x,z,r=player.r){return x+r>b.x-b.sx/2 && x-r<b.x+b.sx/2 && z+r>b.z-b.sz/2 && z-r<b.z+b.sz/2}
  function verticalOverlap(b,y){const bottom=b.y-b.sy/2,top=b.y+b.sy/2;return y<top-.03 && y+player.h>bottom+.05}

  function moveHorizontal(dt){
    let nx=player.x+player.vx*dt, nz=player.z;
    for(const b of solidBoxes()){
      if(overlapXZ(b,nx,nz)&&verticalOverlap(b,player.y)){
        if(player.vx>0) nx=b.x-b.sx/2-player.r; else if(player.vx<0) nx=b.x+b.sx/2+player.r;
        player.vx=0;
      }
    }
    player.x=nx; nz=player.z+player.vz*dt;
    for(const b of solidBoxes()){
      if(overlapXZ(b,player.x,nz)&&verticalOverlap(b,player.y)){
        if(player.vz>0) nz=b.z-b.sz/2-player.r; else if(player.vz<0) nz=b.z+b.sz/2+player.r;
        player.vz=0;
      }
    }
    player.z=nz;
  }

  function moveVertical(dt){
    const prev=player.y; player.vy-=18.8*dt; player.y+=player.vy*dt; player.onGround=false;
    if(player.vy<=0){
      let bestTop=-Infinity;
      for(const b of solidBoxes()){
        if(!overlapXZ(b,player.x,player.z,player.r*.72))continue;
        const top=b.y+b.sy/2;
        if(prev>=top-.09 && player.y<=top+.02 && top>bestTop)bestTop=top;
      }
      if(bestTop>-Infinity){player.y=bestTop;player.vy=0;player.onGround=true;}
    } else {
      for(const b of solidBoxes()){
        if(!overlapXZ(b,player.x,player.z,player.r*.7))continue;
        const bottom=b.y-b.sy/2;
        if(prev+player.h<=bottom+.06 && player.y+player.h>=bottom){player.y=bottom-player.h-.02;player.vy=0;break;}
      }
    }
  }

  function physics(dt){
    if(paused||finished)return;
    const wish=wishDir(); const jump=!!keys.Space || mobileJump;
    if(player.onGround){
      if(jump){
        player.vy=8.55; player.onGround=false; // Slightly higher tutorial jump for forgiving Level 1 landings.
        if(wish.m>0) accelerate(wish.x,wish.z,7.2,16,dt);
      } else {
        applyFriction(dt);
        if(wish.m>0) accelerate(wish.x,wish.z,7.2,11.5,dt);
      }
    } else if(wish.m>0){
      accelerate(wish.x,wish.z,7.3,2.75,dt);
      // Gentle Quake-style air control when pushing forward.
      if((keys.KeyW||(-mobileStick.y>.25)) && !(keys.KeyS)){
        const speed=horizontalSpeed();
        if(speed>.1){
          const dot=(player.vx*wish.x+player.vz*wish.z)/speed;
          const k=Math.max(0,dot)*Math.max(0,dot)*4.2*dt;
          player.vx=player.vx*(1-k)+wish.x*speed*k;player.vz=player.vz*(1-k)+wish.z*speed*k;
        }
      }
    }
    const cap=20; const hs=horizontalSpeed(); if(hs>cap){const k=cap/hs;player.vx*=k;player.vz*=k;}
    moveHorizontal(dt);moveVertical(dt);

    if(!runStarted && (horizontalSpeed()>.45 || player.vy>.1 || player.z>-3.2)) {runStarted=true;runStartPerf=performance.now();accumulatedPause=0;}
    if(player.y<-8){resetPlayer(true);return;}
    if(finishCooldown>0)finishCooldown-=dt;

    const cps=[18,39,61,83,104,111];
    let c=0; for(const z of cps) if(player.z>=z)c++;
    if(c!==checkpoint){checkpoint=c;const pct=Math.min(100,(checkpoint/cps.length)*100);cpFill.style.width=pct+'%';cpLabel.textContent=checkpoint>=cps.length?'FINISH':`CHECKPOINT ${checkpoint}/${cps.length}`;}
    if(player.z>111 && player.y>2 && !finished && finishCooldown<=0) finishRun();
  }

  // ---------- Camera / rendering ----------
  function render(t){
    resize();
    const hs=horizontalSpeed(); const bob=(player.onGround&&hs>.5)?Math.sin(t*.012*Math.min(1.7,hs/5))*Math.min(.045,hs*.0035):0;
    const eye=[player.x,player.y+1.55+bob,player.z];
    const cp=Math.cos(player.pitch), sp=Math.sin(player.pitch), sy=Math.sin(player.yaw), cy=Math.cos(player.yaw);
    const forward=[sy*cp,sp,cy*cp];
    let right=[cy,0,-sy];
    let up=[-sy*sp,cp,-cy*sp];
    gl.clearColor(...fog,1);gl.clear(gl.COLOR_BUFFER_BIT|gl.DEPTH_BUFFER_BIT);
    gl.uniform3fv(loc.uCamPos,eye);gl.uniform3fv(loc.uCamForward,forward);gl.uniform3fv(loc.uCamRight,right);gl.uniform3fv(loc.uCamUp,up);
    // Farther objects first isn't necessary with depth testing, but drawing course before decoration keeps debugging predictable.
    for(const b of boxes)drawBox(b);
    if(!readySent){readySent=true;YandexBridge.gameReady();}
  }

  // ---------- Run state ----------
  function currentRunMs(){return !runStarted?0:performance.now()-runStartPerf-accumulatedPause}
  function updateHud(){
    if(runStarted&&!finished&&!paused)timerEl.textContent=formatTime(currentRunMs());
    speedEl.textContent=String(Math.round(horizontalSpeed()*40));
  }
  async function finishRun(){
    finished=true;paused=true;YandexBridge.gameplayStop();
    const ms=currentRunMs();timerEl.textContent=formatTime(ms);finishTimeEl.textContent=formatTime(ms);
    let isRecord=!bestMs||ms<bestMs;
    if(isRecord){bestMs=ms;bestEl.textContent=formatTime(bestMs);recordBadge.classList.remove('hidden');await YandexBridge.saveBest(ms);} else recordBadge.classList.add('hidden');
    finishScreen.classList.add('active');
    if(document.pointerLockElement===canvas)document.exitPointerLock();
  }
  function pauseGame(show=true){
    if(!started||finished||paused)return;paused=true;pauseStarted=performance.now();YandexBridge.gameplayStop();
    if(show)pauseScreen.classList.add('active');
    if(document.pointerLockElement===canvas)document.exitPointerLock();
  }
  function resumeGame(){
    if(finished)return;if(paused&&runStarted)accumulatedPause+=performance.now()-pauseStarted;paused=false;pauseScreen.classList.remove('active');YandexBridge.gameplayStart();
    if(!isTouch)canvas.requestPointerLock?.();
  }
  function beginGame(){
    startScreen.classList.remove('active');finishScreen.classList.remove('active');pauseScreen.classList.remove('active');resetPlayer(true);
    if(!isTouch)canvas.requestPointerLock?.();
  }

  playBtn.addEventListener('click',beginGame);resumeBtn.addEventListener('click',resumeGame);againBtn.addEventListener('click',beginGame);
  restartBtn.addEventListener('click',()=>resetPlayer(true));pauseBtn.addEventListener('click',()=>pauseGame());pauseRestartBtn.addEventListener('click',beginGame);

  document.addEventListener('keydown',(e)=>{
    keys[e.code]=true;
    if(['Space','ArrowUp','ArrowDown','ArrowLeft','ArrowRight'].includes(e.code))e.preventDefault();
    if(e.code==='KeyR'&&started){finishScreen.classList.remove('active');pauseScreen.classList.remove('active');resetPlayer(true);}
    if(e.code==='KeyP'&&started){paused?resumeGame():pauseGame();}
    if(e.code==='Escape'&&started&&!finished&&!paused)setTimeout(()=>pauseGame(),0);
  });
  document.addEventListener('keyup',(e)=>{keys[e.code]=false;});
  document.addEventListener('mousemove',(e)=>{
    if(document.pointerLockElement!==canvas||paused)return;
    player.yaw+=e.movementX*.00225;player.pitch-=e.movementY*.0019;player.pitch=Math.max(-1.18,Math.min(1.18,player.pitch));
  });
  document.addEventListener('pointerlockchange',()=>{
    if(!isTouch&&started&&!finished&&document.pointerLockElement!==canvas&&!paused)setTimeout(()=>pauseGame(),0);
  });
  document.addEventListener('visibilitychange',()=>{if(document.hidden)pauseGame(false);});

  // ---------- Mobile controls ----------
  const stickBase=$('#stickBase'),stickKnob=$('#stickKnob'),lookZone=$('#lookZone'),jumpBtn=$('#jumpBtn');
  const mobileStick={x:0,y:0}; let stickPointer=null, lookPointer=null, lookX=0,lookY=0,mobileJump=false;
  function updateStick(e){
    const r=stickBase.getBoundingClientRect(),cx=r.left+r.width/2,cy=r.top+r.height/2;let dx=e.clientX-cx,dy=e.clientY-cy;const max=r.width*.33,d=Math.hypot(dx,dy);if(d>max){dx*=max/d;dy*=max/d;}
    mobileStick.x=dx/max;mobileStick.y=dy/max;stickKnob.style.transform=`translate(${dx}px,${dy}px)`;
  }
  stickBase.addEventListener('pointerdown',e=>{stickPointer=e.pointerId;stickBase.setPointerCapture(e.pointerId);updateStick(e)});
  stickBase.addEventListener('pointermove',e=>{if(e.pointerId===stickPointer)updateStick(e)});
  const endStick=e=>{if(e.pointerId!==stickPointer)return;stickPointer=null;mobileStick.x=mobileStick.y=0;stickKnob.style.transform='translate(0,0)'};
  stickBase.addEventListener('pointerup',endStick);stickBase.addEventListener('pointercancel',endStick);
  lookZone.addEventListener('pointerdown',e=>{lookPointer=e.pointerId;lookX=e.clientX;lookY=e.clientY;lookZone.setPointerCapture(e.pointerId)});
  lookZone.addEventListener('pointermove',e=>{if(e.pointerId!==lookPointer||paused)return;const dx=e.clientX-lookX,dy=e.clientY-lookY;lookX=e.clientX;lookY=e.clientY;player.yaw+=dx*.005;player.pitch-=dy*.0042;player.pitch=Math.max(-1.12,Math.min(1.12,player.pitch));});
  const endLook=e=>{if(e.pointerId===lookPointer)lookPointer=null};lookZone.addEventListener('pointerup',endLook);lookZone.addEventListener('pointercancel',endLook);
  jumpBtn.addEventListener('pointerdown',e=>{mobileJump=true;jumpBtn.setPointerCapture(e.pointerId)});jumpBtn.addEventListener('pointerup',()=>mobileJump=false);jumpBtn.addEventListener('pointercancel',()=>mobileJump=false);

  // ---------- Fixed-step loop ----------
  let last=performance.now(),acc=0;const step=1/120;
  function loop(now){
    let dt=Math.min(.05,(now-last)/1000);last=now;acc+=dt;
    while(acc>=step){physics(step);acc-=step;}
    render(now);updateHud();requestAnimationFrame(loop);
  }

  async function boot(){
    await YandexBridge.init();
    bestMs=await YandexBridge.loadBest();
    bestEl.textContent=formatTime(bestMs);
    resetPlayer(false);
    requestAnimationFrame(loop);
  }
  boot().catch(err=>{console.error(err);fatal.classList.remove('hidden');fatal.textContent=String(err?.stack||err)});
})();
