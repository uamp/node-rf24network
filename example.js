var NETWORK=require('./index')
var NRF24 = require("nrf"),
    spiDev = "/dev/spidev0.0",
    cePin = 24, irqPin = 25;            //var ce = require("./gpio").connect(cePin)
var nrf=NRF24.connect(spiDev,cePin,irqPin);
var network=NETWORK.connect(nrf,90,20); //octal 24 - 4th device off the kitchen (2nd sensor)
//nrf.printDetails();
network.begin(nrf.printDetails());
//nrf.printDetails();

var data=new Buffer(32);
network.on('data',function(){
	data=network.read();
	console.log(data);
	});


console.log("The end");
var a=0xFFFF;
var b=new Buffer(1);
b.writeUInt8(a,0,true);
console.log(b);
