(function () {
  "use strict";

  const BANK = window.IELTS_BANK || {};
  const STORAGE_KEY = "ielts_passport_v1";
  let progressStorageKey = STORAGE_KEY;
  const ADMIN_EMAILS = new Set(["nma82438@gmail.com", "nma82438.gmail"]);
  const PUBLISHED_CLOUD = window.IELTS_CLOUD_CONFIG || {};
  const $ = (sel, root = document) => root.querySelector(sel);
  const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));

  function normalizeCloudConfig(cloud = {}) {
    return {
      url: String(cloud.url || "").trim().replace(/\/$/, ""),
      anonKey: String(cloud.anonKey || "").trim(),
    };
  }

  function cloudConfigured(cloud = state.account.cloud) {
    const config = normalizeCloudConfig(cloud);
    return /^https?:\/\//i.test(config.url) && config.anonKey.length > 20;
  }

  const VIEW_TITLES = {
    home: "今日学习",
    path: "学习地图",
    lesson: "学习模块",
    library: "阅读与写作",
    practice: "题库练习",
    challenges: "题型挑战",
    exam: "模拟考试",
    videos: "教学系列",
    ai: "AI 英语对话",
    account: "账户与同步",
    settings: "设置",
    review: "错题复习",
    session: "答题中",
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

  const AI_SCENARIOS = {
    intro: {
      title: "自我介绍",
      en: "Introduce yourself",
      level: "A1",
      goal: "练习姓名、年龄、家乡和日常信息。",
      steps: [
        { ai: "Hello! I'm your English partner. What's your name?", hint: "My name is ... / I'm ...", keywords: ["name", "i am", "i'm", "call me"] },
        { ai: "Nice to meet you! Where are you from?", hint: "I'm from ... / I live in ...", keywords: ["from", "live", "city", "china"] },
        { ai: "How old are you, and what do you do?", hint: "I'm ... years old. I'm a student.", keywords: ["years old", "student", "school", "work"] },
        { ai: "What do you usually do after school or work?", hint: "After school, I usually ...", keywords: ["after", "usually", "play", "study", "watch", "read"] },
        { ai: "That sounds good. What are you learning English for?", hint: "I'm learning English because ...", keywords: ["because", "ielts", "travel", "study", "future"] },
      ],
    },
    school: {
      title: "校园生活",
      en: "School life",
      level: "A1",
      goal: "练习课程、老师、作业和校园活动。",
      steps: [
        { ai: "Let's talk about school. What's your favourite subject?", hint: "My favourite subject is ... because ...", keywords: ["favourite", "favorite", "subject", "english", "math", "science"] },
        { ai: "Why do you like it?", hint: "I like it because it is ...", keywords: ["because", "interesting", "useful", "easy", "fun"] },
        { ai: "Do you have a lot of homework every day?", hint: "Yes, I do. / No, I don't. I have ...", keywords: ["homework", "yes", "no", "a lot", "little"] },
        { ai: "What do you do at lunchtime?", hint: "At lunchtime, I ...", keywords: ["lunch", "eat", "talk", "friends", "play"] },
        { ai: "If you could change one thing about your school, what would it be?", hint: "I would change ... because ...", keywords: ["would", "change", "because", "more", "less"] },
      ],
    },
    hobbies: {
      title: "兴趣爱好",
      en: "Hobbies and free time",
      level: "A2",
      goal: "练习兴趣、频率和原因表达。",
      steps: [
        { ai: "What do you like doing in your free time?", hint: "In my free time, I like ...", keywords: ["free time", "like", "enjoy", "hobby", "play", "read", "watch"] },
        { ai: "How often do you do it?", hint: "I do it every day / twice a week / sometimes.", keywords: ["every", "often", "sometimes", "twice", "week", "day"] },
        { ai: "Who do you usually do it with?", hint: "I usually do it with my ...", keywords: ["with", "friend", "family", "brother", "sister", "alone"] },
        { ai: "Why do you enjoy it?", hint: "I enjoy it because it makes me feel ...", keywords: ["because", "relax", "happy", "fun", "interesting"] },
        { ai: "Would you like to try a new hobby? What would you try?", hint: "I would like to try ...", keywords: ["would", "try", "learn", "new", "maybe"] },
      ],
    },
    travel: {
      title: "旅行计划",
      en: "Travel plans",
      level: "A2",
      goal: "练习地点、交通、时间和计划表达。",
      steps: [
        { ai: "Where would you like to travel next?", hint: "I would like to travel to ...", keywords: ["travel", "go", "visit", "want", "would"] },
        { ai: "How would you get there?", hint: "I would go by plane / train / bus.", keywords: ["plane", "train", "bus", "car", "fly", "by"] },
        { ai: "Who would you go with?", hint: "I would go with my ...", keywords: ["with", "friend", "family", "parents", "alone"] },
        { ai: "What would you do there?", hint: "I would ... and ...", keywords: ["visit", "see", "eat", "take", "try", "photo"] },
        { ai: "What is one problem you might have on the trip?", hint: "One problem might be ...", keywords: ["problem", "maybe", "language", "money", "weather", "lost"] },
      ],
    },
    ielts1: {
      title: "雅思口语 Part 1",
      en: "IELTS Speaking Part 1",
      level: "B1",
      goal: "练习短回答 + 原因 + 例子的表达结构。",
      steps: [
        { ai: "Do you like your hometown? Why?", hint: "Yes, I like it because ... For example, ...", keywords: ["because", "example", "like", "hometown", "city"] },
        { ai: "Do you often use your phone?", hint: "Yes, I use it every day. I mainly use it to ...", keywords: ["phone", "every day", "use", "mainly", "because"] },
        { ai: "What kind of music do you listen to?", hint: "I usually listen to ... because ...", keywords: ["music", "listen", "usually", "because", "like"] },
        { ai: "Do you prefer reading books or watching films?", hint: "I prefer ... because ...", keywords: ["prefer", "because", "book", "film", "reading", "watching"] },
        { ai: "How do you usually spend your weekends?", hint: "On weekends, I usually ...", keywords: ["weekend", "usually", "spend", "go", "stay", "meet"] },
      ],
    },
    ielts2: {
      title: "雅思口语 Part 2",
      en: "IELTS Speaking Part 2",
      level: "B2",
      goal: "练习 1–2 分钟长回答和结构展开。",
      steps: [
        { ai: "Describe a place you enjoy visiting. You can talk about where it is, what you do there, and why you like it.", hint: "Start with: I'd like to talk about ...", keywords: ["place", "visit", "because", "enjoy", "there"] },
        { ai: "What makes this place special to you?", hint: "It is special because ...", keywords: ["special", "because", "memory", "feel", "people"] },
        { ai: "How often do you go there?", hint: "I go there ... / I used to ...", keywords: ["often", "used to", "every", "sometimes", "last"] },
        { ai: "Would you recommend it to others? Why?", hint: "Yes, I would recommend it because ...", keywords: ["recommend", "because", "others", "yes", "would"] },
        { ai: "Now give a complete answer in 60 seconds, using all your ideas.", hint: "Use: Where → What → Why → How you feel.", keywords: ["because", "also", "finally", "feel", "enjoy"] },
      ],
    },
  };

  const AI_FREE_PROMPTS = [
    "What did you do today?",
    "Tell me about a person you admire.",
    "What is your favourite food? Why?",
    "Do you prefer studying alone or with friends?",
    "What will you do next weekend?",
    "What is one skill you want to learn?",
    "Describe a memorable day.",
    "How do you usually relax?",
  ];

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
      daily: { date: "", words: 0, questions: 0, minutes: 0, tests: 0, lastMilestone: 0, wordsSeen: [] },
      player: { xp: 0, level: 1, estimatedBand: 3.5, bestBand: 0, mockScores: [] },
      profile: { displayName: "", email: "" },
      wrongAnswers: [],
      vocabUnits: {},
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
    vocabDeckKey: "",
    vocabUnit: 1,
    vocabIndex: 0,
    speakingIndex: Math.floor(Math.random() * ((BANK.speaking || []).length || 1)),
    speakingLevel: "A1",
    writingTaskIndex: 0,
    lookupEnabled: true,
    ttsCompat: false,
    challengeLevel: "A1",
    examLevel: "A1",
    session: null,
    ai: {
      scenario: "intro",
      level: "A1",
      messages: [],
      stepIndex: 0,
      thinking: false,
      listening: false,
      autoMode: false,
      status: "idle",
      recognitionPaused: false,
      recognition: null,
      settings: { mode: "builtin", baseUrl: "https://api.openai.com/v1", apiKey: "", model: "gpt-4o-mini" },
    },
    account: {
      user: null,
      mode: "guest",
      cloud: normalizeCloudConfig(PUBLISHED_CLOUD),
      syncStatus: "idle",
      installPrompt: null,
      formMode: "register",
      registerStorage: "cloud",
    },
    config: { requireLogin: true, allowRegistration: true, oauth: { wechatAppId: "", qqAppId: "", workerUrl: "" } },
    settings: { voiceEnabled: true, autoEncourage: true, voiceURI: "", rate: 0.82, ttsCompat: false, lookupEnabled: true },
    libraryTab: "stories",
    libraryItemId: "",
  };

  const dictionaryShardPromises = new Map();
  let popoverToken = 0;
  let currentPopoverWord = "";
  let currentPopoverAnchor = null;

  function loadProgress() {
    try {
      const raw = localStorage.getItem(progressStorageKey);
      if (raw) {
        const parsed = JSON.parse(raw);
        const defaults = defaultProgress();
        return {
          ...defaults,
          ...parsed,
          streak: { ...defaults.streak, ...(parsed.streak || {}) },
          stats: { ...defaults.stats, ...(parsed.stats || {}) },
          vocab: { ...defaults.vocab, ...(parsed.vocab || {}) },
          daily: { ...defaults.daily, ...(parsed.daily || {}) },
          player: { ...defaults.player, ...(parsed.player || {}) },
        };
      }
    } catch (e) {
      /* ignore corrupt storage */
    }
    return defaultProgress();
  }

  function save() {
    try {
      localStorage.setItem(progressStorageKey, JSON.stringify(state.progress));
    } catch (e) {
      /* storage full or unavailable */
    }
    if (state.account && state.account.user && state.account.user.mode === "supabase") scheduleCloudSync();
  }

  function loadAiSettings() {
    try {
      const raw = localStorage.getItem("ielts_ai_settings");
      if (raw) Object.assign(state.ai.settings, JSON.parse(raw));
    } catch (e) {
      /* ignore */
    }
  }

  function saveAiSettings() {
    try {
      localStorage.setItem("ielts_ai_settings", JSON.stringify(state.ai.settings));
    } catch (e) {
      /* ignore */
    }
  }

  function loadTtsSettings() {
    state.ttsCompat = localStorage.getItem("ielts_tts_compat") === "1";
  }

  function saveTtsSettings() {
    try {
      localStorage.setItem("ielts_tts_compat", state.ttsCompat ? "1" : "0");
    } catch (e) {
      /* ignore */
    }
  }

  function loadUserSettings() {
    try {
      const raw = localStorage.getItem("ielts_user_settings");
      if (raw) state.settings = { ...state.settings, ...JSON.parse(raw) };
    } catch (e) {
      /* ignore */
    }
    state.ttsCompat = Boolean(state.settings.ttsCompat);
    state.lookupEnabled = state.settings.lookupEnabled !== false;
  }

  function saveUserSettings() {
    state.settings.ttsCompat = Boolean(state.ttsCompat);
    state.settings.lookupEnabled = state.lookupEnabled;
    try {
      localStorage.setItem("ielts_user_settings", JSON.stringify(state.settings));
      localStorage.setItem("ielts_tts_compat", state.ttsCompat ? "1" : "0");
    } catch (e) {
      /* ignore */
    }
  }

  function loadAppConfig() {
    try {
      const raw = localStorage.getItem("ielts_app_config");
      if (raw) {
        const parsed = JSON.parse(raw);
        state.config = { ...state.config, ...parsed, oauth: { ...state.config.oauth, ...(parsed.oauth || {}) } };
      }
    } catch (e) {
      /* ignore */
    }
  }

  function saveAppConfig() {
    try {
      localStorage.setItem("ielts_app_config", JSON.stringify(state.config));
    } catch (e) {
      /* ignore */
    }
  }

  function isAdminEmail(email) {
    return ADMIN_EMAILS.has(String(email || "").trim().toLowerCase());
  }

  function isAdminUser(user = state.account.user) {
    return Boolean(user && isAdminEmail(user.email));
  }

  function isLikelyMobileWebView() {
    const ua = navigator.userAgent || "";
    const android = /Android/i.test(ua);
    const via = /Via/i.test(ua);
    const webview = /; wv\)/i.test(ua) || /Version\/\d+\.\d+ Chrome/i.test(ua);
    const noSpeech = !window.speechSynthesis;
    return via || (android && (webview || noSpeech));
  }

  function autoEnableCompatIfNeeded() {
    if (localStorage.getItem("ielts_tts_compat") !== null) return;
    if (isLikelyMobileWebView()) {
      state.ttsCompat = true;
      saveTtsSettings();
      window.setTimeout(() => toast("检测到手机浏览器，已自动开启兼容朗读"), 800);
      return;
    }
    window.setTimeout(() => {
      if (localStorage.getItem("ielts_tts_compat") !== null) return;
      const voices = window.speechSynthesis && window.speechSynthesis.getVoices ? window.speechSynthesis.getVoices() : [];
      if (!voices.length) {
        state.ttsCompat = true;
        saveTtsSettings();
        const btn = $("#tts-compat");
        if (btn) btn.classList.add("is-active");
      }
    }, 1600);
  }

  function loadAccountSession() {
    state.account.cloud = normalizeCloudConfig(PUBLISHED_CLOUD);
    try {
      const raw = localStorage.getItem("ielts_account_session");
      if (raw) state.account.user = JSON.parse(raw);
    } catch (e) {
      state.account.user = null;
    }
    try {
      const cloud = localStorage.getItem("ielts_supabase_settings");
      if (cloud) state.account.cloud = { ...state.account.cloud, ...normalizeCloudConfig(JSON.parse(cloud)) };
    } catch (e) {
      /* ignore */
    }
  }

  function saveAccountSession() {
    try {
      if (state.account.user) localStorage.setItem("ielts_account_session", JSON.stringify(state.account.user));
      else localStorage.removeItem("ielts_account_session");
    } catch (e) {
      /* ignore */
    }
  }

  function saveCloudSettings() {
    try {
      localStorage.setItem("ielts_supabase_settings", JSON.stringify(state.account.cloud));
    } catch (e) {
      /* ignore */
    }
  }

  function accountProgressKey(user) {
    if (!user) return STORAGE_KEY;
    if (user.mode === "supabase") return `${STORAGE_KEY}:supabase:${user.id || user.email}`;
    if (user.mode === "social") return `${STORAGE_KEY}:social:${user.provider}:${user.id}`;
    return `${STORAGE_KEY}:local:${user.email}`;
  }

  function switchAccountProgress(user, inheritGuest = false) {
    const key = accountProgressKey(user);
    if (inheritGuest && !user && state.progress) {
      localStorage.setItem(key, JSON.stringify(state.progress));
    }
    if (inheritGuest && user && !localStorage.getItem(key)) {
      localStorage.setItem(key, JSON.stringify(state.progress));
    }
    progressStorageKey = key;
    state.progress = loadProgress();
    if (user) {
      state.progress.profile = state.progress.profile || { displayName: "", email: "" };
      state.progress.profile.email = user.email || "";
      if (user.name && !state.progress.profile.displayName) state.progress.profile.displayName = user.name;
    }
    save();
  }

  function localAccounts() {
    try {
      return JSON.parse(localStorage.getItem("ielts_local_accounts") || "{}");
    } catch (e) {
      return {};
    }
  }

  function saveLocalAccounts(accounts) {
    localStorage.setItem("ielts_local_accounts", JSON.stringify(accounts));
  }

  function randomSalt() {
    const bytes = new Uint8Array(16);
    if (window.crypto && window.crypto.getRandomValues) window.crypto.getRandomValues(bytes);
    else for (let i = 0; i < bytes.length; i += 1) bytes[i] = Math.floor(Math.random() * 256);
    return Array.from(bytes).map((b) => b.toString(16).padStart(2, "0")).join("");
  }

  async function hashPassword(password, salt) {
    const text = `${salt}:${password}`;
    if (window.crypto && window.crypto.subtle && window.TextEncoder) {
      const data = new TextEncoder().encode(text);
      const digest = await window.crypto.subtle.digest("SHA-256", data);
      return Array.from(new Uint8Array(digest)).map((b) => b.toString(16).padStart(2, "0")).join("");
    }
    let hash = 2166136261;
    for (let i = 0; i < text.length; i += 1) {
      hash ^= text.charCodeAt(i);
      hash = Math.imul(hash, 16777619);
    }
    return `fallback-${(hash >>> 0).toString(16)}`;
  }

  async function registerLocal(email, password, name) {
    const accounts = localAccounts();
    if (accounts[email]) {
      toast("该邮箱已经注册，请直接登录");
      return false;
    }
    const salt = randomSalt();
    accounts[email] = { email, name: name || email.split("@")[0], salt, hash: await hashPassword(password, salt), createdAt: new Date().toISOString() };
    saveLocalAccounts(accounts);
    state.account.user = { mode: "local", email, name: accounts[email].name };
    state.account.mode = "local";
    saveAccountSession();
    switchAccountProgress(state.account.user, true);
    render();
    toast("注册成功，学习记录已绑定到本机账户");
    return true;
  }

  async function loginLocal(email, password) {
    const account = localAccounts()[email];
    if (!account) {
      toast("没有找到这个本地账户，请先注册");
      return false;
    }
    const hash = await hashPassword(password, account.salt);
    if (hash !== account.hash) {
      toast("密码不正确");
      return false;
    }
    state.account.user = { mode: "local", email, name: account.name || email.split("@")[0] };
    state.account.mode = "local";
    saveAccountSession();
    switchAccountProgress(state.account.user);
    render();
    toast("登录成功");
    return true;
  }

  function logoutAccount() {
    save();
    state.account.user = null;
    state.account.mode = "guest";
    state.account.formMode = "login";
    saveAccountSession();
    switchAccountProgress(null);
    render();
    toast("已退出登录，当前使用访客进度");
  }

  function socialCallbackUrl(provider) {
    const url = new URL(location.href);
    url.search = "";
    url.hash = "";
    url.searchParams.set("oauth_provider", provider);
    return url.toString();
  }

  function startSocialLogin(provider) {
    const config = state.config.oauth || {};
    const appId = provider === "wechat" ? config.wechatAppId : config.qqAppId;
    if (!appId) {
      toast(provider === "wechat" ? "管理员尚未配置微信 AppID" : "管理员尚未配置 QQ AppID");
      return;
    }
    const redirect = socialCallbackUrl(provider);
    const stateToken = randomSalt().slice(0, 16);
    sessionStorage.setItem("ielts_oauth_state", stateToken);
    const url = provider === "wechat"
      ? `https://open.weixin.qq.com/connect/qrconnect?appid=${encodeURIComponent(appId)}&redirect_uri=${encodeURIComponent(redirect)}&response_type=code&scope=snsapi_login&state=${stateToken}#wechat_redirect`
      : `https://graph.qq.com/oauth2.0/authorize?response_type=code&client_id=${encodeURIComponent(appId)}&redirect_uri=${encodeURIComponent(redirect)}&state=${stateToken}`;
    location.href = url;
  }

  async function handleSocialCallback(provider, code) {
    const config = state.config.oauth || {};
    if (!config.workerUrl) {
      toast("社交登录回调服务尚未配置");
      return;
    }
    const redirect = socialCallbackUrl(provider);
    const url = `${config.workerUrl.replace(/\/$/, "")}/oauth/${encodeURIComponent(provider)}?code=${encodeURIComponent(code)}&redirect_uri=${encodeURIComponent(redirect)}`;
    const res = await fetch(url);
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "社交登录失败");
    const id = data.openid || data.id || data.user_id;
    const user = {
      mode: "social",
      provider,
      id,
      email: data.email || `${provider}_${id}@social.local`,
      name: data.nickname || data.name || (provider === "wechat" ? "微信用户" : "QQ 用户"),
      avatar: data.avatar || "",
    };
    state.account.user = user;
    state.account.mode = "social";
    saveAccountSession();
    switchAccountProgress(user, true);
    render();
    toast(provider === "wechat" ? "微信登录成功" : "QQ 登录成功");
  }

  function handleOAuthRedirect() {
    const params = new URLSearchParams(location.search);
    const provider = params.get("oauth_provider");
    const code = params.get("code");
    if (!provider || !code) return;
    history.replaceState({}, "", location.pathname);
    handleSocialCallback(provider, code).catch((e) => toast(e.message || "社交登录失败"));
  }

  async function supabaseSignUp(email, password) {
    const { url, anonKey } = state.account.cloud;
    if (!url || !anonKey) throw new Error("请先填写 Supabase URL 和 Anon Key");
    const res = await fetch(`${url.replace(/\/$/, "")}/auth/v1/signup`, {
      method: "POST",
      headers: { "Content-Type": "application/json", apikey: anonKey },
      body: JSON.stringify({ email, password }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.msg || data.error_description || "注册失败");
    if (!data.access_token) {
      toast("注册成功，请到邮箱确认后再登录");
      return false;
    }
    state.account.user = { mode: "supabase", id: data.user && data.user.id, email, name: email.split("@")[0], accessToken: data.access_token, refreshToken: data.refresh_token };
    state.account.mode = "supabase";
    saveAccountSession();
    switchAccountProgress(state.account.user, true);
    render();
    toast("云端账户注册成功");
    return true;
  }

  async function supabaseSignIn(email, password) {
    const { url, anonKey } = state.account.cloud;
    if (!url || !anonKey) throw new Error("请先填写 Supabase URL 和 Anon Key");
    const res = await fetch(`${url.replace(/\/$/, "")}/auth/v1/token?grant_type=password`, {
      method: "POST",
      headers: { "Content-Type": "application/json", apikey: anonKey },
      body: JSON.stringify({ email, password }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.msg || data.error_description || "登录失败");
    state.account.user = { mode: "supabase", id: data.user && data.user.id, email, name: (data.user && data.user.user_metadata && data.user.user_metadata.name) || email.split("@")[0], accessToken: data.access_token, refreshToken: data.refresh_token };
    state.account.mode = "supabase";
    saveAccountSession();
    switchAccountProgress(state.account.user);
    await loadProgressFromCloud();
    render();
    toast("云端账号登录成功");
    return true;
  }

  async function supabaseUser() {
    const user = state.account.user;
    if (!user || user.mode !== "supabase" || !user.accessToken) throw new Error("请先登录云端账户");
    const { url, anonKey } = state.account.cloud;
    const res = await fetch(`${url.replace(/\/$/, "")}/auth/v1/user`, {
      headers: { apikey: anonKey, Authorization: `Bearer ${user.accessToken}` },
    });
    if (!res.ok) throw new Error("云端账号状态已失效，请重新登录");
    return res.json();
  }

  async function syncProgressToCloud(silent = false) {
    try {
      const cloudUser = await supabaseUser();
      const { url, anonKey } = state.account.cloud;
      const data = { ...(cloudUser.user_metadata || {}), ielts_passport_progress: state.progress };
      const res = await fetch(`${url.replace(/\/$/, "")}/auth/v1/user`, {
        method: "PUT",
        headers: { "Content-Type": "application/json", apikey: anonKey, Authorization: `Bearer ${state.account.user.accessToken}` },
        body: JSON.stringify({ data }),
      });
      if (!res.ok) throw new Error("同步失败");
      state.account.syncStatus = "synced";
      if (!silent) toast("学习进度已同步到云端");
      render();
    } catch (e) {
      state.account.syncStatus = "error";
      if (!silent) toast(e.message);
    }
  }

  async function loadProgressFromCloud() {
    try {
      const cloudUser = await supabaseUser();
      const progress = cloudUser.user_metadata && cloudUser.user_metadata.ielts_passport_progress;
      if (progress) {
        state.progress = { ...defaultProgress(), ...progress };
        save();
        if (state.view === "account") render();
      }
    } catch (e) {
      /* cloud progress is optional */
    }
  }

  let cloudSyncTimer = null;
  function scheduleCloudSync() {
    if (!state.account.user || state.account.user.mode !== "supabase") return;
    window.clearTimeout(cloudSyncTimer);
    cloudSyncTimer = window.setTimeout(() => syncProgressToCloud(true), 1800);
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
    const effectiveLevel = level === "A0" ? "A1" : level;
    if (levels[effectiveLevel] && levels[effectiveLevel].length) return levels[effectiveLevel];
    return BANK.learn && BANK.learn.vocab ? BANK.learn.vocab : [];
  }

  function resetVocabDeck() {
    const vocab = getLevelVocab(state.vocabLevel);
    const start = Math.max(0, (state.vocabUnit - 1) * 20);
    const unitIndices = [...Array(Math.min(20, Math.max(0, vocab.length - start))).keys()].map((i) => start + i);
    state.vocabDeck = shuffle(unitIndices);
    state.vocabIndex = 0;
    state.vocabDeckKey = `${state.vocabLevel}:${state.vocabUnit}`;
  }

  let activeAudio = null;
  let activeUtterance = null;
  const audioCache = new Map();
  let ttsQueue = [];
  let ttsOnEnd = null;

  function wordAudioUrl(word) {
    return `https://dict.youdao.com/dictvoice?audio=${encodeURIComponent(word)}&type=2`;
  }

  function preloadWord(word) {
    const value = String(word || "").trim();
    const key = value.toLowerCase();
    if (!key) return null;
    if (audioCache.has(key)) return audioCache.get(key);
    const audio = new Audio(wordAudioUrl(value));
    const entry = { audio, ready: false, error: false };
    audio.preload = "auto";
    audio.volume = 1;
    audio.addEventListener("loadeddata", () => { entry.ready = true; });
    audio.addEventListener("canplaythrough", () => { entry.ready = true; });
    audio.addEventListener("error", () => { entry.error = true; });
    audio.load();
    audioCache.set(key, entry);
    return entry;
  }

  function prefetchWords(words) {
    const seen = new Set();
    (words || []).forEach((word) => {
      const value = String(word || "").trim();
      const key = value.toLowerCase();
      if (!value || seen.has(key)) return;
      seen.add(key);
      preloadWord(value);
    });
  }

  function stopSpeechAudio() {
    if (window.speechSynthesis) window.speechSynthesis.cancel();
    ttsQueue = [];
    ttsOnEnd = null;
    compatQueue = [];
    compatOnEnd = null;
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

  function splitTtsChunks(text) {
    const value = String(text || "").replace(/\s+/g, " ").trim();
    if (!value) return [];
    const sentences = value.match(/[^.!?]+[.!?]?/g) || [value];
    const chunks = [];
    let current = "";
    sentences.forEach((sentence) => {
      const part = sentence.trim();
      if (!part) return;
      if (current && current.length + part.length > 220) {
        chunks.push(current);
        current = part;
      } else {
        current = current ? `${current} ${part}` : part;
      }
    });
    if (current) chunks.push(current);
    return chunks;
  }

  let compatQueue = [];
  let compatOnEnd = null;
  let compatAudioBound = false;

  function bindCompatAudio() {
    const audio = $("#compat-audio");
    if (!audio || compatAudioBound) return;
    compatAudioBound = true;
    audio.addEventListener("ended", () => playCompatNext());
    audio.addEventListener("error", () => playCompatNext());
    audio.addEventListener("play", () => {
      const label = $("#compat-audio-label");
      if (label) label.textContent = "正在播放";
    });
  }

  function showCompatBar() {
    const bar = $("#compat-audio-bar");
    if (bar) bar.hidden = false;
    bindCompatAudio();
  }

  function playCompatNext() {
    const audio = $("#compat-audio");
    if (!audio) return;
    if (!compatQueue.length) {
      const callback = compatOnEnd;
      compatOnEnd = null;
      const label = $("#compat-audio-label");
      if (label) label.textContent = "播放完成";
      if (callback) callback();
      return;
    }
    const item = compatQueue.shift();
    showCompatBar();
    activeAudio = audio;
    audio.src = item.url;
    const label = $("#compat-audio-label");
    if (label) label.textContent = item.label || "正在播放";
    const open = $("#compat-audio-open");
    if (open) open.href = item.url;
    audio.load();
    const promise = audio.play();
    if (promise && promise.catch) promise.catch(() => {
      if (label) label.textContent = "浏览器拦截了自动播放，请点播放键";
    });
  }

  function playCompatibleUrl(url, label, onEnd = null) {
    stopSpeechAudio();
    compatQueue = [{ url, label: label || "正在播放" }];
    compatOnEnd = typeof onEnd === "function" ? onEnd : null;
    playCompatNext();
  }

  function playCompatibleTts(text, onEnd = null) {
    const chunks = splitTtsChunks(text);
    if (!chunks.length) return;
    stopSpeechAudio();
    compatQueue = chunks.map((chunk) => ({
      url: `https://fanyi.baidu.com/gettts?lan=en&text=${encodeURIComponent(chunk)}&spd=3&source=web`,
      label: "正在朗读英语",
    }));
    compatOnEnd = typeof onEnd === "function" ? onEnd : null;
    playCompatNext();
  }

  function speakText(text, rate = 0.82, onEnd = null) {
    const value = String(text || "").trim();
    if (!value || !state.settings.voiceEnabled) return;
    const preferredRate = Number(state.settings.rate) || rate;
    stopSpeechAudio();
    if (state.ttsCompat || !window.speechSynthesis || !window.SpeechSynthesisUtterance) {
      playCompatibleTts(value, onEnd);
      return;
    }
    const utter = new SpeechSynthesisUtterance(value);
    activeUtterance = utter;
    let started = false;
    let fallbackTimer = null;
    const fallback = () => {
      if (started) return;
      started = true;
      if (fallbackTimer) window.clearTimeout(fallbackTimer);
      try { window.speechSynthesis.cancel(); } catch (e) { /* ignore */ }
      activeUtterance = null;
      playCompatibleTts(value, onEnd);
    };
    utter.onstart = () => { started = true; if (fallbackTimer) window.clearTimeout(fallbackTimer); };
    utter.onerror = fallback;
    if (typeof onEnd === "function") utter.onend = onEnd;
    utter.lang = "en-US";
    utter.rate = preferredRate;
    utter.volume = 1;
    const voices = window.speechSynthesis.getVoices ? window.speechSynthesis.getVoices() : [];
    const preferred = (state.settings.voiceURI && voices.find((v) => v.voiceURI === state.settings.voiceURI)) || voices.find((v) => /en-US/i.test(v.lang)) || voices.find((v) => /^en/i.test(v.lang));
    if (preferred) utter.voice = preferred;
    try {
      window.speechSynthesis.resume();
      window.speechSynthesis.speak(utter);
    } catch (e) {
      fallback();
    }
    fallbackTimer = window.setTimeout(() => { if (!started) fallback(); }, 750);
  }

  function speakWord(word, trigger) {
    const value = String(word || "").trim();
    if (!value || !state.settings.voiceEnabled) return;
    stopSpeechAudio();
    if (trigger) trigger.classList.add("is-speaking");
    const unmark = () => {
      if (trigger) trigger.classList.remove("is-speaking");
    };
    if (state.ttsCompat) {
      playCompatibleUrl(wordAudioUrl(value), `单词：${value}`, unmark);
      return;
    }
    let usedFallback = false;
    const fallback = () => {
      if (usedFallback) return;
      usedFallback = true;
      unmark();
      speakText(value, 0.78);
    };

    const entry = preloadWord(value);
    const audio = entry.audio;
    activeAudio = audio;
    audio.addEventListener("ended", () => {
      unmark();
      if (activeAudio === audio) activeAudio = null;
    }, { once: true });
    audio.addEventListener("error", fallback, { once: true });

    const playAudio = () => {
      try {
        audio.currentTime = 0;
        const playPromise = audio.play();
        if (playPromise && playPromise.catch) playPromise.catch(fallback);
      } catch (e) {
        fallback();
      }
    };

    if (audio.readyState >= 3 || entry.ready) {
      playAudio();
      return;
    }

    let started = false;
    const onReady = () => {
    if (started) return;
      started = true;
      playAudio();
    };
    audio.addEventListener("loadeddata", onReady, { once: true });
    audio.addEventListener("canplaythrough", onReady, { once: true });
    window.setTimeout(() => {
      if (!started) {
        started = true;
        fallback();
      }
    }, 550);
  }

  function playEncouragement() {
    if (!state.settings.voiceEnabled || !state.settings.autoEncourage) return;
    const phrases = [
      "Great job. Keep going!",
      "Nice work. You are improving every day.",
      "Well done. Let's learn the next unit.",
      "You did it. Keep up the good work.",
      "Excellent progress. Stay consistent!",
    ];
    const phrase = phrases[Math.floor(Math.random() * phrases.length)];
    toast(phrase);
    speakText(phrase, 0.84);
  }

  function levelOrder(level) {
    return { A0: 0, A1: 1, A2: 2, B1: 3, B2: 4, C1: 5, IELTS: 6 }[level] || 99;
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

  function cleanLookupWord(value) {
    return String(value || "").toLowerCase().replace(/^[^a-z]+|[^a-z'-]+$/g, "").trim();
  }

  function ensureDictionary(word) {
    const value = String(word || "").trim().toLowerCase();
    const first = value[0] || "";
    const shard = /^[a-z]$/.test(first) ? first : "other";
    if (BANK.dictionary && BANK.dictionary[value]) return Promise.resolve(BANK.dictionary);
    if (dictionaryShardPromises.has(shard)) return dictionaryShardPromises.get(shard);
    const promise = new Promise((resolve, reject) => {
      const script = document.createElement("script");
      script.src = `data/dict/${shard}.js`;
      script.onload = () => resolve(BANK.dictionary || {});
      script.onerror = () => reject(new Error("dictionary load failed"));
      document.head.appendChild(script);
    });
    dictionaryShardPromises.set(shard, promise);
    return promise;
  }

  async function onlineTranslate(word) {
    const controller = new AbortController();
    const timer = window.setTimeout(() => controller.abort(), 5000);
    try {
      const youdao = `https://aidemo.youdao.com/trans?q=${encodeURIComponent(word)}&from=en&to=zh-CHS`;
      const res = await fetch(youdao, { signal: controller.signal });
      if (res.ok) {
        const data = await res.json();
        const text = Array.isArray(data.translation) ? data.translation[0] : data.translation;
        if (text) return text;
      }
    } catch (e) {
      /* try the next provider */
    } finally {
      window.clearTimeout(timer);
    }
    const fallbackController = new AbortController();
    const fallbackTimer = window.setTimeout(() => fallbackController.abort(), 5000);
    try {
      const url = `https://api.mymemory.translated.net/get?q=${encodeURIComponent(word)}&langpair=en|zh-CN`;
      const res = await fetch(url, { signal: fallbackController.signal });
      if (!res.ok) throw new Error("online translation failed");
      const data = await res.json();
      return (data && data.responseData && data.responseData.translatedText) || "";
    } finally {
      window.clearTimeout(fallbackTimer);
    }
  }

  async function lookupWord(word) {
    const value = cleanLookupWord(word);
    if (!value) return null;
    let dictionary = {};
    try {
      dictionary = await ensureDictionary(value);
    } catch (e) {
      dictionary = {};
    }
    const entry = dictionary[value];
    if (entry) {
      return { word: value, phonetic: entry[0] || "", zh: entry[1] || "", en: entry[2] || "", pos: entry[3] || "", source: "本地词典" };
    }
    try {
      const zh = await onlineTranslate(value);
      return { word: value, phonetic: "", zh: zh || "暂无翻译", en: "", pos: "", source: "在线翻译" };
    } catch (e) {
      return { word: value, phonetic: "", zh: "暂时查不到这个词，请检查网络后重试。", en: "", pos: "", source: "查询失败" };
    }
  }

  function wordify(text) {
    return String(text || "")
      .split(/([A-Za-z][A-Za-z'-]*)/)
      .map((part) => {
        if (/^[A-Za-z][A-Za-z'-]*$/.test(part) && part.length > 1) {
          return `<span class="lookup-word" data-action="lookup-word" data-word="${esc(part)}">${esc(part)}</span>`;
        }
        return esc(part);
      })
      .join("");
  }

  function hideWordPopover() {
    const pop = $("#word-popover");
    if (pop) pop.hidden = true;
    currentPopoverAnchor = null;
    popoverToken += 1;
  }

  function positionWordPopover(anchor) {
    const pop = $("#word-popover");
    if (!pop || !anchor) return;
    pop.hidden = false;
    if (window.innerWidth <= 640) {
      pop.style.left = "12px";
      pop.style.right = "12px";
      pop.style.top = "auto";
      pop.style.bottom = "12px";
      return;
    }
    const rect = anchor.getBoundingClientRect();
    const width = pop.offsetWidth || 330;
    const height = pop.offsetHeight || 210;
    let left = Math.min(window.innerWidth - width - 14, Math.max(14, rect.left));
    let top = rect.bottom + 10;
    if (top + height > window.innerHeight - 14) top = Math.max(14, rect.top - height - 10);
    pop.style.left = `${left}px`;
    pop.style.top = `${top}px`;
    pop.style.right = "auto";
    pop.style.bottom = "auto";
  }

  function renderPopover(result) {
    $("#pop-word").textContent = result.word;
    $("#pop-phonetic").textContent = result.phonetic || "";
    $("#pop-source").textContent = result.source;
    const pos = result.pos ? `<span class="tag gold">${esc(result.pos)}</span>` : "";
    const zh = result.zh ? `<div class="pop-translation">${esc(result.zh)}</div>` : "";
    const en = result.en ? `<div class="pop-definition"><strong>English:</strong> ${wordify(result.en)}</div>` : "";
    $("#pop-body").innerHTML = `${pos}${zh}${en}`;
    refreshIcons();
  }

  async function showWordPopover(word, anchor) {
    const value = cleanLookupWord(word);
    if (!value) return;
    const pop = $("#word-popover");
    currentPopoverWord = value;
    currentPopoverAnchor = anchor;
    const token = ++popoverToken;
    $("#pop-word").textContent = value;
    $("#pop-phonetic").textContent = "";
    $("#pop-source").textContent = "";
    $("#pop-body").innerHTML = `<div class="pop-loading"><span></span>正在查词…</div>`;
    positionWordPopover(anchor);
    const result = await lookupWord(value);
    if (token !== popoverToken || !result) return;
    renderPopover(result);
    positionWordPopover(currentPopoverAnchor || anchor);
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

  function ensureToday() {
    const key = todayKey();
    if (state.progress.daily.date !== key) {
      state.progress.daily = { date: key, words: 0, questions: 0, minutes: 0, tests: 0, lastMilestone: 0, wordsSeen: [] };
      save();
    }
    return state.progress.daily;
  }

  function playerLevelFromXp(xp) {
    const thresholds = [0, 80, 200, 380, 620, 920, 1280, 1700, 2200];
    let level = 1;
    thresholds.forEach((threshold, i) => {
      if (xp >= threshold) level = i + 1;
    });
    return level;
  }

  function xpForLevel(level) {
    return [0, 80, 200, 380, 620, 920, 1280, 1700, 2200][Math.max(0, Math.min(8, level - 1))] || 2200;
  }

  function levelBandLabel(level) {
    return {
      1: "Lv1 零基础 · A0–A1",
      2: "Lv2 入门 · Band 3.0–3.5",
      3: "Lv3 基础 · Band 4.0–4.5",
      4: "Lv4 进阶 · Band 5.0–5.5",
      5: "Lv5 中级 · Band 5.5–6.0",
      6: "Lv6 稳过 · Band 6.0–6.5",
      7: "Lv7 熟练 · Band 7.0–7.5",
      8: "Lv8 高分 · Band 8.0",
      9: "Lv9 大师 · Band 8.5+",
    }[level] || "入门 · Band 3.0–3.5";
  }

  function addXp(amount) {
    const player = state.progress.player;
    player.xp = Math.max(0, (player.xp || 0) + Number(amount || 0));
    player.level = playerLevelFromXp(player.xp);
  }

  function estimateBand() {
    const stats = state.progress.stats;
    const attempted = Object.values(stats).reduce((n, s) => n + (s.attempted || 0), 0);
    const correct = Object.values(stats).reduce((n, s) => n + (s.correct || 0), 0);
    const accuracy = attempted ? correct / attempted : 0;
    const volume = Math.min(1, attempted / 300);
    const raw = 3.0 + accuracy * 4.5 + volume * 0.8;
    const rounded = Math.round(raw * 2) / 2;
    return Math.max(3.0, Math.min(8.5, rounded));
  }

  function mockBandFromScore(score, level) {
    const base = level === "A0" || level === "A1" || level === "A2" ? 3.0 : level === "B1" || level === "B2" ? 4.0 : 4.5;
    const span = level === "A0" || level === "A1" || level === "A2" ? 3.5 : level === "B1" || level === "B2" ? 4.0 : 4.5;
    return Math.max(3.0, Math.min(9.0, Math.round((base + (score / 100) * span) * 2) / 2));
  }

  function recordDailyWords(count) {
    const daily = ensureToday();
    daily.words += Number(count || 0);
    addXp(5 * Number(count || 0));
    if (daily.words >= 10 && daily.lastMilestone < 10) {
      daily.lastMilestone = 10;
      toast("今天已经学习 10 个单词，继续保持！");
    }
    if (daily.words >= 20 && daily.lastMilestone < 20) {
      daily.lastMilestone = 20;
      toast("今日 20 词目标完成！");
    }
    save();
  }

  function recordDailyQuestions(count) {
    const daily = ensureToday();
    daily.questions += Number(count || 0);
    addXp(3 * Number(count || 0));
    save();
  }

  function recordDailyTest() {
    const daily = ensureToday();
    daily.tests += 1;
    addXp(25);
    save();
  }

  function touchToday() {
    ensureToday();
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
    if (state.config.requireLogin && !state.account.user && !["account", "about"].includes(view)) {
      state.view = "account";
      state.param = null;
      toast("请先登录后使用");
      render();
      return;
    }
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
    if (state.config.requireLogin && !state.account.user && !["account", "about"].includes(state.view)) {
      state.view = "account";
    }
    titleEl.textContent = VIEW_TITLES[state.view] || "今日学习";
    $$(".nav-item").forEach((btn) => {
      const activeView = btn.dataset.view === state.view;
      const activeByParam = state.view === "lesson" && btn.dataset.view === "path";
      const activePractice = ["reading", "listening", "writing", "quiz"].includes(state.view) && btn.dataset.view === "practice";
      const gated = state.config.requireLogin && !state.account.user && btn.dataset.view !== "account";
      btn.classList.toggle("is-active", activeView || activeByParam || activePractice);
      btn.classList.toggle("is-locked", gated);
    });
    $$(".mobile-bottom-nav button").forEach((btn) => {
      const view = btn.dataset.view;
      const activePractice = ["reading", "listening", "writing", "quiz"].includes(state.view) && view === "practice";
      const activeMine = ["account", "settings"].includes(state.view) && view === "account";
      const activeReview = ["review", "session"].includes(state.view) && view === "review";
      btn.classList.toggle("is-active", state.view === view || activePractice || activeMine || activeReview);
      const gated = state.config.requireLogin && !state.account.user && view !== "account";
      btn.classList.toggle("is-locked", gated);
    });

    let html = "";
    switch (state.view) {
      case "home": html = renderHome(); break;
      case "path": html = renderPath(); break;
      case "lesson": html = renderLesson(state.param); break;
      case "library": html = renderLibrary(); break;
      case "practice": html = renderPractice(); break;
      case "challenges": html = renderChallenges(); break;
      case "exam": html = renderExam(); break;
      case "videos": html = renderVideos(); break;
      case "ai": html = renderAiChat(); break;
      case "account": html = renderAccount(); break;
      case "settings": html = renderSettings(); break;
      case "review": html = renderReview(); break;
      case "session": html = renderSession(); break;
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
    if (state.view === "ai") window.requestAnimationFrame(scrollAiMessages);
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
    const daily = ensureToday();
    const dailyGoal = 20;
    const dailyPct = Math.min(100, Math.round((daily.words / dailyGoal) * 100));
    const player = state.progress.player;
    player.estimatedBand = estimateBand();
    const currentLevelXp = xpForLevel(player.level);
    const nextLevelXp = xpForLevel(player.level + 1);
    const levelPct = nextLevelXp === currentLevelXp ? 100 : Math.min(100, Math.round(((player.xp - currentLevelXp) / (nextLevelXp - currentLevelXp)) * 100));
    const target = state.progress.target;

    const tasks = [
      { view: "vocab", icon: "notebook-tabs", color: "gold", title: "背 20 个分级词", desc: `今天已学 ${daily.words} 个 · 约 8 分钟` },
      { view: "practice", icon: "book-open-check", color: "red", title: "做一套分级练习", desc: "按你的当前阶段选择题目" },
      { view: "challenges", icon: "trophy", color: "teal", title: "完成一个题型挑战", desc: "单词、听力、阅读或混合挑战" },
      { view: "exam", icon: "clipboard-check", color: "gold", title: "参加一次模拟考试", desc: "自动换算雅思预测分" },
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
        <span class="eyebrow">Lv.${player.level} · 预测 Band ${player.estimatedBand.toFixed(1)} · TARGET ${target.toFixed(1)}</span>
        <h2>今天，为你的雅思上岸前进一小步。</h2>
        <p>今天已经学习 ${daily.words} 个单词、完成 ${daily.questions} 道题。先补基础词汇和语法，再用分级题库和模拟考试提升分数。</p>
        <div class="hero-actions">
          <button class="btn" data-action="go" data-view="exam"><i data-lucide="clipboard-check"></i>模拟考试</button>
          <button class="btn ghost-on-dark" data-action="go" data-view="challenges" style="background:transparent;color:#fff;border-color:rgba(255,255,255,.45)"><i data-lucide="trophy"></i>题型挑战</button>
        </div>
      </div>

      <div class="stat-grid">
        <div class="stat-card reveal"><div class="stat-top"><span>今日单词</span><i data-lucide="notebook-tabs"></i></div><strong>${daily.words}</strong><div class="stat-note">目标 ${dailyGoal} 词 · ${dailyPct}%</div></div>
        <div class="stat-card reveal"><div class="stat-top"><span>累计做题</span><i data-lucide="list-checks"></i></div><strong>${totalAttempted}</strong><div class="stat-note">道题</div></div>
        <div class="stat-card reveal"><div class="stat-top"><span>正确率</span><i data-lucide="target"></i></div><strong>${accuracy}%</strong><div class="stat-note">${totalCorrect} / ${totalAttempted}</div></div>
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
          <h3>玩家等级与四科进度</h3>
          <div class="player-line">
            <div class="player-level">Lv.${player.level}</div>
            <div class="player-copy"><strong>${levelBandLabel(player.level)}</strong><span>XP ${player.xp} / ${nextLevelXp === currentLevelXp ? "MAX" : nextLevelXp}</span></div>
          </div>
          <div class="bar gold" style="margin-bottom:16px"><span style="width:${levelPct}%"></span></div>
          ${skillRows}
          <div style="margin-top:18px;padding-top:14px;border-top:1px solid var(--line)">
            <div class="progress-label"><span>目标分数</span><span style="color:var(--red-deep)">Band ${target.toFixed(1)}</span></div>
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
    const levels = ["A0", "A1", "A2", "B1", "B2", "C1", "IELTS", "ALL"];
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
    const sourceLevel = level === "A0" ? "A1" : level;
    const staged = BANK.staged || {};
    let list = [];
    if (skill === "reading") list = withLevel(BANK.reading, "IELTS").concat(withLevel(staged.reading, "A1"));
    if (skill === "listening") list = withLevel(BANK.listening, "IELTS").concat(withLevel(staged.listening, "A1"));
    if (skill === "writing") list = withLevel(BANK.writing, "IELTS").concat(withLevel(staged.writing, "A1"));
    if (skill === "vocab") list = (BANK.vocabQuiz || []).map((t) => ({ ...t, level: t.level || "A1" }));
    if (level === "ALL") return list.sort((a, b) => levelOrder(a.level) - levelOrder(b.level));
    return list.filter((item) => item.level === sourceLevel);
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

  const SESSION_TYPES = new Set(["multiple-choice", "true-false", "yes-no", "short-answer"]);

  function collectSessionQuestions(test, skill, level) {
    const out = [];
    if (!test) return out;
    if (Array.isArray(test.questions)) {
      test.questions.forEach((q) => {
        if (SESSION_TYPES.has(q.type)) out.push({ ...q, skill, level: test.level || level, context: "" });
      });
    }
    (test.passages || []).forEach((p) => {
      (p.groups || []).forEach((g) => {
        (g.questions || []).forEach((q) => {
          if (SESSION_TYPES.has(q.type)) out.push({ ...q, skill: skill || "reading", level: test.level || level, context: p.content || "" });
        });
      });
    });
    (test.sections || []).forEach((s) => {
      (s.groups || []).forEach((g) => {
        (g.questions || []).forEach((q) => {
          if (SESSION_TYPES.has(q.type)) out.push({ ...q, skill: skill || "listening", level: test.level || level, context: s.transcript || "" });
        });
      });
    });
    return out;
  }

  function getLevelQuestionPool(level, skill) {
    const staged = BANK.staged || {};
    const effectiveLevel = level === "A0" ? "A1" : level;
    if (skill === "vocab") {
      const quizLevel = effectiveLevel === "IELTS" ? "C1" : effectiveLevel;
      return (BANK.vocabQuiz || [])
        .filter((t) => t.level === quizLevel)
        .flatMap((t) => collectSessionQuestions(t, "vocab", level));
    }
    if (skill === "grammar") {
      return (BANK.grammar || []).filter((q) => q.level === effectiveLevel).map((q) => ({ ...q, skill: "grammar", level: effectiveLevel, context: "" }));
    }
    if (skill === "reading") {
      const list = effectiveLevel === "IELTS"
        ? withLevel(BANK.reading, "IELTS")
        : withLevel((staged.reading || []).filter((t) => t.level === effectiveLevel), effectiveLevel);
      return list.flatMap((t) => collectSessionQuestions(t, "reading", level));
    }
    if (skill === "listening") {
      const list = effectiveLevel === "IELTS"
        ? withLevel(BANK.listening, "IELTS")
        : withLevel((staged.listening || []).filter((t) => t.level === effectiveLevel), effectiveLevel);
      return list.flatMap((t) => collectSessionQuestions(t, "listening", level));
    }
    return [];
  }

  function buildChallengeQuestions(type, level) {
    let pool = [];
    if (type === "vocab") pool = getLevelQuestionPool(level, "vocab");
    if (type === "reading") pool = getLevelQuestionPool(level, "reading");
    if (type === "listening") pool = getLevelQuestionPool(level, "listening");
    if (type === "grammar") pool = getLevelQuestionPool(level, "grammar");
    if (type === "mixed") pool = getLevelQuestionPool(level, "vocab").concat(getLevelQuestionPool(level, "reading"), getLevelQuestionPool(level, "listening"), getLevelQuestionPool(level, "grammar"));
    return shuffle(pool).slice(0, type === "vocab" ? 20 : 10);
  }

  function buildMockQuestions(level) {
    const vocabLevel = level === "IELTS" ? "IELTS" : level;
    const vocabPool = shuffle(getLevelQuestionPool(vocabLevel, "vocab"));
    const reading = shuffle(getLevelQuestionPool(level, "reading")).slice(0, 8);
    const listening = shuffle(getLevelQuestionPool(level, "listening")).slice(0, 8);
    const grammar = shuffle(getLevelQuestionPool(level, "grammar")).slice(0, 6);
    const remaining = Math.max(0, 30 - reading.length - listening.length - grammar.length);
    const vocab = vocabPool.slice(0, remaining);
    return shuffle(vocab.concat(reading, listening, grammar)).slice(0, 30);
  }

  function stopSessionTimer() {
    if (state.session && state.session.timerId) {
      clearInterval(state.session.timerId);
      state.session.timerId = null;
    }
  }

  function formatClock(seconds) {
    const safe = Math.max(0, Number(seconds || 0));
    return `${String(Math.floor(safe / 60)).padStart(2, "0")}:${String(safe % 60).padStart(2, "0")}`;
  }

  function startSessionTimer() {
    stopSessionTimer();
    if (!state.session || state.session.result) return;
    state.session.timerId = setInterval(() => {
      if (!state.session || state.session.result) return;
      state.session.remaining -= 1;
      const el = $("#session-timer");
      if (el) el.textContent = formatClock(state.session.remaining);
      if (state.session.remaining <= 0) submitSession();
    }, 1000);
  }

  function startSession(kind, type, level) {
    const questions = kind === "mock" ? buildMockQuestions(level) : buildChallengeQuestions(type, level);
    if (!questions.length) {
      toast("这个阶段暂时没有足够的自动判分题");
      return;
    }
    state.answerMap = {};
    state.currentTest = null;
    state.session = {
      kind,
      type,
      level,
      questions,
      remaining: kind === "mock" ? 35 * 60 : 10 * 60,
      result: null,
      timerId: null,
    };
    setView("session");
    startSessionTimer();
  }

  function startReviewSession() {
    const wrong = (state.progress.wrongAnswers || []).slice(-40);
    if (!wrong.length) {
      toast("暂时没有错题");
      return;
    }
    const questions = wrong.map((item) => ({
      type: item.type === "choice" ? "multiple-choice" : "short-answer",
      text: item.question || "复习题",
      answer: item.answer || "",
      options: item.options || [],
      accepted: item.accepted || [],
      explain: item.explanation || "",
      context: item.context || "",
      skill: item.skill || "vocab",
      level: "REVIEW",
    }));
    state.answerMap = {};
    state.currentTest = null;
    state.session = { kind: "review", type: "mixed", level: "REVIEW", questions, remaining: 15 * 60, result: null, timerId: null };
    setView("session");
    startSessionTimer();
  }

  function submitSession() {
    const session = state.session;
    if (!session || session.result) return;
    stopSessionTimer();
    const statSkill = session.type === "listening" ? "listening" : session.type === "reading" ? "reading" : "vocab";
    state.currentTest = { skill: session.kind, id: `${session.kind}:${session.type}:${session.level}`, checked: false, statSkill };
    const result = checkAnswers();
    if (!result) return;
    const band = session.kind === "mock" ? mockBandFromScore(result.score, session.level) : 0;
    const xp = result.correct * 10 + 15;
    if (session.kind === "mock") {
      state.progress.player.bestBand = Math.max(state.progress.player.bestBand || 0, band);
      state.progress.player.mockScores = (state.progress.player.mockScores || []).concat({ level: session.level, score: result.score, band, date: todayKey() }).slice(-20);
      state.progress.player.estimatedBand = band;
    } else if (session.kind === "review") {
      session.questions.forEach((q, i) => {
        const qpath = `p${i}:g0:q0`;
        const meta = state.answerMap[qpath];
        if (!meta) return;
        let selected = "";
        if (meta.type === "choice") {
          const button = $(`.q-options button[data-qpath="${qpath}"].selected`);
          selected = button ? button.dataset.value : "";
        } else {
          const input = $(`input[data-qpath="${qpath}"]`);
          selected = input ? input.value : "";
        }
        if (isCorrect(meta, selected)) {
          state.progress.wrongAnswers = (state.progress.wrongAnswers || []).filter((item) => !(item.question === q.text && item.answer === q.answer));
        }
      });
      state.progress.lastScore[`review:${session.level}`] = result.score;
      state.progress.player.estimatedBand = estimateBand();
    } else {
      state.progress.lastScore[`challenge:${session.type}:${session.level}`] = result.score;
      state.progress.player.estimatedBand = estimateBand();
    }
    state.session.result = {
      correct: result.correct,
      total: result.total,
      score: result.score,
      band,
      xp,
      passed: band ? band >= state.progress.target : false,
    };
    save();
    render();
  }

  function renderChallenges() {
    const level = state.challengeLevel;
    const challenges = [
      { type: "vocab", title: "单词闪电战", en: "Vocabulary sprint", icon: "zap", color: "gold", desc: "20 道分级词汇题，训练释义和词形反应速度。" },
      { type: "listening", title: "听力挑战", en: "Listening challenge", icon: "headphones", color: "teal", desc: "10 道听力理解题，可点击题目旁喇叭发音。" },
      { type: "reading", title: "阅读挑战", en: "Reading challenge", icon: "book-open", color: "red", desc: "10 道阅读题，包含原文材料和题型训练。" },
      { type: "grammar", title: "语法挑战", en: "Grammar challenge", icon: "spell-check", color: "gold", desc: "10 道基础到进阶语法题，训练时态、从句和搭配。" },
      { type: "mixed", title: "混合挑战", en: "Mixed challenge", icon: "shuffle", color: "teal", desc: "词汇、阅读、听力混合 10 题，检验综合水平。" },
    ];
    return `
      <div class="section-head reveal">
        <div><h2>题型挑战</h2><p>选一个阶段和挑战类型，限时答题并记录成绩。</p></div>
      </div>
      <div class="filter-bar reveal" style="margin-bottom:16px">
        <span style="font-size:12px;color:var(--muted)">阶段</span>
        <div class="seg">${["A0", "A1", "A2", "B1", "B2", "C1", "IELTS"].map((l) => `<button data-action="set-challenge-level" data-level="${l}" class="${l === level ? "is-active" : ""}">${l}</button>`).join("")}</div>
      </div>
      <div class="module-grid">
        ${challenges.map((c) => {
          const best = state.progress.lastScore[`challenge:${c.type}:${level}`];
          return `<article class="module-card ${c.color} reveal" data-action="start-challenge" data-type="${c.type}" data-level="${level}">
            <div class="module-top"><span class="module-num">${c.type === "vocab" ? "20" : "10"} 题</span><span class="tag ${c.color}">${best !== undefined ? `最高 ${best}%` : "未挑战"}</span></div>
            <h3>${esc(c.title)}</h3><div class="module-en">${esc(c.en)}</div><p>${esc(c.desc)}</p>
          </article>`;
        }).join("")}
      </div>`;
  }

  function renderExam() {
    const level = state.examLevel;
    const player = state.progress.player;
    player.estimatedBand = estimateBand();
    const best = player.bestBand || 0;
    return `
      <div class="section-head reveal">
        <div><h2>模拟雅思考试</h2><p>从当前阶段自动抽 30 道可判分题，覆盖词汇、语法、阅读和听力。</p></div>
        <div class="tag gold">历史最高 Band ${best ? best.toFixed(1) : "—"}</div>
      </div>
      <div class="exam-hero panel reveal">
        <div>
          <span class="eyebrow">PLAYER LEVEL ${player.level} · XP ${player.xp}</span>
          <h3>当前预测：Band ${player.estimatedBand.toFixed(1)}</h3>
          <p>${levelBandLabel(player.level)}。模拟考试会根据正确率、题目阶段和历史表现更新预测分数。</p>
        </div>
        <div class="score-orb"><strong>${player.estimatedBand.toFixed(1)}</strong><span>预测分</span></div>
      </div>
      <div class="filter-bar reveal" style="margin:18px 0 16px">
        <span style="font-size:12px;color:var(--muted)">考试阶段</span>
        <div class="seg">${["A0", "A1", "A2", "B1", "B2", "C1", "IELTS"].map((l) => `<button data-action="set-exam-level" data-level="${l}" class="${l === level ? "is-active" : ""}">${l}</button>`).join("")}</div>
      </div>
      <div class="panel exam-start reveal">
        <div class="exam-start-icon"><i data-lucide="clipboard-check"></i></div>
        <div class="exam-start-copy"><h3>${level} 模拟考试</h3><p>30 题 · 35 分钟 · 自动判分并换算 Band 分。</p></div>
        <button class="btn primary" data-action="start-mock" data-level="${level}"><i data-lucide="play"></i>开始考试</button>
      </div>
      ${(player.mockScores || []).length ? `<div class="panel panel-pad reveal" style="margin-top:16px"><h3 style="margin-top:0">最近模拟成绩</h3>${player.mockScores.slice(-5).reverse().map((m) => `<div class="progress-label"><span>${esc(m.level)} · ${esc(m.date)}</span><span>${m.score}% · Band ${m.band.toFixed(1)}</span></div>`).join("")}</div>` : ""}`;
  }

  function renderSession() {
    const session = state.session;
    if (!session) return `<div class="panel empty-state"><p>请先选择挑战或模拟考试。</p></div>`;
    if (session.result) {
      const r = session.result;
      const passLine = r.band
        ? (r.passed ? `已达到目标 Band ${state.progress.target.toFixed(1)}。` : `距离目标 Band ${state.progress.target.toFixed(1)} 还差 ${Math.max(0, state.progress.target - r.band).toFixed(1)}。`)
        : session.kind === "review" ? "本次做对的题已从错题本移除。" : "继续挑战可以提升熟练度。";
      return `
        <div class="exam-result panel reveal">
          <div class="score-orb large"><strong>${r.score}%</strong><span>正确率</span></div>
          <h2>${r.band ? `预测 Band ${r.band.toFixed(1)}` : session.kind === "review" ? "错题复习完成" : "挑战完成"}</h2>
          <p>答对 ${r.correct} / ${r.total} 题，获得 ${r.xp} XP。${passLine}</p>
          <div class="hero-actions">
            <button class="btn primary" data-action="retry-session"><i data-lucide="rotate-ccw"></i>再来一次</button>
            <button class="btn ghost" data-action="go" data-view="${session.kind === "mock" ? "exam" : session.kind === "review" ? "review" : "challenges"}"><i data-lucide="arrow-left"></i>返回</button>
          </div>
        </div>`;
    }
    const title = session.kind === "mock" ? `${session.level} 模拟考试` : session.kind === "review" ? "错题复习" : `题型挑战 · ${session.type}`;
    return `
      <div class="runner-head reveal">
        <div><h2>${esc(title)}</h2><div class="runner-meta"><span class="tag gold">${session.level}</span><span class="tag">${session.questions.length} 题</span><span class="tag" id="session-timer">${formatClock(session.remaining)}</span></div></div>
        <button class="btn ghost" data-action="exit-session"><i data-lucide="x"></i>退出</button>
      </div>
      <section class="panel questions-panel reveal">
        <div class="session-progress" id="session-progress">已答 <strong>0</strong> / ${session.questions.length} 题</div>
        ${session.questions.map((q, i) => {
          const context = q.context ? `<details class="session-context"><summary>查看材料</summary><div>${wordify(q.context)}</div></details>` : "";
          return `<div class="session-item">${context}${renderQuestionGroup({ type: q.type, instructions: "", questions: [q] }, i, 0, q.context, q.level)}</div>`;
        }).join("")}
        <div class="check-row">
          <div class="score-big">考试结束后统一判分</div>
          <button class="btn primary" data-action="submit-session"><i data-lucide="check-check"></i>提交并计算分数</button>
        </div>
      </section>`;
  }

  function renderVideos() {
    const videos = [
      { bvid: "BV1A84y1t7cf", title: "雅思阅读全解 13 讲", tag: "阅读系列", episodes: "13 讲", desc: "完整阅读方法论课程，按题型系统讲解定位、同义替换和解题步骤。" },
      { bvid: "BV1gtV8zXEvT", title: "雅思写作全套课程", tag: "写作系列", episodes: "14 节完结", desc: "从 Task 1 图表到 Task 2 大作文，完整覆盖写作结构和常用表达。" },
      { bvid: "BV1Gd4y1S7ca", title: "8 节课学完雅思听力", tag: "听力系列", episodes: "8 节", desc: "系统讲解听力题型、预读、关键词和同义替换。" },
      { bvid: "BV1dg4y1y7EG", title: "雅思口语速成 15 节", tag: "口语系列", episodes: "15 节完结", desc: "完整口语备考流程，覆盖 Part 1、Part 2 和 Part 3。" },
      { bvid: "BV1XY411J7aG", title: "英语语法精讲合集", tag: "语法系列", episodes: "系统合集", desc: "从零建立语法体系，适合初一水平和基础薄弱的学习者。" },
      { bvid: "BV1RLNJzrE4e", title: "剑雅听力真题合集", tag: "真题系列", episodes: "64 集", desc: "剑桥雅思听力真题和音频合集，适合作为长期磨耳朵训练。" },
    ];
    return `
      <div class="section-head reveal">
        <div><h2>精选教学系列</h2><p>只保留完整课程和系统合集，不再放经验分享类视频。来自哔哩哔哩官方播放器，版权归原作者所有。</p></div>
      </div>
      <div class="video-grid">
        ${videos.map((v) => `<article class="video-card reveal">
          <div class="video-frame"><iframe src="https://player.bilibili.com/player.html?bvid=${v.bvid}&page=1&high_quality=1&danmaku=0&autoplay=0" loading="lazy" allowfullscreen="true" scrolling="no" frameborder="0"></iframe></div>
          <div class="video-body"><span class="tag red">${esc(v.tag)}</span><span class="tag gold" style="margin-left:6px">${esc(v.episodes)}</span><h3>${esc(v.title)}</h3><p>${esc(v.desc)}</p><a href="https://www.bilibili.com/video/${v.bvid}/" target="_blank" rel="noopener">打开完整系列</a></div>
        </article>`).join("")}
      </div>`;
  }

  function englishFeedback(text) {
    const value = String(text || "").trim();
    const notes = [];
    let corrected = value;
    const rules = [
      { re: /\bi am agree\b/gi, to: "I agree", note: "I am agree → I agree" },
      { re: /\bi very like\b/gi, to: "I really like", note: "I very like → I really like" },
      { re: /\bhe go\b/gi, to: "he goes", note: "he go → he goes" },
      { re: /\bshe go\b/gi, to: "she goes", note: "she go → she goes" },
      { re: /\bmore better\b/gi, to: "better", note: "more better → better" },
      { re: /\bi am boring\b/gi, to: "I am bored", note: "I am boring → I am bored" },
      { re: /\bi have (\d+) years? old\b/gi, to: (m, n) => `I am ${n} years old`, note: "I have ... years old → I am ... years old" },
      { re: /\bmy english is not good\b/gi, to: "my English is not very good", note: "English 要大写" },
    ];
    rules.forEach((rule) => {
      if (rule.re.test(value)) {
        corrected = corrected.replace(rule.re, rule.to);
        notes.push(rule.note);
      }
    });
    if (value && !/^[A-Z]/.test(value)) notes.push("句首可以大写");
    if (value && !/[.!?]$/.test(value)) notes.push("句末可以加句号或问号");
    const upgrades = [
      { re: /\bgood\b/gi, to: "great / helpful", note: "good 可以升级为 great / helpful" },
      { re: /\bbig\b/gi, to: "large / significant", note: "big 可以升级为 large / significant" },
      { re: /\bvery\b/gi, to: "really / extremely", note: "very 可以换成 really / extremely" },
    ];
    upgrades.forEach((u) => {
      if (u.re.test(value)) notes.push(u.note);
    });
    return { corrected, notes: [...new Set(notes)].slice(0, 3) };
  }

  function builtinAiReply(text) {
    const value = String(text || "").trim();
    const lower = value.toLowerCase();
    const scenario = AI_SCENARIOS[state.ai.scenario];
    const feedback = englishFeedback(value);
    if (!scenario) {
      const prompt = AI_FREE_PROMPTS[Math.floor(Math.random() * AI_FREE_PROMPTS.length)];
      return { reply: prompt, feedback: feedback.notes.length ? feedback.notes.join("；") : "Keep going. Try to answer in a full sentence." };
    }
    const step = scenario.steps[Math.min(state.ai.stepIndex, scenario.steps.length - 1)];
    if (/^(hint|help|提示|不会|i don't know|i do not know)$/i.test(value)) {
      return { reply: step.ai, feedback: `可以这样说：${step.hint}` };
    }
    const matched = step.keywords.some((keyword) => lower.includes(keyword));
    if (matched) state.ai.stepIndex = Math.min(state.ai.stepIndex + 1, scenario.steps.length);
    let reply;
    if (state.ai.stepIndex >= scenario.steps.length) {
      reply = "Excellent! You finished this scenario. Let's try a free question: What did you do today?";
      state.ai.stepIndex = 0;
    } else {
      reply = matched
        ? scenario.steps[state.ai.stepIndex].ai
        : `That's okay. Try to answer with a full sentence. ${step.ai}`;
    }
    const note = feedback.notes.length
      ? `${feedback.notes.join("；")}。可以改成：${feedback.corrected}`
      : "表达很清楚。试着再加一个原因或例子。";
    return { reply, feedback: note };
  }

  async function callAiApi(history) {
    const settings = state.ai.settings;
    if (!settings.apiKey) throw new Error("missing api key");
    const scenario = AI_SCENARIOS[state.ai.scenario];
    const system = `You are a patient English conversation tutor for a beginner Chinese learner. Keep your English simple, ask one question at a time, and gently correct important mistakes. Current scenario: ${scenario ? scenario.title : "free conversation"}.`;
    const res = await fetch(`${settings.baseUrl.replace(/\/$/, "")}/chat/completions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${settings.apiKey}`,
      },
      body: JSON.stringify({
        model: settings.model,
        temperature: 0.7,
        messages: [{ role: "system", content: system }].concat(history.slice(-10)),
      }),
    });
    if (!res.ok) throw new Error(`AI API ${res.status}`);
    const data = await res.json();
    return (data.choices && data.choices[0] && data.choices[0].message && data.choices[0].message.content) || "";
  }

  async function getAiReply(text) {
    if (state.ai.settings.mode === "api" && state.ai.settings.apiKey) {
      try {
        const history = state.ai.messages.map((m) => ({ role: m.role === "ai" ? "assistant" : "user", content: m.text }));
        const reply = await callAiApi(history);
        if (reply) return { reply, feedback: englishFeedback(text).notes.join("；") || "Good. Continue the conversation in English." };
      } catch (e) {
        toast("AI 模型连接失败，已切换到内置陪练");
      }
    }
    return builtinAiReply(text);
  }

  function scrollAiMessages() {
    const box = $("#ai-messages");
    if (box) box.scrollTop = box.scrollHeight;
  }

  async function sendAiMessage(text) {
    const value = String(text || "").trim();
    if (!value || state.ai.thinking) return;
    if (state.ai.recognition && state.ai.listening) {
      state.ai.recognitionPaused = true;
      try { state.ai.recognition.stop(); } catch (e) { /* ignore */ }
      state.ai.listening = false;
    }
    state.ai.messages.push({ role: "user", text: value, feedback: "" });
    state.ai.thinking = true;
    state.ai.status = "thinking";
    render();
    const result = await getAiReply(value);
    state.ai.messages.push({ role: "ai", text: result.reply, feedback: result.feedback || "" });
    state.ai.thinking = false;
    state.ai.status = "speaking";
    recordDailyQuestions(1);
    addXp(5);
    render();
    speakAiReply(result.reply);
  }

  function speakAiReply(text) {
    state.ai.status = "speaking";
    updateAiStatus();
    speakText(text, 0.82, () => {
      state.ai.status = "idle";
      state.ai.recognitionPaused = false;
      updateAiStatus();
      if (state.ai.autoMode) startAiListening();
    });
  }

  function updateAiStatus() {
    const el = $("#ai-status");
    if (!el) return;
    const labels = {
      listening: "正在听你说英语…",
      thinking: "AI 正在回复…",
      speaking: "AI 正在说话，麦克风已暂停…",
      idle: state.ai.autoMode ? "实时对话已就绪，说完 AI 会自动接话" : "点麦克风或开始实时语音对话",
    };
    el.textContent = labels[state.ai.status] || labels.idle;
  }

  function startAiListening() {
    const Recognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!Recognition) {
      toast("当前浏览器不支持语音识别，请使用 Edge 或 Chrome，或直接输入英文");
      return;
    }
    if (!state.ai.recognition) {
      const recognition = new Recognition();
      recognition.lang = "en-US";
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.onresult = (event) => {
        let finalText = "";
        let interimText = "";
        for (let i = event.resultIndex; i < event.results.length; i += 1) {
          const transcript = event.results[i][0].transcript;
          if (event.results[i].isFinal) finalText += transcript + " ";
          else interimText += transcript;
        }
        const live = $("#ai-live-text");
        if (live) live.textContent = interimText || finalText;
        if (finalText.trim()) sendAiMessage(finalText.trim());
      };
      recognition.onerror = () => {
        state.ai.listening = false;
        state.ai.status = "idle";
        updateAiStatus();
      };
      recognition.onend = () => {
        state.ai.listening = false;
        if (state.ai.status === "listening") state.ai.status = "idle";
        updateAiStatus();
        if (state.ai.autoMode && !state.ai.thinking && !state.ai.recognitionPaused) window.setTimeout(startAiListening, 450);
      };
      state.ai.recognition = recognition;
    }
    try {
      state.ai.recognitionPaused = false;
      state.ai.listening = true;
      state.ai.status = "listening";
      state.ai.recognition.start();
      updateAiStatus();
    } catch (e) {
      state.ai.listening = false;
      state.ai.status = "idle";
      updateAiStatus();
    }
  }

  function stopAiListening(manual = false) {
    if (manual) state.ai.autoMode = false;
    if (state.ai.recognition) {
      try { state.ai.recognition.stop(); } catch (e) { /* ignore */ }
    }
    state.ai.listening = false;
    state.ai.status = "idle";
    updateAiStatus();
  }

  function startAiScenario(id) {
    stopAiListening(true);
    state.ai.scenario = id;
    state.ai.stepIndex = 0;
    const scenario = AI_SCENARIOS[id];
    const first = scenario ? scenario.steps[0].ai : AI_FREE_PROMPTS[0];
    state.ai.messages = [{ role: "ai", text: first, feedback: "" }];
    render();
    speakAiReply(first);
  }

  function renderAiChat() {
    const scenario = AI_SCENARIOS[state.ai.scenario];
    if (!state.ai.messages.length) {
      state.ai.messages = [{ role: "ai", text: scenario ? scenario.steps[0].ai : AI_FREE_PROMPTS[0], feedback: "" }];
    }
    const messages = state.ai.messages.map((m, i) => `
      <div class="ai-message ${m.role}">
        <div class="ai-avatar">${m.role === "ai" ? "AI" : "你"}</div>
        <div class="ai-bubble">
          <div>${wordify(m.text)}</div>
          ${m.feedback ? `<div class="ai-feedback">${esc(m.feedback)}</div>` : ""}
          ${m.role === "ai" ? `<button class="ai-speak" data-action="ai-speak" data-index="${i}" title="朗读"><i data-lucide="volume-2"></i></button>` : ""}
        </div>
      </div>`).join("");
    const scenarios = Object.entries(AI_SCENARIOS).map(([id, s]) => `<button class="ai-scenario ${state.ai.scenario === id ? "is-active" : ""}" data-action="set-ai-scenario" data-id="${id}"><strong>${esc(s.title)}</strong><span>${esc(s.level)} · ${esc(s.en)}</span></button>`).join("")
      + `<button class="ai-scenario ${state.ai.scenario === "free" ? "is-active" : ""}" data-action="set-ai-scenario" data-id="free"><strong>自由对话</strong><span>随机话题 · Free talk</span></button>`;
    const s = state.ai.settings;
    const speechSupported = !!(window.SpeechRecognition || window.webkitSpeechRecognition);
    const statusLabel = state.ai.status === "listening" ? "Listening" : state.ai.status === "thinking" ? "Thinking" : state.ai.status === "speaking" ? "Speaking" : state.ai.autoMode ? "Realtime on" : "Ready";
    return `
      <div class="section-head reveal"><div><h2>AI 英语对话</h2><p>一键开始实时语音对话：你说英语 → AI 语音回复 → 自动继续听你说。首次使用需要允许麦克风。</p></div><span class="tag teal">实时语音陪练</span></div>
      <div class="ai-scenario-grid reveal">${scenarios}</div>
      <div class="ai-layout">
        <section class="panel ai-chat-card reveal">
          <div class="ai-chat-head"><div><strong>${esc(scenario ? scenario.title : "自由对话")}</strong><span>${esc(scenario ? scenario.goal : "练习自由表达，AI 会继续追问。")}</span></div><span class="tag ${state.ai.listening || state.ai.status === "speaking" ? "red" : "teal"}">${statusLabel}</span></div>
          <div class="ai-messages" id="ai-messages">${messages}${state.ai.thinking ? `<div class="ai-message ai"><div class="ai-avatar">AI</div><div class="ai-bubble"><span class="typing-dots">正在输入</span></div></div>` : ""}</div>
          <div class="ai-live" id="ai-live-text"></div>
          ${speechSupported ? "" : `<div class="ai-warning">当前浏览器不支持实时语音识别。可以继续用文字对话，或使用最新版 Edge / Chrome 开启实时语音。</div>`}
          <div class="ai-input-row">
            <button class="ai-mic ${state.ai.listening ? "is-listening" : ""}" id="ai-mic" data-action="ai-toggle-mic" title="开始/停止语音输入"><i data-lucide="mic"></i></button>
            <input id="ai-input" type="text" placeholder="Type in English, or click the microphone..." autocomplete="off" />
            <button class="btn primary" data-action="ai-send"><i data-lucide="send"></i></button>
          </div>
          <div class="ai-actions">
            ${state.ai.autoMode || state.ai.listening
              ? `<button class="btn primary" data-action="ai-stop-realtime"><i data-lucide="square"></i>停止实时对话</button>`
              : `<button class="btn primary" data-action="ai-start-realtime" ${speechSupported ? "" : "disabled"}><i data-lucide="radio"></i>开始实时语音对话</button>`}
            <button class="btn ghost" data-action="ai-hint"><i data-lucide="lightbulb"></i>提示我会怎么说</button>
            <button class="btn ${state.ai.autoMode ? "teal" : "ghost"}" data-action="ai-toggle-auto"><i data-lucide="repeat"></i>自动对话</button>
            <button class="btn ghost" data-action="ai-reset"><i data-lucide="rotate-ccw"></i>重新开始</button>
          </div>
          <div class="ai-status" id="ai-status">${state.ai.listening ? "正在听你说英语…" : state.ai.autoMode ? "自动对话已开启，点麦克风开始" : "点麦克风开始实时英语对话"}</div>
        </section>
        <aside class="panel ai-settings-card reveal">
          <h3>AI 模型设置（可选）</h3>
          <label>模式<select id="ai-mode"><option value="builtin" ${s.mode === "builtin" ? "selected" : ""}>内置陪练（无需 Key）</option><option value="api" ${s.mode === "api" ? "selected" : ""}>自定义 OpenAI 兼容模型</option></select></label>
          <label>API Base URL<input id="ai-base-url" value="${esc(s.baseUrl)}" placeholder="https://api.openai.com/v1" /></label>
          <label>模型<input id="ai-model" value="${esc(s.model)}" placeholder="gpt-4o-mini" /></label>
          <label>API Key<input id="ai-key" type="password" value="${esc(s.apiKey)}" placeholder="只保存在本机浏览器" /></label>
          <button class="btn teal" data-action="save-ai-settings"><i data-lucide="save"></i>保存 AI 设置</button>
          <p>不填 Key 时使用内置陪练，仍然支持实时语音输入和语音回复。自定义模型需要接口允许浏览器跨域访问。Via 等不支持系统语音的浏览器，请打开顶部“兼容朗读”。</p>
        </aside>
      </div>`;
  }

  function renderAccount() {
    const user = state.account.user;
    const cloud = state.account.cloud;
    const downloads = renderAppDownloads();
    if (user) {
      const initial = (state.progress.profile.displayName || user.email || "U").slice(0, 1).toUpperCase();
      const totalQuestions = Object.values(state.progress.stats).reduce((n, s) => n + (s.attempted || 0), 0);
      return `
        <div class="section-head reveal"><div><h2>账户与同步</h2><p>当前学习进度绑定到你的账户，可以导出备份；云端账户可跨设备同步。</p></div><div class="section-head-actions"><button class="btn ghost" data-action="go" data-view="settings"><i data-lucide="settings"></i>设置</button><span class="tag ${isAdminUser(user) ? "red" : user.mode === "supabase" ? "teal" : "gold"}">${isAdminUser(user) ? "管理员" : user.mode === "supabase" ? "云端账户" : "本地账户"}</span></div></div>
        ${user.mode !== "supabase" ? `<div class="account-warning"><strong>这是本机浏览器账户</strong><p>换到另一个浏览器或手机后无法直接登录。要跨设备使用，请配置站点云端服务后改用云端邮箱账户。</p></div>` : ""}
        <div class="account-layout">
          <section class="panel account-card reveal">
            <div class="account-profile"><div class="account-avatar">${esc(initial)}</div><div><h3>${esc(state.progress.profile.displayName || user.name || "学习者")}</h3><span>${esc(user.email)}</span></div></div>
            <div class="account-stats">
              <div><strong>Lv.${state.progress.player.level}</strong><span>玩家等级</span></div>
              <div><strong>${state.progress.player.estimatedBand.toFixed(1)}</strong><span>预测 Band</span></div>
              <div><strong>${ensureToday().words}</strong><span>今日单词</span></div>
              <div><strong>${totalQuestions}</strong><span>累计做题</span></div>
            </div>
            <div class="account-actions">
              <button class="btn teal" data-action="cloud-sync" ${user.mode === "supabase" ? "" : "disabled"}><i data-lucide="cloud-upload"></i>同步到云端</button>
              <button class="btn ghost" data-action="export-progress"><i data-lucide="download"></i>导出学习进度</button>
              <label class="btn ghost file-button"><i data-lucide="upload"></i>导入学习进度<input type="file" id="import-progress" accept="application/json" hidden /></label>
              <button class="btn ghost" data-action="install-app"><i data-lucide="smartphone"></i>安装 App 版本</button>
              <button class="btn ghost" data-action="check-app-update"><i data-lucide="refresh-cw"></i>检查 App 云端更新</button>
              <button class="btn ghost" data-action="logout-account"><i data-lucide="log-out"></i>退出登录</button>
            </div>
          </section>
          <aside class="panel account-cloud reveal">
            <h3>云端同步设置</h3>
            <p>本地账户只保存在这台设备。要跨手机和电脑同步，请填写你的 Supabase 项目配置，然后使用云端邮箱账户登录。</p>
            <label>Supabase URL<input id="supabase-url-settings" value="${esc(cloud.url)}" placeholder="https://xxxx.supabase.co" /></label>
            <label>Supabase Anon Key<input id="supabase-anon-key-settings" type="password" value="${esc(cloud.anonKey)}" placeholder="eyJ..." /></label>
            <button class="btn ghost" data-action="save-cloud-settings"><i data-lucide="save"></i>保存云端配置</button>
            <p class="account-note">云端登录使用 Supabase 官方 Auth 接口，密码不会保存在本网站。当前账户类型：${user.mode === "supabase" ? "Supabase 云端" : "本机浏览器"}。</p>
          </aside>
        </div>
        ${isAdminUser(user) ? renderAdminPanel() : ""}
        ${downloads}`;
    }
    const mode = state.account.formMode === "login" ? "login" : "register";
    const isRegister = mode === "register";
    const cloudSelected = state.account.registerStorage !== "local";
    const cloudReady = cloudConfigured();
    return `
      <div class="section-head reveal"><div><h2>邮箱注册登录</h2><p>新注册默认保存到云端，适合跨浏览器和跨设备使用。</p></div><div class="section-head-actions"><button class="btn ghost" data-action="go" data-view="settings"><i data-lucide="settings"></i>设置</button><span class="tag ${cloudReady ? "teal" : "gold"}">${cloudReady ? "默认云端存储" : "云端待配置"}</span></div></div>
      <div class="account-warning reveal"><strong>${cloudReady ? "云端账户可在其他浏览器登录" : "为什么换浏览器登录不上？"}</strong><p>${cloudReady ? "注册后学习进度会同步到云端，在手机或另一台电脑上使用同一邮箱即可登录。" : "本地账户只保存在当前浏览器。管理员配置一次云端服务后，所有浏览器都会自动使用同一云端账户；也可以先切换为“仅本机”。"}</p></div>
      <div class="account-layout single">
        <section class="panel account-card reveal">
          <div class="seg account-tabs"><button data-action="account-mode" data-mode="login" class="${mode === "login" ? "is-active" : ""}">登录</button>${state.config.allowRegistration ? `<button data-action="account-mode" data-mode="register" class="${isRegister ? "is-active" : ""}">注册</button>` : ""}</div>
          <div class="seg storage-tabs"><button data-action="set-register-storage" data-storage="cloud" class="${cloudSelected ? "is-active" : ""}">云端存储（推荐）</button><button data-action="set-register-storage" data-storage="local" class="${!cloudSelected ? "is-active" : ""}">仅本机</button></div>
          <form class="account-form" id="account-form">
            ${isRegister ? `<label>昵称<input id="account-name" autocomplete="nickname" placeholder="例如：Wei" /></label>` : ""}
            <label>邮箱<input id="account-email" type="email" autocomplete="email" placeholder="you@example.com" required /></label>
            <label>密码<input id="account-password" type="password" autocomplete="${isRegister ? "new-password" : "current-password"}" placeholder="至少 6 位" required minlength="6" /></label>
            <button class="btn primary" type="button" data-action="account-submit"><i data-lucide="${isRegister ? "user-plus" : "log-in"}"></i>${isRegister ? (cloudSelected ? "注册云端账户" : "注册本机账户") : (cloudSelected ? "登录云端账户" : "登录本机账户")}</button>
          </form>
          <div class="social-login">
            <button class="social-btn wechat" data-action="social-login" data-provider="wechat"><span>微</span>微信登录</button>
            <button class="social-btn qq" data-action="social-login" data-provider="qq"><span>Q</span>QQ 登录</button>
          </div>
          <p class="account-note">${cloudReady ? "云端账户通过 Supabase Auth 保存，支持跨浏览器登录和进度同步；本机账户只保存当前浏览器。" : "当前网站还没有配置云端服务。普通用户可以先注册本机账户，管理员展开下方设置完成一次配置即可。"}</p>
          <details class="cloud-setup-details">
            <summary>${cloudReady ? "查看或更换云端服务" : "管理员配置云端服务"}</summary>
            <div class="cloud-setup-body">
              <label>Supabase URL<input id="supabase-url-settings" value="${esc(cloud.url)}" placeholder="https://xxxx.supabase.co" /></label>
              <label>Supabase Anon Key<input id="supabase-anon-key-settings" type="password" value="${esc(cloud.anonKey)}" placeholder="eyJ..." /></label>
              <button class="btn ghost" data-action="save-cloud-settings"><i data-lucide="save"></i>保存到本机</button>
              <p>发布时把同一组配置写入 <code>data/cloud-config.js</code>，所有浏览器就会自动共用这个云端服务。</p>
            </div>
          </details>
        </section>
      </div>
      ${downloads}`;
  }

  function renderAdminPanel() {
    const accounts = Object.values(localAccounts()).map((a) => ({ email: a.email, name: a.name, createdAt: a.createdAt }));
    return `
      <section class="admin-panel panel reveal">
        <div class="section-head"><div><h2>管理员面板</h2><p>管理员邮箱：${esc([...ADMIN_EMAILS].join(" / "))}</p></div><span class="tag red">Admin</span></div>
        <div class="admin-controls">
          <button class="btn ${state.config.requireLogin ? "teal" : "ghost"}" data-action="admin-toggle-login"><i data-lucide="lock"></i>登录后才可使用：${state.config.requireLogin ? "已开启" : "已关闭"}</button>
          <button class="btn ${state.config.allowRegistration ? "teal" : "ghost"}" data-action="admin-toggle-register"><i data-lucide="user-plus"></i>允许注册：${state.config.allowRegistration ? "已开启" : "已关闭"}</button>
          <button class="btn ghost" data-action="admin-export-accounts"><i data-lucide="download"></i>导出用户列表</button>
        </div>
        <div class="admin-accounts">
          <h3>本机邮箱账户（${accounts.length}）</h3>
          ${accounts.length ? accounts.map((a) => `<div class="admin-account-row"><strong>${esc(a.name || a.email)}</strong><span>${esc(a.email)}</span><em>${a.createdAt ? new Date(a.createdAt).toLocaleDateString("zh-CN") : ""}</em></div>`).join("") : `<p class="account-note">当前浏览器还没有本地邮箱账户。</p>`}
        </div>
        <div class="admin-oauth">
          <h3>微信 / QQ 登录配置</h3>
          <label>微信网站应用 AppID<input id="wechat-app-id" value="${esc(state.config.oauth.wechatAppId)}" placeholder="wx..." /></label>
          <label>QQ 互联应用 AppID<input id="qq-app-id" value="${esc(state.config.oauth.qqAppId)}" placeholder="10..." /></label>
          <label>OAuth Worker 地址<input id="oauth-worker-url" value="${esc(state.config.oauth.workerUrl)}" placeholder="https://your-worker.workers.dev" /></label>
          <button class="btn teal" data-action="save-oauth-config"><i data-lucide="save"></i>保存社交登录配置</button>
          <p class="account-note">AppSecret 不保存在网页中，请配置到 Cloudflare Worker 的环境变量。微信需要 Open Platform 网站应用，QQ 需要 QQ 互联网站应用，并设置回调域名。</p>
        </div>
        <p class="account-note">当前管理员权限基于邮箱匹配。正式跨设备管理员权限应通过 Supabase Auth 邮箱验证和服务端角色表配置，避免仅靠前端判断被绕过。</p>
      </section>`;
  }

  function renderLibrary() {
    const library = BANK.library || { stories: [], essays: [], reading: [] };
    const tab = state.libraryTab || "stories";
    const items = library[tab] || [];
    const current = items.find((item) => item.id === state.libraryItemId);
    const tabs = [
      { id: "stories", label: "英文小故事", icon: "book-heart" },
      { id: "essays", label: "英文作文", icon: "pen-line" },
      { id: "reading", label: "阅读理解", icon: "book-open" },
    ];
    const tabHtml = `<div class="seg library-tabs">${tabs.map((item) => `<button data-action="set-library-tab" data-tab="${item.id}" class="${tab === item.id ? "is-active" : ""}"><i data-lucide="${item.icon}"></i>${item.label}</button>`).join("")}</div>`;
    if (current && tab !== "reading") {
      const isEssay = tab === "essays";
      return `
        <div class="section-head reveal"><div><h2>${esc(current.title)}</h2><p>${esc(current.level)} · ${esc(isEssay ? current.prompt : current.summary)}</p></div><button class="btn ghost" data-action="close-library-item"><i data-lucide="arrow-left"></i>返回列表</button></div>
        <article class="panel library-reader reveal">
          <div class="library-reader-meta"><span class="tag teal">${esc(current.level)}</span><span class="tag">${isEssay ? "范文" : "故事"}</span><button class="btn teal" data-action="speak-library-item"><i data-lucide="volume-2"></i>朗读全文</button></div>
          ${isEssay ? `<div class="library-prompt"><strong>写作题目</strong><p>${wordify(current.prompt)}</p></div>` : ""}
          <div class="library-text">${wordify(current.text)}</div>
          <div class="library-reader-actions"><button class="btn ghost" data-action="library-next"><i data-lucide="arrow-right"></i>下一篇</button></div>
        </article>`;
    }
    return `
      <div class="section-head reveal"><div><h2>阅读与写作</h2><p>小故事练语感，作文范文学结构，阅读理解做题型训练。</p></div></div>
      ${tabHtml}
      <div class="library-grid">
        ${items.map((item) => `<article class="module-card ${item.level === "A1" || item.level === "A2" ? "teal" : item.level === "C1" ? "red" : "gold"} reveal" data-action="${tab === "reading" ? "open-reading" : "open-library-item"}" data-id="${item.id}"><div class="module-top"><span class="module-num">${esc(item.level)}</span><span class="tag ${tab === "reading" ? "red" : "teal"}">${tab === "reading" ? "阅读理解" : tab === "essays" ? "作文范文" : "英文故事"}</span></div><h3>${esc(item.title)}</h3><p>${esc(item.summary || item.desc || "")}</p></article>`).join("")}
      </div>`;
  }

  function renderSettings() {
    const voices = (window.speechSynthesis && window.speechSynthesis.getVoices ? window.speechSynthesis.getVoices() : []).filter((v) => /^en/i.test(v.lang));
    const s = state.settings;
    return `
      <div class="section-head reveal"><div><h2>设置</h2><p>声音、朗读兼容和自动鼓励都集中在这里。</p></div><span class="tag teal">个人设置</span></div>
      <div class="settings-grid">
        <section class="panel settings-card reveal">
          <h3>声音与朗读</h3>
          <button class="setting-row" data-action="toggle-voice"><span><strong>总声音开关</strong><small>关闭后所有单词、例句和 AI 回复都不朗读</small></span><b class="switch ${s.voiceEnabled ? "on" : ""}"></b></button>
          <button class="setting-row" data-action="toggle-encourage"><span><strong>完成单元自动鼓励</strong><small>完成一个词汇单元后播放随机英文鼓励</small></span><b class="switch ${s.autoEncourage ? "on" : ""}"></b></button>
          <button class="setting-row" data-action="toggle-compat-setting"><span><strong>兼容朗读模式</strong><small>Via 等浏览器用在线 MP3 播放</small></span><b class="switch ${state.ttsCompat ? "on" : ""}"></b></button>
          <button class="setting-row" data-action="toggle-lookup-setting"><span><strong>点词讲解</strong><small>点击英文单词弹出翻译和英文释义</small></span><b class="switch ${state.lookupEnabled ? "on" : ""}"></b></button>
          <label class="setting-field">声音选择<select id="voice-select"><option value="">自动选择英文声音</option>${voices.map((v) => `<option value="${esc(v.voiceURI)}" ${s.voiceURI === v.voiceURI ? "selected" : ""}>${esc(v.name)} · ${esc(v.lang)}</option>`).join("")}</select></label>
          <label class="setting-field">语速：<span id="voice-rate-value">${s.rate.toFixed(2)}</span><input id="voice-rate" type="range" min="0.55" max="1.25" step="0.05" value="${s.rate}" /></label>
          <div class="account-actions">
            <button class="btn teal" data-action="save-settings"><i data-lucide="save"></i>保存设置</button>
            <button class="btn ghost" data-action="test-sound"><i data-lucide="volume-2"></i>测试声音</button>
          </div>
        </section>
        <section class="panel settings-card reveal">
          <h3>学习偏好</h3>
          <div class="setting-info"><strong>当前学习等级</strong><span>${esc(state.practiceLevel)} · ${esc(state.vocabLevel)}</span></div>
          <div class="setting-info"><strong>词汇单元</strong><span>每单元 20 词，避免一次随机跨度过大</span></div>
          <div class="setting-info"><strong>错题记录</strong><span>${(state.progress.wrongAnswers || []).length} 道待复习</span></div>
          <p class="account-note">朗读设置按浏览器保存；如果使用云端账户，学习进度仍按账户同步。</p>
        </section>
      </div>`;
  }

  function renderReview() {
    const wrong = state.progress.wrongAnswers || [];
    const counts = wrong.reduce((acc, item) => {
      acc[item.skill] = (acc[item.skill] || 0) + 1;
      return acc;
    }, {});
    return `
      <div class="section-head reveal"><div><h2>错题复习</h2><p>自动收集答错的题目，重新练习可以逐条移除。</p></div><button class="btn primary" data-action="start-review" ${wrong.length ? "" : "disabled"}><i data-lucide="play"></i>开始复习</button></div>
      <div class="review-stats reveal">
        ${["reading", "listening", "vocab", "writing"].map((skill) => `<div class="panel review-stat"><strong>${counts[skill] || 0}</strong><span>${SKILL_META[skill] ? SKILL_META[skill].label : "其他"}错题</span></div>`).join("")}
      </div>
      <section class="panel review-list reveal">
        ${wrong.length ? wrong.slice(-30).reverse().map((item, i) => `<div class="review-item"><div class="review-no">${wrong.length - i}</div><div><strong>${wordify(item.question || "题目")}</strong><p>正确答案：<b>${esc(item.answer || "")}</b></p><p>${esc(item.explanation || "回到原文或录音核对关键词和同义替换。")}</p><span>${esc(item.skill || "练习")} · ${item.timestamp ? new Date(item.timestamp).toLocaleDateString("zh-CN") : ""}</span></div><button class="btn ghost" data-action="remove-wrong" data-id="${esc(item.id)}"><i data-lucide="trash-2"></i></button></div>`).join("") : `<div class="empty-state"><i data-lucide="badge-check"></i><p>暂时没有错题，继续练习吧。</p></div>`}
      </section>`;
  }

  function renderAppDownloads() {
    const base = "https://github.com/nma82439668hhf/ielts-passport/releases/latest/download";
    const items = [
      { name: "Windows", file: "IELTS-Passport-Windows-Setup-1.0.1.exe", icon: "monitor", note: "NSIS 安装版，未签名" },
      { name: "macOS", file: "IELTS-Passport-macOS-arm64-1.0.1.dmg", icon: "laptop", note: "Apple 芯片 DMG，未签名" },
      { name: "Linux", file: "IELTS-Passport-Linux-1.0.1.AppImage", icon: "terminal", note: "AppImage，免安装" },
      { name: "Android", file: "IELTS-Passport-Android-Debug-1.0.1.apk", icon: "smartphone", note: "Debug APK，可直接安装" },
      { name: "iOS", file: "IELTS-Passport-iOS-Unsigned-1.0.1.ipa", icon: "apple", note: "未签名 IPA，需要 Apple 证书" },
    ];
    return `
      <details class="app-download-section reveal">
        <summary><span><strong>下载 App 安装包</strong><small>电脑、Android 和 iOS 可选安装</small></span><i data-lucide="chevron-down"></i></summary>
        <div class="download-grid">
          ${items.map((item) => `<a class="download-card" href="${base}/${item.file}" target="_blank" rel="noopener"><div class="download-icon"><i data-lucide="${item.icon}"></i></div><strong>${esc(item.name)}</strong><span>${esc(item.note)}</span><b>下载安装包</b></a>`).join("")}
          <button class="download-card" data-action="install-app"><div class="download-icon"><i data-lucide="globe"></i></div><strong>PWA / 网页版</strong><span>无需安装包，添加到主屏幕即可</span><b>安装 PWA</b></button>
        </div>
      </details>`;
  }

  function exportProgress() {
    const payload = JSON.stringify({ exportedAt: new Date().toISOString(), progress: state.progress }, null, 2);
    const blob = new Blob([payload], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `ielts-passport-progress-${todayKey()}.json`;
    link.click();
    URL.revokeObjectURL(url);
  }

  async function importProgressFile(file) {
    if (!file) return;
    try {
      const text = await file.text();
      const data = JSON.parse(text);
      if (!data.progress) throw new Error("invalid file");
      const defaults = defaultProgress();
      state.progress = {
        ...defaults,
        ...data.progress,
        stats: { ...defaults.stats, ...(data.progress.stats || {}) },
        player: { ...defaults.player, ...(data.progress.player || {}) },
        profile: { ...defaults.profile, ...(data.progress.profile || {}) },
        daily: { ...defaults.daily, ...(data.progress.daily || {}) },
        vocab: { ...defaults.vocab, ...(data.progress.vocab || {}) },
      };
      save();
      render();
      toast("学习进度导入成功");
    } catch (e) {
      toast("进度文件格式不正确");
    }
  }

  async function installApp() {
    if (state.account.installPrompt) {
      state.account.installPrompt.prompt();
      await state.account.installPrompt.userChoice;
      state.account.installPrompt = null;
      return;
    }
    toast("请用浏览器菜单选择“添加到主屏幕”或“安装应用”");
  }

  function openSupport() {
    const modal = $("#support-modal");
    if (modal) modal.hidden = false;
  }

  function closeSupport() {
    const modal = $("#support-modal");
    if (modal) modal.hidden = true;
  }

  function renderReadingTest(id) {
    const test = findTest("reading", id);
    if (!test) return `<div class="panel empty-state"><p>未找到该套题</p></div>`;
    state.currentTest = { skill: "reading", id };
    state.currentTest.checked = false;
    state.currentTest.passages = test.passages;
    state.answerMap = {};

    const passageHtml = test.passages.map((p, pi) => `
      <div style="margin-bottom:24px">
        <div class="passage-title-row"><h3>Passage ${p.number} · ${esc(p.title)}</h3><button class="btn ghost" data-action="speak-reading-passage" data-index="${pi}"><i data-lucide="volume-2"></i>朗读本段</button></div>
        <div class="passage-text">${wordify(p.content)}</div>
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
      <div class="transcript" hidden>${wordify(s.transcript)}</div>
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
      return `<div class="question"><div class="q-text"><span class="q-no">${label}</span><span>${wordify(q.text)}</span></div><div class="q-options">${buttons}</div><div class="q-feedback-slot" data-feedback="${qpath}"></div></div>`;
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
      return `<div class="question"><div class="q-text"><span class="q-no">${label}</span><span>${wordButton}${wordify(q.text)}</span></div><div class="q-options">${options}</div><div class="q-feedback-slot" data-feedback="${qpath}"></div></div>`;
    }

    if (q.type === "table-completion") {
      const cells = (q.gaps || []).map((gap, gi) => {
        const qpath = `${base}:g${gi}`;
        if (!gap.blank) return `<span style="color:var(--muted)">${esc(gap.text)}</span>`;
        state.answerMap[qpath] = { ...shared, type: "text", answer: gap.answer, accepted: [gap.answer] };
        return `<span>${esc(gap.text)} <input class="q-input" data-qpath="${qpath}" /><span class="q-feedback-slot inline" data-feedback="${qpath}"></span></span>`;
      }).join(" <span style=\"color:var(--line)\">·</span> ");
      return `<div class="question"><div class="q-text"><span class="q-no">${label}</span><span>${wordify(q.text)}</span></div><div style="font-size:13px;line-height:2">${cells}</div></div>`;
    }

    // short-answer and sentence-completion fall here
    const qpath = `${base}`;
    state.answerMap[qpath] = { ...shared, type: "text", answer: q.answer, accepted: q.accepted || [] };
    return `<div class="question"><div class="q-text"><span class="q-no">${label}</span><span>${wordify(q.text)}</span></div><input class="q-input" data-qpath="${qpath}" /><div class="q-feedback-slot" data-feedback="${qpath}"></div></div>`;
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
    prefetchWords((test.questions || []).slice(0, 12).map((q) => q.word));
    if (test.questions && test.questions[0] && test.questions[0].word) ensureDictionary(test.questions[0].word).catch(() => {});
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
      <div class="task-figure"><img src="${esc(task.image)}" alt="${esc(task.title)}" loading="lazy" />${task.figure ? `<p class="figure-desc">${wordify(task.figure)}</p>` : ""}</div>` : "";
    return `
      <div class="writing-grid">
        <section class="panel task-panel">
          <h3>${esc(task.title)}</h3>
          <div class="tag ${task.type === "task1" ? "teal" : "gold"}" style="margin-bottom:12px">${esc(task.time)} · 至少 ${task.minWords} 词</div>
          <div class="task-prompt">${wordify(task.prompt)}</div>
          ${figure}
        </section>
        <section class="panel task-panel write-area">
          <textarea data-writing-id="${esc(test.id)}" data-task-no="${task.number}" data-min="${task.minWords}" placeholder="在这里写下你的答案…">${esc(draft)}</textarea>
          <div class="write-meta"><span class="word-count" id="word-count">0 词</span><button class="btn teal" data-action="save-draft"><i data-lucide="save"></i>保存草稿</button></div>
        </section>
      </div>`;
  }

  function renderVocab() {
    const levels = ["A0", "A1", "A2", "B1", "B2", "C1"];
    const vocab = getLevelVocab(state.vocabLevel);
    if (!vocab.length) return `<div class="panel empty-state"><p>暂无词汇</p></div>`;
    const unitSize = 20;
    const unitCount = Math.max(1, Math.ceil(vocab.length / unitSize));
    state.vocabUnit = Math.min(Math.max(1, state.vocabUnit || 1), unitCount);
    if (state.vocabDeck.length === 0 || state.vocabDeckKey !== `${state.vocabLevel}:${state.vocabUnit}`) {
      resetVocabDeck();
    }
    const unitStart = (state.vocabUnit - 1) * unitSize;
    const unitWords = vocab.slice(unitStart, unitStart + unitSize);
    const unitKnown = unitWords.filter((item) => state.progress.vocab.known.includes(`${state.vocabLevel}:${item.w}`)).length;
    const idx = state.vocabDeck[Math.min(state.vocabIndex, state.vocabDeck.length - 1)];
    const card = vocab[idx];
    const prefetchList = [];
    for (let i = 0; i < Math.min(7, state.vocabDeck.length); i += 1) {
      const next = vocab[state.vocabDeck[(state.vocabIndex + i) % state.vocabDeck.length]];
      if (next) prefetchList.push(next.w);
    }
    prefetchWords(prefetchList);
    ensureDictionary(card.w).catch(() => {});
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
      <div class="unit-bar reveal">
        <button class="btn ghost" data-action="vocab-unit-prev" ${state.vocabUnit <= 1 ? "disabled" : ""}><i data-lucide="chevron-left"></i>上一单元</button>
        <div><strong>Unit ${state.vocabUnit}</strong><span>${unitStart + 1}–${unitStart + unitWords.length} · 已掌握 ${unitKnown}/${unitWords.length}</span></div>
        <button class="btn ghost" data-action="vocab-unit-next" ${state.vocabUnit >= unitCount ? "disabled" : ""}>下一单元<i data-lucide="chevron-right"></i></button>
      </div>
      <div class="card-deck reveal">
        <div class="flash-card" data-action="flip-card">
          <div class="flash-face front">
            <span class="flash-pos">${esc(state.vocabLevel)} ${card.pos ? "· " + esc(card.pos) : ""}</span>
            <div class="flash-word speakable" data-action="speak-word" data-word="${esc(card.w)}" title="点击听发音">${esc(card.w)} <i data-lucide="volume-2"></i></div>
            ${card.p ? `<div class="flash-phonetic">${esc(card.p)}</div>` : ""}
            <div class="flash-front-hint">先回忆意思，再翻转查看释义和例句</div>
          </div>
          <div class="flash-face back">
            <div class="flash-back-word">${esc(card.w)}</div>
            ${card.p ? `<div class="flash-phonetic">${esc(card.p)}</div>` : ""}
            <div class="flash-zh">${esc(card.zh)}</div>
            <div class="flash-section-label">英文释义</div>
            <div class="flash-def">${wordify(card.en)}</div>
            <div class="flash-section-label">例句</div>
            <div class="flash-example">${card.ex ? wordify(card.ex) : "暂无例句，可以点单词查词后自己造句。"}</div>
            <div class="flash-example-tip">例句里的英文单词也可以点击查翻译</div>
          </div>
        </div>
        <div class="deck-actions">
          <button class="btn ghost" data-action="flip-card"><i data-lucide="refresh-cw"></i>翻转卡片</button>
          <button class="btn ghost" data-action="vocab-again"><i data-lucide="rotate-ccw"></i>还不熟</button>
          <button class="btn primary" data-action="vocab-known"><i data-lucide="check"></i>认识了</button>
        </div>
        <div class="deck-progress">${state.vocabLevel} · Unit ${state.vocabUnit} · ${pos} / ${total} · 单词可点击发音</div>
      </div>`;
  }

  function renderSpeaking() {
    const levels = ["A0", "A1", "A2", "B1", "B2", "C1", "IELTS"];
    const staged = BANK.staged || {};
    const level = state.speakingLevel;
    let items = [];
    if (level === "IELTS") {
      items = BANK.speaking || [];
    } else {
      const effectiveLevel = level === "A0" ? "A1" : level;
      const set = (staged.speaking || []).find((s) => s.level === effectiveLevel);
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
        <h3 class="speaking-question speakable" data-action="speak-passage" data-text="${esc(item.question)}" title="点击听问题">${wordify(item.question)} <i data-lucide="volume-2"></i></h3>
        <div class="speaking-actions">
          <button class="btn primary" data-action="speak-next"><i data-lucide="shuffle"></i>下一题</button>
          <button class="btn ghost" data-action="speak-reveal"><i data-lucide="eye"></i>查看参考回答</button>
          <span class="timer" data-action="speak-timer" data-seconds="0"><i data-lucide="timer"></i>准备 1:00</span>
        </div>
        <div class="model-answer" data-model hidden>
          <h4>参考回答</h4>
          <p>${wordify(item.answer)}</p>
        </div>
      </div>`;
  }

  function renderAbout() {
    const sources = BANK.sources || {};
    const meta = BANK.vocabMeta || {};
    const updatedAt = meta.updatedAt ? new Date(meta.updatedAt).toLocaleDateString("zh-CN") : "未知";
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
            <tr><td>例句</td><td><code>Tatoeba</code></td><td>CC BY 2.0 FR</td></tr>
          </tbody>
        </table>
        <div class="vocab-update-box">
          <div><strong>分级词库版本</strong><span>最近更新：${esc(updatedAt)} · GitHub Actions 每月自动检查一次</span></div>
          <button class="btn teal" data-action="check-vocab-update"><i data-lucide="refresh-cw"></i>检查 GitHub 更新</button>
        </div>
        <div class="about-support">
          <img src="assets/vega-support.jpg" alt="Vega 赞赏码" />
          <div><strong>作者：Vega</strong><p>如果你觉得可以 可以支持一下我的作品。未经授权禁止外传，感谢支持。</p><button class="btn primary" data-action="open-support"><i data-lucide="heart"></i>打开赞赏码</button></div>
        </div>
        <p style="margin-top:18px;color:var(--muted);font-size:12px">学习记录仅保存在你的浏览器 localStorage，不会上传到任何服务器。</p>
      </div>`;
  }

  async function checkVocabUpdate() {
    const localMeta = BANK.vocabMeta || {};
    let owner = "nma82439668hhf";
    let repo = "ielts-passport";
    if (/\.github\.io$/i.test(location.hostname)) {
      owner = location.hostname.split(".")[0];
      repo = location.pathname.split("/").filter(Boolean)[0] || "ielts-passport";
    }
    const urls = [
      `https://cdn.jsdelivr.net/gh/${owner}/${repo}@main/data/vocab-meta.js`,
      `https://raw.githubusercontent.com/${owner}/${repo}/main/data/vocab-meta.js`,
    ];
    try {
      let text = "";
      for (const url of urls) {
        try {
          const res = await fetch(url, { cache: "no-store" });
          if (res.ok) {
            text = await res.text();
            break;
          }
        } catch (e) {
          /* try the next mirror */
        }
      }
      if (!text) throw new Error("update check failed");
      const match = text.match(/vocabMeta\s*=\s*({[\s\S]*?});/);
      if (!match) throw new Error("invalid meta");
      const remote = JSON.parse(match[1]);
      if (remote.updatedAt && remote.updatedAt !== localMeta.updatedAt) {
        toast("发现新的词库版本，刷新页面即可加载更新");
      } else {
        toast("当前词库已经是最新版本");
      }
    } catch (e) {
      toast("暂时无法连接 GitHub，请稍后再试");
    }
  }

  /* Interaction handlers */
  async function handleAction(e) {
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
    if (action === "set-challenge-level") {
      state.challengeLevel = target.dataset.level;
      render();
      return;
    }
    if (action === "set-exam-level") {
      state.examLevel = target.dataset.level;
      render();
      return;
    }
    if (action === "check-vocab-update") {
      checkVocabUpdate();
      return;
    }
    if (action === "account-mode") {
      state.account.formMode = target.dataset.mode === "login" ? "login" : "register";
      render();
      return;
    }
    if (action === "set-register-storage") {
      state.account.registerStorage = target.dataset.storage === "local" ? "local" : "cloud";
      $$(".storage-tabs button").forEach((btn) => btn.classList.toggle("is-active", btn.dataset.storage === state.account.registerStorage));
      const submit = $("[data-action=account-submit]");
      if (submit) {
        const isRegister = state.account.formMode !== "login";
        const cloudSelected = state.account.registerStorage === "cloud";
        submit.innerHTML = `<i data-lucide="${isRegister ? "user-plus" : "log-in"}"></i>${isRegister ? (cloudSelected ? "注册云端账户" : "注册本机账户") : (cloudSelected ? "登录云端账户" : "登录本机账户")}`;
        refreshIcons();
      }
      return;
    }
    if (action === "account-submit") {
      const email = ($("#account-email") ? $("#account-email").value : "").trim().toLowerCase();
      const password = $("#account-password") ? $("#account-password").value : "";
      const name = $("#account-name") ? $("#account-name").value.trim() : "";
      if (!email || !password) {
        toast("请填写邮箱和密码");
        return;
      }
      const isRegister = state.account.formMode !== "login";
      if (state.account.registerStorage === "cloud") {
        const settingsUrl = $("#supabase-url-settings");
        const settingsKey = $("#supabase-anon-key-settings");
        if (settingsUrl || settingsKey) {
          state.account.cloud = normalizeCloudConfig({
            url: settingsUrl ? settingsUrl.value : state.account.cloud.url,
            anonKey: settingsKey ? settingsKey.value : state.account.cloud.anonKey,
          });
          saveCloudSettings();
        }
        if (!cloudConfigured()) {
          toast("云端服务尚未配置，请联系管理员或先选择“仅本机”");
          return;
        }
        try {
          if (isRegister) await supabaseSignUp(email, password);
          else await supabaseSignIn(email, password);
        } catch (e) {
          toast(e.message || (isRegister ? "云端注册失败，请检查 Supabase 配置" : "云端登录失败"));
        }
      } else if (isRegister) {
        registerLocal(email, password, name);
      } else {
        loginLocal(email, password);
      }
      return;
    }
    if (action === "social-login") {
      startSocialLogin(target.dataset.provider);
      return;
    }
    if (action === "save-cloud-settings") {
      const urlInput = $("#supabase-url") || $("#supabase-url-settings");
      const keyInput = $("#supabase-anon-key") || $("#supabase-anon-key-settings");
      state.account.cloud = normalizeCloudConfig({
        url: urlInput ? urlInput.value : state.account.cloud.url,
        anonKey: keyInput ? keyInput.value : state.account.cloud.anonKey,
      });
      saveCloudSettings();
      render();
      toast(cloudConfigured() ? "云端服务已保存到本机" : "请填写完整的 Supabase URL 和 Anon Key");
      return;
    }
    if (action === "save-oauth-config") {
      if (!isAdminUser()) return;
      state.config.oauth.wechatAppId = ($("#wechat-app-id") ? $("#wechat-app-id").value : "").trim();
      state.config.oauth.qqAppId = ($("#qq-app-id") ? $("#qq-app-id").value : "").trim();
      state.config.oauth.workerUrl = ($("#oauth-worker-url") ? $("#oauth-worker-url").value : "").trim();
      saveAppConfig();
      toast("社交登录配置已保存");
      return;
    }
    if (action === "cloud-signup" || action === "cloud-signin") {
      const email = ($("#account-email") ? $("#account-email").value : "").trim().toLowerCase();
      const password = $("#account-password") ? $("#account-password").value : "";
      if (!email || password.length < 6) {
        toast("请填写邮箱和至少 6 位密码");
        return;
      }
      const urlInput = $("#supabase-url") || $("#supabase-url-settings");
      const keyInput = $("#supabase-anon-key") || $("#supabase-anon-key-settings");
      state.account.cloud.url = (urlInput ? urlInput.value : state.account.cloud.url).trim();
      state.account.cloud.anonKey = (keyInput ? keyInput.value : state.account.cloud.anonKey).trim();
      saveCloudSettings();
      try {
        if (action === "cloud-signup") await supabaseSignUp(email, password);
        else await supabaseSignIn(email, password);
      } catch (e) {
        toast(e.message || "云端账户操作失败");
      }
      return;
    }
    if (action === "logout-account") {
      logoutAccount();
      return;
    }
    if (action === "cloud-sync") {
      syncProgressToCloud();
      return;
    }
    if (action === "export-progress") {
      exportProgress();
      return;
    }
    if (action === "install-app") {
      installApp();
      return;
    }
    if (action === "open-support") {
      openSupport();
      return;
    }
    if (action === "check-app-update") {
      if (window.IELTS_HYBRID_UPDATE && window.IELTS_HYBRID_UPDATE.check) window.IELTS_HYBRID_UPDATE.check(true);
      else toast("当前版本未启用混合更新");
      return;
    }
    if (action === "admin-toggle-login") {
      if (!isAdminUser()) return;
      state.config.requireLogin = !state.config.requireLogin;
      saveAppConfig();
      render();
      return;
    }
    if (action === "admin-toggle-register") {
      if (!isAdminUser()) return;
      state.config.allowRegistration = !state.config.allowRegistration;
      saveAppConfig();
      render();
      return;
    }
    if (action === "admin-export-accounts") {
      if (!isAdminUser()) return;
      const payload = JSON.stringify(Object.values(localAccounts()).map((a) => ({ email: a.email, name: a.name, createdAt: a.createdAt })), null, 2);
      const blob = new Blob([payload], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `ielts-passport-users-${todayKey()}.json`;
      link.click();
      URL.revokeObjectURL(url);
      return;
    }
    if (action === "set-ai-scenario") {
      startAiScenario(target.dataset.id);
      return;
    }
    if (action === "ai-send") {
      const input = $("#ai-input");
      if (input) {
        const value = input.value;
        input.value = "";
        sendAiMessage(value);
      }
      return;
    }
    if (action === "ai-toggle-mic") {
      if (state.ai.listening) stopAiListening(true);
      else startAiListening();
      return;
    }
    if (action === "ai-start-realtime") {
      state.ai.autoMode = true;
      state.ai.recognitionPaused = false;
      render();
      startAiListening();
      toast("实时语音对话已开始，请说英语");
      return;
    }
    if (action === "ai-stop-realtime") {
      stopAiListening(true);
      render();
      toast("实时语音对话已停止");
      return;
    }
    if (action === "ai-toggle-auto") {
      state.ai.autoMode = !state.ai.autoMode;
      toast(state.ai.autoMode ? "自动对话已开启，说完 AI 会继续听" : "自动对话已关闭");
      render();
      if (state.ai.autoMode && !state.ai.listening) startAiListening();
      return;
    }
    if (action === "ai-reset") {
      startAiScenario(state.ai.scenario);
      return;
    }
    if (action === "ai-hint") {
      const scenario = AI_SCENARIOS[state.ai.scenario];
      const step = scenario ? scenario.steps[Math.min(state.ai.stepIndex, scenario.steps.length - 1)] : null;
      state.ai.messages.push({ role: "ai", text: step ? step.ai : AI_FREE_PROMPTS[0], feedback: step ? `提示：${step.hint}` : "试着用完整句子回答。 " });
      render();
      return;
    }
    if (action === "ai-speak") {
      const message = state.ai.messages[Number(target.dataset.index)];
      if (message) speakText(message.text, 0.82);
      return;
    }
    if (action === "save-ai-settings") {
      state.ai.settings.mode = $("#ai-mode") ? $("#ai-mode").value : "builtin";
      state.ai.settings.baseUrl = $("#ai-base-url") ? $("#ai-base-url").value.trim() : state.ai.settings.baseUrl;
      state.ai.settings.model = $("#ai-model") ? $("#ai-model").value.trim() : state.ai.settings.model;
      state.ai.settings.apiKey = $("#ai-key") ? $("#ai-key").value.trim() : "";
      saveAiSettings();
      toast("AI 设置已保存在本机");
      return;
    }
    if (action === "toggle-voice") {
      state.settings.voiceEnabled = !state.settings.voiceEnabled;
      saveUserSettings();
      render();
      return;
    }
    if (action === "set-library-tab") {
      state.libraryTab = target.dataset.tab;
      state.libraryItemId = "";
      render();
      return;
    }
    if (action === "open-library-item") {
      state.libraryItemId = target.dataset.id;
      render();
      return;
    }
    if (action === "close-library-item") {
      state.libraryItemId = "";
      render();
      return;
    }
    if (action === "speak-library-item") {
      const item = (BANK.library && BANK.library[state.libraryTab] || []).find((entry) => entry.id === state.libraryItemId);
      if (item) speakText(item.text || item.prompt || "", state.settings.rate);
      return;
    }
    if (action === "library-next") {
      const items = (BANK.library && BANK.library[state.libraryTab]) || [];
      const index = items.findIndex((item) => item.id === state.libraryItemId);
      state.libraryItemId = items[(index + 1) % items.length] ? items[(index + 1) % items.length].id : "";
      render();
      return;
    }
    if (action === "open-reading") {
      setView("reading", target.dataset.id);
      return;
    }
    if (action === "toggle-encourage") {
      state.settings.autoEncourage = !state.settings.autoEncourage;
      saveUserSettings();
      render();
      return;
    }
    if (action === "toggle-compat-setting") {
      state.ttsCompat = !state.ttsCompat;
      state.settings.ttsCompat = state.ttsCompat;
      saveUserSettings();
      render();
      return;
    }
    if (action === "toggle-lookup-setting") {
      state.lookupEnabled = !state.lookupEnabled;
      saveUserSettings();
      const btn = $("#lookup-toggle");
      if (btn) btn.classList.toggle("is-active", state.lookupEnabled);
      if (!state.lookupEnabled) hideWordPopover();
      render();
      return;
    }
    if (action === "save-settings") {
      state.settings.voiceURI = $("#voice-select") ? $("#voice-select").value : "";
      state.settings.rate = $("#voice-rate") ? Number($("#voice-rate").value) : state.settings.rate;
      state.settings.ttsCompat = state.ttsCompat;
      saveUserSettings();
      toast("设置已保存");
      render();
      return;
    }
    if (action === "test-sound") {
      speakText("Hello. This is your English learning voice.", state.settings.rate);
      return;
    }
    if (action === "start-review") {
      startReviewSession();
      return;
    }
    if (action === "remove-wrong") {
      const id = target.dataset.id;
      state.progress.wrongAnswers = (state.progress.wrongAnswers || []).filter((item) => item.id !== id);
      save();
      render();
      return;
    }
    if (action === "clear-wrong") {
      state.progress.wrongAnswers = [];
      save();
      render();
      return;
    }
    if (action === "toggle-tts-compat") {
      state.ttsCompat = !state.ttsCompat;
      saveTtsSettings();
      const btn = $("#tts-compat");
      if (btn) btn.classList.toggle("is-active", state.ttsCompat);
      toast(state.ttsCompat ? "兼容朗读已开启，将使用在线 MP3 播放" : "兼容朗读已关闭，将优先使用系统语音");
      return;
    }
    if (action === "start-challenge") {
      startSession("challenge", target.dataset.type, target.dataset.level || state.challengeLevel);
      return;
    }
    if (action === "start-mock") {
      startSession("mock", "mixed", target.dataset.level || state.examLevel);
      return;
    }
    if (action === "submit-session") {
      submitSession();
      return;
    }
    if (action === "exit-session") {
      stopSessionTimer();
      state.session = null;
      setView("home");
      return;
    }
    if (action === "retry-session") {
      const session = state.session;
      if (session) startSession(session.kind, session.type, session.level);
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
    if (action === "speak-reading-passage") {
      const index = Number(target.dataset.index);
      const passage = state.currentTest && state.currentTest.passages ? state.currentTest.passages[index] : null;
      if (passage) speakText(passage.content, 0.82);
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
    if (action === "lookup-word") {
      if (!state.lookupEnabled) return;
      showWordPopover(target.dataset.word, target);
      return;
    }
    if (action === "speak-passage") {
      speakText(target.dataset.text, 0.82);
      return;
    }
    if (action === "set-vocab-level") {
      state.vocabLevel = target.dataset.level;
      state.vocabUnit = 1;
      resetVocabDeck();
      render();
      return;
    }
    if (action === "vocab-unit-prev") {
      state.vocabUnit = Math.max(1, state.vocabUnit - 1);
      resetVocabDeck();
      render();
      return;
    }
    if (action === "vocab-unit-next") {
      const vocab = getLevelVocab(state.vocabLevel);
      state.vocabUnit = Math.min(Math.ceil(vocab.length / 20), state.vocabUnit + 1);
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
    const total = Object.keys(state.answerMap).length;
    const answered = $$("[data-qpath].selected, [data-qpath].q-input").filter((el) => {
      if (el.classList.contains("selected")) return true;
      return el.value && el.value.trim() !== "";
    }).length;
    const sessionEl = $("#session-progress");
    if (sessionEl) sessionEl.innerHTML = `已答 <strong>${Math.min(answered, total)}</strong> / ${total} 题`;
    const scoreEl = $("#live-score");
    if (scoreEl) scoreEl.innerHTML = `已答 <strong>${Math.min(answered, total)}</strong> / ${total} 题`;
  }

  function checkAnswers() {
    if (state.currentTest && state.currentTest.checked) {
      toast("已核对过答案，请进入下一题");
      return;
    }
    let correct = 0;
    let total = 0;
    const statSkill = state.currentTest.statSkill || (state.currentTest.skill === "reading"
      ? "reading"
      : state.currentTest.skill === "listening"
        ? "listening"
        : state.currentTest.skill === "writing"
          ? "writing"
          : "vocab");

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
      if (selected && state.currentTest.skill !== "review") {
        const wrongId = `${statSkill}:${state.currentTest.id}:${qpath}`;
        const wrongList = state.progress.wrongAnswers || [];
        if (!ok) {
          const record = {
            id: wrongId,
            skill: statSkill,
            testId: state.currentTest.id,
            qpath,
            question: (meta.question || "").slice(0, 800),
            answer: meta.answer || "",
            accepted: meta.accepted || [],
            options: meta.options || [],
            type: meta.type,
            context: (meta.context || "").slice(0, 5000),
            explanation: meta.explain || `正确答案是：${meta.answer || ""}`,
            selected,
            timestamp: Date.now(),
          };
          const existing = wrongList.findIndex((item) => item.id === wrongId);
          if (existing >= 0) wrongList[existing] = record;
          else wrongList.push(record);
          state.progress.wrongAnswers = wrongList.slice(-200);
        } else {
          state.progress.wrongAnswers = wrongList.filter((item) => item.id !== wrongId);
        }
      }
    });

    const score = total ? Math.round((correct / total) * 100) : 0;
    const stat = state.progress.stats[statSkill];
    stat.attempted += total;
    stat.correct += correct;
    state.progress.stats[statSkill] = stat;
    state.progress.lastScore[`${statSkill}:${state.currentTest.id}`] = score;
    state.currentTest.checked = true;
    touchToday();
    recordDailyQuestions(total);
    recordDailyTest();
    addXp(correct * 10 + 15);
    state.progress.player.estimatedBand = estimateBand();
    save();

    const scoreEl = $("#live-score");
    if (scoreEl) scoreEl.innerHTML = `得分 <strong>${correct}</strong> / ${total} · ${score}%`;
    renderTarget();
    toast(total ? `核对完成：${correct}/${total} 题正确` : "没有可核对的答案");
    return { correct, total, score };
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
    const daily = ensureToday();
    if (!daily.wordsSeen.includes(key)) {
      daily.wordsSeen.push(key);
      recordDailyWords(1);
    }
    addXp(known ? 10 : 2);
    if (known && !state.progress.vocab.known.includes(key)) {
      state.progress.vocab.known.push(key);
    }
    const unitStart = (state.vocabUnit - 1) * 20;
    const unitWords = vocab.slice(unitStart, unitStart + 20);
    const unitComplete = unitWords.length > 0 && unitWords.every((item) => state.progress.vocab.known.includes(`${state.vocabLevel}:${item.w}`));
    const completedUnit = state.progress.vocabUnits[state.vocabLevel] || 0;
    if (unitComplete && completedUnit < state.vocabUnit) {
      state.progress.vocabUnits[state.vocabLevel] = state.vocabUnit;
      playEncouragement();
      toast(`Unit ${state.vocabUnit} 完成，继续保持！`);
    }
    if (!known) {
      const [item] = state.vocabDeck.splice(state.vocabIndex, 1);
      state.vocabDeck.push(item);
    } else {
      state.vocabIndex = (state.vocabIndex + 1) % state.vocabDeck.length;
    }
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
    const prefetchFromEvent = (e) => {
      const el = e.target.closest && e.target.closest("[data-action=speak-word], [data-action=lookup-word]");
      if (!el || !el.dataset.word) return;
      ensureDictionary(el.dataset.word).catch(() => {});
      if (el.dataset.action === "speak-word") preloadWord(el.dataset.word);
    };
    $("#view-root").addEventListener("pointerover", prefetchFromEvent);
    $("#view-root").addEventListener("focusin", prefetchFromEvent);
    $("#view-root").addEventListener("touchstart", prefetchFromEvent, { passive: true });
    $("#view-root").addEventListener("input", (e) => {
      if (e.target.matches("[data-writing-id]")) updateWordCount();
      if (e.target.matches("[data-qpath]")) updateLiveScore();
    });
    $("#view-root").addEventListener("keydown", (e) => {
      if (e.target.id === "ai-input" && e.key === "Enter") {
        e.preventDefault();
        const input = $("#ai-input");
        const value = input.value;
        input.value = "";
        sendAiMessage(value);
      }
      if ((e.target.id === "account-email" || e.target.id === "account-password" || e.target.id === "account-name") && e.key === "Enter") {
        e.preventDefault();
        const button = $("[data-action=account-submit]");
        if (button) button.click();
      }
    });
    $("#view-root").addEventListener("change", (e) => {
      if (e.target.id === "import-progress" && e.target.files && e.target.files[0]) importProgressFile(e.target.files[0]);
    });
    $("#lookup-toggle").addEventListener("click", () => {
      state.lookupEnabled = !state.lookupEnabled;
      $("#lookup-toggle").classList.toggle("is-active", state.lookupEnabled);
      toast(state.lookupEnabled ? "点词讲解已开启" : "点词讲解已关闭");
      if (!state.lookupEnabled) hideWordPopover();
    });
    $("#tts-compat").addEventListener("click", () => {
      state.ttsCompat = !state.ttsCompat;
      saveTtsSettings();
      $("#tts-compat").classList.toggle("is-active", state.ttsCompat);
      if (!state.ttsCompat) {
        stopSpeechAudio();
        $("#compat-audio-bar").hidden = true;
      }
      toast(state.ttsCompat ? "兼容朗读已开启，将使用在线 MP3 播放" : "兼容朗读已关闭，将优先使用系统语音");
    });
    $("#compat-audio-close").addEventListener("click", () => {
      stopSpeechAudio();
      $("#compat-audio-bar").hidden = true;
    });
    $("#install-app").addEventListener("click", installApp);
    $("#open-support").addEventListener("click", openSupport);
    $("#support-close").addEventListener("click", closeSupport);
    $("#support-modal").addEventListener("click", (e) => {
      if (e.target.id === "support-modal") closeSupport();
    });
    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape") closeSupport();
    });
    $("#pop-close").addEventListener("click", hideWordPopover);
    $("#pop-speak").addEventListener("click", () => speakWord(currentPopoverWord, $("#pop-speak")));
    document.addEventListener("mousedown", (e) => {
      const pop = $("#word-popover");
      if (!pop || pop.hidden) return;
      if (!pop.contains(e.target) && !e.target.closest(".lookup-word")) hideWordPopover();
    });
    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape") hideWordPopover();
    });
    window.addEventListener("scroll", () => {
      const pop = $("#word-popover");
      if (pop && !pop.hidden && currentPopoverAnchor) positionWordPopover(currentPopoverAnchor);
    }, { passive: true });
    $$(".nav-item").forEach((btn) => {
      btn.addEventListener("click", () => {
        if (state.view === "session" && btn.dataset.view !== "session") stopSessionTimer();
        if (state.view === "ai" && btn.dataset.view !== "ai") stopAiListening(true);
        setView(btn.dataset.view);
      });
    });
    document.addEventListener("click", (e) => {
      const btn = e.target.closest && e.target.closest(".mobile-bottom-nav button");
      if (!btn) return;
      if (state.view === "session" && btn.dataset.view !== "session") stopSessionTimer();
      if (state.view === "ai" && btn.dataset.view !== "ai") stopAiListening(true);
      setView(btn.dataset.view);
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
    window.addEventListener("beforeinstallprompt", (e) => {
      e.preventDefault();
      state.account.installPrompt = e;
      const button = $("#install-app");
      if (button) button.hidden = false;
    });
    window.addEventListener("appinstalled", () => {
      state.account.installPrompt = null;
      const button = $("#install-app");
      if (button) button.hidden = true;
      toast("App 版本安装完成");
    });
  }

  function init() {
    loadAiSettings();
    loadTtsSettings();
    loadUserSettings();
    loadAppConfig();
    loadAccountSession();
    handleOAuthRedirect();
    if (state.account.user) switchAccountProgress(state.account.user);
    if (state.config.requireLogin && !state.account.user) state.view = "account";
    autoEnableCompatIfNeeded();
    bindEvents();
    const ttsBtn = $("#tts-compat");
    if (ttsBtn) ttsBtn.classList.toggle("is-active", state.ttsCompat);
    const lookupBtn = $("#lookup-toggle");
    if (lookupBtn) lookupBtn.classList.toggle("is-active", state.lookupEnabled);
    if ("serviceWorker" in navigator && /^https?:$/.test(location.protocol)) {
      navigator.serviceWorker.register("sw.js").catch(() => {});
    }
    renderTarget();
    render();
  }

  init();
})();
