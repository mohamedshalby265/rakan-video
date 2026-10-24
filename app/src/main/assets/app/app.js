/* راكان — واجهة التطبيق. كل الشاشات والألعاب هنا.
   الجسر مع أندرويد اسمه window.Rakan ومعرّف في MainActivity.kt */
(function(){
"use strict";

var B = window.Rakan || null;
var view=document.getElementById('view'), dock=document.getElementById('dock'), screenEl=document.getElementById('screen');
var brand=document.getElementById('brand'), starsEl=document.getElementById('stars'), minsLeftEl=document.getElementById('minsLeft');
var ringPath=document.getElementById('ringPath'), meBadge=document.getElementById('meBadge'), hintSlot=document.getElementById('hintSlot');
var fileFace=document.getElementById('fileFace');

var AR=['٠','١','٢','٣','٤','٥','٦','٧','٨','٩'];
function ar(n){return String(n).split('').map(function(c){return /[0-9]/.test(c)?AR[+c]:c;}).join('');}
function p3(n){return ('00'+n).slice(-3);}

/* ---------------- الصوت ---------------- */
var ac=null;
function tone(f,d,t){
  if(state.mute) return;
  try{
    ac=ac||new (window.AudioContext||window.webkitAudioContext)();
    if(ac.state==='suspended')ac.resume();
    var o=ac.createOscillator(),g=ac.createGain();
    o.type=t||'sine'; o.frequency.value=f; o.connect(g); g.connect(ac.destination);
    var n=ac.currentTime;
    g.gain.setValueAtTime(0.0001,n);
    g.gain.exponentialRampToValueAtTime(.12,n+.02);
    g.gain.exponentialRampToValueAtTime(.0001,n+(d||.18));
    o.start(n); o.stop(n+(d||.18)+.03);
  }catch(e){}
}

/* مشغّل الأصوات المسجّلة. بيدوّر على الملف في مجلد /Rakan/sounds
   ولو ملقاهوش بيرجع لصوت التطبيق أو للنغمة البسيطة. */
var audio=new Audio();
audio.preload='auto';
function soundUrl(rel){
  if(!B)return '';
  try{ return B.soundUrl(rel)||''; }catch(e){ return ''; }
}
function hasSound(rel){ return soundUrl(rel)!==''; }
function sfx(rel,fallback){
  if(state.mute){ return false; }
  var url=soundUrl(rel);
  if(!url){ if(fallback)fallback(); return false; }
  try{
    audio.pause();
    audio.currentTime=0;
    audio.src=url;
    audio.onerror=function(){ if(fallback)fallback(); };
    var p=audio.play();
    if(p&&p.catch)p.catch(function(){ if(fallback)fallback(); });
    return true;
  }catch(e){ if(fallback)fallback(); return false; }
}
function stopSfx(){
  try{ audio.pause(); }catch(e){}
  if(B){ try{ B.stopSpeaking(); }catch(e){} }
}

/* صوت التطبيق = قارئ أندرويد المدمّج */
var ttsOk=false;
try{ ttsOk = B ? !!B.ttsReady() : false; }catch(e){ ttsOk=false; }
window.onRakanTts=function(ok){ ttsOk=!!ok; };
function speak(text,lang){
  if(state.mute) return false;
  if(!B||!ttsOk) return false;
  try{ B.speak(text,lang||'ar'); return true; }catch(e){ return false; }
}

/* النطق حسب الصوت المختار للقسم:
   app = قارئ أندرويد · mom = تسجيلات ماما · dad = تسجيلات بابا */
function voiceOf(section){ return (state.voices&&state.voices[section])||'app'; }
function say(section, relAfterVoice, text, lang, tn){
  var v=voiceOf(section);
  function toneFb(){ if(tn)tn(); }
  function ttsFb(){ if(!speak(text,lang)) toneFb(); }
  if(v==='app'){ ttsFb(); return; }
  sfx('sounds/'+v+'/'+relAfterVoice, ttsFb);
}

/* ---------------- السحب ---------------- */
function addSwipe(el,cb){
  var x0=0,y0=0,t0=0,on=false;
  el.addEventListener('pointerdown',function(e){ x0=e.clientX;y0=e.clientY;t0=Date.now();on=true; });
  el.addEventListener('pointerup',function(e){
    if(!on)return; on=false;
    var dx=e.clientX-x0, dy=e.clientY-y0, dt=Date.now()-t0;
    if(dt>1000)return;
    var ax=Math.abs(dx), ay=Math.abs(dy);
    if(ax<40&&ay<40){ if(cb.tap)cb.tap(); return; }
    if(ax>ay){ if(dx<0&&cb.left)cb.left(); else if(dx>0&&cb.right)cb.right(); }
    else { if(dy<0&&cb.up)cb.up(); else if(dy>0&&cb.down)cb.down(); }
  });
  el.addEventListener('pointercancel',function(){on=false;});
}

/* ---------------- الرسومات ---------------- */
function rakan(mood,cls){
  var eye = mood==='sleep'
    ? '<path d="M21 21q5 4 10 0" stroke="#22324F" stroke-width="2" fill="none" stroke-linecap="round"/>'
    : '<circle cx="26" cy="21" r="5.2" fill="#fff"/><circle cx="27.2" cy="21.6" r="2.7" fill="#22324F"/><circle cx="28.3" cy="20.4" r="1" fill="#fff"/>';
  var zzz = mood==='sleep' ? '<text x="52" y="22" font-size="13" font-weight="800" fill="#8A74E8">zZ</text>' : '';
  var arm = mood==='cheer' ? '<rect x="30" y="44" width="8" height="20" rx="4" fill="#E0BE8E" transform="rotate(-38 34 54)"/>' : '';
  return '<svg class="'+(cls||'')+'" viewBox="0 0 100 100" aria-hidden="true">'+
    '<rect x="26" y="66" width="8" height="19" rx="4" fill="#D8B383"/><rect x="62" y="66" width="8" height="19" rx="4" fill="#D8B383"/>'+
    '<rect x="38" y="68" width="8" height="18" rx="4" fill="#E8C799"/><rect x="52" y="68" width="8" height="18" rx="4" fill="#E8C799"/>'+
    '<ellipse cx="50" cy="57" rx="26" ry="17" fill="#F2D5A8"/>'+
    '<path d="M33 46 Q50 23 67 46 Z" fill="#F2D5A8"/>'+
    '<path d="M39 44 Q50 31 61 44 L61 49 Q50 43 39 49 Z" fill="#EF5B42"/>'+
    '<path d="M76 50 Q85 53 82 64" stroke="#E0BE8E" stroke-width="3.6" fill="none" stroke-linecap="round"/>'+arm+
    '<path d="M27 56 Q18 41 23 27 L36 29 Q31 44 38 54 Z" fill="#F2D5A8"/>'+
    '<ellipse cx="32" cy="13.5" rx="3.6" ry="5.4" fill="#E0BE8E"/>'+
    '<ellipse cx="26" cy="24" rx="14" ry="12.4" fill="#F2D5A8"/>'+
    '<ellipse cx="15.5" cy="28.5" rx="8.4" ry="6.6" fill="#FBE7C8"/>'+
    '<circle cx="11.5" cy="27" r="1.3" fill="#C49A68"/>'+
    '<path d="M11.5 31.5 Q15.5 34 19.5 31.5" stroke="#C49A68" stroke-width="1.5" fill="none" stroke-linecap="round"/>'+eye+
    '<path d="M20.5 14.5 Q26 11.5 31.5 14.5" stroke="#22324F" stroke-width="1.7" fill="none" stroke-linecap="round"/>'+zzz+'</svg>';
}

var SKIN=['#F8D9BF','#F0C4A0','#E0A878','#C98B5E','#A86A42','#7E4A2B'];
var HAIRC=['#1E1710','#3B2A1C','#6E4B2A','#A9703A','#D7B36B','#8C8C8C'];
var SHIRT=['#3FA9E0','#EF5B42','#23AE84','#8A74E8','#F5A623','#E8608F'];
var FACES=['بيضاوي','دائري','مربّع','مدبّب'];
var HAIRS=['قصير','كيرلي','بغرة','مموّج','طويل','حليقة'];
var EYES=['واسعة','لوزية','صغيرة','ضاحكة'];

function avatarSvg(p){
  var skin=SKIN[p.skin], hair=HAIRC[p.hairColor], shirt=SHIRT[p.shirt];
  var face=[
    '<ellipse cx="50" cy="50" rx="25" ry="29" fill="'+skin+'"/>',
    '<circle cx="50" cy="50" r="27" fill="'+skin+'"/>',
    '<rect x="24" y="22" width="52" height="56" rx="18" fill="'+skin+'"/>',
    '<path d="M50 80 C 26 68, 23 44, 27 34 C 34 22, 66 22, 73 34 C 77 44, 74 68, 50 80 Z" fill="'+skin+'"/>'
  ][p.face];
  var hairs=[
    '<path d="M23 44 C 24 22, 76 22, 77 44 C 72 36, 64 31, 50 31 C 36 31, 28 36, 23 44 Z" fill="'+hair+'"/>',
    '<g fill="'+hair+'"><circle cx="32" cy="30" r="11"/><circle cx="50" cy="24" r="12"/><circle cx="68" cy="30" r="11"/><circle cx="24" cy="42" r="8"/><circle cx="76" cy="42" r="8"/></g>',
    '<path d="M22 46 C 22 22, 78 22, 78 46 L 78 36 C 66 44, 44 40, 30 48 Z" fill="'+hair+'"/><rect x="22" y="33" width="56" height="12" rx="6" fill="'+hair+'"/>',
    '<path d="M22 46 C 24 20, 76 20, 78 46 C 72 38, 68 44, 60 36 C 52 44, 46 34, 38 42 C 32 36, 28 42, 22 46 Z" fill="'+hair+'"/>',
    '<path d="M20 46 C 20 20, 80 20, 80 46 L 80 72 C 76 60, 74 50, 72 44 C 62 36, 38 36, 28 44 C 26 50, 24 60, 20 72 Z" fill="'+hair+'"/>',
    '<path d="M26 42 C 28 26, 72 26, 74 42 C 68 36, 32 36, 26 42 Z" fill="'+hair+'" opacity=".82"/>'
  ][p.hair];
  var eyes=[
    '<circle cx="39" cy="50" r="5" fill="#fff"/><circle cx="61" cy="50" r="5" fill="#fff"/><circle cx="39.8" cy="50.6" r="2.7" fill="#22324F"/><circle cx="61.8" cy="50.6" r="2.7" fill="#22324F"/>',
    '<path d="M33 50 q6 -6 12 0 q-6 6 -12 0z" fill="#fff"/><path d="M55 50 q6 -6 12 0 q-6 6 -12 0z" fill="#fff"/><circle cx="39" cy="50" r="2.6" fill="#22324F"/><circle cx="61" cy="50" r="2.6" fill="#22324F"/>',
    '<circle cx="39" cy="50" r="2.9" fill="#22324F"/><circle cx="61" cy="50" r="2.9" fill="#22324F"/>',
    '<path d="M33 52 q6 -7 12 0" stroke="#22324F" stroke-width="3" fill="none" stroke-linecap="round"/><path d="M55 52 q6 -7 12 0" stroke="#22324F" stroke-width="3" fill="none" stroke-linecap="round"/>'
  ][p.eyes];
  return '<svg viewBox="0 0 100 100" aria-hidden="true"><rect width="100" height="100" fill="#E8EFF7"/>'+
    '<path d="M18 100 C 20 84, 34 76, 50 76 C 66 76, 80 84, 82 100 Z" fill="'+shirt+'"/>'+
    '<rect x="43" y="68" width="14" height="12" fill="'+skin+'"/>'+
    '<ellipse cx="24" cy="52" rx="5" ry="6" fill="'+skin+'"/><ellipse cx="76" cy="52" rx="5" ry="6" fill="'+skin+'"/>'+
    face+hairs+eyes+
    '<path d="M41 62 q9 7 18 0" stroke="#B4654A" stroke-width="2.6" fill="none" stroke-linecap="round"/>'+
    '<path d="M33 41 q6 -3 11 -1" stroke="'+hair+'" stroke-width="2.4" fill="none" stroke-linecap="round"/>'+
    '<path d="M56 40 q5 -2 11 1" stroke="'+hair+'" stroke-width="2.4" fill="none" stroke-linecap="round"/></svg>';
}

function iPhoto(){return '<svg width="46" height="46" viewBox="0 0 48 48"><rect x="6" y="12" width="36" height="27" rx="6" fill="#fff" opacity=".95"/><circle cx="17" cy="21" r="4" fill="#F5A623"/><path d="M10 35l9-9 6 6 5-5 8 8v2a2 2 0 0 1-2 2H12a2 2 0 0 1-2-2v-2z" fill="#23AE84"/></svg>';}
function iPlay(){return '<svg width="46" height="46" viewBox="0 0 48 48"><rect x="12" y="7" width="24" height="34" rx="7" fill="#fff" opacity=".95"/><path d="M21 17.5l9 6.5-9 6.5v-13z" fill="#EF5B42"/></svg>';}
function iPuzzle(s){s=s||46;return '<svg width="'+s+'" height="'+s+'" viewBox="0 0 48 48"><circle cx="17" cy="17" r="8" fill="#fff" opacity=".95"/><rect x="25" y="9" width="16" height="16" rx="4" fill="#fff" opacity=".8"/><path d="M24 40l-9-14h18l-9 14z" fill="#fff" opacity=".9"/></svg>';}
function iHeart(s){s=s||46;return '<svg width="'+s+'" height="'+s+'" viewBox="0 0 48 48"><path d="M24 39S9 30 9 20.5C9 15.8 12.6 12 17.2 12c2.9 0 5.4 1.5 6.8 3.8 1.4-2.3 3.9-3.8 6.8-3.8C35.4 12 39 15.8 39 20.5 39 30 24 39 24 39z" fill="#fff" opacity=".95"/></svg>';}
function iPray(){return '<svg width="46" height="46" viewBox="0 0 48 48"><rect x="7" y="33" width="34" height="7" rx="3" fill="#fff" opacity=".8"/><circle cx="18" cy="15" r="5" fill="#fff" opacity=".95"/><path d="M13 33c0-7 3-12 7-12s5 3 11 5c2 .7 2.5 3 1 4.5-1.3 1.3-3.2.7-5-.2V33H13z" fill="#fff" opacity=".95"/></svg>';}
function iBook(){return '<svg width="46" height="46" viewBox="0 0 48 48"><path d="M24 14c-4-3-9-4-14-3v22c5-1 10 0 14 3 4-3 9-4 14-3V11c-5-1-10 0-14 3z" fill="#fff" opacity=".95"/><path d="M24 14v22" stroke="#5A9A46" stroke-width="2.2" stroke-linecap="round"/></svg>';}
function iHome(){return '<svg width="28" height="28" viewBox="0 0 24 24"><path d="M3.6 10.6L12 4l8.4 6.6V20a1 1 0 0 1-1 1h-4.6v-6h-5.6v6H4.6a1 1 0 0 1-1-1v-9.4z" fill="#22324F"/></svg>';}
function iBack(){return '<svg width="22" height="22" viewBox="0 0 24 24"><path d="M9 5l7 7-7 7" stroke="#22324F" stroke-width="2.4" fill="none" stroke-linecap="round" stroke-linejoin="round"/></svg>';}
function iStar(on,s){s=s||12;return '<svg width="'+s+'" height="'+s+'" viewBox="0 0 24 24"><path d="M12 2.6l2.9 6 6.6.9-4.8 4.6 1.2 6.5L12 17.5 6.1 20.6l1.2-6.5L2.5 9.5l6.6-.9L12 2.6z" fill="'+(on?'#F5A623':'#CDD6E2')+'"/></svg>';}
function iSpk(){return '<svg width="17" height="17" viewBox="0 0 24 24"><path d="M5 9.5h3.5L13 5.5v13L8.5 14.5H5v-5z" fill="#fff"/><path d="M16 9a4.5 4.5 0 0 1 0 6M18.5 6.5a8 8 0 0 1 0 11" stroke="#fff" stroke-width="2" fill="none" stroke-linecap="round"/></svg>';}
function iChev(d){return '<svg width="24" height="24" viewBox="0 0 24 24"><path d="'+(d==='up'?'M6 15l6-6 6 6':'M6 9l6 6 6-6')+'" stroke="#fff" stroke-width="2.6" fill="none" stroke-linecap="round" stroke-linejoin="round"/></svg>';}
function iArrow(d){return '<svg width="24" height="24" viewBox="0 0 24 24"><path d="'+(d==='right'?'M9 5l7 7-7 7':'M15 5l-7 7 7 7')+'" stroke="#fff" stroke-width="2.6" fill="none" stroke-linecap="round" stroke-linejoin="round"/></svg>';}
function iGear(){return '<svg width="21" height="21" viewBox="0 0 24 24"><circle cx="12" cy="12" r="3.2" stroke="#22324F" stroke-width="2" fill="none"/><path d="M12 3.5v2M12 18.5v2M3.5 12h2M18.5 12h2M6 6l1.4 1.4M16.6 16.6L18 18M18 6l-1.4 1.4M7.4 16.6L6 18" stroke="#22324F" stroke-width="2" stroke-linecap="round"/></svg>';}

function shapeSvg(k,c,s){s=s||56;var m={
  circle:'<circle cx="32" cy="32" r="24" fill="'+c+'"/>',
  square:'<rect x="9" y="9" width="46" height="46" rx="9" fill="'+c+'"/>',
  triangle:'<path d="M32 7l25 46H7L32 7z" fill="'+c+'"/>',
  star:'<path d="M32 6l7.6 16 17.4 2.4-12.7 12.1L47.5 54 32 45.7 16.5 54l3.2-17.5L7 24.4 24.4 22 32 6z" fill="'+c+'"/>',
  heart:'<path d="M32 55S8 42 8 25.5C8 17.5 14 12 21 12c4.6 0 8.6 2.5 11 6.3C34.4 14.5 38.4 12 43 12c7 0 13 5.5 13 13.5C56 42 32 55 32 55z" fill="'+c+'"/>'};
  return '<svg width="'+s+'" height="'+s+'" viewBox="0 0 64 64">'+m[k]+'</svg>';}

/* ---------------- المحتوى ---------------- */
var APPS=[
  {id:'photos',name:'الصور',color:'var(--sky)',art:iPhoto},
  {id:'reels',name:'فيديوهات',color:'var(--melon)',art:iPlay},
  {id:'letters',name:'الحروف',color:'var(--grape)',glyph:'أ'},
  {id:'numbers',name:'الأرقام',color:'var(--mint)',glyph:'٣'},
  {id:'games',name:'ألعاب',color:'var(--sun)',art:iPuzzle},
  {id:'manners',name:'أخلاقي',color:'var(--rose)',art:iHeart},
  {id:'prayer',name:'الصلاة',color:'var(--teal)',art:iPray},
  {id:'quran',name:'القرآن',color:'var(--olive)',art:iBook},
  {id:'animals',name:'حيوانات',color:'#E58A3B',glyph:'🐱'},
  {id:'fruits',name:'الأكل',color:'#C4435F',glyph:'🍎'}
];
var AR_L=[['أ','أرنب'],['ب','بطة'],['ت','تفاحة'],['ث','ثعلب'],['ج','جمل'],['ح','حصان'],['خ','خروف'],['د','دُب'],['ذ','ذرة'],['ر','رمان'],['ز','زرافة'],['س','سمكة'],['ش','شمس'],['ص','صاروخ'],['ض','ضفدع'],['ط','طيارة'],['ظ','ظرف'],['ع','عصفور'],['غ','غزال'],['ف','فيل'],['ق','قطة'],['ك','كتاب'],['ل','ليمونة'],['م','موزة'],['ن','نحلة'],['ه','هدية'],['و','وردة'],['ي','يد']];
var EN_L=[['A','Apple'],['B','Ball'],['C','Cat'],['D','Duck'],['E','Egg'],['F','Fish'],['G','Goat'],['H','Hat'],['I','Ice'],['J','Jam'],['K','Kite'],['L','Lion'],['M','Moon'],['N','Nest'],['O','Owl'],['P','Pen'],['Q','Queen'],['R','Rain'],['S','Sun'],['T','Tree'],['U','Umbrella'],['V','Van'],['W','Water'],['X','Box'],['Y','Yoyo'],['Z','Zebra']];
var MANNERS=['لمّا حد يديك حاجة، قول: شكراً يا حبيبي','اغسل إيديك كويس قبل ما تاكل','لمّا تدخل البيت قول: السلام عليكم','ماتاخدش لعبة حد من غير ما تستأذن','لمّا تغلط، قول: أنا آسف — دي شجاعة','كلّم ماما وبابا بصوت هادي ومتعلّيش صوتك','شارك لعبك مع أخواتك وأصحابك','لمّا تاخد حاجة، خدها بإيدك اليمين'];
var PRAYER=[['نجهّز نفسنا','نتوضّا ونلبس هدوم نضيفة'],['نقف ونتجه للقبلة','نقف مستعدلين ونبصّ ناحية القبلة'],['نكبّر','نرفع إيدينا ونقول: الله أكبر'],['نقرا','نقرا الفاتحة وسورة قصيرة'],['نركع','نحني ضهرنا ونقول: سبحان ربي العظيم'],['نسجد','نسجد على الأرض ونقول: سبحان ربي الأعلى'],['نسلّم','في الآخر نقول: السلام عليكم ورحمة الله']];

/* السور بترقيمها في المصحف — عشان أي مصحف منزّل بأرقام قياسية يشتغل على طول */
var SURAHS=[
  {n:1,name:'الفاتحة',a:7},{n:114,name:'الناس',a:6},{n:113,name:'الفلق',a:5},
  {n:112,name:'الإخلاص',a:4},{n:111,name:'المسد',a:5},{n:110,name:'النصر',a:3},
  {n:109,name:'الكافرون',a:6},{n:108,name:'الكوثر',a:3},{n:107,name:'الماعون',a:7},
  {n:106,name:'قريش',a:4},{n:105,name:'الفيل',a:5},{n:104,name:'الهمزة',a:9},
  {n:103,name:'العصر',a:3},{n:102,name:'التكاثر',a:8},{n:101,name:'القارعة',a:11},
  {n:100,name:'العاديات',a:11},{n:99,name:'الزلزلة',a:8},{n:97,name:'القدر',a:5},
  {n:95,name:'التين',a:8},{n:94,name:'الشرح',a:8},{n:93,name:'الضحى',a:11}
];

var DEMO_PHOTOS=[['#8ED8F8','#FFD98A','sun'],['#FFC2D6','#F6A5C0','balloon'],['#B9E8C4','#6CBF72','sun'],['#FFE1A8','#F5A623','balloon'],['#C9C2F7','#8A74E8','sun'],['#A8E4EA','#128C9B','balloon']];
function sceneSvg(seed){
  var sky=seed[0],a=seed[1],k=seed[2];
  var ex = k==='sun'
    ? '<circle cx="78" cy="26" r="13" fill="#FFF0B8"/><path d="M0 72 C 22 50, 44 58, 62 70 C 80 82, 92 60, 100 66 L100 100 L0 100 Z" fill="'+a+'"/>'
    : '<circle cx="34" cy="38" r="12" fill="'+a+'"/><circle cx="62" cy="30" r="9" fill="#FFF0B8"/><rect x="33" y="50" width="2" height="26" fill="#9AA6B5"/><path d="M0 78 L100 78 L100 100 L0 100 Z" fill="'+a+'" opacity=".7"/>';
  return '<svg viewBox="0 0 100 100" preserveAspectRatio="xMidYMid slice"><rect width="100" height="100" fill="'+sky+'"/>'+ex+'</svg>';
}

var GAMES=[
  {id:'balloons',name:'فرقع البلالين',color:'var(--rose)'},
  {id:'fruit',name:'اقطف الفاكهة',color:'var(--mint)'},
  {id:'car',name:'العربية',color:'var(--melon)'},
  {id:'shapes',name:'طابق الأشكال',color:'var(--grape)'},
  {id:'order',name:'رتب الأرقام',color:'var(--sun)'},
  {id:'memory',name:'الذاكرة',color:'var(--teal)',minAge:'4-5'},
  {id:'pattern',name:'تابع النمط',color:'var(--sky)',minAge:'4-5'}
];
var CFG={
  '2-3':{bSpeed:.45,bR:38,bTarget:8,fSpeed:1.1,fRocks:false,fTarget:8,cSpeed:1.4,cTarget:6,shapes:3,pairs:0,omax:6,patTarget:5},
  '4-5':{bSpeed:.75,bR:31,bTarget:12,fSpeed:1.7,fRocks:true,fTarget:12,cSpeed:2.1,cTarget:10,shapes:5,pairs:4,omax:9,patTarget:7},
  '6+' :{bSpeed:1.1,bR:25,bTarget:16,fSpeed:2.4,fRocks:true,fTarget:16,cSpeed:3,cTarget:14,shapes:5,pairs:6,omax:14,patTarget:10}
};
function cfg(){return CFG[state.age]||CFG['4-5'];}

/* ---------------- الحالة ---------------- */
var state={
  pin:'1234', childName:'', age:'4-5', minutes:20, mute:false,
  hidden:{}, hasAvatar:false, avatar:{face:0,skin:1,hair:0,hairColor:1,eyes:0,shirt:0},
  hintShown:false, stars:0, traced:{},
  voices:{letters:'app',numbers:'app',manners:'app',prayer:'app',animals:'app',fruits:'app'},
  repoOwner:'mohamedshalby265', repoName:'rakan-video'
};
var VOICES=[{id:'app',name:'التطبيق'},{id:'mom',name:'ماما'},{id:'dad',name:'بابا'}];
function voiceName(id){for(var i=0;i<VOICES.length;i++)if(VOICES[i].id===id)return VOICES[i].name;return 'التطبيق';}
var ui={app:null,lang:'ar',picked:null,pickedIndex:0,photoIndex:0,reelIndex:0,mannerIndex:0,prayerStep:0,surah:null,
  gameRound:0,gameScore:0,gameTarget:null,gameOpts:[]};
var photos=[], videos=[], hasAccess=true;

function savePrefs(){
  if(!B)return;
  try{B.setPrefs(JSON.stringify({pin:state.pin,childName:state.childName,age:state.age,minutes:state.minutes,
    mute:state.mute,hidden:state.hidden,hasAvatar:state.hasAvatar,avatar:state.avatar,hintShown:state.hintShown,stars:state.stars,traced:state.traced,
    voices:state.voices,repoOwner:state.repoOwner,repoName:state.repoName}));}catch(e){}
}
function loadPrefs(){
  if(!B)return;
  try{
    var raw=B.getPrefs();
    if(raw){var p=JSON.parse(raw); for(var k in p){if(p[k]!==undefined)state[k]=p[k];}}
    if(!state.repoOwner)state.repoOwner='mohamedshalby265';
    if(!state.repoName)state.repoName='rakan-video';
  }catch(e){}
}
function loadMedia(){
  photos=[]; videos=[];
  if(B){
    try{ hasAccess = !!B.hasAccess(); }catch(e){ hasAccess=true; }
    try{
      JSON.parse(B.listMedia('photos')).forEach(function(f){photos.push({kind:'file',url:f.url,title:f.title});});
      JSON.parse(B.listMedia('videos')).forEach(function(f){videos.push({kind:'file',url:f.url,title:f.title});});
    }catch(e){}
  }
  if(!photos.length) photos=DEMO_PHOTOS.map(function(s){return {kind:'demo',seed:s};});
}
function folder(kind){ try{ return B?B.folderPath(kind):'/storage/emulated/0/Rakan/'+kind; }catch(e){ return '/storage/emulated/0/Rakan/'+kind; } }
function countSounds(rel){ try{ return B?B.countSounds(rel):0; }catch(e){ return 0; } }

/* ---------------- وقت اللعب ---------------- */
var sessionStart=Date.now(), timeUpShown=false;
function minutesLeft(){ return Math.max(0,Math.ceil(state.minutes-(Date.now()-sessionStart)/60000)); }
setInterval(function(){
  renderStatus();
  if(!timeUpShown && minutesLeft()<=0 && !document.getElementById('settings') && !document.getElementById('gate')){
    timeUpShown=true; stopGame(); stopSfx(); closeLayer('reelLayer'); closeLayer('viewer'); showTimeUp(true);
  }
},20000);

function renderStatus(){
  var left=minutesLeft();
  var on=Math.max(0,Math.ceil(left/state.minutes*5)), h='';
  for(var i=0;i<5;i++) h+=iStar(i<on);
  starsEl.innerHTML=h;
  minsLeftEl.textContent=ar(left)+' د';
  meBadge.innerHTML = state.hasAvatar ? avatarSvg(state.avatar) : rakan('happy');
}

/* ---------------- الشاشة الرئيسية ---------------- */
function visibleApps(){return APPS.filter(function(a){return !state.hidden[a.id];});}
function appTile(a){
  var art=a.glyph?'<span class="glyph">'+a.glyph+'</span>':a.art();
  return '<button class="app" data-app="'+a.id+'"><span class="tile" style="background:'+a.color+'">'+art+'</span><span class="label">'+a.name+'</span></button>';
}
function renderHome(){
  var who=state.childName?' يا '+state.childName:' يا بطل';
  var apps=visibleApps();
  view.innerHTML='<div class="greetrow"><span class="rk bobbing">'+rakan('happy')+'</span>'+
    '<p class="greet">أهلاً'+who+'!<br><span>تحب تلعب إيه النهارده؟</span></p></div>'+
    '<div class="grid">'+apps.map(appTile).join('')+'</div>';
  dock.innerHTML=apps.slice(0,3).map(function(a){
    var art=a.glyph?'<span class="glyph" style="font-size:22px">'+a.glyph+'</span>':a.art().replace(/width="46" height="46"/,'width="26" height="26"');
    return '<button class="dock-mini" data-app="'+a.id+'" style="background:'+a.color+'" aria-label="'+a.name+'">'+art+'</button>';
  }).join('');
  if(!state.hintShown){
    hintSlot.innerHTML='<div class="hint">اضغط مطوّل على «راكان» عشان تفتح إعدادات ولي الأمر<button data-act="hide-hint">تمام</button></div>';
  }
}
function bar(t,x){return '<div class="appbar"><button class="rbtn" data-act="home" style="background:rgba(255,255,255,.7);width:38px;height:38px">'+iBack()+'</button><h2>'+t+'</h2>'+(x||'')+'</div>';}
function homeDock(){dock.innerHTML='<button class="homebtn" data-act="home" aria-label="الرئيسية">'+iHome()+'</button>';}

/* ---------------- الحروف والأرقام ---------------- */
function sayLetter(i){
  var lang=ui.lang, set=lang==='ar'?AR_L:EN_L, l=set[i];
  var text = state.age==='2-3' ? l[0] : (l[0]+' ... '+l[1]);
  say('letters','letters/'+lang+'/'+(i+1), text, lang, function(){ tone(400+i*18,.26); });
}
function sayNumber(n){
  say('numbers','numbers/'+n, ar(n), 'ar', function(){ tone(380+n*40,.26); });
}

function renderLetters(){
  var set=ui.lang==='ar'?AR_L:EN_L, p=ui.picked, body;
  if(p){
    body='<div class="bigcard"><div class="big" style="direction:ltr">'+p[0]+'</div>'+
      '<div class="wave"><i></i><i></i><i></i><i></i><i></i></div>'+
      (state.age==='2-3'?'':'<div class="word">'+p[1]+'</div>')+
      '<div class="rowbtns" style="width:100%"><button data-act="again">تاني</button><button data-act="trace">ارسم الحرف ✏️</button><button data-act="back-grid">كل الحروف</button></div></div>';
  } else {
    body='<div class="chips"><button class="chip" data-lang="ar" aria-pressed="'+(ui.lang==='ar')+'">عربي</button>'+
      '<button class="chip" data-lang="en" aria-pressed="'+(ui.lang==='en')+'">English</button></div>'+
      '<div class="tilegrid">'+set.map(function(l,i){return '<button class="lt" data-letter="'+i+'" style="direction:ltr">'+l[0]+'</button>';}).join('')+'</div>';
  }
  view.innerHTML=bar('الحروف','<span class="pill">بصوت '+voiceName(voiceOf('letters'))+'</span>')+body; homeDock();
}
function renderNumbers(){
  var p=ui.picked, body, max=state.age==='6+'?20:10;
  if(p){var d='';for(var i=0;i<Math.min(p,20);i++)d+='<i></i>';
    body='<div class="bigcard"><div class="big" style="color:var(--mint)">'+ar(p)+'</div>'+
      '<div class="wave"><i></i><i></i><i></i><i></i><i></i></div><div class="dots">'+d+'</div>'+
      '<div class="rowbtns" style="width:100%"><button data-act="again">تاني</button><button data-act="trace">ارسم الرقم ✏️</button><button data-act="back-grid">كل الأرقام</button></div></div>';
  } else {
    var t='';for(var n=1;n<=max;n++)t+='<button class="lt" data-num="'+n+'" style="color:var(--mint)">'+ar(n)+'</button>';
    body='<div class="tilegrid'+(max>10?'':' wide')+'">'+t+'</div>';
  }
  view.innerHTML=bar('الأرقام','<span class="pill">١ إلى '+ar(max)+'</span>')+body; homeDock();
}

/* ---------------- الصور ---------------- */
function photoHtml(p,lazy){return p.kind==='file'?'<img src="'+p.url+'" alt=""'+(lazy?' loading="lazy"':'')+'>':sceneSvg(p.seed);}
function emptyBox(what,path){
  return '<div class="empty"><span class="rk">'+rakan('happy')+'</span>'+
    '<b>مفيش '+what+' لسه</b>'+
    '<p>حط الملفات في المجلد ده على الموبايل:<br><code>'+path+'</code><br>وهتظهر هنا على طول.</p></div>';
}
function renderPhotos(){
  var body = photos.length
    ? '<div class="photogrid">'+photos.map(function(p,i){return '<button class="ph" data-photo="'+i+'">'+photoHtml(p,true)+'</button>';}).join('')+'</div>'
    : emptyBox('صور',folder('photos'));
  view.innerHTML=bar('الصور','<span class="pill">'+ar(photos.length)+'</span>')+body; homeDock();
}
/* معرض الصور بيفتح شريط واحد كامل فيه كل الصور جنب بعض، وبيتقلب بسحبة واحدة
   زي قصص انستجرام — مفيش زراير ومفيش إعادة بناء للشاشة كل مرة. */
function openViewer(){
  closeLayer('viewer');
  var el=document.createElement('div'); el.className='viewer'; el.id='viewer';
  el.innerHTML='<div class="frame" id="photoFrame">'+
      photos.map(function(p,i){return '<div class="pg">'+photoHtml(p,Math.abs(i-ui.photoIndex)>1)+'</div>';}).join('')+
    '</div><div class="bar"><span class="count" id="phCount">'+ar(ui.photoIndex+1)+' / '+ar(photos.length)+'</span>'+
    '<button class="rbtn" data-act="ph-close">✕</button></div>';
  screenEl.appendChild(el);
  var frame=document.getElementById('photoFrame');
  var w=frame.clientWidth||1;
  frame.scrollLeft=ui.photoIndex*w;
  var t=null;
  frame.addEventListener('scroll',function(){
    if(t)clearTimeout(t);
    t=setTimeout(function(){
      var w2=frame.clientWidth||1;
      var idx=Math.max(0,Math.min(photos.length-1,Math.round(frame.scrollLeft/w2)));
      if(idx!==ui.photoIndex){ ui.photoIndex=idx; tone(500,.06,'triangle'); }
      var c=document.getElementById('phCount'); if(c)c.textContent=ar(ui.photoIndex+1)+' / '+ar(photos.length);
    },90);
  },{passive:true});
}

/* ---------------- الفيديوهات ---------------- */
function renderReelsScreen(){
  if(!videos.length){
    view.innerHTML=bar('فيديوهات')+emptyBox('فيديوهات',folder('videos')); homeDock(); return;
  }
  view.innerHTML=''; homeDock(); renderReelsLayer();
}
function reelItemHtml(v,i){
  return '<div class="reelItem" data-idx="'+i+'"><div class="stageview">'+
    '<video class="reelVideo" data-src="'+v.url+'" playsinline></video>'+
    '<button class="bigplay" data-act="reel-toggle" hidden><svg width="32" height="32" viewBox="0 0 24 24"><path d="M8 5.5l11 6.5-11 6.5v-13z" fill="#fff"/></svg></button>'+
    '</div><div class="overlay"><div class="top">'+
    '<button class="rbtn" data-act="home" style="width:36px;height:36px">✕</button></div>'+
    '<div class="bottom"><div style="flex:1;min-width:0"><div class="title">'+v.title+'</div>'+
    '<div class="progress"><i class="reelBar"></i></div></div></div></div></div>';
}
function reelEndHtml(){
  return '<div class="reelItem"><div class="endcard"><span class="rk">'+rakan('happy')+'</span>'+
    '<h3>شفت كل الفيديوهات! 🎉</h3><p>ارجع لفوق تتفرج تاني، أو ارجع للرئيسية</p>'+
    '<button class="primary" data-act="home" style="padding:12px 26px">الرئيسية</button></div></div>';
}
var reelIO=null;
function renderReelsLayer(){
  closeLayer('reelLayer');
  var el=document.createElement('div'); el.className='reel'; el.id='reelLayer';
  el.innerHTML='<div class="reelScroll" id="reelScroll">'+videos.map(reelItemHtml).join('')+reelEndHtml()+'</div>';
  screenEl.appendChild(el);
  var scroller=document.getElementById('reelScroll');
  var h=scroller.clientHeight||1;
  scroller.scrollTop=ui.reelIndex*h;
  var items=scroller.querySelectorAll('.reelItem');
  items.forEach(function(item){ wireReelItem(item,scroller); });
  if(reelIO){ try{reelIO.disconnect();}catch(e){} }
  reelIO=new IntersectionObserver(function(entries){
    entries.forEach(function(entry){
      var item=entry.target, vid=item.querySelector('video.reelVideo');
      if(entry.isIntersecting && entry.intersectionRatio>0.6){
        if(item.dataset.idx!==undefined) ui.reelIndex=+item.dataset.idx;
        if(vid){
          if(!vid.getAttribute('src')){ var src=vid.dataset.src; if(src)vid.src=src; }
          vid.muted=state.mute;
          var pr=vid.play();
          if(pr&&pr.catch)pr.catch(function(){ var pb=item.querySelector('.bigplay'); if(pb)pb.hidden=false; });
        }
      } else if(vid && !vid.paused){
        vid.pause();
      }
    });
  },{root:scroller,threshold:[0,.6,1]});
  items.forEach(function(it){ reelIO.observe(it); });
}
function wireReelItem(item,scroller){
  var vid=item.querySelector('video.reelVideo');
  if(!vid)return;
  var bar=item.querySelector('.reelBar'), pb=item.querySelector('.bigplay');
  vid.addEventListener('timeupdate',function(){ if(bar&&vid.duration)bar.style.width=(vid.currentTime/vid.duration*100)+'%'; });
  vid.addEventListener('pause',function(){ if(pb)pb.hidden=false; });
  vid.addEventListener('play',function(){ if(pb)pb.hidden=true; });
  vid.addEventListener('ended',function(){
    var idx=+item.dataset.idx, h=scroller.clientHeight||1;
    scroller.scrollTo({top:(idx+1)*h,behavior:'smooth'});
  });
  item.querySelector('.stageview').addEventListener('click',function(){
    if(vid.paused){ vid.play(); } else { vid.pause(); }
  });
}

/* ---------------- حيوانات وأكل: صورة + اسم + صوت ---------------- */
var ANIMALS=[['🐱','قطة'],['🐶','كلب'],['🐮','بقرة'],['🐑','خروف'],['🐔','فرخة'],['🐴','حصان'],['🦁','أسد'],['🐘','فيل'],['🐯','نمر'],['🐻','دب'],
['🐼','باندا'],['🐵','قرد'],['🦒','زرافة'],['🦓','حمار وحشي'],['🐪','جمل'],['🐰','أرنب'],['🐭','فأر'],['🐹','هامستر'],['🦊','تعلب'],['🐺','دِيب'],
['🐐','معزة'],['🦆','بطة'],['🦢','بجعة'],['🦅','نسر'],['🦉','بومة'],['🐧','بطريق'],['🐦','عصفورة'],['🦜','ببغاء'],['🐢','سلحفاة'],['🐍','تعبان'],
['🐊','تمساح'],['🐸','ضفدعة'],['🐟','سمكة'],['🐬','دولفين'],['🐳','حوت'],['🐙','أخطبوط'],['🦀','سرطان'],['🐝','نحلة'],['🦋','فراشة'],['🐌','حلزونة']];
var FOODS=[['🍎','تفاحة'],['🍌','موزة'],['🍇','عنب'],['🍊','برتقانة'],['🍓','فراولة'],['🍉','بطيخ'],['🍐','كمثرى'],['🍑','خوخ'],['🍒','كرز'],['🍍','أناناس'],
['🥭','مانجا'],['🥝','كيوي'],['🍋','ليمون'],['🍈','شمام'],['🥥','جوز هند'],['🍅','طماطم'],['🥕','جزر'],['🥒','خيار'],['🌽','درة'],['🥔','بطاطس'],
['🧅','بصل'],['🧄','توم'],['🥦','بروكلي'],['🥬','خس'],['🍆','باذنجان'],['🌶️','فلفل حار'],['🥑','أفوكادو'],['🍄','مشروم'],['🍠','بطاطا'],['🥜','فول سوداني'],
['🍯','عسل'],['🍞','عيش'],['🥚','بيضة'],['🥛','لبن'],['🧀','جبنة'],['🍪','بسكويت']];
var CARDSETS={
  animals:{title:'الحيوانات',list:ANIMALS,all:'كل الحيوانات'},
  fruits:{title:'الأكل والفواكه',list:FOODS,all:'كل الأكل'}
};
function sayCard(kind,i){
  var it=CARDSETS[kind].list[i];
  say(kind,kind+'/'+(i+1),it[1],'ar',function(){ tone(420+(i%20)*14,.26); });
}
function renderCards(kind){
  var c=CARDSETS[kind], body;
  if(ui.picked){
    var it=c.list[ui.pickedIndex];
    body='<div class="bigcard"><div class="big" style="font-size:120px;line-height:1.1">'+it[0]+'</div>'+
      '<div class="wave"><i></i><i></i><i></i><i></i><i></i></div><div class="word">'+it[1]+'</div>'+
      '<div class="rowbtns" style="width:100%"><button data-act="again">تاني</button><button data-act="next-card">اللي بعده</button><button data-act="back-grid">'+c.all+'</button></div></div>';
  } else {
    body='<div class="tilegrid wide">'+c.list.map(function(it,i){
      return '<button class="lt" data-card="'+i+'" style="font-size:44px">'+it[0]+'</button>';}).join('')+'</div>';
  }
  view.innerHTML=bar(c.title,'<span class="pill">بصوت '+voiceName(voiceOf(kind))+'</span>')+body; homeDock();
}

/* ---------------- ارسم الحرف (تتبّع بالإصبع مع تشجيع) ---------------- */
var tr=null;
function sayPraise(ok){
  if(ok) say('letters','praise/1','برافو عليك يا حبيبي','ar',function(){ tone(700,.2); });
  else say('letters','praise/2','حاول تاني يا بطل','ar',function(){ tone(300,.2); });
}
function openTrace(){
  closeLayer('trace');
  var glyph = ui.app==='letters' ? ui.picked[0] : ar(ui.picked);
  var key = ui.app+':'+ui.lang+':'+ui.pickedIndex;
  var el=document.createElement('div'); el.className='trace'; el.id='trace';
  el.innerHTML='<div class="gtop"><button class="rbtn" data-act="trace-close" style="background:rgba(255,255,255,.85);width:38px;height:38px">'+iBack()+'</button>'+
    '<span class="nm">امشي على الشكل</span><span class="sc">'+iStar(true,16)+'<span id="trStars">'+ar(state.stars)+'</span></span></div>'+
    '<canvas id="trCanvas"></canvas><div class="trmsg" id="trMsg">استخدم صباعك وامشي على الحرف</div>'+
    '<div class="rowbtns trbtns"><button data-act="trace-clear">امسح</button><button data-act="trace-done" class="go">تمام ✓</button></div>';
  screenEl.appendChild(el);
  var cv=document.getElementById('trCanvas');
  var W=cv.clientWidth||300, H=cv.clientHeight||400; cv.width=W; cv.height=H;
  var font='bold '+Math.round(Math.min(W*1.1,H)*.8)+'px "Noto Kufi Arabic","Noto Naskh Arabic",system-ui,sans-serif';
  tr={cv:cv,ctx:cv.getContext('2d'),W:W,H:H,font:font,glyph:glyph,key:key,strokes:[],down:false,busy:false};
  drawTrace();
  function pt(e){ var r=cv.getBoundingClientRect(); return {x:e.clientX-r.left,y:e.clientY-r.top}; }
  cv.addEventListener('pointerdown',function(e){ if(!tr||tr.busy)return; tr.down=true; try{cv.setPointerCapture(e.pointerId);}catch(x){} tr.strokes.push([pt(e)]); drawTrace(); });
  cv.addEventListener('pointermove',function(e){ if(!tr||!tr.down)return; tr.strokes[tr.strokes.length-1].push(pt(e)); drawTrace(); });
  var up=function(){ if(tr)tr.down=false; };
  cv.addEventListener('pointerup',up); cv.addEventListener('pointercancel',up);
}
function tracePath(c,strokes){
  strokes.forEach(function(s){ c.beginPath(); s.forEach(function(p,i){ if(i)c.lineTo(p.x,p.y); else c.moveTo(p.x,p.y); }); if(s.length===1)c.lineTo(s[0].x+.1,s[0].y); c.stroke(); });
}
function drawTrace(){
  var c=tr.ctx, W=tr.W, H=tr.H;
  c.clearRect(0,0,W,H); c.fillStyle='#fff'; c.fillRect(0,0,W,H);
  c.font=tr.font; c.textAlign='center'; c.textBaseline='middle';
  c.fillStyle='#E3EBF4'; c.fillText(tr.glyph,W/2,H/2+H*.03);
  c.strokeStyle='#A9BBD0'; c.lineWidth=3; c.setLineDash([9,9]); c.strokeText(tr.glyph,W/2,H/2+H*.03); c.setLineDash([]);
  c.lineCap='round'; c.lineJoin='round'; c.lineWidth=18; c.strokeStyle='#EF5B42';
  tracePath(c,tr.strokes);
}
function traceScore(){
  var W=tr.W, H=tr.H;
  var a=document.createElement('canvas'); a.width=W; a.height=H; var ac2=a.getContext('2d');
  ac2.font=tr.font; ac2.textAlign='center'; ac2.textBaseline='middle'; ac2.fillStyle='#000'; ac2.fillText(tr.glyph,W/2,H/2+H*.03);
  var b=document.createElement('canvas'); b.width=W; b.height=H; var bc=b.getContext('2d');
  bc.lineCap='round'; bc.lineJoin='round'; bc.lineWidth=46; bc.strokeStyle='#000'; tracePath(bc,tr.strokes);
  var ga=ac2.getImageData(0,0,W,H).data, ub=bc.getImageData(0,0,W,H).data, tot=0, hit=0;
  for(var i=3;i<ga.length;i+=16){ if(ga[i]>100){ tot++; if(ub[i]>100)hit++; } }
  return tot?hit/tot:0;
}
function traceDone(){
  if(!tr||tr.busy)return;
  var msg=document.getElementById('trMsg');
  if(!tr.strokes.length){ if(msg)msg.textContent='ابدأ ارسم الأول'; tone(300,.15); return; }
  var need = state.age==='2-3' ? .3 : .45;
  if(traceScore()>=need){
    tr.busy=true; state.stars++; state.traced[tr.key]=1; savePrefs();
    var st=document.getElementById('trStars'); if(st)st.textContent=ar(state.stars);
    if(msg)msg.textContent='برافو! ⭐'; sayPraise(true);
    setTimeout(function(){ closeLayer('trace'); tr=null; },1700);
  } else {
    if(msg)msg.textContent='كمّل على الحرف شوية'; sayPraise(false);
  }
}

/* ---------------- بطاقات ---------------- */
function sayManner(){
  say('manners','manners/'+(ui.mannerIndex+1), MANNERS[ui.mannerIndex], 'ar', function(){ tone(440,.3); });
}
function sayPrayer(){
  var s=PRAYER[ui.prayerStep];
  say('prayer','prayer/'+(ui.prayerStep+1), s[0]+'. '+s[1], 'ar', function(){ tone(440,.3); });
}
function renderManners(){
  view.innerHTML=bar('أخلاقي','<span class="pill">بصوت '+voiceName(voiceOf('manners'))+'</span>')+
    '<div class="card"><div style="width:70px;height:70px;border-radius:24px;background:var(--rose);display:grid;place-items:center">'+iHeart(42)+'</div>'+
    '<p class="say">'+MANNERS[ui.mannerIndex]+'</p><button class="speak" data-act="say-manner">'+iSpk()+' اسمعها</button></div>'+
    '<div class="rowbtns"><button data-act="manner-prev">اللي قبله</button><button data-act="manner-next">اللي بعده</button></div>';
  homeDock();
}
function renderPrayer(){
  var s=PRAYER[ui.prayerStep];
  view.innerHTML=bar('الصلاة','<span class="pill">'+ar(ui.prayerStep+1)+' من '+ar(PRAYER.length)+'</span>')+
    '<div class="card"><div style="width:78px;height:78px;border-radius:26px;background:var(--teal);display:grid;place-items:center">'+iPray()+'</div>'+
    '<p class="say" style="font-size:21px">'+s[0]+'</p><p style="margin:0;font-size:15px;color:var(--ink-soft);line-height:1.8">'+s[1]+'</p>'+
    '<button class="speak" data-act="say-prayer">'+iSpk()+' اسمعها</button></div>'+
    '<div class="rowbtns"><button data-act="pray-prev">السابقة</button><button data-act="pray-next">التالية</button></div>';
  homeDock();
}
function renderQuran(){
  var body;
  if(ui.surah!==null){
    var s=SURAHS[ui.surah];
    var url=soundUrl('sounds/quran/'+p3(s.n));
    body='<div class="card"><div style="width:78px;height:78px;border-radius:26px;background:var(--olive);display:grid;place-items:center">'+iBook()+'</div>'+
      '<p class="say" style="font-size:23px">سورة '+s.name+'</p>'+
      '<p style="margin:0;font-size:14px;color:var(--ink-soft)">'+ar(s.a)+' آيات · رقم '+ar(s.n)+' في المصحف</p>'+
      (url
        ? '<div class="wave"><i></i><i></i><i></i><i></i><i></i></div>'+
          '<div class="progress" style="width:100%;background:#E3E9F1"><i id="qBar" style="background:var(--olive)"></i></div>'+
          '<button class="speak" data-act="quran-toggle" id="qBtn">'+iSpk()+' إيقاف مؤقت</button>'
        : '<p style="margin:0;font-size:13px;color:#C33B22;line-height:1.8">مفيش ملف صوت للسورة دي.<br>حط ملف اسمه <b>'+p3(s.n)+'.mp3</b> في مجلد<br><code style="direction:ltr;background:#EEF3F8;border-radius:8px;padding:3px 8px;display:inline-block">'+folder('sounds/quran')+'</code></p>')+
      '<div class="rowbtns" style="width:100%"><button data-act="quran-back">كل السور</button></div></div>';
  } else {
    var n=countSounds('sounds/quran');
    body='<div class="list">'+SURAHS.map(function(s,i){
      var ok=hasSound('sounds/quran/'+p3(s.n));
      return '<button class="row" data-surah="'+i+'"><span class="n" style="background:'+(ok?'var(--olive)':'#C3CBD6')+'">'+ar(s.n)+'</span>'+
        '<span class="t">سورة '+s.name+'</span><span class="s">'+(ok?ar(s.a)+' آيات':'مفيش صوت')+'</span></button>';}).join('')+'</div>'+
      (n?'':'<p style="margin:14px 2px 0;font-size:13px;color:var(--ink-soft);line-height:1.8;text-align:center">عشان التلاوة تشتغل، حمّل المصحف المعلّم وحط ملفاته في:<br><code style="direction:ltr;background:rgba(255,255,255,.75);border-radius:8px;padding:4px 9px;display:inline-block;margin-top:6px">'+folder('sounds/quran')+'</code></p>');
  }
  view.innerHTML=bar('القرآن','<span class="pill">قصار السور</span>')+body;
  homeDock();
  if(ui.surah!==null){
    var s2=SURAHS[ui.surah];
    if(soundUrl('sounds/quran/'+p3(s2.n))){
      sfx('sounds/quran/'+p3(s2.n));
      audio.ontimeupdate=function(){
        var b=document.getElementById('qBar');
        if(b&&audio.duration)b.style.width=(audio.currentTime/audio.duration*100)+'%';
      };
    }
  } else { audio.ontimeupdate=null; }
}

/* ---------------- الألعاب ---------------- */
function availableGames(){ return GAMES.filter(function(g){ return !(g.minAge && state.age==='2-3'); }); }
function renderGamesHub(){
  var lvl=state.age==='2-3'?'سهل':(state.age==='4-5'?'متوسط':'صعب');
  var art={
    balloons:'<svg width="44" height="44" viewBox="0 0 48 48"><ellipse cx="24" cy="19" rx="12" ry="14" fill="#fff" opacity=".95"/><path d="M24 33v10" stroke="#fff" stroke-width="2.4" stroke-linecap="round"/></svg>',
    fruit:'<svg width="44" height="44" viewBox="0 0 48 48"><circle cx="24" cy="22" r="12" fill="#fff" opacity=".95"/><path d="M24 10V6" stroke="#fff" stroke-width="2.6" stroke-linecap="round"/><path d="M10 34h28l-4 8H14z" fill="#fff" opacity=".75"/></svg>',
    car:'<svg width="44" height="44" viewBox="0 0 48 48"><path d="M9 28l3-8a4 4 0 0 1 4-3h16a4 4 0 0 1 4 3l3 8v6H9z" fill="#fff" opacity=".95"/><circle cx="16" cy="35" r="4" fill="#fff"/><circle cx="32" cy="35" r="4" fill="#fff"/></svg>',
    shapes:iPuzzle(44),
    order:'<svg width="44" height="44" viewBox="0 0 48 48"><circle cx="11" cy="35" r="7.5" fill="#fff" opacity=".95"/><circle cx="24" cy="22" r="7.5" fill="#fff" opacity=".82"/><circle cx="37" cy="9" r="7.5" fill="#fff" opacity=".95"/></svg>',
    memory:'<svg width="44" height="44" viewBox="0 0 48 48"><rect x="7" y="10" width="15" height="21" rx="4" fill="#fff" opacity=".95"/><rect x="26" y="17" width="15" height="21" rx="4" fill="#fff" opacity=".75"/></svg>',
    pattern:'<svg width="44" height="44" viewBox="0 0 48 48"><rect x="6" y="6" width="16" height="16" rx="5" fill="#fff" opacity=".95"/><rect x="26" y="6" width="16" height="16" rx="5" fill="#fff" opacity=".65"/><rect x="6" y="26" width="16" height="16" rx="5" fill="#fff" opacity=".65"/><rect x="26" y="26" width="16" height="16" rx="5" fill="#fff" opacity=".95"/></svg>'};
  view.innerHTML=bar('ألعاب','<span class="pill">'+lvl+'</span>')+
    '<div class="gamegrid">'+availableGames().map(function(g){
      return '<button class="gtile" data-game="'+g.id+'" style="background:'+g.color+'">'+art[g.id]+g.name+'</button>';}).join('')+'</div>';
  homeDock();
}

var loop=null, canvas=null, ctx=null, lastGame=null, winScore=0;
function stopGame(){ if(loop){cancelAnimationFrame(loop);loop=null;} var l=document.getElementById('glayer'); if(l)l.remove(); canvas=null;ctx=null; }
function gameLayer(title){
  var el=document.createElement('div'); el.className='glayer'; el.id='glayer';
  el.innerHTML='<div class="gtop"><button class="rbtn" data-act="game-exit" style="background:rgba(255,255,255,.85);width:38px;height:38px">'+iBack()+'</button>'+
    '<span class="nm">'+title+'</span><span class="sc">'+iStar(true,16)+'<span id="gScore">٠</span></span></div>';
  screenEl.appendChild(el); return el;
}
function setScore(n){var e=document.getElementById('gScore'); if(e)e.textContent=ar(n); winScore=n;}
function mkCanvas(el){
  canvas=document.createElement('canvas'); el.appendChild(canvas);
  var r=canvas.getBoundingClientRect(), dpr=Math.min(2,window.devicePixelRatio||1);
  canvas.width=Math.max(1,Math.round(r.width*dpr)); canvas.height=Math.max(1,Math.round(r.height*dpr));
  ctx=canvas.getContext('2d'); ctx.scale(dpr,dpr);
  return {w:r.width,h:r.height};
}
function canvasPt(e){var r=canvas.getBoundingClientRect();return {x:e.clientX-r.left,y:e.clientY-r.top};}
function rrect(x,y,w,h,r){ if(ctx.roundRect){ctx.beginPath();ctx.roundRect(x,y,w,h,r);} else {ctx.beginPath();ctx.rect(x,y,w,h);} }

function winScreen(){
  stopGame();
  var el=document.createElement('div'); el.className='timeup'; el.id='timeup';
  el.innerHTML='<span class="rk bobbing">'+rakan('cheer')+'</span><p class="t">برافو عليك!</p>'+
    '<p class="s">جمعت '+ar(winScore)+' نجمة</p>'+
    '<button class="speak" style="background:#fff;color:var(--ink)" data-act="win-again">نلعب تاني</button>'+
    '<button class="speak" style="background:rgba(255,255,255,.18)" data-act="win-home">خلاص</button>';
  screenEl.appendChild(el);
  sfx('sounds/app/bravo',function(){ tone(660,.2); setTimeout(function(){tone(820,.25);},180); });
}

function startBalloons(){
  lastGame='balloons'; var el=gameLayer('فرقع البلالين'); var d=mkCanvas(el);
  var c=cfg(), cols=['#EF5B42','#3FA9E0','#23AE84','#F5A623','#8A74E8','#E8608F'];
  var items=[], parts=[], score=0; setScore(0);
  function spawn(){items.push({x:30+Math.random()*(d.w-60),y:d.h+40,r:c.bR*(.85+Math.random()*.35),s:c.bSpeed*(.7+Math.random()*.8),c:cols[(Math.random()*cols.length)|0]});}
  for(var i=0;i<4;i++)spawn();
  canvas.addEventListener('pointerdown',function(e){
    var p=canvasPt(e);
    for(var i=items.length-1;i>=0;i--){var b=items[i];
      if((p.x-b.x)*(p.x-b.x)+(p.y-b.y)*(p.y-b.y)<b.r*b.r*1.4){
        for(var k=0;k<12;k++)parts.push({x:b.x,y:b.y,vx:(Math.random()-.5)*6,vy:(Math.random()-.5)*6,l:1,c:b.c});
        items.splice(i,1); score++; setScore(score); tone(500+score*25,.12,'triangle');
        if(score>=c.bTarget){setTimeout(winScreen,280);return;}
        spawn(); break;
      }}
  });
  function frame(){
    ctx.clearRect(0,0,d.w,d.h);
    if(items.length<5&&Math.random()<.02)spawn();
    items.forEach(function(b){
      b.y-=b.s*1.7; b.x+=Math.sin(b.y/40)*.4;
      if(b.y<-b.r*2){b.y=d.h+b.r;b.x=30+Math.random()*(d.w-60);}
      ctx.beginPath(); ctx.ellipse(b.x,b.y,b.r*.85,b.r,0,0,6.3); ctx.fillStyle=b.c; ctx.fill();
      ctx.beginPath(); ctx.ellipse(b.x-b.r*.3,b.y-b.r*.35,b.r*.18,b.r*.26,-.4,0,6.3); ctx.fillStyle='rgba(255,255,255,.5)'; ctx.fill();
      ctx.beginPath(); ctx.moveTo(b.x,b.y+b.r); ctx.quadraticCurveTo(b.x+7,b.y+b.r+16,b.x,b.y+b.r+30);
      ctx.strokeStyle='rgba(255,255,255,.85)'; ctx.lineWidth=2; ctx.stroke();
    });
    for(var i=parts.length-1;i>=0;i--){var p=parts[i];p.x+=p.vx;p.y+=p.vy;p.l-=.04;
      if(p.l<=0){parts.splice(i,1);continue;}
      ctx.globalAlpha=p.l; ctx.beginPath(); ctx.arc(p.x,p.y,5,0,6.3); ctx.fillStyle=p.c; ctx.fill(); ctx.globalAlpha=1;}
    loop=requestAnimationFrame(frame);
  }
  frame();
}

function startFruit(){
  lastGame='fruit'; var el=gameLayer('اقطف الفاكهة'); var d=mkCanvas(el);
  var c=cfg(), score=0, bx=d.w/2, items=[], shake=0; setScore(0);
  var F=[{c:'#EF5B42',r:18},{c:'#F5A623',r:17},{c:'#8FB83E',r:16},{c:'#E8608F',r:17},{c:'#8A74E8',r:15}];
  function spawn(){var rock=c.fRocks&&Math.random()<.22;
    items.push({x:28+Math.random()*(d.w-56),y:-24,rock:rock,f:F[(Math.random()*F.length)|0],s:c.fSpeed*(.8+Math.random()*.6)});}
  function move(e){var p=canvasPt(e); bx=Math.max(40,Math.min(d.w-40,p.x));}
  canvas.addEventListener('pointerdown',move);
  canvas.addEventListener('pointermove',function(e){ if(e.buttons||e.pointerType==='touch') move(e); });
  function frame(){
    ctx.clearRect(0,0,d.w,d.h);
    if(Math.random()<.028)spawn();
    var by=d.h-60;
    for(var i=items.length-1;i>=0;i--){var it=items[i]; it.y+=it.s*2.1;
      if(it.y>by-20&&it.y<by+18&&Math.abs(it.x-bx)<46){
        items.splice(i,1);
        if(it.rock){shake=10;tone(180,.18,'sawtooth');}
        else{score++;setScore(score);tone(520+score*20,.12,'triangle');
          if(score>=c.fTarget){setTimeout(winScreen,260);return;}}
        continue;}
      if(it.y>d.h+30){items.splice(i,1);continue;}
      if(it.rock){ctx.beginPath();ctx.arc(it.x,it.y,15,0,6.3);ctx.fillStyle='#8B96A5';ctx.fill();}
      else{ctx.beginPath();ctx.arc(it.x,it.y,it.f.r,0,6.3);ctx.fillStyle=it.f.c;ctx.fill();
        ctx.beginPath();ctx.moveTo(it.x,it.y-it.f.r);ctx.lineTo(it.x+3,it.y-it.f.r-8);
        ctx.strokeStyle='#5A9A46';ctx.lineWidth=3;ctx.lineCap='round';ctx.stroke();}
    }
    var sx=shake>0?(Math.random()-.5)*7:0; if(shake>0)shake--;
    ctx.save(); ctx.translate(sx,0);
    ctx.beginPath(); ctx.moveTo(bx-46,by-16); ctx.lineTo(bx+46,by-16); ctx.lineTo(bx+34,by+22); ctx.lineTo(bx-34,by+22); ctx.closePath();
    ctx.fillStyle='#C98B5E'; ctx.fill();
    ctx.fillStyle='rgba(255,255,255,.3)'; ctx.fillRect(bx-46,by-16,92,7);
    ctx.restore();
    loop=requestAnimationFrame(frame);
  }
  frame();
}

function startCar(){
  lastGame='car'; var el=gameLayer('العربية'); var d=mkCanvas(el);
  var c=cfg(), lanes=[d.w*.25,d.w*.5,d.w*.75], li=1, score=0, items=[], flash=0, road=0; setScore(0);
  function spawn(){items.push({l:(Math.random()*3)|0,y:-36,star:Math.random()<.58});}
  canvas.addEventListener('pointerdown',function(e){var p=canvasPt(e);
    if(p.x<d.w/2){li=Math.max(0,li-1);}else{li=Math.min(2,li+1);} tone(420,.07,'triangle');});
  function frame(){
    ctx.fillStyle='#55606E'; ctx.fillRect(0,0,d.w,d.h);
    ctx.fillStyle='#7A8794'; ctx.fillRect(0,0,d.w*.1,d.h); ctx.fillRect(d.w*.9,0,d.w*.1,d.h);
    road=(road+c.cSpeed*2)%44;
    ctx.strokeStyle='rgba(255,255,255,.55)'; ctx.lineWidth=5; ctx.setLineDash([20,24]);
    [d.w*.375,d.w*.625].forEach(function(x){ctx.beginPath();ctx.moveTo(x,road-44);ctx.lineTo(x,d.h);ctx.stroke();});
    ctx.setLineDash([]);
    if(Math.random()<.026)spawn();
    var cy=d.h-90, cx=lanes[li];
    for(var i=items.length-1;i>=0;i--){var it=items[i]; it.y+=c.cSpeed*2.3; var ix=lanes[it.l];
      if(it.y>cy-38&&it.y<cy+38&&it.l===li){
        items.splice(i,1);
        if(it.star){score++;setScore(score);tone(620+score*18,.12,'triangle');
          if(score>=c.cTarget){setTimeout(winScreen,260);return;}}
        else{flash=12;tone(170,.2,'sawtooth');}
        continue;}
      if(it.y>d.h+40){items.splice(i,1);continue;}
      if(it.star){ctx.save();ctx.translate(ix,it.y);
        ctx.beginPath();for(var k=0;k<5;k++){var a=-Math.PI/2+k*2*Math.PI/5;
          ctx.lineTo(Math.cos(a)*17,Math.sin(a)*17);var b2=a+Math.PI/5;ctx.lineTo(Math.cos(b2)*8,Math.sin(b2)*8);}
        ctx.closePath();ctx.fillStyle='#F5D23A';ctx.fill();ctx.restore();}
      else{ctx.fillStyle='#E04A2E';rrect(ix-23,it.y-16,46,32,9);ctx.fill();
        ctx.fillStyle='rgba(255,255,255,.85)';ctx.fillRect(ix-18,it.y-4,36,6);}
    }
    if(flash>0){flash--;ctx.globalAlpha=flash%4<2?.5:1;}
    ctx.fillStyle='#3FA9E0'; rrect(cx-25,cy-34,50,68,14); ctx.fill();
    ctx.fillStyle='#CFEAF8'; rrect(cx-17,cy-23,34,20,7); ctx.fill();
    ctx.fillStyle='#22324F'; ctx.fillRect(cx-30,cy-20,7,16); ctx.fillRect(cx+23,cy-20,7,16);
    ctx.fillRect(cx-30,cy+12,7,16); ctx.fillRect(cx+23,cy+12,7,16);
    ctx.globalAlpha=1;
    loop=requestAnimationFrame(frame);
  }
  frame();
}

function newRound(){
  var pool=['circle','square','triangle','star','heart'].slice(0,cfg().shapes);
  var cols=['var(--sky)','var(--melon)','var(--grape)','var(--mint)','var(--sun)','var(--rose)'];
  var t=pool[(Math.random()*pool.length)|0], others=pool.filter(function(s){return s!==t;});
  var opts=[{kind:t,correct:true}];
  while(opts.length<3&&others.length)opts.push({kind:others.splice((Math.random()*others.length)|0,1)[0],correct:false});
  opts.sort(function(){return Math.random()-.5;});
  opts.forEach(function(o,i){o.color=cols[(i+((Math.random()*3)|0))%cols.length];});
  ui.gameTarget=t; ui.gameOpts=opts;
}
function startShapes(){ lastGame='shapes'; ui.gameRound=0; ui.gameScore=0; gameLayer('طابق الأشكال'); newRound(); renderShapes(); }
function renderShapes(){
  var el=document.getElementById('glayer'); if(!el)return;
  setScore(ui.gameScore);
  var w=el.querySelector('.shapes-wrap'); if(!w){w=document.createElement('div');w.className='shapes-wrap';el.appendChild(w);}
  if(ui.gameRound>=5){ setTimeout(winScreen,120); return; }
  w.innerHTML='<div class="target">'+shapeSvg(ui.gameTarget,'#CBD5E1',82)+'</div>'+
    '<p style="margin:0;font-weight:700;font-size:16px">هات الشكل اللي زيه</p>'+
    '<div class="opts">'+ui.gameOpts.map(function(o,i){return '<button class="opt" data-opt="'+i+'">'+shapeSvg(o.kind,o.color,52)+'</button>';}).join('')+'</div>';
}
function startMemory(){
  lastGame='memory'; var pairs=cfg().pairs||4; var el=gameLayer('الذاكرة');
  var kinds=['circle','square','triangle','star','heart','circle'];
  var cols=['var(--sky)','var(--melon)','var(--mint)','var(--sun)','var(--rose)','var(--grape)'];
  var cards=[]; for(var i=0;i<pairs;i++){cards.push({k:kinds[i],c:cols[i]},{k:kinds[i],c:cols[i]});}
  cards.sort(function(){return Math.random()-.5;});
  var grid=document.createElement('div'); grid.className='memgrid';
  grid.innerHTML=cards.map(function(c,i){return '<button class="mem" data-mem="'+i+'">؟</button>';}).join('');
  el.appendChild(grid);
  var open=[], done=0, lock=false; setScore(0);
  grid.addEventListener('click',function(e){
    var b=e.target.closest('.mem'); if(!b||lock)return;
    var i=+b.dataset.mem;
    if(b.classList.contains('open')||b.classList.contains('done'))return;
    b.classList.add('open'); b.innerHTML=shapeSvg(cards[i].k,cards[i].c,44); open.push(i); tone(520,.1,'triangle');
    if(open.length===2){
      lock=true; var a=open[0], c2=open[1];
      if(cards[a].k===cards[c2].k&&cards[a].c===cards[c2].c){
        setTimeout(function(){
          grid.querySelector('[data-mem="'+a+'"]').classList.add('done');
          grid.querySelector('[data-mem="'+c2+'"]').classList.add('done');
          done++; setScore(done); open=[]; lock=false; tone(700,.16);
          if(done===pairs)setTimeout(winScreen,380);
        },420);
      } else {
        setTimeout(function(){
          [a,c2].forEach(function(x){var e2=grid.querySelector('[data-mem="'+x+'"]');e2.classList.remove('open');e2.innerHTML='؟';});
          open=[]; lock=false;
        },700);
      }
    }
  });
}
/* رتب الأرقام — الأرقام متبعترة على الشاشة، والطفل يدوس عليها بالترتيب
   من ١ لحد آخر رقم. بتنمي التعرف على الأرقام والترتيب. */
function startOrder(){
  lastGame='order'; var n=cfg().omax||8; var el=gameLayer('رتب الأرقام');
  var wrap=document.createElement('div'); wrap.className='ordergrid'; el.appendChild(wrap);
  var cols=['var(--sky)','var(--melon)','var(--grape)','var(--mint)','var(--sun)','var(--rose)','var(--teal)','var(--olive)'];
  var nums=[]; for(var i=1;i<=n;i++)nums.push(i);
  nums.sort(function(){return Math.random()-.5;});
  wrap.innerHTML=nums.map(function(v){return '<button class="obub" data-n="'+v+'" style="background:'+cols[(v-1)%cols.length]+'">'+ar(v)+'</button>';}).join('');
  var next=1; setScore(0);
  wrap.addEventListener('click',function(e){
    var b=e.target.closest('.obub'); if(!b)return;
    var v=+b.dataset.n;
    if(v===next){
      b.classList.add('done'); tone(520+next*26,.12,'triangle'); next++; setScore(next-1);
      if(next>n){ setTimeout(winScreen,320); }
    } else {
      b.classList.remove('wrong'); void b.offsetWidth; b.classList.add('wrong'); tone(170,.16,'sawtooth');
    }
  });
}

/* تابع النمط — زي لعبة سايمون: التطبيق يضوي ترتيب من الألوان،
   والطفل يكرره. كل جولة بتزود رقم. بتنمي الذاكرة والتركيز. */
function startPattern(){
  lastGame='pattern'; var el=gameLayer('تابع النمط');
  var wrap=document.createElement('div'); wrap.className='padgrid'; el.appendChild(wrap);
  var pads=[{c:'var(--melon)',f:392},{c:'var(--mint)',f:330},{c:'var(--sky)',f:440},{c:'var(--sun)',f:523}];
  wrap.innerHTML=pads.map(function(p,i){return '<button class="pad" data-pad="'+i+'" style="background:'+p.c+'"></button>';}).join('');
  var seq=[], input=0, round=0, busy=true, target=cfg().patTarget||8; setScore(0);
  function litPad(i,dur){
    var b=wrap.querySelector('[data-pad="'+i+'"]'); if(!b)return;
    b.classList.add('lit'); tone(pads[i].f,.22,'sine');
    setTimeout(function(){b.classList.remove('lit');},dur||380);
  }
  function playSeq(){
    busy=true; input=0;
    var i=0;
    function step(){
      if(i>=seq.length){ busy=false; return; }
      litPad(seq[i],420); i++; setTimeout(step,560);
    }
    setTimeout(step,500);
  }
  function nextRound(){ seq.push((Math.random()*4)|0); round++; setScore(round-1); playSeq(); }
  wrap.addEventListener('click',function(e){
    var b=e.target.closest('.pad'); if(!b||busy)return;
    var i=+b.dataset.pad; litPad(i,220);
    if(seq[input]===i){
      input++;
      if(input===seq.length){
        if(round>=target){ setTimeout(winScreen,300); return; }
        setTimeout(nextRound,500);
      }
    } else {
      tone(160,.25,'sawtooth');
      setTimeout(function(){ round=0; seq=[]; input=0; setScore(0); nextRound(); },650);
    }
  });
  nextRound();
}

function startGame(id){
  stopGame(); stopSfx(); tone(560,.12,'triangle');
  if(id==='balloons')startBalloons();
  else if(id==='fruit')startFruit();
  else if(id==='car')startCar();
  else if(id==='shapes')startShapes();
  else if(id==='order')startOrder();
  else if(id==='memory')startMemory();
  else if(id==='pattern')startPattern();
}

/* ---------------- بوابة ولي الأمر ---------------- */
var pinBuf='', pinMode='open';
function openGate(mode){
  pinBuf=''; pinMode=mode||'open';
  var el=document.createElement('div'); el.className='gate'; el.id='gate';
  var keys=''; for(var i=1;i<=9;i++)keys+='<button class="key" data-key="'+i+'">'+ar(i)+'</button>';
  keys+='<button class="key ghost" data-key="x">⌫</button><button class="key" data-key="0">٠</button><button class="key ghost" data-key="c">✕</button>';
  el.innerHTML='<h3>'+(pinMode==='set'?'رقم سري جديد':'دخول ولي الأمر')+'</h3>'+
    '<p>'+(pinMode==='set'?'اكتب أربع أرقام جديدة':'اكتب الرقم السري عشان تفتح الإعدادات')+'</p>'+
    '<div class="pins" id="pins"><i></i><i></i><i></i><i></i></div><div class="err" id="pinErr"></div>'+
    '<div class="keypad">'+keys+'</div>';
  screenEl.appendChild(el);
}
function updatePins(){var p=document.getElementById('pins'); if(!p)return;
  Array.prototype.forEach.call(p.children,function(d,i){ if(i<pinBuf.length)d.classList.add('on'); else d.classList.remove('on'); });}
function pinKey(k){
  var err=document.getElementById('pinErr');
  if(k==='c'){closeLayer('gate'); if(pinMode==='set')openSettings(); return;}
  if(k==='x'){pinBuf=pinBuf.slice(0,-1);updatePins();return;}
  if(pinBuf.length>=4)return;
  pinBuf+=k; tone(600+pinBuf.length*60,.08,'triangle'); updatePins();
  if(pinBuf.length===4)setTimeout(function(){
    if(pinMode==='set'){ state.pin=pinBuf; savePrefs(); closeLayer('gate'); openSettings(); tone(700,.2); return; }
    if(pinBuf===state.pin){closeLayer('gate');openSettings();}
    else{pinBuf='';updatePins();if(err)err.textContent='الرقم غلط، جرّب تاني';tone(180,.22,'sawtooth');}
  },160);
}

/* ---------------- الإعدادات ---------------- */
function soundRow(label,rel){
  var n=countSounds(rel), ok=n>0;
  return '<div class="path" style="margin-bottom:8px"><span>'+label+'</span>'+
    '<code>'+rel.replace('sounds/','')+'</code>'+
    '<span style="color:'+(ok?'#1E8E68':'#B4442B')+'">'+(ok?ar(n)+' ملف':'فاضي')+'</span></div>';
}
/* اختيار الصوت لقسم واحد: التطبيق / ماما / بابا — مع عدد الملفات المتاحة لكل صوت */
function voicePicker(section,label,folder){
  var cur=voiceOf(section);
  return '<div style="margin-bottom:14px"><div style="font-weight:700;font-size:14px;margin-bottom:7px">'+label+'</div>'+
    '<div class="seg">'+VOICES.map(function(v){
      var extra='';
      if(v.id!=='app'){
        var n=countSounds('sounds/'+v.id+'/'+folder);
        extra=' <span style="opacity:.7;font-size:11px">('+(n?ar(n):'٠')+')</span>';
      }
      return '<button data-voice="'+section+':'+v.id+'" aria-pressed="'+(cur===v.id)+'">'+v.name+extra+'</button>';
    }).join('')+'</div></div>';
}
function openSettings(){
  loadMedia(); stopSfx();
  var el=document.createElement('div'); el.className='settings'; el.id='settings';
  el.innerHTML='<header><button class="rbtn" data-act="settings-close" style="background:#EDF1F7;width:36px;height:36px">'+iBack()+'</button><h3>إعدادات ولي الأمر</h3>'+iGear()+'</header><div class="body">'+
    (hasAccess?'':'<div class="warn">التطبيق لسه مش شايف ملفات الموبايل. اضغط الزرار ده واختار <b>السماح</b>.</div>')+
    '<div class="sgroup"><h4>الأذونات</h4>'+
      '<button class="primary" style="width:100%" data-act="ask-access">'+(hasAccess?'إذن الملفات — مفتوح ✓':'افتح إذن الوصول للملفات')+'</button>'+
      '<button class="primary" style="width:100%;margin-top:9px;background:#8A94A6" data-act="app-settings">صفحة التطبيق في الإعدادات</button>'+
      '<button class="primary" style="width:100%;margin-top:9px;background:#8A94A6" data-act="pinning">إعدادات تثبيت الشاشة</button>'+
      '<p class="note">التطبيق بيفك تثبيت الشاشة لوحده وهو بيفتحلك صفحة الإعدادات، وبيرجّعه لما ترجع.</p></div>'+
    '<div class="sgroup"><h4>الطفل</h4><div class="avatarrow"><span class="pic">'+(state.hasAvatar?avatarSvg(state.avatar):rakan('happy'))+'</span>'+
      '<div style="flex:1;min-width:0"><input class="field" id="childName" type="text" placeholder="اسم الطفل" value="'+state.childName+'">'+
      '<button class="primary" style="margin-top:9px;width:100%" data-act="open-studio">'+(state.hasAvatar?'غيّر الأفاتار':'اعمل أفاتار من صورة')+'</button></div></div></div>'+
    '<div class="sgroup"><h4>الفئة العمرية</h4><div class="seg">'+
      '<button data-age="2-3" aria-pressed="'+(state.age==='2-3')+'">٢ – ٣</button>'+
      '<button data-age="4-5" aria-pressed="'+(state.age==='4-5')+'">٤ – ٥</button>'+
      '<button data-age="6+" aria-pressed="'+(state.age==='6+')+'">٦ +</button></div></div>'+
    '<div class="sgroup"><h4>وقت اللعب في الجلسة</h4><div class="seg">'+
      '<button data-min="15" aria-pressed="'+(state.minutes===15)+'">١٥ د</button>'+
      '<button data-min="20" aria-pressed="'+(state.minutes===20)+'">٢٠ د</button>'+
      '<button data-min="30" aria-pressed="'+(state.minutes===30)+'">٣٠ د</button>'+
      '<button data-min="45" aria-pressed="'+(state.minutes===45)+'">٤٥ د</button></div></div>'+
    '<div class="sgroup"><h4>الصور والفيديو</h4>'+
      '<div class="path"><span>فيديوهات</span><code>videos</code><span>'+ar(videos.length)+'</span></div>'+
      '<div style="height:9px"></div>'+
      '<div class="path"><span>صور</span><code>photos</code><span>'+ar(photos.length)+'</span></div>'+
      '<p class="note">المسار الكامل: <code style="direction:ltr">'+(B?B.rootPath():'/storage/emulated/0/Rakan')+'</code></p></div>'+
    '<div class="sgroup"><h4>الطفل يسمع صوت مين</h4>'+
      voicePicker('letters','الحروف','letters/ar')+
      voicePicker('numbers','الأرقام','numbers')+
      voicePicker('manners','الأخلاق','manners')+
      voicePicker('prayer','الصلاة','prayer')+
      voicePicker('animals','الحيوانات','animals')+
      voicePicker('fruits','الأكل','fruits')+
      '<p class="note">'+(ttsOk
        ? '«التطبيق» = القارئ المدمّج في الموبايل، شغال من غير ما تسجّل حاجة. والرقم جنب ماما وبابا هو عدد الملفات اللي التطبيق لقاها.'
        : 'القارئ المدمّج مش متاح على الموبايل ده. نزّل <b>Speech Recognition &amp; Synthesis</b> من بلاي ستور وفعّل العربية، أو استخدم تسجيلات ماما وبابا.')+'</p></div>'+
    '<div class="sgroup"><h4>ملفات الصوت المتاحة</h4>'+
      soundRow('ماما — حروف','sounds/mom/letters/ar')+
      soundRow('ماما — أرقام','sounds/mom/numbers')+
      soundRow('ماما — أخلاق','sounds/mom/manners')+
      soundRow('بابا — حروف','sounds/dad/letters/ar')+
      soundRow('بابا — أرقام','sounds/dad/numbers')+
      soundRow('بابا — أخلاق','sounds/dad/manners')+
      soundRow('ماما — حيوانات','sounds/mom/animals')+
      soundRow('ماما — أكل','sounds/mom/fruits')+
      soundRow('ماما — تشجيع','sounds/mom/praise')+
      soundRow('بابا — حيوانات','sounds/dad/animals')+
      soundRow('بابا — أكل','sounds/dad/fruits')+
      soundRow('بابا — تشجيع','sounds/dad/praise')+
      soundRow('المصحف المعلّم','sounds/quran')+
      soundRow('أصوات التطبيق','sounds/app')+
      '<p class="note">فيه ملف اسمه <b>اقرأني.txt</b> جوه مجلد sounds بيشرح أسماء الملفات المطلوبة في كل مجلد. أي ملف ناقص، التطبيق بيستخدم صوته المدمّج مكانه.</p></div>'+
    '<button class="primary" style="width:100%;background:var(--mint)" data-act="rescan">أعد قراءة المجلدات</button>'+
    '<div class="sgroup"><h4>الأقسام الظاهرة للطفل</h4><div class="toggles">'+APPS.map(function(a){
      return '<button class="tg" data-toggle="'+a.id+'" aria-pressed="'+(!state.hidden[a.id])+'"><span class="sw"></span><span class="nm">'+a.name+'</span></button>';}).join('')+'</div></div>'+
    '<div class="sgroup"><h4>عام</h4>'+
      '<button class="tg" data-toggle-mute aria-pressed="'+(!state.mute)+'"><span class="sw"></span><span class="nm">أصوات التطبيق</span></button>'+
      '<button class="primary" style="width:100%;margin-top:10px" data-act="change-pin">غيّر الرقم السري</button></div>'+
    '<div class="sgroup"><h4>تقدّم الطفل</h4><div class="path"><span>النجوم</span><code>'+ar(state.stars)+'</code></div><div style="height:9px"></div><div class="path"><span>حروف وأرقام رسمها صح</span><code>'+ar(Object.keys(state.traced||{}).length)+'</code></div></div>'+
    '<div class="sgroup"><h4>التحديثات</h4>'+
      '<div class="path"><span>النسخة الحالية</span><code>'+(B&&B.versionName?B.versionName():'—')+'</code></div>'+
      '<div style="height:9px"></div>'+
      '<input class="field" id="repoOwner" type="text" placeholder="اسم حسابك على جيت هب" value="'+state.repoOwner+'" style="direction:ltr">'+
      '<div style="height:7px"></div>'+
      '<input class="field" id="repoName" type="text" placeholder="اسم المستودع" value="'+state.repoName+'" style="direction:ltr">'+
      '<button class="primary" style="width:100%;margin-top:10px" data-act="check-update">شوف لو فيه نسخة جديدة</button>'+
      '<div id="updBox"></div>'+
      '<p class="note">المستودع لازم يكون <b>Public</b> عشان التطبيق يعرف يسأل. لو خليته Private، الزرار هيفتحلك صفحة التحميل على طول وتشوف بنفسك.</p></div>'+
    '<button class="danger" data-act="exit-app">الخروج من التطبيق</button></div>';
  screenEl.appendChild(el);
  if(upd)updBox(updHtml(upd));
}
function grabName(){
  var n=document.getElementById('childName'); if(n)state.childName=n.value.trim();
  var o=document.getElementById('repoOwner'); if(o)state.repoOwner=o.value.trim();
  var r=document.getElementById('repoName'); if(r)state.repoName=r.value.trim();
}

/* ---------------- التحديثات ---------------- */
function updBox(html){ var b=document.getElementById('updBox'); if(b)b.innerHTML=html; }
function checkUpdate(){
  grabName(); savePrefs();
  if(!state.repoOwner||!state.repoName){
    updBox('<div class="warn" style="margin-top:10px">اكتب اسم حسابك واسم المستودع الأول.</div>');
    return;
  }
  updBox('<p class="note" style="text-align:center">بيسأل جيت هب...</p>');
  try{ B.checkUpdate(state.repoOwner,state.repoName); }
  catch(e){ updBox('<div class="warn" style="margin-top:10px">مش قادر يوصل للإنترنت.</div>'); }
}
var upd=null;
function updHtml(d){
  var open='<button class="primary" style="width:100%;margin-top:10px" data-act="open-releases" data-url="'+d.url+'">افتح صفحة التحميل</button>';
  if(d.error==='private'){
    return '<p class="note" style="margin-top:10px">المستودع Private فمش قادر يسأل. افتح الصفحة وشوف آخر نسخة بنفسك.</p>'+open;
  } else if(d.error){
    return '<div class="warn" style="margin-top:10px">مش قادر يوصل لجيت هب دلوقتي.</div>'+open;
  } else if(d.latest>d.current){
    return '<div class="warn" style="margin-top:10px;background:#E6F6EE;border-color:#A8DCC4;color:#15694C">'+
      'فيه نسخة أحدث! النسخة <b>'+ar(d.latest)+'</b> وانت على <b>'+ar(d.current)+'</b>.</div>'+
      '<button class="primary" style="width:100%;margin-top:10px;background:var(--mint)" data-act="install-update">حدّث الآن</button>'+
      '<div id="dlBox"></div>';
  }
  return '<p class="note" style="margin-top:10px;text-align:center;color:#1E8E68">انت على آخر نسخة ✓</p>';
}
window.onRakanUpdate=function(payload){
  var d; try{ d=JSON.parse(payload); }catch(e){ return; }
  upd=d;
  var newer=!d.error && d.latest>d.current;
  if(newer){
    tone(700,.2);
    if(!ui.app && !document.getElementById('settings') && !document.getElementById('gate') && hintSlot){
      hintSlot.innerHTML='<div class="hint" style="background:#E6F6EE;color:#15694C">فيه تحديث جديد للتطبيق — اضغط مطوّل على «راكان» وادخل الإعدادات وحدّث</div>';
    }
  }
  if(document.getElementById('updBox'))updBox(updHtml(d));
};
window.onRakanDownload=function(msg){
  var b=document.getElementById('dlBox'); if(!b)return;
  var d; try{ d=JSON.parse(msg); }catch(e){ return; }
  if(d.state==='progress'){ b.innerHTML='<p class="note" style="text-align:center;margin-top:8px">بينزّل... '+ar(d.pct)+'٪</p>'; }
  else if(d.state==='permission'){ b.innerHTML='<div class="warn" style="margin-top:8px">فعّل «السماح بتثبيت التطبيقات» لراكان من الصفحة اللي اتفتحت، وارجع واضغط «حدّث الآن» تاني.</div>'; }
  else if(d.state==='installing'){ b.innerHTML='<p class="note" style="text-align:center;margin-top:8px;color:#1E8E68">اضغط Install في الشاشة اللي ظهرت ✓</p>'; }
  else { b.innerHTML='<div class="warn" style="margin-top:8px">التنزيل فشل. جرّب تاني أو افتح صفحة التحميل.</div>'; }
};
function refreshSettings(){ grabName(); savePrefs(); closeLayer('settings'); openSettings(); render(); }

/* ---------------- الأفاتار ---------------- */
function openStudio(){
  var el=document.createElement('div'); el.className='studio'; el.id='studio';
  el.innerHTML='<header><button class="rbtn" data-act="studio-close" style="background:#EDF1F7;width:36px;height:36px">'+iBack()+'</button><h3>أفاتار الطفل</h3></header><div class="body">'+
    '<div class="bigavatar">'+avatarSvg(state.avatar)+'</div>'+
    '<button class="primary" style="width:100%" data-act="pick-face">اختار صورة لابنك</button>'+
    '<p class="note" style="margin:0;font-size:12.5px;color:var(--ink-soft);line-height:1.7;text-align:center">الصورة بتتحلل على الجهاز نفسه ومش بتتحفظ. اللي بيتحفظ هو شكل الأفاتار بس.</p>'+
    '<div class="sgroup"><h4>لون البشرة</h4><div class="swatches">'+SKIN.map(function(c,i){
      return '<button class="sw2" data-skin="'+i+'" style="background:'+c+'" aria-pressed="'+(state.avatar.skin===i)+'"></button>';}).join('')+'</div></div>'+
    '<div class="sgroup"><h4>لون الشعر</h4><div class="swatches">'+HAIRC.map(function(c,i){
      return '<button class="sw2" data-hc="'+i+'" style="background:'+c+'" aria-pressed="'+(state.avatar.hairColor===i)+'"></button>';}).join('')+'</div></div>'+
    '<div class="sgroup"><h4>الملامح</h4>'+
      ctrlRow('شكل الوش','face',FACES[state.avatar.face])+
      ctrlRow('الشعر','hair',HAIRS[state.avatar.hair])+
      ctrlRow('العيون','eyes',EYES[state.avatar.eyes])+
      ctrlRow('لون التيشرت','shirt',ar(state.avatar.shirt+1))+'</div>'+
    '<button class="primary" style="width:100%;background:var(--mint)" data-act="save-avatar">احفظ الأفاتار</button></div>';
  screenEl.appendChild(el);
}
function ctrlRow(label,key,val){
  return '<div class="ctrl"><span class="nm">'+label+'</span><button data-dec="'+key+'">‹</button>'+
    '<span class="val">'+val+'</span><button data-inc="'+key+'">›</button></div>';
}
var LIMITS={face:4,hair:6,eyes:4,shirt:6,skin:6,hairColor:6};
function bumpAvatar(key,dir){
  state.avatar[key]=(state.avatar[key]+dir+LIMITS[key])%LIMITS[key];
  tone(460,.07,'triangle'); closeLayer('studio'); openStudio();
}
function analyzeFace(file){
  var img=new Image(), url=URL.createObjectURL(file);
  img.onload=function(){
    try{
      var cv=document.createElement('canvas'); cv.width=64; cv.height=64;
      var cx=cv.getContext('2d'); cx.drawImage(img,0,0,64,64);
      var dd=cx.getImageData(0,0,64,64).data;
      function avg(x0,y0,x1,y1){var r=0,g=0,b=0,n=0;
        for(var y=y0;y<y1;y++)for(var x=x0;x<x1;x++){var i=(y*64+x)*4;r+=dd[i];g+=dd[i+1];b+=dd[i+2];n++;}
        return [r/n,g/n,b/n];}
      function nearest(c,pal){var best=0,bd=1e9;
        pal.forEach(function(hex,i){
          var R=parseInt(hex.substr(1,2),16),G=parseInt(hex.substr(3,2),16),Bv=parseInt(hex.substr(5,2),16);
          var q=(R-c[0])*(R-c[0])+(G-c[1])*(G-c[1])+(Bv-c[2])*(Bv-c[2]);
          if(q<bd){bd=q;best=i;}});
        return best;}
      state.avatar.skin=nearest(avg(22,34,42,50),SKIN);
      state.avatar.hairColor=nearest(avg(20,4,44,16),HAIRC);
    }catch(e){}
    URL.revokeObjectURL(url);
    state.hasAvatar=true; savePrefs();
    closeLayer('studio'); openStudio(); renderStatus(); tone(660,.2);
  };
  img.onerror=function(){URL.revokeObjectURL(url);};
  img.src=url;
}

function closeLayer(id){var el=document.getElementById(id); if(el)el.remove();}
function showTimeUp(hard){
  var el=document.createElement('div'); el.className='timeup'; el.id='timeup';
  el.innerHTML='<span class="rk bobbing">'+rakan('sleep')+'</span>'+
    '<p class="t">'+(hard?'خلاص كفاية النهارده يا حبيبي':'خلصنا الفيديوهات')+'</p>'+
    '<p class="s">'+(hard?'راكان تعب وهينام.<br>نكمّل بكرة إن شاء الله.':'مفيش فيديوهات تانية دلوقتي.')+'</p>'+
    (hard?'':'<button class="speak" style="background:#fff;color:var(--ink)" data-act="timeup-close">تمام</button>');
  screenEl.appendChild(el);
  if(hard) sfx('sounds/app/timeup');
}

/* ---------------- التوجيه ---------------- */
function render(){
  hintSlot.innerHTML='';
  if(!ui.app){renderHome();renderStatus();return;}
  switch(ui.app){
    case 'letters':renderLetters();break;
    case 'numbers':renderNumbers();break;
    case 'photos':renderPhotos();break;
    case 'games':renderGamesHub();break;
    case 'manners':renderManners();break;
    case 'prayer':renderPrayer();break;
    case 'quran':renderQuran();break;
    case 'reels':renderReelsScreen();break;
    case 'animals':renderCards('animals');break;
    case 'fruits':renderCards('fruits');break;
  }
  renderStatus();
}
function openApp(id){
  tone(520,.12,'triangle'); stopSfx();
  if(id==='photos'||id==='reels')loadMedia();
  ui.app=id; ui.picked=null; ui.surah=null; ui.reelIndex=0; render();
}
function goHome(){
  stopGame(); stopSfx();
  if(reelIO){ try{reelIO.disconnect();}catch(e){} reelIO=null; }
  closeLayer('reelLayer'); closeLayer('viewer'); closeLayer('timeup');
  ui.app=null; ui.picked=null; tone(380,.1,'triangle'); render();
}
window.rakanBack=function(){
  if(document.getElementById('trace')){closeLayer('trace');tr=null;return;}
  if(document.getElementById('gate')){closeLayer('gate');return;}
  if(document.getElementById('studio')){closeLayer('studio');openSettings();return;}
  if(document.getElementById('settings')){grabName();savePrefs();closeLayer('settings');goHome();return;}
  if(document.getElementById('viewer')){closeLayer('viewer');return;}
  if(document.getElementById('glayer')){stopGame();ui.app='games';render();return;}
  if(ui.app)goHome();
};
window.onRakanPermissionResult=function(){
  loadMedia();
  if(document.getElementById('settings')){closeLayer('settings');openSettings();}
};

/* ---------------- الأحداث ---------------- */
screenEl.addEventListener('click',function(e){
  var t=e.target.closest('button,.row'); if(!t)return;
  if(t.dataset.app){openApp(t.dataset.app);return;}
  if(t.dataset.game){startGame(t.dataset.game);return;}
  var act=t.dataset.act;

  if(act==='hide-hint'){state.hintShown=true;savePrefs();hintSlot.innerHTML='';return;}
  if(act==='home'){goHome();return;}
  if(act==='game-exit'){stopGame();ui.app='games';render();return;}
  if(act==='win-again'){closeLayer('timeup');startGame(lastGame);return;}
  if(act==='win-home'){closeLayer('timeup');ui.app='games';render();return;}

  if(act==='trace'){openTrace();return;}
  if(act==='trace-close'){closeLayer('trace');tr=null;return;}
  if(act==='trace-clear'){if(tr&&!tr.busy){tr.strokes=[];drawTrace();}return;}
  if(act==='trace-done'){traceDone();return;}
  if(t.dataset.card!==undefined){ui.picked=true;ui.pickedIndex=+t.dataset.card;render();sayCard(ui.app,ui.pickedIndex);return;}
  if(act==='next-card'){ui.pickedIndex=(ui.pickedIndex+1)%CARDSETS[ui.app].list.length;render();sayCard(ui.app,ui.pickedIndex);return;}
  if(t.dataset.lang){ui.lang=t.dataset.lang;render();return;}
  if(t.dataset.letter!==undefined){
    var s=ui.lang==='ar'?AR_L:EN_L, li=+t.dataset.letter;
    ui.picked=s[li]; ui.pickedIndex=li; render(); sayLetter(li); return;}
  if(t.dataset.num!==undefined){
    var nn=+t.dataset.num; ui.picked=nn; ui.pickedIndex=nn; render(); sayNumber(nn); return;}
  if(act==='again'){
    if(ui.app==='letters')sayLetter(ui.pickedIndex); else if(CARDSETS[ui.app])sayCard(ui.app,ui.pickedIndex); else sayNumber(ui.pickedIndex);
    return;}
  if(act==='back-grid'){stopSfx();ui.picked=null;render();return;}

  if(t.dataset.photo!==undefined){ui.photoIndex=+t.dataset.photo;tone(560,.1,'triangle');openViewer();return;}
  if(act==='ph-close'){closeLayer('viewer');return;}

  if(act==='reel-toggle'){
    var item=t.closest('.reelItem'), v=item&&item.querySelector('video.reelVideo');
    if(v){ v.muted=false; if(v.paused)v.play(); else v.pause(); }
    return;
  }
  if(act==='timeup-close'){closeLayer('timeup');goHome();return;}

  if(t.dataset.opt!==undefined){
    var o=ui.gameOpts[+t.dataset.opt];
    if(o.correct){t.classList.add('ok');tone(700,.18);ui.gameScore++;ui.gameRound++;
      setTimeout(function(){if(ui.gameRound<5)newRound();renderShapes();},420);}
    else{t.classList.add('no');tone(200,.2,'sawtooth');}
    return;}

  if(act==='say-manner'){ sayManner(); return; }
  if(act==='say-prayer'){ sayPrayer(); return; }
  if(act==='manner-next'||act==='manner-prev'){var m=act==='manner-next'?1:-1;
    ui.mannerIndex=(ui.mannerIndex+m+MANNERS.length)%MANNERS.length;render();sayManner();return;}
  if(act==='pray-next'||act==='pray-prev'){var p2=act==='pray-next'?1:-1;
    ui.prayerStep=Math.min(PRAYER.length-1,Math.max(0,ui.prayerStep+p2));render();sayPrayer();return;}
  if(t.dataset.surah!==undefined){ui.surah=+t.dataset.surah;render();return;}
  if(act==='quran-back'){stopSfx();ui.surah=null;render();return;}
  if(act==='quran-toggle'){
    var btn=document.getElementById('qBtn');
    if(audio.paused){ audio.play(); if(btn)btn.innerHTML=iSpk()+' إيقاف مؤقت'; }
    else { audio.pause(); if(btn)btn.innerHTML=iSpk()+' تشغيل'; }
    return;}

  if(t.dataset.key){pinKey(t.dataset.key);return;}
  if(act==='settings-close'){grabName();savePrefs();closeLayer('settings');goHome();return;}
  if(t.dataset.age){state.age=t.dataset.age;refreshSettings();return;}
  if(t.dataset.min){state.minutes=+t.dataset.min;sessionStart=Date.now();timeUpShown=false;refreshSettings();return;}
  if(t.dataset.toggle){var id=t.dataset.toggle;
    if(!state.hidden[id]&&visibleApps().length<=2){tone(200,.18,'sawtooth');return;}
    state.hidden[id]=!state.hidden[id];refreshSettings();return;}
  if(t.hasAttribute('data-toggle-mute')){state.mute=!state.mute;stopSfx();refreshSettings();return;}
  if(t.dataset.voice){
    var parts=t.dataset.voice.split(':');
    state.voices[parts[0]]=parts[1];
    refreshSettings();
    // سماعة سريعة عشان تتأكد إن الصوت المختار شغال
    if(parts[0]==='letters')say('letters','letters/ar/1','أ ... أرنب','ar',function(){tone(520,.2);});
    else if(parts[0]==='numbers')say('numbers','numbers/1','واحد','ar',function(){tone(520,.2);});
    else if(parts[0]==='manners')say('manners','manners/1',MANNERS[0],'ar',function(){tone(520,.2);});
    else if(parts[0]==='animals')sayCard('animals',0);
    else if(parts[0]==='fruits')sayCard('fruits',0);
    else say('prayer','prayer/1',PRAYER[0][0],'ar',function(){tone(520,.2);});
    return;}
  if(act==='check-update'){checkUpdate();return;}
  if(act==='install-update'){ var db=document.getElementById('dlBox'); if(db)db.innerHTML='<p class="note" style="text-align:center;margin-top:8px">بيجهّز التنزيل...</p>'; if(B){try{B.installUpdate(state.repoOwner,state.repoName);}catch(e){}} return; }
  if(act==='open-releases'){ if(B&&t.dataset.url){try{B.openUrl(t.dataset.url);}catch(e){}} return; }
  if(act==='rescan'){ if(B){try{B.makeFolders();}catch(e){}} loadMedia(); refreshSettings();tone(640,.16);return;}
  if(act==='ask-access'){ if(B){try{B.requestAllFilesAccess();}catch(e){}} return; }
  if(act==='app-settings'){ if(B){try{B.openAppSettings();}catch(e){}} return; }
  if(act==='pinning'){ if(B){try{B.openPinningSettings();}catch(e){}} return; }
  if(act==='change-pin'){grabName();savePrefs();closeLayer('settings');openGate('set');return;}
  if(act==='open-studio'){grabName();savePrefs();closeLayer('settings');openStudio();return;}

  if(act==='studio-close'){closeLayer('studio');openSettings();return;}
  if(act==='pick-face'){fileFace.click();return;}
  if(act==='save-avatar'){state.hasAvatar=true;savePrefs();closeLayer('studio');openSettings();renderStatus();tone(680,.2);return;}
  if(t.dataset.skin!==undefined){state.avatar.skin=+t.dataset.skin;closeLayer('studio');openStudio();tone(500,.08,'triangle');return;}
  if(t.dataset.hc!==undefined){state.avatar.hairColor=+t.dataset.hc;closeLayer('studio');openStudio();tone(500,.08,'triangle');return;}
  if(t.dataset.inc){bumpAvatar(t.dataset.inc,1);return;}
  if(t.dataset.dec){bumpAvatar(t.dataset.dec,-1);return;}

  if(act==='exit-app'){
    grabName(); savePrefs(); stopSfx();
    if(B){try{B.exitApp();return;}catch(e){}}
    closeLayer('settings'); goHome(); return;}
});

fileFace.addEventListener('change',function(){
  if(fileFace.files&&fileFace.files[0])analyzeFace(fileFace.files[0]);
  fileFace.value='';
});

/* الضغط المطوّل على اللوجو */
var holdTimer=null, holdRaf=null;
function startHold(e){
  e.preventDefault(); brand.classList.add('holding');
  var t0=performance.now();
  (function step(){
    var p=Math.min(1,(performance.now()-t0)/1200);
    if(ringPath)ringPath.setAttribute('stroke-dashoffset',String(272*(1-p)));
    if(p<1)holdRaf=requestAnimationFrame(step);
  })();
  holdTimer=setTimeout(function(){
    endHold(); tone(300,.16,'triangle');
    state.hintShown=true; savePrefs();
    if(!document.getElementById('gate')&&!document.getElementById('settings'))openGate('open');
  },1200);
}
function endHold(){
  brand.classList.remove('holding');
  if(ringPath)ringPath.setAttribute('stroke-dashoffset','272');
  if(holdTimer){clearTimeout(holdTimer);holdTimer=null;}
  if(holdRaf){cancelAnimationFrame(holdRaf);holdRaf=null;}
}
brand.addEventListener('pointerdown',startHold);
['pointerup','pointerleave','pointercancel'].forEach(function(ev){brand.addEventListener(ev,endHold);});
document.addEventListener('contextmenu',function(e){e.preventDefault();});
document.addEventListener('gesturestart',function(e){e.preventDefault();});

/* ---------------- البداية ---------------- */
loadPrefs();
loadMedia();
render();
setTimeout(function(){ sfx('sounds/app/welcome'); },500);
setTimeout(function(){ if(B&&state.repoOwner&&state.repoName){try{B.checkUpdate(state.repoOwner,state.repoName);}catch(e){}} },2500);
})();
