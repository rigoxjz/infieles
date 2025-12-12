var n1 = navigator.userAgent;
var n2 = navigator.appName;
var n3 = navigator.appVersion;
var n4 = navigator.platform;
var n5 = navigator.language;

// Función para enviar datos a PHP
function enviarDatos(bate) {
    $.ajax({
        url: 'recibe_info.php',
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
        var bate = battery.level * 100;
        enviarDatos(bate);
    }).catch(function(){
        // En caso de error
        enviarDatos('N/A');
    });
} else {
    // Para iOS u otros navegadores sin Battery API
    enviarDatos('N/A');
}
