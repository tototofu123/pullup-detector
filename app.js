/**
 * PULL-UP COUNTER
 * Core logic with Pose Detection (MoveNet)
 */

// ═══════════════════════════════════════════════════════════
//  STATE & CONFIG
// ═══════════════════════════════════════════════════════════
let count = 0;
let sessionGoal = 10;
let mode = 'auto'; // 'auto' | 'manual'
let detector = null;
let camLive = false;

// Pull-up states
const PS = {
    NONE: 'NONE',
    HANGING: 'HANGING',
    UP: 'UP',
    TOP: 'TOP'
};
let currentState = PS.NONE;
let completedTop = false;

// Elements
const video = document.getElementById('video');
const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d');
const countDisplay = document.getElementById('countDisplay');
const logList = document.getElementById('logList');
const stateBadge = document.getElementById('stateBadge');

// ═══════════════════════════════════════════════════════════
//  INIT
// ═══════════════════════════════════════════════════════════
async function init() {
    loadSession();
    updateDisplay();
    
    // Check for Secure Context (Required for Camera in most browsers)
    const splashText = document.querySelector('#splash p');
    const startBtn = document.querySelector('.btn-start');

    if (!window.isSecureContext && window.location.protocol === 'file:') {
        splashText.innerHTML = '<span style="color:var(--danger)">SECURITY RESTRICTION:</span><br>Browser blocks camera on "file://" links.';
        splashText.style.opacity = '1';
        startBtn.textContent = 'HOW TO FIX?';
        startBtn.onclick = () => {
            alert("Modern browsers only allow camera access on HTTPS or localhost.\n\nTo fix this:\n1. Use a local server (like VS Code 'Live Server').\n2. Or, drag this folder into a web host (Netlify/Vercel).\n3. Or, use Chrome with 'Allow insecure origins' flag.");
        };
    } else {
        // Proactive Permission Check
        checkCameraPermission();
    }

    // Show Tutorial if not dismissed
    if (!sessionStorage.getItem('pullup_tutorial_dismissed')) {
        setTimeout(() => {
            const tutorial = document.getElementById('tutorial');
            if (tutorial) tutorial.classList.add('active');
        }, 1500);
    }
    
    try {
        setLoad(10, 'Loading TensorFlow.js...');
        await tf.ready();
        
        setLoad(40, 'Initializing MoveNet...');
        detector = await poseDetection.createDetector(
            poseDetection.SupportedModels.MoveNet,
            { modelType: poseDetection.movenet.modelType.SINGLEPOSE_LIGHTNING }
        );
        
        setLoad(100, 'Ready!');
        dot('dotModel', 'on');
        txt('txtModel', 'MODEL READY');
        
        setTimeout(() => {
            const el = document.getElementById('loading');
            el.style.opacity = '0';
            setTimeout(() => el.style.display = 'none', 500);
        }, 400);
        
    } catch (e) {
        console.error('Init failed:', e);
        setLoad(0, 'Error: Could not load AI model.');
    }
}

async function checkCameraPermission() {
    if (!navigator.permissions || !navigator.permissions.query) return;
    
    try {
        const result = await navigator.permissions.query({ name: 'camera' });
        handlePermissionChange(result.state);
        result.onchange = () => handlePermissionChange(result.state);
    } catch (e) {
        console.warn('Permissions API not supported for camera.');
    }
}

function handlePermissionChange(state) {
    const splashText = document.querySelector('#splash p');
    const startBtn = document.querySelector('.btn-start');
    
    if (state === 'denied') {
        splashText.textContent = 'CAMERA ACCESS BLOCKED. Please enable in browser settings.';
        splashText.style.color = 'var(--danger)';
        splashText.style.opacity = '1';
        startBtn.textContent = 'PERMISSIONS BLOCKED';
        startBtn.style.opacity = '0.5';
        startBtn.disabled = true;
    } else if (state === 'prompt') {
        splashText.textContent = 'READY TO DETECT REPS';
        startBtn.textContent = 'ALLOW & START CAMERA';
    } else if (state === 'granted') {
        splashText.textContent = 'PERMISSION GRANTED';
        startBtn.textContent = 'ACTIVATE CAMERA';
    }
}

function setLoad(pct, msg) {
    document.getElementById('loadFill').style.width = pct + '%';
    document.getElementById('loadMsg').textContent = msg;
}

// ═══════════════════════════════════════════════════════════
//  CAMERA
// ═══════════════════════════════════════════════════════════
async function startCamera() {
    if (camLive) return;

    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        alert("Camera API not available. This is likely due to the 'file://' security restriction mentioned on the screen.");
        return;
    }
    
    const splashText = document.querySelector('#splash p');
    splashText.textContent = 'REQUESTING ACCESS...';
    
    try {
        const stream = await navigator.mediaDevices.getUserMedia({
            video: { 
                facingMode: 'user', 
                width: { ideal: 640 }, 
                height: { ideal: 480 } 
            }
        });
        video.srcObject = stream;
        await new Promise(r => video.onloadedmetadata = r);
        video.play();
        camLive = true;
        
        document.getElementById('splash').style.display = 'none';
        dot('dotCam', 'on blink');
        txt('txtCam', 'CAM LIVE');
        
        requestAnimationFrame(loop);
    } catch (e) {
        console.error('Camera error:', e);
        
        if (e.name === 'NotAllowedError' || e.name === 'PermissionDeniedError') {
            splashText.textContent = 'PERMISSION DENIED. Please allow camera and try again.';
            alert('Camera access denied. To count reps, the AI needs to see your movement.');
        } else if (e.name === 'NotFoundError' || e.name === 'DevicesNotFoundError') {
            splashText.textContent = 'NO CAMERA DETECTED.';
            alert('No camera found on this device.');
        } else if (e.name === 'NotReadableError' || e.name === 'TrackStartError') {
            splashText.textContent = 'CAMERA IN USE BY ANOTHER APP.';
            alert('Your camera is already being used by another application.');
        } else {
            splashText.textContent = 'CAMERA ERROR: ' + e.name;
            alert('An unexpected error occurred while starting the camera.');
        }
        
        splashText.style.color = 'var(--danger)';
        splashText.style.opacity = '1';
    }
}

// ═══════════════════════════════════════════════════════════
//  DETECTION LOOP
// ═══════════════════════════════════════════════════════════
async function loop() {
    if (!detector || !camLive) return;

    // Sync canvas size to video aspect ratio
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    ctx.drawImage(video, 0, 0);

    try {
        const poses = await detector.estimatePoses(video);
        if (poses && poses.length > 0) {
            const pose = poses[0];
            drawPose(pose);
            if (mode === 'auto') analyze(pose);
        } else {
            handleNoPose();
        }
    } catch (e) {
        console.error('Detection error:', e);
    }

    requestAnimationFrame(loop);
}

function handleNoPose() {
    currentState = PS.NONE;
    setBadge('NO SUBJECT', 'inactive');
    updateDebug({ state: 'SEARCHING', wrist: '—', chin: '—', phase: '—', conf: '0%' });
}

// ═══════════════════════════════════════════════════════════
//  PULL-UP LOGIC (STRICT BAR CROSS)
// ═══════════════════════════════════════════════════════════
function analyze(pose) {
    const kps = pose.keypoints;
    const MIN_CONF = 0.35; // Stricter for accuracy
    
    const nose = kps[0];
    const lWr = kps[9], rWr = kps[10];

    // REQUIRE both hands and nose for strict tracking
    const bothHandsVisible = lWr && rWr && lWr.score > MIN_CONF && rWr.score > MIN_CONF;
    const noseVisible = nose && nose.score > MIN_CONF;

    if (!bothHandsVisible || !noseVisible) {
        handleNoPose();
        setBadge('NEED BOTH HANDS', 'inactive');
        return;
    }

    const h = canvas.height;
    // Find the HIGHER hand (the one with the smallest Y value)
    // This is our "Bar Line"
    const highestHandY = Math.min(lWr.y, rWr.y) / h;
    const nNose = nose.y / h;

    // ─── STRICT LOGIC ───
    // Chin must go above the highest hand
    const isAbove = nNose < highestHandY; 
    // Chin must drop clearly below the highest hand to reset
    const isBelow = nNose > highestHandY + 0.03; 

    // ─── Debug ───
    updateDebug({
        state: 'STRICT TRACKING',
        wrist: Math.round(highestHandY * h) + 'px',
        chin: Math.round(nNose * h) + 'px',
        phase: isAbove ? 'TOP' : 'BOTTOM',
        conf: Math.round(Math.min(lWr.score, rWr.score, nose.score) * 100) + '%'
    });

    // ─── STRICT FSM ───
    
    // Step 1: Initialize at the bottom
    if (currentState === PS.NONE || currentState === PS.UP) {
        if (isBelow) {
            currentState = PS.HANGING;
            completedTop = false;
            setBadge('READY: BELOW BAR', 'active');
        }
    }

    // Step 2: Must cross the HIGHER hand line
    if (currentState === PS.HANGING) {
        if (isAbove) {
            playAudio('top'); 
            currentState = PS.TOP;
            completedTop = true;
            setBadge('REACHED TOP ✓', 'top');
        }
    }

    // Step 3: Must drop back below the line to count
    if (currentState === PS.TOP) {
        if (isBelow && completedTop) {
            completeRep(); 
            currentState = PS.HANGING;
            completedTop = false;
            setBadge('READY: BELOW BAR', 'active');
        }
    }
}

// ═══════════════════════════════════════════════════════════
//  REPS & FEEDBACK
// ═══════════════════════════════════════════════════════════
function completeRep() {
    count++;
    saveSession();
    updateDisplay();
    playAudio('rep');
    triggerFlash();
    logEntry('AUTO');
}

function addManual(n) {
    count += n;
    saveSession();
    updateDisplay();
    triggerFlash();
    logEntry('MANUAL +' + n);
}

function resetAll() {
    if (!confirm('Clear all session data?')) return;
    count = 0;
    saveSession();
    updateDisplay();
    logList.innerHTML = '';
}

function updateDisplay() {
    countDisplay.textContent = count;
    countDisplay.classList.remove('pop');
    void countDisplay.offsetWidth; // Trigger reflow
    countDisplay.classList.add('pop');
}

function triggerFlash() {
    const fl = document.getElementById('flash');
    fl.classList.add('active');
    setTimeout(() => fl.classList.remove('active'), 200);
}

function logEntry(src) {
    const time = new Date().toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' });
    const item = document.createElement('div');
    item.className = 'log-item';
    item.innerHTML = `<span class="rep">#${count}</span><span class="src">${src}</span><span class="time">${time}</span>`;
    logList.prepend(item);
}

// ═══════════════════════════════════════════════════════════
//  UI HELPERS
// ═══════════════════════════════════════════════════════════
function setBadge(txt, cls) {
    stateBadge.textContent = txt;
    stateBadge.className = 'state-badge ' + cls;
}

function updateDebug(vals) {
    const dbState = document.getElementById('dbState');
    const dbWrist = document.getElementById('dbWrist');
    const dbChin = document.getElementById('dbChin');
    const dbPhase = document.getElementById('dbPhase');
    const dbConf = document.getElementById('dbConf');

    if (dbState) dbState.textContent = vals.state;
    if (dbWrist) dbWrist.textContent = vals.wrist;
    if (dbChin) dbChin.textContent = vals.chin;
    if (dbPhase) dbPhase.textContent = vals.phase;
    if (dbConf) dbConf.textContent = vals.conf;
}

function dot(id, cls) {
    const el = document.getElementById(id);
    if (el) el.className = 'dot ' + cls;
}

function txt(id, v) {
    const el = document.getElementById(id);
    if (el) el.textContent = v;
}

function setMode(m) {
    mode = m;
    const modeAuto = document.getElementById('modeAuto');
    const modeManual = document.getElementById('modeManual');
    const debugGrid = document.getElementById('debugGrid');

    if (modeAuto) modeAuto.classList.toggle('active', m === 'auto');
    if (modeManual) modeManual.classList.toggle('active', m === 'manual');
    if (debugGrid) debugGrid.style.opacity = (m === 'auto' ? '1' : '0.3');
}

// ═══════════════════════════════════════════════════════════
//  PERSISTENCE
// ═══════════════════════════════════════════════════════════
function saveSession() {
    localStorage.setItem('pullup_count', count);
}

function loadSession() {
    const stored = localStorage.getItem('pullup_count');
    if (stored) count = parseInt(stored);
}

// ═══════════════════════════════════════════════════════════
//  AUDIO FEEDBACK
// ═══════════════════════════════════════════════════════════
const audioCtx = new (window.AudioContext || window.webkitAudioContext)();

function playAudio(type) {
    if (audioCtx.state === 'suspended') audioCtx.resume();
    
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    
    if (type === 'rep') {
        osc.frequency.setValueAtTime(880, audioCtx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(440, audioCtx.currentTime + 0.1);
        gain.gain.setValueAtTime(0.1, audioCtx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.1);
        osc.start();
        osc.stop(audioCtx.currentTime + 0.1);
    } else if (type === 'top') {
        osc.frequency.setValueAtTime(660, audioCtx.currentTime);
        gain.gain.setValueAtTime(0.05, audioCtx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.05);
        osc.start();
        osc.stop(audioCtx.currentTime + 0.05);
    }
}

// ═══════════════════════════════════════════════════════════
//  DRAWING
// ═══════════════════════════════════════════════════════════
const SKELETON = [
    [5, 6], [5, 7], [7, 9], [6, 8], [8, 10], [5, 11], [6, 12], [11, 12]
];

function drawPose(pose) {
    const kps = pose.keypoints;
    const MIN = 0.3;

    // Draw lines
    ctx.lineWidth = 3;
    ctx.lineCap = 'round';
    SKELETON.forEach(([a, b]) => {
        const ka = kps[a], kb = kps[b];
        if (ka.score > MIN && kb.score > MIN) {
            ctx.beginPath();
            ctx.strokeStyle = 'rgba(0, 207, 255, 0.6)';
            ctx.moveTo(ka.x, ka.y);
            ctx.lineTo(kb.x, kb.y);
            ctx.stroke();
        }
    });

    // Draw dots
    kps.forEach(kp => {
        if (kp.score > MIN) {
            ctx.beginPath();
            ctx.arc(kp.x, kp.y, 4, 0, 2 * Math.PI);
            ctx.fillStyle = kp.name.includes('wrist') ? '#ff6b35' : '#00cfff';
            ctx.fill();
        }
    });
}

function closeTutorial() {
    const tutorial = document.getElementById('tutorial');
    if (tutorial) tutorial.classList.remove('active');
    sessionStorage.setItem('pullup_tutorial_dismissed', 'true');
}

// Boot
window.onload = init;