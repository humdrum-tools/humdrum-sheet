//
// Programmer:     Craig Stuart Sapp (craig@ccrma.stanford.edu)
// Creation Date:  20 September 2020
// Last Modified:  10 October 2020
// URL:            http://sheet.humdrum.org/scripts/humdrum-sheet.js
//
// Description: Interface between Verovio Humdrum Viewer and Google
// Spreadsheets.
//              The doPost() function receives data (nominally from VHV, but can
//              be from any webpage).  And doGet() will send the data as TSV
//              content (typically after it has been edited in the spreadsheet).
//
// Documentation: https://doc.verovio.humdrum.org/interface/toolbar/spreadsheet
//
// To do: * Conditional formatting for colorizing data.  colorizeData()
// currently does
//          static colorizing.
//          see:
//          https://developers.google.com/apps-script/reference/spreadsheet/conditional-format-rule
//

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


/////////////////////////////////////////////////////////////////////////////
//
// Spreadsheet event processing
//

//////////////////////////////
//
// onOpen -- function to run when loading the spreadsheet.
//

function onOpen() {
  var ui = SpreadsheetApp.getUi();
  ui.createMenu('Humdrum')
      .addItem('Escape barline rows', 'fixBarlineRows')
      .addItem('Colorize data', 'recolorizeContents')
      //.addSeparator()
      .addSubMenu(
          ui.createMenu('Add above current line')
              .addItem('Interpretation line', 'addNullInterpretationLine')
              .addItem('Local comment line', 'addNullCommentLine')
              .addItem('Data line', 'addNullDataLine'))
      .addSubMenu(
          ui.createMenu('Show/hide columns')
              .addItem('Hide non-kern spines', 'hideNonKernSpines')
              .addItem('Show only selected spines', 'showOnlySelectedSpines')
              .addItem('Hide selected spines', 'hideSelectedSpines')
              .addItem('Show all spines', 'showAllSpines'))
      .addToUi();
}



//////////////////////////////
//
// onEdit -- function to run when the spreadsheet changes.
//
// Example event:
//
//  {
//    "source": {},
//    "authMode": "LIMITED",
//    "oldValue": "!!!final: GGG",
//    "user": {
//        "email": "",
//        "nickname": ""
//    },
//    "value": "!!!final: HHH",
//    "range": {
//        "columnEnd": 1,
//        "columnStart": 1,
//        "rowEnd": 16,
//        "rowStart": 16
//     }
//  }

function onEdit(e) {
  Logger.log('ONEDIT: ' + JSON.stringify(e, false, '   '));
}


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



//////////////////////////////
//
// hideNonKernSpines --
//

function hideNonKernSpines() {
  let ss = SpreadsheetApp.getActive();
  let sheet = ss.getActiveSheet();
  let allRange = sheet.getDataRange();
  let data = allRange.getValues();
  let nonkernspines = getNonKernSpines(sheet, data);
  let columnlist = getColumnIndexList(nonkernspines);
  for (let i = 0; i < columnlist.length; i++) {
    sheet.hideColumns(columnlist[i][0] + 1, columnlist[i][1]);
  }
}



//////////////////////////////
//
// showAllSpines --
//

function showAllSpines() {
  let ss = SpreadsheetApp.getActive();
  let sheet = ss.getActiveSheet();
  let allRange = ss.getDataRange();
  sheet.showColumns(1, sheet.getMaxColumns());
}



//////////////////////////////
//
// showOnlySelectedSpines --
//

function showOnlySelectedSpines() {
  let ss = SpreadsheetApp.getActive();
  let sheet = ss.getActiveSheet();
  let ranges = sheet.getActiveRangeList();
  let allRange = sheet.getDataRange();
  let data = allRange.getValues();
  if (data.length < 1) {
    return;
  }
  let spines =
      convertRangesToSpineIndexes(sheet, ranges.getRanges(), data[0].length);
  let notspines = reverseSpineSelection(spines, data[0].length);
  let columnlist = getColumnIndexList(notspines);
  for (let i = 0; i < columnlist.length; i++) {
    sheet.hideColumns(columnlist[i][0] + 1, columnlist[i][1]);
  }
}



//////////////////////////////
//
// hideSelectedSpines --
//

function hideSelectedSpines() {
  let ss = SpreadsheetApp.getActive();
  let sheet = ss.getActiveSheet();
  let allRange = sheet.getDataRange();
  let data = allRange.getValues();
  if (data.length < 1) {
    return;
  }
  let ranges = sheet.getActiveRangeList();
  let spines =
      convertRangesToSpineIndexes(sheet, ranges.getRanges(), data[0].length);
  let columnlist = getColumnIndexList(spines);
  for (let i = 0; i < columnlist.length; i++) {
    sheet.hideColumns(columnlist[i][0] + 1, columnlist[i][1]);
  }
}



///////////////////////////////////////////////////////////////////////////
//
// Support functions
//

//////////////////////////////
//
// reverseSpineSelection -- Give a list of column indexes, return
//    the list of columns that are not in the list.
//

function reverseSpineSelection(spines, maxcol) {
  let output = [];
  let count = {};
  for (let i = 0; i < spines.length; i++) {
    count[spines[i]] = 1;
  }
  for (let i = 0; i < maxcol; i++) {
    if (count[i]) {
      continue;
    }
    output.push(i);
  }
  return output;
}



//////////////////////////////
//
// convertRangesToSpineIndexes -- Input a list of ranges and output
//    a list of all columnns represented in the ranges.
//

function convertRangesToSpineIndexes(sheet, ranges, maxcol) {
  let output = [];
  let allRange = sheet.getDataRange();
  let data = allRange.getValues();
  let exinterp = getExinterpRowIndex(data);
  if (exinterp < 0) {
    return output;
  }

  for (let i = 0; i < ranges.length; i++) {
    let starting = ranges[i].getColumn();
    let ending = ranges[i].getLastColumn();
    if (ending > maxcol) {
      ending = maxcol;
    }
    for (let j = starting; j <= ending; j++) {
      output.push(j - 1);
    }
    let k = output[output.length - 1] + 1;
    while ((k < data[exinterp].length) && (data[exinterp][k] === '')) {
      output.push(k++);
    }
  }
  return output;
}



//////////////////////////////
//
// getColumnIndexList -- return a two-dimensional list of columns that
//     list the starting column in the first element and the count
//     of successive columns that follow in the second element.
//

function getColumnIndexList(inlist) {
  let output = [];
  let count;
  for (let i = 0; i < inlist.length; i++) {
    count = 1;
    for (let j = i + 1; j < inlist.length; j++) {
      if (inlist[j] == inlist[i] + 1) {
        count++;
      } else {
        break;
      }
    }
    let value = [inlist[i], count];
    output.push(value);
    i += count - 1;
  }
  return output;
}



//////////////////////////////
//
// getExinterpRowIndex -- Return the row index that contains the first exclusive
//    interpratation; otherwise, return -1.
//

function getExinterpRowIndex(data) {
  for (let i = 0; i < data.length; i++) {
    if (data[i][0].match(/^\*\*/)) {
      return i;
      break;
    }
  }
  return -1;
}



//////////////////////////////
//
// getNonKernSpines --  Return the list of colums that do not
//    have **kern in them.  If there one or more columns after a **kern
//    that are blank, then are considered **kern spines (due to
//    expanded tab possibility).
//

function getNonKernSpines(sheet, data) {
  let output = [];
  let exinterp = getExinterpRowIndex(data);
  if (exinterp < 0) {
    return output;
  }
  let lastinterp = '';
  for (let i = 0; i < data[exinterp].length; i++) {
    if (data[exinterp][i] === '**kern') {
      lastinterp = '**kern';
      continue;
    }
    if ((lastinterp === '**kern') && (data[exinterp][i] === '')) {
      continue;
    }
    output.push(i);
  }
  return output;
}



//////////////////////////////
//
// fillSheetWithHumdrumData -- Clear previous contents of sheet and
//   store Humdrum data (a string) on sheet and then colorize the lines.
//

function fillSheetWithHumdrumData(sheet, data) {
  let values = getValuesGrid(data);
  sheet.clearContents();
  sheet.clearFormats();
  var allRange =
      sheet.getRange(1, 1, sheet.getMaxRows(), sheet.getMaxColumns());
  allRange.setNumberFormat('@');  // Make all cells on sheet be plain text.
  let range = sheet.getRange(1, 1, values.length, values[0].length);
  range.setValues(values);
  range.clearFormat();
  colorizeData(sheet, values);
  allRange.setShowHyperlink(false);  // Maybe allow hyperlinks in references or
                                     // if prefixed with https?://.
}



//////////////////////////////
//
// getValuesGrid -- Given a Humdrum file as a string, split it into
//    rows and columns.  Reference records are split into two columns:
//    the first for the key and the second for the value.  The output
//    is a two-dimensional array: the first is an index into the row, and
//    the second is an index into the field.  All rows are expanded to match
//    the row with the largest number of fields.  This is necessary for
//    using sheets.setValues() operation.
//

function getValuesGrid(data) {
  let lines = data.split(/\n/);
  let output = [];
  let maxcount = 0;
  for (let i = 0; i < lines.length; i++) {
    let list = splitLineIntoFields(lines[i]);
    for (let j = 0; j < list.length; j++) {
      // Escape barlines and data tokens (or reference record values)
      // that start with a single quote:
      if (list[j].match(/^[=']/)) {
        list[j] = '\'' + list[j];
      }
    }
    if (list.length > maxcount) {
      maxcount = list.length;
    }
    output.push(list);
  }

  // Rows must have the same number of columns for range.setValues(),
  // so fill in the values array to make it rectangular.
  for (let i = 0; i < output.length; i++) {
    for (j = output[i].length; j < maxcount; j++) {
      output[i].push('');
    }
  }
  return output;
}



//////////////////////////////
//
// colorizeData -- Color each Humdrum line type.  The "@" character
//    means to treat the cell as text rather than a number.
//
// Notes:
// https://developers.google.com/sheets/api/guides/formats
// Allowed colors:  Black, Blue, Cyan, Green, Magenta, Red, White or Yellow.
// http://dmcritchie.mvps.org/excel/colors.htm
// https://yagisanatode.com/2019/08/06/google-apps-script-hexadecimal-color-codes-for-google-docs-sheets-and-slides-standart-palette
//
// See: https://developers.google.com/apps-script/guides/support/best-practices
// for possibly coloring all lines at once.
//

function colorizeData(sheet, values) {
  let types = getLinesByDataType(values);
  let columns = values[0].length;
  setStyle(sheet, columns, types.manipulator, '@[red]');
  setStyle(sheet, columns, types.interpretation, '@[color 29]');  // purple
  setStyle(sheet, columns, types.filter, '@[green]');
  setStyle(sheet, columns, types.xfilter, '@[color 12]');    // olive
  setStyle(sheet, columns, types.reference, '@[color 10]');  // dark green
  setStyle(sheet, columns, types.layout, '@[color 45]');     // orange
  setStyle(sheet, columns, types.local, '@[color 33]');      // light blue
  setStyle(sheet, columns, types.global, '@[blue]');
  setBackground(sheet, columns, types.barline, '#eeeeee');
  setStyle(sheet, columns, types.data, '@[black]');
  setStyle(sheet, columns, types.barline, '@[black]');
  // colorDataNulls(range);
}



//////////////////////////////
//
// setBackground -- Set the background color for a specific list of lines (zero
// indexed).
//    This is used to colorize Humdrum barlines.
//

function setBackground(sheet, columns, lineList, color) {
  if (!lineList) {
    return;
  }
  if (lineList.length == 0) {
    return;
  }
  let rlist = getRangesFromLineIndexes(lineList, columns);
  var rangeList = sheet.getRangeList(rlist);
  sheet.setActiveRangeList(rangeList).setBackground(color);
}



//////////////////////////////
//
// getRangesFromLines -- Return an array of range region inputs to
// getRangeList().
//   Collecting adjacent lines into a single range.  The input is the collection
//   of row indexed (offset from 0) to include in the range.
//

function getRangesFromLineIndexes(list, maxCol) {
  if (list) {
    Logger.log('INPUT LIST: ' + JSON.stringify(list));
  } else {
    Logger.log('INPUT LIST IS FALSY');
  }
  let output = [];
  if (!list) {
    return ['R1C1:R2C2'];  // give dummy range if empty line list
  }
  for (let i = 0; i < list.length; i++) {
    let entry = [list[i] + 1, 1, 1, maxCol];  // row, col, numRows, numCols
    for (let j = i + 1; j < list.length; j++) {
      if (list[j] === list[j - 1] + 1) {
        entry[2]++;
        i = j;
      } else {
        i = j - 1;  // or -2
        break;
      }
    }
    output.push(entry);
  }
  // Logger.log("OUTPUT RANGES START: " + JSON.stringify(output));
  for (let i = 0; i < output.length; i++) {
    let sentry = '';
    sentry += 'R' + output[i][0] + 'C' + output[i][1] + ':';
    sentry += 'R' + (output[i][0] + output[i][2] - 1);
    sentry += 'C' + (output[i][1] + output[i][3] - 1);
    output[i] = sentry;
  }
  // Logger.log("OUTPUT RANGES FINAL: " + JSON.stringify(output));
  return output;
}



//////////////////////////////
//
// setStyle --
//

function setStyle(sheet, columns, lineList, style) {
  if (!lineList) {
    return;
  }
  if (lineList.length == 0) {
    return;
  }
  // Logger.log("LINE LIST", JSON.stringify(lineList));
  let rlist = getRangesFromLineIndexes(lineList, columns);
  // Logger.log("Set Style LineList: " + JSON.stringify(rlist));

  var rangeList = sheet.getRangeList(rlist);
  sheet.setActiveRangeList(rangeList).setNumberFormat(style);
}



//////////////////////////////
//
// getLinesByDataType -- Return lists of the row indexes for each
//    Humdrum line type.  These are used to colorize the data, and
//    all lines of a particular type are colored at once because the
//    spreadsheet interface is very slow (~1 second) for each range
//    (or range set) that is processed.
//

function getLinesByDataType(values) {
  let output = {
    manipulator: [],
    interpretation: [],
    filter: [],
    xfilter: [],
    reference: [],
    layout: [],
    global: [],
    local: [],
    barline: [],
    data: []
  };
  for (let i = 0; i < values.length; i++) {
    if (hasSpineManipulator(values[i])) {
      output.manipulator.push(i);
    } else if (values[i][0].match(/^'?\*/)) {
      output.interpretation.push(i);
    } else if (values[i][0].match(/^'?!!!filter\s*:/)) {
      output.filter.push(i);
    } else if (values[i][0].match(/^'?!!!Xfilter\s*:/)) {
      output.xfilter.push(i);
    } else if (values[i][0].match(/^'?!!![^:\s]+:/)) {
      output.reference.push(i);
    } else if (hasLayoutParameters(values[i])) {
      output.layout.push(i);
    } else if (values[i][0].match(/^'?!![^!]/) || (values[i][0] === '!!')) {
      output.global.push(i);
    } else if (values[i][0].match(/^'?![^!]/) || (values[i][0] === '!')) {
      output.local.push(i);
    } else if (values[i][0].match(/^'?=/)) {
      output.barline.push(i);
    } else {
      output.data.push(i);
    }
  }
  return output;
}



//////////////////////////////
//
// splitLinesIntoFields -- split by tabs, but if a reference record, then
//      split key/value into separate columns for easier data entry.
//

function splitLineIntoFields(line) {
  let output;
  let matches = line.match(/^(!!!+[^:]+)\s*:\s*(.*)\s*/);
  if (matches) {
    output = [matches[1] + ':', matches[2]];
  } else {
    output = line.split(/\t/);
  }
  return output;
}



//////////////////////////////
//
// colorDataNulls -- Null data given a gray color.
// See: https://developers.google.com/apps-script/guides/support/best-practices
// for coloring all null cells at once.
//

function colorDataNulls(range) {
  return;  // deactivated for now
  const rows = range.getNumRows();
  const cols = range.getNumColumns();
  for (let i = 1; i <= cols; i++) {
    for (let j = 1; j <= rows; j++) {
      const cell = range.getCell(j, i);
      if (cell.getValue() === '.') {
        cell.setNumberFormat('@[color 15]');
      }
    }
  }
}



//////////////////////////////
//
// hasLayoutParameters -- Returns true if the list of tokens
//   on a line has any layout parameter in them.  Works for both
//   global and local layout paremeters.
//

function hasLayoutParameters(list) {
  if (list.length == 0) {
    return false;
  }
  if (!list[0].match(/^'?!/)) {
    return false;
  }
  for (let i = 0; i < list.length; i++) {
    if (list[i].match(/^'?!!?LO:/)) {
      return true;
    }
  }
  return false;
}



//////////////////////////////
//
// hasSpineManipulator -- Return true if any of these match in list of strings:
//     **[text], *^, *v, *+, *x, *-
//

function hasSpineManipulator(list) {
  if (list.length == 0) {
    return false;
  }
  if (list[0].charAt(1) !== '*') {
    return false;
  }
  for (let i = 0; i < list.length; i++) {
    if (list[i].match(/^'?\*\*/)) {
      return true;
    } else if (list[i].match(/^'?\*[vx^+-]$/)) {
      return true;
    }
  }
  return false;
}



//////////////////////////////
//
//  convertDataToTSV -- Input data is a two dimensional array
//    with the first dimension the rows, and the second dimension
//    the columns.   Remove any trailing empty strings from the final
//    output.  Also remove any trailing empty lines, but do not
//    remove empty lines in the middle of the data or at the beginning.
//
//     If a column in the first row of the spreadsheet contains the
//     text "IGNORE", then that column will not be exported as Humdrum data.
//

function convertDataArrayToTSV(data) {
  // Identify columns in the data that should be ignored:
  let ignore = getIgnoreColumns(data);

  // Create text lines for each spreadsheet row:
  let lines = [];
  for (let i = 0; i < data.length; i++) {
    let line = '';
    for (let j = 0; j < data[i].length; j++) {
      if (ignore[j]) {
        continue;
      }
      line += data[i][j];
      line += '\t';
    }
    // Create empty lines if all cells are empty:
    lines.push(line.replace(/\t+$/, ''));
  }

  // Remove trailing empty lines in the data.  Any empty
  // lines within the data will be preserved, but trailing
  // lines can be added due to extra rows in the spreadsheet
  // after the end of the Humdrum data.
  let lastLine = lines.length - 1;
  for (let i = lines.length - 1; i >= 0; i--) {
    if (lines[i] === '') {
      lastLine = i - 1;
    } else {
      break;
    }
  }

  // Remove the first tab character from reference
  // records when exporting Humdrum data from the spreadsheet.
  // The reference keys and values are tab separated
  // automatically when loading Humdrum data into the
  // spreadsheet, and this process converts the tabs
  // back into spaces.   It is possible that the original
  // Humdrum text uses tabs at the start of reference
  // records (or no spaces at all), but the preferred style
  // is for a single space after the colon charcter (:) after
  // the reference key.
  for (let i = 0; i < lines.length; i++) {
    if (lines[i].match(/^!!!+[^:\t]+:\t/)) {
      lines[i] = lines[i].replace(/\t+/, ' ');
    }
  }

  // Concatenate lines together into a single string:
  let output = '';
  for (let i = 0; i <= lastLine; i++) {
    output += lines[i] + '\n';
  }
  return output;
}



///////////////////////////////
//
// getIgnoreColumns --
//

function getIgnoreColumns(data) {
  let output = [];
  for (let i = 0; i < data[0].length; i++) {
    if (data[0][i].match(/^\s*IGNORE\s*$/)) {
      output.push(true);
    } else {
      output.push(false);
    }
  }
  return output;
}



//////////////////////////////
//
// addNullLine --  Add a null line above the current line in the file.
//
//   To do: Don't add above a line starting with **.
//          Don't add to above an empty line (but that will not really matter).
//          Don't add above a global comment line.
//          Probably set the data type for the line to text (might be number by
//          default).
//

function addNullLine(token) {
  let ss = SpreadsheetApp.getActive();
  let sheet = ss.getActiveSheet();
  let allRange = ss.getDataRange();
  let data = allRange.getValues();
  let ignore = getIgnoreColumns(data);
  let cell = sheet.getActiveCell();
  let row = cell.getRow();
  let output = [];
  output.push([]);
  for (let i = 0; i < data[row].length; i++) {
    if (ignore[i]) {
      output[0].push('');
    } else {
      if (data[row][i] === '') {
        output[0].push('');
      } else {
        output[0].push(token);
      }
    }
  }
  sheet.insertRowsBefore(row, 1);
  let range = sheet.getRange(row, 1, 1, data[row].length);
  range.setValues(output);
}



/* Example HTML code to send to spreadsheet via macro URL:

<script>

document.addEventListener("DOMContentLoaded", function() {
   var data = document.querySelector("#data").textContent;
   console.log("DATA TO SEND", data);
   var id = "AKfycbwPSnUPffm_A_voZXkYy0sks9sWLr9-ig_m2UOPes9DP1Sod3A";
   var url = "https://script.google.com/macros/s/" + id + "/exec";
   var request = new XMLHttpRequest;
   var formdata = new FormData();
   formdata.append("humdrum", data);
   request.open("POST", url);
   request.send(formdata);
   request.addEventListener("readystatechange", function (event) {
      console.log("ONREADYSTATECHANGE", event);
      if (request.readyState == XMLHttpRequest.DONE) {
         console.log("DONE WITH POST");
      } else {
         console.log("READYSTATE: ", request.readyState);
      }
   });
});

</script>

<script id="data" type="application/x-humdrum">**kern
1c;
*-
</script>

*/
