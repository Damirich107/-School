from app import app, db, User

with app.app_context():
    users = User.query.all()
    print("\n" + "=" * 60)
    print("📋 ПОЛЬЗОВАТЕЛИ В БАЗЕ ДАННЫХ")
    print("=" * 60)
    
    for user in users:
        print(f"\n👤 Имя: {user.username}")
        print(f"📧 Email: {user.email}")
        print(f"📞 Телефон: {user.phone}")
        print(f"🔐 Хэш пароля: {user.password_hash[:50]}...")
        print(f"📅 Создан: {user.created_at}")
        print("-" * 40)