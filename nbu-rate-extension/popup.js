const API_URL = 'https://bank.gov.ua/NBUStatService/v1/statdirectory/exchange?json';
const DEFAULT_SELECTED = ['USD', 'EUR', 'GBP', 'PLN', 'CNY'];

let currentLang = 'uk';

document.addEventListener('DOMContentLoaded', async () => {
  currentLang = await getLanguage();
  applyTranslations(currentLang);

  let theme = 'system';
  try {
    const stored = await chrome.storage.sync.get('theme');
    theme = stored.theme || 'system';
  } catch (e) { /* ignore */ }
  await applyThemeValue(theme);

  await applyA11y(await getA11y());
  await fetchRates();

  document.getElementById('open-settings').addEventListener('click', () => {
    if (chrome.runtime.openOptionsPage) {
      chrome.runtime.openOptionsPage();
    } else {
      window.open(chrome.runtime.getURL('options.html'));
    }
  });

  chrome.storage.onChanged.addListener(async (changes, area) => {
    if (area === 'sync') {
      if (changes.theme) await applyThemeValue(changes.theme.newValue);
      if (changes.currencies) fetchRates();
      if (changes.language) {
        currentLang = changes.language.newValue;
        applyTranslations(currentLang);
        fetchRates();
      }
      if (changes.a11y) await applyA11y(changes.a11y.newValue);
    }
    if (area === 'local' && changes.customColors) {
      const { theme } = await chrome.storage.sync.get('theme');
      if (theme === 'custom') {
        applyCustomColors(changes.customColors.newValue);
      }
    }
  });
});

async function fetchRates() {
  const content = document.getElementById('content');
  const updatedEl = document.getElementById('updated');

  const { currencies = DEFAULT_SELECTED } = await chrome.storage.sync.get('currencies');
  const selected = currencies.length ? currencies : DEFAULT_SELECTED;

  content.innerHTML = `<div class="loader">${t('loading', currentLang)}</div>`;
  updatedEl.textContent = '';

  const { cachedRates } = await chrome.storage.local.get('cachedRates');
  if (Array.isArray(cachedRates) && cachedRates.length) {
    await renderRates(cachedRates, selected, content, updatedEl);
  }

  try {
    const response = await fetch(API_URL, { cache: 'no-store' });
    if (!response.ok) throw new Error(t('error_network', currentLang));
    const data = await response.json();

    await renderRates(data, selected, content, updatedEl);
    await chrome.storage.local.set({ cachedRates: data, cachedAt: Date.now() });
  } catch (err) {
    if (!Array.isArray(cachedRates) || !cachedRates.length) {
      content.innerHTML =
        `<div class="error">${t('error_loading', currentLang)}: ${err.message}</div>`;
    }
    console.error(err);
  }
}

async function renderRates(data, selected, content, updatedEl) {
  const rates = data.filter(item => selected.includes(item.cc));
  rates.sort((a, b) => selected.indexOf(a.cc) - selected.indexOf(b.cc));

  if (rates.length === 0) {
    content.innerHTML = `<div class="error">${t('error_no_data', currentLang)}</div>`;
    return;
  }

  const { prevRates = {} } = await chrome.storage.local.get('prevRates');
  const newPrevRates = {};

  let html = '';
  rates.forEach(item => {
    const name = t(item.cc, currentLang) || item.txt;
    const prev = prevRates[item.cc];
    const delta = prev != null ? item.rate - prev : null;
    let direction = 'flat';
    if (delta != null) {
      if (delta > 0.001) direction = 'up';
      else if (delta < -0.001) direction = 'down';
    }
    newPrevRates[item.cc] = item.rate;

    const showBadge = delta != null && Math.abs(delta) > 0.001;

    html += `
      <div class="rate-row">
        ${flagHtml(item.cc)}
        <span class="currency-code">${item.cc}</span>
        <span class="currency-name">${name}</span>
        <span class="rate-value">${item.rate.toFixed(4)} ₴</span>
        ${showBadge ? changeBadge(direction, delta) : '<span></span>'}
      </div>
    `;
  });
  content.innerHTML = html;

  await chrome.storage.local.set({ prevRates: newPrevRates });

  if (rates[0]?.exchangedate) {
    updatedEl.textContent = `${t('updated_on', currentLang)} ${rates[0].exchangedate}`;
  }
}