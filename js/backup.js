// データの書き出し(バックアップ)と読み込み(復元)(data.html 用)

(function () {
  var exportBtn = document.getElementById("export-btn");
  var fileEl = document.getElementById("import-file");
  var importBtn = document.getElementById("import-btn");
  var messageEl = document.getElementById("message");
  var countsEl = document.getElementById("counts");

  var LABELS = {
    studyRecords: "勉強記録",
    materialLinks: "授業資料リンク",
    tools: "業務ツール",
    books: "読書",
    certs: "資格",
    certScores: "資格の得点記録"
  };
  var MAX_BYTES = 5 * 1024 * 1024; // 5MBまで

  function renderCounts() {
    clear(countsEl);
    Object.keys(KEYS).forEach(function (name) {
      var key = KEYS[name];
      countsEl.appendChild(h("li", null,
        h("span", { class: "summary-label", text: LABELS[key] }),
        h("strong", { text: Store.load(key).length + "件" })));
    });
  }

  // ---- 書き出し ----
  exportBtn.addEventListener("click", function () {
    var data = {};
    Object.keys(KEYS).forEach(function (name) {
      data[KEYS[name]] = Store.load(KEYS[name]);
    });
    var backup = { app: "study-portal", version: 1, exportedAt: new Date().toISOString(), data: data };
    var blob = new Blob([JSON.stringify(backup, null, 2)], { type: "application/json" });
    var url = URL.createObjectURL(blob);
    var a = h("a", { href: url, download: "study-portal-backup-" + todayString() + ".json" });
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    setMessage(messageEl, "書き出しました。ダウンロードされたファイルを大切に保管してください。", false);
  });

  // ---- 読み込み(中身をしっかり確認してから保存する) ----
  var knownKeys = Object.keys(KEYS).map(function (n) { return KEYS[n]; });

  // 問題があれば、その説明文を返す。問題なければ空文字
  function checkBackup(obj) {
    if (!obj || typeof obj !== "object" || obj.app !== "study-portal" || !obj.data || typeof obj.data !== "object") {
      return "このサイトのバックアップファイルではありません。";
    }
    var keys = Object.keys(obj.data);
    for (var i = 0; i < keys.length; i++) {
      var k = keys[i];
      if (knownKeys.indexOf(k) < 0) {
        return "知らないデータの種類が含まれています: " + k;
      }
      if (!Array.isArray(obj.data[k])) {
        return "データの形式が正しくありません: " + k;
      }
      for (var j = 0; j < obj.data[k].length; j++) {
        var item = obj.data[k][j];
        if (!item || typeof item !== "object" || Array.isArray(item) || typeof item.id !== "string") {
          return "記録の形式が正しくありません: " + k;
        }
      }
    }
    return "";
  }

  importBtn.addEventListener("click", function () {
    var file = fileEl.files && fileEl.files[0];
    if (!file) {
      setMessage(messageEl, "読み込むファイルを選んでください。", true);
      return;
    }
    if (file.size > MAX_BYTES) {
      setMessage(messageEl, "ファイルが大きすぎます(5MBまで)。", true);
      return;
    }
    var reader = new FileReader();
    reader.onload = function () {
      var obj;
      try {
        obj = JSON.parse(String(reader.result));
      } catch (e) {
        setMessage(messageEl, "JSONとして読み込めませんでした。", true);
        return;
      }
      var problem = checkBackup(obj);
      if (problem) {
        setMessage(messageEl, problem, true);
        return;
      }
      var keys = Object.keys(obj.data);
      if (!window.confirm("ファイル内の " + keys.length + " 種類のデータで、現在のデータを置き換えます。\nよろしいですか?")) {
        return;
      }
      var ok = keys.every(function (k) { return Store.save(k, obj.data[k]); });
      setMessage(messageEl, ok ? "読み込みました。" : "保存できなかったデータがあります。", !ok);
      renderCounts();
    };
    reader.onerror = function () {
      setMessage(messageEl, "ファイルを読み込めませんでした。", true);
    };
    reader.readAsText(file);
  });

  renderCounts();
})();
