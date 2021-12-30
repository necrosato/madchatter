(function(){function r(e,n,t){function o(i,f){if(!n[i]){if(!e[i]){var c="function"==typeof require&&require;if(!f&&c)return c(i,!0);if(u)return u(i,!0);var a=new Error("Cannot find module '"+i+"'");throw a.code="MODULE_NOT_FOUND",a}var p=n[i]={exports:{}};e[i][0].call(p.exports,function(r){var n=e[i][1][r];return o(n||r)},p,p.exports,r,e,n,t)}return n[i].exports}for(var u="function"==typeof require&&require,i=0;i<t.length;i++)o(t[i]);return o}return r})()({1:[function(require,module,exports){
class TwitchMessage {
  constructor( data, user="unknown")
  {
    this.data = data;
    this.user = user
    this.args = data.split(/\s/);
    this.privmsg_index = this.args.findIndex( (el) => el == "PRIVMSG" );
    
    if (this.privmsg_index != -1)
    {
      this.channel = this.args[this.privmsg_index + 1]
      this.msg_raw = this.args.slice(this.privmsg_index + 2).join(" ")
      this.msg = this.msg_raw.slice(1)
      this.cmd = ""
      this.cmd_data = []
      this.cmd_data_str = ""
      if (this.msg[0] == "!")
      {
        this.cmd = this.msg.split(/\s/)[0];
        this.cmd_data = this.msg.split(/\s/).slice(1);
        this.cmd_data_str = this.msg.substring(this.cmd.length).trim();
      }
      if (this.privmsg_index > 0 && user == "unknown")
      {
        this.user = this.args[this.privmsg_index - 1 ].match(/:.+!/)[0].slice(1, -1);
      }
    }
  }
  toString() { return this.data; }
  formatted() { return this.user + " " + this.msg_raw + "\n"; }
  isMessage() { return this.privmsg_index != -1; }
}

class TwitchMessageHandler { 
  constructor(checker, handler, helper = function(){})
  {
    this.checker = checker 
    this.handler = handler
    this.helper = helper
  }
  handle(tm)
  {
    if (this.checker(tm))
    {
      this.handler(tm);
    }
  }
}

class TwitchSong {
  constructor(name, artist, album = "")
  {
    this.name = name
    this.artist = artist
    this.album = album
    this.requests = 0
  }
  toString() { 
    if ( this.album ) { return this.name + " - " + this.artist + " (" + this.album + ")" }
    return this.name + " - " + this.artist;
  }
}

songListHandler = function ( songs, sendMsg )
{
  return new TwitchMessageHandler(
    function (tm) { return tm.cmd == "!sl"; },
    function (tm) 
    {
      sendMsg("Song List:")
      for ( i in songs )
      {
        sendMsg( i.toString() + ": " + songs[i] );
      }
    },
    function () { return sendMsg("Use ( !sl ) for a list of available songs"); }
  )
}

songRequestHandler = function ( songs, sendMsg, song_requests, request_limit )
{
  return new TwitchMessageHandler(
    function (tm) { return tm.cmd == "!sr" && (!(tm.user in song_requests) || song_requests[tm.user].length < request_limit ) ; },
    function (tm) 
    {
      if (!(tm.user in song_requests))
      {
        song_requests[tm.user] = [];
      }
      if (tm.cmd_data.length > 0)
      {
        i = parseInt(tm.cmd_data[0])
        if (!isNaN(i))
        {
          if (i < songs.length)
          {
            song_requests[tm.user].push(songs[i]);
            requests_left = request_limit - song_requests[tm.user].length;
            songs[i].requests++;
            return sendMsg(tm.user + " requested " + songs[i] + " ... requests left: " + requests_left.toString());
          }
        }
      }
      sendMsg("Must give a numeric index from the song list ( !sl )");
    },
    function () { return sendMsg("Use ( !sr <N> ) to requests a song from the song list. All accounts get " + request_limit.toString() + " requests"); }
  )
}

songRequestResetHandler = function ( songs, sendMsg, song_requests, user )
{
  return new TwitchMessageHandler(
    function (tm) { return tm.cmd == "!srr" && tm.user == user; },
    function (tm) 
    {
      for (i in songs)
      {
        songs[i].requests = 0;
      }
      for (user in song_requests)
      {
        song_requests[user] = [];
      }
      sendMsg("All requests have been reset, all account requests reset");
    },
    function () { return sendMsg("Use ( !srr ) to reset all song requests and account requests (protected)"); }
  )
}

songRequestClearHandler = function ( songs, sendMsg, user )
{
  return new TwitchMessageHandler(
    function (tm) { return tm.cmd == "!src" && tm.user == user; },
    function (tm) 
    {
      if (tm.cmd_data.length > 0)
      {
        i = parseInt(tm.cmd_data[0])
        if (!isNaN(i))
        {
          if (i < songs.length)
          {
            songs[i].requests = 0;
            return 0;
          }
        }
        sendMsg("Must give a numeric index from the song list ( !sl )");
      }
      else
      {
        sorted = [...songs].sort(function(a,b){ return b.requests - a.requests })
        sorted[0].requests = 0
      }
    },
    function () { return sendMsg("Use ( !src [N] ) to clear requests for a single song, no argument for top song (protected)"); }
  )
}

songRequestQueueHandler = function ( songs, sendMsg )
{
  return new TwitchMessageHandler(
    function (tm) { return tm.cmd == "!srq"; },
    function (tm) 
    {
      sorted = [...songs].sort(function(a,b){ return b.requests - a.requests })
      sendMsg("Song Request Queue:")
      for ( i in sorted )
      {
        sendMsg( sorted[i].requests + ": " + sorted[i] );
      }
    },
    function () { return sendMsg("Use ( !srq ) to print the current song request queue"); }
  )
}

// returns a handler that ping-pongs given a socket sending function
pingPongHandler = function (socketSend)
{
  return new TwitchMessageHandler(
    function (tm) { return tm == "PING :tmi.twitch.tv"; },
    function (tm) { socketSend(new TwitchMessage("PONG :tmi.twitch.tv")); }
  )
}

// returns a handler that updates an html element with the message if it is a user message
updateChatHandler = function ( element ) 
{
  return new TwitchMessageHandler(
    function (tm) { return tm.isMessage(); },
    function (tm)
    { 
      var chatout = document.getElementById(element);
      chatout.value += tm.formatted()
      chatout.scrollTop = chatout.scrollHeight;
    }
  )
}

cacheHandler = function ( cache )
{
  return new TwitchMessageHandler(
    function (tm) { return true; },
    function (tm)
    {
      cache.push(tm); 
    }
  )
}

helpHandler = function ( helper, sendMsg )
{
  return new TwitchMessageHandler(
    function (tm) { return tm.cmd == "!help"; },
    function (tm) { return helper() },
    function (tm) { return sendMsg("Use ( !help ) to display the command usage"); }
  )
} 
function generateSongs()
{
  return [
    new TwitchSong("Serenity Painted Death", "Opeth", "Still Life"),
    new TwitchSong("Wrathchild", "Iron Maiden", "Killers"),
    new TwitchSong("Hallowed Be Thy Name", "Iron Maiden", "Number of the Beast"),
    new TwitchSong("Life Demise", "Unanimated", "Ancient God Of Evil"),
    new TwitchSong("Beyond The Dark Sun", "Wintersun", "ST")
  ];
}
function madchatterSite()
{
  var url = "wss://irc-ws.chat.twitch.tv:443";
  var current_channel = ""
  var user;
  var socket = null;

  function socketSend(buf)
  {
    console.log("SENDING: " + buf);
    socket.send(buf + "\r\n");
  }

  var songs = generateSongs();
  var message_cache = [];
  var song_requests = {};
  var request_limit = 5;
  function generateHandlers()
  {
    return [
      updateChatHandler("chatout"),
      pingPongHandler(socketSend),
      cacheHandler(message_cache),
      songListHandler(songs, sendMsg),
      songRequestHandler(songs, sendMsg, song_requests, request_limit),
      songRequestResetHandler(songs, sendMsg, song_requests, user),
      songRequestClearHandler(songs, sendMsg, user),
      songRequestQueueHandler(songs, sendMsg),
      helpHandler(runHelpers, sendMsg),
      new TwitchMessageHandler(
        function (tm) { return tm.cmd == "!georgify"; },
        function (tm) { 
          sendMsg("PowerUpL PowerUpL PowerUpL");
          sendMsg("PowerUpR PowerUpR PowerUpR");
        }
      )
    ];
  }
  var message_handlers;

  function runHandlers(tm)
  {
    for (i in message_handlers)
    {
      message_handlers[i].handle(tm);
    }
  }
  function runHelpers(tm)
  {
    for (i in message_handlers)
    {
      message_handlers[i].helper();
    }
  }

  function openSocket()
  {
    socket = new WebSocket(url);
    var token = document.getElementById("oauth").value;
    user = document.getElementById("user").value;
    socket.onopen = function(event)
    {
      socketSend("PASS " + token)
      socketSend("NICK " + user)
      socketSend("JOIN " + channel)
    }

    socket.onmessage = function (event)
    {
      console.log(event.data);
      var tm = new TwitchMessage(event.data.trim());
      runHandlers(tm);
    }
    message_handlers = generateHandlers();
  }

  function joinChannel()
  {
    if (socket == null)
    {
      openSocket();
    }
    var channel = document.getElementById("channel").value;
    if (current_channel != "")
    {
      socketSend("PART " + current_channel);
      current_channel = "";
    }
    if (channel != "")
    {
      channel = "#" + channel;
      socketSend("JOIN " + channel);
      current_channel = channel;
    }
    runHelpers();
  }

  function sendMsg(chat)
  {
    if (chat != "" && current_channel != "") 
    {
      var tm = new TwitchMessage("PRIVMSG " + current_channel + " :" + chat, user);
      socketSend(tm);
      runHandlers(tm);
      return true;
    }
    return false;
  }

  function sendChat()
  {
    var chatbox = document.getElementById("chatbox");
    var chat = chatbox.value;
    if ( sendMsg(chat) )
    {
      chatbox.value = "";
    }
  }

  function addCredentials()
  {
    var app = document.getElementById("app");
    // input oath
    app.appendChild(document.createTextNode("Oauth Token: "));
    var input = document.createElement("input");
    input.type = "text";
    input.name = "oauth";
    input.id = "oauth";
    input.defaultValue = "";
    input.addEventListener("keyup", function(event)
      {
        if (event.keyCode === 13) // 13 is enter
        {
          event.preventDefault(); // prevent default action
          openSocket();
        }
      });
    app.appendChild(input);
    // Append a line break
    app.appendChild(document.createElement("br"));
    // input user
    app.appendChild(document.createTextNode("Username: "));
    input = document.createElement("input");
    input.type = "text";
    input.name = "user";
    input.id = "user";
    input.defaultValue = "";
    input.addEventListener("keyup", function(event)
      {
        if (event.keyCode === 13) // 13 is enter
        {
          event.preventDefault(); // prevent default action
          openSocket();
        }
      });
    app.appendChild(input);
    // Append a line break
    app.appendChild(document.createElement("br"));
  } 


  function addJoinChannel()
  {
    var app = document.getElementById("app");
    app.appendChild(document.createTextNode("Join Channel: "));
    // input channel 
    var input = document.createElement("input");
    input.type = "text";
    input.name = "channel";
    input.id = "channel";
    input.defaultValue = "";
    input.addEventListener("keyup", function(event)
      {
        if (event.keyCode === 13) // 13 is enter
        {
          event.preventDefault(); // prevent default action
          joinChannel();
        }
      });
    app.appendChild(input);
    // Create a button to send
    var button = document.createElement("button");
    button.id="joinchannel";
    button.textContext="join";
    button.onclick=joinChannel;
    app.appendChild(button);
    // Append a line break
    app.appendChild(document.createElement("br"));
  } 

  function addChatInput()
  {
    var app = document.getElementById("app");
    app.appendChild(document.createTextNode("Channel Chat: "));
    // input chatbox
    var input = document.createElement("input");
    input.type = "text";
    input.name = "chatbox";
    input.id = "chatbox";
    input.defaultValue = "";
    input.addEventListener("keyup", function(event)
      {
        if (event.keyCode === 13) // 13 is enter
        {
          event.preventDefault(); // prevent default action
          sendChat();
        }
      });    app.appendChild(input);
    // Create a button to send
    var button = document.createElement("button");
    button.id="sendchat";
    button.textContext="send";
    button.onclick=sendChat;
    app.appendChild(button);
    // Append a line break
    app.appendChild(document.createElement("br"));
  } 

  function addChatOutput()
  {
    var app = document.getElementById("app");
    app.appendChild(document.createTextNode("Channel Chat Output: "));
    // output chatbox
    var output = document.createElement("textarea");
    output.readonly = true;
    output.disabled = true;
    output.rows = 10;
    output.cols = 80;
    output.name = "chatout";
    output.id = "chatout";
    output.defaultValue = "";
    app.appendChild(output);
    app.appendChild(document.createElement("br"));
  } 

  addCredentials()
  addJoinChannel()
  addChatInput()
  addChatOutput()
}
madchatterSite()

},{}]},{},[1]);
