// === script.js corregido para tu index.html ===
const API = "https://infieles-v2.onrender.com";

// ---------- Helpers ----------
function escapeHtml(unsafe) {
  if (unsafe === null || unsafe === undefined) return "";
  return String(unsafe)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}
function truncate(s, n = 90) { if (!s) return ""; return s.length > n ? s.substring(0,n) + "..." : s; }

// ---------- Confirmar edad (botón "Sí, tengo 18+") ----------
function confirmAge(ok) {
  if (ok) {
    // cierra modal y muestra contenido principal
    const ageModal = document.getElementById("age-modal");
    if (ageModal) ageModal.classList.remove("active"), ageModal.style.display = "none";
    const main = document.getElementById("main-content");
    if (main) main.style.display = "block";
    cargarInfieles();
  } else {
    alert("No puedes entrar");
    window.location.href = "https://google.com";
  }
}
window.confirmAge = confirmAge; // global por los onclick inline

// ---------- Cargar lista principal ----------
async function cargarInfieles() {
  const lista = document.getElementById("lista-infieles");
  if (!lista) return;
  lista.innerHTML = `<p style="text-align:center;padding:18px">Cargando chismes...</p>`;

  let datos;
  try {
    const res = await fetch(`${API}/infieles`);
    datos = await res.json();
  } catch (err) {
    console.error("fetch /infieles:", err);
    lista.innerHTML = `<p style="text-align:center;padding:18px;color:red">Error al cargar chismes</p>`;
    return;
  }

  lista.innerHTML = "";
  if (!Array.isArray(datos) || datos.length === 0) {
    lista.innerHTML = `<p style="text-align:center;padding:18px">No hay chismes aún</p>`;
    return;
  }

  datos.forEach(item => {
    const reportero = item.reportero && item.reportero.trim() !== "" ? item.reportero : "Anónimo";
    const votosReales = Number(item.votos_reales || 0);
    const votosFalsos = Number(item.votos_falsos || 0);
    const comentariosCount = Array.isArray(item.comentarios) ? item.comentarios.length : 0;

    // miniatura
    let thumb = "";
    if (Array.isArray(item.fotos) && item.fotos.length > 0) {
      thumb = `<div style="padding:10px"><img src="data:image/jpeg;base64,${item.fotos[0]}" alt="prueba" style="width:120px;height:80px;object-fit:cover;border-radius:8px;cursor:pointer" onclick="mostrarDetallePorId(${item.id})"></div>`;
    }

    const card = document.createElement("div");
    card.className = "card";
    card.innerHTML = `
      <div class="card-header">${escapeHtml(item.nombre)} ${escapeHtml(item.apellido)}</div>
      <div class="card-body" style="display:flex;gap:12px;align-items:flex-start">
        ${thumb}
        <div style="flex:1">
          <p class="info"><strong>Edad:</strong> ${escapeHtml(String(item.edad||""))}</p>
          <p class="info"><strong>Ubicación:</strong> ${escapeHtml(item.ubicacion||"")}</p>
          <p class="info"><strong>Publicado por:</strong> ${escapeHtml(reportero)}</p>
          <p class="info"><strong>Historia:</strong> ${escapeHtml(truncate(item.historia||"", 90))}</p>

          <div style="margin-top:8px;background:#f8f9fa;padding:8px;border-radius:8px;font-size:0.95em">
            ✔️ Reales: <strong>${votosReales}</strong> &nbsp;&nbsp; ❌ Falsos: <strong>${votosFalsos}</strong> &nbsp;&nbsp; 💬 <strong>${comentariosCount}</strong>
          </div>

          <button class="btn btn-azul btn-ver" data-id="${item.id}" style="margin-top:10px">Ver chisme completo</button>
        </div>
      </div>
    `;
    lista.appendChild(card);
  });

  // eventos botones "Ver chisme completo"
  document.querySelectorAll(".btn-ver").forEach(b => {
    b.removeEventListener("click", onVerClick); // por si ya atachado
    b.addEventListener("click", onVerClick);
  });
}

function onVerClick(e){
  const id = e.currentTarget.getAttribute("data-id");
  if (id) mostrarDetallePorId(Number(id));
}
window.cargarInfieles = cargarInfieles;

// ---------- Mostrar detalle en modal (carga votos + comentarios) ----------
async function mostrarDetallePorId(id) {
  const modal = document.getElementById("modal-chisme");
  const detalle = document.getElementById("detalle-chisme");
  if (!modal || !detalle) return;

  detalle.innerHTML = `<p style="text-align:center;padding:18px">Cargando...</p>`;
  modal.classList.add("active");

  let datos;
  try {
    const res = await fetch(`${API}/infieles`);
    datos = await res.json();
  } catch (err) {
    console.error("fetch detalle:", err);
    detalle.innerHTML = `<p style="color:red">Error al cargar detalle</p>`;
    return;
  }

  const item = Array.isArray(datos) ? datos.find(x=>Number(x.id)===Number(id)) : null;
  if (!item) {
    detalle.innerHTML = `<p>Chisme no encontrado</p>`;
    return;
  }

  const reportero = item.reportero && item.reportero.trim() !== "" ? item.reportero : "Anónimo";
  const fotos = Array.isArray(item.fotos) ? item.fotos : [];
  const comentarios = Array.isArray(item.comentarios) ? item.comentarios : [];
  const votosReales = Number(item.votos_reales || 0);
  const votosFalsos = Number(item.votos_falsos || 0);

  // miniaturas dentro del modal
  let fotosHTML = "";
  if (fotos.length > 0) {
    fotosHTML = '<div class="galeria" style="display:flex;gap:8px;flex-wrap:wrap">';
    fotos.forEach((f, i) => {
      fotosHTML += `<img src="data:image/jpeg;base64,${f}" data-full="data:image/jpeg;base64,${f}" style="width:90px;height:70px;object-fit:cover;border-radius:8px;cursor:pointer">`;
    });
    fotosHTML += "</div>";
  }

  // comentarios HTML
  let comentariosHTML = "";
  if (comentarios.length === 0) comentariosHTML = "<p>No hay comentarios aún</p>";
  else comentariosHTML = comentarios.map(c=>{
    const nombre = c.nombre && c.nombre.trim() !== "" ? c.nombre : "Anónimo";
    const label = c.propietario ? ' <strong style="color:var(--azul)">(Propietario)</strong>' : '';
    const fotosC = Array.isArray(c.fotos) ? c.fotos.map(ff => `<img src="data:image/jpeg;base64,${ff}" style="width:100%;height:auto;margin-top:8px;border-radius:8px;cursor:pointer">`).join("") : "";
    return `<div class="comentario"><strong>${escapeHtml(nombre)}</strong>${label}<p>${escapeHtml(c.texto)}</p>${fotosC}</div>`;
  }).join("");

  detalle.innerHTML = `
    <h2>${escapeHtml(item.nombre)} ${escapeHtml(item.apellido)}</h2>
    <p class="info"><strong>Edad:</strong> ${escapeHtml(String(item.edad||""))}</p>
    <p class="info"><strong>Ubicación:</strong> ${escapeHtml(item.ubicacion||"")}</p>
    <p class="info"><strong>Publicado por:</strong> ${escapeHtml(reportero)}</p>
    <p style="white-space:pre-wrap">${escapeHtml(item.historia || "")}</p>

    ${fotosHTML}

    <div class="votos" style="margin-top:12px">
      <button id="btn-votar-real" class="voto-btn" style="background:green">Es real (${votosReales})</button>
      <button id="btn-votar-falso" class="voto-btn" style="background:red">Es falso (${votosFalsos})</button>
    </div>

    <div class="comentarios" style="margin-top:18px">
      <h3>Comentarios</h3>
      <div id="lista-comentarios">${comentariosHTML}</div>

      <h4 style="margin-top:12px">Agregar comentario</h4>
      <input id="coment-nombre-modal" type="text" placeholder="Tu nombre (opcional)" style="width:100%;padding:10px;border-radius:8px;border:1px solid #ddd;margin-bottom:8px">
      <textarea id="coment-texto-modal" placeholder="Tu comentario" style="width:100%;padding:10px;border-radius:8px;border:1px solid #ddd;min-height:80px"></textarea>
      <input id="coment-fotos-modal" type="file" accept="image/*" multiple style="margin-top:8px">
      <div style="display:flex;gap:8px;margin-top:10px">
        <button id="coment-submit" class="btn btn-azul">Comentar</button>
        <button id="cerrar-detalle" class="btn btn-rojo">Cerrar</button>
      </div>
    </div>
  `;

  // ampliar fotos (simple viewer)
  document.querySelectorAll('#detalle-chisme img[data-full]').forEach(img=>{
    img.addEventListener('click', ()=> openImageViewer(img.getAttribute('data-full')));
  });

  // votos: prev simple con localStorage + request al server
  const btnReal = document.getElementById("btn-votar-real");
  const btnFalso = document.getElementById("btn-votar-falso");
  if (localStorage.getItem(`voto_real_${id}`)) btnReal.disabled = true;
  if (localStorage.getItem(`voto_falso_${id}`)) btnFalso.disabled = true;

  btnReal.addEventListener('click', async ()=>{
    if (localStorage.getItem(`voto_real_${id}`) || localStorage.getItem(`voto_falso_${id}`)) { alert("Ya votaste"); return; }
    const usuario = prompt("Tu nombre o nick para votar:") || "Anónimo";
    try {
      const r = await fetch(`${API}/votar`, { method:"POST", headers:{"Content-Type":"application/json"}, body: JSON.stringify({ infiel_id: id, usuario, voto: true }) });
      const j = await r.json();
      if (r.ok && j.success) {
        localStorage.setItem(`voto_real_${id}`, "1");
        mostrarDetallePorId(id);
        cargarInfieles();
      } else alert(j.error || "Error al votar");
    } catch (err) { console.error(err); alert("Error al votar"); }
  });

  btnFalso.addEventListener('click', async ()=>{
    if (localStorage.getItem(`voto_real_${id}`) || localStorage.getItem(`voto_falso_${id}`)) { alert("Ya votaste"); return; }
    const usuario = prompt("Tu nombre o nick para votar:") || "Anónimo";
    try {
      const r = await fetch(`${API}/votar`, { method:"POST", headers:{"Content-Type":"application/json"}, body: JSON.stringify({ infiel_id: id, usuario, voto: false }) });
      const j = await r.json();
      if (r.ok && j.success) {
        localStorage.setItem(`voto_falso_${id}`, "1");
        mostrarDetallePorId(id);
        cargarInfieles();
      } else alert(j.error || "Error al votar");
    } catch (err) { console.error(err); alert("Error al votar"); }
  });

  // comentarios: submit
  document.getElementById("coment-submit").addEventListener('click', async ()=>{
    const nombre = document.getElementById("coment-nombre-modal").value || "Anónimo";
    const texto = document.getElementById("coment-texto-modal").value || "";
    const archivos = document.getElementById("coment-fotos-modal").files;
    if (!texto.trim()) return alert("Escribe un comentario");

    const fd = new FormData();
    fd.append("infiel_id", id);
    fd.append("nombre", nombre);
    fd.append("texto", texto);
    const propietario = (nombre.trim() !== "" && nombre.trim() === (item.reportero || "").trim());
    fd.append("propietario", propietario);
    for (let a of archivos) fd.append("fotos", a);

    try {
      const r = await fetch(`${API}/comentario`, { method:"POST", body: fd });
      const j = await r.json();
      if (r.ok && j.success) {
        mostrarDetallePorId(id);
        cargarInfieles();
      } else alert(j.error || "Error al comentar");
    } catch (err) { console.error(err); alert("Error al comentar"); }
  });

  // cerrar detalle
  document.getElementById("cerrar-detalle").addEventListener('click', ()=>{
    document.getElementById("modal-chisme").classList.remove("active");
  });
}
window.mostrarDetallePorId = mostrarDetallePorId;

// ---------- Image viewer ----------
function openImageViewer(src) {
  let viewer = document.getElementById("image-viewer");
  if (!viewer) {
    viewer = document.createElement("div");
    viewer.id = "image-viewer";
    viewer.style = "position:fixed;inset:0;background:rgba(0,0,0,0.9);display:flex;align-items:center;justify-content:center;z-index:2000;padding:20px";
    viewer.innerHTML = `<img id="image-viewer-img" src="${src}" style="max-width:100%;max-height:100%;border-radius:8px">`;
    viewer.addEventListener("click", ()=> viewer.style.display = "none");
    document.body.appendChild(viewer);
  } else {
    document.getElementById("image-viewer-img").src = src;
    viewer.style.display = "flex";
  }
}
function closeImageViewer(){ const v = document.getElementById("image-viewer"); if (v) v.style.display = "none"; }

// ---------- Form modal open/close and legal ----------
document.getElementById("btn-agregar").addEventListener("click", ()=> document.getElementById("modal-form").classList.add("active"));
document.querySelectorAll(".close").forEach(c => c.addEventListener("click", ()=> {
  c.closest(".modal")?.classList.remove("active");
}));
document.getElementById("btn-legal").addEventListener("click", ()=> document.getElementById("modal-legal").classList.add("active"));

// ---------- Envío formulario nuevo chisme ----------
document.getElementById("form-infiel").addEventListener("submit", async (e)=>{
  e.preventDefault();
  const fd = new FormData();
  fd.append("reportero", document.getElementById("reportero").value);
  fd.append("nombre", document.getElementById("nombre").value);
  fd.append("apellido", document.getElementById("apellido").value);
  fd.append("edad", document.getElementById("edad").value);
  fd.append("ubicacion", document.getElementById("ubicacion").value);
  fd.append("historia", document.getElementById("historia").value);
  const archivos = document.getElementById("pruebas").files;
  for (let a of archivos) fd.append("fotos", a);

  try {
    const r = await fetch(`${API}/nuevo`, { method:"POST", body: fd });
    const j = await r.json();
    if (r.ok && j.success) {
      document.getElementById("modal-form").classList.remove("active");
      cargarInfieles();
    } else {
      alert(j.error || "Error al publicar");
    }
  } catch (err) {
    console.error(err);
    alert("Error al publicar");
  }
});

// ---------- Buscar (filtrar) reutiliza tu función ----------
function filtrar(){
  const txt = (document.getElementById("search-input")?.value || "").toLowerCase();
  document.querySelectorAll(".card").forEach(c=>{
    c.style.display = c.innerText.toLowerCase().includes(txt) ? "block" : "none";
  });
}
window.filtrar = filtrar;

// ---------- Inicializar si el age modal ya fue cerrado en esta sesión (opcional) ----------
document.addEventListener("DOMContentLoaded", ()=>{
  // si quieres recordar edad: if(localStorage.getItem('edad_confirmada')){ confirmAge(true); }
  // por defecto dejamos que el modal controle
});
