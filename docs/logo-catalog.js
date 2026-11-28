(()=>{'use strict';
const base=new URL('.',document.currentScript.src),bad=new Set();
const built={"AAPL":"stock-logos/builtin-AAPL.svg","MSFT":"stock-logos/builtin-MSFT.svg","NVDA":"stock-logos/builtin-NVDA.svg","GOOGL":"stock-logos/builtin-GOOGL.svg","TSLA":"stock-logos/builtin-TSLA.svg","AMZN":"stock-logos/builtin-AMZN.svg","AMD":"stock-logos/builtin-AMD.svg","INTC":"stock-logos/builtin-INTC.svg","AVGO":"stock-logos/builtin-AVGO.svg","META":"stock-logos/builtin-META.svg","NFLX":"stock-logos/builtin-NFLX.svg","UBER":"stock-logos/builtin-UBER.svg","CRM":"stock-logos/builtin-CRM.svg","PLTR":"stock-logos/builtin-PLTR.svg","QCOM":"stock-logos/builtin-QCOM.svg","RACE":"stock-logos/builtin-RACE.svg","BAC":"stock-logos/builtin-BAC.svg","V":"stock-logos/builtin-V.svg","MA":"stock-logos/builtin-MA.svg","SHEL":"stock-logos/builtin-SHEL.svg","KO":"stock-logos/builtin-KO.svg","MCD":"stock-logos/builtin-MCD.svg","WMT":"stock-logos/builtin-WMT.svg","SONY":"stock-logos/builtin-SONY.svg","SAP":"stock-logos/builtin-SAP.svg","CAT":"stock-logos/CAT-wordmark.png","CSCO":"stock-logos/builtin-CSCO.svg","TSM":"stock-logos/builtin-TSM.svg","JPM":"stock-logos/builtin-JPM.svg"};
function candidates(kind,sym,local){
 if(!/^[A-Z0-9][A-Z0-9.=-]{0,23}$/.test(sym))return [];
 if(kind!=='crypto'&&kind!=='stock')return [];
 const paths=kind==='crypto'?[window.NbuOriginalCrypto?.[sym],local]:[window.NbuLocalStocks?.[sym],local,built[sym]];
 return [...new Set(paths.filter(x=>typeof x==='string'&&new RegExp('^(?:\\./)?'+kind+'-logos/[A-Za-z0-9._-]+\\.(?:svg|png|jpg|webp|ico)$','i').test(x)).map(x=>new URL(x,base).href))].filter(x=>!bad.has(x));
}
function cryptoError(img){bad.add(img.src);const list=candidates('crypto',img.dataset.symbol,img.dataset.local||'');if(list.length){img.src=list[0];return;}const x=document.createElement('span');x.className='crypto-icon-fallback';x.textContent=img.dataset.symbol.charAt(0);x.style.background=img.dataset.color;x.setAttribute('aria-label',img.dataset.symbol);img.replaceWith(x);}
window.NbuLogos={candidates,cryptoError,fail:url=>bad.add(url)};})();
