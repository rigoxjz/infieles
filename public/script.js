const API = "https://infieles-v2.onrender.com";

// ======================
// CONFIRMAR EDAD
// ======================
function confirmAge(ok) {
    if (ok) {
        document.getElementById("age-modal").style.display = "none";
        document.getElementById("main-content").style.display = "block";
        cargarInfieles();
    } else {
        alert("No puedes entrar");
        window.location.href = "https://google.com";
    }
}

// ======================
// CARGAR CHISMES (LISTA PRINCIPAL)
// ======================
async function cargarInfieles() {
    const lista = document.getElementById("lista-infieles");
    lista.innerHTML = "<p style='text-align:center; padding:20px;'>Cargando chismes...</p>";

    let datos;
    try {
        const res = await fetch(`${API}/infieles`);
        datos = await res.json();
    } catch (err) {
        console.error(err);
        lista.innerHTML = "<p style='text-align:center; padding:20px; color:red;'>Error al cargar chismes</p>";
        return;
    }

    lista.innerHTML = "";

    if (!Array.isArray(datos) || datos.length === 0) {
        lista.innerHTML = "<p style='text-align:center; padding:20px;'>No hay chismes aún</p>";
        return;
    }

    datos.forEach(item => {
        const card = document.createElement("div");
        card.classList.add("card");

        const reportero = item.reportero && item.reportero.trim() !== "" ? item.reportero : "Anónimo";

        // Thumbnail HTML (si hay fotos)
        let thumbHTML = "";
        if (Array.isArray(item.fotos) && item.fotos.length > 0) {
            // usa la primera foto como miniatura
            thumbHTML = `<div style="padding:12px;text-align:center;">
                <img src="data:image/jpeg;base64,${item.fotos[0]}" style="width:120px;height:80px;object-fit:cover;border-radius:8px;cursor:pointer" 
                     alt="prueba" onclick="mostrarDetallePorId(${item.id})" />
            </div>`;
        }

        card.innerHTML = `
            <div class="card-header">${escapeHtml(item.nombre)} ${escapeHtml(item.apellido)}</div>
            <div class="card-body" style="display:flex;gap:10px;align-items:flex-start">
                ${thumbHTML}
                <div style="flex:1">
                    <p class="info"><strong>Edad:</strong> ${item.edad}</p>
                    <p class="info"><strong>Ubicación:</strong> ${escapeHtml(item.ubicacion)}</p>
                    <p class="info"><strong>Publicado por:</strong> ${escapeHtml(reportero)}</p>
                    <p class="info"><strong>Historia:</strong> ${escapeHtml(truncate(item.historia || "", 90))} 
                        <button class="btn-ver" data-id="${item.id}">Ver chisme completo</button>
                    </p>
                </div>
            </div>
        `;

        // añadir evento al botón Ver chisme (sin onclick inline para mayor seguridad)
        lista.appendChild(card);
    });

    // Attach event listeners a botones "Ver chisme completo"
    document.querySelectorAll(".btn-ver").forEach(btn => {
        btn.addEventListener("click", (e) => {
            const id = btn.getAttribute("data-id");
            mostrarDetallePorId(Number(id));
        });
    });
}

// ======================
// MOSTRAR DETALLE COMPLETO (CARGA VOTOS Y COMENTARIOS AQUÍ)
// ======================
async function mostrarDetallePorId(id) {
    // obtener datos frescos
    let datos;
    try {
        const res = await fetch(`${API}/infieles`);
        datos = await res.json();
    } catch (err) {
        console.error(err);
        alert("Error al obtener detalle");
        return;
    }

    const item = (Array.isArray(datos) && datos.find(x => Number(x.id) === Number(id))) || null;
    if (!item) {
        alert("Chisme no encontrado");
        return;
    }

    const modal = document.getElementById("modal-chisme");
    modal.classList.add("active");

    const reportero = item.reportero && item.reportero.trim() !== "" ? item.reportero : "Anónimo";

    // Fotos miniaturas en modal (clic para agrandar)
    let fotosHTML = "";
    if (Array.isArray(item.fotos) && item.fotos.length > 0) {
        fotosHTML = '<div style="display:flex;gap:8px;flex-wrap:wrap;">';
        item.fotos.forEach((f, idx) => {
            fotosHTML += `<img src="data:image/jpeg;base64,${f}" 
                                style="width:90px;height:70px;object-fit:cover;border-radius:8px;cursor:pointer"
                                alt="foto${idx}" data-full="data:image/jpeg;base64,${f}">`;
        });
        fotosHTML += "</div>";
    }

    // Comentarios (vienen desde backend via item.comentarios)
    const comentarios = Array.isArray(item.comentarios) ? item.comentarios : [];
    let comentariosHTML = comentarios.map(c => {
        const nombre = c.nombre && c.nombre.trim() !== "" ? c.nombre : "Anónimo";
        const propietarioLabel = c.propietario ? '<span style="font-weight:700;color:var(--azul)"> (Propietario)</span>' : '';
        const fotosC = Array.isArray(c.fotos) ? c.fotos.map(f => `<img src="data:image/jpeg;base64,${f}" style="width:120px;height:auto;object-fit:cover;margin-top:8px;border-radius:6px;cursor:pointer" data-full="data:image/jpeg;base64,${f}">`).join("") : "";
        return `<div class="comentario"><strong>${escapeHtml(nombre)}</strong>${propietarioLabel}:<p>${escapeHtml(c.texto)}</p>${fotosC}</div>`;
    }).join("");

    // Votos contadores (asegura números)
    const votosReales = Number(item.votos_reales || 0);
    const votosFalsos = Number(item.votos_falsos || 0);

    // construir HTML del modal
    document.getElementById("detalle-chisme").innerHTML = `
        <h2>${escapeHtml(item.nombre)} ${escapeHtml(item.apellido)}</h2>
        <p><strong>Edad:</strong> ${item.edad}</p>
        <p><strong>Ubicación:</strong> ${escapeHtml(item.ubicacion)}</p>
        <p><strong>Publicado por:</strong> ${escapeHtml(reportero)}</p>
        <p style="white-space:pre-wrap">${escapeHtml(item.historia)}</p>
        <div style="margin-top:12px">${fotosHTML}</div>

        <div style="margin-top:16px" class="votos">
            <button id="voto-real" class="voto-btn" style="background:green">Es real (${votosReales})</button>
            <button id="voto-falso" class="voto-btn" style="background:red">Es falso (${votosFalsos})</button>
        </div>

        <div class="comentarios" style="margin-top:18px">
            <h3>Comentarios</h3>
            <div id="lista-comentarios">${comentariosHTML || "<p>No hay comentarios aún</p>"}</div>

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

    // agregar listeners para ampliar imágenes (modal)
    Array.from(document.querySelectorAll('#detalle-chisme img[data-full]')).forEach(img => {
        img.addEventListener('click', () => openImageViewer(img.getAttribute('data-full')));
    });

    // manejar votos: bloqueo cliente con localStorage por chisme
    const votedReal = localStorage.getItem(`voto_real_${item.id}`);
    const votedFalso = localStorage.getItem(`voto_falso_${item.id}`);
    const btnReal = document.getElementById("voto-real");
    const btnFalso = document.getElementById("voto-falso");
    if (votedReal) btnReal.disabled = true;
    if (votedFalso) btnFalso.disabled = true;

    btnReal.addEventListener("click", async () => {
        if (localStorage.getItem(`voto_real_${item.id}`) || localStorage.getItem(`voto_falso_${item.id}`)) {
            alert("Ya votaste este chisme");
            return;
        }
        const usuario = prompt("Escribe tu nombre o nick para votar:") || "Anónimo";
        try {
            await fetch(`${API}/votar`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ infiel_id: item.id, usuario, voto: true })
            });
            localStorage.setItem(`voto_real_${item.id}`, "1");
            mostrarDetallePorId(item.id); // recarga modal con contadores actualizados
        } catch (err) {
            console.error(err);
            alert("Error al votar");
        }
    });

    btnFalso.addEventListener("click", async () => {
        if (localStorage.getItem(`voto_real_${item.id}`) || localStorage.getItem(`voto_falso_${item.id}`)) {
            alert("Ya votaste este chisme");
            return;
        }
        const usuario = prompt("Escribe tu nombre o nick para votar:") || "Anónimo";
        try {
            await fetch(`${API}/votar`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ infiel_id: item.id, usuario, voto: false })
            });
            localStorage.setItem(`voto_falso_${item.id}`, "1");
            mostrarDetallePorId(item.id);
        } catch (err) {
            console.error(err);
            alert("Error al votar");
        }
    });

    // comentarios: submit
    document.getElementById("coment-submit").addEventListener("click", async () => {
        const nombre = document.getElementById("coment-nombre-modal").value || "Anónimo";
        const texto = document.getElementById("coment-texto-modal").value;
        const archivos = document.getElementById("coment-fotos-modal").files;
        if (!texto.trim()) return alert("Escribe un comentario");

        const fd = new FormData();
        fd.append("infiel_id", item.id);
        fd.append("nombre", nombre);
        fd.append("texto", texto);
        // propietario: si quien comenta es el mismo reportero, marcar propietario=true
        const propietario = (nombre && nombre.trim() !== "" && nombre.trim() === (item.reportero || "").trim());
        fd.append("propietario", propietario);

        for (let a of archivos) fd.append("fotos", a);

        try {
            const res = await fetch(`${API}/comentario`, { method: "POST", body: fd });
            const data = await res.json();
            if (data.success) {
                // limpiar inputs y recargar modal
                document.getElementById("coment-nombre-modal").value = "";
                document.getElementById("coment-texto-modal").value = "";
                document.getElementById("coment-fotos-modal").value = "";
                mostrarDetallePorId(item.id);
            } else {
                alert("Error al publicar comentario");
            }
        } catch (err) {
            console.error(err);
            alert("Error al publicar comentario");
        }
    });

    // cerrar detalle
    document.getElementById("cerrar-detalle").addEventListener("click", () => {
        modal.classList.remove("active");
        // remove image viewer if left open
        closeImageViewer();
    });
}

// ======================
// VISOR DE IMÁGENES (fullscreen sencillo)
// ======================
function openImageViewer(src) {
    // si ya existe, reemplaza imagen
    let viewer = document.getElementById("image-viewer");
    if (!viewer) {
        viewer = document.createElement("div");
        viewer.id = "image-viewer";
        viewer.style.position = "fixed";
        viewer.style.left = 0;
        viewer.style.top = 0;
        viewer.style.width = "100%";
        viewer.style.height = "100%";
        viewer.style.background = "rgba(0,0,0,0.9)";
        viewer.style.display = "flex";
        viewer.style.alignItems = "center";
        viewer.style.justifyContent = "center";
        viewer.style.zIndex = 2000;
        viewer.style.padding = "20px";
        viewer.innerHTML = `<img id="image-viewer-img" src="${src}" style="max-width:100%; max-height:100%; border-radius:10px; box-shadow:0 6px 30px rgba(0,0,0,.6);">`;
        viewer.addEventListener("click", closeImageViewer);
        document.body.appendChild(viewer);
    } else {
        const img = document.getElementById("image-viewer-img");
        img.src = src;
        viewer.style.display = "flex";
    }
}

function closeImageViewer() {
    const viewer = document.getElementById("image-viewer");
    if (viewer) viewer.style.display = "none";
}

// ======================
// FORMULARIO NUEVO CHISME (igual flujo original)
// ======================
document.getElementById("btn-agregar").onclick = () => {
    document.getElementById("modal-form").classList.add("active");
};

function cerrarModal() {
    document.getElementById("modal-form").classList.remove("active");
}

document.getElementById("form-infiel").onsubmit = async e => {
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
        const res = await fetch(`${API}/nuevo`, { method: "POST", body: fd });
        const data = await res.json();
        if (data.success) {
            cerrarModal();
            cargarInfieles();
        } else {
            alert("Error al publicar");
        }
    } catch (err) {
        console.error(err);
        alert("Error al publicar");
    }
};

// ======================
// FILTRO DE BÚSQUEDA
// ======================
function filtrar() {
    const txt = document.getElementById("search-input").value.toLowerCase();
    const cards = document.querySelectorAll(".card");
    cards.forEach(c => {
        const t = c.innerText.toLowerCase();
        c.style.display = t.includes(txt) ? "block" : "none";
    });
}

// ======================
// LEGAL
// ======================
document.getElementById("btn-legal").onclick = () => document.getElementById("modal-legal").classList.add("active");
function cerrarLegal() { document.getElementById("modal-legal").classList.remove("active"); }

// ======================
// HELPERS
// ======================
function truncate(str, n) {
    if (!str) return "";
    return str.length > n ? str.substring(0, n) + "..." : str;
}

function escapeHtml(unsafe) {
    if (unsafe === null || unsafe === undefined) return "";
    return String(unsafe)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}

// ======================
// Iniciar: si el usuario ya confirmó edad antes, cargar
// ======================
document.addEventListener("DOMContentLoaded", () => {
    // si modal de edad fue cerrado antes (puedes persistir en localStorage si quieres)
    // aquí asumimos que se abrirá normalmente y confirmAge() lo controlará
});
