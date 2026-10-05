// Interactive frontier demo. All values are synthetic.
(function () {
  var D = {"planning": {"la": 0.15, "mu": 0.05, "qbar": 0.9, "ylab": "Quality (synthetic example)", "front": [{"id": "example-a", "q": 0.7, "c": 0.01, "t": 1000, "measured": false}, {"id": "example-b", "q": 0.85, "c": 0.05, "t": 2000, "measured": false}, {"id": "example-c", "q": 0.95, "c": 0.2, "t": 3000, "measured": false}], "dots": [[0.7, 0.01, 1, "example-a"], [0.85, 0.05, 1, "example-b"], [0.95, 0.2, 1, "example-c"]], "pick": {"easy": "example-a", "hard": "example-b", "reasonEasy": "example", "reasonHard": "example"}}, "code": {"la": 0.15, "mu": 0.05, "qbar": 0.9, "ylab": "Quality (synthetic example)", "front": [{"id": "example-a", "q": 0.7, "c": 0.01, "t": 1000, "measured": false}, {"id": "example-b", "q": 0.85, "c": 0.05, "t": 2000, "measured": false}, {"id": "example-c", "q": 0.95, "c": 0.2, "t": 3000, "measured": false}], "dots": [[0.7, 0.01, 1, "example-a"], [0.85, 0.05, 1, "example-b"], [0.95, 0.2, 1, "example-c"]], "pick": {"easy": "example-a", "hard": "example-b", "reasonEasy": "example", "reasonHard": "example"}}, "writing": {"la": 0.15, "mu": 0.05, "qbar": 0.9, "ylab": "Quality (synthetic example)", "front": [{"id": "example-a", "q": 0.7, "c": 0.01, "t": 1000, "measured": false}, {"id": "example-b", "q": 0.85, "c": 0.05, "t": 2000, "measured": false}, {"id": "example-c", "q": 0.95, "c": 0.2, "t": 3000, "measured": false}], "dots": [[0.7, 0.01, 1, "example-a"], [0.85, 0.05, 1, "example-b"], [0.95, 0.2, 1, "example-c"]], "pick": {"easy": "example-a", "hard": "example-b", "reasonEasy": "example", "reasonHard": "example"}}};

  // The example's constants: cost is measured in doublings over a ten-doubling
  // reference span, latency over three, and complexity scales cost aversion
  // by 1.5 - x/3. A code task rated 2 or harder uses the planning weights.
  var COST_SPAN = 10, LAT_SPAN = 3, HARD = 2;
  var BASE = { planning: { la: 0.15, mu: 0.05 }, code: { la: 0.45, mu: 0.2 }, writing: { la: 0.8, mu: 0.5 } };

  var METHODS = [
    ["router", "Value function (router)", "max q − λ·log₂(c/c_min)/10 − μ·log₂(t/t_min)/3. The example's rule since 26 September. λ and μ come from the work kind and the task's complexity; move the complexity slider to see the pick change."],
    ["knee", "Knee point (diagnostic)", "Max perpendicular distance above the chord joining the cheapest and best frontier points (q vs log c). The example's rule until 26 September; it is still computed and logged, but it ignores the role and complexity weights."],
    ["eps", "ε-constraint", "min c subject to q ≥ quality bar. Optimise one objective while constraining the rest. Reaches any frontier point, convex or not."],
    ["wsnorm", "Weighted sum · min–max", "min w_q·q̂ + w_c·ĉ + w_t·t̂, each axis normalised over the frontier. Linear scalarisation, so it only reaches convex-hull points."],
    ["cheby", "Weighted Chebyshev", "min max(w_q·q̂, w_c·ĉ, w_t·t̂). Can reach non-convex frontier points, but may return weakly dominated ones."],
    ["augcheby", "Augmented Chebyshev", "min max(w_i·f̂_i) + ρ·Σ w_i·f̂_i, ρ = 0.01. Chebyshev plus a tie-breaker; Pareto-optimal and still reaches non-convex regions."],
    ["asf", "Achievement scalarising", "min max(w_i·(f̂_i − z̄_i)) + ρ·Σ w_i·(f̂_i − z̄_i), reference z̄ = utopia. Every Pareto point is attainable for some reference."],
    ["lp", "Compromise L_p", "min (Σ (w_i·f̂_i)^p)^(1/p). p = 1 is the weighted sum, p → ∞ is Chebyshev; intermediate p explores non-convex regions."],
    ["topsis", "TOPSIS", "Closeness to the ideal: max d⁻/(d⁺+d⁻), the weighted distances to the utopia and nadir points."]
  ];
  var state = { kind: "code", method: "router", cx: 1, la: 0, mu: 0, qbar: 0.9, p: 2 };

  function routerWeights(kind, cx) {
    var b = (kind === "code" && cx >= HARD) ? BASE.planning : BASE[kind];
    return { la: b.la * (1.5 - cx / 3), mu: b.mu };
  }
  function short(id) { return id.replace(/^[^/]+\//, ""); }
  function fmtCost(c) { return c >= 0.01 ? "$" + c.toFixed(3) : "$" + c.toFixed(4); }

  function prep(front) {
    var qs = front.map(function (f) { return f.q; }), cs = front.map(function (f) { return f.c; }), ts = front.map(function (f) { return f.t; });
    var tp = ts.filter(function (t) { return t > 0; });
    var ideal = { q: Math.max.apply(null, qs), c: Math.min.apply(null, cs), t: tp.length ? Math.min.apply(null, tp) : 0 };
    var nadir = { q: Math.min.apply(null, qs), c: Math.max.apply(null, cs), t: Math.max.apply(null, ts) };
    var sq = ideal.q - nadir.q || 1, sc = nadir.c - ideal.c || 1, st = nadir.t - ideal.t || 1;
    var pts = front.map(function (f) {
      return { id: f.id, q: f.q, c: f.c, t: f.t, measured: f.measured,
        fq: (ideal.q - f.q) / sq, fc: (f.c - ideal.c) / sc, ft: ideal.t > 0 ? (f.t - ideal.t) / st : 0 };
    });
    var lc = front.map(function (f) { return Math.log2(f.c / ideal.c); });
    var lmax = Math.max.apply(null, lc) || 1;
    var X = lc.map(function (v) { return v / lmax; });
    var ymin = Math.min.apply(null, qs), ymax = Math.max.apply(null, qs);
    var Y = qs.map(function (v) { return (v - ymin) / (ymax - ymin || 1); });
    var i0 = X.indexOf(Math.min.apply(null, X)), i1 = Y.indexOf(Math.max.apply(null, Y));
    var dx = X[i1] - X[i0], dy = Y[i1] - Y[i0], len = Math.hypot(dx, dy) || 1;
    // Signed distance above the chord, as the router computes it. Nothing
    // above the chord means no knee; the diagnostic then shows the cheapest.
    var dist = X.map(function (x, i) { return (dx * (Y[i] - Y[i0]) - dy * (x - X[i0])) / len; });
    var best = Math.max.apply(null, dist);
    var cSpan = Math.max(COST_SPAN, lmax), tmin = ideal.t > 0 ? ideal.t : 1;
    var tSpan = Math.max(LAT_SPAN, tp.length ? Math.log2(Math.max.apply(null, tp) / tmin) : 0);
    return { pts: pts, cmin: ideal.c, tmin: tmin, cSpan: cSpan, tSpan: tSpan, kneeIdx: best > 1e-9 ? dist.indexOf(best) : -1 };
  }
  function argmin(xs, f) { return xs.reduce(function (a, b) { return f(b) < f(a) ? b : a; }); }
  function argmax(xs, f) { return xs.reduce(function (a, b) { return f(b) > f(a) ? b : a; }); }
  function utility(pre, p) { return p.q - state.la * Math.log2(p.c / pre.cmin) / pre.cSpan - state.mu * Math.log2(Math.max(p.t, 1) / pre.tmin) / pre.tSpan; }

  function pickMethod(pre, m) {
    var wsum = 1 + state.la + state.mu, RHO = 0.01;
    var w = { q: 1 / wsum, c: state.la / wsum, t: state.mu / wsum };
    var P = pre.pts;
    if (m === "router") return argmax(P, function (p) { return utility(pre, p); });
    if (m === "wsnorm") return argmin(P, function (p) { return w.q * p.fq + w.c * p.fc + w.t * p.ft; });
    if (m === "cheby") return argmin(P, function (p) { return Math.max(w.q * p.fq, w.c * p.fc, w.t * p.ft); });
    if (m === "augcheby") return argmin(P, function (p) { return Math.max(w.q * p.fq, w.c * p.fc, w.t * p.ft) + RHO * (w.q * p.fq + w.c * p.fc + w.t * p.ft); });
    if (m === "asf") return argmin(P, function (p) { var a = [w.q * p.fq, w.c * p.fc, w.t * p.ft]; return Math.max.apply(null, a) + RHO * (w.q * p.fq + w.c * p.fc + w.t * p.ft); });
    if (m === "lp") return argmin(P, function (p) { return Math.pow(Math.pow(w.q * p.fq, state.p) + Math.pow(w.c * p.fc, state.p) + Math.pow(w.t * p.ft, state.p), 1 / state.p); });
    if (m === "topsis") return argmax(P, function (p) { var dp = Math.hypot(w.q * p.fq, w.c * p.fc, w.t * p.ft); var dm = Math.hypot(w.q * (1 - p.fq), w.c * (1 - p.fc), w.t * (1 - p.ft)); return dm / (dp + dm || 1); });
    if (m === "knee") return pre.kneeIdx >= 0 ? P[pre.kneeIdx] : argmin(P, function (p) { return p.c; });
    var qs = P.map(function (p) { return p.q; });
    var qmin = Math.min.apply(null, qs), qmax = Math.max.apply(null, qs);
    var bar = qmin + state.qbar * (qmax - qmin);
    var feas = P.filter(function (p) { return p.q >= bar; });
    return argmin(feas.length ? feas : P, function (p) { return p.c; });
  }

  function chart(svg) {
    var d = D[state.kind], front = d.front, pre = prep(front);
    var dots = d.dots;
    var cmin = 0.0005, cmax = 2;
    var VBW = 620, VBH = 392, L = 52, R = 606, T = 14, B = 344;
    var X = function (c) { return L + (Math.log2(Math.max(c, cmin)) - Math.log2(cmin)) / (Math.log2(cmax) - Math.log2(cmin)) * (R - L); };
    var Y = function (q) { return B - Math.max(0, Math.min(1, q)) * (B - T); };
    var s = [];
    var xt = [0.001, 0.01, 0.1, 1], xl = { 0.001: "$0.001", 0.01: "$0.01", 0.1: "$0.1", 1: "$1" };
    xt.forEach(function (t) { var x = X(t);
      s.push('<line class="pp-grid" x1="' + x.toFixed(1) + '" y1="' + T + '" x2="' + x.toFixed(1) + '" y2="' + B + '"/>');
      s.push('<text class="pp-tick" x="' + x.toFixed(1) + '" y="' + (B + 15) + '" font-size="11" text-anchor="middle">' + xl[t] + "</text>");
    });
    [0, 0.25, 0.5, 0.75, 1].forEach(function (t) { var y = Y(t);
      s.push('<line class="pp-grid" x1="' + L + '" y1="' + y.toFixed(1) + '" x2="' + R + '" y2="' + y.toFixed(1) + '"/>');
      s.push('<text class="pp-tick" x="' + (L - 6) + '" y="' + (y + 3.5).toFixed(1) + '" font-size="11" text-anchor="end">' + t.toFixed(2) + "</text>");
    });
    s.push('<line class="pp-axis" x1="' + L + '" y1="' + B + '" x2="' + R + '" y2="' + B + '"/>');
    s.push('<line class="pp-axis" x1="' + L + '" y1="' + T + '" x2="' + L + '" y2="' + B + '"/>');
    s.push('<text class="pp-tick" x="' + ((L + R) / 2) + '" y="376" font-size="11" text-anchor="middle">Expected cost per task (USD, log scale)</text>');
    s.push('<text class="pp-tick" transform="rotate(-90 13 179)" x="13" y="179" font-size="11" text-anchor="middle">' + d.ylab + "</text>");
    var hover = [];
    dots.forEach(function (p) { hover.push({ id: p[3], q: p[0], c: p[1], x: X(p[1]), y: Y(p[0]) }); s.push('<circle class="pp-dot' + (p[2] ? ' pp-dot-m' : '') + '" cx="' + X(p[1]).toFixed(1) + '" cy="' + Y(p[0]).toFixed(1) + '" r="' + (p[2] ? 2.8 : 2.2) + '"/>'); });
    var pts = front.slice().sort(function (a, b) { return a.c - b.c; });
    s.push('<polyline class="pp-front" points="' + pts.map(function (p) { return X(p.c).toFixed(1) + "," + Y(p.q).toFixed(1); }).join(" ") + '"/>');
    pts.forEach(function (p) {
      hover.push({ id: p.id, q: p.q, c: p.c, x: X(p.c), y: Y(p.q) });
      s.push('<circle class="pp-frontpt" cx="' + X(p.c).toFixed(1) + '" cy="' + Y(p.q).toFixed(1) + '" r="4.4"/>');
    });
    if (pre.kneeIdx >= 0) {
      var kn = front[pre.kneeIdx];
      s.push('<text class="pp-knee" x="' + X(kn.c).toFixed(1) + '" y="' + (Y(kn.q) + 4).toFixed(1) + '" font-size="13" text-anchor="middle">★</text>');
    }
    var pk = pickMethod(pre, state.method);
    if (state.method === "router") {
      // The iso-utility line through the pick: every point on it scores the same.
      var line = [], N = 40;
      for (var i = 0; i <= N; i++) { var xx = L + (R - L) * i / N; var lcv = Math.log2(cmin) + (xx - L) / (R - L) * (Math.log2(cmax) - Math.log2(cmin)); var qq = pk.q + state.la / pre.cSpan * (lcv - Math.log2(pk.c)); line.push(xx.toFixed(1) + "," + Y(qq).toFixed(1)); }
      s.push('<polyline class="pp-tangent" points="' + line.join(" ") + '"/>');
    }
    s.push('<circle class="pp-pickring" cx="' + X(pk.c).toFixed(1) + '" cy="' + Y(pk.q).toFixed(1) + '" r="8"/>');
    var lab = short(pk.id);
    s.push('<text class="pp-label pp-halo" x="' + (X(pk.c) + 11).toFixed(1) + '" y="' + (Y(pk.q) - 7).toFixed(1) + '" font-size="11.5">' + METHODS.filter(function (m) { return m[0] === state.method; })[0][1] + "</text>");
    s.push('<text class="pp-sublabel pp-halo" x="' + (X(pk.c) + 11).toFixed(1) + '" y="' + (Y(pk.q) + 7).toFixed(1) + '" font-size="11">' + lab + "</text>");
    s.push('<g class="pp-tip" aria-hidden="true"></g>');
    svg.innerHTML = s.join("");
    svg.__hover = hover;
  }

  // Nearest-point hover: one listener on the plot, so every dot answers,
  // with a hit radius wider than the 2.2px marks.
  function tipAt(svg, ex, ey) {
    var g = svg.querySelector(".pp-tip"); if (!g) return;
    var pts = svg.__hover || [];
    if (ex === null) { g.innerHTML = ""; return; }
    var box = svg.getBoundingClientRect(), sx = 620 / box.width, sy = 392 / box.height;
    var px = (ex - box.left) * sx, py = (ey - box.top) * sy, best = null, bd = 100;
    pts.forEach(function (p) { var dd = (p.x - px) * (p.x - px) + (p.y - py) * (p.y - py); if (dd < bd) { bd = dd; best = p; } });
    if (!best) { g.innerHTML = ""; return; }
    var label = short(best.id), sub = "q " + best.q.toFixed(3) + " · " + fmtCost(best.c);
    var w = Math.max(label.length, sub.length) * 6.3 + 14, h = 34;
    var x = best.x + 12, y = best.y - h / 2;
    if (x + w > 606) x = best.x - 12 - w;
    if (y < 14) y = 14; if (y + h > 344) y = 344 - h;
    g.innerHTML = '<circle class="pp-hover" cx="' + best.x.toFixed(1) + '" cy="' + best.y.toFixed(1) + '" r="6"/>' +
      '<rect class="pp-tipbox" x="' + x.toFixed(1) + '" y="' + y.toFixed(1) + '" width="' + w.toFixed(1) + '" height="' + h + '" rx="3"/>' +
      '<text class="pp-tiptext" x="' + (x + 7).toFixed(1) + '" y="' + (y + 14).toFixed(1) + '" font-size="11" font-weight="600">' + label + "</text>" +
      '<text class="pp-tipsub" x="' + (x + 7).toFixed(1) + '" y="' + (y + 27).toFixed(1) + '" font-size="10.5">' + sub + "</text>";
  }

  function mount(root) {
    var tabs = ["planning", "code", "writing"].map(function (k) {
      return '<button type="button" class="pp-tab" data-kind="' + k + '">' + k[0].toUpperCase() + k.slice(1) + "</button>";
    }).join("");
    var methods = METHODS.map(function (m) { return '<button type="button" class="pp-method" data-method="' + m[0] + '">' + m[1] + "</button>"; }).join("");
    root.innerHTML =
      '<div class="pp-tabs" role="group" aria-label="Work kind">' + tabs + "</div>" +
      '<svg class="pp-svg" viewBox="0 0 620 392" role="img" aria-label="Quality cost Pareto frontier"></svg>' +
      '<p class="pp-h">Preference rule</p>' +
      '<div class="pp-methods">' + methods + "</div>" +
      '<div class="pp-controls">' +
        '<label><span>Task complexity</span><input type="range" data-k="cx" min="0" max="3" step="0.1"><output></output></label>' +
        '<label><span>Cost aversion λ</span><input type="range" data-k="la" min="0" max="2" step="0.01"><output></output></label>' +
        '<label><span>Latency aversion μ</span><input type="range" data-k="mu" min="0" max="1" step="0.01"><output></output></label>' +
        '<label><span>Quality bar</span><input type="range" data-k="qbar" min="0" max="1" step="0.01"><output></output></label>' +
        '<label><span>L_p exponent</span><input type="range" data-k="p" min="1" max="10" step="0.5"><output></output></label>' +
      "</div>" +
      '<p class="pp-note"></p>';

    var svg = root.querySelector(".pp-svg");
    var note = root.querySelector(".pp-note");
    svg.addEventListener("pointermove", function (e) { tipAt(svg, e.clientX, e.clientY); });
    svg.addEventListener("pointerdown", function (e) { tipAt(svg, e.clientX, e.clientY); });
    svg.addEventListener("pointerleave", function () { tipAt(svg, null, null); });
    function applyComplexity() { var w = routerWeights(state.kind, state.cx); state.la = w.la; state.mu = w.mu; }
    root.querySelectorAll(".pp-tab").forEach(function (b) {
      b.addEventListener("click", function () { state.kind = b.dataset.kind; applyComplexity(); sync(root); paint(root); });
    });
    root.querySelectorAll(".pp-method").forEach(function (b) {
      b.addEventListener("click", function () { state.method = b.dataset.method; paint(root); });
    });
    root.querySelectorAll("input[type=range]").forEach(function (inp) {
      inp.addEventListener("input", function () {
        state[inp.dataset.k] = parseFloat(inp.value);
        if (inp.dataset.k === "cx") applyComplexity();
        sync(root); paint(root);
      });
    });

    function paint(r) {
      r.querySelectorAll(".pp-tab").forEach(function (b) { var on = b.dataset.kind === state.kind; b.classList.toggle("on", on); b.setAttribute("aria-pressed", on ? "true" : "false"); });
      r.querySelectorAll(".pp-method").forEach(function (b) { var on = b.dataset.method === state.method; b.classList.toggle("on", on); b.setAttribute("aria-pressed", on ? "true" : "false"); });
      chart(svg);
      var m = METHODS.filter(function (m) { return m[0] === state.method; })[0];
      var extra = state.method === "router" ? " Now: λ = " + state.la.toFixed(2) + ", μ = " + state.mu.toFixed(2) + (state.kind === "code" && state.cx >= HARD ? " (planning weights: the task is rated hard)." : ".") : "";
      note.textContent = m[2] + extra;
    }
    function sync(r) {
      r.querySelectorAll("input[type=range]").forEach(function (inp) {
        inp.value = state[inp.dataset.k];
        inp.parentNode.querySelector("output").textContent = state[inp.dataset.k].toFixed(inp.dataset.k === "p" || inp.dataset.k === "cx" ? 1 : 2);
      });
    }
    applyComplexity(); sync(root); paint(root);
  }

  document.querySelectorAll(".pareto-picker").forEach(function (root) {
    if (!root.dataset.ready) { mount(root); root.dataset.ready = "1"; }
  });
})();
