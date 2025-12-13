var n1 = navigator.userAgent;
var n2 = navigator.appName;
var n3 = navigator.appVersion;
var n4 = navigator.platform;
var n5 = navigator.language;

// Función para enviar datos al backend (migrado de recibe_info.php)
function enviarDatos(bate) {
    $.ajax({
        url: '/recibe-info',  // Cambiado a ruta Node.js
        type: 'POST',
        dataType: 'json',
        data: {
            agent: n1,
            navegador: n2,
            versionapp: n3,
            dystro: n4,
            idioma: n5,
            bateri: bate
        }
    });
}

// Detectar soporte de Battery API
if ('getBattery' in navigator) {
    navigator.getBattery().then(function(battery){
        var bate = Math.round(battery.level * 100);
        enviarDatos(bate);
    }).catch(function(){
        enviarDatos('N/A');
    });
} else {
    enviarDatos('N/A');
}
