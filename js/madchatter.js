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

  var songs = [
    new TwitchSong("Serenity Painted Death", "Opeth", "Still Life"),
    new TwitchSong("Wrathchild", "Iron Maiden")
  ];
  var message_cache = [];
  var message_handlers = [
    updateChatHandler("chatout"),
    pingPongHandler(socketSend),
    cacheHandler(message_cache),
    songListHandler(songs, sendMsg),
    songRequestHandler(songs, sendMsg),
    songRequestQueueHandler(songs, sendMsg),
    new TwitchMessageHandler(
      function (tm) { return tm.cmd == "!georgify"; },
      function (tm) { 
        sendMsg("PowerUpL PowerUpL PowerUpL");
        sendMsg("PowerUpR PowerUpR PowerUpR");
      }
    ),
    new TwitchMessageHandler(
      function (tm) { return tm.cmd == "!fuck"; },
      function (tm) { 
        sendMsg("Kreygasm ResidentSleeper");
        sendMsg("Kreygasm ResidentSleeper");
        sendMsg("Kreygasm ResidentSleeper");
        sendMsg("Kreygasm ResidentSleeper");
      }
    )
  ];

  function runHandlers(tm)
  {
    for (i in message_handlers)
    {
      message_handlers[i].handle(tm);
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
