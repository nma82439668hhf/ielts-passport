const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const {resolveSite}=require('./site-path');
function buildVocabShards(site=resolveSite(),dataDir=path.join(site,'data')){
 const context={window:{}};vm.runInNewContext(fs.readFileSync(path.join(dataDir,'vocab-levels.js'),'utf8'),context);
 return Object.fromEntries(Object.entries(context.window.IELTS_BANK.vocabLevels).map(([level,items])=>[level,'window.IELTS_BANK = window.IELTS_BANK || {};\nwindow.IELTS_BANK.vocabLevels = window.IELTS_BANK.vocabLevels || {};\nwindow.IELTS_BANK.vocabLevels['+JSON.stringify(level)+'] = '+JSON.stringify(items)+';\n']));
}
function writeVocabShards(site=resolveSite(),dataDir=path.join(site,'data')){
 const dir=path.join(dataDir,'vocab');fs.mkdirSync(dir,{recursive:true});
 for(const [level,body] of Object.entries(buildVocabShards(site,dataDir)))fs.writeFileSync(path.join(dir,level+'.js'),body);
}
if(require.main===module){writeVocabShards();console.log('Generated CEFR vocabulary shards.');}
module.exports={buildVocabShards,writeVocabShards};
