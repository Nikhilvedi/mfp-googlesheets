let fs = require('fs');
let readline = require('readline');
require('dotenv').config()

let SCOPES = ['https://www.googleapis.com/auth/spreadsheets'];

const GoogleAuth = require('google-auth-library');

console.log(process.env.GOOGLE_CLIENT_EMAIL);

function authorize() {
  return new Promise(resolve => {
    const authFactory = new GoogleAuth();
    const jwtClient = new authFactory.JWT(
      process.env.GOOGLE_CLIENT_EMAIL,
      null,
      process.env.GOOGLE_PRIVATE_KEY.replace(/\\n/g, '\n'),
      SCOPES
    );

    jwtClient.authorize(() => resolve(jwtClient));
  });
}

module.exports = {
  authorize,
}