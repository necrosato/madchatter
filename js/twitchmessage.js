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
  constructor(checker, handler)
  {
    this.checker = checker 
    this.handler = handler
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
    }
  )
}

songRequestHandler = function ( songs, sendMsg )
{
  return new TwitchMessageHandler(
    function (tm) { return tm.cmd == "!sr"; },
    function (tm) 
    {
      if (tm.cmd_data.length > 0)
      {
        i = parseInt(tm.cmd_data[0])
        if (!isNaN(i))
        {
          if (i < songs.length)
          {
            return songs[i].requests++;
          }
        }
      }
      sendMsg("Must give a numeric index from the song list ( !sl )");
    }
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
    }
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
