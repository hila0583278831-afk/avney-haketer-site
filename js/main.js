// כתובת הטופס ב-Formspree — להחליף את YOUR_FORM_ID במזהה מהחשבון (ראו README)
var FORM_ENDPOINT='https://formspree.io/f/YOUR_FORM_ID';

(function(){
'use strict';
var doc=document.documentElement;
var $=function(s,c){return (c||document).querySelector(s)};
var $$=function(s,c){return Array.prototype.slice.call((c||document).querySelectorAll(s))};
var clamp=function(v,a,b){return Math.min(b,Math.max(a,v))};
var lerp=function(a,b,t){return a+(b-a)*t};
var reduce=window.matchMedia('(prefers-reduced-motion: reduce)').matches;
var finePointer=window.matchMedia('(hover: hover) and (pointer: fine)').matches;
var isDesktop=function(){return window.innerWidth>900};
if(reduce)doc.classList.add('no-motion');

/* ---------- split words ---------- */
function splitWords(el){
  var n=0;
  (function walk(node){
    Array.prototype.slice.call(node.childNodes).forEach(function(ch){
      if(ch.nodeType===3){
        var parts=ch.textContent.split(/(\s+)/),frag=document.createDocumentFragment();
        parts.forEach(function(p){
          if(!p)return;
          if(/^\s+$/.test(p)){frag.appendChild(document.createTextNode(' '));return}
          var w=document.createElement('span');w.className='w';
          var i=document.createElement('i');i.textContent=p;i.style.setProperty('--i',n++);
          w.appendChild(i);frag.appendChild(w);
        });
        node.replaceChild(frag,ch);
      }else if(ch.nodeType===1&&ch.tagName!=='BR'){walk(ch)}
    });
  })(el);
}
$$('[data-split]').forEach(splitWords);

/* words that fill in with scroll */
var fillEls=$$('[data-fill]').map(function(el){
  (function walk(node){
    Array.prototype.slice.call(node.childNodes).forEach(function(ch){
      if(ch.nodeType===3){
        var frag=document.createDocumentFragment();
        ch.textContent.split(/(\s+)/).forEach(function(p){
          if(!p)return;
          if(/^\s+$/.test(p)){frag.appendChild(document.createTextNode(' '));return}
          var s=document.createElement('span');s.className='fw';s.textContent=p;frag.appendChild(s);
        });
        node.replaceChild(frag,ch);
      }else if(ch.nodeType===1){walk(ch)}
    });
  })(el);
  return {el:el,words:$$('.fw',el)};
});

/* ---------- reveal on view ---------- */
$$('[data-reveal]').forEach(function(el){
  var sib=$$(':scope > [data-reveal]',el.parentNode);
  var i=sib.indexOf(el);
  if(i>0&&!el.style.getPropertyValue('--d'))el.style.setProperty('--d',(i*90)+'ms');
});
function countUp(el){
  var to=+el.dataset.count,t0=null,dur=1800;
  if(reduce){el.textContent=to;return}
  (function step(t){
    if(!t0)t0=t;var p=clamp((t-t0)/dur,0,1),e=1-Math.pow(2,-10*p);
    el.textContent=Math.round(to*(p===1?1:e));
    if(p<1)requestAnimationFrame(step);
  })(performance.now());
}
var io=new IntersectionObserver(function(entries){
  entries.forEach(function(en){
    if(!en.isIntersecting)return;
    var el=en.target;el.classList.add('in');io.unobserve(el);
    $$('[data-count]',el).concat(el.matches('[data-count]')?[el]:[]).forEach(countUp);
  });
},{rootMargin:'0px 0px -10% 0px',threshold:.12});
$$('[data-reveal]:not([data-reveal="clip"]),[data-split]:not(.hero__title)').forEach(function(el){io.observe(el)});
// clip-path hides the whole box, so IntersectionObserver never fires for these — checked from the scroll loop
var clips=$$('[data-reveal="clip"]');

/* ---------- preloader ---------- */
var loader=$('#loader'),countEl=$('#loaderCount');
function ready(){
  doc.classList.remove('is-loading');doc.classList.add('is-ready');
  $('.hero__title').classList.add('in');
  measure();
}
(function(){
  if(reduce||!loader){if(loader)loader.classList.add('gone');ready();return}
  var quick=false;try{quick=sessionStorage.getItem('akh-seen')==='1';sessionStorage.setItem('akh-seen','1')}catch(e){}
  var minDur=quick?700:2000,start=performance.now(),loaded=false,shown=0;
  // the poster image is enough to reveal the page; the video keeps loading behind it
  var poster=new Image();poster.src=$('.hero__img').getAttribute('poster');
  var assets=[document.fonts?document.fonts.ready:Promise.resolve(),new Promise(function(r){if(poster.complete)r();else{poster.onload=poster.onerror=r}})];
  Promise.all(assets).then(function(){loaded=true});
  setTimeout(function(){loaded=true},5000);
  var finished=false;
  function finish(){
    if(finished)return;finished=true;
    countEl.textContent='100';loader.style.setProperty('--lp','1');
    setTimeout(function(){
      loader.classList.add('done');ready();
      setTimeout(function(){loader.classList.add('gone')},1500);
    },250);
  }
  setTimeout(finish,6500); // rAF can be paused in background tabs
  (function tick(){
    if(finished)return;
    var t=performance.now(),target=clamp((t-start)/minDur,0,1)*(loaded?100:88);
    shown=lerp(shown,target,.12);
    if(loaded&&target>=100&&shown>99.4)shown=100;
    countEl.textContent=Math.floor(shown);
    loader.style.setProperty('--lp',(shown/100).toFixed(3));
    if(shown<100)requestAnimationFrame(tick);else finish();
  })();
})();

/* ---------- header & menu ---------- */
var hdr=$('#hdr'),burger=$('.burger'),menu=$('#menu');
function setMenu(open){
  burger.setAttribute('aria-expanded',open);
  burger.setAttribute('aria-label',open?'סגירת תפריט':'פתיחת תפריט');
  doc.classList.toggle('menu-open',open);doc.classList.toggle('is-locked',open);
  if(open){menu.hidden=false;requestAnimationFrame(function(){menu.classList.add('is-open')})}
  else{menu.classList.remove('is-open');setTimeout(function(){if(!menu.classList.contains('is-open'))menu.hidden=true},900)}
}
burger.addEventListener('click',function(){setMenu(burger.getAttribute('aria-expanded')!=='true')});
$$('a',menu).forEach(function(a){a.addEventListener('click',function(){setMenu(false)})});
document.addEventListener('keydown',function(e){if(e.key==='Escape'&&doc.classList.contains('menu-open'))setMenu(false)});

/* ---------- chips: filter / drawings / topic ---------- */
var track=$('.works__track');
document.addEventListener('click',function(e){
  var b=e.target.closest('[data-g]');if(!b)return;var g=b.dataset.g,v=b.dataset.v;
  $$('[data-g="'+g+'"]').forEach(function(x){var on=x.dataset.v===v;x.classList.toggle('on',on);x.setAttribute('aria-pressed',on)});
  if(g==='filter'){
    $$('.pcard[data-key]').forEach(function(c){c.hidden=!(v==='all'||c.dataset.key===v)});
    measure();
    var w=$('.works');if(isDesktop()&&!reduce&&scrollY>w.offsetTop)window.scrollTo({top:w.offsetTop,behavior:'smooth'});
  }
  if(g==='tab'){$$('[data-pane]').forEach(function(p){p.hidden=p.dataset.pane!==v});$('#tabCap').textContent=b.dataset.cap}
});
// links that preselect a contact topic
$$('[data-topic]').forEach(function(a){a.addEventListener('click',function(){var c=$('[data-g="topic"][data-v="'+a.dataset.topic+'"]');if(c)c.click()})});

/* ---------- project details panel ---------- */
// stage: 1 איתור קרקע · 2 תכנון והיתרים · 3 שיווק ומכירות · 4 בנייה · 5 מסירה ואכלוס
var STAGES=[
  {name:'איתור קרקע',desc:'אנחנו בוחנים את הקרקע, את הפוטנציאל התכנוני ואת הכדאיות הכלכלית.'},
  {name:'תכנון והיתרים',desc:'התכנון מתקדם מול האדריכלים והרשויות. השאירו פרטים ותהיו הראשונים לשמוע כשהשיווק נפתח.'},
  {name:'שיווק ומכירות',desc:'הפרויקט בשיווק — זה הזמן לבחור דירה, קומה וכיוון אוויר מתוך המלאי המלא.'},
  {name:'בנייה',desc:'העבודות בשטח מתקדמות. עדיין אפשר לרכוש מהדירות שנותרו, ולקבל עדכונים שוטפים מהאתר.'},
  {name:'מסירה ואכלוס',desc:'הדירות נמסרות לרוכשים, עם ליווי מסודר עד קבלת המפתח.'}
];
// תיאורי הפרויקטים — לעדכן כאן
var PROJECTS={
  p1:{stage:3,img:'images/towers.jpg',desc:'שלושה מגדלי מגורים באבן ירושלמית מעל פודיום פתוח עם בריכה וגינה מדורגת. דירות 4–6 חדרים, דירות גן ופנטהאוזים עם מבט אל העיר העתיקה.',
      specs:[['דירות','4–6 חדרים · דירות גן · פנטהאוזים'],['מאפיינים','פודיום, בריכה וגינה מדורגת'],['אכלוס משוער','[שנה]'],['החל מ־','[מחיר] ₪']],
      gallery:[['images/fl-pano.jpg','מבט פנורמי על שלושת מגדלי הכתר מעל קו הרקיע של ירושלים'],['images/fl-low.jpg','מבט מלמטה אל המגדלים, עם עץ זית בקדמת התמונה'],['images/fl-full.jpg','אחד המגדלים במלוא גובהו עם רחבת הכניסה המגוננת']]},
  p2:{stage:4,img:'images/arnona.jpg',desc:'צמד מגדלי מגורים בארנונה, בקצה הדרומי של העיר, עם נוף פתוח אל מדבר יהודה. חזיתות של אבן וזכוכית ומרפסות שפונות אל הנוף.',
      specs:[['דירות','3–5 חדרים'],['נוף','מדבר יהודה'],['אכלוס משוער','[שנה]'],['החל מ־','[מחיר] ₪']]},
  p3:{stage:3,img:'images/rehavia.jpg',desc:'בניין בוטיק של 14 דירות ברחוב שקט ומוצל ברחביה, בין העצים הוותיקים והבתים ההיסטוריים של השכונה. אבן ירושלמית, מרפסות עמוקות ופרטים שמכבדים את אופי הרחוב.',
      specs:[['היקף','בניין בוטיק · 14 דירות'],['שכונה','רחביה'],['אכלוס משוער','[שנה]'],['החל מ־','[מחיר] ₪']]},
  p4:{stage:2,img:'images/moshava.jpg',desc:'שימור של בית אבן היסטורי במושבה הגרמנית, ולצידו תוספת בנייה עכשווית של אבן וזכוכית. מספר מצומצם של דירות יוקרה שמחברות את הקסם של הבית הישן עם התכנון של היום.',
      specs:[['סוג','שימור ותוספת בנייה'],['דירות','דירות יוקרה'],['פתיחת שיווק','[מועד]'],['שכונה','המושבה הגרמנית']]},
  p5:{stage:2,img:'images/hero.jpg',desc:'מגדל מגורים על קו הרקיע של ירושלים, עם מבט אל העיר העתיקה. מעצי הזית שבבסיס המגדל ועד הקומות העליונות — כל דירה מתוכננת סביב הנוף.',
      specs:[['סוג','מגדל מגורים'],['נוף','העיר העתיקה'],['פתיחת שיווק','[מועד]'],['מיקום','[שכונה], ירושלים']]},
  p6:{stage:4,img:'images/tA0.jpg',desc:'השלב השני של מתחם הכתר ממשיך את השפה של מגדלי הכתר: אבן ירושלמית בהירה, לובי מפואר ודירות 4–5 חדרים מעל רחוב עירוני פעיל.',
      specs:[['דירות','4–5 חדרים'],['מאפיינים','לובי מפואר'],['אכלוס משוער','[שנה]'],['החל מ־','[מחיר] ₪']]}
};
var pm=$('#pm'),pmBody=$('#pmBody'),pmCur=null,pmReturn=null;
$$(':scope > *',pmBody).forEach(function(el,i){el.style.setProperty('--i',i)});
function pmCards(){return $$('.pcard[data-id]').filter(function(c){return !c.hidden})}
function pmFill(card){
  var id=card.dataset.id,p=PROJECTS[id],s=p.stage;
  pmCur=card;
  $('#pmImg').src=p.img;$('#pmImg').alt=$('.pcard__media img',card).alt;
  $('#pmNum').textContent=$('.pcard__n',card).textContent;
  $('#pmTag').textContent=$('.pcard__tag',card).textContent;
  $('#pmLoc').textContent=$('.pcard__loc',card).textContent;
  $('#pmName').textContent=$('.pcard__name',card).textContent;
  $('#pmDesc').textContent=p.desc;
  $('#pmStageN').textContent='0'+s;
  $('#pmStageName').textContent=STAGES[s-1].name;
  $('#pmStageDesc').textContent=STAGES[s-1].desc;
  pm.style.setProperty('--ring-off',100-s*20);
  var steps=$('#pmSteps');steps.style.setProperty('--sf',(s-1)/4);
  $$('li',steps).forEach(function(li,i){li.style.setProperty('--k',i);li.classList.toggle('is-done',i<s-1);li.classList.toggle('is-now',i===s-1);if(i===s-1)li.setAttribute('aria-current','step');else li.removeAttribute('aria-current')});
  var gal=$('#pmGallery');gal.hidden=!p.gallery;
  $('#pmShots').innerHTML=(p.gallery||[]).map(function(g,i){return '<figure class="pm__shot'+(i===0?' pm__shot--wide':'')+'"><img src="'+g[0]+'" alt="'+g[1]+'" loading="lazy"></figure>'}).join('');
  $('#pmSpecs').innerHTML=p.specs.map(function(r){return '<div><dt>'+r[0]+'</dt><dd>'+r[1]+'</dd></div>'}).join('');
  pmBody.scrollTop=0;
}
function pmOpen(card){
  pmReturn=document.activeElement;pmFill(card);
  pm.hidden=false;doc.classList.add('is-locked');
  pm.getBoundingClientRect();
  setTimeout(function(){pm.classList.add('is-open');$('.pm__btn--close').focus({preventScroll:true})},20);
}
function pmClose(){
  if(pm.hidden)return;
  pm.classList.remove('is-open');doc.classList.remove('is-locked');
  setTimeout(function(){if(!pm.classList.contains('is-open'))pm.hidden=true},700);
  if(pmReturn)pmReturn.focus({preventScroll:true});
}
function pmStep(d){
  var list=pmCards(),i=list.indexOf(pmCur);if(i<0)i=0;
  var next=list[(i+d+list.length)%list.length];
  pm.classList.add('is-swap');
  setTimeout(function(){pmFill(next);pm.classList.remove('is-swap')},280);
}
document.addEventListener('click',function(e){
  var card=e.target.closest('.pcard[data-id]');
  if(card){e.preventDefault();pmOpen(card);return}
  var op=e.target.closest('[data-open-project]');
  if(op){pmOpen($('.pcard[data-id="'+op.dataset.openProject+'"]'));return}
  if(e.target.closest('[data-pm-close]')){pmClose();return}
  var st=e.target.closest('[data-pm-step]');if(st){pmStep(+st.dataset.pmStep);return}
  if(e.target.closest('[data-pm-cta]'))pmClose();
});
document.addEventListener('keydown',function(e){
  if(pm.hidden)return;
  if(e.key==='Escape')pmClose();
  else if(e.key==='ArrowLeft')pmStep(1);
  else if(e.key==='ArrowRight')pmStep(-1);
  else if(e.key==='Tab'){
    var f=$$('button,a[href]',pm),first=f[0],last=f[f.length-1];
    if(e.shiftKey&&document.activeElement===first){e.preventDefault();last.focus()}
    else if(!e.shiftKey&&document.activeElement===last){e.preventDefault();first.focus()}
  }
});

/* ---------- scroll scenes ---------- */
var hero=$('.hero'),heroLogo=$('.hero__logo'),heroVid=$('video.hero__img');
if(heroVid&&reduce){heroVid.removeAttribute('autoplay');heroVid.pause()}
var day=$('.daylight'),dayFrame=$$('.daylight__frame img'),dayBg=$$('.daylight__bg img'),phases=$$('.phase'),ticks=$$('.daylight__ticks span'),dayCount=$('.daylight__count'),sun=$('.dial__sun');
var works=$('.works'),worksSticky=$('.works__sticky'),worksMeter=$('.works__meter');
var stmt=$('.statement'),portal=$('.portal'),svcWrap=$('.svc-wrap'),bar=$('.progress');
var parallax=$$('[data-parallax]');
var M={};
function top(el){var y=0;while(el){y+=el.offsetTop;el=el.offsetParent}return y}
function measure(){
  M.vh=window.innerHeight;M.doc=document.documentElement.scrollHeight;
  if(works&&track){
    var vw=$('.works__viewport').clientWidth;
    M.wDist=Math.max(0,track.scrollWidth-vw);
    if(isDesktop()&&!reduce){works.style.height=(M.vh+M.wDist)+'px'}else{works.style.height='';track.style.transform=''}
  }
  [['day',day],['works',works],['stmt',stmt],['portal',portal],['svc',svcWrap]].forEach(function(p){if(p[1]){M[p[0]]={t:top(p[1]),h:p[1].offsetHeight}}});
  fillEls.forEach(function(f){f.t=top(f.el);f.h=f.el.offsetHeight});
  parallax.forEach(function(img){img._t=top(img.parentNode);img._h=img.parentNode.offsetHeight});
  clips.forEach(function(c){c._t=top(c)});
  M.doc=document.documentElement.scrollHeight;
  last=-1;
}
function prog(m,y,startOff,len){return clamp((y-m.t+startOff)/len,0,1)}
var last=-1,lastDir=0,lastY=0;

function onScroll(y){
  var vh=M.vh;
  // header
  if(!doc.classList.contains('menu-open')){
    hdr.classList.toggle('is-solid',y>vh*.82);
    var d=y-lastY;
    if(Math.abs(d)>6){hdr.classList.toggle('is-hidden',d>0&&y>vh);}
  }
  lastDir=y>lastY?1:-1;lastY=y;
  bar.style.setProperty('--sp',(y/Math.max(1,M.doc-vh)).toFixed(4));
  if(fOn){var under=document.elementFromPoint(mx,my);if(!under||!under.closest('.svc-list')){fOn=false;svcFloat.classList.remove('is-on')}}
  if(clips.length)clips=clips.filter(function(c){if(y+vh*.9>c._t){c.classList.add('in');return false}return true});
  // hero
  if(y<vh*1.2)hero.style.setProperty('--hp',clamp(y/vh,0,1).toFixed(4));
  // play the hero video only while it's on screen
  if(heroVid&&!reduce){var onHero=y<vh*1.1;if(onHero&&heroVid.paused)heroVid.play().catch(function(){});else if(!onHero&&!heroVid.paused)heroVid.pause()}
  // day → night (scroll-linked image swap — kept for reduced motion too)
  if(M.day){
    var p=prog(M.day,y,0,M.day.h-vh);
    day.style.setProperty('--dp',p.toFixed(4));
    var a=clamp((p-.18)/.24,0,1),b=clamp((p-.58)/.24,0,1);
    [dayFrame,dayBg].forEach(function(set){set[1].style.opacity=a;set[2].style.opacity=b});
    var idx=p<.3?0:p<.7?1:2;
    if(day._idx!==idx){day._idx=idx;phases.forEach(function(el,i){el.classList.toggle('is-on',i===idx)});ticks.forEach(function(el,i){el.classList.toggle('is-on',i===idx)});dayCount.textContent='0'+(idx+1)}
    var th=p*Math.PI;sun.setAttribute('cx',(110+100*Math.cos(th)).toFixed(2));sun.setAttribute('cy',(110-100*Math.sin(th)).toFixed(2));
  }
  if(reduce)return;
  // manifesto words
  fillEls.forEach(function(f){
    var p=clamp((y+vh*.82-f.t)/(f.h+vh*.35),0,1),n=f.words.length,k=p*n*1.15;
    f.words.forEach(function(w,i){w.style.setProperty('--o',(.13+.87*clamp(k-i,0,1)).toFixed(3))});
  });
  // horizontal works
  if(M.works&&isDesktop()){
    var wp=M.wDist?prog(M.works,y,0,M.wDist):0;
    track.style.transform='translate3d('+(wp*M.wDist).toFixed(1)+'px,0,0)';
    worksMeter.style.setProperty('--wp',wp.toFixed(4));
  }
  // statement
  if(M.stmt){
    var sp=prog(M.stmt,y,0,M.stmt.h-vh);
    stmt.style.setProperty('--ss',(1.15-.15*clamp(sp/.5,0,1)).toFixed(4));
    stmt.style.setProperty('--sb',clamp((sp-.45)/.35,0,1).toFixed(4));
    stmt.style.setProperty('--sl',clamp(sp/.4,0,1).toFixed(4));
  }
  // portal
  if(M.portal){
    var pp=prog(M.portal,y,0,M.portal.h-vh);
    portal.style.setProperty('--pp',(pp*pp*(3-2*pp)).toFixed(4));
  }
  // services rail
  if(M.svc)svcWrap.style.setProperty('--rp',prog(M.svc,y,vh*.6,M.svc.h).toFixed(4));
  // parallax
  parallax.forEach(function(img){
    var c=(y+vh/2)-(img._t+img._h/2);
    if(Math.abs(c)<vh*1.5)img.style.translate='0 '+(c*-+img.dataset.parallax).toFixed(1)+'px';
  });
}

/* ---------- marquee ---------- */
var mq=$('[data-marquee]'),mqX=0,mqV=0,mqDir=1;

/* ---------- cursor, magnetic, tilt ---------- */
var cur=$('.cursor'),curLabel=$('.cursor__label'),mx=-100,my=-100,rx=-100,ry=-100;
var svcFloat=$('.svc-float'),svcImg=svcFloat&&$('img',svcFloat),fx=0,fy=0,fOn=false;
if(finePointer&&!reduce){
  window.addEventListener('pointermove',function(e){mx=e.clientX;my=e.clientY},{passive:true});
  document.addEventListener('pointerover',function(e){
    var lab=e.target.closest('[data-cursor]'),lnk=e.target.closest('a,button,.chip,input,textarea');
    cur.classList.toggle('is-label',!!lab);curLabel.textContent=lab?lab.dataset.cursor:'';
    cur.classList.toggle('is-link',!lab&&!!lnk);
  });
  document.addEventListener('pointerleave',function(){mx=my=-100});
  $$('[data-magnetic]').forEach(function(el){
    el.addEventListener('pointermove',function(e){var r=el.getBoundingClientRect();el.style.transform='translate('+((e.clientX-r.left-r.width/2)*.28).toFixed(1)+'px,'+((e.clientY-r.top-r.height/2)*.35).toFixed(1)+'px)'});
    el.addEventListener('pointerleave',function(){el.style.transform=''});
  });
  $$('.pcard').forEach(function(c){
    c.addEventListener('pointermove',function(e){var r=c.getBoundingClientRect();c.style.setProperty('--tx',(((e.clientX-r.left)/r.width-.5)*8).toFixed(2)+'deg');c.style.setProperty('--ty',(-((e.clientY-r.top)/r.height-.5)*8).toFixed(2)+'deg')});
    c.addEventListener('pointerleave',function(){c.style.setProperty('--tx','0deg');c.style.setProperty('--ty','0deg')});
  });
  $$('.adv').forEach(function(c){
    c.addEventListener('pointermove',function(e){var r=c.getBoundingClientRect();c.style.setProperty('--mx',(e.clientX-r.left)+'px');c.style.setProperty('--my',(e.clientY-r.top)+'px')});
  });
  var list=$('.svc-list');
  if(list){
    $$('.svc',list).forEach(function(li){li.addEventListener('pointerenter',function(){if(svcImg.getAttribute('src')!==li.dataset.img)svcImg.src=li.dataset.img;fOn=true;svcFloat.classList.add('is-on')})});
    list.addEventListener('pointerleave',function(){fOn=false;svcFloat.classList.remove('is-on')});
    // preload hover images
    $$('.svc',list).forEach(function(li){var im=new Image();im.src=li.dataset.img});
  }
}

/* ---------- main loop ---------- */
function loop(){
  var y=window.scrollY;
  if(y!==last){mqV+=Math.min(40,Math.abs(y-last))*.04;if(y!==last&&last>=0)mqDir=y>last?1:-1;onScroll(y);last=y}
  if(mq&&!reduce){
    mqV*=.92;mqX+=(0.6+mqV)*mqDir;
    var half=mq.scrollWidth/2;if(mqX>half)mqX-=half;if(mqX<0)mqX+=half;
    mq.style.transform='translate3d('+mqX.toFixed(1)+'px,0,0)';
  }
  if(finePointer&&!reduce){
    rx=lerp(rx,mx,.18);ry=lerp(ry,my,.18);
    cur.style.setProperty('--dx',mx+'px');cur.style.setProperty('--dy',my+'px');
    cur.style.setProperty('--rx',rx.toFixed(1)+'px');cur.style.setProperty('--ry',ry.toFixed(1)+'px');
    if(svcFloat&&(fOn||svcFloat.classList.contains('is-on'))){fx=lerp(fx,mx-140,.12);fy=lerp(fy,my-175,.12);svcFloat.style.transform='translate3d('+fx.toFixed(1)+'px,'+fy.toFixed(1)+'px,0) rotate('+((mx-140-fx)*.03).toFixed(2)+'deg)'}
  }
  requestAnimationFrame(loop);
}
measure();
var rt;window.addEventListener('resize',function(){clearTimeout(rt);rt=setTimeout(measure,120)});
window.addEventListener('load',measure);
if(window.ResizeObserver){var ro=new ResizeObserver(function(){clearTimeout(rt);rt=setTimeout(measure,120)});ro.observe(document.body)}
requestAnimationFrame(loop);

/* ---------- active nav link ---------- */
var navLinks=$$('.hdr__nav a');
var navIo=new IntersectionObserver(function(en){en.forEach(function(e){if(e.isIntersecting){navLinks.forEach(function(a){a.classList.toggle('is-active',a.getAttribute('href')==='#'+e.target.id)})}})},{rootMargin:'-45% 0px -50% 0px'});
navLinks.forEach(function(a){var s=$(a.getAttribute('href'));if(s)navIo.observe(s)});

/* ---------- contact form ---------- */
var btn=$('#sendBtn');
var g=function(id){return document.getElementById(id)};
var isLocal=/^(localhost|127\.0\.0\.1|\[::1\])$/.test(location.hostname)||location.protocol==='file:';
function showThanks(){g('formBox').hidden=true;g('thanks').hidden=false}
// שם חובה, ולפחות טלפון או דוא״ל — הודעות דרך בועת האימות של הדפדפן
function validate(){
  var name=g('ak-name'),phone=g('ak-phone'),mail=g('ak-mail');
  [name,phone,mail].forEach(function(f){f.setCustomValidity('')});
  if(!name.value.trim()){name.setCustomValidity('נא למלא שם');return name.reportValidity()}
  if(!phone.value.trim()&&!mail.value.trim()){phone.setCustomValidity('נא להשאיר טלפון או דוא״ל');return phone.reportValidity()}
  if(phone.value.trim()&&!/^[0-9+\-\s()]{9,}$/.test(phone.value.trim())){phone.setCustomValidity('מספר הטלפון אינו תקין');return phone.reportValidity()}
  if(mail.value.trim()&&!mail.checkValidity()){return mail.reportValidity()}
  return true;
}
btn.addEventListener('click',function(){
  if(btn.disabled||!validate())return;
  var topic=$('[data-g="topic"].on');
  var data={
    name:g('ak-name').value.trim(),
    phone:g('ak-phone').value.trim(),
    email:g('ak-mail').value.trim(),
    message:g('ak-msg').value.trim(),
    topic:topic?topic.textContent.trim():'',
    page:location.href,
    _subject:'פנייה חדשה מאתר אבני הכתר',
    _gotcha:g('ak-gotcha').value
  };
  if(data.email)data._replyto=data.email;
  if(FORM_ENDPOINT.indexOf('YOUR_FORM_ID')!==-1){
    console.warn('FORM_ENDPOINT לא הוגדר — הפנייה לא נשלחה',data);
    if(isLocal){showThanks()}else{alert('אירעה תקלה בשליחת הטופס. אפשר ליצור קשר בטלפון.')}
    return;
  }
  btn.disabled=true;
  fetch(FORM_ENDPOINT,{method:'POST',headers:{'Content-Type':'application/json','Accept':'application/json'},body:JSON.stringify(data)})
    .then(function(r){if(!r.ok)throw new Error(r.status);showThanks()})
    .catch(function(){btn.disabled=false;alert('השליחה נכשלה. נא לנסות שוב או ליצור קשר בטלפון.')});
});
})();
