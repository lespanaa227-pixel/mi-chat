// Frontend connecting to backend endpoints (/send-code, /verify-code, /users)
const sendCodeBtn = document.getElementById('sendCodeBtn');
const verifyBox = document.getElementById('verifyBox');
const verifyBtn = document.getElementById('verifyBtn');
const statusEl = document.getElementById('status');
const phoneInput = document.getElementById('phone');
const codeInput = document.getElementById('code');
const nameInput = document.getElementById('name');
const avatarFile = document.getElementById('avatarFile');

const chatEl = document.getElementById('chat');
const loginEl = document.getElementById('login');
const mensajesEl = document.getElementById('mensajes');
const textoIn = document.getElementById('texto');
const enviarBtn = document.getElementById('enviarBtn');
const profileName = document.getElementById('profileName');
const profileAvatar = document.getElementById('profileAvatar');

sendCodeBtn.addEventListener('click', async ()=>{
  const phone = phoneInput.value.trim();
  if(!phone) return alert('Escribe tu número con prefijo, ej +52...');
  setStatus('Enviando código...');
  try{
    const res = await fetch('/send-code', { method:'POST', headers:{'content-type':'application/json'}, body: JSON.stringify({ phone })});
    const j = await res.json();
    if(res.ok && j.ok){
      setStatus('Código enviado. Revisa tu SMS.');
      verifyBox.style.display = 'block';
    } else {
      setStatus('Error: ' + (j && j.error) );
    }
  }catch(e){
    setStatus('Error de red: ' + e.message);
  }
});

verifyBtn.addEventListener('click', async ()=>{
  const phone = phoneInput.value.trim();
  const code = codeInput.value.trim();
  const name = nameInput.value.trim();
  if(!phone || !code) return alert('Necesitas teléfono y código');
  setStatus('Verificando...');
  try{
    const res = await fetch('/verify-code', { method:'POST', headers:{'content-type':'application/json'}, body: JSON.stringify({ phone, code })});
    const j = await res.json();
    if(res.ok && j.ok){
      setStatus('Código verificado. Registrando usuario...');
      let avatarData = null;
      if(avatarFile.files[0]) avatarData = await readFileAsDataURL(avatarFile.files[0]);
      const r2 = await fetch('/users', { method:'POST', headers:{'content-type':'application/json'}, body: JSON.stringify({ phone, name: name || phone, avatar: avatarData })});
      const j2 = await r2.json();
      if(r2.ok && j2.ok){
        localStorage.setItem('miChat_user', JSON.stringify(j2.user));
        enterChat(j2.user);
      } else {
        setStatus('Error creando usuario: ' + (j2 && j2.error));
      }
    } else {
      setStatus('Código inválido: ' + (j && j.error));
    }
  }catch(e){
    setStatus('Error de red: ' + e.message);
  }
});

function setStatus(t){ statusEl.textContent = t; }

function readFileAsDataURL(file){ return new Promise((res,rej)=>{ const r=new FileReader(); r.onload=()=>res(r.result); r.onerror=rej; r.readAsDataURL(file); }); }

function enterChat(user){
  loginEl.style.display = 'none';
  chatEl.style.display = 'block';
  profileName.textContent = user.name;
  if(user.avatar) profileAvatar.innerHTML = '<img src="'+user.avatar+'" />';
  else profileAvatar.textContent = (user.name.split(' ').map(s=>s[0]).slice(0,2).join('')).toUpperCase();
  // load existing messages (local for now)
  const msgs = JSON.parse(localStorage.getItem('miChat_messages') || '[]');
  renderMessages(msgs);
}

function renderMessages(list){
  mensajesEl.innerHTML = '';
  list.forEach(m => appendMessage(m));
}

function appendMessage(m){
  const div = document.createElement('div');
  div.className = 'mensaje';
  div.textContent = m.user + ': ' + m.text;
  mensajesEl.appendChild(div);
}

enviarBtn.addEventListener('click', ()=>{
  const text = textoIn.value.trim();
  if(!text) return;
  const user = JSON.parse(localStorage.getItem('miChat_user'));
  const m = { user: user.name, text, time: Date.now(), avatar: user.avatar || null };
  const msgs = JSON.parse(localStorage.getItem('miChat_messages') || '[]');
  msgs.push(m);
  localStorage.setItem('miChat_messages', JSON.stringify(msgs));
  appendMessage(m);
  textoIn.value = '';
});

// auto-login if user exists
(function(){
  const u = localStorage.getItem('miChat_user');
  if(u) enterChat(JSON.parse(u));
})();
