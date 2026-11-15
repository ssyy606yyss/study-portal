// データの「保存と読み込み」を担当するファイル
//
// 保存先:ブラウザの localStorage(このブラウザの中だけに残る)
// localStorage は文字列しか保存できないので、JSON という文字列形式に変換して保存する
// 1つのキーに「記録の配列」を丸ごと入れる。1件は必ず id(背番号)を持つ

var Store = (function () {

  // 保存されている配列を返す。何も無い/壊れている場合は空の配列
  function load(key) {
    try {
      var text = localStorage.getItem(key);
      if (text === null) {
        return [];
      }
      var data = JSON.parse(text);
      return Array.isArray(data) ? data : [];
    } catch (e) {
      return [];
    }
  }

  // 配列を丸ごと保存する。成功したら true
  function save(key, list) {
    try {
      localStorage.setItem(key, JSON.stringify(list));
      return true;
    } catch (e) {
      // 容量オーバーや、保存が禁止されている環境など
      return false;
    }
  }

  // 他と重ならない id を作る
  function newId() {
    return String(Date.now()) + "-" + Math.floor(Math.random() * 1000);
  }

  // id で1件取り出す(無ければ null)
  function get(key, id) {
    var list = load(key);
    for (var i = 0; i < list.length; i++) {
      if (list[i].id === id) {
        return list[i];
      }
    }
    return null;
  }

  // 同じ id があれば置き換え、無ければ追加する
  function upsert(key, item) {
    var list = load(key);
    var found = false;
    for (var i = 0; i < list.length; i++) {
      if (list[i].id === item.id) {
        list[i] = item;
        found = true;
        break;
      }
    }
    if (!found) {
      list.push(item);
    }
    return save(key, list);
  }

  // id で削除する
  function remove(key, id) {
    var list = load(key).filter(function (x) {
      return x.id !== id;
    });
    return save(key, list);
  }

  return { load: load, save: save, newId: newId, get: get, upsert: upsert, remove: remove };
})();
