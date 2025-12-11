// public/script.js - VERSIÓN FINAL 100% FUNCIONAL (2025)
// COPIA Y PEGA TODO ESTE ARCHIVO

//const API = ""; // ← Funciona porque frontend y backend están en el mismo dominio
//const API = "";  // ← Nueva URL del backend
const API = "https://infieles-api.onrender.com";


// ============== MAYOR DE EDAD ==============
function confirmAge(ok) {
    if (ok) {
        localStorage.setItem("adult", "1");
        document.getElementById("age-modal").classList.remove("active");
        document.getElementById("main-content").style.display = "block";
        cargarLista();
    } else {
        alert("Acceso denegado");
        window.location.href = "https://google.com";
    }
}
if (localStorage.getItem("adult") === "1") {
    document.getElementById("age-modal").classList.remove("active");
    document.getElementById("main-content").style.display = "block";
}

// ============== SCROLL INFINITO + LISTA ==============
let pagina = 1;
let cargando = false;

async function cargarLista(reset = false) {
    if (cargando) return;
    cargando = true;

    if (reset) {
        document.getElementById("lista-infieles").innerHTML = "";
        pagina = 1;
    }

    try {
        const res = await fetch(`${API}/infieles?page=${pagina}&limit=20`);
        const json = await res.json();
        const lista = json.data || [];

        const cont = document.getElementById("lista-infieles");

        lista.forEach(i => {
            const fecha = new Date(i.creado_en).toLocaleDateString("es");
            const totalVotos = (i.aprobar || 0) + (i.refutar || 0) + (i.denunciar || 0);
            const porcentaje = totalVotos > 0 ? Math.round((i.aprobar || 0) / totalVotos * 100) : 0;

            cont.innerHTML += `
            <div class="card" onclick="verChisme('${i.id}')">
                <div class="card-header">
                    ${i.nombre} ${i.apellido || ''} <small>(${i.edad || '??'} años)</small>
                </div>
                <div class="card-body">
                    <p class="info"><strong>${i.ubicacion}</strong> • ${fecha}</p>
                    <p>${i.historia.substring(0, 100)}... <strong>Ver más</strong></p>
                    ${totalVotos > 0 ? `<small>✅ ${porcentaje}% aprobado (${totalVotos} votos)</small>` : ''}
                </div>
            </div>`;
        });

        pagina++;
    } catch (err) {
        console.error("Error cargando lista:", err);
    } finally {
        cargando = false;
    }
}

// Scroll infinito
window.addEventListener("scroll", () => {
    if (window.innerHeight + window.scrollY >= document.body.offsetHeight - 1000 && !cargando) {
        cargarLista();
    }
});

if (localStorage.getItem("adult") === "1") cargarLista();

// ============== VER DETALLE ==============
async function verChisme(id) {
    try {
        const res = await fetch(API + "/infieles/" + id);
        const i = await res.json();

        const total = (i.aprobar || 0) + (i.refutar || 0) + (i.denunciar || 0) || 1;
        const pA = Math.round((i.aprobar || 0) / total * 100);
        const pR = Math.round((i.refutar || 0) / total * 100);

        const galeria = i.imagenes?.length
            ? i.imagenes.map(src => `<img src="${src}" onclick="this.style.transform='scale(2.5)';this.style.zIndex='9999'" ondblclick="this.style.transform='';this.style.zIndex=''">`).join("")
            : `<p style="color:#888">Sin pruebas</p>`;

        document.getElementById("detalle-chisme").innerHTML = `
            <h2>${i.nombre} ${i.apellido || ''} <small>(${i.edad || '??'} años)</small></h2>
            <p><strong>Reportado por:</strong> ${i.reportero || 'Anónimo'}</p>
            <p><strong>Ubicación:</strong> ${i.ubicacion}</p>
            <p><small>${new Date(i.creado_en).toLocaleString("es")}</small></p>
            <hr>
            <p>${i.historia.replace(/\n/g, '<br>')}</p>
            <h3>Pruebas</h3>
            <div class="galeria">${galeria}</div>
            <h3>Votación (${total} votos)</h3>
            <div class="votos">
                <button class="voto-btn" style="background:#28a745" onclick="votar('${id}','aprobar')">${pA}% Aprobar</button>
                <button class="voto-btn" style="background:#dc3545" onclick="votar('${id}','refutar')">${pR}% Refutar</button>
            </div>
        `;
        document.getElementById("modal-chisme").classList.add("active");
    } catch (err) {
        alert("Error al cargar detalle");
    }
}

async function votar(id, tipo) {
    await fetch(API + "/votar/" + id, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tipo })
    });
    verChisme(id);
}

// ============== PUBLICAR CHISME (FUNCIONA 100%) ==============
document.getElementById("form-infiel").addEventListener("submit", async e => {
    e.preventDefault();

    const form = e.target;
    const files = form.pruebas.files;
    let imagenes = [];

    for (const f of files) {
        imagenes.push(await fileToBase64(f));
    }

    try {
        const response = await fetch(API + "/infieles", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                reportero: form.reportero.value.trim() || "Anónimo",
                nombre: form.nombre.value.trim(),
                apellido: form.apellido.value.trim(),
                edad: parseInt(form.edad.value),
                ubicacion: form.ubicacion.value.trim(),
                historia: form.historia.value.trim(),
                imagenes
            })
        });

        if (!response.ok) {
            const err = await response.text();
            throw new Error(err || "Error del servidor");
        }

        alert("¡CHISME PUBLICADO EXITOSAMENTE!");
        cerrarModal();
        form.reset();
        cargarLista(true); // ← ESTO HACE QUE APAREZCA ARRIBA AL INSTANTE

    } catch (err) {
        console.error("Error:", err);
        alert("Error al publicar: " + err.message);
    }
});

function fileToBase64(file) {
    return new Promise((res, rej) => {
        const reader = new FileReader();
        reader.onload = () => res(reader.result);
        reader.onerror = rej;
        reader.readAsDataURL(file);
    });
}

// ============== MODALES ==============
document.getElementById("btn-agregar").onclick = () => document.getElementById("modal-form").classList.add("active");
document.getElementById("btn-legal").onclick = () => document.getElementById("modal-legal").classList.add("active");

function cerrarModal() {
    document.querySelectorAll(".modal").forEach(m => m.classList.remove("active"));
}
function cerrarDetalle() {
    document.getElementById("modal-chisme").classList.remove("active");
}
function cerrarLegal() {
    document.getElementById("modal-legal").classList.remove("active");
}
