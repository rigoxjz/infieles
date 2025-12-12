// =========================
// script.js (versión final corregida)
// =========================
const API = "https://infieles-v2.onrender.com";

// -------------------------
// Helpers
// -------------------------
function escapeHtml(s){ if(s==null) return ""; return String(s).replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;").replace(/'/g,"&#039;"); }
function truncate(s,n=90){ if(!s) return ""; return s.length>n ? s.substring(0,n)+"..." : s; }

// -------------------------
// Edad
// -------------------------
function confirmAge(ok){
  const ageModal = document.getElementById("age-modal");
  const mainContent = document.getElementById("main-content");
  if(ok){
    ageModal.style.display = "none";
    mainContent.style.display = "block";
    cargarInfieles();
  } else {
    alert("No puedes entrar");
    window.location.href = "https://google.com";
  }
}
window.confirmAge = confirmAge;

// -------------------------
// Cargar lista principal
// -------------------------
async function cargarInfieles(){
  const lista = document.getElementById("lista-infieles");
  lista.innerHTML = "<p style='text-align:center;padding:18px'>Cargando chismes...</p>";

  let datos;
  try{
    const res = await fetch(`${API}/infieles`);
    datos = await res.json();
  }catch(e){
    lista.innerHTML = "<p style='text-align:center;color:red'>Error al cargar</p>";
    return;
  }

  lista.innerHTML = "";
  if(!Array.isArray(datos) || datos.length===0){
    lista.innerHTML = "<p style='text-align:center;padding:18px'>No hay chismes</p>";
    return;
  }

  datos.forEach(item=>{
    const card = document.createElement("div");
    const reportero = item.reportero || "Anónimo";
    const votosReales = item.votos_reales || 0;
    const votosFalsos = item.votos_falsos || 0;
    const comentarios = item.comentarios?.length || 0;

    let thumbHTML = "";
    if(item.fotos?.length > 0){
      thumbHTML = `<img src="data:image/jpeg;base64,${item.fotos[0]}" style="width:120px;height:80px;object-fit:cover;border-radius:8px;cursor:pointer" onclick="mostrarDetallePorId(${item.id})">`;
    }

    card.className = "card";
    card.innerHTML = `
      <div class="card-header">${escapeHtml(item.nombre)} ${escapeHtml(item.apellido)}</div>
      <div class="card-body" style="display:flex;gap:12px">
        ${thumbHTML}
        <div style="flex:1">
          <p><strong>Edad:</strong> ${escapeHtml(String(item.edad||""))}</p>
          <p><strong>Ubicación:</strong> ${escapeHtml(item.ubicacion||"")}</p>
          <p><strong>Publicado por:</strong> ${escapeHtml(reportero)}</p>
          <p><strong>Historia:</strong> ${escapeHtml(truncate(item.historia,90))}</p>

          <div style="margin-top:8px;background:#f8f9fa;padding:8px;border-radius:8px;">
            ✔️ ${votosReales} &nbsp;&nbsp; ❌ ${votosFalsos} &nbsp;&nbsp; 💬 ${comentarios}
          </div>

          <button class="btn btn-azul btn-ver" data-id="${item.id}" style="margin-top:10px">Ver chisme completo</button>
        </div>
      </div>
    `;
    lista.appendChild(card);
  });

  document.querySelectorAll(".btn-ver").forEach(btn=>{
    btn.addEventListener("click", e=>{
      mostrarDetallePorId(e.target.getAttribute("data-id"));
    });
  });
}
window.cargarInfieles = cargarInfieles;

// -------------------------
// Mostrar detalle con votos y comentarios
// -------------------------
async function mostrarDetallePorId(id){
  const modal = document.getElementById("modal-chisme");
  const detalle = document.getElementById("detalle-chisme");

  modal.classList.add("active");
  detalle.innerHTML = "<p style='text-align:center;padding:18px'>Cargando...</p>";

  let datos;
  try{
    const res = await fetch(`${API}/infieles`);
    datos = await res.json();
  }catch(e){
    detalle.innerHTML = "<p style='color:red'>Error al cargar</p>";
    return;
  }

  const item = datos.find(x => Number(x.id) === Number(id));
  if(!item){ detalle.innerHTML="<p>No encontrado</p>"; return; }

  const fotos = item.fotos || [];
  let fotosHTML = "";

  if(fotos.length>0){
    fotosHTML = `<div style="display:flex;gap:8px;flex-wrap:wrap">` +
      fotos.map(f => `<img src="data:image/jpeg;base64,${f}" style="width:90px;height:70px;border-radius:8px;cursor:pointer" onclick="openImageViewer('data:image/jpeg;base64,${f}')">`).join("") +
      `</div>`;
  }

  let comentariosHTML = item.comentarios?.length
    ? item.comentarios.map(c=>{
        const fotosC = c.fotos?.map(ff=>`<img src="data:image/jpeg;base64,${ff}" style="width:100%;border-radius:8px;margin-top:8px">`).join("") || "";
        return `<div class="comentario">
          <strong>${escapeHtml(c.nombre||"Anónimo")}</strong>
          <p>${escapeHtml(c.texto)}</p>
          ${fotosC}
        </div>`;
      }).join("")
    : "<p>No hay comentarios aún</p>";

  detalle.innerHTML = `
    <h2>${item.nombre} ${item.apellido}</h2>
    <p><strong>Edad:</strong> ${item.edad}</p>
    <p><strong>Ubicación:</strong> ${item.ubicacion}</p>
    <p><strong>Publicado por:</strong> ${item.reportero||"Anónimo"}</p>
    <p style="white-space:pre-wrap">${escapeHtml(item.historia)}</p>

    ${fotosHTML}

    <div class="votos" style="margin-top:12px">
      <button id="btn-real" class="voto-btn" style="background:green">Es real (${item.votos_reales})</button>
      <button id="btn-falso" class="voto-btn" style="background:red">Es falso (${item.votos_falsos})</button>
    </div>

    <div style="margin-top:18px">
      <h3>Comentarios</h3>
      <div id="lista-comentarios">${comentariosHTML}</div>

      <h4 style="margin-top:12px">Agregar comentario</h4>
      <input id="coment-nombre" type="text" placeholder="Tu nombre (opcional)" style="width:100%;padding:10px;margin-bottom:8px">
      <textarea id="coment-texto" placeholder="Tu comentario" style="width:100%;padding:10px;min-height:80px"></textarea>
      <input id="coment-fotos" type="file" accept="image/*" multiple style="margin-top:8px">

      <button id="enviar-comentario" class="btn btn-azul" style="margin-top:10px;width:100%">Enviar comentario</button>
      <p id="coment-status" style="margin-top:10px;color:green;display:none"></p>

      <button id="cerrar-detalle" class="btn btn-rojo" style="margin-top:12px;width:100%">Cerrar</button>
    </div>
  `;

  // -------------------------
  // VOTAR SIN NOMBRE
  // -------------------------
  const yaVoto = localStorage.getItem(`voto_infiel_${id}`);

  const btnReal = document.getElementById("btn-real");
  const btnFalso = document.getElementById("btn-falso");

  if(yaVoto){
    btnReal.disabled = true;
    btnFalso.disabled = true;
  }

  btnReal.onclick = async ()=>{
    if(localStorage.getItem(`voto_infiel_${id}`)) return alert("Ya votaste");
    await enviarVoto(id,true);
  };

  btnFalso.onclick = async ()=>{
    if(localStorage.getItem(`voto_infiel_${id}`)) return alert("Ya votaste");
    await enviarVoto(id,false);
  };

  async function enviarVoto(id, votoReal){
    try{
      const r = await fetch(`${API}/votar`,{
        method:"POST",
        headers:{ "Content-Type":"application/json" },
        body:JSON.stringify({
          infiel_id:id,
          usuario:"anon", // ya no pide nombre
          voto:votoReal
        })
      });

      const j = await r.json();
      if(r.ok && j.success){
        localStorage.setItem(`voto_infiel_${id}`,"1");
        mostrarDetallePorId(id);
        cargarInfieles();
      } else alert(j.error||"Error al votar");
    }catch(e){
      alert("Error al votar");
    }
  }

  // -------------------------
  // ENVIAR COMENTARIO
  // -------------------------
  document.getElementById("enviar-comentario").onclick = async ()=>{
    const nombre = document.getElementById("coment-nombre").value || "Anónimo";
    const texto = document.getElementById("coment-texto").value;
    const archivos = document.getElementById("coment-fotos").files;
    const status = document.getElementById("coment-status");

    if(!texto.trim()) return alert("Escribe un comentario");

    const fd = new FormData();
    fd.append("infiel_id", id);
    fd.append("nombre", nombre);
    fd.append("texto", texto);
    for(let a of archivos) fd.append("fotos", a);

    try{
      const r = await fetch(`${API}/comentario`,{ method:"POST", body:fd });
      const j = await r.json();
      if(r.ok && j.success){
        status.style.display="block";
        status.textContent="Comentario enviado";

        document.getElementById("coment-nombre").value="";
        document.getElementById("coment-texto").value="";
        document.getElementById("coment-fotos").value="";

        setTimeout(()=>mostrarDetallePorId(id),600);
      } else alert(j.error||"Error al comentar");
    }catch(e){
      alert("Error al comentar");
    }
  };

  // -------------------------
  // CERRAR
  // -------------------------
  document.getElementById("cerrar-detalle").onclick = ()=>{
    modal.classList.remove("active");
  };
}

window.mostrarDetallePorId = mostrarDetallePorId;

// -------------------------
// VISOR DE IMÁGENES
// -------------------------
function openImageViewer(src){
  let v = document.getElementById("image-viewer");
  if(!v){
    v = document.createElement("div");
    v.id = "image-viewer";
    v.style = "position:fixed;inset:0;background:rgba(0,0,0,0.9);display:flex;align-items:center;justify-content:center;z-index:9999";
    v.innerHTML = `<img src="${src}" style="max-width:95%;max-height:95%;border-radius:8px">`;
    v.onclick = ()=> v.style.display="none";
    document.body.appendChild(v);
  } else {
    v.children[0].src = src;
    v.style.display="flex";
  }
}

// -------------------------
// Publicar nuevo chisme
// -------------------------
document.getElementById("form-infiel")?.addEventListener("submit", async (e)=>{
  e.preventDefault();

  const fd = new FormData();
  fd.append("reportero", document.getElementById("reportero").value);
  fd.append("nombre", document.getElementById("nombre").value);
  fd.append("apellido", document.getElementById("apellido").value);
  fd.append("edad", document.getElementById("edad").value);
  fd.append("ubicacion", document.getElementById("ubicacion").value);
  fd.append("historia", document.getElementById("historia").value);

  const archivos = document.getElementById("pruebas").files;
  for(let a of archivos) fd.append("fotos", a);

  try{
    const r = await fetch(`${API}/nuevo`,{ method:"POST", body:fd });
    const j = await r.json();
    if(r.ok && j.success){
      document.getElementById("modal-form").classList.remove("active");
      cargarInfieles();
    } else alert(j.error||"Error al publicar");
  }catch(e){
    alert("Error al publicar");
  }
});
