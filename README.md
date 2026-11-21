# 結婚式 Web招待状（出欠・情報収集つき）

## 構成
| ファイル | 内容 |
|---|---|
| `index.html` | ゲストが開く招待状（オープニング→写真→ご挨拶→カウントダウン→プロフィール→ギャラリー→ご案内・地図→出欠フォーム） |
| `admin.html` | 新郎新婦用の回答一覧（ログイン制・集計・絞り込み・CSV・削除） |
| `js/config.js` | **文言・日時・会場・写真・保存先はすべてここで変更** |
| `images/` | 写真（同じファイル名で上書きすれば差し替え完了） |
| `supabase/schema.sql` | 回答を保存するデータベースの設定 |

## 1. 内容と写真を差し替える
1. `js/config.js` の名前・日時・会場・ご挨拶文・締切を書き換える
2. `images/` の写真を同じ名前で上書き
   - `hero.jpg`（メイン・横長 1600px程度）、`groom.jpg` / `bride.jpg`（正方形）、`gallery1〜6.jpg`
   - 枚数を変える場合は `config.js` の `gallery` を編集
   - 1枚 500KB 以下に圧縮すると表示が速くなります

## 2. 回答の保存先（Supabase）をつなぐ
1. Supabaseで結婚式専用のプロジェクトを作成（リージョン：Tokyo）
2. SQL Editor で `supabase/schema.sql` を実行
3. 締切を変える場合：`update public.event_settings set rsvp_deadline = '2027-01-31 23:59:59+09';`
   （`config.js` の `rsvpDeadline` と同じ日時にする）
4. Authentication > Users で新郎新婦のユーザー（メール＋パスワード）を作成
5. `insert into public.admins (email) values ('新郎のメール'), ('新婦のメール');`
6. Authentication > Sign In / Providers で新規登録（Allow new users to sign up）をOFF
7. Project Settings > API の **Project URL** と **anon（または publishable）キー** を `config.js` に記入
   - `service_role` キーは絶対に書かない

## 3. 公開する
静的ファイルのみなので、GitHub Pages・Netlify・Cloudflare Pages 等にそのまま置けます。
公開URL（またはQRコード）をLINE・メールでゲストへ送付。`admin.html` は新郎新婦だけに共有。

## セキュリティ上の配慮
- サーバー側プログラム（PHP等）なし。ゲストは「送信」しかできず、他人の回答は読めない（行レベルの権限設定）
- 締切後はデータベース側でも送信を拒否（画面を改ざんしても送れない）
- 入力文字数・形式はブラウザとデータベースの両方でチェック
- 表示はすべて文字として出力（スクリプト埋め込み不可）、CSP設定済み
- CSV出力時の数式インジェクション対策済み、ボット対策の隠し欄あり
- 管理画面のログイン状態はメモリのみ（ページを閉じると自動でログアウト）
- 検索エンジンに載らない設定（noindex）
