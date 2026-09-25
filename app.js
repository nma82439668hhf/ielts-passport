(function () {
  "use strict";

  const BANK = window.IELTS_BANK || {};
  const STORAGE_KEY = "ielts_passport_v1";
  const $ = (sel, root = document) => root.querySelector(sel);
  const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));

  const VIEW_TITLES = {
    home: "今日学习",
    path: "学习地图",
    lesson: "学习模块",
    practice: "题库练习",
    reading: "阅读练习",
    listening: "听力练习",
    writing: "写作练习",
    quiz: "词汇测验",
    vocab: "高频词汇",
    speaking: "口语题库",
    about: "题库来源与许可",
  };

  const SKILL_META = {
    reading: { label: "阅读", icon: "book-open", color: "red" },
    listening: { label: "听力", icon: "headphones", color: "teal" },
    writing: { label: "写作", icon: "pen-line", color: "gold" },
    speaking: { label: "口语", icon: "mic-2", color: "teal" },
    vocab: { label: "词汇", icon: "notebook-tabs", color: "gold" },
  };

  function defaultProgress() {
    return {
      target: 6.5,
      streak: { last: "", count: 0 },
      stats: {
        reading: { attempted: 0, correct: 0 },
        listening: { attempted: 0, correct: 0 },
        writing: { attempted: 0, correct: 0 },
        speaking: { attempted: 0, correct: 0 },
        vocab: { attempted: 0, correct: 0 },
      },
      answers: {},
      vocab: { seen: 0, known: [] },
      drafts: {},
      lastScore: {},
    };
  }

  const state = {
    view: "home",
    param: null,
    practiceSkill: "reading",
    practiceLevel: "A1",
    progress: loadProgress(),
    currentTest: null,
    answerMap: {},
    vocabLevel: "A1",
    vocabDeck: [],
    vocabIndex: 0,
    speakingIndex: Math.floor(Math.random() * ((BANK.speaking || []).length || 1)),
    speakingLevel: "A1",
    writingTaskIndex: 0,
  };

  function loadProgress() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        return { ...defaultProgress(), ...parsed, stats: { ...defaultProgress().stats, ...(parsed.stats || {}) } };
      }
    } catch (e) {
      /* ignore corrupt storage */
    }
    return defaultProgress();
  }

  function save() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state.progress));
    } catch (e) {
      /* storage full or unavailable */
    }
  }

  function shuffle(arr) {
    const a = arr.slice();
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  }

  function getLevelVocab(level) {
    const levels = BANK.vocabLevels || {};
    if (levels[level] && levels[level].length) return levels[level];
    return BANK.learn && BANK.learn.vocab ? BANK.learn.vocab : [];
  }

  function resetVocabDeck() {
    const vocab = getLevelVocab(state.vocabLevel);
    state.vocabDeck = shuffle([...Array(vocab.length).keys()]);
    state.vocabIndex = 0;
    state.vocabDeckKey = state.vocabLevel;
  }

  let activeAudio = null;
  let activeUtterance = null;

  function stopSpeechAudio() {
    if (window.speechSynthesis) window.speechSynthesis.cancel();
    if (activeAudio) {
      try {
        activeAudio.pause();
        activeAudio.currentTime = 0;
      } catch (e) {
        /* ignore */
      }
      activeAudio = null;
    }
    activeUtterance = null;
  }

  function speakText(text, rate = 0.82) {
    const value = String(text || "").trim();
    if (!value) return;
    stopSpeechAudio();
    if (!window.speechSynthesis || !window.SpeechSynthesisUtterance) {
      toast("当前浏览器不支持朗读，请使用 Edge 或 Chrome");
      return;
    }
    const utter = new SpeechSynthesisUtterance(value);
    activeUtterance = utter;
    utter.lang = "en-US";
    utter.rate = rate;
    utter.volume = 1;
    const voices = window.speechSynthesis.getVoices ? window.speechSynthesis.getVoices() : [];
    const preferred = voices.find((v) => /en-US/i.test(v.lang)) || voices.find((v) => /^en/i.test(v.lang));
    if (preferred) utter.voice = preferred;
    try {
      window.speechSynthesis.resume();
      window.speechSynthesis.speak(utter);
    } catch (e) {
      toast("语音播放失败，请再试一次");
    }
  }

  function speakWord(word, trigger) {
    const value = String(word || "").trim();
    if (!value) return;
    stopSpeechAudio();
    if (trigger) trigger.classList.add("is-speaking");
    const unmark = () => {
      if (trigger) trigger.classList.remove("is-speaking");
    };
    let usedFallback = false;
    const fallback = () => {
      if (usedFallback) return;
      usedFallback = true;
      unmark();
      speakText(value, 0.78);
    };

    // Youdao's public dictionary audio is reliable on desktop and mobile browsers.
    const url = `https://dict.youdao.com/dictvoice?audio=${encodeURIComponent(value)}&type=2`;
    const audio = new Audio(url);
    activeAudio = audio;
    audio.preload = "auto";
    audio.volume = 1;
    audio.addEventListener("ended", () => {
      unmark();
      if (activeAudio === audio) activeAudio = null;
    });
    audio.addEventListener("error", fallback);
    const playPromise = audio.play();
    if (playPromise && playPromise.catch) playPromise.catch(fallback);
    window.setTimeout(() => {
      if (!usedFallback && audio.paused && audio.currentTime === 0) fallback();
    }, 1400);
  }

  function levelOrder(level) {
    return { A1: 1, A2: 2, B1: 3, B2: 4, C1: 5, IELTS: 6 }[level] || 99;
  }

  function withLevel(list, level) {
    return (list || []).map((item) => ({ ...item, level: item.level || level }));
  }

  function esc(value) {
    return String(value ?? "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#39;");
  }

  function normalize(value) {
    return String(value || "")
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, " ")
      .replace(/\s+/g, " ")
      .trim();
  }

  function todayKey() {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
  }

  function touchToday() {
    const key = todayKey();
    if (state.progress.streak.last !== key) {
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      const yKey = `${yesterday.getFullYear()}-${String(yesterday.getMonth() + 1).padStart(2, "0")}-${String(yesterday.getDate()).padStart(2, "0")}`;
      state.progress.streak.count = state.progress.streak.last === yKey ? state.progress.streak.count + 1 : 1;
      state.progress.streak.last = key;
    }
    save();
  }

  function recordAnswer(skill, correct) {
    touchToday();
    const stat = state.progress.stats[skill] || { attempted: 0, correct: 0 };
    stat.attempted += 1;
    if (correct) stat.correct += 1;
    state.progress.stats[skill] = stat;
    save();
  }

  function recordSkillTouch(skill) {
    touchToday();
  }

  function scorePercent(skill) {
    const stat = state.progress.stats[skill] || { attempted: 0, correct: 0 };
    return stat.attempted ? Math.round((stat.correct / stat.attempted) * 100) : 0;
  }

  function setView(view, param) {
    state.view = view;
    state.param = param || null;
    render();
    $(".sidebar").classList.remove("sidebar-open");
    $("body").classList.remove("sidebar-open");
    window.scrollTo({ top: 0, behavior: "instant" in window ? "instant" : "auto" });
  }

  function setTarget(delta) {
    const next = Math.min(9, Math.max(4, Number((state.progress.target + delta).toFixed(1))));
    state.progress.target = next;
    save();
    renderTarget();
  }

  function render() {
    const root = $("#view-root");
    const titleEl = $("#view-title");
    titleEl.textContent = VIEW_TITLES[state.view] || "今日学习";
    $$(".nav-item").forEach((btn) => {
      const activeView = btn.dataset.view === state.view;
      const activeByParam = state.view === "lesson" && btn.dataset.view === "path";
      const activePractice = ["reading", "listening", "writing", "quiz"].includes(state.view) && btn.dataset.view === "practice";
      btn.classList.toggle("is-active", activeView || activeByParam || activePractice);
    });

    let html = "";
    switch (state.view) {
      case "home": html = renderHome(); break;
      case "path": html = renderPath(); break;
      case "lesson": html = renderLesson(state.param); break;
      case "practice": html = renderPractice(); break;
      case "reading": html = renderReadingTest(state.param); break;
      case "listening": html = renderListeningTest(state.param); break;
      case "writing": html = renderWritingTest(state.param); break;
      case "quiz": html = renderVocabQuizTest(state.param); break;
      case "vocab": html = renderVocab(); break;
      case "speaking": html = renderSpeaking(); break;
      case "about": html = renderAbout(); break;
      default: html = renderHome();
    }

    root.innerHTML = html;
    refreshIcons();
  }

  function refreshIcons() {
    if (window.lucide) window.lucide.createIcons();
  }

  function renderTarget() {
    $("#target-value").textContent = state.progress.target.toFixed(1);
    $("#streak-value").textContent = state.progress.streak.count;
  }

  function renderHome() {
    const stats = state.progress.stats;
    const totalAttempted = Object.values(stats).reduce((n, s) => n + (s.attempted || 0), 0);
    const totalCorrect = Object.values(stats).reduce((n, s) => n + (s.correct || 0), 0);
    const accuracy = totalAttempted ? Math.round((totalCorrect / totalAttempted) * 100) : 0;
    const known = state.progress.vocab.known.length;
    const target = state.progress.target;

    const tasks = [
      { view: "vocab", icon: "notebook-tabs", color: "gold", title: "背 10 个高频词", desc: "词汇卡片 · 约 5 分钟" },
      { view: "path", icon: "map", color: "teal", title: "完成一个学习模块", desc: "今天推荐：听力技巧" },
      { view: "practice", icon: "book-open-check", color: "red", title: "做一套阅读题", desc: "题库 · 约 20 分钟" },
      { view: "speaking", icon: "mic-2", color: "teal", title: "开口练一个口语题", desc: "口语题库 · 约 10 分钟" },
    ];

    const skillRows = ["listening", "reading", "writing", "speaking"]
      .map((skill) => {
        const p = scorePercent(skill);
        return `
          <div class="progress-row">
            <div class="progress-label"><span>${SKILL_META[skill].label}</span><span>${p}%</span></div>
            <div class="bar ${SKILL_META[skill].color}"><span style="width:${p}%"></span></div>
          </div>`;
      })
      .join("");

    return `
      <div class="hero-band reveal">
        <span class="eyebrow">${esc(String(target).replace(/\.5$/, ".5"))} BAND TARGET · BEGINNER PATH</span>
        <h2>今天，为你的雅思上岸前进一小步。</h2>
        <p>按自己的节奏学习。先补基础词汇和语法，再用真实题型训练听力、阅读、写作和口语。</p>
        <div class="hero-actions">
          <button class="btn" data-action="go" data-view="path"><i data-lucide="map"></i>开始学习地图</button>
          <button class="btn ghost-on-dark" data-action="go" data-view="practice" style="background:transparent;color:#fff;border-color:rgba(255,255,255,.45)"><i data-lucide="book-open-check"></i>直接刷题</button>
        </div>
      </div>

      <div class="stat-grid">
        <div class="stat-card reveal"><div class="stat-top"><span>累计做题</span><i data-lucide="list-checks"></i></div><strong>${totalAttempted}</strong><div class="stat-note">道题</div></div>
        <div class="stat-card reveal"><div class="stat-top"><span>正确率</span><i data-lucide="target"></i></div><strong>${accuracy}%</strong><div class="stat-note">${totalCorrect} / ${totalAttempted}</div></div>
        <div class="stat-card reveal"><div class="stat-top"><span>已记词汇</span><i data-lucide="sparkles"></i></div><strong>${known}</strong><div class="stat-note">个单词</div></div>
        <div class="stat-card reveal"><div class="stat-top"><span>连续学习</span><i data-lucide="flame"></i></div><strong>${state.progress.streak.count}</strong><div class="stat-note">天</div></div>
      </div>

      <div class="dashboard-grid">
        <section class="panel daily-card reveal">
          <h3>今日学习计划</h3>
          <div class="task-list">
            ${tasks.map((task) => `
              <div class="task" data-action="go" data-view="${task.view}">
                <div class="task-icon ${task.color}"><i data-lucide="${task.icon}"></i></div>
                <div class="task-body"><strong>${esc(task.title)}</strong><span>${esc(task.desc)}</span></div>
                <span class="task-check"><i data-lucide="chevron-right"></i></span>
              </div>`).join("")}
          </div>
        </section>

        <section class="panel skill-progress reveal">
          <h3>四科进度</h3>
          ${skillRows}
          <div style="margin-top:18px;padding-top:14px;border-top:1px solid var(--line)">
            <div class="progress-label"><span>目标分数</span><span style="color:var(--red-deep)">Band ${state.progress.target.toFixed(1)}</span></div>
            <div class="bar red"><span style="width:${Math.min(100, Math.round((target / 9) * 100))}%"></span></div>
          </div>
        </section>
      </div>`;
  }

  function renderPath() {
    const modules = BANK.learn.modules || [];
    return `
      <div class="section-head reveal">
        <div><h2>从零到上岸的学习地图</h2><p>按顺序完成，也可以直接跳到薄弱项。</p></div>
      </div>
      <div class="module-grid">
        ${modules.map((m, i) => `
          <article class="module-card ${m.color} reveal" data-action="open-lesson" data-id="${m.id}">
            <div class="module-top"><span class="module-num">0${i + 1}</span><span class="tag ${m.color}">${esc(m.level)}</span></div>
            <h3>${esc(m.title)}</h3>
            <div class="module-en">${esc(m.en)}</div>
            <p>${esc(m.summary)}</p>
            <div class="module-meta"><span class="tag">${esc(m.duration)}</span><span class="tag">${m.lessons.length} 节</span></div>
          </article>`).join("")}
      </div>`;
  }

  function renderLesson(id) {
    const mod = (BANK.learn.modules || []).find((m) => m.id === id) || (BANK.learn.modules || [])[0];
    if (!mod) return renderPath();
    return `
      <div class="lesson-wrap reveal">
        <div class="lesson-head">
          <button class="back-btn" data-action="go" data-view="path" aria-label="返回学习地图"><i data-lucide="arrow-left"></i></button>
          <div><h2>${esc(mod.title)}</h2><p style="margin:3px 0 0;color:var(--muted);font-size:13px">${esc(mod.en)} · ${esc(mod.duration)}</p></div>
        </div>
        ${mod.lessons.map((l) => `
          <div class="panel lesson-card reveal"><h3>${esc(l.title)}</h3><p>${esc(l.body)}</p></div>`).join("")}
        <div style="margin-top:20px">
          <button class="btn primary" data-action="go" data-view="${mod.id === "vocab" ? "vocab" : "practice"}">
            <i data-lucide="arrow-right"></i>开始练习
          </button>
        </div>
      </div>`;
  }

  function renderPractice() {
    const skills = ["vocab", "reading", "listening", "writing"];
    const levels = ["A1", "A2", "B1", "B2", "C1", "IELTS", "ALL"];
    const active = state.practiceSkill;
    const items = getPracticeItems(active);
    return `
      <div class="section-head reveal">
        <div><h2>题库练习</h2><p>按 CEFR 阶段选题。A1–A2 适合初一左右水平，B1–C1 逐步过渡到雅思。</p></div>
        <div class="seg">${skills.map((s) => `<button data-action="set-practice" data-skill="${s}" class="${s === active ? "is-active" : ""}">${SKILL_META[s].label}</button>`).join("")}</div>
      </div>
      <div class="filter-bar reveal" style="margin-bottom:14px">
        <span style="font-size:12px;color:var(--muted)">阶段</span>
        <div class="seg">${levels.map((level) => `<button data-action="set-practice-level" data-level="${level}" class="${level === state.practiceLevel ? "is-active" : ""}">${level === "ALL" ? "全部" : level}</button>`).join("")}</div>
      </div>
      <div class="test-list">
        ${items.length ? items.map((item) => renderPracticeCard(item)).join("") : `<div class="panel empty-state"><i data-lucide="inbox"></i><p>暂无题目</p></div>`}
      </div>`;
  }

  function getPracticeItems(skill) {
    const level = state.practiceLevel;
    const staged = BANK.staged || {};
    let list = [];
    if (skill === "reading") list = withLevel(BANK.reading, "IELTS").concat(withLevel(staged.reading, "A1"));
    if (skill === "listening") list = withLevel(BANK.listening, "IELTS").concat(withLevel(staged.listening, "A1"));
    if (skill === "writing") list = withLevel(BANK.writing, "IELTS").concat(withLevel(staged.writing, "A1"));
    if (skill === "vocab") list = (BANK.vocabQuiz || []).map((t) => ({ ...t, level: t.level || "A1" }));
    if (level === "ALL") return list.sort((a, b) => levelOrder(a.level) - levelOrder(b.level));
    return list.filter((item) => item.level === level);
    if (skill === "speaking") return []; // speaking has its own dedicated page
    return [];
  }

  function renderPracticeCard(item) {
    const skill = state.practiceSkill;
    const meta = SKILL_META[skill];
    const last = state.progress.lastScore[`${skill}:${item.id}`];
    const score = last !== undefined ? `${last}%` : "未开始";
    const count = item.questions ? `${item.questions.length} 题` : item.passages ? `${item.passages.length} 篇` : item.sections ? `${item.sections.length} section` : "";
    return `
      <div class="test-card" data-action="open-test" data-skill="${skill}" data-id="${item.id}">
        <div class="test-icon ${meta.color}"><i data-lucide="${meta.icon}"></i></div>
        <div class="test-main"><strong>${esc(item.title)}</strong><span><span class="tag ${item.level === "A1" || item.level === "A2" ? "teal" : "gold"}">${esc(item.level || "IELTS")}</span> ${esc(item.duration || "")} ${count ? "· " + esc(count) : ""}</span></div>
        <div class="test-score">${esc(score)}</div>
        <i data-lucide="chevron-right" style="width:18px;height:18px;color:var(--muted)"></i>
      </div>`;
  }

  function findTest(skill, id) {
    const staged = BANK.staged || {};
    const list = skill === "reading"
      ? withLevel(BANK.reading, "IELTS").concat(withLevel(staged.reading, "A1"))
      : skill === "listening"
        ? withLevel(BANK.listening, "IELTS").concat(withLevel(staged.listening, "A1"))
        : skill === "writing"
          ? withLevel(BANK.writing, "IELTS").concat(withLevel(staged.writing, "A1"))
          : skill === "vocab"
            ? (BANK.vocabQuiz || [])
            : [];
    return (list || []).find((t) => t.id === id);
  }

  function renderReadingTest(id) {
    const test = findTest("reading", id);
    if (!test) return `<div class="panel empty-state"><p>未找到该套题</p></div>`;
    state.currentTest = { skill: "reading", id };
    state.currentTest.checked = false;
    state.answerMap = {};

    const passageHtml = test.passages.map((p, pi) => `
      <div style="margin-bottom:24px">
        <h3>Passage ${p.number} · ${esc(p.title)}</h3>
        <div class="passage-text">${esc(p.content)}</div>
      </div>`).join("");

    const questionsHtml = test.passages.map((p, pi) => `
      <div style="margin-bottom:24px">
        <div style="font-family:var(--font-mono);font-size:11px;color:var(--muted);text-transform:uppercase;margin-bottom:4px">Passage ${p.number}</div>
        ${p.groups.map((g, gi) => renderQuestionGroup(g, pi, gi, p.content, test.level)).join("")}
      </div>`).join("");

    return `
      <div class="runner-head reveal">
        <div><h2>${esc(test.title)}</h2><div class="runner-meta"><span class="tag red">阅读</span><span class="tag">${esc(test.level || "IELTS")}</span><span class="tag">${esc(test.duration)}</span></div></div>
        <button class="btn ghost" data-action="go" data-view="practice"><i data-lucide="arrow-left"></i>返回题库</button>
      </div>
      <div class="reading-layout">
        <section class="panel passage-panel reveal">${passageHtml}</section>
        <section class="panel questions-panel reveal">
          ${questionsHtml}
          <div class="check-row">
            <div class="score-big" id="live-score">已答 <strong>0</strong> 题</div>
            <button class="btn primary" data-action="check-answers"><i data-lucide="check-check"></i>核对答案</button>
          </div>
        </section>
      </div>`;
  }

  function renderListeningTest(id) {
    const test = findTest("listening", id);
    if (!test) return `<div class="panel empty-state"><p>未找到该套题</p></div>`;
    state.currentTest = { skill: "listening", id, section: 0 };
    state.currentTest.checked = false;
    state.answerMap = {};
    return `
      <div class="runner-head reveal">
        <div><h2>${esc(test.title)}</h2><div class="runner-meta"><span class="tag teal">听力</span><span class="tag">${esc(test.level || "IELTS")}</span><span class="tag">${esc(test.duration)}</span></div></div>
        <button class="btn ghost" data-action="go" data-view="practice"><i data-lucide="arrow-left"></i>返回题库</button>
      </div>
      <div class="section-tabs reveal">
        ${test.sections.map((s, i) => `<button data-action="listen-section" data-index="${i}" class="${i === 0 ? "is-active" : ""}">Section ${s.number} · ${esc(s.title)}</button>`).join("")}
      </div>
      <div id="listen-section" class="panel panel-pad reveal">${renderListeningSection(test, 0)}</div>`;
  }

  function renderListeningSection(test, index) {
    const s = test.sections[index];
    state.currentTest.section = index;
    state.currentTest.checked = false;
    state.answerMap = {};
    const audio = s.audio ? `
      <div class="audio-block"><audio controls src="${esc(s.audio)}" preload="metadata"></audio></div>` : `
      <div class="audio-fallback">本 section 的音频暂未提供，可先阅读下方题目与原文练习。</div>`;
    const groups = (s.groups || []).map((g, gi) => renderQuestionGroup(g, index, gi, s.transcript, test.level)).join("");
    return `
      <h3 style="margin:0 0 12px;font-family:var(--font-display);font-size:19px;font-weight:900">Section ${s.number} · ${esc(s.title)}</h3>
      ${audio}
      ${groups}
      <button class="btn ghost transcript-toggle" data-action="toggle-transcript"><i data-lucide="file-text"></i>查看原文</button>
      <button class="btn teal transcript-toggle" data-action="speak-transcript"><i data-lucide="volume-2"></i>AI 朗读原文</button>
      <div class="transcript" hidden>${esc(s.transcript)}</div>
      <div class="check-row">
        <div class="score-big" id="live-score">已答 <strong>0</strong> 题</div>
        <button class="btn primary" data-action="check-answers"><i data-lucide="check-check"></i>核对答案</button>
      </div>`;
  }

  function renderQuestionGroup(group, passageIdx, groupIdx, context, level) {
    if (group.type === "summary-completion") {
      return renderSummaryGroup(group, passageIdx, groupIdx, context, level);
    }
    const questions = (group.questions || []).map((q, qi) => renderQuestion(q, group, passageIdx, groupIdx, qi, context, level)).join("");
    return `
      <div class="question-group">
        <div class="qg-head"><h4>${esc(group.type || "")}</h4></div>
        <p class="qg-instructions">${esc(group.instructions || "")}</p>
        ${group.wordBank && group.wordBank.length ? `<div style="margin:10px 0;font-size:12px;color:var(--muted)">词库：${group.wordBank.map((w) => esc(w)).join(" · ")}</div>` : ""}
        ${questions}
      </div>`;
  }

  function renderQuestion(q, group, passageIdx, groupIdx, qi, context, level) {
    const base = `p${passageIdx}:g${groupIdx}:q${qi}`;
    const label = q.order || qi + 1;
    const shared = {
      context: context || "",
      level: level || "",
      explain: q.explain || "",
      question: q.text || "",
      word: q.word || "",
      phonetic: q.phonetic || "",
      options: q.options || [],
    };
    const wordButton = q.word ? `<button class="speak-btn" data-action="speak-word" data-word="${esc(q.word)}" title="朗读单词"><i data-lucide="volume-2"></i></button>` : "";

    if (q.type === "true-false" || q.type === "yes-no") {
      const qpath = `${base}`;
      state.answerMap[qpath] = { ...shared, type: "choice", answer: q.answer, accepted: q.accepted || [] };
      const buttons = q.options.map((opt) => `<button data-action="select-option" data-qpath="${qpath}" data-value="${esc(opt)}">${esc(opt)}</button>`).join("");
      return `<div class="question"><div class="q-text"><span class="q-no">${label}</span><span>${esc(q.text)}</span></div><div class="q-options">${buttons}</div><div class="q-feedback-slot" data-feedback="${qpath}"></div></div>`;
    }

    if (q.type === "multiple-choice" || q.type === "matching-letters" || q.type === "matching-headings") {
      const qpath = `${base}`;
      state.answerMap[qpath] = { ...shared, type: "choice", answer: q.answer, accepted: [] };
      const options = q.options.map((opt, oi) => {
        let value = opt;
        if (q.type === "matching-headings") value = String(opt).split(".")[0].trim();
        if (q.type === "multiple-choice" && /^[A-F][.)]/.test(String(opt))) value = String(opt)[0];
        if (q.type === "matching-letters") value = String(opt);
        return `<button data-action="select-option" data-qpath="${qpath}" data-value="${esc(value)}">${esc(opt)}</button>`;
      }).join("");
      return `<div class="question"><div class="q-text"><span class="q-no">${label}</span><span>${wordButton}${esc(q.text)}</span></div><div class="q-options">${options}</div><div class="q-feedback-slot" data-feedback="${qpath}"></div></div>`;
    }

    if (q.type === "table-completion") {
      const cells = (q.gaps || []).map((gap, gi) => {
        const qpath = `${base}:g${gi}`;
        if (!gap.blank) return `<span style="color:var(--muted)">${esc(gap.text)}</span>`;
        state.answerMap[qpath] = { ...shared, type: "text", answer: gap.answer, accepted: [gap.answer] };
        return `<span>${esc(gap.text)} <input class="q-input" data-qpath="${qpath}" /><span class="q-feedback-slot inline" data-feedback="${qpath}"></span></span>`;
      }).join(" <span style=\"color:var(--line)\">·</span> ");
      return `<div class="question"><div class="q-text"><span class="q-no">${label}</span><span>${esc(q.text)}</span></div><div style="font-size:13px;line-height:2">${cells}</div></div>`;
    }

    // short-answer and sentence-completion fall here
    const qpath = `${base}`;
    state.answerMap[qpath] = { ...shared, type: "text", answer: q.answer, accepted: q.accepted || [] };
    return `<div class="question"><div class="q-text"><span class="q-no">${label}</span><span>${esc(q.text)}</span></div><input class="q-input" data-qpath="${qpath}" /><div class="q-feedback-slot" data-feedback="${qpath}"></div></div>`;
  }

  function renderSummaryGroup(group, passageIdx, groupIdx, context, level) {
    const base = `p${passageIdx}:g${groupIdx}`;
    const gaps = group.gaps || [];
    let gapIndex = 0;
    const textHtml = String(group.text).replace(/\{\{gap_[^}]+\}\}/g, () => {
      const qpath = `${base}:s${gapIndex}`;
      const gap = gaps[gapIndex] || {};
      state.answerMap[qpath] = { type: "text", answer: gap.answer, accepted: [gap.answer], context: context || "", level: level || "", explain: "", question: group.text || "", word: "", phonetic: "", options: [] };
      gapIndex += 1;
      return `<input class="q-input" data-qpath="${qpath}" style="width:110px;margin:0 3px" /><span class="q-feedback-slot inline" data-feedback="${qpath}"></span>`;
    });
    return `
      <div class="question-group">
        <div class="qg-head"><h4>Summary completion</h4></div>
        <p class="qg-instructions">${esc(group.instructions || "")}</p>
        ${group.wordBank && group.wordBank.length ? `<div style="margin:10px 0;font-size:12px;color:var(--muted)">词库：${group.wordBank.map((w) => esc(w)).join(" · ")}</div>` : ""}
        <div style="font-size:14px;line-height:2.2">${textHtml}</div>
      </div>`;
  }

  function renderVocabQuizTest(id) {
    const test = findTest("vocab", id);
    if (!test) return `<div class="panel empty-state"><p>未找到该套词汇题</p></div>`;
    state.currentTest = { skill: "vocab", id, checked: false };
    state.answerMap = {};
    const group = { type: "multiple-choice", instructions: "选择正确答案。点击单词旁边的小喇叭可以听发音。", questions: test.questions || [] };
    return `
      <div class="runner-head reveal">
        <div><h2>${esc(test.title)}</h2><div class="runner-meta"><span class="tag gold">词汇</span><span class="tag">${esc(test.level)}</span><span class="tag">${test.questions.length} 题</span></div></div>
        <button class="btn ghost" data-action="go" data-view="practice"><i data-lucide="arrow-left"></i>返回题库</button>
      </div>
      <section class="panel questions-panel reveal">
        ${renderQuestionGroup(group, 0, 0, "", test.level)}
        <div class="check-row">
          <div class="score-big" id="live-score">已答 <strong>0</strong> 题</div>
          <button class="btn primary" data-action="check-answers"><i data-lucide="check-check"></i>核对答案</button>
        </div>
      </section>`;
  }

  function renderWritingTest(id) {
    const test = findTest("writing", id);
    if (!test) return `<div class="panel empty-state"><p>未找到该套题</p></div>`;
    state.currentTest = { skill: "writing", id };
    state.writingTaskIndex = 0;
    const tasks = test.tasks || [];
    return `
      <div class="runner-head reveal">
        <div><h2>${esc(test.title)}</h2><div class="runner-meta"><span class="tag gold">写作</span><span class="tag">${esc(test.level || "IELTS")}</span></div></div>
        <button class="btn ghost" data-action="go" data-view="practice"><i data-lucide="arrow-left"></i>返回题库</button>
      </div>
      <div class="section-tabs reveal">
        ${tasks.map((t, i) => `<button data-action="writing-task" data-index="${i}" class="${i === 0 ? "is-active" : ""}">${esc(t.title)}</button>`).join("")}
      </div>
      <div id="writing-pane" class="reveal">${renderWritingTask(test, 0)}</div>`;
  }

  function renderWritingTask(test, index) {
    const task = (test.tasks || [])[index];
    if (!task) return "";
    state.writingTaskIndex = index;
    const draft = state.progress.drafts[`${test.id}:${task.number}`] || "";
    const figure = task.image ? `
      <div class="task-figure"><img src="${esc(task.image)}" alt="${esc(task.title)}" loading="lazy" />${task.figure ? `<p class="figure-desc">${esc(task.figure)}</p>` : ""}</div>` : "";
    return `
      <div class="writing-grid">
        <section class="panel task-panel">
          <h3>${esc(task.title)}</h3>
          <div class="tag ${task.type === "task1" ? "teal" : "gold"}" style="margin-bottom:12px">${esc(task.time)} · 至少 ${task.minWords} 词</div>
          <div class="task-prompt">${esc(task.prompt)}</div>
          ${figure}
        </section>
        <section class="panel task-panel write-area">
          <textarea data-writing-id="${esc(test.id)}" data-task-no="${task.number}" data-min="${task.minWords}" placeholder="在这里写下你的答案…">${esc(draft)}</textarea>
          <div class="write-meta"><span class="word-count" id="word-count">0 词</span><button class="btn teal" data-action="save-draft"><i data-lucide="save"></i>保存草稿</button></div>
        </section>
      </div>`;
  }

  function renderVocab() {
    const levels = ["A1", "A2", "B1", "B2", "C1"];
    const vocab = getLevelVocab(state.vocabLevel);
    if (!vocab.length) return `<div class="panel empty-state"><p>暂无词汇</p></div>`;
    if (state.vocabDeck.length === 0 || state.vocabDeckKey !== state.vocabLevel) {
      resetVocabDeck();
    }
    const idx = state.vocabDeck[Math.min(state.vocabIndex, state.vocabDeck.length - 1)];
    const card = vocab[idx];
    const total = state.vocabDeck.length;
    const pos = Math.min(state.vocabIndex + 1, total);
    const knownCount = state.progress.vocab.known.length;
    return `
      <div class="section-head reveal">
        <div><h2>分级词汇卡片</h2><p>点击单词或喇叭听发音，点击卡片空白处翻转释义。</p></div>
        <div class="tag teal">已掌握 ${knownCount} 个</div>
      </div>
      <div class="filter-bar reveal" style="margin-bottom:14px">
        <span style="font-size:12px;color:var(--muted)">阶段</span>
        <div class="seg">${levels.map((level) => `<button data-action="set-vocab-level" data-level="${level}" class="${level === state.vocabLevel ? "is-active" : ""}">${level}</button>`).join("")}</div>
      </div>
      <div class="card-deck reveal">
        <div class="flash-card" data-action="flip-card">
          <div class="flash-face front">
            <span class="flash-pos">${esc(state.vocabLevel)} ${card.pos ? "· " + esc(card.pos) : ""}</span>
            <div class="flash-word speakable" data-action="speak-word" data-word="${esc(card.w)}" title="点击听发音">${esc(card.w)} <i data-lucide="volume-2"></i></div>
            ${card.p ? `<div class="flash-phonetic">${esc(card.p)}</div>` : ""}
            <div class="flash-zh">${esc(card.zh)}</div>
          </div>
          <div class="flash-face back">
            <div class="flash-def">${esc(card.en)}</div>
            ${card.ex ? `<div class="flash-example">${esc(card.ex)}</div>` : ""}
            ${card.exZh ? `<div class="flash-example-zh">${esc(card.exZh)}</div>` : ""}
          </div>
        </div>
        <div class="deck-actions">
          <button class="btn ghost" data-action="flip-card"><i data-lucide="refresh-cw"></i>翻转卡片</button>
          <button class="btn ghost" data-action="vocab-again"><i data-lucide="rotate-ccw"></i>还不熟</button>
          <button class="btn primary" data-action="vocab-known"><i data-lucide="check"></i>认识了</button>
        </div>
        <div class="deck-progress">${state.vocabLevel} · ${pos} / ${total} · 单词可点击发音</div>
      </div>`;
  }

  function renderSpeaking() {
    const levels = ["A1", "A2", "B1", "B2", "C1", "IELTS"];
    const staged = BANK.staged || {};
    const level = state.speakingLevel;
    let items = [];
    if (level === "IELTS") {
      items = BANK.speaking || [];
    } else {
      const set = (staged.speaking || []).find((s) => s.level === level);
      items = set ? set.items.map((item, i) => ({ id: `${level}-${i}`, set: `${level} 分级口语`, question: item.q, answer: item.a })) : [];
    }
    if (!items.length) return `<div class="panel empty-state"><p>暂无口语题目</p></div>`;
    state.speakingIndex = (state.speakingIndex % items.length + items.length) % items.length;
    const item = items[state.speakingIndex];
    return `
      <div class="section-head reveal">
        <div><h2>口语题库</h2><p>A1–C1 分级口语题，共 ${items.length} 道，附参考回答。</p></div>
        <div class="tag teal">${esc(item.set)}</div>
      </div>
      <div class="filter-bar reveal" style="margin-bottom:14px">
        <span style="font-size:12px;color:var(--muted)">阶段</span>
        <div class="seg">${levels.map((l) => `<button data-action="set-speaking-level" data-level="${l}" class="${l === level ? "is-active" : ""}">${l}</button>`).join("")}</div>
      </div>
      <div class="panel speaking-card reveal">
        <span class="eyebrow">${esc(item.set)}</span>
        <h3 class="speaking-question speakable" data-action="speak-passage" data-text="${esc(item.question)}" title="点击听问题">${esc(item.question)} <i data-lucide="volume-2"></i></h3>
        <div class="speaking-actions">
          <button class="btn primary" data-action="speak-next"><i data-lucide="shuffle"></i>下一题</button>
          <button class="btn ghost" data-action="speak-reveal"><i data-lucide="eye"></i>查看参考回答</button>
          <span class="timer" data-action="speak-timer" data-seconds="0"><i data-lucide="timer"></i>准备 1:00</span>
        </div>
        <div class="model-answer" data-model hidden>
          <h4>参考回答</h4>
          <p>${esc(item.answer)}</p>
        </div>
      </div>`;
  }

  function renderAbout() {
    const sources = BANK.sources || {};
    return `
      <div class="panel about-card reveal">
        <h2>题库来源与许可</h2>
        <p style="color:var(--ink-soft);line-height:1.8">本网站用于个人自学，非商业用途。题目分别来自以下开放许可数据集，已在页面与数据中保留署名。</p>
        <table class="source-table">
          <thead><tr><th>科目</th><th>来源</th><th>许可</th></tr></thead>
          <tbody>
            <tr><td>阅读</td><td><code>${esc(sources.reading)}</code></td><td>CC BY 4.0</td></tr>
            <tr><td>听力</td><td><code>${esc(sources.listening)}</code></td><td>CC BY 4.0</td></tr>
            <tr><td>写作</td><td><code>${esc(sources.writing)}</code></td><td>CC BY 4.0</td></tr>
            <tr><td>口语</td><td><code>${esc(sources.speaking)}</code></td><td>Apache 2.0</td></tr>
            <tr><td>分级词库</td><td><code>anig1scur/CEFR-Vocabulary-List</code></td><td>MIT</td></tr>
            <tr><td>中英释义</td><td><code>skywind3000/ECDICT</code></td><td>MIT</td></tr>
          </tbody>
        </table>
        <p style="margin-top:18px;color:var(--muted);font-size:12px">学习记录仅保存在你的浏览器 localStorage，不会上传到任何服务器。</p>
      </div>`;
  }

  /* Interaction handlers */
  function handleAction(e) {
    const target = e.target.closest("[data-action]");
    if (!target) return;
    const action = target.dataset.action;

    if (action === "go") {
      setView(target.dataset.view, target.dataset.id || null);
      return;
    }
    if (action === "open-lesson") {
      setView("lesson", target.dataset.id);
      return;
    }
    if (action === "set-practice") {
      state.practiceSkill = target.dataset.skill;
      render();
      return;
    }
    if (action === "set-practice-level") {
      state.practiceLevel = target.dataset.level;
      render();
      return;
    }
    if (action === "open-test") {
      const skill = target.dataset.skill;
      setView(skill === "vocab" ? "quiz" : skill, target.dataset.id);
      return;
    }
    if (action === "listen-section") {
      const test = findTest("listening", state.currentTest.id);
      const index = Number(target.dataset.index);
      state.currentTest.section = index;
      $$(".section-tabs button").forEach((b) => b.classList.toggle("is-active", Number(b.dataset.index) === index));
      $("#listen-section").innerHTML = renderListeningSection(test, index);
      refreshIcons();
      return;
    }
    if (action === "toggle-transcript") {
      const t = $("#listen-section .transcript");
      if (t) t.hidden = !t.hidden;
      return;
    }
    if (action === "speak-transcript") {
      const t = $("#listen-section .transcript");
      if (t) speakText(t.textContent, 0.82);
      return;
    }
    if (action === "writing-task") {
      const test = findTest("writing", state.currentTest.id);
      const index = Number(target.dataset.index);
      $$(".section-tabs button").forEach((b) => b.classList.toggle("is-active", Number(b.dataset.index) === index));
      $("#writing-pane").innerHTML = renderWritingTask(test, index);
      refreshIcons();
      return;
    }
    if (action === "save-draft") {
      saveDraft();
      return;
    }
    if (action === "select-option") {
      if (state.currentTest && state.currentTest.checked) return;
      const qpath = target.dataset.qpath;
      $$(`.q-options button[data-qpath="${qpath}"]`).forEach((b) => b.classList.remove("selected"));
      target.classList.add("selected");
      updateLiveScore();
      return;
    }
    if (action === "check-answers") {
      checkAnswers();
      return;
    }
    if (action === "flip-card") {
      $(".flash-card").classList.toggle("flipped");
      return;
    }
    if (action === "speak-word") {
      speakWord(target.dataset.word, target);
      return;
    }
    if (action === "speak-passage") {
      speakText(target.dataset.text, 0.82);
      return;
    }
    if (action === "set-vocab-level") {
      state.vocabLevel = target.dataset.level;
      resetVocabDeck();
      render();
      return;
    }
    if (action === "vocab-again") {
      advanceVocab(false);
      return;
    }
    if (action === "vocab-known") {
      advanceVocab(true);
      return;
    }
    if (action === "speak-next") {
      state.speakingIndex = (state.speakingIndex + 1) % 1000;
      render();
      return;
    }
    if (action === "set-speaking-level") {
      state.speakingLevel = target.dataset.level;
      state.speakingIndex = 0;
      render();
      return;
    }
    if (action === "speak-reveal") {
      const model = $(".model-answer");
      if (model) model.hidden = false;
      recordSkillTouch("speaking");
      return;
    }
    if (action === "speak-timer") {
      startSpeakingTimer(target);
      return;
    }
  }

  function updateLiveScore() {
    const scoreEl = $("#live-score");
    if (!scoreEl) return;
    const total = Object.keys(state.answerMap).length;
    const answered = $$("[data-qpath].selected, [data-qpath].q-input").filter((el) => {
      if (el.classList.contains("selected")) return true;
      return el.value && el.value.trim() !== "";
    }).length;
    scoreEl.innerHTML = `已答 <strong>${Math.min(answered, total)}</strong> / ${total} 题`;
  }

  function checkAnswers() {
    if (state.currentTest && state.currentTest.checked) {
      toast("已核对过答案，请进入下一题");
      return;
    }
    let correct = 0;
    let total = 0;

    Object.keys(state.answerMap).forEach((qpath) => {
      const meta = state.answerMap[qpath];
      total += 1;
      let selected = "";
      let selectedEl = null;
      if (meta.type === "choice") {
        selectedEl = $(`.q-options button[data-qpath="${qpath}"].selected`);
        selected = selectedEl ? selectedEl.dataset.value : "";
      } else {
        const input = $(`input[data-qpath="${qpath}"]`);
        selectedEl = input;
        selected = input ? input.value : "";
      }
      const ok = isCorrect(meta, selected);
      if (ok) correct += 1;
      if (meta.type === "choice") {
        const buttons = $$(`.q-options button[data-qpath="${qpath}"]`);
        if (selected) {
          buttons.forEach((btn) => {
            if (normalize(btn.dataset.value) === normalize(meta.answer)) btn.classList.add("correct");
          });
          if (selectedEl && !ok) selectedEl.classList.add("wrong");
        }
      } else if (selectedEl) {
        markElement(selectedEl, ok);
      }
      const slot = $(`[data-feedback="${qpath}"]`);
      if (slot) {
        if (!selected) {
          slot.className = "q-feedback-slot";
          slot.innerHTML = "";
        } else {
          slot.className = `q-feedback-slot ${ok ? "ok" : "no"}`;
          slot.innerHTML = buildExplanation(meta, ok);
        }
      }
    });

    const statSkill = state.currentTest.skill === "reading"
      ? "reading"
      : state.currentTest.skill === "listening"
        ? "listening"
        : state.currentTest.skill === "writing"
          ? "writing"
          : "vocab";
    const score = total ? Math.round((correct / total) * 100) : 0;
    const stat = state.progress.stats[statSkill];
    stat.attempted += total;
    stat.correct += correct;
    state.progress.stats[statSkill] = stat;
    state.progress.lastScore[`${statSkill}:${state.currentTest.id}`] = score;
    state.currentTest.checked = true;
    touchToday();
    save();

    const scoreEl = $("#live-score");
    if (scoreEl) scoreEl.innerHTML = `得分 <strong>${correct}</strong> / ${total} · ${score}%`;
    renderTarget();
    toast(total ? `核对完成：${correct}/${total} 题正确` : "没有可核对的答案");
  }

  function findClue(context, answer) {
    const text = String(context || "");
    const target = normalize(answer);
    if (!text || !target) return "";
    const sentences = text.split(/(?<=[.!?])\s+/);
    const hit = sentences.find((s) => normalize(s).includes(target));
    return hit ? `原文线索：${hit.trim()}` : "";
  }

  function buildExplanation(meta, ok) {
    const answer = meta.answer || "";
    if (meta.explain) {
      return `<strong>${ok ? "正确" : "需要再看一次"}</strong><br>${esc(meta.explain)}`;
    }
    let tip = "";
    if (meta.question && meta.question.includes("最接近")) tip = "词汇题先看词性和中文释义，再排除意思差距最大的选项。";
    else if (meta.type === "choice") tip = "选择题先划题干关键词，再回到原文或录音找同义替换。";
    else tip = "填空题注意词数限制、单复数和拼写。";
    const clue = findClue(meta.context, answer);
    const correctLine = ok ? "你的答案正确。" : `正确答案是：${answer}。`;
    return `<strong>${ok ? "正确" : "需要再看一次"}</strong><br>${esc(correctLine)} ${esc(tip)}${clue ? `<br>${esc(clue)}` : ""}`;
  }

  function isCorrect(meta, selected) {
    if (meta.type === "choice") {
      const a = normalize(meta.answer);
      const b = normalize(selected);
      return a && b === a;
    }
    const accepted = meta.accepted && meta.accepted.length ? meta.accepted : [meta.answer];
    const b = normalize(selected);
    return accepted.some((x) => normalize(x) === b && b !== "");
  }

  function markElement(el, ok) {
    if (el.tagName === "INPUT") {
      el.classList.add(ok ? "correct" : "wrong");
      el.readOnly = true;
      return;
    }
    el.classList.add(ok ? "correct" : "wrong");
  }

  function saveDraft() {
    const textarea = $("[data-writing-id]");
    if (!textarea) return;
    const key = `${textarea.dataset.writingId}:${textarea.dataset.taskNo}`;
    state.progress.drafts[key] = textarea.value;
    save();
    touchToday();
    toast("草稿已保存到本机");
  }

  function updateWordCount() {
    const textarea = $("[data-writing-id]");
    if (!textarea) return;
    const words = (textarea.value.match(/[A-Za-z0-9'’-]+/g) || []).length;
    const countEl = $("#word-count");
    if (countEl) {
      countEl.textContent = `${words} 词`;
      countEl.classList.toggle("low", words < Number(textarea.dataset.min || 0));
    }
  }

  function advanceVocab(known) {
    const vocab = getLevelVocab(state.vocabLevel);
    const idx = state.vocabDeck[state.vocabIndex];
    const card = vocab[idx];
    if (!card) return;
    touchToday();
    state.progress.vocab.seen += 1;
    const key = `${state.vocabLevel}:${card.w}`;
    if (known && !state.progress.vocab.known.includes(key)) {
      state.progress.vocab.known.push(key);
    }
    state.vocabDeck.splice(state.vocabIndex, 1);
    if (!known) state.vocabDeck.push(idx);
    if (state.vocabIndex >= state.vocabDeck.length) state.vocabIndex = 0;
    save();
    render();
  }

  function startSpeakingTimer(el) {
    if (el.dataset.running === "1") return;
    el.dataset.running = "1";
    let seconds = 60;
    el.dataset.seconds = seconds;
    el.innerHTML = `<i data-lucide="timer"></i> 准备 1:00`;
    refreshIcons();
    const interval = setInterval(() => {
      seconds -= 1;
      el.dataset.seconds = seconds;
      const mm = Math.floor(Math.max(0, seconds) / 60);
      const ss = String(Math.max(0, seconds) % 60).padStart(2, "0");
      if (seconds <= 0) {
        clearInterval(interval);
        el.dataset.running = "0";
        el.innerHTML = `<i data-lucide="check"></i> 准备完成`;
        refreshIcons();
        toast("开始你的回答吧");
      } else {
        el.innerHTML = `<i data-lucide="timer"></i> ${mm}:${ss}`;
      }
    }, 1000);
  }

  function toast(msg) {
    const el = $("#toast");
    el.textContent = msg;
    el.classList.add("show");
    clearTimeout(el._timer);
    el._timer = setTimeout(() => el.classList.remove("show"), 2200);
  }

  function bindEvents() {
    $("#view-root").addEventListener("click", handleAction);
    $("#view-root").addEventListener("input", (e) => {
      if (e.target.matches("[data-writing-id]")) updateWordCount();
      if (e.target.matches("[data-qpath]")) updateLiveScore();
    });
    $$(".nav-item").forEach((btn) => {
      btn.addEventListener("click", () => setView(btn.dataset.view));
    });
    $(".source-link").addEventListener("click", () => setView("about"));
    $("#menu-btn").addEventListener("click", () => {
      $("body").classList.toggle("sidebar-open");
    });
    $("#scrim").addEventListener("click", () => {
      $("body").classList.remove("sidebar-open");
    });
    $("#target-minus").addEventListener("click", () => setTarget(-0.5));
    $("#target-plus").addEventListener("click", () => setTarget(0.5));
    $("#reset-progress").addEventListener("click", () => {
      if (confirm("确定清空本机学习记录吗？此操作无法撤销。")) {
        localStorage.removeItem(STORAGE_KEY);
        state.progress = defaultProgress();
        renderTarget();
        render();
        toast("学习记录已清空");
      }
    });
  }

  function init() {
    bindEvents();
    renderTarget();
    render();
  }

  init();
})();
