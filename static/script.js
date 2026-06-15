// ============================================
// ВСЕ ФУНКЦИИ ДЛЯ САЙТА
// ============================================

// Ждём полной загрузки DOM-дерева перед инициализацией всех компонентов
document.addEventListener('DOMContentLoaded', () => {
    initApplicationForm();  // Добавить эту строку
    initApplicationsPage();
    initPhoneMask();            // Маска для телефона
    // createAuthModal();       // УДАЛЯЕМ - больше не создаём модальное окно
    initDynamicGreeting();      // Обновляет приветствие, если пользователь уже авторизован
    initButtonEffects();        // Добавляет анимации для кнопок и карточек
    initActiveMenu();           // Подсвечивает активный пункт меню при прокрутке
    initThemeToggle();          // Кнопка переключения светлой/тёмной темы
    initSmoothScroll();         // Плавная прокрутка к якорям
    initBackToTop();            // Кнопка "Наверх"
    initFilterSystem();         // Система фильтрации курсов
    initLoadMore();             // Кнопка для подгрузки дополнительных курсов
    initAccordion();            // Аккордеон (раскрывающиеся блоки с вопросами)
    initImageSlider();          // Слайдер изображений в hero-секции
    initScrollAnimation();      // Анимация появления элементов при скролле
    initFormValidation();       // Валидация формы обратной связи С СЕРВЕРОМ
    //initLoginButton();          // НОВАЯ ФУНКЦИЯ - настройка кнопки "Войти"
    initApplicationsPage(); // Загрузка заявок на странице "Мои заявки"
});

// ============================================
// ОТПРАВКА ДАННЫХ НА PYTHON-СЕРВЕР
// ============================================

async function validateOnPythonServer(type, value) {
    try {
        const response = await fetch(`http://localhost:5000/api/validate/${type}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ [type]: value })
        });

        const result = await response.json();
        return result;
    } catch (error) {
        console.error('Ошибка подключения к серверу:', error);
        return {
            valid: false,
            message: 'Сервер валидации недоступен. Проверьте, запущен ли Python-сервер.',
            cleaned: null
        };
    }
}

// Вспомогательная функция для валидации поля на сервере
async function validateFieldOnServer(type, value) {
    return await validateOnPythonServer(type, value);
}

// Функция показа ошибки под полем ввода
function showFieldError(inputElement, message) {
    // Удаляем старую ошибку если есть
    const oldError = inputElement.parentElement.querySelector('.field-error');
    if (oldError) oldError.remove();

    if (message) {
        const errorDiv = document.createElement('div');
        errorDiv.className = 'field-error';
        errorDiv.style.cssText = 'color: #e74c3c; font-size: 12px; margin-top: 5px; animation: fadeIn 0.3s ease;';
        errorDiv.textContent = message;
        inputElement.parentElement.appendChild(errorDiv);
        inputElement.style.borderColor = '#e74c3c';
    } else {
        inputElement.style.borderColor = '#4CAF50';
    }
}

// Функция показа анимации загрузки
function showLoading(element, isLoading) {
    if (isLoading) {
        element.style.opacity = '0.7';
        element.style.pointerEvents = 'none';
        const existingSpinner = element.parentElement.querySelector('.loading-spinner');
        if (!existingSpinner) {
            const spinner = document.createElement('span');
            spinner.className = 'loading-spinner';
            spinner.innerHTML = ' ';
            spinner.style.color = '#716e6e';
            element.parentElement.appendChild(spinner);
        }
    } else {
        element.style.opacity = '1';
        element.style.pointerEvents = 'auto';
        const spinner = element.parentElement.querySelector('.loading-spinner');
        if (spinner) spinner.remove();
    }
}

// ============================================
// МАСКА ДЛЯ ТЕЛЕФОНА (ИСПРАВЛЕННАЯ - ОСТАВЛЯЕТ ТОЛЬКО ЦИФРЫ ДЛЯ СЕРВЕРА)
// ============================================
function initPhoneMask() {
    const phoneInput = document.querySelector('input[placeholder="Ваш телефон"]');
    if (!phoneInput) return;

    // Убираем автоматическое форматирование - теперь только фильтрация
    phoneInput.addEventListener('input', function(e) {
        let value = this.value.replace(/[^\d+]/g, '');

        // Ограничиваем длину
        if (value.length > 12) {
            value = value.slice(0, 12);
        }

        this.value = value;
    });

    // Блокируем ввод букв
    phoneInput.addEventListener('keydown', function(e) {
        const allowedKeys = ['Backspace', 'Delete', 'ArrowLeft', 'ArrowRight', 'Tab', 'Home', 'End'];
        if (allowedKeys.includes(e.key)) return;
        if (e.ctrlKey || e.metaKey) return;

        // Разрешаем только цифры и плюс
        if (!/^\d$/.test(e.key) && e.key !== '+') {
            e.preventDefault();
        }
        // Запрещаем '+' если он уже есть
        if (e.key === '+' && this.value.includes('+')) {
            e.preventDefault();
        }
    });
}

// ============================================
// ВАЛИДАЦИЯ ФОРМЫ ОБРАТНОЙ СВЯЗИ С СЕРВЕРОМ (ВСЕ ПОЛЯ ОБЯЗАТЕЛЬНЫ)
// ============================================
function initFormValidation() {
    const contactForm = document.querySelector('.contact-form');
    if (!contactForm) return;

    // Проверяем, не добавлены ли уже обработчики
    if (contactForm.hasAttribute('data-validation-added')) return;
    contactForm.setAttribute('data-validation-added', 'true');

    // Находим поля формы
    const nameInput = contactForm.querySelector('input[placeholder="Ваше имя"]');
    const emailInput = contactForm.querySelector('input[placeholder="Ваш email"]');
    const phoneInput = contactForm.querySelector('input[placeholder="Ваш телефон"]');
    const courseSelect = contactForm.querySelector('select');
    const submitBtn = contactForm.querySelector('button[type="submit"]');

    // Функция для показа ошибки под полем
    function showFieldError(inputElement, message) {
        // Удаляем старую ошибку
        const oldError = inputElement.parentElement.querySelector('.field-error');
        if (oldError) oldError.remove();

        if (message) {
            const errorDiv = document.createElement('div');
            errorDiv.className = 'field-error';
            errorDiv.style.cssText = `
                color: #e74c3c;
                font-size: 12px;
                margin-top: 5px;
                background: #ffe6e6;
                padding: 8px 12px;
                border-radius: 5px;
                border-left: 3px solid #e74c3c;
            `;
            errorDiv.textContent = message.replace(/[]/g, '').trim();
            inputElement.parentElement.appendChild(errorDiv);
            inputElement.style.borderColor = '#e74c3c';
        } else {
            inputElement.style.borderColor = '#4CAF50';
        }
    }

    // Функция показа загрузки
    function showLoading(element, isLoading) {
        if (isLoading) {
            element.style.opacity = '0.7';
            element.style.pointerEvents = 'none';
            const existingSpinner = element.parentElement.querySelector('.loading-spinner');
            if (!existingSpinner) {
                const spinner = document.createElement('span');
                spinner.className = 'loading-spinner';
                spinner.innerHTML = ' ⏳';
                spinner.style.color = '#716e6e';
                element.parentElement.appendChild(spinner);
            }
        } else {
            element.style.opacity = '1';
            element.style.pointerEvents = 'auto';
            const spinner = element.parentElement.querySelector('.loading-spinner');
            if (spinner) spinner.remove();
        }
    }

    // Валидация email при потере фокуса
    if (emailInput) {
        emailInput.addEventListener('blur', async function() {
            const email = this.value.trim();
            if (email) {
                showLoading(this, true);
                const result = await validateFieldOnServer('email', email);
                showLoading(this, false);

                if (result.valid) {
                    showFieldError(this, null);
                } else {
                    showFieldError(this, result.message);
                }
            }
        });

        emailInput.addEventListener('input', function() {
            showFieldError(this, null);
        });
    }

    // Валидация телефона при потере фокуса
    if (phoneInput) {
        phoneInput.addEventListener('blur', async function() {
            const phone = this.value.trim();
            const cleanPhone = phone.replace(/[^\d+]/g, '');

            if (phone && cleanPhone !== '+7' && cleanPhone.length > 2) {
                showLoading(this, true);
                const result = await validateFieldOnServer('phone', phone);
                showLoading(this, false);

                if (result.valid) {
                    showFieldError(this, null);
                    if (result.cleaned) {
                        const cleaned = result.cleaned;
                        const formatted = cleaned.replace(/^\+7(\d{3})(\d{3})(\d{2})(\d{2})$/, '+7-$1-$2-$3-$4');
                        this.value = formatted;
                    }
                } else {
                    showFieldError(this, result.message);
                }
            }
        });

        phoneInput.addEventListener('input', function() {
            showFieldError(this, null);
        });
    }

    // ========== ОБРАБОТКА ОТПРАВКИ ФОРМЫ ==========
    contactForm.addEventListener('submit', async function(e) {
        e.preventDefault();
        let hasErrors = false;

        // 1. Проверка имени (обязательно)
        if (!nameInput.value.trim()) {
            showFieldError(nameInput, 'Введите ваше имя');
            nameInput.focus();
            hasErrors = true;
        } else {
            showFieldError(nameInput, null);
        }

        // 2. Проверка email (обязательно)
        if (!hasErrors && !emailInput.value.trim()) {
            showFieldError(emailInput, 'Введите ваш email');
            emailInput.focus();
            hasErrors = true;
        } else if (!hasErrors) {
            showLoading(submitBtn, true);
            const emailResult = await validateFieldOnServer('email', emailInput.value.trim());
            showLoading(submitBtn, false);

            if (!emailResult.valid) {
                showFieldError(emailInput, emailResult.message);
                emailInput.focus();
                hasErrors = true;
            } else {
                showFieldError(emailInput, null);
            }
        }

        // 3. Проверка телефона (ОБЯЗАТЕЛЬНО!)
        if (!hasErrors && !phoneInput.value.trim()) {
            showFieldError(phoneInput, 'Введите ваш телефон (обязательное поле)');
            phoneInput.focus();
            hasErrors = true;
        } else if (!hasErrors) {
            showLoading(submitBtn, true);
            const phoneResult = await validateFieldOnServer('phone', phoneInput.value.trim());
            showLoading(submitBtn, false);

            if (!phoneResult.valid) {
                showFieldError(phoneInput, phoneResult.message);
                phoneInput.focus();
                hasErrors = true;
            } else {
                showFieldError(phoneInput, null);
            }
        }

        // 4. Проверка выбора курса (обязательно)
        if (!hasErrors && !courseSelect.value) {
            showFieldError(courseSelect, 'Выберите курс из списка');
            courseSelect.focus();
            hasErrors = true;
        } else {
            showFieldError(courseSelect, null);
        }

        // Если ошибок нет - отправляем!
        if (!hasErrors) {
            const successDiv = document.createElement('div');
            successDiv.style.cssText = `
                background: #d4edda;
                color: #155724;
                padding: 15px;
                border-radius: 8px;
                margin-bottom: 20px;
                text-align: center;
                animation: fadeIn 0.3s ease;
            `;
            successDiv.textContent = 'Заявка успешно отправлена! Мы свяжемся с вами.';
            contactForm.insertBefore(successDiv, contactForm.firstChild);

            // Очищаем форму
            contactForm.reset();

            // Сбрасываем стили полей
            [nameInput, emailInput, phoneInput, courseSelect].forEach(input => {
                if (input) input.style.borderColor = '#ddd';
            });

            // Убираем сообщение об успехе через 3 секунды
            setTimeout(() => {
                if (successDiv.parentElement) {
                    successDiv.remove();
                }
            }, 3000);
        }
    });
}

// ============================================
// ОБНОВЛЕНИЕ ПРИВЕТСТВИЯ ПОЛЬЗОВАТЕЛЯ
// ============================================
function updateGreeting(name) {
    const authBtn = document.getElementById('authBtn');
    if (authBtn) {
        const userGreeting = document.createElement('div');
        userGreeting.className = 'user-greeting';
        userGreeting.innerHTML = `
            <span class="user-name">Привет, ${name}!</span>
            <button class="logout-btn">Выйти</button>
        `;
        authBtn.parentNode.replaceChild(userGreeting, authBtn);
        // Обработчик выхода: удаляем данные пользователя и перезагружаем страницу
        userGreeting.querySelector('.logout-btn').addEventListener('click', () => {
            localStorage.removeItem('currentUser');
            location.reload();
        });
    }
}

// ============================================
// ОБНОВЛЕНИЕ ПРИВЕТСТВИЯ ПОЛЬЗОВАТЕЛЯ
// ============================================
function initDynamicGreeting() {
    const currentUser = JSON.parse(localStorage.getItem('currentUser'));
    if (currentUser) updateGreeting(currentUser.name);
}

function updateGreeting(name) {
    const authBtn = document.getElementById('authBtn');
    if (authBtn) {
        const userGreeting = document.createElement('div');
        userGreeting.className = 'user-greeting';
        userGreeting.innerHTML = `
            <span class="user-name">Привет, ${name}!</span>
            <button class="logout-btn">Выйти</button>
        `;
        authBtn.parentNode.replaceChild(userGreeting, authBtn);
        // Обработчик выхода: удаляем данные пользователя и перезагружаем страницу
        userGreeting.querySelector('.logout-btn').addEventListener('click', () => {
            localStorage.removeItem('currentUser');
            location.reload();
        });
    }
}

// ============================================
// НАСТРОЙКА КНОПКИ "ВОЙТИ" В НАВИГАЦИИ
// ============================================
//function initLoginButton() {
    //const loginBtn = document.getElementById('authBtn');
    //if (loginBtn) {
        // Делаем кнопку ссылкой на /login
       // loginBtn.addEventListener('click', function(e) {
          //  e.preventDefault();
           // window.location.href = '/login';
       // });
  //  }
//}

// ============================================
// УВЕДОМЛЕНИЯ (TOAST-СООБЩЕНИЯ)
// ============================================
function showNotification(message, type) {
    const notification = document.createElement('div');
    notification.textContent = message;
    notification.style.cssText = `
        position: fixed;
        bottom: 20px;
        right: 20px;
        padding: 12px 24px;
        background: ${type === 'success' ? '#4CAF50' : '#f44336'};
        color: white;
        border-radius: 8px;
        z-index: 3000;
        cursor: pointer;
        font-family: Arial, sans-serif;
    `;
    document.body.appendChild(notification);
    // Автоматическое удаление через 3 секунды
    setTimeout(() => notification.remove(), 3000);
    notification.addEventListener('click', () => notification.remove());
}

// ============================================
// ЭФФЕКТЫ ДЛЯ КНОПОК И КАРТОЧЕК
// ============================================
function initButtonEffects() {
    const style = document.createElement('style');
    style.textContent = `
        .btn { transition: all 0.3s ease !important; }
        .btn:hover {
            transform: scale(1.05) translateY(-2px) !important;
            box-shadow: 0 10px 25px rgba(0,0,0,0.2) !important;
        }
        .course-card, .feature, .review-card { transition: all 0.3s ease; }
        .course-card:hover, .feature:hover, .review-card:hover {
            transform: translateY(-8px);
            box-shadow: 0 15px 40px rgba(0,0,0,0.15);
        }
    `;
    document.head.appendChild(style);
}

// ============================================
// ПОДСВЕТКА АКТИВНОГО ПУНКТА МЕНЮ ПРИ ПРОКРУТКЕ
// ============================================
function initActiveMenu() {
    const sections = document.querySelectorAll('section');
    const navLinks = document.querySelectorAll('nav ul li a');
    const style = document.createElement('style');
    style.textContent = `nav ul li a.active { color: #f97316 !important; font-weight: bold; }`;
    document.head.appendChild(style);

    function setActiveLink() {
        let current = '';
        const scrollPos = window.scrollY + 100; // Смещение для более точного определения
        sections.forEach(section => {
            const sectionTop = section.offsetTop;
            const sectionHeight = section.clientHeight;
            if (scrollPos >= sectionTop && scrollPos < sectionTop + sectionHeight) {
                current = section.getAttribute('id');
            }
        });
        navLinks.forEach(link => {
            link.classList.remove('active');
            if (link.getAttribute('href').substring(1) === current) link.classList.add('active');
        });
    }
    window.addEventListener('scroll', setActiveLink);
    setActiveLink();
}

// ============================================
// УЛУЧШЕННАЯ ТЁМНАЯ ТЕМА (приятная для глаз)
// ============================================
function initThemeToggle() {
    // Ищем кнопку, которая уже есть в HTML (из base.html)
    const themeBtn = document.getElementById('themeToggle');
    if (!themeBtn) return; // Если кнопки нет (например, на главной без base), выходим

    // Стили для тёмной темы (приятные для глаз цвета)
    const themeStyles = document.createElement('style');
    themeStyles.id = 'themeStyles';
    document.head.appendChild(themeStyles);

    function setTheme(theme) {
    if (theme === 'dark') {
        document.body.classList.add('dark-theme');   // ← ДОБАВИТЬ
        themeStyles.textContent = `
            /* Основной фон - мягкий тёмно-синий */
            body {
                background: #0f172a !important;
                ...
                    color: #e2e8f0 !important;
                }

                /* Шапка сайта */
                header {
                    background: #1e293b !important;
                    box-shadow: 0 2px 20px rgba(0,0,0,0.3) !important;
                }

                /* Логотип и текст в шапке */
                .logo h1, nav ul li a {
                    color: #e2e8f0 !important;
                }

                nav ul li a:hover {
                    color: #f97316 !important;
                }

                .user-bar {
                    background: #1e293b !important;
                    border-bottom-color: #334155 !important;
                }
                .user-bar a {
                    color: #e2e8f0 !important;
                }

                /* Главный баннер */
                .hero {
                    background: linear-gradient(135deg, #0f172a 0%, #1e293b 100%) !important;
                }

                .hero h2, .hero p {
                    color: #f8fafc !important;
                }

                /* РАЗДЕЛ "Наши курсы" */
                .courses {
                    background: #0f172a !important;
                }

                .courses h2 {
                    color: #ffffff !important;
                }

                .course-card {
                    background: #1e293b !important;
                    box-shadow: 0 10px 30px rgba(0,0,0,0.2) !important;
                }

                .course-card h3, .course-card p {
                    color: #e2e8f0 !important;
                }

                .course-card p {
                    color: #94a3b8 !important;
                }

                .course-details {
                    border-top-color: #334155 !important;
                }

                .price {
                    color: #f97316 !important;
                }

                .duration {
                    color: #94a3b8 !important;
                }

                .course-icon {
                    background: rgba(249,115,22,0.15) !important;
                }

                .course-icon i {
                    color: #f97316 !important;
                }

                /* РАЗДЕЛ "О нас" */
                .about {
                    background: #0f172a !important;
                }

                .about h2 {
                    color: #ffffff !important;
                }

                .feature {
                    background: #1e293b !important;
                    box-shadow: 0 5px 20px rgba(0,0,0,0.2) !important;
                }

                .feature h3 {
                    color: #e2e8f0 !important;
                }

                .feature p {
                    color: #94a3b8 !important;
                }

                /* РАЗДЕЛ "Отзывы" */
                .reviews {
                    background: #0f172a !important;
                }

                .reviews h2 {
                    color: #ffffff !important;
                }

                .review-card {
                    background: #1e293b !important;
                }

                .review-card h4, .review-card p {
                    color: #e2e8f0 !important;
                }

                .review-card p {
                    color: #cbd5e1 !important;
                }

                .reviewer-role {
                    color: #94a3b8 !important;
                }

                .reviewer-info img {
                    border-color: #f97316 !important;
                }

                /* РАЗДЕЛ "Контакты" */
                .contact {
                    background: linear-gradient(135deg, #0f172a 0%, #1e293b 100%) !important;
                }

                .contact-info h2, .contact-info p {
                    color: #f8fafc !important;
                }

                .contact-item span {
                    color: #cbd5e1 !important;
                }

                .contact-item i {
                    background: rgba(249,115,22,0.2) !important;
                    color: #f97316 !important;
                }

                .social-links a {
                    background: rgba(249,115,22,0.2) !important;
                    color: #f97316 !important;
                }

                .social-links a:hover {
                    background: #f97316 !important;
                    color: white !important;
                }

                /* Форма */
                .contact-form {
                    background: #1e293b !important;
                }

                .contact-form h3 {
                    color: #e2e8f0 !important;
                }

                .contact-form input, .contact-form select {
                    background: #334155 !important;
                    border-color: #475569 !important;
                    color: #e2e8f0 !important;
                }

                .contact-form input::placeholder, .contact-form select {
                    color: #94a3b8 !important;
                }

                .contact-form input:focus, .contact-form select:focus {
                    border-color: #f97316 !important;
                    outline: none !important;
                }

                /* Футер */
                footer {
                    background: #0f172a !important;
                }

                .footer-logo h3, .footer-logo p {
                    color: #e2e8f0 !important;
                }

                .footer-links h4, .footer-courses h4 {
                    color: #f97316 !important;
                }

                .footer-links a, .footer-courses a {
                    color: #94a3b8 !important;
                }

                .footer-links a:hover, .footer-courses a:hover {
                    color: #f97316 !important;
                }

                .footer-bottom {
                    border-top-color: #334155 !important;
                    color: #64748b !important;
                }

                /* СТРАНИЦЫ LOGIN И FEEDBACK - ИСПРАВЛЕННЫЕ СЕЛЕКТОРЫ */
                /* Контейнеры форм - переопределяем инлайн-стили */
                div[style*="max-width: 400px"],
                div[style*="max-width: 500px"] {
                    background: #1e293b !important;
                    box-shadow: 0 10px 30px rgba(0,0,0,0.3) !important;
                }

                div[style*="max-width: 400px"] h2,
                div[style*="max-width: 500px"] h2 {
                    color: #f8fafc !important;
                }

                div[style*="max-width: 400px"] label,
                div[style*="max-width: 500px"] label {
                    color: #e2e8f0 !important;
                }

                div[style*="max-width: 400px"] input,
                div[style*="max-width: 400px"] textarea,
                div[style*="max-width: 500px"] input,
                div[style*="max-width: 500px"] textarea {
                    background: #334155 !important;
                    border-color: #475569 !important;
                    color: #e2e8f0 !important;
                }

                div[style*="max-width: 400px"] input::placeholder,
                div[style*="max-width: 400px"] textarea::placeholder,
                div[style*="max-width: 500px"] input::placeholder,
                div[style*="max-width: 500px"] textarea::placeholder {
                    color: #64748b !important;
                }

                /* Кнопки в формах */
                div[style*="max-width: 400px"] .btn[type="submit"],
                div[style*="max-width: 500px"] .btn[type="submit"] {
                    background: #f97316 !important;
                    color: white !important;
                }

                div[style*="max-width: 400px"] .btn[type="submit"]:hover,
                div[style*="max-width: 500px"] .btn[type="submit"]:hover {
                    background: #ea580c !important;
                }

                /* Сообщение об успехе в feedback */
                div[style*="background: #d4edda"] {
                    background: #14532d !important;
                    color: #86efac !important;
                }

                div[style*="background: #d4edda"] a {
                    color: #f97316 !important;
                }

                /* Модальное окно */
                .modal-content {
                    background: #1e293b !important;
                }

                .modal-content h3, .auth-form h3 {
                    color: #e2e8f0 !important;
                }

                .auth-tab {
                    color: #94a3b8 !important;
                }

                .auth-tab.active {
                    color: #f97316 !important;
                    border-bottom-color: #f97316 !important;
                }

                .form-group input {
                    background: #334155 !important;
                    border-color: #475569 !important;
                    color: #e2e8f0 !important;
                }

                .form-group input::placeholder {
                    color: #64748b !important;
                }

                .modal-close {
                    color: #94a3b8 !important;
                }

                .modal-close:hover {
                    color: #f97316 !important;
                }

                /* Аккордеон */
                .accordion-header {
                    background: #1e293b !important;
                    color: #e2e8f0 !important;
                }

                .accordion-header:hover {
                    background: #334155 !important;
                }

                .accordion-content {
                    background: #1e293b !important;
                    color: #cbd5e1 !important;
                }

                /* Кнопки фильтрации */
                .filter-btn {
                    background: #1e293b !important;
                    border-color: #f97316 !important;
                    color: #e2e8f0 !important;
                }

                .filter-btn.active, .filter-btn:hover {
                    background: #f97316 !important;
                    color: white !important;
                }

                /* Кнопка "Наверх" и переключения темы */
                #backToTop, #themeToggle {
                    background: #f97316 !important;
                    color: white !important;
                }

                #backToTop:hover, #themeToggle:hover {
                    background: #ea580c !important;
                    transform: scale(1.1) !important;
                }

                /* Слайдер */
                .slider-prev, .slider-next {
                    background: rgba(249,115,22,0.7) !important;
                }

                .slider-prev:hover, .slider-next:hover {
                    background: #f97316 !important;
                }

                /* Иконка глаза в пароле */
                .password-toggle {
                    color: #94a3b8 !important;
                }

                .password-toggle:hover {
                    color: #f97316 !important;
                }

                /* Кнопки входа/регистрации */
                .btn {
                    background: #f97316 !important;
                }

                .btn:hover {
                    background: #ea580c !important;
                }

                /* Дополнительные заголовки на всякий случай */
                h2, h3, h4 {
                    color: #ffffff !important;
                }

                /* Плавные переходы для всех элементов */
                body, header, .course-card, .feature, .review-card, .contact-form,
                .modal-content, .accordion-header, .accordion-content, .filter-btn,
                .btn, input, select, .social-links a, h2, h3, h4, .user-name {
                    transition: all 0.3s ease !important;
                }
                /* ========== СТРАНИЦА МОИ ЗАЯВКИ - ИСПРАВЛЕННАЯ ========== */
.applications-table {
    background: #1e293b !important;
}
.applications-table thead tr {
    background: #334155 !important;
}
.applications-table th {
    color: #f8fafc !important;
    border-bottom-color: #475569 !important;
    font-weight: 600 !important;
}
.applications-table td {
    color: #e2e8f0 !important;
    border-bottom-color: #334155 !important;
    opacity: 1 !important;
}
.applications-table tbody tr {
    opacity: 1 !important;
    background: #1e293b !important;
}
.applications-table tbody tr:hover {
    background: #273549 !important;
}
.applications-table tbody tr:nth-child(even) {
    background: #253347 !important;
}
.applications-table tbody tr:nth-child(even):hover {
    background: #2d3d54 !important;
}
.status-badge-app.new {
    background: #3b82f6 !important;
    color: white !important;
}
.status-badge-app.processing {
    background: #f59e0b !important;
    color: white !important;
}
.status-badge-app.completed {
    background: #10b981 !important;
    color: white !important;
}
.status-badge-app.rejected {
    background: #ef4444 !important;
    color: white !important;
}
/* ========== КОНЕЦ БЛОКА МОИ ЗАЯВКИ ========== */

/* Кнопка удаления заявки */
.btn-delete-app {
    background: #ef4444 !important;
    color: white !important;
}
.btn-delete-app:hover {
    background: #dc2626 !important;
    transform: translateY(-2px) !important;
    box-shadow: 0 4px 12px rgba(239, 68, 68, 0.4) !important;
}

/* СТРАНИЦА ПРОФИЛЯ */
                .profile-container {
                background: #1e293b !important;
                box-shadow: 0 10px 30px rgba(0,0,0,0.3) !important;
                }

                .profile-container h2,
                .profile-container h3 {
                color: #f8fafc !important;
                }

                .profile-info {
                    background: #0f172a !important;
                }

                .profile-info p {
                    color: #e2e8f0 !important;
                }

                .profile-info strong {
                    color: #f97316 !important;
                }

                .profile-container hr {
                    border-color: #334155 !important;
                }

                .form-group label {
                    color: #e2e8f0 !important;
                }

                .form-group input {
                    background: #334155 !important;
                    border-color: #475569 !important;
                    color: #e2e8f0 !important;
                }

                .form-group input:focus {
                    border-color: #f97316 !important;
                    outline: none !important;
                }

                .btn-primary {
                    background: #f97316 !important;
                    color: white !important;
                }

                .btn-primary:hover {
                    background: #ea580c !important;
                }

                .logout-btn-link {
                    color: #ef4444 !important;
                }

                .logout-btn-link:hover {
                    color: #f87171 !important;
                }

                .profile-not-authorized {
                    background: #422006 !important;
                }

                .profile-not-authorized p {
                    color: #fbbf24 !important;
                }

                .profile-not-authorized .btn {
                    background: #f97316 !important;
                    color: white !important;
                }

                .profile-not-authorized .btn:hover {
                    background: #ea580c !important;
                }
                /* ========== СТРАНИЦА ПРОФИЛЯ - ИСПРАВЛЕННЫЕ СТИЛИ ========== */
.profile-header {
    background: #1e293b !important;
    box-shadow: 0 5px 20px rgba(0,0,0,0.3) !important;
}
.profile-header h2 {
    color: #f8fafc !important;
}
.profile-header p {
    color: #94a3b8 !important;
}

.profile-info-box {
    background: #1e293b !important;
    box-shadow: 0 5px 20px rgba(0,0,0,0.3) !important;
}
.profile-info-box h3 {
    color: #f8fafc !important;
    border-bottom-color: #334155 !important;
}
.info-row {
    border-bottom-color: #334155 !important;
}
.info-row strong {
    color: #f97316 !important;
}
.info-row span {
    color: #e2e8f0 !important;
}

.profile-status-box {
    background: #1e293b !important;
    box-shadow: 0 5px 20px rgba(0,0,0,0.3) !important;
}
.profile-status-box h3 {
    color: #f8fafc !important;
}
.status-badge.active {
    background: #064e3b !important;
    color: #34d399 !important;
}

/* Кнопки профиля - сохраняем оригинальные цвета */
.btn-edit {
    background: #667eea !important;
    color: white !important;
}
.btn-edit:hover {
    background: #5568d3 !important;
}
.btn-secret {
    background: #f39c12 !important;
    color: white !important;
}
.btn-secret:hover {
    background: #e67e22 !important;
}
.btn-logout {
    background: #e74c3c !important;
    color: white !important;
}
.btn-logout:hover {
    background: #c0392b !important;
}

/* ========== СТРАНИЦА РЕДАКТИРОВАНИЯ ПРОФИЛЯ ========== */
.form-container {
    background: #1e293b !important;
    box-shadow: 0 5px 20px rgba(0,0,0,0.3) !important;
}
.form-container h2 {
    color: #f8fafc !important;
}
.form-group label {
    color: #e2e8f0 !important;
}
.form-group input,
.form-group textarea {
    background: #334155 !important;
    border-color: #475569 !important;
    color: #e2e8f0 !important;
}
.form-group input:focus,
.form-group textarea:focus {
    border-color: #f97316 !important;
    outline: none !important;
}
.form-group small {
    color: #94a3b8 !important;
}
.btn-save {
    background: #667eea !important;
    color: white !important;
}
.btn-save:hover {
    background: #5568d3 !important;
}
.btn-cancel {
    background: #95a5a6 !important;
    color: white !important;
}
.btn-cancel:hover {
    background: #7f8c8d !important;
}
            `
            ;
            themeBtn.innerHTML = '<i class="fas fa-sun"></i>';
            localStorage.setItem('theme', 'dark');
            } else {
        document.body.classList.remove('dark-theme');  // ← ДОБАВИТЬ
        themeStyles.textContent = '';
        themeBtn.innerHTML = ' <i class= "fas fa-moon " > </i >';
        localStorage.setItem('theme', 'light');
    }
    }

    // Проверяем сохранённую тему и применяем её
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme === 'dark') setTheme('dark');

    // Обработчик клика по кнопке (удаляем старый, если есть, чтобы не дублировался)
    const newThemeBtn = themeBtn.cloneNode(true);
    themeBtn.parentNode.replaceChild(newThemeBtn, themeBtn);

    newThemeBtn.addEventListener('click', () => {
        const isDark = localStorage.getItem('theme') === 'dark';
        setTheme(isDark ? 'light' : 'dark');
    });
}
// ============================================
// ПЛАВНАЯ ПРОКРУТКА К ЯКОРЯМ
// ============================================
function initSmoothScroll() {
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function(e) {
            const href = this.getAttribute('href');
            if (href === '#') return;
            const target = document.querySelector(href);
            if (target) {
                e.preventDefault();
                target.scrollIntoView({ behavior: 'smooth' });
            }
        });
    });
}

// ============================================
// КНОПКА "НАВЕРХ"
// ============================================
function initBackToTop() {
    const backBtn = document.createElement('button');
    backBtn.id = 'backToTop';
    backBtn.innerHTML = '<i class="fas fa-arrow-up"></i>';
    backBtn.style.cssText = `
        position: fixed;
        bottom: 20px;
        right: 20px;
        width: 50px;
        height: 50px;
        border-radius: 50%;
        background: #716e6e;
        color: white;
        border: none;
        cursor: pointer;
        z-index: 1000;
        font-size: 20px;
        opacity: 0;
        visibility: hidden;
        transition: all 0.3s ease;
        box-shadow: 0 2px 10px rgba(0,0,0,0.2);
    `;
    document.body.appendChild(backBtn);

    // Показываем/скрываем кнопку в зависимости от прокрутки
    window.addEventListener('scroll', () => {
        if (window.scrollY > 300) {
            backBtn.style.opacity = '1';
            backBtn.style.visibility = 'visible';
        } else {
            backBtn.style.opacity = '0';
            backBtn.style.visibility = 'hidden';
        }
    });

    backBtn.addEventListener('click', () => {
        window.scrollTo({ top: 0, behavior: 'smooth' });
    });
}

// ============================================
// СИСТЕМА ФИЛЬТРАЦИИ КУРСОВ
// ============================================
function initFilterSystem() {
    const coursesSection = document.querySelector('.courses');
    if (!coursesSection) return;

    // Находим заголовок секции
    const sectionTitle = coursesSection.querySelector('h2');
    if (!sectionTitle) return;

    // Создаём контейнер с кнопками фильтров
    const filterContainer = document.createElement('div');
    filterContainer.className = 'filter-buttons';
    filterContainer.style.cssText = `display: flex; justify-content: center; gap: 15px; margin-bottom: 40px; flex-wrap: wrap;`;
    filterContainer.innerHTML = `
        <button class="filter-btn active" data-filter="all">Все курсы</button>
        <button class="filter-btn" data-filter="web">Веб-разработка</button>
        <button class="filter-btn" data-filter="python">Python</button>
        <button class="filter-btn" data-filter="java">Java</button>
    `;

    // Вставляем фильтры после заголовка
    sectionTitle.insertAdjacentElement('afterend', filterContainer);

    // Стили для кнопок фильтрации
    const style = document.createElement('style');
    style.textContent = `
        .filter-btn { padding: 10px 25px; background: white; border: 2px solid #716e6e; border-radius: 30px; cursor: pointer; transition: all 0.3s ease; font-weight: bold; }
        .filter-btn.active, .filter-btn:hover { background: #716e6e; color: white; }
        .course-card.hide { display: none; }
    `;
    document.head.appendChild(style);

    // Обработка кликов по фильтрам
    document.querySelectorAll('.filter-btn').forEach(filter => {
        filter.addEventListener('click', () => {
            document.querySelectorAll('.filter-btn').forEach(f => f.classList.remove('active'));
            filter.classList.add('active');
            const filterValue = filter.dataset.filter;
            document.querySelectorAll('.course-card').forEach(card => {
                const title = card.querySelector('h3').textContent;
                if (filterValue === 'all') card.classList.remove('hide');
                else if (title.toLowerCase().includes(filterValue)) card.classList.remove('hide');
                else card.classList.add('hide');
            });
        });
    });
}

// ============================================
// КНОПКА "ЗАГРУЗИТЬ ЕЩЁ КУРСЫ"
// ============================================
function initLoadMore() {
    const coursesSection = document.querySelector('.courses');
    if (!coursesSection) return;

    const loadMoreBtn = document.createElement('button');
    loadMoreBtn.className = 'btn';
    loadMoreBtn.textContent = 'Загрузить ещё курсы';
    loadMoreBtn.style.cssText = `display: block; margin: 40px auto 0;`;
    const courseGrid = document.querySelector('.course-grid');
    coursesSection.appendChild(loadMoreBtn);

    // Дополнительные курсы для подгрузки
    const moreCourses = [
        { title: 'Мобильная разработка', desc: 'Создавайте приложения для iOS и Android', price: '20 000 руб.', duration: '4 месяца', icon: 'fas fa-mobile-alt' },
        { title: 'Data Science', desc: 'Анализ данных и машинное обучение', price: '25 000 руб.', duration: '5 месяцев', icon: 'fas fa-chart-line' },
        { title: 'Frontend PRO', desc: 'Углублённое изучение React и Vue', price: '22 000 руб.', duration: '3.5 месяца', icon: 'fab fa-react' }
    ];
    let loadedCount = 0;

    loadMoreBtn.addEventListener('click', () => {
        if (loadedCount < moreCourses.length) {
            const c = moreCourses[loadedCount];
            const newCard = document.createElement('div');
            newCard.className = 'course-card';
            newCard.style.animation = 'fadeInUp 0.5s ease';
            newCard.innerHTML = `
                <div class="course-icon"><i class="${c.icon}"></i></div>
                <h3>${c.title}</h3><p>${c.desc}</p>
                <div class="course-details"><span class="price">${c.price}</span><span class="duration"><i class="far fa-clock"></i> ${c.duration}</span></div>
            `;
            courseGrid.appendChild(newCard);
            loadedCount++;
            if (loadedCount === moreCourses.length) {
                loadMoreBtn.textContent = 'Все курсы загружены';
                loadMoreBtn.disabled = true;
                loadMoreBtn.style.opacity = '0.6';
            }
        }
    });
}

// ============================================
// АККОРДЕОН (ЧАСТО ЗАДАВАЕМЫЕ ВОПРОСЫ)
// ============================================
function initAccordion() {
    const aboutSection = document.querySelector('.about');
    if (!aboutSection) return;

    const accordionContainer = document.createElement('div');
    accordionContainer.className = 'accordion-container';
    accordionContainer.style.cssText = `margin-top: 50px; max-width: 800px; margin: 50px auto 0;`;
    accordionContainer.innerHTML = `
        <h3 style="text-align: center; margin-bottom: 30px;">Часто задаваемые вопросы</h3>
        <div class="accordion-item"><div class="accordion-header">Как долго длятся курсы?</div><div class="accordion-content">Длительность курсов составляет от 2.5 до 5 месяцев в зависимости от выбранной программы. Вы можете учиться в удобном для вас темпе.</div></div>
        <div class="accordion-item"><div class="accordion-header">Есть ли рассрочка?</div><div class="accordion-content">Да, мы предлагаем беспроцентную рассрочку на 3, 6 или 12 месяцев. Подробности уточняйте у нашего менеджера.</div></div>
        <div class="accordion-item"><div class="accordion-header">Выдаёте ли вы сертификат?</div><div class="accordion-content">Да, после успешного окончания курса вы получаете сертификат государственного образца.</div></div>
    `;
    aboutSection.appendChild(accordionContainer);

    // Стили для аккордеона
    const style = document.createElement('style');
    style.textContent = `
        .accordion-item { margin-bottom: 15px; border-radius: 10px; overflow: hidden; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
        .accordion-header { background: #716e6e; color: white; padding: 18px 20px; cursor: pointer; font-weight: bold; transition: background 0.3s; }
        .accordion-header:hover { background: #5a5757; }
        .accordion-content { background: white; padding: 0 20px; max-height: 0; overflow: hidden; transition: all 0.3s ease; color: #333; }
        .accordion-item.active .accordion-content { padding: 20px; max-height: 200px; }
    `;
    document.head.appendChild(style);

    // Открытие/закрытие по клику на заголовок (открывается только один)
    document.querySelectorAll('.accordion-item').forEach(item => {
        item.querySelector('.accordion-header').addEventListener('click', () => {
            document.querySelectorAll('.accordion-item').forEach(i => i.classList.remove('active'));
            item.classList.add('active');
        });
    });
}
// ============================================
// ОТПРАВКА ЗАЯВКИ НА СЕРВЕР ЧЕРЕЗ FETCH
// ============================================

async function submitApplication(event) {
    event.preventDefault();

    const name = document.getElementById('appName').value.trim();
    const email = document.getElementById('appEmail').value.trim();
    const phone = document.getElementById('appPhone').value.trim();
    const course = document.getElementById('appCourse').value;

    // Простая клиентская валидация
    if (!name || !email || !phone || !course) {
        showNotification('Заполните все поля!', 'error');
        return;
    }

    // Проверка email на клиенте
    const emailPattern = /^[^\s@]+@([^\s@]+\.)+[^\s@]+$/;
    if (!emailPattern.test(email)) {
        showNotification('Введите корректный email!', 'error');
        return;
    }

    // Проверка телефона (должен содержать цифры)
    const phoneDigits = phone.replace(/[^\d+]/g, '');
    if (phoneDigits.length < 10) {
        showNotification('Введите корректный номер телефона!', 'error');
        return;
    }

    const submitBtn = document.getElementById('submitApplication');
    const originalText = submitBtn.textContent;

    // Показываем загрузку
    submitBtn.textContent = 'Отправка...';
    submitBtn.disabled = true;

    try {
        const response = await fetch('/api/applications', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                name: name,
                email: email,
                phone: phone,
                course: course
            })
        });

        const result = await response.json();

        if (result.success) {
            showNotification(result.message, 'success');
            // Очищаем форму
            document.getElementById('applicationForm').reset();
        } else {
            showNotification(result.message, 'error');
        }
    } catch (error) {
        console.error('Ошибка:', error);
        showNotification('Ошибка подключения к серверу. Попробуйте позже.', 'error');
    } finally {
        submitBtn.textContent = originalText;
        submitBtn.disabled = false;
    }
}

// Инициализация формы заявки
function initApplicationForm() {
    const form = document.getElementById('applicationForm');
    if (form) {
        form.addEventListener('submit', submitApplication);
    }
}
// ============================================
// СЛАЙДЕР ИЗОБРАЖЕНИЙ В HERO-СЕКЦИИ
// ============================================
function initImageSlider() {
    const heroSection = document.querySelector('.hero');
    if (!heroSection) return;

    const sliderImages = [
        'static/images/java.png',
        'static/images/python.jfif',
        'static/images/surprised.jpg'
    ];

    // Создаём структуру слайдера
    const sliderContainer = document.createElement('div');
    sliderContainer.className = 'image-slider';
    sliderContainer.style.cssText = `margin-top: 40px; position: relative; max-width: 600px; margin: 40px auto 0; border-radius: 15px; overflow: hidden; box-shadow: 0 10px 30px rgba(0,0,0,0.2);`;
    sliderContainer.innerHTML = `
        <div class="slider-wrapper"><img class="slider-image" src="${sliderImages[0]}"></div>
        <button class="slider-prev"><i class="fas fa-chevron-left"></i></button>
        <button class="slider-next"><i class="fas fa-chevron-right"></i></button>
        <div class="slider-dots"></div>
        <div class="slider-counter">1 / ${sliderImages.length}</div>
    `;
    heroSection.appendChild(sliderContainer);

    // Стили для слайдера
    const style = document.createElement('style');
    style.textContent = `
        .slider-image { width: 100%; height: 300px; object-fit: cover; }
        .slider-prev, .slider-next { position: absolute; top: 50%; transform: translateY(-50%); background: rgba(0,0,0,0.5); color: white; border: none; padding: 12px 18px; cursor: pointer; border-radius: 50%; transition: background 0.3s; }
        .slider-prev:hover, .slider-next:hover { background: rgba(0,0,0,0.8); }
        .slider-prev { left: 10px; } .slider-next { right: 10px; }
        .slider-dots { position: absolute; bottom: 15px; left: 50%; transform: translateX(-50%); display: flex; gap: 8px; }
        .slider-dot { width: 10px; height: 10px; border-radius: 50%; background: rgba(255,255,255,0.5); cursor: pointer; transition: all 0.3s; }
        .slider-dot.active { background: white; transform: scale(1.2); }
        .slider-counter { position: absolute; top: 15px; right: 15px; background: rgba(0,0,0,0.6); color: white; padding: 5px 10px; border-radius: 20px; font-size: 12px; }
    `;
    document.head.appendChild(style);

    let currentSlide = 0;
    const sliderImage = document.querySelector('.slider-image');
    const dotsContainer = document.querySelector('.slider-dots');
    const counter = document.querySelector('.slider-counter');

    // Создаём точки-индикаторы
    sliderImages.forEach((_, i) => {
        const dot = document.createElement('div');
        dot.className = `slider-dot ${i === 0 ? 'active' : ''}`;
        dot.addEventListener('click', () => { currentSlide = i; updateSlider(); });
        dotsContainer.appendChild(dot);
    });

    function updateSlider() {
        sliderImage.src = sliderImages[currentSlide];
        counter.textContent = `${currentSlide + 1} / ${sliderImages.length}`;
        document.querySelectorAll('.slider-dot').forEach((dot, i) => dot.classList.toggle('active', i === currentSlide));
    }

    // Кнопки переключения
    document.querySelector('.slider-prev').addEventListener('click', () => { currentSlide = (currentSlide - 1 + sliderImages.length) % sliderImages.length; updateSlider(); });
    document.querySelector('.slider-next').addEventListener('click', () => { currentSlide = (currentSlide + 1) % sliderImages.length; updateSlider(); });
}

// ============================================
// АНИМАЦИЯ ПОЯВЛЕНИЯ ЭЛЕМЕНТОВ ПРИ СКРОЛЛЕ
// ============================================
function initScrollAnimation() {
    const style = document.createElement('style');
    style.textContent = `
        .fade-in-up { animation: fadeInUp 0.6s ease forwards; }
        @keyframes fadeInUp { from { opacity: 0; transform: translateY(30px); } to { opacity: 1; transform: translateY(0); } }
    `;
    document.head.appendChild(style);

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('fade-in-up');
                observer.unobserve(entry.target);
            }
        });
    }, { threshold: 0.1 });

    // Отслеживаем карточки курсов, преимущества и отзывы
    document.querySelectorAll('.course-card, .feature, .review-card').forEach(el => {
        el.style.opacity = '0';
        observer.observe(el);
    });
}

// ============================================
// ВАЛИДАЦИЯ ФОРМЫ ОБРАТНОЙ СВЯЗИ С СЕРВЕРОМ
// ============================================
function initFormValidation() {
    const contactForm = document.querySelector('.contact-form');
    if (!contactForm) return;

    // Проверяем, не добавлены ли уже обработчики
    if (contactForm.hasAttribute('data-validation-added')) return;
    contactForm.setAttribute('data-validation-added', 'true');

    // Находим поля формы
    const nameInput = contactForm.querySelector('input[placeholder="Ваше имя"]');
    const emailInput = contactForm.querySelector('input[placeholder="Ваш email"]');
    const phoneInput = contactForm.querySelector('input[placeholder="Ваш телефон"]');
    const courseSelect = contactForm.querySelector('select');
    const submitBtn = contactForm.querySelector('button[type="submit"]');

    // Валидация email при потере фокуса (когда пользователь перешёл к другому полю)
    if (emailInput) {
        emailInput.addEventListener('blur', async function() {
            const email = this.value.trim();
            if (email) {
                showLoading(this, true);
                const result = await validateFieldOnServer('email', email);
                showLoading(this, false);

                if (result.valid) {
                    showFieldError(this, null);
                } else {
                    showFieldError(this, result.message);
                }
            }
        });

        // Убираем ошибку при вводе
        emailInput.addEventListener('input', function() {
            showFieldError(this, null);
        });
    }

    // Валидация телефона при потере фокуса
    if (phoneInput) {
        phoneInput.addEventListener('blur', async function() {
            const phone = this.value.trim();
            if (phone) {
                showLoading(this, true);
                const result = await validateFieldOnServer('phone', phone);
                showLoading(this, false);

                if (result.valid) {
                    showFieldError(this, null);
                    // Если сервер вернул очищенный номер, подставляем его
                    if (result.cleaned) {
                        const cleaned = result.cleaned;
                        const formatted = cleaned.replace(/^\+7(\d{3})(\d{3})(\d{2})(\d{2})$/, '+7 ($1) $2-$3-$4');
                        this.value = formatted;
                    }
                } else {
                    showFieldError(this, result.message);
                }
            }
        });

        // Убираем ошибку при вводе
        phoneInput.addEventListener('input', function() {
            showFieldError(this, null);
        });
    }

    // Обработка отправки формы
    contactForm.addEventListener('submit', async function(e) {
        e.preventDefault();

        let hasErrors = false;

        // Проверка имени
        if (!nameInput.value.trim()) {
            showNotification('Введите ваше имя', 'error');
            nameInput.style.borderColor = '#e74c3c';
            nameInput.focus();
            hasErrors = true;
        } else {
            nameInput.style.borderColor = '#ddd';
        }

        // Серверная проверка email
        if (!hasErrors && emailInput.value.trim()) {
            showLoading(submitBtn, true);
            const emailResult = await validateFieldOnServer('email', emailInput.value.trim());
            showLoading(submitBtn, false);

            if (!emailResult.valid) {
                showFieldError(emailInput, emailResult.message);
                showNotification(emailResult.message, 'error');
                emailInput.focus();
                hasErrors = true;
            } else {
                showFieldError(emailInput, null);
            }
        } else if (!hasErrors) {
            showNotification('Введите ваш email', 'error');
            emailInput.style.borderColor = '#e74c3c';
            emailInput.focus();
            hasErrors = true;
        }

        // Серверная проверка телефона (если заполнен)
        if (!hasErrors && phoneInput.value.trim()) {
            showLoading(submitBtn, true);
            const phoneResult = await validateFieldOnServer('phone', phoneInput.value.trim());
            showLoading(submitBtn, false);

            if (!phoneResult.valid) {
                showFieldError(phoneInput, phoneResult.message);
                showNotification(phoneResult.message, 'error');
                phoneInput.focus();
                hasErrors = true;
            } else {
                showFieldError(phoneInput, null);
            }
        }

        // Проверка выбора курса
        if (!hasErrors && !courseSelect.value) {
            showNotification('Выберите курс из списка', 'error');
            courseSelect.style.borderColor = '#e74c3c';
            courseSelect.focus();
            hasErrors = true;
        } else {
            courseSelect.style.borderColor = '#ddd';
        }

        // Если ошибок нет - успех!
        if (!hasErrors) {
            showNotification('Заявка успешно отправлена! Мы свяжемся с вами.', 'success');
            contactForm.reset();

            // Сбрасываем все индикаторы
            [nameInput, emailInput, phoneInput, courseSelect].forEach(input => {
                if (input) input.style.borderColor = '#ddd';
            });
            document.querySelectorAll('.field-error').forEach(el => el.remove());
        }
    });
}
// ============================================
// СТРАНИЦА "МОИ ЗАЯВКИ" - ЗАГРУЗКА И ОТОБРАЖЕНИЕ
// ============================================
function initApplicationsPage() {
    const page = document.querySelector('.applications-page');
    if (!page) return;

    const loadingEl = document.getElementById('applicationsLoading');
    const emptyEl = document.getElementById('applicationsEmpty');
    const tableWrapper = document.getElementById('applicationsTableWrapper');
    const tableBody = document.getElementById('applicationsTableBody');

    // ПРОВЕРЯЕМ АВТОРИЗАЦИЮ ЧЕРЕЗ HTML (а не localStorage!)
    const currentUserDiv = document.getElementById('currentUser');
    const userId = currentUserDiv ? currentUserDiv.dataset.id : '';

    if (!userId) {
        // Пользователь не авторизован
        loadingEl.style.display = 'none';
        emptyEl.style.display = 'block';
        emptyEl.innerHTML = '<p>Войдите в аккаунт, чтобы увидеть свои заявки</p><a href="/login" class="btn">Войти</a>';
        return;
    }

    // Пользователь авторизован - загружаем заявки
    fetch(`/api/applications?user_id=${userId}`)
        .then(response => response.json())
        .then(data => {
            loadingEl.style.display = 'none';

            if (!data.applications || data.applications.length === 0) {
                emptyEl.style.display = 'block';
                emptyEl.innerHTML = '<p>У вас пока нет заявок</p><a href="/" class="btn">Перейти к курсам</a>';
                return;
            }

            tableWrapper.style.display = 'block';
            tableBody.innerHTML = '';

            data.applications.forEach((app, index) => {
                const tr = document.createElement('tr');

                // Определяем класс бейджа по статусу
                let statusClass = 'new';
                const statusLower = (app.status || '').toLowerCase();
                if (statusLower.includes('обраб') || statusLower.includes('process')) statusClass = 'processing';
                else if (statusLower.includes('заверш') || statusLower.includes('complet')) statusClass = 'completed';
                else if (statusLower.includes('отклон') || statusLower.includes('reject')) statusClass = 'rejected';

                // Форматируем дату
                let formattedDate = app.created_at || '';
                if (formattedDate) {
                    const date = new Date(formattedDate);
                    if (!isNaN(date)) {
                        const day = String(date.getDate()).padStart(2, '0');
                        const month = String(date.getMonth() + 1).padStart(2, '0');
                        const year = date.getFullYear();
                        const hours = String(date.getHours()).padStart(2, '0');
                        const minutes = String(date.getMinutes()).padStart(2, '0');
                        formattedDate = `${day}.${month}.${year} ${hours}:${minutes}`;
                    }
                }

                tr.innerHTML = `
                    <td>${index + 1}</td>
                    <td>${app.course_name || app.course || 'Не указан'}</td>
                    <td><span class="status-badge-app ${statusClass}">${app.status || 'Новая'}</span></td>
                    <td>${formattedDate}</td>
                `;
                tableBody.appendChild(tr);
            });
        })
        .catch(error => {
            console.error('Ошибка загрузки заявок:', error);
            loadingEl.style.display = 'none';
            emptyEl.style.display = 'block';
            emptyEl.innerHTML = '<p>Не удалось загрузить заявки. Попробуйте позже.</p>';
        });
}
// ============================================
// СТРАНИЦА "МОИ ЗАЯВКИ" - ЗАГРУЗКА ЗАЯВОК
// ============================================
function initApplicationsPage() {
    const page = document.querySelector('.applications-page');
    if (!page) return;

    const loadingEl = document.getElementById('applicationsLoading');
    const emptyEl = document.getElementById('applicationsEmpty');
    const tableWrapper = document.getElementById('applicationsTableWrapper');
    const tableBody = document.getElementById('applicationsTableBody');

    // Проверяем авторизацию через HTML (Flask сессия)
    const currentUserDiv = document.getElementById('currentUser');
    const userId = currentUserDiv ? currentUserDiv.dataset.id : '';

    if (!userId) {
        loadingEl.style.display = 'none';
        emptyEl.style.display = 'block';
        emptyEl.innerHTML = '<p>Войдите в аккаунт, чтобы увидеть свои заявки</p><a href="/login" class="btn">Войти</a>';
        return;
    }

    // Функция загрузки заявок
    function loadApplications() {
        fetch(`/api/applications?user_id=${userId}`)
            .then(response => response.json())
            .then(data => {
                loadingEl.style.display = 'none';

                if (!data.applications || data.applications.length === 0) {
                    emptyEl.style.display = 'block';
                    emptyEl.innerHTML = '<p>У вас пока нет заявок</p><a href="/" class="btn">Перейти к курсам</a>';
                    return;
                }

                tableWrapper.style.display = 'block';
                tableBody.innerHTML = '';

                data.applications.forEach((app, index) => {
                    const tr = document.createElement('tr');

                    // Определяем класс бейджа по статусу
                    let statusClass = 'new';
                    const statusLower = (app.status || '').toLowerCase();
                    if (statusLower.includes('обраб') || statusLower.includes('process')) statusClass = 'processing';
                    else if (statusLower.includes('заверш') || statusLower.includes('complet')) statusClass = 'completed';
                    else if (statusLower.includes('отклон') || statusLower.includes('reject')) statusClass = 'rejected';

                    // Форматируем дату
                    let formattedDate = app.created_at || '';
                    if (formattedDate) {
                        const date = new Date(formattedDate);
                        if (!isNaN(date)) {
                            const day = String(date.getDate()).padStart(2, '0');
                            const month = String(date.getMonth() + 1).padStart(2, '0');
                            const year = date.getFullYear();
                            const hours = String(date.getHours()).padStart(2, '0');
                            const minutes = String(date.getMinutes()).padStart(2, '0');
                            formattedDate = `${day}.${month}.${year} ${hours}:${minutes}`;
                        }
                    }

                    tr.innerHTML = `
                        <td>${index + 1}</td>
                        <td>${app.course_name || app.course || 'Не указан'}</td>
                        <td><span class="status-badge-app ${statusClass}">${app.status || 'Новая'}</span></td>
                        <td>${formattedDate}</td>
                        <td>
                            <button class="btn-delete-app" data-id="${app.id}" title="Удалить заявку">
                                <i class="fas fa-trash"></i> Удалить
                            </button>
                        </td>
                    `;
                    tableBody.appendChild(tr);
                });

                // Добавляем обработчики для кнопок удаления
                document.querySelectorAll('.btn-delete-app').forEach(btn => {
                    btn.addEventListener('click', function() {
                        const appId = this.dataset.id;
                        deleteApplication(appId, this.closest('tr'));
                    });
                });
            })
            .catch(error => {
                console.error('Ошибка загрузки заявок:', error);
                loadingEl.style.display = 'none';
                emptyEl.style.display = 'block';
                emptyEl.innerHTML = '<p>Не удалось загрузить заявки. Попробуйте позже.</p>';
            });
    }

    // Функция удаления заявки
    function deleteApplication(appId, rowElement) {
        if (!confirm('Вы уверены, что хотите удалить эту заявку?')) {
            return;
        }

        fetch(`/api/applications/${appId}`, {
            method: 'DELETE'
        })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                // Анимация удаления
                rowElement.style.transition = 'all 0.3s ease';
                rowElement.style.opacity = '0';
                rowElement.style.transform = 'translateX(-100%)';

                setTimeout(() => {
                    rowElement.remove();

                    // Если заявок не осталось, показываем пустое состояние
                    if (tableBody.children.length === 0) {
                        tableWrapper.style.display = 'none';
                        emptyEl.style.display = 'block';
                        emptyEl.innerHTML = '<p>У вас пока нет заявок</p><a href="/" class="btn">Перейти к курсам</a>';
                    }
                }, 300);

                showNotification('Заявка успешно удалена', 'success');
            } else {
                showNotification(data.message || 'Ошибка при удалении', 'error');
            }
        })
        .catch(error => {
            console.error('Ошибка удаления:', error);
            showNotification('Ошибка подключения к серверу', 'error');
        });
    }

    // Загружаем заявки при инициализации
    loadApplications();
}