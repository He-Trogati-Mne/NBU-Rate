/* ============================================================
   Прапори країн як inline SVG (data URI).
   ============================================================ */

const FLAG_SVG = {
  USD: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 60 40"><rect width="60" height="40" fill="#fff"/><g fill="#B22234"><rect width="60" height="3.08" y="0"/><rect width="60" height="3.08" y="6.15"/><rect width="60" height="3.08" y="12.31"/><rect width="60" height="3.08" y="18.46"/><rect width="60" height="3.08" y="24.62"/><rect width="60" height="3.08" y="30.77"/><rect width="60" height="3.08" y="36.92"/></g><rect width="24" height="21.54" fill="#3C3B6E"/><g fill="#fff"><circle cx="3" cy="3" r="1"/><circle cx="9" cy="3" r="1"/><circle cx="15" cy="3" r="1"/><circle cx="21" cy="3" r="1"/><circle cx="6" cy="6" r="1"/><circle cx="12" cy="6" r="1"/><circle cx="18" cy="6" r="1"/><circle cx="3" cy="9" r="1"/><circle cx="9" cy="9" r="1"/><circle cx="15" cy="9" r="1"/><circle cx="21" cy="9" r="1"/><circle cx="6" cy="12" r="1"/><circle cx="12" cy="12" r="1"/><circle cx="18" cy="12" r="1"/><circle cx="3" cy="15" r="1"/><circle cx="9" cy="15" r="1"/><circle cx="15" cy="15" r="1"/><circle cx="21" cy="15" r="1"/><circle cx="6" cy="18" r="1"/><circle cx="12" cy="18" r="1"/><circle cx="18" cy="18" r="1"/></g></svg>`,

  EUR: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 60 40"><rect width="60" height="40" fill="#003399"/><g fill="#FFCC00"><circle cx="30" cy="8" r="2.2"/><circle cx="41" cy="11" r="2.2"/><circle cx="48" cy="20" r="2.2"/><circle cx="41" cy="29" r="2.2"/><circle cx="30" cy="32" r="2.2"/><circle cx="19" cy="29" r="2.2"/><circle cx="12" cy="20" r="2.2"/><circle cx="19" cy="11" r="2.2"/></g></svg>`,

  GBP: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 60 40"><rect width="60" height="40" fill="#012169"/><path d="M0,0 L60,40 M60,0 L0,40" stroke="#fff" stroke-width="8"/><path d="M0,0 L60,40 M60,0 L0,40" stroke="#C8102E" stroke-width="4"/><path d="M30,0 V40 M0,20 H60" stroke="#fff" stroke-width="13"/><path d="M30,0 V40 M0,20 H60" stroke="#C8102E" stroke-width="8"/></svg>`,

  PLN: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 60 40"><rect width="60" height="20" fill="#fff"/><rect width="60" height="20" y="20" fill="#DC143C"/></svg>`,

  CNY: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 60 40"><rect width="60" height="40" fill="#DE2910"/><polygon points="10,5 12,11 18,11 13,15 15,21 10,17 5,21 7,15 2,11 8,11" fill="#FFDE00"/><circle cx="21" cy="6" r="1.8" fill="#FFDE00"/><circle cx="24" cy="11" r="1.8" fill="#FFDE00"/><circle cx="24" cy="16" r="1.8" fill="#FFDE00"/><circle cx="21" cy="21" r="1.8" fill="#FFDE00"/></svg>`,

  CHF: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 60 40"><rect width="60" height="40" fill="#DA291C"/><rect x="26" y="8" width="8" height="24" fill="#fff"/><rect x="18" y="16" width="24" height="8" fill="#fff"/></svg>`,

  JPY: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 60 40"><rect width="60" height="40" fill="#fff"/><circle cx="30" cy="20" r="11" fill="#BC002D"/></svg>`,

  CAD: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 60 40"><rect width="60" height="40" fill="#fff"/><rect width="15" height="40" fill="#D80621"/><rect x="45" width="15" height="40" fill="#D80621"/><path d="M30,6 L31,10 L34,9 L33,12 L36,12 L34,14 L37,18 L32,17 L32,22 L28,22 L28,17 L23,18 L26,14 L24,12 L27,12 L26,9 L29,10 Z" fill="#D80621"/></svg>`,

  AUD: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 60 40"><rect width="60" height="40" fill="#00008B"/><rect width="30" height="20" fill="#012169"/><path d="M0,0 L30,20 M30,0 L0,20" stroke="#fff" stroke-width="4"/><path d="M0,0 L30,20 M30,0 L0,20" stroke="#C8102E" stroke-width="2"/><path d="M15,0 V20 M0,10 H30" stroke="#fff" stroke-width="6.7"/><path d="M15,0 V20 M0,10 H30" stroke="#C8102E" stroke-width="4"/><circle cx="45" cy="20" r="3" fill="#fff"/><circle cx="45" cy="9" r="1.5" fill="#fff"/><circle cx="53" cy="13" r="1.5" fill="#fff"/><circle cx="53" cy="27" r="1.5" fill="#fff"/><circle cx="45" cy="31" r="1.5" fill="#fff"/><circle cx="37" cy="27" r="1.5" fill="#fff"/></svg>`,

  TRY: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 60 40"><rect width="60" height="40" fill="#E30A17"/><circle cx="22" cy="20" r="10" fill="#fff"/><circle cx="26" cy="20" r="8" fill="#E30A17"/><polygon points="40,16 40.94,18.71 43.8,18.76 41.52,20.49 42.35,23.24 40,21.6 37.65,23.24 38.48,20.49 36.2,18.76 39.06,18.71" fill="#fff"/></svg>`
};

function flagHtml(cc, width = 30) {
  const svg = FLAG_SVG[cc];
  if (!svg) return '';
  const height = Math.round(width * 2 / 3);
  const uri = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svg);
  return `<img class="flag" src="${uri}"
               width="${width}" height="${height}"
               alt="${cc}" draggable="false" />`;
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
  return '#' + [r, g, b]
    .map(v => Math.max(0, Math.min(255, Math.round(v))).toString(16).padStart(2, '0'))
    .join('');
}

function mixHex(a, b, t) {
  const A = hexToRgb(a), B = hexToRgb(b);
  if (!A || !B) return a;
  return rgbToHex({
    r: A.r + (B.r - A.r) * t,
    g: A.g + (B.g - A.g) * t,
    b: A.b + (B.b - A.b) * t
  });
}

function luminance(hex) {
  const c = hexToRgb(hex);
  if (!c) return 0.5;
  return (0.299 * c.r + 0.587 * c.g + 0.114 * c.b) / 255;
}

/* ===== Словники ===== */

const TRANSLATIONS = {
  uk: {
    popup_title: 'Курс НБУ до гривні',
    settings_tooltip: 'Налаштування',
    loading: 'Завантаження...',
    error_network: 'Помилка мережі',
    error_no_data: 'Немає даних за вибраними валютами.',
    error_loading: 'Помилка завантаження',
    updated_on: 'Офіційний курс НБУ на',

    options_title: '⚙ Налаштування',
    section_theme: 'Тема оформлення',
    theme_light: 'Світла',
    theme_dark: 'Темна',
    theme_system: 'Системна',
    theme_custom: 'Власна',

    section_custom_colors: 'Власні кольори',
    color_bg: 'Фон',
    color_text: 'Текст',
    color_accent: 'Акцент',
    color_reset: 'Скинути',
    color_preset_label: 'Швидкі пресети:',

    section_language: 'Мова',
    lang_uk: 'Українська',
    lang_en: 'English',
    section_currencies: 'Валюти',
    saved: '✓ Збережено',

    USD: 'Долар США',
    EUR: 'Євро',
    GBP: 'Фунт стерлінгів',
    PLN: 'Польський злотий',
    CNY: 'Китайський юань',
    CHF: 'Швейцарський франк',
    JPY: 'Японська єна',
    CAD: 'Канадський долар',
    AUD: 'Австралійський долар',
    TRY: 'Турецька ліра'
  },

  en: {
    popup_title: 'NBU Rate to Hryvnia',
    settings_tooltip: 'Settings',
    loading: 'Loading...',
    error_network: 'Network error',
    error_no_data: 'No data for selected currencies.',
    error_loading: 'Loading error',
    updated_on: 'Official NBU rate on',

    options_title: '⚙ Settings',
    section_theme: 'Theme',
    theme_light: 'Light',
    theme_dark: 'Dark',
    theme_system: 'System',
    theme_custom: 'Custom',

    section_custom_colors: 'Custom colors',
    color_bg: 'Background',
    color_text: 'Text',
    color_accent: 'Accent',
    color_reset: 'Reset',
    color_preset_label: 'Presets:',

    section_language: 'Language',
    lang_uk: 'Українська',
    lang_en: 'English',
    section_currencies: 'Currencies',
    saved: '✓ Saved',

    USD: 'US Dollar',
    EUR: 'Euro',
    GBP: 'British Pound',
    PLN: 'Polish Zloty',
    CNY: 'Chinese Yuan',
    CHF: 'Swiss Franc',
    JPY: 'Japanese Yen',
    CAD: 'Canadian Dollar',
    AUD: 'Australian Dollar',
    TRY: 'Turkish Lira'
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

/* ===== Застосування теми =====
   customColors зберігаються в chrome.storage.local (без ліміту на записи). */

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