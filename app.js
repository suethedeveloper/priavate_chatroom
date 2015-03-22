var express = require('express'),
    app = express(),
    server = require('http').createServer(app),
    io = require('socket.io').listen(server),
    redis = require('redis'),
    client = redis.createClient(),
    users = {};






client.SMEMBERS("nickname", function(err, names){
   nicknames = names;
});

server.listen(3000);

app.get('/', function(req, res){
  res.sendFile(__dirname + '/index.html');
});

app.use(express.static(__dirname + '/public'));

io.sockets.on('connection', function(socket){
  socket.on('join', function(name, callback){
    console.log('users:',users);
    if (name in users){
      callback(false);
    } else {
      callback(true);
      socket.broadcast.emit("add chatter", name);
      // client.SMEMBERS('names', function(err, names){
        // names.forEach(function(name){
          io.sockets.emit('add chatter', name);
        // });
      // });
      client.sadd("nickname", name);
      socket.nickname = name; 
      users[socket.nickname] = socket;
      updateNicknames();
    }
  });

  function updateNicknames(){
    // client.SMEMBERS("nickname", function(err, names){
        io.sockets.emit('usernames', Object.keys(users));
    // });
  }

  socket.on('send message', function(data, callback){
    var msg = data.trim();
    if (msg.substr(0,3) === '/w '){
      msg = msg.substr(3);
      var ind = msg.indexOf(' ');
      if (ind !== -1){
        var name = msg.substring(0, ind);
         msg = msg.substring(ind + 1);
        if (name in users){
          users[name].emit('whisper', {msg: msg, nick: socket.nickname});
          console.log('whisper');
        } else {
          callback('Error, enter a valid user.');
        }
      } else {
        callback('Error, please enter a message for your whisper.');
      }
    }else{
      io.sockets.emit('new message', {msg: data, nick: socket.nickname});
    }
  });

  socket.on('disconnect', function(data){
    if (!socket.nickname) return; //user leaves without entering username
    socket.broadcast.emit("remove chatter", socket.nickname);
    delete users[socket.nickname];
    client.SREM("nickname", socket.nickname);
    updateNicknames();
  });

});
