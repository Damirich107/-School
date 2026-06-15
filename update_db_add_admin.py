# update_db_add_admin.py
from app import app, db

with app.app_context():
    # Добавляем колонку is_admin, если её нет
    try:
        db.session.execute('ALTER TABLE users ADD COLUMN is_admin BOOLEAN DEFAULT 0')
        print("✅ Добавлено поле is_admin")
    except Exception as e:
        print(f"Поле уже существует или ошибка: {e}")
    
    db.session.commit()
    print("✅ Готово!")