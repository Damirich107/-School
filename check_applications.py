from app import app, db, Application
from datetime import datetime

with app.app_context():
    apps = Application.query.all()
    
    print("\n" + "=" * 60)
    print("📋 ВСЕ ЗАЯВКИ В БАЗЕ ДАННЫХ")
    print("=" * 60)
    
    if len(apps) == 0:
        print("\n❌ Заявок пока нет!")
    else:
        for app_item in apps:
            print(f"\n📝 Заявка #{app_item.id}")
            print(f"   👤 Имя:      {app_item.name}")
            print(f"   📧 Email:    {app_item.email}")
            print(f"   📞 Телефон:  {app_item.phone}")
            print(f"   📚 Курс:     {app_item.course}")
            print(f"   🏷️  Статус:   {app_item.status}")
            print(f"   📅 Дата:     {app_item.created_at}")
            print("-" * 40)
    
    print(f"\n✅ Всего заявок в БД: {len(apps)}")
    print("=" * 60)