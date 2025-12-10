// CONFIG API
const API = "https://infieles-sya9.onrender.com";

// ========================
// MAYOR DE EDAD
// ========================
function confirmAge(ok){
    if(ok){
        localStorage.setItem("adult", "1");
        document.getElementById("age-modal").classList.remove("active");
        document.getElementById("main-content").style.display = "block";
    } else {
        alert("No puedes entrar");
    }
}

if(localStorage.getItem("adult") === "1"){
    document.getElementById("age-modal").classList.remove("active");
    document.getElementById("main-content").style.display = "block";
}

// ========================
// LISTA PRINCIPAL
// ========================
async function cargarLista(){
    const res = await fetch(API + "/infieles");
    const lista = await res.json();
    const cont = document.getElementById("lista-infieles");

    cont.innerHTML = "";

    lista.forEach(i=>{
        cont.innerHTML += `
        <div class="card" onclick="verChisme('${i.id}')">
            <div class="card-header">${i.nombre} ${i.apellido}</div>
            <div class="card-body">
                <p class="info"><strong>Ubicación:</strong> ${i.ubicacion}</p>
                <p>${i.historia.substring(0,80)}... <strong>Ver más</strong></p>
            </div>
        </div>`;
    });
}

cargarLista();

// ========================
// VER DETALLE
// ========================
async function verChisme(id){
    const res = await fetch(API + "/infieles/" + id);
    const i = await res.json();

    if(!i.votos){ i.votos = {aprobar:0,refutar:0,denunciar:0}; }

    const total = (i.votos.aprobar + i.votos.refutar + i.votos.denunciar) || 1;
    const pA = Math.round((i.votos.aprobar/total)*100);
    const pR = Math.round((i.votos.refutar/total)*100);
    const pD = Math.round((i.votos.denunciar/total)*100);

    const galeria = i.imagenes?.length
        ? i.imagenes.map(src=>`<img src="${src}">`).join("")
        : `<p style="color:#888">Sin pruebas iniciales</p>`;

    document.getElementById("detalle-chisme").innerHTML = `
        <h2>${i.nombre} ${i.apellido}</h2>

        <p><strong>Reportado por:</strong> ${i.reportero}</p>
        <p><strong>Ubicación:</strong> ${i.ubicacion}</p>

        <hr>

        <p>${i.historia.replace(/\n/g,'<br>')}</p>

        <h3>Pruebas Iniciales</h3>
        <div class="galeria">${galeria}</div>

        <h3>Votación del Caso</h3>

        <div class="votos">
            <button class="voto-btn" style="background:#28a745" onclick="votar('${id}','aprobar')">Aprobar</button>
            <button class="voto-btn" style="background:#dc3545" onclick="votar('${id}','refutar')">Refutar</button>
            <button class="voto-btn" style="background:#fd7e14" onclick="votar('${id}','denunciar')">Denunciar</button>
        </div>

        <p>✔️ Aprobado: ${pA}%</p>
        <p>❌ Refutado: ${pR}%</p>
        <p>⚠️ Denunciado: ${pD}%</p>
    `;

    document.getElementById("modal-chisme").classList.add("active");
}

// ========================
// VOTAR
// ========================
async function votar(id,tipo){
    await fetch(API + "/votar/" + id,{
        method:"POST",
        headers:{"Content-Type":"application/json"},
        body:JSON.stringify({tipo})
    });

    verChisme(id);
}

// ========================
// PUBLICAR INFIEL
// ========================
document.getElementById("form-infiel").addEventListener("submit", async e=>{
    e.preventDefault();

    const reportero = document.getElementById("reportero").value || "Anónimo";
    const nombre = document.getElementById("nombre").value;
    const apellido = document.getElementById("apellido").value;
    const edad = document.getElementById("edad").value;
    const ubicacion = document.getElementById("ubicacion").value;
    const historia = document.getElementById("historia").value;
    const files = document.getElementById("pruebas").files;

    // Convertir imágenes a Base64
    let imagenes = [];
    for(const f of files){
        imagenes.push(await fileToBase64(f));
    }

    const body = {
        nombre, apellido, ubicacion,
        historia, imagenes,
        reportero
    };

    await fetch(API + "/infieles",{
        method:"POST",
        headers:{"Content-Type":"application/json"},
        body:JSON.stringify(body)
    });

    alert("Chisme publicado correctamente");
    cerrarModal();
    cargarLista();
});

function fileToBase64(file){
    return new Promise((res)=>{
        const reader = new FileReader();
        reader.onload = ()=>res(reader.result);
        reader.readAsDataURL(file);
    });
}

// ========================
//MODALES
// ========================
document.getElementById("btn-agregar").onclick = ()=>{ 
    document.getElementById("modal-form").classList.add("active");
};
document.getElementById("btn-legal").onclick = ()=>{ 
    document.getElementById("modal-legal").classList.add("active");
};

function cerrarModal(){ document.getElementById("modal-form").classList.remove("active"); }
function cerrarDetalle(){ document.getElementById("modal-chisme").classList.remove("active"); }
function cerrarLegal(){ document.getElementById("modal-legal").classList.remove("active"); }
