// Anti-flicker: runs synchronously (no defer) — sets data-theme before first paint
(function () {
  var t = localStorage.getItem('atlas-theme');
  if (t === 'dark' || (!t && window.matchMedia('(prefers-color-scheme: dark)').matches))
    document.documentElement.setAttribute('data-theme', 'dark');
})();

// Button injection + toggle — runs after DOM is ready
document.addEventListener('DOMContentLoaded', function () {
  // Inject button into nav on pages that don't already have it (index.html has it inline)
  if (!document.getElementById('theme-toggle')) {
    var navRight = document.querySelector('.nav-right');
    if (navRight) {
      var btn = document.createElement('button');
      btn.id = 'theme-toggle';
      btn.className = 'nav-theme-btn';
      btn.setAttribute('aria-label', 'Toggle dark mode');
      btn.title = 'Toggle dark mode';
      btn.innerHTML =
        '<svg id="theme-icon-moon" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>' +
        '<svg id="theme-icon-sun" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/></svg>';
      // Insert before the "View Map" CTA
      var cta = navRight.querySelector('.nav-map');
      navRight.insertBefore(btn, cta || null);
    }
  }

  // Wire click handler (works for both index.html's inline button and injected button)
  var toggle = document.getElementById('theme-toggle');
  if (toggle) {
    toggle.addEventListener('click', function () {
      var isDark = document.documentElement.getAttribute('data-theme') === 'dark';
      document.documentElement.setAttribute('data-theme', isDark ? 'light' : 'dark');
      localStorage.setItem('atlas-theme', isDark ? 'light' : 'dark');
    });
  }
});
