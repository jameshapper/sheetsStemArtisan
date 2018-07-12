/*
  Function to archive student work, update student record, and add summary
  information to the "feedback form"

  feedback form requirements:
    

  folder structure requirement:


*/

function archiveDocs(){
  var fbDoc = DocumentApp.getActiveDocument();

  var fbBody = fbDoc.getBody();
  var infoTable = fbBody.getTables()[0];
  var evidenceId = infoTable.getRow(1).getCell(1).getText();
  var archiveId = infoTable.getRow(2).getCell(1).getText();
  var recordUrl = infoTable.getRow(3).getCell(1).getText();

  var criteriaTable = fbBody.getTables()[3];

  var studentRecord = SpreadsheetApp.openByUrl(recordUrl);
  var evidenceSheet = studentRecord.setActiveSheet(studentRecord.getSheetByName("Evidence"));
      
  var numRows = criteriaTable.getNumRows();   
      
  for(j = 1; j < numRows; j++){
    var criterionRow = criteriaTable.getRow(j);
    var numCells = criterionRow.getNumCells();
    var rowArray = [];
    for(i = 0; i < numCells; i++){
      rowArray.push(criterionRow.getCell(i).getText());
    }
    evidenceSheet.appendRow(rowArray);
  }

  var assessmentName = fbBody.getTables()[1].getRow(6).getCell(1).getText();

  var evidenceFolder = DriveApp.getFolderById(evidenceId);
  var archiveFolder = DriveApp.getFolderById(archiveId);
  var newWorkFolder = DriveApp.createFolder(assessmentName);
  archiveFolder.addFolder(newWorkFolder);
  DriveApp.removeFolder(newWorkFolder);

  var files = evidenceFolder.getFiles();
  while (files.hasNext()){
    file = files.next();
    var archiveCopy = file.makeCopy(newWorkFolder);
    var copyName = archiveCopy.getName();
    var copyUrl = archiveCopy.getUrl();

    var workTable = fbBody.getTables()[2];
    var workRow = workTable.appendTableRow();
    workRow.appendTableCell(copyName);
    workRow.appendTableCell(copyUrl);
  }

  var fbId = fbDoc.getId();
  var thisFbForm = DriveApp.getFileById(fbId);
  newWorkFolder.addFile(thisFbForm);

}