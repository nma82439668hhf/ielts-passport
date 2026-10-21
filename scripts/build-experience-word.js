const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');
const crypto=require('node:crypto');
const {resolveSite}=require('./site-path');
function buildExperienceWord(site=resolveSite()) {
 const source=fs.readFileSync(path.join(site,'data/vocab-levels.js'),'utf8'),sandbox={window:{}};
 vm.runInNewContext(source,sandbox);
 const items=sandbox.window.IELTS_BANK.vocabLevels.A1,index=items.findIndex(x=>x.w==='book'),word=items[index];
 if(!word||!word.zh.includes('书')||word.ex!=="That's Tom's book."||word.p!=='/buk/'||Math.floor(index/20)+1!==6)throw Error('Review the sample and static experience page against the updated source vocabulary');
 const sample={word:word.w,phonetic:word.p,meaning:'书；书籍',example:word.ex,level:'A1',unit:Math.floor(index/20)+1,source:{file:'data/vocab-levels.js',index,sha256:crypto.createHash('sha256').update(source).digest('hex')},question:'在这句话里，book 指的是什么？',options:['一本书','一把椅子','一个苹果'],correct:0,explanation:'book 在这句话中是名词，表示“书”。整句是“那是汤姆的书”。其他选项分别是 chair 和 apple。'};
 return '/* Extracted from the existing A1 vocabulary; regenerate with tools/build-experience-word.js. */\nwindow.IELTS_EXPERIENCE_WORD = '+JSON.stringify(sample)+';\n';
}
if(require.main===module){const target=path.join(resolveSite(),'experience-word.js');fs.writeFileSync(target,buildExperienceWord());console.log(target);}
module.exports={buildExperienceWord};
