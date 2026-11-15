// トップページ:いまの状況と最近の勉強記録(index.html 用)

(function () {
  var summaryEl = document.getElementById("summary");
  var recentEl = document.getElementById("recent");

  var study = Store.load(KEYS.study);
  var books = Store.load(KEYS.books);
  var certs = Store.load(KEYS.certs);

  var finished = books.filter(function (b) { return b.status === "読了"; }).length;
  var upcoming = certs.filter(function (c) { return c.status === "勉強中" && c.examDate && c.examDate >= todayString(); })
    .sort(function (a, b) { return a.examDate < b.examDate ? -1 : 1; });

  [
    ["勉強記録", study.length + "件"],
    ["授業資料リンク", Store.load(KEYS.materials).length + "件"],
    ["読書", books.length + "冊(読了 " + finished + "冊)"],
    ["資格", certs.length + "件" + (upcoming.length ? "(次の試験: " + upcoming[0].name + " " + upcoming[0].examDate + ")" : "")],
    ["業務ツール", Store.load(KEYS.tools).length + "件"]
  ].forEach(function (pair) {
    summaryEl.appendChild(h("li", null,
      h("span", { class: "summary-label", text: pair[0] }),
      h("strong", { text: pair[1] })));
  });

  var recent = study.slice().sort(function (a, b) {
    if (a.date !== b.date) { return a.date < b.date ? 1 : -1; }
    return a.id < b.id ? 1 : -1;
  }).slice(0, 5);

  if (recent.length === 0) {
    recentEl.appendChild(h("p", { class: "note" }, "まだ記録がありません。",
      h("a", { href: "study/add.html", text: "勉強記録を追加" }), "してみましょう。"));
  } else {
    recentEl.appendChild(h("ul", { class: "records" }, recent.map(function (r) {
      return h("li", { class: "record" },
        h("div", { class: "record-head" },
          h("strong", { text: r.date }), " ",
          h("span", { class: "badge", text: r.course }), " ",
          h("span", { text: fmtMinutes(r.minutes) })),
        h("p", { text: r.content }));
    })));
  }
})();
