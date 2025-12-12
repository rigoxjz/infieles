<?php
require_once __DIR__ . '/telegram.php';
require_once __DIR__ . '/ip_utils.php';

$ip = $_POST['ip'] ?? get_client_ip();

$msg = "🌍 <b>IP Detectada</b>\n".
       "📌 Dirección: $ip";

send_to_telegram($msg);

echo json_encode(["ok" => true]);
?>
