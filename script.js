// CONFIG — no guardar claves en el repo. Si quieres usar una master key en desarrollo,
// define window.CHERRY_CONFIG = { BACKEND_URL: "...", MASTER_KEY: "..." } desde el entorno
// (ej. en la consola del navegador) o configura el backend para no necesitar master key.
const BACKEND_URL = (window.CHERRY_CONFIG && window.CHERRY_CONFIG.BACKEND_URL) || "https://cherryv1.onrender.com/api/ai";
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
  recog.onresult = (e) => {
    inputBox.value = (inputBox.value + " " + e.results[0][0].transcript).trim();
  };
  recog.onerror = (e) => console.warn("Speech err", e);
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
  u.rate = 1;
  window.speechSynthesis.cancel();
  window.speechSynthesis.speak(u);
}

/* loader */
function showLoader(){ loaderWaves.hidden = false; }
function hideLoader(){ loaderWaves.hidden = true; }

/* system prompt by mode */
function getSystemPrompt(){
  const mode = modeSelect.value;
  if(mode==="explain") return "Eres Cherry, explica con detalle y ejemplos sencillos y pasos numerados.";
  if(mode==="coder") return "Eres Cherry, da respuestas técnicas y muestra código claro cuando sea necesario.";
  if(mode==="flirty") return "Eres Cherry, coqueta, juguetona pero respetuosa, respuestas cortas y encantadoras.";
  if(mode==="tutor") return "Eres Cherry, tutora para prepa en línea, explica con claridad y cita fuentes si es posible.";
  if(mode==="pro") return "Eres Cherry, profesional en UX, marketing y tattoo; respuestas formales y concretas.";
  return "Eres Cherry, un asistente útil, amable y directo.";
}

/* backend call */
async function callBackend(userText, imageData = null){
  // Validación de configuración antes de la llamada
  if (MASTER_KEY === "" && BACKEND_URL === "https://cherryv1.onrender.com/api/ai") {
    pushMessage("assistant", "ERROR: Falta configurar la clave maestra (MASTER_KEY) o la URL del backend. Define window.CHERRY_CONFIG = { BACKEND_URL: '...', MASTER_KEY: '...' } en la consola o configura tu backend para no requerir clave.");
    hideLoader();
    saveChats();
    return;
  }
  const command = parseCommand(userText);
  let payloadText = userText;
  if(command){
    switch(command.cmd){
      case "/buscar":
        payloadText = `Realiza una búsqueda y resume: ${command.arg}`;
        break;
      case "/resumir":
        payloadText = `Resume: ${command.arg}`;
        break;
      case "/email":
        payloadText = `Redacta un correo profesional sobre: ${command.arg}`;
        break;
      case "/nota":
        payloadText = `Genera una nota: ${command.arg}`;
        break;
      case "/traduce":
        payloadText = `Traduce al español: ${command.arg}`;
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

/* keyboard: send on Enter */
inputBox.addEventListener("keydown", (e)=>{
  if(e.key === "Enter" && !e.shiftKey){
    e.preventDefault();
    sendBtn.click();
  }
});

/* initial render */
renderChats();
renderMessages();
chatSubtitle.textContent = `Modo: ${modeSelect.selectedOptions[0].text}`;

/* mode change */
modeSelect.onchange = ()=> {
  chatSubtitle.textContent = `Modo: ${modeSelect.selectedOptions[0].text}`;
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
