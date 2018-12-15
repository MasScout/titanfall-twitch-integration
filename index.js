// LIBRARY IMPORTS
// ------------------------------------------------------
const TwitchBot = require('twitch-bot'); // https://github.com/kritzware/twitch-bot
const Login = require('./twitch-login.js');
const ks = require('node-key-sender'); // https://www.oracle.com/technetwork/java/javase/downloads/jre8-downloads-2133155.html
const fs = require('fs');
var http = require('http');
const pipe = '\\\\.\\pipe\\TTF2SDK'; // Titanfall Pipe
// ------------------------------------------------------

//TWITCH CONFIG
// ------------------------------------------------------
//Login Info
const Bot = new TwitchBot({
  username: Login.username,
  oauth: Login.oauth,
  channels: [Login.channels]
})
// ------------------------------------------------------

// TITANFALL COMMANDS
// ------------------------------------------------------
const Commands = {
  lowGravity: ['sv_gravity 300','Low Gravity'],
  regularGravity: ['sv_gravity 750','Regular Gravity'],
  highGravity: ['sv_gravity 900','High Gravity'],
  inverted: ['m_invert_pitch 1','Inverted'],
  fov: ['cl_fovScale 1', 'Change FOV'],
  difficultyEasy: ['sp_difficulty 0', 'Easy Difficulty'],
  difficultyRegular: ['sp_difficulty 1', 'Regular Difficulty'],
  difficultyHard: ['sp_difficulty 2', 'Hard Difficulty'],
  difficultyMaster: ['sp_difficulty 3', 'Master Difficulty'],
  lastCheckpoint: ['load savegame', 'Load Last Checkpoint'],
  restartLevel: ['reload', 'Restart Level'],
  slowmoSpeed: ['host_timescale 0.5', 'Slowmo'],
  doubleSpeed: ['host_timescale 2', 'Fast Forward'],
  turboSpeed: ['host_timescale 5', 'Turbo Speed'],
  thirdPerson: ['thirdperson; thirdperson_mayamode 1; thirdperson_screenspace 1', 'Third Person Camera'],
  reset: 'firstperson; thirdperson_mayamode 0; thirdperson_screenspace 0; host_timescale 1; sp_difficulty 0; m_invert_pitch 0; sv_gravity 750; cl_fovScale 1.42003'
};

// FOV SCALE
// 1.55 - 110
// 1.42003 - 100
// 1.28442 - 90
// 1.13185 - 80
// 1 - 70
// ------------------------------------------------------

// FLAGS AND VARIABLES
// ------------------------------------------------------
var voting = true;
var votes1 = 0, votes2 = 0, votes3 = 0; // Vote counts
var voteStor = []; // Current vote storage
var winning;
var temp = [];
var tempCounting = [];
const keys = Object.keys(Commands);
var x;
// ------------------------------------------------------

// FUNCTIONS
// ------------------------------------------------------
// https://stackoverflow.com/questions/2532218/pick-random-property-from-a-javascript-object
//var randomProperty = function (obj) {
//var keys = Object.keys(obj)
//return obj[keys[ keys.length * Math.random() << 0]];
//Commands[keys[1]]
//};

// Runs through the Commands object and picks 3 random ones
function generateCommands() {
  for (let i = 0; i < 3; i++) {
    x=Math.floor(Math.random() * (keys.length-1));
    do {
      x=Math.floor(Math.random() * (keys.length-1));
    }
    while (temp.includes(x));
    temp.push(x);
    // Make 2D array for the commands
    voteStor.push([Commands[keys[temp[i]]][0]]);
    voteStor[i].push(Commands[keys[temp[i]]][1]);
  }
}

// Say the currently chosen commands in twitch chat
function sayCommands() {
  Bot.say("Use ! to choose an Command");
  Bot.say("!1 - "+voteStor[0][1]);
  Bot.say("!2 - "+voteStor[1][1]);
  Bot.say("!3 - "+voteStor[2][1]);
}

// Run a command in Titanfall
function generalCmd(a) {
  fs.writeFileSync(pipe, 'CGetLocalClientPlayer().ClientCommand("'+a+'")');
}

// The same as generalCmd but adds a + and a - to
// start and stop a movement command
function movementCmd(a) {
  fs.writeFileSync(pipe, 'CGetLocalClientPlayer().ClientCommand("+'+a+'")');
  setTimeout(function () {
    fs.writeFileSync(pipe, 'CGetLocalClientPlayer().ClientCommand("-'+a+'")');
  }, 1000)
}

function compareVotes(x,y,z) {
  tempCounting=[x,y,z];
  for (let i = 0; i < tempCounting.length; i++) {
    if (tempCounting[i]==Math.max(x,y,z)){
      // Futureproofing for using movement commands like +jump
      if ((voteStor[i][0]).includes("+") || (voteStor[i][0]).includes("-")){
        //movementCmd(Commands[keys[temp[i]]][0]);
        winning = voteStor[i][1];
        return voteStor[i][1];
      }
      else {
        //generalCmd(Commands[keys[temp[i]]][0]);
        winning = voteStor[i][1];
        return voteStor[i][1];
      }
    }
  }
}

// Reset all the variables
function reset() {
  temp=[];
  winning="";
  voteStor=[];
  tempCounting = [];
  votes1 = 0, votes2 = 0, votes3 = 0; // Vote counts
  //generalCmd(Commands.reset);
}

function startVoting() {
  console.log("Voting starts now");
  generateCommands();
  sayCommands();

  setTimeout(function () {
    endVoting();
  },10000);
}

function endVoting() {
  compareVotes(votes1,votes2,votes3);
  Bot.say(winning+" won with "+Math.max(votes1,votes2,votes3)+" votes");

  setTimeout(function () {
    reset();
    startVoting();
  },10000);
}
// ------------------------------------------------------

// HTTP SERVER
// ------------------------------------------------------
// https://stackoverflow.com/questions/6011984/basic-ajax-send-receive-with-node-js
// https://nodejs.org/en/docs/guides/anatomy-of-an-http-transaction/
const server = http.createServer();
server.on('request', (request, response) => {
  // the same kind of magic happens here!
});
// ------------------------------------------------------


Bot.on('join', () => {
  startVoting();
  Bot.on('message', chatter => {

    // Look for a command
    if ((chatter.message).includes("!") && voting) {
      switch (chatter.message) {
        case '!1':
          //Bot.say("You have chosen 1");
          votes1++;
          console.log("Vote 1 has "+votes1+" votes");
          break;
        case '!2':
          //Bot.say("You have chosen 2");
          votes2++;
          console.log("Vote 2 has "+votes2+" votes");
          break;
        case '!3':
          //Bot.say("You have chosen 3");
          votes3++;
          console.log("Vote 3 has "+votes3+" votes");
          break;
        default:
          Bot.say("Sorry that isn't a command");
      }
    }
  })
})

Bot.on('error', err => {
  console.log(err)
})
