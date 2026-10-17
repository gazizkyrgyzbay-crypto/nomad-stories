/** Calendar-day math in UTC; checkout is exclusive. */
export function parseDate(value:string):number|null{
  if(!/^\d{4}-\d{2}-\d{2}$/.test(value))return null;
  const [y,m,d]=value.split('-').map(Number);
  const n=Date.UTC(y,m-1,d), t=new Date(n);
  return t.getUTCFullYear()===y&&t.getUTCMonth()===m-1&&t.getUTCDate()===d?n:null;
}
export function isoDate(n:number):string{return new Date(n).toISOString().slice(0,10)}
export function addDays(s:string,days:number):string{const t=parseDate(s);if(t===null||!Number.isInteger(days))throw Error('Invalid date');return isoDate(t+days*86400000)}
export function nightsBetween(a:string,b:string):number{const x=parseDate(a),y=parseDate(b);return x===null||y===null||y<=x?0:Math.round((y-x)/86400000)}
export function overlaps(a:string,b:string,c:string,d:string):boolean{return nightsBetween(a,b)>0&&nightsBetween(c,d)>0&&a<d&&c<b}
export function isRangeAvailable(a:string,b:string,blocked:{start:string;end:string}[]):boolean{return nightsBetween(a,b)>0&&!blocked.some(v=>overlaps(a,b,v.start,v.end))}
export function totalPrice(a:string,b:string,rate:number):number{if(!Number.isSafeInteger(rate)||rate<0)throw Error('Invalid rate');return nightsBetween(a,b)*rate}
export function formatMoney(n:number):string{return new Intl.NumberFormat('ru-RU').format(n)+' ₸'}
export function formatDate(v:string,lang='ru-RU'):string{const n=parseDate(v);return n===null?'—':new Intl.DateTimeFormat(lang,{month:'short',day:'numeric',year:'numeric',timeZone:'UTC'}).format(n)}
export function todayISO():string{const p=new Intl.DateTimeFormat('en-CA',{timeZone:'Asia/Almaty',year:'numeric',month:'2-digit',day:'2-digit'}).formatToParts(new Date());const f=(k:string)=>p.find(x=>x.type===k)?.value||'';return f('year')+'-'+f('month')+'-'+f('day')}
export function buildMonth(y:number,m:number):(string|null)[]{const pad=(new Date(Date.UTC(y,m,1)).getUTCDay()+6)%7;const n=new Date(Date.UTC(y,m+1,0)).getUTCDate();return [...Array(pad).fill(null),...Array.from({length:n},(_,i)=>isoDate(Date.UTC(y,m,i+1)))]}
