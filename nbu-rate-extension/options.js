const ALL_CURRENCIES = [
  'USD', 'EUR', 'GBP', 'PLN', 'CNY', 'CHF', 'JPY', 'CAD', 'AUD', 'TRY',
  'SEK', 'NOK', 'DKK', 'CZK', 'HUF', 'RON', 'ILS', 'KRW', 'SGD', 'HKD',
  'NZD', 'MXN', 'INR', 'XAU'
];
const DEFAULT_SELECTED = ['USD', 'EUR', 'GBP', 'PLN', 'CNY'];

const DEFAULT_CUSTOM = {
  bg: '#1a1a1a',
  text: '#e8eaed',
  accent: '#8ab4f8'
};

const PRESETS = {
  midnight: { bg: '#0f172a', text: '#e2e8f0', accent: '#38bdf8' },
  nord:     { bg: '#2e3440', text: '#eceff4', accent: '#88c0d0' },
  dracula:  { bg: '#282a36', text: '#f8f8f2', accent: '#bd93f9' },
  sepia:    { bg: '#f4ecd8', text: '#3b2f1e', accent: '#8b5a2b' },
  forest:   { bg: '#0f2417', text: '#d1fae5', accent: '#4ade80' },
  rose:     { bg: '#fff1f2', text: '#4c0519', accent: '#e11d48' }
};

const RELEASES_API = 'https://api.github.com/repos/He-Trogati-Mne/NBU-Rate/releases?per_page=15';

let currentLang = 'uk';
let currentTheme = 'system';

document.addEventListener('DOMContentLoaded', async () => {
  currentLang = await getLanguage();
  applyTranslations(currentLang);

  await initTheme();
  await initCustomColors();
  await initA11y();
  await initLanguage();
  await initCurrencies();
  await initAdvanced();
  await initVersionBadge();
});

/* ===== Тема ===== */

async function initTheme() {
  let stored = {};
  try {
    stored = await chrome.storage.sync.get('theme');
  } catch (e) { /* ignore */ }
  currentTheme = stored.theme || 'system';

  highlightButton('#theme-switch', 'data-theme', currentTheme);
  toggleCustomVisibility(currentTheme);
  await applyThemeValue(currentTheme);

  document.querySelectorAll('#theme-switch button').forEach(btn => {
    btn.addEventListener('click', async () => {
      const value = btn.dataset.theme;
      currentTheme = value;

      highlightButton('#theme-switch', 'data-theme', value);
      toggleCustomVisibility(value);
      await applyThemeValue(value);

      try {
        await chrome.storage.sync.set({ theme: value });
      } catch (e) {
        console.warn('[Курс НБУ] theme не збереглось:', e);
      }
    });
  });

  window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', async () => {
    if (currentTheme === 'system') await applyThemeValue('system');
  });
}

function toggleCustomVisibility(theme) {
  document.getElementById('custom-colors').classList.toggle('visible', theme === 'custom');
}

/* ===== Власні кольори ===== */

async function initCustomColors() {
  let customColors = DEFAULT_CUSTOM;
  try {
    const stored = await chrome.storage.local.get('customColors');
    if (stored.customColors) customColors = stored.customColors;
  } catch (e) { /* ignore */ }

  setColorField('bg', customColors.bg || DEFAULT_CUSTOM.bg);
  setColorField('text', customColors.text || DEFAULT_CUSTOM.text);
  setColorField('accent', customColors.accent || DEFAULT_CUSTOM.accent);

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
        highlightButton('#theme-switch', 'data-theme', 'custom');
        toggleCustomVisibility('custom');
        try {
          await chrome.storage.sync.set({ theme: 'custom' });
        } catch (e) { /* ignore */ }
      }
      previewAndSave();
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
    applyCustomColors(colors);
  }

  clearTimeout(saveTimer);
  saveTimer = setTimeout(async () => {
    try {
      await chrome.storage.local.set({ customColors: colors });
      showSaved();
    } catch (e) {
      console.warn('[Курс НБУ] customColors не збереглось:', e);
    }
  }, 200);
}

/* ===== Доступність ===== */

async function initA11y() {
  const cvdToggle       = document.getElementById('a11y-cvd-toggle');
  const fontSlider      = document.getElementById('a11y-font-slider');
  const fontValue       = document.getElementById('a11y-font-value');
  const symbolsToggle   = document.getElementById('a11y-symbols-toggle');
  const underlineToggle = document.getElementById('a11y-underline-toggle');
  const paletteList     = document.getElementById('palette-list');
  const paletteRadios   = document.querySelectorAll('input[name="palette"]');

  const a11y = await getA11y();

  let fontScale = a11y.fontScale;
  if (!fontScale && a11y.font === true) fontScale = 115;
  if (!fontScale) fontScale = 100;

  cvdToggle.checked       = a11y.cvd;
  symbolsToggle.checked   = a11y.symbols;
  underlineToggle.checked = a11y.underline;
  fontSlider.value        = fontScale;
  fontValue.textContent   = fontScale + '%';

  paletteRadios.forEach(r => {
    r.checked = (r.value === a11y.palette);
  });

  paletteList.classList.toggle('visible', a11y.cvd);

  await applyA11y({ ...a11y, fontScale });

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
    } catch (e) {
      console.warn('[Курс НБУ] a11y не збереглось:', e);
    }
  }

  cvdToggle.addEventListener('change', save);
  fontSlider.addEventListener('change', save);
  symbolsToggle.addEventListener('change', save);
  underlineToggle.addEventListener('change', save);
  paletteRadios.forEach(r => r.addEventListener('change', save));
}

/* ===== Мова ===== */

async function initLanguage() {
  highlightButton('#lang-switch', 'data-lang', currentLang);

  document.querySelectorAll('#lang-switch button').forEach(btn => {
    btn.addEventListener('click', async () => {
      const value = btn.dataset.lang;
      currentLang = value;
      highlightButton('#lang-switch', 'data-lang', value);
      applyTranslations(value);
      try {
        await chrome.storage.sync.set({ language: value });
      } catch (e) { /* ignore */ }
      await initCurrencies();
    });
  });
}

/* ===== Валюти ===== */

async function initCurrencies() {
  let currencies = DEFAULT_SELECTED;
  try {
    const stored = await chrome.storage.sync.get('currencies');
    if (Array.isArray(stored.currencies) && stored.currencies.length) {
      currencies = stored.currencies;
    }
  } catch (e) { /* ignore */ }

  const grid = document.getElementById('currency-grid');

  grid.innerHTML = ALL_CURRENCIES.map(cc => {
    const checked = currencies.includes(cc) ? 'checked' : '';
    const name = t(cc, currentLang);
    return `
      <label class="currency-item">
        <input type="checkbox" value="${cc}" ${checked} />
        ${flagHtml(cc)}
        <code>${cc}</code>
        <span class="cname">${name}</span>
      </label>
    `;
  }).join('');

  grid.addEventListener('change', async () => {
    const selected = Array.from(grid.querySelectorAll('input:checked'))
      .map(input => input.value);

    if (selected.length === 0) {
      grid.querySelector(`input[value="${currencies[0] || 'USD'}"]`).checked = true;
      return;
    }

    try {
      await chrome.storage.sync.set({ currencies: selected });
      showSaved();
    } catch (e) { /* ignore */ }
  });
}

/* ===== Додатково ===== */

async function initAdvanced() {
  const toggle = document.getElementById('precise-rate-toggle');
  if (!toggle) return;

  let showPreciseRate = false;
  try {
    const stored = await chrome.storage.sync.get('showPreciseRate');
    showPreciseRate = !!stored.showPreciseRate;
  } catch (e) { /* ignore */ }

  toggle.checked = showPreciseRate;

  toggle.addEventListener('change', async () => {
    try {
      await chrome.storage.sync.set({ showPreciseRate: toggle.checked });
      showSaved();
    } catch (e) {
      console.warn('[Курс НБУ] showPreciseRate не збереглось:', e);
    }
  });
}

/* ===== Версія + модалка "Що нового" ===== */

async function initVersionBadge() {
  const badge     = document.getElementById('version-badge');
  const badgeText = document.getElementById('version-badge-text');
  const modal     = document.getElementById('version-modal');
  const modalIcon = document.getElementById('version-modal-icon');
  const modalBody = document.getElementById('version-modal-body');
  const modalClose= document.getElementById('version-modal-close');
  const overlay   = document.getElementById('version-modal-overlay');

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
    if (!loaded) {
      loaded = true;
      loadReleases(modalBody);
    }
  }

  function closeModal() {
    modal.hidden = true;
    document.body.style.overflow = '';
    badge.focus();
  }

  badge.addEventListener('click', openModal);
  modalClose.addEventListener('click', closeModal);
  overlay.addEventListener('click', closeModal);

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && !modal.hidden) closeModal();
  });
}

async function loadReleases(container) {
  try {
    const res = await fetch(RELEASES_API, {
      headers: { 'Accept': 'application/vnd.github+json' }
    });
    if (!res.ok) throw new Error('HTTP ' + res.status);
    const releases = await res.json();

    if (!Array.isArray(releases) || releases.length === 0) {
      container.innerHTML = `<div class="version-modal-empty">
        <p data-i18n="version_empty">Поки що немає релізів</p>
      </div>`;
      applyTranslations(currentLang, container);
      return;
    }

    const latestVersion = chrome.runtime.getManifest().version;
    container.innerHTML = releases.map((r, i) => renderRelease(r, i === 0, latestVersion)).join('');
  } catch (e) {
    console.warn('[Курс НБУ] Не вдалось завантажити релізи:', e);
    container.innerHTML = `<div class="version-modal-empty">
      <p data-i18n="version_error">Не вдалося завантажити релізи</p>
      <p><a href="https://github.com/He-Trogati-Mne/NBU-Rate/releases" target="_blank" rel="noopener">
        GitHub Releases →
      </a></p>
    </div>`;
    applyTranslations(currentLang, container);
  }
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
  } catch (e) {
    return iso;
  }
}

function escapeHtml(s) {
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

/* ===== Покращений markdown-рендерер =====
   Підтримує:
   - заголовки  #, ##, ###
   - жирний     **text**
   - курсив     *text*
   - закресл.   ~~text~~
   - код        `code`
   - посилання  [text](url)
   - картинки   ![alt](url)   — якщо url схожий на зображення
   - авто-лінк  https://...
   - списки     - item  /  1. item
   - таблиці    | a | b |  +  |---|---|
   - лінія      ---
   - цитата     > text
============================================================ */

function renderMarkdown(md) {
  if (!md) return '';
  md = String(md).replace(/\r\n?/g, '\n');

  const isImageUrl = url =>
    /\.(png|jpe?g|gif|webp|svg|avif|bmp)(\?|#|$)/i.test(url) ||
    /img\.shields\.io|githubusercontent\.com|user-images\.|private-user-images|cloudfront\.net|googleusercontent|badgen\.net/i.test(url);

  function inline(s) {
    // Тимчасово ховаємо inline-код, щоб не чіпати його іншими правилами
    const codeSpans = [];
    s = String(s).replace(/`([^`]+)`/g, (m, code) => {
      codeSpans.push(code);
      return `\u0000C${codeSpans.length - 1}\u0000`;
    });

    // Екранування HTML
    s = escapeHtml(s);

    // Зображення (ПЕРЕД посиланнями!)
    s = s.replace(/!\[([^\]]*)\]\(([^)\s]+)(?:\s+&quot;([^&]*)&quot;)?\)/g, (m, alt, url) => {
      if (isImageUrl(url)) {
        return `<img class="rm-img" src="${url}" alt="${alt}" loading="lazy" />`;
      }
      return `<a href="${url}" target="_blank" rel="noopener">${alt || url}</a>`;
    });

    // **жирний**
    s = s.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');

    // *курсив* (не захоплює **)
    s = s.replace(/(^|[^*])\*([^*\n]+)\*(?!\*)/g, '$1<em>$2</em>');

    // ~~закреслений~~
    s = s.replace(/~~([^~]+)~~/g, '<del>$1</del>');

    // [посилання](url)
    s = s.replace(/\[([^\]]+)\]\(([^)\s]+)(?:\s+&quot;([^&]*)&quot;)?\)/g,
      '<a href="$2" target="_blank" rel="noopener">$1</a>');

    // Авто-лінки на голий https://...
    s = s.replace(/(^|[\s(])(https?:\/\/[^\s<)]+)/g,
      '$1<a href="$2" target="_blank" rel="noopener">$2</a>');

    // Повертаємо код назад
    s = s.replace(/\u0000C(\d+)\u0000/g, (m, i) => `<code>${escapeHtml(codeSpans[+i])}</code>`);

    return s;
  }

  function parseTableRow(line) {
    let l = line.trim();
    if (l.startsWith('|')) l = l.slice(1);
    if (l.endsWith('|')) l = l.slice(0, -1);
    return l.split('|').map(c => c.trim());
  }

  const lines = md.split('\n');
  let out = '';
  let i = 0;

  while (i < lines.length) {
    const line = lines[i].trim();

    // Порожній рядок
    if (!line) { i++; continue; }

    // Горизонтальна лінія
    if (/^(-{3,}|\*{3,}|_{3,})$/.test(line)) {
      out += '<hr class="rm-hr" />';
      i++;
      continue;
    }

    // Заголовок
    const h = line.match(/^(#{1,6})\s+(.+?)\s*#*\s*$/);
    if (h) {
      const level = Math.min(h[1].length, 3);
      out += `<div class="rm-h rm-h${level}">${inline(h[2])}</div>`;
      i++;
      continue;
    }

    // Таблиця
    if (line.startsWith('|') && line.endsWith('|') && i + 1 < lines.length) {
      const sep = lines[i + 1].trim();
      if (/^\|?[\s\-:|]+\|?$/.test(sep) && sep.includes('-')) {
        const header = parseTableRow(line);
        const rows = [];
        i += 2;
        while (i < lines.length) {
          const rl = lines[i].trim();
          if (!rl.startsWith('|') || !rl.endsWith('|')) break;
          rows.push(parseTableRow(rl));
          i++;
        }
        let t = '<table class="rm-table"><thead><tr>';
        header.forEach(c => t += `<th>${inline(c)}</th>`);
        t += '</tr></thead><tbody>';
        rows.forEach(row => {
          t += '<tr>';
          for (let k = 0; k < header.length; k++) {
            t += `<td>${inline(row[k] != null ? row[k] : '')}</td>`;
          }
          t += '</tr>';
        });
        t += '</tbody></table>';
        out += t;
        continue;
      }
    }

    // Цитата
    if (line.startsWith('>')) {
      const buf = [];
      while (i < lines.length && lines[i].trim().startsWith('>')) {
        buf.push(lines[i].trim().replace(/^>\s?/, ''));
        i++;
      }
      out += `<blockquote class="rm-quote">${buf.map(inline).join('<br>')}</blockquote>`;
      continue;
    }

    // Маркований список
    if (/^[-*+]\s+/.test(line)) {
      let list = '<ul class="rm-list">';
      while (i < lines.length) {
        const m = lines[i].trim().match(/^[-*+]\s+(.+)$/);
        if (!m) break;
        list += `<li>${inline(m[1])}</li>`;
        i++;
      }
      list += '</ul>';
      out += list;
      continue;
    }

    // Нумерований список
    if (/^\d+\.\s+/.test(line)) {
      let list = '<ol class="rm-list">';
      while (i < lines.length) {
        const m = lines[i].trim().match(/^\d+\.\s+(.+)$/);
        if (!m) break;
        list += `<li>${inline(m[1])}</li>`;
        i++;
      }
      list += '</ol>';
      out += list;
      continue;
    }

    // Звичайний абзац
    out += `<p class="rm-p">${inline(line)}</p>`;
    i++;
  }

  return out;
}

/* ===== Допоміжне ===== */

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