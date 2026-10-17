'use client';
import {useEffect,useState} from 'react';
import {addDays,todayISO,formatMoney,nightsBetween} from '@/lib/dates';
import {LANGUAGES,LANGUAGE_KEY,getSavedLanguage,langLocale,houseName,type Lang} from '@/lib/i18n';
import {staffTranslate} from '@/lib/staff-i18n';

type Role='owner'|'manager'|'reception'|'housekeeping';
type Staff={name:string;email:string;role:Role};
type Booking={id:string;house:string;start:string;end:string;guests:number;status:string;cleaned:boolean;guest_name:string|null};
type Account={id:string;email:string;display_name:string;role:Role};
const houses=[{id:'01',name:'Forest House'},{id:'02',name:'Lake House'},{id:'03',name:'Mountain House'}];
const roles:{value:Role;label:string}[]=[{value:'manager',label:'Менеджер'},{value:'reception',label:'Администратор'},{value:'housekeeping',label:'Уборка'}];
export default function TeamPortal(){
 const [lang,setLang]=useState<Lang>('kk');
 const st=(text:string)=>staffTranslate(lang,text);
 useEffect(()=>{const selected=getSavedLanguage(localStorage.getItem(LANGUAGE_KEY));setLang(selected);document.documentElement.lang=selected},[]);
 function changeLanguage(next:Lang){setLang(next);localStorage.setItem(LANGUAGE_KEY,next);document.documentElement.lang=next}
 const [staff,setStaff]=useState<Staff|null>(null),[initialized,setInitialized]=useState(true),[loading,setLoading]=useState(true);
 const [tab,setTab]=useState<'overview'|'calendar'|'bookings'|'cleaning'|'accounts'>('overview'),[shift,setShift]=useState(0);
 const [bookings,setBookings]=useState<Booking[]>([]),[accounts,setAccounts]=useState<Account[]>([]);
 const [email,setEmail]=useState(''),[password,setPassword]=useState(''),[displayName,setDisplayName]=useState(''),[master,setMaster]=useState('');
 const [newEmail,setNewEmail]=useState(''),[newName,setNewName]=useState(''),[newPassword,setNewPassword]=useState(''),[newRole,setNewRole]=useState<Role>('housekeeping');
 const [error,setError]=useState(''),[notice,setNotice]=useState(''),[busy,setBusy]=useState(false);
 async function refresh(){
  try{const r=await fetch('/api/staff',{cache:'no-store'}),data=await r.json();
   if(r.ok){setStaff(data.staff);setBookings(data.bookings||[]);setAccounts(data.accounts||[]);setError('');}
   else{setStaff(null);setInitialized(data.initialized??true);if(r.status!==401)setError(data.error||st('Ошибка сервера'));}
  }catch{setError(st('Не удалось связаться с сервером. Проверьте соединение.'))}finally{setLoading(false)}
 }
 useEffect(()=>{void refresh()},[]);
 async function action(payload:Record<string,unknown>){
  setBusy(true);setError('');setNotice('');
  try{const r=await fetch('/api/staff',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(payload)});const data=await r.json();
   if(!r.ok)throw new Error(data.error||st('Операция не выполнена'));
   await refresh();setNotice(st('Готово — данные сохранены.'));
  }catch(e){setError(e instanceof Error?e.message:st('Ошибка'))}finally{setBusy(false)}
 }
 const booked=bookings.filter(b=>b.status==='confirmed').length;
 const toClean=bookings.filter(b=>b.status==='checked_out'&&!b.cleaned).length;
 const total=bookings.reduce((sum,b)=>sum+nightsBetween(b.start,b.end)*45000,0);
 const allTabs=[{key:'overview',label:st('Обзор')},{key:'calendar',label:st('Календарь')},{key:'bookings',label:st('Бронирования')},{key:'cleaning',label:st('Уборка')},{key:'accounts',label:st('Сотрудники')}] as const;
 const availableTabs=allTabs.filter(t=>t.key!=='accounts'||staff?.role==='owner');
 const days=Array.from({length:21},(_,i)=>addDays(todayISO(),shift*14+i));
 const dayLabel=(d:string)=>new Intl.DateTimeFormat(langLocale(lang),{day:'numeric',month:'short',timeZone:'UTC'}).format(new Date(d+'T00:00:00Z'));
 const safeContactHint=st('Используйте вымышленные контакты вида operator01@example.test. Реальные данные сотрудников пока не вводить.');
 return <div className="staff-site">
  <header className="staff-topbar"><div className="staff-mark"><span className="staff-brand">NOMAD <strong>STORIES</strong></span><small>OPERATIONS · STAGING</small></div><div className="staff-top-actions"><select className="staff-language-select" value={lang} aria-label="Тіл / Language / Язык" onChange={e=>changeLanguage(e.target.value as Lang)}>{LANGUAGES.map(l=><option key={l.code} value={l.code}>{l.label}</option>)}</select><a href="/" className="staff-link">{st("← Сайт гостей")}</a>{staff&&<span className="staff-user">{staff.name} · {st(staff.role)}</span>}</div></header>
  <div className="staff-demo-banner">{st("ТЕСТОВОЕ УПРАВЛЕНИЕ · ВЫМЫШЛЕННЫЕ ДАННЫЕ · БЕЗ РЕАЛЬНЫХ ПЛАТЕЖЕЙ")}</div>
  {loading?<main className="staff-loading">{st("Загружаем данные...")}</main>:!staff?
   <main className="staff-signin-wrap"><div className="staff-signin"><div className="staff-eyebrow">NOMAD / TEAM ACCESS</div><h1>{initialized?st('Вход для команды'):st('Создать первый аккаунт руководителя')}</h1><p>{st("Отдельный рабочий кабинет. Для гостей регистрация не нужна.")}</p>
   {!initialized&&<><label>{st("Код настройки из Railway Variables → STAFF_TEST_CODE")}</label><input type="password" autoComplete="off" value={master} onChange={e=>setMaster(e.target.value)} placeholder={st("Код первоначальной настройки")}/>
   <label>{st("Ваше тестовое имя")}</label><input value={displayName} onChange={e=>setDisplayName(e.target.value)} placeholder={st("Тестовый руководитель")}/></>}
   <label>{st("Рабочий тестовый email")}</label><input type="email" autoComplete="off" value={email} onChange={e=>setEmail(e.target.value.trim().toLowerCase())} placeholder="operator01@example.test"/>
   <label>{st("Пароль сотрудника — минимум 12 символов")}</label><input type="password" autoComplete={initialized?'current-password':'new-password'} value={password} onChange={e=>setPassword(e.target.value)} placeholder={st("Пароль")}/>
   {error&&<p className="staff-error" role="alert">{error}</p>}
   <button className="staff-cta" disabled={busy||!email||!password} onClick={()=>void action(initialized?{action:'login',email,password}:{action:'bootstrap',email,password,name:displayName,bootstrapCode:master})}>{busy?st('Подождите...'):initialized?st('Войти в панель'):st('Создать аккаунт')} →</button>
   <p className="staff-note">{safeContactHint}</p>
   </div></main>:
   <div className="staff-layout">
    <aside className="staff-sidebar"><div className="staff-eyebrow">WORKSPACE</div>{availableTabs.map(t=><button key={t.key} className={tab===t.key?'active':''} onClick={()=>setTab(t.key)}>{t.label}</button>)}
    <button className="staff-logout" onClick={()=>void action({action:'logout'})}>{st("Выйти ↗")}</button></aside>
    <main className="staff-content">
     <div className="staff-intro"><div><div className="staff-eyebrow">CHAPTER 01 / KOLSAY</div><h1>{allTabs.find(t=>t.key===tab)?.label}</h1><p>{st("Единая онлайн-система трёх гостевых домиков.")}</p></div><button onClick={()=>void refresh()} className="staff-outline">{st("↻ Обновить")}</button></div>
     {error&&<p className="staff-error" role="alert">{error}</p>}{notice&&<p className="staff-success">{notice}</p>}
     {tab==='overview'&&<><div className="staff-kpis"><article><small>{st("Всего тестовых броней")}</small><strong>{bookings.length}</strong><span>{st("Все устройства · общая база")}</span></article><article><small>{st("Активные заезды")}</small><strong>{booked}</strong><span>{st("Не отмечен выезд")}</span></article><article><small>{st("Ожидают уборку")}</small><strong>{toClean}</strong><span>{st("Требуют внимания")}</span></article><article><small>{st("Выручка · демо")}</small><strong>{formatMoney(total)}</strong><span>{st("Оплата не списывается")}</span></article></div>
     <h2>{st("Последние бронирования")}</h2><BookingTable lang={lang} bookings={bookings.slice(0,8)} staff={staff} onAction={action} busy={busy}/></>}
     {tab==='calendar'&&<><div className="staff-calendar-head"><p>{st("Занятость по домикам — 21 день")}</p><div><button className="staff-outline" onClick={()=>setShift(v=>Math.max(-1,v-1))}>{st("← Ранее")}</button><button className="staff-outline" onClick={()=>setShift(v=>v+1)}>{st("Позже →")}</button></div></div>
     <div className="staff-calendar-scroll"><div className="staff-calendar-grid" style={{gridTemplateColumns:'160px repeat(21, minmax(55px,1fr))'}}><div className="staff-cal-corner">{st("Домик")}</div>{days.map(d=><div className="staff-cal-day" key={d}>{dayLabel(d)}</div>)}
     {houses.map(h=><div className="staff-cal-row" key={h.id} style={{display:'contents'}}><div className="staff-cal-house">{h.id} · {houseName(lang,h.id)}</div>{days.map(d=>{const occupied=bookings.some(b=>b.house===h.id&&b.start<=d&&d<b.end);return <div key={d} className={'staff-cal-cell'+(occupied?' occupied':'')} title={occupied?st('Занято'):st('Свободно')}>{occupied?'●':'·'}</div>})}</div>)}</div></div></>}
     {tab==='bookings'&&<BookingTable lang={lang} bookings={bookings} staff={staff} onAction={action} busy={busy}/>}
     {tab==='cleaning'&&<><div className="staff-kpis"><article><small>{st("Не убрано")}</small><strong>{toClean}</strong><span>{st("После выезда")}</span></article><article><small>{st("Убрано")}</small><strong>{bookings.filter(b=>b.cleaned).length}</strong><span>{st("Отметки сотрудников")}</span></article></div><BookingTable lang={lang} bookings={bookings.filter(b=>b.status==='checked_out')} staff={staff} onAction={action} busy={busy}/></>}
     {tab==='accounts'&&staff.role==='owner'&&<><h2>{st("Добавить сотрудника")}</h2><p className="staff-note">{safeContactHint}</p><div className="staff-create-form"><input value={newName} onChange={e=>setNewName(e.target.value)} placeholder={st("Имя сотрудника")}/><input value={newEmail} onChange={e=>setNewEmail(e.target.value)} placeholder="staff02@example.test"/><input type="password" value={newPassword} onChange={e=>setNewPassword(e.target.value)} placeholder={st("Временный пароль (12+ символов)")}/><select value={newRole} onChange={e=>setNewRole(e.target.value as Role)}>{roles.map(r=><option key={r.value} value={r.value}>{st(r.label)}</option>)}</select><button className="staff-cta" disabled={busy} onClick={()=>void action({action:'create',email:newEmail,name:newName,password:newPassword,role:newRole})}>{st("Создать аккаунт")}</button></div>
     <h2>{st("Учётные записи")}</h2><div className="staff-account-list">{accounts.map(a=><div key={a.id}><strong>{a.display_name}</strong><span>{a.email}</span><em>{st(a.role)}</em></div>)}</div></>}
    </main>
   </div>}
  <footer className="staff-footer">NOMAD STORIES / TEAM · Testing infrastructure only · No real guest data</footer>
 </div>
}
function BookingTable({lang,bookings,staff,onAction,busy}:{lang:Lang;bookings:Booking[];staff:Staff;onAction:(payload:Record<string,unknown>)=>Promise<void>;busy:boolean}){
 const st=(value:string)=>staffTranslate(lang,value);
 return <div className="staff-table-scroll"><table className="staff-table"><thead><tr><th>{st("Домик")}</th><th>{st("Даты")}</th><th>{st("Ночей")}</th><th>{st("Гость")}</th><th>{st("Статус")}</th><th>{st("Действие")}</th></tr></thead><tbody>{bookings.map(b=><tr key={b.id}><td>{b.house} · {houseName(lang,b.house)}</td><td>{b.start} → {b.end}</td><td>{nightsBetween(b.start,b.end)}</td><td>{b.guest_name||'—'}</td><td><span className={'staff-status '+(b.cleaned?'clean':b.status==='confirmed'?'active':'waiting')}>{b.cleaned?st('Готово'):b.status==='confirmed'?st('Занято'):st('На уборке')}</span></td><td>{b.status==='confirmed'&&staff.role!=='housekeeping'?<button disabled={busy} className="staff-row-action" onClick={()=>void onAction({action:'update',id:b.id,operation:'checkout'})}>{st("Отметить выезд")}</button>:b.status==='checked_out'&&!b.cleaned?<button disabled={busy} className="staff-row-action" onClick={()=>void onAction({action:'update',id:b.id,operation:'clean'})}>{st("Убрано ✓")}</button>:<span className="staff-muted">—</span>}</td></tr>)}{!bookings.length&&<tr><td colSpan={6} className="staff-empty">{st("Бронирований пока нет")}</td></tr>}</tbody></table></div>
}
