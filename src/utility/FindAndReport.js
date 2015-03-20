define(function(){

	var TREE = require('core');

	TREE.prototype.findJointOnBranch = function(obj,num){

		//Return a particular joint on a branch
		//where obj is the root 

		var returner;

		if(obj){

			if(num>obj.joints+1)
				num=obj.joints+1;

			if(num>0){
				num--;
				returner = this.findJointOnBranch(obj.childJoint,num);
			}
			else{
				returner = obj;
			}
		}
		else
			console.warn("missing object");

		return returner;
	};

	TREE.prototype.FIND = function(selector,counter,branch){

		return this.findJoint(selector);

	};

	TREE.prototype.findJoint = function(selector,counter,branch){

		var root = branch || this;
		var count = counter || 0;

		var returner;
		
		//count up through items in selector; an array

		if( count < selector.length-1 ){

			//create an empty array that we'll fill up with the locations
			//of all the joints that have limbs
			var j = [];
			this._findLimbs(root,j);
			
			//make sure we're not going past the end of the array
			
			var c;
			
			if(selector[count] > j.length-1){
				c=j.length-1;
			}
			else
				c=selector[count];

			//use the selected joint for the next recursion
			
			var joint = j[c];
			returner = this.findJoint(selector,count+2,joint.limbs[selector[count+1]]);
		}
		else{
			if( selector[count] == "all" ){
				for (var i = 1; i < root.joints+1; i++) {
					returner = this.findJointOnBranch(root,i);
				}
			}
			else{
				returner = this.findJointOnBranch(root,selector[count]);

			}

		}

		return returner;
	};

	TREE.prototype.Move = function(selector,func,args){

		return func(this.findJoint(selector),args);
	};

	TREE.prototype._findLimbs = function(branch,array){

		//utility function
		//fills an array with a list of the joints that branch from a limb

		var returner;

		if(branch){
			if(branch.limbs){
				if(branch.limbs.length>0){
					array.push(branch);
				}}
				if(branch.childJoint!==undefined && branch.childJoint.name==branch.name){
					returner = this._findLimbs(branch.childJoint,array);
				}
			
			
		}

		return returner;
	};

	TREE.prototype.report = function(array,obj){

		//returns a one dimensional array with all root joints

		var arr = array || [];
		var joint = obj || this;

		for(var j = 0 ; j < joint.limbs.length ; j++){

			arr.push(joint.limbs[j]);

			var jarr = [];
			this._findLimbs(joint.limbs[j],jarr);

			for(var i = 0 ; i < jarr.length ; i++){
				this.report(arr,jarr[i]);
			}
		}

		return arr;
	};

	TREE.prototype.reportLayers = function(array,obj,count){

		//makes a multi dimensional array where the first dimension
		//refers to the depth of the indexed branches

		var arr = array || [];	//the first time through it creates an array
		var joint = obj || this; // and references the 0th joint
		var c = count+1 || 0; // and starts the counter at 0

		var larr =  [];

		for(var j = 0 ; j < joint.limbs.length ; j++){

			larr.push(joint.limbs[j]);

			var jarr = [];
			this._findLimbs(joint.limbs[j],jarr);

			for(var i = 0 ; i < jarr.length ; i++){
				this.reportLayers(arr,jarr[i],c);
			}
		}

		if(!arr[c]){
			arr[c] = [];
			for (var i = 0; i < larr.length; i++) {
				arr[c].push(larr[i]);
			};
		}
		else{
			for (var i = 0; i < larr.length; i++) {
				arr[c].push(larr[i]);
			};
		}

		return arr;
	};

	TREE.prototype.makeDictionary = function(obj,Stack,StackArray,Pusher){

		var joint = obj || this;
		var stack = Stack || [];
		var stackArray = StackArray || [];
		var pusher = Pusher || 0;

		stack.push(pusher);

		for(var i = 0 ; i < joint.limbs.length ; i++){

			stack.push(i);

			var jarr = [];
			this._findLimbs(joint.limbs[i],jarr);

			var tempStack = [];
			var t2 = [];

			for(var k = 0 ; k < stack.length ; k++){
				tempStack[k] = stack[k];
				t2[k] = stack[k];
			}

			stackArray.push(tempStack);

			t2.push("all");
			var t3 = this.makeList(t2);
			var t4 = t3;


			for(var k = 0 ; k < t4.length ; k++){
				var tempString = t4[k].toString();
				var tempJoint = this.findJoint(t4[k]);
				this.parts[tempString] = tempJoint;
				tempJoint.dictionaryName = tempString;
			}

			for(var j = 0 ; j < jarr.length ; j++){
				this.makeDictionary(jarr[j],tempStack,stackArray,j	);
			}

			stack.pop();

		}

		stack.pop();

		return stackArray;
	};

	TREE.prototype.worldPositions = function(obj){

		//returns the world positions of all the joints on a branch

		var arr = [];

		this.updateMatrixWorld();

		for(var i = 0 ; i <= obj.joints ; i++){

			var tempObj1 = this.findJointOnBranch(obj,i);

			tempObj = tempObj1;
			// tempObj1.updateMatrixWorld();
			// tempObj1.updateMatrix();

			if(tempObj1.ballMesh!==undefined)
				var tempObj = tempObj1.ballMesh;

			var vector = new THREE.Vector3();
			vector.setFromMatrixPosition( tempObj.matrixWorld );

			var vecScale = new THREE.Vector3();
			vecScale.setFromMatrixScale( tempObj.matrixWorld );

			var vec4 = new THREE.Vector4(vector.x,vector.y,vector.z,(vecScale.z));

			arr.push(vec4);

			if(i==obj.joints){

				vector.setFromMatrixPosition( tempObj1.ballMesh2.matrixWorld );

				var vec4 = new THREE.Vector4(vector.x,vector.y,vector.z,(vecScale.z));
				
				arr.push(vec4);
			}

		}
		return arr;
	};

	TREE.prototype.worldPositionsArray = function(arr){

		//good for working working with the output of tree.report()
		//which returns a one dimensional array of all joints

		var masterArray = [];

		for(var i = 0 ; i < arr.length ; i++){
			masterArray.push(this.worldPositions(arr[i]));
		}

		return masterArray;
	};

	TREE.prototype.worldPositionsMultiArray = function(arr){

		//best for working with the output of reportLayers()
		//which returns a 2 dimensional array

		var masterArray = [];

		for(var i = 0 ; i < arr.length ; i++){
			var smallArray = [];
			for(var j = 0 ; j < arr[i].length ; j++){
				smallArray.push(this.worldPositions(arr[i][j]));
			}
			masterArray.push(smallArray);
		}

		return masterArray;
	};

	TREE.prototype.makeInfo = function(args){

		var info = [];
		
		for (var i = 0; i < args.length; i+=2) {
			info.push(this.makeList(args[i]));
			info.push(args[i+1]);
		}

		return info;

	};

	/**
	 * Creates an array of individual addresses from an array specifying ranges
	 * [0,0,[0,2]] -> [0,0,0],[0,0,1],[0,0,2]
	 */

	TREE.prototype.makeList = function(range,Stack,StackArray,Index) {

		var stack = Stack || [];
		var stackArray = StackArray || [];
		var index = Index || 0;

		if(index < range.length){

			var i = index;

			if (range[i] instanceof Array && i!=range.length-1) {
				for (var j = range[i][0] ; j <= range[i][1]; j++) {

					stack.push(j);

					var tempStack = [];

					for(var k = 0 ; k < stack.length ; k++){
						tempStack[k] = stack[k];
					}

					this.makeList(range,tempStack,stackArray,i+1);
					stack.pop();

				}
			}

			else if(range[i] == "all" && index%2 === 0 && index!=range.length-1 ||
				range[i] == -1 && index%2 === 0 && index!=range.length-1){

				var tempStack = [];

				for(var k = 0 ; k < stack.length ; k++){
					tempStack[k] = stack[k];
				}

				tempStack.push(0);

				var jarr = [];
				this._findLimbs(this.findJoint(tempStack),jarr);

				for (var j = 0 ; j < jarr.length ; j++){

					stack.push(j);

					var tempStack = [];

					for(var k = 0 ; k < stack.length ; k++){
						tempStack[k] = stack[k];
					}

					this.makeList(range,tempStack,stackArray,i+1);

					stack.pop();

				}

			}

			else if(range[i] == "all" && index%2!==0 && index!==range.length-1 ||
				range[i] == -1 && index%2!==0 && index!=range.length-1){

				var tempStack = [];

				for(var k = 0 ; k < stack.length ; k++){
					tempStack[k] = stack[k];
				}

				var jarr = [];
				this._findLimbs(this.findJoint(tempStack),jarr);
			
				var limbs = jarr[0].limbs;
			
				for (var j = 0 ; j < limbs.length ; j++){

					stack.push(j);

					var tempStack2 = [];

					for(var k = 0 ; k < stack.length ; k++){
						tempStack2[k] = stack[k];
					}

					this.makeList(range,tempStack2,stackArray,i+1);

					stack.pop();
				}

			}

			else if(range[i] == -2 && index==range.length-1 || 
					range[i] == "all" && index==range.length-1 || 
					range[i] == -1 && index==range.length-1 ||
					range[i] == -3 && index==range.length-1){

				var tempStack = [];

				for(var k = 0 ; k < stack.length ; k++){
					tempStack[k] = stack[k];
				}

				tempStack.push(0);

				var joints = this.findJoint(tempStack).joints;

				var min=0;
				var max = joints+1;

				if(range[i]==-2)
					min=1;

				if(range[i]==-3)
					min=max-1;

				for (var j = min ; j < max ; j++){

					stack.push(j);

					var tempStack = [];

					for(var k = 0 ; k < stack.length ; k++){
						tempStack[k] = stack[k];
					}

					this.makeList(range,tempStack,stackArray,i+1);
					stack.pop();
				}

			}
			else if(range[i] instanceof Array && index==range.length-1){
				var tempStack = [];

				for(var k = 0 ; k < stack.length ; k++){
					tempStack[k] = stack[k];
				}

				tempStack.push(0);

				var min = range[i][0];
				var max = range[i][1];

				var joints = this.findJoint(tempStack).joints;

				if(min>joints+1)
					min=joints+1;
				if(max>joints+1)
					max=joints+1;

				for (var j = min ; j <= max ; j++){

					if(range[i]==-2)
						j++;

					stack.push(j);

					var tempStack = [];

					for(var k = 0 ; k < stack.length ; k++){
						tempStack[k] = stack[k];
					}

					this.makeList(range,tempStack,stackArray,i+1);
					stack.pop();
				}
			}
			else{

				stack.push(range[i]);

				var tempStack = [];

				for(var k = 0 ; k < stack.length ; k++){
					tempStack[k] = stack[k];
				}

				this.makeList(range,tempStack,stackArray,i+1);
				stack.pop();
			}

		}
		else{
			stackArray.push(stack);
		}


		return stackArray;
	};

	TREE.prototype.arrayStringName = function (arr){
		for (var i = 0; i < arr.length; i++) {
			arr[i].name = arr[i].toString();
		}
	};


	
	return TREE;

});
