'use client';
import {useEffect,useState} from 'react';
import {buildMonth,formatDate,formatMoney,isRangeAvailable,nightsBetween,todayISO,totalPrice} from '../lib/dates';
import {Lang,LANGUAGES,LANGUAGE_KEY,getSavedLanguage,guestWords,langLocale,houseName,brandTexts} from '../lib/i18n';

type Page='home'|'stays'|'explore'|'trip'|'team';
type Status='confirmed'|'checked_out';
type Booking={id:string;house:string;start:string;end:string;guests:number;status:Status};
const houses=[{id:'01',name:'Forest House'},{id:'02',name:'Lake House'},{id:'03',name:'Mountain House'}];
const rate=45000,storageKey='nomad-stories-demo-cloud-v03';

function DayPicker({start,end,onSelect,bookings,house,lang}:{start:string;end:string;onSelect:(s:string,e:string)=>void;bookings:Booking[];house:string;lang:Lang}) {
 const today=todayISO(),[count,setCount]=useState(4);
 const cy=Number(today.slice(0,4)),cm=Number(today.slice(5,7))-1;
 const blocked=bookings.filter(b=>b.house===house).map(b=>({start:b.start,end:b.end}));
 function pick(d:string){if(d<today||blocked.some(x=>d>=x.start&&d<x.end))return;
  if(!start||end||d<=start){onSelect(d,'');return}
  if(!isRangeAvailable(start,d,blocked)){onSelect(d,'');return}onSelect(start,d)}
 const months=Array.from({length:count},(_,i)=>{const x=new Date(Date.UTC(cy,cm+i,1));return {year:x.getUTCFullYear(),month:x.getUTCMonth(),key:x.toISOString().slice(0,7)}});
 const week=lang==='kk'?['Дс','Сс','Ср','Бс','Жм','Сб','Жс']:lang==='ru'?['Пн','Вт','Ср','Чт','Пт','Сб','Вс']:['Mo','Tu','We','Th','Fr','Sa','Su'];
 const t=guestWords[lang];
 return <div className="calendar continuous-calendar">
  <div className="calendar-scroll" onScroll={e=>{const box=e.currentTarget;if(count<24&&box.scrollTop+box.clientHeight>=box.scrollHeight-180)setCount(v=>Math.min(24,v+4));}} aria-label={t.scrollHint}>
  {months.map(m=><div className="calendar-month" key={m.key}>
   <div className="month-title">{new Intl.DateTimeFormat(langLocale(lang),{month:'long',year:'numeric',timeZone:'UTC'}).format(new Date(Date.UTC(m.year,m.month,1)))}</div>
   <div className="date-grid">{week.map(x=><span key={x} className="weekday">{x}</span>)}
   {buildMonth(m.year,m.month).map((d,i)=>d?<button key={d} type="button" aria-label={d} aria-pressed={d===start||d===end}
    className={'day'+(d===start||d===end?' selected':'')+(start&&end&&d>start&&d<end?' between':'')}
    disabled={d<today||blocked.some(x=>d>=x.start&&d<x.end)} onClick={()=>pick(d)}>{Number(d.slice(-2))}</button>:<span key={'empty'+i}/>)}
   </div>
  </div>)}
  {count<24&&<button className="load-months" type="button" onClick={()=>setCount(v=>Math.min(24,v+4))}>{t.moreMonths} ↓</button>}
  </div>
  <div className="cal-helper">{end?nightsBetween(start,end)+' '+t.nights.toLowerCase():start?(t.chooseCheckout):(t.chooseCheckin)}</div>
 </div>;
}
export default function NomadApp(){
 const [lang,setLang]=useState<Lang>('kk'),[mode,setMode]=useState<'night'|'day'>('night'),[page,setPage]=useState<Page>('home');
 useEffect(()=>{const saved=getSavedLanguage(localStorage.getItem(LANGUAGE_KEY));setLang(saved);document.documentElement.lang=saved},[]);
 function changeLanguage(next:Lang){setLang(next);localStorage.setItem(LANGUAGE_KEY,next);document.documentElement.lang=next}
 const [show,setShow]=useState(false),[step,setStep]=useState(1),[house,setHouse]=useState('01'),[start,setStart]=useState(''),[end,setEnd]=useState(''),[guest,setGuest]=useState(2);
 const [guestName,setGuestName]=useState(''),[guestContact,setGuestContact]=useState('');
 const [loginContact,setLoginContact]=useState(''),[loginCode,setLoginCode]=useState(''),[demoCode,setDemoCode]=useState('');
 const [loginStage,setLoginStage]=useState<'contact'|'verify'>('contact'),[loginBusy,setLoginBusy]=useState(false),[loginError,setLoginError]=useState('');
 const [myName,setMyName]=useState(''),[myBookings,setMyBookings]=useState<Booking[]>([]),[isGuestLoggedIn,setIsGuestLoggedIn]=useState(false);
 async function refreshGuest(){try{const r=await fetch('/api/guest',{cache:'no-store'});if(!r.ok){setIsGuestLoggedIn(false);return;}const d=await r.json();setIsGuestLoggedIn(true);setMyName(d.name);setMyBookings(d.bookings)}catch{setIsGuestLoggedIn(false)}}
 useEffect(()=>{void refreshGuest()},[]);
 async function startGuestLogin(){setLoginBusy(true);setLoginError('');try{const r=await fetch('/api/guest',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({action:'start',contact:loginContact})});const d=await r.json();if(!r.ok)throw new Error(d.error||'Could not send code');setDemoCode(d.demoCode);setLoginStage('verify')}catch(e){setLoginError(e instanceof Error?e.message:'Unable to log in')}finally{setLoginBusy(false)}}
 async function verifyGuestLogin(){setLoginBusy(true);setLoginError('');try{const r=await fetch('/api/guest',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({action:'verify',contact:loginContact,code:loginCode})});const d=await r.json();if(!r.ok)throw new Error(d.error||'Incorrect code');await refreshGuest();setLoginStage('contact');setDemoCode('');setLoginCode('')}catch(e){setLoginError(e instanceof Error?e.message:'Unable to log in')}finally{setLoginBusy(false)}}
 async function logoutGuest(){await fetch('/api/guest',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({action:'logout'})});setIsGuestLoggedIn(false);setMyBookings([]);}
 const validGuestInfo=guestName.trim().length>=2&&(guestContact.trim().toLowerCase().endsWith('@example.test')||guestContact.trim().startsWith('+120255501'));

 const [bookings,setBookings]=useState<Booking[]>([]),[cleaned,setCleaned]=useState<string[]>([]),[ready,setReady]=useState(false);
 const [availability,setAvailability]=useState<{house:string;start:string;end:string}[]>([]);
 const [apiReady,setApiReady]=useState(false),[apiError,setApiError]=useState('');
 const [saving,setSaving]=useState(false),[bookingError,setBookingError]=useState('');
 
 const [staffCode,setStaffCode]=useState(''),[staffDraft,setStaffDraft]=useState(''),[teamBookings,setTeamBookings]=useState<(Booking & {cleaned:boolean})[]>([]),[staffError,setStaffError]=useState('');
 const calendarBookings:Booking[]=availability.map(a=>({...a,id:'',guests:1,status:'confirmed'}));
 async function refreshAvailability(){try{const r=await fetch('/api/demo',{cache:'no-store'});if(!r.ok)throw new Error('offline');const v=await r.json();setAvailability(v.bookings);setApiReady(true);setApiError('')}catch{setApiReady(false);setApiError('offline')}}
 async function refreshTeam(code:string){const r=await fetch('/api/demo?staff=1',{headers:{Authorization:'Bearer '+code},cache:'no-store'});if(!r.ok)throw new Error('Access denied');const d=await r.json();setTeamBookings(d.bookings);}
 async function staffLogin(){setStaffError('');try{const r=await fetch('/api/demo',{method:'POST',headers:{'Content-Type':'application/json',Authorization:'Bearer '+staffDraft},body:JSON.stringify({action:'staff-login'})});if(!r.ok)throw new Error('Неверный код команды / Invalid staff code');await refreshTeam(staffDraft);setStaffCode(staffDraft);setStaffDraft('');}catch(e){setStaffError(e instanceof Error?e.message:'Staff login failed')}}
 async function staffUpdate(id:string,operation:'checkout'|'clean'){setStaffError('');try{const r=await fetch('/api/demo',{method:'POST',headers:{'Content-Type':'application/json',Authorization:'Bearer '+staffCode},body:JSON.stringify({action:'staff-update',id,operation})});if(!r.ok)throw new Error('Update failed');await refreshTeam(staffCode);await refreshAvailability();}catch(e){setStaffError(e instanceof Error?e.message:'Update failed')}}
 useEffect(()=>{void refreshAvailability();const timer=setInterval(()=>{void refreshAvailability()},30000);return()=>clearInterval(timer)},[]);

 const t=guestWords[lang],active=houses.find(h=>h.id===house)||houses[0];
 const nights=nightsBetween(start,end),price=totalPrice(start,end,rate);
 const blocks=availability.filter(b=>b.house===house).map(b=>({start:b.start,end:b.end}));
 const valid=apiReady && nights>0 && isRangeAvailable(start,end,blocks);
 useEffect(()=>{try{const v=JSON.parse(localStorage.getItem(storageKey)||'{}');if(Array.isArray(v.bookings))setBookings(v.bookings);if(Array.isArray(v.cleaned))setCleaned(v.cleaned)}catch{}setReady(true)},[]);
 useEffect(()=>{if(ready)localStorage.setItem(storageKey,JSON.stringify({bookings,cleaned}))},[bookings,cleaned,ready]);
 function begin(id:string){setHouse(id);setStart('');setEnd('');setGuest(2);setStep(1);setBookingError('');setShow(true);void refreshAvailability()}
 async function finish(){if(!valid||saving)return;setSaving(true);setBookingError('');try{const r=await fetch('/api/demo',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({action:'book',house,start,end,guests:guest,guestName:guestName.trim(),contact:guestContact.trim()})});const d=await r.json();if(!r.ok)throw new Error(d.error||'Booking failed');setBookings(v=>[...v,d.booking]);await Promise.all([refreshAvailability(),refreshGuest()]);setLoginContact(guestContact.trim());setStep(3);}catch(e){setBookingError(e instanceof Error?e.message:'Booking failed');await refreshAvailability()}finally{setSaving(false)}}
 const navigation:[Page,string][]=[['home',t.home],['stays',t.stays],['explore',t.explore],['trip',t.trip]];
 return <div className="site" data-theme={mode}><div className="demo-banner">NOMAD STORIES · {t.demoBanner}</div>
  <header className="topbar"><button className="brand" onClick={()=>setPage('home')}>✧ <span>NOMAD <b>STORIES</b><small>{brandTexts[lang].tagline}</small></span></button><nav className="desktop-nav">{navigation.map(([v,label])=><button key={v} onClick={()=>setPage(v)} className={page===v?'active':''}>{label}</button>)}</nav><div className="top-actions"><select className="action-switch language-select" value={lang} onChange={e=>changeLanguage(e.target.value as Lang)} aria-label="Language / Тіл / Язык">{LANGUAGES.map(l=><option key={l.code} value={l.code}>{l.label}</option>)}</select><button className="action-switch" onClick={()=>setMode(mode==='night'?'day':'night')}>{mode==='night'?'☾':'☼'}</button><button className="primary small" onClick={()=>begin('01')}>{t.book} ↗</button></div></header>
  <main>{page==='home'&&<><section className="hero"><div className="landscape"/><div className="hero-inner"><div className="eyebrow">{t.tag}</div><h1>{t.title}</h1><p>{t.lead}</p><div className="hero-buttons"><button className="primary" onClick={()=>setPage('stays')}>{t.stays} ↗</button><button className="ghost" onClick={()=>setPage('explore')}>{t.explore} →</button></div></div><div className="hero-edge">{t.heroEdge} <span>{t.heroEdge2}</span></div></section></>}
   {(page==='home'||page==='stays')&&<section className="section"><div className="section-heading"><div className="eyebrow">{t.tag}</div><h2>{t.cabins}</h2><p>{t.photosNote}</p></div><div className="cabin-grid">{houses.map((h,i)=><article className="cabin-card" key={h.id}><div className={'cabin-art cabin-'+i}><span>{h.id} / 03</span><div className="hill"/></div><div className="cabin-info"><div><small>{t.chapter}</small><h3>{houseName(lang,h.id)}</h3></div><div className="amount">{formatMoney(rate)}<small>/{t.perNight}</small></div></div><div className="cabin-bottom"><span>{t.upToFour}</span><button onClick={()=>begin(h.id)}>{t.book} ↗</button></div></article>)}</div></section>}
   {page==='explore'&&<section className="section section-page"><div className="eyebrow">{t.map}</div><h2>{t.map}</h2><div className="map-panel"><span>{t.chapter} — {t.open}</span><span>{t.expedition} — {t.coming}</span><span>{t.beyond} — {t.coming}</span></div><p className="small-note">{t.mapNote}</p></section>}
   {page==='trip'&&<section className="section section-page guest-trip-page"><div className="eyebrow">{t.accessChapter}</div><h2>{t.trip}</h2>
   <p className="section-subtitle">{t.travelNote}</p>
   {!isGuestLoggedIn?<div className="guest-login-box">
     <div className="eyebrow">{t.noPassword}</div>
     <h3>{t.journeys}</h3>
     {loginStage==='contact'?<><label>{t.emailPhone}</label><input type="text" value={loginContact} onChange={e=>setLoginContact(e.target.value)} placeholder="guest01@example.test" autoComplete="off"/><p className="small-note">{t.fakeContact}</p><button className="primary" disabled={loginBusy||!loginContact.trim()} onClick={()=>void startGuestLogin()}>{t.getCode} →</button></>:<>
     <p className="small-note">{t.codeNote}</p><div className="demo-otp">{demoCode}</div>
     <label>{t.sixDigit}</label><input inputMode="numeric" maxLength={6} value={loginCode} onChange={e=>setLoginCode(e.target.value.replace(/\D/g,''))} placeholder="000000"/><button className="primary" disabled={loginBusy||loginCode.length!==6} onClick={()=>void verifyGuestLogin()}>{t.enter} →</button><button className="text-button" onClick={()=>setLoginStage('contact')}>{t.otherContact}</button></>}
     {loginError&&<p role="alert" className="error-text">{loginError}</p>}
   </div>:<><div className="account-heading"><div><div className="eyebrow">{t.guestChapter}</div><h3>{t.welcome}{myName}</h3></div><button className="text-button" onClick={()=>void logoutGuest()}>{t.signOut}</button></div><div className="trip-list">{myBookings.length?myBookings.map(b=><article className="trip-card" key={b.id}><small>{b.id.slice(0,8).toUpperCase()} · {(b.status==='confirmed'?t.statusConfirmed:t.statusCheckedOut)}</small><h3>{houseName(lang,b.house)}</h3><p>{formatDate(b.start,langLocale(lang))} → {formatDate(b.end,langLocale(lang))}</p><strong>{nightsBetween(b.start,b.end)} {t.nights.toLowerCase()} · {formatMoney(totalPrice(b.start,b.end,rate))}</strong></article>):<p>{t.none}</p>}</div></>}
   </section>}

  </main><footer><strong>NOMAD STORIES</strong><span>{t.heroEdge} · {brandTexts[lang].preview}</span></footer>
  <nav className="mobile-nav">{navigation.map(([v,label])=><button key={v} onClick={()=>setPage(v)} className={page===v?'active':''}><span>{({home:'⌂',stays:'⌑',explore:'◇',trip:'✧',team:'▦'} as Record<Page,string>)[v]}</span><small>{label}</small></button>)}</nav>
  {show&&<div className="modal-backdrop"><section className="booking-modal" role="dialog" aria-modal="true" aria-label={t.calendar}><div className="modal-header"><div className="eyebrow">{t.reservation}</div><button onClick={()=>setShow(false)} aria-label={t.close}>×</button></div><h2>{step===1?t.calendar:step===2?t.book:t.confirm}</h2><div className="progress"><span className="filled"/><span className={step>=2?'filled':''}/><span className={step>=3?'filled':''}/></div>{step===1?<div className="modal-body"><label>{t.stays}</label><select value={house} onChange={e=>{setHouse(e.target.value);setStart('');setEnd('')}}>{houses.map(h=><option value={h.id} key={h.id}>{h.id} · {houseName(lang,h.id)}</option>)}</select><label>{t.arrive} → {t.depart}</label><DayPicker lang={lang} start={start} end={end} bookings={calendarBookings} house={house} onSelect={(s,e)=>{setStart(s);setEnd(e)}}/><div className="range-summary"><span>{t.arrive}: <strong>{start||'—'}</strong></span><span>{t.depart}: <strong>{end||'—'}</strong></span></div><div className="form-line">{t.guest}<select value={guest} onChange={e=>setGuest(Number(e.target.value))}>{[1,2,3,4].map(n=><option key={n}>{n}</option>)}</select></div><div className="price-summary"><div>{t.nights}: <strong>{nights||'—'}</strong></div><div className="price-total">{t.total} <strong>{nights?formatMoney(price):'—'}</strong></div></div>{apiError&&<p className="small-note" role="alert">{t.dbOffline}</p>}<button className="primary full" disabled={!valid} onClick={()=>setStep(2)}>{t.next} ↗</button></div>:step===2?<div className="modal-body"><p className="small-note">{t.simulate}</p><h3>{houseName(lang,active.id)}</h3><div className="range-summary">{start} → {end}</div><div className="price-total">{nights} {t.nights.toLowerCase()} · {formatMoney(price)}</div>
 <div className="guest-fields">
  <label>{t.fullName}</label><input value={guestName} onChange={e=>setGuestName(e.target.value)} placeholder={t.namePlaceholder} autoComplete="off"/>
  <label>{t.contactLabel}</label><input value={guestContact} onChange={e=>setGuestContact(e.target.value)} placeholder="guest01@example.test" autoComplete="off"/>
  <p className="small-note">{t.accountNote}</p>
 </div>{bookingError&&<p className="small-note" role="alert">{bookingError}</p>}<button className="primary full" disabled={saving||!validGuestInfo} onClick={()=>void finish()}>{saving?t.confirmBusy:t.pay} ↗</button><button className="text-button" onClick={()=>setStep(1)}>← {t.calendar}</button></div>:<div className="modal-body success"><span>✓</span><p>{t.confirm}</p><button className="primary full" onClick={()=>{setShow(false);setPage('trip')}}>{t.trip} ↗</button></div>}</section></div>}
 </div>
}
