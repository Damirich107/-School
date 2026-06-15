# update_db.py
# Пересоздаёт таблицы (нужно после изменения модели)

from app import app, db

with app.app_context():
    # ВНИМАНИЕ! Это удалит всех существующих пользователей!
    db.drop_all()
    db.create_all()
    print("✅ Таблицы пересозданы!")
    print("⚠️ Все старые данные удалены!")
    print()
    print("📊 Созданные таблицы:", list(db.metadata.tables.keys()))