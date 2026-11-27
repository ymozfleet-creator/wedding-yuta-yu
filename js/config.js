/*
 * ============================================================
 *  招待状の内容はすべてこのファイルで差し替えます
 *  （HTMLを触らなくても、文言・日時・会場・写真を変更できます）
 * ============================================================
 */
window.WEDDING_CONFIG = {
  /* ---------- お二人 ---------- */
  groom: {
    nameJa: "茂住 雄太",
    nameEn: "Yuta",
    role: "新郎",
    photo: "images/groom.svg",
    profile: [
      // 例："趣味：キャンプ・コーヒー"
    ]
  },
  bride: {
    nameJa: "島崎 唯有",
    nameEn: "Yu",
    role: "新婦",
    photo: "images/bride.svg",
    profile: [
      // 例："趣味：お菓子づくり・旅行"
    ]
  },

  /* ---------- メイン写真・ギャラリー（現在はデモのイラスト。写真のjpgに差し替え可） ---------- */
  heroPhoto: "",  // 写真（例 "images/hero.jpg"）を入れるとイラストの代わりに表示
  gallery: [
    "images/gallery1.svg",
    "images/gallery2.svg",
    "images/gallery3.svg",
    "images/gallery4.svg",
    "images/gallery5.svg",
    "images/gallery6.svg"
  ],

  /* ---------- ご挨拶文（段落ごとに1要素） ---------- */
  greeting: [
    "皆様にはお健やかにお過ごしのことと\nお慶び申し上げます",
    "このたび 私たちは結婚式を挙げることになりました",
    "つきましては 日頃お世話になっている皆様に\n感謝の気持ちを込めて\nささやかではございますが小宴を催したく存じます",
    "ご多用中誠に恐縮ではございますが\nぜひご出席いただきたくご案内申し上げます"
  ],

  /* ---------- 日時（日本時間で記載） ---------- */
  // 挙式開始時刻（カウントダウンの基準）
  ceremonyStart: "2027-06-23T14:00:00-10:00",  // ハワイ時間（HST, UTC-10）
  dateLabel: "2027年6月23日（水）ハワイ時間",
  schedule: [
    { label: "挙式", time: "14:00" },
    { label: "ウェルカムドリンク", time: "15:40" },
    { label: "ガーデンパーティー", time: "16:00" },
    { label: "お開き（予定）", time: "18:00" }
  ],

  /* ---------- 回答締切（この日時を過ぎるとフォームを閉じます） ---------- */
  rsvpDeadline: "2027-01-31T23:59:59+09:00",  // 日本時間
  rsvpDeadlineLabel: "2027年1月31日（日）",

  /* ---------- 会場 ---------- */
  venue: {
    name: "リジェストランドハウス\nLiljestrand House",
    address: "3300 Tantalus Drive, Honolulu, HI 96822",
    tel: "",  // 空欄なら非表示
    access: [
      "ワイキキから車で約15分、タンタラスの丘の森に建つ歴史的邸宅です",
      "ガーデンからはダイヤモンドヘッドとワイキキの海を一望できます",
      "山道を上った先にあるため、会場までの移動方法はあらためてご案内いたします"
    ],
    // メイン写真の下に出す英字の場所表記
    placeLine: "Liljestrand House, Honolulu",
    // Googleマップで表示する検索語（会場名か住所）
    mapQuery: "Liljestrand House, 3300 Tantalus Dr, Honolulu, HI 96822"
  },

  /* ---------- その他のご案内（不要なら空配列 [] に） ---------- */
  notes: [
    { title: "服装", body: "リゾートフォーマルでお越しください（アロハシャツ・ムームーも歓迎です）" },
    { title: "お子さま連れの方", body: "お子さま用のお食事・お椅子をご用意いたします。フォームの同伴者欄でお知らせください" }
  ],

  /* ---------- 結びの言葉 ---------- */
  closing: "タンタラスの丘で 皆さまにお会いできることを楽しみにしております",
  signature: "茂住 雄太・島崎 唯有",

  /* ---------- 同伴者の上限人数 ---------- */
  maxCompanions: 4,

  /* ---------- 回答の保存先（Supabase） ----------
   * 空欄のままだと「お試しモード」になり、回答はどこにも保存されません。
   * 公開用の anon / publishable キーのみを記載してください
   * （service_role キーは絶対に書かないこと）。
   */
  supabaseUrl: "https://tfswiabfpqbrwsjzrgeh.supabase.co",
  supabaseAnonKey: "sb_publishable_lPnPuDZLsLv6D6NxD4havg_rsOgzsCx"
};
