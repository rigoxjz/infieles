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

// =======================
// SERVIR CARPETA PUBLIC
// =======================
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
app.use(express.static(path.join(__dirname, "public")));

// Al acceder a /, devuelve index.html
app.get("/", (req, res) => {
    res.sendFile(path.join(__dirname, "public", "index.html"));
});

// ======================
// CARGAR CHISMES
// ======================
async function cargarInfieles() {
    const lista = document.getElementById("lista-infieles");
    lista.innerHTML = "<p style='text-align:center; padding:20px;'>Cargando chismes...</p>";

    const res = await fetch(`${API}/infieles`);
    const datos = await res.json();

    lista.innerHTML = "";

    if (datos.length === 0) {
        lista.innerHTML = "<p style='text-align:center; padding:20px;'>No hay chismes aún</p>";
        return;
    }

    datos.forEach(item => {
        const card = document.createElement("div");
        card.classList.add("card");

        // Asegurarse que reportero nunca esté vacío
        const reportero = item.reportero && item.reportero.trim() !== "" ? item.reportero : "Anónimo";

        card.innerHTML = `
            <div class="card-header">${item.nombre} ${item.apellido}</div>
            <div class="card-body">
                <p class="info"><strong>Edad:</strong> ${item.edad}</p>
                <p class="info"><strong>Ubicación:</strong> ${item.ubicacion}</p>
                <p class="info"><strong>Publicado por:</strong> ${reportero}</p>
                <p class="info"><strong>Historia:</strong> ${item.historia.substring(0, 90)}... 
                    <button onclick="mostrarDetallePorId(${item.id})">Ver chisme completo</button>
                </p>
                <div class="votos">
                    <button class="voto-btn" style="background:green" onclick="votar(${item.id}, true)">Es real (${item.votos_reales || 0})</button>
                    <button class="voto-btn" style="background:red" onclick="votar(${item.id}, false)">Es falso (${item.votos_falsos || 0})</button>
                </div>
                <div class="comentarios" id="comentarios-${item.id}">
                    ${item.comentarios.map(c => `
                        <div class="comentario">
                            <strong>${c.propietario ? "Propietario" : c.nombre || "Anónimo"}:</strong> ${c.texto}
                            ${c.fotos ? c.fotos.map(f => `<img src="data:image/jpeg;base64,${f}" style="width:100%;height:auto;margin:5px 0;">`).join("") : ""}
                        </div>
                    `).join("")}
                </div>
                <div style="margin-top:10px">
                    <input type="text" placeholder="Tu nombre (opcional)" id="coment-nombre-${item.id}" style="width:48%; margin-right:4%">
                    <input type="text" placeholder="Comentario" id="coment-texto-${item.id}" style="width:48%">
                    <input type="file" id="coment-fotos-${item.id}" multiple style="margin-top:5px">
                    <button class="btn btn-azul" style="margin-top:5px" onclick="agregarComentario(${item.id})">Comentar</button>
                </div>
            </div>
        `;
        lista.appendChild(card);
    });
}

// ======================
// MOSTRAR DETALLE COMPLETO
// ======================
async function mostrarDetallePorId(id) {
    const res = await fetch(`${API}/infieles`);
    const datos = await res.json();
    const item = datos.find(x => x.id === id);

    const modal = document.getElementById("modal-chisme");
    modal.classList.add("active");

    const reportero = item.reportero && item.reportero.trim() !== "" ? item.reportero : "Anónimo";

    let fotosHTML = "";
    if (item.fotos && item.fotos.length > 0) {
        item.fotos.forEach(f => {
            fotosHTML += `<img src="data:image/jpeg;base64,${f}" style="width:100%;height:auto;margin:5px 0;">`;
        });
    }

    document.getElementById("detalle-chisme").innerHTML = `
        <h2>${item.nombre} ${item.apellido}</h2>
        <p><strong>Edad:</strong> ${item.edad}</p>
        <p><strong>Ubicación:</strong> ${item.ubicacion}</p>
        <p><strong>Publicado por:</strong> ${reportero}</p>
        <p>${item.historia}</p>
        <div>${fotosHTML}</div>
    `;
}

function cerrarDetalle() {
    document.getElementById("modal-chisme").classList.remove("active");
}

// ======================
// FORMULARIO NUEVO CHISME
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

    const res = await fetch(`${API}/nuevo`, { method: "POST", body: fd });
    const data = await res.json();

    if (data.success) {
        cerrarModal();
        cargarInfieles();
    } else {
        alert("Error al publicar");
    }
};

// ======================
// VOTAR
// ======================
async function votar(id, real) {
    const usuario = prompt("Escribe tu nombre o nick para votar:") || "Anónimo";
    try {
        await fetch(`${API}/votar`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ infiel_id: id, usuario, voto: real })
        });
        cargarInfieles();
    } catch (err) {
        console.error(err);
        alert("Error al votar");
    }
}

// ======================
// COMENTARIOS
// ======================
async function agregarComentario(id) {
    const nombre = document.getElementById(`coment-nombre-${id}`).value || "Anónimo";
    const texto = document.getElementById(`coment-texto-${id}`).value;
    const archivos = document.getElementById(`coment-fotos-${id}`).files;

    if (!texto) return alert("Escribe un comentario");

    const fd = new FormData();
    fd.append("infiel_id", id);
    fd.append("nombre", nombre);
    fd.append("texto", texto);
    fd.append("propietario", false);

    for (let a of archivos) fd.append("fotos", a);

    const res = await fetch(`${API}/comentario`, { method: "POST", body: fd });
    const data = await res.json();

    if (data.success) {
        document.getElementById(`coment-nombre-${id}`).value = "";
        document.getElementById(`coment-texto-${id}`).value = "";
        document.getElementById(`coment-fotos-${id}`).value = "";
        cargarInfieles();
    } else {
        alert("Error al comentar");
    }
}

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
document.getElementById("btn-legal").onclick = () => {
    document.getElementById("modal-legal").classList.add("active");
};
function cerrarLegal() {
    document.getElementById("modal-legal").classList.remove("active");
}
