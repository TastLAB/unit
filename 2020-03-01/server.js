const cluster = require('cluster');
const unit = require('./unit');

if(cluster.isMaster){
	unit.deploy('host', 'client');
}else{
	switch(process.env.type){
	case 'host':require('./host');break;
	case 'client':require('./client');break;
	}
}