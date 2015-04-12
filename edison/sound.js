// Plug the sound sensor into the Analog port A0 on the provided
// Seeed Sensor Kit Arduino Shield
// MUST be in the analog pin slots!
// Plug the Led component into the D4 slot
var five = require("johnny-five");
var Edison = require("edison-io");
var socket = require('socket.io-client')('http://192.168.0.102:3000');
var board = new five.Board({
  io: new Edison()
});

var CLAP_VOLUME = 600;
var CLAP_INTERVAL = 4000;
var VOLUME_INTERVAL = 100;	
var VOLUME_DIFF = 100;
var RENDER_INTERVAL = 400;

board.on("ready", function() {
  	var sound = new five.Sensor("A0");
  	var rotary = new five.Sensor("A1");
	var lcd = new five.LCD({
	    controller: "JHD1313M1"
	});
	var button = new five.Button(4);
	var touch = new five.Button(2);
	var led = new five.Led(8);
	led.on();
  	var currClap = new Date();
  	var currVol = new Date();
  	var currVolVal = 0;
  	var isPlaying = true;

  	socket.emit('clap');

	button.on("release", function() {
		socket.emit('toggle_video', isPlaying);
		isPlaying = !isPlaying;
		if (isPlaying){
			led.on();
		} else {
			led.off();
		}
	});

	touch.on('release', function() {
		socket.emit('postfb');
	})

  	rotary.on("data", function() {
  		var newVol = new Date();
  		if (newVol - currVol > VOLUME_INTERVAL){
  			var newVolVal = 1023-this.value;
  			if (Math.abs(newVolVal - currVolVal) > VOLUME_DIFF) {
  				console.log(newVolVal);
  				currVolVal = newVolVal;
  				currVol = newVol;	
  				socket.emit('change_volume',currVolVal);	
  			}
  		}
  	});

  	var lcdIntervalId = setInterval(function(){
					  		printTitle(' Mark Ronson - Uptown Funk ft. Bruno Mars');
					  	}, RENDER_INTERVAL);
  	var charCnt = 0;

  	function printTitle(data){
		lcd.clear();
		var title = data.substring(charCnt, data.length); 
		lcd.cursor(0, 0).print(title);
		charCnt = (charCnt + 1) % (data.length);
  	}

  	socket.on('shuffle', function(data){
  		charCnt = 0
  		console.log(data);
  		if (lcdIntervalId) {
  			clearInterval(lcdIntervalId);
  		}
  		lcdIntervalId = setInterval(function(){
  			printTitle(' ' + data.title)
  		}, RENDER_INTERVAL);
  	});

  	function ledOn(){
  		isPlaying = true;
  		led.on();
  	}

	setInterval(function() {
		var newClap = new Date();
		if (sound.value > CLAP_VOLUME && newClap-currClap > CLAP_INTERVAL) {
			socket.emit('clap');
			ledOn();
			console.log(sound.value);
			currClap = newClap;
		}
	}, 20);

});
