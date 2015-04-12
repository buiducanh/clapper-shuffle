var app = require('express')(); //Express Library
var server = require('http').Server(app); //Create HTTP instance
var io = require('socket.io')(server);
var google = require('googleapis');
var youtube = google.youtube('v3');
var graph = require("fbgraph");
var currVideo = {
	title: 'Mark Ronson - Uptown Funk ft. Bruno Mars',
	videoId: 'OPf0YbXqDm0'
};
var MAX_NUM_VIDEOS = 10;
var cached = {};
var fbAccessToken = 'CAACEdEose0cBAA0ZBI8Ns25hhZA3ahnRzZC3rBVKTvmQNZA2zNP4eb7nSRZAUiPqTL8ahmVCRrpKljMyk7Is5gvY3aJUR1IegDVRQbWxDpd8vvy8zhjCCNegOCkZB6uARby5o91R0sgBCMA0P84LHuSuQp3AbCBPTiCPKHErvsjdFe3kX9aXiAkw2MfS16hcscurvu6bcZBYvC7ZA7JA0NNJl0Q3dO8QozwZD';
graph.setAccessToken(fbAccessToken);
app.set('view engine', 'ejs');

app.get('/', function (req, res) {
  res.render('index.ejs');
});

io.on('connection', function(socket){
	console.log('connected');
    socket.on('clap', function(){ //on incoming websocket message...
        console.log('CLAP');
        if (cached[currVideo.videoId]){
        	currVideo = cached[currVideo.videoId];
        	io.sockets.emit('shuffle', currVideo);
        } else {
	        var mixPlaylistId = 'RD' + currVideo.videoId;
	        youtube.playlistItems.list({
	            key: 'AIzaSyDKlX3DQrYyslzHJZapevQyXY5iM6pqlhU',
	            part: 'id, snippet',
	            playlistId: mixPlaylistId,
	            maxResults: MAX_NUM_VIDEOS
	        }, function (err, data) {
	        	if (err){
	        		console.log(err);
	        	} else {
	        		var idx = Math.floor(Math.random() * (data.items.length));
	        		console.log(data.items[idx].snippet.title);
	        		var newVideo = {
	        			title: data.items[idx].snippet.title,
	        			videoId: data.items[idx].snippet.resourceId.videoId
	        		};
	        		if (!cached[newVideo.videoId] || cached.length >= MAX_NUM_VIDEOS-1) {
	        			cached[currVideo.videoId] = newVideo;
	        		}
			        else{
				    cached = {};
				}
					currVideo = newVideo;
					io.sockets.emit('shuffle',newVideo);
	        	}
	        });
	    }
    });
	
    socket.on('change_volume', function(data){
    	console.log(data);
    	io.sockets.emit('set_volume', Math.floor(data/1023 * 100));
    })

    socket.on('toggle_video', function(videoState){
    	videoState = !videoState;
    	io.sockets.emit('toggle_video', videoState);

	});

    socket.on('postfb', function(){
 		var wallPost = {
 			message: "I'm listening to "+currVideo.title+" via Clapper Shuffle!!!"
 		}
    	graph.post("me/feed", wallPost, function(err, res) {
	        console.log(res); // { id: xxxxx}
	    });

    });
});        

server.listen(3000, function(){
	console.log('Server is running on port 3000');
});
