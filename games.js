document.addEventListener('DOMContentLoaded', () => {
    // === 1. الإعدادات والعناصر الأساسية ===
    const audio = document.getElementById('bgMusic');
    const slashSound = document.getElementById('slash-sound');
    const musicBtn = document.getElementById('music-btn-manual');
    const musicStatus = document.getElementById('music-status');
    const canvas = document.getElementById('gameCanvas');
    const ctx = canvas.getContext('2d');

    let gameActive = false;
    let score = 0; 
    let totalScore = parseInt(localStorage.getItem('samurai_total_accumulated')) || 0;
    let lives = 3;
    let timeLeft = 60;
    let enemies = [];
    let currentGame = '';
    let gameLoopReq;
    let timerInterval;
    let bossActive = false;
    let bossHP = 100;
    let difficulty = 1.0;
    const puzzleOrder = ["🪵", "👘", "👺", "⚔️"]; 
    let nextPartIndex = 0;

    // === 2. نظام الترجمة (الإصلاح المطلوب) ===
    function applyLanguage() {
        const lang = localStorage.getItem('samurai_lang') || 'en';
        document.body.classList.toggle('rtl', lang === 'ar');
        
        // البحث عن كل عنصر لديه بيانات ترجمة وتبديلها
        document.querySelectorAll('[data-en]').forEach(el => {
            el.innerText = lang === 'ar' ? el.getAttribute('data-ar') : el.getAttribute('data-en');
        });
    }

    // === 3. المزامنة والموسيقى ===
    function initSync() {
        applyLanguage(); // تفعيل الترجمة عند التحميل
        const theme = localStorage.getItem('samurai_theme') || 'dark';
        const musicSetting = localStorage.getItem('samurai_music_on');

        document.body.classList.toggle('light-mode', theme === 'light');

        if (musicSetting === 'true') {
            audio.play().catch(() => {});
            if(musicStatus) musicStatus.innerText = "ON";
        }
    }

    // === 4. محرك الألعاب (Game Engine) ===
    window.launchGame = (type) => {
        currentGame = type;
        score = 0; lives = 3; timeLeft = 60; enemies = [];
        bossActive = false; difficulty = 1.0; nextPartIndex = 0;
        gameActive = true;

        document.getElementById('game-popup').classList.remove('hidden');
        updateStats();
        startTimer();
        runEngine();
    };

    window.exitGame = () => {
        gameActive = false;
        clearInterval(timerInterval);
        cancelAnimationFrame(gameLoopReq);
        document.getElementById('game-popup').classList.add('hidden');
        ctx.clearRect(0, 0, canvas.width, canvas.height);
    };

    function startTimer() {
        clearInterval(timerInterval);
        timerInterval = setInterval(() => {
            if (gameActive) {
                timeLeft--;
                updateStats();
                if (timeLeft <= 0) endGame();
            }
        }, 1000);
    }

    function updateStats() {
        const lang = localStorage.getItem('samurai_lang') || 'en';
        const scoreTxt = lang === 'ar' ? "النقاط" : "SCORE";
        const totalTxt = lang === 'ar' ? "المجموع" : "TOTAL";
        
        document.getElementById('score-val').innerText = `${scoreTxt}: ${score} | ${totalTxt}: ${totalScore}`;
        document.getElementById('lives-container').innerText = `❤️ ${lives} | ⏳ ${timeLeft}s`;
    }

    // --- منطق الرسم (Drawing) ---
    function runEngine() {
        if (!gameActive) return;
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        difficulty += 0.0005;

        if (bossActive) drawBoss();
        else handleStandardGameplay();

        if (lives <= 0) endGame();
        else gameLoopReq = requestAnimationFrame(runEngine);
    }

    function handleStandardGameplay() {
        if (currentGame === 'duel') {
            if (Math.random() < 0.03 * difficulty) enemies.push({ x: Math.random()*400, y: -50, type: '🥷', speed: 3 * difficulty });
            drawDuel();
        } else if (currentGame === 'sensei') {
            drawSenseiRoom();
            if (Math.random() < 0.04 * difficulty) {
                let side = Math.random() > 0.5 ? -50 : 550;
                enemies.push({ x: side, y: 300, type: '🏹', speed: side < 0 ? 5 * difficulty : -5 * difficulty });
            }
            drawArrows();
        } else if (currentGame === 'puzzle') {
            drawPuzzleGame();
        }
        
        if (score > 0 && score % 1500 === 0 && !bossActive) { bossActive = true; bossHP = 100; enemies = []; }
    }

    function drawBoss() {
        ctx.font = "80px serif";
        ctx.fillText("👺", 210, 200);
        ctx.fillStyle = "#ff0000";
        ctx.fillRect(100, 50, bossHP * 3, 15);
    }

    function drawDuel() {
        enemies.forEach((enemy, i) => {
            enemy.y += enemy.speed;
            ctx.font = "40px serif";
            ctx.fillText(enemy.type, enemy.x, enemy.y);
            if (enemy.y > canvas.height) { enemies.splice(i,1); lives--; updateStats(); }
        });
    }

    function drawSenseiRoom() {
        ctx.font = "60px serif";
        ctx.fillText("👴", 220, 350);
    }

    function drawArrows() {
        enemies.forEach((arrow, i) => {
            arrow.x += arrow.speed;
            ctx.font = "30px serif";
            ctx.fillText("🏹", arrow.x, arrow.y);
            if (Math.abs(arrow.x - 250) < 30) { enemies.splice(i,1); lives--; updateStats(); }
        });
    }

    function drawPuzzleGame() {
        const lang = localStorage.getItem('samurai_lang') || 'en';
        ctx.font = "14px 'Press Start 2P'";
        ctx.fillStyle = "#ff0";
        ctx.fillText(lang === 'ar' ? "ركب القطعة المطلوبة" : "COLLECT PART", 120, 40);
        
        if (enemies.length === 0) {
            puzzleOrder.forEach(p => enemies.push({ x: Math.random()*400, y: Math.random()*200+100, type: p, vx: (Math.random()-0.5)*5, vy: (Math.random()-0.5)*5 }));
        }
        enemies.forEach(p => {
            p.x += p.vx; p.y += p.vy;
            if(p.x < 0 || p.x > 450) p.vx *= -1;
            if(p.y < 50 || p.y > 350) p.vy *= -1;
            ctx.font = "50px serif";
            ctx.fillText(p.type, p.x, p.y);
        });
    }

    canvas.addEventListener('mousedown', (e) => {
        if (!gameActive) return;
        const rect = canvas.getBoundingClientRect();
        const mx = e.clientX - rect.left;
        const my = e.clientY - rect.top;

        if (bossActive) {
            if (mx > 150 && mx < 350) { bossHP -= 15; if (bossHP <= 0) { bossActive = false; score += 1000; updateStats(); } }
        } else if (currentGame === 'puzzle') {
            enemies.forEach((p, i) => {
                if (mx > p.x - 20 && mx < p.x + 50 && my > p.y - 50 && my < p.y + 20) {
                    if (p.type === puzzleOrder[nextPartIndex]) {
                        enemies.splice(i, 1); nextPartIndex++; score += 500;
                        if (nextPartIndex >= 4) { score += 5000; nextPartIndex = 0; enemies = []; }
                        updateStats();
                    } else { lives--; updateStats(); }
                }
            });
        } else {
            enemies.forEach((item, i) => {
                if (mx > item.x - 20 && mx < item.x + 50 && my > item.y - 50 && my < item.y + 20) {
                    enemies.splice(i, 1); score += 100; updateStats();
                }
            });
        }
    });

    function endGame() {
        const isAr = localStorage.getItem('samurai_lang') === 'ar';
    showSamuraiToast(isAr ? "انتهت اللعبة! حاول ثانية" : "Game Over! Try again", "info");
        gameActive = false;
        clearInterval(timerInterval);
        totalScore += score;
        localStorage.setItem('samurai_total_accumulated', totalScore);
        alert(totalScore >= 60000 ? "UNLOCKED 25% OFF: SAMURAI25" : `SCORE: ${score}`);
        window.exitGame();
    }

    initSync();
});
document.addEventListener('DOMContentLoaded', () => {
    const doors = document.querySelector('.samurai-doors');

    // 1. عند الدخول: افتح الأبواب بعد تأخير بسيط
    setTimeout(() => {
        if (doors) doors.classList.add('open');
    }, 100);

    // 2. عند الضغط على الروابط: أغلق الأبواب ثم انتقل
    const navLinks = document.querySelectorAll('a');
    
    navLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            // نتحقق أن الرابط داخلي (في نفس الموقع)
            if (link.hostname === window.location.hostname && !link.hash && link.target !== "_blank") {
                e.preventDefault();
                const targetUrl = link.href;

                // إغلاق الأبواب
                doors.classList.remove('open');
                doors.classList.add('close');

                // الانتقال بعد انتهاء الأنيميشن (0.6 ثانية)
                setTimeout(() => {
                    window.location.href = targetUrl;
                }, 600);
            }
        });
    });
});
function showSamuraiToast(message, type = 'default') {
    const container = document.getElementById('snackbar-container');
    if (!container) return;

    // إنشاء عنصر الإشعار
    const toast = document.createElement('div');
    toast.className = `snackbar ${type}`;
    
    // إضافة أيقونة بسيطة حسب النوع
    let icon = '⚔️';
    if (type === 'success') icon = '✅';
    if (type === 'info') icon = '🎮';

    toast.innerHTML = `<span>${icon}</span> <span>${message}</span>`;

    // إضافة الإشعار للحاوية
    container.appendChild(toast);

    // إزالة الإشعار بعد 3 ثوانٍ
    setTimeout(() => {
        toast.classList.add('fade-out');
        setTimeout(() => toast.remove(), 400);
    }, 3000);
}