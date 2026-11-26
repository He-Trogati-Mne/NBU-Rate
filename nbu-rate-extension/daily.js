(() => {
  'use strict';
  const $ = id => document.getElementById(id);
  const words = {
    rates:['Курси','Rates'],convert:['Конвертер','Convert'],banks:['Банки','Banks'],amount:['Сума','Amount'],result:['Результат','Result'],swap:['⇄ Поміняти','⇄ Swap'],copy:['Копіювати','Copy'],multi:['Одразу в кількох валютах','Multiple currencies'],fullsite:['Більше інструментів на сайті','More tools on the website'],buy:['Купити валюту','Buy currency'],sell:['Продати валюту','Sell currency'],fee:['Додаткова комісія, %','Additional fee, %'],official:['Орієнтир НБУ','NBU reference'],comparison:['Порівняння банків','Bank comparison'],banknote:['ПриватБанк — курс публічного API; monobank — курс API банку. Фактичні умови картки можуть відрізнятися.','PrivatBank public API and monobank API rates. Actual card terms may differ.'],allbanks:['Усі банки на сайті','All banks on the website'],loading:['Завантаження курсів…','Loading rates…'],nodata:['Курс недоступний','Rate unavailable'],cached:['Кешовані дані','Cached data'],fetched:['Дані отримано','Fetched'],copied:['Скопійовано','Copied'],copyerror:['Не вдалося скопіювати','Copy failed'],best:['Вигідніше серед свіжих курсів','Best of fresh quotes'],difference:['Різниця між банками','Difference between banks'],invalid:['Введіть коректну суму та комісію','Enter a valid amount and fee'],estimate:['Розрахунок за курсом НБУ','NBU rate estimate'],compareNote:['Порівняння доступне для USD та EUR.','Comparison is available for USD and EUR.'],source:['Валюта списання','From currency'],target:['Валюта отримання','To currency'],currency:['Валюта','Currency']
  };
  Object.assign(words, {
    brandTitle:['Курс НБУ','NBU Rate'],brand:['Фінанси завжди під рукою','Finance at your fingertips'],chooseCurrency:['Виберіть валюту','Choose currency'],searchCurrency:['Код або назва валюти','Currency code or name'],nothing:['Валют не знайдено','No currencies found'],close:['Закрити','Close'],manualFee:['Умовна комісія, яку ви задаєте самостійно.','Hypothetical fee entered by you.'],fee:['Умовна комісія (вручну)','Hypothetical fee (manual)'],buyAmount:['Скільки валюти купуєте','Currency to buy'],sellAmount:['Скільки валюти продаєте','Currency to sell'],pay:['Потрібно сплатити','You pay'],receive:['Ви отримаєте','You receive'],extraPay:['Потрібно доплатити','Extra payment required'],base:['Без комісії','Before fee'],feeCost:['Комісія','Fee'],feeWarning:['Комісія перевищує суму продажу. Це умовний розрахунок, а не пропозиція банку.','Fee exceeds sale proceeds. This is a hypothetical calculation, not a bank offer.'],buyExplain:['Купівля іноземної валюти за гривні','Buy foreign currency using UAH'],sellExplain:['Продаж іноземної валюти за гривні','Sell foreign currency for UAH'],best:['Вигідніше','Better rate'],banknote:['Розрахунок за публічними курсами банків. Фактичні умови картки можуть відрізнятися.','Estimates using public bank rates. Actual card terms may differ.'],official:['За курсом НБУ, без комісії','NBU rate, before fee'],amount:['Ви вводите','You enter'],result:['Ви отримаєте','You receive']
  });
  let pickerTarget = null;
  let lang = 'uk', tab = 'rates', direction = 'buy';
  let nbu = null, banks = {}, loadGeneration = 0, lastResult = null;
  let desiredFrom = 'UAH', desiredTo = 'USD';
  const text = key => words[key]?.[lang === 'uk' ? 0 : 1] || key;
  const locale = () => lang === 'uk' ? 'uk-UA' : 'en-GB';
  const fmt = (n, max = 2) => Number.isFinite(n) ? new Intl.NumberFormat(locale(),{maximumFractionDigits:max}).format(n) : '—';
  const stamp = snap => snap?.at ? `${text(snap.stale?'cached':'fetched')}: ${new Date(snap.at).toLocaleString(locale(),{day:'2-digit',month:'2-digit',hour:'2-digit',minute:'2-digit'})}` : text('nodata');
  const amount = id => { const el = $(id), n = el.valueAsNumber; return el.validity.valid && Number.isFinite(n) && n >= 0 ? n : NaN; };
  const clamp = (n,min,max) => Math.min(max,Math.max(min,n));
  function syncFee(source='input', commit=false) {
    const number=$('bank-fee'), range=$('bank-fee-range');
    if(source==='range') number.value=range.value;
    else if(commit) number.value=String(Math.round(clamp(Number.isFinite(number.valueAsNumber)?number.valueAsNumber:0,0,200)*10)/10);
    if(Number.isFinite(number.valueAsNumber)) range.value=String(clamp(number.valueAsNumber,0,200));
    for(const b of $('fee-presets').querySelectorAll('button')) b.setAttribute('aria-pressed',String(Number(b.dataset.fee)===number.valueAsNumber));
  }
  function currencyName(code) {
    if(code==='UAH') return lang==='uk'?'Українська гривня':'Ukrainian hryvnia';
    if(code in METAL_COLORS) return t(code,lang);
    try { return new Intl.DisplayNames([locale()],{type:'currency'}).of(code)||code; } catch { return t(code,lang); }
  }
  function currencyFlag(code) {
    const span=el('span','picker-flag');
    if(code in METAL_COLORS){span.classList.add('picker-metal');span.innerHTML=flagHtml(code,21);return span;}
    const path=code==='UAH'?'ua':FLAG_CODES[code] || ({DZD:'dz',BDT:'bd',IDR:'id',IQD:'iq',IRR:'ir',LBP:'lb',PKR:'pk',SDG:'sd',VND:'vn'})[code];
    if(path){const img=el('img');img.src=`flags/${path}.png`;img.alt='';img.addEventListener('error',()=>{span.textContent=code.slice(0,2);});span.append(img);}else span.textContent=code.slice(0,2);
    return span;
  }
  function refreshPickerButtons() {
    for(const id of ['convert-from','convert-to','bank-currency']) {
      const select=$(id), button=$(`${id}-picker`); if(!button)continue;
      button.replaceChildren(currencyFlag(select.value),el('span','picker-code',select.value),el('span','picker-arrow'));
      button.setAttribute('aria-label',`${select.getAttribute('aria-label')}: ${select.value}`);
    }
  }
  function pickerRows() {
    if(!pickerTarget)return;
    const q=$('currency-search').value.trim().toLocaleLowerCase(locale()), list=$('currency-options');list.replaceChildren();
    for(const option of pickerTarget.options) {
      const code=option.value,name=currencyName(code);
      if(q&&!`${code} ${name} ${t(code,lang)}`.toLocaleLowerCase(locale()).includes(q))continue;
      const b=el('button','picker-option');b.type='button';b.setAttribute('aria-pressed',String(code===pickerTarget.value));
      const info=el('span','picker-info');info.append(el('strong','',code),el('span','',name));
      b.append(currencyFlag(code),info,el('span','picker-check',code===pickerTarget.value?'✓':''));
      b.addEventListener('click',()=>{pickerTarget.value=code;pickerTarget.dispatchEvent(new Event('input',{bubbles:true}));$('currency-dialog').close();});list.append(b);
    }
    if(!list.childElementCount)list.append(el('p','daily-note',text('nothing')));
  }
  function setupSteppers() {
    document.querySelectorAll('.daily-panel input[type="number"]').forEach(input=>{
      const wrapper=el('div','number-stepper'), controls=el('div','step-buttons');
      input.before(wrapper);wrapper.append(input,controls);
      for(const direction of [1,-1]){
        const b=el('button','step-button');b.type='button';b.dataset.step=String(direction);
        b.setAttribute('aria-label',lang==='uk'?(direction===1?'Збільшити':'Зменшити'):(direction===1?'Increase':'Decrease'));
        b.addEventListener('click',()=>{
          const step=Number(input.step)||1, n=Number.isFinite(input.valueAsNumber)?input.valueAsNumber:0;
          const next=clamp(n+direction*step,Number(input.min)||0,Number(input.max)||1e12);
          input.value=String(Number(next.toFixed(8)));input.dispatchEvent(new Event('input',{bubbles:true}));
        });controls.append(b);
      }
    });
  }
  function setupPickers() {
    for(const id of ['convert-from','convert-to','bank-currency']) {
      const select=$(id),b=el('button','currency-picker');b.type='button';b.id=`${id}-picker`;b.setAttribute('aria-haspopup','dialog');select.hidden=true;select.after(b);
      b.addEventListener('click',()=>{pickerTarget=select;$('currency-search').value='';pickerRows();$('currency-options').scrollTop=0;$('currency-dialog').showModal();$('currency-search').focus();});
      select.addEventListener('input',refreshPickerButtons);
    }
    $('picker-close').addEventListener('click',()=>$('currency-dialog').close());$('currency-search').addEventListener('input',pickerRows);
    $('currency-dialog').addEventListener('click',e=>{if(e.target===$('currency-dialog'))$('currency-dialog').close();});
    $('currency-dialog').addEventListener('close',()=>{if(pickerTarget)$(`${pickerTarget.id}-picker`).focus();pickerTarget=null;});
    refreshPickerButtons();
  }
  function translate() {
    document.querySelectorAll('[data-daily]').forEach(el => { el.textContent = text(el.dataset.daily); });
    $('convert-from').setAttribute('aria-label',text('source')); $('convert-to').setAttribute('aria-label',text('target')); $('bank-currency').setAttribute('aria-label',text('currency')); $('bank-fee-range').setAttribute('aria-label',text('fee')); $('currency-search').placeholder=text('searchCurrency'); $('currency-search').setAttribute('aria-label',text('searchCurrency')); $('picker-close').setAttribute('aria-label',text('close')); refreshPickerButtons();
    document.querySelectorAll('.step-button').forEach(b=>b.setAttribute('aria-label', lang==='uk'?(b.dataset.step==='1'?'Збільшити':'Зменшити'):(b.dataset.step==='1'?'Increase':'Decrease')));
  }
  function setTab(value) {
    tab = ['rates','convert','banks'].includes(value) ? value : 'rates';
    document.querySelectorAll('[data-tab]').forEach(b => { b.setAttribute('aria-selected',String(b.dataset.tab===tab)); b.tabIndex = b.dataset.tab===tab ? 0 : -1; });
    for (const id of ['source-switch','content','updated']) $(id).hidden = tab !== 'rates';
    $('daily-convert').hidden = tab !== 'convert'; $('daily-banks').hidden = tab !== 'banks';
    if(tab !== 'rates') loadData();
  }
  function save() {
    // Store immediately, since closing the popup destroys its timers.
    chrome.storage.local.set({dailyTools:{from:desiredFrom,to:desiredTo,amount:$('convert-amount').value,bankAmount:$('bank-amount').value,currency:$('bank-currency').value,fee:$('bank-fee').value,direction}}).catch(()=>{});
  }
  function ratesMap() {
    const map = new Map([['UAH',1]]);
    for(const row of nbu?.rates || []) if(validRate(row.rate)) map.set(row.cc,row.rate);
    return map;
  }
  function fillSelects() {
    const codes = [...new Set(['UAH','USD','EUR','PLN','GBP',desiredFrom,desiredTo,...ratesMap().keys()])].filter(c=>/^[A-Z]{3}$/.test(c));
    for(const [id,value] of [['convert-from',desiredFrom],['convert-to',desiredTo]]) {
      const select = $(id);
      select.replaceChildren(...codes.map(code=>new Option(code,code)));
      select.value = value;
    }
    refreshPickerButtons(); if(pickerTarget)pickerRows();
  }
  function el(tag,cls,content) { const node = document.createElement(tag); if(cls) node.className=cls; if(content!==undefined) node.textContent=content; return node; }
  function renderConvert() {
    const map=ratesMap(), a=amount('convert-amount'), from=desiredFrom, to=desiredTo, r1=map.get(from), r2=map.get(to);
    lastResult = Number.isFinite(a) && r1 && r2 ? a*r1/r2 : null;
    if(!Number.isFinite(lastResult)) lastResult=null;
    $('convert-result').textContent = lastResult===null ? '—' : fmt(lastResult,4);
    $('convert-copy').disabled = lastResult===null;
    $('convert-rate').textContent = r1 && r2 ? `1 ${from} = ${fmt(r1/r2,6)} ${to}` : text('nodata');
    $('convert-status').textContent = `${text('estimate')} · ${stamp(nbu)}`;
    const list=$('convert-multi'); list.replaceChildren();
    for(const code of ['UAH','USD','EUR','PLN','GBP'].filter(c=>c!==from)) {
      const row=el('div','daily-row'), label=el('span','daily-cc');
      const flag=code==='UAH'?'ua':FLAG_CODES[code];
      if(flag){const img=el('img');img.src=`flags/${flag}.png`;img.alt='';label.append(img);}
      label.append(document.createTextNode(code));
      row.append(label,el('strong','',r1 && map.get(code) && Number.isFinite(a) ? `${fmt(a*r1/map.get(code),4)} ${code}` : '—'));
      list.append(row);
    }
  }
  function renderBanks() {
    const a=amount('bank-amount'), fee=amount('bank-fee'), cc=$('bank-currency').value, valid=Number.isFinite(a)&&Number.isFinite(fee);
    const official=ratesMap().get(cc);
    $('bank-nbu').textContent=valid&&official?`${fmt(a*official)} ₴`:'—';
    $('bank-amount-label').textContent=text(direction==='buy'?'buyAmount':'sellAmount');
    $('bank-buy').setAttribute('aria-pressed',String(direction==='buy')); $('bank-sell').setAttribute('aria-pressed',String(direction==='sell'));
    const quotes=['privat','mono'].map(source=>{
      const snapshot=banks[source], row=snapshot?.rates.find(r=>r.cc===cc), rate=row?.[direction==='buy'?'sell':'buy'];
      const base=valid&&validRate(rate)?a*rate:null; return {source,snapshot,rate,base,cost:base===null?null:base*fee/100,total:base===null?null:base*(direction==='buy'?1+fee/100:1-fee/100)};
    });
    const fresh=quotes.filter(q=>Number.isFinite(q.total)&&!q.snapshot?.stale);
    const best=fresh.length===2&&fresh[0].total!==fresh[1].total ? fresh.reduce((x,y)=>direction==='buy'?(x.total<y.total?x:y):(x.total>y.total?x:y)) : null;
    const list=$('bank-results');list.replaceChildren();
    for(const q of quotes) {
      const row=el('div','daily-bankrow'), top=el('div','daily-banktop');
      const brand=el('span','bank-brand'), logo=el('img','bank-mark');logo.src=`banks/${q.source}.png`;logo.alt='';brand.append(logo,el('strong','',t(`source_${q.source}`,lang)));
      top.append(brand); if(best===q)top.append(el('span','daily-best','✓ '+text('best')));
      const total=el('div','bank-total');total.append(el('span','daily-label',text(direction==='buy'?'pay':q.total<0?'extraPay':'receive')),el('strong','',Number.isFinite(q.total)?`${fmt(Math.abs(q.total))} ₴`:'—'));
      row.append(top,total);
      const details=el('div','bank-details');
      for(const [label,value] of [[`1 ${cc}`,validRate(q.rate)?`${fmt(q.rate,4)} ₴`:'—'],[text('base'),q.base===null?'—':`${fmt(q.base)} ₴`],[text('feeCost'),q.cost===null?'—':`${fmt(q.cost)} ₴`]]) {const item=el('div','bank-detail');item.append(el('span','',label),el('strong','',value));details.append(item);}
      row.append(details,el('div','daily-note bank-stamp',stamp(q.snapshot)));list.append(row);
    }
    $('bank-status').textContent=!valid?text('invalid'):direction==='sell'&&fee>100?text('feeWarning'):best?`${text('difference')}: ${fmt(Math.abs(fresh[0].total-fresh[1].total))} ₴`:text('compareNote');

  }
  async function loadData() {
    const gen=++loadGeneration;
    if(tab==='convert'&&!nbu) $('convert-status').textContent=text('loading');
    if(tab==='banks'&&!banks.privat&&!banks.mono) $('bank-status').textContent=text('loading');
    const sources=tab==='banks'?['nbu','privat','mono']:['nbu'];
    await Promise.all(sources.map(async source=>{
      try {
        const snap=await rateSnapshot(source,lang);
        if(gen!==loadGeneration)return;
        if(source==='nbu'){nbu=snap;fillSelects();}else banks[source]=snap;
      }catch(e){console.warn('[NBU Rate]',e);}
      if(gen===loadGeneration){renderConvert();renderBanks();}
    }));
  }
  document.addEventListener('DOMContentLoaded',async()=>{
    lang=await getLanguage();translate();
    const {dailyTools:s={}}=await chrome.storage.local.get('dailyTools');
    desiredFrom=/^[A-Z]{3}$/.test(s.from||'')?s.from:'UAH';desiredTo=/^[A-Z]{3}$/.test(s.to||'')?s.to:'USD';
    for(const [id,value] of [['convert-amount',s.amount],['bank-amount',s.bankAmount],['bank-fee',s.fee],['bank-fee-range',s.fee]]) if(value!==undefined && $(id)) $(id).value=value;
    $('bank-currency').value=s.currency==='EUR'?'EUR':'USD';direction=s.direction==='sell'?'sell':'buy';
    syncFee('input',true);
    fillSelects();setupPickers();setupSteppers();renderConvert();renderBanks();
    document.querySelectorAll('[data-tab]').forEach(btn=>{btn.addEventListener('click',()=>setTab(btn.dataset.tab));btn.addEventListener('keydown',event=>{if(!['ArrowLeft','ArrowRight','Home','End'].includes(event.key))return;event.preventDefault();const tabs=['rates','convert','banks'];const index=event.key==='Home'?0:event.key==='End'?2:(tabs.indexOf(tab)+(event.key==='ArrowRight'?1:2))%3;setTab(tabs[index]);$(`tab-${tabs[index]}`).focus();});});
    for(const id of ['convert-amount','convert-from','convert-to']) $(id).addEventListener('input',()=>{desiredFrom=$('convert-from').value;desiredTo=$('convert-to').value;renderConvert();save();});
    for(const id of ['bank-amount','bank-currency']) $(id).addEventListener('input',()=>{renderBanks();save();});
    $('bank-fee').addEventListener('input',()=>{syncFee();renderBanks();save();});
    $('bank-fee').addEventListener('change',()=>{syncFee('input',true);renderBanks();save();});
    $('fee-presets').addEventListener('click',e=>{const b=e.target.closest('button[data-fee]');if(!b)return;$('bank-fee').value=b.dataset.fee;syncFee();renderBanks();save();});
    $('bank-fee-range').addEventListener('input',()=>{syncFee('range');renderBanks();save();});
    $('convert-chips').addEventListener('click',event=>{const b=event.target.closest('button');if(!b)return;$('convert-amount').value=b.dataset.amount??Math.min(1e12,(amount('convert-amount')||0)+Number(b.dataset.add));renderConvert();save();});
    $('convert-swap').addEventListener('click',()=>{[desiredFrom,desiredTo]=[desiredTo,desiredFrom];if(lastResult!==null)$('convert-amount').value=String(Number(lastResult.toPrecision(12)));fillSelects();renderConvert();save();});
    $('convert-copy').addEventListener('click',async()=>{if(lastResult===null)return;try{await navigator.clipboard.writeText(`${fmt(lastResult,4)} ${desiredTo}`);$('convert-status').textContent=text('copied');}catch(e){$('convert-status').textContent=text('copyerror');}});
    for(const d of ['buy','sell']) $(`bank-${d}`).addEventListener('click',()=>{direction=d;renderBanks();save();});
    chrome.storage.onChanged.addListener((changes,area)=>{if(area==='sync'&&changes.language){lang=changes.language.newValue||'uk';translate();renderConvert();renderBanks();}});
    setTab('rates');setInterval(()=>{if(tab!=='rates')loadData();},RATE_CACHE_TTL);
  });
})();
