document.addEventListener('DOMContentLoaded', () => {
    // --- تعريف العناصر الأساسية ---
    const audio = document.getElementById('bgMusic');
    const slashSound = document.getElementById('slash-sound');
    const musicBtn = document.getElementById('music-control');
    const musicStatus = document.getElementById('music-status');
    const themeBtn = document.getElementById('theme-btn');
    const langBtn = document.getElementById('lang-btn');
    const doors = document.querySelector('.samurai-doors');
    const contactForm = document.querySelector('form');
    const petalContainer = document.getElementById('petals-container');

    // --- 1. وظائف التحكم الأساسية (الحفظ والتطبيق) ---
    function applySettings() {
        const lang = localStorage.getItem('samurai_lang') || 'en';
        const theme = localStorage.getItem('samurai_theme') || 'dark';
        const musicSetting = localStorage.getItem('samurai_music_on');

        // تطبيق اللغة
        const isAr = (lang === 'ar');
        document.body.classList.toggle('rtl', isAr);
        if (langBtn) langBtn.innerText = isAr ? "English" : "العربية";

        document.querySelectorAll('[data-en]').forEach(el => {
            el.innerText = isAr ? el.getAttribute('data-ar') : el.getAttribute('data-en');
        });

        // تطبيق الوضع الليلي
        const isLight = (theme === 'light');
        document.body.classList.toggle('light-mode', isLight);
        if (themeBtn) themeBtn.innerText = isLight ? "☀️" : "🌙";

        // تحديث نص زر الموسيقى
        if (musicStatus) {
            musicStatus.innerText = (musicSetting === 'false') ? "OFF" : "ON";
        }
    }

    applySettings();

    // أحداث تغيير اللغة والثيم
    if (langBtn) {
        langBtn.onclick = () => {
            const currentLang = localStorage.getItem('samurai_lang') === 'ar' ? 'en' : 'ar';
            localStorage.setItem('samurai_lang', currentLang);
            applySettings();
        };
    }

    if (themeBtn) {
        themeBtn.onclick = () => {
            const currentTheme = localStorage.getItem('samurai_theme') === 'light' ? 'dark' : 'light';
            localStorage.setItem('samurai_theme', currentTheme);
            applySettings();
        };
    }

    // --- 2. نظام الصوت والموسيقى والأبواب ---
    
    // إزالة كلاس التحميل فوراً
    document.body.classList.remove('loading');

    // فتح الأبواب عند الدخول
    if (doors) {
        requestAnimationFrame(() => {
            setTimeout(() => {
                doors.classList.add('open');
                doors.style.pointerEvents = 'none'; 
            }, 300);
        });
    }

    function forcePlayMusic() {
        const musicSetting = localStorage.getItem('samurai_music_on');
        if (musicSetting !== 'false' && audio && audio.paused) {
            audio.volume = 0;
            audio.play().then(() => {
                if (musicStatus) musicStatus.innerText = "ON";
                let fadeInterval = setInterval(() => {
                    if (audio.volume < 0.4) audio.volume += 0.05;
                    else clearInterval(fadeInterval);
                }, 200);
                removeInteractionListeners();
            }).catch(() => {});
        }
    }

    function removeInteractionListeners() {
        ['click', 'scroll', 'touchstart', 'mousemove'].forEach(evt => 
            window.removeEventListener(evt, forcePlayMusic));
    }

    ['click', 'scroll', 'touchstart', 'mousemove'].forEach(evt => 
        window.addEventListener(evt, forcePlayMusic));

    if (musicBtn) {
        musicBtn.onclick = (e) => {
            e.stopPropagation();
            if (audio.paused) {
                audio.play();
                musicStatus.innerText = "ON";
                localStorage.setItem('samurai_music_on', 'true');
            } else {
                audio.pause();
                musicStatus.innerText = "OFF";
                localStorage.setItem('samurai_music_on', 'false');
            }
        };
    }

    // --- 3. معالجة الروابط (الانتقال السلس عبر الأبواب) ---
    const navLinks = document.querySelectorAll('a');
    navLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            const href = link.getAttribute('href');
            if (href && !href.startsWith('#') && link.hostname === window.location.hostname) {
                e.preventDefault();
                if (doors) {
                    doors.classList.remove('open');
                    doors.classList.add('close');
                    doors.style.pointerEvents = 'all';
                }
                setTimeout(() => {
                    window.location.href = href;
                }, 600);
            }
        });
    });

    // --- 4. تأثير ضربة السيف والبتلات ---
    document.addEventListener('mousedown', (e) => {
        if (slashSound) {
            slashSound.currentTime = 0;
            slashSound.play().catch(() => {});
        }
        const slash = document.createElement('div');
        slash.className = 'slash-effect';
        slash.style.left = e.clientX + 'px';
        slash.style.top = e.clientY + 'px';
        document.body.appendChild(slash);
        setTimeout(() => slash.remove(), 250);
    });

    if (petalContainer) {
        setInterval(() => {
            const petal = document.createElement('div');
            petal.className = 'petal';
            petal.style.left = Math.random() * 100 + 'vw';
            petal.style.animationDuration = (Math.random() * 3 + 5) + 's';
            petalContainer.appendChild(petal);
            setTimeout(() => petal.remove(), 8000);
        }, 300);
    }

    // --- 5. معالجة إرسال الرسائل ---
    if (contactForm) {
        contactForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const isAr = localStorage.getItem('samurai_lang') === 'ar';

            if (typeof showSamuraiToast === "function") {
                showSamuraiToast(
                    isAr ? "تم إرسال رسالتك بنجاح أيها الساموراي!" : "Message sent successfully, Samurai!", 
                    "success"
                );
            }

            contactForm.reset();
            contactForm.style.opacity = '0.5';
            setTimeout(() => {
                contactForm.style.opacity = '1';
            }, 1000);
        });
    }
});

// --- وظيفة الإشعارات (خارج DOMContentLoaded لضمان توفرها عالمياً) ---
function showSamuraiToast(message, type = 'default') {
    const container = document.getElementById('snackbar-container');
    if (!container) return;

    const toast = document.createElement('div');
    toast.className = `snackbar ${type}`;
    
    let icon = '⚔️';
    if (type === 'success') icon = '✅';
    if (type === 'info') icon = '🎮';

    toast.innerHTML = `<span>${icon}</span> <span>${message}</span>`;
    container.appendChild(toast);

    setTimeout(() => {
        toast.classList.add('fade-out');
        setTimeout(() => toast.remove(), 400);
    }, 3000);
}
