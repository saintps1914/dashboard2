# Custom Dashboard MVP

Веб-интерфейс кастомного дашборда для CRM в стиле GoHighLevel.

## Структура проекта

```
Dashboard/
├── app/
│   ├── dashboard/
<<<<<<< HEAD
│   │   └── page.tsx          # Защищенная страница дашборда (виджеты по toggles)
│   ├── login/
│   │   └── page.tsx          # Страница логина (все пользователи из local JSON)
│   ├── admin/
│   │   └── users/page.tsx    # Админка User Settings
│   ├── globals.css           # Глобальные стили с TailwindCSS
│   ├── layout.tsx            # Корневой layout
│   └── page.tsx              # Главная страница (редирект на login/dashboard)
├── app/api/
│   ├── auth/login/route.ts   # Серверный логин по users.json
│   ├── users/route.ts        # Получение/обновление пользователей
│   └── users/sync/route.ts   # Импорт пользователей из LeadConnector
├── components/
│   ├── Topbar.tsx            # Верхняя панель навигации (User Settings для admin)
=======
│   │   └── page.tsx          # Защищенная страница дашборда
│   ├── login/
│   │   └── page.tsx          # Страница логина
│   ├── globals.css           # Глобальные стили с TailwindCSS
│   ├── layout.tsx            # Корневой layout
│   └── page.tsx              # Главная страница (редирект)
├── components/
│   ├── Topbar.tsx            # Верхняя панель навигации
>>>>>>> 9ed2ada (v1: UI prototype with random data)
│   ├── Widget.tsx            # Базовый компонент виджета с Expand
│   ├── ManagerTasksWidget.tsx    # Виджет 1: Manager Tasks Overview
│   ├── SpecialistTasksWidget.tsx # Виджет 2: Specialist Tasks
│   └── SalesReportWidget.tsx     # Виджет 3: Sales Daily Report
├── lib/
<<<<<<< HEAD
│   ├── auth.ts               # Cookie-based сессия + текущий пользователь
│   ├── userStore.ts          # Работа с data/users.json
│   ├── data-generator.ts     # Генератор случайных данных (для Sales Report)
│   ├── excelParser.ts        # Парсинг Excel файлов (tasks, contacts)
│   └── tasksCache.ts         # Кэш и логика расчетов для задач
├── data/
│   ├── users.json            # Локальное хранилище пользователей
│   ├── generated_credentials.txt # Лог сгенерированных паролей
│   ├── o.xlsx                # Excel файл с задачами (загружается вручную)
│   └── contacts.xlsx         # Excel файл с контактами (загружается вручную)
=======
│   ├── auth.ts               # Cookie-based аутентификация
│   └── data-generator.ts     # Генератор случайных данных
>>>>>>> 9ed2ada (v1: UI prototype with random data)
├── package.json
├── tsconfig.json
├── tailwind.config.ts
├── postcss.config.js
├── next.config.js
<<<<<<< HEAD
├── .env.example
=======
>>>>>>> 9ed2ada (v1: UI prototype with random data)
└── README.md
```

## Технологии

- **Next.js 14** (App Router)
- **TypeScript**
- **TailwindCSS**
- **js-cookie** (для управления сессией)
<<<<<<< HEAD
- **xlsx** (для чтения Excel файлов)
- **LeadConnector API** (импорт пользователей, только на сервере)

## ENV переменные

Создайте `.env.local` по примеру `.env.example`:

```bash
LEADCONNECTOR_TOKEN=pit-e27babad-e3a8-4b5a-851f-8512173fd45e
LEADCONNECTOR_LOCATION_ID=XTqqycBohnAAVy4uneZR
LEADCONNECTOR_API_VERSION=2021-07-28
```

> **Важно:** не коммитьте `.env.local` в git.
=======
>>>>>>> 9ed2ada (v1: UI prototype with random data)

## Установка и запуск

### 1. Установка зависимостей

```bash
npm install
```

### 2. Запуск development сервера

```bash
npm run dev
```

<<<<<<< HEAD
По умолчанию приложение доступно на [http://localhost:3000](http://localhost:3000).

**Примечание:** если порт 3000 занят, Next.js автоматически попробует 3001, 3002, 3003 и т.д. Смотрите вывод терминала.

## Аутентификация и роли (V2)

- Локальное хранилище пользователей: `data/users.json`
  - По умолчанию содержит admin:
    - Email: `admin@test.com`
    - Password: `admin123`
  - Импортированные пользователи добавляются через LeadConnector API.
- Логин идет через серверный endpoint `/api/auth/login`.
- Сессия хранится в cookie `dashboard_session` (email, role, widget toggles).
- Роли:
  - `admin` — видит кнопку **User Settings**, может синхронизировать пользователей и менять переключатели виджетов.
  - `user` — обычный пользователь.

## Импорт пользователей (LeadConnector)

- Endpoint: `GET https://services.leadconnectorhq.com/users?locationId=...`
- Настройки берутся из ENV.
- Импорт выполняется по кнопке **Sync Users from LeadConnector** на странице `/admin/users`.
- Для каждого нового пользователя:
  - Генерируется пароль (12 символов, буквы+цифры).
  - Включены все 3 виджета по умолчанию.
  - Запись сохраняется в `data/users.json`.
  - Строка `email<TAB>password` добавляется в `data/generated_credentials.txt`.

## Админка User Settings

- URL: `/admin/users`
- Доступна только админу (role = `admin`).
- Функционал:
  - Таблица пользователей: Name, Email, Role.
  - 3 переключателя:
    - **Manager Tasks Overview**
    - **Specialist Tasks**
    - **Sales Daily Report**
  - Переключатели обновляют `data/users.json` через `/api/users`.
  - Кнопка **Sync Users from LeadConnector** импортирует пользователей и показывает блок с новыми логинами/паролями.
  - Для admin запрещено выключить все виджеты сразу (минимум один включен).

## Видимость виджетов

- На `/dashboard` виджеты рендерятся в зависимости от toggles текущего пользователя:
  - `managerTasks` → `ManagerTasksWidget` (реальные данные из `o.xlsx`)
  - `specialistTasks` → `SpecialistTasksWidget` (реальные данные из `o.xlsx`)
  - `salesReport` → `SalesReportWidget` (случайные данные)

## Excel интеграция (V3)

### Подготовка файлов

Поместите Excel файлы в папку `./data`:

1. **`o.xlsx`** — список задач (колонки: taskId, title, body, assignedTo, dueDate, completed, contactId)
2. **`contacts.xlsx`** — справочник контактов (колонки: id, first_name, last_name)

### Синхронизация

На странице `/dashboard` есть панель синхронизации:
- **Sync Tasks (o.xlsx)** — загружает задачи
- **Sync Contacts (contacts.xlsx)** — загружает контакты
- **Recalculate Widgets** — пересчитывает метрики

### Данные виджетов

- **Manager Tasks Overview**: показывает таблицу по всем сотрудникам из маппинга, даже если у кого-то 0 задач
- **Specialist Tasks**: показывает задачи только текущего пользователя (сопоставление по `name`)

Подробнее см. [EXCEL_INTEGRATION.md](./EXCEL_INTEGRATION.md)

## Где смотреть сгенерированные пароли

- Все новые сгенерированные пароли пишутся в файл:

  - `data/generated_credentials.txt`

- Также последние сгенерированные креды показываются в блоке на `/admin/users` сразу после синка.
=======
Приложение будет доступно по адресу: [http://localhost:3000](http://localhost:3000)

**Примечание:** Если порт 3000 занят, Next.js автоматически попробует использовать порты 3001, 3002, 3003 и т.д. Проверьте вывод терминала, чтобы узнать, на каком порту запущен сервер.

## Тестовые учетные данные

- **Email:** `admin@test.com`
- **Password:** `admin123`

## Функциональность

### Аутентификация
- Страница логина с валидацией
- Cookie-based сессия (24 часа)
- Защищенный роут `/dashboard`
- Кнопка Logout

### Дашборд
- **Topbar:**
  - Слева: "Custom Dashboard"
  - По центру: логотип (SVG placeholder)
  - Справа: кнопка Logout

- **Виджеты:**
  - Адаптивная сетка (3 колонки на desktop, 2 на tablet, 1 на mobile)
  - Фиксированная высота (~360px)
  - Внутренний скролл
  - Кнопка Expand для каждого виджета
  - Modal overlay при расширении

### Виджет 1: Manager Tasks Overview
Таблица с 10 пользователями:
- User Name
- Open Tasks
- Overdue (badge)
- Due Today (badge)
- Oldest Overdue (days)
- Completed Yesterday

### Виджет 2: Specialist Tasks
Табы:
- **Totals:** карточки с метриками
- **All Tasks:** таблица всех задач
- **Overdue:** таблица просроченных задач
- **Due Today:** таблица задач на сегодня

### Виджет 3: Sales Daily Report
Отчет с табами (Today, Yesterday, Week, Month):
- **Activity:** Calls, Answered, Conversations, Interested Clients
- **Sales:** Deals Closed, Total Contract Amount, First Payment Amount

## Особенности

- Все данные генерируются случайно на фронтенде
- Нет интеграций с API
- Нет backend логики
- Нет базы данных
- Чистый UI-прототип
>>>>>>> 9ed2ada (v1: UI prototype with random data)

## Команды

```bash
# Development
npm run dev

# Build
npm run build

# Start production server
npm start

# Lint
npm run lint
```
<<<<<<< HEAD
=======

>>>>>>> 9ed2ada (v1: UI prototype with random data)
