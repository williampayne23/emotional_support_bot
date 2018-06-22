const login = require("facebook-chat-api");
var config = require('./config');

// Create simple echo bot
login(config, (err, api) => {
    if(err) return console.error(err);

    api.listen((err, message) => {
        api.sendMessage(message.body, message.threadID);
    });
});
