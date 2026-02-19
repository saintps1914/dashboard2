# Changelog V3: Excel Integration

## Изменения

### Новые файлы

1. **`lib/excelParser.ts`**
   - Парсинг Excel файлов (tasks и contacts)
   - Маппинг `assignedTo -> имя сотрудника` (EMPLOYEE_MAP)
   - Утилиты для работы с датами и контактами

2. **`lib/tasksCache.ts`**
   - Серверный кэш в памяти для tasks и contacts
   - Функции расчета метрик (open, overdue, due today, oldest overdue)
   - Функции получения данных для виджетов

3. **`app/api/tasks/sync/route.ts`**
   - POST `/api/tasks/sync` — синхронизация задач из `o.xlsx`

4. **`app/api/contacts/sync/route.ts`**
   - POST `/api/contacts/sync` — синхронизация контактов из `contacts.xlsx`

5. **`app/api/tasks/data/route.ts`**
   - GET `/api/tasks/data?type=manager` — данные для Manager Tasks
   - GET `/api/tasks/data?type=specialist&filter=...` — данные для Specialist Tasks

6. **`EXCEL_INTEGRATION.md`**
   - Документация по интеграции Excel

### Измененные файлы

1. **`components/ManagerTasksWidget.tsx`**
   - Заменены случайные данные на реальные из API
   - Добавлена обработка ошибок и loading states
   - Экспорт функции refresh через window

2. **`components/SpecialistTasksWidget.tsx`**
   - Заменены случайные данные на реальные из API
   - Добавлена обработка ошибок и loading states
   - Проверка маппинга пользователя
   - Экспорт функции refresh через window

3. **`app/dashboard/page.tsx`**
   - Добавлена панель синхронизации с 3 кнопками
   - Toast-сообщения об успехе/ошибке синхронизации
   - Автоматическое обновление виджетов после синка

4. **`components/Topbar.tsx`**
   - Заменен логотип на creditbooster (SVG + текст)
   - Квадратная точка над 'i' в слове "creditbooster"

5. **`lib/auth.ts`**
   - Добавлена функция `getSessionUserFromCookie()` для серверного чтения сессии

6. **`package.json`**
   - Добавлена зависимость `xlsx: ^0.18.5`

## Установка и запуск

### 1. Установите зависимости

```bash
npm install
```

Это установит библиотеку `xlsx` для чтения Excel файлов.

### 2. Подготовьте Excel файлы

Поместите файлы в папку `./data`:

- **`o.xlsx`** — список задач
- **`contacts.xlsx`** — справочник контактов

### 3. Запустите сервер

```bash
npm run dev
```

### 4. Синхронизируйте данные

1. Войдите в систему (например, как admin: `admin@test.com` / `admin123`)
2. На странице `/dashboard` нажмите кнопки синхронизации:
   - **Sync Tasks (o.xlsx)**
   - **Sync Contacts (contacts.xlsx)**
3. Виджеты автоматически обновятся с реальными данными

## Где посмотреть сгенерированные пароли

Пароли для пользователей (включая Arina Alekhina) находятся в:

- **Файл**: `data/generated_credentials.txt`
- **Формат**: `email<TAB>password`

Для Arina Alekhina:
- Email: `arinaa@creditbooster.com`
- Password: `MW8ENqBnjgh9`

## Сообщения при синхронизации

### Успех

- **Sync Tasks**: "Synced X tasks successfully" (зеленый баннер)
- **Sync Contacts**: "Synced X contacts successfully" (зеленый баннер)
- **Recalculate**: "Widgets recalculated" (зеленый баннер)

### Ошибки

- **Файл не найден**: "File not found: data/o.xlsx" или "File not found: data/contacts.xlsx" (красный баннер)
- **Ошибка парсинга**: "Failed to sync tasks" или "Failed to sync contacts" (красный баннер)

## Особенности

- Данные кэшируются в памяти на сервере
- При изменении Excel файлов нужно нажать Sync для обновления
- Виджеты автоматически обновляются после успешной синхронизации
- Если файлы отсутствуют, виджеты показывают соответствующие сообщения

