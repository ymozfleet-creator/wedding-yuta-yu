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
    photo: "",  // 写真（例 "images/groom.jpg"）を入れると表示。空欄の間は頭文字を表示
    profile: [
      // 例："趣味：キャンプ・コーヒー"
    ]
  },
  bride: {
    nameJa: "島崎 唯有",
    nameEn: "Yu",
    role: "新婦",
    photo: "",
    profile: [
      // 例："趣味：お菓子づくり・旅行"
    ]
  },

  /* ---------- メイン写真・ギャラリー ----------
   現在は無料素材（Unsplash）の仮写真です。お二人の写真が届いたら
   images/ に置いて "images/xxx.jpg" の形で書き換えてください。 */
  heroPhoto: "https://images.unsplash.com/photo-1547537352-ae90c682877e?w=2000&q=75&auto=format&fit=crop",
  gallery: [
    "https://images.unsplash.com/photo-1573993228224-5ffd3f00511c?w=1200&q=75&auto=format&fit=crop",
    "https://images.unsplash.com/photo-1738827529678-ad65162296ef?w=1200&q=75&auto=format&fit=crop",
    "https://images.unsplash.com/photo-1708906197974-677b5406d890?w=1200&q=75&auto=format&fit=crop",
    "https://images.unsplash.com/photo-1780025281172-6479095c09e8?w=1200&q=75&auto=format&fit=crop",
    "https://images.unsplash.com/photo-1617198294099-2431e7a77e30?w=1200&q=75&auto=format&fit=crop",
    "https://images.unsplash.com/photo-1588973269798-173fa2699b99?w=1200&q=75&auto=format&fit=crop",
    "https://images.unsplash.com/flagged/photo-1556937472-20f0e8134fc9?w=1200&q=75&auto=format&fit=crop"
  ],
  // 仮写真の撮影者（Unsplashライセンス。表記は任意だが敬意として掲載）
  photoCredits: "Photos: Zetong Li, Cosmin Serban, User_Pascal, Vitor Rossetto, Abhijeet Apsunde, Lauren Ostrout, Kelvin Tu, KOJI FUTAMI / Unsplash",

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
