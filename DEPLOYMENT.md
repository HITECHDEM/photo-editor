# Инструкции по развертыванию Photo Studio

## 🚀 Варианты развертывания

### 1. Локальный запуск (уже запущен)

Ваше приложение уже запущено локально на порту 8000.

**Доступ:** http://localhost:8000

### 2. GitHub Pages (Бесплатно)

#### Шаги:
1. Создайте репозиторий на GitHub
2. Загрузите все файлы проекта
3. Перейдите в Settings → Pages
4. Выберите Source: "Deploy from a branch"
5. Выберите branch: "main"
6. Нажмите "Save"

**Результат:** `https://your-username.github.io/repository-name`

### 3. Netlify (Бесплатно)

#### Вариант A: Drag & Drop
1. Перейдите на [netlify.com](https://netlify.com)
2. Перетащите папку проекта в область "Drag and drop your site output folder here"
3. Сайт автоматически развернется

#### Вариант B: GitHub Integration
1. Подключите GitHub аккаунт к Netlify
2. Выберите репозиторий
3. Настройте build settings:
   - Build command: оставьте пустым
   - Publish directory: `.`
4. Нажмите "Deploy site"

### 4. Vercel (Бесплатно)

#### Шаги:
1. Перейдите на [vercel.com](https://vercel.com)
2. Подключите GitHub аккаунт
3. Импортируйте репозиторий
4. Vercel автоматически определит настройки
5. Нажмите "Deploy"

### 5. AWS S3 (Платно)

#### Шаги:
1. Создайте S3 bucket
2. Включите "Static website hosting"
3. Загрузите все файлы проекта
4. Настройте bucket policy для публичного доступа
5. Получите URL сайта

### 6. Firebase Hosting (Бесплатно)

#### Шаги:
1. Установите Firebase CLI: `npm install -g firebase-tools`
2. Войдите: `firebase login`
3. Инициализируйте проект: `firebase init hosting`
4. Укажите папку: `.`
5. Разверните: `firebase deploy`

## 📁 Структура файлов для развертывания

```
photo-studio/
├── index.html
├── styles.css
├── script.js
├── README.md
├── .github/workflows/deploy.yml    # GitHub Pages
├── netlify.toml                   # Netlify
├── vercel.json                    # Vercel
└── DEPLOYMENT.md                  # Этот файл
```

## 🔧 Настройки для разных платформ

### GitHub Pages
- Автоматическое развертывание при push в main branch
- Поддержка HTTPS
- Кастомные домены

### Netlify
- Автоматическое развертывание
- CDN по всему миру
- Формы и функции
- Кастомные домены

### Vercel
- Мгновенное развертывание
- Edge Network
- Автоматические превью
- Кастомные домены

## 🌐 Рекомендуемые платформы

1. **Для быстрого тестирования:** GitHub Pages
2. **Для продакшена:** Netlify или Vercel
3. **Для корпоративного использования:** AWS S3

## ⚡ Быстрый старт

Самый быстрый способ развернуть:

1. Создайте репозиторий на GitHub
2. Загрузите файлы
3. Включите GitHub Pages в настройках
4. Готово! 🎉

## 🔍 Проверка развертывания

После развертывания проверьте:
- ✅ Загрузка изображений работает
- ✅ Фильтры применяются
- ✅ Обрезка функционирует
- ✅ Сохранение работает
- ✅ Адаптивность на мобильных устройствах 