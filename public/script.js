// script.js - VERSIÓN FINAL 2025 (copia y pega todo)
//const API = "https://infieles-sya9.onrender.com";
const API = "https://infieles-api.onrender.com"; // ← tu nueva URL

// MAYOR DE EDAD
function confirmAge(ok){
    if(ok){
        localStorage.setItem("adult", "1");
        document.getElementById("age-modal").classList.remove("active");
        document.getElementById("main-content").style.display = "block";
        cargarLista(); // recarga al entrar
    } else {
        alert("Acceso denegado");
        window.location.href = "https://google.com";
    }
}
if(localStorage.getItem("adult") === "1"){
    document.getElementById("age-modal").classList.remove("active");
    document.getElementById("main-content").style.display = "block";
}

// LISTA CON SCROLL INFINITO
let pagina = 1;
let cargando = false;

async function cargarLista(reset = false){
    if(cargando) return;
    cargando = true;
    if(reset) {
        document.getElementById("lista-infieles").innerHTML = "";
        pagina = 1;
    }

    const res = await fetch(`${API}/infieles?page=${pagina}&limit=20`);
    const data = await res.json();
    const lista = data.data; // ← AHORA SÍ FUNCIONA CON TU NUEVO BACKEND

    const cont = document.getElementById("lista-infieles");
    lista.forEach(i => {
        const fecha = new Date(i.creado_en).toLocaleDateString("es");
        cont.innerHTML += `
        <div class="card" onclick="verChisme('${i.id}')">
            <div class="card-header">${i.nombre} ${i.apellido || ''} (${i.edad || '??'} años)</div>
            <div class="card-body">
                <p class="info"><strong>${i.ubicacion}</strong> • ${fecha}</p>
                <p>${i.historia.substring(0,100)}... <strong>Ver más</strong></p>
            </div>
        </div>`;
    });

    pagina++;
    cargando = false;
}

// Scroll infinito
window.addEventListener("scroll", () => {
    if(window.innerHeight + window.scrollY >= document.body.offsetHeight - 1000) {
        cargarLista();
    }
});

// Cargar primera página
if(localStorage.getItem("adult") === "1") cargarLista();

// VER DETALLE (igual pero mejor)
async function verChisme(id){
    const res = await fetch(API + "/infieles/" + id);
    const i = await res.json();
    if(!i.votos) i.votos = {aprobar:0,refutar:0,denunciar:0};

    const total = i.votos.aprobar + i.votos.refutar + i.votos.denunciar || 1;
    const pA = Math.round((i.votos.aprobar/total)*100);
    const pR = Math.round((i.votos.refutar/total)*100);

    const galeria = i.imagenes?.length 
        ? i.imagenes.map(src=>`<img src="${src}" onclick="this.style.transform='scale(2)';this.style.zIndex='9999'" ondblclick="this.style.transform=''">`).join("")
        : `<p style="color:#888">Sin pruebas</p>`;

    document.getElementById("detalle-chisme").innerHTML = `
        <h2>${i.nombre} ${i.apellido || ''} <small>(${i.edad || '??'} años)</small></h2>
        <p><strong>Reportado por:</strong> ${i.reportero || 'Anónimo'}</p>
        <p><strong>Ubicación:</strong> ${i.ubicacion}</p>
        <p><small>${new Date(i.creado_en).toLocaleString("es")}</small></p>
        <hr>
        <p>${i.historia.replace(/\n/g,'<br>')}</p>
        <h3>Pruebas</h3>
        <div class="galeria">${galeria}</div>
        <h3>Votación (${total} votos)</h3>
        <div class="votos">
            <button class="voto-btn" style="background:#28a745" onclick="votar('${id}','aprobar')">${pA}% Aprobar</button>
            <button class="voto-btn" style="background:#dc3545" onclick="votar('${id}','refutar')">${pR}% Refutar</button>
        </div>
    `;
    document.getElementById("modal-chisme").classList.add("active");
}

async function votar(id,tipo){
    await fetch(API + "/votar/" + id, {
        method:"POST",
        headers:{"Content-Type":"application/json"},
        body:JSON.stringify({tipo})
    });
    verChisme(id);
}

// FORMULARIO (igual pero con edad)
document.getElementById("form-infiel").addEventListener("submit", async e=>{
    e.preventDefault();
    const form = e.target;
    const files = form.pruebas.files;
    let imagenes = [];
    for(const f of files){
        imagenes.push(await fileToBase64(f));
    }

    await fetch(API + "/infieles", {
        method:"POST",
        headers:{"Content-Type":"application/json"},
        body:JSON.stringify({
            reportero: form.reportero.value || "Anónimo",
            nombre: form.nombre.value,
            apellido: form.apellido.value,
            edad: form.edad.value,
            ubicacion: form.ubicacion.value,
            historia: form.historia.value,
            imagenes
        })
    });

    alert("¡Chisme publicado!");
    cerrarModal();
    cargarLista(true);
});

function fileToBase64(file){
    return new Promise((res,rej)=>{
        const reader = new FileReader();
        reader.onload = ()=>res(reader.result);
        reader.onerror = rej;
        reader.readAsDataURL(file);
    });
}

// Modales
document.getElementById("btn-agregar").onclick = ()=>document.getElementById("modal-form").classList.add("active");
document.getElementById("btn-legal").onclick = ()=>document.getElementById("modal-legal").classList.add("active");
function cerrarModal(){ document.querySelectorAll(".modal").forEach(m=>m.classList.remove("active")); }
