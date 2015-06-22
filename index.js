
var events = require('events'),
    stream = require('stream'),
    util = require('util');

function Header(){
	//this = new Buffer(8); //can I do this?
	this.buffer=new Buffer(8);	
};

Header.prototype = {
  	//need to make header a class
    to_node: function(to_node){
	if (arguments.length < 1) return this.buffer.readUInt16BE(4);
	else this.buffer.writeUInt16BE(to_node,4);  //might need to be little endian
    },

    from_node: function(from_node){
	if (arguments.length < 1) return this.buffer.readUInt16BE(6);
	else this.buffer.writeUInt16BE(from_node,6);  //might need to be little endian
    },

    id: function(id){
	if (arguments.length < 1) return this.buffer.readUInt16BE(2);
	else this.buffer.writeUInt16BE(id,2);  //might need to be little endian
    },

    type: function(type){
	if (arguments.length < 1) return this.buffer.readUInt8(1);
	else this.buffer.writeUInt8(type,1);
    },
	
    print: function(){
    	console.log("Header buffer:"); //need to add all the logging aspects
    	console.log(this.buffer);
    }
};


exports.connect = function (radio, channel, node_id) {
    var network = new events.EventEmitter();
    var node_address; /**< Logical node address of this unit, 1 .. UINT_MAX */
    var frame_size = 32; /**< How large is each frame over the air */ 
    var header= new Buffer(8); 
    var hh=new Header(); //test this!!
    var frame_buffer=new Buffer(frame_size); /**< Space to put the frame that will be sent/received over the air */
    //var frame_queue=new Buffer(5*frame_size); /**< Space for a small set of frames that need to be delivered to the app layer */
    var frame_queue=[];
    var next_frame; /**< Pointer into the @p frame_queue where we should place the next received frame */
    var next_msg_id=1;
    var parent_node; /**< Our parent's node address */
    var parent_pipe; /**< The pipe our parent uses to listen to us */
    var node_mask; /**< The bits which contain signfificant node address information */

    if (!is_valid_address(node_id)) return;
    node_address=node_id;

    network.begin = function(cb){ 
	radio.channel(channel).transmitPower('PA_MAX').dataRate('250kbps').crcBytes(2).autoRetransmit({count:15, delay:4000});
	radio.begin(function(){
		setup_address();	
		//want to put this into an array
		rx0=radio.openPipe('rx',pipe_address(node_address,0),{size:32,autoAck:true});
                rx0.on('data', function(d){     process_data(d);  });
		rx1=radio.openPipe('rx',pipe_address(node_address,1),{size:32,autoAck:true});
		rx1.on('data', function(d){	process_data(d);  }); 
		rx2=radio.openPipe('rx',pipe_address(node_address,2)[4],{size:32,autoAck:true});
		rx2.on('data', function(d){	process_data(d);  }); 
		rx3=radio.openPipe('rx',pipe_address(node_address,3)[4],{size:32,autoAck:true});
		rx3.on('data', function(d){	process_data(d);  }); 
		rx4=radio.openPipe('rx',pipe_address(node_address,4)[4],{size:32,autoAck:true});
		rx4.on('data', function(d){	process_data(d);  }); 
		rx5=radio.openPipe('rx',pipe_address(node_address,5)[4],{size:32,autoAck:true});
		rx5.on('data', function(d){	process_data(d);  }); 
		//rx0=radio.openPipe('rx',pipe_address(node_address,0)[4],{autoAck:true});
		//rx0.on('data', function(d){	process_data(d);  }); 
		//radio.printDetails();
		network.emit('ready');
		if (cb) network.once('ready',cb);
	});
    	 
  	//radio.startListening();
	
	//console.log(header.from_node());
	//console.log(header);
    };
 

    network.update = function (){   }; //will end up depricated
    network.available = function(){  }; //will end up depricated
    network.peek = function(header){  }; //will end up depricated 
    //network.read = function(header, message,length){  }; //do we really need the ability to select message based on header?
    network.read=function(){
    		// handle end of queue
		return frame_queue.pop();    //want to replace this with original function above
	};
    network.write = function(header, message, length){
    	};
    
    network.parent = function(){   
	if ( node_address == 0 )
    	  return -1;
  	else
    	  return parent_node;
    };

    function open_pipes(){ };
    function find_node(current_node, target_node) { };

    function write_to_pipe(node,pipe){ //would rather have a bottom function that has the full data buffer passed to it
	//var ok=false;
	var tx=radio.openPipe('tx',pipe_address(node,pipe),{size:32,autoAck:true}) //need to put this frame size as per frame_size
	tx.on('ready',function() {			//how long does this function live? ie, does it close once the write_to_pipe function completes
		tx.write(frame_buffer);			//what happens if the frame buffer is already over-written before this function starts?
		});
	tx.on('error',function(){ 
		console.log("Error sending");
		});
    };

    function write(to_node){
    	var ok=false;
    	if ( !is_valid_address(to_node) ) 
		 return false; 
		 
	var send_node = parent_node; 
	var send_pipe = parent_pipe; 

	if ( is_direct_child(to_node) ) 
	{ 
		// Send directly 
		send_node = to_node; 
		// To its listening pipe 
		send_pipe = 0; 
	} 
	// If the node is a child of a child 
	// talk on our child's listening pipe, 
	// and let the direct child relay it. 
	else if ( is_descendant(to_node) ) 
	{ 
		send_node = direct_child_route_to(to_node); 
		send_pipe = 0; 
	};
	ok = write_to_pipe( send_node, send_pipe );
	return ok;
    };

    function process_data(data){
    	console.log("Rec Data:");
    	console.log(data);
    	//copy data into header and frame buffer - do we need to do this?
    	data.copy(frame_buffer,0,0,frame_size); //do we need this?
    	data.copy(header,0,frame_size-8,frame_size); //header is only 8 bytes
    	//console.log("Orig header");
    	//console.log(header);
    	//more testing
    	var h_local=new Header();
    	data.copy(h_local.buffer,0,frame_size-8,frame_size);
    	h_local.print();
    	var to_node=header.to_node();
	//console.log(to_node);
	//console.log(header);
	//console.log(data);
    	if (to_node==node_address){
    		//enqueue();
    		var header_test=new Header();
    		var add_frame=true;
    		frame_queue.forEach(function(){
			this.copy(header_test.buffer,0,frame_size-8,frame_size)
			if (header_test.buffer.equals(h_local.buffer)) add_frame=false;
			//or
			//if (header.equals(this.slice(frame_size-8,frame_size))) add_frame=false;
    		});
    		if (add_frame) {
    			frame_queue.push(data); //add data onto the queue
			network.emit('data'); //send data event to any listeners
    		};
    	}
    	else {
    		//write_buffer(data);
    		//write(to_node);
    	};
    	
    };

    header.to_node= function(to_node){
	if (arguments.length < 1) return header.readUInt16BE(4);
	else header.writeUInt16BE(to_node,4);  //might need to be little endian
    }

    header.from_node=function(from_node){
	if (arguments.length < 1) return header.readUInt16BE(6);
	else header.writeUInt16BE(from_node,6);  //might need to be little endian
    };

    header.id=function(id){
	if (arguments.length < 1) return header.readUInt16BE(2);
	else header.writeUInt16BE(id,2);  //might need to be little endian
    };

    header.type=function(type){
	if (arguments.length < 1) return header.readUInt8(1);
	else header.writeUInt8(type,1);
    };

    function is_direct_child(  node ){ 
	var result = false;
	
	// A direct child of ours has the same low numbers as us, and only
	// one higher number.
	//
	// e.g. node 0234 is a direct child of 034, and node 01234 is a
	// descendant but not a direct child
	
	// First, is it even a descendant?
	if ( is_descendant(node) )
	{
	  // Does it only have ONE more level than us?
	  var child_node_mask = ( ~ node_mask ) << 3;
	  result = ( node & child_node_mask ) == 0 ;
	}
	return result; 
    };

    function is_descendant( node ){ return ( node & node_mask ) == node_address; };
    
    function direct_child_route_to( node ) {
	// Presumes that this is in fact a child!!

	var child_mask = ( node_mask << 3 ) | parseInt('111', 2);
	return node & child_mask ; 
    };

    function pipe_to_descendant( node ) {
	var i = node;
	var m = node_mask;
  
	while (m)
	{
    	   i >>= 3;
    	   m >>= 3;
	}
	return i & parseInt('111', 2); 
    };

    function is_valid_address (node){
	var result=true;
	  while(node)
	  {
	    var digit = node & parseInt('111', 2);
	    if (digit < 1 || digit > 5)
	    {
	      result = false;
	      //printf_P(PSTR("*** WARNING *** Invalid address 0%o\n\r"),node); //need to put this into JAVA speak
	      break;
	    }
	    node >>= 3;
	  }
	return result;
    };

    function pipe_address(node,pipe) {
	var pipe_segment = [ 0x3c, 0x5a, 0x69, 0x96, 0xa5, 0xc3 ];
	
	//var result;
	//uint8_t* out = reinterpret_cast<uint8_t*>(&result);

	var out=new Buffer(5);	

	out[4] = pipe_segment[pipe];
	
	var w; 
	var i = 0;
	var shift = 12;
	while(i<4)   //has been reversed from C++ original in order to get the bytes in the buffer the right way round
	{
	  w = ( node >> shift ) & 0xF ; 
	  w |= ~w << 4;
	  out[i] = w;
	  shift -= 4;
	  i++;
	}
	
	//IF_SERIAL_DEBUG(uint32_t* top = reinterpret_cast<uint32_t*>(out+1);printf_P(PSTR("%lu: NET Pipe %i on node 0%o has address %lx%x\n\r"),millis(),pipe,node,*top,*out));
	//var out=Buffer("F0F0F0F0F0", 'hex');
	console.log(out);
	return out;
   };

   function setup_address()	{
	// First, establish the node_mask
	//console.log("HERE");
	var node_mask_check = 0xFFFF;
	while ( (node_address & node_mask_check)>0 ){
	        node_mask_check=0xFFFF & (node_mask_check<<3); //original was 16bit number, this ensure that still works
	}; 
	node_mask = 0xFFFF & (~ node_mask_check);
	
	// parent mask is the next level down
	var parent_mask = node_mask >> 3;
	
	// parent node is the part IN the mask
	parent_node = node_address & parent_mask;
	
	// parent pipe is the part OUT of the mask
	var i = node_address;
	var m = parent_mask;
	while (m)
	{
	  i >>= 3;
	  m >>= 3;
	}
	parent_pipe = i;	
	//console.log("here!!!");
   };
	
    return network;	
}
