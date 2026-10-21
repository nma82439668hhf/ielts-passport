(function () {
  'use strict';
  const bank = window.IELTS_BANK = window.IELTS_BANK || {};
  const files = {
    learn: 'learn', vocabQuiz: 'vocab-quiz', staged: 'staged',
    library: 'library', grammar: 'grammar', reading: 'reading',
    listening: 'listening', writing: 'writing', speaking: 'speaking'
  };
  const pending = new Map();
  const levels=['A1','A2','B1','B2','C1'];
  for(const level of levels)files['vocab:'+level]='vocab/'+level;
  function ready(keys) { return keys.every(key => key==='vocabLevels'?levels.every(level=>!!bank.vocabLevels?.[level]):key.startsWith('vocab:')?!!bank.vocabLevels?.[key.slice(6)]:Object.prototype.hasOwnProperty.call(bank, key)); }
  function load(key) {
    if(key==='vocabLevels')return Promise.all(levels.map(level=>load('vocab:'+level)));
    if (!files[key]) return Promise.reject(new Error('Unknown question bank'));
    if (ready([key])) return Promise.resolve();
    if (pending.has(key)) return pending.get(key);
    const promise = new Promise((resolve, reject) => {
      const script = document.createElement('script');
      let timeout;
      const finish = error => {
        clearTimeout(timeout);
        script.onload = script.onerror = null;
        script.remove();
        if (error) reject(error); else resolve();
      };
      script.src = `data/${files[key]}.js`;
      script.onload = () => finish(ready([key]) ? null : new Error('Question bank unavailable'));
      script.onerror = () => finish(new Error('Question bank could not be loaded'));
      timeout = setTimeout(() => finish(new Error('Question bank loading timed out')), 30000);
      document.head.append(script);
    }).finally(() => pending.delete(key));
    pending.set(key, promise);
    return promise;
  }
  window.IELTSBankLoader = {ready, ensure: keys => Promise.all([...new Set(keys)].map(load))};
})();
