"use strict";

const RiveScript = require('rivescript');
const config = require('./config');
const db = require("./db");
const fs = require("fs");
const axios = require('axios');
const logFile = config.logfile;
const saved_messages_file = config.saved_messages_file;
const saved_data_file = config.saved_data_file;
const bot_id = config.bot_user_id;


module.exports = function(rs, message, api){

  rs.setSubroutine('spam', spam);
  rs.setSubroutine('stopSpam', stopSpam);
  rs.setSubroutine('update', update);
  rs.setSubroutine('gif', getRelevantGif);
  rs.setSubroutine('save', saveMessage);
  rs.setSubroutine('recall', recallMessage);
  rs.setSubroutine('delete', deleteMessage);
  rs.setSubroutine('list', listMessages);
  rs.setSubroutine('wait', waitForResponse);
  rs.setSubroutine('waitwho', whoAreYouWaitingFor);
  rs.setSubroutine('topic', topic);
  rs.setSubroutine('quote', quote);

  function quote(rs, args){
    var url="https://quotes.rest/qod?category=" + args[0];
    return new rs.Promise(function(resolve, reject) {
      axios.get(url).then(res => {
      quote = res.data.contents.quotes[0]
      resolve(quote.quote + "\n-" + quote.author)
    }).catch(err => {
      if (err == 'Error: Request failed with status code 429') {
        resolve("I'm sorry I can only find 10 quotes per hour because the people who made the quote API are not good doggos and won't share freely :(")
      }else{
        printToLog("ERROR FINDING QUOTE: " +err);
        resolve("Oh dears I am very confused sombody should probably check my log");
      }
    });
  });
  }

  function topic(){
    return rs.getUservar(message.threadID,'topic');
  }

  function waitForResponse(rs, args){
    if(args[0] == "true"){
      if(global.waitingforresponse.indexOf(message.threadID)>-1){
      }else{
        global.waitingforresponse.push(message.threadID);
      }
    }else{
      var index = global.waitingforresponse.indexOf(message.threadID);
      if(index > -1){
        global.waitingforresponse.splice(index, 1);
      }
    }
  }

  function whoAreYouWaitingFor(){
    var text = "Threads I'm waiting for:"
    for (var i =0; i< global.waitingforresponse.length; i++) {
        text = text+"\n"+global.waitingforresponse[i];
    }
    return text;
  }

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
      .then(response => api.sendMessage({attachment : response.data}, message.threadID))
      .catch(err => console.error(err))
    });
  }

  function saveMessage(rs, args){
    return new rs.Promise(function (resolve, reject) {
      var timestamp = undefined;
      api.getThreadHistory(message.threadID, 2, timestamp, function(err, hist){
        if(err){
          console.error(err);
          reject(err);
        }
        console.log(hist);
        saveMessage = hist[0];
        var messageName = args.join(" ");
        db.addMessage(messageName, saveMessage.body, message.threadID);
        api.setMessageReaction(":wow:", saveMessage.messageID);
        printToLog(saveMessage.body + " saved under " + messageName);
        resolve("Saved under " + messageName);
      });
    });
  }

  function recallMessage(rs, args){
    return new rs.Promise(function (resolve, reject) {
      var find = args.join(" ");
      db.getMessage(find, message.threadID).then((result) => {
        printToLog("Message found");
        resolve(result[0].body);
      });
    });
  }
  function deleteMessage(rs, args){
    return new rs.Promise(function (resolve, reject) {
      var find = args.join(" ");
      db.deleteMessage(find, message.threadID).then(() => {
        resolve("No worries, " + find + " is forgotten");
      });
    });
  }

  function listMessages(rs, args){
    return new rs.Promise(function (resolve, reject) {
      var text = "My saved messages:";
      db.getMessages(message.threadID).then((results) => {
        for (var i = 0; i < results.length; i++) {
          text = text + "\n" + results[i].name;
        }
        console.log(text);
        resolve(text);
      }).catch((err) => {
        console.err(err);
      });
    });
}

//Gets data saved in a JSON file
function getData(callback){
  return new Promise(function (resolve, reject) {
  fs.readFileSync(saved_data_file, "utf8", function(err, data) {
    bot_data = JSON.parse(data);
    printToLog("Updating options from JSON file, now on version " + bot_data.version)
    resolve();
  });
});
}

//Prints to logfile
function printToLog(txt){
  console.log(txt);
  var date = new Date();
  var timestamp = date.toLocaleDateString() + " " +date.toLocaleTimeString();
  var string = "\n<li>" + timestamp + ": " + txt + "</li>" + "\n";
  fs.appendFileSync(logFile, string);
}

}
