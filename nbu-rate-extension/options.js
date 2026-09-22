const ALL_CURRENCIES = [
  'USD','EUR','GBP','PLN','CNY','CHF','JPY','CAD','AUD','TRY',
  'SEK','NOK','DKK','CZK','HUF','RON','ILS','KRW','SGD','HKD',
  'NZD','MXN','INR',
  'TND','EGP','DZD','AED','SAR',
  'AZN','GEL','KZT','MYR','THB',
  'MDL','ZAR','RSD','XDR',
  'XAU','XAG','XPT','XPD'
];

(async () => {
  const REMOVED = ['SDG','PKR','BRL','CLP','ISK','MAD','IQD','KWD',
                   'UZS','IRR','PHP','LBP','VND','BDT','IDR'];
  try {
    const { currencies } = await chrome.storage.sync.get('currencies');
    if (Array.isArray(currencies) && currencies.some(c => REMOVED.includes(c))) {
      const cleaned = currencies.filter(c => !REMOVED.includes(c));
      await chrome.storage.sync.set({
        currencies: cleaned.length ? cleaned : ['USD','EUR','GBP','PLN','CNY']
      });
    }
  } catch (e) {}
})();

const DEFAULT_SELECTED = ['USD', 'EUR', 'GBP', 'PLN', 'CNY'];
const DEFAULT_CUSTOM = { bg: '#1a1a1a', text: '#e8eaed', accent: '#8ab4f8' };

const PRESETS = {
  midnight: { bg: '#0f172a', text: '#e2e8f0', accent: '#38bdf8' },
  nord:     { bg: '#2e3440', text: '#eceff4', accent: '#88c0d0' },
  dracula:  { bg: '#282a36', text: '#f8f8f2', accent: '#bd93f9' },
  sepia:    { bg: '#f4ecd8', text: '#3b2f1e', accent: '#8b5a2b' },
  forest:   { bg: '#0f2417', text: '#d1fae5', accent: '#4ade80' },
  rose:     { bg: '#fff1f2', text: '#4c0519', accent: '#e11d48' }
};

const RELEASES_API = 'https://api.github.com/repos/He-Trogati-Mne/NBU-Rate/releases?per_page=15';
const RELEASES_CACHE_KEY = 'githubReleasesCache';
const RELEASES_CACHE_TTL = 24 * 60 * 60 * 1000; // 24 часа

let currentLang = 'uk';
let currentTheme = 'system';
let currentRateSource = 'nbu';

/* === Мгновенное переключение темы без анимации === */
function withoutThemeTransition(fn) {
  const root = document.documentElement;
  root.classList.add('theme-switching');
  try {
    return fn();
  } finally {
    requestAnimationFrame(() => requestAnimationFrame(() => {
      root.classList.remove('theme-switching');
    }));
  }
}

document.addEventListener('DOMContentLoaded', async () => {
  currentLang = await getLanguage();
  applyTranslations(currentLang);

  // CSP-safe fallback для иконок футера
  attachImgFallbacks(document);

  await initTheme();
  await initCustomColors();
  await initRateSource();
  await initA11y();
  await initLanguage();
  await initCurrencies();
  await initAdvanced();
  await initClassicDesign();
  await initClearCache();
  await initVersionBadge();

  bindCurrencyGridOnce();

  chrome.storage.onChanged.addListener(async (changes, area) => {
    if (area === 'local') {
      if (changes[`cachedAt_${currentRateSource}`]) await updateLastFetchInfo();
      return;
    }
    if (area !== 'sync') return;

    if (changes.rateSource) {
      currentRateSource = changes.rateSource.newValue || 'nbu';
      const switcher = document.getElementById('source-switch');
      if (switcher) {
        switcher.querySelectorAll('button').forEach(b =>
          b.classList.toggle('active', b.dataset.source === currentRateSource));
      }
      await updateLastFetchInfo();
    }

    if (changes.theme) {
      const t = changes.theme.newValue || 'system';
      if (t !== currentTheme) {
        currentTheme = t;
        try { localStorage.setItem('theme', t); } catch (e) {}
        highlightButton('#theme-switch', 'data-theme', t);
        toggleCustomVisibility(t);
        withoutThemeTransition(async () => {
          await applyThemeValue(t);
        });
      }
    }

    if (changes.language) {
      const l = changes.language.newValue || 'uk';
      if (l !== currentLang) {
        currentLang = l;
        highlightButton('#lang-switch', 'data-lang', l);
        applyTranslations(l);
        await initCurrencies();
        await updateLastFetchInfo();
      }
    }

    if (changes.a11y) {
      await initA11yUI(changes.a11y.newValue);
    }
  });

  document.documentElement.classList.add('app-ready');
});

/* ============================================================
   Остання перевірка
   ============================================================ */

function formatDateTimeLocal(ts) {
  const d = new Date(ts);
  const pad = n => String(n).padStart(2, '0');
  const dateStr = `${pad(d.getDate())}.${pad(d.getMonth()+1)}.${d.getFullYear()}`;
  const timeStr = `${pad(d.getHours())}:${pad(d.getMinutes())}`;
  return `${dateStr}, ${timeStr}`;
}

async function updateLastFetchInfo() {
  const el = document.getElementById('last-fetch-info');
  if (!el) return;
  try {
    const atKey = `cachedAt_${currentRateSource}`;
    const stored = await chrome.storage.local.get(atKey);
    const ts = stored[atKey];
    if (!ts) {
      el.textContent = t('last_fetch_never', currentLang);
      return;
    }
    el.textContent = `${t('last_fetch', currentLang)}: ${formatDateTimeLocal(ts)}`;
  } catch (e) {
    el.textContent = '';
  }
}

/* ============================================================
   Тема
   ============================================================ */

async function initTheme() {
  let stored = {};
  try { stored = await chrome.storage.sync.get('theme'); } catch (e) {}
  currentTheme = stored.theme || 'system';

  try { localStorage.setItem('theme', currentTheme); } catch (e) {}

  highlightButton('#theme-switch', 'data-theme', currentTheme);
  toggleCustomVisibility(currentTheme);
  await applyThemeValue(currentTheme);

  document.querySelectorAll('#theme-switch button').forEach(btn => {
    btn.addEventListener('click', async () => {
      const value = btn.dataset.theme;
      currentTheme = value;
      try { localStorage.setItem('theme', value); } catch (e) {}
      highlightButton('#theme-switch', 'data-theme', value);
      toggleCustomVisibility(value);

      withoutThemeTransition(async () => {
        await applyThemeValue(value);
      });

      try { await chrome.storage.sync.set({ theme: value }); } catch (e) {}
    });
  });

  window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', async () => {
    if (currentTheme === 'system') {
      withoutThemeTransition(async () => {
        await applyThemeValue('system');
      });
    }
  });
}

function toggleCustomVisibility(theme) {
  document.getElementById('custom-colors').classList.toggle('visible', theme === 'custom');
}

/* ============================================================
   Джерело курсу
   ============================================================ */

async function initRateSource() {
  const switcher = document.getElementById('source-switch');
  if (!switcher) return;

  const { rateSource = 'nbu' } = await chrome.storage.sync.get('rateSource');
  currentRateSource = rateSource;

  switcher.querySelectorAll('button').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.source === rateSource);
  });

  switcher.querySelectorAll('button').forEach(btn => {
    btn.addEventListener('click', async () => {
      const value = btn.dataset.source;
      if (value === currentRateSource) return;
      currentRateSource = value;
      switcher.querySelectorAll('button').forEach(b =>
        b.classList.toggle('active', b.dataset.source === value));
      try {
        await chrome.storage.sync.set({ rateSource: value });
        showSaved();
      } catch (e) {
        console.warn('[options] rateSource save failed:', e);
      }
      await updateLastFetchInfo();
    });
  });

  await updateLastFetchInfo();
}

/* ============================================================
   Кастомные цвета
   ============================================================ */

async function initCustomColors() {
  let customColors = DEFAULT_CUSTOM;
  try {
    const stored = await chrome.storage.local.get('customColors');
    if (stored.customColors) customColors = stored.customColors;
  } catch (e) {}

  setColorField('bg', customColors.bg || DEFAULT_CUSTOM.bg);
  setColorField('text', customColors.text || DEFAULT_CUSTOM.text);
  setColorField('accent', customColors.accent || DEFAULT_CUSTOM.accent);

  try { localStorage.setItem('customColors', JSON.stringify(customColors)); } catch (e) {}

  ['bg', 'text', 'accent'].forEach(name => {
    const picker = document.getElementById(`color-${name}`);
    const text   = document.getElementById(`hex-${name}`);

    picker.addEventListener('input', () => {
      text.value = picker.value.toUpperCase();
      previewAndSave();
    });

    text.addEventListener('input', () => {
      let v = text.value.trim();
      if (!v.startsWith('#')) v = '#' + v;
      if (hexToRgb(v)) {
        picker.value = v.toLowerCase();
        previewAndSave();
      }
    });

    text.addEventListener('blur', () => {
      if (!hexToRgb(text.value)) text.value = picker.value.toUpperCase();
    });
  });

  document.querySelectorAll('.preset-swatch').forEach(btn => {
    btn.addEventListener('click', async () => {
      const preset = PRESETS[btn.dataset.preset];
      if (!preset) return;
      setColorField('bg', preset.bg);
      setColorField('text', preset.text);
      setColorField('accent', preset.accent);

      if (currentTheme !== 'custom') {
        currentTheme = 'custom';
        try { localStorage.setItem('theme', 'custom'); } catch (e) {}
        highlightButton('#theme-switch', 'data-theme', 'custom');
        toggleCustomVisibility('custom');
        document.documentElement.classList.add('theme-switching');
        try { await chrome.storage.sync.set({ theme: 'custom' }); } catch (e) {}
      }
      previewAndSave();
      requestAnimationFrame(() => requestAnimationFrame(() => {
        document.documentElement.classList.remove('theme-switching');
      }));
    });
  });

  document.getElementById('reset-colors').addEventListener('click', () => {
    setColorField('bg', DEFAULT_CUSTOM.bg);
    setColorField('text', DEFAULT_CUSTOM.text);
    setColorField('accent', DEFAULT_CUSTOM.accent);
    previewAndSave();
  });
}

function setColorField(name, value) {
  document.getElementById(`color-${name}`).value = value.toLowerCase();
  document.getElementById(`hex-${name}`).value = value.toUpperCase();
}

function readCustomColors() {
  return {
    bg: document.getElementById('color-bg').value,
    text: document.getElementById('color-text').value,
    accent: document.getElementById('color-accent').value
  };
}

let saveTimer;
function previewAndSave() {
  const colors = readCustomColors();
  if (currentTheme === 'custom') {
    document.documentElement.classList.add('theme-switching');
    applyCustomColors(colors);
    requestAnimationFrame(() => requestAnimationFrame(() => {
      document.documentElement.classList.remove('theme-switching');
    }));
  }
  clearTimeout(saveTimer);
  saveTimer = setTimeout(async () => {
    try {
      await chrome.storage.local.set({ customColors: colors });
      try { localStorage.setItem('customColors', JSON.stringify(colors)); } catch (e) {}
      showSaved();
    } catch (e) {}
  }, 200);
}

/* ============================================================
   Доступність
   ============================================================ */

async function initA11yUI(a11yData) {
  const a11y = a11yData || await getA11y();

  const cvdToggle       = document.getElementById('a11y-cvd-toggle');
  const fontSlider      = document.getElementById('a11y-font-slider');
  const fontValue       = document.getElementById('a11y-font-value');
  const symbolsToggle   = document.getElementById('a11y-symbols-toggle');
  const underlineToggle = document.getElementById('a11y-underline-toggle');
  const paletteList     = document.getElementById('palette-list');
  const paletteRadios   = document.querySelectorAll('input[name="palette"]');

  let fontScale = a11y.fontScale;
  if (!fontScale && a11y.font === true) fontScale = 115;
  if (!fontScale) fontScale = 100;

  cvdToggle.checked       = !!a11y.cvd;
  symbolsToggle.checked   = a11y.symbols !== false;
  underlineToggle.checked = !!a11y.underline;
  fontSlider.value        = fontScale;
  fontValue.textContent   = fontScale + '%';

  paletteRadios.forEach(r => { r.checked = (r.value === a11y.palette); });
  paletteList.classList.toggle('visible', !!a11y.cvd);

  document.documentElement.style.setProperty('--a11y-font-scale', fontScale / 100);
  document.documentElement.setAttribute('data-a11y-font', fontScale > 100 ? 'true' : 'false');

  await applyA11y({ ...a11y, fontScale });
}

async function initA11y() {
  await initA11yUI(await getA11y());

  const cvdToggle       = document.getElementById('a11y-cvd-toggle');
  const fontSlider      = document.getElementById('a11y-font-slider');
  const fontValue       = document.getElementById('a11y-font-value');
  const symbolsToggle   = document.getElementById('a11y-symbols-toggle');
  const underlineToggle = document.getElementById('a11y-underline-toggle');
  const paletteList     = document.getElementById('palette-list');
  const paletteRadios   = document.querySelectorAll('input[name="palette"]');

  fontSlider.addEventListener('input', () => {
    const value = +fontSlider.value;
    fontValue.textContent = value + '%';
    document.documentElement.style.setProperty('--a11y-font-scale', value / 100);
    document.documentElement.setAttribute('data-a11y-font', value > 100 ? 'true' : 'false');
  });

  async function save() {
    const palette = document.querySelector('input[name="palette"]:checked')?.value || 'universal';
    const value = {
      cvd: cvdToggle.checked,
      palette,
      fontScale: +fontSlider.value,
      symbols: symbolsToggle.checked,
      underline: underlineToggle.checked
    };
    paletteList.classList.toggle('visible', value.cvd);
    await applyA11y(value);
    try {
      await chrome.storage.sync.set({ a11y: value });
      showSaved();
    } catch (e) {}
  }

  cvdToggle.addEventListener('change', save);
  fontSlider.addEventListener('change', save);
  symbolsToggle.addEventListener('change', save);
  underlineToggle.addEventListener('change', save);
  paletteRadios.forEach(r => r.addEventListener('change', save));
}

/* ============================================================
   Мова
   ============================================================ */

async function initLanguage() {
  highlightButton('#lang-switch', 'data-lang', currentLang);

  document.querySelectorAll('#lang-switch button').forEach(btn => {
    btn.addEventListener('click', async () => {
      const value = btn.dataset.lang;
      currentLang = value;
      highlightButton('#lang-switch', 'data-lang', value);
      applyTranslations(value);
      try { await chrome.storage.sync.set({ language: value }); } catch (e) {}
      await initCurrencies();
      await updateLastFetchInfo();
    });
  });
}

/* ============================================================
   Валюти
   ============================================================ */

/* Слушатель вешаем ровно один раз — на всю жизнь страницы */
function bindCurrencyGridOnce() {
  const grid = document.getElementById('currency-grid');
  if (!grid || grid.dataset.bound === '1') return;
  grid.dataset.bound = '1';

  grid.addEventListener('change', async () => {
    const selected = Array.from(grid.querySelectorAll('input:checked')).map(i => i.value);

    if (selected.length === 0) {
      // Не даём оставить пустой набор — включаем первую и сохраняем
      const fallback = (DEFAULT_SELECTED[0]) || 'USD';
      const cb = grid.querySelector(`input[value="${fallback}"]`);
      if (cb) cb.checked = true;
      try {
        await chrome.storage.sync.set({ currencies: [fallback] });
        showSaved();
      } catch (e) {}
      return;
    }

    try {
      await chrome.storage.sync.set({ currencies: selected });
      showSaved();
    } catch (e) {}
  });
}

async function initCurrencies() {
  let currencies = DEFAULT_SELECTED;
  try {
    const stored = await chrome.storage.sync.get('currencies');
    if (Array.isArray(stored.currencies) && stored.currencies.length) {
      currencies = stored.currencies;
    }
  } catch (e) {}

  const grid = document.getElementById('currency-grid');
  grid.innerHTML = ALL_CURRENCIES.map(cc => {
    const checked = currencies.includes(cc) ? 'checked' : '';
    const name = t(cc, currentLang);
    return `
      <label class="currency-item">
        <input type="checkbox" value="${cc}" ${checked} />
        ${flagHtml(cc, 48)}
        <code>${cc}</code>
        <span class="cname">${name}</span>
      </label>
    `;
  }).join('');

  // CSP-safe fallback для флагов после перерисовки
  attachImgFallbacks(grid);
}

/* ============================================================
   Додатково
   ============================================================ */

async function initAdvanced() {
  const toggle = document.getElementById('precise-rate-toggle');
  if (!toggle) return;
  let showPreciseRate = false;
  try {
    const stored = await chrome.storage.sync.get('showPreciseRate');
    showPreciseRate = !!stored.showPreciseRate;
  } catch (e) {}
  toggle.checked = showPreciseRate;
  toggle.addEventListener('change', async () => {
    try {
      await chrome.storage.sync.set({ showPreciseRate: toggle.checked });
      showSaved();
    } catch (e) {}
  });
}

async function initClassicDesign() {
  const toggle = document.getElementById('classic-design-toggle');
  if (!toggle) return;
  let classicDesign = false;
  try {
    const stored = await chrome.storage.sync.get('classicDesign');
    classicDesign = !!stored.classicDesign;
  } catch (e) {}
  toggle.checked = classicDesign;
  toggle.addEventListener('change', async () => {
    try {
      await chrome.storage.sync.set({ classicDesign: toggle.checked });
      showSaved();
    } catch (e) {}
  });
}

async function initClearCache() {
  const btn = document.getElementById('clear-cache-btn');
  const note = document.getElementById('cache-note');
  if (!btn) return;

  let noteTimer;

  btn.addEventListener('click', async () => {
    try {
      const all = await chrome.storage.local.get(null);
      const keysToRemove = Object.keys(all).filter(k =>
        k.startsWith('cachedRates_') ||
        k.startsWith('cachedAt_') ||
        k === 'ratesHistory'
      );

      if (keysToRemove.length) {
        await chrome.storage.local.remove(keysToRemove);
      }

      if (note) {
        note.classList.add('show');
        clearTimeout(noteTimer);
        noteTimer = setTimeout(() => note.classList.remove('show'), 1400);
      }

      await updateLastFetchInfo();
    } catch (e) {
      console.warn('[Курс НБУ] Не вдалось очистити кеш:', e);
    }
  });
}

/* ============================================================
   Версия / релизы (с кэшем на 24 часа)
   ============================================================ */

async function initVersionBadge() {
  const badge      = document.getElementById('version-badge');
  const badgeText  = document.getElementById('version-badge-text');
  const modal      = document.getElementById('version-modal');
  const modalIcon  = document.getElementById('version-modal-icon');
  const modalBody  = document.getElementById('version-modal-body');
  const modalClose = document.getElementById('version-modal-close');
  const overlay    = document.getElementById('version-modal-overlay');
  if (!badge || !modal) return;

  const version = chrome.runtime.getManifest().version;
  const versionStr = 'v' + version;
  if (badgeText) badgeText.textContent = versionStr;
  if (modalIcon) modalIcon.textContent = versionStr;

  let loaded = false;
  function openModal() {
    modal.hidden = false;
    document.body.style.overflow = 'hidden';
    modalClose.focus();
    if (!loaded) { loaded = true; loadReleases(modalBody); }
  }
  function closeModal() {
    modal.hidden = true;
    document.body.style.overflow = '';
    badge.focus();
  }
  badge.addEventListener('click', openModal);
  modalClose.addEventListener('click', closeModal);
  overlay.addEventListener('click', closeModal);
  document.addEventListener('keydown', e => {
    if (e.key === 'Escape' && !modal.hidden) closeModal();
  });
}

async function loadReleases(container) {
  // Проверяем кэш
  let cached = null;
  try {
    const stored = await chrome.storage.local.get(RELEASES_CACHE_KEY);
    cached = stored[RELEASES_CACHE_KEY] || null;
  } catch (e) {}

  // Свежий кэш (< 24ч) — показываем сразу
  if (cached && cached.ts && Array.isArray(cached.data) &&
      (Date.now() - cached.ts < RELEASES_CACHE_TTL)) {
    renderReleases(container, cached.data);
    return;
  }

  // Иначе — грузим с GitHub
  try {
    const res = await fetch(RELEASES_API, {
      headers: { 'Accept': 'application/vnd.github+json' }
    });
    if (!res.ok) throw new Error('HTTP ' + res.status);
    const releases = await res.json();
    if (!Array.isArray(releases)) throw new Error('Invalid response');

    // Сохраняем в кэш
    try {
      await chrome.storage.local.set({
        [RELEASES_CACHE_KEY]: { ts: Date.now(), data: releases }
      });
    } catch (e) {}

    renderReleases(container, releases);
  } catch (e) {
    // При ошибке fetch — показываем устаревший кэш, если есть
    if (cached && Array.isArray(cached.data)) {
      renderReleases(container, cached.data);
      return;
    }

    container.innerHTML = `<div class="version-modal-empty">
      <p data-i18n="version_error">Не вдалося завантажити релізи</p>
      <p><a href="https://github.com/He-Trogati-Mne/NBU-Rate/releases" target="_blank" rel="noopener">
        GitHub Releases →</a></p>
    </div>`;
    applyTranslations(currentLang, container);
  }
}

function renderReleases(container, releases) {
  if (!Array.isArray(releases) || releases.length === 0) {
    container.innerHTML = `<div class="version-modal-empty">
      <p data-i18n="version_empty">Поки що немає релізів</p>
    </div>`;
    applyTranslations(currentLang, container);
    return;
  }
  const latestVersion = chrome.runtime.getManifest().version;
  container.innerHTML = releases.map((r, i) => renderRelease(r, i === 0, latestVersion)).join('');
  applyTranslations(currentLang, container);
}

function renderRelease(release, isLatest, currentVersion) {
  const tag  = release.tag_name || '';
  const name = release.name || tag;
  const date = release.published_at ? formatDate(release.published_at) : '';
  const body = release.body || '';
  const tagNorm = tag.replace(/^v/i, '');
  const isCurrent = tagNorm === currentVersion;
  const latestBadge = isCurrent
    ? `<span class="version-release-latest" data-i18n="version_current">Поточна</span>`
    : (isLatest ? `<span class="version-release-latest" data-i18n="version_latest">Остання</span>` : '');

  return `
    <div class="version-release">
      <div class="version-release-head">
        <span class="version-release-tag">${escapeHtml(tag)}</span>
        ${latestBadge}
        <span class="version-release-date">${escapeHtml(date)}</span>
      </div>
      <h3 class="version-release-name">${escapeHtml(name)}</h3>
      <div class="version-release-body">${renderMarkdown(body)}</div>
    </div>
  `;
}

function formatDate(iso) {
  try {
    const d = new Date(iso);
    const day = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0');
    return `${day}.${month}.${d.getFullYear()}`;
  } catch (e) { return iso; }
}

function escapeHtml(s) {
  return String(s)
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function renderMarkdown(md) {
  if (!md) return '';
  md = String(md).replace(/\r\n?/g, '\n');

  const isImageUrl = url =>
    /\.(png|jpe?g|gif|webp|svg|avif|bmp)(\?|#|$)/i.test(url) ||
    /img\.shields\.io|githubusercontent\.com|user-images\.|private-user-images|cloudfront\.net|googleusercontent|badgen\.net/i.test(url);

  function inline(s) {
    const codeSpans = [];
    s = String(s).replace(/`([^`]+)`/g, (m, code) => {
      codeSpans.push(code);
      return `\u0000C${codeSpans.length - 1}\u0000`;
    });
    s = escapeHtml(s);
    s = s.replace(/!\[([^\]]*)\]\(([^)\s]+)(?:\s+&quot;([^&]*)&quot;)?\)/g, (m, alt, url) => {
      if (isImageUrl(url)) return `<img class="rm-img" src="${url}" alt="${alt}" loading="lazy" />`;
      return `<a href="${url}" target="_blank" rel="noopener">${alt || url}</a>`;
    });
    s = s.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
    s = s.replace(/(^|[^*])\*([^*\n]+)\*(?!\*)/g, '$1<em>$2</em>');
    s = s.replace(/~~([^~]+)~~/g, '<del>$1</del>');
    s = s.replace(/\[([^\]]+)\]\(([^)\s]+)(?:\s+&quot;([^&]*)&quot;)?\)/g,
      '<a href="$2" target="_blank" rel="noopener">$1</a>');
    s = s.replace(/(^|[\s(])(https?:\/\/[^\s<)]+)/g,
      '$1<a href="$2" target="_blank" rel="noopener">$2</a>');
    s = s.replace(/\u0000C(\d+)\u0000/g, (m, i) => `<code>${escapeHtml(codeSpans[+i])}</code>`);
    return s;
  }

  const lines = md.split('\n');
  let out = '';
  let i = 0;

  while (i < lines.length) {
    const line = lines[i].trim();
    if (!line) { i++; continue; }

    if (/^(-{3,}|\*{3,}|_{3,})$/.test(line)) { out += '<hr class="rm-hr" />'; i++; continue; }

    const h = line.match(/^(#{1,6})\s+(.+?)\s*#*\s*$/);
    if (h) {
      const level = Math.min(h[1].length, 3);
      out += `<div class="rm-h rm-h${level}">${inline(h[2])}</div>`;
      i++; continue;
    }

    if (/^[-*+]\s+/.test(line)) {
      let list = '<ul class="rm-list">';
      while (i < lines.length) {
        const m = lines[i].trim().match(/^[-*+]\s+(.+)$/);
        if (!m) break;
        list += `<li>${inline(m[1])}</li>`; i++;
      }
      list += '</ul>'; out += list; continue;
    }

    if (/^\d+\.\s+/.test(line)) {
      let list = '<ol class="rm-list">';
      while (i < lines.length) {
        const m = lines[i].trim().match(/^\d+\.\s+(.+)$/);
        if (!m) break;
        list += `<li>${inline(m[1])}</li>`; i++;
      }
      list += '</ol>'; out += list; continue;
    }

    out += `<p class="rm-p">${inline(line)}</p>`;
    i++;
  }
  return out;
}

function highlightButton(selector, attr, value) {
  document.querySelectorAll(`${selector} button`).forEach(btn => {
    btn.classList.toggle('active', btn.getAttribute(attr) === value);
  });
}

let savedTimer;
function showSaved() {
  const note = document.getElementById('saved-note');
  if (!note) return;
  note.classList.add('show');
  clearTimeout(savedTimer);
  savedTimer = setTimeout(() => note.classList.remove('show'), 1200);
}