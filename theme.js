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

  // ── School page section navigation ──────────────────────────────────────────
  (function () {
    var main = document.querySelector('.main');
    var hero = document.querySelector('header.hero');
    var layout = document.querySelector('.layout');
    if (!main || !hero || !layout) return;

    // Collect sections from .main
    var sections = main.querySelectorAll('section[aria-labelledby]');
    if (sections.length < 2) return;

    var items = [];
    for (var s = 0; s < sections.length; s++) {
      var labelId = sections[s].getAttribute('aria-labelledby');
      var h2 = document.getElementById(labelId);
      if (h2) items.push({ id: labelId, label: h2.textContent.trim(), section: sections[s] });
    }
    if (items.length < 2) return;

    // Build left sidebar nav (desktop)
    var leftNav = document.createElement('nav');
    leftNav.className = 'page-left-nav';
    leftNav.setAttribute('aria-label', 'Page sections');
    var lbl = document.createElement('div');
    lbl.className = 'pln-label';
    lbl.textContent = 'On this page';
    leftNav.appendChild(lbl);
    var ul = document.createElement('ul');
    ul.className = 'pln-list';
    for (var i = 0; i < items.length; i++) {
      var li = document.createElement('li');
      var a = document.createElement('a');
      a.className = 'pln-link' + (i === 0 ? ' active' : '');
      a.href = '#' + items[i].id;
      a.textContent = items[i].label;
      a['data-section-id'] = items[i].id;
      li.appendChild(a);
      ul.appendChild(li);
    }
    leftNav.appendChild(ul);
    layout.classList.add('layout--has-leftnav');
    layout.insertBefore(leftNav, layout.firstChild);

    // Build mobile strip (below hero, hidden on desktop)
    var mobileNav = document.createElement('nav');
    mobileNav.className = 'page-nav-mobile';
    mobileNav.setAttribute('aria-label', 'Page sections');
    var inner = document.createElement('div');
    inner.className = 'page-nav-mobile-inner';
    for (var j = 0; j < items.length; j++) {
      var pill = document.createElement('a');
      pill.className = 'pnm-link' + (j === 0 ? ' active' : '');
      pill.href = '#' + items[j].id;
      pill.textContent = items[j].label;
      pill['data-section-id'] = items[j].id;
      inner.appendChild(pill);
    }
    mobileNav.appendChild(inner);
    hero.parentNode.insertBefore(mobileNav, hero.nextSibling);

    // Scrollspy via IntersectionObserver
    function setActive(id) {
      var dLinks = leftNav.querySelectorAll('.pln-link');
      for (var d = 0; d < dLinks.length; d++) {
        dLinks[d].classList.toggle('active', dLinks[d]['data-section-id'] === id);
      }
      var mLinks = inner.querySelectorAll('.pnm-link');
      for (var m = 0; m < mLinks.length; m++) {
        var isActive = mLinks[m]['data-section-id'] === id;
        mLinks[m].classList.toggle('active', isActive);
        if (isActive) mLinks[m].scrollIntoView({ block: 'nearest', inline: 'nearest' });
      }
    }

    if ('IntersectionObserver' in window) {
      var activeId = items[0].id;
      var observer = new IntersectionObserver(function (entries) {
        for (var e = 0; e < entries.length; e++) {
          if (entries[e].isIntersecting) {
            activeId = entries[e].target.getAttribute('aria-labelledby');
          }
        }
        setActive(activeId);
      }, { rootMargin: '-15% 0px -75% 0px' });

      for (var k = 0; k < items.length; k++) {
        observer.observe(items[k].section);
      }
    }
  })();

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

  // ── Admissions history: year toggle + Score History card ─────────────────
  (function () {
    var main = document.querySelector('.main');
    if (!main) return;

    var admSection = null;
    var secs = main.querySelectorAll('section[aria-labelledby]');
    for (var i = 0; i < secs.length; i++) {
      if (secs[i].getAttribute('aria-labelledby') === 'admissions-h') {
        admSection = secs[i]; break;
      }
    }
    if (!admSection) return;

    // Derive slug from URL
    var slug = window.location.pathname.replace(/\/+$/, '').split('/').pop();
    if (!slug || slug === 'schools') return;

    // Read current (2024-25) LSAT/GPA from DOM
    var lsatList = null, gpaList = null;
    var grpLabels = admSection.querySelectorAll('.pct-group-lbl');
    for (var g = 0; g < grpLabels.length; g++) {
      var txt = grpLabels[g].textContent;
      var par = grpLabels[g].parentNode;
      if (txt.indexOf('LSAT') !== -1) lsatList = par.querySelector('.pct-list');
      else if (txt.indexOf('GPA') !== -1) gpaList = par.querySelector('.pct-list');
    }
    if (!lsatList || !gpaList) return;

    function readVals(list) {
      var v = list.querySelectorAll('.pct-item-val');
      return {
        p75: parseFloat(v[0] && v[0].textContent) || null,
        p50: parseFloat(v[1] && v[1].textContent) || null,
        p25: parseFloat(v[2] && v[2].textContent) || null
      };
    }
    var lv = readVals(lsatList), gv = readVals(gpaList);
    var cur = { lsat75: lv.p75, lsat50: lv.p50, lsat25: lv.p25,
                gpa75: gv.p75, gpa50: gv.p50, gpa25: gv.p25 };

    fetch('/data/admissions_history.json')
      .then(function (r) { return r.json(); })
      .then(function (history) {
        var hist = {};
        var raw = history[slug] || {};
        var rKeys = Object.keys(raw).sort();
        for (var ri = 0; ri < rKeys.length; ri++) hist[rKeys[ri]] = raw[rKeys[ri]];
        hist['2024\u201325'] = cur;
        var years = Object.keys(hist).sort();
        if (years.length < 2) return;
        addYearButtons(admSection, hist, years, lsatList, gpaList);
        addTrendsCard(admSection, hist, years);
      })
      .catch(function () {});

    function fmtLsat(v) { return v != null ? String(Math.round(v)) : '\u2014'; }
    function fmtGpa(v)  { return v != null ? parseFloat(v).toFixed(2) : '\u2014'; }

    function addYearButtons(sec, hist, years, lsatList, gpaList) {
      var card = sec.querySelector('.card');
      if (!card) return;
      var head = card.querySelector('.card-head');
      if (!head) return;

      var tabs = document.createElement('div');
      tabs.className = 'adm-year-tabs';

      var activeYear = years[years.length - 1];

      function applyYear(yr) {
        var d = hist[yr];
        if (!d) return;
        var lv2 = lsatList.querySelectorAll('.pct-item-val');
        if (lv2[0]) lv2[0].textContent = fmtLsat(d.lsat75);
        if (lv2[1]) lv2[1].textContent = fmtLsat(d.lsat50);
        if (lv2[2]) lv2[2].textContent = fmtLsat(d.lsat25);
        var gv2 = gpaList.querySelectorAll('.pct-item-val');
        if (gv2[0]) gv2[0].textContent = fmtGpa(d.gpa75);
        if (gv2[1]) gv2[1].textContent = fmtGpa(d.gpa50);
        if (gv2[2]) gv2[2].textContent = fmtGpa(d.gpa25);
        var note = head.querySelector('.card-note');
        if (note) note.textContent = 'Entering class ' + yr;
        var btns = tabs.querySelectorAll('.adm-year-btn');
        for (var b = 0; b < btns.length; b++) {
          btns[b].classList.toggle('active', btns[b].getAttribute('data-yr') === yr);
        }
      }

      for (var yi = 0; yi < years.length; yi++) {
        (function (yr) {
          var btn = document.createElement('button');
          btn.className = 'adm-year-btn' + (yr === activeYear ? ' active' : '');
          btn.setAttribute('data-yr', yr);
          btn.textContent = yr;
          btn.addEventListener('click', function () { applyYear(yr); });
          tabs.appendChild(btn);
        })(years[yi]);
      }
      // Place tabs at top of card-body, above the LSAT/GPA data
      var cardBody = card.querySelector('.card-body');
      if (cardBody) cardBody.insertBefore(tabs, cardBody.firstChild);

      // On mobile, stack the card-head title + note vertically
      var mq = window.matchMedia('(max-width: 959px)');
      function applyHeadLayout(mobile) {
        if (mobile) {
          head.style.flexDirection = 'column';
          head.style.alignItems = 'flex-start';
          head.style.gap = '3px';
        } else {
          head.style.flexDirection = '';
          head.style.alignItems = '';
          head.style.gap = '';
        }
      }
      applyHeadLayout(mq.matches);
      mq.addEventListener('change', function (e) { applyHeadLayout(e.matches); });
    }

    function buildSvg(hist, years, k25, k50, k75, fmtFn) {
      var CLR = '#1a7a50', BAND = '#10b981';
      var pts = [];
      for (var yi = 0; yi < years.length; yi++) {
        var d = hist[years[yi]];
        if (d && d[k50] != null) pts.push({ yr: years[yi], p25: d[k25], p50: d[k50], p75: d[k75] });
      }
      if (pts.length < 2) return '';

      var W = 420, H = 118, pL = 16, pR = 16, pT = 28, pB = 26;
      var cw = W - pL - pR, ch = H - pT - pB, n = pts.length;

      var allV = [];
      for (var pi = 0; pi < pts.length; pi++) {
        allV.push(pts[pi].p50);
        if (pts[pi].p25 != null) allV.push(pts[pi].p25);
        if (pts[pi].p75 != null) allV.push(pts[pi].p75);
      }
      var vMin = Math.min.apply(null, allV), vMax = Math.max.apply(null, allV);
      var vRange = vMax - vMin || 1;
      vMin -= vRange * 0.22; vMax += vRange * 0.22; vRange = vMax - vMin;

      function xOf(i) { return (pL + (i / (n - 1)) * cw).toFixed(2); }
      function yOf(v) { return (pT + (1 - (v - vMin) / vRange) * ch).toFixed(2); }

      var out = ['<svg viewBox="0 0 ' + W + ' ' + H + '" width="100%" height="' + H + '" aria-hidden="true">'];

      // Band
      var hasBand = true;
      for (var bi = 0; bi < pts.length; bi++) { if (pts[bi].p25 == null || pts[bi].p75 == null) { hasBand = false; break; } }
      if (hasBand) {
        var top = pts.map(function (p, i) { return xOf(i) + ',' + yOf(p.p75); }).join(' L ');
        var bot = pts.slice().reverse().map(function (p, i) { return xOf(n - 1 - i) + ',' + yOf(p.p25); }).join(' L ');
        out.push('<path d="M ' + top + ' L ' + bot + ' Z" fill="' + BAND + '" fill-opacity="0.13"/>');
      }
      // Median line
      var lp = pts.map(function (p, i) { return xOf(i) + ',' + yOf(p.p50); }).join(' L ');
      out.push('<path d="M ' + lp + '" fill="none" stroke="' + CLR + '" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/>');
      // Dots + labels
      for (var di = 0; di < pts.length; di++) {
        var x = xOf(di), y = yOf(pts[di].p50);
        var label = fmtFn(pts[di].p50);
        out.push('<text x="' + x + '" y="' + (parseFloat(y) - 10).toFixed(1) + '" text-anchor="middle" font-size="11" font-weight="700" fill="' + CLR + '">' + label + '</text>');
        out.push('<circle cx="' + x + '" cy="' + y + '" r="4" fill="' + CLR + '" stroke="#fff" stroke-width="2"/>');
        out.push('<text x="' + x + '" y="' + (H - 5) + '" text-anchor="middle" font-size="10" fill="#6b8c78">' + pts[di].yr + '</text>');
      }
      out.push('</svg>');
      return out.join('');
    }

    function addTrendsCard(sec, hist, years) {
      var lsatSvg = buildSvg(hist, years, 'lsat25', 'lsat50', 'lsat75', function (v) { return Math.round(v); });
      var gpaSvg  = buildSvg(hist, years, 'gpa25',  'gpa50',  'gpa75',  function (v) { return parseFloat(v).toFixed(2); });
      if (!lsatSvg && !gpaSvg) return;

      var noteHtml = years.length < 3
        ? '<p class="adm-hist-note">Showing ' + years.length + ' of 3 years of available data.</p>'
        : '';

      var cols = '';
      if (lsatSvg) cols += '<div class="adm-trend-col"><div class="adm-trend-lbl">LSAT (median)</div>' + lsatSvg + '</div>';
      if (gpaSvg)  cols += '<div class="adm-trend-col"><div class="adm-trend-lbl">GPA (median)</div>'  + gpaSvg  + '</div>';

      var html =
        '<article class="card" id="score-history">' +
          '<div class="card-head">' +
            '<h2 id="score-history-h">Score History</h2>' +
            (years.length < 3 ? '<span class="card-note">' + years.length + ' years available</span>' : '') +
          '</div>' +
          '<div class="card-body">' +
            noteHtml +
            '<div class="adm-trends-grid">' + cols + '</div>' +
          '</div>' +
        '</article>';

      var wrapper = document.createElement('section');
      wrapper.setAttribute('aria-labelledby', 'score-history-h');
      wrapper.innerHTML = html;
      sec.parentNode.insertBefore(wrapper, sec.nextSibling);
    }
  })();

});
