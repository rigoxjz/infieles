// =======================
// script.js FINAL CORREGIDO – DICIEMBRE 2025
// =======================
const API = "https://infieles-v2.onrender.com";

// ===============
// Helpers
// ===============
function escapeHtml(s){ if(!s) return ""; return String(s).replace(/</g,"&lt;").replace(/>/g,"&gt;"); }
function truncate(s,n=90){ return s.length>n ? s.substring(0,n)+"..." : s; }

// ==================================================
// MAYOR DE EDAD
// ==================================================
function confirmAge(ok){
  const ageModal = document.getElementById("age-modal");
  const mainContent = document.getElementById("main-content");
  if(ok){
    localStorage.setItem("mayor_edad","1");
    ageModal.style.display="none";
    mainContent.style.display="block";
    cargarInfieles();
  } else {
    window.location.href="https://google.com";
  }
}
window.confirmAge = confirmAge;

window.onload = () => {
  if(!localStorage.getItem("mayor_edad")){
    document.getElementById("age-modal").style.display="flex";
  }else{
    document.getElementById("main-content").style.display="block";
    cargarInfieles();
  }
};

// ==================================================
// Cargar infieles (lista principal)
// ==================================================
async function cargarInfieles(){
  const lista = document.getElementById("lista-infieles");
  lista.innerHTML = "<p style='text-align:center;padding:18px'>Cargando chismes...</p>";
  try{
    const res = await fetch(`${API}/infieles`);
    var datos = await res.json();
  }catch(e){
    {
    lista.innerHTML = "<p style='color:red;text-align:center'>Error de conexión</p>";
    return;
  }

  lista.innerHTML = "";
  if(!datos.length){
    lista.innerHTML = "<p style='text-align:center;padding:18px'>Aún no hay chismes</p>";
    return;
  }

  datos.forEach(item=>{
    const card = document.createElement("div");
    card.className = "card";
    const miniFoto = item.fotos?.length
      ? `<img src="data:image/jpeg;base64,${item.fotos[0]}" style="width:120px;height:80px;border-radius:8px;object-fit:cover;cursor:pointer" onclick="mostrarDetallePorId(${item.id})">`
      : `<div style="width:120px;height:80px;background:#ddd;border-radius:8px"></div>`;

    card.innerHTML = `
      <div class="card-header">${escapeHtml(item.nombre)} ${escapeHtml(item.apellido)}</div>
      <div class="card-body" style="display:flex;gap:12px">
        ${miniFoto}
        <div style="flex:1">
          <p><strong>Edad:</strong> ${item.edad}</p>
          <p><strong>Ubicación:</strong> ${escapeHtml(item.ubicacion)}</p>
          <p><strong>Publicado por:</strong> ${escapeHtml(item.reportero || "Anónimo")}</p>
          <p>${escapeHtml(truncate(item.historia))}</p>
          <div style="background:#f1f1f1;padding:8px;border-radius:8px;margin-top:6px;font-size:14px">
            ✔️ ${item.votos_reales} &nbsp; ❌ ${item.votos_falsos} &nbsp; 💬 ${item.comentarios.length}
          </div>
          <button class="btn btn-azul btn-ver" data-id="${item.id}" style="margin-top:10px">
            Ver chisme completo
          </button>
        </div>
      </div>
    `;
    lista.appendChild(card);
  });

  // Botones "Ver chisme completo"
  document.querySelectorAll(".btn-ver").forEach(btn=>{
    btn.onclick = () => mostrarDetallePorId(btn.dataset.id);
  });
}

// ==================================================
// Mostrar detalle completo + votos + comentarios
// ==================================================
async function mostrarDetallePorId(id){
  const modal = document.getElementById("modal-chisme");
  const detalle = document.getElementById("detalle-chisme");
  modal.classList.add("active");
  detalle.innerHTML = "<p style='text-align:center;padding:30px'>Cargando chisme...</p>";

  let datos;
  try{
    const res = await fetch(`${API}/infieles`);
    datos = await res.json();
  }catch(e){
    detalle.innerHTML = "<p style='color:red'>Error de conexión</p>";
    return;
  }

  const item = datos.find(x => x.id == id);
  if(!item){
    detalle.innerHTML = "<p>Chisme no encontrado</p>";
    return;
  }

  // Galería
  const fotosHTML = item.fotos?.length ? item.fotos.map(f => `
    <img src="data:image/jpeg;base64,${f}"
      style="width:100px;height:80px;object-fit:cover;border-radius:8px;margin:4px;cursor:pointer"
      onclick="openImageViewer('data:image/jpeg;base64,${f}')">
  `).join("") : "";

  // Comentarios
  const comentariosHTML = item.comentarios.length ? item.comentarios.map(c=>`
    <div class="comentario">
      <strong>${escapeHtml(c.nombre || "Anónimo")}</strong>
      <p>${escapeHtml(c.texto)}</p>
    </div>
  `).join("") : "<p style='color:#666'>Sé el primero en comentar</p>";

  detalle.innerHTML = `
    <h2>${escapeHtml(item.nombre)} ${escapeHtml(item.apellido)}</h2>
    <p><strong>Edad:</strong> ${item.edad}  <strong>Ubicación:</strong> ${escapeHtml(item.ubicacion)}</p>
    <p><strong>Publicado por:</strong> ${escapeHtml(item.reportero || "Anónimo")}</p>
    <p style="white-space:pre-wrap;margin:16px 0">${escapeHtml(item.historia)}</p>

    ${fotosHTML ? `<div style="margin:16px 0">${fotosHTML}</div>` : ""}

    <h3>Votación</h3>
    <div style="margin:12px 0">
      <button id="btn-real" class="btn" style="background:#28a745;color:white;padding:10px 20px;margin-right:12px;font-size:16px">
        ✔️ Es real (${item.votos_reales})
      </button>
      <button id="btn-falso" class="btn" style="background:#dc3545;color:white;padding:10px 20px;font-size:16px">
        ❌ Es falso (${item.votos_falsos})
      </button>
    </div>

    <h3>Comentarios (${item.comentarios.length})</h3>
    <div id="lista-comentarios">${comentariosHTML}</div>

    <h4>Agregar comentario</h4>
    <input id="coment-nombre" class="input" placeholder="Tu nombre (opcional)" style="margin-bottom:8px">
    <textarea id="coment-texto" class="input" placeholder="Escribe aquí tu comentario..." rows="3" style="margin-bottom:8px"></textarea>
    <button id="enviar-comentario" class="btn btn-azul">Enviar comentario</button>
    <p id="coment-status" style="color:green;margin-top:8px;display:none"></p>

    <button id="cerrar-detalle" class="btn btn-rojo" style="margin-top:20px">Cerrar</button>
  `;

  const userID = obtenerUserID();

  // VOTAR
  document.getElementById("btn-real").onclick   = () => votar(id, userID, true);
  document.getElementById("btn-falso").onclick  = () => votar(id, userID, false);

  // ENVIAR COMENTARIO (corregido)
  document.getElementById("enviar-comentario").onclick = async () => {
    const texto = document.getElementById("coment-texto").value.trim();
    const nombre = document.getElementById("coment-nombre").value.trim() || "Anónimo";
    const status = document.getElementById("coment-status");

    if(!texto) return alert("Escribe algo en el comentario");

    status.style.display = "none";
    status.innerText = "";

    const fd = new FormData();
    fd.append("infiel_id", id);
    fd.append("texto", texto);
    fd.append("nombre", nombre);

    try{
      const res = await fetch(`${API}/comentario`, { method:"POST", body:fd });
      const j = await res.json();

      if(j.success){
        status.style.display = "block";
        status.innerText = "¡Comentario enviado!";
        document.getElementById("coment-texto").value = "";
        // Recargamos el detalle para ver el nuevo comentario y votos actualizados
        setTimeout(() => mostrarDetallePorId(id), 800);
      } else {
        alert("Error al enviar comentario");
      }
    }catch(e){
      alert("Error de conexión");
    }
  };

  // Cerrar modal
  document.getElementById("cerrar-detalle").onclick = () => {
    modal.classList.remove("active");
  };
}

// ==================================================
// VOTACIÓN (funciona perfecto)
// ==================================================
async function votar(id, userID, esReal){
  try{
    const res = await fetch(`${API}/votar`,{
      method:"POST",
      headers:{ "Content-Type":"application/json" },
      body:JSON.stringify({
        infiel_id: id,
        usuario: userID,
        voto: esReal
      })
    });
    const j = await res.json();

    if(j.success){
      alert(esReal ? "¡Voto REAL registrado!" : "¡Voto FALSO registrado!");
      mostrarDetallePorId(id);     // actualiza los números
      cargarInfieles();            // actualiza la lista principal también
    } else {
      alert(j.message || "Ya votaste este chisme");
    }
  }catch(e){
    alert("Error de conexión al votar");
  }
}

// ==================================================
// AGREGAR CHISME NUEVO (esto te faltaba)
// ==================================================
document.getElementById("btn-agregar-chisme")?.addEventListener("click", () => {
  document.getElementById("modal-agregar").classList.add("active");
});

document.getElementById("cerrar-agregar")?.addEventListener("click", () => {
  document.getElementById("modal-agregar").classList.remove("active");
});

document.getElementById("form-agregar")?.addEventListener("submit", async (e) => {
  e.preventDefault();
  const status = document.getElementById("agregar-status");

  const fd = new FormData(e.target);
  // Las fotos vienen como archivos, el backend las espera en "fotos"

  status.style.display = "block";
  status.style.color = "#333";
  status.innerText = "Enviando chisme...";

  try{
    const res = await fetch(`${API}/infieles`, {
      method: "POST",
      body: fd
    });
    const j = await res.json();

    if(j.success){
      status.style.color = "green";
      status.innerText = "¡Chisme publicado con éxito!";
      e.target.reset();
      document.getElementById("modal-agregar").classList.remove("active");
      cargarInfieles(); // refresca la lista
    } else {
      status.style.color = "red";
      status.innerText = j.message || "Error al publicar";
    }
  }catch(err){
    status.style.color = "red";
    status.innerText = "Error de conexión";
  }
});

// ==================================================
// Botón Información Legal
// ==================================================
document.getElementById("btn-legal")?.addEventListener("click", () => {
  document.getElementById("modal-legal").classList.add("active");
});
document.getElementById("cerrar-legal")?.addEventListener("click", () => {
  document.getElementById("modal-legal").classList.remove("active");
});

// ==================================================
// User ID único (para evitar votos duplicados)
// ==================================================
function obtenerUserID(){
  if(!localStorage.getItem("USER_ID")){
    localStorage.setItem("USER_ID", "USER_"+Math.random().toString(36).substr(2));
  }
  return localStorage.getItem("USER_ID");
}

// ==================================================
// Visor de imagen grande
// ==================================================
function openImageViewer(src){
  const viewer = document.createElement("div");
  viewer.id = "image-viewer-temp";
  viewer.style.cssText = "position:fixed;inset:0;background:rgba(0,0,0,0.9);display:flex;align-items:center;justify-content:center;z-index:99999;cursor:pointer";
  viewer.innerHTML = `<img src="${src}" style="max-width:95%;max-height:95%;border-radius:12px;">`;
  viewer.onclick = () => viewer.remove();
  document.body.appendChild(viewer);
}
