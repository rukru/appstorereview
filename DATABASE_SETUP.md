# 🗄️ Настройка базы данных

Это руководство поможет настроить PostgreSQL базу данных для App Store Review Analyzer.

## 🚀 Быстрый старт

### Вариант 1: Локальная PostgreSQL

1. **Установите PostgreSQL:**
   ```bash
   # macOS (с Homebrew)
   brew install postgresql
   brew services start postgresql
   
   # Ubuntu/Debian
   sudo apt update
   sudo apt install postgresql postgresql-contrib
   sudo systemctl start postgresql
   
   # Windows - скачайте с https://www.postgresql.org/download/windows/
   ```

2. **Создайте базу данных:**
   ```bash
   # Войдите в PostgreSQL
   psql postgres
   
   # Создайте пользователя и базу данных
   CREATE USER appstore_user WITH PASSWORD 'your_password';
   CREATE DATABASE appstore_reviews OWNER appstore_user;
   GRANT ALL PRIVILEGES ON DATABASE appstore_reviews TO appstore_user;
   \q
   ```

3. **Обновите .env файл:**
   ```bash
   DATABASE_URL="postgresql://appstore_user:your_password@localhost:5432/appstore_reviews?schema=public"
   ```

### Вариант 2: Облачная БД (Supabase - рекомендуется)

1. **Создайте проект на [Supabase](https://supabase.com):**
   - Зарегистрируйтесь на supabase.com
   - Создайте новый проект
   - Скопируйте Database URL из Settings → Database

2. **Обновите .env файл:**
   ```bash
   DATABASE_URL="postgresql://postgres:[YOUR-PASSWORD]@db.[YOUR-PROJECT-REF].supabase.co:5432/postgres?schema=public"
   ```

### Вариант 3: Vercel Postgres

1. **Подключите к проекту Vercel:**
   ```bash
   npx vercel
   vercel env add DATABASE_URL
   ```

## 🔧 Инициализация схемы

После настройки подключения к БД:

1. **Примените схему к базе данных:**
   ```bash
   npm run db:push
   ```

2. **Проверьте подключение:**
   ```bash
   npm run db:studio
   ```
   Откроется Prisma Studio в браузере для управления данными.

## 📊 Структура данных

### Таблицы:

- **apps** - Информация о приложениях
- **reviews** - Отзывы пользователей
- **analyses** - Результаты AI-анализа

### Основные особенности:

- ✅ **Автоматическое кэширование** отзывов (1 час)
- ✅ **Дедупликация** отзывов по originalId
- ✅ **Версионирование** анализов
- ✅ **Индексы** для быстрого поиска
- ✅ **Каскадное удаление** связанных данных

## 🔄 Миграции

Если изменили схему в `prisma/schema.prisma`:

```bash
# Применить изменения к БД
npm run db:push

# Создать миграцию (для продакшена)
npx prisma migrate dev --name your_migration_name
```

## 🧪 Работа с данными

### Просмотр данных:
```bash
npm run db:studio
```

### Сброс БД (осторожно!):
```bash
npx prisma db push --force-reset
```

### Резервное копирование:
```bash
pg_dump $DATABASE_URL > backup.sql
```

## 🚨 Troubleshooting

### Ошибка подключения:
1. Проверьте DATABASE_URL в .env
2. Убедитесь, что PostgreSQL запущен
3. Проверьте права доступа к БД

### Ошибки схемы:
```bash
npx prisma generate
npm run db:push
```

### Проблемы с миграциями:
```bash
npx prisma migrate reset
npx prisma db push
```

## 📈 Производительность

Для оптимальной работы:

1. **Настройте индексы** (уже включены в схему)
2. **Используйте Connection Pooling** для продакшена
3. **Мониторьте размер БД** и настройте архивирование старых данных

## 🔒 Безопасность

- ✅ Никогда не коммитьте реальный DATABASE_URL
- ✅ Используйте переменные окружения
- ✅ Настройте SSL для продакшена
- ✅ Ограничьте доступ к БД по IP