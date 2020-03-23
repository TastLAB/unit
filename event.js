const unit = require('./unit').control(on_message);
const units = {

};

/* broadcast to foreground delta time every 5 seconds */
var time_o = Date.now();
setInterval(async()=>{
	const d = Date.now();
	const dt = d - time_o;
	time_o = d;

	const host_count = unit.host_count;
	const unit_count = unit.unit_count;

	for(var i=0;i<unit_count;i++){
		// host_index + ( loop_index * offset_length ) +offset_index
		const id_unit = host_count + (i * 2) +1;
		unit.sendTo(id_unit, {
			call:'proc_example_event_to_background',
			data:dt
		});
	}
}, 5000);

const on = {
	update:(value, handle)=>{
		units[value.index]=value.id;
		return units;
	}
};

async function on_message(value, handle){
	if(value.call in on) return await on[value.call](value, handle);
}