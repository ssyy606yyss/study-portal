// 勉強記録の追加・編集フォーム(study/add.html 用)
// URLに ?id=... が付いていれば「編集」、無ければ「追加」

(function () {
  var message = document.getElementById("message");
  var editId = getQuery("id");
  var editing = editId ? Store.get(KEYS.study, editId) : null;

  if (editId && !editing) {
    setMessage(message, "編集する記録が見つかりません。", true);
    return;
  }

  if (editing) {
    document.getElementById("page-title").textContent = "勉強記録を編集";
  }

  // 科目の候補:決まった候補 + これまでに使った科目 + 授業資料の科目
  var courses = uniqueSorted(DEFAULT_COURSES
    .concat(Store.load(KEYS.study).map(function (r) { return r.course; }))
    .concat(Store.load(KEYS.materials).map(function (r) { return r.course; })));

  var api = buildForm(document.getElementById("form-area"), {
    idPrefix: "s",
    submitLabel: editing ? "更新する" : "記録を保存する",
    initial: editing,
    fields: [
      { name: "date", label: "日付", type: "date", required: true, default: todayString },
      { name: "course", label: "科目", type: "text", required: true, maxlength: 50, datalist: courses },
      { name: "minutes", label: "勉強時間(分)", type: "number", required: true, min: 1, max: 1440 },
      { name: "content", label: "やったこと", type: "textarea", required: true, rows: 4, maxlength: 500 },
      { name: "reflection", label: "ひとこと振り返り", type: "textarea", rows: 2, maxlength: 300 }
    ],
    onSubmit: function (v) {
      var record = {
        id: editing ? editing.id : Store.newId(),
        date: v.date,
        course: v.course,
        minutes: v.minutes,
        content: v.content,
        reflection: v.reflection
      };
      if (!Store.upsert(KEYS.study, record)) {
        setMessage(message, "保存できませんでした。ブラウザの設定(サイトデータの保存)を確認してください。", true);
        return;
      }
      if (editing) {
        location.href = "index.html";
        return;
      }
      setMessage(message, "保存しました。(これまでの記録: " + Store.load(KEYS.study).length + "件)", false);
      // 続けて入力しやすいよう、日付と科目は残して他をクリア
      api.setValues({ date: v.date, course: v.course });
      api.focus("minutes");
    }
  });
})();
