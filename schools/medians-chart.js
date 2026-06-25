(function () {
  'use strict';

  var data = window.SCHOOL_MEDIANS;
  if (!data || !data.years || data.years.length < 2) return;

  var container = document.getElementById('medians-charts');
  if (!container) return;

  var years = data.years;
  var n = years.length;

  function px(i, innerW, padL) {
    return padL + (i / (n - 1)) * innerW;
  }

  function py(v, yMin, yMax, padT, innerH) {
    if (v === null || v === undefined) return null;
    return padT + innerH - ((v - yMin) / (yMax - yMin)) * innerH;
  }

  function buildPolyline(vals, yMin, yMax, padL, padT, innerW, innerH) {
    var pts = [];
    for (var i = 0; i < n; i++) {
      var v = vals[i];
      if (v !== null && v !== undefined) {
        pts.push(px(i, innerW, padL).toFixed(1) + ',' + py(v, yMin, yMax, padT, innerH).toFixed(1));
      }
    }
    return pts.join(' ');
  }

  function buildBandPolygon(topVals, botVals, yMin, yMax, padL, padT, innerW, innerH) {
    var top = [], bot = [];
    for (var i = 0; i < n; i++) {
      var t = topVals[i], b = botVals[i];
      if (t !== null && t !== undefined && b !== null && b !== undefined) {
        top.push(px(i, innerW, padL).toFixed(1) + ',' + py(t, yMin, yMax, padT, innerH).toFixed(1));
        bot.unshift(px(i, innerW, padL).toFixed(1) + ',' + py(b, yMin, yMax, padT, innerH).toFixed(1));
      }
    }
    return top.concat(bot).join(' ');
  }

  function makeSVG(p25arr, p50arr, p75arr, yMin, yMax, label, fmtY) {
    var W = 360, H = 150;
    var padT = 14, padR = 12, padB = 28, padL = 38;
    var innerW = W - padL - padR;
    var innerH = H - padT - padB;

    var parts = ['<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ' + W + ' ' + H + '" width="100%" style="display:block;overflow:visible" aria-hidden="true">'];

    // Horizontal gridlines + Y labels (5 levels)
    var steps = 4;
    for (var i = 0; i <= steps; i++) {
      var v = yMin + (i / steps) * (yMax - yMin);
      var yy = py(v, yMin, yMax, padT, innerH).toFixed(1);
      parts.push('<line x1="' + padL + '" y1="' + yy + '" x2="' + (padL + innerW) + '" y2="' + yy + '" stroke="#f1f5f9" stroke-width="1"/>');
      parts.push('<text x="' + (padL - 5) + '" y="' + (parseFloat(yy) + 3.5).toFixed(1) + '" text-anchor="end" fill="#94a3b8" font-size="9.5" font-family="Inter,system-ui,sans-serif">' + fmtY(v) + '</text>');
    }

    // X axis ticks + labels
    var xShown = {};
    for (var i = 0; i < n; i++) {
      var yr = years[i];
      var show = (i === 0 || i === n - 1 || yr % 3 === 0);
      if (show && !xShown[yr]) {
        xShown[yr] = true;
        var xx = px(i, innerW, padL).toFixed(1);
        var axisY = (padT + innerH).toFixed(1);
        parts.push('<line x1="' + xx + '" y1="' + axisY + '" x2="' + xx + '" y2="' + (padT + innerH + 3) + '" stroke="#e2e8f0" stroke-width="1"/>');
        parts.push('<text x="' + xx + '" y="' + (padT + innerH + 13) + '" text-anchor="middle" fill="#94a3b8" font-size="9.5" font-family="Inter,system-ui,sans-serif">' + yr + '</text>');
      }
    }

    // Band
    var band = buildBandPolygon(p75arr, p25arr, yMin, yMax, padL, padT, innerW, innerH);
    if (band) parts.push('<polygon points="' + band + '" fill="rgba(16,185,129,0.1)" stroke="none"/>');

    // 25th line (dashed)
    var path25 = buildPolyline(p25arr, yMin, yMax, padL, padT, innerW, innerH);
    if (path25) parts.push('<polyline points="' + path25 + '" fill="none" stroke="#6ee7b7" stroke-width="1.5" stroke-dasharray="5,3" stroke-linecap="round"/>');

    // 75th line (dashed)
    var path75 = buildPolyline(p75arr, yMin, yMax, padL, padT, innerW, innerH);
    if (path75) parts.push('<polyline points="' + path75 + '" fill="none" stroke="#6ee7b7" stroke-width="1.5" stroke-dasharray="5,3" stroke-linecap="round"/>');

    // 50th line (solid, bold)
    var path50 = buildPolyline(p50arr, yMin, yMax, padL, padT, innerW, innerH);
    if (path50) parts.push('<polyline points="' + path50 + '" fill="none" stroke="#059669" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/>');

    // Axes
    parts.push('<line x1="' + padL + '" y1="' + padT + '" x2="' + padL + '" y2="' + (padT + innerH) + '" stroke="#e2e8f0" stroke-width="1"/>');
    parts.push('<line x1="' + padL + '" y1="' + (padT + innerH) + '" x2="' + (padL + innerW) + '" y2="' + (padT + innerH) + '" stroke="#e2e8f0" stroke-width="1"/>');

    // Chart label (top center)
    parts.push('<text x="' + (padL + innerW / 2).toFixed(0) + '" y="10" text-anchor="middle" fill="#64748b" font-size="10" font-weight="600" letter-spacing=".06em" font-family="Inter,system-ui,sans-serif">' + label + '</text>');

    parts.push('</svg>');
    return parts.join('');
  }

  function safeRange(arr25, arr75) {
    var all = [];
    arr25.forEach(function (v) { if (v !== null && v !== undefined) all.push(v); });
    arr75.forEach(function (v) { if (v !== null && v !== undefined) all.push(v); });
    if (!all.length) return [0, 1];
    var mn = Math.min.apply(null, all);
    var mx = Math.max.apply(null, all);
    return [mn, mx];
  }

  var lsatR = safeRange(data.lsat25, data.lsat75);
  var gpaR = safeRange(data.gpa25, data.gpa75);

  // Expand ranges slightly
  var lsatPad = Math.max(1, Math.ceil((lsatR[1] - lsatR[0]) * 0.12));
  var gpaPad = Math.max(0.03, ((gpaR[1] - gpaR[0]) * 0.12));

  lsatR[0] = Math.max(120, lsatR[0] - lsatPad);
  lsatR[1] = Math.min(180, lsatR[1] + lsatPad);
  gpaR[0] = Math.max(1.5, Math.round((gpaR[0] - gpaPad) * 100) / 100);
  gpaR[1] = Math.min(4.0, Math.round((gpaR[1] + gpaPad) * 100) / 100);

  var lsatSVG = makeSVG(data.lsat25, data.lsat50, data.lsat75, lsatR[0], lsatR[1], 'LSAT', function (v) { return Math.round(v); });
  var gpaSVG = makeSVG(data.gpa25, data.gpa50, data.gpa75, gpaR[0], gpaR[1], 'GPA', function (v) { return v.toFixed(2); });

  container.innerHTML =
    '<div class="medians-grid">' +
    '<div class="medians-panel">' + lsatSVG + '</div>' +
    '<div class="medians-panel">' + gpaSVG + '</div>' +
    '</div>' +
    '<div class="medians-legend">' +
    '<span class="medians-legend-item">' +
    '<svg width="22" height="8" aria-hidden="true"><line x1="1" y1="4" x2="21" y2="4" stroke="#059669" stroke-width="2.5" stroke-linecap="round"/></svg>' +
    'Median (50th)</span>' +
    '<span class="medians-legend-item">' +
    '<svg width="22" height="8" aria-hidden="true"><line x1="1" y1="4" x2="21" y2="4" stroke="#6ee7b7" stroke-width="1.5" stroke-dasharray="5,3" stroke-linecap="round"/></svg>' +
    '25th &amp; 75th Percentile</span>' +
    '</div>';
})();
