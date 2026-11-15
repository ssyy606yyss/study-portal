// 本の紹介ページ(books/review.html 用)

(function () {
  var detailEl = document.getElementById("detail");
  var id = getQuery("id");
  var book = id ? Store.get(KEYS.books, id) : null;

  if (!book) {
    detailEl.appendChild(h("p", { class: "message-error", text: "本が見つかりません。" }));
    return;
  }

  document.title = book.title + " | 学習ポータル";

  function section(title, text) {
    return [
      h("h2", { text: title }),
      text ? h("div", { class: "pre-text", text: text }) : h("p", { class: "note", text: "(未入力)" })
    ];
  }

  detailEl.appendChild(h("h1", { text: book.title }));
  detailEl.appendChild(h("p", null,
    book.author ? book.author + " / " : "",
    h("span", { class: "badge", text: book.status }),
    book.rating ? h("span", { "aria-label": "評価 " + book.rating + " / 5", text: "　" + stars(book.rating) }) : "",
    book.finishedDate ? "　読了日: " + book.finishedDate : ""));
  addChild(detailEl, section("あらすじ", book.synopsis));
  addChild(detailEl, section("おすすめポイント", book.recommend));
  addChild(detailEl, section("感想", book.review));
  detailEl.appendChild(h("p", { class: "note" }, "編集は ",
    h("a", { href: "index.html", text: "読書の一覧" }), " の「編集」から行えます。"));
})();
