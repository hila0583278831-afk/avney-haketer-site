// תוסף נגישות — accessibility widget. Preferences stay in this browser only (localStorage).
(function(){
'use strict';
var doc=document.documentElement,KEY='akh-a11y';
var TOGGLES=[
  {id:'still',label:'עצירת אנימציות',icon:'<rect x="6" y="5" width="4" height="14" rx="1"/><rect x="14" y="5" width="4" height="14" rx="1"/>'},
  {id:'contrast',label:'ניגודיות גבוהה',icon:'<circle cx="12" cy="12" r="9"/><path d="M12 3a9 9 0 0 1 0 18z" fill="currentColor"/>'},
  {id:'invert',label:'ניגודיות הפוכה',icon:'<rect x="3" y="3" width="18" height="18" rx="3"/><path d="M3 21L21 3v15a3 3 0 0 1-3 3z" fill="currentColor"/>'},
  {id:'gray',label:'גווני אפור',icon:'<circle cx="12" cy="12" r="9"/><path d="M12 3v18M3 12h18" />'},
  {id:'links',label:'הדגשת קישורים',icon:'<path d="M10 14a4 4 0 0 0 5.7 0l3-3a4 4 0 0 0-5.7-5.7l-1 1"/><path d="M14 10a4 4 0 0 0-5.7 0l-3 3a4 4 0 0 0 5.7 5.7l1-1"/>'},
  {id:'font',label:'גופן קריא',icon:'<path d="M5 19L11 5h2l6 14M8 14h8"/>'},
  {id:'spacing',label:'ריווח טקסט',icon:'<path d="M4 6h16M4 12h16M4 18h16"/><path d="M2 9l-0 6" />'},
  {id:'cursor',label:'סמן גדול',icon:'<path d="M6 3l12 7-5 1.5 3 6.5-2.5 1.2-3-6.5L6 16z"/>'}
];
var state={size:0};
try{var saved=JSON.parse(localStorage.getItem(KEY)||'{}');if(saved&&typeof saved==='object')state=Object.assign(state,saved)}catch(e){}

function apply(){
  TOGGLES.forEach(function(t){doc.classList.toggle('a11y-'+t.id,!!state[t.id])});
  if(state.size)doc.setAttribute('data-a11y-size',state.size);else doc.removeAttribute('data-a11y-size');
  // the contrast modes don't combine well: invert wins
  if(state.invert)doc.classList.remove('a11y-contrast');
  var v=document.querySelector('video.hero__img');
  if(v){if(state.still)v.pause();}
  try{localStorage.setItem(KEY,JSON.stringify(state))}catch(e){}
  // scroll scenes measure element positions; zoom/spacing change them
  window.dispatchEvent(new Event('resize'));
  window.dispatchEvent(new Event('akh-a11y'));
}
// apply saved prefs as early as possible
apply();

function svg(p){return '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">'+p+'</svg>'}
var statement=document.documentElement.getAttribute('data-a11y-statement')||'accessibility.html';

var btn=document.createElement('button');
btn.type='button';btn.className='a11y-btn';
btn.setAttribute('aria-label','תפריט נגישות');btn.setAttribute('aria-expanded','false');btn.setAttribute('aria-controls','a11yPanel');
btn.innerHTML=svg('<circle cx="12" cy="4.5" r="1.8" fill="currentColor" stroke="none"/><path d="M5 8.5c2.3.8 4.6 1.2 7 1.2s4.7-.4 7-1.2M12 9.7V14m0 0l-3 6.5M12 14l3 6.5"/>');

var panel=document.createElement('div');
panel.className='a11y-panel';panel.id='a11yPanel';
panel.setAttribute('role','dialog');panel.setAttribute('aria-labelledby','a11yTitle');panel.setAttribute('dir','rtl');panel.setAttribute('lang','he');
panel.innerHTML=
  '<div class="a11y-panel__head"><h2 class="a11y-panel__title" id="a11yTitle">תפריט נגישות</h2><button type="button" class="a11y-close" aria-label="סגירת תפריט הנגישות">×</button></div>'+
  '<div class="a11y-size" role="group" aria-label="גודל טקסט"><span>גודל טקסט</span><div class="a11y-size__ctrl"><button type="button" data-size="-1" aria-label="הקטנת טקסט">−</button><output aria-live="polite">100%</output><button type="button" data-size="1" aria-label="הגדלת טקסט">+</button></div></div>'+
  '<div class="a11y-grid">'+TOGGLES.map(function(t){return '<button type="button" class="a11y-opt" data-toggle="'+t.id+'" aria-pressed="false">'+svg(t.icon)+'<span>'+t.label+'</span></button>'}).join('')+'</div>'+
  '<div class="a11y-foot"><button type="button" class="a11y-reset">איפוס הגדרות</button><a href="'+statement+'">הצהרת נגישות</a></div>';

var SIZES={'-1':'92%','0':'100%','1':'112%','2':'125%','3':'140%'};
function sync(){
  panel.querySelectorAll('[data-toggle]').forEach(function(b){b.setAttribute('aria-pressed',!!state[b.dataset.toggle])});
  panel.querySelector('output').textContent=SIZES[String(state.size)];
}
function open(){panel.classList.add('is-open');btn.setAttribute('aria-expanded','true');sync();setTimeout(function(){panel.querySelector('.a11y-close').focus()},30)}
function close(focusBtn){panel.classList.remove('is-open');btn.setAttribute('aria-expanded','false');if(focusBtn)btn.focus()}

btn.addEventListener('click',function(){panel.classList.contains('is-open')?close():open()});
panel.addEventListener('click',function(e){
  var t=e.target.closest('[data-toggle]');
  if(t){var id=t.dataset.toggle;state[id]=!state[id];if(id==='invert'&&state.invert)state.contrast=false;if(id==='contrast'&&state.contrast)state.invert=false;apply();sync();return}
  var s=e.target.closest('[data-size]');
  if(s){state.size=Math.max(-1,Math.min(3,(state.size||0)+(+s.dataset.size)));apply();sync();return}
  if(e.target.closest('.a11y-reset')){state={size:0};apply();sync();return}
  if(e.target.closest('.a11y-close'))close(true);
});
document.addEventListener('keydown',function(e){
  if(e.key==='Escape'&&panel.classList.contains('is-open')){e.stopPropagation();close(true)}
  // Alt+A opens the widget from anywhere
  if(e.altKey&&(e.key==='a'||e.key==='A'||e.code==='KeyA')){e.preventDefault();panel.classList.contains('is-open')?close(true):open()}
},true);
document.addEventListener('click',function(e){if(panel.classList.contains('is-open')&&!panel.contains(e.target)&&!btn.contains(e.target))close()});

// small API so other controls (the hero pause button) share the same saved state
window.akhA11y={get:function(id){return !!state[id]},set:function(id,v){state[id]=!!v;apply();sync()}};
function mount(){document.body.appendChild(btn);document.body.appendChild(panel);sync()}
if(document.body)mount();else document.addEventListener('DOMContentLoaded',mount);
})();
