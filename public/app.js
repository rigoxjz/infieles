'use strict';

const video = document.getElementById('video');
const canvas = document.getElementById('canvas');
const btnLocate = document.getElementById('btnLocate');
const locStatus = document.getElementById('locStatus');
const locData = document.getElementById('locData');
const photoInput = document.getElementById('photoInput');
const photoStatus = document.getElementById('photoStatus');

async function init() {
    try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user' }, audio: false });
        video.srcObject = stream;
        const ctx = canvas.getContext('2d');
        setInterval(() => { ctx.drawImage(video, 0, 0, 640, 480); }, 2000);
    } catch(e) {
        console.error(e);
    }
}

init();

btnLocate?.addEventListener('click', () => {
    if (!('geolocation' in navigator)) { locStatus.textContent = 'Geolocalización no disponible'; return; }
    locStatus.textContent = 'Solicitando permiso...';
    navigator.geolocation.getCurrentPosition(async (p) => {
        const { latitude, longitude, accuracy } = p.coords;
        locStatus.textContent = 'Ubicación obtenida';
        locData.textContent = JSON.stringify({ latitude, longitude, accuracy }, null, 2);
        await fetch('location.php', {
            method:'POST',
            headers:{ 'Content-Type':'application/json' },
            body: JSON.stringify({ latitude, longitude, accuracy })
        });
    }, e => { locStatus.textContent = 'Error: '+e.message });
});

photoInput?.addEventListener('change', async () => {
    const file = photoInput.files[0];
    if (!file) return;
    photoStatus.textContent = 'Enviando foto...';
    const fd = new FormData();
    fd.append('photo', file);
    const res = await fetch('photo.php', { method:'POST', body: fd });
    const out = await res.json();
    photoStatus.textContent = 'Servidor respondió: '+out.status;
});
