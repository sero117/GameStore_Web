document.addEventListener('DOMContentLoaded', () => {
    const langBtn = document.getElementById('lang-btn');
    const themeBtn = document.getElementById('theme-btn');

    // --- وظيفة المزامنة (تحديث الصفحة بناءً على الذاكرة) ---
    function syncSettings() {
        const savedLang = localStorage.getItem('language'); // 'ar' or 'en'
        const savedTheme = localStorage.getItem('theme'); // 'light' or 'dark'

        if (savedLang === 'ar') {
            applyLanguage('ar');
        }
        if (savedTheme === 'light') {
            document.body.classList.add('light-mode');
            themeBtn.innerText = "☀️";
        }
    }

    function applyLanguage(lang) {
        const isAr = (lang === 'ar');
        document.body.classList.toggle('rtl', isAr);
        langBtn.innerText = isAr ? "English" : "العربية";
        
        document.querySelectorAll('[data-en]').forEach(el => {
            el.innerText = isAr ? el.getAttribute('data-ar') : el.getAttribute('data-en');
        });
        localStorage.setItem('language', isAr ? 'ar' : 'en');
    }

    langBtn.onclick = () => {
        const currentLang = localStorage.getItem('language') === 'ar' ? 'en' : 'ar';
        applyLanguage(currentLang);
    };

    themeBtn.onclick = () => {
        document.body.classList.toggle('light-mode');
        const isLight = document.body.classList.contains('light-mode');
        localStorage.setItem('theme', isLight ? 'light' : 'dark');
        themeBtn.innerText = isLight ? "☀️" : "🌙";
    };

    syncSettings(); // تنفيذ المزامنة عند فتح الصفحة
});

function buyItem(item) {
    alert("Added " + item + " to your scroll!");
}
 // 3. نظام البتلات
 function createPetal() {
    const container = document.getElementById('petals-container');
    if (!container) return;
    const petal = document.createElement('div');
    petal.className = 'petal';
    petal.style.left = Math.random() * 100 + 'vw';
    petal.style.animationDuration = (Math.random() * 2 + 3) + 's';
    container.appendChild(petal);
    setTimeout(() => petal.remove(), 5000);
}
setInterval(createPetal, 500);