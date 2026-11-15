// 業務ツールの追加・編集(tools/edit.html 用)
// URLに ?id=... があれば編集

(function () {
  var message = document.getElementById("message");
  var editId = getQuery("id");
  var editing = editId ? Store.get(KEYS.tools, editId) : null;

  if (editId && !editing) {
    setMessage(message, "編集するツールが見つかりません。", true);
    return;
  }
  if (editing) {
    document.getElementById("page-title").textContent = "業務ツールを編集";
  }

  buildForm(document.getElementById("form-area"), {
    idPrefix: "t",
    submitLabel: editing ? "更新する" : "ツールを保存する",
    initial: editing,
    fields: [
      { name: "name", label: "ツール名", type: "text", required: true, maxlength: 100 },
      { name: "category", label: "分類", type: "select", required: true, options: TOOL_CATEGORIES },
      { name: "purpose", label: "用途(何に使ったか)", type: "text", required: true, maxlength: 200 },
      { name: "period", label: "使った期間", type: "text", maxlength: 100, hint: "例: 2024年4月〜現在" },
      { name: "level", label: "習熟度", type: "select", required: true, options: TOOL_LEVELS },
      { name: "officialUrl", label: "公式ドキュメントのURL", type: "url", maxlength: 500 },
      {
        name: "notes", label: "使い方メモ・ハマりどころ", type: "textarea", rows: 8, maxlength: 3000,
        hint: "※業務の機密情報(社名・顧客名・社内URLなど)は書かないこと。"
      }
    ],
    onSubmit: function (v) {
      var tool = {
        id: editing ? editing.id : Store.newId(),
        name: v.name,
        category: v.category,
        purpose: v.purpose,
        period: v.period,
        level: v.level,
        officialUrl: v.officialUrl,
        notes: v.notes
      };
      if (!Store.upsert(KEYS.tools, tool)) {
        setMessage(message, "保存できませんでした。", true);
        return;
      }
      location.href = "detail.html?id=" + encodeURIComponent(tool.id);
    }
  });
})();
