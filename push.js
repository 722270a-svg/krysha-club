import {createClient} from 'https://esm.sh/@supabase/supabase-js@2.57.0';
const db=createClient('https://tqcuozwshuqxkcrtksdt.supabase.co','sb_publishable_f0_3Yk3kTUTQgGxQa812UQ_RDoQejOm');
const endpoint='https://tqcuozwshuqxkcrtksdt.supabase.co/functions/v1/krysha-push';
const get=(id)=>document.getElementById(id);
const esc=(v)=>String(v||'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;','\'':'&#39;'}[c]));
const b64ToBytes=(s)=>Uint8Array.from(atob(s.replace(/-/g,'+').replace(/_/g,'/')+'='.repeat((4-s.length%4)%4)),c=>c.charCodeAt(0));
async function api(payload,token){const r=await fetch(endpoint,{method:'POST',headers:{'Content-Type':'application/json',...(token?{'Authorization':'Bearer '+token}:{})},body:JSON.stringify(payload)});const json=await r.json();if(!r.ok)throw new Error(json.error||'Ошибка сервера');return json}
window.kryshaSubscribe=async()=>{
 const el=get('pushStatus');try{
  if(!('serviceWorker'in navigator)||!('PushManager'in window)||!('Notification'in window))throw Error('Браузер не поддерживает Web Push.');
  if(Notification.permission==='denied')throw Error('Уведомления запрещены в настройках устройства.');
  const permission=await Notification.requestPermission();
  el.textContent='Подключаем уведомления...';
  const key=await api({action:'key'});
  const reg=await navigator.serviceWorker.ready;
  if(permission!=='granted')throw Error('Разрешение на уведомления не предоставлено.');
  const sub=await reg.pushManager.subscribe({userVisibleOnly:true,applicationServerKey:b64ToBytes(key.publicKey)});
  await api({action:'subscribe',subscription:sub.toJSON()});
  el.textContent='Готово! Вы подписаны на новости «Крыши».';
 }catch(e){el.textContent=e.message||'Не получилось подключить уведомления.'}
};
window.pushView=async()=>{
 const n=get('pushView');if(!n)return;
 n.innerHTML='<h2>Уведомления «Крыши»</h2><p>Получайте новости, приглашения на вечеринки и информацию об акциях.</p><button class="action" id="allowPush">🔔 Разрешить уведомления</button><p class="small">Для iPhone: Safari → «Поделиться» → «На экран Домой». Откройте установленную «Крышу» и разрешите уведомления. Подписка добровольная.</p><p id="pushStatus" aria-live="polite"></p><div id="pushAdmin"></div>';
 get('allowPush').onclick=window.kryshaSubscribe;
 const session=(await db.auth.getSession()).data.session;
 if(!session){get('pushAdmin').innerHTML='<p class="small">Отправка уведомлений доступна владельцу клуба после входа в личный кабинет.</p>';return}
 const staff=await db.from('krysha_staff').select('role').eq('user_id',session.user.id).maybeSingle();
 if(staff.data?.role!=='owner'){get('pushAdmin').innerHTML='<p class="small">Управление рассылками доступно только владельцу.</p>';return}
 const admin=get('pushAdmin');
 admin.innerHTML='<hr><h2>Отправить Push из CRM</h2><p id="pushStats">Проверяем подписчиков...</p><form id="pushSend"><input name="title" placeholder="Заголовок" maxlength="80" required value="КРЫША · Якутск"><textarea name="body" placeholder="Текст уведомления" maxlength="300" required></textarea><button class="action" type="submit">Отправить подписчикам</button></form><p id="pushSendStatus" aria-live="polite"></p>';
 try{const a=await api({action:'stats'},session.access_token);get('pushStats').textContent='Подписано устройств: '+a.subscribers}catch(e){get('pushStats').textContent=e.message}
 get('pushSend').onsubmit=async e=>{
   e.preventDefault();
   const f=new FormData(e.target);const title=String(f.get('title')).trim(),body=String(f.get('body')).trim();
   if(!confirm('Отправить уведомление всем подписчикам?'))return;
   const b=e.target.querySelector('button');b.disabled=true;get('pushSendStatus').textContent='Отправка...';
   try{const x=await api({action:'send',title,body},session.access_token);get('pushSendStatus').textContent='Доставлено push-сервисам: '+x.sent+'; ошибок: '+x.failed+'.'}catch(err){get('pushSendStatus').textContent=err.message}finally{b.disabled=false}
 };
};