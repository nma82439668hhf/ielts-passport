const JSON_HEADERS = {
  "Content-Type": "application/json; charset=utf-8",
  "Cache-Control": "no-store",
};

function cors(env) {
  return {
    "Access-Control-Allow-Origin": env.SITE_URL || "*",
    "Access-Control-Allow-Methods": "GET,OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
  };
}

function json(data, status, env) {
  return new Response(JSON.stringify(data), { status, headers: { ...JSON_HEADERS, ...cors(env) } });
}

async function fetchJson(url) {
  const res = await fetch(url);
  const text = await res.text();
  try {
    return JSON.parse(text.replace(/^callback\(/, "").replace(/\);?$/, ""));
  } catch (e) {
    return { raw: text };
  }
}

async function wechat(code, redirectUri, env) {
  const tokenUrl = `https://api.weixin.qq.com/sns/oauth2/access_token?appid=${encodeURIComponent(env.WECHAT_APP_ID)}&secret=${encodeURIComponent(env.WECHAT_APP_SECRET)}&code=${encodeURIComponent(code)}&grant_type=authorization_code`;
  const token = await fetchJson(tokenUrl);
  if (!token.access_token || !token.openid) throw new Error(token.errmsg || "WeChat token exchange failed");
  const userUrl = `https://api.weixin.qq.com/sns/userinfo?access_token=${encodeURIComponent(token.access_token)}&openid=${encodeURIComponent(token.openid)}&lang=zh_CN`;
  const user = await fetchJson(userUrl);
  return {
    provider: "wechat",
    openid: user.openid || token.openid,
    unionid: user.unionid || token.unionid || "",
    nickname: user.nickname || "微信用户",
    avatar: user.headimgurl || "",
  };
}

async function qq(code, redirectUri, env) {
  const tokenUrl = `https://graph.qq.com/oauth2.0/token?grant_type=authorization_code&client_id=${encodeURIComponent(env.QQ_APP_ID)}&client_secret=${encodeURIComponent(env.QQ_APP_SECRET)}&code=${encodeURIComponent(code)}&redirect_uri=${encodeURIComponent(redirectUri)}&fmt=json`;
  const token = await fetchJson(tokenUrl);
  if (!token.access_token) throw new Error(token.error_description || token.error || "QQ token exchange failed");
  const me = await fetchJson(`https://graph.qq.com/oauth2.0/me?access_token=${encodeURIComponent(token.access_token)}&fmt=json`);
  if (!me.openid) throw new Error(me.error_description || me.error || "QQ openid lookup failed");
  const user = await fetchJson(`https://graph.qq.com/user/get_user_info?access_token=${encodeURIComponent(token.access_token)}&oauth_consumer_key=${encodeURIComponent(env.QQ_APP_ID)}&openid=${encodeURIComponent(me.openid)}&fmt=json`);
  return {
    provider: "qq",
    openid: me.openid,
    nickname: user.nickname || "QQ 用户",
    avatar: user.figureurl_qq_2 || user.figureurl_2 || user.figureurl_1 || "",
  };
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    if (request.method === "OPTIONS") return new Response(null, { headers: cors(env) });
    if (request.method !== "GET") return json({ error: "Method not allowed" }, 405, env);

    const match = url.pathname.match(/^\/oauth\/(wechat|qq)$/);
    if (!match) return json({ error: "Not found" }, 404, env);

    const provider = match[1];
    const code = url.searchParams.get("code");
    const redirectUri = url.searchParams.get("redirect_uri");
    if (!code || !redirectUri) return json({ error: "Missing code or redirect_uri" }, 400, env);

    try {
      const profile = provider === "wechat" ? await wechat(code, redirectUri, env) : await qq(code, redirectUri, env);
      return json(profile, 200, env);
    } catch (e) {
      return json({ error: e.message || "OAuth failed" }, 500, env);
    }
  },
};
