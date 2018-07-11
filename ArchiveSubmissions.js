
  // https://stackoverflow.com/questions/25360214/list-all-files-id-inside-a-folder-no-subfolders
  function listSubmissions(){
    var ss = SpreadsheetApp.getActive();
    var sh = SpreadsheetApp.setActiveSheet(ss.getSheetByName('Submissions'));
    var folder = DriveApp.getFolderById('1tZq6oEPqDGO9I8I7T0a5MMJZv_VFfw13');
    var list = [];
  //  list.push(['Name','ID','Size','Last Update']);
    var files = folder.getFiles();
    while (files.hasNext()){
      file = files.next();
      var row = [];
      row.push(file.getName(),file.getId(),file.getSize(),file.getLastUpdated(),"New");
      list.push(row);
    }
    var lastRow = sh.getLastRow();
    sh.getRange(lastRow + 1,1,list.length,list[0].length).setValues(list);
  }

  function archiveDocs(){
    var fbDoc = DocumentApp.getActiveDocument();
    var fbUrl = fbDoc.getUrl();

    var fbBody = fbDoc.getBody();
    var infoTable = fbBody.getTables()[0];
    var evidenceUrl = infoTable.getRow(1).getCell(1).getText();
    var archiveUrl = infoTable.getRow(2).getCell(1).getText();
    var recordUrl = infoTable.getRow(3).getCell(1).getText();

    var criteriaTable = fbBody.getTables()[3];

    var studentRecord = SpreadsheetApp.openByUrl(recordUrl);
    var evidenceSheet = studentRecord.setActiveSheet("Evidence");
        
    var numRows = criteriaTable.getNumRows();   
        
    for(j = 2; j < numRows; j++){
      var criterionRow = criteriaTable.getRow(j);
      var numCells = criterionRow.getNumCells();
      var rowArray = [];
      for(i = 0; i < numCells; i++){
        rowArray.push(criterionRow.getCell(i).getText());
      }
      evidenceSheet.appendRow(rowArray);
    }


  }
  
  function getSubmission(){
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var submissionSheet = SpreadsheetApp.setActiveSheet(ss.getSheetByName('Submissions'));
    var statusColumn = submissionSheet.getRange("E2:E").getValues();
    Logger.log(statusColumn.length);
    var lenNonBlank = statusColumn.filter(String).length;
    Logger.log(lenNonBlank);
    for (var i = 0; i < lenNonBlank; i++){
      if (statusColumn[i][0] == "New") {
        var assignmentDocId = submissionSheet.getRange(i+2,2).getValue();
        var assignmentDoc = DocumentApp.openById(assignmentDocId);
        var body = assignmentDoc.getBody();
        var table = body.getTables()[3];
        var rubricId = table.getRow(3).getText().split(": ")[1];
        Logger.log(rubricId);
        var rubricDoc = DocumentApp.openById(rubricId);
        var officialRubric = rubricDoc.getBody().getTables()[0].copy();
        body.appendTable(officialRubric);
      }
    } 
  }
  
  function archiveWork(){
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var submissionSheet = SpreadsheetApp.setActiveSheet(ss.getSheetByName('Submissions'));
    var archiveSheet = SpreadsheetApp.setActiveSheet(ss.getSheetByName('Archived'));
    var archiveFolder = DriveApp.getFolderById("1CbiLY8fD6VJApgzfJ99vihHOYX9wXmfM");
    var submissionsFolder = DriveApp.getFolderById("1tZq6oEPqDGO9I8I7T0a5MMJZv_VFfw13");
  
    var statusColumn = submissionSheet.getRange("E2:E").getValues();
    var lenNonBlank = statusColumn.filter(String).length; //this avoids blank rows
    
    //archive the assessed files and remove from submissions folder
    for (var i = 0; i < lenNonBlank; i++){
      if (statusColumn[i][0] == "Assessed") {
        var assignmentDocId = submissionSheet.getRange(i+2,2).getValue();
        var fileToArchive = DriveApp.getFileById(assignmentDocId);
        archiveFolder.addFile(fileToArchive);
        submissionsFolder.removeFile(fileToArchive);
      }
    }
   
    //remove info on assessed files from submissions sheet and copy into archived sheet
    for (var i = lenNonBlank-1; i >= 0; i--){
      if (statusColumn[i][0] == "Assessed") {
        var row = submissionSheet.getRange(i+2, 1, 1, 4).getValues();
        archiveSheet.insertRowBefore(2);
        archiveSheet.getRange(2, 1,1,4).setValues(row);
        submissionSheet.deleteRow(i+2)
      }
    }
  }
  
  function updateStudentRecords(){
    /*
    We want to go through each document marked as "Assessed" (in Submissions sheet)
    Identify the student who earned the credit for the work (can we get their name or id from the submitted document somehow?)
    Find the id of the student's Official Record (if not directly from previous step)
    Get the Evidence sheet from that file
    Find the Badge Assessment table from their document, with the scores awarded by the teacher
    Go through each row of the table that has an "update" flag
    Copy the row and then append to the Evidence sheet
    Return a list of updated records for the teacher to double check
    */
    
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var submissionSheet = SpreadsheetApp.setActiveSheet(ss.getSheetByName('Submissions'));
    var submissionsFolder = DriveApp.getFolderById("1tZq6oEPqDGO9I8I7T0a5MMJZv_VFfw13");
  
    var statusColumn = submissionSheet.getRange("E2:E").getValues();
    var lenNonBlank = statusColumn.filter(String).length; //this avoids blank rows
    
    //archive the assessed files and remove from submissions folder
    for (var i = 0; i < lenNonBlank; i++){
      if (statusColumn[i][0] == "Assessed") {
  
        var assignmentDocId = submissionSheet.getRange(i+2,2).getValue();
        var assignmentDoc = DocumentApp.openById(assignmentDocId);
        var body = assignmentDoc.getBody();
        var table = body.getTables()[0];
        var officialRecordId = table.getRow(2).getText().split(": ")[1]; //somehow we get this ID into the document? Checking owner?
        Logger.log(officialRecordId);
        var officialRecord = SpreadsheetApp.openById(officialRecordId);
        var criterionScores = assignmentDoc.getBody().getTables()[5];
        
        var numRows = criterionScores.getNumRows();
        
        SpreadsheetApp.setActiveSpreadsheet(officialRecord);
        var officialRecordEvidenceSheet = SpreadsheetApp.setActiveSheet(officialRecord.getSheetByName('Evidence'));
        
        for(j = 2; j < numRows; j++){
          var criterionRow = criterionScores.getRow(j);
          var numCells = criterionRow.getNumCells();
          var rowArray = [];
          for(i = 0; i < numCells; i++){
            rowArray.push(criterionRow.getCell(i).getText());
          }
          officialRecordEvidenceSheet.appendRow(rowArray);
        }
        
      }
    }
  }