Онлайн-школа программирования "School"

Веб-приложение для онлайн-школы с системой управления заявками, авторизацией пользователей и административной панелью.

Технологии

- Backend: Flask 3.1, Flask-SQLAlchemy, Flask-CORS
- База данных: SQLite (можно легко переключить на PostgreSQL)
- Безопасность: bcrypt (хэширование паролей), защита от брутфорса
- Фронтенд: HTML5, CSS3, JavaScript (vanilla), Jinja2
- Дополнительно: python-dotenv, Font Awesome, адаптивный дизайн

Установка и запуск

1. Клонирование репозитория
```bash
git clone <https://github.com/Damirich107/-School>
cd <проект шк прог School самый новый>

2. Создание виртуального окружения (venv)
python -m venv venv
venv\Scripts\activate

3. Установка зависимостей
pip install -r requirements.txt

4. Создание администратора
python create_admin.py

5. Запуск сервера
python app.py

Тестовые учетные данные
Имя пользователя: Damirich_107
Email: h.shagaviev@gmail.com
Пароль: 123456qq

Администратор
Имя пользователя: admin1
Email: admin1@gmail.com
Пароль: 123456qq

Скриншоты

Главная страница
[Главная страница](screenshots/home.png)

Страница входа
[Вход](screenshots/login.png)

Админ-панель
[Админ-панель](screenshots/admin.png)