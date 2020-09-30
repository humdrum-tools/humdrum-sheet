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
