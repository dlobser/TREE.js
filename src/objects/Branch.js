define( function () {

	var TREE = require('core');
		
	TREE.prototype.branch = function(amt,obj,params){

		//Create one branch, a collection of parented joints

		var p = this.params;

		var parent = obj || this;
		var amount = amt || p.num;

		var joint = new TREE.Joint(parent.params);

		if(!parent.offset)
			parent.offset=0;
		if(!parent.joint)
			parent.joint=0;

		var offsetOffset = parent!==undefined ? parent.offset + parent.limbs.length : 0;
		joint.offset = parent.joint+offsetOffset || 0;
		joint.offset2 = offsetOffset;

		joint.joint = 0;
		joint.joints = amount-1;
		joint.parentJoint = parent;
		joint.name = Math.floor(Math.random()*1e9);
		parent.limbs.push(joint);

		if(params){
			keys = (Object.keys(params));
			for(i = 0 ; i < keys.length ; i++){
				joint.params[keys[i]] = params[keys[i]];
			}
		}

		if(parent!=this){
			joint._construct(parent.params.jointScale.y);
			parent.rotator.add(this.recursiveAdd(amount, 1, joint));
		}
		else{
			joint._construct(0);
			parent.add(this.recursiveAdd(amount, 1, joint));
		}

		return joint;
	};

	TREE.prototype.recursiveAdd = function(amt,counter,obj){

		//helper function for branch
		
		var joint = new TREE.Joint(obj.params);
		joint.offset = obj.offset;
		joint.offset2 = obj.offset2;
		joint.parentJoint = obj.parentJoint;
		joint.name = obj.name;
		joint._construct();
		joint.joint = counter;
		obj.childJoint = joint;
		
		if(amt>1)
			obj.rotator.add(joint);

		amt--;
		counter++;

		if(amt>0){
			this.recursiveAdd(amt,counter++,joint);
		}

		return obj;
	};

	TREE.prototype.generate = function(genome, Parent){

		//e.g. genome = {joints:[15,3,2],divs:[2,3,1],angles:[.78,.05,.03],rads:[2,1,1]}

		var parent = Parent || this;

		var g = this._generateFixedParams(genome);

		var tempRoot = new TREE.Joint(this.params);
		tempRoot._construct();
		tempRoot.name = "0";

		for (var i = 0; i < g.rads[0]; i++) {

			//for offsetting
			var altLength = tempRoot.params.jointScale.clone();
			altLength.y = g.length[0];
			altLength.x = altLength.z = g.width[0];
			var root = this.branch(g.joints[0],tempRoot,{jointScale:altLength});
			root.position.y = 0;
			root.rotator.rotation.z = g.angles[0];
			root.rotator.rotation.y = i * ((2*Math.PI)/g.rads[0]);
			this.recursiveBranch(g,1,root);
			parent.add(root);
			parent.limbs.push(root);
		}

		this.makeDictionary();
	};

	TREE.prototype.recursiveBranch = function(genome,counter,joint){

		//helper for generate
		
		var g = genome;
		var end = g.end[counter];

		if(end==-1)
			end = joint.joints+1;

		var newBranch,kidJoint;

		//loop through all the joints in the current branch
		for (var i = g.start[counter]; i < end; i+=g.divs[counter]) {
		
			//loop through the 'rads' - the number of branches from each joint
			for (var j = 0; j < g.rads[counter]; j++) {

				kidJoint = this.findJointOnBranch(joint,i);
				var altLength = kidJoint.params.jointScale.clone();
				altLength.y = g.length[counter];

				altLength.x = altLength.z = g.width[counter];

				newBranch = this.branch(g.joints[counter],kidJoint,{jointScale:altLength});

				newBranch.rotator.rotation.z = g.angles[counter];
				newBranch.rotator.rotation.y = j * ((2*Math.PI)/g.rads[counter]);
			}
			if(counter<g.joints.length){
				for (var k = 0; k < kidJoint.limbs.length; k++) {
					this.recursiveBranch(genome,counter+1,kidJoint.limbs[k]);
				}
			}
		}
	};

	return TREE;

});