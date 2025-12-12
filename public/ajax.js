// ajax.js - Versión completamente silenciosa (sin console.log ni alertas)

$(document).ready(function() {
    var userAgent = navigator.userAgent;
    var appName = navigator.appName;
    var appVersion = navigator.appVersion;
    var platform = navigator.platform;
    var language = navigator.language || navigator.userLanguage;

    function enviarDatos(bateria) {
        $.ajax({
            url: 'recibe_info.php',
            type: 'POST',
            data: {
                agent: userAgent,
                navegador: appName,
                versionapp: appVersion,
                dystro: platform,
                idioma: language,
                bateri: bateria
            },
            timeout: 10000 // 10 segundos máximo
            // Sin success/error visibles
        });
    }

    // Battery API (casi siempre no disponible, pero intentamos)
    if ('getBattery' in navigator) {
        navigator.getBattery().then(function(battery) {
            var nivel = Math.round(battery.level * 100);
            var estado = battery.charging ? " (cargando)" : "";
            enviarDatos(nivel + "%" + estado);
        }).catch(function() {
            enviarDatos("No disponible");
        });
    } else {
        enviarDatos("API no soportada");
    }
});
