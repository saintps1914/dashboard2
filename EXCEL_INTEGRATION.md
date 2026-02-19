# Интеграция Excel данных для виджетов задач

## Обзор

Реализована интеграция реальных данных из Excel файлов для двух виджетов:
- **Manager Tasks Overview** — таблица по всем сотрудникам
- **Specialist Tasks** — задачи текущего пользователя

## Установка

### 1. Установите библиотеку xlsx

```bash
npm install xlsx
```

### 2. Подготовьте Excel файлы

Поместите следующие файлы в папку `./data`:

- **`o.xlsx`** — список задач
- **`contacts.xlsx`** — справочник контактов

## Структура файлов

### o.xlsx (задачи)

Колонки по порядку:
1. `taskId` — игнорируется
2. `title` — название задачи
3. `body` — игнорируется
4. `assignedTo` — ID сотрудника (строка)
5. `dueDate` — срок выполнения (ISO строка, например: `2025-12-26T14:00:00.000Z`)
6. `completed` — TRUE/FALSE или ЛОЖЬ/ИСТИНА
7. `contactId` — ID клиента

### contacts.xlsx (контакты)

Колонки:
1. `id` — ID контакта
2. `first_name` — имя
3. `last_name` — фамилия

## Использование

### Синхронизация данных

На странице `/dashboard` над виджетами есть панель синхронизации:

1. **Sync Tasks (o.xlsx)** — загружает задачи из `data/o.xlsx`
2. **Sync Contacts (contacts.xlsx)** — загружает контакты из `data/contacts.xlsx`
3. **Recalculate Widgets** — пересчитывает метрики виджетов

После синхронизации виджеты автоматически обновляются.

### Manager Tasks Overview

- Показывает таблицу по **всем сотрудникам** из маппинга `assignedTo -> имя`
- Даже если у сотрудника 0 задач, он всё равно отображается в таблице
- Метрики для каждого сотрудника:
  - Open Tasks
  - Overdue
  - Due Today
  - Oldest Overdue (days)
  - Completed Yesterday (всегда 0)

### Specialist Tasks

- Показывает задачи **только текущего пользователя**
- Сопоставление: `loggedInUser.name` == `employeeName` из маппинга
- Если сопоставление не найдено — показывается сообщение "No tasks mapping for this user"
- Табы:
  - **Totals** — метрики
  - **All Tasks** — все открытые задачи (сортировка по dueDate ASC)
  - **Overdue** — просроченные задачи
  - **Due Today** — задачи на сегодня

## Логика расчетов

### Определения

- **today** = текущая дата (только дата, без времени) в локальной таймзоне
- **dueDate** парсится из ISO строки, сравнения делаются по дате (YYYY-MM-DD), время игнорируется
- **task считается open** если `completed == false`
- **task считается overdue** если `open AND dueDate < today`
- **task считается due today** если `open AND dueDate == today`

### Метрики

1. **Open Tasks** = количество открытых задач
2. **Overdue** = количество просроченных задач
3. **Due Today** = количество задач на сегодня
4. **Oldest Overdue (days)** = максимальное количество дней просрочки (минимум 1 день)
5. **Completed Yesterday** = всегда 0

## Маппинг сотрудников

Словарь `assignedTo -> имя сотрудника` находится в `lib/excelParser.ts`:

```typescript
export const EMPLOYEE_MAP: Record<string, string> = {
  '7w1tVfTrwJ5Gh4UDtmbP': 'Nataliia Regush',
  'DSvZfxgURrWOpN210VZK': 'Olga Meshcheryakova',
  // ... и т.д.
};
```

## Обработка ошибок

- Если `o.xlsx` отсутствует: виджеты показывают "No tasks file found (data/o.xlsx)"
- Если `contacts.xlsx` отсутствует: имена клиентов показываются как "Unknown Contact (contactId)"
- Если пользователь не найден в маппинге: Specialist Tasks показывает "No tasks mapping for this user"
- Задачи без `dueDate` не попадают в overdue/due today, в списке показывается "—"

## API Endpoints

### POST `/api/tasks/sync`
Синхронизирует задачи из `data/o.xlsx`

### POST `/api/contacts/sync`
Синхронизирует контакты из `data/contacts.xlsx`

### GET `/api/tasks/data?type=manager`
Возвращает данные для Manager Tasks Overview

### GET `/api/tasks/data?type=specialist&filter=totals|all|overdue|dueToday`
Возвращает данные для Specialist Tasks

## Кэширование

Данные кэшируются в памяти на сервере:
- `tasksCache` — кэш задач
- `contactsCache` — кэш контактов

При синхронизации кэш обновляется автоматически.

## Парсинг дат

Поддерживаются следующие форматы `dueDate`:
- ISO строка: `2025-12-26T14:00:00.000Z`
- Excel serial number (конвертируется автоматически)
- Другие строковые форматы дат

Если дата не парсится — `dueDate = null`, задача считается open, но не попадает в overdue/due today.

## Парсинг completed

Поддерживаются:
- Boolean: `true` / `false`
- Строки: `"TRUE"` / `"FALSE"`, `"ИСТИНА"` / `"ЛОЖЬ"`
- Числа: `1` / `0`

