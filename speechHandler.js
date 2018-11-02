const RiveScript = require('rivescript');
const defineSubroutines = require('./defineSubroutines');

var doneLoading = false;
var rs = new RiveScript();
updateFiles();

module.exports = function(message, api) {

    defineSubroutines(rs, message, api);
    console.log("RESPONDING")
    if (doneLoading) {
        var previousTopic = rs.getUservar(message.threadID, 'topic')
        if (previousTopic == 'undefined') {
            previousTopic = 'random';
        }
        var text = stripMentions(rs, message);
        addVars(rs, message)
            .then(() => rs.reply(message.threadID, text))
            .then((reply) => {
                //Some subroutines send their own messages so the return NOMESSAGE so we know not to send one here.
                if (!/NOMESSAGE/.test(reply)) {
                    api.sendMessage(reply, message.threadID);
                }
                //When a topic is opened wait for a response
                var topic = rs.getUservar(message.threadID, 'topic');
                if (topic != 'random' && previousTopic == 'random') {
                    if (global.waitingforresponse.indexOf(message.threadID) <= -1) {
                        global.waitingforresponse.push(message.threadID);
                        console.log(previousTopic)
                        console.log("Waiting for response");
                        console.log(topic)
                    }
                }
                //When a topic is closed stop waiting for a response
                if (rs.getUservar(message.threadID, 'topic') == 'random' && previousTopic != 'random') {
                    var index = global.waitingforresponse.indexOf(message.threadID);
                    if (index > -1) {
                        global.waitingforresponse.splice(index, 1);
                        console.log(previousTopic)
                        console.log("Stopped waiting for response");
                        console.log(topic)
                    }
                }

            })
            .catch(err => console.error(err));
    } else {
        api.sendMessage("I'm sorry I've forgotten how to talk", message.threadID);
    }

    function addVars(rs, message) {
        return new Promise((resolve, reject) => api.getThreadInfo(message.threadID, (err, threadInfo) => {
            if (err) reject(err);
            var date = new Date();
            var timestamp = date.toLocaleDateString() + " " + date.toLocaleTimeString();
            var vars = {
                'userID': message.senderID,
                'messageID': message.messageID,
                'threadID': message.threadID,
                'threadName': threadInfo.name,
                'threadMessageCount': threadInfo.messageCount,
                'threadImage': threadInfo.imageSrc,
                'date': timestamp
            }
            rs.setUservars(message.threadID, vars);
            resolve();
        }));
    }
}

function stripMentions(rs, message) {
    var body = message.body;
    var list = "";
    for (key in message.mentions) {
        body = body.replace(message.mentions[key], "");
        list = list + key + " ";
    }
    rs.setUservar(message.threadID, 'mentions', list);
    return body;
}

function updateFiles() {
    rs.loadDirectory("brain").then(() => {
        rs.sortReplies();
        doneLoading = true;
    }).catch((err, filename, linenum) => {
        console.error(err);
    });
}