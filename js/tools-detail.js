// 業務ツール1件の詳細ページ(tools/detail.html 用)

(function () {
  var detailEl = document.getElementById("detail");
  var id = getQuery("id");
  var tool = id ? Store.get(KEYS.tools, id) : null;

  if (!tool) {
    detailEl.appendChild(h("p", { class: "message-error", text: "ツールが見つかりません。" }));
    return;
  }

  document.title = tool.name + " | 学習ポータル";

  function row(label, value) {
    return [h("dt", { text: label }), h("dd", null, value || "(未入力)")];
  }

  detailEl.appendChild(h("h1", { text: tool.name }));
  detailEl.appendChild(h("dl", { class: "detail-list" },
    row("分類", tool.category),
    row("習熟度", tool.level),
    row("用途", tool.purpose),
    row("使った期間", tool.period),
    row("公式ドキュメント", tool.officialUrl ? externalLink(tool.officialUrl, tool.officialUrl) : ""),
    row("使い方メモ・ハマりどころ", tool.notes ? h("div", { class: "pre-text", text: tool.notes }) : "")));

  detailEl.appendChild(h("p", { class: "actions" },
    h("a", { class: "button", href: "edit.html?id=" + encodeURIComponent(tool.id), text: "編集する" }), " ",
    h("button", {
      type: "button",
      class: "button button-danger",
      text: "削除",
      onclick: function () {
        if (window.confirm("このツールを削除しますか?\n" + tool.name)) {
          Store.remove(KEYS.tools, tool.id);
          location.href = "index.html";
        }
      }
    })));
})();
