const RiveScript = require('rivescript');
const defineSubroutines = require('./defineSubroutines');

var doneLoading = false;
var rs = new RiveScript();
updateFiles();

module.exports = function(message, api){

  defineSubroutines(rs, message, api);

  if(doneLoading){
    var text = stripMentions(rs, message);
    addVars(rs, message)
    .then(() => rs.replyAsync("local-user", text))
    .then((reply) => {
      //Some subroutines send their own messages so the return NOMESSAGE so we know not to send one here.
      if(!/NOMESSAGE/.test(reply)){
        api.sendMessage(reply, message.threadID);
      }
    })
    .catch(err => console.error(err));
  }else{
    api.sendMessage("I'm sorry I've forgotten how to talk", message.threadID);
  }

  function addVars(rs, message){
    return new Promise((resolve, reject) => api.getThreadInfo(message.threadID, (err, threadInfo) => {
      if(err) reject(err);
      var date = new Date();
      var timestamp = date.toLocaleDateString() + " " + date.toLocaleTimeString();
      var vars = {
        'userID'            : message.senderID,
        'messageID'         : message.messageID,
        'threadID'          : message.threadID,
        'threadName'        : threadInfo.name,
        'threadMessageCount': threadInfo.messageCount,
        'threadImage'       : threadInfo.imageSrc,
        'date'              : timestamp
      }
      rs.setUservars('local-user', vars);
      resolve();
    }));
  }
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
