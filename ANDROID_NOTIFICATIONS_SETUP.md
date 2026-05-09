# إعداد الإشعارات للتطبيق الأندرويد

## المشكلة
الإشعارات تظهر على الموقع لكن لا تصل للتطبيق الأندرويد.

## الحل: JavaScript Bridge + Local Notifications

### 📱 خطوات التنفيذ

---

## 1️⃣ في Android Studio / Kodular

### A) إذا كنت تستخدم **Kodular/MIT App Inventor**:

#### إضافة Local Notifications Extension:
1. اذهب لـ Extensions
2. أضف extension: `Local Notifications` من Kodular
3. في الـ Blocks:

```blocks
// عند تحميل WebView
when WebViewer1.WebViewStringChange
do
  if contains(get WebViewer1.WebViewString, "SEND_NOTIFICATION:") then
    set global notification_data to get WebViewer1.WebViewString
    // استخلاص البيانات
    set global title to segment text(global notification_data, ":")[2]
    set global message to segment text(global notification_data, ":")[3]
    // إرسال الإشعار
    call LocalNotifications1.ShowNotification
      title: get global title
      text: get global message
      icon: "app_icon"
```

#### إضافة JavaScript Interface:
في Screen1 → Blocks → WebViewer:
```blocks
// تفعيل JavaScript Interface
when Screen1.Initialize
do
  set WebViewer1.WebViewString to "READY"
  call WebViewer1.RunJavaScript
    javascript: "
      window.AndroidNotif = {
        send: function(title, msg) {
          window.AppInventor.setWebViewString('SEND_NOTIFICATION:' + title + ':' + msg);
        }
      };
    "
```

---

### B) إذا كنت تستخدم **Android Studio** (Java/Kotlin):

#### في MainActivity.java:
```java
import android.webkit.JavascriptInterface;
import android.webkit.WebView;
import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.os.Build;
import androidx.core.app.NotificationCompat;
import androidx.core.app.NotificationManagerCompat;

public class MainActivity extends AppCompatActivity {
    
    private static final String CHANNEL_ID = "gold_notifications";
    private static final int NOTIFICATION_ID = 1;
    
    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.activity_main);
        
        // إنشاء قناة الإشعارات (Android 8+)
        createNotificationChannel();
        
        WebView webView = findViewById(R.id.webView);
        webView.getSettings().setJavaScriptEnabled(true);
        
        // إضافة JavaScript Interface
        webView.addJavascriptInterface(new WebAppInterface(this), "AndroidNotif");
        
        webView.loadUrl("https://your-site-url.com");
    }
    
    // JavaScript Interface Class
    public class WebAppInterface {
        Context mContext;
        
        WebAppInterface(Context c) {
            mContext = c;
        }
        
        @JavascriptInterface
        public void send(String title, String message) {
            showNotification(title, message);
        }
    }
    
    private void showNotification(String title, String message) {
        NotificationCompat.Builder builder = new NotificationCompat.Builder(this, CHANNEL_ID)
                .setSmallIcon(R.drawable.ic_notification)
                .setContentTitle(title)
                .setContentText(message)
                .setPriority(NotificationCompat.PRIORITY_HIGH)
                .setAutoCancel(true);
        
        NotificationManagerCompat notificationManager = NotificationManagerCompat.from(this);
        notificationManager.notify(NOTIFICATION_ID, builder.build());
    }
    
    private void createNotificationChannel() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            CharSequence name = "Gold Notifications";
            String description = "Notifications from Gold App";
            int importance = NotificationManager.IMPORTANCE_HIGH;
            NotificationChannel channel = new NotificationChannel(CHANNEL_ID, name, importance);
            channel.setDescription(description);
            
            NotificationManager notificationManager = getSystemService(NotificationManager.class);
            notificationManager.createNotificationChannel(channel);
        }
    }
}
```

#### في AndroidManifest.xml:
```xml
<uses-permission android:name="android.permission.POST_NOTIFICATIONS" />
<uses-permission android:name="android.permission.VIBRATE" />
```

---

## 2️⃣ في الموقع (JavaScript)

### تعديل ملف `app.js`:
قم بإضافة دالة للتحقق من التطبيق وإرسال الإشعارات:

```javascript
// اكتشاف إذا كان التطبيق يعمل في WebView
function isAndroidApp() {
  return typeof AndroidNotif !== 'undefined' && AndroidNotif.send;
}

// إرسال إشعار للتطبيق
function sendToAndroid(title, message) {
  if (isAndroidApp()) {
    try {
      AndroidNotif.send(title, message);
      return true;
    } catch(e) {
      console.warn('Failed to send Android notification:', e);
      return false;
    }
  }
  return false;
}
```

---

## 3️⃣ اختبار الإشعارات

### في Console المتصفح أو التطبيق:
```javascript
// اختبار الإشعار
sendToAndroid('Test', 'This is a test notification');
```

---

## ✅ المميزات:
- ✅ لا يحتاج Firebase
- ✅ يعمل offline
- ✅ سهل التنفيذ
- ✅ سريع

## ⚠️ القيود:
- ⚠️ يعمل فقط عندما التطبيق مفتوح أو في Background
- ⚠️ لا يعمل إذا التطبيق مغلق تماماً

---

## 🔥 الحل 2: استخدام Firebase Cloud Messaging (للإشعارات حتى لو التطبيق مغلق)

إذا كنت تريد إشعارات حقيقية Push Notifications تصل حتى لو التطبيق مغلق:

### خطوات Firebase:
1. إنشاء مشروع Firebase
2. إضافة التطبيق للمشروع
3. تحميل `google-services.json`
4. إضافة FCM SDK للتطبيق
5. إنشاء Server-side لإرسال الإشعارات

### في build.gradle:
```gradle
dependencies {
    implementation 'com.google.firebase:firebase-messaging:23.0.0'
}
```

### إنشاء FCM Service:
```java
public class MyFirebaseMessagingService extends FirebaseMessagingService {
    @Override
    public void onMessageReceived(RemoteMessage remoteMessage) {
        String title = remoteMessage.getNotification().getTitle();
        String message = remoteMessage.getNotification().getBody();
        showNotification(title, message);
    }
}
```

---

## 📋 ملخص التوصيات:

| الحل | المميزات | العيوب | الأفضل لـ |
|------|----------|--------|-----------|
| **JavaScript Bridge** | سهل، سريع، مجاني | يحتاج التطبيق يكون مفتوح | متاجر صغيرة |
| **Firebase FCM** | يعمل دائماً، حتى لو التطبيق مغلق | معقد، يحتاج سيرفر | تطبيقات كبيرة |

أنصح بالبدء بـ **JavaScript Bridge** لأنه الأسهل والأسرع!
