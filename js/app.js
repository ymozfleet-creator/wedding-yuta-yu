(function () {
  "use strict";

  var C = window.WEDDING_CONFIG;
  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };

  var LABELS = {
    attendance: { attend: "ご出席", decline: "ご欠席" },
    side: { groom: "新郎側ゲスト", bride: "新婦側ゲスト" },
    ctype: { adult: "大人", child: "お子さま（小学生）", infant: "幼児（未就学児）" }
  };

  function get(obj, path) {
    return path.split(".").reduce(function (o, k) { return o == null ? undefined : o[k]; }, obj);
  }
  function el(tag, cls, text) {
    var e = document.createElement(tag);
    if (cls) e.className = cls;
    if (text != null) e.textContent = text;
    return e;
  }
  // 画像のパスは自サイト内のファイルのみ許可（外部URLや javascript: を拒否）
  function safeImg(src) {
    return typeof src === "string" && /^[\w\-./]+\.(jpe?g|png|webp|gif|avif)$/i.test(src) && src.indexOf("..") === -1 ? src : "";
  }
  function setBg(node, src) {
    var s = safeImg(src);
    if (s) node.style.backgroundImage = 'url("' + s + '")';
  }
  function storage(fn) { try { return fn(window.localStorage); } catch (e) { return null; } }

  /* ============ 内容の流し込み ============ */
  var namesEn = C.groom.nameEn + " & " + C.bride.nameEn;
  var derived = { namesEn: namesEn };

  $$("[data-bind]").forEach(function (n) {
    var k = n.getAttribute("data-bind");
    var v = k in derived ? derived[k] : get(C, k);
    n.textContent = v == null ? "" : v;
  });
  $$("[data-list]").forEach(function (n) {
    var items = get(C, n.getAttribute("data-list")) || [];
    var tag = n.tagName === "UL" ? "li" : "p";
    items.forEach(function (t) { n.appendChild(el(tag, null, t)); });
  });
  $$("[data-tel]").forEach(function (a) {
    var tel = get(C, a.getAttribute("data-tel")) || "";
    if (!tel) { var line = a.closest("p"); if (line) line.hidden = true; return; }
    a.textContent = tel;
    a.href = "tel:" + tel.replace(/[^\d+]/g, "");
  });
  $$("[data-bg]").forEach(function (n) { setBg(n, get(C, n.getAttribute("data-bg"))); });
  document.title = namesEn + " | Wedding Invitation";

  // プロフィール
  ["groom", "bride"].forEach(function (key) {
    var p = C[key], box = $('[data-person="' + key + '"]');
    var ph = el("div", "person__photo"); setBg(ph, p.photo);
    ph.setAttribute("role", "img"); ph.setAttribute("aria-label", p.role + " " + p.nameJa);
    box.appendChild(ph);
    box.appendChild(el("p", "person__role", p.role));
    box.appendChild(el("p", "person__name", p.nameJa));
    if (p.nameEn && p.nameEn !== p.nameJa) box.appendChild(el("p", "person__en", p.nameEn));
    var ul = el("ul", "person__list");
    (p.profile || []).forEach(function (t) { ul.appendChild(el("li", null, t)); });
    box.appendChild(ul);
  });

  // ギャラリー
  var grid = $("#galleryGrid");
  var photos = (C.gallery || []).map(safeImg).filter(Boolean);
  if (!photos.length) $("#gallery").hidden = true;
  photos.forEach(function (src, i) {
    var b = el("button", "gallery__item");
    b.type = "button"; setBg(b, src);
    b.setAttribute("aria-label", "写真 " + (i + 1) + " を拡大");
    b.addEventListener("click", function () { openLightbox(src); });
    grid.appendChild(b);
  });
  function openLightbox(src) {
    var lb = el("div", "lightbox"); lb.setAttribute("role", "dialog"); lb.setAttribute("aria-label", "写真の拡大表示");
    var img = el("img"); img.src = src; img.alt = "";
    lb.appendChild(img);
    var close = function () { lb.remove(); document.removeEventListener("keydown", onKey); };
    var onKey = function (e) { if (e.key === "Escape") close(); };
    lb.addEventListener("click", close);
    document.addEventListener("keydown", onKey);
    document.body.appendChild(lb);
  }

  // スケジュール
  var sch = $("#schedule");
  (C.schedule || []).forEach(function (s) {
    var li = el("li");
    li.appendChild(el("span", "timeline__time", s.time));
    li.appendChild(el("span", "timeline__label", s.label));
    sch.appendChild(li);
  });

  // 日本時間の換算（海外挙式のため）
  try {
    var cs = new Date(C.ceremonyStart);
    if (!isNaN(cs)) {
      var parts = {};
      new Intl.DateTimeFormat("ja-JP", { timeZone: "Asia/Tokyo", year: "numeric", month: "numeric", day: "numeric", weekday: "short", hour: "numeric", minute: "2-digit", hourCycle: "h23" })
        .formatToParts(cs).forEach(function (p) { parts[p.type] = p.value; });
      $("#jstLine").textContent = "挙式開始は日本時間で " + parts.year + "年" + parts.month + "月" + parts.day + "日（" + parts.weekday + "）" + parts.hour + ":" + parts.minute + " です";
    }
  } catch (e) { /* 換算できない環境では表示しない */ }

  // 地図
  var q = encodeURIComponent(C.venue.mapQuery || C.venue.address || "");
  var iframe = document.createElement("iframe");
  iframe.src = "https://www.google.com/maps?q=" + q + "&output=embed";
  iframe.loading = "lazy";
  iframe.title = "会場の地図";
  iframe.referrerPolicy = "no-referrer-when-downgrade";
  $("#mapWrap").appendChild(iframe);
  $("#mapLink").href = "https://www.google.com/maps/search/?api=1&query=" + q;

  // その他のご案内
  var notes = $("#notes");
  if (!(C.notes || []).length) $("#notesBlock").hidden = true;
  (C.notes || []).forEach(function (n) { notes.appendChild(el("dt", null, n.title)); notes.appendChild(el("dd", null, n.body)); });

  /* ============ オープニング（木のルーバーが開く） ============ */
  var louvers = $("#louvers"), slatBox = $(".louvers__slats");
  var N = window.innerWidth >= 900 ? 16 : 10;
  slatBox.style.setProperty("--n", N);
  for (var si = 0; si < N; si++) {
    var sl = el("span", "slat");
    sl.style.setProperty("--i", Math.abs(si - (N - 1) / 2) | 0);  // 中央から外側へ順に開く
    slatBox.appendChild(sl);
  }
  function unlock() { document.body.classList.remove("is-locked"); }
  function openInvitation() {
    louvers.classList.add("is-opening");
    unlock();
    setTimeout(function () { louvers.classList.add("is-gone"); }, 1700);
  }
  $("#openBtn").addEventListener("click", openInvitation);
  if (location.hash && location.hash !== "#top") { louvers.classList.add("is-gone"); unlock(); }

  /* ============ スクロール表示 ============ */
  if ("IntersectionObserver" in window) {
    var io = new IntersectionObserver(function (es) {
      es.forEach(function (e) { if (e.isIntersecting) { e.target.classList.add("is-in"); io.unobserve(e.target); } });
    }, { threshold: 0.15 });
    $$(".reveal").forEach(function (n) { io.observe(n); });
  } else {
    $$(".reveal").forEach(function (n) { n.classList.add("is-in"); });
  }

  /* ============ カウントダウン ============ */
  var target = new Date(C.ceremonyStart).getTime();
  function pad(n) { return n < 10 ? "0" + n : String(n); }
  function tick() {
    var diff = target - Date.now();
    if (isNaN(diff)) return;
    if (diff <= 0) {
      $(".countdown").hidden = true; $("#cdAfter").hidden = false; return;
    }
    var s = Math.floor(diff / 1000);
    $("#cdDays").textContent = Math.floor(s / 86400);
    $("#cdHours").textContent = pad(Math.floor(s % 86400 / 3600));
    $("#cdMins").textContent = pad(Math.floor(s % 3600 / 60));
    $("#cdSecs").textContent = pad(s % 60);
    setTimeout(tick, 1000);
  }
  tick();

  /* ============ 出欠フォーム ============ */
  var form = $("#rsvpForm");
  var demo = !(C.supabaseUrl && C.supabaseAnonKey);
  if (demo) $("#demoBanner").hidden = false;

  var deadline = new Date(C.rsvpDeadline).getTime();
  if (!isNaN(deadline) && Date.now() > deadline) {
    form.hidden = true; $("#rsvpClosed").hidden = false;
  }

  var prev = storage(function (ls) { return ls.getItem("rsvp_submitted"); });
  if (prev) {
    var note = el("p", "field__hint", "このブラウザからは回答済みです。内容を変更する場合は、もう一度送信してください（新しい回答を優先します）。");
    note.classList.add("field__err--center");
    form.insertBefore(note, form.firstChild);
  }

  // 出席時のみの項目
  function syncAttend() {
    var v = (form.querySelector('[name="attendance"]:checked') || {}).value;
    $("#attendOnly").hidden = v === "decline";
  }
  $$('[name="attendance"]', form).forEach(function (r) { r.addEventListener("change", syncAttend); });

  // 同伴者
  var compBox = $("#companions"), max = C.maxCompanions || 4, compSeq = 0;
  function renumber() {
    $$(".companion", compBox).forEach(function (c, i) { $(".companion__no", c).textContent = "同伴者 " + (i + 1); });
    $("#addCompanion").hidden = $$(".companion", compBox).length >= max;
  }
  $("#addCompanion").addEventListener("click", function () {
    if ($$(".companion", compBox).length >= max) return;
    var id = "c" + (++compSeq);
    var wrap = el("div", "companion");
    var head = el("div", "companion__head");
    head.appendChild(el("span", "companion__no"));
    var rm = el("button", "companion__remove", "削除"); rm.type = "button";
    rm.addEventListener("click", function () { wrap.remove(); renumber(); });
    head.appendChild(rm);
    wrap.appendChild(head);

    function textField(label, name, ph, req) {
      var f = el("div", "field");
      var l = el("label", "field__label", label); l.htmlFor = id + name;
      if (req) l.appendChild(el("span", "req", "必須"));
      var i = el("input"); i.type = "text"; i.id = id + name; i.maxLength = name === "allergy" ? 200 : 60;
      i.setAttribute("data-c", name); if (ph) i.placeholder = ph;
      f.appendChild(l); f.appendChild(i);
      return f;
    }
    wrap.appendChild(textField("お名前", "name", "例：山田 一郎", true));
    wrap.appendChild(textField("ふりがな", "kana", "例：やまだ いちろう", false));

    var tf = el("div", "field");
    var tl = el("label", "field__label", "区分"); tl.htmlFor = id + "type";
    var sel = el("select"); sel.id = id + "type"; sel.setAttribute("data-c", "type");
    Object.keys(LABELS.ctype).forEach(function (k) { var o = el("option", null, LABELS.ctype[k]); o.value = k; sel.appendChild(o); });
    tf.appendChild(tl); tf.appendChild(sel); wrap.appendChild(tf);

    wrap.appendChild(textField("アレルギー・苦手な食材", "allergy", "なければ空欄", false));
    compBox.appendChild(wrap);
    renumber();
    $("input", wrap).focus();
  });

  // メッセージ文字数
  var msg = $("#message");
  msg.addEventListener("input", function () { $("#msgCount").textContent = msg.value.length; });

  /* ---- 入力値の整形・チェック ---- */
  function toHalf(s) {
    return s.replace(/[０-９Ａ-Ｚａ-ｚ＠．＿＋－]/g, function (c) { return String.fromCharCode(c.charCodeAt(0) - 0xFEE0); })
      .replace(/[ー―‐−–—]/g, "-");
  }
  function toHira(s) { return s.replace(/[ァ-ヶ]/g, function (c) { return String.fromCharCode(c.charCodeAt(0) - 0x60); }); }
  function clean(s, n) { return String(s || "").replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, "").trim().slice(0, n); }
  var KANA = /^[ぁ-ゖー゛゜\s　]+$/;

  function collect() {
    var fd = new FormData(form);
    var d = {
      attendance: fd.get("attendance") || "",
      side: fd.get("side") || "",
      last_name: clean(fd.get("last_name"), 30),
      first_name: clean(fd.get("first_name"), 30),
      last_kana: toHira(clean(fd.get("last_kana"), 30)),
      first_kana: toHira(clean(fd.get("first_kana"), 30)),
      email: toHalf(clean(fd.get("email"), 120)).toLowerCase(),
      phone: toHalf(clean(fd.get("phone"), 20)),
      postal_code: toHalf(clean(fd.get("postal_code"), 8)),
      address: clean(fd.get("address"), 200),
      allergy: clean(fd.get("allergy"), 300),
      message: clean(fd.get("message"), 500),
      companions: [],
      website: clean(fd.get("website"), 100)
    };
    if (d.postal_code && /^\d{7}$/.test(d.postal_code)) d.postal_code = d.postal_code.slice(0, 3) + "-" + d.postal_code.slice(3);
    if (d.attendance === "attend") {
      $$(".companion", compBox).forEach(function (c) {
        d.companions.push({
          name: clean($('[data-c="name"]', c).value, 60),
          kana: toHira(clean($('[data-c="kana"]', c).value, 60)),
          type: $('[data-c="type"]', c).value,
          allergy: clean($('[data-c="allergy"]', c).value, 200)
        });
      });
    } else {
      d.allergy = "";
    }
    return d;
  }

  function validate(d) {
    var errs = {};
    if (!LABELS.attendance[d.attendance]) errs.attendance = "ご出欠をお選びください";
    if (!LABELS.side[d.side]) errs.side = "ゲスト区分をお選びください";
    if (!d.last_name || !d.first_name) errs.name = "お名前（姓・名）をご入力ください";
    if (!d.last_kana || !d.first_kana) errs.kana = "ふりがなをご入力ください";
    else if (!KANA.test(d.last_kana + d.first_kana)) errs.kana = "ふりがなはひらがなでご入力ください";
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(d.email)) errs.email = "メールアドレスを正しくご入力ください";
    if (d.phone && !/^[0-9+\-() ]{10,20}$/.test(d.phone)) errs.phone = "電話番号を正しくご入力ください";
    if (d.postal_code && !/^\d{3}-\d{4}$/.test(d.postal_code)) errs.postal_code = "郵便番号は7桁でご入力ください";
    var ce = d.companions.some(function (c) { return !c.name || !LABELS.ctype[c.type]; });
    return { errs: errs, companionErr: ce };
  }

  function showErrors(r) {
    $$("[data-err]", form).forEach(function (p) { p.textContent = r.errs[p.getAttribute("data-err")] || ""; });
    $$(".companion input", compBox).forEach(function (i) {
      i.classList.toggle("is-invalid", i.getAttribute("data-c") === "name" && !i.value.trim());
    });
    var any = Object.keys(r.errs).length > 0 || r.companionErr;
    $("#formErr").textContent = any ? (r.companionErr && !Object.keys(r.errs).length ? "同伴者のお名前をご入力ください" : "未入力または正しくない項目があります") : "";
    if (any) {
      var first = $$("[data-err]", form).filter(function (p) { return p.textContent; })[0];
      (first ? first.closest(".field") : compBox).scrollIntoView({ behavior: "smooth", block: "center" });
    }
    return !any;
  }

  var current = null;
  form.addEventListener("submit", function (e) {
    e.preventDefault();
    var d = collect();
    if (!showErrors(validate(d))) return;
    current = d;
    renderConfirm(d);
    form.hidden = true; $("#confirmView").hidden = false; $("#sendErr").textContent = "";
    $("#rsvp").scrollIntoView({ behavior: "smooth" });
  });

  function renderConfirm(d) {
    var dl = $("#confirmList"); dl.textContent = "";
    function row(k, v) { dl.appendChild(el("dt", null, k)); dl.appendChild(el("dd", null, v || "—")); }
    row("ご出欠", LABELS.attendance[d.attendance]);
    row("ゲスト区分", LABELS.side[d.side]);
    row("お名前", d.last_name + " " + d.first_name);
    row("ふりがな", d.last_kana + " " + d.first_kana);
    row("メール", d.email);
    row("電話番号", d.phone);
    row("ご住所", (d.postal_code ? "〒" + d.postal_code + "\n" : "") + d.address);
    if (d.attendance === "attend") {
      row("アレルギー等", d.allergy);
      row("同伴者", d.companions.length ? d.companions.map(function (c, i) {
        return (i + 1) + ". " + c.name + (c.kana ? "（" + c.kana + "）" : "") + "／" + LABELS.ctype[c.type] + (c.allergy ? "\n   アレルギー等：" + c.allergy : "");
      }).join("\n") : "なし");
    }
    row("メッセージ", d.message);
  }

  $("#backBtn").addEventListener("click", function () {
    $("#confirmView").hidden = true; form.hidden = false;
    $("#rsvp").scrollIntoView({ behavior: "smooth" });
  });

  var sending = false;
  $("#sendBtn").addEventListener("click", function () {
    if (sending || !current) return;
    sending = true;
    var btn = this; btn.disabled = true; btn.textContent = "送信中…";
    send(current).then(function () {
      storage(function (ls) { ls.setItem("rsvp_submitted", "1"); });
      $("#confirmView").hidden = true; $("#thanksView").hidden = false;
      $("#thanksMsg").textContent = current.attendance === "attend"
        ? "ご回答ありがとうございました\n当日お会いできることを楽しみにしております"
        : "ご回答ありがとうございました\nまたお会いできる日を楽しみにしております";
      $("#rsvp").scrollIntoView({ behavior: "smooth" });
    }).catch(function (err) {
      $("#sendErr").textContent = err && err.userMessage ? err.userMessage : "送信に失敗しました。通信環境をご確認のうえ、もう一度お試しください。";
    }).then(function () {
      sending = false; btn.disabled = false; btn.textContent = "この内容で送信する";
    });
  });

  function send(d) {
    // 人には見えない欄に入力があればボット扱い（送ったふりをして保存しない）
    if (d.website) return Promise.resolve();
    var payload = {};
    Object.keys(d).forEach(function (k) { if (k !== "website") payload[k] = d[k]; });

    if (demo) {
      return new Promise(function (res) { setTimeout(res, 600); });
    }
    var ctrl = "AbortController" in window ? new AbortController() : null;
    var timer = setTimeout(function () { if (ctrl) ctrl.abort(); }, 15000);
    var headers = {
      "Content-Type": "application/json",
      "apikey": C.supabaseAnonKey,
      "Prefer": "return=minimal"
    };
    if (!/^sb_/.test(C.supabaseAnonKey)) headers.Authorization = "Bearer " + C.supabaseAnonKey;
    return fetch(C.supabaseUrl.replace(/\/$/, "") + "/rest/v1/rsvps", {
      method: "POST", headers: headers, body: JSON.stringify(payload),
      signal: ctrl ? ctrl.signal : undefined, credentials: "omit", referrerPolicy: "no-referrer"
    }).then(function (res) {
      clearTimeout(timer);
      if (res.ok) return;
      var e = new Error("HTTP " + res.status);
      if (res.status === 401 || res.status === 403) e.userMessage = "ご回答の受付期間外か、送信できない状態です。お手数ですが新郎新婦まで直接ご連絡ください。";
      throw e;
    }, function (err) { clearTimeout(timer); throw err; });
  }
})();
