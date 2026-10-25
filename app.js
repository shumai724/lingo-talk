(() => {
  const app = document.getElementById("app");
  const titleEl = document.getElementById("title");
  const backBtn = document.getElementById("back");
  const supportEl = document.getElementById("support");

  const SpeechRec = window.SpeechRecognition || window.webkitSpeechRecognition;
  const ROUND_SIZE = 5;
  const state = { lang: null, rate: 1, cat: null };

  // ---------- 保存 ----------
  const store = {
    get() {
      try { return JSON.parse(localStorage.getItem("lingo-stats") || "{}"); } catch { return {}; }
    },
    add(lang, mode, score) {
      const s = this.get();
      s[lang] = s[lang] || {};
      const m = (s[lang][mode] = s[lang][mode] || { count: 0, total: 0 });
      m.count += 1;
      m.total += score;
      try { localStorage.setItem("lingo-stats", JSON.stringify(s)); } catch {}
    },
  };

  // ---------- 音声 ----------
  let voices = [];
  const loadVoices = () => { voices = speechSynthesis.getVoices(); };
  if ("speechSynthesis" in window) {
    loadVoices();
    speechSynthesis.onvoiceschanged = loadVoices;
  }

  function speak(text, rate = state.rate) {
    if (!("speechSynthesis" in window)) return;
    const locale = LANGS[state.lang].locale;
    speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(text);
    u.lang = locale;
    u.rate = rate;
    const prefix = locale.slice(0, 2);
    u.voice = voices.find((v) => v.lang === locale) || voices.find((v) => v.lang.startsWith(prefix)) || null;
    speechSynthesis.speak(u);
  }

  function listen(onResult, onEnd) {
    const rec = new SpeechRec();
    rec.lang = LANGS[state.lang].locale;
    rec.interimResults = false;
    rec.maxAlternatives = 3;
    rec.onresult = (e) => {
      const alts = Array.from(e.results[0]).map((a) => a.transcript);
      onResult(alts);
    };
    rec.onerror = (e) => onEnd(e.error);
    rec.onend = () => onEnd(null);
    rec.start();
    return rec;
  }

  // ---------- 採点 ----------
  const normalize = (s) =>
    s.toLowerCase().normalize("NFKC").replace(/[\s.,!?！？。、，．'’"「」・~〜-]/g, "");

  function levenshtein(a, b) {
    const dp = Array.from({ length: a.length + 1 }, (_, i) => [i]);
    for (let j = 1; j <= b.length; j++) dp[0][j] = j;
    for (let i = 1; i <= a.length; i++)
      for (let j = 1; j <= b.length; j++)
        dp[i][j] = Math.min(dp[i - 1][j] + 1, dp[i][j - 1] + 1, dp[i - 1][j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1));
    return dp[a.length][b.length];
  }

  function similarity(target, said) {
    const a = normalize(target), b = normalize(said);
    if (!a.length) return 0;
    return Math.max(0, Math.round((1 - levenshtein(a, b) / Math.max(a.length, b.length)) * 100));
  }

  // 目標文の各文字が発話に含まれたか（LCS）で色分け
  function diffHtml(target, said) {
    const t = Array.from(target), sNorm = Array.from(normalize(said));
    const tn = t.map((c) => normalize(c));
    const n = t.length, m = sNorm.length;
    const L = Array.from({ length: n + 1 }, () => new Array(m + 1).fill(0));
    for (let i = n - 1; i >= 0; i--)
      for (let j = m - 1; j >= 0; j--)
        L[i][j] = tn[i] && tn[i] === sNorm[j] ? L[i + 1][j + 1] + 1 : Math.max(L[i + 1][j], L[i][j + 1]);
    const ok = new Array(n).fill(false);
    let i = 0, j = 0;
    while (i < n && j < m) {
      if (tn[i] && tn[i] === sNorm[j]) { ok[i] = true; i++; j++; }
      else if (L[i + 1][j] >= L[i][j + 1]) i++;
      else j++;
    }
    return t.map((c, k) => `<span class="${!tn[k] || ok[k] ? "ok" : "ng"}">${esc(c)}</span>`).join("");
  }

  // ---------- ユーティリティ ----------
  const esc = (s) => s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const shuffle = (arr) => {
    const a = arr.slice();
    for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; }
    return a;
  };
  // 選択中のカテゴリのフレーズ（未選択なら全部）
  const pool = () => PHRASES[state.lang].filter((p) => !state.cat || p.cat === state.cat);
  const newRound = () => shuffle(pool()).slice(0, ROUND_SIZE);
  const scoreClass = (s) => (s >= 80 ? "good" : s >= 50 ? "mid" : "bad");

  function go(screen, ...args) {
    if ("speechSynthesis" in window) speechSynthesis.cancel();
    screen(...args);
    window.scrollTo(0, 0);
  }
  // 戻る先：練習中はメニュー、メニューは言語選択
  let backTarget = null;
  backBtn.onclick = () => go(backTarget || homeScreen);
  function setHeader(title, back) {
    titleEl.textContent = title;
    backTarget = back || null;
    backBtn.hidden = !back;
  }

  function speedControl() {
    const wrap = document.createElement("div");
    wrap.className = "speed";
    [0.6, 0.8, 1].forEach((r) => {
      const b = document.createElement("button");
      b.textContent = r === 1 ? "標準" : `${r}x`;
      if (state.rate === r) b.className = "on";
      b.onclick = () => {
        state.rate = r;
        wrap.querySelectorAll("button").forEach((x) => x.classList.remove("on"));
        b.classList.add("on");
      };
      wrap.appendChild(b);
    });
    return wrap;
  }

  // ---------- 画面 ----------
  function homeScreen() {
    setHeader("Lingo Talk", null);
    app.innerHTML = `<p class="muted">学びたい言語を選んでください</p><div class="grid"></div>`;
    const grid = app.querySelector(".grid");
    Object.entries(LANGS).forEach(([code, l]) => {
      const b = document.createElement("button");
      b.className = "big-btn";
      b.innerHTML = `<span class="emoji">${l.flag}</span><span>${l.name}<small>${PHRASES[code].length} フレーズ</small></span>`;
      b.onclick = () => { state.lang = code; state.cat = null; go(menuScreen); };
      grid.appendChild(b);
    });
  }

  function menuScreen() {
    const l = LANGS[state.lang];
    setHeader(`${l.flag} ${l.name}`, homeScreen);
    const stats = store.get()[state.lang] || {};
    const avg = (m) => (stats[m] ? `平均 ${Math.round(stats[m].total / stats[m].count)} 点・${stats[m].count} 回` : "まだ記録なし");
    app.innerHTML = `<p class="label">カテゴリ</p><div class="speed cats"></div><div class="grid" style="margin-top:14px"></div>`;
    const cats = app.querySelector(".cats");
    [null, ...new Set(PHRASES[state.lang].map((p) => p.cat))].forEach((c) => {
      const b = document.createElement("button");
      b.textContent = c || "すべて";
      if (state.cat === c) b.className = "on";
      b.onclick = () => { state.cat = c; menuScreen(); };
      cats.appendChild(b);
    });
    const grid = app.querySelector(".grid");
    const modes = [
      { key: "listen", emoji: "🎧", name: "リスニング：意味を選ぶ", desc: "音声を聞いて正しい意味を選択", fn: listenQuiz },
      { key: "dictation", emoji: "✍️", name: "リスニング：書き取り", desc: "聞こえた文を入力", fn: dictation },
      { key: "speak", emoji: "🗣️", name: "スピーキング：発音練習", desc: "お手本を聞いて声に出す", fn: speaking },
      { key: "phrases", emoji: "📖", name: "フレーズ一覧", desc: "全フレーズを聞いて確認", fn: phraseList },
    ];
    modes.forEach((m) => {
      const b = document.createElement("button");
      b.className = "big-btn";
      const sub = m.key === "phrases" ? m.desc : `${m.desc}<br>${avg(m.key)}`;
      b.innerHTML = `<span class="emoji">${m.emoji}</span><span>${m.name}<small>${sub}</small></span>`;
      b.onclick = () => go(m.fn, newRound(), 0, []);
      grid.appendChild(b);
    });
  }

  function progressBar(i) {
    return `<div class="progress"><div style="width:${(i / ROUND_SIZE) * 100}%"></div></div>`;
  }

  function listenQuiz(round, i, scores) {
    if (i >= round.length) return go(resultScreen, "listen", scores);
    setHeader(`🎧 ${i + 1} / ${round.length}`, menuScreen);
    const p = round[i];
    const others = shuffle(PHRASES[state.lang].filter((x) => x !== p && x.meaning !== p.meaning)).slice(0, 3);
    const choices = shuffle([p, ...others]);
    app.innerHTML = `${progressBar(i)}
      <div class="card center">
        <p class="label">音声を聞いて意味を選んでください</p>
        <div class="row"><button class="btn" id="play">▶ 再生</button></div>
        <div id="speed"></div>
        <p class="phrase" id="reveal" hidden>${esc(p.text)}</p>
      </div>
      <div class="grid" id="choices"></div>
      <div class="row" style="margin-top:14px"><button class="btn" id="next" hidden>次へ</button></div>`;
    app.querySelector("#speed").appendChild(speedControl());
    app.querySelector("#play").onclick = () => speak(p.text);
    const box = app.querySelector("#choices");
    choices.forEach((c) => {
      const b = document.createElement("button");
      b.className = "choice";
      b.textContent = c.meaning;
      b.onclick = () => {
        if (box.dataset.done) return;
        box.dataset.done = "1";
        const correct = c === p;
        b.classList.add(correct ? "correct" : "wrong");
        box.children[choices.indexOf(p)].classList.add("correct");
        app.querySelector("#reveal").hidden = false;
        app.querySelector("#next").hidden = false;
        scores.push(correct ? 100 : 0);
      };
      box.appendChild(b);
    });
    app.querySelector("#next").onclick = () => go(listenQuiz, round, i + 1, scores);
    setTimeout(() => speak(p.text), 300);
  }

  function dictation(round, i, scores) {
    if (i >= round.length) return go(resultScreen, "dictation", scores);
    setHeader(`✍️ ${i + 1} / ${round.length}`, menuScreen);
    const p = round[i];
    app.innerHTML = `${progressBar(i)}
      <div class="card center">
        <p class="label">聞こえた文を入力してください</p>
        <div class="row"><button class="btn" id="play">▶ 再生</button></div>
        <div id="speed"></div>
      </div>
      <div class="card">
        <input class="answer" id="ans" autocomplete="off" autocapitalize="off" spellcheck="false" lang="${LANGS[state.lang].locale}">
        <div class="row" style="margin-top:10px"><button class="btn" id="check">答え合わせ</button></div>
        <div id="fb"></div>
      </div>`;
    app.querySelector("#speed").appendChild(speedControl());
    app.querySelector("#play").onclick = () => speak(p.text);
    const btn = app.querySelector("#check");
    btn.onclick = () => {
      if (btn.dataset.done) return go(dictation, round, i + 1, scores);
      const said = app.querySelector("#ans").value;
      const s = similarity(p.text, said);
      scores.push(s);
      btn.dataset.done = "1";
      btn.textContent = "次へ";
      app.querySelector("#fb").innerHTML = `
        <p class="score ${scoreClass(s)}">${s}点</p>
        <p class="phrase diff">${diffHtml(p.text, said)}</p>
        <p class="meaning">${esc(p.meaning)}</p>`;
    };
    setTimeout(() => speak(p.text), 300);
  }

  function speaking(round, i, scores) {
    if (i >= round.length) return go(resultScreen, "speak", scores);
    setHeader(`🗣️ ${i + 1} / ${round.length}`, menuScreen);
    const p = round[i];
    app.innerHTML = `${progressBar(i)}
      <div class="card center">
        <p class="phrase">${esc(p.text)}</p>
        <p class="meaning">${esc(p.meaning)}</p>
        <div class="row" style="margin-top:10px"><button class="btn secondary" id="play">▶ お手本</button></div>
        <div id="speed"></div>
      </div>
      <div class="card center">
        <button class="mic" id="mic" aria-label="録音">🎤</button>
        <p class="muted" id="hint">${SpeechRec ? "マイクを押して話してください" : "この端末のブラウザは音声認識に未対応です"}</p>
        <div id="fb"></div>
      </div>
      <div class="row"><button class="btn" id="next">${SpeechRec ? "スキップ" : "次へ"}</button></div>`;
    app.querySelector("#speed").appendChild(speedControl());
    app.querySelector("#play").onclick = () => speak(p.text);
    let best = null;
    const mic = app.querySelector("#mic");
    const hint = app.querySelector("#hint");
    if (!SpeechRec) mic.disabled = true;
    let rec = null;
    mic.onclick = () => {
      if (rec) { rec.stop(); return; }
      speechSynthesis.cancel();
      mic.classList.add("listening");
      hint.textContent = "聞き取り中…（もう一度押すと停止）";
      rec = listen(
        (alts) => {
          // 候補の中で一番近いものを採用
          const scored = alts.map((a) => ({ a, s: similarity(p.text, a) })).sort((x, y) => y.s - x.s)[0];
          best = Math.max(best ?? 0, scored.s);
          app.querySelector("#fb").innerHTML = `
            <p class="score ${scoreClass(scored.s)}">${scored.s}点</p>
            <p class="label">認識結果</p>
            <p>${esc(scored.a)}</p>
            <p class="phrase diff">${diffHtml(p.text, scored.a)}</p>`;
          app.querySelector("#next").textContent = "次へ";
        },
        (err) => {
          mic.classList.remove("listening");
          rec = null;
          if (err === "not-allowed") hint.textContent = "マイクの使用が許可されていません。ブラウザ設定を確認してください。";
          else if (err === "no-speech") hint.textContent = "声が聞き取れませんでした。もう一度どうぞ。";
          else hint.textContent = best === null ? "マイクを押して話してください" : "何度でも挑戦できます（最高点を記録）";
        }
      );
    };
    app.querySelector("#next").onclick = () => {
      if (rec) rec.abort();
      if (best !== null) scores.push(best);
      go(speaking, round, i + 1, scores);
    };
  }

  function phraseList() {
    setHeader("📖 フレーズ一覧", menuScreen);
    app.innerHTML = `<div id="speed"></div><div id="list" style="margin-top:12px"></div>`;
    app.querySelector("#speed").appendChild(speedControl());
    const list = app.querySelector("#list");
    const byCat = {};
    pool().forEach((p) => (byCat[p.cat] = byCat[p.cat] || []).push(p));
    Object.entries(byCat).forEach(([cat, ps]) => {
      const card = document.createElement("div");
      card.className = "card";
      card.innerHTML = `<p class="label">${esc(cat)}</p>`;
      ps.forEach((p) => {
        const b = document.createElement("button");
        b.className = "choice";
        b.style.marginTop = "8px";
        b.innerHTML = `🔊 <b>${esc(p.text)}</b><br><span class="meaning">${esc(p.meaning)}</span>`;
        b.onclick = () => speak(p.text);
        card.appendChild(b);
      });
      list.appendChild(card);
    });
  }

  function resultScreen(mode, scores) {
    setHeader("結果", menuScreen);
    const avg = scores.length ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length) : 0;
    if (scores.length) store.add(state.lang, mode, avg);
    const msg = avg >= 80 ? "すばらしい！" : avg >= 50 ? "いい調子です" : "繰り返し練習しましょう";
    app.innerHTML = `
      <div class="card center">
        <p class="label">平均スコア</p>
        <p class="score ${scoreClass(avg)}">${avg}点</p>
        <p>${msg}</p>
        <p class="muted">${scores.length} 問を記録</p>
      </div>
      <div class="row">
        <button class="btn secondary" id="menu">メニューへ</button>
        <button class="btn" id="again">もう一度</button>
      </div>`;
    const fn = { listen: listenQuiz, dictation, speak: speaking }[mode];
    app.querySelector("#menu").onclick = () => go(menuScreen);
    app.querySelector("#again").onclick = () => go(fn, newRound(), 0, []);
  }

  // ---------- 起動 ----------
  const warnings = [];
  if (!("speechSynthesis" in window)) warnings.push("このブラウザは音声読み上げに未対応です。");
  if (!SpeechRec) warnings.push("このブラウザは音声認識に未対応のため、スピーキング採点が使えません（iPhoneはSafari、AndroidはChromeを推奨）。");
  if (warnings.length) { supportEl.hidden = false; supportEl.textContent = warnings.join(" "); }

  if ("serviceWorker" in navigator && location.protocol.startsWith("http")) {
    navigator.serviceWorker.register("sw.js").catch(() => {});
  }
  homeScreen();
})();
