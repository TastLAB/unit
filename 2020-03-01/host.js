const unit = require('./unit').control(on_message);
const units = {

};

const on = {
	update:async(value, handle)=>{
		units[value.index]=value.id;
		return units;
	}
};

async function on_message(value, handle){
	if(value.call in on) return await on[value.call](value, handle);
}