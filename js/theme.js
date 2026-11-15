// ダークモードの切り替え(全ページの <head> で読み込む)
// 選んだ設定は localStorage に残る

(function () {
  var KEY = "theme";
  var root = document.documentElement;

  try {
    var saved = localStorage.getItem(KEY);
    if (saved === "dark" || saved === "light") {
      root.setAttribute("data-theme", saved);
    }
  } catch (e) {
    // 保存が使えない環境でも、切り替え自体は動く
  }

  document.addEventListener("DOMContentLoaded", function () {
    var button = document.getElementById("theme-toggle");
    if (!button) {
      return;
    }

    function isDark() {
      return root.getAttribute("data-theme") === "dark";
    }

    function update() {
      button.textContent = isDark() ? "☀ ライト" : "🌙 ダーク";
      button.setAttribute("aria-pressed", isDark() ? "true" : "false");
    }

    button.addEventListener("click", function () {
      var next = isDark() ? "light" : "dark";
      root.setAttribute("data-theme", next);
      try {
        localStorage.setItem(KEY, next);
      } catch (e) {
        // 保存できなくても、このページでは切り替わる
      }
      update();
    });

    update();
  });
})();
