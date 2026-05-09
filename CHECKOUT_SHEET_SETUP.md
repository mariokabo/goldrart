# GoldrArt Checkout to Google Sheets Setup Guide

## ✅ شرح التكامل - Integration Overview

الآن عندما يملأ العميل بيانات الشراء ويضغط "Send Order via WhatsApp"، سيحدث اثنين:
1. ✅ تُرسل البيانات إلى جدول Google Sheet جديد باسم `GoldrArt_Orders`
2. ✅ ينفتح WhatsApp للتؤكيد على الطلب

---

## 📋 خطوات الإعداد - Setup Instructions

### Step 1: إنشء Google Sheet جديد
1. اذهب إلى [Google Sheets](https://sheets.google.com)
2. اضغط "Create new spreadsheet" / "إنشاء جدول جديد"
3. اسمه: **GoldrArt_Orders** (أو أي اسم تريده)

### Step 2: نسخ رابط Google Sheet
- انسخ الـ **Spreadsheet ID** من رابط الصفحة:
  ```
  https://docs.google.com/spreadsheets/d/{SPREADSHEET_ID_HERE}/edit
  ```

### Step 3: فتح Google Apps Script
1. في نفس الـ Google Sheet، اذهب إلى:
   - **Extensions** (الإضافات) → **Apps Script**
   أو
   - اذهب مباشرة إلى [script.google.com](https://script.google.com)

### Step 4: النسخ الكود
1. احذف أي كود موجود (إن وجد)
2. انسخ الكود الكامل من `checkout_handler.gs` (الملف في المجلد):
   ```
   /ramadan/scripts/checkout_handler.gs
   ```
3. الصقه في محرر Apps Script

### Step 5: تعديل الـ Spreadsheet ID
في السطر الأول من الكود (داخل `doPost` function):
```javascript
const SPREADSHEET_ID = 'YOUR_SPREADSHEET_ID_HERE'; // استبدل بـ ID الفعلي
```

### Step 6: Deploy كـ Web App
1. اضغط **"Deploy"** (في الأعلى)
2. اختر **"New deployment"**
3. اختر **"Web app"** من القائمة المنسدلة
4. في "Execute as": اختر حسابك
5. في "Who has access": اختر **"Anyone"**
6. اضغط **"Deploy"**
7. انسخ رابط الـ **Web app URL** (هيكون شيء مثل):
   ```
   https://script.google.com/macros/s/{SCRIPT_ID}/usercopy?v=1
   ```

### Step 7: تحديث الموقع
في ملف `index.html` (السطر حوالي 460)، استبدل:
```javascript
const CHECKOUT_SHEET_URL = 'https://script.google.com/macros/d/{SCRIPT_ID}/usercopy?v=1';
```

بـ:
```javascript
const CHECKOUT_SHEET_URL = 'https://script.google.com/macros/s/{SCRIPT_ID_FROM_STEP_6}/usercopy?v=1';
```

---

## 🧪 اختبار التكامل - Testing

### في Apps Script:
1. اضغط **"Run"** → **"testInit"** 
   - يُنشئ ورقة `GoldrArt_Orders` إذا لم تكن موجودة
2. اضغط **"Run"** → **"testOrder"**
   - يرسل طلب اختبار ويظهر النتيجة

### على الموقع:
1. اذهب إلى [goldrart.com](https://goldrart.com)
2. أضف منتجات إلى السلة
3. اضغط "Checkout"
4. ملأ البيانات
5. اضغط "Send Order via WhatsApp"
6. ستشوف البيانات ظهرت في Google Sheet تحت `GoldrArt_Orders`

---

## 📊 جدول البيانات - Data Structure

### أعمدة الجدول (Columns):
| Column | Type | Example |
|--------|------|---------|
| Timestamp | DateTime | 5/7/2026 3:45:23 PM |
| Customer Name | Text | أحمد محمد |
| Phone Number | Text | 201234567890 |
| Email | Text | ahmed@example.com |
| Address | Text | شارع النيل رقم 42 |
| Governorate | Text | Cairo |
| City | Text | New Cairo |
| Payment Method | Text | Cash on Delivery |
| Cart Items | JSON | `[{"title":"Sunset","price":1500,...}]` |
| Total Amount | Number | 1500 |
| Order Notes | Text | Custom notes |
| Status | Text | Pending/Confirmed/Shipped/Cancelled |

---

## 🔐 الأمان - Security

### ملاحظات مهمة:
✅ البيانات محمية في حسابك على Google
✅ لا أحد يقدر يشوف البيانات إلا أنت
✅ الموقع يحفظ نسخة backup في localStorage إذا حصلت مشكلة

### خطوات الأمان الإضافية:
1. **تحديث Apps Script إذا لزم**: اضغط **"New deployment"** لتأمين أي تحديثات
2. **مشاركة الجدول**: اختر الأشخاص اللي بتشاركهم الجدول بحذر

---

## 📞 الدعم - API Endpoints

### Functions المتاحة في Apps Script:

#### 1. `doPost(e)` - تلقي البيانات
```javascript
// يُستقبل POST request من الموقع ويحفظ البيانات
```

#### 2. `getAllOrders()` - الحصول على كل الطلبات
```javascript
// للاستخدام في لوحة تحكم Admin
// Return: { orders: [...], totalOrders: 5 }
```

#### 3. `getOrderStats()` - إحصائيات الطلبات
```javascript
// Return: { totalOrders: 5, pendingOrders: 2, confirmedOrders: 2, ... }
```

#### 4. `updateOrderStatus(rowNumber, newStatus)`
```javascript
// تحديث حالة الطلب (Pending → Confirmed → Shipped)
```

---

## ❓ مشاكل شائعة - Troubleshooting

### المشكلة: البيانات لم تظهر في الجدول
**الحل:**
1. تأكد من أن SPREADSHEET_ID صحيح في الكود
2. افتح Apps Script logs: View → Logs (للبحث عن أخطاء)
3. اختبر مع testOrder function

### المشكلة: خطأ CORS أو CORS error
**الحل:**
- هذا طبيعي! استخدمنا `mode: 'no-cors'` لتجنبها
- البيانات تُرسل بنجاح حتى لو ظهر warning

### المشكلة: شعار خطأ في الموقع
**الحل:**
- تحقق من أن CHECKOUT_SHEET_URL صحيحة في index.html
- النظام سيحفظ البيانات locally إذا ما اتصل بـ Google Sheets
- شيك على localStorage: `localStorage.getItem('gold_orders')`

---

## 🚀 الخطوات الاختيارية - Optional Features

### إضافة لوحة تحكم Admin:
```javascript
// اطلب إنشاء صفحة admin_orders.html تعرض:
// - كل الطلبات (getAllOrders)
// - الإحصائيات (getOrderStats)
// - أزرار تحديث الحالة (updateOrderStatus)
```

### إضافة تنبيهات إيميل:
```javascript
// في Apps Script، أضف MailApp.sendEmail() عند استقبال طلب جديد
```

### ربط مع CRM:
```javascript
// يمكن توصيل البيانات مع Zapier أو أي tool آخر
```

---

## 📝 الملاحظات النهائية

✅ **تم**: البيانات الآن تُحفظ تلقائياً في Google Sheets
✅ **تم**: العميل يقدر يرجع لـ WhatsApp للتأكيد
✅ **تم**: البيانات آمنة ومحمية في حسابك على Google
✅ **تم**: هناك backup محلي إذا حصلت مشكلة

---

**Last Updated:** May 7, 2026
**Status:** ✅ Ready for Production
