const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const {resolveSite}=require('./site-path'),{buildVocabIndex}=require('./build-vocab-index'),{buildVocabShards}=require('./build-vocab-shards'),{buildExperienceWord}=require('./build-experience-word');
function checkBankArtifacts(site=resolveSite()){
 assert.equal(fs.readFileSync(path.join(site,'data/vocab-index.js'),'utf8'),buildVocabIndex(site),'Rebuild the home vocabulary index');
 for(const [level,body]of Object.entries(buildVocabShards(site)))assert.equal(fs.readFileSync(path.join(site,'data/vocab',level+'.js'),'utf8'),body,'Rebuild the '+level+' shard');
 assert.equal(fs.readFileSync(path.join(site,'experience-word.js'),'utf8'),buildExperienceWord(site),'Rebuild the experience sample');
 const html=fs.readFileSync(path.join(site,'experience.html'),'utf8');assert.match(html,/level=A1(?:&amp;|&)unit=6/);assert.match(html,/That's Tom's/);
 return {homeIndex:true,levelShards:5,experienceSample:true,staticDemoContract:true};
}
if(require.main===module)console.log(JSON.stringify(checkBankArtifacts()));
module.exports={checkBankArtifacts};
