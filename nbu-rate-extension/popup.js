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

  await applyPopupDesign();

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

  fetchRates();

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
      if (changes.popupDesign || changes.classicDesign) {
        await applyPopupDesign();
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

async function applyPopupDesign() {
  const s=await chrome.storage.sync.get(['popupDesign','classicDesign']);
  const mode=['modern','legacy','classic'].includes(s.popupDesign)?s.popupDesign:(s.classicDesign?'classic':'modern');
  document.body.dataset.design=mode;
  document.body.classList.toggle('classic-mode',mode==='classic');
  document.body.classList.toggle('legacy-mode',mode==='legacy');
}

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

let renderGeneration = 0;
async function fetchRates() {
  const gen = ++renderGeneration;
  const source = currentSource;
  const lang = currentLang;
  const content = document.getElementById('content');
  const updatedEl = document.getElementById('updated');
  const {currencies = DEFAULT_SELECTED} = await chrome.storage.sync.get('currencies');
  const selected = Array.isArray(currencies) && currencies.length ? currencies : DEFAULT_SELECTED;
  const snapshot = await rateSnapshot(source, lang);
  if (gen !== renderGeneration || source !== currentSource) return;
  if (!snapshot.rates.length) { content.textContent = t('error_no_data', lang); updatedEl.textContent = ''; return; }
  await renderRates(snapshot.rates, selected, content, updatedEl, gen);
  if (gen !== renderGeneration) return;
  const locale = lang === 'uk' ? 'uk-UA' : 'en-GB';
  const date = snapshot.at ? new Date(snapshot.at).toLocaleString(locale) : '—';
  updatedEl.textContent += ` · ${lang === 'uk' ? 'Дані отримано' : 'Fetched'}: ${date}${snapshot.stale ? (lang === 'uk' ? ' · кеш' : ' · cached') : ''}`;
}

async function renderRates(rates, selected, content, updatedEl, gen) {
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

  const { showPreciseRate = true } = await chrome.storage.sync.get('showPreciseRate');
  const decimals = showPreciseRate ? 4 : 2;

  const isNBU = currentSource === 'nbu';
  const todayDate = safeRates.find(r => r.date)?.date || null;

  const history = isNBU ? await loadHistory() : {};
  const prevRates = isNBU ? getPreviousRates(history, todayDate) : {};

  const formatRate = n => Number.isFinite(n) ? new Intl.NumberFormat(currentLang === 'uk' ? 'uk-UA' : 'en-GB', {minimumFractionDigits:decimals,maximumFractionDigits:decimals}).format(n) : '—';
  let lastDate = null;

  const entries = filtered.map(item => {
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
    if (item.date && !lastDate) lastDate = item.date;

    return { item, name, hasBS, direction, delta, value, showBadge };
  });

  const rowHtml = entry => {
    const { item, name, hasBS, direction, delta, showBadge } = entry;
    let valueHtml = '';
    let rowClass = '';

    if (hasBS) {
      rowClass = 'with-bs';
      const buyStr  = item.buy  != null ? formatRate(item.buy)  : '—';
      const sellStr = item.sell != null ? formatRate(item.sell) : '—';
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
      const rateStr = item.rate != null ? formatRate(item.rate) : '—';
      const rateClass = direction === 'up' ? 'up' : direction === 'down' ? 'down' : 'flat';
      valueHtml = `
        <div class="rate-right">
          <span class="rate-value ${rateClass}">${rateStr} ₴</span>
          ${showBadge ? changeBadge(direction, delta) : ''}
        </div>
      `;
    }

    return `
      <div class="rate-row ${rowClass}">
        <div class="flag-wrapper">${flagHtml(item.cc, 62)}</div>
        <span class="currency-code">${item.cc}</span>
        <span class="currency-name">${name}</span>
        ${valueHtml}
      </div>
    `;
  };

  const quickHint = currentLang === 'uk' ? 'Швидкий огляд вибраних валют' : 'Quick view of selected currencies';
  const oneUnitText = cc => currentLang === 'uk' ? `1 ${cc} у гривнях` : `1 ${cc} in hryvnia`;

  const mainCardHtml = entry => {
    const { item, hasBS, direction, delta, showBadge } = entry;
    if (hasBS) {
      const buyStr  = item.buy  != null ? formatRate(item.buy)  : '—';
      const sellStr = item.sell != null ? formatRate(item.sell) : '—';
      return `
        <div class="showcase-main-card">
          <div class="showcase-main-head">
            <div>
              <div class="showcase-kicker">${item.cc} / UAH</div>
              <div class="showcase-main-title">${currentLang === 'uk' ? 'Швидкий курс' : 'Quick rate'}</div>
            </div>
            <div class="showcase-main-icon">₴</div>
          </div>
          <div class="showcase-bs-grid">
            <div class="showcase-bs-cell">
              <span class="showcase-bs-label">${t('buy_label', currentLang)}</span>
              <strong class="showcase-bs-value">${buyStr} ₴</strong>
            </div>
            <div class="showcase-bs-cell">
              <span class="showcase-bs-label">${t('sell_label', currentLang)}</span>
              <strong class="showcase-bs-value alt">${sellStr} ₴</strong>
            </div>
          </div>
        </div>
      `;
    }
    const rateStr = item.rate != null ? formatRate(item.rate) : '—';
    return `
      <div class="showcase-main-card">
        <div class="showcase-main-head">
          <div>
            <div class="showcase-kicker">${item.cc} / UAH</div>
            <div class="showcase-main-title">${isNBU ? (currentLang === 'uk' ? 'Офіційний курс НБУ' : 'Official NBU rate') : (currentLang === 'uk' ? 'Курс банку' : 'Bank rate')}</div>
          </div>
          <div class="showcase-main-icon">₴</div>
        </div>
        <div class="showcase-main-rate">${rateStr} ₴</div>
        <div class="showcase-main-sub">${oneUnitText(item.cc)}</div>
        ${showBadge ? `<div class="showcase-main-badge">${changeBadge(direction, delta)}</div>` : ''}
      </div>
    `;
  };

  const miniCardHtml = entry => {
    const { item, name, hasBS, direction, delta, showBadge } = entry;
    const valueHtml = hasBS
      ? `<div class="showcase-mini-dual"><span>${t('buy_label', currentLang)} ${item.buy != null ? formatRate(item.buy) : '—'}</span><span>${t('sell_label', currentLang)} ${item.sell != null ? formatRate(item.sell) : '—'}</span></div>`
      : `<div class="showcase-mini-rate">${item.rate != null ? formatRate(item.rate) : '—'} ₴</div>${showBadge ? `<div class="mini-change">${changeBadge(direction,delta)}</div>` : ''}`;

    return `
      <div class="showcase-mini-card">
        <div class="showcase-mini-top">
          <div class="showcase-mini-flag">${flagHtml(item.cc, 24)}</div>
          <div class="showcase-mini-meta">
            <div class="showcase-mini-code">${item.cc}</div>
            <div class="showcase-mini-name">${name}</div>
          </div>
        </div>
        ${valueHtml}
      </div>
    `;
  };

  let html = '';
  if (document.body.classList.contains('classic-mode') || document.body.classList.contains('legacy-mode')) {
    html = entries.map(rowHtml).join('');
  } else if (entries.length) {
    const main = entries.find(e => e.item.cc === 'USD') || entries[0];
    const rest = entries.filter(e => e !== main);
    const preferred = ['EUR','PLN'];
    const mini = [...preferred.map(cc => rest.find(e => e.item.cc === cc)).filter(Boolean), ...rest.filter(e => !preferred.includes(e.item.cc))];
    html = `<section class="showcase-shell">${mainCardHtml(main)}${mini.length ? `<div class="showcase-mini-grid">${mini.map(miniCardHtml).join('')}</div>` : ''}</section>`;
  }

  if (!html) {
    html = `<div class="error">${t('error_no_data', currentLang)}</div>`;
  }

  if (gen !== renderGeneration) return 0;
  content.innerHTML = html;
  attachImgFallbacks(content);

  if (isNBU && todayDate) await saveToday(todayDate, safeRates);
  if (gen !== renderGeneration) return 0;

  
  const srcLabel = {
    nbu:    t('updated_on_nbu',    currentLang),
    privat: t('updated_on_privat', currentLang),
    mono:   t('updated_on_mono',   currentLang)
  }[currentSource] || t('updated_on', currentLang);

  const dateStr = lastDate || '—';
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