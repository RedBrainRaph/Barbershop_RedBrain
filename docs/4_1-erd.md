## 🗄️ Схема базы данных

### ERD (Entity Relationship Diagram)

```
┌─────────────────┐
│    barbers      │
├─────────────────┤
│ 🔑 id (PK)      │
│ 📝 name         │
│ 🖼️  photo_url   │
│ 💼 specialty    │
│ 📅 created_at   │
└────────┬────────┘
         │
         │ 1
         │
         │ N
         │
┌────────▼────────┐       ┌─────────────────┐
│   bookings      │   N   │    services     │
├─────────────────┤───────┼─────────────────┤
│ 🔑 id (PK)      │   1   │ 🔑 id (PK)      │
│ 👤 client_name  │       │ 📝 title        │
│ ☎️  client_phone│       │ 📝 description  │
│ 📧 client_email │       │ 💰 price        │
│ 🔗 service_id   │───────│ ⏱️  duration    │
│ 🔗 barber_id    │       │ 🎨 icon         │
│ 📅 booking_date │       │ 📂 category     │
│ ⏰ booking_time │       │ 📅 created_at   │
│ 🏷️  status      │       └─────────────────┘
│ 📅 created_at   │
└─────────────────┘
```
