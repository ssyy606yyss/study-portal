// 全ページで共通に使う「決まりごと」(保存キー名・選択肢など)をここにまとめる
// 選択肢を変えたいときは、このファイルだけ直せばよい

// localStorage の保存キー(データの種類ごとに1つ)
var KEYS = {
  study: "studyRecords",
  materials: "materialLinks",
  tools: "tools",
  books: "books",
  certs: "certs",
  scores: "certScores"
};

var MATERIAL_FIELDS = ["数学", "物理", "化学", "その他"];
var MATERIAL_TYPES = ["講義資料", "演習", "動画", "その他"];

var TOOL_CATEGORIES = ["開発", "設計", "管理", "インフラ", "コミュニケーション", "その他"];
var TOOL_LEVELS = ["触った程度", "実務で使える", "人に教えられる"];

var BOOK_STATUSES = ["読みたい", "読書中", "読了"];

var CERT_STATUSES = ["勉強中", "受験済", "合格", "不合格"];
var SCORE_KINDS = ["模試", "過去問"];

// 勉強記録の科目の候補(使った科目は自動で候補に追加される)
var DEFAULT_COURSES = ["数学", "物理", "化学", "プログラミング", "資格"];
