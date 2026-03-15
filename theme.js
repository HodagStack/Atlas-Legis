// Anti-flicker: runs synchronously (no defer) — sets data-theme before first paint
(function () {
  var t = localStorage.getItem('atlas-theme');
  if (t === 'dark' || (!t && window.matchMedia('(prefers-color-scheme: dark)').matches))
    document.documentElement.setAttribute('data-theme', 'dark');
})();

// Button injection + toggle — runs after DOM is ready
document.addEventListener('DOMContentLoaded', function () {

  // ── Inject dark mode toggle button ──────────────────────────────────────────
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

  // ── Inject Scholarships nav link if not already present ─────────────────────
  var navLinks = document.querySelector('.nav-links');
  if (navLinks && !navLinks.querySelector('a[href="/scholarship-estimator.html"]')) {
    var schLi = document.createElement('li');
    schLi.innerHTML = '<a href="/scholarship-estimator.html">Scholarships</a>';
    // Insert before the About link if it exists, otherwise append
    var aboutLi = null;
    var items = navLinks.querySelectorAll('li');
    for (var i = 0; i < items.length; i++) {
      if (items[i].querySelector('a[href="/about.html"]')) { aboutLi = items[i]; break; }
    }
    navLinks.insertBefore(schLi, aboutLi || null);
  }

  // ── Hamburger drawer ─────────────────────────────────────────────────────────
  var navRight2 = document.querySelector('.nav-right');
  if (navRight2 && !document.getElementById('nav-hamburger')) {

    // Build drawer link HTML by cloning current nav-links (Scholarships already injected above)
    var navLinksList = document.querySelector('.nav-links');
    var drawerLinksHtml = '';
    if (navLinksList) {
      var linkItems = navLinksList.querySelectorAll('li');
      for (var k = 0; k < linkItems.length; k++) {
        drawerLinksHtml += linkItems[k].outerHTML;
      }
    }

    // Hamburger button
    var hbtn = document.createElement('button');
    hbtn.id = 'nav-hamburger';
    hbtn.className = 'nav-hamburger';
    hbtn.setAttribute('aria-label', 'Open navigation menu');
    hbtn.setAttribute('aria-expanded', 'false');
    hbtn.innerHTML = '<span></span><span></span><span></span>';
    // Insert before the theme toggle
    var themeToggle = document.getElementById('theme-toggle');
    navRight2.insertBefore(hbtn, themeToggle || navRight2.firstChild);

    // Backdrop
    var backdrop = document.createElement('div');
    backdrop.className = 'nav-drawer-backdrop';
    document.body.appendChild(backdrop);

    // Drawer
    var drawer = document.createElement('nav');
    drawer.id = 'nav-drawer';
    drawer.className = 'nav-drawer';
    drawer.setAttribute('aria-label', 'Mobile navigation');
    drawer.innerHTML =
      '<div class="nav-drawer-header">' +
        '<a href="/" class="nav-drawer-brand">Atlas Legis</a>' +
        '<button class="nav-drawer-close" aria-label="Close navigation menu">' +
          '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>' +
        '</button>' +
      '</div>' +
      '<ul class="nav-drawer-links">' + drawerLinksHtml + '</ul>';
    document.body.appendChild(drawer);

    function openDrawer() {
      drawer.classList.add('open');
      backdrop.classList.add('open');
      hbtn.classList.add('active');
      hbtn.setAttribute('aria-expanded', 'true');
      document.body.style.overflow = 'hidden';
    }

    function closeDrawer() {
      drawer.classList.remove('open');
      backdrop.classList.remove('open');
      hbtn.classList.remove('active');
      hbtn.setAttribute('aria-expanded', 'false');
      document.body.style.overflow = '';
    }

    hbtn.addEventListener('click', openDrawer);
    backdrop.addEventListener('click', closeDrawer);
    drawer.querySelector('.nav-drawer-close').addEventListener('click', closeDrawer);

    // Close when a drawer link is clicked
    var drawerLinks = drawer.querySelectorAll('a');
    for (var l = 0; l < drawerLinks.length; l++) {
      drawerLinks[l].addEventListener('click', closeDrawer);
    }

    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape') closeDrawer();
    });
  }

  // ── Methodology footer popup ─────────────────────────────────────────────────
  var footerLinks = document.querySelectorAll('.footer-links a, .footer-nav-link');
  var methLink = null;
  for (var j = 0; j < footerLinks.length; j++) {
    var href = footerLinks[j].getAttribute('href') || '';
    if (href.indexOf('methodology') !== -1) { methLink = footerLinks[j]; break; }
  }
  if (methLink) {
    var modal = document.createElement('div');
    modal.id = 'meth-modal';
    modal.setAttribute('role', 'dialog');
    modal.setAttribute('aria-modal', 'true');
    modal.setAttribute('aria-label', 'Choose a methodology guide');
    modal.innerHTML =
      '<div class="meth-backdrop"></div>' +
      '<div class="meth-box">' +
        '<div class="meth-title">Methodology</div>' +
        '<p class="meth-desc">Which methodology guide are you looking for?</p>' +
        '<a href="/methodology.html" class="meth-opt">Employment Data</a>' +
        '<a href="/estimator-methodology.html" class="meth-opt">Scholarship Estimator</a>' +
        '<button class="meth-close" aria-label="Close dialog">Close</button>' +
      '</div>';
    document.body.appendChild(modal);

    methLink.addEventListener('click', function (e) {
      e.preventDefault();
      document.getElementById('meth-modal').classList.add('open');
    });
    modal.querySelector('.meth-backdrop').addEventListener('click', function () {
      modal.classList.remove('open');
    });
    modal.querySelector('.meth-close').addEventListener('click', function () {
      modal.classList.remove('open');
    });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape') modal.classList.remove('open');
    });
  }

});
