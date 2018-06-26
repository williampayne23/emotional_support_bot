"use strict";

const RiveScript = require('rivescript');
const config = require('./config');
const fs = require("fs");
const axios = require('axios');
const logFile = config.logfile;
const saved_messages_file = config.saved_messages_file;
const saved_data_file = config.saved_data_file;
const bot_id = config.bot_user_id;

var saved_messages;
getSavedMessages();

module.exports = function(rs, message, api){

  rs.setSubroutine('spam', spam);
  rs.setSubroutine('stopSpam', stopSpam);
  rs.setSubroutine('update', update);
  rs.setSubroutine('gif', getRelevantGif);
  rs.setSubroutine('save', saveMessage);
  rs.setSubroutine('recall', recallMessage);
  rs.setSubroutine('delete', deleteMessage);
  rs.setSubroutine('list', listMessages);

  function spam(rs, args){
    var mentions = rs.getUservar('local-user', 'mentions').split(" ");
    //-1 to ignore the space at the end that I can't be bothered to more cleverly deal with.
    for(var i=0; i < mentions.length-1; i++){
      if(mentions[i] != config.bot_user_id){
        global.spamBack = mentions[i];
      }
    }
  }

  function stopSpam(){
    global.spamBack = "";
  }

  function update(rs, args){
    return new rs.Promise(function (resolve, reject) {
      var i = 0;
      updateFiles()
      .then(getSavedMessages)
      .then(getData)
      .then(() => resolve("Updated!"))
      .catch(err => console.error(err));
    });
  }

  function updateFiles(){
    return new Promise(function (resolve, reject) {
      rs = new RiveScript();
      rs.loadDirectory("brain", loadingDone, loadingError);
      function loadingDone(batchnum){
        rs.sortReplies();
        printToLog("Updating rive files")
        resolve();
      }
      function loadingError(err){
        console.error(err);
        reject();
      }
    });
  }

  function getRelevantGif(rs, args){
    return new rs.Promise(function (resolve, reject) {
      var text = args.join("+");
      var giphy_api = "https://api.giphy.com/v1/gifs/search"
      giphy_api = giphy_api + "?api_key=" + config.giphy_api_key + "&q=" + text;
      printToLog("\t\tSearching with parameters " + text);
      axios.get(giphy_api).then(res => {
        var random = Math.floor(Math.random() * Math.min(res.data.data.length, 5));
        var randomGif = res.data.data[random];
        var gifUrl = randomGif.images.fixed_width.url;
        return axios({method:'get', url: gifUrl, responseType:'stream'})
      })
      .then(function(response){
        api.sendMessage({attachment : response.data}, message.threadID);
      })
      .catch(err => console.error(err))
    });
  }

  function saveMessage(rs, args){
    return new rs.Promise(function (resolve, reject) {
      var timestamp = message.timestamp;
      api.getThreadHistory(message.threadID, 2, timestamp,(err, history) => {
        saveMessage = history[1];
        var messageName = args.join(" ");
        if(nameTaken(messageName)){
          resolve("Sorry that name is taken!");
        }else{
          saved_messages.push({body : saveMessage.body,
                                name : [messageName],
                                threadID : saveMessage.threadID});
          saveMessages();
          api.setMessageReaction(":wow:", saveMessage.messageID);
          printToLog(saveMessage.body + " saved under " + messageName);
          resolve("Saved under " + messageName);
        }
      });
    });
  }

  function nameTaken(messageName){
    for (var i = 0; i < saved_messages.length; i++) {
      if (saved_messages[i].name.indexOf(messageName) != -1){
        return true;
      }
    }
    return false;
  }

  function recallMessage(rs, args){
    var find = args.join(" ");
    for (var i = 0; i < saved_messages.length; i++) {
      if( saved_messages[i].name.indexOf(find) != -1 && saved_messages[i].threadID == message.threadID){
        printToLog("Message found");
        return(saved_messages[i].body);
      }
    }
  }
  function deleteMessage(rs, args){
    var find = args.join(" ");
    var found = false;
    for (var i = 0; i < saved_messages.length; i++) {
      if (saved_messages[i].name.indexOf(find) != -1 && saved_messages[i].threadID == message.threadID){
        saved_messages.splice(i, 1);
        found = true;
      }
    }
    saveMessages();
    if(found){
      return("No worries, " + find + " is forgotten");
    }
  }

  function listMessages(rs, args){
    var text = "My saved messages:";
    for (var i = 0; i < saved_messages.length; i++) {
      if (saved_messages[i].threadID == message.threadID){
        text = text + "\n" + saved_messages[i].name[0];
      }
    }
    return(text);
  }
}

//Gets data saved in a JSON file
function getData(callback){
  return new Promise(function (resolve, reject) {
  fs.readFile(saved_data_file, "utf8", function(err, data) {
    bot_data = JSON.parse(data);
    printToLog("Updating options from JSON file, now on version " + bot_data.version)
    resolve();
  });
});
}

//Gets messages saved in a JSON file
function getSavedMessages(){
  return new Promise(function (resolve, reject) {
    fs.readFile(saved_messages_file, "utf8", function(err, data) {
      saved_messages = JSON.parse(data);
      printToLog("Updating messages from JSON file")
      resolve();
    });
  });
}
//Saves messages to file
function saveMessages(){
  fs.writeFile(saved_messages_file, JSON.stringify(saved_messages, null, 2) , 'utf-8');
}

//Prints to logfile
function printToLog(txt){
  console.log(txt);
  var date = new Date();
  var timestamp = date.toLocaleDateString() + " " +date.toLocaleTimeString();
  var string = "\n<li>" + timestamp + ": " + txt + "</li>" + "\n";
  fs.appendFile(logFile, string);
}
