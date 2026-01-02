document.addEventListener('DOMContentLoaded', () => {
    const audio = document.getElementById('bgMusic');
    const slashSound = document.getElementById('slash-sound');
    const musicBtn = document.getElementById('music-control');
    const musicStatus = document.getElementById('music-status');
    const themeBtn = document.getElementById('theme-btn');
    const langBtn = document.getElementById('lang-btn');

    // --- 1. وظائف التحكم الأساسية (الحفظ والتطبيق) ---

    function applySettings() {
        const lang = localStorage.getItem('samurai_lang') || 'en';
        const theme = localStorage.getItem('samurai_theme') || 'dark';
        const musicSetting = localStorage.getItem('samurai_music_on'); // جلب حالة الموسيقى

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

        // تحديث نص زر الموسيقى بناءً على الحالة المحفوظة
        if (musicStatus) {
            musicStatus.innerText = (musicSetting === 'false') ? "OFF" : "ON";
        }
    }

    applySettings();

    // أحداث تغيير اللغة والثيم (كما هي)
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

    // --- 2. نظام الصوت والموسيقى المطور ---

    function forcePlayMusic() {
        // شرط إضافي: لا تشغل الموسيقى إذا كان المستخدم قد أطفأها سابقاً
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

    // استماع للتفاعل لبدء الموسيقى (ستعمل فقط إذا كانت الإعدادات تسمح)
    ['click', 'scroll', 'touchstart', 'mousemove'].forEach(evt => 
        window.addEventListener(evt, forcePlayMusic));

    if (musicBtn) {
        musicBtn.onclick = (e) => {
            e.stopPropagation();
            if (audio.paused) {
                audio.play();
                musicStatus.innerText = "ON";
                localStorage.setItem('samurai_music_on', 'true'); // حفظ الحالة: تشغيل
            } else {
                audio.pause();
                musicStatus.innerText = "OFF";
                localStorage.setItem('samurai_music_on', 'false'); // حفظ الحالة: إيقاف
            }
        };
    }

    // تأثير ضربة السيف (تأكد من استخدام clientX لتعمل مع التنسيق الجديد)
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

    // --- 3. تأثير البتلات ---
    const petalContainer = document.getElementById('petals-container');
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
// --- كود معالجة إرسال الرسائل ---
document.addEventListener('DOMContentLoaded', () => {
    // نحدد النموذج (Form) - تأكد أن لديك وسم <form> أو استخدم class محدد
    const contactForm = document.querySelector('form');

    if (contactForm) {
        contactForm.addEventListener('submit', (e) => {
            e.preventDefault(); // منع الصفحة من إعادة التحميل

            // جلب حالة اللغة الحالية للمزامنة
            const isAr = localStorage.getItem('samurai_lang') === 'ar';

            // 1. إظهار السناك بار الموحد
            if (typeof showSamuraiToast === "function") {
                showSamuraiToast(
                    isAr ? "تم إرسال رسالتك بنجاح أيها الساموراي!" : "Message sent successfully, Samurai!", 
                    "success"
                );
            }

            // 2. تصفير الحقول بعد الإرسال لإعطاء إحساس بالنجاح
            contactForm.reset();

            // 3. إضافة تأثير اختفاء بسيط للنموذج (اختياري)
            contactForm.style.opacity = '0.5';
            setTimeout(() => {
                contactForm.style.opacity = '1';
            }, 1000);
            
            // يمكنك هنا إضافة كود لإرسال البيانات إلى EmailJS أو أي Server لاحقاً
        });
    }
});