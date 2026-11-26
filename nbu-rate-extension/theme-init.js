(function () {
  try {
    var t = localStorage.getItem('theme');
    if (t) {
      var r = t;
      if (t === 'system') {
        r = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
      }
      if (t === 'custom') {
        var raw = localStorage.getItem('customColors');
        var c = {};
        try { c = raw ? JSON.parse(raw) : {}; } catch (e) {}
        var bg = c.bg || '#1a1a1a';
        var h = String(bg).replace('#', '');
        if (h.length === 3) h = h.split('').map(function (x) { return x + x; }).join('');
        var n = parseInt(h, 16);
        var lum = ((n >> 16 & 255) * 0.299 + (n >> 8 & 255) * 0.587 + (n & 255) * 0.114) / 255;
        r = lum < 0.5 ? 'dark' : 'light';
      }
      document.documentElement.setAttribute('data-theme', r);
    }
  } catch (e) {}

  setTimeout(function () {
    document.documentElement.classList.add('app-ready');
  }, 4000);
})();