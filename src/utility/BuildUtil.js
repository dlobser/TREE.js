define(function(){

	var TREE = require('core');

	TREE.prototype._generateFixedParams = function(params){

		//helper function for generate

		var counter = 0;

		var keys = (Object.keys(params));
		for(var i = 0 ; i < keys.length ; i++){
			if(counter < params[keys[i]].length){
				counter = params[keys[i]].length;
			}
		}

		var amt = counter;

		var tempParams = this._generateDefaultParams(amt);
		
		keys = (Object.keys(params));

		for(i = 0 ; i < keys.length ; i++){
			tempParams[keys[i]] = params[keys[i]];
			if(tempParams[keys[i]].length<amt){
				for (var j = tempParams[keys[i]].length - 1 ; j < amt-1; j++) {
					// console.log(keys[i]);
					if(keys[i]=='end')
						tempParams[keys[i]].push(-1);
					else
						tempParams[keys[i]].push(tempParams[keys[i]][tempParams[keys[i]].length-1]);
				}
			}
		}
		
		return tempParams;
	};

	TREE.prototype._generateDefaultParams = function(amt){

		//helper function for generate

		var params = {
			joints:[],
			divs:[],
			start:[],
			angles:[],
			length:[],
			rads:[],
			width:[],
			end:[],
		};

		for (var i = 0; i < amt; i++) {

			params.joints.push(5);
			params.divs.push(1);
			params.start.push(0);
			params.angles.push(1);
			params.length.push(5);
			params.rads.push(2);
			params.width.push(1);
			params.end.push(-1);

			if(i===0){
				params.rads[0] = 1;
				params.angles[0] = 0;
				params.joints[0] = 10;
			}
		}

		return params;

	};
	
	return TREE;

});
