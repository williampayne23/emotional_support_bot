const login = require("facebook-chat-api");
const fs = require("fs");
const swearjar = require('swearjar');
const config = require('./config');
const speechHandler = require("./speechHandler")
const logFile = config.logfile;
const saved_data_file = config.saved_data_file;
const bot_id = config.bot_user_id;

global.bot_data = {};
global.spamBack = "";

getData();
attemptLogin();

function attemptLogin(){
  try {
    var loginState = JSON.parse(fs.readFileSync('appstate.json', 'utf8'));
    login({appState : loginState}, (err, api) => {
      if(err){
        throw err;
      }else{
        printToLog("Logged in to existing session");
        console.log("Logged in to existing session");
        loggedIn(err, api);
      }
    })
  } catch (e) {
    firstLogin();
  }
}

function firstLogin(){
  login(config.credentials, (err, api) => {
    if (err) console.error(err);
    api.setOptions({
      logLevel: "silent"
    });
    fs.writeFileSync('appstate.json', JSON.stringify(api.getAppState()));
    loggedIn(err, api)
  });
}

function loggedIn(err, api){
  if(err) return console.error(err);
  api.setOptions({
    logLevel: "silent"
  });
  printToLog("Successful login")
  api.listen(listenForMessages);

  function listenForMessages(err, message){
    if(err) return console.error(err);
    var body = message.body;
    if(!message.isGroup){
      speechHandler(message, api)
    }else if(bot_id in message.mentions){
      printToLog("Bot mentioned responding");
      speechHandler(message, api);
    }else if(swearjar.profane(body) && bot_data.police_swearing){
      printToLog("Cracking down on swearing")
      api.sendMessage("Language!", message.threadID)
      api.setMessageReaction(":sad:", message.messageID);
    }else if(message.senderID == spamBack){
      api.sendMessage(message.body, message.threadID);
    }else if(Math.random() < bot_data.react_frequency){
      respondToMessage(message, api);
    }
    api.markAsRead(message.threadID);
  }
}

function respondToMessage(message, api){
  var random = Math.random()
  if(random < bot_data.love_frequency){
    var emoji = ':love:'
  }else{
    var emoji = ':like:'
  }
  if(random < bot_data.cheer_frequency){
    printToLog("Sending a cheer!")
    speechHandler(message, api);
  }
  api.setMessageReaction(emoji, message.messageID);
}

//Gets data saved in a JSON file
function getData(){
  fs.readFile(saved_data_file, "utf8", function(err, data) {
    bot_data = JSON.parse(data);
    printToLog("Updating options from JSON file, now on version " + bot_data.version)
  });
}

//Prints to logfile
function printToLog(txt){
  var date = new Date();
  var timestamp = date.toLocaleDateString() + " " +date.toLocaleTimeString();
  var string = "\n<li>" + timestamp + ": " + txt + "</li>" + "\n";
  fs.appendFile(logFile, string);
}
