const mysql = require('mysql');
const config = require('./config');

module.exports = {

  addMessage : function(name, body, threadID){
    var sql = "INSERT INTO messages (name, body, thread_id) VALUES ('"+name+"', '"+body+"', '"+threadID+"');";
    return query(sql);
  },
  deleteMessage : function(name, threadID){
    var sql = "DELETE FROM messages WHERE thread_id = '"+threadID+"' AND name='"+name+"';";
    return query(sql);
  },
  getMessages : function(threadID){
    var sql = "SELECT * FROM messages WHERE thread_id = '"+threadID+"';";
    return query(sql);
  },
  getMessage : function(name, threadID){
    var sql = "SELECT * FROM messages WHERE thread_id = '"+threadID+"' AND name='"+name+"';";
    return query(sql);
  }


}

function query(sql){
  var con = mysql.createConnection(config.db_credentials);
  return new Promise(function(resolve, reject) {
    con.connect(function(err) {
      if (err) reject(err);
      con.query(sql, function (err, result) {
        if (err) reject(err);
        resolve(result)
      });
    });
  });
}
