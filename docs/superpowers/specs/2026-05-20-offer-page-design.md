---
title: Offer page for calendar-app-tg project
date: 2026-05-20
status: draft
---

# Сторінка комерційної пропозиції — calendar-app-tg

## Purpose

A Ukrainian-language, single-page commercial offer that the contractor (Oleksandr, @swefd) walks a prospective client through during a meeting. Target client: organizer of a ~100-person community that needs a Telegram-integrated event calendar with Google/Apple Calendar export. The page is a pitch-deck-style **vertical scrolling landing page** — not a slide deck — so it works equally well in a meeting and when the client revisits it later on their phone.

## Tech approach

- **One self-contained HTML file** at `offer/index.html`.
- Inline CSS in a `<style>` block. No build step, no frameworks, no Tailwind.
- A small amount of vanilla JS (~30 lines) only for fade-in-on-scroll animation. Page must work with JS disabled (animations just skip).
- Ukrainian only — `<html lang="uk">`.
- System fonts: `-apple-system, BlinkMacSystemFont, "Inter", "Segoe UI", "Roboto", sans-serif`.
- Fully responsive: multi-column grids on desktop collapse to single column below 768px.
- Page can be opened from disk (`file://`), emailed as an attachment, or hosted anywhere static.

## Page sections (in order)

### 1. Hero
- **H1:** «Календар подій у Telegram для вашої спільноти»
- **Subtitle:** «Бот, Mini App та автоматична інтеграція з Google і Apple Calendar — за 3–5 тижнів»
- **Primary CTA button:** «Забронювати безкоштовну консультацію» → `https://calendar.app.google/r1cfQvmWEtc9yGCa9`
- **Secondary CTA link:** «Написати в Telegram» → `https://t.me/swefd`
- Subtle decorative element (Telegram-blue gradient blob or simple shape), no stock photos.

### 2. Проблема → Рішення
Two short paragraphs (≤80 words each), no images.

- **Проблема:** події губляться в чаті, нагадування ніхто не читає, складно зрозуміти хто прийде.
- **Рішення:** окремий бот і Mini App в Telegram — учасники бачать усі події, реєструються в один клік, отримують нагадування та можуть додати подію у свій календар.

### 3. Що отримає клієнт — 6 feature tiles
Grid: 3×2 desktop, 1 column mobile. Each tile: icon (inline SVG, Lucide-style stroke icons), short title, 1-sentence description.

1. **Telegram-бот** — автоматичні анонси й нагадування в чаті спільноти.
2. **Mini App** — повноцінний календар прямо в Telegram, без встановлень.
3. **Запис на події** — обмеження місць, лист очікування.
4. **Повторювані події** — щотижневі, щомісячні чи свої правила.
5. **Платні події** — облік оплат готівкою, дедлайн скасування за 7 днів.
6. **Інтеграція з календарями** — Google, Apple, Outlook.

### 4. Інтеграція з календарями — A vs B (side-by-side)
Two cards in a 2-column grid. Each has a heading, 3–4 bullet points, and a label indicating which tier it's included in.

**Варіант A — Кнопка «Додати в календар»**
- Користувач натискає кнопку на подію.
- Подія додається в Google / Apple / Outlook як разова копія.
- Не потрібен вхід, не потрібна реєстрація.
- *Включено у версію «Старт».*

**Варіант B — Автоматична синхронізація**
- Користувач один раз підписується на персональне посилання.
- Усі майбутні події, зміни та скасування — автоматично в його календарі.
- Працює з Google, Apple Calendar та Outlook.
- *Включено у версію «Розширений».*

### 5. Дві версії проєкту — Старт vs Розширений
Two pricing cards, side-by-side. «Розширений» card has a yellow badge in the top-right corner labelled «РЕКОМЕНДУЄМО» (highlight color `#FFB800`, white text) and a subtle border in accent color.

> Note: project tier names («Старт» / «Розширений») are deliberately different from the maintenance tier names («Базовий» / «Стандарт» / «Преміум») to avoid mid-meeting ambiguity.

**Старт — €2,000**
- Telegram-бот + Mini App
- Створення подій, RSVP, обмеження місць
- Повторювані події
- Платні події (готівкова оплата)
- Кнопка «Додати в календар» (варіант A)
- Розгортання на вашому сервері
- **Термін: 3–4 тижні**

**Розширений — €2,500** ⭐
- Усе з версії «Старт»
- **Автоматична синхронізація** з Google / Apple Calendar (варіант B)
- Персональні підписки для кожного учасника
- **Термін: 4–5 тижнів**

### 6. Етапи роботи — 4-step timeline
Horizontal timeline on desktop, vertical on mobile. Each step has number, title, duration, 1-sentence detail.

1. **Аналіз і узгодження** — 1 тиждень — фінальні вимоги, дизайн інтерфейсу, технічний план.
2. **Розробка** — 2–3 тижні — бот, Mini App, інтеграція з календарями.
3. **Тестування** — 3–5 днів — спільне тестування з вашою командою.
4. **Запуск і навчання** — 1–2 дні — розгортання на сервері, навчання адміністраторів.

### 7. Підтримка — 3 tier cards
Grid: 3 columns desktop, 1 column mobile. «Стандарт» card highlighted as recommended.

**Базовий — €40/міс**
- Сервер, домен, SSL, моніторинг 24/7
- Виправлення критичних помилок
- Щоденні резервні копії
- Відповідь протягом 72 годин
- *Нові функції — €40/год*

**Стандарт — €75/міс** ⭐ *рекомендовано*
- Усе з «Базового»
- До **2 годин дрібних змін** на місяць
- Виправлення некритичних помилок
- Оновлення залежностей та безпекові патчі
- Відповідь протягом **48 годин**
- *Години не накопичуються*

**Преміум — €120/міс**
- Усе зі «Стандарту»
- До **5 годин змін** на місяць
- Пріоритетна відповідь — **24 години**
- Щомісячний звіт
- Прямий контакт у Telegram

### 8. Умови оплати
Single centered block, no decoration. Bullet list:

- **50%** — авансом після підписання договору.
- **50%** — після здачі та запуску проєкту.
- Підтримка оплачується щомісячно, починаючи з місяця після запуску.
- Можлива оплата в євро або гривнях за курсом НБУ на день оплати.

### 9. Контакти / Final CTA
- **Large primary button:** «Забронювати безкоштовну консультацію» → `https://calendar.app.google/r1cfQvmWEtc9yGCa9`
- Below: «Або напишіть у Telegram: **@swefd**» → `https://t.me/swefd`
- Subtle footer line: «© 2026 · Розробка під ключ»

## Styling

### Color palette
- `--bg`: `#FFFFFF`
- `--text-primary`: `#1A1A1A`
- `--text-secondary`: `#5A6A7A`
- `--accent`: `#0088CC` (Telegram blue)
- `--accent-hover`: `#006FA8`
- `--card-bg`: `#F5F8FB`
- `--border`: `#E1E8EE`
- `--highlight`: `#FFB800` (recommended badge)

### Typography
- `font-family`: `-apple-system, BlinkMacSystemFont, "Inter", "Segoe UI", "Roboto", sans-serif`
- Hero H1: `clamp(2.5rem, 5vw, 4.5rem)`, weight 800, tight tracking
- Section H2: `clamp(1.8rem, 3vw, 2.5rem)`, weight 700
- Body: `1.0625rem` (17px), line-height 1.65
- All text supports Cyrillic by default (system fonts handle it)

### Layout
- Container max-width: `1100px`, centered, `padding: 0 1.5rem`
- Section vertical spacing: `5–7rem` top/bottom on desktop, `3–4rem` on mobile
- Cards: `border-radius: 16px`, `padding: 2rem`, subtle shadow that grows on hover
- Buttons: `border-radius: 12px`, `padding: 1rem 2rem`, primary is filled accent, secondary is outlined

### Mobile breakpoint
- Single breakpoint at `768px`
- Below: all multi-column grids → 1 column, hero font sizes shrink, padding reduces

### Animations
- Intersection-observer-based fade-up on scroll for section content (≤30 lines of JS).
- Hover lift on cards: `transform: translateY(-4px)`, shadow grow, 200ms transition.
- Page works fully without JS (animations just no-op).

## File structure
- `offer/index.html` — single self-contained file (inline CSS, inline minimal JS, inline SVG icons).
- No external dependencies, no fonts loaded over network, no images.

## Out of scope (explicitly)
- Multi-language toggle.
- CMS or dynamic content.
- Backend / form submission.
- Analytics / tracking.
- Open Graph / social-share meta tags (can add later if needed).
- A/B variants.
- Print stylesheet.

## Success criteria
- `offer/index.html` opens correctly with `open offer/index.html` and renders in Chrome, Safari, Firefox.
- All sections from this spec are present with the agreed Ukrainian copy.
- All prices and timelines match this spec exactly (€2,000 / €2,500 / €40 / €75 / €120 / 3–4 weeks / 4–5 weeks).
- Both contact links work: `https://t.me/swefd` and `https://calendar.app.google/r1cfQvmWEtc9yGCa9`.
- Page is readable and well-laid-out on a 375px-wide mobile viewport.
- No console errors when opened.
