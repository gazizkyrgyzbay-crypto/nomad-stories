import { NextRequest, NextResponse } from 'next/server';
import { createHash, randomBytes, randomInt, timingSafeEqual } from 'node:crypto';
import { Pool, PoolClient } from 'pg';

export const COOKIE='nomad_guest';
export const DEMO_MODE=process.env.NOMAD_TEST_MODE==='true';
export const SESSION_SECONDS=30*24*3600;
export const sha=(value:string)=>createHash('sha256').update(value).digest('hex');
export function normalizeContact(input:unknown):string|null {
  if(typeof input!=='string')return null;
  const s=input.trim().toLowerCase().replace(/[\s()-]/g,'');
  // Strictly invented demo identities only; NEVER real guest data on foreign-hosted staging.
  return (/^[a-z0-9][a-z0-9.+_-]{0,50}@example\.test$/.test(s)||/^\+120255501[0-9]{2}$/.test(s))?s:null;
}
export function normalizeName(input:unknown):string|null {
  if(typeof input!=='string')return null;
  const s=input.trim().replace(/\s+/g,' ');
  return s.length>=2&&s.length<=80&&!/[<>{}]/.test(s)?s:null;
}
export async function initGuests(pool:Pool) {
  await pool.query("CREATE TABLE IF NOT EXISTS demo_bookings (id uuid PRIMARY KEY DEFAULT gen_random_uuid(), house varchar(2) NOT NULL CHECK (house IN ('01','02','03')), start_date date NOT NULL, end_date date NOT NULL, guests int NOT NULL CHECK (guests BETWEEN 1 AND 4), status text NOT NULL DEFAULT 'confirmed' CHECK (status IN ('confirmed','checked_out')), cleaned boolean NOT NULL DEFAULT false, created_at timestamptz NOT NULL DEFAULT now(), CHECK (end_date > start_date))");
  await pool.query("CREATE TABLE IF NOT EXISTS demo_guests (id uuid PRIMARY KEY DEFAULT gen_random_uuid(), display_name text NOT NULL, contact text NOT NULL UNIQUE, created_at timestamptz NOT NULL DEFAULT now())");
  await pool.query("CREATE TABLE IF NOT EXISTS demo_guest_sessions (token_hash text PRIMARY KEY, guest_id uuid NOT NULL REFERENCES demo_guests(id) ON DELETE CASCADE, expires_at timestamptz NOT NULL)");
  await pool.query("CREATE TABLE IF NOT EXISTS demo_login_codes (contact text PRIMARY KEY, code_hash text NOT NULL, expires_at timestamptz NOT NULL, attempts integer NOT NULL DEFAULT 0, generated_at timestamptz NOT NULL DEFAULT now())");
  await pool.query("ALTER TABLE demo_bookings ADD COLUMN IF NOT EXISTS guest_id uuid REFERENCES demo_guests(id)");
}
export async function createSession(client:Pool|PoolClient,guestId:string){
  const token=randomBytes(32).toString('base64url');
  await client.query("INSERT INTO demo_guest_sessions(token_hash,guest_id,expires_at) VALUES($1,$2,now()+interval '30 days')",[sha(token),guestId]);
  return token;
}
export function withGuestCookie(response:NextResponse,token:string){
  response.cookies.set(COOKIE,token,{httpOnly:true,secure:process.env.NODE_ENV==='production',sameSite:'lax',path:'/',maxAge:SESSION_SECONDS});
  return response;
}
export async function guestIdFromCookie(req:NextRequest,pool:Pool):Promise<string|null>{
  const token=req.cookies.get(COOKIE)?.value;
  if(!token||token.length>128)return null;
  const r=await pool.query("SELECT guest_id::text FROM demo_guest_sessions WHERE token_hash=$1 AND expires_at>now()",[sha(token)]);
  return r.rows[0]?.guest_id||null;
}
export function otpHash(contact:string,code:string){
  const secret=process.env.GUEST_OTP_SECRET;
  if(!secret||secret.length<30)throw Error('GUEST_OTP_SECRET not configured');
  return sha(contact+':'+code+':'+secret);
}
export function constantEqual(a:string,b:string){
  const A=Buffer.from(a),B=Buffer.from(b);
  return A.length===B.length&&timingSafeEqual(A,B);
}
export function testCode(){return String(randomInt(0,1000000)).padStart(6,'0')}
export function noStore(data:unknown,status=200){return NextResponse.json(data,{status,headers:{'Cache-Control':'no-store'}})}
