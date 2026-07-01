/* ─────────────────────────────────────────────────────────
   Samurai Pixel — Games Engine
   Three games: Sword Duel, Sensei Guard, Armor Puzzle
───────────────────────────────────────────────────────── */

/* ════════════════════════════════════════
   SHARED STATE & SETUP
════════════════════════════════════════ */
const canvas  = () => document.getElementById('gameCanvas');
const ctx     = () => canvas().getContext('2d');
const popup   = () => document.getElementById('game-popup');
const scoreEl = () => document.getElementById('score-val');
const livesEl = () => document.getElementById('lives-container');

let currentGame  = null;
let animFrame    = null;
let gameRunning  = false;
let gameScore    = 0;
let gameLives    = 3;
let gameTime     = 60;
let timerInterval = null;
const CANVAS_W = 600, CANVAS_H = 420;

/* ── Particle system ──────────────────── */
let particles = [];

function spawnParticles(x, y, color, count) {
    count = count || 10;
    for (let i = 0; i < count; i++) {
        const angle = (Math.PI * 2 / count) * i + Math.random() * 0.4;
        const speed = 2 + Math.random() * 4;
        particles.push({
            x, y,
            vx: Math.cos(angle) * speed,
            vy: Math.sin(angle) * speed,
            life: 1, decay: 0.03 + Math.random() * 0.04,
            size: 3 + Math.random() * 4,
            color: color || '#e63946'
        });
    }
}

function updateParticles(c) {
    particles = particles.filter(function(p) { return p.life > 0; });
    particles.forEach(function(p) {
        p.x  += p.vx; p.y  += p.vy;
        p.vy += 0.18;
        p.life -= p.decay;
        c.save();
        c.globalAlpha = p.life;
        c.fillStyle = p.color;
        c.fillRect(p.x, p.y, p.size, p.size);
        c.restore();
    });
}

/* ── HUD helpers ──────────────────────── */
function updateHUD() {
    var s = scoreEl();
    var l = livesEl();
    if (s) s.textContent = 'SCORE: ' + gameScore;
    if (l) l.textContent = '❤ ' + gameLives + '  ⏱ ' + gameTime + 's';
}

function drawHUDOverlay(c, extra) {
    c.save();
    c.fillStyle = 'rgba(0,0,0,0.55)';
    c.fillRect(0, 0, CANVAS_W, 38);
    c.fillStyle = '#ffd700';
    c.font = '10px "Press Start 2P", monospace';
    c.fillText('SCORE: ' + gameScore, 12, 24);
    c.fillStyle = '#e63946';
    c.fillText('❤ ' + gameLives, CANVAS_W / 2 - 20, 24);
    c.fillStyle = '#fff';
    c.fillText('⏱ ' + gameTime + 's', CANVAS_W - 100, 24);
    if (extra) {
        c.fillStyle = '#ffd700';
        c.fillText(extra, CANVAS_W / 2 - 40, 60);
    }
    c.restore();
}

/* ── Canvas helper ──────────────────────── */
function fillRoundRect(c, x, y, w, h, r, fill) {
    c.beginPath();
    c.moveTo(x + r, y);
    c.arcTo(x + w, y, x + w, y + h, r);
    c.arcTo(x + w, y + h, x, y + h, r);
    c.arcTo(x, y + h, x, y, r);
    c.arcTo(x, y, x + w, y, r);
    c.closePath();
    c.fillStyle = fill;
    c.fill();
}

/* ── Timer ──────────────────────────────── */
function startTimer(onEnd) {
    clearInterval(timerInterval);
    gameTime = 60;
    timerInterval = setInterval(function() {
        gameTime--;
        updateHUD();
        if (gameTime <= 0) {
            clearInterval(timerInterval);
            onEnd();
        }
    }, 1000);
}

/* ── Game over screen ──────────────────── */
function drawGameOverScreen(c, label, sub) {
    c.save();
    c.fillStyle = 'rgba(5,5,5,0.88)';
    c.fillRect(0, 0, CANVAS_W, CANVAS_H);

    c.fillStyle = label === 'MISSION FAILED' ? '#e63946' : '#ffd700';
    c.font = 'bold 18px "Press Start 2P", monospace';
    c.textAlign = 'center';
    c.fillText(label, CANVAS_W / 2, CANVAS_H / 2 - 50);

    c.fillStyle = '#fff';
    c.font = '10px "Press Start 2P", monospace';
    c.fillText(sub, CANVAS_W / 2, CANVAS_H / 2 - 18);

    c.fillStyle = '#ffd700';
    c.font = '12px "Press Start 2P", monospace';
    c.fillText('SCORE: ' + gameScore, CANVAS_W / 2, CANVAS_H / 2 + 20);

    var bestKey = 'best_' + currentGame;
    var prev    = parseInt(localStorage.getItem(bestKey) || 0);
    if (gameScore > prev) {
        localStorage.setItem(bestKey, gameScore);
        c.fillStyle = '#00c896';
        c.font = '8px "Press Start 2P", monospace';
        c.fillText('✦ NEW BEST! ✦', CANVAS_W / 2, CANVAS_H / 2 + 48);
    } else {
        c.fillStyle = 'rgba(255,255,255,0.4)';
        c.font = '8px "Press Start 2P", monospace';
        c.fillText('BEST: ' + prev, CANVAS_W / 2, CANVAS_H / 2 + 48);
    }

    fillRoundRect(c, CANVAS_W / 2 - 80, CANVAS_H / 2 + 65, 160, 34, 4, 'rgba(230,57,70,0.25)');
    c.strokeStyle = '#e63946';
    c.lineWidth = 1.5;
    c.strokeRect(CANVAS_W / 2 - 80, CANVAS_H / 2 + 65, 160, 34);
    c.fillStyle = '#fff';
    c.font = '8px "Press Start 2P", monospace';
    c.fillText('PLAY AGAIN  ↩', CANVAS_W / 2, CANVAS_H / 2 + 87);

    c.restore();
    c.textAlign = 'left';
}

function finishGame(label) {
    label = label || 'TIME UP';
    clearInterval(timerInterval);
    gameRunning = false;
    cancelAnimationFrame(animFrame);

    var total = parseInt(localStorage.getItem('samurai_total_accumulated') || 0) + gameScore;
    localStorage.setItem('samurai_total_accumulated', total);
    var played = parseInt(localStorage.getItem('samurai_games_played') || 0) + 1;
    localStorage.setItem('samurai_games_played', played);

    drawGameOverScreen(ctx(), label, 'SESSION COMPLETE');
    refreshLobbyStats();

    canvas().onclick = function() {
        canvas().onclick = null;
        launchGame(currentGame);
    };
}

/* ── Lobby stats ────────────────────────── */
function refreshLobbyStats() {
    var total  = parseInt(localStorage.getItem('samurai_total_accumulated') || 0);
    var played = parseInt(localStorage.getItem('samurai_games_played') || 0);
    var goal   = 60000;
    var pct    = Math.min(100, Math.round(total / goal * 100));

    var td = document.getElementById('total-display');
    var gp = document.getElementById('games-played');
    var gx = document.getElementById('goal-pct');
    if (td) td.textContent = total.toLocaleString();
    if (gp) gp.textContent = played;
    if (gx) gx.textContent = pct + '%';

    ['duel', 'sensei', 'puzzle'].forEach(function(g) {
        var el = document.getElementById('best-' + g);
        if (el) el.textContent = parseInt(localStorage.getItem('best_' + g) || 0).toLocaleString();
    });
}

function resetProgress() {
    ['samurai_total_accumulated', 'samurai_games_played', 'best_duel', 'best_sensei', 'best_puzzle']
        .forEach(function(k) { localStorage.removeItem(k); });
    refreshLobbyStats();
    showSamuraiToast('Progress reset!', 'info');
}

/* ── Music & page init ──────────────────── */
document.addEventListener('DOMContentLoaded', function() {
    var audio       = document.getElementById('bgMusic');
    var musicBtn    = document.getElementById('music-btn-manual');
    var musicStatus = document.getElementById('music-status');

    var lang  = localStorage.getItem('samurai_lang')  || 'en';
    var theme = localStorage.getItem('samurai_theme') || 'dark';
    var isAr  = lang === 'ar';

    document.documentElement.lang = isAr ? 'ar' : 'en';
    document.body.classList.toggle('rtl', isAr);
    document.body.classList.toggle('light-mode', theme === 'light');

    document.querySelectorAll('[data-en]').forEach(function(el) {
        var txt = isAr ? el.getAttribute('data-ar') : el.getAttribute('data-en');
        if (txt) el.innerText = txt;
    });

    if (musicStatus) musicStatus.innerText = localStorage.getItem('samurai_music_on') === 'false' ? 'OFF' : 'ON';

    function tryPlay() {
        var off = localStorage.getItem('samurai_music_on') === 'false';
        if (off || !audio) return;
        audio.volume = 0.3;
        audio.play().then(function() {
            if (musicStatus) musicStatus.innerText = 'ON';
        }).catch(function() {});
    }

    ['click', 'keydown', 'touchstart'].forEach(function(e) {
        window.addEventListener(e, tryPlay, { once: true });
    });

    if (musicBtn) {
        musicBtn.onclick = function(e) {
            e.stopPropagation();
            if (!audio) return;
            if (audio.paused) {
                audio.play();
                if (musicStatus) musicStatus.innerText = 'ON';
                localStorage.setItem('samurai_music_on', 'true');
            } else {
                audio.pause();
                if (musicStatus) musicStatus.innerText = 'OFF';
                localStorage.setItem('samurai_music_on', 'false');
            }
        };
    }

    var doors = document.querySelector('.samurai-doors');
    setTimeout(function() { if (doors) doors.classList.add('open'); }, 100);

    document.querySelectorAll('a').forEach(function(link) {
        link.addEventListener('click', function(e) {
            if (link.hostname === location.hostname && !link.hash && link.target !== '_blank') {
                e.preventDefault();
                var url = link.href;
                if (doors) { doors.classList.remove('open'); doors.classList.add('close'); }
                setTimeout(function() { location.href = url; }, 650);
            }
        });
    });

    var petalContainer = document.getElementById('petals-container');
    if (petalContainer) {
        setInterval(function() {
            var p = document.createElement('div');
            p.className = 'petal';
            p.style.left = Math.random() * 100 + 'vw';
            p.style.animationDuration = (Math.random() * 4 + 6) + 's';
            petalContainer.appendChild(p);
            setTimeout(function() { p.remove(); }, 10000);
        }, 400);
    }

    refreshLobbyStats();
});

/* ── Toast ───────────────────────────────── */
function showSamuraiToast(msg, type) {
    type = type || 'default';
    var c = document.getElementById('snackbar-container');
    if (!c) return;
    var t = document.createElement('div');
    t.className = 'snackbar ' + type;
    var icons = { success: '✓', info: '!', default: '⚔' };
    t.innerHTML = '<span>' + (icons[type] || '⚔') + '</span><span>' + msg + '</span>';
    c.appendChild(t);
    setTimeout(function() {
        t.classList.add('fade-out');
        setTimeout(function() { t.remove(); }, 350);
    }, 3000);
}

/* ════════════════════════════════════════
   LAUNCH / EXIT
════════════════════════════════════════ */
function launchGame(name) {
    currentGame = name;
    gameScore   = 0;
    gameLives   = 3;
    gameTime    = 60;
    particles   = [];
    gameRunning = true;

    clearInterval(timerInterval);
    cancelAnimationFrame(animFrame);

    var cv = canvas();
    cv.onclick = null;
    // Remove old touch listeners by cloning
    var newCanvas = cv.cloneNode(true);
    cv.parentNode.replaceChild(newCanvas, cv);

    popup().classList.remove('hidden');
    updateHUD();

    if (name === 'duel')   startDuel();
    if (name === 'sensei') startSensei();
    if (name === 'puzzle') startPuzzle();
}

function exitGame() {
    gameRunning = false;
    clearInterval(timerInterval);
    cancelAnimationFrame(animFrame);
    popup().classList.add('hidden');
    refreshLobbyStats();
}


/* ════════════════════════════════════════
   GAME 1 — SWORD DUEL
════════════════════════════════════════ */
var ninjas      = [];
var combo       = 0;
var comboTimer  = 0;
var comboLabels = [];

function Ninja() {
    this.x    = 40 + Math.random() * (CANVAS_W - 80);
    this.y    = -60;
    this.vy   = 1.5 + Math.random() * 2.5;
    this.size = 36 + Math.random() * 14;
    this.alive  = true;
    this.hit    = false;
    this.rotation = (Math.random() - 0.5) * 0.08;
    this.angle    = 0;
    this.wobble   = Math.random() * Math.PI * 2;
    this.isBoss   = false;
    this.bossHP   = 5;
}

Ninja.prototype.draw = function(c) {
    c.save();
    c.translate(this.x, this.y);
    c.rotate(this.angle);
    var s = this.size;

    // Shadow
    c.fillStyle = 'rgba(0,0,0,0.3)';
    c.beginPath();
    c.ellipse(0, s * 0.52, s * 0.35, 6, 0, 0, Math.PI * 2);
    c.fill();

    // Body robe
    fillRoundRect(c, -s * 0.22, -s * 0.1, s * 0.44, s * 0.55, 4, this.isBoss ? '#8b0000' : '#1a1a2e');

    // Head
    c.fillStyle = this.isBoss ? '#5a0000' : '#16213e';
    c.beginPath();
    c.arc(0, -s * 0.28, s * 0.25, 0, Math.PI * 2);
    c.fill();

    // Headband
    c.fillStyle = this.isBoss ? '#ff0000' : '#e63946';
    c.fillRect(-s * 0.25, -s * 0.36, s * 0.5, s * 0.1);

    // Eyes
    c.fillStyle = this.isBoss ? '#ff6600' : '#ffd700';
    c.fillRect(-s * 0.12, -s * 0.3, s * 0.07, s * 0.07);
    c.fillRect(s * 0.05, -s * 0.3, s * 0.07, s * 0.07);

    // Sword
    c.strokeStyle = '#aaa';
    c.lineWidth = 2;
    c.beginPath();
    c.moveTo(s * 0.22, -s * 0.1);
    c.lineTo(s * 0.5, s * 0.3);
    c.stroke();
    c.strokeStyle = '#8b4513';
    c.lineWidth = 4;
    c.beginPath();
    c.moveTo(s * 0.22, -s * 0.1);
    c.lineTo(s * 0.32, s * 0.05);
    c.stroke();

    // Boss HP bar
    if (this.isBoss) {
        c.fillStyle = '#333';
        c.fillRect(-s * 0.5, -s * 0.68, s, 8);
        c.fillStyle = '#e63946';
        c.fillRect(-s * 0.5, -s * 0.68, s * (this.bossHP / 5), 8);
        c.fillStyle = '#fff';
        c.font = '6px monospace';
        c.textAlign = 'center';
        c.fillText('BOSS HP', 0, -s * 0.68 - 2);
        c.textAlign = 'left';
    }

    c.restore();
};

Ninja.prototype.update = function() {
    this.y += this.vy;
    this.angle += this.rotation;
    this.wobble += 0.05;
    this.x += Math.sin(this.wobble) * 0.5;
};

Ninja.prototype.contains = function(px, py) {
    var s = this.size;
    return px > this.x - s * 0.5 && px < this.x + s * 0.5 &&
           py > this.y - s * 0.5 && py < this.y + s * 0.5;
};

function drawDuelBackground(c) {
    var sky = c.createLinearGradient(0, 0, 0, CANVAS_H);
    sky.addColorStop(0, '#03001C');
    sky.addColorStop(0.6, '#1a0832');
    sky.addColorStop(1, '#2d1b0e');
    c.fillStyle = sky;
    c.fillRect(0, 0, CANVAS_W, CANVAS_H);

    // Stars
    c.fillStyle = 'rgba(255,255,255,0.85)';
    [[50,30],[140,18],[210,45],[320,12],[430,28],[540,15],[80,80],[290,70],[480,55],[170,110],[390,90]].forEach(function(s) {
        c.fillRect(s[0], s[1], 2, 2);
    });

    // Moon + crescent
    var mGrad = c.createRadialGradient(480,55,2,480,55,40);
    mGrad.addColorStop(0,'#fff8dc'); mGrad.addColorStop(0.7,'#ffe599'); mGrad.addColorStop(1,'transparent');
    c.fillStyle = mGrad;
    c.beginPath(); c.arc(480,55,40,0,Math.PI*2); c.fill();
    c.fillStyle = 'rgba(3,0,28,0.75)';
    c.beginPath(); c.arc(464,50,35,0,Math.PI*2); c.fill();

    // Ground
    c.fillStyle = '#0d0d0d';
    c.fillRect(0, CANVAS_H - 40, CANVAS_W, 40);
    var gGrad = c.createLinearGradient(0, CANVAS_H - 42, 0, CANVAS_H - 32);
    gGrad.addColorStop(0,'rgba(230,57,70,0.6)'); gGrad.addColorStop(1,'transparent');
    c.fillStyle = gGrad;
    c.fillRect(0, CANVAS_H - 42, CANVAS_W, 10);

    // Pagoda silhouette
    c.fillStyle = '#0a0a0a';
    var px2 = 80, py2 = CANVAS_H - 40;
    c.fillRect(px2 - 15, py2 - 60, 30, 60);
    [[px2,py2-60,50,10],[px2,py2-78,36,10],[px2,py2-92,22,10]].forEach(function(r) {
        c.beginPath();
        c.moveTo(r[0]-r[2]/2,r[1]+r[3]); c.lineTo(r[0],r[1]); c.lineTo(r[0]+r[2]/2,r[1]+r[3]);
        c.fill();
    });

    // Cherry blossom tree
    c.fillStyle = '#0a0a0a';
    c.fillRect(CANVAS_W - 110, CANVAS_H - 120, 8, 80);
    c.fillStyle = 'rgba(180,60,80,0.3)';
    c.beginPath(); c.arc(CANVAS_W - 106, CANVAS_H - 130, 42, 0, Math.PI*2); c.fill();
}

function drawComboLabels(c) {
    comboLabels = comboLabels.filter(function(l) { return l.life > 0; });
    comboLabels.forEach(function(l) {
        c.save();
        c.globalAlpha = l.life;
        c.fillStyle = l.color;
        c.font = 'bold ' + l.size + 'px "Press Start 2P", monospace';
        c.textAlign = 'center';
        c.fillText(l.text, l.x, l.y);
        c.restore();
        l.y   -= 1.5;
        l.life -= 0.025;
    });
    c.textAlign = 'left';
}

function getComboMult() {
    if (combo >= 8) return 3;
    if (combo >= 4) return 2;
    return 1;
}

function startDuel() {
    ninjas     = [];
    combo      = 0;
    comboTimer = 0;
    comboLabels = [];
    particles  = [];

    var spawnInterval = setInterval(function() {
        if (!gameRunning) { clearInterval(spawnInterval); return; }
        if (ninjas.length < 7) ninjas.push(new Ninja());
        if (gameScore >= 500 && Math.random() < 0.15 && !ninjas.some(function(n) { return n.isBoss; })) {
            var boss = new Ninja();
            boss.isBoss = true; boss.bossHP = 5; boss.size = 56; boss.vy = 0.9;
            ninjas.push(boss);
        }
    }, 1000);

    startTimer(function() { clearInterval(spawnInterval); finishGame('TIME UP'); });

    var cv = canvas();
    function handleTap(e) {
        if (!gameRunning) return;
        var rect = cv.getBoundingClientRect();
        var scaleX = CANVAS_W / rect.width, scaleY = CANVAS_H / rect.height;
        var cx, cy;
        if (e.touches) {
            cx = (e.touches[0].clientX - rect.left) * scaleX;
            cy = (e.touches[0].clientY - rect.top)  * scaleY;
        } else {
            cx = (e.clientX - rect.left) * scaleX;
            cy = (e.clientY - rect.top)  * scaleY;
        }

        var hitAny = false;
        ninjas.forEach(function(n) {
            if (!n.alive || !n.contains(cx, cy)) return;
            if (n.isBoss) {
                n.bossHP--;
                spawnParticles(n.x, n.y, '#ff4444', 5);
                if (n.bossHP <= 0) {
                    n.alive = false;
                    spawnParticles(n.x, n.y, '#ffd700', 20);
                    gameScore += 250;
                    comboLabels.push({ x: n.x, y: n.y - 20, text: '+250 BOSS!', color: '#ffd700', size: 11, life: 1 });
                    updateHUD();
                }
            } else {
                n.alive = false;
                combo++;
                comboTimer = 90;
                var mult = getComboMult();
                var pts  = 10 * mult;
                gameScore += pts;
                spawnParticles(n.x, n.y, '#e63946', 8);
                var label = mult > 1 ? '+' + pts + ' x' + mult : '+' + pts;
                comboLabels.push({ x: n.x, y: n.y - 10, text: label, color: mult >= 3 ? '#ffd700' : '#fff', size: 10, life: 1 });
                updateHUD();
                hitAny = true;
            }
        });
        if (!hitAny) { combo = 0; comboTimer = 0; }
    }

    cv.addEventListener('click', handleTap);
    cv.addEventListener('touchstart', function(e) { e.preventDefault(); handleTap(e); }, { passive: false });

    function loop() {
        if (!gameRunning) return;
        var c = ctx();
        c.clearRect(0, 0, CANVAS_W, CANVAS_H);
        drawDuelBackground(c);

        if (comboTimer > 0) comboTimer--;
        else combo = 0;

        ninjas = ninjas.filter(function(n) {
            if (!n.alive) return false;
            n.update();
            if (n.y > CANVAS_H + 30) {
                if (!n.isBoss) {
                    gameLives--;
                    combo = 0;
                    updateHUD();
                    if (gameLives <= 0) { gameRunning = false; finishGame('MISSION FAILED'); }
                }
                return false;
            }
            return true;
        });
        ninjas.forEach(function(n) { n.draw(c); });
        updateParticles(c);
        drawComboLabels(c);

        // Combo bar
        if (combo > 0) {
            var mult = getComboMult();
            var barW = Math.min(combo * 20, CANVAS_W - 24);
            c.fillStyle = 'rgba(0,0,0,0.4)';
            c.fillRect(12, CANVAS_H - 22, CANVAS_W - 24, 10);
            c.fillStyle = mult >= 3 ? '#ffd700' : mult === 2 ? '#ff8c00' : '#e63946';
            c.fillRect(12, CANVAS_H - 22, barW, 10);
            c.fillStyle = '#fff';
            c.font = '7px "Press Start 2P", monospace';
            c.fillText('COMBO x' + mult + ' (' + combo + ')', 14, CANVAS_H - 26);
        }

        drawHUDOverlay(c);
        animFrame = requestAnimationFrame(loop);
    }
    loop();
}


/* ════════════════════════════════════════
   GAME 2 — SENSEI GUARD
════════════════════════════════════════ */
var arrows    = [];
var sensei    = {};
var deflectFX = [];

function Arrow() {
    this.fromLeft = Math.random() < 0.5;
    this.x  = this.fromLeft ? -30 : CANVAS_W + 30;
    this.y  = 160 + Math.random() * (CANVAS_H - 260);
    this.vx = this.fromLeft ? (2 + Math.random() * 2) : -(2 + Math.random() * 2);
    this.alive      = true;
    this.deflected  = false;
    this.deflectTimer = 0;
    this.vy         = 0;
    this.glow       = 0;
}

Arrow.prototype.update = function() {
    if (this.deflected) {
        this.vy -= 0.3;
        this.x  += this.vx * 3;
        this.y  += this.vy;
        this.deflectTimer++;
        if (this.deflectTimer > 30) this.alive = false;
        return;
    }
    this.x += this.vx;
    this.glow += 0.1;
    var dx = this.x - sensei.x;
    var dy = this.y - sensei.y;
    if (Math.abs(dx) < 30 && Math.abs(dy) < 60) {
        this.alive = false;
        gameLives--;
        updateHUD();
        spawnParticles(sensei.x, sensei.y, '#e63946', 8);
        if (gameLives <= 0) { gameRunning = false; finishGame('MISSION FAILED'); }
    }
};

Arrow.prototype.draw = function(c) {
    c.save();
    c.translate(this.x, this.y);
    var dir = this.fromLeft ? 1 : -1;
    if (this.deflected) c.rotate(this.fromLeft ? -Math.PI / 3 : -Math.PI * 2 / 3);
    c.shadowColor = '#ffd700';
    c.shadowBlur  = 8 + 6 * Math.sin(this.glow);

    c.strokeStyle = '#8b6914';
    c.lineWidth = 3;
    c.beginPath();
    c.moveTo(-28 * dir, 0); c.lineTo(18 * dir, 0);
    c.stroke();

    c.fillStyle = '#c0c0c0';
    c.beginPath();
    c.moveTo(18*dir,0); c.lineTo(28*dir,-5); c.lineTo(32*dir,0); c.lineTo(28*dir,5);
    c.closePath(); c.fill();

    c.strokeStyle = '#cc3300';
    c.lineWidth = 1.5;
    c.beginPath();
    c.moveTo(-20*dir,0); c.lineTo(-28*dir,-7);
    c.moveTo(-20*dir,0); c.lineTo(-28*dir,7);
    c.stroke();

    c.restore();
};

Arrow.prototype.contains = function(px, py) {
    return Math.abs(px - this.x) < 36 && Math.abs(py - this.y) < 18;
};

function drawSenseiBackground(c) {
    var bg = c.createLinearGradient(0,0,0,CANVAS_H);
    bg.addColorStop(0,'#1a0f00'); bg.addColorStop(0.55,'#2d1a08'); bg.addColorStop(1,'#3d2210');
    c.fillStyle = bg; c.fillRect(0,0,CANVAS_W,CANVAS_H);

    c.strokeStyle = 'rgba(180,120,40,0.15)';
    c.lineWidth = 1;
    for (var gx = 0; gx < CANVAS_W; gx += 80) {
        c.beginPath(); c.moveTo(gx,0); c.lineTo(gx,CANVAS_H); c.stroke();
    }
    for (var gy = 0; gy < CANVAS_H; gy += 60) {
        c.beginPath(); c.moveTo(0,gy); c.lineTo(CANVAS_W,gy); c.stroke();
    }

    c.fillStyle = 'rgba(100,60,10,0.18)';
    c.fillRect(0, 0, CANVAS_W, CANVAS_H * 0.55);
    c.strokeStyle = 'rgba(180,120,40,0.25)';
    c.lineWidth = 2;
    c.strokeRect(20, 10, CANVAS_W - 40, CANVAS_H * 0.52);

    [[120,40],[CANVAS_W-120,40]].forEach(function(pos) {
        var lx = pos[0], ly = pos[1];
        fillRoundRect(c, lx-14, ly, 28, 40, 6, '#cc2200');
        var lGrad = c.createRadialGradient(lx,ly+20,0,lx,ly+20,60);
        lGrad.addColorStop(0,'rgba(255,100,0,0.18)'); lGrad.addColorStop(1,'transparent');
        c.fillStyle = lGrad;
        c.beginPath(); c.arc(lx,ly+20,60,0,Math.PI*2); c.fill();
        c.strokeStyle = 'rgba(0,0,0,0.5)'; c.lineWidth = 1;
        c.beginPath();
        c.moveTo(lx,ly); c.lineTo(lx,ly+40);
        c.moveTo(lx-14,ly+20); c.lineTo(lx+14,ly+20);
        c.stroke();
        c.fillStyle = '#8b4513';
        c.fillRect(lx-7,ly-6,14,8); c.fillRect(lx-7,ly+38,14,8);
    });

    // Floor line
    c.fillStyle = 'rgba(180,120,40,0.4)';
    c.fillRect(0, CANVAS_H - 45, CANVAS_W, 3);
}

function drawSensei(c) {
    var x = sensei.x, y = sensei.y, s = 52;
    c.save();

    c.fillStyle = 'rgba(0,0,0,0.25)';
    c.beginPath(); c.ellipse(x, y+s*0.55, s*0.35, 8, 0, 0, Math.PI*2); c.fill();

    fillRoundRect(c, x-s*0.25, y-s*0.05, s*0.5, s*0.6, 4, '#f0e8d0');
    c.strokeStyle = '#b8a060'; c.lineWidth = 1.5;
    c.beginPath(); c.moveTo(x, y-s*0.05); c.lineTo(x, y+s*0.55); c.stroke();

    c.fillStyle = '#e8c89a';
    c.beginPath(); c.arc(x, y-s*0.3, s*0.24, 0, Math.PI*2); c.fill();

    fillRoundRect(c, x-s*0.12, y-s*0.08, s*0.24, s*0.2, 6, '#f5f5f5');

    c.strokeStyle = '#5a3820'; c.lineWidth = 1.5;
    c.beginPath(); c.arc(x-s*0.08, y-s*0.34, s*0.06, Math.PI, 0); c.stroke();
    c.beginPath(); c.arc(x+s*0.08, y-s*0.34, s*0.06, Math.PI, 0); c.stroke();

    c.strokeStyle = '#8b4513'; c.lineWidth = 4;
    c.beginPath(); c.moveTo(x+s*0.28, y-s*0.5); c.lineTo(x+s*0.28, y+s*0.6); c.stroke();

    var tipGrad = c.createRadialGradient(x+s*0.28,y-s*0.5,0,x+s*0.28,y-s*0.5,14);
    tipGrad.addColorStop(0,'rgba(255,215,0,0.8)'); tipGrad.addColorStop(1,'transparent');
    c.fillStyle = tipGrad;
    c.beginPath(); c.arc(x+s*0.28, y-s*0.5, 14, 0, Math.PI*2); c.fill();

    for (var i = 0; i < 3; i++) {
        c.fillStyle = i < gameLives ? '#e63946' : 'rgba(255,255,255,0.15)';
        c.beginPath(); c.arc(x - 16 + i*16, y+s*0.72, 6, 0, Math.PI*2); c.fill();
    }
    c.restore();
}

function drawDeflectFX(c) {
    deflectFX = deflectFX.filter(function(f) { return f.life > 0; });
    deflectFX.forEach(function(f) {
        c.save(); c.globalAlpha = f.life;
        c.strokeStyle = '#ffd700'; c.lineWidth = 2;
        c.beginPath(); c.arc(f.x, f.y, f.r, 0, Math.PI*2); c.stroke();
        c.restore();
        f.r += 3; f.life -= 0.06;
    });
}

function startSensei() {
    arrows    = [];
    deflectFX = [];
    particles = [];
    sensei    = { x: CANVAS_W / 2, y: CANVAS_H - 130 };

    var spawnInterval = setInterval(function() {
        if (!gameRunning) { clearInterval(spawnInterval); return; }
        if (arrows.length < 6) arrows.push(new Arrow());
    }, 900);

    startTimer(function() { clearInterval(spawnInterval); finishGame('TRAINING COMPLETE'); });

    var cv = canvas();
    function handleTap(e) {
        if (!gameRunning) return;
        var rect = cv.getBoundingClientRect();
        var scaleX = CANVAS_W / rect.width, scaleY = CANVAS_H / rect.height;
        var cx, cy;
        if (e.touches) {
            cx = (e.touches[0].clientX - rect.left) * scaleX;
            cy = (e.touches[0].clientY - rect.top)  * scaleY;
        } else {
            cx = (e.clientX - rect.left) * scaleX;
            cy = (e.clientY - rect.top)  * scaleY;
        }
        arrows.forEach(function(a) {
            if (!a.alive || a.deflected || !a.contains(cx, cy)) return;
            a.deflected = true;
            a.vx = -a.vx * 2;
            a.vy = -4;
            gameScore += 20;
            updateHUD();
            deflectFX.push({ x: a.x, y: a.y, r: 10, life: 1 });
            spawnParticles(a.x, a.y, '#ffd700', 6);
        });
    }

    cv.addEventListener('click', handleTap);
    cv.addEventListener('touchstart', function(e) { e.preventDefault(); handleTap(e); }, { passive: false });

    function loop() {
        if (!gameRunning) return;
        var c = ctx();
        c.clearRect(0, 0, CANVAS_W, CANVAS_H);
        drawSenseiBackground(c);
        drawSensei(c);

        arrows = arrows.filter(function(a) {
            a.update();
            if (!a.alive) return false;
            if (a.x < -80 || a.x > CANVAS_W + 80 || a.y < -80 || a.y > CANVAS_H + 80) return false;
            a.draw(c);
            return true;
        });

        updateParticles(c);
        drawDeflectFX(c);
        drawHUDOverlay(c);
        animFrame = requestAnimationFrame(loop);
    }
    loop();
}


/* ════════════════════════════════════════
   GAME 3 — ARMOR PUZZLE
════════════════════════════════════════ */
var ARMOR_ORDER  = ['wood','cloth','mask','sword'];
var ARMOR_EMOJI  = { wood:'🪵', cloth:'👘', mask:'👺', sword:'⚔️' };
var ARMOR_COLORS = { wood:'#8b5e3c', cloth:'#3c5fa8', mask:'#cc2200', sword:'#aaaaaa' };

var pieces    = [];
var collected = [];
var sets      = 0;
var wrongFX   = null;

function ArmPiece(type) {
    this.type  = type;
    this.x     = 80  + Math.random() * (CANVAS_W - 160);
    this.y     = 100 + Math.random() * (CANVAS_H - 200);
    this.vx    = (Math.random() - 0.5) * 3;
    this.vy    = (Math.random() - 0.5) * 3;
    this.size  = 38;
    this.angle = 0;
    this.spin  = (Math.random() - 0.5) * 0.04;
    this.glow  = Math.random() * Math.PI * 2;
    this.isNext = false;
    this.alive  = true;
}

ArmPiece.prototype.update = function() {
    this.x += this.vx; this.y += this.vy;
    this.angle += this.spin; this.glow += 0.06;
    var s = this.size;
    if (this.x < s)           { this.x = s;           this.vx =  Math.abs(this.vx); }
    if (this.x > CANVAS_W-s) { this.x = CANVAS_W-s; this.vx = -Math.abs(this.vx); }
    if (this.y < 55+s)        { this.y = 55+s;        this.vy =  Math.abs(this.vy); }
    if (this.y > CANVAS_H-s) { this.y = CANVAS_H-s; this.vy = -Math.abs(this.vy); }
};

ArmPiece.prototype.draw = function(c) {
    c.save();
    c.translate(this.x, this.y);
    c.rotate(this.angle);
    var s   = this.size;
    var col = ARMOR_COLORS[this.type];

    if (this.isNext) { c.shadowColor = col; c.shadowBlur = 18 + 8 * Math.sin(this.glow); }

    fillRoundRect(c, -s, -s, s*2, s*2, 8, 'rgba(0,0,0,0.55)');
    c.strokeStyle = this.isNext ? col : 'rgba(255,255,255,0.15)';
    c.lineWidth   = this.isNext ? 2.5 : 1.2;
    c.strokeRect(-s, -s, s*2, s*2);

    c.font = (s * 1.2) + 'px serif';
    c.textAlign = 'center'; c.textBaseline = 'middle';
    c.fillText(ARMOR_EMOJI[this.type], 0, 2);

    if (this.isNext) {
        c.shadowBlur = 0;
        fillRoundRect(c, -s, -s-18, s*2, 16, 3, col);
        c.fillStyle = '#fff';
        c.font = '7px "Press Start 2P", monospace';
        c.textBaseline = 'alphabetic';
        c.fillText('NEXT', 0, -s - 7);
    }
    c.restore();
    c.textAlign = 'left'; c.textBaseline = 'alphabetic';
};

ArmPiece.prototype.contains = function(px, py) {
    var s = this.size;
    return Math.abs(px - this.x) < s && Math.abs(py - this.y) < s;
};

function drawPuzzleBackground(c) {
    var bg = c.createLinearGradient(0,0,0,CANVAS_H);
    bg.addColorStop(0,'#001a0d'); bg.addColorStop(0.5,'#00291a'); bg.addColorStop(1,'#003320');
    c.fillStyle = bg; c.fillRect(0,0,CANVAS_W,CANVAS_H);

    c.strokeStyle = 'rgba(0,180,100,0.08)'; c.lineWidth = 1;
    for (var gx = 0; gx < CANVAS_W; gx += 60) {
        c.beginPath(); c.moveTo(gx,0); c.lineTo(gx,CANVAS_H); c.stroke();
    }
    for (var gy = 0; gy < CANVAS_H; gy += 60) {
        c.beginPath(); c.moveTo(0,gy); c.lineTo(CANVAS_W,gy); c.stroke();
    }

    c.strokeStyle = 'rgba(0,200,130,0.2)'; c.lineWidth = 2;
    [[10,10],[CANVAS_W-10,10],[10,CANVAS_H-10],[CANVAS_W-10,CANVAS_H-10]].forEach(function(p) {
        c.strokeRect(p[0]-12, p[1]-12, 24, 24);
    });
}

function drawProgressBar(c) {
    var n = ARMOR_ORDER.length;
    var barX = CANVAS_W/2 - (n*36)/2;
    var barY = CANVAS_H - 36;

    fillRoundRect(c, barX-10, barY-10, n*36+20, 38, 6, 'rgba(0,0,0,0.55)');

    ARMOR_ORDER.forEach(function(type, i) {
        var done = i < collected.length;
        var px   = barX + i*36 + 14;
        var py   = barY + 9;
        fillRoundRect(c, px-14, py-10, 28, 28, 4, done ? ARMOR_COLORS[type] : 'rgba(255,255,255,0.08)');
        c.font = '16px serif'; c.textAlign = 'center'; c.textBaseline = 'middle';
        c.globalAlpha = done ? 1 : 0.3;
        c.fillText(ARMOR_EMOJI[type], px, py+4);
        c.globalAlpha = 1;
    });
    c.textAlign = 'left'; c.textBaseline = 'alphabetic';

    if (sets > 0) {
        c.fillStyle = '#ffd700'; c.font = '8px "Press Start 2P", monospace';
        c.textAlign = 'center';
        c.fillText('SETS COMPLETE: ' + sets, CANVAS_W/2, CANVAS_H - 44);
        c.textAlign = 'left';
    }
}

function drawWrongFX(c) {
    if (!wrongFX) return;
    wrongFX.life -= 0.08;
    if (wrongFX.life <= 0) { wrongFX = null; return; }
    c.save();
    c.globalAlpha = wrongFX.life;
    c.fillStyle = '#e63946'; c.font = '10px "Press Start 2P", monospace';
    c.textAlign = 'center';
    c.fillText('✗ WRONG ORDER', wrongFX.x, wrongFX.y);
    c.restore(); c.textAlign = 'left';
    wrongFX.y -= 1;
}

function markNextPiece() {
    var next = ARMOR_ORDER[collected.length];
    pieces.forEach(function(p) { p.isNext = (p.type === next); });
}

function startPuzzle() {
    collected = []; sets = 0; particles = []; wrongFX = null;
    pieces = ARMOR_ORDER.map(function(t) { return new ArmPiece(t); });
    markNextPiece();

    startTimer(function() { finishGame('TIME UP'); });

    var cv = canvas();
    function handleTap(e) {
        if (!gameRunning) return;
        var rect = cv.getBoundingClientRect();
        var scaleX = CANVAS_W / rect.width, scaleY = CANVAS_H / rect.height;
        var cx, cy;
        if (e.touches) {
            cx = (e.touches[0].clientX - rect.left) * scaleX;
            cy = (e.touches[0].clientY - rect.top)  * scaleY;
        } else {
            cx = (e.clientX - rect.left) * scaleX;
            cy = (e.clientY - rect.top)  * scaleY;
        }

        var clicked = null;
        pieces.forEach(function(p) { if (p.alive && p.contains(cx,cy)) clicked = p; });
        if (!clicked) return;

        var expected = ARMOR_ORDER[collected.length];
        if (clicked.type === expected) {
            collected.push(clicked.type);
            clicked.alive = false;
            spawnParticles(clicked.x, clicked.y, ARMOR_COLORS[clicked.type], 12);
            gameScore += 50;
            updateHUD();

            if (collected.length === ARMOR_ORDER.length) {
                sets++;
                gameScore += 200 + sets * 50;
                updateHUD();
                spawnParticles(CANVAS_W/2, CANVAS_H/2, '#ffd700', 25);
                setTimeout(function() {
                    if (!gameRunning) return;
                    collected = [];
                    pieces = ARMOR_ORDER.map(function(t) { return new ArmPiece(t); });
                    markNextPiece();
                }, 800);
            } else {
                pieces = pieces.filter(function(p) { return p.alive; });
                markNextPiece();
            }
        } else {
            wrongFX = { x: clicked.x, y: clicked.y - 20, life: 1 };
            spawnParticles(clicked.x, clicked.y, '#e63946', 5);
            gameScore = Math.max(0, gameScore - 10);
            updateHUD();
        }
    }

    cv.addEventListener('click', handleTap);
    cv.addEventListener('touchstart', function(e) { e.preventDefault(); handleTap(e); }, { passive: false });

    function loop() {
        if (!gameRunning) return;
        var c = ctx();
        c.clearRect(0,0,CANVAS_W,CANVAS_H);
        drawPuzzleBackground(c);
        pieces.forEach(function(p) { p.update(); p.draw(c); });
        updateParticles(c);
        drawProgressBar(c);
        drawWrongFX(c);
        drawHUDOverlay(c);
        animFrame = requestAnimationFrame(loop);
    }
    loop();
}
