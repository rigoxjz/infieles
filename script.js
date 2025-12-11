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
// CARGAR
// ======================
async function cargarInfieles() {
    const res = await fetch(`${API}/infieles`);
    const datos = await res.json();

    const lista = document.getElementById("lista-infieles");
    lista.innerHTML = "";

    datos.forEach(item => {
        const card = document.createElement("div");
        card.classList.add("card");

        card.innerHTML = `
            <div class="card-header">${item.nombre} ${item.apellido}</div>
            <div class="card-body">
                <p class="info"><strong>Edad:</strong> ${item.edad}</p>
                <p class="info"><strong>Ubicación:</strong> ${item.ubicacion}</p>
                <p class="info"><strong>Historia:</strong> ${item.historia.substring(0,90)}...</p>
            </div>
        `;

        card.onclick = () => mostrarDetalle(item);
        lista.appendChild(card);
    });
}

// ======================
// MOSTRAR DETALLE
// ======================
function mostrarDetalle(item) {
    const modal = document.getElementById("modal-chisme");
    modal.classList.add("active");

    let fotosHTML = "";
    if (item.fotos && item.fotos.length > 0) {
        item.fotos.forEach(f => {
            fotosHTML += `<img src="data:image/jpeg;base64,${f}">`;
        });
    }

    document.getElementById("detalle-chisme").innerHTML = `
        <h2>${item.nombre} ${item.apellido}</h2>
        <p><strong>Edad:</strong> ${item.edad}</p>
        <p><strong>Ubicación:</strong> ${item.ubicacion}</p>
        <p>${item.historia}</p>
        <div>${fotosHTML}</div>
    `;
}

function cerrarDetalle() {
    document.getElementById("modal-chisme").classList.remove("active");
}

// ======================
// FORMULARIO
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

// LEGAL
document.getElementById("btn-legal").onclick = () => {
    document.getElementById("modal-legal").classList.add("active");
};
function cerrarLegal() {
    document.getElementById("modal-legal").classList.remove("active");
}
