var events = require('events');

exports.connect = function(){
	var radio=new events.EventEmitter();
	//var radio ;

	radio.whoami=function(){
		console.log("Hello World");
	};

	return radio;
}