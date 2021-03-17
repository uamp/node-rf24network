# node-rf24network

Java implementation of maniagbug's rf24network using natevw's java implementation of RF24 for RPi.  (Unfinished)

https://github.com/maniacbug/RF24Network/

https://github.com/natevw/node-nrf/

Current sticking point is the underlying radio driver maintaing control over which physical pipe slots are used when openPipe() is used.  Also as the network layer needs to use all 6 listening pipes, the radio driver doesn't seem to reset them after a tx event has occured (bearing in mind that the NRF chip automatically sets P0 the same as it's transmit pipe)

The code in the node_modules sub folder is just a direct copy (of natevw's code) with only one small edit - lowered the SPI speed to improve NRF reliability on the PI.
