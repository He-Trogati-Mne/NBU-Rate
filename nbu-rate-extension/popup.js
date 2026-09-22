const DEFAULT_SELECTED = ['USD', 'EUR', 'GBP', 'PLN', 'CNY'];
const AUTO_REFRESH_MS = 30 * 60 * 1000;
const MIN_FETCH_GAP_MS = 30 * 60 * 1000;
const DELTA_THRESHOLD = 0.005;
const HISTORY_KEY = 'ratesHistory';
const HISTORY_KEEP_DAYS = 30;

let currentLang = 'uk';
let currentSource = 'nbu';

document.addEventListener('DOMContentLoaded', async () => {
  currentLang = await getLanguage();
  applyTranslations(currentLang);

  const { theme = 'system' } = await chrome.storage.sync.get('theme');
  await applyThemeValue(theme);

  const { classicDesign = false } = await chrome.storage.sync.get('classicDesign');
  document.body.classList.toggle('classic-mode', classicDesign);

  await applyA11y(await getA11y());

  const { rateSource = 'nbu' } = await chrome.storage.sync.get('rateSource');
  currentSource = rateSource;
  highlightSource();

  document.querySelectorAll('#source-switch button').forEach(btn => {
    btn.addEventListener('click', async () => {
      currentSource = btn.dataset.source;
      highlightSource();
      try { await chrome.storage.sync.set({ rateSource: currentSource }); } catch (e) {}
      fetchRates(true);
    });
  });

  await fetchRates();

  document.getElementById('open-settings').addEventListener('click', () => {
    if (chrome.runtime.openOptionsPage) chrome.runtime.openOptionsPage();
    else window.open(chrome.runtime.getURL('options.html'));
  });

  setInterval(() => fetchRates(true), AUTO_REFRESH_MS);

  chrome.storage.onChanged.addListener(async (changes, area) => {
    if (area === 'sync') {
      if (changes.theme) await applyThemeValue(changes.theme.newValue);
      if (changes.currencies) fetchRates(true);
      if (changes.showPreciseRate) fetchRates(true);
      if (changes.classicDesign) {
        document.body.classList.toggle('classic-mode', !!changes.classicDesign.newValue);
        fetchRates(true);
      }
      if (changes.rateSource) {
        currentSource = changes.rateSource.newValue || 'nbu';
        highlightSource();
        fetchRates(true);
      }
      if (changes.language) {
        currentLang = changes.language.newValue;
        applyTranslations(currentLang);
        fetchRates(true);
      }
      if (changes.a11y) await applyA11y(changes.a11y.newValue);
    }
    if (area === 'local' && changes.customColors) {
      const { theme } = await chrome.storage.sync.get('theme');
      if (theme === 'custom') applyCustomColors(changes.customColors.newValue);
    }
  });
});

function highlightSource() {
  document.querySelectorAll('#source-switch button').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.source === currentSource);
  });
}

async function loadHistory() {
  try {
    const { [HISTORY_KEY]: h = {} } = await chrome.storage.local.get(HISTORY_KEY);
    return h || {};
  } catch (e) { return {}; }
}

function toISODate(dateStr) {
  if (!dateStr) return null;
  const m = /^(\d{2})\.(\d{2})\.(\d{4})$/.exec(dateStr);
  if (m) return `${m[3]}-${m[2]}-${m[1]}`;

  const d = new Date(dateStr);
  if (!isNaN(d)) {
    const pad = n => String(n).padStart(2, '0');
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
  }
  return dateStr;
}

async function saveToday(todayDate, rates) {
  if (!todayDate) return;
  const key = toISODate(todayDate);
  if (!key) return;

  const history = await loadHistory();
  history[key] = {};
  rates.forEach(r => {
    if (r && r.rate != null && r.cc) history[key][r.cc] = r.rate;
  });
  const sorted = Object.keys(history).sort();
  while (sorted.length > HISTORY_KEEP_DAYS) delete history[sorted.shift()];
  await chrome.storage.local.set({ [HISTORY_KEY]: history });
}

function getPreviousRates(history, todayDate) {
  if (!todayDate) return {};
  const todayKey = toISODate(todayDate);
  if (!todayKey) return {};
  const prevDates = Object.keys(history)
    .filter(d => d < todayKey)
    .sort();
  const prevDate = prevDates[prevDates.length - 1];
  return prevDate ? history[prevDate] : {};
}

function isValidRates(rates) {
  return Array.isArray(rates) &&
         rates.length > 0 &&
         rates.some(item => item && typeof item === 'object' && typeof item.cc === 'string' && item.cc);
}

async function fetchRates(force = false) {
  const content = document.getElementById('content');
  const updatedEl = document.getElementById('updated');

  const { currencies = DEFAULT_SELECTED } = await chrome.storage.sync.get('currencies');
  const selected = (Array.isArray(currencies) && currencies.length) ? currencies : DEFAULT_SELECTED;

  const cacheKey = `cachedRates_${currentSource}`;
  const atKey    = `cachedAt_${currentSource}`;
  const cache    = await chrome.storage.local.get([cacheKey, atKey]);

  const cachedRates = cache[cacheKey];
  const cacheGood = isValidRates(cachedRates);

  if (cachedRates !== undefined && !cacheGood) {
    try { await chrome.storage.local.remove([cacheKey, atKey]); } catch (e) {}
  }

  let rendered = 0;

  if (cacheGood) {
    rendered = await renderRates(cachedRates, selected, content, updatedEl);
  }

  const needFetch = force || !cacheGood || rendered === 0;

  if (!needFetch) {
    const lastFetch = cache[atKey] || 0;
    if (Date.now() - lastFetch < MIN_FETCH_GAP_MS) return;
  } else {
    // Даже при "force" не чаще раза в 5 минут
    const lastFetch = cache[atKey] || 0;
    if (Date.now() - lastFetch < 5 * 60 * 1000 && cacheGood) return;
  }

  if (!cacheGood && !cache[cacheKey]) {
    content.innerHTML = `<div class="loader">${t('loading', currentLang)}</div>`;
    updatedEl.textContent = '';
  }

  try {
    const rates = await fetchFromSource(currentSource, currentLang);
    if (!isValidRates(rates)) throw new Error('Empty response');

    rendered = await renderRates(rates, selected, content, updatedEl);
    await chrome.storage.local.set({
      [cacheKey]: rates,
      [atKey]: Date.now()
    });
  } catch (err) {
    // 429 — это не ошибка, а просьба «сбавь темп».
    // Ничего не показываем, не логируем, ставим паузу.
    if (err && err.rateLimited) {
      try {
        await chrome.storage.local.set({ [atKey]: Date.now() });
      } catch (e) {}

      if (rendered === 0 && !cacheGood) {
        content.innerHTML =
          `<div class="error">${t('error_no_data', currentLang)}</div>`;
      }
      return;
    }

    if (rendered === 0) {
      content.innerHTML =
        `<div class="error">${t('error_loading', currentLang)}: ${err.message}</div>`;
    }
    console.warn('[Курс НБУ] API:', err.message);
  }
}

async function renderRates(rates, selected, content, updatedEl) {
  const safeRates = (Array.isArray(rates) ? rates : []).filter(
    item => item && typeof item === 'object' && typeof item.cc === 'string' && item.cc
  );

  let filtered = safeRates
    .filter(item => selected.includes(item.cc))
    .sort((a, b) => selected.indexOf(a.cc) - selected.indexOf(b.cc));

  if (filtered.length === 0) {
    const PRIORITY = ['USD','EUR','GBP','PLN','CNY','CHF','JPY'];
    filtered = safeRates.slice().sort((a, b) => {
      const ai = PRIORITY.indexOf(a.cc);
      const bi = PRIORITY.indexOf(b.cc);
      if (ai === -1 && bi === -1) {
        return String(a.cc || '').localeCompare(String(b.cc || ''));
      }
      if (ai === -1) return 1;
      if (bi === -1) return -1;
      return ai - bi;
    });
  }

  if (filtered.length === 0) {
    const msg = currentSource === 'mono'
      ? t('error_mono_empty', currentLang)
      : t('error_no_data', currentLang);
    content.innerHTML = `<div class="error">${msg}</div>`;
    return 0;
  }

  const { showPreciseRate = false } = await chrome.storage.sync.get('showPreciseRate');
  const decimals = showPreciseRate ? 4 : 2;

  const isNBU = currentSource === 'nbu';
  const todayDate = safeRates.find(r => r.date)?.date || null;

  const history = isNBU ? await loadHistory() : {};
  const prevRates = isNBU ? getPreviousRates(history, todayDate) : {};

  let html = '';
  let lastDate = null;

  filtered.forEach(item => {
    const name = item.name || t(item.cc, currentLang) || item.cc;
    const hasBS = item.hasBuySell && (item.buy != null || item.sell != null);

    let direction = 'flat';
    let delta = null;
    const value = hasBS ? (item.buy ?? item.sell ?? item.rate) : item.rate;

    if (value != null && !hasBS && isNBU) {
      const prev = prevRates[item.cc];
      delta = prev != null ? value - prev : null;
      if (delta != null) {
        if (delta > DELTA_THRESHOLD) direction = 'up';
        else if (delta < -DELTA_THRESHOLD) direction = 'down';
        else { direction = 'flat'; delta = 0; }
      }
    }

    const showBadge = isNBU && !hasBS && delta != null && direction !== 'flat';

    let valueHtml = '';
    let rowClass = '';

    if (hasBS) {
      rowClass = 'with-bs';
      const buyStr  = item.buy  != null ? item.buy.toFixed(decimals)  : '—';
      const sellStr = item.sell != null ? item.sell.toFixed(decimals) : '—';
      valueHtml = `
        <div class="bs-cell">
          <span class="bs-label">${t('buy_label', currentLang)}</span>
          <span class="bs-val buy">${buyStr}</span>
        </div>
        <div class="bs-cell">
          <span class="bs-label">${t('sell_label', currentLang)}</span>
          <span class="bs-val sell">${sellStr}</span>
        </div>
      `;
    } else {
      const rateStr = item.rate != null ? item.rate.toFixed(decimals) : '—';
      const rateClass = direction === 'up' ? 'up' : direction === 'down' ? 'down' : 'flat';
      valueHtml = `
        <div class="rate-right">
          <span class="rate-value ${rateClass}">${rateStr} ₴</span>
          ${showBadge ? changeBadge(direction, delta) : ''}
        </div>
      `;
    }

    html += `
      <div class="rate-row ${rowClass}">
        <div class="flag-wrapper">${flagHtml(item.cc, 62)}</div>
        <span class="currency-code">${item.cc}</span>
        <span class="currency-name">${name}</span>
        ${valueHtml}
      </div>
    `;
    if (item.date && !lastDate) lastDate = item.date;
  });

  content.innerHTML = html;
  attachImgFallbacks(content);

  if (isNBU && todayDate) await saveToday(todayDate, safeRates);

  const srcLabel = {
    nbu:    t('updated_on_nbu',    currentLang),
    privat: t('updated_on_privat', currentLang),
    mono:   t('updated_on_mono',   currentLang)
  }[currentSource] || t('updated_on', currentLang);

  const dateStr = lastDate || new Date().toLocaleDateString('uk-UA');
  updatedEl.textContent = `${srcLabel} ${dateStr}`;

  try {
    chrome.runtime.sendMessage({
      type: 'updateBadge',
      source: currentSource,
      rates: safeRates
    });
  } catch (e) {}

  return filtered.length;
}