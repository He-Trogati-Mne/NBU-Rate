<div align="center">

<img src="nbu-rate-extension/icon128.png" alt="Курс НБУ" width="96" height="96" />

# Курс НБУ

Офіційний курс валют Національного банку України — завжди під рукою.

<br>

[![Firefox](https://img.shields.io/badge/Firefox-FF7139?style=for-the-badge&logo=firefox-browser&logoColor=white)](https://addons.mozilla.org/ru/firefox/addon/nbu-rate/)
[![Edge](https://img.shields.io/badge/Edge-0078D7?style=for-the-badge&logo=microsoftedge&logoColor=white)](https://microsoftedge.microsoft.com/addons/detail/nbu-rate/hjndboldkmconodmenmccdekhmnnlhbp)
[![Chrome](https://img.shields.io/badge/Chrome-4285F4?style=for-the-badge&logo=googlechrome&logoColor=white)](#)

<br>

[![Manifest V3](https://img.shields.io/badge/Manifest_V3-1a73e8?style=flat-square)](#)
[![License](https://img.shields.io/badge/License-GPL_v3-1a73e8?style=flat-square)](https://www.gnu.org/licenses/gpl-3.0)
[![Vanilla JS](https://img.shields.io/badge/Vanilla_JS-1a73e8?style=flat-square)](#)
[![Privacy](https://img.shields.io/badge/Privacy-No_tracking-1a73e8?style=flat-square)](#)

<br>

[![Views](https://komarev.com/ghpvc/?username=He-Trogati-Mne&repo=NBU-Rate&label=Views&color=1a73e8&style=flat-square)](https://github.com/He-Trogati-Mne/NBU-Rate)
[![Stars](https://img.shields.io/github/stars/He-Trogati-Mne/NBU-Rate?style=flat-square&label=Stars&color=1a73e8&labelColor=555)](https://github.com/He-Trogati-Mne/NBU-Rate/stargazers)
[![Forks](https://img.shields.io/github/forks/He-Trogati-Mne/NBU-Rate?style=flat-square&label=Forks&color=1a73e8&labelColor=555)](https://github.com/He-Trogati-Mne/NBU-Rate/network/members)

</div>

---

## Можливості

**Валюти.** 24 валюти з офіційного API НБУ — USD, EUR, GBP, PLN, CNY, CHF, JPY, CAD, AUD, TRY, SEK, NOK, DKK, CZK, HUF, RON, BGN, ILS, KRW, SGD, HKD, NZD, MXN, INR, XAU. Прапори країн, вибір валют — показуй лише те, що потрібно.

**Оформлення.** 4 теми — Світла, Темна, Системна, Власна. Власна тема з HEX-піпеткою. 6 готових пресетів: Midnight, Nord, Dracula, Sepia, Forest, Rose. Дві мови — Українська та English.

**Швидкість.** Миттєве відкриття завдяки кешуванню. Оновлення раз на годину у фоні. Значок на іконці з поточним курсом USD. Стійкість до збоїв.

**Приватність.** Жодної аналітики, трекінгу чи реклами. Єдиний зовнішній запит — до API НБУ.

**Доступність.** Режим для дальтоніків з 4 палітрами (Okabe-Ito, для червоно-зеленого, синьо-жовтого, чорно-біла). Символи замість кольору. Великий шрифт.

---

## Встановлення

**Firefox** · [addons.mozilla.org/nbu-rate](https://addons.mozilla.org/ru/firefox/addon/nbu-rate/)

**Edge** · [microsoftedge.microsoft.com/nbu-rate](https://microsoftedge.microsoft.com/addons/detail/nbu-rate/hjndboldkmconodmenmccdekhmnnlhbp)

**Chrome** · Скоро в Chrome Web Store

<details>
<summary>Встановлення вручну</summary>

<br>

1. Скачайте [останній реліз](https://github.com/He-Trogati-Mne/NBU-Rate/releases)
2. Відкрийте `chrome://extensions/` або `edge://extensions/`
3. Увімкніть **Режим розробника**
4. Натисніть **Завантажити розпаковане розширення**
5. Виберіть папку з розширенням

</details>

---

## Скріншоти

| Світла | Налаштування | Темна |
|:---:|:---:|:---:|
| ![Світла](screenshots/popup-light.png) | ![Налаштування](screenshots/options.png) | ![Темна](screenshots/custom-theme.png) |

| Власна | Аналітика | Доступність |
|:---:|:---:|:---:|
| ![Власна](screenshots/popup-dark.png) | ![Аналітика](screenshots/analytics.png) | ![Доступність](screenshots/accessibility.png) |

---

## Використання

**Перегляд курсів.** Клікніть на іконку розширення на панелі браузера — відкриється вікно з курсами обраних валют.

**Налаштування.** Шестерня у правому верхньому куті вікна розширення. Там можна змінити тему, кольори, мову, набір валют та параметри доступності.

**Значок на іконці.** Показує поточний курс USD. Колір змінюється залежно від курсу: менше 30 ₴ — зелений, 30–45 ₴ — синій, 45–60 ₴ — жовтий, більше 60 ₴ — червоний.

---

## Структура

```
NBU-Rate/
├── manifest.firefox.json       Маніфест для Firefox
├── manifest.chrome.json        Маніфест для Chrome
├── manifest.edge.json          Маніфест для Edge
├── popup.html / popup.js       Вікно з курсами
├── options.html / options.js   Сторінка налаштувань
├── background.js               Фоновий service worker
├── i18n.js                     Словники та утиліти
├── theme.css                   Глобальні стилі
├── index.html                  Сайт + аналітика
├── chart.umd.min.js            Chart.js
├── flags/                      PNG-прапори
├── favicon/                    Іконки сайту
├── screenshots/                Скріншоти
├── LICENSE                     GPL-3.0
└── README.md
```

---

## Технології

**Manifest V3** — сучасний стандарт браузерних розширень

**Service Worker** — замість застарілого background page

**Vanilla JS** — без фреймворків, бандлерів та збірників

**CSS-змінні** — для динамічної теми

**chrome.storage.sync** — синхронізація налаштувань між пристроями

**PNG-прапори** — локальні зображення без зовнішніх запитів

**Chart.js** — графіки історії курсів на сайті

**Okabe-Ito** — науково обґрунтована палітра для дальтоніків

---

## Дозволи

| Дозвіл | Навіщо |
|---|---|
| `storage` | Зберігає тему, мову, вибір валют |
| `alarms` | Оновлює курси раз на годину |
| `https://bank.gov.ua/*` | Отримання курсів з API НБУ |

Розширення не збирає жодних персональних даних. Єдиний зовнішній запит — до офіційного API НБУ.

---

## Приватність

Розширення не збирає жодних персональних даних:

- Жодної аналітики
- Жодного трекінгу
- Жодної реклами
- Жодних сторонніх запитів

Усі налаштування зберігаються локально в браузері через `chrome.storage.sync` та синхронізуються між пристроями під акаунтом користувача.

**Єдиний зовнішній запит** — до офіційного API Національного банку України:

```
https://bank.gov.ua/NBUStatService/v1/statdirectory/exchange?json
```

Детальніше — на [сторінці політики конфіденційності](https://he-trogati-mne.github.io/NBU-Rate/#privacy).

---

## Roadmap

**Готово**

- [x] Базовий показ курсів НБУ
- [x] Темна, світла, системна тема
- [x] Власна тема з HEX-піпеткою
- [x] Українська та англійська мови
- [x] Прапори країн (PNG)
- [x] Значок на іконці з курсом USD
- [x] Режим для дальтоніків (4 палітри)
- [x] Символи та великий шрифт
- [x] Аналітика курсу з графіками
- [x] Публікація в Firefox Add-ons
- [x] Публікація в Edge Add-ons

**У планах**

- [ ] Публікація в Chrome Web Store
- [ ] Публікація в Opera Add-ons
- [ ] Сповіщення при різкій зміні курсу
- [ ] Експорт та імпорт налаштувань у JSON
- [ ] Підтримка Firefox для Android
- [ ] Нові мови інтерфейсу

---

## Як долучитися

1. Форкніть репозиторій
2. Створіть гілку: `git checkout -b feature/amazing-feature`
3. Закомітьте: `git commit -m 'Add: amazing feature'`
4. Запуште: `git push origin feature/amazing-feature`
5. Відкрийте Pull Request

Знайшли баг — [створіть Issue](https://github.com/He-Trogati-Mne/NBU-Rate/issues).

---

## Ліцензія

Проєкт розповсюджується під **GNU General Public License v3.0**.

Повний текст — у файлі [LICENSE](LICENSE).

Якщо використовуєте цей код у своєму проєкті — ваш проєкт теж має бути відкритим під GPL-3.0.

---

<div align="center">

**Це неофіційне розширення.** Не пов'язане з Національним банком України.

Дані надаються публічним API НБУ.

<br>

**Зроблено в Україні**

<img src="https://flagcdn.com/w80/ua.png" alt="Ukraine" width="48" />

</div>
