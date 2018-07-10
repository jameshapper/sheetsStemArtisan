function addBadgeAspiration() {
  
    /*
    *  This function is meant to run once per day to see if there are any new requests to add a "badge aspiration" to the student's official record
    *
    */
    
    // Read range of student document ID's
    // Read range of teacher supported badges
    // Loop through Student Plan ID's
    //   Get BadgeAspirations sheet and read range of values in New Badge Requests column
    //   If column length indicates no requests, quit and move on to next Student Plan ID
    //   Else
    //     Read range of requests
    //     Open the Student Record ID and read in range of existing aspirations
    //     Loop through requests
    //       If it already exists, erase request and send notification to student
    //       Else
    //         Loop through supported badges list
    //           If request is not on list, erase request and send notification to student
    //           Else
    //             Copy found request to Student Record and to Student Plan
    //             Copy the requested badge sheet to the Student Record and to Student Plan
    // Make copies of all logs to make available for teacher
    
    var app = SpreadsheetApp;
    var studentOfficialRecord = app.getActiveSpreadsheet();
    var badgeSheet = studentOfficialRecord.getSheetByName("badgeAspirations");
    
    //Check for a non zero value to see if there are any badges that need to be updated (cell F2 counts number of badges that are not already on a list)
    var updateNeed = badgeSheet.getRange("F2").getValue();
    
    if(updateNeed == 0){
      return;
      //If no update needed, just leave--our work is done here
    }
    
    /* 
    *  Loop through updateStatus looking for "0" which means the badge ID is not already in the student's list
    *  Get the corresponding badgeUrl using getValue
    *  Open TeacherPlanning spreadsheet and "Badges" sheet, and read in DocUrl column with all "currently supported" badges
    *  If the desired ID (url) is not present in the list, then leave, with a notification to student to see teacher
    *  Else, copy the sheet into the OfficialRecord and rename it appropriately
    *
    */
    
    var newBadgeRequests = badgeSheet.getRange("G2").getValue();
    var teacherSpreadsheet = app.openById("1wTum3QS9-xx8U5lNsdSnXPLsqbqUfrKHLsS6p5qOs1g");
    var supportedBadgeSheet = teacherSpreadsheet.getSheetByName("Badges");
    var totalBadges = supportedBadgeSheet.getLastRow()-1;
    var badgeUrls = supportedBadgeSheet.getRange(2,3,totalBadges).getValues(); //column C
    
    for (var i=2;i<2+newBadgeRequests;i++){
      
      var updateStatus = badgeSheet.getRange(i,5).getValue(); //column E
      
      if(updateStatus == 0){
        
        var badgeUrl = badgeSheet.getRange(i,4).getValue(); //column D
        
        for(var j=2;j<2+totalBadges;j++){
          
          if(badgeUrls[j-1] == badgeUrl){
            
            Logger.log("Found one!");
            
            var badgeSpreadsheet = app.openByUrl("https://docs.google.com/spreadsheets/d/1kZOZKBS74zKU5OY_nkJAUsFOz1pkUhJ6R-vFw91S6c4/");
            var badgeCriteria = badgeSpreadsheet.getSheetByName("Criteria");
            var badgeName = badgeSpreadsheet.getName();
            
            badgeCriteria.copyTo(studentOfficialRecord);
            studentOfficialRecord.getSheetByName("copy of Criteria").setName(badgeName);
            
            //NEED TO ADD URL TO THE OFFICIALRECORD LIST OF "MY EXISTING BADGE ASPIRATIONS" to avoid repeats in the future
          }
        }
      }
    }  
  }
  
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
      var row = []
      row.push(file.getName(),file.getId(),file.getSize(),file.getLastUpdated(),"New");
      list.push(row);
    }
    var lastRow = sh.getLastRow();
    sh.getRange(lastRow + 1,1,list.length,list[0].length).setValues(list);
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
  
  function SHEETNAME() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var s = ss.getActiveRange().getSheet();
  return s.getName();
  }
  
  function appendToProposedActivities() {
    
    var ui = SpreadsheetApp.getUi();
    var userSheet = ui.prompt('Please enter the sheet name');
    var responseSheetName = userSheet.getResponseText();
    var activitySetSheet = ss.getSheetByName(responseSheetName);
    var sheetName = activitySetSheet.getName();
    var proposedActivitiesSheet = ss.getSheetByName("ProposedActivitiesTest");
    var activitiesRange = activitySetSheet.getActiveRange();
    var rangeHeight = activitiesRange.getHeight();
    var rangeWidth = activitiesRange.getWidth();
    var activitySetData = activitiesRange.getValues();
    var lastRow = proposedActivitiesSheet.getLastRow();
    
    //copy data
  //  proposedActivitiesSheet.getRange(lastRow + 1, 1, rangeHeight, 5)
  //              .setValues(activitySetData);
  
  }
  
  function email(){
    var rng = SpreadsheetApp.getActiveSheet().getActiveRange()
    var email = rng.getValues()[0];
    GmailApp.sendEmail(email[0], email[1], email[2]);
  }
  
  function updatePlans(){
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var sheet = ss.getSheetByName("StudentPlansVertical");
    
    var lastStudent = sheet.getLastColumn();
    
    for(var i=2;i<lastStudent+1;i++){
      
      var seekUpdate = sheet.getRange(3, i).getValue(); //does teacher want to seek update for this student's plan?
      if (seekUpdate == "Yes"){
        var studentDataSheet = ss.getSheetByName("StudentData");
        var studentWorkingRecordID = studentDataSheet.getRange(i,4).getValue(); //this should be consistent since the list of student names is copied from StudentData sheet to the other
        var studentWorkingRecord = SpreadsheetApp.openById(studentWorkingRecordID);
        var currentPlans = studentWorkingRecord.getSheetByName("CurrentPlans");
        var requestUpdate = currentPlans.getRange(3,2).getValue(); //does the student want to update this plan?
        if (requestUpdate == "Yes"){
          currentPlans.getRange(3,2).setValue("No");
          var lastRow = currentPlans.getLastRow();
          var currentPlansList = currentPlans.getRange(5,2,lastRow-5,1).getValues();
  
          sheet.getRange(7,2,lastRow-5,1).setValues(currentPlansList);
          
          var versionData = currentPlans.getRange(1,2,2,1).getValues();
          sheet.getRange(1,2,2,1).setValues(versionData);
       }
      } 
    } 
  }
  
  function archivePlans(){
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var sheet = ss.getSheetByName("StudentPlansVertical");
    
    var lastStudentColumn = sheet.getLastColumn();
    
    for(var i=2;i<lastStudentColumn+1;i++){
      
      var toArchive = sheet.getRange(4, i).getValue(); //does teacher want to archive this student's plan?
      if (toArchive == "Yes"){
        var studentDataSheet = ss.getSheetByName("StudentData");
        var studentOfficialRecordID = studentDataSheet.getRange(i,3).getValue(); //this should be consistent since the list of student names is copied from StudentData sheet to the other
        var studentOfficialRecord = SpreadsheetApp.openById(studentOfficialRecordID);
        
        var lastRow = sheet.getLastRow();
        var currentPlansList = sheet.getRange(7,i,lastRow-6,1).getValues();
        
        var planHistorySheet = studentOfficialRecord.getSheetByName("AlternatePlanHistory");
        planHistorySheet.insertColumnBefore(2);
        
        sheet.getRange(4,i).setValue("No");
          
        planHistorySheet.getRange(2,2,lastRow-6,1).setValues(currentPlansList);
      } 
    } 
  }
  
  function addToGroup(){
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var groupDescriptions = ss.getSheetByName("GroupDescriptions");
    var groups = ss.getSheetByName("Groups");
    
    var groupAddTo = groupDescriptions.getRange("E1").getValue();
    var studentsToAdd = groupDescriptions.getRange("C2:C").getValues();
    var numStudentsToAdd = studentsToAdd.filter(String).length; //truncates array to get rid of any empty values
    studentsToAdd.length = numStudentsToAdd;
    var groupStudents = [];
    for(i=0;i<numStudentsToAdd;i++){
      groupStudents.push([groupAddTo,studentsToAdd[i]]);
    }
    var lastRow = groups.getLastRow();
    var newRows = groups.getRange(lastRow+1, 1, numStudentsToAdd, 2);
    newRows.setValues(groupStudents);
    groupDescriptions.getRange("B2:B").clearContent();
  
  }
  
  function addInstructionSet(){
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var currentPlans = ss.getSheetByName("CurrentPlans");
    var addInstructions = ss.getSheetByName("AddInstructions");
    
    var groupAddTo = currentPlans.getRange("E5").getValue();
  //  var numDates = currentPlans.getRange("E2:E3").getValues().reduce((total,amount) => total + amount);
    var numDates = currentPlans.getRange("E2:E3").getValues().reduce(function(a,b){return +a + +b});
    var instructionsRange = currentPlans.getRange(5, 6, 1, numDates);
    var instructions = instructionsRange.getValues();
    var dates = currentPlans.getRange(6, 6, 1, numDates).getValues();
    
    var datesInstructions = [];
    for(i=0;i<numDates;i++){
      Logger.log(instructions[0][i].length != 0);
      
      if(instructions[0][i].length != 0){
        datesInstructions.push([dates[0][i],groupAddTo,instructions[0][i]]);
      }
    }
    Logger.log(datesInstructions);
    var numInstructions = datesInstructions.length;
    var lastRowTemp = addInstructions.getRange("B2:B").getValues();
    var lastRow = lastRowTemp.filter(String).length;
    Logger.log(lastRowTemp.filter(String));
    
  //  var lastRow = addInstructions.getLastRow();
    var newRows = addInstructions.getRange(lastRow+2, 1, numInstructions, 3);
    newRows.setValues(datesInstructions);
  
  //  instructionsRange.clearContent();
    
  }
  
  function sendInstructions(){
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var addInstructions = ss.getSheetByName("AddInstructions");
    var groups = ss.getSheetByName("Groups");
    var groupList = ss.getSheetByName("GroupList");
    var plansSheet = ss.getSheetByName("CurrentPlans");
    
    var students = plansSheet.getRange("D7:D").getValues();
    var studentPlanIDs = plansSheet.getRange("E7:E").getValues();
    var studentPlanIDs = studentPlanIDs.reduce(function(a,b){return a.concat(b);}).filter(String);
    
    Logger.log(studentPlanIDs);
  //  var numStudents = students.filter(String).length;
    numStudents = 1;
    var numDates = plansSheet.getRange("E2:E3").getValues().reduce(function(sum,num){return +sum + +num;});
    var datesToSend = plansSheet.getRange(6, 6, 1, numDates).getDisplayValues()[0];
    
    var groupsElements = groups.getLastRow()-1;
    var groupsData = groups.getRange(2, 1, groupsElements, 2).getValues();
    
    var numInstructions = addInstructions.getRange("C2:C").getValues().filter(String).length;
  //  var numInstructions = addInstructions.getLastRow()-1;
    var instructions = addInstructions.getRange(2, 1, numInstructions, 4).getDisplayValues();
    var maxGroups = groupList.getLastColumn()-2;
    var allStudentGroups = groupList.getRange(2, 1, numStudents, maxGroups+2).getValues();
  
    for(i=0;i<numStudents;i++){
      var currentStudent = allStudentGroups[i][0];
      var numStudentGroups = allStudentGroups[i][1]; //it was easier for me to calculate this number on the spreadsheet
      var instructionsToStudent = [];
      var messages = [{date:"dummy"}];
      for(j=0;j<numInstructions;j++){
        var studentGroupData = allStudentGroups[i].indexOf(instructions[j][1]);
  //      Logger.log(studentGroupData);
        // If instructions recipient is not the student or one of her groups, we get -1
        // There could be a problem if any groups are given "number" names
        if(studentGroupData != -1){
          var messageDate = instructions[j][0];
          var messageRecipient = instructions[j][3];
          var messageContent = instructions[j][2];
          var messageToStudent = messageRecipient.concat(messageContent);
          var existingDates = messages.map(function(o){return o.date;});
          var existCheck = existingDates.indexOf(messageDate);
  
          if(existCheck == -1){
            var message = {date:messageDate,message:[messageToStudent]};
            messages.push(message);
          }
          
          if(existCheck != -1){
            for(k=0;k<messages.length;k++){
              if(messages[k].date == messageDate){
                messages[k].message.push(messageToStudent);
                var temp = messages[k].message;
                var temp = temp.join('  ');
                messages[k].message = [temp];
              }
            }
          }
        }
      }
      messages.shift();
  
      var summaryMessage = [];
  
  //    Logger.log(datesToSend);
  
      for(m=0;m<datesToSend.length;m++){
        Logger.log(datesToSend[m]);
        summaryMessage[m] = [""];
        for(n=0;n<messages.length;n++){
          if(datesToSend[m] == messages[n].date){
            summaryMessage[m] = messages[n].message;
          }
        }
      }
      
      var sss = SpreadsheetApp.openByUrl(studentPlanIDs[i]);
      var studentPlansSheet = sss.getSheetByName("Plans");
      var studentPlansDates = studentPlansSheet.getRange("A2:A").getDisplayValues();
      var studentPlansDates = studentPlansDates.reduce(function(a,b){return a.concat(b);}).filter(String);
      var beginDateIndex = studentPlansDates.indexOf(datesToSend[0]);
      var teacherRange = studentPlansSheet.getRange(beginDateIndex+2,4,datesToSend.length,1).setValues(summaryMessage);
      Logger.log(beginDateIndex);
  
    }
  //  Logger.log(summaryMessage);
    
  }
  
  
  function concatMessages(){
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var messagesGroups = ss.getSheetByName("MessagesGroups");
    var messagesIndividual = ss.getSheetByName("MessagesIndividual");
    var messagesFull = ss.getSheetByName("MessagesFull");
    
    var lastStudentRow = 5 //messagesFull.getLastRow();
    var lastDateColumn = messagesFull.getLastColumn();
    var numberGroups = messagesGroups.getRange("B1").getValue();
    
    var groupsData = messagesGroups.getRange("A1:J200").getValues();
    var groupsFirstColumn = groupsData.reduce(function (a, b) { //flatten the 2D array obtained by .getValues()
      return a.concat(b);
    });
    
    var lastRowStudents = messagesFull.getDataRange().getLastRow();
  
    var studentNames = messagesFull.getRange(2, 1, lastRowStudents-1).getValues().reduce(function (a, b) {return a.concat(b);} );
    
  //  var groupMessages = groupsData
    
    for(var i=1;i<lastStudentRow;i++){
      
      //find row in MessagesGroups that corresponds to this student
      var studentName = studentNames[i-1];
      var groupsStudentRow = groupsFirstColumn.indexOf(studentName)+1;
      
      for(var j=2;j<=lastDateColumn;j++){
        
        var studentCell = [];
        var message = messagesIndividual.getRange(i, j).getValue();
        studentCell.push(message);
        
        for(var k=2;k<=numberGroups+1;k++){
          var groupMember = groupsData.getValues()[groupsStudentRow][k];
          if(groupMember = "1"){
            var groupMessage = groupsData.getValues()[k][j];
            studentCell.push(groupMessage);
          }
        }
        
      }
    }
  }
  
  function getSheetNames() {
    var sheetNameArray = [];
  
    var spreadSheetsInA = SpreadsheetApp.getActiveSpreadsheet().getSheets();
  
    sheetNameArray = spreadSheetsInA.map(function(sheet) {
      return [sheet.getName()];
    });
  
    var sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
    var range = sheet.getRange(1, 1, sheetNameArray.length, 1);
    range.setValues(sheetNameArray);
  }
  
  
  function Copy() {
  
   var sss = SpreadsheetApp.openById('spreadsheet_key'); //replace with source ID
  
   var ss = sss.getSheetByName('Source'); //replace with source Sheet tab name
  
   var range = ss.getRange('A2:E6'); //assign the range you want to copy
  
   var data = range.getValues();
  
  
   var tss = SpreadsheetApp.openById('spreadsheet_key'); //replace with destination ID
  
   var ts = tss.getSheetByName('SavedData'); //replace with destination Sheet tab name
  
   ts.getRange(ts.getLastRow()+1, 1,5,5).setValues(data); //you will need to define the size of the copied data see getRange()
  
  }
  
  