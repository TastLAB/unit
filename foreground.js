const unit = require('./unit').control(on_message);

const on = {
	proc_example_background_to_foreground:async(value, handle)=>{
		// 0 == host_index, simple proxy data
		const result = await unit.sendTo(0, {call:'proc_example_foreground_to_host', index:unit.index, data:value.data}).result();
		console.log(result);
	}
};

async function on_message(value, handle){
	if(value.call in on) return await on[value.call](value, handle);
}