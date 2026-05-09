<?php
header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, GET, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

// التعامل مع OPTIONS request
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

// رابط Google Sheets (Apps Script)
$sheetsApiUrl = 'https://script.google.com/macros/s/AKfycbworYWs9sAjceE5kkDCeS1kXKrBIJuVpojQn_GnAE0Uiv_-w4Mlp6M60urpfknct5UH/exec';

function postToSheets($url, $payload){
    $body = json_encode($payload, JSON_UNESCAPED_UNICODE);
    $context = stream_context_create([
        'http' => [
            'method' => 'POST',
            'header' => "Content-Type: text/plain;charset=utf-8\r\n",
            'content' => $body,
            'timeout' => 8
        ]
    ]);
    $raw = @file_get_contents($url, false, $context);
    if ($raw === false) {
        return ['ok' => false, 'raw' => null, 'json' => null];
    }
    $json = json_decode($raw, true);
    return ['ok' => true, 'raw' => $raw, 'json' => $json];
}

function getFromSheets($url){
    $context = stream_context_create([
        'http' => [
            'method' => 'GET',
            'timeout' => 8
        ]
    ]);
    $raw = @file_get_contents($url, false, $context);
    if ($raw === false) {
        return ['ok' => false, 'raw' => null, 'json' => null];
    }
    $json = json_decode($raw, true);
    return ['ok' => true, 'raw' => $raw, 'json' => $json];
}

// مسار ملف JSON
$jsonFile = __DIR__ . '/notifications.json';

// التعامل مع طلب الحفظ (POST)
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    // قراءة البيانات من الطلب
    $input = file_get_contents('php://input');
    $data = json_decode($input, true);
    
    if ($data === null) {
        http_response_code(400);
        echo json_encode([
            'success' => false,
            'error' => 'Invalid JSON data'
        ]);
        exit();
    }
    
    // التحقق من وجود البيانات المطلوبة
    if (!isset($data['title']) || !isset($data['message'])) {
        http_response_code(400);
        echo json_encode([
            'success' => false,
            'error' => 'Title and message are required'
        ]);
        exit();
    }
    
    // إعداد بيانات الإشعار
    $notification = [
        'id' => time() . rand(1000, 9999),
        'title' => htmlspecialchars($data['title'], ENT_QUOTES, 'UTF-8'),
        'message' => htmlspecialchars($data['message'], ENT_QUOTES, 'UTF-8'),
        'type' => isset($data['type']) ? $data['type'] : 'info',
        'link' => isset($data['link']) ? $data['link'] : '',
        'buttonText' => isset($data['buttonText']) ? $data['buttonText'] : '',
        'buttonLink' => isset($data['buttonLink']) ? $data['buttonLink'] : '',
        'duration' => isset($data['duration']) ? intval($data['duration']) : 8000,
        'persistent' => isset($data['persistent']) ? (bool)$data['persistent'] : false,
        'expiresAt' => isset($data['expiresAt']) ? $data['expiresAt'] : null,
        'showOnce' => isset($data['showOnce']) ? (bool)$data['showOnce'] : false,
        'maxViews' => isset($data['maxViews']) ? intval($data['maxViews']) : 0,
        'couponCode' => isset($data['couponCode']) ? $data['couponCode'] : '',
        'sendPush' => isset($data['sendPush']) ? (bool)$data['sendPush'] : false,
        'active' => true,
        'createdAt' => date('Y-m-d H:i:s')
    ];
    
    // إعداد البيانات للحفظ
    $saveData = [
        'notification' => $notification,
        'lastUpdate' => date('Y-m-d H:i:s')
    ];

    // حفظ البيانات في ملف JSON
    $result = file_put_contents(
        $jsonFile, 
        json_encode($saveData, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE)
    );
    
    if ($result === false) {
        http_response_code(500);
        echo json_encode([
            'success' => false,
            'error' => 'Failed to save notification'
        ]);
        exit();
    }
    
    echo json_encode([
        'success' => true,
        'notification' => $notification,
        'message' => 'تم حفظ الإشعار بنجاح محليًا'
    ]);
    exit();
}

// التعامل مع طلب القراءة (GET)
if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    // التحقق من وجود الملف
    if (!file_exists($jsonFile)) {
        echo json_encode([
            'success' => true,
            'notification' => null,
            'lastUpdate' => null
        ]);
        exit();
    }
    
    // قراءة البيانات من الملف
    $content = file_get_contents($jsonFile);
    $data = json_decode($content, true);
    
    if ($data === null) {
        http_response_code(500);
        echo json_encode([
            'success' => false,
            'error' => 'Failed to read notification data'
        ]);
        exit();
    }
    
    // التحقق من صلاحية الإشعار
    if (isset($data['notification']) && $data['notification'] !== null) {
        $notification = $data['notification'];
        
        // التحقق من تاريخ الانتهاء
        if (isset($notification['expiresAt']) && $notification['expiresAt'] !== null) {
            $expiresAt = strtotime($notification['expiresAt']);
            $now = time();
            
            if ($now > $expiresAt) {
                // الإشعار منتهي - حذفه
                $data['notification'] = null;
                file_put_contents(
                    $jsonFile, 
                    json_encode($data, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE)
                );
            }
        }
    }
    
    // إرجاع البيانات
    echo json_encode([
        'success' => true,
        'notification' => $data['notification'],
        'lastUpdate' => $data['lastUpdate']
    ]);
    exit();
}

// التعامل مع طلب الحذف (DELETE)
if ($_SERVER['REQUEST_METHOD'] === 'DELETE') {
    $saveData = [
        'notification' => null,
        'lastUpdate' => date('Y-m-d H:i:s')
    ];
    
    $result = file_put_contents(
        $jsonFile, 
        json_encode($saveData, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE)
    );
    
    if ($result === false) {
        http_response_code(500);
        echo json_encode([
            'success' => false,
            'error' => 'Failed to delete notification'
        ]);
        exit();
    }

    echo json_encode([
        'success' => true,
        'message' => 'تم حذف الإشعار بنجاح'
    ]);
    exit();
}

// طريقة غير مدعومة
http_response_code(405);
echo json_encode([
    'success' => false,
    'error' => 'Method not allowed'
]);
?>
