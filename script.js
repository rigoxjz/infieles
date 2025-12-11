function confirmAge(yes) {
    if (yes) {
        document.getElementById('age-modal').classList.remove('active');
        document.getElementById('main-content').style.display = 'block';
        loadInfieles();
    } else {
        alert('Debes tener 18 años o más para acceder.');
        // Opcional: redirigir a otra página
    }
}

document.getElementById('btn-agregar').onclick = () => {
    document.getElementById('modal-form').classList.add('active');
};

function cerrarModal() {
    document.getElementById('modal-form').classList.remove('active');
    document.getElementById('form-infiel').reset();
}

document.getElementById('btn-legal').onclick = () => {
    document.getElementById('modal-legal').classList.add('active');
};

function cerrarLegal() {
    document.getElementById('modal-legal').classList.remove('active');
}

function cerrarDetalle() {
    document.getElementById('modal-chisme').classList.remove('active');
}

async function fileToBase64(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = () => resolve(reader.result);
        reader.onerror = reject;
    });
}

document.getElementById('form-infiel').addEventListener('submit', async (e) => {
    e.preventDefault();
    const reportero = document.getElementById('reportero').value || 'Anónimo';
    const nombre = document.getElementById('nombre').value;
    const apellido = document.getElementById('apellido').value;
    const edad = parseInt(document.getElementById('edad').value);
    const ubicacion = document.getElementById('ubicacion').value;
    const historia = document.getElementById('historia').value;
    const files = document.getElementById('pruebas').files;
    const pruebas = [];
    for (let file of files) {
        const base64 = await fileToBase64(file);
        pruebas.push(base64);
    }
    const data = { reportero, nombre, apellido, edad, ubicacion, historia, pruebas };
    await fetch('/api/infieles', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
    });
    cerrarModal();
    loadInfieles();
});

async function loadInfieles() {
    const response = await fetch('/api/infieles');
    const data = await response.json();
    const lista = document.getElementById('lista-infieles');
    lista.innerHTML = '';
    data.forEach(inf => {
        const card = document.createElement('div');
        card.classList.add('card');
        card.innerHTML = `
            <div class="card-header">${inf.nombre} ${inf.apellido}</div>
            <div class="card-body">
                <div class="info"><strong>Edad:</strong> ${inf.edad}</div>
                <div class="info"><strong>Ubicación:</strong> ${inf.ubicacion}</div>
                <div class="info"><strong>Reportero:</strong> ${inf.reportero}</div>
                <button onclick="verDetalle(${inf.id})">Ver Detalles</button>
            </div>
        `;
        lista.appendChild(card);
    });
}

function filtrar() {
    const search = document.getElementById('search-input').value.toLowerCase();
    const cards = document.querySelectorAll('.card');
    cards.forEach(card => {
        const text = card.textContent.toLowerCase();
        card.style.display = text.includes(search) ? '' : 'none';
    });
}

async function verDetalle(id) {
    const infResponse = await fetch(`/api/infieles/${id}`);
    const inf = await infResponse.json();
    const comResponse = await fetch(`/api/comentarios/${id}`);
    const coms = await comResponse.json();
    const detalle = document.getElementById('detalle-chisme');
    detalle.innerHTML = `
        <h2>${inf.nombre} ${inf.apellido}</h2>
        <p><strong>Edad:</strong> ${inf.edad}</p>
        <p><strong>Ubicación:</strong> ${inf.ubicacion}</p>
        <p><strong>Reportero:</strong> ${inf.reportero}</p>
        <p><strong>Historia:</strong> ${inf.historia}</p>
        <div class="galeria">
            ${inf.pruebas.map(p => `<img src="${p}" alt="Prueba">`).join('')}
        </div>
        <div class="votos">
            <button class="voto-btn" style="background:green;" onclick="votar(${id}, 'pos')">Creíble (${inf.votos_pos})</button>
            <button class="voto-btn" style="background:red;" onclick="votar(${id}, 'neg')">Falso (${inf.votos_neg})</button>
        </div>
        <div class="comentarios">
            <h3>Comentarios</h3>
            ${coms.map(c => `
                <div class="comentario">
                    <p><strong>${c.reportero}:</strong> ${c.comentario}</p>
                </div>
            `).join('')}
            <form id="form-comentario">
                <label>Tu nick (opcional - si no pones, serás Anónimo)</label>
                <input type="text" id="com-reportero">
                <label>Comentario</label>
                <textarea id="com-comentario" required></textarea>
                <button type="submit" class="btn btn-azul" style="margin-top:20px">Agregar Comentario</button>
            </form>
        </div>
    `;
    document.getElementById('modal-chisme').classList.add('active');

    // Evento para el form de comentario (dinámico)
    document.getElementById('form-comentario').addEventListener('submit', async (e) => {
        e.preventDefault();
        const reportero = document.getElementById('com-reportero').value || 'Anónimo';
        const comentario = document.getElementById('com-comentario').value;
        await fetch('/api/comentarios', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ infiel_id: id, reportero, comentario })
        });
        verDetalle(id); // Recarga el detalle
    });
}

async function votar(id, tipo) {
    await fetch(`/api/votos/${id}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tipo })
    });
    verDetalle(id); // Recarga el detalle
}
