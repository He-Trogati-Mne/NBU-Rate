(function () {
    'use strict';
    function pictureOf(chr) {
        var c = document.createElement('canvas');
        c.width = 90; c.height = 88;
        var ctx = c.getContext('2d');
        if (!ctx) return null;
        ctx.fillStyle = '#111';
        ctx.font = 'bold 68px sans-serif';
        ctx.fillText(chr, 8, 68);
        return ctx.getImageData(0, 0, c.width, c.height).data;
    }
    function samePixels(a, b) {
        if (!a || !b || a.length !== b.length) return false;
        var differs = 0;
        for (var i = 3; i < a.length; i += 4) {
            if (a[i] !== b[i]) {
                if (++differs > 5) return false;
            }
        }
        return true;
    }
    var forced = /(?:^|[?&])nbu_legacy_uah=1(?:&|$)/.test(location.search);
    var oldAndroid = /Android\s(?:[1-9])(?:\.|[;\s])/i.test(navigator.userAgent);
    var test = pictureOf('₴');
    var missing = Boolean(forced || oldAndroid || samePixels(test, pictureOf('\u0378')) || samePixels(test, pictureOf('\uFFFF')));
    window.nbuUAHNeedsVector = missing;
    window.nbuUAHText = missing ? 'грн' : '₴';
    if (!missing) return;

    var svgNS = 'http://www.w3.org/2000/svg';
    var skipped = {SCRIPT:1,STYLE:1,NOSCRIPT:1,TEXTAREA:1,SVG:1};
    function vectorMark() {
        var svg = document.createElementNS(svgNS, 'svg');
        svg.setAttribute('class','nbu-uah-vector');
        svg.setAttribute('viewBox','0 0 32 32');
        svg.setAttribute('role','img');
        svg.setAttribute('aria-label','гривня');
        svg.setAttribute('fill','none');
        var curve=document.createElementNS(svgNS,'path');
        curve.setAttribute('d','M9 9.5 C13 5.5 21.6 5.2 23.4 11 C25.3 17 13 18.4 10.7 23.6 C8.4 29.6 20.6 30.7 24.8 25.1');
        curve.setAttribute('stroke','currentColor');
        curve.setAttribute('stroke-width','3.5');
        curve.setAttribute('stroke-linecap','round');
        var bars=document.createElementNS(svgNS,'path');
        bars.setAttribute('d','M4.6 15.5 H27.4 M4.6 20.7 H27.4');
        bars.setAttribute('stroke','currentColor');
        bars.setAttribute('stroke-width','3.5');
        bars.setAttribute('stroke-linecap','round');
        svg.append(curve,bars);
        return svg;
    }
    function correctText(node) {
        if (!node.nodeValue || node.nodeValue.indexOf('₴') < 0) return;
        var parent=node.parentNode;
        if (!parent || skipped[parent.nodeName] || parent.closest('script,style,noscript,svg,textarea')) return;
        var parts=node.nodeValue.split('₴');
        var frag=document.createDocumentFragment();
        parts.forEach(function(part,i){
            if(i) frag.appendChild(vectorMark());
            if(part) frag.appendChild(document.createTextNode(part));
        });
        parent.replaceChild(frag,node);
    }
    function scan(el) {
        if(el.nodeType===3) {correctText(el);return;}
        if(el.nodeType!==1 || skipped[el.nodeName]) return;
        if(el.hasAttribute('placeholder') && el.getAttribute('placeholder').includes('₴'))
            el.setAttribute('placeholder',el.getAttribute('placeholder').replace(/₴/g,'грн'));
        if(el.hasAttribute('title') && el.getAttribute('title').includes('₴'))
            el.setAttribute('title',el.getAttribute('title').replace(/₴/g,'грн'));
        Array.from(el.childNodes).forEach(scan);
    }
    function ready() {
        if(!document.body) return;
        var style = document.createElement('style');
        style.textContent = '.nbu-uah-vector{display:inline-block;width:.9em;height:1em;vertical-align:-.15em;flex:none;overflow:visible}';
        document.head.appendChild(style);
        scan(document.body);
        new MutationObserver(function(changes) {
            changes.forEach(function(change) {
                if(change.type==='characterData') correctText(change.target);
                else if(change.type==='attributes') scan(change.target);
                else change.addedNodes.forEach(scan);
            });
        }).observe(document.body,{subtree:true,childList:true,characterData:true,attributes:true,attributeFilter:['placeholder','title']});
    }
    if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',ready,{once:true});
    else ready();
})();
