// 模試・過去問の得点記録と推移グラフ(certs/log.html 用)

(function () {
  var certSelectEl = document.getElementById("cert-select");
  var chartEl = document.getElementById("chart");
  var listEl = document.getElementById("list");
  var formAreaEl = document.getElementById("form-area");
  var messageEl = document.getElementById("message");
  var certs = Store.load(KEYS.certs);

  if (certs.length === 0) {
    document.getElementById("main-content").appendChild(
      h("p", { class: "note" }, "先に ", h("a", { href: "index.html", text: "資格の一覧" }), " で資格を登録してください。"));
    document.getElementById("content-body").hidden = true;
    return;
  }

  var selectedId = getQuery("cert");
  if (!Store.get(KEYS.certs, selectedId)) {
    selectedId = certs[0].id;
  }
  var editing = null;

  function certById(id) {
    return Store.get(KEYS.certs, id);
  }

  // ---- 資格の選択 ----
  certs.forEach(function (c) {
    certSelectEl.appendChild(h("option", { value: c.id, text: c.name }));
  });
  certSelectEl.value = selectedId;
  certSelectEl.addEventListener("change", function () {
    selectedId = certSelectEl.value;
    api.setValues({ certId: selectedId });
    editing = null;
    api.setSubmitLabel("追加する");
    render();
  });

  // ---- 推移グラフ(SVGで描く) ----
  function drawChart(points, target) {
    clear(chartEl);
    if (points.length < 2) {
      chartEl.appendChild(h("p", { class: "note", text: "グラフは、同じ資格の得点が2件以上になると表示されます。" }));
      return;
    }
    var W = 600, H = 260, L = 46, R = 16, T = 16, B = 44;
    var values = points.map(function (p) { return p.score; });
    if (target) { values.push(target); }
    var lo = Math.min.apply(null, values);
    var hi = Math.max.apply(null, values);
    if (lo === hi) { lo -= 1; hi += 1; }
    var margin = (hi - lo) * 0.1;
    lo -= margin;
    hi += margin;

    function x(i) { return L + (W - L - R) * i / (points.length - 1); }
    function y(v) { return T + (H - T - B) * (1 - (v - lo) / (hi - lo)); }

    var s = svg("svg", { viewBox: "0 0 " + W + " " + H, class: "chart-svg", role: "img", "aria-label": "得点の推移グラフ" });
    s.appendChild(svg("line", { x1: L, y1: T, x2: L, y2: H - B, class: "chart-axis" }));
    s.appendChild(svg("line", { x1: L, y1: H - B, x2: W - R, y2: H - B, class: "chart-axis" }));
    [lo, hi].forEach(function (v) {
      s.appendChild(svg("text", { x: L - 6, y: y(v) + 4, "text-anchor": "end", class: "chart-label", text: Math.round(v) }));
    });
    if (target) {
      s.appendChild(svg("line", { x1: L, y1: y(target), x2: W - R, y2: y(target), class: "chart-target" }));
      s.appendChild(svg("text", { x: W - R, y: y(target) - 4, "text-anchor": "end", class: "chart-label", text: "目標 " + target }));
    }
    s.appendChild(svg("polyline", {
      points: points.map(function (p, i) { return x(i) + "," + y(p.score); }).join(" "),
      class: "chart-line"
    }));
    points.forEach(function (p, i) {
      s.appendChild(svg("circle", { cx: x(i), cy: y(p.score), r: 4, class: "chart-dot" }));
      s.appendChild(svg("text", { x: x(i), y: y(p.score) - 8, "text-anchor": "middle", class: "chart-label", text: p.score }));
      s.appendChild(svg("text", { x: x(i), y: H - B + 16, "text-anchor": "middle", class: "chart-label", text: p.date.slice(5).replace("-", "/") }));
    });
    chartEl.appendChild(s);
  }

  // ---- 一覧 ----
  function render() {
    var all = Store.load(KEYS.scores).filter(function (sc) { return sc.certId === selectedId; });
    var cert = certById(selectedId);
    drawChart(all.slice().sort(function (a, b) {
      return a.date < b.date ? -1 : (a.date > b.date ? 1 : 0);
    }), cert && cert.targetScore ? Number(cert.targetScore) : 0);

    clear(listEl);
    if (all.length === 0) {
      listEl.appendChild(h("p", { class: "note", text: "この資格の得点はまだ記録されていません。" }));
      return;
    }
    var sorted = all.slice().sort(function (a, b) {
      return a.date < b.date ? 1 : (a.date > b.date ? -1 : 0);
    });
    listEl.appendChild(h("ul", { class: "records" }, sorted.map(function (sc) {
      return h("li", { class: "record" },
        h("div", { class: "record-head" },
          h("strong", { text: sc.date }), " ",
          h("span", { class: "badge", text: sc.kind }), " ",
          h("span", { text: sc.score + " 点" })),
        sc.comment ? h("p", { class: "note", text: sc.comment }) : null,
        h("div", { class: "actions" },
          h("button", { type: "button", class: "button button-secondary", text: "編集", onclick: function () { startEdit(sc); } }), " ",
          h("button", {
            type: "button",
            class: "button button-danger",
            text: "削除",
            onclick: function () {
              if (window.confirm("この得点記録を削除しますか?\n" + sc.date + " " + sc.score + "点")) {
                Store.remove(KEYS.scores, sc.id);
                setMessage(messageEl, "削除しました。", false);
                render();
              }
            }
          })));
    })));
  }

  // ---- 追加・編集フォーム ----
  var api = buildForm(formAreaEl, {
    idPrefix: "sc",
    submitLabel: "追加する",
    initial: { certId: selectedId },
    fields: [
      {
        name: "certId", label: "資格", type: "select", required: true,
        options: certs.map(function (c) { return { value: c.id, label: c.name }; })
      },
      { name: "date", label: "日付", type: "date", required: true, default: todayString },
      { name: "kind", label: "種類", type: "select", required: true, options: SCORE_KINDS },
      { name: "score", label: "得点", type: "number", required: true, min: 0, max: 100000 },
      { name: "comment", label: "コメント", type: "textarea", rows: 2, maxlength: 300 }
    ],
    onSubmit: function (v) {
      var rec = {
        id: editing ? editing.id : Store.newId(),
        certId: v.certId, date: v.date, kind: v.kind, score: v.score, comment: v.comment
      };
      if (!Store.upsert(KEYS.scores, rec)) {
        setMessage(messageEl, "保存できませんでした。", true);
        return;
      }
      setMessage(messageEl, editing ? "更新しました。" : "追加しました。", false);
      editing = null;
      selectedId = v.certId;
      certSelectEl.value = selectedId;
      api.setSubmitLabel("追加する");
      api.setValues({ certId: selectedId, date: v.date, kind: v.kind });
      render();
    }
  });

  function startEdit(sc) {
    editing = sc;
    api.setValues(sc);
    api.setSubmitLabel("更新する");
    formAreaEl.scrollIntoView();
    api.focus("score");
  }

  render();
})();
