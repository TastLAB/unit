const cluster = require('cluster');
var query_index = 0, h_gc;
const query_index_max = 0xffffff;
const h_id = {};

async function send(value, handle, option){
	process.send(value, handle, option);
}

function query_increment(){
	const b = Buffer.alloc(4);
	b.writeUInt32LE(query_index);
	query_index = ( query_index + 1 ) % query_index_max;
	return b.toString('latin1');
}

function start_gc(){
	if(h_gc) return;

	h_gc = setInterval(() => {
		for(const n in h_id){
			if(--h_id[n].timeout <= 0){
				h_id[n].result_value(null);
				delete h_id[n];
			}
		}

		for(const n in h_id) return;

		clearInterval(h_gc);
		h_gc = null;
	}, m.interval_gc);
}

const m = module.exports = {
	interval_gc:5000,
	deploy:(_unit, _processes, ... _host)=>{
		if(!_processes) _processes = require('os').cpus().length;

		const w_unit = new Array((_host?_host.length:0) + _unit.length*_processes);
		var i = 0;
		const lenh = _host.length, lend = _unit.length;
		if(_host){
			for(; i<lenh; i++) w_unit_init(_host[i], i, {host_count:lenh, unit_count:lend});
		}
		const len = i + lend*_processes;
		for(; i < len; i+=lend){
			const len = i+lend;
			for(var j=i,k=0; j<len; j++,k++) w_unit_init(_unit[k], j, {index_group:(i-lenh)/lenh});
		}

		function w_unit_init(__type, i, env){
console.log('init',__type, i);
			const a = w_unit[i] = cluster.fork({ type:__type, index:i.toString(), ...env });
			a.on('message', (query, handle)=>{
				if(w_unit[query.to]) w_unit[query.to].send(query, handle);
				else a.send(query);
			});
			a.on('exit',(code, signal)=>{
console.log('exit',__type, i);
				w_unit[i] = null;
				w_unit_init(__type, i, env);
			});
		}

		return w_unit;
	},
	control:(listner)=>{
		const index = process.env.index|0;
		const z = {
			index: index,
			sendTo:(_to, value, handle, option)=>{
				const query = {id: 0, index: index, to: _to, value};
				setImmediate(()=>{
					send(query, handle, option);
				});

				return {
					result:(timeout)=>{
						const id = query_increment();
						query.id = id;

						return new Promise((resolve, reject)=>{
							start_gc();

							h_id[id] = {
								timeout:timeout|5,
								result_value:(value)=>{
									delete h_id[id];
									resolve(value)
								}
							};
						})
					}
				};
			},
			broadcast:(value, handle)=>{
				send({value}, handle);
			}
		};

		if('host_count' in process.env) z.host_count = process.env.host_count|0;
		if('unit_count' in process.env) z.unit_count = process.env.unit_count|0;
		if('index_group' in process.env) z.index_group = process.env.index_group|0;

		process.on('message',async(query, handle)=>{
			if(query.id != 0 && query.index == query.to){
				if(query.id in h_id)h_id[query.id].result_value(query.value);
			}else if(listner){
				try{
					const result = await listner(query.value, handle);
					if(result!==undefined){
						query.to = query.index;
						query.value = result;
						send(query);
					}
				}catch(e){}
			}
		});

		return z;
	}
};