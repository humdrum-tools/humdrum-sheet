/////////////////////////////////////////////////////////////////////////////
//
// Menu related functions --
//

//////////////////////////////
//
// recolorizeContents --  Colorize Humdrum data.  Currently only works
//  on the first worksheet tab of the spreadsheet.
//

function recolorizeContents() {
  let ss = SpreadsheetApp.getActive();
  let sheet = ss.getActiveSheet();
  let allRange = sheet.getDataRange();
  let data = allRange.getValues();
  if (data.length == 0) {
    return;
  }
  let firstcolumn = getFirstColumn(data);
  if (firstcolumn > 0) {
    for (let i = 0; i < data.length; i++) {
      data[i] = data[i].splice(0, firstcolumn);
    }
  }
  sheet.clearFormats();
  allRange.clearFormat();
  colorizeData(sheet, data);
  allRange.setShowHyperlink(false);
}



//////////////////////////////
//
// getFirstColumn -- Return the first non-IGNORE column
//     in the data array.
//

function getFirstColumn(data) {
  let output = 0;
  for (let i = 0; i < data[0].length; i++) {
    if (data[0][i].match(/^\s*IGNORE\s*$/)) {
      continue;
    }
    output = i;
    break;
  }
  return output;
}



//////////////////////////////
//
// fixBarlineRows -- Add single quotes in front of equal signs in the
// spreadsheet.
//    Currently not dealing with IGNORE columns.   Currently only works on the
//    first worksheet of the spreadsheet.  Checks the first column for lines
//    that start with "=" or "'=" and then forces all contents on the line to be
//    "'=".
//

function fixBarlineRows() {
  let ss = SpreadsheetApp.getActive();
  let sheet = ss.getActiveSheet();
  let allRange = sheet.getDataRange();
  let formulas = allRange.getFormulas();
  let data = allRange.getValues();
  if (data.length == 0) {
    return;
  }
  for (let i = 0; i < data.length; i++) {
    if (formulas[i][0]) {
      data[i][0] = formulas[i][0];
    }
    if (!data[i][0].match(/^'?=/)) {
      continue;
    }
    for (let j = 0; j < data[i].length; j++) {
      if (formulas[i][j]) {
        data[i][j] = formulas[i][j];
      }
      if (data[i][j].match(/^=/)) {
        data[i][j] = '\'' + data[i][j];
      }
    }
  }
  allRange.setValues(data);
}



//////////////////////////////
//
// addNullInterpretationLine --
//

function addNullInterpretationLine() {
  addNullLine('*');
}



//////////////////////////////
//
// addNullCommentLine --
//

function addNullCommentLine() {
  addNullLine('!');
}



//////////////////////////////
//
// addNullDataLine --
//

function addNullDataLine() {
  addNullLine('.');
}
