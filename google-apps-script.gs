/**
 * RSVP -> Google Sheet backend.
 *
 * Setup:
 *   1. Create a Google Sheet for RSVPs (any name).
 *   2. In the Sheet, open Extensions > Apps Script.
 *   3. Delete any starter code and paste this whole file in.
 *   4. Run `setupSheet` once from the Apps Script editor (Run button) to add
 *      header row and grant permissions.
 *   5. Deploy > New deployment > type "Web app".
 *        - Execute as: Me
 *        - Who has access: Anyone
 *   6. Copy the deployment URL and paste it into GOOGLE_SCRIPT_URL in
 *      js/main.js on the site.
 */

function setupSheet() {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
  if (sheet.getRange('A1').getValue() === '') {
    sheet.appendRow(['Timestamp', '姓名', '男方/女方親友', '是否參加', '大人', '小孩', '素食人數', '需要電子喜帖', '電子喜帖 Email', '需要紙本喜帖', '寄送地址', '留言']);
  }
}

function doPost(e) {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
  const params = e.parameter;

  sheet.appendRow([
    new Date(),
    params.guestName || '',
    params.guestSide === 'bride' ? '女方親友' : '男方親友',
    params.attending === 'attending' ? '參加' : '不克參與',
    params.adultCount || '',
    params.kidCount || '',
    params.vegCount || '',
    params.needsEcard === 'yes' ? '需要' : '不需要',
    params.guestEmail || '',
    params.needsCard === 'yes' ? '需要' : '不需要',
    params.mailingAddress || '',
    params.guestMessage || '',
  ]);

  return ContentService
    .createTextOutput(JSON.stringify({ result: 'success' }))
    .setMimeType(ContentService.MimeType.JSON);
}
