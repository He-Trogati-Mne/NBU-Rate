const API_URL = 'https://bank.gov.ua/NBUStatService/v1/statdirectory/exchange?json';
const ALARM_NAME = 'update-rate';
const UPDATE_INTERVAL_MIN = 60;

chrome.runtime.onInstalled.addListener(async () => {
  await scheduleUpdates();
  await updateRate();
});

chrome.runtime.onStartup.addListener(async () => {
  await scheduleUpdates();
  await updateRate();
});

chrome.alarms.onAlarm.addListener(alarm => {
  if (alarm.name === ALARM_NAME) updateRate();
});

chrome.storage.onChanged.addListener(async (changes, area) => {
  if (area === 'sync' && changes.currencies) {
    await updateRate();
  }
});

async function scheduleUpdates() {
  await chrome.alarms.clear(ALARM_NAME);
  chrome.alarms.create(ALARM_NAME, {
    delayInMinutes: 1,
    periodInMinutes: UPDATE_INTERVAL_MIN
  });
}

async function updateRate() {
  try {
    const response = await fetch(API_URL, { cache: 'no-store' });
    if (!response.ok) throw new Error('HTTP ' + response.status);
    const data = await response.json();

    const { badgeCurrency = 'USD' } = await chrome.storage.sync.get('badgeCurrency');
    const item = data.find(x => x.cc === badgeCurrency);

    if (!item) {
      await setBadge('—', '#5f6368');
    } else {
      const value = item.rate.toFixed(2);
      const color = pickBadgeColor(item.rate);
      await setBadge(value, color);
    }

    await chrome.storage.local.set({
      cachedRates: data,
      cachedAt: Date.now()
    });
  } catch (err) {
    console.warn('[Курс НБУ] Не вдалось оновити курс:', err);
    await setBadge('!', '#d93025');
  }
}

async function setBadge(text, color) {
  try {
    await chrome.action.setBadgeText({ text: String(text) });
    await chrome.action.setBadgeBackgroundColor({ color });
    if (chrome.action.setBadgeTextColor) {
      await chrome.action.setBadgeTextColor({ color: '#ffffff' });
    }
  } catch (e) { /* ignore */ }
}

function pickBadgeColor(rate) {
  if (rate < 30) return '#188038';
  if (rate < 45) return '#1a73e8';
  if (rate < 60) return '#f9ab00';
  return '#d93025';
}