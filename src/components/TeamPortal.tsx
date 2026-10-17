'use client';
import {useEffect,useState} from 'react';
import {addDays,todayISO,formatMoney,nightsBetween} from '@/lib/dates';

type Role='owner'|'manager'|'reception'|'housekeeping';
type Staff={name:string;email:string;role:Role};
type Booking={id:string;house:string;start:string;end:string;guests:number;status:string;cleaned:boolean;guest_name:string|null};
type Account={id:string;email:string;display_name:string;role:Role};
const houses=[{id:'01',name:'Forest House'},{id:'02',name:'Lake House'},{id:'03',name:'Mountain House'}];
const roles:{value:Role;label:string}[]=[{value:'manager',label:'Менеджер'},{value:'reception',label:'Администратор'},{value:'housekeeping',label:'Уборка'}];
export default function TeamPortal(){
 const [staff,setStaff]=useState<Staff|null>(null),[initialized,setInitialized]=useState(true),[loading,setLoading]=useState(true);
 const [tab,setTab]=useState<'overview'|'calendar'|'bookings'|'cleaning'|'accounts'>('overview'),[shift,setShift]=useState(0);
 const [bookings,setBookings]=useState<Booking[]>([]),[accounts,setAccounts]=useState<Account[]>([]);
 const [email,setEmail]=useState(''),[password,setPassword]=useState(''),[displayName,setDisplayName]=useState(''),[master,setMaster]=useState('');
 const [newEmail,setNewEmail]=useState(''),[newName,setNewName]=useState(''),[newPassword,setNewPassword]=useState(''),[newRole,setNewRole]=useState<Role>('housekeeping');
 const [error,setError]=useState(''),[notice,setNotice]=useState(''),[busy,setBusy]=useState(false);
 async function refresh(){
  try{const r=await fetch('/api/staff',{cache:'no-store'}),data=await r.json();
   if(r.ok){setStaff(data.staff);setBookings(data.bookings||[]);setAccounts(data.accounts||[]);setError('');}
   else{setStaff(null);setInitialized(data.initialized??true);if(r.status!==401)setError(data.error||'Ошибка сервера');}
  }catch{setError('Не удалось связаться с сервером. Проверьте соединение.')}finally{setLoading(false)}
 }
 useEffect(()=>{void refresh()},[]);
 async function action(payload:Record<string,unknown>){
  setBusy(true);setError('');setNotice('');
  try{const r=await fetch('/api/staff',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(payload)});const data=await r.json();
   if(!r.ok)throw new Error(data.error||'Операция не выполнена');
   await refresh();setNotice('Готово — данные сохранены.');
  }catch(e){setError(e instanceof Error?e.message:'Ошибка')}finally{setBusy(false)}
 }
 const booked=bookings.filter(b=>b.status==='confirmed').length;
 const toClean=bookings.filter(b=>b.status==='checked_out'&&!b.cleaned).length;
 const total=bookings.reduce((sum,b)=>sum+nightsBetween(b.start,b.end)*45000,0);
 const allTabs=[{key:'overview',label:'Обзор'},{key:'calendar',label:'Календарь'},{key:'bookings',label:'Бронирования'},{key:'cleaning',label:'Уборка'},{key:'accounts',label:'Сотрудники'}] as const;
 const availableTabs=allTabs.filter(t=>t.key!=='accounts'||staff?.role==='owner');
 const days=Array.from({length:21},(_,i)=>addDays(todayISO(),shift*14+i));
 const dayLabel=(d:string)=>new Intl.DateTimeFormat('ru-RU',{day:'numeric',month:'short',timeZone:'UTC'}).format(new Date(d+'T00:00:00Z'));
 const safeContactHint='Используйте вымышленные контакты вида operator01@example.test. Реальные данные сотрудников пока не вводить.';
 return <div className="staff-site">
  <header className="staff-topbar"><div className="staff-mark"><span className="staff-brand">NOMAD <strong>STORIES</strong></span><small>OPERATIONS · STAGING</small></div><div className="staff-top-actions"><a href="/" className="staff-link">← Сайт гостей</a>{staff&&<span className="staff-user">{staff.name} · {staff.role}</span>}</div></header>
  <div className="staff-demo-banner">ТЕСТОВОЕ УПРАВЛЕНИЕ · ВЫМЫШЛЕННЫЕ ДАННЫЕ · БЕЗ РЕАЛЬНЫХ ПЛАТЕЖЕЙ</div>
  {loading?<main className="staff-loading">Загружаем данные...</main>:!staff?
   <main className="staff-signin-wrap"><div className="staff-signin"><div className="staff-eyebrow">NOMAD / TEAM ACCESS</div><h1>{initialized?'Вход для команды':'Создать первый аккаунт руководителя'}</h1><p>Отдельный рабочий кабинет. Для гостей регистрация не нужна.</p>
   {!initialized&&<><label>Код настройки из Railway Variables → STAFF_TEST_CODE</label><input type="password" autoComplete="off" value={master} onChange={e=>setMaster(e.target.value)} placeholder="Код первоначальной настройки"/>
   <label>Ваше тестовое имя</label><input value={displayName} onChange={e=>setDisplayName(e.target.value)} placeholder="Тестовый руководитель"/></>}
   <label>Рабочий тестовый email</label><input type="email" autoComplete="off" value={email} onChange={e=>setEmail(e.target.value.trim().toLowerCase())} placeholder="operator01@example.test"/>
   <label>Пароль сотрудника — минимум 12 символов</label><input type="password" autoComplete={initialized?'current-password':'new-password'} value={password} onChange={e=>setPassword(e.target.value)} placeholder="Пароль"/>
   {error&&<p className="staff-error" role="alert">{error}</p>}
   <button className="staff-cta" disabled={busy||!email||!password} onClick={()=>void action(initialized?{action:'login',email,password}:{action:'bootstrap',email,password,name:displayName,bootstrapCode:master})}>{busy?'Подождите...':initialized?'Войти в панель':'Создать аккаунт'} →</button>
   <p className="staff-note">{safeContactHint}</p>
   </div></main>:
   <div className="staff-layout">
    <aside className="staff-sidebar"><div className="staff-eyebrow">WORKSPACE</div>{availableTabs.map(t=><button key={t.key} className={tab===t.key?'active':''} onClick={()=>setTab(t.key)}>{t.label}</button>)}
    <button className="staff-logout" onClick={()=>void action({action:'logout'})}>Выйти ↗</button></aside>
    <main className="staff-content">
     <div className="staff-intro"><div><div className="staff-eyebrow">CHAPTER 01 / KOLSAY</div><h1>{allTabs.find(t=>t.key===tab)?.label}</h1><p>Единая онлайн-система трёх гостевых домиков.</p></div><button onClick={()=>void refresh()} className="staff-outline">↻ Обновить</button></div>
     {error&&<p className="staff-error" role="alert">{error}</p>}{notice&&<p className="staff-success">{notice}</p>}
     {tab==='overview'&&<><div className="staff-kpis"><article><small>Всего тестовых броней</small><strong>{bookings.length}</strong><span>Все устройства · общая база</span></article><article><small>Активные заезды</small><strong>{booked}</strong><span>Не отмечен выезд</span></article><article><small>Ожидают уборку</small><strong>{toClean}</strong><span>Требуют внимания</span></article><article><small>Выручка · демо</small><strong>{formatMoney(total)}</strong><span>Оплата не списывается</span></article></div>
     <h2>Последние бронирования</h2><BookingTable bookings={bookings.slice(0,8)} staff={staff} onAction={action} busy={busy}/></>}
     {tab==='calendar'&&<><div className="staff-calendar-head"><p>Занятость по домикам — 21 день</p><div><button className="staff-outline" onClick={()=>setShift(v=>Math.max(-1,v-1))}>← Ранее</button><button className="staff-outline" onClick={()=>setShift(v=>v+1)}>Позже →</button></div></div>
     <div className="staff-calendar-scroll"><div className="staff-calendar-grid" style={{gridTemplateColumns:'160px repeat(21, minmax(55px,1fr))'}}><div className="staff-cal-corner">Домик</div>{days.map(d=><div className="staff-cal-day" key={d}>{dayLabel(d)}</div>)}
     {houses.map(h=><div className="staff-cal-row" key={h.id} style={{display:'contents'}}><div className="staff-cal-house">{h.id} · {h.name}</div>{days.map(d=>{const occupied=bookings.some(b=>b.house===h.id&&b.start<=d&&d<b.end);return <div key={d} className={'staff-cal-cell'+(occupied?' occupied':'')} title={occupied?'Занято':'Свободно'}>{occupied?'●':'·'}</div>})}</div>)}</div></div></>}
     {tab==='bookings'&&<BookingTable bookings={bookings} staff={staff} onAction={action} busy={busy}/>}
     {tab==='cleaning'&&<><div className="staff-kpis"><article><small>Не убрано</small><strong>{toClean}</strong><span>После выезда</span></article><article><small>Убрано</small><strong>{bookings.filter(b=>b.cleaned).length}</strong><span>Отметки сотрудников</span></article></div><BookingTable bookings={bookings.filter(b=>b.status==='checked_out')} staff={staff} onAction={action} busy={busy}/></>}
     {tab==='accounts'&&staff.role==='owner'&&<><h2>Добавить сотрудника</h2><p className="staff-note">{safeContactHint}</p><div className="staff-create-form"><input value={newName} onChange={e=>setNewName(e.target.value)} placeholder="Имя сотрудника"/><input value={newEmail} onChange={e=>setNewEmail(e.target.value)} placeholder="staff02@example.test"/><input type="password" value={newPassword} onChange={e=>setNewPassword(e.target.value)} placeholder="Временный пароль (12+ символов)"/><select value={newRole} onChange={e=>setNewRole(e.target.value as Role)}>{roles.map(r=><option key={r.value} value={r.value}>{r.label}</option>)}</select><button className="staff-cta" disabled={busy} onClick={()=>void action({action:'create',email:newEmail,name:newName,password:newPassword,role:newRole})}>Создать аккаунт</button></div>
     <h2>Учётные записи</h2><div className="staff-account-list">{accounts.map(a=><div key={a.id}><strong>{a.display_name}</strong><span>{a.email}</span><em>{a.role}</em></div>)}</div></>}
    </main>
   </div>}
  <footer className="staff-footer">NOMAD STORIES / TEAM · Testing infrastructure only · No real guest data</footer>
 </div>
}
function BookingTable({bookings,staff,onAction,busy}:{bookings:Booking[];staff:Staff;onAction:(payload:Record<string,unknown>)=>Promise<void>;busy:boolean}){
 return <div className="staff-table-scroll"><table className="staff-table"><thead><tr><th>Домик</th><th>Даты</th><th>Ночей</th><th>Гость</th><th>Статус</th><th>Действие</th></tr></thead><tbody>{bookings.map(b=><tr key={b.id}><td>{b.house} · {houses.find(h=>h.id===b.house)?.name}</td><td>{b.start} → {b.end}</td><td>{nightsBetween(b.start,b.end)}</td><td>{b.guest_name||'—'}</td><td><span className={'staff-status '+(b.cleaned?'clean':b.status==='confirmed'?'active':'waiting')}>{b.cleaned?'Готово':b.status==='confirmed'?'Занято':'На уборке'}</span></td><td>{b.status==='confirmed'&&staff.role!=='housekeeping'?<button disabled={busy} className="staff-row-action" onClick={()=>void onAction({action:'update',id:b.id,operation:'checkout'})}>Отметить выезд</button>:b.status==='checked_out'&&!b.cleaned?<button disabled={busy} className="staff-row-action" onClick={()=>void onAction({action:'update',id:b.id,operation:'clean'})}>Убрано ✓</button>:<span className="staff-muted">—</span>}</td></tr>)}{!bookings.length&&<tr><td colSpan={6} className="staff-empty">Бронирований пока нет</td></tr>}</tbody></table></div>
}
