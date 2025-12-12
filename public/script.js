// script.js → VERSIÓN FINAL 100% PERFECTA (diciembre 2025)
const API = "https://infieles-v2.onrender.com";

function confirmAge(ok) {
  if (ok) {
    localStorage.setItem("mayor_edad", "1");
    document.getElementById("age-modal").classList.remove("active");
    document.getElementById("main-content").style.display = "block";
    cargarInfieles();
  } else window.location.href = "https://google.com";
}

if (localStorage.getItem("mayor_edad")) {
  document.getElementById("age-modal").classList.remove("active");
  document.getElementById("main-content").style.display = "block";
  cargarInfieles();
}

function escapeHtml(t) { return t ? t.toString().replace(/</g,"&lt;").replace(/>/g,"&gt;") : ""; }
function truncate(t, n=100) { return t.length > n ? t.substr(0,n)+"..." : t; }

function obtenerUserID() {
  let id = localStorage.getItem("USER_ID");
  if (!id) {
    id = "u" + Math.random().toString(36).substr(2,9);
    localStorage.setItem("USER_ID", id);
  }
  return id;
}

// ==================== LISTA PRINCIPAL (SIN FOTO HASTA ABRIR) ====================
async function cargarInfieles() {
  const lista = document.getElementById("lista-infieles");
  lista.innerHTML = `<div style="text-align:center;padding:50px;color:#666">Cargando chismes...</div>`;

  let datos;
  try { datos = await (await fetch(`${API}/infieles`)).json(); }
  catch { lista.innerHTML = `<div style="color:red;text-align:center;padding:50px">Sin conexión</div>`; return; }

  if (!datos || datos.length === 0) {
    lista.innerHTML = `<div style="text-align:center;padding:60px;color:#999">No hay chismes aún<br>Sé el primero</div>`;
    return;
  }

  lista.innerHTML = "";
  datos.forEach(item => {
    const card = document.createElement("div");
    card.className = "card";
    card.innerHTML = `
      <div class="card-header">${escapeHtml(item.nombre)} ${escapeHtml(item.apellido)}</div>
      <div class="card-body">
        <div class="info"><strong>Edad:</strong> ${item.edad}</div>
        <div class="info"><strong>Ubicación:</strong> ${escapeHtml(item.ubicacion)}</div>
        <div class="info"><strong>Publicado por:</strong> ${escapeHtml(item.reportero || "Anónimo")}</div>
        <p style="margin:15px 0;line-height:1.5">${escapeHtml(truncate(item.historia, 130))}</p>
        <div style="display:flex;justify-content:space-between;background:#f1f1f1;padding:10px;border-radius:8px;font-size:0.9em">
          <span>Real ${item.votos_reales || 0}</span>
          <span> ${item.votos_falsos || 0}</span>
          <span> ${item.comentarios?.length || 0}</span>
        </div>
        <button class="btn btn-azul" onclick="verDetalle(${item.id)" style="margin-top:15px;width:100%">Ver chisme completo</button>
      </div>
    `;
    lista.appendChild(card);
  });
}

// ==================== DETALLE CHISME ====================
async function verDetalle(id) {
  const modal = document.getElementById("modal-chisme");
  const cont = document.getElementById("detalle-chisme");
  modal.classList.add("active");

  let datos = await (await fetch(`${API}/infieles`)).json();
  const item = datos.find(x => x.id == id);
  if (!item) { cont.innerHTML = "No encontrado"; return; }

  // Galería pequeña siempre
  const galeria = item.fotos?.length ? `
    <div style="margin:20px 0;text-align:center;line-height:0">
      ${item.fotos.map(f => `
        <img src="data:image/jpeg;base64,${f}"
             style="width:90px;height:70px;object-fit:cover;border-radius:10px;margin:4px;cursor:pointer;border:2px solid #ddd"
             onclick="verFoto('data:image/jpeg;base64,${f}')">
      `).join("")}
    </div>` : "";

  cont.innerHTML = `
    <h2 style="text-align:center;margin:15px 0">${escapeHtml(item.nombre)} ${escapeHtml(item.apellido)}</h2>
    <div class="info"><strong>Edad:</strong> ${item.edad} | <strong>Lugar:</strong> ${escapeHtml(item.ubicacion)}</div>
    <div class="info"><strong>Publicado por:</strong> ${escapeHtml(item.reportero || "Anónimo")}</div>
    <p style="margin:20px 0;white-space:pre-wrap;line-height:1.6">${escapeHtml(item.historia)}</p>
    ${galeria}

    <div class="votos">
      <button id="btn-real" class="voto-btn" style="background:#28a745">Real (${item.votos_reales || 0})</button>
      <button id="btn-falso" class="voto-btn" style="background:#dc3545">Falso (${item.votos_falsos || 0})</button>
    </div>

    <div class="comentarios">
      <h3>Comentarios (${item.comentarios?.length || 0})</h3>
      <div id="lista-comentarios">
        ${item.comentarios?.length ? item.comentarios.map(c => `
          <div class="comentario">
            <strong>${escapeHtml(c.nombre || "Anónimo")}</strong>
            <p>${escapeHtml(c.texto)}</p>
          </div>
        `).join("") : "<p style='color:#888;text-align:center;padding:15px'>Sé el primero en comentar</p>"}
      </div>

      <input type="text" id="com-nombre" placeholder="Nombre (opcional)" style="margin-top:15px">
      <textarea id="com-texto" placeholder="Escribe aquí..." rows="3"></textarea>
      <button class="btn btn-azul" id="btn-enviar-com" style="width:100%;margin-top:10px">Enviar Comentario</button>
      <div id="com-status" style="color:green;margin-top:8px;display:none"></div>
    </div>
  `;

  // VOTAR UNA SOLA VEZ
  const userID = obtenerUserID();
  let yaVoto = false;

  // Verificar si ya votó (miramos en localStorage por rapidez)
  const votosGuardados = JSON.parse(localStorage.getItem("mis_votos") || "{}");
  if (votosGuardados[id]) yaVoto = true;

  const btnReal = document.getElementById("btn-real");
  const btnFalso = document.getElementById("btn-falso");

  if (yaVoto) {
    btnReal.disabled = true;
    btnFalso.disabled = true;
    btnReal.style.opacity = "0.6";
    btnFalso.style.opacity = "0.6";
  } else {
    btnReal.onclick = () => votarYActualizar(id, true);
    btnFalso.onclick = () => votarYActualizar(id, false);
  }

  // ENVIAR COMENTARIO SIN RECARGAR
  document.getElementById("btn-enviar-com").onclick = () => enviarComentarioSinRecarga(id, item);
}

// ==================== VOTO + ACTUALIZAR CONTADOR SIN RECARGAR ====================
async function votarYActualizar(id, esReal) {
  const userID = obtenerUserID();
  try {
    const res = await fetch(`${API}/votar`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ infiel_id: id, usuario: userID, voto: esReal })
    });
    const data = await res.json();

    if (data.success) {
      // Guardar en localStorage para no votar de nuevo
      const votos = JSON.parse(localStorage.getItem("mis_votos") || "{}");
      votos[id] = true;
      localStorage.setItem("mis_votos", JSON.stringify(votos));

      // Actualizar contadores sin recargar
      const btnReal = document.getElementById("btn-real");
      const btnFalso = document.getElementById("btn-falso");
      if (esReal) {
        btnReal.innerHTML = `Real (${(parseInt(btnReal.textContent.match(/\d+/)||[0])[0] + 1)})`;
      } else {
        btnFalso.innerHTML = `Falso (${(parseInt(btnFalso.textContent.match(/\d+/)||[0])[0] + 1)})`;
      }
      btnReal.disabled = btnFalso.disabled = true;
      btnReal.style.opacity = btnFalso.style.opacity = "0.6";
      alert("¡Voto registrado!");
    } else {
      alert(data.message || "Ya votaste");
    }
  } catch { alert("Error de conexión"); }
}

// ==================== COMENTARIO SIN RECARGAR ====================
async function enviarComentarioSinRecarga(id, itemActual) {
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
      status.textContent = "¡Enviado!";
      document.getElementById("com-texto").value = "";

      // Añadir comentario al DOM sin recargar
      const lista = document.getElementById("lista-comentarios");
      const nuevo = document.createElement("div");
      nuevo.className = "comentario";
      nuevo.innerHTML = `<strong>${escapeHtml(nombre)}</strong><p>${escapeHtml(texto)}</p>`;
      lista.insertBefore(nuevo, lista.firstChild);

      // Actualizar contador
      const titulo = document.querySelector(".comentarios h3");
      const actual = parseInt(titulo.textContent.match(/\d+/)?.[0] || "0");
      titulo.textContent = `Comentarios (${actual + 1})`;

      setTimeout(() => status.style.display = "none", 1500);
    } else {
      status.textContent = "Error";
      status.style.color = "red";
    }
  } catch {
    status.textContent = "Sin conexión";
    status.style.color = "red";
  }
}

// ==================== FOTO GRANDE ====================
function verFoto(src) {
  const overlay = document.createElement("div");
  overlay.style.cssText = "position:fixed;inset:0;background:#000c;display:flex;align-items:center;justify-content:center;z-index:99999;cursor:pointer";
  overlay.innerHTML = `<img src="${src}" style="max-width:94%;max-height:94%;border-radius:14px">`;
  overlay.onclick = () => overlay.remove();
  document.body.appendChild(overlay);
}

// ==================== MODALES Y OTROS ====================
document.addEventListener("DOMContentLoaded", () => {
  document.getElementById("btn-agregar")?.addEventListener("click", () => {
    document.getElementById("modal-form").classList.add("active");
  });

  document.getElementById("form-infiel")?.addEventListener("submit", async e => {
    e.preventDefault();
    const btn = e.submitter;
    btn.disabled = true;
    btn.textContent = "Publicando...";

    const fd = new FormData(e.target);
    fd.append("reportero", fd.get("reportero") || "Anónimo");

    try {
      const res = await fetch(`${API}/infieles`, { method: "POST", body: fd });
      const j = await res.json();
      if (j.success) {
        alert("¡Chisme publicado!");
        e.target.reset();
        document.getElementById("modal-form").classList.remove("active");
        cargarInfieles();
      } else alert(j.message || "Error");
    } catch { alert("Sin conexión"); }
    finally { btn.disabled = false; btn.textContent = "Publicar Chisme"; }
  });

  document.getElementById("search-input")?.addEventListener("keyup", () => {
    const term = document.getElementById("search-input").value.toLowerCase();
    document.querySelectorAll(".card").forEach(c => {
      c.style.display = c.textContent.toLowerCase().includes(term) ? "" : "none";
    });
  });
});

function cerrarModal() { document.getElementById("modal-form").classList.remove("active"); }
function cerrarDetalle() { document.getElementById("modal-chisme").classList.remove("active"); }
function cerrarLegal() { document.getElementById("modal-legal").classList.remove("active"); }
document.getElementById("btn-legal")?.addEventListener("click", () => document.getElementById("modal-legal").classList.add("active"));
