/**
 * ==============================================================================================
 * Google Apps Script: URL Shortener & QR Code Generator with Google Sheet Logger
 * ระบบย่อลิงก์ Google Apps Script และสร้าง QR Code พร้อมบันทึกข้อมูลลง Google Sheet อัตโนมัติ
 * Spreadsheet ID: 19lTnU0PZMlUEAleqfiHEvNks2HBqbbrfFMj5Mwv0R98
 * คอลัมน์ใน Sheet: Timestamp | Topic | Url | Short Url | QR code
 * ==============================================================================================
 */

// รหัส Google Sheet สำหรับจัดเก็บข้อมูล
const SPREADSHEET_ID = '19lTnU0PZMlUEAleqfiHEvNks2HBqbbrfFMj5Mwv0R98';
const SHEET_NAME = 'Sheet1'; // หรือชื่อแท็บที่ต้องการ

/**
 * ฟังก์ชันเริ่มต้นเมื่อเปิดเว็บแอป (Web App UI) หรือรับคำขอผ่าน GET
 */
function doGet(e) {
  // 1. หากมีพารามิเตอร์ action=getLinks ให้ส่งคืนประวัติล่าสุดเป็น JSON
  if (e && e.parameter && e.parameter.action === 'getLinks') {
    const limit = parseInt(e.parameter.limit, 10) || 100;
    const links = getRecentLinks(limit);
    return ContentService.createTextOutput(JSON.stringify({ status: 'success', data: links }))
      .setMimeType(ContentService.MimeType.JSON);
  }

  // 2. หากมีการเรียกย่อลิงก์ผ่าน GET Request: ?action=shorten&url=...&topic=...
  if (e && e.parameter && (e.parameter.action === 'shorten' || e.parameter.url)) {
    const targetUrl = e.parameter.url || e.parameter.longUrl;
    if (targetUrl) {
      const topic = e.parameter.topic || e.parameter.title || 'GAS Web App Link';
      const result = processShortenUrl(targetUrl, topic);
      return ContentService.createTextOutput(JSON.stringify(result))
        .setMimeType(ContentService.MimeType.JSON);
    }
  }

  // 3. ค่าเริ่มต้น: แสดงหน้าเว็บ UI (index.html)
  return HtmlService.createHtmlOutputFromFile('index')
    .setTitle('ระบบย่อ URL & สร้าง QR Code | Google Apps Script')
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL)
    .addMetaTag('viewport', 'width=device-width, initial-scale=1.0');
}

/**
 * ฟังก์ชันรับคำขอแบบ POST (สำหรับ AJAX/Form Submission)
 */
function doPost(e) {
  try {
    let postData = {};
    if (e && e.postData && e.postData.contents) {
      try {
        postData = JSON.parse(e.postData.contents);
      } catch (jsonErr) {
        postData = e.parameter || {};
      }
    } else if (e && e.parameter) {
      postData = e.parameter;
    }

    const longUrl = postData.url || postData.longUrl;
    const topic = postData.topic || postData.title || 'ไม่มีหัวข้อ';

    if (!longUrl) {
      return ContentService.createTextOutput(JSON.stringify({
        status: 'error',
        message: 'กรุณาระบุ URL ที่ต้องการย่อ'
      })).setMimeType(ContentService.MimeType.JSON);
    }

    const result = processShortenUrl(longUrl, topic);
    return ContentService.createTextOutput(JSON.stringify(result))
      .setMimeType(ContentService.MimeType.JSON);

  } catch (error) {
    return ContentService.createTextOutput(JSON.stringify({
      status: 'error',
      message: error.toString()
    })).setMimeType(ContentService.MimeType.JSON);
  }
}

/**
 * ฟังก์ชันหลักในการย่อ URL, สร้าง QR Code และบันทึกลง Sheet
 */
function processShortenUrl(longUrl, topic) {
  try {
    // 1. ตรวจสอบและทำความสะอาด URL
    let cleanLongUrl = (longUrl || '').trim();
    if (!cleanLongUrl.startsWith('http://') && !cleanLongUrl.startsWith('https://')) {
      cleanLongUrl = 'https://' + cleanLongUrl;
    }

    // 2. ย่อ URL ผ่าน Multi-Shortener API Engine
    const shortUrl = callShortenerApi(cleanLongUrl);

    // 3. สร้าง URL ของภาพ QR Code คุณภาพสูง (300x300 px) สแกนจาก shortUrl
    const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(shortUrl)}`;

    // 4. บันทึกข้อมูลลง Google Sheet (Timestamp, Topic, Url, Short Url, QR code)
    const rowData = saveToGoogleSheet({
      topic: topic || 'GAS Web App Link',
      longUrl: cleanLongUrl,
      shortUrl: shortUrl,
      qrCodeUrl: qrCodeUrl
    });

    return {
      status: 'success',
      data: {
        timestamp: rowData.timestamp,
        topic: topic,
        longUrl: cleanLongUrl,
        shortUrl: shortUrl,
        qrCodeUrl: qrCodeUrl,
        sheetRow: rowData.row
      }
    };
  } catch (err) {
    Logger.log('processShortenUrl Error: ' + err);
    return {
      status: 'error',
      message: err.toString()
    };
  }
}

/**
 * บริการย่อ URL แบบ Direct Redirect (Ulvis -> CleanURI -> Clck.ru)
 * ปลอดโฆษณา 100% ไม่มีหน้าคั่น Preview สแกนหรือคลิกแล้วเด้งเข้าเว็บทันที
 */
function callShortenerApi(longUrl) {
  // อันดับ 1: Ulvis API (Direct 301 Redirect ปลอดโฆษณา 100%)
  try {
    const ulvisEndpoint = `https://ulvis.net/API/write/get?url=${encodeURIComponent(longUrl)}`;
    const response1 = UrlFetchApp.fetch(ulvisEndpoint, { muteHttpExceptions: true });
    if (response1.getResponseCode() === 200) {
      const json1 = JSON.parse(response1.getContentText());
      if (json1 && json1.success && json1.data && json1.data.url) {
        Logger.log('Shortened with Ulvis (No Ads): ' + json1.data.url);
        return json1.data.url;
      }
    }
  } catch (e1) {
    Logger.log('Ulvis API Error: ' + e1);
  }

  // อันดับ 2: CleanURI API (Direct 301 Redirect ปลอดโฆษณา 100%)
  try {
    const cleanUriEndpoint = 'https://cleanuri.com/api/v1/shorten';
    const options = {
      method: 'post',
      payload: { url: longUrl },
      muteHttpExceptions: true
    };
    const response2 = UrlFetchApp.fetch(cleanUriEndpoint, options);
    if (response2.getResponseCode() === 200) {
      const json2 = JSON.parse(response2.getContentText());
      if (json2 && json2.result_url) {
        Logger.log('Shortened with CleanURI (No Ads): ' + json2.result_url);
        return json2.result_url;
      }
    }
  } catch (e2) {
    Logger.log('CleanURI API Error: ' + e2);
  }

  // อันดับ 3: Clck.ru API (Direct Redirect ปลอดโฆษณา 100%)
  try {
    const clckEndpoint = `https://clck.ru/--?url=${encodeURIComponent(longUrl)}`;
    const response3 = UrlFetchApp.fetch(clckEndpoint, { muteHttpExceptions: true });
    if (response3.getResponseCode() === 200) {
      const resText = response3.getContentText().trim();
      if (resText.startsWith('http')) {
        Logger.log('Shortened with Clck.ru (No Ads): ' + resText);
        return resText;
      }
    }
  } catch (e3) {
    Logger.log('Clck.ru API Error: ' + e3);
  }

  return longUrl;
}

/**
 * ดึงออบเจ็กต์ Google Sheet ปลายทาง
 */
function getTargetSheet() {
  let ss = null;
  try {
    ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  } catch (e) {
    Logger.log('SpreadsheetApp.openById failed, trying getActiveSpreadsheet: ' + e);
    try {
      ss = SpreadsheetApp.getActiveSpreadsheet();
    } catch (e2) {
      Logger.log('getActiveSpreadsheet failed: ' + e2);
    }
  }

  if (!ss) {
    throw new Error('ไม่สามารถเปิด Google Spreadsheet ได้ กรุณาตรวจสอบ ID: ' + SPREADSHEET_ID + ' หรือสิทธิ์การเข้าถึง');
  }

  let sheet = ss.getSheetByName(SHEET_NAME);
  if (!sheet) {
    sheet = ss.getSheets()[0]; // ใช้ชีตแรกของไฟล์เสมอ
  }
  return sheet;
}

/**
 * ฟังก์ชันบันทึกแถวข้อมูลลงใน Google Sheet
 * ตาราง: Timestamp | Topic | Url | Short Url | QR code
 */
function saveToGoogleSheet(data) {
  const sheet = getTargetSheet();

  // ตรวจสอบและสร้างหัวตาราง (Headers) หากยังไม่มี
  if (sheet.getLastRow() === 0) {
    const headers = [
      'Timestamp',
      'Topic',
      'Url',
      'Short Url',
      'QR code'
    ];
    sheet.appendRow(headers);
    const headerRange = sheet.getRange(1, 1, 1, headers.length);
    headerRange.setBackground('#1e293b');
    headerRange.setFontColor('#ffffff');
    headerRange.setFontWeight('bold');
    sheet.setFrozenRows(1);
  }

  // กำหนดรูปแบบวัน-เวลา
  const formattedDate = Utilities.formatDate(new Date(), 'Asia/Bangkok', 'dd/MM/yyyy HH:mm:ss');
  
  // สูตรแสดงภาพ QR Code ภายในเซลล์ของ Google Sheet
  const imageFormula = `=IMAGE("${data.qrCodeUrl}", 1)`;

  // เพิ่มข้อมูลแถวใหม่ (Timestamp, Topic, Url, Short Url, QR code)
  sheet.appendRow([
    formattedDate,
    data.topic,
    data.longUrl,
    data.shortUrl,
    imageFormula
  ]);

  // ปรับความสูงแถวล่าสุดเพื่อให้แสดงรูปภาพ QR Code สวยงาม
  const lastRow = sheet.getLastRow();
  try {
    sheet.setRowHeight(lastRow, 65);
  } catch (hErr) {
    Logger.log('setRowHeight error: ' + hErr);
  }

  return {
    timestamp: formattedDate,
    row: lastRow
  };
}

/**
 * ดึงรายการล่าสุดจาก Google Sheet เพื่อแสดงในประวัติบนหน้าเว็บ
 * เรียงลำดับจาก "วันเดือนปีล่าสุด" ให้อยู่ลำดับแรกสุดเสมอ (Newest First)
 */
function getRecentLinks(limit = 100) {
  try {
    const sheet = getTargetSheet();
    const lastRow = sheet.getLastRow();
    
    if (lastRow <= 1) return [];

    const startRow = 2;
    const numRows = lastRow - 1;
    // อ่านข้อมูล 5 คอลัมน์: Timestamp, Topic, Url, Short Url, QR code
    const values = sheet.getRange(startRow, 1, numRows, 5).getValues();

    const links = [];
    // วนลูปจากแถวล่างสุด (ข้อมูลที่เพิ่งเพิ่มล่าสุด) ย้อนกลับไปแถวแรก
    for (let i = values.length - 1; i >= 0 && links.length < limit; i--) {
      const row = values[i];
      if (row[2] || row[3]) { // ต้องมี Url หรือ Short Url
        const shortUrl = row[3] || row[2];
        const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(shortUrl)}`;
        
        // จัดการฟอร์แมต Timestamp ให้เป็นข้อความที่อ่านง่าย
        let timestampStr = '';
        if (row[0] instanceof Date) {
          timestampStr = Utilities.formatDate(row[0], 'Asia/Bangkok', 'dd/MM/yyyy HH:mm:ss');
        } else {
          timestampStr = String(row[0] || '');
        }

        links.push({
          timestamp: timestampStr,
          topic: String(row[1] || 'ไม่มีหัวข้อ'),
          longUrl: String(row[2] || ''),
          shortUrl: String(shortUrl),
          qrCodeUrl: qrCodeUrl
        });
      }
    }
    return links;
  } catch (err) {
    Logger.log('getRecentLinks error: ' + err);
    return [];
  }
}

/**
 * ฟังก์ชันสำหรับทดสอบการบันทึกข้อมูลลง Google Sheet โดยตรง (คลิก Run เพื่อทดสอบและให้สิทธิ์)
 */
function testSave() {
  const testData = processShortenUrl(
    'https://script.google.com/macros/s/AKfycbx_testing_very_long_url_sample_12345/exec',
    'ทดสอบระบบย่อลิงก์ & QR Code'
  );
  Logger.log('ผลการทดสอบ: ' + JSON.stringify(testData));
  return testData;
}
