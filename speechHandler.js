const RiveScript = require('rivescript');
const defineSubroutines = require('./defineSubroutines');

var doneLoading = false;
var rs = new RiveScript();
updateFiles();

module.exports = function(message, api){

  defineSubroutines(rs, message, api);
  rs.setSubroutine("reverse", function(rs, args){
    return args.join(" ").split("").reverse().join("");
  })


  if(doneLoading){
    var text = stripMentions(rs, message);
    rs.replyAsync("local-user", text).then((reply) => {
      //Some subroutines have to wait for promises and callbacks so they'll send the message themselves, we don't want to send two messages so they'll output NOMESSAGE and we can look for that and not send a message in that case.
      if(!/NOMESSAGE/.test(reply)){
        reply = replaceTagsWithActiveData(reply, message);
        api.sendMessage(reply, message.threadID);
      }
    });
  }else{
    api.sendMessage("I'm sorry I've forgotten how to talk", message.threadID);
  }
}



function replaceTagsWithActiveData(txt, message){
  txt = txt.replace(/@userID/g, message.senderID);
  txt = txt.replace(/@messageID/g, message.messageID);
  var date = new Date();
  var timestamp = date.toLocaleDateString() + " " +date.toLocaleTimeString();
  txt = txt.replace(/@date/g, timestamp);
  return txt;
}

function stripMentions(rs, message){
  var body = message.body;
  var list = "";
  for(key in message.mentions){
    body =  body.replace(message.mentions[key], "");
    list = list + key + " ";
  }
  rs.setUservar('local-user', 'mentions', list);
  return body;
}

function updateFiles(){
  rs.loadDirectory("brain", loadingDone, loadingError);
  function loadingDone(batchnum){
    rs.sortReplies();
    doneLoading = true;
  }
  function loadingError(err){
    console.error(err);
  }
}
