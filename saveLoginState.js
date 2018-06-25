const fs = require("fs");
const login = require("facebook-chat-api");
var credentials = require("./config.js").credentials;

login(credentials, (err, api) => {
    if(err) return console.error(err);
    fs.writeFileSync('appstate.json', JSON.stringify(api.getAppState()));
});
