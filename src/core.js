define(function (require) {

	/**
	 * TREE is a hierarchical modeling tool
	 * @author David Lobser
	 * @version  .001
	 * @class _TREE
	 */

	
	var TREE = function(params){

		THREE.Object3D.call(this);

		this.limbs = [];
		this.name = 0;
		this.nameArray = [];
		this.parts = [];

		this.defaultParams();
		this.makeUtils();

		this.self = this;

		// this.metaBalls.treeParent = this;

	};

	TREE.prototype = Object.create(THREE.Object3D.prototype);

    return TREE;

});
