// 授業資料リンク集(materials/index.html 用)
// 分野で絞り込み / キーワード検索 / お気に入り★ / 追加・編集・削除

(function () {
  var navEl = document.getElementById("field-nav");
  var listEl = document.getElementById("list");
  var searchEl = document.getElementById("q");
  var favOnlyEl = document.getElementById("fav-only");
  var detailsEl = document.getElementById("form-details");
  var messageEl = document.getElementById("message");

  var field = getQuery("field");
  if (MATERIAL_FIELDS.indexOf(field) < 0) {
    field = "";
  }
  var editing = null;

  // ---- 分野タブ ----
  function renderNav() {
    clear(navEl);
    ["すべて"].concat(MATERIAL_FIELDS).forEach(function (label) {
      var active = (label === "すべて" && field === "") || label === field;
      navEl.appendChild(h("a", {
        href: label === "すべて" ? "index.html" : "index.html?field=" + encodeURIComponent(label),
        "aria-current": active ? "true" : null,
        text: label
      }));
    });
  }

  // ---- 一覧 ----
  function matches(it) {
    if (field && it.field !== field) { return false; }
    if (favOnlyEl.checked && !it.favorite) { return false; }
    var q = searchEl.value.trim().toLowerCase();
    if (q) {
      var text = [it.title, it.course, it.memo, it.url, it.type].join(" ").toLowerCase();
      if (text.indexOf(q) < 0) { return false; }
    }
    return true;
  }

  function renderItem(it) {
    return h("li", { class: "record" },
      h("div", { class: "record-head" },
        h("button", {
          type: "button",
          class: "icon-button",
          "aria-pressed": it.favorite ? "true" : "false",
          "aria-label": (it.favorite ? "お気に入りを外す: " : "お気に入りにする: ") + it.title,
          text: it.favorite ? "★" : "☆",
          onclick: function () { toggleFavorite(it.id); }
        }), " ",
        externalLink(it.url, it.title), " ",
        h("span", { class: "badge", text: it.type })),
      it.memo ? h("p", { class: "note", text: it.memo }) : null,
      h("div", { class: "actions" },
        h("button", { type: "button", class: "button button-secondary", text: "編集", onclick: function () { startEdit(it); } }), " ",
        h("button", {
          type: "button",
          class: "button button-danger",
          text: "削除",
          onclick: function () {
            if (window.confirm("このリンクを削除しますか?\n" + it.title)) {
              Store.remove(KEYS.materials, it.id);
              setMessage(messageEl, "削除しました。", false);
              render();
            }
          }
        })));
  }

  function render() {
    clear(listEl);
    var items = Store.load(KEYS.materials).filter(matches).sort(function (a, b) {
      return (a.course + a.title).localeCompare(b.course + b.title, "ja");
    });
    if (items.length === 0) {
      listEl.appendChild(h("p", { class: "note", text: "該当するリンクがありません。下の「リンクを追加する」から登録できます。" }));
      return;
    }
    // お気に入りは先頭にまとめ、残りは科目ごとにまとめる
    var favs = items.filter(function (it) { return it.favorite; });
    var rest = items.filter(function (it) { return !it.favorite; });
    if (favs.length) {
      addGroup("★ お気に入り", favs);
    }
    var order = [];
    var groups = {};
    rest.forEach(function (it) {
      if (!groups[it.course]) {
        groups[it.course] = [];
        order.push(it.course);
      }
      groups[it.course].push(it);
    });
    order.forEach(function (course) {
      addGroup(course, groups[course]);
    });
  }

  function addGroup(title, items) {
    listEl.appendChild(h("h3", { text: title }));
    listEl.appendChild(h("ul", { class: "records" }, items.map(renderItem)));
  }

  function toggleFavorite(id) {
    var list = Store.load(KEYS.materials);
    list.forEach(function (it) {
      if (it.id === id) { it.favorite = !it.favorite; }
    });
    Store.save(KEYS.materials, list);
    render();
  }

  // ---- 追加・編集フォーム ----
  var courses = uniqueSorted(Store.load(KEYS.materials).map(function (it) { return it.course; })
    .concat(Store.load(KEYS.study).map(function (r) { return r.course; })));

  var api = buildForm(document.getElementById("form-area"), {
    idPrefix: "m",
    submitLabel: "追加する",
    initial: { field: field || MATERIAL_FIELDS[0] },
    fields: [
      { name: "field", label: "分野", type: "select", required: true, options: MATERIAL_FIELDS },
      { name: "course", label: "科目", type: "text", required: true, maxlength: 50, datalist: courses, hint: "例: 線形代数、力学、有機化学" },
      { name: "title", label: "タイトル", type: "text", required: true, maxlength: 100 },
      { name: "url", label: "URL", type: "url", required: true, maxlength: 500 },
      { name: "type", label: "種類", type: "select", required: true, options: MATERIAL_TYPES },
      { name: "memo", label: "メモ", type: "textarea", rows: 2, maxlength: 300 }
    ],
    onSubmit: function (v) {
      var base = editing ? editing : { favorite: false };
      var item = Object.assign({}, base, {
        id: editing ? editing.id : Store.newId(),
        field: v.field, course: v.course, title: v.title, url: v.url, type: v.type, memo: v.memo
      });
      if (!Store.upsert(KEYS.materials, item)) {
        setMessage(messageEl, "保存できませんでした。", true);
        return;
      }
      setMessage(messageEl, editing ? "更新しました。" : "追加しました。", false);
      editing = null;
      api.setSubmitLabel("追加する");
      api.setValues({ field: v.field, course: v.course });
      render();
    }
  });

  function startEdit(it) {
    editing = it;
    api.setValues(it);
    api.setSubmitLabel("更新する");
    detailsEl.open = true;
    detailsEl.scrollIntoView();
    api.focus("title");
  }

  searchEl.addEventListener("input", render);
  favOnlyEl.addEventListener("change", render);
  renderNav();
  render();
})();
