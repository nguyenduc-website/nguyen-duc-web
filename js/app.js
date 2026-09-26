/* NGUYỄN ĐỨC WEB APP - đồng bộ server-side bằng Netlify Blobs. */
const DEFAULT_CONFIG={logo:'https://sf-static.upanhlaylink.com/img/image_20260926c9cbd15da7c975fc5c974713e836510c.jpg',brandName:'Nguyễn Đức',profileName:'Nguyễn Đức',profileRole:'Quản trị viên & Developer',profileDesc:'Website cộng đồng • Sensi Pro • Phòng chat • Tin tức • Hỗ trợ 24/7',stats:{products:'150+',docs:'500+',followers:'10K+'},contacts:{zalo1:'https://zalo.me/0923375670',zalo2:'https://zalo.me/0394925338',email:'mailto:chuoipc1129@gmail.com',tiktok:'https://www.tiktok.com/@Oishiicuti'}};
let APP={user:null,config:DEFAULT_CONFIG,users:[],announcements:[],chat:[],media:[],leaderboard:{views:[],chat:[]}};
async function api(path,options={}){
  const res=await fetch('/api'+path,{credentials:'include',headers:{'content-type':'application/json',...(options.headers||{})},...options});
  const type=res.headers.get('content-type')||'';
  let data={};
  if(type.includes('application/json')){try{data=await res.json()}catch{data={}}}
  else {try{const text=await res.text(); data={message:text.slice(0,180)}}catch{data={}}}
  if(!res.ok) throw new Error(data.message||`Yêu cầu thất bại (HTTP ${res.status}).`);
  return data;
}
async function syncState(){const s=await api('/state');APP={...APP,...s,config:{...DEFAULT_CONFIG,...(s.config||{}),maintenance:{...DEFAULT_CONFIG.maintenance,...(s.config?.maintenance||{})}}};applyMaintenance(APP);return APP}
function read(k,f){return f} function write(k,v){return v}
function getUsers(){return APP.users||[]} function saveUsers(v){APP.users=v}
function getConfig(){return APP.config||DEFAULT_CONFIG} function saveConfig(v){APP.config=v}
function getCurrentUser(){return APP.user||null} function setCurrentUser(v){APP.user=v}
async function login(username,password){try{const r=await api('/login',{method:'POST',body:JSON.stringify({username,password})});APP.user=r.user;await syncState();return{success:true,user:r.user}}catch(e){return{success:false,message:e.message}}}
async function register(username,email,password,fullname){try{const r=await api('/register',{method:'POST',body:JSON.stringify({username,email,password,fullname})});return{success:true,user:r.user}}catch(e){return{success:false,message:e.message}}}
async function logout(){try{await api('/logout',{method:'POST',body:'{}'})}catch{}APP.user=null;location.href=location.pathname.includes('/admin/')||location.pathname.includes('/auth/')?'../index.html':'index.html'}
function canManage(){const u=getCurrentUser();return !!u&&(u.role==='admin'||u.role==='moderator')} function isAdmin(){return getCurrentUser()?.role==='admin'}
function escapeHTML(s){return String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[c]))}
async function recordVisit(){try{await api('/visit',{method:'POST',body:'{}'});await syncState()}catch{}}
function getChat(){return APP.chat||[]} async function sendChat(message){try{await api('/chat',{method:'POST',body:JSON.stringify({message})});await syncState();return{ok:true}}catch(e){return{ok:false,msg:e.message}}}
function getAnnouncements(){return APP.announcements||[]} async function addAnnouncement(title,body,image){try{await api('/announcement',{method:'POST',body:JSON.stringify({title,body,image})});await syncState();return true}catch(e){alert(e.message);return false}}
async function deleteAnnouncement(id){try{await api('/announcement/'+encodeURIComponent(id),{method:'DELETE'});await syncState();return true}catch(e){alert(e.message);return false}}
function getLeaderboard(type){return APP.leaderboard?.[type]||[]}

const MAINTENANCE_TEXT = {
  title: 'SYSTEM MAINTENANCE NOTICE',
  intro: 'Website NGUYỄN ĐỨC hiện đang trong quá trình bảo trì và nâng cấp hệ thống nhằm tối ưu hiệu suất, tăng cường độ ổn định và nâng cao trải nghiệm sử dụng.',
  statusTitle: 'SYSTEM STATUS',
  status: ['System: Maintenance','Access: Temporarily Unavailable','Services: Temporarily Suspended'],
  body: 'Trong thời gian bảo trì, website và một số dịch vụ liên quan có thể tạm thời không khả dụng.',
  team: 'Đội ngũ kỹ thuật đang tiến hành kiểm tra, tối ưu và hoàn thiện hệ thống. Toàn bộ dịch vụ sẽ được khôi phục ngay sau khi quá trình bảo trì hoàn tất.',
  supportTitle: 'SUPPORT CHANNEL',
  support: ['Zalo: 0923375670','Facebook: https://www.facebook.com/share/19WtRmjWoy/','TikTok: @Oishiicuti'],
  supportNote: 'Vui lòng chỉ sử dụng các kênh hỗ trợ được công bố chính thức để đảm bảo an toàn thông tin và tránh các nguồn liên hệ giả mạo.',
  updateTitle: 'SYSTEM UPDATE',
  update: ['Building a faster.','More stable.','More secure experience.'],
  thanks: 'Cảm ơn bạn đã tin tưởng và kiên nhẫn trong thời gian hệ thống được nâng cấp.',
  sign: '— NGUYỄN ĐỨC'
};
function removeMaintenanceOverlay(){
  document.getElementById('maintenanceOverlay')?.remove();
  document.body.classList.remove('maintenance-active');
}
function showMaintenanceOverlay(){
  if(document.getElementById('maintenanceOverlay')) return;
  const wrap=document.createElement('div');
  wrap.id='maintenanceOverlay';
  wrap.className='maintenance-overlay';
  wrap.innerHTML=`<div class="maintenance-card">
    <div class="maintenance-icon">⚙</div>
    <h1>${MAINTENANCE_TEXT.title}</h1>
    <p class="maintenance-intro">${MAINTENANCE_TEXT.intro}</p>
    <h2>${MAINTENANCE_TEXT.statusTitle}</h2>
    <div class="maintenance-status">${MAINTENANCE_TEXT.status.map(x=>`<div>● ${escapeHTML(x)}</div>`).join('')}</div>
    <p>${MAINTENANCE_TEXT.body}</p>
    <p>${MAINTENANCE_TEXT.team}</p>
    <h2>${MAINTENANCE_TEXT.supportTitle}</h2>
    <div class="maintenance-support">${MAINTENANCE_TEXT.support.map(x=>`<div>● ${escapeHTML(x)}</div>`).join('')}</div>
    <p class="maintenance-note">${MAINTENANCE_TEXT.supportNote}</p>
    <h2>${MAINTENANCE_TEXT.updateTitle}</h2>
    <div class="maintenance-update">${MAINTENANCE_TEXT.update.map(x=>`<div>${escapeHTML(x)}</div>`).join('')}</div>
    <p>${MAINTENANCE_TEXT.thanks}</p>
    <div class="maintenance-sign">${MAINTENANCE_TEXT.sign}</div>
    <button class="maintenance-reload" type="button" onclick="location.reload()">RELOAD WEBSITE</button>
  </div>`;
  document.body.appendChild(wrap);
  document.body.classList.add('maintenance-active');
}
function applyMaintenance(state=APP){
  const enabled=Boolean(state?.config?.maintenance?.enabled);
  const u=state?.user;
  // Admins and moderators can still enter the site/admin area while maintenance is enabled.
  if(enabled && !['admin','moderator'].includes(u?.role)) showMaintenanceOverlay();
  else removeMaintenanceOverlay();
}

function renderMainPage(){const c=getConfig(),u=getCurrentUser();document.querySelectorAll('#mainLogo,#miniLogo').forEach(e=>e.src=c.logo);const f=document.getElementById('favicon');if(f)f.href=c.logo;const set=(id,v)=>{const e=document.getElementById(id);if(e)e.textContent=v};set('brandName',c.brandName);set('profileName',c.profileName);set('profileRole',c.profileRole);set('profileDesc',c.profileDesc);set('statProducts',c.stats?.products);set('statDocs',c.stats?.docs);set('statFollowers',c.stats?.followers);set('currentYear',new Date().getFullYear());const loginBtn=document.getElementById('loginBtn'),adminBtn=document.getElementById('adminBtn'),logoutBtn=document.getElementById('logoutBtn'),g=document.getElementById('userGreeting');if(u){loginBtn?.classList.add('hidden');logoutBtn?.classList.remove('hidden');if(g){g.textContent='👋 '+(u.fullname||u.username);g.classList.remove('hidden')}if(canManage()&&adminBtn)adminBtn.classList.remove('hidden')}else{loginBtn?.classList.remove('hidden');logoutBtn?.classList.add('hidden');g?.classList.add('hidden');adminBtn?.classList.add('hidden')}renderAnnouncements();renderChat();renderRankings();renderSensi();renderSupport(c);renderClock();loadMediaLinks();document.querySelectorAll('.protected-section[data-requires-login="true"]').forEach(sec=>{const oldGate=sec.querySelector('.login-gate');if(oldGate)oldGate.remove();if(!u){sec.classList.add('is-locked');const gate=document.createElement('div');gate.className='login-gate';gate.innerHTML='<div class="login-gate-card"><i class="fas fa-lock"></i><h3>Chức năng yêu cầu đăng nhập</h3><p>Đăng nhập hoặc đăng ký để sử dụng chức năng này.</p><a class="auth-btn login-gate-btn" href="auth/login.html">Đăng nhập / Đăng ký</a></div>';sec.appendChild(gate)}else sec.classList.remove('is-locked')})}
function renderAnnouncements(){const el=document.getElementById('announcementList');if(!el)return;const a=getAnnouncements();el.innerHTML=a.length?a.slice(0,10).map(x=>`<article class="news-card">${x.image?`<img src="${escapeHTML(x.image)}" alt="" loading="lazy" onerror="this.style.display='none'">`:''}<div><small>${escapeHTML(x.author)} • ${new Date(x.at).toLocaleString('vi-VN')}</small><h3>${escapeHTML(x.title)}</h3><p>${escapeHTML(x.body)}</p></div></article>`).join(''):'<div class="empty-state">Chưa có thông báo.</div>'}
function renderChat(){const el=document.getElementById('chatMessages');if(!el)return;const a=getChat();el.innerHTML=a.length?a.slice(-60).map(x=>`<div class="chat-msg"><div><b>${escapeHTML(x.username)}</b><small>${new Date(x.at).toLocaleTimeString('vi-VN',{hour:'2-digit',minute:'2-digit'})}</small></div><p>${escapeHTML(x.message)}</p></div>`).join(''):'<div class="empty-state">Chưa có tin nhắn. Hãy là người đầu tiên!</div>';el.scrollTop=el.scrollHeight}
function renderRankings(){const v=document.getElementById('visitRanking'),ch=document.getElementById('chatRanking');const row=(u,i,n)=>`<div class="rank-row"><span class="rank-no">${i+1}</span><span class="rank-name">${escapeHTML(u.fullname||u.username)}</span><b>${n}</b></div>`;if(v)v.innerHTML=getLeaderboard('views').map((u,i)=>row(u,i,u.views||0)).join('')||'<div class="empty-state">Chưa có dữ liệu</div>';if(ch)ch.innerHTML=getLeaderboard('chat').map((u,i)=>row(u,i,u.chats||0)).join('')||'<div class="empty-state">Chưa có dữ liệu</div>'}
function renderSensi(){const box=document.getElementById('sensiList');if(!box)return;const labels=['Nhìn xung quanh','Ống ngắm hồng tâm','Ống ngắm 2x','Ống ngắm 4x','Ống ngắm súng ngắm','Nút camera tự do'];box.innerHTML=labels.map((x,i)=>`<div class="sensi-row"><span>${x}</span><b id="sv${i}">0</b></div>`).join('')}
function updateSensi(){const d=document.getElementById('phoneIn')?.value.trim();if(!d)return toast('Vui lòng nhập tên thiết bị!','error');document.getElementById('sensiResult')?.classList.remove('hidden');document.getElementById('sensiDevice').textContent=d;for(let i=0;i<6;i++)document.getElementById('sv'+i).textContent=Math.floor(Math.random()*50+160);document.getElementById('fireNum').textContent=(Math.floor(Math.random()*15+40))+'%';toast('Đã tạo thông số tham khảo cho '+d,'success')}
async function sendChatForm(e){e.preventDefault();const r=await sendChat(document.getElementById('chatInput')?.value);if(!r.ok){toast(r.msg,'error');if(!getCurrentUser())location.href='auth/login.html'}else{document.getElementById('chatInput').value='';renderChat();renderRankings()}}
function toast(msg,type='info'){const e=document.getElementById('toast');if(!e)return;clearTimeout(window.__toast);e.className='toast '+type;e.textContent=msg;e.classList.add('show');window.__toast=setTimeout(()=>e.classList.remove('show'),2600)}
function renderSupport(c){const s=document.getElementById('supportGrid');if(!s)return;s.innerHTML=`<a class="support-card" href="${escapeHTML(c.contacts.zalo1)}" target="_blank"><b>Zalo 1</b><span>0923375670</span></a><a class="support-card" href="${escapeHTML(c.contacts.zalo2)}" target="_blank"><b>Zalo 2</b><span>0394925338</span></a><a class="support-card" href="${escapeHTML(c.contacts.email)}"><b>Email</b><span>chuoipc1129@gmail.com</span></a><a class="support-card" href="${escapeHTML(c.contacts.tiktok)}" target="_blank"><b>TikTok</b><span>@Oishiicuti</span></a>`}
function renderClock(){const e=document.getElementById('liveClock');if(!e)return;const tick=()=>{const n=new Date();e.textContent=n.toLocaleString('vi-VN',{weekday:'long',day:'2-digit',month:'2-digit',year:'numeric',hour:'2-digit',minute:'2-digit',second:'2-digit'})};tick();setInterval(tick,1000)}
async function loadMediaLinks(){const list=document.getElementById('mediaList');if(!list)return;renderMediaLinks(APP.media||[])}
function renderMediaLinks(items){const list=document.getElementById('mediaList');if(!list)return;if(!items.length){list.innerHTML='<div class="empty-state"><i class="fas fa-inbox"></i><br>Chưa có link tải nào</div>';return}list.innerHTML=items.map(m=>`<a class="media-item" href="${escapeHTML(m.url)}" target="_blank" rel="noopener noreferrer">${m.image?`<img class="media-thumb" src="${escapeHTML(m.image)}" alt="" loading="lazy" onerror="this.style.display='none'">`:''}<div class="media-content"><div class="media-title">${escapeHTML(m.title)}</div><div class="media-desc">Phiên bản ${escapeHTML(m.version||'')}</div></div><div class="media-download"><i class="fas fa-arrow-down"></i></div></a>`).join('')}
if(typeof document!=='undefined')document.addEventListener('DOMContentLoaded',async()=>{try{await syncState();if(document.getElementById('mainLogo')){await recordVisit();renderMainPage();setInterval(async()=>{try{await syncState();renderMainPage()}catch{}} ,10000)}}catch(e){console.error(e);if(document.getElementById('mainLogo'))renderMainPage()}});
