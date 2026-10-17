import { NextRequest, NextResponse } from 'next/server';
import { Pool } from 'pg';
import { COOKIE, DEMO_MODE, constantEqual, createSession, guestIdFromCookie, initGuests, noStore, normalizeContact, otpHash, testCode, withGuestCookie, sha } from '@/lib/guest';

export const runtime='nodejs';
export const dynamic='force-dynamic';
let pool:Pool|undefined;
let initialized:Promise<void>|undefined;
const db=()=>pool||(pool=new Pool({connectionString:process.env.DATABASE_URL,max:4,connectionTimeoutMillis:5000}));
const ready=async()=>{
  if(!initialized)initialized=initGuests(db());
  try{await initialized}catch(e){initialized=undefined;throw e}
};

export async function GET(req:NextRequest) {
  try{
    if(!DEMO_MODE)return noStore({error:'Demo mode disabled'},403);
    await ready();
    const guestId=await guestIdFromCookie(req,db());
    if(!guestId)return noStore({authenticated:false,bookings:[]},401);
    const result=await db().query("SELECT g.display_name,b.id::text,b.house,to_char(b.start_date,'YYYY-MM-DD') AS start_date,to_char(b.end_date,'YYYY-MM-DD') AS end_date,b.guests,b.status,b.cleaned FROM demo_guests g LEFT JOIN demo_bookings b ON b.guest_id=g.id WHERE g.id=$1 ORDER BY b.start_date DESC NULLS LAST",[guestId]);
    if(!result.rowCount)return noStore({authenticated:false,bookings:[]},401);
    return noStore({authenticated:true,name:result.rows[0].display_name,bookings:result.rows.filter(r=>r.id).map(r=>({id:r.id,house:r.house,start:r.start_date,end:r.end_date,guests:r.guests,status:r.status,cleaned:r.cleaned}))});
  }catch{return noStore({error:'Guest dashboard temporarily unavailable'},503)}
}
export async function POST(req:NextRequest){
  try{
    if(!DEMO_MODE)return noStore({error:'Demo mode disabled'},403);
    if(Number(req.headers.get('content-length')||0)>2048)return noStore({error:'Request too large'},413);
    const body=await req.json();await ready();
    if(body.action==='logout'){
      const token=req.cookies.get(COOKIE)?.value;
      if(token)await db().query("DELETE FROM demo_guest_sessions WHERE token_hash=$1",[sha(token)]);
      const response=noStore({ok:true});response.cookies.set(COOKIE,'',{maxAge:0,path:'/',httpOnly:true,sameSite:'lax',secure:process.env.NODE_ENV==='production'});return response;
    }
    const contact=normalizeContact(body.contact);
    if(!contact)return noStore({error:'Use a fictional email @example.test or reserved demo phone +120255501xx'},400);
    if(body.action==='start'){
      const check=await db().query("SELECT generated_at FROM demo_login_codes WHERE contact=$1",[contact]);
      if(check.rowCount&&Date.now()-new Date(check.rows[0].generated_at).getTime()<30000)return noStore({error:'Wait 30 seconds before requesting another code'},429);
      const code=testCode();
      await db().query("INSERT INTO demo_login_codes(contact,code_hash,expires_at,attempts,generated_at) VALUES($1,$2,now()+interval '10 minutes',0,now()) ON CONFLICT(contact) DO UPDATE SET code_hash=EXCLUDED.code_hash, expires_at=EXCLUDED.expires_at, attempts=0,generated_at=now()",[contact,otpHash(contact,code)]);
      // DEMO-ONLY: shown in test UI instead of sending email/SMS.
      // DO NOT deploy real guest data with NOMAD_TEST_MODE enabled.
      return noStore({ok:true,demoCode:code,expiresInSeconds:600});
    }
    if(body.action==='verify'){
      if(!/^\d{6}$/.test(body.code||''))return noStore({error:'Enter a six-digit code'},400);
      const client=await db().connect();
      try{
        await client.query('BEGIN');
        const code=await client.query("SELECT code_hash,expires_at,attempts FROM demo_login_codes WHERE contact=$1 FOR UPDATE",[contact]);
        if(!code.rowCount||Date.now()>new Date(code.rows[0].expires_at).getTime()||code.rows[0].attempts>=5){
          await client.query('ROLLBACK');return noStore({error:'Code expired; request a new one'},401);
        }
        if(!constantEqual(code.rows[0].code_hash,otpHash(contact,body.code))){
          await client.query("UPDATE demo_login_codes SET attempts=attempts+1 WHERE contact=$1",[contact]);
          await client.query('COMMIT');return noStore({error:'Incorrect code'},401);
        }
        await client.query("DELETE FROM demo_login_codes WHERE contact=$1",[contact]);
        const guest=await client.query("SELECT id::text,display_name FROM demo_guests WHERE contact=$1",[contact]);
        if(!guest.rowCount){await client.query('COMMIT');return noStore({error:'No trips found for this demo contact'},404)}
        const session=await createSession(client,guest.rows[0].id);
        await client.query('COMMIT');
        return withGuestCookie(noStore({ok:true,name:guest.rows[0].display_name}),session);
      }catch(e){await client.query('ROLLBACK').catch(()=>{});throw e}finally{client.release()}
    }
    return noStore({error:'Invalid action'},400);
  }catch{return noStore({error:'Guest login temporarily unavailable'},503)}
}