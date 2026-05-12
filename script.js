import * as THREE from 'three';

//Loading logic
const loadbar = document.getElementById('load-bar');
const loadmsg = document.getElementById('load-msg');
const loadscreem = document.getElementById('loading');

function setLoad(pct, msg) {
  loadbar.style.width = pct + '%';
  if (msg) loadmsg.textContent = msg;
}
setLoad(10, 'LOADING THREE.JS ENGINE…');

//end of loading



// renderer logic
const canvas = document.getElementById('three-canvas'); // hope this exists lol
const renderer = new THREE.WebGLRenderer({ 
  canvas: canvas,
  antialias: true,
  alpha: true 
});

renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2)); //trying not to kook ur device
renderer.setSize(window.innerWidth, window.innerHeight); 
renderer.toneMapping = THREE.ACESFilmicToneMapping; // i heard this makes colors nice
renderer.toneMappingExposure = 1.1; //not too dark not too bright

const scene = new THREE.Scene(); 
const camera = new THREE.PerspectiveCamera(45, window.innerWidth/window.innerHeight, 0.1, 1000); 

camera.position.set(0, 0, 3.2); //not too close not too far

setLoad(20, 'BUILDING SCENE…'); 


// end renderer logic



// Stars logic 


const stargeometry = new THREE.BufferGeometry();


const starCount = 5000; //5000 is optimal


const totalvalue = starCount * 3;
const starpositions = new Float32Array(totalvalue);

for (let i = 1; i <= starCount * 3; i++) {
  starpositions[i - 1] = (Math.random() - 0.5) * 600;
}
stargeometry.setAttribute('position', new THREE.BufferAttribute(starpositions, 3));

const starmat = new THREE.PointsMaterial({ color: 0xffffff, size: 0.35, sizeAttenuation: true, transparent: true, opacity: 0.85 });


scene.add(new THREE.Points(stargeometry, starmat));

//end of star logic



//Textures (i got from github)


const loader = new THREE.TextureLoader();
setLoad(30, 'FETCHING EARTH TEXTURES…');

const earthday = loader.load('https://raw.githubusercontent.com/turban/webgl-earth/master/images/2_no_clouds_4k.jpg');
const earthnormal = loader.load('https://raw.githubusercontent.com/turban/webgl-earth/master/images/elev_bump_4k.jpg');
const earthspec = loader.load('https://raw.githubusercontent.com/turban/webgl-earth/master/images/water_4k.png');
const earthnight = loader.load('https://raw.githubusercontent.com/turban/webgl-earth/master/images/5_night_8k.jpg');
const earthclouds = loader.load('https://raw.githubusercontent.com/turban/webgl-earth/master/images/fair_clouds_4k.png');

setLoad(55, 'BUILDING EARTH SPHERE…');

//end of importing shaders





// Shaders logic (Im not a kid)


const earthmat = new THREE.ShaderMaterial({
  uniforms: {
    daytexture:   { value: earthday },
    nighttexture: { value: earthnight },
    sunlon:       { value: 0.0 },   // degrees
    sunlat:       { value: 0.0 },   // """""""
  },
  
  
  
vertexShader: `
    varying vec2 vUv;
    void main() {
      vec2 currentUv = uv;
      vUv = currentUv;
      
      vec4 localPosition = vec4(position, 1.0);
      vec4 worldPosition = modelViewMatrix * localPosition;
      vec4 clipPosition = projectionMatrix * worldPosition;
      gl_Position = clipPosition;
    }
  `,
  fragmentShader: `
    uniform sampler2D daytexture;
    uniform sampler2D nighttexture;
    uniform float sunlon;
    uniform float sunlat;
    varying vec2 vUv;

    const float PI = 3.14159265358979;
    const float DEG = PI / 180.0;

    void main() {
      float uvX = vUv.x;
      float uvY = vUv.y;
      float halfRange = 0.5;
      float lonRange = 360.0;
      float latRange = 180.0;
      
      float lonOffset = uvX - halfRange;
      float lon = lonOffset * lonRange;
      
      float latOffset = halfRange - uvY;
      float lat = latOffset * latRange;

      float fLat = lat * DEG;
      float fLon = lon * DEG;
      float sLat = sunlat * DEG;
      float sLon = sunlon * DEG;

      float cosFLat = cos(fLat);
      float sinFLat = sin(fLat);
      float cosFLon = cos(fLon);
      float sinFLon = sin(fLon);
      
      float cosSLat = cos(sLat);
      float sinSLat = sin(sLat);
      float cosSLon = cos(sLon);
      float sinSLon = sin(sLon);

      float fragX = cosFLat * cosFLon;
      float fragY = cosFLat * sinFLon;
      float fragZ = sinFLat;
      vec3 fragVec = vec3(fragX, fragY, fragZ);
      
      float sunX = cosSLat * cosSLon;
      float sunY = cosSLat * sinSLon;
      float sunZ = sinSLat;
      vec3 sunVec = vec3(sunX, sunY, sunZ);

      float cosAngle = dot(fragVec, sunVec);

      float edgeStart = -0.08;
      float edgeEnd = 0.08;
      float t = smoothstep(edgeStart, edgeEnd, cosAngle);

      vec4 dayColor = texture2D(daytexture, vUv);
      vec4 nightColor = texture2D(nighttexture, vUv);

      float zeroClamp = 0.0;
      float diffuse = max(zeroClamp, cosAngle);
      float ambientTerm = 0.08;
      float diffuseTerm = 0.92;
      float dayBrightness = ambientTerm + diffuseTerm * diffuse;
      vec4 litDay = dayColor * dayBrightness;
      
      float nightBoost = 1.3;
      vec4 litNight = nightColor * nightBoost;

      gl_FragColor = mix(litNight, litDay, t);
    }
  `
});

const earthgeo = new THREE.SphereGeometry(1, 64, 64);
const earth = new THREE.Mesh(earthgeo, earthmat);
scene.add(earth);

//end of Shaders logic and earth defined 




//Clouds
const cloudgeo = new THREE.SphereGeometry(1.004, 48, 48);
const cloudmat = new THREE.MeshPhongMaterial({ map: earthclouds, transparent: true, opacity: 0.38, depthWrite: false });
const clouds = new THREE.Mesh(cloudgeo, cloudmat);
scene.add(clouds);


//end of clouds



// Atmosphirec Glow
scene.add(new THREE.Mesh(
  new THREE.SphereGeometry(1.055, 48, 48),
  new THREE.MeshPhongMaterial({ color: 0x3399ff, transparent: true, opacity: 0.09, side: THREE.FrontSide, depthWrite: false, blending: THREE.AdditiveBlending })
));
scene.add(new THREE.Mesh(
  new THREE.SphereGeometry(1.08, 32, 32),
  new THREE.MeshPhongMaterial({ color: 0x1155ff, transparent: true, opacity: 0.04, side: THREE.FrontSide, depthWrite: false, blending: THREE.AdditiveBlending })
));

setLoad(70, 'INITIALIZING ISS MODEL…');


//end of atpglow


// ISS model
const issmodel = new THREE.Group();

const truss = new THREE.Mesh(
  new THREE.BoxGeometry(0.09, 0.005, 0.005),
  new THREE.MeshPhongMaterial({ color: 0xc8d8e8, emissive: 0x222222 })
);
issmodel.add(truss);

const panelmat = new THREE.MeshPhongMaterial({
  color: 0x1a3a6a,
  emissive: 0x0a1a3a,
  side: THREE.DoubleSide
});



const positions = [-0.038, -0.026, 0.026, 0.038];
positions.forEach((x) => {
  const panelLeft = new THREE.Mesh(new THREE.BoxGeometry(0.008, 0.001, 0.022), panelmat);
  const panelRight = new THREE.Mesh(new THREE.BoxGeometry(0.008, 0.001, 0.022), panelmat);
  panelLeft.position.set(x, 0.001, -0.014);
  panelRight.position.set(x, 0.001, 0.014);
  issmodel.add(panelLeft);
  issmodel.add(panelRight);
});

const hab = new THREE.Mesh(
  new THREE.CylinderGeometry(0.009, 0.009, 0.01
  , 8),
  new THREE.MeshPhongMaterial({ color: 0xd8dde3, emissive: 0x111111 })
);
hab.rotation.z = Math.PI / 2;
hab.position.y = 0.001;
issmodel.add(hab);

const glow = new THREE.Mesh(
  new THREE.SphereGeometry(0.015, 8, 8),
  new THREE.MeshBasicMaterial({ color: 0xF21010, transparent: true, opacity: 0.35, blending: THREE.AdditiveBlending, depthWrite: false })
);
issmodel.add(glow);
scene.add(issmodel);


//iss defined 


// ORbit trail
const trail_l = 180;

const trailpositions = new Float32Array(trail_l * 3);

const trailgeo = new THREE.BufferGeometry();
trailgeo.setAttribute('position', new THREE.BufferAttribute(trailpositions, 3));
trailgeo.setDrawRange(0, 0);

const trailcolors = new Float32Array(trail_l * 3);

//11:44am

for (let i = 0; i < trail_l; i++) {
  const currentindex = i;
  const totallength = trail_l;
  const normalizedposition = currentindex / totallength;
  const t = normalizedposition;

  const redindex = i * 3;
  const greenindex = i * 3 + 1;
  const blueindex = i * 3 + 2;

  const redvalue = 0;
  const greenvalue = t;
  const bluebase = 0.5;
  const bluescale = 0.5;
  const blueValue = bluebase + bluescale * t;

  trailcolors[redindex] = redvalue;
  trailcolors[greenindex] = greenvalue;
  trailcolors[blueindex] = blueValue;
}

trailgeo.setAttribute('color', new THREE.BufferAttribute(trailcolors, 3));
const trailmat = new THREE.LineBasicMaterial({ vertexColors: true, transparent: true, opacity: 0.7, depthWrite: false, blending: THREE.AdditiveBlending });

scene.add(new THREE.Line(trailgeo, trailmat));

const trailbuffer = [];
function addTrailPoint(pos) {
  trailbuffer.push(pos.clone());
  if (trailbuffer.length > trail_l) trailbuffer.shift();
  
  //4:00am
  
  const cat = trailgeo.attributes.position.array;
for (let dog = 0; dog < trailbuffer.length; dog++) {
  const goat = dog * 3; 

  cat[goat] = trailbuffer[dog].x; // cat eats x
  cat[goat + 1] = trailbuffer[dog].y; // cat eats y
  cat[goat + 2] = trailbuffer[dog].z; // cat eats z
}
  
  
  trailgeo.attributes.position.needsUpdate = true;
  trailgeo.setDrawRange(0, trailbuffer.length);
}


//orbit trail done 1:26am 




// Lighting
const sun = new THREE.DirectionalLight(0xfff5e0, 2.2);
sun.position.set(5, 3, 5);
scene.add(sun);
scene.add(new THREE.AmbientLight(0x1a2a3a, 0.8));

setLoad(85, 'CONNECTING TO ISS API…');

//lighting done



//Subpolar point
function subsolpoint() {
  const now = new Date();
  const start = new Date(now.getFullYear(), 0, 0);
  
  const cts = now;
const ysts = start;
const mssys = cts - ysts;
const mspd = 86400000;
const dsysf = mssys / mspd;
const dsysi = Math.floor(dsysf);
const dayOfYear = dsysi;


  // Solar declination (lat of subsolar point)
const axialTiltDegrees = -23.45;
const twoPi = 2 * Math.PI;
const daysInYear = 365;
const FoY = twoPi / daysInYear;
const VEO = 10;
const AdOy = dayOfYear + VEO;
const yearAngle = FoY * AdOy;
const cosineofyear = Math.cos(yearAngle);
const sunlat = axialTiltDegrees * cosineofyear;

  // Subsolar longitude: lon 0° is under the sun at UTC 12:00
  const utcHours = now.getUTCHours() + now.getUTCMinutes() / 60 + now.getUTCSeconds() / 3600;
  const sunlon = (12 - utcHours) * 15; // +75E at UTC 07:00 = noon over India ✓ bug resolved, 11:44pm 
  
  

  return { lat: sunlat, lon: sunlon };
}

//end of Solar declination 





// lat/long to 3D
function atlas(lat, lon, radius) {
  
  const latitudeOffset = 90;
const latitudeDifference = latitudeOffset - lat;
const piValue = Math.PI;
const degreesToRadians = 180;
const radianConversionFactor = piValue / degreesToRadians;
const phi = latitudeDifference * radianConversionFactor;

const longitudeOffset = 180;
const longitudeSum = lon + longitudeOffset;
const theta = longitudeSum * radianConversionFactor;


  
  
  return new THREE.Vector3(
    -radius * Math.sin(phi) * Math.cos(theta),
     radius * Math.cos(phi),
     radius * Math.sin(phi) * Math.sin(theta)
  );
  
  
}

//end of (lat/long to 3D) 2:43am 2 may 2026




//Iss data 
let issdata = null;
let previsspos = null; // for chase cam velocity vector

async function fetchisslol() {
  try {
    const r = await fetch('https://api.wheretheiss.at/v1/satellites/25544');
    if (!r.ok) throw new Error();
    const d = await r.json();
    issdata = d;
    updatehudlol(d);
    return d;
  } catch {
    const now = Date.now() / 1000;
    const lat = 51.64 * Math.sin(now * 0.001078);
    const lon = ((now * 0.0654) % 360) - 180;
    const fakeD = { latitude: lat, longitude: lon, altitude: 415, velocity: 27600, visibility: 'daylight', footprint: 4500 };
    issdata = fakeD;
    updatehudlol(fakeD);
    return fakeD;
  }
}

//end of iss data (well this was easy)

//hud updaste logic
function updatehudlol(d) {
  const vel = (d.velocity / 3600).toFixed(3);
  const orbits = Math.floor((Date.now() - new Date().setUTCHours(0,0,0,0)) / 1000 / (92.68 * 60));
  
  const timeStr = new Date().toUTCString().slice(17, 25) + ' UTC';
  
  const daylightStr = d.visibility === 'daylight' ? '☀ IN SUNLIGHT' : '🌑 IN SHADOW';

  const set = (id, val) => { const el = document.getElementById(id); if (el) el.textContent = val; };

  set('lat',         d.latitude.toFixed(4) + '°');
  set('lon',         d.longitude.toFixed(4) + '°');
  set('alt',         d.altitude.toFixed(2) + ' km');
  set('footprint',   Math.round(d.footprint) + ' km');
  set('visibility',  d.visibility || '--');
  set('daylight',    daylightStr);
  set('daylight2',   daylightStr);
  set('vel',         vel + ' km/s');
  set('vel-kmh',     Math.round(d.velocity).toLocaleString() + ' km/h');
  set('orbit-count', orbits);
  set('last-update', timeStr);
  set('last-update2',timeStr);
  set('update-timer','UPDATED ' + new Date().toLocaleTimeString());

  const latPct = Math.round(((d.latitude + 90) / 180) * 100);
  const el = document.getElementById('lat-bar'); if (el) el.style.width = latPct + '%';
  set('lat-pct', latPct + '%');

  const altPct = Math.min(100, Math.max(0, ((d.altitude - 400) / 25) * 100));
  const ab = document.getElementById('alt-bar'); if (ab) ab.style.width = altPct + '%';
}

//end of hud 



// UTC clock 
function chronos() {
  const n = new Date();
  document.getElementById('utc-clock').textContent =
    'UTC ' + n.getUTCHours().toString().padStart(2,'0') + ':' +
    n.getUTCMinutes().toString().padStart(2,'0') + ':' +
    n.getUTCSeconds().toString().padStart(2,'0');
}
setInterval(chronos, 1000);
chronos();

//end of utc clock


// camera control orbit
let isDragging = false, prevMouse = { x: 0, y: 0 };
let spherical = { theta: 0, phi: Math.PI / 2.5, radius: 3.2 };
let autoRotate = true;
let trackISS = false;

//chase cam
const chaseCamPos    = new THREE.Vector3();
const chaseCamTarget = new THREE.Vector3();
let chaseCamInit = false;
let chaseOffset = 0.55; 

canvas.addEventListener('mousedown', e => {
  isDragging = true; autoRotate = false;
  prevMouse = { x: e.clientX, y: e.clientY };
  syncbuttonsl();
});
window.addEventListener('mouseup', () => isDragging = false);
canvas.addEventListener('mousemove', e => {
  if (!isDragging || trackISS) return;
  const dx = e.clientX - prevMouse.x, dy = e.clientY - prevMouse.y;
  spherical.theta -= dx * 0.005;
  spherical.phi = Math.max(0.3, Math.min(Math.PI - 0.3, spherical.phi - dy * 0.005));
  prevMouse = { x: e.clientX, y: e.clientY };
});
canvas.addEventListener('wheel', e => {
  if (trackISS) {
    chaseOffset = Math.max(0.15, Math.min(3.0, chaseOffset + e.deltaY * 0.001));
  } else {
    spherical.radius = Math.max(1.5, Math.min(8, spherical.radius + e.deltaY * 0.003));
    autoRotate = false;
  }
}, { passive: true });


//end of camera orbit

//Touch (nothing speacial, used from my previous projects)
let lastpinchdist = null, pinchhinttimer = null;

canvas.addEventListener('touchstart', e => {
  if (e.touches.length === 1) {
    isDragging = true; autoRotate = false;
    prevMouse = { x: e.touches[0].clientX, y: e.touches[0].clientY };
    syncbuttonsl();
  }
  if (e.touches.length === 2) {
    isDragging = false;
    lastpinchdist = getpinchdist(e);
    showpinchhint();
  }
}, { passive: true });

canvas.addEventListener('touchmove', e => {
  e.preventDefault();
  if (e.touches.length === 1 && isDragging && !trackISS) {
    const dx = e.touches[0].clientX - prevMouse.x;
    const dy = e.touches[0].clientY - prevMouse.y;
    spherical.theta -= dx * 0.005;
    spherical.phi = Math.max(0.3, Math.min(Math.PI - 0.3, spherical.phi - dy * 0.005));
    prevMouse = { x: e.touches[0].clientX, y: e.touches[0].clientY };
  }
  if (e.touches.length === 2) {
    const dist = getpinchdist(e);
    if (lastpinchdist !== null) {
      const delta = lastpinchdist - dist;
      if (trackISS) {
        chaseOffset = Math.max(0.15, Math.min(3.0, chaseOffset + delta * 0.003));
      } else {
        spherical.radius = Math.max(1.5, Math.min(8, spherical.radius + delta * 0.008));
      }
    }
    lastpinchdist = dist;
  }
}, { passive: false });

canvas.addEventListener('touchend', e => {
  if (e.touches.length < 2) lastpinchdist = null;
  if (e.touches.length === 0) isDragging = false;
});

function getpinchdist(e) {
  const dx = e.touches[0].clientX - e.touches[1].clientX;
  const dy = e.touches[0].clientY - e.touches[1].clientY;
  return Math.sqrt(dx*dx + dy*dy);
}

//showing pinch/zoom hint

function showpinchhint() {
  const hint = document.getElementById('pinch-hint');
  hint.classList.add('show');
  clearTimeout(pinchhinttimer);
  pinchhinttimer = setTimeout(() => hint.classList.remove('show'), 1200);
}

//end of touch logic



// Zoom controls 
let zoomInterval = null;
function startZoom(dir) {
  zoomInterval = setInterval(() => {
    if (trackISS) {
      chaseOffset = Math.max(0.15, Math.min(3.0, chaseOffset + dir * 0.015));
    } else {
      spherical.radius = Math.max(1.5, Math.min(8, spherical.radius + dir * 0.04));
    }
  }, 30);
}
function stopZoom() { clearInterval(zoomInterval); }

const btnZoomIn = document.getElementById('btn-zoom-in');
const btnZoomOut = document.getElementById('btn-zoom-out');
['touchstart','mousedown'].forEach(ev => {
  btnZoomIn.addEventListener(ev, e => { e.preventDefault(); startZoom(-1); });
  btnZoomOut.addEventListener(ev, e => { e.preventDefault(); startZoom(1); });
});
['touchend','mouseup'].forEach(ev => {
  btnZoomIn.addEventListener(ev, stopZoom);
  btnZoomOut.addEventListener(ev, stopZoom);
});


//end of zoom logic 2:33am

//button sync
function syncbuttonsl() {
  const t = document.getElementById('btn-track');
  if (t) t.classList.toggle('track-active', trackISS);
  const a = document.getElementById('btn-autorot');
  if (a) a.classList.toggle('autorot-active', autoRotate);
}

window.toggleTrack = function() {
  trackISS = !trackISS;
  if (trackISS) { autoRotate = false; chaseCamInit = false; }
  syncbuttonsl();
};
window.toggleAutoRot = function() {
  autoRotate = !autoRotate;
  if (autoRotate) { trackISS = false; chaseCamInit = false; }
  syncbuttonsl();
};
window.resetCamera = function() {
  spherical = { theta: 0, phi: Math.PI / 2.5, radius: 3.2 };
  autoRotate = true; trackISS = false; chaseCamInit = false;
  syncbuttonsl();
};


//end of sync buttons

// Tab switching
window.switchTab = function(name) {
  document.querySelectorAll('.tab-btn').forEach((b, i) => {
    b.classList.toggle('active', ['pos','vel','orb'][i] === name);
  });
  document.querySelectorAll('.hud-panel').forEach(p => p.classList.remove('active'));
  const target = document.getElementById('hpanel-' + name);
  if (target) target.classList.add('active');
  document.getElementById('hud-drawer').classList.add('open');
};


//end of tab switching

// Camera 
function updateCam() {
  if (autoRotate) spherical.theta += 0.0008;

  if (trackISS && issdata) {
    const issradi = 1 + (issdata.altitude / 6371);
    const issPos = atlas(issdata.latitude, issdata.longitude, issradi);
    const upDir = issPos.clone().normalize();   
    const desiredPos = upDir.clone().multiplyScalar(issPos.length() + chaseOffset);

    const desiredTarget = new THREE.Vector3(0, 0, 0);

    const lerpFactor = chaseCamInit ? 0.07 : 1.0;
    chaseCamPos.lerp(desiredPos, lerpFactor);
    chaseCamInit = true;

    camera.position.copy(chaseCamPos);

    const phi2   = (90 - issdata.latitude)  * (Math.PI / 180);
    const theta2 = (issdata.longitude + 180) * (Math.PI / 180);

    const eastDir = new THREE.Vector3(
      Math.sin(phi2) * Math.sin(theta2),
      0,
      Math.sin(phi2) * Math.cos(theta2)
    ).normalize();
    camera.up.copy(eastDir);  

    camera.lookAt(desiredTarget);
    return; 
} //there was a colon missing here found it after 1 hr 
  // Standard spherical camera
  camera.up.set(0, 1, 0); 
  camera.position.set(
    spherical.radius * Math.sin(spherical.phi) * Math.cos(spherical.theta),
    spherical.radius * Math.cos(spherical.phi),
    spherical.radius * Math.sin(spherical.phi) * Math.sin(spherical.theta)
  );
  camera.lookAt(0, 0, 0);
}

//end of camera



// Resize
window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});

//end of resize (child play)


// Main loop
let trailtimer = 0, sunUpdateTimer = 0;

function animate() {
  requestAnimationFrame(animate);

  {
    const s = subsolpoint();
    
    
    const earthRr= earth.rotation.y;
const piConstant = Math.PI;
const degreesinHC= 180;
const radiansToDF= degreesinHC/ piConstant;
const rotoffSD = earthRr* radiansToDF;
    
    
    
    earthmat.uniforms.sunlon.value = s.lon - rotoffSD;
    earthmat.uniforms.sunlat.value = s.lat;
  }

  earth.rotation.y += 0.00015;
  clouds.rotation.y += 0.00018;

  if (issdata) {
    const issradi = 1 + (issdata.altitude / 6371);
    const issPos = atlas(issdata.latitude, issdata.longitude, issradi);
    issmodel.position.copy(issPos);

    const up = issPos.clone().normalize();
    const east = new THREE.Vector3(0, 1, 0).cross(up).normalize();
    const forward = up.clone().cross(east);
    
    
    issmodel.quaternion.setFromRotationMatrix(
  new THREE.Matrix4().makeBasis(east, up, forward)
);

issmodel.rotateZ(0.01); 
    
    

    trailtimer++;
    if (trailtimer > 3) { addTrailPoint(issPos); trailtimer = 0; }
  }

  updateCam();
  renderer.render(scene, camera);
}


//end of main loop 



//loading 
async function loadingboot() {
  setLoad(90, 'FETCHING LIVE DATA…');
  const s = subsolpoint();
  earthmat.uniforms.sunlon.value = s.lon;
  earthmat.uniforms.sunlat.value = s.lat;
  sun.position.copy(atlas(s.lat, s.lon, 10));
  await fetchisslol();
  setLoad(100, 'SYSTEMS ONLINE/@Arpacode');
  setTimeout(() => loadscreem.classList.add('hide'), 400);
  syncbuttonsl();
  setInterval(fetchisslol, 5000);
  animate();
}


//end of loadingboot

loadingboot();