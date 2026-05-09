// ================================================
// GoldrArt Checkout Orders Handler
// يُضيف جدول "GoldrArt_Orders" لنفس Google Sheet الموجود
// ================================================

// ⚠️ أدخل Spreadsheet ID الخاص بك هنا
// الـ ID يكون من الرابط: https://docs.google.com/spreadsheets/d/{THIS_ID}/edit
const SPREADSHEET_ID = '1XQ3f00L-DBPqZdE3xlsQK9-ULMk7JiwnIqzlBxzGKoQ'; // ستملأ هذا أثناء الإعداد

const SHEET_NAME = 'GoldrArt_Orders';

/**
 * تهيئة جدول الطلبات - إضافة جدول جديد للـ Spreadsheet الموجود
 */
function initializeOrderSheet() {
  try {
    if (!SPREADSHEET_ID || SPREADSHEET_ID.length < 10) {
      throw new Error('SPREADSHEET_ID غير صحيح! أدخل الـ ID في السطر 8');
    }
    
    const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
    let sheet = ss.getSheetByName(SHEET_NAME);
    
    if (!sheet) {
      sheet = ss.insertSheet(SHEET_NAME);
      Logger.log('✅ تم إنشاء جدول: ' + SHEET_NAME);
    }
    
    // تحقق من وجود Headers - استخدم 12 عمود ثابت (عدد الأعمدة المطلوبة)
    const lastColumn = Math.max(sheet.getLastColumn(), 1);
    const firstRow = sheet.getRange(1, 1, 1, Math.min(lastColumn, 12)).getValues();
    const hasHeaders = firstRow[0] && firstRow[0].some(cell => cell.toString().length > 0);
    
    if (!hasHeaders) {
      const headers = [
        'Timestamp',
        'Customer Name',
        'Phone Number',
        'Email',
        'Address',
        'Governorate',
        'City',
        'Payment Method',
        'Cart Items',
        'Total Amount',
        'Order Notes',
        'Status'
      ];
      sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
      
      // تنسيق Headers
      const headerRange = sheet.getRange(1, 1, 1, headers.length);
      headerRange.setBackground('#d4af37');
      headerRange.setFontColor('#000');
      headerRange.setFontWeight('bold');
      headerRange.setFontSize(12);
      
      // تعيين عرض الأعمدة
      const widths = [140, 160, 140, 140, 200, 140, 120, 150, 280, 120, 200, 100];
      for (let i = 0; i < widths.length; i++) {
        sheet.setColumnWidth(i + 1, widths[i]);
      }
      
      Logger.log('✅ تم إنشاء Headers');
    }
    
    return sheet;
  } catch (error) {
    Logger.log('❌ خطأ في initializeOrderSheet: ' + error.toString());
    throw error;
  }
}

/**
 * استقبال POST request من الموقع
 * الـ payload يحتوي على:
 * {
 *   "name": "اسم العميل",
 *   "phone": "201234567890",
 *   "email": "email@example.com",
 *   "address": "العنوان",
 *   "governorate": "المحافظة",
 *   "city": "المدينة",
 *   "paymethod": "طريقة الدفع",
 *   "cartItems": "[{...}]",
 *   "total": "1500"
 * }
 */
function doPost(e) {
  try {
    let payload = {};
    
    if (e.postData && e.postData.contents) {
      payload = JSON.parse(e.postData.contents);
    } else if (e.parameter) {
      payload = e.parameter;
    }
    
    // التحقق من الحقول المطلوبة
    const requiredFields = ['name', 'phone', 'address', 'governorate', 'city', 'paymethod'];
    for (let field of requiredFields) {
      if (!payload[field]) {
        return ContentService.createTextOutput(JSON.stringify({
          success: false,
          error: `حقل مطلوب: ${field}`
        })).setMimeType(ContentService.MimeType.JSON);
      }
    }
    
    // تهيئة الجدول
    const sheet = initializeOrderSheet();
    
    // إنشاء timestamp بـ توقيت مصر
    const timestamp = new Date().toLocaleString('ar-EG', { 
      timeZone: 'Africa/Cairo',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
    
    // تحضير بيانات الصف
    const rowData = [
      timestamp,
      payload.name || '',
      payload.phone || '',
      payload.email || '',
      payload.address || '',
      payload.governorate || '',
      payload.city || '',
      payload.paymethod || '',
      payload.cartItems || '[]',
      payload.total || '0',
      payload.notes || 'من الموقع',
      'Pending'
    ];
    
    // إضافة الصف
    sheet.appendRow(rowData);
    
    // Formatting للصف الجديد
    const lastRow = sheet.getLastRow();
    sheet.getRange(lastRow, 1, 1, rowData.length).setFontSize(11);
    
    Logger.log('✅ تم حفظ الطلب: ' + payload.phone + ' - ' + payload.name);
    
    return ContentService.createTextOutput(JSON.stringify({
      success: true,
      message: 'تم استقبال الطلب بنجاح',
      orderId: lastRow,
      timestamp: timestamp
    })).setMimeType(ContentService.MimeType.JSON);
    
  } catch (error) {
    Logger.log('❌ خطأ: ' + error.toString());
    return ContentService.createTextOutput(JSON.stringify({
      success: false,
      error: error.toString()
    })).setMimeType(ContentService.MimeType.JSON);
  }
}

/**
 * الحصول على جميع الطلبات
 */
function getAllOrders() {
  try {
    const sheet = initializeOrderSheet();
    const data = sheet.getDataRange().getValues();
    
    if (data.length <= 1) {
      return {
        success: true,
        orders: [],
        totalOrders: 0
      };
    }
    
    const headers = data[0];
    const orders = [];
    
    for (let i = 1; i < data.length; i++) {
      const order = {};
      for (let j = 0; j < headers.length; j++) {
        order[headers[j]] = data[i][j];
      }
      orders.push(order);
    }
    
    return {
      success: true,
      orders: orders,
      totalOrders: orders.length
    };
  } catch (error) {
    return { success: false, error: error.toString() };
  }
}

/**
 * تحديث حالة الطلب
 */
function updateOrderStatus(rowNumber, newStatus) {
  try {
    const sheet = initializeOrderSheet();
    const statusColumn = 12; // آخر عمود
    
    if (rowNumber > 0 && rowNumber <= sheet.getLastRow()) {
      sheet.getRange(rowNumber, statusColumn).setValue(newStatus);
      return {
        success: true,
        message: 'تم تحديث حالة الطلب'
      };
    }
    
    return {
      success: false,
      error: 'رقم الصف غير صحيح'
    };
  } catch (error) {
    return { success: false, error: error.toString() };
  }
}

/**
 * إحصائيات الطلبات
 */
function getOrderStats() {
  try {
    const sheet = initializeOrderSheet();
    const data = sheet.getDataRange().getValues();
    
    let totalOrders = data.length - 1;
    let pendingOrders = 0;
    let confirmedOrders = 0;
    let shippedOrders = 0;
    let totalRevenue = 0;
    
    for (let i = 1; i < data.length; i++) {
      const status = data[i][11]; // Status column
      const total = parseFloat(data[i][9]) || 0;
      
      totalRevenue += total;
      
      if (status === 'Pending') pendingOrders++;
      else if (status === 'Confirmed') confirmedOrders++;
      else if (status === 'Shipped') shippedOrders++;
    }
    
    return {
      success: true,
      stats: {
        totalOrders: totalOrders,
        pendingOrders: pendingOrders,
        confirmedOrders: confirmedOrders,
        shippedOrders: shippedOrders,
        totalRevenue: totalRevenue.toFixed(2)
      }
    };
  } catch (error) {
    return { success: false, error: error.toString() };
  }
}

/**
 * دالة اختبار - فعّلها من Run menu
 * اضغط Run > testInit
 */
function testInit() {
  if (!SPREADSHEET_ID || SPREADSHEET_ID.length < 10) {
    Logger.log('❌ خطأ: أدخل SPREADSHEET_ID في السطر 7');
    return;
  }
  initializeOrderSheet();
  Logger.log('✅ تم تهيئة الجدول بنجاح');
}

/**
 * دالة اختبار - إرسال طلب تجريبي
 */
function testOrder() {
  if (!SPREADSHEET_ID || SPREADSHEET_ID.length < 10) {
    Logger.log('❌ خطأ: أدخل SPREADSHEET_ID في السطر 7');
    return;
  }
  
  const testData = {
    name: 'أحمد محمد',
    phone: '201234567890',
    email: 'test@example.com',
    address: 'شارع النيل رقم 42',
    governorate: 'القاهرة',
    city: 'القاهرة الجديدة',
    paymethod: 'Cash on Delivery',
    cartItems: JSON.stringify([
      { title: 'لوحة غروب القاهرة', price: 1500, qty: 1, size: '100×70' }
    ]),
    total: '1500',
    notes: 'اختبار من Apps Script'
  };
  
  const mockEvent = {
    postData: {
      contents: JSON.stringify(testData)
    }
  };
  
  const result = doPost(mockEvent);
  Logger.log('📋 النتيجة:');
  Logger.log(result.getContent());
}
