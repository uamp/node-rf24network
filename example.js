var NETWORK=require('./index')
var NRF24 = require("nrf"),
    spiDev = "/dev/spidev0.0",
    cePin = 24, irqPin = 25;            //var ce = require("./gpio").connect(cePin)
var nrf=NRF24.connect(spiDev,cePin,irqPin);
var network=NETWORK.connect(nrf);
//nrf.printDetails();
network.begin(10,0);
//nrf.printDetails();


console.log("The end");
var a=0xFFFF;
var b=new Buffer(1);
b.writeUInt8(a,0,true);
console.log(b);
