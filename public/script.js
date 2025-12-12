// script.js → 100% FUNCIONAL (diciembre 2025) – FOTOS SIEMPRE PEQUEÑAS
const API = "https://infieles-v2.onrender.com";

// ==================== MAYOR DE EDAD ====================
function confirmAge(ok) {
  if (ok) {
    localStorage.setItem("mayor_edad", "1");
    document.getElementById("age-modal").classList.remove("active");
    document.getElementById("main-content").style.display = "block";
    cargarInfieles();
  } else {
    window.location.href = "https://google.com";
  }
}

if (localStorage.getItem("mayor_edad")) {
  document.getElementById("age-modal").classList.remove("active");
  document.getElementById("main-content").style.display = "block";
  cargarInfieles();
}

// ==================== UTILIDADES ====================
function escapeHtml(text) {
  if (!text) return "";
  return text.toString().replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

function truncate(text, len = 100) {
  return text.length > len ? text.substr(0, len) + "..." : text;
}

function obtenerUserID() {
  let id = localStorage.getItem("USER_ID");
  if (!id) {
    id = "user_" + Math.random().toString(36).substr(2, 9);
    localStorage.setItem("USER_ID", id);
  }
  return id;
}

// ==================== CARGAR LISTA (MINIATURA PEQUEÑA) ====================
async function cargarInfieles() {
  const lista = document.getElementById("lista-infieles");
  lista.innerHTML = `<div style="text-align:center;padding:40px;color:#666">Cargando chismes...</div>`;

  let datos;
  try {
    const res = await fetch(`${API}/infieles`);
    datos = await res.json();
  } catch (e) {
    lista.innerHTML = `<div style="text-align:center;color:red;padding:40px">Error de conexión</div>`;
    return;
  }

  if (!datos || datos.length === 0) {
    lista.innerHTML = `<div style="text-align:center;padding:50px;color:#999">Aún no hay chismes... ¡Sé el primero!</div>`;
    return;
  }

  lista.innerHTML = "";
  datos.forEach(item => {
    const card = document.createElement("div");
    card.className = "card";

    const miniFoto = item.fotos && item.fotos.length
      ? `<img src="data:image/jpeg;base64,${item.fotos[0]}" onclick="verDetalle(${item.id})" 
          style="width:120px;height:80px;object-fit:cover;border-radius:10px;cursor:pointer;margin-bottom:10px">`
      : `<div style="width:120px;height:80px;background:#eee;border-radius:10px;margin-bottom:10px"></div>`;

    card.innerHTML = `
      <div class="card-header">${escapeHtml(item.nombre)} ${escapeHtml(item.apellido)}</div>
      <div class="card-body">
        ${miniFoto}
        <div class="info"><strong>Edad:</strong> ${item.edad}</div>
        <div class="info"><strong>Ubicación:</strong> ${escapeHtml(item.ubicacion)}</div>
        <div class="info"><strong>Publicado por:</strong> ${escapeHtml(item.reportero || "Anónimo")}</div>
        <p style="margin:15px 0;line-height:1.5">${escapeHtml(truncate(item.historia, 130))}</p>
        <div style="display:flex;justify-content:space-between;align-items:center;font-size:0.9em;color:#555;background:#f1f1f1;padding:10px;border-radius:8px">
          <span>Real ${item.votos_reales || 0}</span>
          <span>Falso ${item.votos_falsos || 0}</span>
          <span>Comentarios ${item.comentarios?.length || 0}</span>
        </div>
        <button class="btn btn-azul" onclick="verDetalle(${item.id})" style="margin-top:15px;width:100%">Ver chisme completo</button>
      </div>
    `;
    lista.appendChild(card);
  });
}

// ==================== DETALLE CHISME – FOTOS SIEMPRE PEQUEÑAS ====================
async function verDetalle(id) {
  const modal = document.getElementById("modal-chisme");
  const contenido = document.getElementById("detalle-chisme");
  modal.classList.add("active");

  // Loader muy corto
  contenido.innerHTML = `<div style="text-align:center;padding:30px;color:#666">Cargando...</div>`;

  let datos;
  try {
    const res = await fetch(`${API}/infieles`);
    datos = await res.json();
  } catch (e) {
    contenido.innerHTML = `<div style="color:red;text-align:center">Error de conexión</div>`;
    return;
  }

  const infiel = datos.find(x => x.id == id);
  if (!infiel) {
    contenido.innerHTML = "Chisme no encontrado";
    return;
  }

  // GALERÍA: TODAS LAS FOTOS PEQUEÑAS (90×70px) – NUNCA GRANDES
  const galeriaHTML = infiel.fotos?.length
    ? `<div style="margin:20px 0; text-align:center; line-height:0">
         ${infiel.fotos.map(f => `
           <img src="data:image/jpeg;base64,${f}"
                style="width:90px;height:70px;object-fit:cover;border-radius:10px;
                       margin:4px;cursor:pointer;border:2px solid #ddd"
                onclick="verFoto('data:image/jpeg;base64,${f}')">
         `).join("")}
       </div>`
    : "";

  // Comentarios
  const comentariosHTML = infiel.comentarios?.length
    ? infiel.comentarios.map(c => `
        <div class="comentario">
          <strong>${escapeHtml(c.nombre || "Anónimo")}</strong>
          <p>${escapeHtml(c.texto)}</p>
        </div>
      `).join("")
    : "<p style='color:#888;text-align:center;padding:20px'>Sin comentarios aún</p>";

  contenido.innerHTML = `
    <h2 style="text-align:center;margin:15px 0">${escapeHtml(infiel.nombre)} ${escapeHtml(infiel.apellido)}</h2>
    <div class="info"><strong>Edad:</strong> ${infiel.edad} | <strong>Lugar:</strong> ${escapeHtml(infiel.ubicacion)}</div>
    <div class="info"><strong>Publicado por:</strong> ${escapeHtml(infiel.reportero || "Anónimo")}</div>
    <p style="margin:20px 0;white-space:pre-wrap;line-height:1.6">${escapeHtml(infiel.historia)}</p>

    ${galeriaHTML}

    <div class="votos">
      <button class="voto-btn" style="background:#28a745" onclick="votar(${id}, true)">Real (${infiel.votos_reales || 0})</button>
      <button class="voto-btn" style="background:#dc3545" onclick="votar(${id}, false)">Falso (${infiel.votos_falsos || 0})</button>
    </div>

    <div class="comentarios">
      <h3>Comentarios (${infiel.comentarios?.length || 0})</h3>
      <div id="lista-comentarios">${comentariosHTML}</div>
      <input type="text" id="com-nombre" placeholder="Tu nombre (opcional)" style="margin-top:15px">
      <textarea id="com-texto" placeholder="Escribe tu comentario..." rows="3"></textarea>
      <button class="btn btn-azul" onclick="enviarComentario(${id})" style="width:100%;margin-top:10px">Enviar Comentario</button>
      <div id="com-status" style="color:green;margin-top:8px;display:none"></div>
    </div>
  `;
}

// ==================== VOTAR ====================
async function votar(id, esReal) {
  const userID = obtenerUserID();
  try {
    const res = await fetch(`${API}/votar`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ infiel_id: id, usuario: userID, voto: esReal })
    });
    const data = await res.json();
    if (data.success) {
      alert(esReal ? "Voto REAL" : "Voto FALSO");
      verDetalle(id);
      cargarInfieles();
    } else {
      alert(data.message || "Ya votaste");
    }
  } catch (e) {
    alert("Error de conexión");
  }
}

// ==================== ENVIAR COMENTARIO ====================
async function enviarComentario(id) {
  const texto = document.getElementById("com-texto").value.trim();
  const nombre = document.getElementById("com-nombre").value.trim() || "Anónimo";
  const status = document.getElementById("com-status");

  if (!texto) return alert("Escribe algo");

  status.style.display = "block";
  status.textContent = "Enviando...";

  const fd = new FormData();
  fd.append("infiel_id", id);
  fd.append("texto", texto);
  fd.append("nombre", nombre);

  try {
    const res = await fetch(`${API}/comentario`, { method: "POST", body: fd });
    const j = await res.json();
    if (j.success) {
      status.textContent = "Comentario enviado";
      document.getElementById("com-texto").value = "";
      setTimeout(() => verDetalle(id), 600);
    } else {
      status.textContent = "Error";
      status.style.color = "red";
    }
  } catch (e) {
    status.textContent = "Sin conexión";
    status.style.color = "red";
  }
}

// ==================== FOTO EN GRANDE (solo al tocar) ====================
function verFoto(src) {
  const overlay = document.createElement("div");
  overlay.style.cssText = "position:fixed;inset:0;background:rgba(0,0,0,0.92);display:flex;align-items:center;justify-content:center;z-index:99999;cursor:pointer";
  overlay.innerHTML = `<img src="${src}" style="max-width:94%;max-height:94%;border-radius:14px;object-fit:contain">`;
  overlay.onclick = () => overlay.remove();
  document.body.appendChild(overlay);
}

// ==================== RESTO DE FUNCIONES (sin cambios) ====================
document.addEventListener("DOMContentLoaded", () => {
  document.getElementById("btn-agregar").onclick = () => document.getElementById("modal-form").classList.add("active");

  document.getElementById("form-infiel").onsubmit = async function(e) {
    e.preventDefault();
    const btn = e.submitter;
    btn.disabled = true;
    btn.textContent = "Publicando...";

    const fd = new FormData();
    fd.append("reportero", document.getElementById("reportero").value || "Anónimo");
    fd.append("nombre", document.getElementById("nombre").value);
    fd.append("apellido", document.getElementById("apellido").value);
    fd.append("edad", document.getElementById("edad").value);
    fd.append("ubicacion", document.getElementById("ubicacion").value);
    fd.append("historia", document.getElementById("historia").value);

    const files = document.getElementById("pruebas").files;
    for (let file of files) fd.append("fotos", file);

    try {
      const res = await fetch(`${API}/infieles`, { method: "POST", body: fd });
      const j = await res.json();
      if (j.success) {
        alert("¡Publicado!");
        cerrarModal();
        this.reset();
        cargarInfieles();
      } else alert(j.message || "Error");
    } catch (e) {
      alert("Sin conexión");
    } finally {
      btn.disabled = false;
      btn.textContent = "Publicar Chisme";
    }
  };

  document.getElementById("search-input").onkeyup = filtrar;
});

function cerrarModal() { document.getElementById("modal-form").classList.remove("active"); }
function cerrarDetalle() { document.getElementById("modal-chisme").classList.remove("active"); }
function cerrarLegal() { document.getElementById("modal-legal").classList.remove("active"); }

document.getElementById("btn-legal").onclick = () => document.getElementById("modal-legal").classList.add("active");

function filtrar() {
  const term = document.getElementById("search-input").value.toLowerCase();
  document.querySelectorAll(".card").forEach(card => {
    card.style.display = card.textContent.toLowerCase().includes(term) ? "" : "none";
  });
}
