var express = require('express');
var app = express();
var http = require('http').Server(app);
var io = require('socket.io')(http);

users = [];
connections = [];

app.use(express.json());

app.get('/', function(req, res){
	res.sendFile(__dirname + '/index.html');
})

io.on('connection', function(socket){
	console.log(socket.id);
	socket.on('chat message', function(msg){
	    io.emit('chat message', msg);
	  });

	socket.on('registration', function(msg){
	    console.log("name " + msg);
	    users.push(msg.trim());
	    connections.push(socket.id);
	    console.log(users);
	    console.log(connections);
	  });

	socket.on('disconnect', function(data){
		console.log("Disconnected 1 Client");
		var i = connections.indexOf(socket.id);
		connections.splice(i, 1);
		users.splice(i, 1);
		console.log(users.length);
	});

});

app.post('/api/printlabel', (req, res) => {
	// console.log(req.body.user);
	 //connections.indexOf(index);

	//io.to(connection).emit('labelToPrint', "message from the server");

	createCommand(req.body);
});


// PORT
var port = process.env.PORT || 3000;

http.listen(port, function(){
	console.log("listening at port " + port);
})

function createCommand(data)
{
	var command = "^XA\n\r";

	// Convert Text Array to Commands
	for(i=0; i < data.textArray.length; i++)
	{
		command += "^FO" + data.textArray[i].XPosition + "," + data.textArray[i].YPosition + "\n\r";


		console.log(data.textArray[i].font);

		if(data.textArray[i].font == 0)
		{
			console.log("font is 0");
			command += "^ADN,0,0";
		}
		else{
			console.log("font is not 0");
			command += "^A2N," + data.textArray[i].font +  "," + data.textArray[i].font;
		}

		command += "^FD" + data.textArray[i].text + "\n\r^FS\n\r"
	}

	// Map the barcode
	command += "^FO" + data.Barcode.XPosition + "," + data.Barcode.YPosition +"\n\r^" + getBarCodeType(data.Barcode.type) + "\n\r" + "^FD" + data.Barcode.data + "\n\r^FS\n\r"; 

	// Set the Quantity value in the command
	command += "^PQ" + data.Quantity + "\n\r"
	command += "^XZ";
	// console.log(command);

	var index = users.indexOf(data.user);
	var connection = connections[index];

	io.to(connection).emit('labelToPrint', command);

}

function getBarCodeType(barcode)
{
	switch(barcode)
	{
		case 'Aztec':
			return 'B0N,5,N,0,N,1,0';
			break;
		case 'Code 11':
			return 'B1N,N,150,Y,N';
			break;
		case 'Interleaved 2 of 5':
			return 'B2N,150,Y,N,N';
			break;
		case 'Code 39':
			return 'B3N,N,100,Y,N';
			break;
		case 'Code 49':
			return 'B4N,20,A,A';
			break;
		case 'Planet Code':
			return 'B5N,100,Y,N';
			break;
		case 'PDF417':
			return 'B7N,8,5,7,21,N';
			break;
		case 'EAN-8':
			return 'B8N,100,Y,N';
			break;
		case 'UPC-E':
			return 'B9N,100,Y,N,Y';
			break;
		case 'Code 93':
			return 'BAN,100,Y,N,N';
			break;
		case 'CODABLOCK':
			return 'BBN,30,,30,44,E';
			break;
		case 'Code 128':
			return 'BCN,100,Y,N,N';
			break;
		case 'UPS MaxiCode':
			return 'BD';
			break;
		case 'EAN-13':
			return 'BEN,100,Y,N';
			break;
		case 'MicroPDF417':
			return 'BFN,8,3';
			break;
		case 'Industrial 2 of 5':
			return 'BIN,150,Y,N';
			break;
		case 'Standard 2 of 5':
			return 'BJN,150,Y,N';
			break;
		case 'ANSI Codabar':
			return 'BKN,N,150,Y,N,A,A';
			break;
		case 'LOGMARS':
			return 'BLN,100,N';
			break;
		case 'MSI':
			return 'BMN,B,100,Y,N,N';
			break;
		case 'Plessey':
			return 'BPN,N,100,Y,N';
			break;
		case 'QR Code':
			return 'BQN,1,4';
			break;
		default:
			return null;
			break;
	}
}