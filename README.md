# Altair - モダナイズドアーキテクチャ

## プロジェクト概要

**Altair** は、受験生向けの統合学習管理アプリケーションです。元々は4,598行の単一HTMLファイルで実装されていましたが、保守性と拡張性を向上させるため、以下の構造にモダナイズされました。

## ディレクトリ構造

```
altair_pages/
├── index.html           # アプリケーションの骨格（モーダルテンプレート）
├── css/
│   └── style.css        # 全体のスタイリング
└── js/
    ├── config.js        # グローバル設定・定数
    ├── store.js         # 状態管理・データ永続化
    ├── badges.js        # 実績バッジシステム
    ├── app-common.js    # 共通ユーティリティ関数
    ├── app-core.js      # コア機能（初期化・ナビゲーション）
    ├── app-study.js     # 学習機能（タイマー・カレンダー）
    ├── app-flash.js     # フラッシュカード機能
    ├── app-skill.js     # スキルツリー機能
    ├── app-grades.js    # 成績分析機能
    └── app-settings.js  # 設定・カスタマイズ機能
```

## モジュール依存関係

```
config.js (基盤)
    ↓
store.js (依存: config)
    ↓
┌── badges.js (依存: config, store)
├── app-common.js (依存: config, store)
│
app-core.js (依存: config, store, badges, common)
    ↓
app-study.js (依存: 全上位モジュール)
app-flash.js (依存: 全上位モジュール)
app-skill.js (依存: 全上位モジュール)
app-grades.js (依存: 全上位モジュール)
app-settings.js (依存: 全上位モジュール)
```

## モジュール説明

### 1. **config.js** (基盤モジュール)
**責務**: アプリ全体の定数・教科・カラー・設定値の定義

**主な内容**:
- `CFG.APP_NAME`, `CFG.STORAGE_KEY` - アプリ情報
- `CFG.DEFAULT_SUBJECTS` - デフォルト教科リスト
- `CFG.TEST_TYPES` - テスト種別
- `CFG.COLORS` - カラーパレット（背景・アクセント・ステータス）
- `CFG.SUBJECT_COLORS` - 教科別カラー
- `CFG.TIMER`, `CFG.PLAN` - タイマー・計画設定
- `CFG.BADGE_TIERS` - 実績レベルの定義

**修正例**:
- 新しい教科を追加: `DEFAULT_SUBJECTS` に追加
- テスト種別を変更: `TEST_TYPES` を編集
- アプリカラーを変更: `COLORS` を編集

---

### 2. **store.js** (状態管理)
**責務**: アプリケーション状態の定義・localStorage読み書き

**主な要素**:
- `S` オブジェクト - グローバル状態（すべてのモジュールが参照可能）
- `STATE_DEFAULTS` - 初期状態の定義
- `loadState()` - localStorageから状態を読み込み
- `saveState()` - 状態をlocalStorageに保存
- **タイマー状態**: 独立したkeyで管理
- **ヘルパー関数**: 
  - `generateId()` - ユニークIDの生成
  - `today()`, `localDateStr()` - 日付処理
  - `formatMs()` - ミリ秒をhh:mm:ss形式に
  - `getAllSubjects()` - デフォルト教科＋ユーザー追加教科のリスト
  - `getSessionsBySubject()` - 教科別に学習時間を集計
  - `generateTodayPlan()` - スマート計画生成エンジン
  - `updateStreak()` - 連続学習日数の更新

**データ構造**:
```javascript
S = {
  subjects: [],          // ユーザーが追加した教科
  events: [],            // カレンダー予定
  sessions: [],          // 学習セッション記録
  decks: [],             // フラッシュカードデッキ
  rounds: [],            // テスト記録
  skills: {},            // スキルツリー（教科ごと）
  earnedBadges: [],      // 獲得した実績
  plans: [],             // 日別学習計画
  streak: 0,             // 連続学習日数
  goal: null,            // 志望校・入試日・目標時間
  settings: {}           // ユーザー設定
}
```

**修正例**:
- データ構造に新しいフィールドを追加: `STATE_DEFAULTS` を編集
- 計画エンジンのロジックを変更: `generateTodayPlan()` を編集
- 新しい日付ユーティリティを追加: 関数を追加

---

### 3. **badges.js** (実績システム)
**責務**: 実績バッジの定義・判定ロジック

**主な内容**:
- `MS` オブジェクト - ミリ秒定数
- `BADGE_DEFS` 配列 - 約60個以上のバッジ定義
- `checkBadges()` - 条件をチェックして実績を付与

**バッジのカテゴリ**:
- 学習時間系: 累計時間・週間時間など
- 連続達成系: 連続日数・ストリーク
- 特殊達成系: あまり知られていないチャレンジ
- テスト系: テスト記録関連
- スキル系: スキルツリー完成度
- プロフィール系: ユーザー行動パターン

**修正例**:
- 新しい実績を追加: `BADGE_DEFS` に配列要素を追加
- 実績の判定条件を変更: バッジオブジェクトの `check` 関数を編集

---

### 4. **app-common.js** (共通ユーティリティ)
**責務**: UI操作・状態表示の共通関数

**主な関数**:
- `showToast(message)` - 画面下部に通知を表示
- `openModal(modalId)` - モーダルを開く
- `closeModal(modalId)` - モーダルを閉じる
- `fillSubjectSelects()` - 教科selectを自動生成
- `applyBackground()` - 背景画像を適用
- `hexToRgba(hex, alpha)` - hex色をrgbaに変換

**修正例**:
- トースト表示時間を変更: `showToast()` の実装を編集
- モーダルアニメーションを変更: `openModal()` を編集
- 新しいUI共通処理を追加: 関数を追加

---

### 5. **app-core.js** (コア機能)
**責務**: 初期化・ページナビゲーション・主要ページの描画

**主な関数**:
- `init()` - アプリケーション初期化（起動時に呼ばれる）
- `navigateTo(page)` - ページ切り替え
- `renderPage()` - 現在のページを描画
- `postRender()` - 描画後の処理（イベントリスナー登録など）
- `renderHome()` - ホームページ表示
- `renderStudyHub()` - 学習ハブ表示
- `renderPlanEngine()` - 計画エンジン表示
- `checkForUpdate()` - アプリ更新チェック

**修正例**:
- ホームページのレイアウトを変更: `renderHome()` を編集
- ナビゲーション時の初期化処理を追加: `navigateTo()` を編集

---

### 6. **app-study.js** (学習機能)
**責務**: タイマー・学習カレンダー・学習ログの管理

**主な関数**:
- `renderTimer()` - タイマーUIを描画
- `toggleT()` - タイマー開始/停止
- `recordSession(duration, subject)` - 学習セッションを記録
- `renderCalendar()` - 学習カレンダーを描画
- `renderStudyLog()` - 学習ログを表示
- `renderStudyLogCharts()` - 統計グラフを描画（Altair.js使用）

**グラフ機能**:
- 週間学習時間の棒グラフ
- 教科別円グラフ
- 学習トレンド

**修正例**:
- タイマーの単位を変更: `renderTimer()` を編集
- グラフの表示形式を変更: `renderStudyLogCharts()` を編集

---

### 7. **app-flash.js** (フラッシュカード機能)
**責務**: フラッシュカードシステムの管理

**主な関数**:
- `renderFlashcardHub()` - デッキ一覧表示
- `renderFlashcardSetup()` - デッキ選択・学習開始
- `renderFlashcardStudy()` - カード学習モード
- `flipCard()` - カードの表裏切り替え
- `rateCard(rating)` - カード評価（SM-2アルゴリズム）
- `startStudySession()` - 学習セッション開始

**特徴**:
- SM-2スペーシング・リピティション・アルゴリズムで最適な復習間隔を計算
- カード統計の記録（正解/不正解数）

**修正例**:
- 新しいカード形式を追加: `renderFlashcardStudy()` を編集
- SM-2パラメータを調整: `rateCard()` の計算ロジックを編集

---

### 8. **app-skill.js** (スキルツリー)
**責務**: スキルツリーの可視化・管理

**主な関数**:
- `renderSkillHub()` - スキルツリーハブ表示
- `openSkillMap()` - スキルマップをモーダルで開く
- `renderSkillTree(subject)` - スキルツリーをSVGで描画
- `addSkillNode()` - スキルノードを追加
- `deleteSkillNode()` - スキルノードを削除
- `initSkillMapPan()` - パンとズーム機能の初期化

**可視化技術**:
- SVG ツリー描画
- パン・ドラッグ動作
- ノードの完了状態を色分け

**修正例**:
- ツリーのレイアウトを変更: `renderSkillTree()` を編集
- ノード間隔を調整: 座標計算ロジックを編集

---

### 9. **app-grades.js** (成績分析)
**責務**: テスト記録・成績分析

**主な関数**:
- `renderGradesHub()` - 成績ハブ表示
- `renderTestAnalysis()` - テスト分析を表示
- `renderTestChart()` - キャンバスで成績グラフ描画
- `animateTestBars()` - グラフバーのアニメーション
- `openAddTest()` - テスト追加フロー開始
- `saveTest()` - テスト記録を保存

**チャート機能**:
- Canvas APIを使用した高速グラフ描画
- 教科別の成績比較
- 偏差値トレンド

**修正例**:
- テストフォーマットを変更: `renderTestAnalysis()` を編集
- グラフ色を変更: キャンバス描画ロジックを編集

---

### 10. **app-settings.js** (設定・カスタマイズ)
**責務**: ユーザー設定と各種カスタマイズ

**主な関数**:
- `renderSettings()` - 設定ページ表示
- `renderCustomize()` - カスタマイズ画面
- `openGoalModal()` - 目標設定モーダル
- `saveGoal(school, date, hours)` - 志望校・入試日・目標時間を保存
- `saveSubject(name)` - 新しい教科を追加
- `deleteSubject(name)` - 教科を削除
- `loadBackground()` - 背景画像を読み込み
- `applyAccentColors()` - アクセントカラーを適用
- `exportData()` - データを JSON エクスポート
- `importData()` - JSON からデータをインポート

**設定項目**:
- 志望校・入試日
- 週間目標時間
- 背景画像
- アクセントカラー
- 実績難易度（bronze/silver/gold/platinum）
- データのエクスポート/インポート

**修正例**:
- 新しい設定オプションを追加: 関数を追加
- エクスポート形式を変更: `exportData()` を編集

---

## 機能フロー

### ページ遷移フロー

```
Home(ホーム)
  ├→ Study(学習)
  │   ├→ Timer(タイマー) → Session記録 → Streak更新
  │   ├→ Calendar(カレンダー)
  │   └→ Logs(学習ログ) → グラフ表示
  │
  ├→ Skill(スキル)
  │   └→ Skill Map (SVG描画, パン/ズーム)
  │
  ├→ Grades(成績)
  │   └→ Test Analysis (Canvas グラフ)
  │
  └→ Settings(設定)
      ├→ Customize (背景・色)
      ├→ Goal (志望校設定)
      ├→ Subjects (教科管理)
      └→ Export/Import (データ)
```

### 状態更新フロー

```
User Action (UI操作)
    ↓
Event Handler (on-change など)
    ↓
saveState() (localStorage保存)
    ↓
checkBadges() (実績チェック)
    ↓
renderPage() (画面更新)
```

## 追加・修正のガイドラインメンテナンスとして機能を増やす際の推奨方法です。

### 新しい機能を追加する場合

1. **機能の種類を判定**:
   - 既存ページの追加機能 → 対応する `app-*.js` を編集
   - 独立した新ページ → 新しい `app-newfeature.js` を作成

2. **状態が必要な場合**:
   - `store.js` の `STATE_DEFAULTS` に新しいフィールドを追加
   - 初期化ロジックを `loadState()` に追加

3. **UI要素が必要な場合**:
   - `index.html` にモーダルテンプレートを追加
   - `style.css` に必要なスタイルを追加

4. **定数が必要な場合**:
   - `config.js` の `CFG` に追加

### 既存機能を修正する場合

1. **該当するモジュール**を特定
2. **依存関係を確認** - 他のモジュールへの影響を検討
3. **関数単位で修正** - できるだけ局所的に
4. **ブラウザで動作確認** - localStorage は開発者ツールで確認可能

### デバッグのコツ

```javascript
// ブラウザのコンソールで直接実行可能
console.log(S);  // 現在の状態を確認
loadState(); // 最新の状態を再読み込み
saveState(); // 手動で保存
navigateTo('home'); // ページ遷移テスト
checkBadges(); // 実績チェック（手動実行）
exportData(); // データエクスポート
```

## 原始ファイルとの対応

元の `altair_preview.html` (4,598行) は以下のように分割されました：

| モジュール | 元の行数 | 現在の行 | 責務 |
|-----------|---------|---------|------|
| config.js | ~120 | 117 | 定数定義 |
| store.js | ~410 | 348 | 状態管理 |
| badges.js | ~600 | 574 | 実績 |
| app-common.js | ~470 | 416 | 共通関数 |
| app-core.js | ~520 | 449 | コア機能 |
| app-study.js | ~400 | 358 | 学習機能 |
| app-flash.js | ~450 | 403 | フラッシュカード |
| app-skill.js | ~430 | 391 | スキルツリー |
| app-grades.js | ~430 | 383 | 成績分析 |
| app-settings.js | ~430 | 383 | 設定 |
| **合計** | **~4,260** | **4,222** | - |

## ローカルテスト方法

### ブラウザで開く

```bash
# シンプルな方法：ブラウザでファイルを開く
# file:///d:/altair_pages/index.html

# または Python HTTP サーバーを使用
cd d:\altair_pages
python -m http.server 8000
# http://localhost:8000 でアクセス
```

### localStorage が動作するには

- `file://` プロトコル直接のアクセスでは localStorage が動作しないため、HTTP サーバーが推奨

### 開発者ツール（F12）での確認

- **Application/Storage** → **LocalStorage** で保存状態を確認
- **Console** で `console.log(S)` で状態を確認可能

## パフォーマンスと最適化

### 現在の最適化

- **モジュール分割**: 必要なモジュールだけを読み込み可能
- **遅延読み込み**: グラフ（Altair.js）はページ表示時に動的読み込み
- **インデックス最適化**: バッジチェックは定期的（60秒ごと）

### さらなる最適化のポイント

- **Service Worker の導入**: オフライン対応をさらに強化
- **Code Splitting**: 大規模機能は非同期読み込み
- **Bundle の最小化**: 本番環境では圧縮・最小化

## トラブルシューティング

### 問題: データが保存されない

**原因**: localStorage がブロックされている、または容量超過
**解決**: F12 → Application → LocalStorage を確認、または `resetAllData()` を実行

### 問題: ページが真っ白

**原因**: モジュール読み込み順序のエラー
**解決**: `index.html` の `<script>` タグの順序を確認、ブラウザコンソールでエラーを確認

### 問題: グラフが表示されない

**原因**: Altair.js ライブラリが読み込まれていない
**解決**: `app-study.js` 内で Altair.js を参照していることを確認

## まとめ

このモダナイズされた構造により：

✅ **保守性が向上** - 各モジュールの責務が明確
✅ **拡張性が向上** - 新しい機能を追加しやすい
✅ **デバッグが容易** - 問題のあるモジュールを特定しやすい
✅ **チーム開発が可能** - 複数人での開発に対応可能

今後の追加・修正は、このガイドラインに従って行ってください。
