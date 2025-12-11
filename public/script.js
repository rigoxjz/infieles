// public/script.js - VERSIÓN FINAL PARA RENDER
// BACKEND HOSTEADO EN RENDER → URL FIJA

const API = "https://infieles-sya9.onrender.com";

let infielesData = [];
let currentChismeId = null;

// Inicialización
document.addEventListener('DOMContentLoaded', function() {
    cargarInfieles();
    
    // Configurar botones
    document.getElementById('btn-agregar').addEventListener('click', mostrarFormulario);
    document.getElementById('btn-legal').addEventListener('click', mostrarLegal);
    document.getElementById('form-infiel').addEventListener('submit', guardarInfiel);
});

// Funciones de edad
function confirmAge(isAdult) {
    const ageModal = document.getElementById('age-modal');
    const mainContent = document.getElementById('main-content');
    
    if (isAdult) {
        ageModal.classList.remove('active');
        mainContent.style.display = 'block';
        localStorage.setItem('ageConfirmed', 'true');
    } else {
        window.location.href = 'https://google.com';
    }
}

// Verificar si ya confirmó edad
if (localStorage.getItem('ageConfirmed') === 'true') {
    document.getElementById('age-modal').classList.remove('active');
    document.getElementById('main-content').style.display = 'block';
}

// Mostrar formulario
function mostrarFormulario() {
    document.getElementById('modal-form').classList.add('active');
}

// Mostrar información legal
function mostrarLegal() {
    document.getElementById('modal-legal').classList.add('active');
}

// Cerrar modales
function cerrarModal() {
    document.getElementById('modal-form').classList.remove('active');
    document.getElementById('form-infiel').reset();
}

function cerrarDetalle() {
    document.getElementById('modal-chisme').classList.remove('active');
}

function cerrarLegal() {
    document.getElementById('modal-legal').classList.remove('active');
}

// ========== FUNCIONES CON API ==========

async function cargarInfieles() {
    try {
        showLoading(true);
        const response = await fetch(`${API_URL}/infieles`);
        if (!response.ok) throw new Error('Error al cargar datos');
        
        infielesData = await response.json();
        mostrarInfieles(infielesData);
    } catch (error) {
        console.error('Error:', error);
        mostrarError('No se pudieron cargar los datos. Intenta recargar.');
    } finally {
        showLoading(false);
    }
}

async function guardarInfiel(e) {
    e.preventDefault();
    
    const formData = new FormData();
    formData.append('reportero', document.getElementById('reportero').value);
    formData.append('nombre', document.getElementById('nombre').value);
    formData.append('apellido', document.getElementById('apellido').value);
    formData.append('edad', document.getElementById('edad').value);
    formData.append('ubicacion', document.getElementById('ubicacion').value);
    formData.append('historia', document.getElementById('historia').value);
    
    const files = document.getElementById('pruebas').files;
    for (let i = 0; i < files.length; i++) {
        formData.append('pruebas', files[i]);
    }
    
    try {
        showLoading(true);
        const response = await fetch(`${API_URL}/infieles`, {
            method: 'POST',
            body: formData
        });
        
        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || 'Error al guardar');
        }
        
        const nuevoInfiel = await response.json();
        infielesData.unshift(nuevoInfiel);
        mostrarInfieles(infielesData);
        cerrarModal();
        alert('✅ ¡Chisme publicado en la base de datos!');
    } catch (error) {
        console.error('Error:', error);
        alert(`❌ Error: ${error.message}`);
    } finally {
        showLoading(false);
    }
}

function mostrarInfieles(data) {
    const lista = document.getElementById('lista-infieles');
    lista.innerHTML = '';
    
    if (data.length === 0) {
        lista.innerHTML = `
            <div style="text-align:center; padding:40px; color:#666;">
                <h3>No hay chismes todavía</h3>
                <p>Sé el primero en exponer a un infiel</p>
            </div>
        `;
        return;
    }
    
    data.forEach(infiel => {
        const card = document.createElement('div');
        card.className = 'card';
        card.onclick = () => mostrarDetalle(infiel.id);
        
        card.innerHTML = `
            <div class="card-header">${infiel.nombre} ${infiel.apellido}</div>
            <div class="card-body">
                <div class="info"><strong>Edad:</strong> ${infiel.edad} años</div>
                <div class="info"><strong>Ubicación:</strong> ${infiel.ubicacion}</div>
                <div class="info"><strong>Reportado por:</strong> ${infiel.reportero}</div>
                <div class="info" style="margin-top:10px;color:#666;font-style:italic;">
                    ${infiel.historia.substring(0, 100)}...
                </div>
                <div style="margin-top:15px; display: flex; justify-content: space-between; align-items: center;">
                    <div class="votos">
                        <span style="color:green;">✓ Real: ${infiel.votos_real || 0}</span>
                        <span style="color:red;margin-left:15px;">✗ Falso: ${infiel.votos_falso || 0}</span>
                    </div>
                    <div style="font-size:0.9em; color:#888;">
                        ${infiel.total_pruebas || 0} 📸 · ${infiel.total_comentarios || 0} 💬
                    </div>
                </div>
                <div style="font-size:0.8em; color:#999; margin-top:10px;">
                    ${formatFecha(infiel.fecha)}
                </div>
            </div>
        `;
        lista.appendChild(card);
    });
}

async function filtrar() {
    const searchTerm = document.getElementById('search-input').value;
    
    try {
        showLoading(true);
        const response = await fetch(`${API_URL}/infieles?search=${encodeURIComponent(searchTerm)}`);
        if (!response.ok) throw new Error('Error al buscar');
        
        const resultados = await response.json();
        mostrarInfieles(resultados);
    } catch (error) {
        console.error('Error:', error);
    } finally {
        showLoading(false);
    }
}

async function mostrarDetalle(id) {
    try {
        showLoading(true);
        const response = await fetch(`${API_URL}/infieles/${id}`);
        if (!response.ok) throw new Error('Error al cargar detalle');
        
        const infiel = await response.json();
        currentChismeId = id;
        mostrarModalDetalle(infiel);
    } catch (error) {
        console.error('Error:', error);
        mostrarError('No se pudo cargar el detalle.');
    } finally {
        showLoading(false);
    }
}

function mostrarModalDetalle(infiel) {
    const detalle = document.getElementById('detalle-chisme');
    
    let imagenesHTML = '';
    if (infiel.pruebas && infiel.pruebas.length > 0) {
        imagenesHTML = '<div class="galeria"><h3>Pruebas:</h3>';
        infiel.pruebas.forEach(prueba => {
            // Verificar si es base64 o URL
            if (prueba.imagen_url.startsWith('data:')) {
                imagenesHTML += `<img src="${prueba.imagen_url}" alt="Prueba">`;
            } else {
                imagenesHTML += `<img src="${prueba.imagen_url}" alt="Prueba">`;
            }
        });
        imagenesHTML += '</div>';
    }
    
    let comentariosHTML = '';
    if (infiel.comentarios && infiel.comentarios.length > 0) {
        comentariosHTML = '<div class="comentarios"><h3>Comentarios:</h3>';
        infiel.comentarios.forEach(comentario => {
            comentariosHTML += `
                <div class="comentario">
                    <strong>${comentario.autor}:</strong>
                    <p>${comentario.texto}</p>
                    <small>${formatFecha(comentario.fecha)}</small>
                </div>
            `;
        });
        comentariosHTML += '</div>';
    }
    
    detalle.innerHTML = `
        <h2>${infiel.nombre} ${infiel.apellido}</h2>
        <div class="info"><strong>Edad:</strong> ${infiel.edad} años</div>
        <div class="info"><strong>Ubicación:</strong> ${infiel.ubicacion}</div>
        <div class="info"><strong>Reportado por:</strong> ${infiel.reportero}</div>
        <div class="info"><strong>Fecha:</strong> ${formatFecha(infiel.fecha)}</div>
        
        <div style="margin:20px 0; padding:15px; background:#f8f9fa; border-radius:10px;">
            <h3>La Historia:</h3>
            <p style="white-space: pre-line;">${infiel.historia}</p>
        </div>
        
        ${imagenesHTML}
        
        <div class="votos">
            <button class="voto-btn" style="background:green;" onclick="votar('real')">
                ✓ Es Real (${infiel.votos_real || 0})
            </button>
            <button class="voto-btn" style="background:red;" onclick="votar('falso')">
                ✗ Es Falso (${infiel.votos_falso || 0})
            </button>
        </div>
        
        <div style="margin-top:25px;">
            <h3>Agregar Comentario</h3>
            <input type="text" id="comentario-autor" placeholder="Tu nick (opcional)" style="margin-bottom:10px;">
            <textarea id="nuevo-comentario" placeholder="Escribe tu comentario..."></textarea>
            <button class="btn btn-azul" onclick="agregarComentario()" style="width:100%;">Publicar Comentario</button>
        </div>
        
        ${comentariosHTML}
    `;
    
    document.getElementById('modal-chisme').classList.add('active');
}

async function votar(tipo) {
    if (!currentChismeId) return;
    
    try {
        const response = await fetch(`${API_URL}/infieles/${currentChismeId}/votar`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ tipo })
        });
        
        if (!response.ok) throw new Error('Error al votar');
        
        // Recargar el detalle
        mostrarDetalle(currentChismeId);
    } catch (error) {
        console.error('Error:', error);
        alert('Error al votar. Intenta de nuevo.');
    }
}

async function agregarComentario() {
    if (!currentChismeId) return;
    
    const autor = document.getElementById('comentario-autor').value;
    const texto = document.getElementById('nuevo-comentario').value;
    
    if (!texto.trim()) {
        alert('Escribe un comentario primero');
        return;
    }
    
    try {
        const response = await fetch(`${API_URL}/infieles/${currentChismeId}/comentarios`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ autor, texto })
        });
        
        if (!response.ok) throw new Error('Error al comentar');
        
        // Recargar el detalle
        mostrarDetalle(currentChismeId);
        
        // Limpiar campos
        document.getElementById('comentario-autor').value = '';
        document.getElementById('nuevo-comentario').value = '';
    } catch (error) {
        console.error('Error:', error);
        alert('Error al publicar comentario.');
    }
}

// Funciones auxiliares
function showLoading(show) {
    const loader = document.getElementById('loader') || createLoader();
    loader.style.display = show ? 'block' : 'none';
}

function createLoader() {
    const loader = document.createElement('div');
    loader.id = 'loader';
    loader.style.cssText = `
        position: fixed;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        background: white;
        padding: 20px;
        border-radius: 10px;
        box-shadow: 0 0 20px rgba(0,0,0,0.2);
        z-index: 9999;
        display: none;
    `;
    loader.innerHTML = `
        <div style="text-align:center;">
            <div style="border: 4px solid #f3f3f3; border-top: 4px solid #007bff; border-radius: 50%; width: 40px; height: 40px; margin: 0 auto 10px; animation: spin 1s linear infinite;"></div>
            <p>Cargando...</p>
        </div>
        <style>
            @keyframes spin {
                0% { transform: rotate(0deg); }
                100% { transform: rotate(360deg); }
            }
        </style>
    `;
    document.body.appendChild(loader);
    return loader;
}

function mostrarError(mensaje) {
    const lista = document.getElementById('lista-infieles');
    lista.innerHTML = `
        <div style="text-align:center; padding:40px; color:#dc3545;">
            <h3>Error</h3>
            <p>${mensaje}</p>
            <button onclick="cargarInfieles()" class="btn btn-azul" style="margin-top:20px;">
                Reintentar
            </button>
        </div>
    `;
}

function formatFecha(fechaString) {
    const fecha = new Date(fechaString);
    return fecha.toLocaleDateString('es-ES', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
}
