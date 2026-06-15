from app import app, db, User

with app.app_context():
    users = User.query.all()
    print("=" * 60)
    print("ВСЕ ПОЛЬЗОВАТЕЛИ:")
    print("=" * 60)
    for user in users:
        print(f"ID: {user.id}")
        print(f"  Имя:      {user.username}")
        print(f"  Email:    {user.email}")
        print(f"  Телефон:  {user.phone or 'не указан'}")
        print(f"  Создан:   {user.created_at.strftime('%d.%m.%Y %H:%M')}")
        if user.last_login:
            print(f"  Посл.вход: {user.last_login.strftime('%d.%m.%Y %H:%M')}")
        print("-" * 60)
    print(f"ВСЕГО: {User.query.count()} пользователей")