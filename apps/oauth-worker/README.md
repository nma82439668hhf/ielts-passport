# WeChat / QQ OAuth Worker

This Cloudflare Worker securely exchanges WeChat and QQ authorization codes for user profile data. AppSecret values stay in Cloudflare environment variables and are never shipped to the browser.

## Deploy

```bash
cd apps/oauth-worker
npx wrangler login
npx wrangler secret put WECHAT_APP_ID
npx wrangler secret put WECHAT_APP_SECRET
npx wrangler secret put QQ_APP_ID
npx wrangler secret put QQ_APP_SECRET
npx wrangler deploy
```

Set `SITE_URL` in `wrangler.toml` to the website origin, for example `https://nma82439668hhf.github.io`.

## Provider setup

- WeChat Open Platform: create a Website Application, set the authorization callback domain to the GitHub Pages domain, and get the AppID/AppSecret.
- QQ Connect: create a Website Application, set the callback domain to the GitHub Pages domain, and get the AppID/AppKey.
- In the IELTS Passport admin panel, fill in the WeChat AppID, QQ AppID, and deployed Worker URL, then save.

The Worker endpoints are:

- `GET /oauth/wechat?code=...&redirect_uri=...`
- `GET /oauth/qq?code=...&redirect_uri=...`
