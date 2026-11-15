// 読書記録の一覧(books/index.html 用)
// 状態(読みたい/読書中/読了)で絞り込み / 追加・編集・削除

(function () {
  var listEl = document.getElementById("list");
  var statusEl = document.getElementById("status");
  var detailsEl = document.getElementById("form-details");
  var messageEl = document.getElementById("message");
  var editing = null;

  fillSelect(statusEl, BOOK_STATUSES, "すべて");

  function render() {
    clear(listEl);
    var books = Store.load(KEYS.books).filter(function (b) {
      return !statusEl.value || b.status === statusEl.value;
    }).sort(function (a, b) {
      // 読了日が新しい順(読了日が無いものは後ろ)
      return (b.finishedDate || "").localeCompare(a.finishedDate || "");
    });
    if (books.length === 0) {
      listEl.appendChild(h("p", { class: "note", text: "該当する本がありません。「本を追加する」から登録できます。" }));
      return;
    }
    listEl.appendChild(h("ul", { class: "records" }, books.map(function (b) {
      return h("li", { class: "record" },
        h("div", { class: "record-head" },
          h("a", { href: "review.html?id=" + encodeURIComponent(b.id), text: b.title }),
          b.author ? " / " + b.author : "", " ",
          h("span", { class: "badge", text: b.status })),
        h("p", { class: "note" },
          b.rating ? h("span", { "aria-label": "評価 " + b.rating + " / 5", text: stars(b.rating) }) : "未評価",
          b.finishedDate ? "　読了日: " + b.finishedDate : ""),
        h("div", { class: "actions" },
          h("button", { type: "button", class: "button button-secondary", text: "編集", onclick: function () { startEdit(b); } }), " ",
          h("button", {
            type: "button",
            class: "button button-danger",
            text: "削除",
            onclick: function () {
              if (window.confirm("この本の記録を削除しますか?\n" + b.title)) {
                Store.remove(KEYS.books, b.id);
                setMessage(messageEl, "削除しました。", false);
                render();
              }
            }
          })));
    })));
  }

  var api = buildForm(document.getElementById("form-area"), {
    idPrefix: "b",
    submitLabel: "追加する",
    initial: { status: BOOK_STATUSES[0] },
    fields: [
      { name: "title", label: "書名", type: "text", required: true, maxlength: 150 },
      { name: "author", label: "著者", type: "text", maxlength: 100 },
      { name: "status", label: "状態", type: "select", required: true, options: BOOK_STATUSES },
      {
        name: "finishedDate", label: "読了日", type: "date",
        validate: function (val, all) {
          return all.status === "読了" && val === "" ? "状態が「読了」のときは読了日を入力してください。" : "";
        }
      },
      {
        name: "rating", label: "評価", type: "select", allowEmpty: true, emptyLabel: "未評価",
        options: ["1", "2", "3", "4", "5"], hint: "★の数(1〜5)"
      },
      { name: "synopsis", label: "あらすじ", type: "textarea", rows: 3, maxlength: 1000 },
      { name: "recommend", label: "おすすめポイント", type: "textarea", rows: 3, maxlength: 1000 },
      { name: "review", label: "感想", type: "textarea", rows: 3, maxlength: 1000 }
    ],
    onSubmit: function (v) {
      var book = {
        id: editing ? editing.id : Store.newId(),
        title: v.title, author: v.author, status: v.status, finishedDate: v.finishedDate,
        rating: v.rating === "" ? 0 : Number(v.rating),
        synopsis: v.synopsis, recommend: v.recommend, review: v.review
      };
      if (!Store.upsert(KEYS.books, book)) {
        setMessage(messageEl, "保存できませんでした。", true);
        return;
      }
      setMessage(messageEl, editing ? "更新しました。" : "追加しました。", false);
      editing = null;
      api.setSubmitLabel("追加する");
      api.setValues({ status: BOOK_STATUSES[0] });
      render();
    }
  });

  function startEdit(b) {
    editing = b;
    api.setValues(Object.assign({}, b, { rating: b.rating ? String(b.rating) : "" }));
    api.setSubmitLabel("更新する");
    detailsEl.open = true;
    detailsEl.scrollIntoView();
    api.focus("title");
  }

  statusEl.addEventListener("change", render);
  render();
})();
