const unit = require('./unit').control(on_message);

const on = {
	update:(value, handle)=>{
		
		return true;
	}
};

var id=0;
setInterval(async()=>{
	const g=await unit.sendTo(0, {call:'update', index:unit.index, id:id++}).result();
	console.log('unit:',unit.index,g);
},5000);

async function on_message(value, handle){
	if(value.call in on) return on[value.call](value, handle);
}