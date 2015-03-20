define( function () {

	var TREE = require('core');

	TREE.prototype.defaultParams = function(){

		this.params = {
			name : 0,
			jointScale : new THREE.Vector3(1,1,1),
			ballGeo :  new THREE.SphereGeometry(1,8,6),
			jointGeo : new THREE.CylinderGeometry( 1,1,1,8,1),
			material : new THREE.MeshLambertMaterial(),
			offset : 0,
			scalar : new THREE.Object3D(),
			rotator : new THREE.Object3D(),
			poser : new THREE.Object3D(),
			num : 100,
			tubeGeo : []
		};

	};

	return TREE;
});