// 入力フォームを「項目の定義」から作る共通部品(ui.js が先に必要)
//
// 使い方:
//   var api = buildForm(入れ先の要素, {
//     idPrefix: "x", fields: [...], initial: 初期値, submitLabel: "保存",
//     onSubmit: function (values) { ... }
//   });
//
// fields の1項目:
//   name(キー名) label(表示名) type(text/number/date/url/textarea/select)
//   required(必須か) maxlength min max options(selectの選択肢) datalist(入力候補)
//   hint(補足の文) validate(独自チェック関数) default(初期値)

function buildForm(container, opts) {
  var prefix = opts.idPrefix || "f";
  var fields = opts.fields;
  var form = h("form", { class: "form", novalidate: true });
  var inputs = {};
  var errEls = {};

  fields.forEach(function (f) {
    var id = prefix + "-" + f.name;
    var errId = "err-" + id;
    var common = { id: id, name: f.name, "aria-describedby": errId };
    var input;

    if (f.type === "textarea") {
      input = h("textarea", Object.assign({}, common, {
        rows: f.rows || 3,
        maxlength: f.maxlength || 500
      }));
    } else if (f.type === "select") {
      var optionEls = [];
      if (f.allowEmpty) {
        optionEls.push(h("option", { value: "", text: f.emptyLabel || "選択してください" }));
      }
      f.options.forEach(function (o) {
        var value = typeof o === "object" ? o.value : o;
        var label = typeof o === "object" ? o.label : o;
        optionEls.push(h("option", { value: value, text: label }));
      });
      input = h("select", common, optionEls);
    } else {
      var isNumber = f.type === "number";
      var isDate = f.type === "date";
      input = h("input", Object.assign({}, common, {
        type: f.type || "text",
        maxlength: isNumber || isDate ? null : (f.maxlength || 200),
        min: f.min,
        max: f.max,
        step: isNumber ? 1 : null,
        inputmode: isNumber ? "numeric" : null,
        list: f.datalist ? id + "-list" : null
      }));
    }

    var datalistEl = null;
    if (f.datalist) {
      datalistEl = h("datalist", { id: id + "-list" }, f.datalist.map(function (v) {
        return h("option", { value: v });
      }));
    }

    var errEl = h("p", { class: "error", id: errId, hidden: true });
    inputs[f.name] = input;
    errEls[f.name] = errEl;

    form.appendChild(h("div", { class: "field" },
      h("label", { for: id, text: f.label + (f.required ? "(必須)" : "(任意)") }),
      f.hint ? h("p", { class: "hint", text: f.hint }) : null,
      input,
      datalistEl,
      errEl));
  });

  var submitButton = h("button", { type: "submit", class: "button", text: opts.submitLabel || "保存する" });
  form.appendChild(h("p", null, submitButton));
  container.appendChild(form);

  function showError(name, text) {
    var el = errEls[name];
    var input = inputs[name];
    if (text) {
      el.textContent = text;
      el.hidden = false;
      input.setAttribute("aria-invalid", "true");
    } else {
      el.textContent = "";
      el.hidden = true;
      input.removeAttribute("aria-invalid");
    }
  }

  function clearErrors() {
    fields.forEach(function (f) {
      showError(f.name, "");
    });
  }

  // 入力欄の値を集める(数値は数に変換)
  function getValues() {
    var v = {};
    fields.forEach(function (f) {
      var raw = inputs[f.name].value;
      var s = f.type === "select" ? raw : raw.trim();
      if (f.type === "number") {
        v[f.name] = s === "" ? "" : Number(s);
      } else {
        v[f.name] = s;
      }
    });
    return v;
  }

  // 入力チェック。{ ok, first(最初の問題の入力欄), values } を返す
  function validate() {
    var first = null;
    var vals = getValues();
    fields.forEach(function (f) {
      var msg = "";
      var val = vals[f.name];
      if (f.required && val === "") {
        msg = f.label + "を" + (f.type === "select" ? "選択" : "入力") + "してください。";
      } else if (val !== "") {
        if (f.type === "number") {
          var bad = !Number.isInteger(val) ||
            (f.min !== undefined && val < f.min) ||
            (f.max !== undefined && val > f.max);
          if (bad) {
            msg = f.label + "は" + f.min + "〜" + f.max + "の整数で入力してください。";
          }
        } else if (f.type === "url" && !isSafeUrl(val)) {
          msg = "http:// または https:// で始まるURLを入力してください。";
        } else if (f.type === "date" && !/^\d{4}-\d{2}-\d{2}$/.test(val)) {
          msg = "日付の形式が正しくありません。";
        }
      }
      if (!msg && f.validate) {
        msg = f.validate(val, vals) || "";
      }
      showError(f.name, msg);
      if (msg && first === null) {
        first = inputs[f.name];
      }
    });
    return { ok: first === null, first: first, values: vals };
  }

  // 入力欄に値を入れる。値が無い項目は default(無ければ空)にする
  function setValues(obj) {
    fields.forEach(function (f) {
      var v = obj ? obj[f.name] : undefined;
      if (v === undefined || v === null) {
        v = typeof f.default === "function" ? f.default() : (f.default || "");
        // 選択式で、空欄を許していない項目は、先頭の選択肢を選んでおく
        if (v === "" && f.type === "select" && !f.allowEmpty && f.options.length > 0) {
          v = typeof f.options[0] === "object" ? f.options[0].value : f.options[0];
        }
      }
      inputs[f.name].value = String(v);
    });
    clearErrors();
  }

  form.addEventListener("submit", function (event) {
    // フォームの標準送信(ページ移動)を止める
    event.preventDefault();
    var r = validate();
    if (!r.ok) {
      r.first.focus();
      return;
    }
    opts.onSubmit(r.values);
  });

  setValues(opts.initial);

  return {
    form: form,
    setValues: setValues,
    focus: function (name) {
      inputs[name].focus();
    },
    setSubmitLabel: function (text) {
      submitButton.textContent = text;
    }
  };
}
