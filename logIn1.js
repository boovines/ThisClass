/* The express module is used to look at the address of the request and send it to the correct function */
var express = require('express');

var bodyParser = require("body-parser");

var crypto = require('crypto');

var mongoose = require("mongoose");

var usermodel = require("./user.js").getModel();

/* The http module is used to listen for requests from a web browser */
var http = require('http');

/* The path module is used to transform relative paths to absolute paths */
var path = require('path');

/* Creates an express application */
var app = express();

/* Creates the web server */
var server = http.createServer(app);

var dbAddress = process.env.MONGODB_URI || "mongodb://127.0.0.1/boovines";



/* Defines what port to use to listen to web requests */
var port =  process.env.PORT ? parseInt(process.env.PORT) : 8082;
function start_server() {
	app.use(bodyParser.json({limit: "16mb"}));
	/* Defines what function to call when a request comes from the path '/' in http://localhost:8080 */
	app.get('/logIn', (req, res, next) => {

		/* Get the absolute path of the html file */
		var filePath = path.join(__dirname, './logIn.html')

		/* Sends the html file back to the browser */
		res.sendFile(filePath);
	});

	/* Defines what function to call when a request comes from the path '/' in http://localhost:8082 */
	app.post("/logIn", (req, res, next)=> {
		// Adding a random string to salt the password with
		var password = req.body.password;
		var salt = crypto.randomBytes(128).toString('base64');
		// Winding up the crypto hashing lock 10000 times
		var iterations = 10000;
		crypto.pbkdf2(password, salt, iterations, 256, 'sha256', function(err, hash) {
			if(err) {
				return res.send({error: err});
			}
				res.send({error: null});
			});
		});

	app.get('/form', (req, res, next) => {

		/* Get the absolute path of the html file */
		var filePath = path.join(__dirname, './game.html')

		/* Sends the html file back to the browser */
		res.sendFile(filePath);
	});

	/* Defines what function to call when a request comes from the path '/' in http://localhost:8080 */
	app.post("/form", (req, res, next)=> {
		var newuser = new usermodel(req.body);
		// Adding a random string to salt the password with
		var password = req.body.password;
		var salt = crypto.randomBytes(128).toString('base64');
		newuser.salt = salt;
		// Winding up the crypto hashing lock 10000 times
		var iterations = 10000;
		crypto.pbkdf2(password, salt, iterations, 256, 'sha256', function(err, hash) {
			if(err) {
				return res.send({error: err});
			}
			newuser.password = hash.toString('base64');
			// Saving the user object to the database
			newuser.save(function(err) {

				// Handling the duplicate key errors from database
				if(err && err.message.includes('duplicate key error') && err.message.includes('userName')) {
					return res.send({error: 'Username, ' + req.body.userName + ' already taken'});
				}
				if(err) {
					return res.send({error: err.message});
				}
				res.send({error: null});
			});
		});
		res.send('OK')
	});

	/* Defines what function to all when the server recieves any request from http://localhost:8080 */
	server.on('listening', () => {

		/* Determining what the server is listening for */
		var addr = server.address()
			, bind = typeof addr === 'string'
				? 'pipe ' + addr
				: 'port ' + addr.port
		;

		/* Outputs to the console that the webserver is ready to start listenting to requests */
		console.log('Listening on ' + bind);
	});

	/* Tells the server to start listening to requests from defined port */
	server.listen(port);
}
mongoose.connect(dbAddress, start_server)
