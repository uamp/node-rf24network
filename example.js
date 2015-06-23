var NETWORK=require('./index')
var NRF24 = require("nrf"),
    spiDev = "/dev/spidev0.0",
    cePin = 24, irqPin = 25;            //var ce = require("./gpio").connect(cePin)
var nrf=NRF24.connect(spiDev,cePin,irqPin);
//nrf._debug=true;
var network=NETWORK.connect(nrf,90,20); //octal 24 - 4th device off the kitchen (2nd sensor)
//nrf.printDetails();
network.begin(nrf.printDetails());
//nrf.printDetails();

//var head=new Header();
//head.print();

var data_send=new Buffer(32-8);
data_send.fill(0);
data_send.writeUInt16BE(7,30-8);
data_send.writeUInt16BE(7,28-8);
data_send.writeUInt16BE(7,26-8);
console.log(data_send);

var data=new Buffer(32);
network.on('data',function(){
	data=network.read_message();
	console.log("message:");
	console.log(data);
	network.write(0,data_send);
	});


console.log("The end");
var a=0xFFFF;
var b=new Buffer(1);
b.writeUInt8(a,0,true);
console.log(b);
//test
