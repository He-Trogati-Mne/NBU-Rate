(function(){
  function enhanceSelect(select){
    if(select.dataset.fxEnhanced==='1')return;
    select.dataset.fxEnhanced='1';
    const shell=document.createElement('div');shell.className='fx-select-shell';
    select.parentNode.insertBefore(shell,select);shell.appendChild(select);
    const trigger=document.createElement('button');trigger.type='button';trigger.className='fx-select-trigger';trigger.setAttribute('aria-haspopup','listbox');trigger.setAttribute('aria-expanded','false');
    const value=document.createElement('span'),arrow=document.createElement('span');arrow.className='fx-select-arrow';trigger.append(value,arrow);
    const menu=document.createElement('div');menu.className='fx-select-menu';menu.setAttribute('role','listbox');
    shell.append(trigger,menu);
    function close(){shell.classList.remove('open');trigger.setAttribute('aria-expanded','false')}
    function notify(){select.dispatchEvent(new Event('input',{bubbles:true}));select.dispatchEvent(new Event('change',{bubbles:true}));}
    select.tabIndex=-1;select.setAttribute('aria-hidden','true');
    const label=select.id&&document.querySelector('label[for="'+select.id+'"]');
    if(label){if(!label.id)label.id=select.id+'-label';trigger.setAttribute('aria-labelledby',label.id);label.addEventListener('click',e=>{e.preventDefault();trigger.focus()});}
    else if(select.getAttribute('aria-label'))trigger.setAttribute('aria-label',select.getAttribute('aria-label'));
    function render(){
      value.textContent=select.selectedOptions[0]?.textContent.trim()||'Оберіть…';
      menu.replaceChildren();
      Array.from(select.options).forEach((opt,index)=>{
        const b=document.createElement('button');b.type='button';b.className='fx-select-option';b.setAttribute('role','option');b.setAttribute('aria-selected',String(index===select.selectedIndex));b.textContent=opt.textContent;b.disabled=opt.disabled;
        b.addEventListener('click',()=>{select.selectedIndex=index;notify();render();close();trigger.focus()});menu.append(b);
      });
    }
    trigger.addEventListener('click',()=>{
      const wasOpen=shell.classList.contains('open');
      document.querySelectorAll('.fx-select-shell.open').forEach(el=>{el.classList.remove('open');el.querySelector('.fx-select-trigger')?.setAttribute('aria-expanded','false')});
      if(wasOpen)return;
      render();shell.classList.add('open');trigger.setAttribute('aria-expanded','true');
      const selected=menu.querySelector('[aria-selected="true"]');if(selected)menu.scrollTop=Math.max(0,selected.offsetTop-(menu.clientHeight-selected.offsetHeight)/2);
    });
    trigger.addEventListener('keydown',e=>{if(e.key==='Escape'){close();trigger.focus();}if(e.key==='ArrowDown'||e.key==='ArrowUp'){e.preventDefault();const opts=[...select.options].filter(x=>!x.disabled);const current=opts.indexOf(select.selectedOptions[0]);const next=opts[(current+(e.key==='ArrowDown'?1:opts.length-1))%opts.length];if(next){select.value=next.value;notify();render()}}});
    select.addEventListener('change',render);
    new MutationObserver(render).observe(select,{childList:true,subtree:true,characterData:true,attributes:true,attributeFilter:['selected','disabled']});
    render();
  }
  document.addEventListener('click',e=>{document.querySelectorAll('.fx-select-shell.open').forEach(el=>{if(!el.contains(e.target)){el.classList.remove('open');el.querySelector('.fx-select-trigger')?.setAttribute('aria-expanded','false')}})});
  document.addEventListener('keydown',e=>{if(e.key==='Escape')document.querySelectorAll('.fx-select-shell.open').forEach(el=>{el.classList.remove('open');el.querySelector('.fx-select-trigger')?.setAttribute('aria-expanded','false')})});
  function enhanceNumber(input){
    if(input.dataset.stepperReady)return;input.dataset.stepperReady='1';
    const shell=document.createElement('div');shell.className='fx-number-shell';
    if(input.style.width){shell.style.width=input.style.width;input.style.width='100%';}
    input.before(shell);shell.append(input);
    const arrows=document.createElement('div');arrows.className='fx-number-arrows';shell.append(arrows);
    for(const direction of [1,-1]){
      const b=document.createElement('button');b.type='button';b.className='fx-number-step '+(direction===1?'up':'down');
      const label=()=>document.documentElement.lang==='en'?(direction===1?'Increase':'Decrease'):(direction===1?'Збільшити':'Зменшити');
      b.setAttribute('aria-label',label());b.title=label();
      const svg=document.createElementNS('http://www.w3.org/2000/svg','svg');svg.setAttribute('viewBox','0 0 16 16');svg.setAttribute('aria-hidden','true');
      const path=document.createElementNS(svg.namespaceURI,'path');path.setAttribute('d',direction===1?'M4 10l4-4 4 4':'M4 6l4 4 4-4');svg.append(path);b.append(svg);arrows.append(b);
      b.addEventListener('click',()=>{
        if(input.disabled||input.readOnly)return;
        const old=input.value;
        if(input.step!=='any'){
          try{direction===1?input.stepUp():input.stepDown();}catch(_){return;}
        }else{
          const step=input.id==='fx-bank-amount'?1:0.01;
          const min=input.min===''?-Infinity:Number(input.min),max=input.max===''?Infinity:Number(input.max);
          const current=Number.isFinite(input.valueAsNumber)?input.valueAsNumber:Math.max(0,Number.isFinite(min)?min:0);
          const next=Math.min(max,Math.max(min,Math.round((current+direction*step)*1e8)/1e8));
          if(Number.isFinite(next))input.value=String(next);
        }
        if(input.value!==old){input.dispatchEvent(new Event('input',{bubbles:true}));input.dispatchEvent(new Event('change',{bubbles:true}));}
      });
    }
  }
  function init(){document.querySelectorAll('select.fx-select').forEach(enhanceSelect);document.querySelectorAll('input.fx-input[type="number"]:not([readonly])').forEach(enhanceNumber)}
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init);else init();
})();
