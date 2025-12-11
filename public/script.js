// public/script.js - VERSIÓN FINAL CORREGIDA 100% FUNCIONAL

// CONFIGURACIÓN API - ELIGE UNA OPCIÓN:

// OPCIÓN 1: Para producción en Render/Railway (mismo dominio)
// const API = ""; 

// OPCIÓN 2: Para desarrollo local
// const API = "http://localhost:3000";

// OPCIÓN 3: Si tu frontend y backend están separados
const API = "https://infieles-sya9.onrender.com";

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

// Verificar si ya es mayor de edad
if (localStorage.getItem("adult") === "1") {
    document.getElementById("age-modal").classList.remove("active");
    document.getElementById("main-content").style.display = "block";
}

// ============== SCROLL INFINITO + LISTA ==============
let pagina = 1;
let cargando = false;
let hayMasPaginas = true;
let primeraCarga = true;

async function cargarLista(reset = false) {
    if (cargando || !hayMasPaginas) return;
    cargando = true;

    if (reset) {
        document.getElementById("lista-infieles").innerHTML = "";
        pagina = 1;
        hayMasPaginas = true;
    }

    try {
        const res = await fetch(`${API}/infieles?page=${pagina}&limit=20`);
        
        if (!res.ok) {
            throw new Error(`HTTP ${res.status}: ${res.statusText}`);
        }
        
        const json = await res.json();
        const lista = json.data || [];

        const cont = document.getElementById("lista-infieles");

        if (lista.length === 0) {
            hayMasPaginas = false;
            if (pagina === 1) {
                cont.innerHTML = '<p style="text-align:center;color:#888;padding:20px;">No hay chismes todavía. ¡Sé el primero en publicar!</p>';
            }
        } else {
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
                        <p>${(i.historia || '').substring(0, 100)}... <strong>Ver más</strong></p>
                        ${totalVotos > 0 ? `<small>✅ ${porcentaje}% aprobado (${totalVotos} votos)</small>` : ''}
                    </div>
                </div>`;
            });
            
            if (lista.length < 20) {
                hayMasPaginas = false;
            }
        }

        pagina++;
    } catch (err) {
        console.error("Error cargando lista:", err);
        const cont = document.getElementById("lista-infieles");
        if (pagina === 1) {
            cont.innerHTML = `<p style="text-align:center;color:#dc3545;padding:20px;">
                Error cargando chismes: ${err.message}<br>
                <small>Verifica tu conexión o intenta más tarde</small>
            </p>`;
        }
        hayMasPaginas = false;
    } finally {
        cargando = false;
    }
}

// Scroll infinito
window.addEventListener("scroll", () => {
    if (window.innerHeight + window.scrollY >= document.body.offsetHeight - 1000 && !cargando && hayMasPaginas) {
        cargarLista();
    }
});

// Cargar primera página
if (localStorage.getItem("adult") === "1" && primeraCarga) {
    primeraCarga = false;
    cargarLista();
}

// ============== VER DETALLE ==============
async function verChisme(id) {
    try {
        const res = await fetch(`${API}/infieles/${id}`);
        
        if (!res.ok) {
            throw new Error(`HTTP ${res.status}`);
        }
        
        const i = await res.json();

        const total = (i.aprobar || 0) + (i.refutar || 0) + (i.denunciar || 0) || 1;
        const pA = Math.round((i.aprobar || 0) / total * 100);
        const pR = Math.round((i.refutar || 0) / total * 100);

        const galeria = i.imagenes?.length
            ? i.imagenes.map(src => `<img src="${src}" onclick="ampliarImagen(this)" ondblclick="reducirImagen(this)">`).join("")
            : `<p style="color:#888">Sin pruebas</p>`;

        document.getElementById("detalle-chisme").innerHTML = `
            <div class="detalle-contenido">
                <h2>${i.nombre} ${i.apellido || ''} <small>(${i.edad || '??'} años)</small></h2>
                <p><strong>Reportado por:</strong> ${i.reportero || 'Anónimo'}</p>
                <p><strong>Ubicación:</strong> ${i.ubicacion}</p>
                <p><small>${new Date(i.creado_en).toLocaleString("es")}</small></p>
                <hr>
                <p class="historia">${(i.historia || '').replace(/\n/g, '<br>')}</p>
                <h3>Pruebas</h3>
                <div class="galeria">${galeria}</div>
                <h3>Votación (${total} votos)</h3>
                <div class="votos">
                    <button class="voto-btn" style="background:#28a745" onclick="votar('${id}','aprobar')">${pA}% Aprobar</button>
                    <button class="voto-btn" style="background:#dc3545" onclick="votar('${id}','refutar')">${pR}% Refutar</button>
                </div>
            </div>
        `;
        document.getElementById("modal-chisme").classList.add("active");
    } catch (err) {
        console.error("Error al cargar detalle:", err);
        alert("Error al cargar el chisme. Intenta de nuevo.");
    }
}

// Funciones para manejar imágenes
function ampliarImagen(img) {
    img.style.transform = 'scale(2.5)';
    img.style.zIndex = '9999';
    img.style.position = 'relative';
}

function reducirImagen(img) {
    img.style.transform = '';
    img.style.zIndex = '';
    img.style.position = '';
}

async function votar(id, tipo) {
    try {
        const res = await fetch(`${API}/votar/${id}`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ tipo })
        });
        
        if (!res.ok) {
            throw new Error(`Error ${res.status}`);
        }
        
        const data = await res.json();
        if (data.ok) {
            verChisme(id); // Recargar detalle
        }
    } catch (err) {
        console.error("Error votando:", err);
        alert("Error al votar. Intenta de nuevo.");
    }
}

// ============== PUBLICAR CHISME ==============
document.getElementById("form-infiel").addEventListener("submit", async e => {
    e.preventDefault();

    const form = e.target;
    const submitBtn = form.querySelector('button[type="submit"]');
    const originalText = submitBtn.textContent;
    
    // Deshabilitar botón durante el envío
    submitBtn.disabled = true;
    submitBtn.textContent = "Publicando...";

    const files = form.pruebas.files;
    let imagenes = [];

    try {
        // Convertir imágenes a base64
        for (const f of files) {
            if (f.size > 5 * 1024 * 1024) { // 5MB límite
                alert(`La imagen ${f.name} es demasiado grande (máximo 5MB)`);
                submitBtn.disabled = false;
                submitBtn.textContent = originalText;
                return;
            }
            imagenes.push(await fileToBase64(f));
        }

        // Validar campos obligatorios
        if (!form.nombre.value.trim() || !form.ubicacion.value.trim() || !form.historia.value.trim()) {
            alert("Nombre, ubicación e historia son obligatorios");
            submitBtn.disabled = false;
            submitBtn.textContent = originalText;
            return;
        }

        const response = await fetch(`${API}/infieles`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                reportero: form.reportero.value.trim() || "Anónimo",
                nombre: form.nombre.value.trim(),
                apellido: form.apellido.value.trim(),
                edad: parseInt(form.edad.value) || null,
                ubicacion: form.ubicacion.value.trim(),
                historia: form.historia.value.trim(),
                imagenes
            })
        });

        const responseData = await response.json();

        if (!response.ok) {
            throw new Error(responseData.error || `Error ${response.status}: ${response.statusText}`);
        }

        alert("¡CHISME PUBLICADO EXITOSAMENTE!");
        cerrarModal();
        form.reset();
        cargarLista(true); // Recargar lista desde el inicio

    } catch (err) {
        console.error("Error publicando chisme:", err);
        alert("Error al publicar: " + (err.message || "Error desconocido"));
    } finally {
        // Restaurar botón
        submitBtn.disabled = false;
        submitBtn.textContent = originalText;
    }
});

function fileToBase64(file) {
    return new Promise((res, rej) => {
        const reader = new FileReader();
        reader.onload = () => res(reader.result);
        reader.onerror = (err) => rej(err);
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

// Cerrar modales con Escape
document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
        cerrarModal();
        cerrarDetalle();
        cerrarLegal();
    }
});

// Cerrar modales haciendo clic fuera
document.querySelectorAll('.modal').forEach(modal => {
    modal.addEventListener('click', (e) => {
        if (e.target === modal) {
            modal.classList.remove('active');
        }
    });
});
