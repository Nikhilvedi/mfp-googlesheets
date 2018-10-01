//Google sheet
//https://docs.google.com/spreadsheets/d/1uue-76QgrX1RR-WWixPFVhCW_PPyer6rmW5RwIYWTMs/edit#gid=344784959
require('dotenv').config()

const express = require('express');
const app = express();
var date = require('./Functions/getDate.js');
// var mfp = require('./mfp_export');
var config = require('./Auth/config'); // get db config file


let google = require('googleapis');
let authentication = require("./Auth/authentication");

var mfp = require('mfp');
var date = require('./Functions/getDate.js');

var schedule = require('node-schedule');

app.get('/', (req, res) => res.send('Welcome to MFP Scraper!'));


const SPREADSHEET_ID = config.sheetId;
const sheetsApi = google.sheets('v4');

authentication.authorize()
    .then((auth) => {
        sheetsApi.spreadsheets.values.get({
            auth: auth,
            spreadsheetId: SPREADSHEET_ID,
            range: "'Tab Name'!A1:H300",
        }, function (err, response) {
            if (err) {
                console.log('The API returned an error: ' + err);
                return console.log(err);
            }
            var rows = response.values;
            console.log(null, rows);
        });
    })
    .catch((err) => {
        console.log('auth error', err);
    });

//fetch all data
// mfp.fetchSingleDate('iamvedi', module.today, 'all', function(data) {
//  console.log(mfpData);
// });

// '0 0 23 ? * * *' - at 11pm every night 
var sched = schedule.scheduleJob('0 0 23 ? * * *', function() {
  console.log('Scheduled Run');
  mfpd();
});

//at minute 20
var schedTest = schedule.scheduleJob('30 * * * *', function() {
  console.log('Scheduled Run');
  mfpd();
});

var mfpd = function() {
  new Promise(function(resolve, reject) {
    mfp.fetchSingleDate('iamvedi', date.today, ['calories', 'protein', 'carbs', 'fat', 'fiber'], function(mfpData) {
      resolve(mfpData);
    });
  }).then(function(data) {
    //reduce to array 
    var result = Object.keys(data).map(function(key) {
      return data[key];
    });
    //remove the undefined date
    result.splice(-1, 1);
    result.push(date.today);
    return result;
  }).then(function(result) {
    authentication.authenticate().then((auth) => {
      appendData(auth, result);
    });
  })
}

//google sheets appending
function appendData(auth, data) {
  var sheets = google.sheets('v4');
  sheets.spreadsheets.values.append({
    auth: auth,
    spreadsheetId: config.sheetId,
    range: 'MFP_Import!A2:E', //Change this to the sheet and work out how to aut increment the values
    valueInputOption: "USER_ENTERED",
    resource: {
      values: [data]
    }
  }, (err, response) => {
    if (err) {
      console.log('The API returned an error: ' + err);
      return;
    } else {
      console.log("Successful import of: \n" + data);
    }
  });
}

//run the server 

app.listen(process.env.PORT || 3000, () => console.log("Server Running"));
