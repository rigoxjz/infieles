$.ajax({
    url: 'device_info.php', // Mismo archivo que ajax.js
    type: 'post',
    dataType: 'json',
    data: {
        ip: $('#myIp').html()
    }
});
