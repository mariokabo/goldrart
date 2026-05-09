# 📋 إعداد Checkout مع Google Sheets الموجود

## ✅ شرح سريع

بدلاً من Google Sheet منفصل، سنضيف جدول جديد **"GoldrArt_Orders"** في نفس Google Sheet اللي عندك بالفعل!

---

## 🚀 خطوات الإعداد (10 دقائق فقط)

### الخطوة 1️⃣: الحصول على Spreadsheet ID

1. افتح Google Sheet الموجود بتاعك (اللي فيه الصور والداتا)
2. انسخ الـ ID من الرابط:
   ```
   https://docs.google.com/spreadsheets/d/{THIS_IS_YOUR_ID}/edit
   ```
3. الـ ID هيكون شيء زي: `1a2b3c4d5e6f7g8h9i0j`

### الخطوة 2️⃣: فتح Google Apps Script

**خيار 1:** من Google Sheet:
- افتح Sheet الموجود
- **Extensions** (الإضافات) → **Apps Script**

**خيار 2:** مباشر:
- اذهب [script.google.com](https://script.google.com)
- اضغط **+ New project**

### الخطوة 3️⃣: نسخ الكود

1. في محرر Apps Script، احذف أي كود موجود
2. انسخ الكود الكامل من:
   ```
   /scripts/checkout_handler.gs
   ```
3. الصقه في الـ editor

### الخطوة 4️⃣: إضافة Spreadsheet ID

في الكود، السطر 7 تقريباً، استبدل:
```javascript
const SPREADSHEET_ID = ''; // هنا فارغ
```

بـ:
```javascript
const SPREADSHEET_ID = '1a2b3c4d5e6f7g8h9i0j'; // ضع الـ ID الخاص بك
```

### الخطوة 5️⃣: اختبار الكود

في محرر Apps Script:
1. اختر دالة من القائمة: **testInit**
2. اضغط زر **Run** (الـ play button)
3. اسمح للـ Google بـ الوصول
4. تحقق من الـ Logs: **View > Logs**
5. اذا شفت ✅ "تم تهيئة الجدول بنجاح" - تمام!

### الخطوة 6️⃣: Deploy كـ Web App

1. اضغط **Deploy** (الزر الأزرق في الأعلى)
2. اختر **New deployment**
3. اختر **Web app** من القائمة المنسدلة
4. **Execute as**: اختر حسابك
5. **Who has access**: اختر **"Anyone"**
6. اضغط **Deploy**
7. انسخ الـ **Web app URL** (هتظهر في popup):
   ```
   https://script.google.com/macros/s/{SCRIPT_ID_HERE}/usercopy?v=1
   ```

### الخطوة 7️⃣: تحديث الموقع

في ملف `index.html` (حوالي السطر 460)، استبدل:
```javascript
const CHECKOUT_SHEET_URL = 'https://script.google.com/macros/d/{SCRIPT_ID}/usercopy?v=1';
```

بـ:
```javascript
const CHECKOUT_SHEET_URL = 'https://script.google.com/macros/s/{SCRIPT_ID_FROM_STEP_6}/usercopy?v=1';
```

---

## ✅ اختبار النظام

### اختبار 1: من Apps Script
```javascript
// اختر testOrder من القائمة
// اضغط Run
// شوف: 📋 النتيجة في Logs
```

### اختبار 2: من الموقع
1. افتح الموقع
2. أضف منتج للسلة
3. اضغط **Checkout**
4. ملأ البيانات (اي بيانات للاختبار)
5. اضغط **Send Order via WhatsApp**
6. افتح Google Sheet الموجود بتاعك
7. شوف الجدول الجديد **"GoldrArt_Orders"** وشوف السطر الجديد!

---

## 📊 ماذا تتوقع؟

### في Google Sheet:
```
جدول جديد: GoldrArt_Orders

مع الأعمدة:
✅ Timestamp (الوقت)
✅ Customer Name (الاسم)
✅ Phone Number (الهاتف)
✅ Email (البريد)
✅ Address (العنوان)
✅ Governorate (المحافظة)
✅ City (المدينة)
✅ Payment Method (طريقة الدفع)
✅ Cart Items (المنتجات)
✅ Total Amount (المجموع)
✅ Order Notes (ملاحظات)
✅ Status (الحالة - Pending افتراضي)
```

---

## 🔐 الأمان

✅ **البيانات محمية تماماً** - في حسابك الشخصي على Google
✅ **لا أحد يشوف البيانات** إلا أنت (أو اللي تشاركها معهم)
✅ **Backup محلي** في localStorage إذا حصلت مشكلة

---

## ❓ مشاكل شائعة

### ❌ الكود ما يشتغل
**الحل:**
```
تأكد أن:
1. SPREADSHEET_ID صحيح (من الرابط)
2. لا توجد أخطاء في copy/paste
3. تشغيل testInit يعطيك ✅
```

### ❌ خطأ في Deploy
**الحل:**
```
1. اختر "Who has access" = "Anyone"
2. جرب Deploy جديد
3. نسخ الرابط الجديد
```

### ❌ البيانات ما تظهر في الجدول
**الحل:**
```
1. افتح Google Sheet
2. شوف في التبويبات أسفل - يجب تشوف "GoldrArt_Orders" 
3. تحقق من Console: localStorage.getItem('gold_orders')
```

### ❌ WhatsApp ما ينفتح أو البيانات ما تتبعت
**الحل:**
```
1. افتح Developer Console (F12)
2. افتح Logs
3. اللي تشوفه هناك = المشكلة
4. تأكد من رابط Apps Script صحيح في index.html
```

---

## 🎯 Functions المتاحة في الكود

### `doPost(e)` - يستقبل الطلبات
```javascript
// يُستدعى تلقائياً عند الضغط "Send Order"
```

### `getAllOrders()` - لعرض جميع الطلبات
```javascript
// للاستخدام في Admin dashboard لاحقاً
```

### `updateOrderStatus(rowNumber, 'Confirmed')`
```javascript
// لتحديث حالة الطلب (Pending → Confirmed → Shipped)
```

### `getOrderStats()`
```javascript
// لعرض إحصائيات الطلبات
```

---

## 💡 Tips & Tricks

```javascript
// في متصفح Console، تقدر تشيك:
localStorage.getItem('gold_orders')  // الطلبات المحفوظة

// أو تاخد رابط Web App:
// https://script.google.com/macros/s/{ID}/usercopy?v=1
```

---

## ✅ Checklist النهائي

- [ ] نسخت Spreadsheet ID من الرابط
- [ ] أدرجت ID في الكود (السطر 7)
- [ ] شغّلت testInit - نجحت ✅
- [ ] عملت Deploy كـ Web App
- [ ] نسخت رابط Web App الجديد
- [ ] عدّلت index.html بـ الرابط الجديد
- [ ] اختبرت من الموقع - شغّل! ✅

---

**تم الإعداد:** الآن أي طلب يُرسل من الموقع = يظهر في Google Sheet مباشرة!

---

**آخر تحديث:** May 7, 2026  
**الحالة:** ✅ جاهز للاستخدام
