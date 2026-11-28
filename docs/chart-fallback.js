/* Small offline canvas chart fallback. The original Chart.js is used when present. */
(function () {
    if (typeof window.Chart === 'function') return;
    class OfflineChart {
        static plugins = [];
        static register(...plugins) { this.plugins.push(...plugins); }
        constructor(ctx, configuration) {
            this.ctx = ctx;
            this.canvas = ctx.canvas;
            this.data = configuration.data;
            this.options = configuration.options || {};
            this.chartArea = {left:0,right:0,top:0,bottom:0};
            this.points = [];
            this.tooltip = document.createElement('div');
            this.tooltip.className = 'fx-chart-tooltip';
            this.tooltip.setAttribute('role','status');
            this.canvas.parentElement.appendChild(this.tooltip);
            this._onMove = this.handleMove.bind(this);
            this._onLeave = () => {this.tooltip.style.opacity='0';};
            this._onClick = event => {
                if (typeof this.options.onClick !== 'function') return;
                const bounds = this.canvas.getBoundingClientRect();
                this.options.onClick({ x: (event.clientX-bounds.left)*(this.logicalWidth||bounds.width)/bounds.width, y:(event.clientY-bounds.top)*(this.logicalHeight||bounds.height)/bounds.height },[],this);
            };
            this.canvas.addEventListener('pointermove',this._onMove);
            this.canvas.addEventListener('pointerleave',this._onLeave);
            this.canvas.addEventListener('click',this._onClick);
            this._observer = typeof ResizeObserver !== 'undefined' ? new ResizeObserver(() => this.draw()) : null;
            if (this._observer) this._observer.observe(this.canvas.parentElement);
            this.draw();
        }
        getDatasetMeta() { return {data:this.points}; }
        update() { this.draw(); }
        resize() { this.draw(); }
        destroy() {
            if(this._observer) this._observer.disconnect();
            this.canvas.removeEventListener('pointermove',this._onMove);
            this.canvas.removeEventListener('pointerleave',this._onLeave);
            this.canvas.removeEventListener('click',this._onClick);
            this.tooltip.remove();
            this.points=[];
        }
        draw() {
            const parent=this.canvas.parentElement;
            if(!parent || parent.clientWidth<40 || parent.clientHeight<40)return;
            const dpr=Math.min(window.devicePixelRatio||1,2);
            const width=Math.min(parent.clientWidth, this.canvas.clientWidth || parent.clientWidth);
            const height=Math.min(parent.clientHeight, this.canvas.clientHeight || parent.clientHeight);
            this.logicalWidth=width;this.logicalHeight=height;
            const targetW=Math.round(width*dpr), targetH=Math.round(height*dpr);
            if(this.canvas.width!==targetW || this.canvas.height!==targetH){this.canvas.width=targetW;this.canvas.height=targetH;}
            const ctx=this.ctx;
            ctx.setTransform(dpr,0,0,dpr,0,0);
            ctx.clearRect(0,0,width,height);
            const source=this.data.datasets && this.data.datasets[0];
            const numbers=(source?.data||[]).map(Number);
            const valid=numbers.filter(Number.isFinite);
            const styles=getComputedStyle(document.documentElement);
            const muted=styles.getPropertyValue('--text-muted').trim()||'#7c8795';
            const border=styles.getPropertyValue('--border').trim()||'#333';
            const ink=styles.getPropertyValue('--text').trim()||'#ddd';
            const cryptoLarge = this.canvas.id === 'cryptoChart';
            const enlargedText = cryptoLarge && document.getElementById('crypto-chart-modal')?.classList.contains('crypto-text-large');
            const left= cryptoLarge ? Math.min(116,Math.max(83, Math.floor(width*.12))) : Math.min(76,Math.max(54, Math.floor(width*.14)));
            const right=width-14, top=20, bottom=height-(cryptoLarge ? 50 : 35);
            const plotW=Math.max(10,right-left), plotH=Math.max(10,bottom-top);
            this.chartArea={left,right,top,bottom};
            this.scales={x:{getValueForPixel:x => (x-left)/plotW*Math.max(0,numbers.length-1)}};
            if(valid.length<2){
                ctx.fillStyle=muted;ctx.textAlign='center';ctx.textBaseline='middle';ctx.font='13px system-ui';
                ctx.fillText('Немає даних для графіка',width/2,height/2);return;
            }
            let min=Math.min(...valid),max=Math.max(...valid);
            if(!Number.isFinite(min)||!Number.isFinite(max))return;
            const padding=(max-min||Math.abs(max)*.08||1)*.12;min-=padding;max+=padding;
            const vertical=(max-min)||1;
            const xp=i=>left+i/Math.max(1,numbers.length-1)*plotW;
            const yp=v=>top+(max-v)/vertical*plotH;
            const yformat=this.options?.scales?.y?.ticks?.callback;
            ctx.strokeStyle=border;ctx.lineWidth=1;ctx.font=(cryptoLarge ? (enlargedText ? 'bold 17px system-ui' : '600 14px system-ui') : '11px system-ui');
            ctx.fillStyle=muted;ctx.textAlign='right';ctx.textBaseline='middle';
            for(let i=0;i<=4;i++){
                const yy=top+(plotH*i/4),v=max-vertical*i/4;
                ctx.beginPath();ctx.moveTo(left,yy);ctx.lineTo(right,yy);ctx.stroke();
                let label=Number(v).toFixed(2);
                if(typeof yformat==='function'){try{label=String(yformat(v));}catch(_){}}
                if(label.length>11)label=Number(v).toFixed(2);
                ctx.fillText(label,left-8,yy);
            }
            ctx.fillStyle=muted;ctx.textAlign='center';ctx.textBaseline='top';
            if (cryptoLarge && width < 480) ctx.font = (enlargedText ? 'bold 13px system-ui' : '600 12px system-ui');
            const labels=this.data.labels||[];
            const cryptoTickGap = enlargedText ? 115 : 92;
            const maxLabelCount = cryptoLarge
                ? Math.max(2, Math.min(6, Math.floor(plotW / cryptoTickGap) + 1))
                : Math.max(2, Math.min(5, Math.floor(plotW / 78) + 1));
            const intervals=Math.min(maxLabelCount-1,Math.max(0,labels.length-1));
            for(let i=0;i<=intervals;i++){
                const k=intervals ? Math.round(i/intervals*(labels.length-1)) : 0;
                const label=String(labels[k]||'');
                const halfWidth=ctx.measureText(label).width/2+3;
                const centerX=Math.max(halfWidth,Math.min(width-halfWidth,xp(k)));
                ctx.fillText(label,centerX,bottom+11);
            }
            this.points=numbers.map((v,i)=>({x:xp(i),y:yp(v),value:v}));
            const color=source.borderColor||styles.getPropertyValue('--accent').trim()||'#1a73e8';
            const fill=ctx.createLinearGradient(0,top,0,bottom);
            fill.addColorStop(0,color.startsWith('#') ? color+'44':'rgba(26,115,232,.2)');
            fill.addColorStop(1,'rgba(26,115,232,0)');
            ctx.beginPath();
            let started=false;
            numbers.forEach((v,i)=>{
                if(!Number.isFinite(v)){started=false;return;}
                if(!started){ctx.moveTo(xp(i),yp(v));started=true;}else ctx.lineTo(xp(i),yp(v));
            });
            ctx.lineWidth=2.5;ctx.strokeStyle=color;ctx.lineCap='round';ctx.lineJoin='round';ctx.stroke();
            if(source.fill){
                const idx=numbers.findIndex(Number.isFinite);
                ctx.lineTo(xp(numbers.length-1),bottom);ctx.lineTo(xp(idx),bottom);ctx.closePath();
                ctx.fillStyle=fill;ctx.fill();
            }
            for(const plugin of OfflineChart.plugins){
                if(typeof plugin.afterDatasetsDraw==='function'){
                    try{plugin.afterDatasetsDraw(this);}catch(e){console.warn('Chart annotation:',e);}
                }
            }
        }
        handleMove(event){
            const box=this.canvas.getBoundingClientRect();
            const x=(event.clientX-box.left)*(this.logicalWidth||box.width)/box.width,y=(event.clientY-box.top)*(this.logicalHeight||box.height)/box.height;
            if(x<this.chartArea.left || x>this.chartArea.right || y<this.chartArea.top-5 || y>this.chartArea.bottom+10){this.tooltip.style.opacity='0';return;}
            const idx=Math.max(0,Math.min(this.points.length-1,Math.round(this.scales.x.getValueForPixel(x))));
            const value=this.points[idx]?.value;
            if(!Number.isFinite(value)){this.tooltip.style.opacity='0';return;}
            const dataset=this.data.datasets[0];
            const tooltipOpts=this.options?.plugins?.tooltip?.callbacks||{};
            let title=String(this.data.labels[idx]||''),label=`${dataset.label||''}: ${value.toFixed(4)}`;
            if(typeof tooltipOpts.title==='function'){try{title=String(tooltipOpts.title([{dataIndex:idx}]));}catch(_){}}
            if(typeof tooltipOpts.label==='function'){try{label=String(tooltipOpts.label({parsed:{y:value},dataIndex:idx}));}catch(_){}}
            this.tooltip.textContent=title+' · '+label;
            this.tooltip.style.opacity='1';
            this.tooltip.style.left=Math.max(8,Math.min(box.width-205,x+14))+'px';
            this.tooltip.style.top=Math.max(4,y-49)+'px';
        }
    }
    window.Chart=OfflineChart;
})();
