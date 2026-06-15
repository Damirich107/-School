# create_admin.py
from app import app, db, User
import getpass

def create_admin():
    with app.app_context():
        print("=" * 50)
        print("👑 СОЗДАНИЕ АДМИНИСТРАТОРА")
        print("=" * 50)
        
        username = input("Имя пользователя: ")
        email = input("Email: ")
        
        # ВАРИАНТ 1: Вводим пароль видимо (для тестирования)
        password = input("Пароль (видимый): ")  # Временно вместо getpass
        
        # Проверяем, существует ли уже
        existing = User.query.filter_by(username=username).first()
        if existing:
            print("❌ Пользователь с таким именем уже существует!")
            return
        
        # Создаём администратора
        admin = User(
            username=username,
            email=email,
            is_admin=True
        )
        admin.set_password(password)
        
        db.session.add(admin)
        db.session.commit()
        
        print(f"✅ Администратор {username} успешно создан!")

if __name__ == "__main__":
    create_admin()