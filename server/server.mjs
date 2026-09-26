import express from 'express';
import fs from 'node:fs/promises';
import path from 'node:path';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const DATA_DIR = process.env.DATA_DIR || path.join(ROOT, 'data');
const DB_FILE = path.join(DATA_DIR, 'database.json');
const PORT = Number(process.env.PORT || 3000);
const COOKIE = 'nd_session';
const SESSION_DAYS = 30;
const LOGO = 'https://sf-static.upanhlaylink.com/img/image_20260926c9cbd15da7c975fc5c974713e836510c.jpg';
const DEFAULT_CONFIG = {
  logo: LOGO, brandName: 'Nguyễn Đức', profileName: 'Nguyễn Đức', profileRole: 'Quản trị viên & Developer',
  profileDesc: 'Website cộng đồng • Sensi Pro • Phòng chat • Tin tức • Hỗ trợ 24/7',
  stats: { products: '150+', docs: '500+', followers: '10K+' },
  contacts: { zalo1:'https://zalo.me/0923375670', zalo2:'https://zalo.me/0394925338', email:'mailto:chuoipc1129@gmail.com', tiktok:'https://www.tiktok.com/@Oishiicuti' },
  maintenance: { enabled: false }
};
const DEFAULT_ADMIN = {
  username: process.env.ADMIN_USERNAME || 'ducadmin',
  email: process.env.ADMIN_EMAIL || 'admin@nguyenduc.local',
  password: process.env.ADMIN_PASSWORD || 'nguyenduc',
  fullname: 'Nguyễn Đức'
};

const app = express();
app.disable('x-powered-by');
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: false }));
app.use((req,res,next)=>{ res.setHeader('Cache-Control','no-store'); next(); });

let db;
let writeQueue = Promise.resolve();
const now = () => new Date().toISOString();
const id = () => `${Date.now()}_${crypto.randomBytes(5).toString('hex')}`;
const cleanUser = u => { if (!u) return null; const { passwordHash, ...safe } = u; return safe; };
function hashPassword(password) { const salt=crypto.randomBytes(16).toString('hex'); return `${salt}:${crypto.scryptSync(String(password),salt,64).toString('hex')}`; }
function checkPassword(password, encoded) { try { const [salt,hex]=String(encoded).split(':'); const a=Buffer.from(hex,'hex'); const b=crypto.scryptSync(String(password),salt,64); return a.length===b.length && crypto.timingSafeEqual(a,b); } catch { return false; } }
function token() { return crypto.randomBytes(32).toString('hex'); }
function setCookie(res,value,maxAge=60*60*24*SESSION_DAYS) { res.cookie(COOKIE,value,{httpOnly:true,secure:process.env.NODE_ENV==='production',sameSite:'lax',path:'/',maxAge:maxAge*1000}); }
function getToken(req) { const raw=req.headers.cookie||''; const found=raw.split(';').map(x=>x.trim()).find(x=>x.startsWith(COOKIE+'=')); return found ? decodeURIComponent(found.slice(COOKIE.length+1)) : null; }
async function save(){ const snapshot=JSON.stringify(db,null,2); writeQueue=writeQueue.then(async()=>{await fs.mkdir(DATA_DIR,{recursive:true}); const tmp=DB_FILE+'.tmp'; await fs.writeFile(tmp,snapshot,'utf8'); await fs.rename(tmp,DB_FILE);}); return writeQueue; }
function fresh(){ return {users:[],sessions:{},announcements:[],chat:[],media:[],visits:[],password_requests:[],config:structuredClone(DEFAULT_CONFIG)}; }
async function load(){
  await fs.mkdir(DATA_DIR,{recursive:true});
  try { db=JSON.parse(await fs.readFile(DB_FILE,'utf8')); }
  catch { db=fresh(); }
  db={...fresh(),...db};
  db.config={...DEFAULT_CONFIG,...(db.config||{}),stats:{...DEFAULT_CONFIG.stats,...(db.config?.stats||{})},contacts:{...DEFAULT_CONFIG.contacts,...(db.config?.contacts||{})},maintenance:{...DEFAULT_CONFIG.maintenance,...(db.config?.maintenance||{})}};
  if(!Array.isArray(db.users)||!db.users.length){
    db.users=[{id:'1',username:DEFAULT_ADMIN.username,email:DEFAULT_ADMIN.email,fullname:DEFAULT_ADMIN.fullname,role:'admin',createdAt:'2026-01-01T00:00:00.000Z',views:0,chats:0,passwordHash:hashPassword(DEFAULT_ADMIN.password)}];
    await save();
  }
}
function currentUser(req){ const t=getToken(req); if(!t) return null; const s=db.sessions[t]; if(!s) return null; if(new Date(s.expiresAt).getTime()<Date.now()){delete db.sessions[t]; void save(); return null;} return db.users.find(u=>String(u.id)===String(s.userId))||null; }
const allowed=(u,roles)=>!!u&&roles.includes(u.role);
const ok=(res,data={})=>res.status(200).json(data);
const fail=(res,message,status=400)=>res.status(status).json({success:false,message});
function state(req,res){ const me=currentUser(req); const users=db.users; return ok(res,{success:true,user:cleanUser(me),config:db.config,announcements:db.announcements,chat:db.chat.slice(-100),media:db.media,users:me?.role==='admin'?users.map(cleanUser):undefined,leaderboard:{views:[...users].sort((a,b)=>(b.views||0)-(a.views||0)).slice(0,20).map(cleanUser),chat:[...users].sort((a,b)=>(b.chats||0)-(a.chats||0)).slice(0,20).map(cleanUser)}}); }

app.get('/api/health',(req,res)=>ok(res,{success:true,service:'api',storage:'local-persistent-json',configured:true}));
app.get('/api/state',state);
app.post('/api/register',async(req,res)=>{const username=String(req.body.username||'').trim(),email=String(req.body.email||'').trim().toLowerCase(),password=String(req.body.password||''),fullname=String(req.body.fullname||username).trim();if(username.length<3)return fail(res,'Tên đăng nhập tối thiểu 3 ký tự.');if(password.length<6)return fail(res,'Mật khẩu tối thiểu 6 ký tự.');if(!email)return fail(res,'Email không được để trống.');if(db.users.some(u=>u.username.toLowerCase()===username.toLowerCase()))return fail(res,'Tên đăng nhập đã tồn tại!');if(db.users.some(u=>u.email.toLowerCase()===email))return fail(res,'Email đã được sử dụng!');const u={id:id(),username,email,fullname:fullname||username,role:'user',createdAt:now(),views:0,chats:0,passwordHash:hashPassword(password)};db.users.push(u);await save();return ok(res,{success:true,user:cleanUser(u)});});
app.post('/api/login',async(req,res)=>{const q=String(req.body.username||'').trim().toLowerCase(),password=String(req.body.password||'');const u=db.users.find(x=>x.username.toLowerCase()===q||x.email.toLowerCase()===q);if(!u||!checkPassword(password,u.passwordHash))return fail(res,'Sai tên đăng nhập hoặc mật khẩu!',401);const t=token();db.sessions[t]={userId:u.id,expiresAt:new Date(Date.now()+SESSION_DAYS*86400000).toISOString()};await save();setCookie(res,t);return ok(res,{success:true,user:cleanUser(u)});});
app.post('/api/logout',async(req,res)=>{const t=getToken(req);if(t){delete db.sessions[t];await save();}res.clearCookie(COOKIE,{httpOnly:true,secure:process.env.NODE_ENV==='production',sameSite:'lax',path:'/'});return ok(res,{success:true});});
app.post('/api/visit',async(req,res)=>{const me=currentUser(req);db.visits.push({id:id(),at:now(),userId:me?.id||null,username:me?.username||'Khách'});db.visits=db.visits.slice(-10000);if(me){const u=db.users.find(x=>x.id===me.id);if(u)u.views=(u.views||0)+1;}await save();return ok(res,{success:true});});
app.post('/api/chat',async(req,res)=>{const me=currentUser(req);if(!me)return fail(res,'Bạn cần đăng nhập để chat.',401);const text=String(req.body.message||'').trim();if(!text)return fail(res,'Tin nhắn trống.');if(text.length>500)return fail(res,'Tin nhắn tối đa 500 ký tự.');db.chat.push({id:id(),userId:me.id,username:me.fullname||me.username,message:text,at:now()});db.chat=db.chat.slice(-1000);const u=db.users.find(x=>x.id===me.id);if(u)u.chats=(u.chats||0)+1;await save();return ok(res,{success:true});});
app.post('/api/announcement',async(req,res)=>{const me=currentUser(req);if(!allowed(me,['admin','moderator']))return fail(res,'Bạn không có quyền.',403);db.announcements.unshift({id:id(),title:String(req.body.title||'').trim().slice(0,120),body:String(req.body.body||'').trim().slice(0,5000),image:String(req.body.image||'').trim().slice(0,1000),author:me.fullname||me.username,at:now()});db.announcements=db.announcements.slice(0,100);await save();return ok(res,{success:true});});
app.delete('/api/announcement/:id',async(req,res)=>{const me=currentUser(req);if(!allowed(me,['admin']))return fail(res,'Chỉ Admin mới có quyền xóa thông báo.',403);db.announcements=db.announcements.filter(x=>String(x.id)!==req.params.id);await save();return ok(res,{success:true});});
app.post('/api/media',async(req,res)=>{const me=currentUser(req);if(!allowed(me,['admin','moderator']))return fail(res,'Bạn không có quyền quản lý Media Links.',403);const title=String(req.body.title||'').trim(),version=String(req.body.version||'').trim(),url=String(req.body.url||'').trim(),image=String(req.body.image||'').trim();if(!title||!version||!/^https?:\/\//i.test(url)||(image&&!/^https?:\/\//i.test(image)))return fail(res,'Thông tin Media không hợp lệ.');db.media.unshift({id:id(),title,version,image,url,createdAt:now()});await save();return ok(res,{success:true});});
app.delete('/api/media/:id',async(req,res)=>{const me=currentUser(req);if(!allowed(me,['admin','moderator']))return fail(res,'Bạn không có quyền quản lý Media Links.',403);db.media=db.media.filter(x=>String(x.id)!==req.params.id);await save();return ok(res,{success:true});});
app.patch('/api/config',async(req,res)=>{const me=currentUser(req);if(!allowed(me,['admin']))return fail(res,'Chỉ Admin mới được chỉnh sửa cấu hình.',403);if(req.body.logo!==undefined)db.config.logo=String(req.body.logo).trim()||db.config.logo;if(req.body.contacts)db.config.contacts={...db.config.contacts,...req.body.contacts};await save();return ok(res,{success:true});});
app.patch('/api/admin/maintenance',async(req,res)=>{
  const me=currentUser(req);
  if(!allowed(me,['admin']))return fail(res,'Chỉ Admin mới được bật/tắt chế độ bảo trì.',403);
  db.config.maintenance={...db.config.maintenance,enabled:Boolean(req.body.enabled)};
  await save();
  return ok(res,{success:true,enabled:db.config.maintenance.enabled});
});
app.get('/api/admin/users',(req,res)=>{const me=currentUser(req);if(!allowed(me,['admin']))return fail(res,'Chỉ Admin mới được quản lý người dùng.',403);return ok(res,{success:true,users:db.users.map(cleanUser)});});
app.patch('/api/admin/users/:id',async(req,res)=>{const me=currentUser(req);if(!allowed(me,['admin']))return fail(res,'Chỉ Admin mới được quản lý người dùng.',403);const u=db.users.find(x=>String(x.id)===req.params.id);if(!u)return fail(res,'Không tìm thấy tài khoản.',404);if(u.username===DEFAULT_ADMIN.username&&req.body.role&&req.body.role!=='admin')return fail(res,'Không thể hạ quyền tài khoản Admin gốc.',403);if(req.body.role&&['user','moderator','admin'].includes(req.body.role))u.role=req.body.role;await save();return ok(res,{success:true});});
app.delete('/api/admin/users/:id',async(req,res)=>{const me=currentUser(req);if(!allowed(me,['admin']))return fail(res,'Chỉ Admin mới được quản lý người dùng.',403);const u=db.users.find(x=>String(x.id)===req.params.id);if(!u)return fail(res,'Không tìm thấy tài khoản.',404);if(u.username===DEFAULT_ADMIN.username)return fail(res,'Không thể xóa Admin gốc.',403);db.users=db.users.filter(x=>String(x.id)!==req.params.id);await save();return ok(res,{success:true});});
app.post('/api/password-request',async(req,res)=>{const q=String(req.body.query||'').trim();if(!q)return fail(res,'Vui lòng nhập username hoặc email.');db.password_requests.unshift({id:id(),query:q,at:now(),status:'pending'});db.password_requests=db.password_requests.slice(0,200);await save();return ok(res,{success:true});});
app.get('/api/admin/password-requests',(req,res)=>{const me=currentUser(req);if(!allowed(me,['admin']))return fail(res,'Chỉ Admin mới có quyền xem yêu cầu.',403);return ok(res,{success:true,requests:db.password_requests});});
app.post('/api/admin/password-reset',async(req,res)=>{const me=currentUser(req);if(!allowed(me,['admin']))return fail(res,'Chỉ Admin mới được đặt lại mật khẩu.',403);const rid=String(req.body.id||''),pw=String(req.body.password||'');if(pw.length<8)return fail(res,'Mật khẩu mới phải có ít nhất 8 ký tự.');const request=db.password_requests.find(x=>String(x.id)===rid);if(!request)return fail(res,'Không tìm thấy yêu cầu.');const q=request.query.toLowerCase();const u=db.users.find(x=>x.username.toLowerCase()===q||x.email.toLowerCase()===q);if(!u)return fail(res,'Không tìm thấy tài khoản khớp username/email.');u.passwordHash=hashPassword(pw);request.status='resolved';request.resolvedAt=now();await save();return ok(res,{success:true});});
app.post('/api/admin/password-request-resolve',async(req,res)=>{const me=currentUser(req);if(!allowed(me,['admin']))return fail(res,'Chỉ Admin mới được xử lý yêu cầu.',403);const request=db.password_requests.find(x=>String(x.id)===String(req.body.id||''));if(request){request.status='resolved';request.resolvedAt=now();await save();}return ok(res,{success:true});});
app.get('/api/admin/stats',(req,res)=>{const me=currentUser(req);if(!allowed(me,['admin','moderator']))return fail(res,'Bạn không có quyền.',403);return ok(res,{success:true,users:db.users.length,visits:db.visits.length,chat:db.chat.length,announcements:db.announcements.length});});

app.use(express.static(ROOT,{extensions:['html']}));
app.get('/{*splat}',(req,res)=>{ if(req.path.startsWith('/api/')) return fail(res,'Không tìm thấy API.',404); res.sendFile(path.join(ROOT,'index.html')); });

await load();
app.listen(PORT,()=>console.log(`Nguyen Duc Web running at http://localhost:${PORT}`));
