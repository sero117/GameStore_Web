document.addEventListener('DOMContentLoaded', () => {
    const audio      = document.getElementById('bgMusic');
    const slashSound = document.getElementById('slash-sound');
    const musicBtn   = document.getElementById('music-control');
    const musicStatus = document.getElementById('music-status');
    const themeBtn   = document.getElementById('theme-btn');
    const langBtn    = document.getElementById('lang-btn');

    // ── Apply saved settings ──────────────────────────────
    function applySettings() {
        const lang      = localStorage.getItem('samurai_lang')  || 'en';
        const theme     = localStorage.getItem('samurai_theme') || 'dark';
        const musicSaved = localStorage.getItem('samurai_music_on');
        const isAr      = lang === 'ar';

        // Language
        document.documentElement.lang = isAr ? 'ar' : 'en';
        document.body.classList.toggle('rtl', isAr);
        if (langBtn) langBtn.innerText = isAr ? 'English' : 'العربية';

        document.querySelectorAll('[data-en]').forEach(el => {
            const txt = isAr ? el.getAttribute('data-ar') : el.getAttribute('data-en');
            if (txt) el.innerText = txt;
        });

        // Input placeholders
        document.querySelectorAll('[data-placeholder-en]').forEach(el => {
            el.placeholder = isAr
                ? (el.getAttribute('data-placeholder-ar') || el.getAttribute('data-placeholder-en'))
                : el.getAttribute('data-placeholder-en');
        });

        // Theme
        const isLight = theme === 'light';
        document.body.classList.toggle('light-mode', isLight);
        if (themeBtn) themeBtn.innerText = isLight ? '☀️' : '🌙';

        // Music status text
        if (musicStatus) {
            musicStatus.innerText = musicSaved === 'false' ? 'OFF' : 'ON';
        }
    }

    applySettings();

    // ── Language toggle ───────────────────────────────────
    if (langBtn) {
        langBtn.onclick = () => {
            const next = localStorage.getItem('samurai_lang') === 'ar' ? 'en' : 'ar';
            localStorage.setItem('samurai_lang', next);
            applySettings();
        };
    }

    // ── Theme toggle ──────────────────────────────────────
    if (themeBtn) {
        themeBtn.onclick = () => {
            const next = localStorage.getItem('samurai_theme') === 'light' ? 'dark' : 'light';
            localStorage.setItem('samurai_theme', next);
            applySettings();
        };
    }

    // ── Music ─────────────────────────────────────────────
    function tryPlayMusic() {
        const setting = localStorage.getItem('samurai_music_on');
        if (setting === 'false' || !audio) return;
        audio.volume = 0.35;
        audio.play().then(() => {
            if (musicStatus) musicStatus.innerText = 'ON';
            cleanup();
        }).catch(() => {});
    }

    function cleanup() {
        ['click', 'keydown', 'touchstart'].forEach(e => window.removeEventListener(e, tryPlayMusic));
    }

    ['click', 'keydown', 'touchstart'].forEach(e => window.addEventListener(e, tryPlayMusic));

    if (musicBtn) {
        musicBtn.onclick = e => {
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

    // ── Slash effect ──────────────────────────────────────
    document.addEventListener('mousedown', e => {
        if (slashSound) { slashSound.currentTime = 0; slashSound.play().catch(() => {}); }
        const el = document.createElement('div');
        el.className = 'slash-effect';
        el.style.left = e.clientX + 'px';
        el.style.top  = e.clientY + 'px';
        document.body.appendChild(el);
        setTimeout(() => el.remove(), 300);
    });

    // ── Petals ────────────────────────────────────────────
    const petalContainer = document.getElementById('petals-container');
    if (petalContainer) {
        setInterval(() => {
            const p = document.createElement('div');
            p.className = 'petal';
            p.style.left = Math.random() * 100 + 'vw';
            p.style.animationDuration = (Math.random() * 4 + 6) + 's';
            petalContainer.appendChild(p);
            setTimeout(() => p.remove(), 10000);
        }, 400);
    }

    // ── Door animation ────────────────────────────────────
    const doors = document.querySelector('.samurai-doors');
    setTimeout(() => doors && doors.classList.add('open'), 100);

    document.querySelectorAll('a').forEach(link => {
        link.addEventListener('click', e => {
            if (link.hostname === location.hostname && !link.hash && link.target !== '_blank') {
                e.preventDefault();
                const url = link.href;
                if (doors) { doors.classList.remove('open'); doors.classList.add('close'); }
                setTimeout(() => location.href = url, 650);
            }
        });
    });

    // ── Contact form ──────────────────────────────────────
    const contactForm = document.querySelector('.contact-form');
    if (contactForm) {
        contactForm.addEventListener('submit', e => {
            e.preventDefault();
            const isAr = localStorage.getItem('samurai_lang') === 'ar';
            showSamuraiToast(
                isAr ? 'تم إرسال رسالتك بنجاح!' : 'Message sent successfully!',
                'success'
            );
            contactForm.reset();
        });
    }
});

// ── Toast (global) ────────────────────────────────────────
function showSamuraiToast(msg, type = 'default') {
    const c = document.getElementById('snackbar-container');
    if (!c) return;
    const t = document.createElement('div');
    t.className = `snackbar ${type}`;
    const icons = { success: '✓', info: '!', default: '⚔' };
    t.innerHTML = `<span>${icons[type] || '⚔'}</span><span>${msg}</span>`;
    c.appendChild(t);
    setTimeout(() => {
        t.classList.add('fade-out');
        setTimeout(() => t.remove(), 350);
    }, 3000);
}
