//
// Programmer:     Craig Stuart Sapp (craig@ccrma.stanford.edu)
// Creation Date:  20 September 2020
// Last Modified:  28 September 2020
// URL:            http://bit.ly/humdrum-io
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
