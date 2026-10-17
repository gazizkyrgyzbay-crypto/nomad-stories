// Only synthetic reservations far into the future; never run against production.
const base=process.env.NOMAD_BASE_URL||'https://nomad-web-staging.up.railway.app';
const id=process.env.GITHUB_RUN_ID||String(Date.now());
const read=async(response)=>{
 const text=await response.text();
 try{return JSON.parse(text)}catch{return {raw:text.slice(0,120)}}
};
function expect(condition,message){if(!condition)throw new Error(message)}
function dateAfter(days){const d=new Date();d.setUTCDate(d.getUTCDate()+days);return d.toISOString().slice(0,10)}
async function main(){
 const root=await fetch(base+'/');expect(root.status===200,'Website not accessible: '+root.status);
 expect((await root.text()).includes('NOMAD'),'Missing NOMAD site marker');
 const avail=await fetch(base+'/api/demo');const availability=await read(avail);expect(avail.status===200&&Array.isArray(availability.bookings),'Database-backed availability did not return bookings');
 const staff=await fetch(base+'/api/staff');expect(staff.status===401,'Staff unauthenticated endpoint returned '+staff.status);
 const guest=await fetch(base+'/api/guest');expect(guest.status===401,'Guest unauthenticated endpoint returned '+guest.status);
 const roleBypass=await fetch(base+'/api/demo?staff=1');expect(roleBypass.status===403,'Legacy staff endpoint is open');
 const reserved=availability.bookings.filter(b=>b.house==='03');
 let checkIn='',checkOut='';
 for(let i=0;i<400;i++){
  const candidate=dateAfter(450+i);
  if(!reserved.some(b=>b.start<=candidate&&candidate<b.end)){
   checkIn=candidate;checkOut=dateAfter(451+i);break;
  }
 }
 expect(Boolean(checkIn),'Cannot find a test slot; clear staging test records');
 const contact='smoke'+id+'@example.test';
 const payload={action:'book',guestName:'Synthetic Test',contact,house:'03',start:checkIn,end:checkOut,guests:2};
 const book=await fetch(base+'/api/demo',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(payload)});
 const created=await read(book);
 expect(book.status===201&&created.nights===1&&created.total===45000,'Booking failed '+book.status+' '+JSON.stringify(created));
 const session=(book.headers.get('set-cookie')||'').split(';')[0];
 expect(session.startsWith('nomad_guest='),'Booking did not return guest session cookie');
 const my=await fetch(base+'/api/guest',{headers:{Cookie:session}});const myProfile=await read(my);
 expect(my.status===200&&myProfile.authenticated&&myProfile.bookings.some(b=>b.id===created.booking.id),'Guest account is not automatically available');
 const dupe=await fetch(base+'/api/demo',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(payload)});
 expect(dupe.status===409,'Double booking was not prevented '+dupe.status);
 const start=await fetch(base+'/api/guest',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({action:'start',contact})});
 const issued=await read(start);expect(start.status===200&&/^\d{6}$/.test(issued.demoCode),'Demo one-time code not issued');
 const verify=await fetch(base+'/api/guest',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({action:'verify',contact,code:issued.demoCode})});
 const verified=await read(verify);expect(verify.status===200&&verified.ok,'Guest code verification failed');
 const anotherSession=(verify.headers.get('set-cookie')||'').split(';')[0];
 const second=await fetch(base+'/api/guest',{headers:{Cookie:anotherSession}});const visits=await read(second);
 expect(second.status===200&&visits.bookings.some(b=>b.id===created.booking.id),'Re-login cannot read existing booking');
 console.log('PASS website + PostgreSQL + no-double-booking + auto-guest + passwordless login + protected staff');
 console.log('Synthetic booking ID: '+created.booking.id+' for '+checkIn+' to '+checkOut);
}
main().catch(e=>{console.error(e);process.exitCode=1});
