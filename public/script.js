// ================================
// CONFIG
// ================================
const API = "https://infieles-v2.onrender.com";

// ================================
// MAYOR DE EDAD
// ================================
function confirmAge(ok) {
    if (ok) {
        document.getElementById("agePopup").style.display = "none";
    } else {
        window.location.href = "https://google.com";
    }
}

// ================================
// CARGAR LISTA DE INFIELES
// ================================
async function cargarInfieles() {
    const cont = document.getElementById("listaInfieles");
    cont.innerHTML = "<p>Cargando...</p>";

    try {
        const res = await fetch(API + "/infieles");
        const data = await res.json();

        cont.innerHTML = "";

        data.forEach(infiel => {
            const card = document.createElement("div");
            card.className = "card";

            // Foto pequeña
            let fotoMini = "";
            if (infiel.fotos.length > 0) {
                fotoMini = `
                    <img src="data:image/jpeg;base64,${infiel.fotos[0]}" 
                         class="foto-mini"
                         onclick="verImagen('${infiel.fotos[0]}')">
                `;
            }

            card.innerHTML = `
                ${fotoMini}
                <h3>${infiel.nombre || "Anónimo"} ${infiel.apellido || ""}</h3>
                <p><b>Ubicación:</b> ${infiel.ubicacion}</p>

                <button onclick="verChisme(${infiel.id})" class="btn-ver">
                    Ver chisme completo
                </button>

                <div class="contador">
                    👍 ${infiel.votos_reales}  
                    👎 ${infiel.votos_falsos}
                </div>
            `;
            cont.appendChild(card);
        });

    } catch (e) {
        cont.innerHTML = "<p>Error al cargar.</p>";
    }
}

// ================================
// VER IMAGEN COMPLETA
// ================================
function verImagen(base64) {
    const visor = document.getElementById("visorImg");
    const img = document.getElementById("visorImgTag");

    img.src = "data:image/jpeg;base64," + base64;
    visor.style.display = "flex";
}

function cerrarVisor() {
    document.getElementById("visorImg").style.display = "none";
}

// ================================
// VER CHISME COMPLETO
// ================================
async function verChisme(id) {
    const res = await fetch(API + "/infieles");
    const lista = await res.json();
    const data = lista.find(x => x.id === id);

    const modal = document.getElementById("modalChisme");
    const contenido = document.getElementById("modalContenido");

    let fotosHTML = "";
    data.fotos.forEach(f => {
        fotosHTML += `
            <img src="data:image/jpeg;base64,${f}" 
                 class="foto-mini" 
                 onclick="verImagen('${f}')">
        `;
    });

    let comentariosHTML = "";
    data.comentarios.forEach(c => {
        comentariosHTML += `
            <div class="comentario">
                <b>${c.nombre}</b>: ${c.texto}
            </div>
        `;
    });

    contenido.innerHTML = `
        <h2>${data.nombre || "Anónimo"} ${data.apellido}</h2>
        <p><b>Historia:</b> ${data.historia}</p>
        
        <h3>Pruebas</h3>
        <div class="fotos">${fotosHTML}</div>

        <h3>Votos</h3>
        <div class="contador">
            👍 ${data.votos_reales}  
            👎 ${data.votos_falsos}
        </div>

        <button class="btn-voto" onclick="votar(${id}, true)">👍 Es real</button>
        <button class="btn-voto" onclick="votar(${id}, false)">👎 Es falso</button>

        <h3>Comentarios</h3>
        ${comentariosHTML}

        <textarea id="comentarioTxt" placeholder="Escribe tu comentario..."></textarea>
        <button class="btn-enviar" onclick="enviarComentario(${id})">Enviar comentario</button>
    `;

    modal.style.display = "flex";
}

function cerrarChisme() {
    document.getElementById("modalChisme").style.display = "none";
}

// ================================
// VOTAR (Sin nombre, una vez por usuario)
// ================================
async function votar(id, voto) {
    const key = "voto_" + id;

    if (localStorage.getItem(key)) {
        alert("Ya votaste este chisme.");
        return;
    }

    try {
        await fetch(API + "/votar", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                infiel_id: id,
                usuario: key,  // identificador interno local
                voto
            })
        });

        localStorage.setItem(key, "1");
        alert("Voto registrado.");
        cargarInfieles();
        cerrarChisme();

    } catch (e) {
        alert("Error al votar");
    }
}

// ================================
// ENVIAR COMENTARIO
// ================================
async function enviarComentario(id) {
    const txt = document.getElementById("comentarioTxt").value.trim();
    if (txt === "") return alert("Escribe algo");

    try {
        await fetch(API + "/comentario", {
            method: "POST",
            body: new FormData(Object.assign(document.createElement("form"), {
                infiel_id: id,
                texto: txt,
                nombre: "Anónimo"
            }))
        });

        alert("Comentario enviado");
        verChisme(id); // Recargar chisme sin cerrar

    } catch (e) {
        alert("Error al comentar");
    }
}

// ================================
// INICIO
// ================================
document.addEventListener("DOMContentLoaded", cargarInfieles);
