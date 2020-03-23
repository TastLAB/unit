const unit = require('./unit').control(on_message);

const on = {
	proc_example_event_to_background:(value, handle)=>{
		// unit_index - offset_index, simple proxy data
		unit.sendTo(unit.index-1, {
			call:'proc_example_background_to_foreground',
			data:value.data
		});
	}
};

async function on_message(value, handle){
	if(value.call in on) return await on[value.call](value, handle);
}