define( function () {

	var TREE = require('core');

	TREE.Joint = function(params){

		//Each joint looks like this:
		//Joint(Object3D).children[0]=rotator(Object3D)
		//Joint(Object3D).children[0].children[0]=ballGeo(Mesh)
		//Joint(Object3D).children[0].children[0].children[0]=ballGeo(Mesh)
		//Joint(Object3D).children[0].children[1]=scalar(Object3D)
		//Joint(Object3D).children[0].children[1].children[0]=jointGeo(Mesh)
		//Joint(Object3D).children[0].children[2]=Joint(Object3D) (the next joint, if there is one)

		THREE.Object3D.call(this);

		this.params = params;
		this.limbs = [];
		this.parts = [];
		this.nameArray = [];

	};

	TREE.Joint.prototype = Object.create(THREE.Object3D.prototype);

	TREE.Joint.prototype._construct = function(height){

		var p = this.params;

		this.ballMesh =  new THREE.Mesh( p.ballGeo, p.material );
		this.ballMesh2 = new THREE.Mesh( p.ballGeo, p.material );
		this.jointMesh = new THREE.Mesh( p.jointGeo, p.material );

		this.ballMesh.scale = new THREE.Vector3(p.jointScale.x,p.jointScale.x,p.jointScale.x);

		this.jointMesh.position.y = 0.5;

		this.scalar = new THREE.Object3D();
		this.rotator = new THREE.Object3D();

		this.scalar.add(this.jointMesh);
		this.scalar.scale = p.jointScale;

		this.rotator.add(this.ballMesh);
		this.ballMesh2.position.y = p.jointScale.y/p.jointScale.x;
		this.ballMesh.add(this.ballMesh2);

		this.rotator.add(this.scalar);

		this.add(this.rotator);
		var offset = p.jointScale.y;

		if(height!==undefined)
			offset = height;

		this.position.y = offset;

	};


	return TREE;

});