// 勉強記録の一覧・集計・グラフ(study/index.html 用)

(function () {
  var totalsEl = document.getElementById("totals");
  var chartEl = document.getElementById("chart");
  var listEl = document.getElementById("list");
  var periodEl = document.getElementById("period");
  var messageEl = document.getElementById("message");

  // その週の月曜日を返す
  function startOfWeek(d) {
    var offset = (d.getDay() + 6) % 7; // 月曜=0 ... 日曜=6
    return addDays(d, -offset);
  }

  function sum(recs) {
    return recs.reduce(function (acc, r) {
      return acc + (Number(r.minutes) || 0);
    }, 0);
  }

  function inWeek(r) {
    var ws = startOfWeek(new Date());
    return r.date >= dateString(ws) && r.date <= dateString(addDays(ws, 6));
  }

  function inMonth(r) {
    return r.date.slice(0, 7) === todayString().slice(0, 7);
  }

  function renderTotals(recs) {
    clear(totalsEl);
    [
      ["今週の合計", fmtMinutes(sum(recs.filter(inWeek)))],
      ["今月の合計", fmtMinutes(sum(recs.filter(inMonth)))],
      ["全期間の合計", fmtMinutes(sum(recs))],
      ["記録の件数", recs.length + "件"]
    ].forEach(function (pair) {
      totalsEl.appendChild(h("li", null,
        h("span", { class: "summary-label", text: pair[0] }),
        h("strong", { text: pair[1] })));
    });
  }

  // 科目別の勉強時間を、横棒で表示(グラフ用の部品は使わずHTMLとCSSだけで作る)
  function renderChart(recs) {
    clear(chartEl);
    var period = periodEl.value;
    var target = recs.filter(function (r) {
      if (period === "week") { return inWeek(r); }
      if (period === "month") { return inMonth(r); }
      return true;
    });
    var byCourse = {};
    target.forEach(function (r) {
      byCourse[r.course] = (byCourse[r.course] || 0) + (Number(r.minutes) || 0);
    });
    var rows = Object.keys(byCourse).map(function (c) {
      return { course: c, minutes: byCourse[c] };
    }).sort(function (a, b) {
      return b.minutes - a.minutes;
    });
    if (rows.length === 0) {
      chartEl.appendChild(h("p", { class: "note", text: "この期間の記録はありません。" }));
      return;
    }
    var max = rows[0].minutes;
    rows.forEach(function (row) {
      var fill = h("div", { class: "bar-fill" });
      fill.style.width = Math.max(2, Math.round(row.minutes / max * 100)) + "%";
      chartEl.appendChild(h("div", { class: "bar-row" },
        h("span", { class: "bar-label", text: row.course }),
        h("div", { class: "bar-track" }, fill),
        h("span", { class: "bar-value", text: fmtMinutes(row.minutes) })));
    });
  }

  function renderList(recs) {
    clear(listEl);
    if (recs.length === 0) {
      listEl.appendChild(h("p", { class: "note", text: "まだ記録がありません。「記録を追加する」から入力してください。" }));
      return;
    }
    // 新しい順(同じ日は後から追加したものが上)
    var sorted = recs.slice().sort(function (a, b) {
      if (a.date !== b.date) { return a.date < b.date ? 1 : -1; }
      return a.id < b.id ? 1 : -1;
    });
    var ul = h("ul", { class: "records" });
    sorted.forEach(function (r) {
      ul.appendChild(h("li", { class: "record" },
        h("div", { class: "record-head" },
          h("strong", { text: r.date }), " ",
          h("span", { class: "badge", text: r.course }), " ",
          h("span", { text: fmtMinutes(r.minutes) })),
        h("p", { text: r.content }),
        r.reflection ? h("p", { class: "note", text: "💭 " + r.reflection }) : null,
        h("div", { class: "actions" },
          h("a", { class: "button button-secondary", href: "add.html?id=" + encodeURIComponent(r.id), text: "編集" }), " ",
          h("button", {
            type: "button",
            class: "button button-danger",
            text: "削除",
            onclick: function () {
              if (window.confirm("この記録を削除しますか?\n" + r.date + " " + r.course)) {
                Store.remove(KEYS.study, r.id);
                setMessage(messageEl, "削除しました。", false);
                renderAll();
              }
            }
          }))));
    });
    listEl.appendChild(ul);
  }

  function renderAll() {
    var recs = Store.load(KEYS.study);
    renderTotals(recs);
    renderChart(recs);
    renderList(recs);
  }

  periodEl.addEventListener("change", renderAll);
  renderAll();
})();
