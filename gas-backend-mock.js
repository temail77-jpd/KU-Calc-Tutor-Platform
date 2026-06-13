/**
 * =========================================================================
 * GOOGLE APPS SCRIPT BACKEND REFERENCE (gas-backend-mock.js)
 * -------------------------------------------------------------------------
 * This is a reference backend code block designed to be deployed as a 
 * Web App on Google Apps Script. It connects to a Google Spreadsheet 
 * serving as a lightweight database for student emails, passwords, names, 
 * and credit balances.
 * =========================================================================
 */

// Spreadsheet Configuration (Replace with your own Spreadsheet ID or active sheet)
const SPREADSHEET_ID = "YOUR_SPREADSHEET_ID_HERE";
const SHEET_NAME = "Students"; // Columns expected: A: Email, B: Password, C: Name, D: Credits

/**
 * ! =======================================================================
 * ! SECURITY WARNING FOR PRODUCTION BUILD:
 * ! -----------------------------------------------------------------------
 * ! 1. DO NOT STORE PASSWORDS AS PLAIN TEXT inside Google Spreadsheet rows.
 * !    Doing so exposes student credentials to anyone with sheet access.
 * !
 * ! 2. RECOMMENDATIONS FOR PRODUCTION:
 * !    - HASH PASSWORDS: If using Google Sheets, apply a secure one-way hash 
 * !      (e.g., bcrypt, PBKDF2, or SHA-256 with a unique salt per user) on the 
 * !      client or inside Apps Script before storing.
 * !    - INTEGRATE FIREBASE AUTH: Instead of Google Sheets for auth, use 
 * !      Firebase Authentication (via Firebase REST APIs) which handles 
 * !      password hashing, session tokens, and security rules automatically.
 * !      You can still use Google Sheets to log transactional credits synced by UID.
 * ! =======================================================================
 */

/**
 * 1. HTTP GET Request Handler (doGet)
 * Handles client logins.
 * e.g., URL?action=login&email=somchai@email.com&password=password123
 */
function doGet(e) {
  const params = e.parameter;
  const action = params.action;
  const email = params.email;
  const password = params.password;

  if (!action || !email) {
    return createJsonResponse({ success: false, error: "Missing action or email parameter" });
  }

  try {
    const sheet = getDatabaseSheet();
    const studentData = findStudentRow(sheet, email);

    if (action === "login") {
      if (!password) {
        return createJsonResponse({ success: false, error: "Missing password parameter" });
      }

      if (studentData) {
        // Simple plain text verify for mockup/demo only. See security warning above!
        if (studentData.password === password) {
          return createJsonResponse({
            success: true,
            email: email,
            name: studentData.name,
            balance: studentData.balance
          });
        } else {
          return createJsonResponse({ success: false, error: "รหัสผ่านไม่ถูกต้อง" });
        }
      } else {
        // Automatically register new students with signup bonus (100 credits) for demo
        const defaultCredits = 100;
        const studentName = "นักเรียนใหม่ (New Student)";
        // Append row: Email, Password, Name, Credits
        sheet.appendRow([email, password, studentName, defaultCredits]);
        
        return createJsonResponse({
          success: true,
          email: email,
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
    const email = postData.email;
    const amount = parseInt(postData.amount, 10);

    if (!action || !email || isNaN(amount)) {
      return createJsonResponse({ success: false, error: "Missing parameters or invalid amount" });
    }

    const sheet = getDatabaseSheet();
    const studentData = findStudentRow(sheet, email);

    if (!studentData) {
      return createJsonResponse({ success: false, error: "Student not found" });
    }

    let newBalance = studentData.balance;

    if (action === "deduct") {
      newBalance = Math.max(0, studentData.balance - amount);
      sheet.getRange(studentData.rowIndex, 4).setValue(newBalance); // Deduct credits in Col D (Credits)
      
      return createJsonResponse({
        success: true,
        email: email,
        deducted: amount,
        balance: newBalance
      });
    } 
    
    if (action === "topup") {
      newBalance = studentData.balance + amount;
      sheet.getRange(studentData.rowIndex, 4).setValue(newBalance); // Update credits in Col D (Credits)
      
      return createJsonResponse({
        success: true,
        email: email,
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
 * Helper: Find Student Row by Email
 * Returns the student details and row index if found.
 */
function findStudentRow(sheet, email) {
  const data = sheet.getDataRange().getValues();
  // Assume: Row 1 is header (Email, Password, Name, Credits)
  for (let i = 1; i < data.length; i++) {
    if (String(data[i][0]).toLowerCase().trim() === String(email).toLowerCase().trim()) {
      return {
        rowIndex: i + 1, // 1-indexed row number
        email: String(data[i][0]).toLowerCase().trim(),
        password: String(data[i][1]),
        name: data[i][2],
        balance: parseInt(data[i][3], 10) || 0
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
    sheet.appendRow(["Email", "Password", "Name", "Credits"]);
  }
  return sheet;
}

/**
 * Helper: Create JSON Response
 */
function createJsonResponse(data) {
  return ContentService.createTextOutput(JSON.stringify(data))
    .setMimeType(ContentService.MimeType.JSON);
}
