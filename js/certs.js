// 資格の一覧(certs/index.html 用)
// 試験日までのカウントダウン / 追加・編集・削除

(function () {
  var listEl = document.getElementById("list");
  var detailsEl = document.getElementById("form-details");
  var messageEl = document.getElementById("message");
  var editing = null;

  // 試験日までの日数(今日が試験日なら 0、過ぎていれば負の数)
  function daysUntil(dateStr) {
    return Math.round((parseDate(dateStr) - parseDate(todayString())) / 86400000);
  }

  function countdownText(c) {
    if (c.status !== "勉強中") { return c.status; }
    if (!c.examDate) { return "試験日は未定"; }
    var d = daysUntil(c.examDate);
    if (d > 0) { return "あと " + d + "日"; }
    if (d === 0) { return "今日が試験日です"; }
    return "試験日を過ぎました(受験済)";
  }

  function render() {
    clear(listEl);
    var certs = Store.load(KEYS.certs).sort(function (a, b) {
      // 試験日が近い順(試験日が未定のものは後ろ)
      if (!a.examDate && !b.examDate) { return 0; }
      if (!a.examDate) { return 1; }
      if (!b.examDate) { return -1; }
      return a.examDate < b.examDate ? -1 : 1;
    });
    if (certs.length === 0) {
      listEl.appendChild(h("p", { class: "note", text: "まだ資格が登録されていません。「資格を追加する」から登録できます。" }));
      return;
    }
    listEl.appendChild(h("ul", { class: "records" }, certs.map(function (c) {
      return h("li", { class: "record" },
        h("div", { class: "record-head" },
          h("strong", { text: c.name }), " ",
          h("span", { class: "badge", text: c.status }), " ",
          h("span", { class: "countdown", text: countdownText(c) })),
        h("p", { class: "note" },
          c.examDate ? "試験日: " + c.examDate : "試験日: 未定",
          c.targetScore ? "　目標点: " + c.targetScore : ""),
        c.memo ? h("p", { text: c.memo }) : null,
        h("div", { class: "actions" },
          h("a", { class: "button button-secondary", href: "log.html?cert=" + encodeURIComponent(c.id), text: "得点の記録" }), " ",
          h("button", { type: "button", class: "button button-secondary", text: "編集", onclick: function () { startEdit(c); } }), " ",
          h("button", {
            type: "button",
            class: "button button-danger",
            text: "削除",
            onclick: function () {
              if (window.confirm("この資格と、その得点の記録を削除しますか?\n" + c.name)) {
                Store.remove(KEYS.certs, c.id);
                // その資格の得点記録も一緒に消す
                Store.save(KEYS.scores, Store.load(KEYS.scores).filter(function (s) {
                  return s.certId !== c.id;
                }));
                setMessage(messageEl, "削除しました。", false);
                render();
              }
            }
          })));
    })));
  }

  var api = buildForm(document.getElementById("form-area"), {
    idPrefix: "c",
    submitLabel: "追加する",
    initial: { status: CERT_STATUSES[0] },
    fields: [
      { name: "name", label: "資格名", type: "text", required: true, maxlength: 100 },
      { name: "examDate", label: "試験日", type: "date" },
      { name: "status", label: "状態", type: "select", required: true, options: CERT_STATUSES },
      { name: "targetScore", label: "目標点", type: "number", min: 0, max: 100000 },
      { name: "memo", label: "メモ", type: "textarea", rows: 2, maxlength: 300 }
    ],
    onSubmit: function (v) {
      var cert = {
        id: editing ? editing.id : Store.newId(),
        name: v.name, examDate: v.examDate, status: v.status,
        targetScore: v.targetScore === "" ? "" : v.targetScore, memo: v.memo
      };
      if (!Store.upsert(KEYS.certs, cert)) {
        setMessage(messageEl, "保存できませんでした。", true);
        return;
      }
      setMessage(messageEl, editing ? "更新しました。" : "追加しました。", false);
      editing = null;
      api.setSubmitLabel("追加する");
      api.setValues({ status: CERT_STATUSES[0] });
      render();
    }
  });

  function startEdit(c) {
    editing = c;
    api.setValues(c);
    api.setSubmitLabel("更新する");
    detailsEl.open = true;
    detailsEl.scrollIntoView();
    api.focus("name");
  }

  render();
})();
