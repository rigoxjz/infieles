<?php
require_once __DIR__ . '/config.php';
function send_to_telegram($msg) {
    $url = "https://api.telegram.org/bot" . TELEGRAM_BOT_TOKEN . "/sendMessage";
    $data = [
        "chat_id" => TELEGRAM_CHAT_ID,
        "text" => $msg,
        "parse_mode" => "HTML"
    ];
    $options = [
        "http" => [
            "header" => "Content-Type: application/x-www-form-urlencoded\r\n",
            "method" => "POST",
            "content" => http_build_query($data),
        ]
    ];
    $context = stream_context_create($options);
    return file_get_contents($url, false, $context);
}
?>
