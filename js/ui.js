// 画面を作るときの共通の小道具
//
// 画面に文字を出すときは、必ず textContent(文字として扱う)を使う。
// innerHTML は「入力した文字がHTMLとして実行される」危険があるので使わない。

// 子要素を追加する(文字・要素・配列のどれでも渡せる)
function addChild(parent, child) {
  if (child === null || child === undefined || child === false) {
    return;
  }
  if (Array.isArray(child)) {
    child.forEach(function (c) {
      addChild(parent, c);
    });
    return;
  }
  if (typeof child === "object") {
    parent.appendChild(child);
    return;
  }
  parent.appendChild(document.createTextNode(String(child)));
}

// HTML要素を作る。h("p", { class: "note", text: "こんにちは" }, 子要素...)
function h(tag, props) {
  var el = document.createElement(tag);
  var p = props || {};
  Object.keys(p).forEach(function (k) {
    var v = p[k];
    if (v === null || v === undefined || v === false) {
      return;
    }
    if (k === "text") {
      el.textContent = v;
    } else if (k === "class") {
      el.className = v;
    } else if (k.slice(0, 2) === "on") {
      el.addEventListener(k.slice(2), v);
    } else {
      el.setAttribute(k, v === true ? "" : String(v));
    }
  });
  for (var i = 2; i < arguments.length; i++) {
    addChild(el, arguments[i]);
  }
  return el;
}

// SVG(グラフ用の図形)の要素を作る
function svg(tag, props) {
  var el = document.createElementNS("http://www.w3.org/2000/svg", tag);
  var p = props || {};
  Object.keys(p).forEach(function (k) {
    if (k === "text") {
      el.textContent = p[k];
    } else {
      el.setAttribute(k, String(p[k]));
    }
  });
  for (var i = 2; i < arguments.length; i++) {
    addChild(el, arguments[i]);
  }
  return el;
}

// 中身を空にする
function clear(el) {
  while (el.firstChild) {
    el.removeChild(el.firstChild);
  }
}

// ---- 日付 ----
function pad2(n) {
  return String(n).padStart(2, "0");
}

// Date → "2026-11-15"(toISOString は時差で前日になることがあるので使わない)
function dateString(d) {
  return d.getFullYear() + "-" + pad2(d.getMonth() + 1) + "-" + pad2(d.getDate());
}

function todayString() {
  return dateString(new Date());
}

// "2026-11-15" → Date(その日の0時)
function parseDate(s) {
  var p = s.split("-");
  return new Date(Number(p[0]), Number(p[1]) - 1, Number(p[2]));
}

function addDays(d, n) {
  var x = new Date(d.getFullYear(), d.getMonth(), d.getDate());
  x.setDate(x.getDate() + n);
  return x;
}

// ---- 表示用の整形 ----
// 150 → "2時間30分"
function fmtMinutes(m) {
  var n = Number(m) || 0;
  var hr = Math.floor(n / 60);
  var mi = n % 60;
  if (hr === 0) {
    return mi + "分";
  }
  if (mi === 0) {
    return hr + "時間";
  }
  return hr + "時間" + mi + "分";
}

// 3 → "★★★☆☆"
function stars(n) {
  var k = Number(n) || 0;
  return "★".repeat(k) + "☆".repeat(5 - k);
}

// ---- 安全のためのチェック ----
// http / https のURLだけを「安全なリンク」とみなす
// (javascript: などの危険なURLをリンクにしないため)
function isSafeUrl(u) {
  try {
    var x = new URL(u);
    return x.protocol === "http:" || x.protocol === "https:";
  } catch (e) {
    return false;
  }
}

// 外部サイトへのリンクを作る。安全でないURLなら、リンクにせず文字だけ出す
function externalLink(url, text) {
  if (isSafeUrl(url)) {
    return h("a", { href: url, target: "_blank", rel: "noopener noreferrer", text: text });
  }
  return h("span", { text: text });
}

// ---- その他 ----
// URLの ?name=値 を取り出す
function getQuery(name) {
  try {
    return new URLSearchParams(location.search).get(name);
  } catch (e) {
    return null;
  }
}

// 重複と空を除いて、五十音順に並べる
function uniqueSorted(arr) {
  var seen = {};
  var out = [];
  arr.forEach(function (x) {
    if (x && !seen[x]) {
      seen[x] = true;
      out.push(x);
    }
  });
  return out.sort(function (a, b) {
    return a.localeCompare(b, "ja");
  });
}

// メッセージ表示(成功は緑、失敗は赤)
function setMessage(el, text, isError) {
  if (!el) {
    return;
  }
  el.textContent = text;
  el.className = isError ? "message-error" : "message-ok";
}

// セレクトボックス(select)に選択肢を入れる
function fillSelect(select, options, allLabel) {
  clear(select);
  if (allLabel) {
    select.appendChild(h("option", { value: "", text: allLabel }));
  }
  options.forEach(function (o) {
    select.appendChild(h("option", { value: o, text: o }));
  });
}
