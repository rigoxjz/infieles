// =======================
// script.js FINAL
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

// Mostrar el modal si no ha confirmado
window.onload = () => {
  if(!localStorage.getItem("mayor_edad")){
    document.getElementById("age-modal").style.display="flex";
  }else{
    document.getElementById("main-content").style.display="block";
    cargarInfieles();
  }
};

// ==================================================
// Cargar infieles
// ==================================================
async function cargarInfieles(){
  const lista = document.getElementById("lista-infieles");
  lista.innerHTML = "<p style='text-align:center;padding:18px'>Cargando chismes...</p>";

  try{
    const res = await fetch(`${API}/infieles`);
    var datos = await res.json();
  }catch(e){
    lista.innerHTML = "<p style='color:red;text-align:center'>Error al cargar</p>";
    return;
  }

  lista.innerHTML = "";
  if(!datos.length){
    lista.innerHTML = "<p style='text-align:center;padding:18px'>No hay chismes</p>";
    return;
  }

  datos.forEach(item=>{
    const card = document.createElement("div");
    card.className = "card";

    const miniFoto = item.fotos?.length
      ? `<img src="data:image/jpeg;base64,${item.fotos[0]}" style="width:120px;height:80px;border-radius:8px;object-fit:cover;cursor:pointer" onclick="mostrarDetallePorId(${item.id})">`
      : "";

    card.innerHTML = `
      <div class="card-header">${escapeHtml(item.nombre)} ${escapeHtml(item.apellido)}</div>

      <div class="card-body" style="display:flex;gap:12px">
        ${miniFoto}
        <div style="flex:1">
          <p><strong>Edad:</strong> ${item.edad}</p>
          <p><strong>Ubicación:</strong> ${escapeHtml(item.ubicacion)}</p>
          <p><strong>Publicado por:</strong> ${escapeHtml(item.reportero || "Anónimo")}</p>
          <p>${escapeHtml(truncate(item.historia))}</p>

          <div style="background:#f1f1f1;padding:8px;border-radius:8px;margin-top:6px">
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

  // Activar botones
  document.querySelectorAll(".btn-ver").forEach(btn=>{
    btn.onclick = ()=> mostrarDetallePorId(btn.dataset.id);
  });
}

// ==================================================
// Mostrar detalle
// ==================================================
async function mostrarDetallePorId(id){
  const modal = document.getElementById("modal-chisme");
  const detalle = document.getElementById("detalle-chisme");

  modal.classList.add("active");
  detalle.innerHTML = "<p style='text-align:center;padding:18px'>Cargando...</p>";

  const res = await fetch(`${API}/infieles`);
  const datos = await res.json();
  const item = datos.find(x => x.id == id);

  if(!item){ detalle.innerHTML = "No encontrado"; return; }

  // Galería mini
  let fotosHTML = "";
  if(item.fotos.length){
    fotosHTML = item.fotos.map(f => `
      <img src="data:image/jpeg;base64,${f}" 
        style="width:90px;height:70px;border-radius:8px;object-fit:cover;cursor:pointer;margin:4px"
        onclick="openImageViewer('data:image/jpeg;base64,${f}')">
    `).join("");
  }

  // Comentarios
  const comentariosHTML = item.comentarios.length
    ? item.comentarios.map(c=>`
        <div class="comentario">
          <strong>${escapeHtml(c.nombre || "Anónimo")}</strong>
          <p>${escapeHtml(c.texto)}</p>
        </div>
      `).join("")
    : "<p>No hay comentarios aún</p>";

  detalle.innerHTML = `
    <h2>${escapeHtml(item.nombre)} ${escapeHtml(item.apellido)}</h2>
    <p><strong>Edad:</strong> ${item.edad}</p>
    <p><strong>Ubicación:</strong> ${escapeHtml(item.ubicacion)}</p>
    <p><strong>Publicado por:</strong> ${escapeHtml(item.reportero || "Anónimo")}</p>
    <p style="white-space:pre-wrap">${escapeHtml(item.historia)}</p>

    <div style="margin-top:12px">${fotosHTML}</div>

    <h3 style="margin-top:18px">Votación</h3>
    <button id="btn-real" class="btn" style="background:green;color:white;margin-right:8px">
      Es real (${item.votos_reales})
    </button>
    <button id="btn-falso" class="btn" style="background:red;color:white">
      Es falso (${item.votos_falsos})
    </button>

    <h3 style="margin-top:20px">Comentarios</h3>
    <div id="lista-comentarios">${comentariosHTML}</div>

    <h4 style="margin-top:12px">Agregar comentario</h4>
    <input id="coment-nombre" placeholder="Tu nombre (opcional)" class="input">
    <textarea id="coment-texto" class="input" placeholder="Escribe un comentario"></textarea>

    <button id="enviar-comentario" class="btn btn-azul" style="margin-top:10px">Enviar comentario</button>
    <p id="coment-status" style="color:green;display:none;margin-top:10px"></p>

    <button id="cerrar-detalle" class="btn btn-rojo" style="margin-top:20px">Cerrar</button>
  `;

  // ========================
  // FUNCIONALIDAD VOTAR
  // ========================
  const userID = obtenerUserID(); // 🔥 ID único por usuario

  document.getElementById("btn-real").onclick = ()=> votar(id, userID, true);
  document.getElementById("btn-falso").onclick = ()=> votar(id, userID, false);

  // ========================
  // ENVIAR COMENTARIO
  // ========================
  document.getElementById("enviar-comentario").onclick = async ()=>{
    const texto = document.getElementById("coment-texto").value.trim();
    const nombre = document.getElementById("coment-nombre").value || "Anónimo";
    const status = document.getElementById("coment-status");

    if(!texto) return alert("Escribe un comentario");

    const fd = new FormData();
    fd.append("infiel_id", id);
    fd.append("texto", texto);
    fd.append("nombre", nombre);

    const res = await fetch(`${API}/comentario`,{ method:"POST", body:fd });
    const j = await res.json();

    if(j.success){
      status.style.display="block";
      status.innerText="Comentario enviado";

      setTimeout(()=> mostrarDetallePorId(id), 600);
    }
  };

  document.getElementById("cerrar-detalle").onclick = ()=> modal.classList.remove("active");
}

// =============================================
// VOTACIÓN 100% FUNCIONAL
// =============================================
async function votar(id, userID, voto){
  try{
    const r = await fetch(`${API}/votar`,{
      method:"POST",
      headers:{ "Content-Type":"application/json" },
      body:JSON.stringify({
        infiel_id:id,
        usuario:userID,   // 🔥 ya no es "anon", ahora no choca
        voto
      })
    });

    const j = await r.json();
    if(j.success){
      alert("Voto registrado");
      mostrarDetallePorId(id);
      cargarInfieles();
    } else {
      alert("Ya votaste este chisme");
    }

  }catch(e){
    alert("Error al votar");
  }
}

// ==========================
// User ID único
// ==========================
function obtenerUserID(){
  if(!localStorage.getItem("USER_ID")){
    localStorage.setItem("USER_ID", "USER_"+Math.random().toString(36).substring(2));
  }
  return localStorage.getItem("USER_ID");
}

// ==========================
// Imagen ampliada
// ==========================
function openImageViewer(src){
  let v = document.getElementById("image-viewer");
  if(!v){
    v = document.createElement("div");
    v.id="image-viewer";
    v.style="position:fixed;inset:0;background:rgba(0,0,0,.9);display:flex;align-items:center;justify-content:center;z-index:9999";
    v.innerHTML = `<img src="${src}" style="max-width:95%;max-height:95%;border-radius:10px">`;
    v.onclick = ()=> v.remove();
    document.body.appendChild(v);
  }
}
