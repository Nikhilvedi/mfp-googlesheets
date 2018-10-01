/**
*
* @Description: Import MFP values to Google Sheets
*
**/

require('dotenv').config()
const express = require('express');
const app = express();
var date = require('./Functions/getDate.js');

// get db config file
var config = require('./Auth/config'); 
var mfp = require('mfp');
var date = require('./Functions/getDate.js');
var schedule = require('node-schedule');
let google = require('googleapis');
let authentication = require("./Auth/authentication");

const SPREADSHEET_ID = config.sheetId;
const sheetsApi = google.sheets('v4');

app.get('/', (req, res) => res.send('Welcome to MFP Scraper!'));

// '0 0 23 ? * * *' - at 11pm every night 
var sched = schedule.scheduleJob('0 0 23 ? * * *', function() {
  console.log('Scheduled Run');
  mfpd();
});

//at minute 25
// var schedTest = schedule.scheduleJob('25 * * * *', function() {
//   console.log('Scheduled Run');
//   mfpd();
// });

//fetch all data
// mfp.fetchSingleDate('iamvedi', module.today, 'all', function(data) {
//  console.log(mfpData);
// });

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
      //add the correct date
      result.push(date.today);
      return result;
    }).then(function(result) {
      authentication.authorize().then((auth) => {
        appendData(auth, result);
      });
    })
    .catch((err) => {
      console.log('auth error', err);
    });
}

//google sheets appending
function appendData(auth, data) {
  var sheets = google.sheets('v4');
  sheetsApi.spreadsheets.values.append({
    auth: auth,
    spreadsheetId: config.sheetId,
    range: 'MFP_Import!A2:E', 
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