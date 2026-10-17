import { NextRequest, NextResponse } from 'next/server';
import { Pool } from 'pg';
import { createHash, timingSafeEqual } from 'node:crypto';
import { nightsBetween } from '@/lib/dates';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

type BookingRow = { id:string; house:string; start:string; end:string; guests:number; status:string; cleaned:boolean };
const url = process.env.DATABASE_URL;
let pool: Pool | undefined;
let ready: Promise<void> | undefined;
function db(): Pool {
  if (!url) throw new Error('DATABASE_URL is missing');
  if (!pool) pool = new Pool({ connectionString:url, max:5, idleTimeoutMillis:10000, connectionTimeoutMillis:5000 });
  return pool;
}
async function init(){
  if (!ready) ready = db().query("CREATE TABLE IF NOT EXISTS demo_bookings (id uuid PRIMARY KEY DEFAULT gen_random_uuid(), house varchar(2) NOT NULL CHECK (house IN ('01','02','03')), start_date date NOT NULL, end_date date NOT NULL, guests int NOT NULL CHECK (guests BETWEEN 1 AND 4), status text NOT NULL DEFAULT 'confirmed' CHECK (status IN ('confirmed','checked_out')), cleaned boolean NOT NULL DEFAULT false, created_at timestamptz NOT NULL DEFAULT now(), CHECK (end_date > start_date))").then(()=>{});
  try { await ready; } catch(e) { ready=undefined; throw e; }
}
function validDate(s:unknown):s is string{
  if(typeof s!=='string'||!/^\d{4}-\d{2}-\d{2}$/.test(s))return false;
  const d=new Date(s+'T00:00:00.000Z');
  return !Number.isNaN(d.getTime()) && d.toISOString().slice(0,10)===s;
}
function allowed(req:NextRequest) {
  const code=process.env.STAFF_TEST_CODE;
  const sent=req.headers.get('authorization')?.replace(/^Bearer /i,'')||'';
  if(!code||code.length<20||!sent)return false;
  return timingSafeEqual(createHash('sha256').update(code).digest(),createHash('sha256').update(sent).digest());
}
function mapRow(r:any):BookingRow { return {id:r.id,house:r.house,start:r.start_date,end:r.end_date,guests:r.guests,status:r.status,cleaned:r.cleaned} }
function fail(message:string,status=400){return NextResponse.json({error:message},{status,headers:{'Cache-Control':'no-store'}})}
export async function GET(req:NextRequest){
  try{
    await init();
    const staff=req.nextUrl.searchParams.get('staff')==='1';
    if(staff&&!allowed(req))return fail('Staff access required',401);
    const r=await db().query("SELECT id::text, house, to_char(start_date,'YYYY-MM-DD') AS start_date, to_char(end_date,'YYYY-MM-DD') AS end_date, guests, status, cleaned FROM demo_bookings ORDER BY start_date ASC LIMIT 1000");
    const list=r.rows.map(mapRow);
    return NextResponse.json(staff?{bookings:list}:{bookings:list.map(x=>({house:x.house,start:x.start,end:x.end}))},{headers:{'Cache-Control':'no-store'}});
  }catch{ return fail('Database temporarily unavailable',503); }
}
const requests=new Map<string,{count:number,until:number}>();
export async function POST(req:NextRequest){
  try{
    if(Number(req.headers.get('content-length')||0)>2048)return fail('Request too large',413);
    const input=await req.json();
    if(input?.action==='staff-login'){
      return allowed(req)?NextResponse.json({ok:true}):fail('Wrong staff code',401);
    }
    if(input?.action==='staff-update'){
      if(!allowed(req))return fail('Staff access required',401);
      if(typeof input.id!=='string'||!/^[0-9a-f-]{36}$/.test(input.id))return fail('Invalid booking ID');
      if(!['checkout','clean'].includes(input.operation))return fail('Invalid operation');
      await init();
      const q=input.operation==='checkout'
        ?"UPDATE demo_bookings SET status='checked_out' WHERE id=$1 AND status='confirmed' RETURNING id"
        :"UPDATE demo_bookings SET cleaned=true WHERE id=$1 AND status='checked_out' RETURNING id";
      const result=await db().query(q,[input.id]);
      if(!result.rowCount)return fail('Booking not found or already updated',409);
      return NextResponse.json({ok:true});
    }
    if(input?.action!=='book')return fail('Invalid action');
    const house=input.house, start=input.start, end=input.end, guests=input.guests;
    if(!['01','02','03'].includes(house)||!validDate(start)||!validDate(end)||
       !Number.isInteger(guests)||guests<1||guests>4)return fail('Invalid booking input');
    const nights=nightsBetween(start,end);
    const today=new Date().toISOString().slice(0,10);
    if(start<today||nights<1||nights>60)return fail('Invalid date range');
    const key=req.headers.get('x-real-ip')||'shared', now=Date.now(), previous=requests.get(key);
    const current=previous&&now<previous.until?previous:{count:0,until:now+3600000};
    if(current.count>=20)return fail('Too many test bookings; try later',429);
    current.count++;requests.set(key,current);
    if(requests.size>3000)requests.clear();
    await init();
    const conn=await db().connect();
    try{
      await conn.query('BEGIN');
      await conn.query('SELECT pg_advisory_xact_lock(hashtext($1))',[house]);
      const collision=await conn.query("SELECT id FROM demo_bookings WHERE house=$1 AND start_date < $3::date AND end_date > $2::date LIMIT 1",[house,start,end]);
      if(collision.rowCount){await conn.query('ROLLBACK');return fail('These dates are no longer available',409);}
      const result=await conn.query("INSERT INTO demo_bookings(house,start_date,end_date,guests) VALUES ($1,$2,$3,$4) RETURNING id::text",[house,start,end,guests]);
      await conn.query('COMMIT');
      return NextResponse.json({booking:{id:result.rows[0].id,house,start,end,guests,status:'confirmed'},nights,total:nights*45000},{status:201});
    }catch(e){await conn.query('ROLLBACK').catch(()=>{});throw e;}finally{conn.release();}
  }catch{ return fail('Could not complete test request',503); }
}
