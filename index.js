/* The express module is used to look at the address of the request and send it to the correct function */
var express = require('express');
var Io = require('socket.io');
var bodyParser = require("body-parser");
var crypto = require('crypto');
var mongoose = require("mongoose");
var usermodel = require("./user.js").getModel();
var http = require('http');
var path = require('path');

var app = express();
var server = http.createServer(app);
var io = Io(server);
var iterations = 10000;
var dbAddress = process.env.MONGODB_URI || "mongodb://127.0.0.1/boovines";
var port =  process.env.PORT ? parseInt(process.env.PORT) : 8080;

function addSockets() {
	io.on('connection', (socket) => {
		console.log('user connected')
		socket.on('disconnect', () => {
			console.log('user disconnected');
		});
		socket.on('message', (message) =>{
			io.emit('newMessage',message);
		});
	});
}

function start_server() {
	addSockets();
	function authenticateUser(username, password, callback) {
		if (!username) return callback('No username provided');
		if (!password) return callback('No password provided');
		usermodel.findOne({username: username}, function(err, user) {
			if(err) return callback ('Error in getting user from database');
			if(!user) return callback('Username Does not exist');
			crypto.pbkdf2(password, user.salt, iterations, 256, 'sha256', function(err, hash) {
				if(err) return callback ('Error in hashing password');
				if(user.password !== hash.toString('base64')) return callback('Wrong Password');
				callback(null);
			});
		});
	}

	app.use(bodyParser.json({limit: "16mb"}));
	app.use(express.static(path.join(__dirname, 'public')));

	app.get('/form', (req, res, next) => {
		var filePath = path.join(__dirname, './form.html')
		res.sendFile(filePath);
	});

	app.post('/form', (req, res, next) => {
		var newuser = new usermodel(req.body);
		// Adding a random string to salt the password with
		var password = req.body.password;
		var salt = crypto.randomBytes(128).toString('base64');
		newuser.salt = salt;
		console.log('SIGNUP', password, salt, iterations)
		crypto.pbkdf2(password, salt, iterations, 256, 'sha256', function(err, hash) {
			if(err) {
				return res.send({error: err});
			}
			newuser.password = hash.toString('base64');
			// Saving the user object to the database
			newuser.save(function(err) {

				// Handling the duplicate key errors from database
				if(err && err.message.includes('duplicate key error') && err.message.includes('username')) {
					return res.send({error: 'Username, ' + req.body.userName + ' already taken'});
				}
				if(err) {
					return res.send({error: err.message});
				}
				res.send({error: null});
			});
		});
	})

	app.get('/game', (req, res, next) => {

		var filePath = path.join(__dirname, './game.html')
		res.sendFile(filePath);

	});

	app.post("/login", (req, res, next)=> {
		var username = req.body.username;
		var password = req.body.password;
		authenticateUser(username, password, function(err) {
				res.send({error:err});
		});
	});

	app.get('/login', (req,res,next)=>{
		var filePath = path.join(__dirname, './login.html')
		res.sendFile(filePath);
	})

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
