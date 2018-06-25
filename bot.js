const login = require("facebook-chat-api");
const fs = require("fs");
const giphy = require('giphy-api')();
const swearjar = require('swearjar');
const download = require('download-file');
const config = require('./config');
const logFile = config.logFile;
const saved_messages_file = config.saved_messages_file;
const saved_data_file = config.saved_data_file;
const bot_id = config.bot_user_id;

var bot_data;
var saved_messages;
var spamBack = "";

getData();
getSavedMessages();

login(config.credentials, (err, api) => {
    if(err) return console.error(err);
    printToLog("Successful login")
    api.setOptions({
      logLevel: "silent"
    });

    api.listen(listenForMessages);
    function listenForMessages(err, message){
      if(err) return console.error(err);
      body = message.body;
      if(bot_id in message.mentions){
        printToLog("Bot mentioned responding");
        respondToMention(message, api);
      }else if(swearjar.profane(body) || contains(body, bot_data.swears)){
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
});

function respondToMention(message, api){
  body = message.body;
  if(contains(body, ['gif'])){
    printToLog("Responding to gif request...");
    getRelevantGif(message);
  }else if(contains(body, ['save'])){
    printToLog("Saving a message for later");
    saveMessage();
  }else if(contains(body, ['remember'])){
    printToLog("Recalling a message from earlier")
    recallMessage();
  }else if(contains(body, ['delete'])){
    printToLog("Deleting a message from earlier")
    deleteMessage();
  }else if(contains(body, ['list'])){
    printToLog("Listing saved messages")
    listMessages();
  }else if(contains(body, ['update'])){
    getData();
    getSavedMessages();
  }else if(contains(body, ['spam', 'echo'])){
    spam();
  }else if(contains(body, ['stop spam', 'stop echo'])){
    spamBack = "";
  }else{
    recallMessage();
  }

  function spam(){
    for(key in message.mentions){
      if(key != bot_id){
        spamBack = key;
        printToLog("Spamming back " + key);
      }
    }
  }

  function saveMessage(){
    timestamp = undefined;
    api.getThreadHistory(message.threadID, 2, timestamp,(err, history) => {
      history.pop();
      messageName = getExtraData(message);
      if(nameTaken(messageName)){
        api.sendMessage("Sorry that name is taken!");
      }else{
        saved_messages.push({body : history[0].body,
                              name : [messageName],
                              canned : false,
                              threadID : history[0].threadID});
        fs.writeFile(saved_messages_file, JSON.stringify(saved_messages, null, 2) , 'utf-8');
        api.setMessageReaction(":wow:", history[0].messageID);
        api.sendMessage("Saved under " + messageName, message.threadID);
        printToLog(history[0].body + " saved under " + messageName);
      }
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

  function recallMessage(){
    find = getExtraData(message);
    for (var i = 0; i < saved_messages.length; i++) {
      if( saved_messages[i].name.indexOf(find) != -1 && saved_messages[i].threadID == message.threadID){
        api.sendMessage(saved_messages[i].body, message.threadID);
        printToLog("Message found");
      }
    }
  }

  function deleteMessage(){
    find = getExtraData(message);
    for (var i = 0; i < saved_messages.length; i++) {
      if (saved_messages[i].name.indexOf(find) != -1 && !saved_messages[i].canned && saved_messages[i].threadID == message.threadID){
      api.sendMessage("No worries, " + find + " is forgotten", message.threadID);
        saved_messages.splice(i, 1);
      }
    }
    fs.writeFile(saved_messages_file, JSON.stringify(saved_messages, null, 2) , 'utf-8');
  }

  function listMessages(){
    text = "My saved messages:";
    for (var i = 0; i < saved_messages.length; i++) {
      if (!saved_messages[i].canned && saved_messages[i].threadID == message.threadID){
        text = text + "\n" + saved_messages[i].name[0];
      }
    }
    api.sendMessage(text, message.threadID);
  }

  function getRelevantGif(){
    text = getExtraData(message, ['gif']);
    printToLog("\t\tSearching with parameters " + text);
    giphy.search(txt, gifFound);
    function gifFound(err, res){
      if(res == undefined){
        printToLog("\t\t\tNo gif found :(");
        api.sendMessage("I can't find any. I am a bad bot :(", message.threadID);
        return;
      }
      var url = res.data[0].images.fixed_width.url;
      download(url, {directory: "./data", filename: "current.gif"}, gifDownloaded);
    }
    function gifDownloaded(err){
        if (err) console.err(err);
        msg =
        api.sendMessage({attachment : fs.createReadStream('./data/current.gif')}, message.threadID);
        printToLog("\t\t\tGif " + res.data[0].title + " sent");
    }
  }
}

function respondToMessage(message, api){
  random = Math.random()
  if(random < bot_data.love_frequency){
    emoji = ':love:'
  }else{
    emoji = ':like:'
  }
  if(random < bot_data.cheer_frequency){
    printToLog("Sending a cheer!")
    txt = getRandomCheer(message);
    api.sendMessage(txt, message.threadID);
  }
  api.setMessageReaction(emoji, message.messageID);
}

function getRandomCheer(message){
  cheers = bot_data.cheers;
  random = Math.floor(Math.random() * Math.floor(cheers.length))
  txt = cheers[random];

  return replaceTagsWithActiveData(txt, message);
}

function replaceTagsWithActiveData(txt, message){
  txt = txt.replace(/@userID/g, message.senderID);
  txt = txt.replace(/@messageID/g, message.messageID);
  date = new Date();
  timestamp = date.toLocaleDateString() + " " +date.toLocaleTimeString();
  txt = txt.replace(/@date/g, timestamp);
}

//Tests if a string contains one (or more) of the patterns.
//CASE INSENSITIVE
function contains(testString, pattern){
    regex = new RegExp(pattern.join('|'), 'i');
    return regex.test(testString);
}

//Gets data saved in a JSON file
function getData(){
  fs.readFile(saved_data_file, "utf8", function(err, data) {
    bot_data = JSON.parse(data);
    printToLog("Updating options from JSON file, now on version " + bot_data.version)
  });
}

//Gets messages saved in a JSON file
function getSavedMessages(){
  fs.readFile(saved_messages_file, "utf8", function(err, data) {
    saved_messages = JSON.parse(data);
    printToLog("Updating messages from JSON file")
  });
}

//Removes Tags and command strings to get only the extra data
function getExtraData(message){
  body = message.body;
  body = replaceAll(body, ['gif', 'save', 'remember', 'delete', 'list', 'update'], "");

  for(key in message.mentions){
    body =  body.replace(message.mentions[key], "");
  }

  return body;
}

//Replaces strings in list find with string replace
//CASE INSENSITIVE
function replaceAll(str, find, replace) {
    for (var i = 0; i < find.length; i++) {
      str = str.replace(new RegExp("\ *" + find[i] + "\ *", 'gi'), replace);
    }
    return str;
}

//Prints to logfile
function printToLog(txt){
  date = new Date();
  timestamp = date.toLocaleDateString() + " " +date.toLocaleTimeString();
  string = "\n<li>" + timestamp + ": " + txt + "</li>" + "\n";
  fs.appendFile(logFile, string);
}
