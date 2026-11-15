// 業務ツールの一覧(tools/index.html 用)
// キーワード・分類・習熟度で絞り込み

(function () {
  var listEl = document.getElementById("list");
  var searchEl = document.getElementById("q");
  var categoryEl = document.getElementById("category");
  var levelEl = document.getElementById("level");

  fillSelect(categoryEl, TOOL_CATEGORIES, "すべて");
  fillSelect(levelEl, TOOL_LEVELS, "すべて");

  function matches(t) {
    if (categoryEl.value && t.category !== categoryEl.value) { return false; }
    if (levelEl.value && t.level !== levelEl.value) { return false; }
    var q = searchEl.value.trim().toLowerCase();
    if (q) {
      var text = [t.name, t.purpose, t.notes, t.category].join(" ").toLowerCase();
      if (text.indexOf(q) < 0) { return false; }
    }
    return true;
  }

  function render() {
    clear(listEl);
    var tools = Store.load(KEYS.tools).filter(matches).sort(function (a, b) {
      return a.name.localeCompare(b.name, "ja");
    });
    if (tools.length === 0) {
      listEl.appendChild(h("p", { class: "note", text: "該当するツールがありません。「ツールを追加する」から登録できます。" }));
      return;
    }
    listEl.appendChild(h("ul", { class: "records" }, tools.map(function (t) {
      return h("li", { class: "record" },
        h("div", { class: "record-head" },
          h("a", { href: "detail.html?id=" + encodeURIComponent(t.id), text: t.name }), " ",
          h("span", { class: "badge", text: t.category }), " ",
          h("span", { class: "badge", text: t.level })),
        h("p", { text: t.purpose }),
        t.period ? h("p", { class: "note", text: "期間: " + t.period }) : null);
    })));
  }

  searchEl.addEventListener("input", render);
  categoryEl.addEventListener("change", render);
  levelEl.addEventListener("change", render);
  render();
})();
