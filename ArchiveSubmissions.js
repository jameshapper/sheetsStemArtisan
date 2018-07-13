/*
  Function to archive student work, update student record, and add summary
  information to the "feedback form"

  feedback form requirements:
    the first table in the document must contain correct id's and url's for student records

  folder structure requirement:


*/

function archiveDocs(){
  
  var fbDoc = DocumentApp.getActiveDocument();
  var fbBody = fbDoc.getBody();

  //get information for this student's records
  var infoTable = fbBody.getTables()[0];
  var evidenceId = infoTable.getRow(1).getCell(1).getText();
  var archiveId = infoTable.getRow(2).getCell(1).getText();
  var recordUrl = infoTable.getRow(3).getCell(1).getText();

  //create ui for error alerts
  var ui = DocumentApp.getUi();

  //check for too few characters (e.g. blanks) suggesting problem with info table
  if(evidenceId.length < 4 || archiveId.length < 4 || recordUrl.length < 4){
    var errorInfo = ui.alert('Please ensure ids and urls are available in first table');
    return
  }

  // copy the table of criteria awards (crits) to the "Evidence" sheet of the
  // student's official record
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

  // create folder to archive student work and move it to the student archive folder
  var assessmentName = fbBody.getTables()[1].getRow(6).getCell(1).getText();
  var newWorkFolder = DriveApp.createFolder(assessmentName);
  var archiveFolder = DriveApp.getFolderById(archiveId);
  archiveFolder.addFolder(newWorkFolder);
  DriveApp.removeFolder(newWorkFolder);

  // for each evidence file, make a copy in the new archive folder, add its name and url
  // to a table in the feedback document,
  var evidenceFolder = DriveApp.getFolderById(evidenceId);
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

  // move the feedback document into the archive folder as well
  var fbId = fbDoc.getId();
  var thisFbForm = DriveApp.getFileById(fbId);
  newWorkFolder.addFile(thisFbForm);

}