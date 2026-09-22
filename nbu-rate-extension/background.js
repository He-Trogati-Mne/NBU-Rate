const SOURCES = {
  nbu:    'https://bank.gov.ua/NBUStatService/v1/statdirectory/exchange?json',
  privat: 'https://api.privatbank.ua/p24api/pubinfo?exchange&json&coursid=11',
  mono:   'https://api.monobank.ua/bank/currency'
};

const ALARM_NAME = 'update-rate';
const UPDATE_INTERVAL_MIN = 120;
const MIN_FETCH_GAP_MS    = 30 * 60 * 1000;
const BADGE_EMPTY_COLOR   = '#5f6368';

const ALL_COLORS = [
  { name: 'blue',      hex: '#1a73e8' },
  { name: 'lightblue', hex: '#38bdf8' },
  { name: 'purple',    hex: '#bd93f9' },
  { name: 'brown',     hex: '#8b5a2b' },
  { name: 'green',     hex: '#4ade80' },
  { name: 'red',       hex: '#e11d48' }
];

/* ═══════════════════ Lifecycle ═══════════════════ */
chrome.runtime.onInstalled.addListener(async () => {
  await scheduleUpdates();
  await updateRate();
  await refreshAppearance();
});

chrome.runtime.onStartup.addListener(async () => {
  await scheduleUpdates();
  await updateRate();
  await refreshAppearance();
});

chrome.alarms.onAlarm.addListener(async (a) => {
  if (a.name === ALARM_NAME) {
    await updateRate();
    await refreshAppearance();
  }
});

chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  if (msg && msg.type === 'updateBadge' && Array.isArray(msg.rates)) {
    const usdRate = extractUsd(msg.rates);
    resolveThemeColor().then(({ badgeColor }) => {
      setBadge(
        usdRate == null ? '—' : formatBadgeRate(usdRate),
        usdRate == null ? BADGE_EMPTY_COLOR : badgeColor
      );
    });
    sendResponse({ ok: true });
  }
  return true;
});

chrome.storage.onChanged.addListener(async (changes, area) => {
  if (area === 'sync') {
    if (changes.rateSource) await refreshBadgeFromCache();
    if (changes.theme)      await refreshAppearance();
  }
  if (area === 'local') {
    const { rateSource = 'nbu' } = await chrome.storage.sync.get('rateSource');
    const key = `cachedRates_${rateSource}`;
    if (changes[key])          await refreshBadgeFromCache();
    if (changes.customColors)  await refreshAppearance();
  }
});

async function scheduleUpdates() {
  await chrome.alarms.clear(ALARM_NAME);
  const jitter = Math.floor(Math.random() * 10) - 5;
  chrome.alarms.create(ALARM_NAME, {
    delayInMinutes: Math.max(1, 1 + jitter),
    periodInMinutes: UPDATE_INTERVAL_MIN
  });
}

/* ═══════════════════ Badge text ═══════════════════ */
function formatBadgeRate(v) {
  if (v == null || isNaN(v)) return '—';
  if (v >= 1000) return String(Math.round(v));
  return v.toFixed(2);
}

/* ═══════════════════ USD extraction ═══════════════════ */
function extractUsd(data) {
  if (!Array.isArray(data)) return null;
  for (const item of data) {
    if (!item || typeof item !== 'object') continue;
    const code = item.cc || item.ccy;
    if (code !== 'USD') continue;
    const candidates = [item.sell, item.sale, item.rateSell, item.rate];
    for (const c of candidates) {
      if (c == null) continue;
      const v = typeof c === 'string' ? parseFloat(c) : c;
      if (typeof v === 'number' && !isNaN(v)) return v;
    }
  }
  const mono = data.find(x => x && x.currencyCodeA === 840 && x.currencyCodeB === 980);
  if (mono) {
    const v = mono.rateSell || mono.rateBuy || mono.rateCross;
    if (typeof v === 'number' && !isNaN(v)) return v;
  }
  return null;
}

async function refreshBadgeFromCache() {
  const { rateSource = 'nbu' } = await chrome.storage.sync.get('rateSource');
  const cacheKey = `cachedRates_${rateSource}`;
  const stored = await chrome.storage.local.get(cacheKey);
  const data = stored[cacheKey];

  if (!Array.isArray(data) || data.length === 0) {
    await setBadge('—', BADGE_EMPTY_COLOR);
    await updateRate(true);
    return;
  }

  const usdRate = extractUsd(data);
  const { badgeColor } = await resolveThemeColor();
  await setBadge(
    usdRate == null ? '—' : formatBadgeRate(usdRate),
    usdRate == null ? BADGE_EMPTY_COLOR : badgeColor
  );
}

async function updateRate(force = false) {
  try {
    const { rateSource = 'nbu' } = await chrome.storage.sync.get('rateSource');
    const atKey = `cachedAt_${rateSource}`;
    const stored = await chrome.storage.local.get(atKey);
    const last = stored[atKey] || 0;
    if (!force && Date.now() - last < MIN_FETCH_GAP_MS) return;

    const url = SOURCES[rateSource] || SOURCES.nbu;
    const response = await fetch(url, { cache: 'no-store' });

    // 429 — не ошибка. Молча ждём 30 минут, чтобы не долбить API.
    if (response.status === 429) {
      await chrome.storage.local.set({ [atKey]: Date.now() });
      return;
    }
    if (!response.ok) throw new Error('HTTP ' + response.status);

    const data = await response.json();
    await chrome.storage.local.set({
      [`cachedRates_${rateSource}`]: data,
      [`cachedAt_${rateSource}`]: Date.now()
    });

    const usdRate = extractUsd(data);
    const { badgeColor } = await resolveThemeColor();
    await setBadge(
      usdRate == null ? '—' : formatBadgeRate(usdRate),
      usdRate == null ? BADGE_EMPTY_COLOR : badgeColor
    );
  } catch (err) {
    try {
      const { rateSource = 'nbu' } = await chrome.storage.sync.get('rateSource');
      const cacheKey = `cachedRates_${rateSource}`;
      const stored = await chrome.storage.local.get(cacheKey);
      const data = stored[cacheKey];
      if (!Array.isArray(data) || data.length === 0) {
        await setBadge('—', BADGE_EMPTY_COLOR);
      }
    } catch (e) {}
  }
}

async function setBadge(text, color) {
  try {
    await chrome.action.setBadgeText({ text: String(text) });
    await chrome.action.setBadgeBackgroundColor({ color });
    if (chrome.action.setBadgeTextColor) {
      const bg = hexToRgb(color);
      const lum = bg ? (0.299 * bg.r + 0.587 * bg.g + 0.114 * bg.b) / 255 : 0.5;
      const textColor = lum > 0.55 ? '#000000' : '#ffffff';
      await chrome.action.setBadgeTextColor({ color: textColor });
    }
  } catch (e) {}
}

/* ═══════════════════ Color helpers ═══════════════════ */
function hexToRgb(hex) {
  if (!hex) return null;
  const m = String(hex).replace('#', '').trim();
  const full = m.length === 3 ? m.split('').map(c => c + c).join('') : m;
  if (full.length !== 6 || !/^[0-9a-f]{6}$/i.test(full)) return null;
  const num = parseInt(full, 16);
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

function badgeColorFromAccent(accent) {
  if (!hexToRgb(accent)) return '#1a73e8';
  const lum = luminance(accent);
  if (lum > 0.65) return mixHex(accent, '#000000', 0.35);
  return accent;
}

function pickColorName(accent) {
  const c = hexToRgb(accent);
  if (!c) return 'blue';
  let best = 'blue';
  let bestD = Infinity;
  for (const p of ALL_COLORS) {
    const pc = hexToRgb(p.hex);
    if (!pc) continue;
    const d = (pc.r - c.r) ** 2 + (pc.g - c.g) ** 2 + (pc.b - c.b) ** 2;
    if (d < bestD) { bestD = d; best = p.name; }
  }
  return best;
}

async function resolveThemeColor() {
  const { theme = 'system' } = await chrome.storage.sync.get('theme');

  if (theme === 'custom') {
    const { customColors } = await chrome.storage.local.get('customColors');
    const accent = (customColors && customColors.accent) || '#1a73e8';
    const colorName = pickColorName(accent);
    return {
      colorName,
      accent,
      badgeColor: badgeColorFromAccent(accent)
    };
  }

  return {
    colorName: 'blue',
    accent: '#1a73e8',
    badgeColor: '#1a73e8'
  };
}

/* ═══════════════════ Icon generation ═══════════════════ */
async function loadImageData(relPath) {
  try {
    const url = chrome.runtime.getURL(relPath);
    const res = await fetch(url, { cache: 'force-cache' });
    if (!res.ok) return null;
    const blob = await res.blob();
    const bitmap = await createImageBitmap(blob);
    const canvas = new OffscreenCanvas(bitmap.width, bitmap.height);
    const ctx = canvas.getContext('2d');
    ctx.drawImage(bitmap, 0, 0);
    const data = ctx.getImageData(0, 0, bitmap.width, bitmap.height);
    bitmap.close?.();
    return data;
  } catch (e) {
    return null;
  }
}

async function tryLoadIconSetFromFiles(colorName) {
  if (colorName === 'blue') {
    const [d16, d32, d48, d128] = await Promise.all([
      loadImageData('icon16.png'),
      loadImageData('icon32.png'),
      loadImageData('icon48.png'),
      loadImageData('icon128.png')
    ]);
    if (d16 && d32 && d48 && d128) {
      return { 16: d16, 32: d32, 48: d48, 128: d128 };
    }
    return null;
  }

  const [d16, d32, d48, d128] = await Promise.all([
    loadImageData(`color-fvcn/${colorName}16.png`),
    loadImageData(`color-fvcn/${colorName}32.png`),
    loadImageData(`color-fvcn/${colorName}48.png`),
    loadImageData(`color-fvcn/${colorName}128.png`)
  ]);
  if (d16 && d32 && d48 && d128) {
    return { 16: d16, 32: d32, 48: d48, 128: d128 };
  }
  return null;
}

function drawHryvnia(ctx, size) {
  ctx.fillStyle = '#ffffff';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';

  const fontSize = Math.round(size * 0.65);
  ctx.font = `bold ${fontSize}px Arial, Helvetica, sans-serif`;

  ctx.fillText('₴', size / 2.2, size / 2 + size * 0.02);
}

function darkenHex(hex, amt) {
  const c = hexToRgb(hex);
  if (!c) return hex;
  const r = Math.max(0, Math.round(c.r * (1 - amt)));
  const g = Math.max(0, Math.round(c.g * (1 - amt)));
  const b = Math.max(0, Math.round(c.b * (1 - amt)));
  return '#' + [r, g, b].map(v => v.toString(16).padStart(2, '0')).join('');
}

function generateIcon(size, accent) {
  const canvas = new OffscreenCanvas(size, size);
  const ctx = canvas.getContext('2d');

  const r = Math.round(size * 0.22);
  ctx.beginPath();
  ctx.moveTo(r, 0);
  ctx.lineTo(size - r, 0);
  ctx.arcTo(size, 0, size, r, r);
  ctx.lineTo(size, size - r);
  ctx.arcTo(size, size, size - r, size, r);
  ctx.lineTo(r, size);
  ctx.arcTo(0, size, 0, size - r, r);
  ctx.lineTo(0, r);
  ctx.arcTo(0, 0, r, 0, r);
  ctx.closePath();

  const dark = darkenHex(accent, 0.4);
  const grad = ctx.createLinearGradient(0, 0, size, size);
  grad.addColorStop(0, accent);
  grad.addColorStop(1, dark);
  ctx.fillStyle = grad;
  ctx.fill();

  drawHryvnia(ctx, size);

  return ctx.getImageData(0, 0, size, size);
}

async function refreshAppearance() {
  try {
    const { colorName, accent, badgeColor } = await resolveThemeColor();

    let iconSet = await tryLoadIconSetFromFiles(colorName);

    if (!iconSet) {
      iconSet = {
        16:  generateIcon(16,  accent),
        32:  generateIcon(32,  accent),
        48:  generateIcon(48,  accent),
        128: generateIcon(128, accent)
      };
    }

    await chrome.action.setIcon({ imageData: iconSet });

    try {
      await chrome.action.setBadgeBackgroundColor({ color: badgeColor });
    } catch (e) {}

  } catch (e) {
    console.warn('[NBU Rate] refreshAppearance failed:', e);
  }
}