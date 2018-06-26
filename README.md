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
The bot will randomly respond to messages with a reaction or a rivescript generated response [rivescript](https://www.rivescript.com/docs/tutorial). The message which is being reacted to is what is passed to rivescript to generate a response.
The frequency of these events are found and edited in the data.json file.
After editing the file send an [update request](#update) to the bot or restart the bot to refresh the file. Tagging the bot or messaging it directly will force the bot to always respond.
#### Rivescript responses
New responses can be added at any time to the brain folder as a .rive file which looks like this *(See the rivescript documentation for more info)*. For a random cheer after any message declare it under the * trigger.
```rivescript
+ *
- I love you <get userID>!
- I'm so happy!
```

##### User Variables

Note that the cheer had the tag <get userId> in it this would be replaced with the userId of the person who sent it. This uses rivescript user variables and a list of preloaded variables can be found below.

|Tag        |Substitution        |
|-----------|--------------------|
|userID    |The ID of the user who send the message which is being responded to|
|messageID |The ID of the message which is being responded to|
|date      |The current timestamp|
|threadID  |The threads Ids|
|threadName|The name of the thread|
|threadImage|The threads image|
|threadMessageCount|The message count of the thread|

##### Rivescript Commands
 Rivescript has a concept called subroutines which lets us attach code to the call tag in rivescript This lets rivescript code like this...
 ```
 + list
 - <call>list</call>
 ```

 Produce results like below because it is attached to the list method in the defineSubroutines.js file.

  ![Image of the list command](/images/ListCommand.png)

A list of available subRoutines can be found below.

|Call| Result          |
|-------------|-----------------|
|[update](#update)|Causes bot to refresh data from data.json and saved_messages.json without restarting|
|[gif <star\>](#gif)|Sends the gif resulting from searching the contents of the star tag|
|[save <star\>](#save)|Saves the previous message in saved_messages.json under the name given by the star tag|
|[delete <star\>](#delete)|Deletes the message given by the star tag|
|[list](#list)|Lists all the messages saved for the thread|
|[remember <star\>](#remember)|Remembers the message given by the star tag|
|[spam](#spam)|Echos everything said by the other user mentioned in the message|
|[stopSpam](#spam)|Stops echoing a user|

**Note: Commands are case insesitive**
#### Gif
The gif command quickly searches for a gif, useful for adding a bit of randomness to the giffing experience an example usage is below.

![Image of the gif command](/images/gifCommand.png)

A rive trigger to do this would be...
```
+ * gif
- <call>gif <star></call>
```

#### Update
This is a useful tag command as the update command allows the bot to refresh anything in the data files without having to log out and in again. Simply tagging the bot with the update command will cause it to refresh data files and note as much in the logfile.

#### Save
This will save a message for later use, using star tag as a reference. When a message is successfully saved a wow react will be added and a message will be sent as seen below. Repeat names will not be allowed

![Image of the save command](/images/saveCommand.png)

#### Delete

It will delete a saved message who's name is given by the star tag. Once it's been deleted a confirmation message will be sent such as below.

![Image of the delete command](/images/deleteCommand.png)

#### List

The list command is used to list the messages stored for the thread. The output is a list of message names such as below.

![Image of the list command](/images/listCommand.png)

#### Remember

The remember command calls for the bot to remember a saved message from it's reference as given by the star tag. Such as below.

![Image of the remember command](/images/rememberCommand.png)

#### Spam

The spam command will take the other person tagged in the message and echo everything they say back to them. It is meant as a anti spam defence. To stop it the *stopSpam* subroutine is used.

### Swear policing
The bot uses [swearjar](https://github.com/raymondjavaxx/swearjar-node) to police swearing on chats. The response is a sad react and the bot shouting "Language!" this can be turned off in data.json
```javascript
...
"cheer_frequency": 0.5,
"police_swearing" : true, //Set false to ignore swearing.
"version": 4
...
```
