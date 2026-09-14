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
    renderRates(cachedRates, selected, content, updatedEl);
  }

  try {
    const response = await fetch(API_URL, { cache: 'no-store' });
    if (!response.ok) throw new Error(t('error_network', currentLang));
    const data = await response.json();

    renderRates(data, selected, content, updatedEl);
    await chrome.storage.local.set({ cachedRates: data, cachedAt: Date.now() });
  } catch (err) {
    if (!Array.isArray(cachedRates) || !cachedRates.length) {
      content.innerHTML =
        `<div class="error">${t('error_loading', currentLang)}: ${err.message}</div>`;
    }
    console.error(err);
  }
}

function renderRates(data, selected, content, updatedEl) {
  const rates = data.filter(item => selected.includes(item.cc));
  rates.sort((a, b) => selected.indexOf(a.cc) - selected.indexOf(b.cc));

  if (rates.length === 0) {
    content.innerHTML = `<div class="error">${t('error_no_data', currentLang)}</div>`;
    return;
  }

  let html = '';
  rates.forEach(item => {
    const name = t(item.cc, currentLang) || item.txt;
    html += `
      <div class="rate-row">
        ${flagHtml(item.cc)}
        <span class="currency-code">${item.cc}</span>
        <span class="currency-name">${name}</span>
        <span class="rate-value">${item.rate.toFixed(4)} ₴</span>
      </div>
    `;
  });
  content.innerHTML = html;

  if (rates[0]?.exchangedate) {
    updatedEl.textContent = `${t('updated_on', currentLang)} ${rates[0].exchangedate}`;
  }
}