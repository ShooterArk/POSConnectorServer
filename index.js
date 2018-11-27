var express = require('express');
var app = express();
var http = require('http').Server(app);
var io = require('socket.io')(http);
var router = express.Router(); 
var bodyParser = require('body-parser')
// var cors = require('cors');

users = [];
connections = [];

// app.use(express.json());


app.use(bodyParser.json());

// app.use(cors());

app.use(function(req, res, next) {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
  next();
});



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
	    msg = msg.replace(/(\r\n)/,"");
	    msg.trim();
	    users.push(msg);
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

	// console.log("Command received");

	createCommand(req.body);
});

router.post('/zplprinting', (req, res) => {
	// console.log(req.body.user);
	 //connections.indexOf(index);

	//io.to(connection).emit('labelToPrint', "message from the server");

	var index = users.indexOf(req.body.user);
	var connection = connections[index];

	var command = ""; //req.body.command.replace(" ", "^");

	for(i=0; i < req.body.commands.length; i++)
	{
		command += req.body.commands[i].cmd;
	}

	// console.log("User is " + req.body.user);
	// console.log("Command is " + command);

	io.to(connection).emit('labelToPrint', command);

	// console.log(req.body);

	res.send("Successful");
});

router.post('/zplprintings', (req, res) => {

	res.json("Successful");
});

app.get('/api/cleareverything', (req, res) => {
	// console.log(req.body.user);
	 //connections.indexOf(index);

	//io.to(connection).emit('labelToPrint', "message from the server");
	users = [];
	connections = [];
	res.send("Successful");
});

app.use('/api', router);

// PORT
var port = process.env.PORT || 3000;

http.listen(port, function(){
	console.log("listening at port " + port);
})

// function createCommand(data)
// {
// 	var command = "^XA\n\r";

// 	// command += "^LL" + data.width + "\n";
//  //    // command.push({"cmd": cmd});
//  //    command += "^PW" + data.height + "\n";
//  //    // command.push({"cmd": cmd});
//  //    command += "^MUd" + "\n";

// 	// Convert Text Array to Commands
// 	for(i=0; i < data.textArray.length; i++)
// 	{
// 		command += "^FO" + data.textArray[i].XPosition + "," + data.textArray[i].YPosition + "\n\r";


// 		console.log(data.textArray[i].font);

// 		if(data.textArray[i].font == 0)
// 		{
// 			console.log("font is 0");
// 			command += "^ADN,0,0";
// 		}
// 		else{
// 			console.log("font is not 0");
// 			command += "^A0N," + data.textArray[i].font +  ","; // + data.textArray[i].font;
// 		}

// 		command += "^FD" + data.textArray[i].text + "\n\r^FS\n\r"
// 	}

// 	// Map the barcode
// 	command += "^FO" + data.Barcode.XPosition + "," + data.Barcode.YPosition +"\n\r^BY2^" + getBarCodeType(data.Barcode) + "\n\r" + "^FD" + data.Barcode.data + "\n\r^FS\n\r"; 

// 	// Set the Quantity value in the command
// 	command += "^PQ" + data.Quantity + "\n\r"
// 	command += "^XZ";
// 	var index = users.indexOf(data.user);
// 	var connection = connections[index];

// 	io.to(connection).emit('labelToPrint', command);

// }

var mmpi = 25.4;
var dpi = 203;
var ptpmm = 2.834645669;
var dpmm = dpi / mmpi;

function mm2dots(mm) {
    return Math.round(mm * dpmm);
}

function pt2dots(pt) {
    return mm2dots(pt / ptpmm);
}

function dots2mm(mm) {
    return Math.round(mm / dpmm);
}

function dots2pt(pt) {
    return dots2mm(pt * ptpmm);
}

function createCommand(data)
{
	var labelWidth = mm2dots(data.width);
	var labelStripWidth = labelWidth * data.column;
	console.log("Label " + labelWidth + " mm2dots " + labelStripWidth)
	
	for (j =0; j < data.cmd.length; j++) {

		var command = "^XA\n\r";

		if(data.column !== 1)
		{
			command += "^MMC" + "\n";
			command += "^LL" + mm2dots(data.height) + "\n";
			command += "^PW" + labelStripWidth + "\n";
		    command += "^LS0" + "\n";
		}
 		
 		// Counter for iterate through the columns printing.
		var count = 1;

		while(count <= data.column)
		{
			// Convert Text Array to Commands
			for(i=0; i < data.cmd[j].textArray.length; i++)
			{
				// Check for the counter for the column number
				if(count == 1)
				{
					console.log("Printing First column");
					command += "^FO" + data.cmd[j].textArray[i].XPosition + "," + data.cmd[j].textArray[i].YPosition + "\n\r";
				}
				else if(count == 2)
				{
					// Position of the Text Object.
					// Label Width
					// 15 is the gap between two labels.
					console.log("Printing Second column");
					var xpos = parseInt(data.cmd[j].textArray[i].XPosition) + (labelWidth + 15);
					command += "^FO" + xpos + "," + data.cmd[j].textArray[i].YPosition + "\n\r";
				}
				else if(count == 3)
				{
					console.log("Printing third column");
					var xpos3 = parseInt(data.cmd[j].textArray[i].XPosition) + (labelWidth * 2) + 30;
					command += "^FO" + xpos3 + "," + data.cmd[j].textArray[i].YPosition + "\n\r";
				}
				

				if(data.cmd[j].textArray[i].font == 0)
				{
					command += "^ADN,0,0";
				}
				else{
					command += "^A0N," + data.cmd[j].textArray[i].font +  ","; // + data.textArray[i].font;
				}

				command += "^FD" + data.cmd[j].textArray[i].text + "\n\r^FS\n\r"
			}

			// Map the barcode
			if(count == 1)
			{
				command += "^FO" + data.cmd[j].Barcode.XPosition + "," + data.cmd[j].Barcode.YPosition +"\n\r^BY2^" + getBarCodeType(data.cmd[j].Barcode) + "\n\r" + "^FD" + data.cmd[j].Barcode.data + "\n\r^FS\n\r"; 
			}
			else if(count == 2)
			{
				var xposBar2 = parseInt(data.cmd[j].Barcode.XPosition) + (labelWidth + 15 );
				command += "^FO" + xposBar2 + "," + data.cmd[j].Barcode.YPosition +"\n\r^BY2^" + getBarCodeType(data.cmd[j].Barcode) + "\n\r" + "^FD" + data.cmd[j].Barcode.data + "\n\r^FS\n\r"; 
			}
			else if(count == 3)
			{
				var xposBar3 = parseInt(data.cmd[j].Barcode.XPosition) + (labelWidth * 2) + 30;
				command += "^FO" + xposBar3 + "," + data.cmd[j].Barcode.YPosition +"\n\r^BY2^" + getBarCodeType(data.cmd[j].Barcode) + "\n\r" + "^FD" + data.cmd[j].Barcode.data + "\n\r^FS\n\r"; 
			}
			// Set the Quantity value in the command
			var qty = 0;
			if(data.column == 1)
			{
				qty = data.cmd[j].Quantity;
			}
			else {
				qty = Math.ceil(data.cmd[j].Quantity / data.column);
			}
			command += "^PQ" + qty + "\n\r"

			count++;
		}	
		
		command += "^XZ";
		var index = users.indexOf(data.user);
		var connection = connections[index];

		// console.log('Command ' + command);
		// console.log('Connection ' + connection);

		io.to(connection).emit('labelToPrint', command);
	}

}

function getBarCodeType(barcode)
{
	switch(barcode.type)
	{
		case 'Aztec':
			return 'B0N,5,N,0,N,1,0';
			break;
		case 'Code 11':
			return 'B1N,N,150,Y,N';
			break;
		case 'Interleaved 2 of 5':
			return 'B2N,' + barcode.height + ',Y,N,N';
			break;
		case 'Code 39':
			return 'B3N,N,' + barcode.height + ',Y,N'; 100
			break;
		case 'Code 49':
			return 'B4N,20,A,A';
			break;
		case 'Planet Code':
			return 'B5N,' + barcode.height + '0,Y,N'; // 100
			break;
		case 'PDF417':
			return 'B7N,8,5,7,21,N';
			break;
		case 'EAN-8':
			return 'B8N,' + barcode.height + ',Y,N'; //100
			break;
		case 'UPC-E':
			return 'B9N,' + barcode.height + ',Y,N,Y'; // 100
			break;
		case 'Code 93':
			return 'BAN,' + barcode.height + ',Y,N,N'; //100
			break;
		case 'CODABLOCK':
			return 'BBN,30,,30,44,E';
			break;
		case 'Code 128':
			return 'BCN,' + barcode.height + ',Y,N,N'; // 100
			break;
		case 'UPS MaxiCode':
			return 'BD';
			break;
		case 'EAN-13':
			return 'BEN,' + barcode.height + ',Y,N'; //100
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
			return 'BLN,' + barcode.height + ',N'; // 100
			break;
		case 'MSI':
			return 'BMN,B,' + barcode.height + ',Y,N,N'; // 100
			break;
		case 'Plessey':
			return 'BPN,N,' + barcode.height + ',Y,N'; // 100
			break;
		case 'QR Code':
			return 'BQN,1,4';
			break;
		default:
			return null;
			break;
	}
}