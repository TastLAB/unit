const cluster = require('cluster');
var query_index = 0, h_gc;
const query_index_max = 0xffffff;
const h_id = {};

async function send(value, handle){
	process.send(value, handle);
}

function query_increment(){
	const b = Buffer.alloc(4);
	b.writeUInt32LE(query_index);
	query_index = ( query_index + 1 ) % query_index_max;
	return b.toString();
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
	deploy:(type_host, type_unit, unit_processes)=>{
		if(!unit_processes) unit_processes = (process.env.unit_count||require('os').cpus().length)|0;
		
		const w_unit = new Array(unit_processes);
		w_unit_init(type_host, 0)
		for(var i = 1; i <= unit_processes; i++) w_unit_init(type_unit, i);

		function w_unit_init(__type, i){
			const a = w_unit[i] = cluster.fork({ type:__type, index:i.toString() });
			a.on('message', (query, handle)=>{
				if(w_unit[query.to]) w_unit[query.to].send(query, handle);
				else a.send(query);
			});
			a.on('exit',(code, signal)=>{
				w_unit[i] = null;
				w_unit_init(i);
			});
		}

		return w_unit;
	},
	control:(listner)=>{
		const index = process.env.index|0;
		const z = {
			index: index,
			sendTo:(_to, value, handle)=>{
				const query = {id: 0, index: index, to: _to, value};
				setImmediate(()=>{
					send(query, handle);
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

		process.on('message',async(query, handle)=>{
			if(query.id != 0 && query.index == query.to){
				h_id[query.id].result_value(query.value);
			}else if(listner){
				try{
					const result = await listner(query.value, handle);
					if(result){
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