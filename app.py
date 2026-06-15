from flask import Flask, request, jsonify, send_from_directory, session, redirect, url_for, render_template
from flask_cors import CORS
from flask_sqlalchemy import SQLAlchemy
from functools import wraps
import re
import os
from datetime import datetime, timedelta
import bcrypt
from dotenv import load_dotenv


# Загружаем переменные окружения
load_dotenv()
app = Flask(__name__, static_folder='static', static_url_path='/static', template_folder='templates')
CORS(app)

import secrets

def get_secret_key():
    """Получает секретный ключ из переменных окружения или генерирует новый"""
    key = os.environ.get('SECRET_KEY')
    if not key:
        # Генерируем случайный ключ (только для разработки!)
        key = secrets.token_hex(32)
        print(f"⚠️ Внимание! Используется сгенерированный ключ: {key}")
    return key

app.secret_key = get_secret_key()



# ========== НАСТРОЙКИ БАЗЫ ДАННЫХ ==========
app.config['SQLALCHEMY_DATABASE_URI'] = os.environ.get('DATABASE_URL', 'sqlite:///database.db')
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False

# Создаем объект для работы с базой данных
db = SQLAlchemy(app)


# ========== МОДЕЛЬ ПОЛЬЗОВАТЕЛЯ (РАСШИРЕННАЯ) ==========
class User(db.Model):
    __tablename__ = 'users'

    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(80), unique=True, nullable=False)
    email = db.Column(db.String(120), unique=True, nullable=False)
    phone = db.Column(db.String(20), unique=True, nullable=True)
    password_hash = db.Column(db.String(200), nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    last_login = db.Column(db.DateTime, nullable=True)

    # Дополнительные поля для профиля
    bio = db.Column(db.Text, nullable=True)
    avatar = db.Column(db.String(200), nullable=True)
    is_active = db.Column(db.Boolean, default=True)

    # 👇 ДОБАВЬТЕ ЭТУ СТРОКУ 👇
    is_admin = db.Column(db.Boolean, default=False)  # Администратор

    # Защита от брутфорса
    failed_login_attempts = db.Column(db.Integer, default=0)
    locked_until = db.Column(db.DateTime, nullable=True)

    def __repr__(self):
        return f'<User {self.username}>'

    def set_password(self, password):
        """Устанавливает хэш пароля с помощью bcrypt."""
        password_bytes = password.encode('utf-8')
        salt = bcrypt.gensalt()
        hashed = bcrypt.hashpw(password_bytes, salt)
        self.password_hash = hashed.decode('utf-8')

    def check_password(self, password):
        """Проверяет пароль."""
        password_bytes = password.encode('utf-8')
        stored_hash_bytes = self.password_hash.encode('utf-8')
        return bcrypt.checkpw(password_bytes, stored_hash_bytes)

    # ========== МЕТОДЫ ДЛЯ ПРОФИЛЯ ==========
    def get_full_info(self):
        """Возвращает словарь с полной информацией о пользователе"""
        return {
            'id': self.id,
            'username': self.username,
            'email': self.email,
            'bio': self.bio if self.bio else 'Пользователь пока ничего не рассказал о себе',
            'avatar': self.avatar or '/static/default-avatar.png',
            'created_at': self.created_at.strftime('%d.%m.%Y') if self.created_at else 'Не указано',
            'last_login': self.last_login.strftime('%d.%m.%Y %H:%M') if self.last_login else 'Ни разу',
            'is_active': self.is_active
        }

    def update_last_login(self):
        """Обновляет время последнего входа"""
        self.last_login = datetime.utcnow()
        db.session.commit()

    def update_profile(self, bio=None, avatar=None):
        """Обновляет профиль пользователя"""
        if bio is not None:
            self.bio = bio
        if avatar is not None:
            self.avatar = avatar
        db.session.commit()

    @staticmethod
    def get_by_username(username):
        """Находит пользователя по имени"""
        return User.query.filter_by(username=username).first()

    @staticmethod
    def get_by_email(email):
        """Находит пользователя по email"""
        return User.query.filter_by(email=email).first()

    # ===== МЕТОДЫ ДЛЯ ЗАЩИТЫ ОТ БРУТФОРСА =====
    def is_locked(self):
        """Проверяет, заблокирован ли пользователь"""
        if self.locked_until and datetime.utcnow() < self.locked_until:
            return True
        return False

    def increment_failed_attempts(self):
        """Увеличивает счётчик неудачных попыток"""
        self.failed_login_attempts += 1
        if self.failed_login_attempts >= 5:
            # Блокируем на 15 минут
            self.locked_until = datetime.utcnow() + timedelta(minutes=15)
        db.session.commit()

    def reset_failed_attempts(self):
        """Сбрасывает счётчик при успешном входе"""
        self.failed_login_attempts = 0
        self.locked_until = None
        db.session.commit()


# ========== МОДЕЛЬ ЗАЯВКИ (ДЛЯ ФОРМЫ ОБРАТНОЙ СВЯЗИ) ==========
class Application(db.Model):
    __tablename__ = 'applications'

    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=True)  # Внешний ключ!
    name = db.Column(db.String(100), nullable=False)
    email = db.Column(db.String(120), nullable=False)
    phone = db.Column(db.String(20), nullable=False)
    course = db.Column(db.String(100), nullable=False)
    status = db.Column(db.String(50), default='new')  # new, in_progress, completed, rejected
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    # Связь с пользователем (один пользователь -> много заявок)
    user = db.relationship('User', backref='applications')

    def __repr__(self):
        return f'<Application {self.name} - {self.course}>'

    def to_dict(self):
        """Преобразует заявку в словарь для JSON"""
        return {
            'id': self.id,
            'user_id': self.user_id,
            'name': self.name,
            'email': self.email,
            'phone': self.phone,
            'course': self.course,
            'status': self.status,
            'created_at': self.created_at.strftime('%d.%m.%Y %H:%M') if self.created_at else None
        }


# ========== ДЕКОРАТОР ДЛЯ ЗАЩИТЫ МАРШРУТОВ ==========
def login_required(f):
    """
    Декоратор для маршрутов, требующих авторизации.
    Если пользователь не авторизован — перенаправляет на страницу входа.
    """

    @wraps(f)
    def decorated_function(*args, **kwargs):
        if 'user_id' not in session:
            return redirect(url_for('login'))
        return f(*args, **kwargs)

    return decorated_function


def admin_required(f):
    """
    Декоратор для маршрутов, требующих прав администратора.
    """

    @wraps(f)
    def decorated_function(*args, **kwargs):
        if 'user_id' not in session:
            return redirect(url_for('login'))

        user = User.query.get(session['user_id'])
        if not user or not user.is_admin:
            # Если не админ - показываем ошибку 403
            return "Доступ запрещён. Требуются права администратора.", 403

        return f(*args, **kwargs)

    return decorated_function


# ========== ФУНКЦИИ ВАЛИДАЦИИ ==========

def validate_email(email):
    """
    Проверяет корректность email адреса.
    Шаблон: имя@домен.зона (минимум 2 буквы в зоне)
    """
    pattern = r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$'

    if re.match(pattern, email):
        return {"valid": True, "message": "✓ Email корректный", "cleaned": email.lower().strip()}
    else:
        return {"valid": False, "message": "✗ Неправильный email! Пример: name@mail.ru", "cleaned": None}


def validate_phone(phone):
    """
    Проверяет корректность номера телефона.
    Поддерживает форматы:
    - +7-999-123-45-67
    - +7 999 123 45 67
    - +79991234567
    - 8-999-123-4567
    - 8 999 123 4567
    - 89991234567
    """
    phone = phone.strip()

    # Список допустимых форматов
    patterns = [
        r'^\+7-\d{3}-\d{3}-\d{2}-\d{2}$',  # +7-999-123-45-67
        r'^\+7 \d{3} \d{3} \d{2} \d{2}$',  # +7 999 123 45 67
        r'^\+7\d{10}$',  # +79991234567
        r'^8-\d{3}-\d{3}-\d{4}$',  # 8-999-123-4567
        r'^8 \d{3} \d{3} \d{4}$',  # 8 999 123 4567
        r'^8\d{10}$',  # 89991234567
        r'^\+7 \(\d{3}\) \d{3}-\d{2}-\d{2}$',  # +7 (111) 111-11-11
    ]

    for pattern in patterns:
        if re.match(pattern, phone):
            # Очищаем от всего, кроме цифр
            clean = re.sub(r'\D', '', phone)
            # Приводим к формату +7XXXXXXXXXX
            if clean.startswith('8'):
                clean = '+7' + clean[1:]
            elif clean.startswith('7'):
                clean = '+' + clean

            return {"valid": True, "message": "✓ Телефон корректный", "cleaned": clean}

    return {"valid": False, "message": "✗ Неправильный телефон! Пример: +7-999-123-45-67", "cleaned": None}


def validate_password(password):
    """
    Проверяет надежность пароля:
    - Минимум 4 символа (как в лабораторной)
    - Хотя бы одна буква
    - Хотя бы одна цифра
    """
    if len(password) < 4:
        return {"valid": False, "message": "Пароль должен быть не менее 4 символов"}

    if not re.search(r'[a-zA-Zа-яА-Я]', password):
        return {"valid": False, "message": "Пароль должен содержать хотя бы одну букву"}

    if not re.search(r'\d', password):
        return {"valid": False, "message": "Пароль должен содержать хотя бы одну цифру"}

    return {"valid": True, "message": "✓ Пароль надёжный"}


# ========== СЧЁТЧИК ПОСЕЩЕНИЙ ==========

@app.before_request
def count_visits():
    # Исключаем статические файлы и API из подсчёта
    if not request.path.startswith('/static') and not request.path.startswith(
            '/images') and not request.path.startswith('/api'):
        if 'visit_count' in session:
            session['visit_count'] = session['visit_count'] + 1
        else:
            session['visit_count'] = 1
            session['registered_date'] = datetime.now().strftime('%d.%m.%Y %H:%M')

        session['last_visit'] = datetime.now().strftime('%d.%m.%Y %H:%M')


# ========== СТРАНИЦЫ САЙТА ==========

@app.route('/')
def index():
    """Главная страница"""
    return render_template('ffkk.html')


@app.route('/login', methods=['GET', 'POST'])
def login():
    """Страница входа (с проверкой хэша и защитой от брутфорса)"""
    if request.method == 'POST':
        username = request.form.get('username')
        password = request.form.get('password')

        if not username or not password:
            return render_template('login.html', error="Заполните все поля!")

        # Ищем пользователя в базе данных
        user = User.query.filter_by(username=username).first()

        if not user:
            return render_template('login.html', error="Неверное имя пользователя или пароль")

        # Проверяем, не заблокирован ли пользователь
        if user.is_locked():
            remaining_minutes = int((user.locked_until - datetime.utcnow()).total_seconds() / 60) + 1
            return render_template('login.html',
                                   error=f"Аккаунт временно заблокирован! Попробуйте через {remaining_minutes} минут.")

        # Проверяем пароль
        if not user.check_password(password):
            # Увеличиваем счётчик неудачных попыток
            user.increment_failed_attempts()
            remaining = 5 - user.failed_login_attempts
            if remaining > 0:
                return render_template('login.html', error=f"Неверный пароль! Осталось попыток: {remaining}")
            else:
                return render_template('login.html', error="Аккаунт заблокирован на 15 минут!")

        # Успешный вход - сбрасываем счётчик неудачных попыток
        user.reset_failed_attempts()

        session['username'] = username
        session['user_id'] = user.id
        session['email'] = user.email
        session['phone'] = user.phone
        session['registered_date'] = user.created_at.strftime('%d.%m.%Y %H:%M')
        session['is_admin'] = user.is_admin

        # Обновляем дату последнего входа
        user.last_login = datetime.utcnow()
        db.session.commit()

        return redirect(url_for('profile'))

    return render_template('login.html')


@app.route('/register', methods=['GET', 'POST'])
def register():
    """Страница регистрации (хэширует пароль перед сохранением)"""
    if request.method == 'POST':
        username = request.form.get('username')
        email = request.form.get('email')
        phone = request.form.get('phone')
        password = request.form.get('password')
        confirm_password = request.form.get('confirm_password')

        # Валидация
        errors = []

        # Проверка имени пользователя
        if not username or len(username.strip()) < 3:
            errors.append("Имя пользователя должно быть не менее 3 символов")

        # Проверка email
        email_result = validate_email(email) if email else {"valid": False, "message": "Email обязателен"}
        if not email_result['valid']:
            errors.append(email_result['message'])

        # Проверка телефона
        phone_result = validate_phone(phone) if phone else {"valid": False, "message": "Телефон обязателен"}
        if not phone_result['valid']:
            errors.append(phone_result['message'])

        # Проверка пароля
        password_result = validate_password(password)
        if not password_result['valid']:
            errors.append(password_result['message'])

        # Проверка подтверждения пароля
        if password != confirm_password:
            errors.append("Пароли не совпадают")

        # Проверка на существующего пользователя в БД
        existing_user = User.query.filter_by(username=username).first()
        if existing_user:
            errors.append("Пользователь с таким именем уже существует")

        # Проверка на существующий email в БД
        existing_email = User.query.filter_by(email=email_result.get('cleaned', email)).first()
        if existing_email:
            errors.append("Пользователь с таким email уже зарегистрирован")

        # Проверка на существующий телефон в БД
        if phone_result.get('cleaned'):
            existing_phone = User.query.filter_by(phone=phone_result['cleaned']).first()
            if existing_phone:
                errors.append("Пользователь с таким телефоном уже зарегистрирован")

        if errors:
            return render_template('register.html', errors=errors,
                                   username=username, email=email, phone=phone)

        # Создаём нового пользователя
        new_user = User(
            username=username,
            email=email_result.get('cleaned', email),
            phone=phone_result.get('cleaned', phone) if phone_result.get('valid') else phone,
            bio=""  # Пустое поле "о себе"
        )

        # ХЭШИРОВАНИЕ ПАРОЛЯ!
        new_user.set_password(password)

        # Сохраняем в базу данных
        try:
            db.session.add(new_user)
            db.session.commit()

            # Автоматический вход после регистрации
            session['username'] = username
            session['user_id'] = new_user.id
            session['email'] = new_user.email
            session['phone'] = new_user.phone
            session['registered_date'] = new_user.created_at.strftime('%d.%m.%Y %H:%M')

            return redirect(url_for('profile'))
        except Exception as e:
            db.session.rollback()
            errors.append(f"Ошибка при сохранении: {str(e)}")
            return render_template('register.html', errors=errors,
                                   username=username, email=email, phone=phone)

    return render_template('register.html')


@app.route('/logout')
def logout():
    """Выход из сессии"""
    session.clear()
    return redirect(url_for('index'))


@app.route('/feedback', methods=['GET', 'POST'])
def feedback():
    """Страница обратной связи"""
    if request.method == 'POST':
        session['feedback_sent'] = True
        return redirect(url_for('feedback'))
    session.pop('feedback_sent', None)
    return render_template('feedback.html')


# ========== ЛИЧНЫЙ КАБИНЕТ (ПРОФИЛЬ) ==========

@app.route('/profile')
@login_required
def profile():
    """Страница профиля пользователя"""
    user = User.query.get(session['user_id'])
    if not user:
        session.clear()
        return redirect(url_for('login'))
    return render_template('profile.html', user=user.get_full_info())


# ========== РЕДАКТИРОВАНИЕ ПРОФИЛЯ ==========

@app.route('/edit_profile', methods=['GET', 'POST'])
@login_required
def edit_profile():
    """Редактирование профиля"""
    user = User.query.get(session['user_id'])
    if not user:
        session.clear()
        return redirect(url_for('login'))

    if request.method == 'POST':
        new_username = request.form.get('username')
        new_email = request.form.get('email')
        new_bio = request.form.get('bio')
        new_password = request.form.get('new_password')

        # Проверяем уникальность нового имени
        if new_username != user.username:
            existing_user = User.query.filter_by(username=new_username).first()
            if existing_user:
                return "Пользователь с таким именем уже существует!", 400

        # Проверяем уникальность нового email
        if new_email != user.email:
            existing_email = User.query.filter_by(email=new_email).first()
            if existing_email:
                return "Пользователь с таким email уже существует!", 400

        # Обновляем данные
        user.username = new_username
        user.email = new_email
        user.bio = new_bio

        # Обновляем пароль, если указан
        if new_password and len(new_password) >= 4:
            # Дополнительная проверка пароля
            password_result = validate_password(new_password)
            if password_result['valid']:
                user.set_password(new_password)
            else:
                return password_result['message'], 400

        db.session.commit()

        # Обновляем имя в сессии
        session['username'] = user.username
        session['email'] = user.email

        return redirect(url_for('profile'))

    return render_template('edit_profile.html', user=user)


# ========== МОИ ЗАЯВКИ ==========

@app.route('/my_applications')
@login_required
def my_applications():
    """Страница с заявками пользователя"""
    return render_template('my_applications.html')


# ========== СЕКРЕТНАЯ СТРАНИЦА (ТОЛЬКО ДЛЯ АВТОРИЗОВАННЫХ) ==========

@app.route('/secret')
@login_required
def secret_page():
    """Секретная страница (только для авторизованных)"""
    return """
    <div style="max-width: 600px; margin: 50px auto; text-align: center; background: white; padding: 40px; border-radius: 15px; box-shadow: 0 5px 20px rgba(0,0,0,0.1);">

    <!-- ДОБАВЛЯЕМ КАРТИНКУ -->
    <img src="static/images/secret.jfif" alt="Secret" style="width: 150px; height: 150px; margin-bottom: 20px; object-fit: contain;">

    <h1 style="margin: 20px 0; color: #333;">Секретная страница</h1>
    <p style="font-size: 18px; margin: 20px 0; color: #666;">Только авторизованные пользователи могут это видеть!</p>
    <p style="font-size: 24px; margin: 20px 0;">Поздравляю! Вы успешно вошли в систему.</p>
    <div style="display: flex; gap: 15px; justify-content: center; margin-top: 30px;">
        <a href="/profile" style="display: inline-block; padding: 12px 25px; background: #716e6e; color: white; text-decoration: none; border-radius: 8px;">В профиль</a>
        <a href="/" style="display: inline-block; padding: 12px 25px; background: #716e6e; color: white; text-decoration: none; border-radius: 8px;">На главную</a>
    </div>
    </div>
    """


# ========== ВОССТАНОВЛЕНИЕ ПАРОЛЯ ==========

@app.route('/forgot_password', methods=['GET', 'POST'])
def forgot_password():
    """Страница восстановления пароля"""
    if request.method == 'POST':
        email = request.form.get('email')
        user = User.query.filter_by(email=email).first()

        if not user:
            return render_template('forgot_password.html',
                                   error="Пользователь с таким email не найден!")

        # Для обучения просто показываем форму сброса
        return render_template('forgot_password.html',
                               reset_mode=True, email=email)

    return render_template('forgot_password.html')


@app.route('/reset_password', methods=['POST'])
def reset_password():
    """Сброс пароля"""
    email = request.form.get('email')
    new_password = request.form.get('new_password')
    confirm_password = request.form.get('confirm_password')

    if new_password != confirm_password:
        return render_template('forgot_password.html',
                               error="Пароли не совпадают!",
                               reset_mode=True, email=email)

    # Проверяем надёжность пароля
    password_result = validate_password(new_password)
    if not password_result['valid']:
        return render_template('forgot_password.html',
                               error=password_result['message'],
                               reset_mode=True, email=email)

    user = User.query.filter_by(email=email).first()
    if user:
        user.set_password(new_password)
        db.session.commit()
        return render_template('forgot_password.html',
                               message="Пароль успешно изменён! Теперь вы можете войти.")

    return render_template('forgot_password.html', error="Ошибка при сбросе пароля!")


# ========== API ENDPOINTS ==========

@app.route('/api/validate/email', methods=['POST'])
def check_email():
    """Endpoint для проверки email"""
    data = request.get_json()
    email = data.get('email', '')
    result = validate_email(email)
    return jsonify(result)


@app.route('/api/validate/phone', methods=['POST'])
def check_phone():
    """Endpoint для проверки телефона"""
    data = request.get_json()
    phone = data.get('phone', '')
    result = validate_phone(phone)
    return jsonify(result)


@app.route('/api/validate/password', methods=['POST'])
def check_password_api():
    """Endpoint для проверки пароля"""
    data = request.get_json()
    password = data.get('password', '')
    result = validate_password(password)
    return jsonify(result)


@app.route('/api/check_username', methods=['POST'])
def check_username():
    """Endpoint для проверки существования пользователя"""
    data = request.get_json()
    username = data.get('username', '')

    if len(username) < 3:
        return jsonify({"available": False, "message": "Имя должно быть не менее 3 символов"})

    # Проверяем в базе данных
    existing_user = User.query.filter_by(username=username).first()
    if existing_user:
        return jsonify({"available": False, "message": "Имя пользователя уже занято"})
    else:
        return jsonify({"available": True, "message": "✓ Имя пользователя доступно"})


# ========== API ДЛЯ ЗАЯВОК ==========

@app.route('/api/applications', methods=['POST'])
def create_application():
    """Создание новой заявки (AJAX)"""
    try:
        data = request.get_json()

        # Валидация
        if not data.get('name') or not data.get('email') or not data.get('phone') or not data.get('course'):
            return jsonify({'success': False, 'message': 'Заполните все поля!'}), 400

        # Валидация email
        email_result = validate_email(data['email'])
        if not email_result['valid']:
            return jsonify({'success': False, 'message': email_result['message']}), 400

        # Валидация телефона
        phone_result = validate_phone(data['phone'])
        if not phone_result['valid']:
            return jsonify({'success': False, 'message': phone_result['message']}), 400

        # Создаём заявку
        application = Application(
            name=data['name'],
            email=email_result['cleaned'],
            phone=phone_result['cleaned'],
            course=data['course']
        )

        # Если пользователь авторизован - привязываем заявку к нему
        if 'user_id' in session:
            application.user_id = session['user_id']

        db.session.add(application)
        db.session.commit()

        return jsonify({
            'success': True,
            'message': '✅ Заявка успешно отправлена! Мы свяжемся с вами.',
            'application_id': application.id
        }), 201

    except Exception as e:
        db.session.rollback()
        return jsonify({'success': False, 'message': f'Ошибка сервера: {str(e)}'}), 500


@app.route('/api/applications', methods=['GET'])
@login_required
def get_user_applications():
    """Получить все заявки текущего пользователя"""
    applications = Application.query.filter_by(user_id=session['user_id']).order_by(Application.created_at.desc()).all()
    return jsonify({
        'success': True,
        'applications': [app.to_dict() for app in applications]
    })


@app.route('/api/applications/<int:application_id>', methods=['DELETE'])
@login_required
def delete_application(application_id):
    """Удаление заявки"""
    try:
        # Находим заявку
        application = Application.query.get(application_id)

        if not application:
            return jsonify({'success': False, 'message': 'Заявка не найдена'}), 404

        # Проверяем, что заявка принадлежит текущему пользователю
        if application.user_id != session['user_id']:
            return jsonify({'success': False, 'message': 'У вас нет прав для удаления этой заявки'}), 403

        # Удаляем заявку
        db.session.delete(application)
        db.session.commit()

        return jsonify({
            'success': True,
            'message': 'Заявка успешно удалена'
        })

    except Exception as e:
        db.session.rollback()
        return jsonify({'success': False, 'message': f'Ошибка сервера: {str(e)}'}), 500


@app.route('/update_profile', methods=['POST'])
def update_profile_legacy():
    """Обновление данных профиля (старый метод для совместимости)"""
    if 'username' in session:
        new_username = request.form.get('new_username')
        if new_username and new_username != session['username']:
            # Проверяем, не занято ли имя
            existing_user = User.query.filter_by(username=new_username).first()
            if existing_user:
                return "Это имя уже занято!", 400

            # Обновляем имя пользователя в базе
            user = User.query.filter_by(username=session['username']).first()
            if user:
                user.username = new_username
                db.session.commit()
            session['username'] = new_username

        favorite = request.form.get('favorite')
        if favorite:
            session['favorite_article'] = favorite

    return redirect(url_for('profile'))


# ========== ОТДАЧА СТАТИЧЕСКИХ ФАЙЛОВ ==========

@app.route('/<path:filename>')
def serve_static(filename):
    """Отдаёт любые файлы из папки проекта"""
    if os.path.exists(filename):
        return send_from_directory('.', filename)
    return "Файл не найден", 404


@app.route('/images/<path:filename>')
def serve_images(filename):
    """Отдаёт изображения из папки images"""
    images_path = os.path.join('.', 'images')
    if os.path.exists(os.path.join(images_path, filename)):
        return send_from_directory('images', filename)
    return "Изображение не найдено", 404


# ========== АДМИН-ПАНЕЛЬ ==========

@app.route('/admin')
@login_required
@admin_required
def admin_dashboard():
    """Главная страница админ-панели"""
    # Статистика
    total_users = User.query.count()
    total_applications = Application.query.count()
    new_applications = Application.query.filter_by(status='new').count()

    # Последние 10 заявок
    recent_applications = Application.query.order_by(Application.created_at.desc()).limit(10).all()

    return render_template('admin/dashboard.html',
                           total_users=total_users,
                           total_applications=total_applications,
                           new_applications=new_applications,
                           recent_applications=recent_applications)


@app.route('/admin/applications')
@login_required
@admin_required
def admin_applications():
    """Список всех заявок"""
    applications = Application.query.order_by(Application.created_at.desc()).all()
    return render_template('admin/applications.html', applications=applications)


@app.route('/admin/application/<int:id>')
@login_required
@admin_required
def admin_application_detail(id):
    """Просмотр одной заявки"""
    application = Application.query.get_or_404(id)
    return render_template('admin/application_detail.html', application=application)


@app.route('/admin/application/<int:id>/edit', methods=['GET', 'POST'])
@login_required
@admin_required
def admin_application_edit(id):
    """Редактирование заявки (статус, комментарий)"""
    application = Application.query.get_or_404(id)

    if request.method == 'POST':
        new_status = request.form.get('status')
        comment = request.form.get('comment')

        if new_status:
            application.status = new_status

        # Если хотите добавить комментарий - нужно добавить поле в модель
        # application.admin_comment = comment

        db.session.commit()
        return redirect(url_for('admin_application_detail', id=application.id))

    return render_template('admin/application_edit.html', application=application)


@app.route('/admin/application/<int:id>/delete', methods=['POST'])
@login_required
@admin_required
def admin_application_delete(id):
    """Удаление заявки"""
    application = Application.query.get_or_404(id)
    db.session.delete(application)
    db.session.commit()
    return redirect(url_for('admin_applications'))


@app.route('/admin/users')
@login_required
@admin_required
def admin_users():
    """Список всех пользователей"""
    users = User.query.order_by(User.created_at.desc()).all()
    return render_template('admin/users.html', users=users)


@app.route('/admin/user/<int:id>/toggle_admin', methods=['POST'])
@login_required
@admin_required
def admin_toggle_admin(id):
    """Сделать пользователя администратором или убрать права"""
    user = User.query.get_or_404(id)

    # Нельзя изменить свои права через этот метод (для безопасности)
    if user.id == session['user_id']:
        return "Нельзя изменить свои права администратора", 400

    user.is_admin = not user.is_admin
    db.session.commit()
    return redirect(url_for('admin_users'))


@app.route('/admin/user/<int:id>/delete', methods=['POST'])
@login_required
@admin_required
def admin_user_delete(id):
    """Удаление пользователя"""
    user = User.query.get_or_404(id)

    # Нельзя удалить самого себя
    if user.id == session['user_id']:
        return "Нельзя удалить самого себя", 400

    db.session.delete(user)
    db.session.commit()
    return redirect(url_for('admin_users'))


# API для админки
@app.route('/api/admin/stats')
@login_required
@admin_required
def admin_stats():
    """Статистика для админ-панели (JSON)"""
    stats = {
        'total_users': User.query.count(),
        'total_applications': Application.query.count(),
        'new_applications': Application.query.filter_by(status='new').count(),
        'completed_applications': Application.query.filter_by(status='completed').count(),
        'rejected_applications': Application.query.filter_by(status='rejected').count(),
    }
    return jsonify(stats)

# ========== СОЗДАНИЕ ТАБЛИЦ ПРИ ПЕРВОМ ЗАПУСКЕ ==========
with app.app_context():
    db.create_all()
    print("✅ База данных и таблицы созданы (если их не было)")

# ========== ЗАПУСК СЕРВЕРА ==========

if __name__ == '__main__':
    print("=" * 60)
    print("🚀 СЕРВЕР ЗАПУЩЕН")
    print("=" * 60)
    print()
    print("📱 ОСНОВНЫЕ СТРАНИЦЫ:")
    print("   🌐 Главная:        http://localhost:5000")
    print("   🔐 Вход:           http://localhost:5000/login")
    print("   📝 Регистрация:    http://localhost:5000/register")
    print("   👤 Профиль:        http://localhost:5000/profile")
    print("   ✏️ Редактировать:  http://localhost:5000/edit_profile")
    print("   📋 Мои заявки:     http://localhost:5000/my_applications")
    print("   🤫 Секретная:      http://localhost:5000/secret")
    print("   🔑 Восстановление: http://localhost:5000/forgot_password")
    print("   ✉️ Обратная связь: http://localhost:5000/feedback")
    print()
    print("📡 API ENDPOINTS:")
    print("   📧 Проверка email:    POST /api/validate/email")
    print("   📞 Проверка телефона: POST /api/validate/phone")
    print("   🔐 Проверка пароля:   POST /api/validate/password")
    print("   👤 Проверка имени:    POST /api/check_username")
    print("   📝 Создать заявку:    POST /api/applications")
    print("   📋 Получить заявки:   GET  /api/applications (требуется вход)")
    print()
    print("💾 БАЗА ДАННЫХ:")
    print("   📁 Файл: instance/database.db")
    print("   📊 Таблицы: users, applications")
    print()
    print("🔐 БЕЗОПАСНОСТЬ:")
    print("   🔒 Пароли хэшируются с помощью BCRYPT")
    print("   🛡️ Защита от брутфорса (блокировка после 5 попыток)")
    print("   🔐 Декоратор @login_required для защищённых маршрутов")
    print()
    print("=" * 60)
    print("Нажмите Ctrl+C для остановки сервера")
    print("=" * 60)
    print()

    app.run(debug=True, host='localhost', port=5000)