# IELTS Passport

一个面向英语新手的雅思学习与练习网站：学习地图、A1–C1 分级词汇、听力 / 阅读 / 写作 / 口语题库，以及本机进度追踪。

## 本地运行

这是一个纯静态站点，直接打开 `index.html` 即可使用；也可以启动一个本地服务器：

```bash
python -m http.server 8080
```

然后访问 <http://localhost:8080>。

## 题库来源

- 阅读 / 听力 / 写作：`LuchoBazz/ielts-ai-dataset`，许可 `CC BY 4.0`
- 口语：`qwertyuiopasdfg/IELTs-Speaking-answer`，许可 `Apache 2.0`
- 分级词表：`anig1scur/CEFR-Vocabulary-List`，许可 `MIT`
- 中英释义：`skywind3000/ECDICT`，许可 `MIT`

## 分级内容

- A1–C1 词库：约 7000 个 CEFR 分级词条
- A1–C1 词汇测验：每级 60 道，共 300 道
- A1–C1 阅读、听力、写作、口语分级题
- 雅思真题源题库保留在 `IELTS` 阶段

词汇卡片支持点击单词或喇叭使用浏览器语音朗读。核对答案后，答错的题会显示正确答案、题型提示和原文线索。

数据文件位于 `data/`，音频与图表位于 `data/media/`。学习记录仅保存在浏览器 `localStorage`。

## 公开部署

仓库可部署到 GitHub Pages，站点文件位于仓库根目录。
