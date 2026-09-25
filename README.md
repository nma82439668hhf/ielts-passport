# IELTS Passport

一个面向英语新手的雅思学习与练习网站：学习地图、高频词汇、听力 / 阅读 / 写作 / 口语题库，以及本机进度追踪。

## 本地运行

这是一个纯静态站点，直接打开 `index.html` 即可使用；也可以启动一个本地服务器：

```bash
python -m http.server 8080
```

然后访问 <http://localhost:8080>。

## 题库来源

- 阅读 / 听力 / 写作：`LuchoBazz/ielts-ai-dataset`，许可 `CC BY 4.0`
- 口语：`qwertyuiopasdfg/IELTs-Speaking-answer`，许可 `Apache 2.0`

数据文件位于 `data/`，音频与图表位于 `data/media/`。学习记录仅保存在浏览器 `localStorage`。

## 公开部署

仓库可部署到 GitHub Pages，站点文件位于仓库根目录。
