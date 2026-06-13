/**
 * =========================================================================
 * GOOGLE APPS SCRIPT BACKEND REFERENCE (gas-backend-mock.js)
 * -------------------------------------------------------------------------
 * This is a reference backend code block designed to be deployed as a 
 * Web App on Google Apps Script. It connects to a Google Spreadsheet 
 * serving as a lightweight database for student IDs, names, and credit balances.
 * =========================================================================
 */

// Spreadsheet Configuration (Replace with your own Spreadsheet ID or active sheet)
const SPREADSHEET_ID = "YOUR_SPREADSHEET_ID_HERE";
const SHEET_NAME = "Students"; // Columns expected: A: StudentID, B: Name, C: Credits

/**
 * 1. HTTP GET Request Handler (doGet)
 * Handles client logins and balance fetches.
 * e.g., URL?action=login&studentId=6510401111
 */
function doGet(e) {
  const params = e.parameter;
  const action = params.action;
  const studentId = params.studentId;

  if (!action || !studentId) {
    return createJsonResponse({ success: false, error: "Missing action or studentId parameter" });
  }

  try {
    const sheet = getDatabaseSheet();
    const studentData = findStudentRow(sheet, studentId);

    if (action === "login") {
      if (studentData) {
        return createJsonResponse({
          success: true,
          studentId: studentId,
          name: studentData.name,
          balance: studentData.balance
        });
      } else {
        // Option A: Reject login if not found
        // return createJsonResponse({ success: false, error: "Student ID not registered" });

        // Option B: Automatically register new KU students with signup bonus (100 credits)
        const defaultCredits = 100;
        const studentName = "นิสิตใหม่ (KU Student)";
        sheet.appendRow([studentId, studentName, defaultCredits]);
        
        return createJsonResponse({
          success: true,
          studentId: studentId,
          name: studentName,
          balance: defaultCredits
        });
      }
    }

    return createJsonResponse({ success: false, error: "Invalid action" });

  } catch (error) {
    return createJsonResponse({ success: false, error: error.toString() });
  }
}

/**
 * 2. HTTP POST Request Handler (doPost)
 * Handles write operations (e.g. credit deductions and top-ups).
 * Payloads arrive in JSON format.
 */
function doPost(e) {
  try {
    const postData = JSON.parse(e.postData.contents);
    const action = postData.action;
    const studentId = postData.studentId;
    const amount = parseInt(postData.amount, 10);

    if (!action || !studentId || isNaN(amount)) {
      return createJsonResponse({ success: false, error: "Missing parameters or invalid amount" });
    }

    const sheet = getDatabaseSheet();
    const studentData = findStudentRow(sheet, studentId);

    if (!studentData) {
      return createJsonResponse({ success: false, error: "Student not found" });
    }

    let newBalance = studentData.balance;

    if (action === "deduct") {
      newBalance = Math.max(0, studentData.balance - amount);
      sheet.getRange(studentData.rowIndex, 3).setValue(newBalance); // Deduct credits in Col C
      
      return createJsonResponse({
        success: true,
        studentId: studentId,
        deducted: amount,
        balance: newBalance
      });
    } 
    
    if (action === "topup") {
      newBalance = studentData.balance + amount;
      sheet.getRange(studentData.rowIndex, 3).setValue(newBalance); // Update credits in Col C
      
      return createJsonResponse({
        success: true,
        studentId: studentId,
        added: amount,
        balance: newBalance
      });
    }

    return createJsonResponse({ success: false, error: "Invalid action" });

  } catch (error) {
    return createJsonResponse({ success: false, error: error.toString() });
  }
}

/**
 * Helper: Find Student Row
 * Returns the student details and row index if found.
 */
function findStudentRow(sheet, studentId) {
  const data = sheet.getDataRange().getValues();
  // Assume: Row 1 is header (StudentID, Name, Credits)
  for (let i = 1; i < data.length; i++) {
    // Force string comparison to prevent numeric student IDs matching issues
    if (String(data[i][0]).trim() === String(studentId).trim()) {
      return {
        rowIndex: i + 1, // 1-indexed row number
        studentId: String(data[i][0]),
        name: data[i][1],
        balance: parseInt(data[i][2], 10) || 0
      };
    }
  }
  return null;
}

/**
 * Helper: Access active Sheet
 */
function getDatabaseSheet() {
  let ss;
  if (SPREADSHEET_ID === "YOUR_SPREADSHEET_ID_HERE") {
    ss = SpreadsheetApp.getActiveSpreadsheet();
  } else {
    ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  }
  
  let sheet = ss.getSheetByName(SHEET_NAME);
  if (!sheet) {
    // Auto-create spreadsheet structure if it doesn't exist
    sheet = ss.insertSheet(SHEET_NAME);
    sheet.appendRow(["StudentID", "Name", "Credits"]);
  }
  return sheet;
}

/**
 * Helper: Create JSON Response with CORS-friendly headers
 */
function createJsonResponse(data) {
  return ContentService.createTextOutput(JSON.stringify(data))
    .setMimeType(ContentService.MimeType.JSON);
}
