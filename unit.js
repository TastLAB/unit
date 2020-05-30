const cluster = require('cluster');
var query_index = 0, h_gc;
const query_index_max = 0xffffff;
const h_id = new Map();

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
		for(const [a,b] of h_id){
			if(--h_id[n].timeout <= 0){
				h_id[n].result_value(null);
				delete h_id[n];
			}
		}

		if( h_id.size > 0 ) return;

		clearInterval(h_gc);
		h_gc = null;
	}, m.interval_gc);
}

const m = module.exports = {
	interval_gc:5000,
	deploy:(_unit, _processes, ... _host)=>{
		if(!_processes) _processes = require('os').cpus().length;

		const len_unit = _unit.length, len_host = _host.length;
		const w_unit = new Array((_host?_host.length:0) + len_unit*_processes);
		var i = 0;
		if(_host){
			for(; i<len_host; i++) w_unit_init(_host[i], i, {host_count:len_host, unit_count:len_unit, processes:_processes});
		}
		const len = i + len_unit*_processes;
		for(var index_group=0; i < len; index_group++,i+=len_unit){
			const len = i+len_unit;
			for(var j=i,k=0; j<len; j++,k++) w_unit_init(_unit[k], j, {index_group});
		}

		function w_unit_init(type, index, env){
console.log('init',type, index);
			const a = w_unit[index] = cluster.fork({ type, index, ...env });
			a.on('message', (query, handle)=>{
				if(w_unit[query.to]) w_unit[query.to].send(query, handle);
				else a.send(query);
			});
			a.on('exit',(code, signal)=>{
console.log('exit',type, index);
				w_unit[index] = null;
				w_unit_init(type, index, env);
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

							h_id.set(id, {
								timeout:timeout|5,
								result_value:(value)=>{
									h_id.delete(id);
									resolve(value)
								}
							});
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
		if('processes' in process.env) z.processes = process.env.processes|0;

		if('index_group' in process.env) z.index_group = process.env.index_group|0;

		process.on('message',async(query, handle)=>{
			if(query.id != 0 && query.index == query.to){
				const a = h_id.get(query.id);
				if( a ) a.result_value(query.value);
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
