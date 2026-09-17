/* ============================================================
   Прапори країн — PNG з папки flags/
   ============================================================ */

const FLAG_CODES = {
  USD: 'us', EUR: 'eu', GBP: 'gb', PLN: 'pl', CNY: 'cn',
  CHF: 'ch', JPY: 'jp', CAD: 'ca', AUD: 'au', TRY: 'tr'
};

function flagHtml(cc, width = 48) {
  const code = FLAG_CODES[cc];
  if (!code) return '';
  const height = Math.round(width * 2 / 3);
  return `<img class="flag" src="flags/${code}.png" width="${width}" height="${height}" alt="${cc}" draggable="false" />`;
}

/* ===== Налаштування доступності ===== */

const A11Y_DEFAULTS = {
  cvd: false,          // режим для дальтоніків
  palette: 'universal',// 'universal' | 'red-green' | 'blue-yellow' | 'mono'
  font: false,         // великий шрифт
  symbols: true,       // символи ▲▼● + текст (за замовчуванням увімкнено)
  underline: false     // підкреслювати зміну курсу
};

async function getA11y() {
  try {
    const stored = await chrome.storage.sync.get('a11y');
    return { ...A11Y_DEFAULTS, ...(stored.a11y || {}) };
  } catch (e) {
    return { ...A11Y_DEFAULTS };
  }
}

async function applyA11y(a11y) {
  const root = document.documentElement;
  const a = { ...A11Y_DEFAULTS, ...a11y };
  root.setAttribute('data-a11y-cvd',       a.cvd ? 'true' : 'false');
  root.setAttribute('data-a11y-palette',   a.palette);
  root.setAttribute('data-a11y-font',      a.font ? 'true' : 'false');
  root.setAttribute('data-a11y-symbols',   a.symbols ? 'true' : 'false');
  root.setAttribute('data-a11y-underline', a.underline ? 'true' : 'false');
}

/* ===== Індикатор зміни курсу ===== */

function changeBadge(direction, delta) {
  const map = {
    up:   { arrow: '↑', label: 'Зростання', symbol: '▲' },
    down: { arrow: '↓', label: 'Падіння',   symbol: '▼' },
    flat: { arrow: '→', label: 'Без змін',  symbol: '●' }
  };
  const m = map[direction] || map.flat;
  const deltaStr = delta != null ? `${delta > 0 ? '+' : ''}${delta.toFixed(2)}` : '';
  return `<span class="rate-change ${direction}" aria-label="${m.label} ${deltaStr}">
    <span class="change-symbol" aria-hidden="true">${m.symbol}</span>
    <span class="change-arrow" aria-hidden="true">${m.arrow}</span>
    <span class="change-value">${deltaStr}</span>
    <span class="change-label">${m.label}</span>
  </span>`;
}

/* ===== Утиліти для кольорів ===== */

function hexToRgb(hex) {
  if (!hex) return null;
  hex = String(hex).replace('#', '').trim();
  if (hex.length === 3) hex = hex.split('').map(c => c + c).join('');
  if (hex.length !== 6 || !/^[0-9a-f]{6}$/i.test(hex)) return null;
  const num = parseInt(hex, 16);
  return { r: (num >> 16) & 255, g: (num >> 8) & 255, b: num & 255 };
}

function rgbToHex({ r, g, b }) {
  return '#' + [r, g, b].map(v => Math.max(0, Math.min(255, Math.round(v))).toString(16).padStart(2, '0')).join('');
}

function mixHex(a, b, t) {
  const A = hexToRgb(a), B = hexToRgb(b);
  if (!A || !B) return a;
  return rgbToHex({ r: A.r + (B.r - A.r) * t, g: A.g + (B.g - A.g) * t, b: A.b + (B.b - A.b) * t });
}

function luminance(hex) {
  const c = hexToRgb(hex);
  if (!c) return 0.5;
  return (0.299 * c.r + 0.587 * c.g + 0.114 * c.b) / 255;
}

/* ===== Словники ===== */

const TRANSLATIONS = {
  uk: {
    options_title: 'Налаштування', options_subtitle: 'Налаштуйте розширення під себе',
    footer_made_with: 'Курс НБУ', popup_title: 'Курс НБУ до гривні',
    settings_tooltip: 'Налаштування', loading: 'Завантаження...',
    error_network: 'Помилка мережі', error_no_data: 'Немає даних за вибраними валютами.',
    error_loading: 'Помилка завантаження', updated_on: 'Офіційний курс НБУ на',
    section_theme: 'Тема оформлення', theme_light: 'Світла', theme_dark: 'Темна',
    theme_system: 'Системна', theme_custom: 'Власна',
    section_custom_colors: 'Власні кольори', color_bg: 'Фон', color_text: 'Текст',
    color_accent: 'Акцент', color_reset: 'Скинути', color_preset_label: 'Швидкі пресети:',

    section_accessibility: 'Доступність',
    a11y_cvd: 'Режим для дальтоніків',
    a11y_cvd_desc: 'Замінює кольори та додає символи до курсів',
    a11y_palette: 'Палітра кольорів',
    a11y_palette_universal: 'Універсальна',
    a11y_palette_universal_desc: 'Okabe-Ito — для всіх типів дальтонізму',
    a11y_palette_redgreen: 'Для червоно-зеленого',
    a11y_palette_redgreen_desc: 'Протанопія, дейтеранопія — найпоширеніші',
    a11y_palette_blueyellow: 'Для синьо-жовтого',
    a11y_palette_blueyellow_desc: 'Трітанопія — рожеве/бірюзове',
    a11y_palette_mono: 'Чорно-біла',
    a11y_palette_mono_desc: 'Ахроматопсія — тільки форма і текст',
    a11y_font: 'Великий шрифт',
    a11y_font_desc: 'Збільшує розмір тексту на 15%',
    a11y_symbols: 'Символи замість кольору',
    a11y_symbols_desc: 'Додає ▲▼● та текстові мітки до курсів',
    a11y_underline: 'Підкреслювати зміну курсу',
    a11y_underline_desc: 'Стрілки ↑↓→ підкреслені — видно без кольору',

    section_language: 'Мова', lang_uk: 'Українська', lang_en: 'English',
    section_currencies: 'Валюти', saved: 'Збережено',
    USD: 'Долар США', EUR: 'Євро', GBP: 'Фунт стерлінгів', PLN: 'Польський злотий',
    CNY: 'Китайський юань', CHF: 'Швейцарський франк', JPY: 'Японська єна',
    CAD: 'Канадський долар', AUD: 'Австралійський долар', TRY: 'Турецька ліра'
  },
  en: {
    options_title: 'Settings', options_subtitle: 'Customize the extension your way',
    footer_made_with: 'NBU Rate', popup_title: 'NBU Rate to Hryvnia',
    settings_tooltip: 'Settings', loading: 'Loading...',
    error_network: 'Network error', error_no_data: 'No data for selected currencies.',
    error_loading: 'Loading error', updated_on: 'Official NBU rate on',
    section_theme: 'Theme', theme_light: 'Light', theme_dark: 'Dark',
    theme_system: 'System', theme_custom: 'Custom',
    section_custom_colors: 'Custom colors', color_bg: 'Background', color_text: 'Text',
    color_accent: 'Accent', color_reset: 'Reset', color_preset_label: 'Presets:',

    section_accessibility: 'Accessibility',
    a11y_cvd: 'Colorblind mode',
    a11y_cvd_desc: 'Replaces colors and adds symbols to rates',
    a11y_palette: 'Color palette',
    a11y_palette_universal: 'Universal',
    a11y_palette_universal_desc: 'Okabe-Ito — for all types of color blindness',
    a11y_palette_redgreen: 'For red-green',
    a11y_palette_redgreen_desc: 'Protanopia, deuteranopia — most common',
    a11y_palette_blueyellow: 'For blue-yellow',
    a11y_palette_blueyellow_desc: 'Tritanopia — pink/teal',
    a11y_palette_mono: 'Black and white',
    a11y_palette_mono_desc: 'Achromatopsia — form and text only',
    a11y_font: 'Large font',
    a11y_font_desc: 'Increases text size by 15%',
    a11y_symbols: 'Symbols instead of color',
    a11y_symbols_desc: 'Adds ▲▼● and text labels to rates',
    a11y_underline: 'Underline rate changes',
    a11y_underline_desc: '↑↓→ arrows underlined — visible without color',

    section_language: 'Language', lang_uk: 'Українська', lang_en: 'English',
    section_currencies: 'Currencies', saved: 'Saved',
    USD: 'US Dollar', EUR: 'Euro', GBP: 'British Pound', PLN: 'Polish Zloty',
    CNY: 'Chinese Yuan', CHF: 'Swiss Franc', JPY: 'Japanese Yen',
    CAD: 'Canadian Dollar', AUD: 'Australian Dollar', TRY: 'Turkish Lira'
  }
};

/* ===== Допоміжні функції ===== */

async function getLanguage() {
  const { language = 'uk' } = await chrome.storage.sync.get('language');
  return language;
}

function t(key, lang) {
  const dict = TRANSLATIONS[lang] || TRANSLATIONS.uk;
  return dict[key] || key;
}

function applyTranslations(lang, root = document) {
  root.querySelectorAll('[data-i18n]').forEach(el => {
    const key = el.getAttribute('data-i18n');
    el.textContent = t(key, lang);
  });
  root.querySelectorAll('[data-i18n-title]').forEach(el => {
    const key = el.getAttribute('data-i18n-title');
    el.setAttribute('title', t(key, lang));
  });
  document.documentElement.setAttribute('lang', lang);
}

/* ===== Застосування теми ===== */

async function applyThemeValue(theme) {
  const root = document.documentElement;

  ['--bg', '--bg-elev', '--text', '--text-muted', '--text-faint',
   '--accent', '--border', '--hover'].forEach(v => root.style.removeProperty(v));

  if (theme === 'custom') {
    let customColors = {};
    try {
      const stored = await chrome.storage.local.get('customColors');
      customColors = stored.customColors || {};
    } catch (e) {
      console.warn('[Курс НБУ] Не вдалось прочитати customColors:', e);
    }
    applyCustomColors(customColors);
    return;
  }

  const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
  const effective = theme === 'system' ? (prefersDark ? 'dark' : 'light') : theme;
  root.setAttribute('data-theme', effective);
}

function applyCustomColors(colors) {
  const root = document.documentElement;
  const bg = hexToRgb(colors.bg) ? colors.bg : '#1a1a1a';
  const text = hexToRgb(colors.text) ? colors.text : '#e8eaed';
  const accent = hexToRgb(colors.accent) ? colors.accent : '#8ab4f8';

  const isDark = luminance(bg) < 0.5;
  const elev   = isDark ? mixHex(bg, '#ffffff', 0.07) : mixHex(bg, '#000000', 0.04);
  const border = isDark ? mixHex(bg, '#ffffff', 0.18) : mixHex(bg, '#000000', 0.14);
  const hover  = isDark ? mixHex(bg, '#ffffff', 0.12) : mixHex(bg, '#000000', 0.06);
  const muted  = mixHex(text, bg, 0.45);
  const faint  = mixHex(text, bg, 0.6);

  root.setAttribute('data-theme', isDark ? 'dark' : 'light');
  root.style.setProperty('--bg', bg);
  root.style.setProperty('--bg-elev', elev);
  root.style.setProperty('--text', text);
  root.style.setProperty('--text-muted', muted);
  root.style.setProperty('--text-faint', faint);
  root.style.setProperty('--accent', accent);
  root.style.setProperty('--border', border);
  root.style.setProperty('--hover', hover);
}