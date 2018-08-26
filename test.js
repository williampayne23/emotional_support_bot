const login = require("facebook-chat-api");
const fs = require("fs");
const config = require('./config');

module.exports = {
  getHistory : attemptLogin
}

function attemptLogin(){
  return new Promise(function(resolve, reject){
    //First try to log in with the saved state
    var loginState = JSON.parse(fs.readFileSync('appstate.json', 'utf8'));
    login({appState : loginState}, (err, api) => {
      if(err){
        reject(err);
      }else{
        timestamp = undefined;
        api.getThreadHistory('100001497479125', 2, timestamp, function(err, history){
          if (err) reject(err);
          resolve(history);
        });
      }
    });
  });
}
