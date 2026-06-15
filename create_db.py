# create_db.py
# Скрипт для создания всех таблиц в базе данных
# запускается один раз при первом развёртывании приложения

from app import app, db, User
from datetime import datetime
from werkzeug.security import generate_password_hash

with app.app_context():
    # Удаляем все существующие таблицы (ОСТОРОЖНО! Стирает все данные!)
    # Раскомментируйте следующую строку, если нужно пересоздать БД
    # db.drop_all()

    # Создаём все таблицы, которые описаны в моделях
    db.create_all()

    print("=" * 50)
    print("✅ База данных успешно создана!")
    print(f"📁 Таблицы в базе данных: {list(db.metadata.tables.keys())}")
    print("=" * 50)

    # Опционально: добавляем тестового пользователя
    test_user = User.query.filter_by(username='admin').first()
    if not test_user:
        admin = User(
            username='admin',
            email='admin@example.com',
            phone='+79600844567'
        )
        admin.set_password('admin123')
        db.session.add(admin)
        db.session.commit()
        print("👤 Создан тестовый пользователь: admin / admin123")