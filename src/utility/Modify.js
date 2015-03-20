define(function(){

	var TREE = require('core');

	TREE.prototype.passFunc = function (array,func,GPU){

		var accelerated = GPU || false;
		
		for (var i = 0; i < array.length; i+=2) {
			for (var j = 0; j < array[i].length; j++) {
				var process = this.makeList(array[i][j]);
				for (var k = 0; k < process.length; k++) {
					if(accelerated){
						array[i+1].GPU = true;
						
						if(process[k].name === undefined)
							this.arrayStringName(process);

						func(this.boneDictionary[process[k].name],array[i+1]);
					}
					else{
						this.Move(process[k],func,array[i+1]);
					}
				}
			}
		}
	};

	TREE.prototype.applyFunc = function (array,func,GPU){

		//same as passFunc but modified for new organization

		var accelerated = GPU || false;

		for (var i = 0; i < array.length; i+=2) {
			for (var j = 0; j < array[i].length; j++) {

				if(accelerated)
					array[i+1].GPU = true;
					
				if(array[i][j].name === undefined){
					this.arrayStringName(array[i]);
				}
				
				if(GPU){
					func(this.boneDictionary[array[i][j].name],array[i+1]);
				}
				else{
					func.apply(this,[this.parts[array[i][j].name],array[i+1]]);
				}
			}
		}
	};

	TREE.prototype.setGeo = function(obj,args){

		//swap out the geometry for the specified joint

		var jointGeo = args.jointGeo || obj.params.jointGeo;
		var ballGeo = args.ballGeo || obj.params.ballGeo;
		var ballGeo2 = args.ballGeo2 || ballGeo;

		obj.ballMesh.geometry = ballGeo;
		obj.ballMesh2.geometry = ballGeo2;
		obj.jointMesh.geometry = jointGeo;
	};

	TREE.prototype.aimAt = function(obj,args){

		//aims selected joints at a target in world space
		//ugly solution, runs slowly

		var target = args.target || new THREE.Vector3(0,0,0);
		
		var tempParent = obj.parent;

		THREE.SceneUtils.detach(obj,tempParent,scene); //*ergh

		obj.lookAt(target);
		obj.rotation.y+=Math.PI/2;

		obj.parent.updateMatrixWorld();

		THREE.SceneUtils.attach(obj,scene,tempParent); //*ick
	};

	TREE.prototype.axisRotate = function(obj,args) {

		if(!args) args = {};

		var axis = args.axis || new THREE.Vector3(0,0,1);
		var radians = args.radians || 0;

		var parent;

		if(!obj.parent){
			parent = this;
		}
		else
			parent = obj.parent;

		var tempMatrix = new THREE.Matrix4();
		var inverse = new THREE.Matrix4();
		var multed = new THREE.Matrix4();

		var quat = new THREE.Quaternion();

		inverse.getInverse(parent.matrixWorld);

		tempMatrix.makeRotationAxis(axis, radians);

		multed.multiplyMatrices(inverse,tempMatrix); // r56

		quat.setFromRotationMatrix(multed);

		var rot = new THREE.Vector3(axis.x,axis.y,axis.z);
		
		rot.applyQuaternion(quat);

		obj.quaternion.setFromAxisAngle(rot,radians);

		obj.updateMatrixWorld();
	};

	TREE.prototype.setJointLength = function (obj,args){

		var len = args.length || obj.scalar.scale.y;

		obj.scalar.children[0].scale.y = len/obj.scalar.scale.y;
		obj.scalar.children[0].position.y = len/obj.scalar.scale.y/2;

		for(var i = 2 ; i < obj.rotator.children.length ; i++){
			obj.rotator.children[i].position.y=len;
		}

		obj.ballMesh2.position.y = len;
		obj.childJoint.position.y = len;
	};

	TREE.prototype.setJointWidth = function (obj,args){

		var wid = args.width || obj.scalar.scale.y;

		obj.scalar.scale.x = wid;
		obj.scalar.scale.z = wid;

		obj.ballMesh.scale.x = wid;
		obj.ballMesh.scale.z = wid;
	};

	TREE.prototype.appendObj = function (obj,args){

		//append geometry to selected joint

		if(!args) args = {};

		var appendage = new THREE.Object3D();

		if(args.obj)
			appendage= args.obj.clone();

		var rx,ry,rz,sc,scx,scy,scz,tx,ty,tz;

		sc = args.sc || 1;

		if(args.sc){
			scx = scy = scz = args.sc;
		}
		else{
			scx = args.scx || 1 ;
			scy = args.scy || 1 ;
			scz = args.scz || 1 ;
			
		}
		rx = args.rx || 0 ;
		ry = args.ry || 0 ;
		rz = args.rz || 0 ;
		tx = args.tx || 0 ;
		ty = args.ty || 0 ;
		tz = args.tz || 0 ;

		appendage.position = new THREE.Vector3(tx,ty,tz);
		appendage.rotation = new THREE.Euler(rx,ry,rz);
		appendage.scale = new THREE.Vector3(scx,scy,scz);

		obj.rotator.add(appendage);
		obj.parts.push(appendage);
	};

	TREE.prototype.appendTree = function (args,obj){

		if(typeof obj === 'undefined')
			obj = this;

		var newTree = this.generate(args,obj);

	};

	TREE.prototype.appendBranch = function(obj,args){
		console.warn('deprecated, use appendTree()');
	};

	TREE.prototype.transform = function (obj,args){

		if(obj){

			// console.log(obj);
			var rx,ry,rz,sc,scx,scy,scz,tx,ty,tz,
			off,offMult,freq,
			jOff,jMult,jFreq,
			jFract, jOffset,
			offsetter,offsetter2,offsetter3,offsetter4,
			jointOff,scoff,sjoff,
			nMult,nOff,nFreq,nFract,
			sinScaleMult,sinScale,sinOff,
			offScale,offScaleMult,offScaleOff,
			rotator, nObjOff,
			GPU;


			if(args){
				sc = args.sc || 1;

				if(args.sc){
					scx = scy = scz = args.sc;
				}
				else{
					scx = args.scx || 1 ;
					scy = args.scy || 1 ;
					scz = args.scz || 1 ;
					
				}
				rx = args.rx || 0 ;
				ry = args.ry || 0 ;
				rz = args.rz || 0 ;
				tx = args.tx || 0 ;
				ty = args.ty || 0 ;
				tz = args.tz || 0 ;

				off = args.off || 0;
				offMult = args.offMult || 0;
				freq = args.freq || 0;
				jOff = args.jOff || 0;
				jMult = args.jMult || 0;
				jFreq = args.jFreq || 0;
				jFract = args.jFract * obj.joint || 1;
				nMult = args.nMult || 0;
				nFreq = args.nFreq || 0;
				nObjOff = args.nObjOff || 0;
				nOff = args.nOff  || 1;
				nFract = args.nFract  * obj.joint || 1;
				jOffset = args.jOffset || 0;
				offsetter = args.offsetter || 0;
				offsetter2 = args.offsetter2 || 0;
				offsetter3 = args.offsetter3 || 0;
				offsetter4 = args.offsetter4 || 0;
				sinScale = args.sinScale || 1;
				sinScaleMult = args.sinScaleMult || 1;
				sinOff = args.sinOff || 0;
				offScale = args.offScale || 0;
				offScaleMult = args.offScaleMult || 1;
				offScaleOff = args.offScaleOff || 0;
				rotator = args.rotator || false;


				GPU = args.GPU || false;

			}
			else{

				rx = ry = rz = tx = ty = tz = sinOff = 0;
				sc = scx = scy = scz = freq = jFreq = jFract = offScaleMult = 1;
				off = offMult = jOff = jMult = jOffset = offsetter = offsetter2 = sinScale = sinScaleMult =
				nMult = nFreq = nOff = nFract = offScale = offScaleOff = offsetter4 = nObjOff = 0;
				GPU = rotator = false;
			}
			
			var objOffset = obj.offset;
			var objOffsetter = offsetter;
			
			if(offsetter2){
				objOffset = obj.offset2;
				objOffsetter = offsetter2;
			}
			if(offsetter3){
				objOffset = obj.parentJoint.joint;
				objOffsetter = offsetter3;
			}
			if(offsetter4){
				objOffset = obj.parentJoint.parentJoint.joint;
				objOffsetter = offsetter4;
			}

			if(jMult||jOff||jMult||offMult||offsetter||offsetter2||nMult){

				var off1 = jFract * Math.sin( (jOffset * objOffset) + jOff + ( ( jFreq * obj.joint + 1 ) ) ) * jMult;
				var off2 = Math.sin( off + ( freq * objOffset ) ) * offMult;
				var off3 = objOffset * objOffsetter;
				var off4 = nFract * (noise( nOff + ( nFreq * obj.joint + ((objOffset+1)*nObjOff)) ) * nMult);

				jointOff = off3 + off2 + off1 + off4;

			}
			else
				jointOff = 0;

			if(args.sinScale||args.sinScaleMult){
				scoff = ( Math.sin ( (obj.joint * sinScale) + sinOff ) ) * sinScaleMult;
			}
			else
				scoff = 0;

			if(args.offScale || args.offScaleOff || args.offScaleMult)
				sjoff = ( Math.sin ( (obj.parentJoint.joint * offScale) + offScaleOff ) ) * offScaleMult;
			else
				sjoff = 0;

			scalar = sjoff+scoff;

			if(GPU){
				obj.rotator = obj;
				obj.rotator.rotation = obj._rotation;
			}


			var rotOb = obj.rotator;
			if(rotator)rotOb = obj;


			if(args.rx !== undefined) rotOb.rotation.x=rx+jointOff;
			if(args.ry !== undefined) rotOb.rotation.y=ry+jointOff;
			if(args.rz !== undefined) rotOb.rotation.z=rz+jointOff;
			
			if(args.tx !== undefined)
				obj.rotator.position.x=tx+jointOff;
			if(args.ty !== undefined)
				obj.rotator.position.y=ty+jointOff;
			if(args.tz !== undefined)
				obj.rotator.position.z=tz+jointOff;

			if(args.sc || args.scx || args.scy || args.scz);
				obj.rotator.scale = new THREE.Vector3(scx,scy,scz).addScalar(scalar);

			return obj;
		}
		else
			console.log(obj);
	};

	TREE.prototype.setScale = function (sc){
		this.scale.x = sc;
		this.scale.y = sc;
		this.scale.z = sc;
	};

	TREE.prototype.findTopParent = function(obj){

		var re;

		if(obj.parent.parent)
			re = findTopParent(obj.parent);
		else{
			re=obj;
		}
		return re;
	};
	
	return TREE;

});
