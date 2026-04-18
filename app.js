/**
 * PULL-UP COUNTER
 * Core logic with Pose Detection (MoveNet) - SIMPLE VERSION
 */

// ═══════════════════════════════════════════════════════════
//  STATE & CONFIG
// ═══════════════════════════════════════════════════════════
let count = 0;
let repGoal = 10;
let mode = 'auto'; 
let detector = null;
let camLive = false;

const PS = { NONE: 'NONE', HANGING: 'HANGING', TOP: 'TOP' };
let currentState = PS.NONE;
let lastRepTime = 0;

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
        checkCameraPermission();
    }

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
        checkCameraPermission();
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
    const troubleshoot = document.getElementById('permissionTroubleshoot');

    if (state === 'denied') {
        splashText.textContent = 'CAMERA ACCESS BLOCKED.';
        splashText.style.color = 'var(--danger)';
        splashText.style.opacity = '1';
        startBtn.textContent = 'FIX PERMISSIONS';
        startBtn.style.background = 'var(--danger)';
        startBtn.onclick = showPermissionHelp;
        if (troubleshoot) troubleshoot.style.display = 'block';
    } else if (state === 'prompt') {
        splashText.textContent = 'READY TO DETECT REPS';
        startBtn.textContent = 'ALLOW & START CAMERA';
        startBtn.style.background = 'var(--accent)';
        startBtn.onclick = startCamera;
        if (troubleshoot) troubleshoot.style.display = 'none';
    } else if (state === 'granted') {
        splashText.textContent = 'PERMISSION GRANTED';
        startBtn.textContent = 'ACTIVATE CAMERA';
        startBtn.style.background = 'var(--success)';
        startBtn.onclick = startCamera;
        if (troubleshoot) troubleshoot.style.display = 'none';
    }
}

function showPermissionHelp() {
    alert("HOW TO RESET CAMERA PERMISSIONS:\n\n1. Look at the browser address bar (where the URL is).\n2. Click the 'Lock' or 'Camera' icon (usually on the left).\n3. Change 'Camera' from 'Block' to 'Allow' (or click 'Reset Permission').\n4. Refresh the page.\n\nAlternatively, click 'RESET SITE DATA' in the header to clear all app cookies.");
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
        alert("Camera API not available.");
        return;
    }
    const splashText = document.querySelector('#splash p');
    splashText.textContent = 'REQUESTING ACCESS...';
    try {
        const stream = await navigator.mediaDevices.getUserMedia({
            video: { facingMode: 'user', width: { ideal: 640 }, height: { ideal: 480 } }
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
        splashText.textContent = 'CAMERA ERROR: ' + e.name;
        splashText.style.color = 'var(--danger)';
        splashText.style.opacity = '1';
    }
}

// ═══════════════════════════════════════════════════════════
//  DETECTION LOOP
// ═══════════════════════════════════════════════════════════
async function loop() {
    if (!detector || !camLive) return;
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
    } catch (e) { console.error(e); }
    requestAnimationFrame(loop);
}

function handleNoPose() {
    currentState = PS.NONE;
    setBadge('NO SUBJECT', 'inactive');
    updateDebug({ state: 'SEARCHING', wrist: '—', chin: '—', phase: '—', conf: '0%' });
}

// ═══════════════════════════════════════════════════════════
//  PULL-UP LOGIC (REVERTED SIMPLE BAR CROSS)
// ═══════════════════════════════════════════════════════════
function analyze(pose) {
    const kps = pose.keypoints;
    const MIN_CONF = 0.10; 
    
    const nose = kps[0];
    const lWr = kps[9], rWr = kps[10];
    const lSh = kps[5], rSh = kps[6];

    const isOk = (k) => k && k.score > MIN_CONF;
    const okHands = [lWr, rWr].filter(isOk);
    const okShoulders = [lSh, rSh].filter(isOk);
    const hasNose = isOk(nose);

    // Only need nose and at least one hand (or shoulder as fallback)
    if (!hasNose || (okHands.length === 0 && okShoulders.length === 0)) {
        handleNoPose();
        return;
    }

    const h = canvas.height;
    // Use highest hand, or shoulders if hands lost
    let barRefY;
    if (okHands.length > 0) {
        barRefY = Math.min(...okHands.map(k => k.y)) / h;
    } else {
        // If hands are too high and lost, use shoulders + offset
        barRefY = (Math.min(...okShoulders.map(k => k.y)) / h) - 0.1;
    }

    const nNose = nose.y / h;

    // Head is near or above the bar level
    const isAbove = nNose < (barRefY + 0.06); 
    // Head is significantly below the bar
    const isBelow = nNose > (barRefY + 0.15); 

    updateDebug({
        state: 'ROBUST TRACKING',
        wrist: Math.round(barRefY * h) + 'px',
        chin: Math.round(nNose * h) + 'px',
        phase: isAbove ? 'TOP' : (isBelow ? 'BOTTOM' : 'MID'),
        conf: Math.round(nose.score * 100) + '%'
    });

    // Step 1: READY (Head is below bar)
    if (currentState === PS.NONE || currentState === PS.TOP) {
        if (isBelow) {
            currentState = PS.HANGING;
            setBadge('READY: BELOW BAR', 'active');
        }
    }

    // Step 2: COUNT AT TOP (Head crosses above bar)
    if (currentState === PS.HANGING) {
        if (isAbove) {
            const now = Date.now();
            if (now - lastRepTime > 500) {
                completeRep(); 
                lastRepTime = now;
                currentState = PS.TOP;
                setBadge('REACHED TOP ✓', 'top');
            }
        }
    }
}

// ═══════════════════════════════════════════════════════════
//  RESET & CLEAR
// ═══════════════════════════════════════════════════════════
function resetAll() {
    count = 0;
    saveSession();
    updateDisplay();
    if (logList) logList.innerHTML = '';
    currentState = PS.NONE;
    setBadge('SESSION RESET', 'inactive');
}

function clearAllData() {
    if (confirm("Clear ALL session data, storage, and reset tutorial? \n\nNOTE: To reset camera permissions, you must also click the 'Lock' icon in your browser address bar and select 'Reset Permission'.")) {
        localStorage.clear();
        sessionStorage.clear();
        alert("Memory cleared! Page will reload.");
        window.location.reload();
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
    checkGoal();
}

function updateGoal() {
    repGoal = parseInt(document.getElementById('goalInput').value) || 10;
    document.getElementById('goalValue').textContent = repGoal;
    updateDisplay();
}

function checkGoal() {
    if (count === repGoal) {
        playAudio('goal');
        alert("GOAL REACHED! Amazing work.");
    }
}

function updateDisplay() {
    countDisplay.textContent = count;
    countDisplay.classList.remove('pop');
    void countDisplay.offsetWidth;
    countDisplay.classList.add('pop');
    
    const fill = document.getElementById('goalFill');
    if (fill) {
        const pct = Math.min((count / repGoal) * 100, 100);
        fill.style.width = pct + '%';
    }
}

function triggerFlash() {
    const fl = document.getElementById('flash');
    if (fl) {
        fl.classList.add('active');
        setTimeout(() => fl.classList.remove('active'), 200);
    }
}

function logEntry(src) {
    const time = new Date().toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' });
    const item = document.createElement('div');
    item.className = 'log-item';
    item.innerHTML = `<span class="rep">#${count}</span><span class="src">${src}</span><span class="time">${time}</span>`;
    logList.prepend(item);
}

function setBadge(txt, cls) {
    stateBadge.textContent = txt;
    stateBadge.className = 'state-badge ' + cls;
}

function updateDebug(vals) {
    txt('dbState', vals.state);
    txt('dbWrist', vals.wrist);
    txt('dbChin', vals.chin);
    txt('dbPhase', vals.phase);
    txt('dbConf', vals.conf);
}

function dot(id, cls) {
    const el = document.getElementById(id);
    if (el) el.className = 'dot ' + cls;
}

function txt(id, v) {
    const el = document.getElementById(id);
    if (el) el.textContent = v;
}

function saveSession() { localStorage.setItem('pullup_count', count); }
function loadSession() {
    const stored = localStorage.getItem('pullup_count');
    if (stored) count = parseInt(stored);
}

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
        osc.start(); osc.stop(audioCtx.currentTime + 0.1);
    } else if (type === 'top') {
        osc.frequency.setValueAtTime(660, audioCtx.currentTime);
        gain.gain.setValueAtTime(0.05, audioCtx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.05);
        osc.start(); osc.stop(audioCtx.currentTime + 0.05);
    } else if (type === 'goal') {
        osc.frequency.setValueAtTime(523.25, audioCtx.currentTime); 
        osc.frequency.exponentialRampToValueAtTime(1046.5, audioCtx.currentTime + 0.5); 
        gain.gain.setValueAtTime(0.1, audioCtx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.5);
        osc.start(); osc.stop(audioCtx.currentTime + 0.5);
    }
}

const SKELETON = [[5, 6], [5, 7], [7, 9], [6, 8], [8, 10], [5, 11], [6, 12], [11, 12]];
function drawPose(pose) {
    const kps = pose.keypoints;
    const MIN = 0.3;
    ctx.lineWidth = 3; ctx.lineCap = 'round';
    SKELETON.forEach(([a, b]) => {
        const ka = kps[a], kb = kps[b];
        if (ka.score > MIN && kb.score > MIN) {
            ctx.beginPath(); ctx.strokeStyle = 'rgba(0, 207, 255, 0.6)';
            ctx.moveTo(ka.x, ka.y); ctx.lineTo(kb.x, kb.y); ctx.stroke();
        }
    });
    kps.forEach(kp => {
        if (kp.score > MIN) {
            ctx.beginPath(); ctx.arc(kp.x, kp.y, 4, 0, 2 * Math.PI);
            ctx.fillStyle = kp.name.includes('wrist') ? '#ff6b35' : '#00cfff';
            ctx.fill();
        }
    });
}

function closeTutorial() {
    document.getElementById('tutorial').classList.remove('active');
    sessionStorage.setItem('pullup_tutorial_dismissed', 'true');
}

window.onload = init;