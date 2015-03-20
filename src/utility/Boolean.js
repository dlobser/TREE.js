define(function(){

	var TREE = require('core');

	TREE.prototype.prepGeo = function(a,b){
		var geo = [];
		geo[0] = a.geometry.clone();
		geo[1] = b.geometry.clone();
		b.updateMatrixWorld();
		a.updateMatrixWorld();
		for(var j = 0 ; j < 2 ; j++){
			var g = geo[j];
			for(var i = 0 ; i < g.vertices.length ; i++){
				if(j===0)
					g.vertices[i].applyMatrix4(a.matrixWorld);
				else
					g.vertices[i].applyMatrix4(b.matrixWorld);
			}
		}
		var csGeo = [];
		csGeo[0] = THREE.CSG.toCSG(geo[0]);
		csGeo[1] = THREE.CSG.toCSG(geo[1]);
		return csGeo;
	};

	TREE.prototype.union = function(a,b){
		var csGeo = this.prepGeo(a,b);
		var res = csGeo[0].union(csGeo[1]);
		var geometryThree  = THREE.CSG.fromCSG(res);
		var mesh = new THREE.Mesh(geometryThree,a.material);
		return geometryThree;
	};

	TREE.prototype.subtract = function(a,b){
		var csGeo = this.prepGeo(a,b);
		var res = csGeo[0].subtract(csGeo[1]);
		var geometryThree  = THREE.CSG.fromCSG(res);
		var mesh = new THREE.Mesh(geometryThree,a.material);
		return geometryThree;
	};

	TREE.prototype.intersect = function(a,b){
		var csGeo = this.prepGeo(a,b);
		var res = csGeo[0].intersect(csGeo[1]);
		var geometryThree  = THREE.CSG.fromCSG(res);
		var mesh = new THREE.Mesh(geometryThree,a.material);
		return geometryThree;
	};

	TREE.prototype.booleanArray = function(arr,type){

		//perform operation on an array of objects

	};
	
	return TREE;

});
