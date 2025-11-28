// CONFIG — no guardar claves en el repo. Si quieres usar una master key en desarrollo,
// define window.CHERRY_CONFIG = { BACKEND_URL: "...", MASTER_KEY: "..." } desde el entorno
// (ej. en la consola del navegador) o configura el backend para no necesitar master key.
const BACKEND_URL = (window.CHERRY_CONFIG && window.CHERRY_CONFIG.BACKEND_URL) || "https://cherryv1.onrender.com/cherry";
const MASTER_KEY = (window.CHERRY_CONFIG && window.CHERRY_CONFIG.MASTER_KEY) || "";

/* UI refs */
const messagesEl = document.getElementById("messages");
const inputBox = document.getElementById("inputBox");
const sendBtn = document.getElementById("sendBtn");
const micBtn = document.getElementById("micBtn");
const imgBtn = document.getElementById("imgBtn");
const fileInput = document.getElementById("fileInput");
const newChatBtn = document.getElementById("newChatBtn");
const chatsList = document.getElementById("chatsList");
const modeSelect = document.getElementById("modeSelect");
const themeBtn = document.getElementById("themeBtn");
const chatSubtitle = document.getElementById("chatSubtitle");
const loaderWaves = document.getElementById("loaderWaves");
const sendSound = document.getElementById("sendSound");

/* state */
let chats = JSON.parse(localStorage.getItem("cherry_chats_v3") || "[]");
if(!chats.length){
  chats = [{id: Date.now(), title: "Chat 1", messages: []}];
}
let activeChat = chats[0];

/* helpers */
function saveChats(){ localStorage.setItem("cherry_chats_v3", JSON.stringify(chats)); }
function escapeHtml(s){ return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/\n/g,'<br>'); }

/* render list */
function renderChats(){
  chatsList.innerHTML = "";
  chats.forEach(c=>{
    const el = document.createElement("div");
    el.className = "chatItem" + (c.id===activeChat.id ? " active":"");
    el.innerText = c.title;
    el.onclick = ()=>{ activeChat = c; renderChats(); renderMessages(); }
    chatsList.appendChild(el);
  });
}

/* render messages */
function renderMessages(){
  messagesEl.innerHTML = "";
  activeChat.messages.forEach(m=>{
    const tpl = document.getElementById("msgTpl");
    const node = tpl.content.cloneNode(true);
    const container = node.querySelector(".msg");
    container.classList.add(m.role==="user" ? "user":"assistant");
    node.querySelector(".meta").textContent = (m.role==="user" ? "Tú" : "Cherry") + " • " + new Date(m.t).toLocaleTimeString();
    node.querySelector(".bubble").innerHTML = escapeHtml(m.text);
    if(m.image){
      const img = document.createElement("img");
      img.src = m.image;
      node.querySelector(".imgPreview").appendChild(img);
    }
    messagesEl.appendChild(node);
  });
  messagesEl.scrollTop = messagesEl.scrollHeight;
}

/* push message */
function pushMessage(role, text, image){
  const m = { role, text, image: image||null, t: Date.now() };
  activeChat.messages.push(m);
  saveChats(); renderMessages(); renderChats();
}

/* new chat */
newChatBtn.onclick = ()=>{
  const c = { id: Date.now(), title: `Chat ${chats.length+1}`, messages: [] };
  chats.unshift(c); activeChat = c; saveChats(); renderChats(); renderMessages();
}

/* theme toggle */
themeBtn.onclick = () => {
  document.getElementById("app").classList.toggle("dark");
  document.getElementById("app").classList.toggle("light");
}

/* mic */
let recog = null;
if(window.SpeechRecognition || window.webkitSpeechRecognition){
  const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
  recog = new SR();
  recog.lang = 'es-ES';
  recog.continuous = false;
  recog.interimResults = true;
  recog.onstart = () => {
    inputBox.placeholder = "Escuchando...";
    micBtn.style.opacity = "0.6";
  };
  recog.onresult = (e) => {
    let transcript = '';
    for (let i = e.resultIndex; i < e.results.length; i++) {
      transcript += e.results[i][0].transcript;
    }
    inputBox.value = (inputBox.value + " " + transcript).trim();
  };
  recog.onend = () => {
    inputBox.placeholder = "Escribe a Cherry...";
    micBtn.style.opacity = "1";
  };
  recog.onerror = (e) => {
    console.warn("Speech recognition error:", e.error);
    inputBox.placeholder = "Error en microfono. Intenta de nuevo.";
    micBtn.style.opacity = "1";
  };
  micBtn.onclick = ()=> { if(recog) recog.start(); };
} else {
  micBtn.style.display = "none";
}

/* file upload */
imgBtn.onclick = ()=> fileInput.click();
fileInput.onchange = (e) => {
  const f = e.target.files[0];
  if(!f) return;
  const reader = new FileReader();
  reader.onload = ()=> {
    const dataUrl = reader.result;
    pushMessage("user", "[Imagen adjunta]", dataUrl);
    callBackend("[imagen]", dataUrl);
  };
  reader.readAsDataURL(f);
}

/* send */
sendBtn.onclick = async ()=> {
  const text = inputBox.value.trim();
  if(!text) return;
  pushMessage("user", text);
  inputBox.value = "";
  playSendSound();
  await callBackend(text);
}

/* play send sound */
function playSendSound(){
  try{ sendSound.currentTime = 0; sendSound.play(); }catch(e){}
}

/* commands */
function parseCommand(text){
  if(!text.startsWith("/")) return null;
  const parts = text.split(" ");
  const cmd = parts[0].toLowerCase();
  const arg = parts.slice(1).join(" ");
  return {cmd, arg};
}

/* tts */
function speakText(t){
  if(!("speechSynthesis" in window)) return;
  const u = new SpeechSynthesisUtterance(t);
  u.lang = 'es-ES';
  u.rate = 0.95;
  u.pitch = 1.1;
  u.volume = 1;
  window.speechSynthesis.cancel();
  window.speechSynthesis.speak(u);
}

/* loader */
function showLoader(){ loaderWaves.hidden = false; }
function hideLoader(){ loaderWaves.hidden = true; }

/* system prompt by mode */
function getSystemPrompt(){
  const mode = modeSelect.value;
  if(mode==="explain") return "Eres Cherry, explica con detalle, ejemplos sencillos y pasos numerados. Sé educativa y clara.";
  if(mode==="coder") return "Eres Cherry, da respuestas técnicas, muestra código limpio y bien comentado. Sé precisa y profesional.";
  if(mode==="flirty") return "Eres Cherry, coqueta, juguetona pero respetuosa. Respuestas cortas, encantadoras y con emojis. Sé amigable.";
  if(mode==="tutor") return "Eres Cherry, tutora para estudiantes. Explica con claridad, usa ejemplos, cita fuentes si es posible. Sé paciente.";
  if(mode==="pro") return "Eres Cherry, profesional experta en UX, marketing, diseño y negocios. Respuestas formales, concretas y estratégicas.";
  return "Eres Cherry, un asistente útil, amable, directo y siempre dispuesta a ayudar.";
}

/* backend call */
async function callBackend(userText, imageData = null){

  const command = parseCommand(userText);
  let payloadText = userText;
  if(command){
    switch(command.cmd){
      case "/buscar":
        payloadText = `Realiza una búsqueda rápida y resume los puntos clave sobre: ${command.arg}`;
        break;
      case "/resumir":
        payloadText = `Resume de forma concisa y clara: ${command.arg}`;
        break;
      case "/email":
        payloadText = `Redacta un correo profesional y bien estructurado sobre: ${command.arg}`;
        break;
      case "/nota":
        payloadText = `Genera una nota clara y organizada sobre: ${command.arg}`;
        break;
      case "/tarea":
        payloadText = `Crea una lista de tareas para: ${command.arg}`;
        break;
      case "/traduce":
        payloadText = `Traduce al español de forma natural: ${command.arg}`;
        break;
      case "/codigo":
        payloadText = `Genera código limpio y bien comentado para: ${command.arg}`;
        break;
      case "/imagen":
        payloadText = `Describe cómo crear una imagen para: ${command.arg}`;
        break;
      default:
        payloadText = userText;
    }
  }

  const system = getSystemPrompt();
  showLoader();
  pushMessage("assistant", "⏳ Cherry está escribiendo...");

  try{
    const body = { message: `${system}\n\n${payloadText}` };
    if(imageData) body.image = imageData;

    const res = await fetch(BACKEND_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-master-key": MASTER_KEY
      },
      body: JSON.stringify(body)
    });

    const data = await res.json();
    activeChat.messages = activeChat.messages.filter(m => m.text !== "⏳ Cherry está escribiendo...");

    if(res.ok){
      const reply = data.reply || JSON.stringify(data);
      pushMessage("assistant", reply);
      speakText(reply);
    } else {
      pushMessage("assistant", `Error: ${data.error || 'Respuesta inválida'}`);
    }
  }catch(err){
    activeChat.messages = activeChat.messages.filter(m => m.text !== "⏳ Cherry está escribiendo...");
    pushMessage("assistant", `Error de conexión: ${err.message}`);
  }finally{
    hideLoader();
    saveChats();
  }
}

/* keyboard: send on Enter, Shift+Enter for newline */
inputBox.addEventListener("keydown", (e)=>{
  if(e.key === "Enter" && !e.shiftKey){
    e.preventDefault();
    sendBtn.click();
  }
});

/* menu button for mobile */
const menuBtn = document.getElementById("menuBtn");
if(menuBtn){
  menuBtn.onclick = ()=>{
    const sidebar = document.getElementById("sidebar");
    sidebar.classList.toggle("open");
  };
  
  document.addEventListener("click", (e)=>{
    if(e.target.closest(".chatItem")){
      document.getElementById("sidebar").classList.remove("open");
    }
  });
}

function updateMenuButton(){
  if(window.innerWidth <= 768){
    menuBtn.style.display = "flex";
  } else {
    menuBtn.style.display = "none";
    document.getElementById("sidebar").classList.remove("open");
  }
}
updateMenuButton();
window.addEventListener("resize", updateMenuButton);

/* initial render */
renderChats();
renderMessages();
updateModeDisplay();

function updateModeDisplay(){
  const selectedText = modeSelect.selectedOptions[0].text;
  chatSubtitle.textContent = `Modo: ${selectedText}`;
}

modeSelect.onchange = updateModeDisplay;

const settingsBtn = document.getElementById("settingsBtn");
if(settingsBtn){
  settingsBtn.onclick = ()=>{
    alert("Ajustes\n\nTema: Presiona el boton de luna\n\nHistorial: Se guarda automaticamente\n\nAPI Config:\nwindow.CHERRY_CONFIG = {\n  BACKEND_URL: 'url',\n  MASTER_KEY: 'key'\n}");
  };
}

const shareBtn = document.getElementById("shareBtn");
if(shareBtn){
  shareBtn.onclick = ()=>{
    const url = window.location.href;
    if(navigator.share){
      navigator.share({title: "Cherry AI", text: "Prueba Cherry AI", url});
    } else {
      alert("URL: " + url);
    }
  };
}

/* tsparticles init */
document.addEventListener("DOMContentLoaded", ()=> {
  if(window.tsParticles){
    tsParticles.load("particles", {
      fullScreen: { enable: true, zIndex: 0 },
      particles: {
        number: { value: 30 },
        color: { value: ["#ff6b9a","#ffd166","#6ef0c5","#8ec5ff"] },
        shape: { type: "circle" },
        opacity: { value: 0.7 },
        size: { value: { min: 2, max: 8 } },
        move: { enable: true, speed: 1, direction: "none" },
        links: { enable: false }
      },
      interactivity: {
        events: { onHover: { enable: true, mode: "repulse" } }
      },
      background: { color: { value: "#071026" } }
    });
  }
});
