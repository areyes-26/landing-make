# SheetSync

SheetSync is a Next.js application that allows users to submit content suggestions through a form. The submitted data is categorized by an AI model and then sent to a Google Sheet via Google Apps Script.

## Features

- Simple submission form for 'Suggested Title', 'Suggested Content', and 'Avatar ID'.
- AI-powered content categorization and appropriateness check.
- Data submission to Google Sheets.
- Confirmation messages on successful submission.
- Built with Next.js (App Router, Server Actions) and ShadCN UI components.
- Deployable on Firebase Hosting.

## Setup and Deployment

### 1. Google Apps Script Setup

You need to set up a Google Apps Script to receive data from this Next.js application and populate a Google Sheet.

**A. Create a Google Sheet:**
   - Go to [Google Sheets](https://sheets.new) and create a new spreadsheet.
   - You can name it, for example, "SheetSync Submissions".
   - Optionally, add headers to the first row. The script provided below can also create headers if the sheet is empty. Suggested headers: `Timestamp`, `Suggested Title`, `Suggested Content`, `Avatar ID`, `AI Category`.

**B. Open the Script Editor:**
   - In your Google Sheet, go to `Extensions > Apps Script`.
   - This will open a new script project. Delete any content in `Code.gs`.

**C. Add the Apps Script Code:**
   - Copy the following code into the `Code.gs` file:

   ```javascript
   // Google Apps Script - Code.gs
   function doPost(e) {
     try {
       var requestData = JSON.parse(e.postData.contents);

       // Replace "Sheet1" with your actual sheet name if it's different, or leave as is to use the active sheet.
       var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("Sheet1"); 
       if (!sheet) {
           sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet(); // Fallback to active sheet
       }

       // Define expected headers. The order matters for data mapping if headers are not found.
       var expectedHeaders = ["Timestamp", "Suggested Title", "Suggested Content", "Avatar ID", "AI Category"];
       
       var lastRow = sheet.getLastRow();
       var currentHeaders = [];
       if (lastRow > 0) {
           currentHeaders = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
       }

       // Check if headers exist, if not, append them
       var headersAreMissing = expectedHeaders.some(header => currentHeaders.indexOf(header) === -1);
       if (lastRow === 0 || headersAreMissing) {
           sheet.appendRow(expectedHeaders);
           currentHeaders = expectedHeaders; // Update currentHeaders after appending
           lastRow = 1; // Headers are now the first row
       }
       
       // Prepare data for the new row based on header order
       var newRowData = currentHeaders.map(header => {
           switch(header) {
               case "Timestamp":
                   return new Date();
               case "Suggested Title":
                   return requestData.suggestedTitle || "";
               case "Suggested Content":
                   return requestData.suggestedContent || "";
               case "Avatar ID":
                   return requestData.avatarId || "";
               case "AI Category":
                   return requestData.aiCategory || "";
               default:
                   return ""; // For any other headers, leave blank or handle as needed
           }
       });

       sheet.appendRow(newRowData);

       return ContentService.createTextOutput(JSON.stringify({ success: true, message: "Data added to sheet." }))
         .setMimeType(ContentService.MimeType.JSON);

     } catch (error) {
       Logger.log(error.toString());
       return ContentService.createTextOutput(JSON.stringify({ success: false, message: "Error processing request: " + error.toString() }))
         .setMimeType(ContentService.MimeType.JSON)
         .setStatusCode(500);
     }
   }
   ```

**D. Deploy the Script as a Web App:**
   - Save the script (File > Save).
   - Click on `Deploy > New deployment`.
   - For "Select type", choose `Web app`.
   - In the "New deployment" dialog:
     - **Description:** (Optional) e.g., "SheetSync Data Receiver".
     - **Execute as:** `Me (your.email@example.com)`.
     - **Who has access:** `Anyone`. 
       * **Important Security Note:** Setting access to `Anyone` means the URL is public. Keep this URL secret. If your organization uses Google Workspace, you might restrict it to `Anyone within [Your Organization]`. For higher security, OAuth2 would be needed, which is beyond this simple setup.
   - Click `Deploy`.
   - **Authorize access:** You'll likely need to authorize the script. Click `Authorize access`, choose your Google account, and allow the permissions. You might see a "Google hasn't verified this app" warning; click "Advanced" and then "Go to (your script name) (unsafe)".
   - **Copy the Web app URL:** After deployment, a Web app URL will be provided. Copy this URL. You will need it for the Next.js application's environment variable.

### 2. Firebase Project Setup

**A. Create a Firebase Project:**
   - Go to the [Firebase Console](https://console.firebase.google.com/) and create a new project.

**B. Install Firebase CLI:**
   - If you don't have it, install the Firebase CLI: `npm install -g firebase-tools`

**C. Login to Firebase:**
   - `firebase login`

**D. Initialize Firebase Hosting:**
   - This project is already configured for Firebase App Hosting via `apphosting.yaml`. 
   - If you were using traditional Firebase Hosting for Next.js, you'd run `firebase init hosting` and configure rewrites to a Cloud Function serving your Next.js app. With App Hosting, this is simplified.

### 3. Environment Variables

**A. Local Development:**
   - Create a file named `.env.local` in the root of your Next.js project.
   - Add your Google Apps Script Web app URL to this file:
     ```
     GOOGLE_SCRIPT_URL=YOUR_GOOGLE_APPS_SCRIPT_WEB_APP_URL_HERE
     ```
   - Replace `YOUR_GOOGLE_APPS_SCRIPT_WEB_APP_URL_HERE` with the URL you copied in step 1.D.
   - This file is ignored by Git (ensure `.env.local` is in your `.gitignore`).

**B. Firebase App Hosting Deployment:**
   - For Firebase App Hosting, environment variables are typically set in the Firebase console for your App Hosting backend or via `apphosting.yaml` if supported for build-time substitution (less common for secrets).
   - Go to your Firebase project in the console.
   - Navigate to `App Hosting`.
   - Select your backend.
   - Look for a section to manage environment variables or build settings where you can securely store `GOOGLE_SCRIPT_URL`.
   - Alternatively, if you are using Firebase Functions as an intermediary (not the current setup with Server Actions), you would set environment variables for the function.

### 4. Running Locally

   - Install dependencies: `npm install`
   - Run the development server: `npm run dev`
   - The application will be available at `http://localhost:9002` (or the port specified in your `package.json`).

### 5. Deployment to Firebase App Hosting

   - **Build your Next.js app:** `npm run build`
   - **Deploy:** `firebase deploy --only hosting` (or `firebase deploy` if only App Hosting is configured).
     Firebase App Hosting uses the `apphosting.yaml` file to determine how to build and run your Next.js application.

## Optional: Google Sheets Update Notifications (Webhook)

This feature allows Google Sheets to notify your system when a specific cell is updated (e.g., an "Estado" column).

**A. Create a Notification Endpoint:**
   - You'll need an endpoint in your system that can receive POST requests. This could be:
     - A Next.js API Route (e.g., `src/app/api/sheet-update/route.ts`).
     - A Firebase Cloud Function.
   - This endpoint should be secured (e.g., by checking a secret token passed in the request).

**B. Modify Google Apps Script:**
   - Add an `onEdit(e)` function to your `Code.gs` file in Google Apps Script. This function runs automatically when any cell in the spreadsheet is edited.

   ```javascript
   // Add this to your Code.gs
   function onEdit(e) {
     var range = e.range;
     var sheet = range.getSheet();
     var editedRow = range.getRow();
     var editedCol = range.getColumn();

     // Define the sheet name and column to watch (e.g., "Estado" column)
     var sheetNameToWatch = "Sheet1"; // Or your specific sheet name
     var columnToWatch = 5; // Example: Column E for "Estado". Adjust as needed.
                           // You can find column number or match by header name.
     var notificationUrl = "YOUR_NOTIFICATION_ENDPOINT_URL"; // Replace with your actual endpoint URL
     var secretToken = "YOUR_SECRET_TOKEN"; // A secret token to verify the request

     if (sheet.getName() === sheetNameToWatch && editedCol === columnToWatch) {
       var cellValue = range.getValue();
       var rowData = sheet.getRange(editedRow, 1, 1, sheet.getLastColumn()).getValues()[0]; // Get the whole row data
       
       // Example: Trigger if "Estado" is "Completed"
       if (cellValue === "Completed") {
         var payload = {
           secret: secretToken,
           rowIndex: editedRow,
           updatedColumn: editedCol,
           newValue: cellValue,
           rowData: rowData // Send relevant data
         };

         var options = {
           'method' : 'post',
           'contentType': 'application/json',
           'payload' : JSON.stringify(payload)
         };

         try {
           UrlFetchApp.fetch(notificationUrl, options);
           Logger.log("Notification sent for row: " + editedRow);
         } catch (error) {
           Logger.log("Error sending notification: " + error.toString());
         }
       }
     }
   }
   ```

**C. Secure Your Endpoint:**
   - In your Firebase Function or Next.js API route, verify the `secretToken` from the payload before processing the request.

**D. Set Up Triggers (If `onEdit` isn't sufficient):**
   - If you need more control or if `onEdit` simple triggers have limitations (e.g., script runtime), you can set up installable triggers in Apps Script:
     - In the Apps Script editor, go to `Triggers` (clock icon on the left).
     - Click `+ Add Trigger`.
     - Choose `onEditEvent` (or `onMyEdit` if you named it differently) to run from spreadsheet `on edit`.

This provides a basic framework. The exact implementation of the notification endpoint and the logic within `onEdit(e)` will depend on your specific requirements.
