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

  // Backwards compat: old `font: true` → 115%
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

  // Применяем сразу с новым полем
  await applyA11y({ ...a11y, fontScale });

  // Живой превью при движении слайдера
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

/* ===== Допоміжне ===== */

function highlightButton(selector, attr, value) {
  document.querySelectorAll(`${selector} button`).forEach(btn => {
    btn.classList.toggle('active', btn.getAttribute(attr) === value);
  });
}

let savedTimer;
function showSaved() {
  const note = document.getElementById('saved-note');
  note.classList.add('show');
  clearTimeout(savedTimer);
  savedTimer = setTimeout(() => note.classList.remove('show'), 1200);
}