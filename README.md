# がっこうのまわりにあるものをみつけてびんごをめざそう

## ファイル構成
- `bingo.html` — アプリ本体（Phase1〜3の全機能を含む単一HTML）
- `sw.js` — Service Worker（`bingo.html` のオフラインキャッシュ）
- `gas/upload.gs` — Phase3アップロード先のGoogle Apps Scriptコード

## 設定が必要な箇所

### bingo.html
```js
var GAS_URL = "";  // GASをウェブアプリとしてデプロイした後のURLを設定する
```
未設定（空文字）の間はオンライン復帰時のアップロード確認ダイアログは表示されません。

### gas/upload.gs
```js
var SPREADSHEET_ID = ""; // 記録先スプレッドシートのID
var FOLDER_ID = "";      // 画像保存先DriveフォルダのID
```

### GASデプロイ設定
1. Apps Scriptエディタで `gas/upload.gs` の内容を貼り付け、上記2つのIDを設定
2. デプロイ > 新しいデプロイ > 種類「ウェブアプリ」
3. 実行するユーザー：**自分**
4. アクセスできるユーザー：**全員**
5. デプロイ後に発行されるURLを `bingo.html` の `GAS_URL` に貼り付ける

## Phase3の動作概要
- オンライン復帰（`online`イベント）を検知し、IndexedDBに `uploaded:false` のレコードが1件以上あれば「しゃしんをおくりますか？」ダイアログを表示
- 「はい」で1件ずつGASへPOST送信し、成功したレコードのみ `uploaded:true` に更新
- 「いいえ」を選んだ場合は何も削除・変更されず、次回オンライン復帰時に再度確認ダイアログが表示される
- 送信に失敗したレコードは `uploaded:false` のまま残り、次回オンライン復帰時に自動的に再送対象となる

### 実装上の注意（CORS）
GAS Webアプリはレスポンスに `Access-Control-Allow-Origin` を自動付与しますが、リクエストの `Content-Type` を `application/json` にするとブラウザがプリフライト（OPTIONS）を送信し、GASがそれに応答できず失敗します。
そのため `bingo.html` からのPOSTは `Content-Type: text/plain;charset=utf-8` で送信し、GAS側は `e.postData.contents` をJSONとしてパースする実装にしています（送信されるボディ自体はJSON文字列のままです）。

## Service Workerに関する注意（Phase2から継続）
Service Workerは `https://` または `localhost` などのセキュアコンテキストでのみ登録できます。`bingo.html` を `file://` で直接開いた場合、登録は失敗しますがアプリの動作自体（撮影・IndexedDB保存・アップロード）には影響しません。オフラインキャッシュを有効にしたい場合は、簡易ローカルサーバー経由での配信、またはhttps環境へのホスティングが必要です。
