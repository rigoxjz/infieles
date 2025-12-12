// ================================
//   CONFIG API
// ================================
const API = "https://infieles-v2.onrender.com";

// DOM
const lista = document.getElementById("lista");
const modal = document.getElementById("modal");
const modalBody = document.getElementById("modal-body");
const modalClose = document.getElementById("modal-close");

modalClose.onclick = () => modal.style.display = "none";


// ======================================================
//  FUNCIONES AUXILIARES
// ======================================================
function esHoy(fecha) {
    const hoy = new Date();
    const f = new Date(fecha);
    return (
        f.getFullYear() === hoy.getFullYear() &&
        f.getMonth() === hoy.getMonth() &&
        f.getDate() === hoy.getDate()
    );
}

function escapeHtml(text) {
    return text.replace(/[&<>"']/g, m => ({
        "&": "&amp;", "<": "&lt;", ">": "&gt;",
        '"': "&quot;", "'": "&#039;"
    })[m]);
}

function truncate(text, max = 90) {
    return text.length > max ? text.substring(0, max) + "..." : text;
}


// ======================================================
//   CARGAR CHISMES
// ======================================================
async function cargarChismes() {
    lista.innerHTML = `<h3 style="text-align:center;margin-top:20px;">Cargando chismes...</h3>`;

    try {
        const res = await fetch(`${API}/api/chismes`);
        const datos = await res.json();

        lista.innerHTML = "";

        datos.forEach(item => {

            const card = document.createElement("div");
            card.classList.add("card");
            card.style.opacity = "0";
            setTimeout(() => card.style.opacity = "1", 50);

            const reportero = item.reportero?.trim() !== "" ? item.reportero : "Anónimo";
            const etiquetaNuevo = esHoy(item.fecha_publicacion)
                ? `<span style="background:#28a745;color:white;padding:3px 6px;border-radius:6px;font-size:0.75em;font-weight:bold;margin-left:8px;">NUEVO</span>`
                : "";

            let thumbHTML = "";
            if (item.fotos?.length > 0) {
                thumbHTML = `
                    <div style="text-align:center;margin-bottom:10px;">
                        <img src="data:image/jpeg;base64,${item.fotos[0]}"
                             style="width:120px;height:85px;object-fit:cover;border-radius:8px;cursor:pointer"
                             onclick="mostrarChisme(${item.id})">
                    </div>`;
            }

            card.innerHTML = `
                <div class="card-header">
                    ${escapeHtml(item.nombre)} ${escapeHtml(item.apellido)} ${etiquetaNuevo}
                </div>

                <div class="card-body">
                    
                    ${thumbHTML}

                    <p><strong>Edad:</strong> ${item.edad}</p>
                    <p><strong>Ubicación:</strong> ${escapeHtml(item.ubicacion)}</p>
                    <p><strong>Publicado por:</strong> ${escapeHtml(reportero)}</p>

                    <p><strong>Historia:</strong> ${escapeHtml(truncate(item.historia))}</p>

                    <div style="background:#f1f1f1;padding:10px;border-radius:8px;margin-top:10px;">
                        ✔️ Reales: <strong>${item.votos_reales || 0}</strong><br>
                        ❌ Falsos: <strong>${item.votos_falsos || 0}</strong><br><br>
                        💬 <strong>${item.total_comentarios || 0}</strong> comentarios
                    </div>

                    <button onclick="mostrarChisme(${item.id})"
                        style="width:100%;padding:12px;border:none;background:#007bff;color:white;border-radius:10px;font-weight:bold;margin-top:12px;cursor:pointer;transition:0.25s"
                        onmouseover="this.style.transform='scale(1.03)'"
                        onmouseout="this.style.transform='scale(1)'">
                        Ver chisme completo
                    </button>

                </div>
            `;

            lista.appendChild(card);
        });

    } catch (err) {
        lista.innerHTML = `<p style="color:red;text-align:center;">Error al cargar chismes</p>`;
    }
}

cargarChismes();


// ======================================================
//   MOSTRAR CHISME COMPLETO
// ======================================================
async function mostrarChisme(id) {
    modal.style.display = "flex";
    modalBody.innerHTML = `<h3>Cargando...</h3>`;

    const res = await fetch(`${API}/api/chisme/${id}`);
    const item = await res.json();

    const reportero = item.reportero?.trim() !== "" ? item.reportero : "Anónimo";
    
    let fotosHTML = "";
    if (item.fotos?.length > 0) {
        item.fotos.forEach(f => {
            fotosHTML += `
                <img src="data:image/jpeg;base64,${f}"
                    style="width:100%;max-height:350px;object-fit:contain;margin-top:10px;border-radius:10px;">
            `;
        });
    }

    // ======== Comentarios ========
    let comentariosHTML = "";
    item.comentarios.forEach(c => {
        const autor = c.autor?.trim() !== "" ? c.autor : "Anónimo";
        comentariosHTML += `
            <div style="background:#eee;padding:10px;border-radius:8px;margin-top:8px;">
                <strong>${autor}${c.es_propietario ? " (Propietario)" : ""}:</strong><br>
                ${escapeHtml(c.texto)}
            </div>
        `;
    });

    modalBody.innerHTML = `
        <h2>${escapeHtml(item.nombre)} ${escapeHtml(item.apellido)}</h2>

        <p><strong>Edad:</strong> ${item.edad}</p>
        <p><strong>Ubicación:</strong> ${escapeHtml(item.ubicacion)}</p>
        <p><strong>Publicado por:</strong> ${escapeHtml(reportero)}</p>

        <p style="margin-top:10px;"><strong>Historia completa:</strong><br>${escapeHtml(item.historia)}</p>

        ${fotosHTML}

        <hr>

        <h3>Votaciones</h3>
        <p>✔️ Reales: <strong>${item.votos_reales}</strong></p>
        <p>❌ Falsos: <strong>${item.votos_falsos}</strong></p>

        <button onclick="votar(${item.id}, 'real')" class="btn-voto">Es real</button>
        <button onclick="votar(${item.id}, 'falso')" class="btn-voto btn-falso">Es falso</button>

        <hr>

        <h3>Comentarios</h3>
        ${comentariosHTML}

        <textarea id="comentarioTexto" placeholder="Escribe un comentario..." style="width:100%;height:80px;border-radius:10px;padding:10px;"></textarea>
        <input id="comentarioNombre" placeholder="Tu nombre (opcional)" style="width:100%;margin-top:8px;padding:10px;border-radius:10px">

        <button onclick="enviarComentario(${item.id})"
            style="width:100%;padding:12px;background:#28a745;color:white;border:none;border-radius:10px;font-weight:bold;margin-top:10px;">
            Comentar
        </button>
    `;
}


// ======================================================
//   VOTAR
// ======================================================
async function votar(id, tipo) {
    if (localStorage.getItem(`voto_${id}`)) {
        alert("Ya votaste este chisme.");
        return;
    }

    await fetch(`${API}/api/votar/${id}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tipo })
    });

    localStorage.setItem(`voto_${id}`, "1");

    mostrarChisme(id);
    cargarChismes();
}


// ======================================================
//   COMENTAR
// ======================================================
async function enviarComentario(id) {
    const texto = document.getElementById("comentarioTexto").value.trim();
    if (!texto) return alert("Escribe un comentario.");

    const autor = document.getElementById("comentarioNombre").value.trim();

    await fetch(`${API}/api/comentar/${id}`, {
        method: "POST",
        headers: { "Content-Type": "application/json"},
        body: JSON.stringify({ texto, autor })
    });

    mostrarChisme(id);
    cargarChismes();
}
