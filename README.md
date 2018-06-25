# emotional_support_bot
A Facebook chat bot which provides emotional support. Attach it to a Facebook account by filling in the config.js file and then add it to a group. It will positively react and respond to commands in messages the bot has been mentioned in.

## Installation
First clone the repository
```
git clone https://github.com/williampayne23/emotional_support_bot
```
then edit the config.js file filling in the credentials and user ID. The user ID can be found by right clicking the bots account in the chat user list to the right of the main facebook page. The filename is the user ID.
```javascript
credentials : {
  email: "PUT YOUR BOTS EMAIL ADDRESS HERE",
  password: "PUT YOUR BOTS PASSWORD HERE"
},
bot_user_id : 'PUT YOUR BOTS FACEBOOK USER ID HERE',
```
Install the required repositories with npm.
```shell
npm install
```
Finally run with node.js
```shell
node bot.js
```
## Usage
### Message responses
The bot will randomly respond to messages with a reaction or random cheer taken from the data.json file.
The frequency of these events are also found and edited in the data.json file. After editing the file send an [update request](#update) to the bot or restart the bot **note:restarting the bot in quick succession is recommended as Facebook will recognise this as botish behaviour and may ban the account**.
#### Cheers
New cheers can be added at any time to the data.json file which looks like this.
```javascript
...
"cheers": [
  "I love you the most user @userID",
...
```
Note that this cheer has the tag @userID in it this will be replaced with the userId of the person who sent it. A list of tags can be found below.

|Tag        |Substitution        |
|-----------|--------------------|
|@userID    |The ID of the user who send the message which is being responded to|
|@messageID |The ID of the message which is being responded to|
|@date      |The current timestamp|

Tags make cheers more interesting and interactive!
#### Swear policing
The bot uses [swearjar](https://github.com/raymondjavaxx/swearjar-node) to police swearing on chats. The response is a sad react and the bot shouting "Language!" this can be turned off in data.json
```javascript
...
"cheer_frequency": 0.5,
"police+swearing" : true, //Set false to ignore swearing.
"version": 4
...
```

### Mention responses
Mentioning the bot in messages will trigger it to search the message for commands and act on them. Such as in the message below which runs the command to list messages saved by users of that thread... ![Image of the list command](/images/ListCommand.png)

A list of available commands can be found below.

|Command Text | Result          |
|-------------|-----------------|
|[Update](#update)|Causes bot to refresh data from data.json and saved_messages.json without restarting|
|[Gif](#gif)|Sends a gif by searching the text of the mention message|
|[Save](#save)|Saves the previous message in saved_messages.json under the name given by the rest of the text of the message|
|[Delete](#delete)|Deletes the message given by the rest of the text of the message|
|[List](#list)|Lists all the messages saved for the thread|
|[Remember](#remember)|Remembers the message given by the rest of the text|
|[Spam](#spam)|Echos everything said by the other user mentioned in the message|
|[Stoop spam](#spam)|Stops echoing a user|

**Note: Commands are case insesitive**
#### Gif
The gif command quickly searches for a gif, useful for adding a bit of randomness to the giffing experience an example usage is below. ![Image of the gif command](/images/gifCommand.png)

#### Update
This is a useful tag command as **regularly restarting the bot can lead to the account being banned** the update command allows the bot to refresh anything in the data files without having to log out and in again. Simply tagging the bot with the update command will cause it to refresh data files and note as much in the logfile.

#### Save
This will save a message for later use, using the mention text as a reference. When a message is successfully saved a wow react will be added and a message will be sent as seen below. Repeat names will not be alowed

![Image of the save command](/images/saveCommand.png)

#### Delete

It will delete a saved message with the same convention as the save command. Once it's been deleted a confirmation message will be sent such as below.

![Image of the delete command](/images/deleteCommand.png)

#### List

The list command is used to list the messages stored for the thread. The output is a list of message names such as below.

![Image of the list command](/images/listCommand.png)

#### Remember

The remember command calls for the bot to remember a saved message from it's reference as given by the mention message. Such as below.

![Image of the remember command](/images/rememberCommand.png)

#### Spam

The spam command will take the other person tagged in the message and echo everything they say back to them. It is meant as a anti spam defence. To stop it the *stop spam* command is used.
