const unit = require('./unit').control(on_message);
const units = {

};

const on = {
	proc_example_foreground_to_host:(value, handle)=>{
		units[value.index] = value.data;

		//return data
		return value.data;
	}
};

setInterval(()=>{
	console.log(units)
}, 5000);

async function on_message(value, handle){
	if(value.call in on) return await on[value.call](value, handle);
}