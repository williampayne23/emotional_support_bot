RiveScript = require('rivescript')
module.exports = function(text, finishedCallback){
  rs = new RiveScript();
  rs.loadDirectory("brain", loadingDone, loadingError);
  function loadingDone(batchnum){
    rs.sortReplies();
    // And now we're free to get a reply from the brain!
    var reply = rs.reply("local-user", text);
    finishedCallback(null, reply);
  }

  function loadingError(err){
    finishedCallback(err, "Something went wrong!");
  }
}
