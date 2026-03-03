(function () {
  var rows = document.querySelector('.schol-rows');
  if (!rows) return;

  var vals = rows.querySelectorAll('.schol-val');
  var total = 0;
  vals.forEach(function (v) {
    total += parseInt(v.textContent.trim(), 10) || 0;
  });
  if (total === 0) return;

  vals.forEach(function (v) {
    var n = parseInt(v.textContent.trim(), 10) || 0;
    var pct = Math.round((n / total) * 100);
    var span = document.createElement('span');
    span.textContent = '\u00a0(' + pct + '%)';
    span.style.cssText = 'opacity:0.20;font-size:0.82em;font-family:Inter,sans-serif;font-weight:400;';
    v.appendChild(span);
  });
})();
