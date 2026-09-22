/* ============================================================
   Прапори
   ============================================================ */

const FLAG_CODES = {
  USD:'us', EUR:'eu', GBP:'gb', PLN:'pl', CNY:'cn', CHF:'ch', JPY:'jp',
  CAD:'ca', AUD:'au', TRY:'tr', SEK:'se', NOK:'no', DKK:'dk', CZK:'cz',
  HUF:'hu', RON:'ro', ILS:'il', KRW:'kr', SGD:'sg', HKD:'hk', NZD:'nz',
  MXN:'mx', INR:'in',
  TND:'tn', EGP:'eg', DZD:'dz', AED:'ae', SAR:'sa',
  AZN:'az', GEL:'ge', KZT:'kz', MYR:'my', THB:'th',
  MDL:'md', ZAR:'za', RSD:'rs'
};

const METAL_COLORS = {
  XAU: '#D4AF37',
  XAG: '#A8A8A8',
  XPT: '#D8D8DC',
  XPD: '#B8BCC8',
  XDR: '#7C83B8'
};
const METAL_ICON = 'svg/XAU-XAG-XPT-XPD.svg';

function flagHtml(cc, width = 62) {
  const height = Math.round(width * 2 / 3);

  if (cc in METAL_COLORS) {
    return `<span class="flag-metal-wrap" style="
        width:${width}px;
        height:${height}px;
        background:${METAL_COLORS[cc]};
      ">
        <img class="flag-metal-icon"
             src="${METAL_ICON}"
             alt="${cc}" draggable="false">
      </span>`;
  }

  const code = FLAG_CODES[cc];
  if (!code) {
    return `<span class="flag-empty" style="width:${width}px;height:${height}px"></span>`;
  }

  return `<img class="flag" src="flags/${code}.png"
               width="${width}" height="${height}"
               alt="${cc}" draggable="false">`;
}

function attachImgFallbacks(root = document) {
  if (!root || !root.querySelectorAll) return;
  root.querySelectorAll('img.flag, img.flag-metal-icon, img.footer-icon').forEach(img => {
    if (img.dataset.fallbackBound) return;
    img.dataset.fallbackBound = '1';
    img.addEventListener('error', () => {
      if (img.classList.contains('footer-icon')) {
        img.style.display = 'none';
      } else {
        img.style.visibility = 'hidden';
      }
    });
  });
}

/* ===== Доступність ===== */

const A11Y_DEFAULTS = {
  cvd: false, palette: 'universal', font: false,
  symbols: true, underline: false
};

async function getA11y() {
  try {
    const stored = await chrome.storage.sync.get('a11y');
    return { ...A11Y_DEFAULTS, ...(stored.a11y || {}) };
  } catch (e) { return { ...A11Y_DEFAULTS }; }
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

/* ===== Бейдж зміни курсу ===== */

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

/* ===== Кольори ===== */

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
  const c = hexToRgb(hex); if (!c) return 0.5;
  return (0.299 * c.r + 0.587 * c.g + 0.114 * c.b) / 255;
}

/* ===== Словники ===== */

const TRANSLATIONS = {
  uk: {
    options_title: 'Налаштування', options_subtitle: 'Налаштуйте розширення під себе',
    footer_made_with: 'Курс НБУ', footer_website: 'Сайт',
    popup_title: 'Курс НБУ до гривні',
    settings_tooltip: 'Налаштування', website_tooltip: 'Сайт',
    loading: 'Завантаження...',
    error_network: 'Помилка мережі', error_no_data: 'Немає даних за вибраними валютами.',
    error_loading: 'Помилка завантаження',
    error_mono_empty: 'МоноБанк не повернув курсів USD/EUR. Спробуйте НБУ або ПриватБанк.',
    updated_on: 'Офіційний курс на',
    updated_on_nbu:    'Офіційний курс НБУ на',
    updated_on_privat: 'Курс ПриватБанку на',
    updated_on_mono:   'Курс МоноБанку на',
    next_update_in: 'Наступне оновлення через',
    last_fetch: 'Остання перевірка',
    last_fetch_never: 'Ще не оновлювалось',
    soon: 'за мить',
    hour_short: 'год',
    min_short: 'хв',
    sec_short: 'с',
    section_theme: 'Тема оформлення', theme_light: 'Світла', theme_dark: 'Темна',
    theme_system: 'Системна', theme_custom: 'Власна',
    section_custom_colors: 'Власні кольори', color_bg: 'Фон', color_text: 'Текст',
    color_accent: 'Акцент', color_reset: 'Скинути', color_preset_label: 'Швидкі пресети:',
    section_source: 'Джерело курсу',
    source_nbu: 'НБУ', source_privat: 'ПриватБанк', source_mono: 'МоноБанк',
    source_hint: 'НБУ — офіційний курс без купівлі/продажу. ПриватБанк і МоноБанк показують купівлю та продаж.',
    buy_label: 'Купівля', sell_label: 'Продаж', rate_label: 'Курс',
    section_accessibility: 'Доступність',
    a11y_cvd: 'Режим для дальтоніків',
    a11y_cvd_desc: 'Замінює кольори та додає символи до курсів',
    a11y_palette_universal: 'Універсальна',
    a11y_palette_universal_desc: 'Okabe-Ito — для всіх типів дальтонізму',
    a11y_palette_redgreen: 'Для червоно-зеленого',
    a11y_palette_redgreen_desc: 'Протанопія, дейтеранопія — найпоширеніші',
    a11y_palette_blueyellow: 'Для синьо-жовтого',
    a11y_palette_blueyellow_desc: 'Трітанопія — рожеве/бірюзове',
    a11y_palette_mono: 'Чорно-біла',
    a11y_palette_mono_desc: 'Ахроматопсія — тільки форма і текст',
    a11y_font: 'Великий шрифт',
    a11y_font_desc: 'Розмір тексту інтерфейсу (100–150%)',
    a11y_symbols: 'Символи замість кольору',
    a11y_symbols_desc: 'Додає ▲▼● та текстові мітки до курсів',
    a11y_underline: 'Підкреслювати зміну курсу',
    a11y_underline_desc: 'Стрілки ↑↓→ підкреслені — видно без кольору',
    version_whats_new: 'Що нового',
    version_subtitle: 'Останні оновлення з GitHub',
    version_loading: 'Завантаження...',
    version_empty: 'Поки що немає релізів',
    version_error: 'Не вдалося завантажити релізи',
    version_all_releases: 'Всі релізи на GitHub',
    version_current: 'Поточна', version_latest: 'Остання',
    section_advanced: 'Додатково',
    precise_rate: 'Точний курс (4 знаки)',
    precise_rate_desc: 'Показувати 44.6743 замість 44.67',
    classic_design: 'Класичний дизайн',
    classic_design_desc: 'Дизайн з версії v2.6 та раніше',
    clear_cache: 'Очистити кеш',
    cache_cleared: 'Кеш очищено',
    section_language: 'Мова', lang_uk: 'Українська', lang_en: 'English',
    section_currencies: 'Валюти', saved: 'Збережено',

    USD:'Долар США', EUR:'Євро', GBP:'Фунт стерлінгів', PLN:'Польський злотий',
    CNY:'Китайський юань', CHF:'Швейцарський франк', JPY:'Японська єна',
    CAD:'Канадський долар', AUD:'Австралійський долар', TRY:'Турецька ліра',
    SEK:'Шведська крона', NOK:'Норвезька крона', DKK:'Данська крона',
    CZK:'Чеська крона', HUF:'Угорський форинт', RON:'Румунський лей',
    ILS:'Ізраїльський шекель', KRW:'Південнокорейська вона', SGD:'Сінгапурський долар',
    HKD:'Гонконгський долар', NZD:'Новозеландський долар', MXN:'Мексиканське песо',
    INR:'Індійська рупія',
    TND:'Туніський динар', EGP:'Єгипетський фунт',
    DZD:'Алжирський динар', AED:'Дирхам ОАЕ',
    SAR:'Саудівський ріял', AZN:'Азербайджанський манат', GEL:'Грузинський ларі',
    KZT:'Казахстанський теньге', MYR:'Малайзійський ринггіт', THB:'Таїландський бат',
    MDL:'Молдовський лей', ZAR:'Південноафриканський ренд',
    RSD:'Сербський динар', XDR:'СПЗ (спеціальні права запозичення)',
    XAU:'Золото (тройська унція)', XAG:'Срібло (тройська унція)',
    XPT:'Платина (тройська унція)', XPD:'Паладій (тройська унція)'
  },
  en: {
    options_title: 'Settings', options_subtitle: 'Customize the extension your way',
    footer_made_with: 'NBU Rate', footer_website: 'Website',
    popup_title: 'NBU Rate to Hryvnia',
    settings_tooltip: 'Settings', website_tooltip: 'Website',
    loading: 'Loading...',
    error_network: 'Network error', error_no_data: 'No data for selected currencies.',
    error_loading: 'Loading error',
    error_mono_empty: 'MonoBank returned no USD/EUR rates. Try NBU or PrivatBank.',
    updated_on: 'Official rate on',
    updated_on_nbu:    'NBU official rate on',
    updated_on_privat: 'PrivatBank rate on',
    updated_on_mono:   'MonoBank rate on',
    next_update_in: 'Next update in',
    last_fetch: 'Last fetch',
    last_fetch_never: 'Not fetched yet',
    soon: 'soon',
    hour_short: 'h',
    min_short: 'min',
    sec_short: 's',
    section_theme: 'Theme', theme_light: 'Light', theme_dark: 'Dark',
    theme_system: 'System', theme_custom: 'Custom',
    section_custom_colors: 'Custom colors', color_bg: 'Background', color_text: 'Text',
    color_accent: 'Accent', color_reset: 'Reset', color_preset_label: 'Presets:',
    section_source: 'Rate source',
    source_nbu: 'NBU', source_privat: 'PrivatBank', source_mono: 'MonoBank',
    source_hint: 'NBU — official rate without buy/sell. PrivatBank and MonoBank show buy and sell.',
    buy_label: 'Buy', sell_label: 'Sell', rate_label: 'Rate',
    section_accessibility: 'Accessibility',
    a11y_cvd: 'Colorblind mode',
    a11y_cvd_desc: 'Replaces colors and adds symbols to rates',
    a11y_palette_universal: 'Universal',
    a11y_palette_universal_desc: 'Okabe-Ito — for all types of color blindness',
    a11y_palette_redgreen: 'For red-green',
    a11y_palette_redgreen_desc: 'Protanopia, deuteranopia — most common',
    a11y_palette_blueyellow: 'For blue-yellow',
    a11y_palette_blueyellow_desc: 'Tritanopia — pink/teal',
    a11y_palette_mono: 'Black and white',
    a11y_palette_mono_desc: 'Achromatopsia — form and text only',
    a11y_font: 'Large font',
    a11y_font_desc: 'Interface text size (100–150%)',
    a11y_symbols: 'Symbols instead of color',
    a11y_symbols_desc: 'Adds ▲▼● and text labels to rates',
    a11y_underline: 'Underline rate changes',
    a11y_underline_desc: '↑↓→ arrows underlined — visible without color',
    version_whats_new: 'What\'s new',
    version_subtitle: 'Latest updates from GitHub',
    version_loading: 'Loading...',
    version_empty: 'No releases yet',
    version_error: 'Failed to load releases',
    version_all_releases: 'All releases on GitHub',
    version_current: 'Current', version_latest: 'Latest',
    section_advanced: 'Advanced',
    precise_rate: 'Precise rate (4 decimals)',
    precise_rate_desc: 'Show 44.6743 instead of 44.67',
    classic_design: 'Classic design',
    classic_design_desc: 'Design from v2.6 and earlier',
    clear_cache: 'Clear cache',
    cache_cleared: 'Cache cleared',
    section_language: 'Language', lang_uk: 'Українська', lang_en: 'English',
    section_currencies: 'Currencies', saved: 'Saved',

    USD:'US Dollar', EUR:'Euro', GBP:'British Pound', PLN:'Polish Zloty',
    CNY:'Chinese Yuan', CHF:'Swiss Franc', JPY:'Japanese Yen',
    CAD:'Canadian Dollar', AUD:'Australian Dollar', TRY:'Turkish Lira',
    SEK:'Swedish Krona', NOK:'Norwegian Krone', DKK:'Danish Krone',
    CZK:'Czech Koruna', HUF:'Hungarian Forint', RON:'Romanian Leu',
    ILS:'Israeli Shekel', KRW:'South Korean Won', SGD:'Singapore Dollar',
    HKD:'Hong Kong Dollar', NZD:'New Zealand Dollar', MXN:'Mexican Peso',
    INR:'Indian Rupee',
    TND:'Tunisian Dinar', EGP:'Egyptian Pound',
    DZD:'Algerian Dinar', AED:'UAE Dirham',
    SAR:'Saudi Riyal', AZN:'Azerbaijani Manat', GEL:'Georgian Lari',
    KZT:'Kazakhstani Tenge', MYR:'Malaysian Ringgit', THB:'Thai Baht',
    MDL:'Moldovan Leu', ZAR:'South African Rand',
    RSD:'Serbian Dinar', XDR:'SDR (Special Drawing Rights)',
    XAU:'Gold (troy ounce)', XAG:'Silver (troy ounce)',
    XPT:'Platinum (troy ounce)', XPD:'Palladium (troy ounce)'
  }
};

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
    el.textContent = t(el.getAttribute('data-i18n'), lang);
  });
  root.querySelectorAll('[data-i18n-title]').forEach(el => {
    el.setAttribute('title', t(el.getAttribute('data-i18n-title'), lang));
  });
  document.documentElement.setAttribute('lang', lang);
}

/* ===== Тема ===== */

const FAVICON_COLORS = [
  { name: 'blue',       hex: '#1a73e8' },
  { name: 'light-blue', hex: '#38bdf8' },
  { name: 'purple',     hex: '#bd93f9' },
  { name: 'brown',      hex: '#8b5a2b' },
  { name: 'green',      hex: '#4ade80' },
  { name: 'red',        hex: '#e11d48' }
];

function pickFaviconColor(accent) {
  const c = hexToRgb(accent);
  if (!c) return 'blue';
  let best = 'blue';
  let bestD = Infinity;
  for (const p of FAVICON_COLORS) {
    const pc = hexToRgb(p.hex);
    if (!pc) continue;
    const d = (pc.r - c.r) ** 2 + (pc.g - c.g) ** 2 + (pc.b - c.b) ** 2;
    if (d < bestD) { bestD = d; best = p.name; }
  }
  return best;
}

function getFaviconPath(colorName) {
  return colorName === 'blue'
    ? 'favicon.ico'
    : `color-fvcn/${colorName}.ico`;
}

function setFavicon(colorName) {
  if (typeof document === 'undefined' || !document.head) return;

  document.querySelectorAll("link[rel='icon'], link[rel='shortcut icon']")
    .forEach(el => el.remove());

  const link = document.createElement('link');
  link.rel = 'icon';
  link.type = 'image/x-icon';
  link.href = getFaviconPath(colorName);
  document.head.appendChild(link);
}

async function applyThemeValue(theme) {
  const root = document.documentElement;
  ['--bg','--bg-elev','--text','--text-muted','--text-faint',
   '--accent','--border','--hover'].forEach(v => root.style.removeProperty(v));

  if (theme === 'custom') {
    let customColors = {};
    try {
      const stored = await chrome.storage.local.get('customColors');
      customColors = stored.customColors || {};
    } catch (e) {}
    applyCustomColors(customColors);
    return;
  }

  const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
  const effective = theme === 'system' ? (prefersDark ? 'dark' : 'light') : theme;
  root.setAttribute('data-theme', effective);

  setFavicon('blue');
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

  setFavicon(pickFaviconColor(accent));
}

/* ============================================================
   Джерела курсу
   ============================================================ */

const SOURCES = {
  nbu:    'https://bank.gov.ua/NBUStatService/v1/statdirectory/exchange?json',
  privat: 'https://api.privatbank.ua/p24api/pubinfo?exchange&json&coursid=11',
  mono:   'https://api.monobank.ua/bank/currency'
};

const ISO_NUMERIC = {
  USD:840, EUR:978, GBP:826, PLN:985, CNY:156, CHF:756, JPY:392, CAD:124,
  AUD:36,  TRY:949, SEK:752, NOK:578, DKK:208, CZK:203, HUF:348, RON:946,
  ILS:376, KRW:410, SGD:702, HKD:344, NZD:554, MXN:484, INR:356,
  TND:788, EGP:818, DZD:12,  AED:784, SAR:682,
  AZN:944, GEL:981, KZT:398, MYR:458, THB:764,
  MDL:498, ZAR:710, RSD:941, XDR:960,
  XAU:959, XAG:961, XPT:962, XPD:964
};
const NUMERIC_TO_CC = Object.fromEntries(
  Object.entries(ISO_NUMERIC).map(([k, v]) => [v, k])
);

/* Помечаем 429 как «просто подожди» — не как ошибку */
function makeRateLimitError(status) {
  const e = new Error('HTTP ' + status);
  e.rateLimited = true;
  e.status = status;
  return e;
}

async function fetchFromSource(source, lang) {
  if (source === 'privat') return fetchPrivat(lang);
  if (source === 'mono')   return fetchMono(lang);
  return fetchNBU(lang);
}

async function fetchNBU(lang) {
  const res = await fetch(SOURCES.nbu, { cache: 'no-store' });
  if (res.status === 429) throw makeRateLimitError(429);
  if (!res.ok) throw new Error('HTTP ' + res.status);
  const data = await res.json();
  return data.map(item => ({
    cc: item.cc,
    name: t(item.cc, lang) || item.txt,
    rate: item.rate,
    date: item.exchangedate,
    hasBuySell: false
  }));
}

async function fetchPrivat(lang) {
  const res = await fetch(SOURCES.privat, { cache: 'no-store' });
  if (res.status === 429) throw makeRateLimitError(429);
  if (!res.ok) throw new Error('HTTP ' + res.status);
  const data = await res.json();
  return data
    .filter(item => item.base_ccy === 'UAH' && item.ccy !== 'RUR')
    .map(item => ({
      cc: item.ccy,
      name: t(item.ccy, lang) || item.ccy,
      buy: parseFloat(item.buy),
      sell: parseFloat(item.sale),
      date: null,
      hasBuySell: true
    }));
}

async function fetchMono(lang) {
  const res = await fetch(SOURCES.mono, { cache: 'no-store' });
  if (res.status === 429) throw makeRateLimitError(429);
  if (!res.ok) throw new Error('HTTP ' + res.status);

  const data = await res.json();
  if (!Array.isArray(data)) {
    console.warn('[МоноБанк] Несподівана відповідь:', data);
    throw new Error('Invalid MonoBank response');
  }

  const UAH = 980;
  const USD = 840;
  const EUR = 978;
  const rows = [];

  for (const item of data) {
    if (!item) continue;
    const a = item.currencyCodeA;
    const b = item.currencyCodeB;

    let cc = null;
    let buy   = item.rateBuy;
    let sell  = item.rateSell;
    let cross = item.rateCross;

    // Основной случай: USD/EUR → UAH
    if (b === UAH && (a === USD || a === EUR)) {
      cc = NUMERIC_TO_CC[a];
    }
    // Обратный (бывает): UAH → USD/EUR
    else if (a === UAH && (b === USD || b === EUR)) {
      cc = NUMERIC_TO_CC[b];
      buy   = (buy  != null && buy  > 0) ? 1 / buy  : null;
      sell  = (sell != null && sell > 0) ? 1 / sell : null;
      cross = (cross != null && cross > 0) ? 1 / cross : null;
    }

    if (!cc) continue;

    const value = (cross != null && cross > 0)
      ? cross
      : (buy != null && sell != null
          ? (buy + sell) / 2
          : (buy ?? sell ?? null));

    if (value == null || isNaN(value)) continue;

    rows.push({
      cc,
      name: t(cc, lang) || cc,
      buy,
      sell,
      rate: value,
      date: item.date
        ? new Date(item.date * 1000).toLocaleDateString('uk-UA')
        : null,
      hasBuySell: buy != null || sell != null
    });
  }

  if (rows.length === 0) {
    console.warn(
      '[МоноБанк] Не знайдено пар USD/EUR до UAH. Отримано записів:',
      data.length,
      '— приклад першого:',
      data[0]
    );
  }

  return rows;
}