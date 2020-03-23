const cluster = require('cluster');
const unit = require('./unit');

if(cluster.isMaster){
	unit.deploy(['foreground','background'], process.env.unit_count||50, 'host','event');
/*
	unit array [ host, event, foreground, background, [foreground, background, ...] ]
*/
}else{
	switch(process.env.type){
	case 'host':require('./host');break;
	case 'event':require('./event');break;
	case 'foreground':require('./foreground');break;
	case 'background':require('./background');break;
	}
}