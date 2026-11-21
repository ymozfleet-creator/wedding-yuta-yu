(function () {
  "use strict";

  var C = window.WEDDING_CONFIG;
  var $ = function (s) { return document.querySelector(s); };
  var demo = !(C.supabaseUrl && C.supabaseAnonKey);
  var BASE = (C.supabaseUrl || "").replace(/\/$/, "");
  var token = null;          // ログイン中のトークンはメモリ上のみに保持（再読み込みでログアウト）
  var all = [];

  var L = {
    attendance: { attend: "ご出席", decline: "ご欠席" },
    side: { groom: "新郎側", bride: "新婦側" },
    ctype: { adult: "大人", child: "子ども", infant: "幼児" }
  };

  function el(tag, cls, text) {
    var e = document.createElement(tag);
    if (cls) e.className = cls;
    if (text != null) e.textContent = text;
    return e;
  }
  $("#names").textContent = C.groom.nameJa + "・" + C.bride.nameJa;

  function headers(extra) {
    var h = { apikey: C.supabaseAnonKey };
    if (token) h.Authorization = "Bearer " + token;
    else if (!/^sb_/.test(C.supabaseAnonKey)) h.Authorization = "Bearer " + C.supabaseAnonKey;
    for (var k in extra) h[k] = extra[k];
    return h;
  }
  function api(path, opt) {
    opt = opt || {};
    opt.credentials = "omit";
    opt.referrerPolicy = "no-referrer";
    return fetch(BASE + path, opt).then(function (r) {
      if (r.status === 401) { logout(); throw new Error("ログインの有効期限が切れました。もう一度ログインしてください。"); }
      if (!r.ok) throw new Error("通信に失敗しました（" + r.status + "）");
      return r.status === 204 ? null : r.json();
    });
  }

  /* ---------- ログイン ---------- */
  function showLogin() { $("#loginForm").hidden = false; $("#dash").hidden = true; $("#logoutBtn").hidden = true; }
  function showDash() { $("#loginForm").hidden = true; $("#dash").hidden = false; $("#logoutBtn").hidden = demo; }

  $("#loginForm").addEventListener("submit", function (e) {
    e.preventDefault();
    var email = $("#loginEmail").value.trim(), pass = $("#loginPass").value;
    $("#loginErr").textContent = "";
    if (!email || !pass) { $("#loginErr").textContent = "メールアドレスとパスワードを入力してください"; return; }
    var btn = $("#loginBtn"); btn.disabled = true;
    fetch(BASE + "/auth/v1/token?grant_type=password", {
      method: "POST", credentials: "omit", referrerPolicy: "no-referrer",
      headers: { apikey: C.supabaseAnonKey, "Content-Type": "application/json" },
      body: JSON.stringify({ email: email, password: pass })
    }).then(function (r) {
      if (!r.ok) throw new Error("メールアドレスまたはパスワードが違います");
      return r.json();
    }).then(function (j) {
      token = j.access_token; $("#loginPass").value = "";
      showDash(); load();
    }).catch(function (err) {
      $("#loginErr").textContent = err.message || "ログインに失敗しました";
    }).then(function () { btn.disabled = false; });
  });

  function logout() {
    if (token) fetch(BASE + "/auth/v1/logout", { method: "POST", headers: headers(), credentials: "omit" }).catch(function () {});
    token = null; all = []; $("#rows").textContent = ""; showLogin();
  }
  $("#logoutBtn").addEventListener("click", logout);

  /* ---------- 読み込み ---------- */
  function load() {
    $("#loadErr").textContent = "";
    if (demo) { all = sample(); markDup(); render(); return; }
    api("/rest/v1/rsvps?select=*&order=created_at.desc", { headers: headers() }).then(function (rows) {
      all = Array.isArray(rows) ? rows : [];
      markDup(); render();
      if (!all.length) $("#loadErr").textContent = "";
    }).catch(function (e) { $("#loadErr").textContent = e.message; });
  }
  $("#reloadBtn").addEventListener("click", load);

  // 同じメールの古い回答に印を付ける（新しい順に並んでいる前提）
  function markDup() {
    all.sort(function (a, b) { return a.created_at < b.created_at ? 1 : -1; });
    var seen = {};
    all.forEach(function (r) { var k = (r.email || "").toLowerCase(); r._dup = !!seen[k]; seen[k] = true; });
  }
  function headcount(r) { return r.attendance === "attend" ? 1 + (r.companions || []).length : 0; }

  /* ---------- 集計 ---------- */
  function renderStats(latest) {
    var s = { total: latest.length, attend: 0, decline: 0, people: 0, groom: 0, bride: 0, adult: 0, child: 0, infant: 0, allergy: 0 };
    latest.forEach(function (r) {
      if (r.attendance === "attend") {
        s.attend++; var n = headcount(r); s.people += n; s[r.side] += n;
        s.adult += 1;
        var hasAllergy = !!(r.allergy || "").trim();
        (r.companions || []).forEach(function (c) { s[c.type] = (s[c.type] || 0) + 1; if ((c.allergy || "").trim()) hasAllergy = true; });
        if (hasAllergy) s.allergy++;
      } else s.decline++;
    });
    var box = $("#stats"); box.textContent = "";
    function card(label, val, unit, sub) {
      var c = el("div", "stat"); c.appendChild(el("p", "stat__label", label));
      var v = el("p", "stat__value", String(val)); v.appendChild(el("small", null, unit)); c.appendChild(v);
      if (sub) c.appendChild(el("p", "stat__sub", sub));
      box.appendChild(c);
    }
    card("回答件数", s.total, "件");
    card("ご出席", s.attend, "件", "ご欠席 " + s.decline + "件");
    card("出席人数（同伴者含む）", s.people, "名", "大人 " + s.adult + "名・子ども " + s.child + "名・幼児 " + s.infant + "名");
    card("新郎側 / 新婦側", s.groom + " / " + s.bride, "名");
    card("アレルギー等の記入あり", s.allergy, "件");
  }

  /* ---------- 一覧 ---------- */
  function filtered() {
    var a = $("#fAtt").value, sd = $("#fSide").value, t = $("#fText").value.trim().toLowerCase(), dup = $("#fDup").checked;
    return all.filter(function (r) {
      if (!dup && r._dup) return false;
      if (a && r.attendance !== a) return false;
      if (sd && r.side !== sd) return false;
      if (t) {
        var hay = [r.last_name, r.first_name, r.last_kana, r.first_kana, r.email].join(" ").toLowerCase();
        if (hay.indexOf(t) === -1) return false;
      }
      return true;
    });
  }
  ["#fAtt", "#fSide", "#fDup"].forEach(function (s) { $(s).addEventListener("change", render); });
  $("#fText").addEventListener("input", render);

  function fmtDate(iso) {
    var d = new Date(iso); if (isNaN(d)) return "";
    var p = function (n) { return n < 10 ? "0" + n : n; };
    return d.getFullYear() + "/" + p(d.getMonth() + 1) + "/" + p(d.getDate()) + " " + p(d.getHours()) + ":" + p(d.getMinutes());
  }
  function compText(r) {
    return (r.companions || []).map(function (c) {
      return c.name + (c.kana ? "（" + c.kana + "）" : "") + "／" + (L.ctype[c.type] || "") + (c.allergy ? "／" + c.allergy : "");
    }).join("\n");
  }

  function render() {
    renderStats(all.filter(function (r) { return !r._dup; }));
    var rows = filtered(), tb = $("#rows"); tb.textContent = "";
    $("#empty").hidden = rows.length > 0;
    rows.forEach(function (r) {
      var tr = el("tr"); if (r._dup) tr.className = "is-dup";
      function td(v) { var c = el("td", null, v == null ? "" : v); tr.appendChild(c); return c; }
      td(fmtDate(r.created_at));
      var a = td(""); a.appendChild(el("span", "tag tag--" + r.attendance, L.attendance[r.attendance] || ""));
      if (r._dup) { a.appendChild(document.createElement("br")); a.appendChild(el("span", "tag tag--dup", "古い回答")); }
      td(L.side[r.side] || "");
      td(r.last_name + " " + r.first_name);
      td(r.last_kana + " " + r.first_kana);
      td(r.attendance === "attend" ? headcount(r) + "名" : "—");
      td(compText(r));
      td(r.allergy);
      td(r.email);
      td(r.phone);
      td((r.postal_code ? "〒" + r.postal_code + " " : "") + (r.address || ""));
      td(r.message);
      var dc = td("");
      var b = el("button", "del", "削除"); b.type = "button";
      var timer;
      b.addEventListener("click", function () {
        if (!b.classList.contains("is-armed")) {
          b.classList.add("is-armed"); b.textContent = "本当に削除";
          timer = setTimeout(function () { b.classList.remove("is-armed"); b.textContent = "削除"; }, 3000);
          return;
        }
        clearTimeout(timer); remove(r.id);
      });
      dc.appendChild(b);
      tb.appendChild(tr);
    });
  }

  function remove(id) {
    if (!/^[0-9a-f-]{36}$/i.test(String(id))) return;
    if (demo) { all = all.filter(function (r) { return r.id !== id; }); markDup(); render(); return; }
    api("/rest/v1/rsvps?id=eq." + encodeURIComponent(id), { method: "DELETE", headers: headers({ Prefer: "return=minimal" }) })
      .then(load).catch(function (e) { $("#loadErr").textContent = e.message; });
  }

  /* ---------- CSV ---------- */
  function csvCell(v) {
    var s = String(v == null ? "" : v);
    if (/^[=+\-@\t\r]/.test(s)) s = "'" + s;      // Excelでの数式実行を防ぐ
    return '"' + s.replace(/"/g, '""') + '"';
  }
  $("#csvBtn").addEventListener("click", function () {
    var head = ["回答日時", "出欠", "区分", "姓", "名", "せい", "めい", "人数", "同伴者", "アレルギー等", "メール", "電話", "郵便番号", "住所", "メッセージ", "重複(古い回答)"];
    var lines = [head.map(csvCell).join(",")];
    filtered().forEach(function (r) {
      lines.push([fmtDate(r.created_at), L.attendance[r.attendance], L.side[r.side], r.last_name, r.first_name, r.last_kana, r.first_kana,
        r.attendance === "attend" ? headcount(r) : 0, compText(r).replace(/\n/g, " / "), r.allergy, r.email, r.phone, r.postal_code, r.address, r.message,
        r._dup ? "はい" : ""].map(csvCell).join(","));
    });
    var blob = new Blob(["﻿" + lines.join("\r\n")], { type: "text/csv;charset=utf-8" });
    var a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    var d = new Date(); a.download = "出欠回答_" + d.getFullYear() + (d.getMonth() + 1) + d.getDate() + ".csv";
    document.body.appendChild(a); a.click(); a.remove();
    setTimeout(function () { URL.revokeObjectURL(a.href); }, 1000);
  });

  /* ---------- サンプル（お試しモード） ---------- */
  function sample() {
    var now = Date.now(), h = 3600e3;
    function id(n) { return "00000000-0000-4000-8000-00000000000" + n; }
    return [
      { id: id(1), created_at: new Date(now - 2 * h).toISOString(), attendance: "attend", side: "groom", last_name: "鈴木", first_name: "一郎", last_kana: "すずき", first_kana: "いちろう", email: "ichiro@example.com", phone: "090-1111-2222", postal_code: "150-0001", address: "東京都渋谷区○○1-1", allergy: "", message: "おめでとう！楽しみにしています", companions: [{ name: "鈴木 花", kana: "すずき はな", type: "adult", allergy: "" }, { name: "鈴木 陽", kana: "すずき よう", type: "infant", allergy: "卵" }] },
      { id: id(2), created_at: new Date(now - 5 * h).toISOString(), attendance: "attend", side: "bride", last_name: "高橋", first_name: "美咲", last_kana: "たかはし", first_kana: "みさき", email: "misaki@example.com", phone: "", postal_code: "", address: "", allergy: "えび・かに", message: "", companions: [] },
      { id: id(3), created_at: new Date(now - 26 * h).toISOString(), attendance: "decline", side: "bride", last_name: "田中", first_name: "健", last_kana: "たなか", first_kana: "けん", email: "ken@example.com", phone: "", postal_code: "", address: "", allergy: "", message: "出張と重なってしまいました。お幸せに！", companions: [] },
      { id: id(4), created_at: new Date(now - 30 * h).toISOString(), attendance: "decline", side: "groom", last_name: "鈴木", first_name: "一郎", last_kana: "すずき", first_kana: "いちろう", email: "ichiro@example.com", phone: "", postal_code: "", address: "", allergy: "", message: "", companions: [] }
    ];
  }

  /* ---------- 開始 ---------- */
  if (demo) { $("#demoNote").hidden = false; showDash(); load(); }
  else showLogin();
})();
