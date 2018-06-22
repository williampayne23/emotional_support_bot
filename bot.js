const login = require("facebook-chat-api");
const fs = require("fs");
const giphy = require('giphy-api')();
const config = require('./config');
const swearjar = require('swearjar')
var bot_data;
const download = require('download-file');
const logFile = '../logs/bots/facebookbot.html'

getData();

login(config, (err, api) => {
    if(err) return console.error(err);
    print("Successful login")
    api.setOptions({
      logLevel: "silent"
    });
    api.listen((err, message) => {
      if(err) return console.error(err);

      body = message.body;
      swears = bot_data.swears;
      if('100026855901738' in message.mentions){
        print("Bot mentioned responding");
        respondToMention(message, api);
      }else if(swearjar.profane(body) || contains(body, swears)){
        print("Cracking down on swearing")
        api.sendMessage("Language!", message.threadID)
        api.setMessageReaction(":sad:", message.messageID);
      }else {
        if(Math.random() < bot_data.react_frequency){
          respondToMessage(message, api);
        }
      }


      api.markAsRead(message.threadID);
    });
});

function respondToMention(message, api){
  body = message.body;
  if(contains(body, ['gif', 'Gif'])){
    print("Responding to gif request...");
    gifRequest();
  }else if(contains(body, ['save', 'Save'])){
    print("Saving a message for later");
    saveMessage();
  }else if(contains(body, ['remember', 'Remember'])){
    print("Recalling a message from earlier")
    recallMessage();
  }else if(contains(body, ['update', 'Update'])){
    getData();
  }else if(contains(body, ['spam back'])){
    
  }

  function saveMessage(){
    var timestamp = undefined;
    api.getThreadHistory(message.threadID, 2, timestamp,(err, history) => {
      history.pop();
      fs.appendFile('savedmessages.txt', history[0].body);
      api.setMessageReaction(":wow:", history[0].messageID);
      print(history[0].body + " saved")
    });
  }

  function recallMessage(){
    fs.readFile('savedmessages.txt',"utf8", function(err, data) {
      print(data + " recalled")
      api.sendMessage(data, message.threadID)
      fs.writeFile('savedmessages.txt', '');
    });
  }

  function gifRequest(){
    //Get Gif Request
    var timestamp = undefined;
    api.getThreadHistory(message.threadID, 1, timestamp,(err, history) => {
          if(err) return console.error(err);
          text = ""

          for (var i = 0; i < history.length; i++) {
            //Ignoring messages from bot
            if(history[i].senderID != '100026824793542'){
              //Stripping mentions
              body = history[i].body;
              body.replace(/gif me/g, "");
              for(key in history[i].mentions){
                body =  body.replace(history[i].mentions[key], "")
              }
              //Adding to list
              text = text + body + " ";
            }
          }
          print("\t\tSearching with parameters " + text);
          getRelevantGif(text);
      });
  }

  function getRelevantGif(txt){
    giphy.search(txt, function (err, res) {
      if(res == undefined){
        print("\t\t\tNo gif found :(");
        api.sendMessage("I can't find any. I am a bad bot :(", message.threadID);
        return;
      }
      var url = res.data[0].images.fixed_width.url;
      var options = {
          directory: "./",
          filename: "current.gif"
      }

      download(url, options, function(err){
          if (err) console.err(err);
          msg = {
            attachment : fs.createReadStream('./current.gif')
          }
          api.sendMessage(msg, message.threadID);
          print("\t\t\tGif " + res.data[0].title + " sent");
      });
    });
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
    txt = getRandomCheer(message);
    print("Sending a cheer!")
    api.sendMessage(txt, message.threadID);
  }
  api.setMessageReaction(emoji, message.messageID);
}

function getRandomCheer(message){
  cheers = bot_data.cheers;
  //Get random cheer text.
  random = Math.floor(Math.random() * Math.floor(cheers.length))
  txt = cheers[random];

  //Replace @tags with active data.
  txt = txt.replace(/@userID/g, message.senderID);

  txt = txt.replace(/@messageID/g, message.messageID);

  date = new Date();
  timestamp = date.toLocaleDateString() + " " +date.toLocaleTimeString();
  txt = txt.replace(/@date/g, date);

  return txt;
}

function contains(target, pattern){
    var value = 0;
    pattern.forEach(function(word){
      value = value + target.includes(word);
    });
    return (value >= 1)
}

function getData(){
  fs.readFile("data.json", "utf8", function(err, data) {
    bot_data = JSON.parse(data);
    print("Updating options from JSON file, now on version " + bot_data.version)
  });
}

function print(txt){
  date = new Date();
  timestamp = date.toLocaleDateString() + " " +date.toLocaleTimeString();
  string = "\n<li>" + timestamp + ": " + txt + "</li>" + "\n";
  fs.appendFile(logFile, string);
}
