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
