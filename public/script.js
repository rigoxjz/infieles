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
// CARGAR INFIELES
// ======================
async function cargarInfieles() {
    const lista = document.getElementById("lista-infieles");
    lista.innerHTML = `<p style="text-align:center;padding:20px;">Cargando chismes...</p>`;

    try {
        const res = await fetch(`${API}/infieles`);
        const datos = await res.json();

        lista.innerHTML = ""; // limpiar loading

        if (!datos.length) {
            lista.innerHTML = `<p style="text-align:center;padding:20px;">No hay chismes aún</p>`;
            return;
        }

        datos.forEach(item => {
            const card = document.createElement("div");
            card.classList.add("card");

            const votoReal = localStorage.getItem(`voto_real_${item.id}`) ? "disabled" : "";
            const votoFalso = localStorage.getItem(`voto_falso_${item.id}`) ? "disabled" : "";

            card.innerHTML = `
                <div class="card-header">${item.nombre} ${item.apellido}</div>
                <div class="card-body">
                    <p class="info"><strong>Edad:</strong> ${item.edad}</p>
                    <p class="info"><strong>Ubicación:</strong> ${item.ubicacion}</p>
                    <p class="info"><strong>Historia:</strong> ${item.historia.substring(0,90)}...</p>
                    <button class="btn btn-azul btn-ver">Ver chisme completo</button>
                </div>
            `;

            card.querySelector(".btn-ver").onclick = e => {
                e.stopPropagation();
                mostrarDetalle(item);
            };

            lista.appendChild(card);
        });
    } catch (err) {
        lista.innerHTML = `<p style="text-align:center;padding:20px;color:red;">Error al cargar chismes</p>`;
        console.error(err);
    }
}

// ======================
// MOSTRAR DETALLE
// ======================
function mostrarDetalle(item) {
    const modal = document.getElementById("modal-chisme");
    modal.classList.add("active");

    // Fotos chisme
    let fotosHTML = "";
    if (item.fotos && item.fotos.length > 0) {
        item.fotos.forEach(f => {
            fotosHTML += `<img src="data:image/jpeg;base64,${f}" style="max-width:100%;height:auto;margin:10px 0;">`;
        });
    }

    // Comentarios
    let comentariosHTML = "";
    if (item.comentarios && item.comentarios.length > 0) {
        item.comentarios.forEach(c => {
            let fotosC = "";
            if (c.fotos) c.fotos.forEach(f => fotosC += `<img src="data:image/jpeg;base64,${f}">`);
            comentariosHTML += `
                <div class="comentario">
                    <strong>${c.nombre}</strong> ${c.propietario ? "(Propietario)" : ""}:
                    <p>${c.texto}</p>
                    <div>${fotosC}</div>
                </div>
            `;
        });
    }

    document.getElementById("detalle-chisme").innerHTML = `
        <h2>${item.nombre} ${item.apellido}</h2>
        <p><strong>Edad:</strong> ${item.edad}</p>
        <p><strong>Ubicación:</strong> ${item.ubicacion}</p>
        <p>${item.historia}</p>
        <div>${fotosHTML}</div>
        <div class="votos">
            <button class="voto-btn" style="background:green;" onclick="votar(${item.id}, true)" ${localStorage.getItem(`voto_real_${item.id}`) ? "disabled" : ""}>Es real</button>
            <button class="voto-btn" style="background:red;" onclick="votar(${item.id}, false)" ${localStorage.getItem(`voto_falso_${item.id}`) ? "disabled" : ""}>Es falso</button>
        </div>
        <div class="comentarios">
            ${comentariosHTML}
            <h3>Agregar comentario</h3>
            <input type="text" id="coment-nombre" placeholder="Nombre (opcional)">
            <textarea id="coment-texto" placeholder="Tu comentario"></textarea>
            <input type="file" id="coment-fotos" accept="image/*" multiple>
            <button class="btn btn-azul" onclick="agregarComentario(${item.id})">Comentar</button>
        </div>
    `;
}

function cerrarDetalle() {
    document.getElementById("modal-chisme").classList.remove("active");
}

// ======================
// VOTAR
// ======================
async function votar(id, real) {
    try {
        // Aquí puedes agregar endpoint para guardar voto en DB si quieres
        if (real) localStorage.setItem(`voto_real_${id}`, true);
        else localStorage.setItem(`voto_falso_${id}`, true);
        alert("Gracias por tu voto");
    } catch (err) {
        console.error(err);
        alert("Error al votar");
    }
}

// ======================
// AGREGAR COMENTARIO
// ======================
async function agregarComentario(id) {
    const nombre = document.getElementById("coment-nombre").value || "Anónimo";
    const texto = document.getElementById("coment-texto").value;
    const archivos = document.getElementById("coment-fotos").files;

    if (!texto) return alert("Escribe un comentario");

    const fotos = [];
    for (let a of archivos) {
        const base64 = await fileToBase64(a);
        fotos.push(base64);
    }

    // Aquí puedes guardar comentario en DB, por ahora lo agregamos solo visual
    const divComentarios = document.querySelector(".comentarios");
    let fotosHTML = "";
    fotos.forEach(f => fotosHTML += `<img src="data:image/jpeg;base64,${f}">`);
    divComentarios.innerHTML += `
        <div class="comentario">
            <strong>${nombre}</strong>: <p>${texto}</p>
            <div>${fotosHTML}</div>
        </div>
    `;

    document.getElementById("coment-nombre").value = "";
    document.getElementById("coment-texto").value = "";
    document.getElementById("coment-fotos").value = "";
}

// ======================
// UTILS
// ======================
function fileToBase64(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = () => resolve(reader.result.split(",")[1]);
        reader.onerror = error => reject(error);
    });
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
