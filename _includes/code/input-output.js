/////////////////////////////////////////////////////////////////////////////
//
// Input/Output functions -- The doGet() function sends data and the doPost()
//     receives data.
//

//////////////////////////////
//
// doGet -- send Humdrum data to a web page.
//

function doGet(e) {
  // let ss =
  // SpreadsheetApp.openById("1FIaXR2VrHwrvB7BAr90K79dwzKHH3HRht5Xa5p1mjnw");
  let ss = SpreadsheetApp.getActive();
  let sheet = ss.getActiveSheet();
  let url = ss.getUrl();
  let data = sheet.getRange(1, 1, sheet.getMaxRows(), sheet.getMaxColumns())
                 .getValues();
  let text = convertDataArrayToTSV(data);
  return ContentService.createTextOutput(text);
}



//////////////////////////////
//
// doPost -- receive Humdrum data from a web page.
//

function doPost(e) {
  // let ss =
  // SpreadsheetApp.openById("1FIaXR2VrHwrvB7BAr90K79dwzKHH3HRht5Xa5p1mjnw");
  // let sheet = ss.getSheetByName("Sheet1");
  let ss = SpreadsheetApp.getActive();
  let sheet = ss.getActiveSheet();
  let data = '';
  if (e && e.parameter && e.parameter.humdrum) {
    data = e.parameter.humdrum;
  } else {
    // Prepare a dummy score for testing:
    data = '**kern\n*clefG2\n=1\n*^\n1c;\t1C;\n*v\t*v\n*test\n==\n*-\n';
  }
  fillSheetWithHumdrumData(sheet, data);
  return ContentService.createTextOutput('FINISHED UPLOADING');
}
