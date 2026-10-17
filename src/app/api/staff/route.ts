import {NextRequest, NextResponse} from 'next/server';
import {Pool} from 'pg';
import {randomBytes,scryptSync,timingSafeEqual,createHash} from 'node:crypto';
import {initGuests,DEMO_MODE,noStore} from '@/lib/guest';

export const runtime='nodejs';
export const dynamic='force-dynamic';
const cookie='nomad_staff';
type Role='owner'|'manager'|'reception'|'housekeeping';
const roles:Role[]=['owner','manager','reception','housekeeping'];
let pool:Pool|undefined,ready:Promise<void>|undefined;
const db=()=>pool||(pool=new Pool({connectionString:process.env.DATABASE_URL,max:4,connectionTimeoutMillis:5000}));
async function init(){
 if(!ready)ready=(async()=>{
  await initGuests(db());
  await db().query("CREATE TABLE IF NOT EXISTS demo_staff (id uuid PRIMARY KEY DEFAULT gen_random_uuid(), email text NOT NULL UNIQUE, display_name text NOT NULL, role text NOT NULL CHECK(role IN ('owner','manager','reception','housekeeping')), password_hash text NOT NULL, failed_attempts int NOT NULL DEFAULT 0, locked_until timestamptz, created_at timestamptz NOT NULL DEFAULT now())");
  await db().query("CREATE TABLE IF NOT EXISTS demo_staff_sessions (token_hash text PRIMARY KEY, staff_id uuid NOT NULL REFERENCES demo_staff(id) ON DELETE CASCADE, expires_at timestamptz NOT NULL)");
  await db().query("CREATE TABLE IF NOT EXISTS demo_staff_audit (id bigserial PRIMARY KEY, staff_id uuid NOT NULL REFERENCES demo_staff(id), action text NOT NULL, record_id text, created_at timestamptz NOT NULL DEFAULT now())");
 })();
 try{await ready}catch(e){ready=undefined;throw e}
}
function hash(v:string){return createHash('sha256').update(v).digest('hex')}
function secureCompare(a:string,b:string){const A=Buffer.from(a),B=Buffer.from(b);return A.length===B.length&&timingSafeEqual(A,B)}
function passwordHash(password:string){const salt=randomBytes(16).toString('hex');return salt+':'+scryptSync(password,salt,64).toString('hex')}
function checkPassword(password:string,salted:string){const [salt,saved]=salted.split(':');if(!/^[0-9a-f]{32}$/.test(salt||'')||!/^[0-9a-f]{128}$/.test(saved||''))return false;return secureCompare(scryptSync(password,salt,64).toString('hex'),saved)}
function staffEmail(s:unknown):s is string{return typeof s==='string'&&/^[a-z0-9][a-z0-9._-]{1,48}@example\.test$/.test(s)}
function safeName(s:unknown):s is string{return typeof s==='string'&&s.trim().length>=2&&s.trim().length<=80&&!/[<>{}]/.test(s)}
function safePass(s:unknown):s is string{return typeof s==='string'&&s.length>=12&&s.length<=128}
function setCookie(response:NextResponse,token:string){response.cookies.set(cookie,token,{httpOnly:true,secure:process.env.NODE_ENV==='production',sameSite:'lax',path:'/',maxAge:7*86400});return response}
async function session(req:NextRequest){
 const token=req.cookies.get(cookie)?.value;
 if(!token||token.length>128)return null;
 const result=await db().query("SELECT s.id::text,s.role,s.display_name,s.email FROM demo_staff_sessions ss JOIN demo_staff s ON s.id=ss.staff_id WHERE ss.token_hash=$1 AND ss.expires_at>now()",[hash(token)]);
 return result.rows[0] as {id:string;role:Role;display_name:string;email:string}|undefined;
}
async function audit(staffId:string,action:string,id:string|null=null){await db().query("INSERT INTO demo_staff_audit(staff_id,action,record_id) VALUES($1,$2,$3)",[staffId,action,id])}
async function signIn(staffId:string,displayName:string,role:string){
 const token=randomBytes(32).toString('base64url');
 await db().query("INSERT INTO demo_staff_sessions(token_hash,staff_id,expires_at) VALUES($1,$2,now()+interval '7 days')",[hash(token),staffId]);
 return setCookie(noStore({ok:true,name:displayName,role}),token);
}
export async function GET(req:NextRequest){
 try{
  if(!DEMO_MODE)return noStore({error:'Test mode disabled'},403);
  await init();
  const actor=await session(req);
  if(!actor)return noStore({authenticated:false,initialized:Boolean((await db().query("SELECT 1 FROM demo_staff WHERE role='owner' LIMIT 1")).rowCount)},401);
  const r=await db().query("SELECT b.id::text,b.house,to_char(b.start_date,'YYYY-MM-DD') AS start_date,to_char(b.end_date,'YYYY-MM-DD') AS end_date,b.guests,b.status,b.cleaned,g.display_name AS guest_name FROM demo_bookings b LEFT JOIN demo_guests g ON g.id=b.guest_id ORDER BY b.start_date DESC LIMIT 1000");
  const bookings=r.rows.map(v=>({id:v.id,house:v.house,start:v.start_date,end:v.end_date,guests:v.guests,status:v.status,cleaned:v.cleaned,guest_name:actor.role==='housekeeping'?null:v.guest_name}));
  const accounts=actor.role==='owner'?(await db().query("SELECT id::text,email,display_name,role,created_at FROM demo_staff ORDER BY created_at ASC")).rows:[];
  return noStore({authenticated:true,staff:{name:actor.display_name,role:actor.role,email:actor.email},bookings,accounts});
 }catch{return noStore({error:'Staff console unavailable'},503)}
}
export async function POST(req:NextRequest){
 try{
  if(!DEMO_MODE)return noStore({error:'Test mode disabled'},403);
  if(Number(req.headers.get('content-length')||0)>4096)return noStore({error:'Request too large'},413);
  const body=await req.json();await init();
  if(body.action==='bootstrap'){
   const master=process.env.STAFF_TEST_CODE;
   if(!master||master.length<20||typeof body.bootstrapCode!=='string'||!secureCompare(body.bootstrapCode,master))return noStore({error:'Invalid setup code'},401);
   if(!safeName(body.name)||!staffEmail(body.email)||!safePass(body.password))return noStore({error:'Use fictional staff @example.test, display name and 12+ character password'},400);
   const conn=await db().connect();
   try{
    await conn.query('BEGIN');
    await conn.query("SELECT pg_advisory_xact_lock(742928)");
    const count=await conn.query("SELECT 1 FROM demo_staff WHERE role='owner' LIMIT 1");
    if(count.rowCount){await conn.query('ROLLBACK');return noStore({error:'Team workspace already initialized'},409)}
    const r=await conn.query("INSERT INTO demo_staff(email,display_name,role,password_hash) VALUES($1,$2,'owner',$3) RETURNING id::text",[body.email,body.name.trim(),passwordHash(body.password)]);
    await conn.query('COMMIT');
    return await signIn(r.rows[0].id,body.name.trim(),'owner');
   }catch(e){await conn.query('ROLLBACK').catch(()=>{});throw e}finally{conn.release()}
  }
  if(body.action==='login'){
   const email=typeof body.email==='string'?body.email.trim().toLowerCase():'';
   if(!staffEmail(email)||typeof body.password!=='string'||body.password.length>128)return noStore({error:'Incorrect staff email or password'},401);
   const r=await db().query("SELECT id::text,display_name,role,password_hash,failed_attempts,locked_until FROM demo_staff WHERE email=$1",[email]);
   const staff=r.rows[0];
   if(!staff||staff.locked_until&&Date.now()<new Date(staff.locked_until).getTime())return noStore({error:'Incorrect credentials or account temporarily locked'},401);
   if(!checkPassword(body.password,staff.password_hash)){
    await db().query("UPDATE demo_staff SET failed_attempts=failed_attempts+1,locked_until=CASE WHEN failed_attempts>=4 THEN now()+interval '15 minutes' ELSE locked_until END WHERE id=$1",[staff.id]);
    return noStore({error:'Incorrect credentials or account temporarily locked'},401);
   }
   await db().query("UPDATE demo_staff SET failed_attempts=0,locked_until=NULL WHERE id=$1",[staff.id]);
   await audit(staff.id,'login');
   return signIn(staff.id,staff.display_name,staff.role);
  }
  const actor=await session(req);
  if(body.action==='logout'){
   const token=req.cookies.get(cookie)?.value;
   if(token)await db().query("DELETE FROM demo_staff_sessions WHERE token_hash=$1",[hash(token)]);
   const response=noStore({ok:true});response.cookies.set(cookie,'',{maxAge:0,httpOnly:true,sameSite:'lax',secure:process.env.NODE_ENV==='production',path:'/'});return response;
  }
  if(!actor)return noStore({error:'Staff session required'},401);
  if(body.action==='create'){
   if(actor.role!=='owner')return noStore({error:'Owner role required'},403);
   const email=typeof body.email==='string'?body.email.trim().toLowerCase():'';
   if(!safeName(body.name)||!staffEmail(email)||!safePass(body.password)||!roles.includes(body.role)||body.role==='owner')
    return noStore({error:'Use fictional @example.test email, 12+ character password, and valid role'},400);
   const r=await db().query("INSERT INTO demo_staff(email,display_name,role,password_hash) VALUES($1,$2,$3,$4) ON CONFLICT(email) DO NOTHING RETURNING id::text",[email,body.name.trim(),body.role,passwordHash(body.password)]);
   if(!r.rowCount)return noStore({error:'Staff account already exists'},409);
   await audit(actor.id,'staff.create',r.rows[0].id);
   return noStore({ok:true},201);
  }
  if(body.action==='update'){
   if(typeof body.id!=='string'||!/^[0-9a-f-]{36}$/.test(body.id))return noStore({error:'Invalid booking'},400);
   if(!['checkout','clean'].includes(body.operation))return noStore({error:'Invalid operation'},400);
   if(body.operation==='checkout'&&!['owner','manager','reception'].includes(actor.role))return noStore({error:'Not permitted'},403);
   const q=body.operation==='checkout'
    ?"UPDATE demo_bookings SET status='checked_out' WHERE id=$1 AND status='confirmed' RETURNING id"
    :"UPDATE demo_bookings SET cleaned=true WHERE id=$1 AND status='checked_out' RETURNING id";
   const r=await db().query(q,[body.id]);
   if(!r.rowCount)return noStore({error:'Booking already updated or not found'},409);
   await audit(actor.id,'booking.'+body.operation,body.id);
   return noStore({ok:true});
  }
  return noStore({error:'Unknown action'},400);
 }catch{return noStore({error:'Staff request unavailable'},503)}
}
