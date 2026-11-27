(function () {
  "use strict";

  var C = window.WEDDING_CONFIG;
  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };
  var reduceMotion = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var SVGNS = "http://www.w3.org/2000/svg";
  document.documentElement.classList.add("js");

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
  function useIcon(id, cls) {
    var s = document.createElementNS(SVGNS, "svg");
    if (cls) s.setAttribute("class", cls);
    s.setAttribute("aria-hidden", "true");
    var u = document.createElementNS(SVGNS, "use");
    u.setAttribute("href", "#" + id); u.setAttribute("width", "100%"); u.setAttribute("height", "100%");
    s.appendChild(u);
    return s;
  }
  // 画像のパスは自サイト内のファイルのみ許可（外部URLや javascript: を拒否）
  function safeImg(src) {
    if (typeof src !== "string") return "";
    if (/^https:\/\/images\.unsplash\.com\/[\w\-\/]+\?[\w=&%.,\-]*$/.test(src)) return src;  // 仮写真（Unsplash）
    return /^[\w\-./]+\.(jpe?g|png|webp|gif|avif|svg)$/i.test(src) && src.indexOf("..") === -1 ? src : "";
  }
  function bigger(src) { return src.replace(/([?&])w=\d+/, "$1w=2000"); }
  function setBg(node, src) {
    var s = safeImg(src);
    if (s) node.style.backgroundImage = 'url("' + s + '")';
    return !!s;
  }
  function storage(fn) { try { return fn(window.localStorage); } catch (e) { return null; } }

  /* ============ 内容の流し込み ============ */
  var namesEn = C.groom.nameEn + " & " + C.bride.nameEn;
  $$("[data-bind]").forEach(function (n) {
    var v = get(C, n.getAttribute("data-bind"));
    n.textContent = v == null ? "" : v;
  });
  $$("[data-list]").forEach(function (n) {
    var items = get(C, n.getAttribute("data-list")) || [];
    var tag = n.tagName === "UL" ? "li" : "p";
    items.forEach(function (t, i) { var c = el(tag, null, t); c.style.transitionDelay = (i * 0.12) + "s"; n.appendChild(c); });
  });
  $$("[data-tel]").forEach(function (a) {
    var tel = get(C, a.getAttribute("data-tel")) || "";
    if (!tel) { var line = a.closest("p"); if (line) line.hidden = true; return; }
    a.textContent = tel;
    a.href = "tel:" + tel.replace(/[^\d+]/g, "");
  });
  document.title = namesEn + " | Wedding Invitation";

  // メイン：写真が設定されていれば写真、なければイラストの風景
  var heroPhoto = $("#heroPhoto");
  if (setBg($(".hero__photo-img"), C.heroPhoto)) { heroPhoto.hidden = false; $(".hero__art").hidden = true; document.body.classList.add("has-hero-photo"); }
  if (C.photoCredits) $("#credits").textContent = C.photoCredits;

  // 縦長の画面では邸宅とお二人が中央に来るよう構図を調整
  var scene = $(".scene");
  function frameScene() {
    if (!scene) return;
    scene.setAttribute("viewBox", innerWidth / innerHeight < 0.9 ? "130 0 1600 1000" : "0 0 1600 1000");
  }
  frameScene();
  window.addEventListener("resize", frameScene);

  // お名前を1文字ずつ（登場の動き用）
  var hn = $("#heroNames");
  hn.setAttribute("aria-label", namesEn);
  var idx = 0;
  [C.groom.nameEn, "&", C.bride.nameEn].forEach(function (word, w) {
    var wrap = el("span", w === 1 ? "amp" : "word");
    wrap.setAttribute("aria-hidden", "true");
    word.split("").forEach(function (ch) {
      var s = el("span", "ch", ch); s.style.setProperty("--i", idx++); wrap.appendChild(s);
    });
    hn.appendChild(wrap);
  });

  // プロフィール
  ["groom", "bride"].forEach(function (key) {
    var p = C[key], box = $('[data-person="' + key + '"]');
    var frame = el("div", "person__frame");
    var ring = document.createElementNS(SVGNS, "svg");
    ring.setAttribute("class", "person__ring"); ring.setAttribute("viewBox", "0 0 100 100"); ring.setAttribute("aria-hidden", "true");
    var c = document.createElementNS(SVGNS, "circle"); c.setAttribute("cx", "50"); c.setAttribute("cy", "50"); c.setAttribute("r", "48.5");
    ring.appendChild(c); frame.appendChild(ring);
    var ph = el("div", "person__photo");
    if (!setBg(ph, p.photo)) { ph.classList.add("person__photo--initial"); ph.appendChild(el("span", "person__initial", (p.nameEn || p.nameJa || "").charAt(0))); }
    ph.setAttribute("role", "img"); ph.setAttribute("aria-label", p.role + " " + p.nameJa);
    frame.appendChild(ph);
    frame.appendChild(useIcon("flower", "person__flower"));
    box.appendChild(frame);
    box.appendChild(el("p", "person__role", p.role));
    box.appendChild(el("p", "person__name", p.nameJa));
    if (p.nameEn && p.nameEn !== p.nameJa) box.appendChild(el("p", "person__en", p.nameEn));
    var ul = el("ul", "person__list");
    (p.profile || []).forEach(function (t) { ul.appendChild(el("li", null, t)); });
    box.appendChild(ul);
  });

  /* ============ 写真（中央の1枚を大きく） ============ */
  var strip = $("#galleryGrid"), dots = $("#galDots");
  var photos = (C.gallery || []).map(safeImg).filter(Boolean);
  if (!photos.length) $("#gallery").hidden = true;
  var items = photos.map(function (src, i) {
    var b = el("button", "gallery__item");
    b.type = "button"; setBg(b, src);
    b.setAttribute("aria-label", "写真 " + (i + 1) + " / " + photos.length + " を拡大");
    b.addEventListener("click", function () {
      if (!b.classList.contains("is-active")) { go(i); return; }
      openLightbox(src);
    });
    strip.appendChild(b);
    dots.appendChild(el("span"));
    return b;
  });
  var current = 0;
  function setActive(i) {
    current = i;
    items.forEach(function (b, k) { b.classList.toggle("is-active", k === i); });
    $$("span", dots).forEach(function (d, k) { d.classList.toggle("is-on", k === i); });
  }
  function go(i) {
    i = Math.max(0, Math.min(items.length - 1, i));
    var b = items[i];
    strip.scrollTo({ left: b.offsetLeft - (strip.clientWidth - b.clientWidth) / 2, behavior: reduceMotion ? "auto" : "smooth" });
    setActive(i);
  }
  var galTimer;
  strip.addEventListener("scroll", function () {
    clearTimeout(galTimer);
    galTimer = setTimeout(function () {
      var mid = strip.scrollLeft + strip.clientWidth / 2, best = 0, bd = Infinity;
      items.forEach(function (b, k) { var d = Math.abs(b.offsetLeft + b.clientWidth / 2 - mid); if (d < bd) { bd = d; best = k; } });
      setActive(best);
    }, 60);
  }, { passive: true });
  $("#galPrev").addEventListener("click", function () { go(current - 1); });
  $("#galNext").addEventListener("click", function () { go(current + 1); });
  strip.addEventListener("keydown", function (e) {
    if (e.key === "ArrowRight") { e.preventDefault(); go(current + 1); }
    if (e.key === "ArrowLeft") { e.preventDefault(); go(current - 1); }
  });
  if (items.length) setActive(0);

  function openLightbox(src) {
    var lb = el("div", "lightbox"); lb.setAttribute("role", "dialog"); lb.setAttribute("aria-label", "写真の拡大表示");
    var img = el("img"); img.src = bigger(src); img.alt = "";
    lb.appendChild(img);
    var close = function () { lb.remove(); document.removeEventListener("keydown", onKey); };
    var onKey = function (e) { if (e.key === "Escape") close(); };
    lb.addEventListener("click", close);
    document.addEventListener("keydown", onKey);
    document.body.appendChild(lb);
  }

  /* ============ ご案内 ============ */
  var sch = $("#schedule");
  (C.schedule || []).forEach(function (s, i) {
    var li = el("li"); li.style.setProperty("--i", i);
    li.appendChild(el("span", "timeline__time" + (s.time ? "" : " timeline__time--none"), s.time || ""));
    li.appendChild(el("span", "timeline__label", s.label));
    sch.appendChild(li);
  });

  // 日本時間・ハワイ時間の表示（海外挙式のため）
  function partsIn(date, tz) {
    var o = {};
    new Intl.DateTimeFormat("ja-JP", { timeZone: tz, year: "numeric", month: "numeric", day: "numeric", weekday: "short", hour: "numeric", minute: "2-digit", hourCycle: "h23" })
      .formatToParts(date).forEach(function (p) { o[p.type] = p.value; });
    return o;
  }
  try {
    var cs = new Date(C.ceremonyStart);
    if (!isNaN(cs)) {
      var j = partsIn(cs, "Asia/Tokyo"), h = partsIn(cs, "Pacific/Honolulu");
      $("#jstLine").textContent = "挙式開始は日本時間で " + j.year + "年" + j.month + "月" + j.day + "日（" + j.weekday + "）" + j.hour + ":" + j.minute + " です";
      $("#cdLocal").textContent = h.month + "月" + h.day + "日 " + h.hour + ":" + h.minute;
    }
  } catch (e) { /* 換算できない環境では表示しない */ }

  // 地図
  var q = encodeURIComponent(C.venue.mapQuery || C.venue.address || "");
  var iframe = document.createElement("iframe");
  iframe.src = "https://www.google.com/maps?q=" + q + "&output=embed";
  iframe.loading = "lazy";
  iframe.title = "会場の地図";
  iframe.referrerPolicy = "no-referrer-when-downgrade";
  $("#mapWrap").insertBefore(iframe, $("#mapWrap").firstChild);
  $("#mapLink").href = "https://www.google.com/maps/search/?api=1&query=" + q;
  if (C.party && C.party.name) {
    $("#partyMapLink").href = "https://www.google.com/maps/search/?api=1&query=" + encodeURIComponent(C.party.mapQuery || C.party.address || "");
  } else { $("#partyBlock").hidden = true; }

  // そのほかのご案内（内容に合うアイコン付き）
  var notes = $("#notes");
  if (!(C.notes || []).length) $("#notesBlock").hidden = true;
  (C.notes || []).forEach(function (n) {
    var icon = /服|ドレス/.test(n.title) ? "i-shirt" : /子/.test(n.title) ? "i-kid" : /送迎|移動|車|アクセス/.test(n.title) ? "i-car" : "i-cal";
    var row = el("div", "note");
    var ic = el("div", "note__icon"); ic.appendChild(useIcon(icon));
    var body = el("div");
    body.appendChild(el("p", "note__t", n.title)); body.appendChild(el("p", "note__b", n.body));
    row.appendChild(ic); row.appendChild(body);
    notes.appendChild(row);
  });

  /* ============ オープニング ============ */
  var opening = $("#opening");
  function petalNode(cls) {
    var d = el("span", cls); d.appendChild(useIcon("flower")); return d;
  }
  if (!reduceMotion) {
    var pBox = $(".opening__petals");
    for (var k = 0; k < 14; k++) {
      var pt = petalNode("petal");
      pt.style.left = (Math.random() * 100) + "%";
      pt.style.setProperty("--s", (14 + Math.random() * 18) + "px");
      pt.style.setProperty("--d", (8 + Math.random() * 7) + "s");
      pt.style.setProperty("--delay", (-Math.random() * 12) + "s");
      pt.style.setProperty("--dx", (Math.random() * 120 - 60) + "px");
      pt.style.setProperty("--spin", (4 + Math.random() * 5) + "s");
      pBox.appendChild(pt);
    }
  }
  function burst(container, n) {
    if (reduceMotion) return;
    for (var i = 0; i < n; i++) {
      var b = petalNode("burst-petal");
      var a = (i / n) * Math.PI * 2 + Math.random() * .4, r = 140 + Math.random() * 180;
      b.style.setProperty("--bx", Math.cos(a) * r + "px");
      b.style.setProperty("--by", Math.sin(a) * r + "px");
      b.style.setProperty("--br", (Math.random() * 540 - 270) + "deg");
      container.appendChild(b);
      setTimeout(function (node) { node.remove(); }, 1300, b);
    }
  }
  function ready() {
    document.body.classList.remove("is-locked");
    document.body.classList.add("is-ready");
  }
  function openInvitation() {
    burst(opening, 16);
    opening.classList.add("is-open");
    ready();
    setTimeout(function () { opening.hidden = true; }, 1150);
  }
  $("#openBtn").addEventListener("click", openInvitation);
  if (location.hash && location.hash !== "#top") { opening.hidden = true; ready(); }

  /* ============ 画面に入ったときの動き ============ */
  var revealTargets = $$("[data-reveal], [data-reveal-children]");
  if ("IntersectionObserver" in window && !reduceMotion) {
    var io = new IntersectionObserver(function (es) {
      es.forEach(function (e) { if (e.isIntersecting) { e.target.classList.add("is-in"); io.unobserve(e.target); } });
    }, { threshold: 0.18, rootMargin: "0px 0px -6% 0px" });
    revealTargets.forEach(function (n) { io.observe(n); });
  } else {
    revealTargets.forEach(function (n) { n.classList.add("is-in"); });
  }

  /* ============ スクロール：奥行き・進み具合・回答ボタン ============ */
  var layers = $$(".scene .layer").map(function (g) {
    var c = g.getAttribute("class");
    var f = /clouds-far/.test(c) ? .12 : /clouds-near/.test(c) ? .2 : /sea/.test(c) ? .05 : /ridge2/.test(c) ? .1 : /ridge/.test(c) ? .07 : /trees/.test(c) ? .16 : /house/.test(c) ? .13 : /lawn/.test(c) ? .2 : 0;
    return { g: g, f: f };
  });
  var bar = $("#progressBar"), cta = $("#rsvpCta"), rsvp = $("#rsvp"), hero = $("#top");
  cta.hidden = false;
  var ticking = false;
  function onScroll() {
    if (ticking) return; ticking = true;
    requestAnimationFrame(function () {
      ticking = false;
      var y = window.scrollY, H = document.documentElement.scrollHeight - innerHeight;
      bar.style.transform = "scaleX(" + (H > 0 ? Math.min(1, y / H) : 0) + ")";
      if (!reduceMotion && y < innerHeight * 1.2) {
        layers.forEach(function (l) { l.g.style.transform = "translateY(" + (-y * l.f) + "px)"; });
        if (!heroPhoto.hidden) heroPhoto.style.transform = "translateY(" + (y * .35) + "px)";
      }
      var r = rsvp.getBoundingClientRect();
      var inRsvp = r.top < innerHeight * .9 && r.bottom > 0;
      cta.classList.toggle("is-shown", y > hero.offsetHeight * .7 && !inRsvp);
    });
  }
  window.addEventListener("scroll", onScroll, { passive: true });
  window.addEventListener("resize", onScroll);
  onScroll();

  /* ============ カウントダウン（数字がめくれる） ============ */
  var target = new Date(C.ceremonyStart).getTime();
  function pad(n) { return n < 10 ? "0" + n : String(n); }
  function setNum(id, v) {
    var n = document.getElementById(id);
    if (n.textContent === v) return;
    n.textContent = v;
    if (reduceMotion) return;
    n.classList.remove("tick"); void n.offsetWidth; n.classList.add("tick");
  }
  function tick() {
    var diff = target - Date.now();
    if (isNaN(diff)) return;
    if (diff <= 0) { $(".cd").hidden = true; $(".cd__note").hidden = true; $("#cdAfter").hidden = false; return; }
    var s = Math.floor(diff / 1000);
    setNum("cdDays", String(Math.floor(s / 86400)));
    setNum("cdHours", pad(Math.floor(s % 86400 / 3600)));
    setNum("cdMins", pad(Math.floor(s % 3600 / 60)));
    setNum("cdSecs", pad(s % 60));
    setTimeout(tick, 1000 - (Date.now() % 1000) + 5);
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

  function swap(from, to) {
    from.hidden = true; to.hidden = false;
    to.classList.remove("is-entering"); void to.offsetWidth; to.classList.add("is-entering");
  }

  // 出席時のみの項目（滑らかに開閉）
  var attendOnly = $("#attendOnly");
  function syncAttend() {
    var v = (form.querySelector('[name="attendance"]:checked') || {}).value;
    attendOnly.classList.toggle("is-collapsed", v === "decline");
    attendOnly.setAttribute("aria-hidden", v === "decline" ? "true" : "false");
  }
  $$('[name="attendance"]', form).forEach(function (r) { r.addEventListener("change", syncAttend); });

  // 必須項目の進み具合
  var reqChecks = [
    function () { return !!form.querySelector('[name="attendance"]:checked'); },
    function () { return !!form.querySelector('[name="side"]:checked'); },
    function () { return form.last_name.value.trim() && form.first_name.value.trim(); },
    function () { return form.last_kana.value.trim() && form.first_kana.value.trim(); },
    function () { return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(form.email.value.trim()); }
  ];
  $("#reqTotal").textContent = reqChecks.length;
  function syncProgress() {
    var done = reqChecks.filter(function (fn) { return fn(); }).length;
    $("#reqDone").textContent = done;
    $("#reqBar").style.transform = "scaleX(" + (done / reqChecks.length) + ")";
  }
  form.addEventListener("input", syncProgress);
  form.addEventListener("change", syncProgress);
  syncProgress();

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

  var ERR_INPUTS = { name: ["last_name", "first_name"], kana: ["last_kana", "first_kana"], email: ["email"], phone: ["phone"], postal_code: ["postal_code"] };
  function showErrors(r) {
    $$("[data-err]", form).forEach(function (p) { p.textContent = r.errs[p.getAttribute("data-err")] || ""; });
    Object.keys(ERR_INPUTS).forEach(function (k) {
      ERR_INPUTS[k].forEach(function (n) { form[n].classList.toggle("is-invalid", !!r.errs[k]); });
    });
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

  var pending = null;
  form.addEventListener("submit", function (e) {
    e.preventDefault();
    var d = collect();
    if (!showErrors(validate(d))) return;
    pending = d;
    renderConfirm(d);
    swap(form, $("#confirmView")); $("#sendErr").textContent = "";
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
    swap($("#confirmView"), form);
    $("#rsvp").scrollIntoView({ behavior: "smooth" });
  });

  var sending = false;
  $("#sendBtn").addEventListener("click", function () {
    if (sending || !pending) return;
    sending = true;
    var btn = this; btn.disabled = true; btn.textContent = "送信中…";
    send(pending).then(function () {
      storage(function (ls) { ls.setItem("rsvp_submitted", "1"); });
      $("#thanksMsg").textContent = pending.attendance === "attend"
        ? "ご回答ありがとうございました\n当日お会いできることを楽しみにしております"
        : "ご回答ありがとうございました\nまたお会いできる日を楽しみにしております";
      swap($("#confirmView"), $("#thanksView"));
      burst($("#thanksBurst"), 14);
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
