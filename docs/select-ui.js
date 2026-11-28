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
    function render(){
      value.textContent=select.selectedOptions[0]?.textContent.trim()||'Оберіть…';
      menu.replaceChildren();
      Array.from(select.options).forEach((opt,index)=>{
        const b=document.createElement('button');b.type='button';b.className='fx-select-option';b.setAttribute('role','option');b.setAttribute('aria-selected',String(index===select.selectedIndex));b.textContent=opt.textContent;b.disabled=opt.disabled;
        b.addEventListener('click',()=>{select.selectedIndex=index;select.dispatchEvent(new Event('change',{bubbles:true}));render();close();trigger.focus()});menu.append(b);
      });
    }
    trigger.addEventListener('click',()=>{document.querySelectorAll('.fx-select-shell.open').forEach(el=>{el.classList.remove('open');el.querySelector('.fx-select-trigger')?.setAttribute('aria-expanded','false')});const open=!shell.classList.contains('open');shell.classList.toggle('open',open);trigger.setAttribute('aria-expanded',String(open));if(open)render()});
    trigger.addEventListener('keydown',e=>{if(e.key==='Escape')close();if(e.key==='ArrowDown'||e.key==='ArrowUp'){e.preventDefault();const opts=[...select.options].filter(x=>!x.disabled);const current=opts.indexOf(select.selectedOptions[0]);const next=opts[(current+(e.key==='ArrowDown'?1:opts.length-1))%opts.length];if(next){select.value=next.value;select.dispatchEvent(new Event('change',{bubbles:true}));render()}}});
    select.addEventListener('change',render);
    new MutationObserver(render).observe(select,{childList:true,subtree:true,attributes:true,attributeFilter:['selected','disabled']});
    render();
  }
  document.addEventListener('click',e=>{document.querySelectorAll('.fx-select-shell.open').forEach(el=>{if(!el.contains(e.target)){el.classList.remove('open');el.querySelector('.fx-select-trigger')?.setAttribute('aria-expanded','false')}})});
  document.addEventListener('keydown',e=>{if(e.key==='Escape')document.querySelectorAll('.fx-select-shell.open').forEach(el=>{el.classList.remove('open');el.querySelector('.fx-select-trigger')?.setAttribute('aria-expanded','false')})});
  function init(){document.querySelectorAll('select.fx-select').forEach(enhanceSelect)}
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init);else init();
})();
