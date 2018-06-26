"use strict";

const config = require('./config');
const fs = require("fs");
const giphy = require('giphy-api')();
const download = require('download-file');
const logFile = config.logfile;
const saved_messages_file = config.saved_messages_file;
const saved_data_file = config.saved_data_file;
const bot_id = config.bot_user_id;

var saved_messages;

getData(function (){});
getSavedMessages(function (){});


module.exports = function(rs, message, api){

  rs.setSubroutine('spam', spam);
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

  function update(rs, args){
    return new rs.Promise(function (resolve, reject) {
      var i = 0;
      updateFiles(callback);
      getSavedMessages(callback);
      getData(callback);
      function callback(){
        i++;
        if(i>=3){
          resolve("Update sucessful!");
        }
      }
    });
  }

  function updateFiles(callback){
    rs.loadDirectory("brain", loadingDone, loadingError);
    function loadingDone(batchnum){
      rs.sortReplies();
      printToLog("Updating rive files")
      callback();
    }
    function loadingError(err){
      console.error(err);
    }
  }

  function getRelevantGif(rs, args){
    console.log("Getting relevant gif")
    return new rs.Promise(function (resolve, reject) {
      var text = args.join(" ");
      printToLog("\t\tSearching with parameters " + text);
      giphy.search(text, gifFound);
      function gifFound(err, res){
        if(res == undefined){
          printToLog("\t\t\tNo gif found :(");
          resolve("I can't find any. I am a bad bot :(");
        }
        var random = Math.floor(Math.random() * res.data.length);
        var randomGif = res.data[random];
        var url = randomGif.images.fixed_width.url;
        download(url, {directory: "./data", filename: "current.gif"}, gifDownloaded);
        function gifDownloaded(err){
            if (err) console.err(err);
            api.sendMessage({attachment : fs.createReadStream('./data/current.gif')}, message.threadID);
            printToLog("\t\t\tGif " + randomGif.title + " sent");
            resolve("NOMESSAGE");
        }
      }
    });
  }

  function saveMessage(rs, args){
    return new rs.Promise(function (resolve, reject) {
      var timestamp = message.timestamp;
      api.getThreadHistory(message.threadID, 2, timestamp,(err, history) => {

        console.log(history);
        history.pop();
        var messageName = args.join(" ");
        if(nameTaken(messageName)){
          resolve("Sorry that name is taken!");
        }else{
          saved_messages.push({body : history[0].body,
                                name : [messageName],
                                threadID : history[0].threadID});
          saveMessages();
          api.setMessageReaction(":wow:", history[0].messageID);
          printToLog(history[0].body + " saved under " + messageName);
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
  fs.readFile(saved_data_file, "utf8", function(err, data) {
    bot_data = JSON.parse(data);
    printToLog("Updating options from JSON file, now on version " + bot_data.version)
    callback();
  });
}

//Gets messages saved in a JSON file
function getSavedMessages(callback){
  fs.readFile(saved_messages_file, "utf8", function(err, data) {
    saved_messages = JSON.parse(data);
    printToLog("Updating messages from JSON file")
    callback();
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
