define(function(){

	var TREE = require('core');

	TREE.prototype.tubes = function(arr,args){

		//takes a 2 dimensional array of vector3
		//use this.worldPositionsArray(tree.report()) to make such an array
		/*
			args: {
			lengSeths:divs between ctrl points,
			widthSegs:radial segments,
			minWidth:minimum width,
			width:radius,
			func:function(t){return value of function gets applied as radius, t is distance along spline}}
		*/

		if(!args) args = {};

		var width = args.width || 1;
		var minWidth = args.minWidth || 0;
		var seg = args.lengthSegs || 1;
		var wseg = args.widthSegs || 6;
		var func = args.func || function(t){return 0;};

		var geoObj = new THREE.Object3D();
		
		for(var i = 0 ; i < arr.length ; i++){

			//Building a duplicate curve to offset curve parameterization issue

			var dataCurveArray = [];
			var addX = 0;

			for (var j = 0; j < arr[i].length; j++) {
				var vecW = arr[i][j].w || 1;
				var worldWide = vecW + func(j,arr[i].length);
				addX+=vecW;
				if(worldWide<minWidth)
					worldWide=minWidth;
				dataCurveArray.push(new THREE.Vector3(worldWide,addX,0));
			}

			var dataCurve = new THREE.SplineCurve3(dataCurveArray);
			var curve = new THREE.SplineCurve3(arr[i]);
			curve.data = arr[i];
			curve.dataCurve = dataCurve;
			var geo = new THREE.TubeGeometry2(curve, arr[i].length * seg , width, wseg);
			var tube = new THREE.Mesh(geo,this.params.material);
			geoObj.add(tube);
			this.params.tubeGeo.push(tube);


		}

		return geoObj;
	};

	TREE.prototype.averagePoints = function(arr,amt){

		//A single array of vectors to be averaged

		amount = amt || 0.5;

		for (var i = 1; i < arr.length-1; i++) {

			now = arr[i];
			prev = arr[i-1];
			next = arr[i+1];

			var lerped = prev.clone();
			lerped.lerp(next,0.5);

			now.lerp(lerped,amount);

		}
	};


	TREE.prototype.averageVertices = function(geo,iterations){

		//averages the vertices of a geometry

		var amount = 0.5;
		var iter = iterations || 1;

		this.makeNeighbors = function(geo){

			this.faceTable = {};

			for(var i = 0 ; i < geo.faces.length ; i++){

				var sf = geo.faces[i];
				this.faceTable[sf.b+","+sf.a]=true;
				this.faceTable[sf.c+","+sf.b]=true;
				this.faceTable[sf.a+","+sf.c]=true;

			}

			for (var i = 0; i < geo.vertices.length; i++) {

				var vert = geo.vertices[i];

				if(vert.neighbors===undefined)
					vert.neighbors = [];

				for (var j = 0; j < geo.vertices.length; j++) {
					if(this.faceTable[i+","+j]||this.faceTable[j+","+i])
						if(!this.checkDupNeighbors(vert,geo.vertices[j]))
							vert.neighbors.push(geo.vertices[j]);
				}
			}
		};

		this.checkDupNeighbors = function(vert,vCheck){
			var q = false;
			for(var i = 0 ; i < vert.neighbors.length ; i++){
				if(vert.neighbors[i].equals(vCheck)){
					q=true;
					i=vert.neighbors.length;
				}
			}
			return q;
		};

		this.makeNeighbors(geo);

		for(var k = 0 ; k < iter ; k++){

			for (var i = 0; i < geo.vertices.length; i++) {

				if(geo.vertices[i].neighbors.length>0){

					var avg = [];

					for(var j = 0 ; j < geo.vertices[i].neighbors.length ; j++){
						avg.push(geo.vertices[i].neighbors[j].clone())
					}

					var avgVec = new THREE.Vector3();

					for(j = 0 ; j < avg.length ; j++){

						avgVec.x+=avg[j].x;
						avgVec.y+=avg[j].y;
						avgVec.z+=avg[j].z;

					}

					avgVec.x/=geo.vertices[i].neighbors.length;
					avgVec.y/=geo.vertices[i].neighbors.length;
					avgVec.z/=geo.vertices[i].neighbors.length;
					geo.vertices[i].avgVec = avgVec;

				}
				else
					console.warn('geometry requires neighbors');
			}
			for (var i = 0; i < geo.vertices.length; i++) {

				if(geo.vertices[i].avgVec)
					geo.vertices[i].lerp(geo.vertices[i].avgVec,amount);

				geo.verticesNeedUpdate = true;

			}
		}

		geo.computeFaceNormals();
		geo.computeVertexNormals();
	};

	TREE.prototype.removeZeroLength = function(arr,Min){

		var min = Min || 0.0001;

		var newArr = [];

		for (var i = 0; i < arr.length; i++) {

			var temp = [];

			for(var j = 1 ; j < arr[i].length ; j++){
				now = arr[i][j];
				prev = arr[i][j-1];

				if(j==1)
					temp.push(arr[i][j-1]);

				var checker = new THREE.Vector3(prev.x-now.x,prev.y-now.y,prev.z-now.z);

				if(!(checker.length() < min)){
					temp.push(now);
				}
			}

			if(temp.length>1){
				newArr.push(temp);
			}
		}

		return newArr;
	};

	TREE.prototype.crossHatch = function(arr,divsx,divsy){

		//returns a 2 dimensional array which define lattitude and logitude lines
		//based on a 2 dimensional array input which defines lattitude lines
		//ie - the result of tree.worldPositionsArray(tree.report());

		divsX = divsx || arr.length;
		divsY = divsy || divsX;

		//create Y curves (to the original X)
		//create a new set of interpolated X curves based on those

		var curvesX = [];
		var curvesY = [];
		var curvesX2 = [];
		var curvesY2 = [];
		var pointsY = [];
		var pointsX = [];

		for (var i = 0; i < arr.length; i++) {
			curvesX.push(new THREE.SplineCurve3(arr[i]));
		}
		for (var i = 0; i <= divsX; i++) {
			var tempPoints = [];
			for(var j = 0 ; j < curvesX.length ; j++){
				tempPoints.push(curvesX[j].getPointAt(i/divsX));
			}
			pointsY.push(tempPoints);
		};

		for (var i = 0; i < pointsY.length; i++) {
			curvesY.push(new THREE.SplineCurve3(pointsY[i]));
		}

		for (var i = 0; i <= divsY; i++) {
			var tempPoints = [];
			for(var j = 0 ; j < curvesY.length ; j++){
				tempPoints.push(curvesY[j].getPointAt(i/divsY));
			}
			pointsX.push(tempPoints);
		};

		for (var i = 0; i < pointsY.length; i++) {
			var temp = [];
			for (var j = 0; j < pointsY[i].length; j++) {
				temp.push(pointsY[i][j]);
			};
			this.averagePoints(temp);
			curvesY2.push(temp);
		}

		for (var i = 0; i < pointsX.length; i++) {
			var temp = [];
			for (var j = 0; j < pointsX[i].length; j++) {
				temp.push(pointsX[i][j]);
			};
			this.averagePoints(temp);
			curvesX2.push(temp);
		}

		var XY = [];

		XY.push(curvesY2);
		XY.push(curvesX2);

		return XY;
	};

	TREE.prototype.mergeMeshes = function(obj){

		//take an array of geo and merge it
		
		var arr = [];

		obj.traverse(function(t){
			if(t.geometry){
				arr.push(t);
			}
		})

		var geo = new THREE.Geometry();

		for (var i = 0; i < arr.length; i++) {
			arr[i].parent.updateMatrixWorld();
			var temp = arr[i].clone();
			temp.applyMatrix(arr[i].parent.matrixWorld);
			THREE.GeometryUtils.merge(geo,temp);
		};

		return geo;
	};

	TREE.prototype.animateTubes = function(w,scene){

		// Rebuilds tube geometry and deletes the old geo

		while(this.params.tubeGeo.length>0) {

			var obj = this.params.tubeGeo.pop();
			obj.parent.remove(obj);
			obj.geometry.dispose();
			obj = null;
			
		}

		this.params.tubeGeo=[];
		scene.add(this.makeTubes(w));
	};

	TREE.prototype.makeTubes = function(args){

		return this.tubes(this.worldPositionsArray(this.report()),args);
	};

	TREE.prototype.openSurface = function(points){

		//points is a 2 dimensional array of vectors
		//generate a parametric surface where each vertex is the position of each joint

		function makeSheet(u,v){
			var c = points;

			var tempU = Math.round(u*(c.length));
			var tempV = Math.round(v*(c[0].length));
			
			if(u*(c.length)>c.length-1){
				tempU = c.length-1;
			}
			if(v*(c[0].length)>c[0].length-1){
				tempV = c[0].length-1;
			}

			return(c[tempU][tempV]);
		}

		var geo = new THREE.ParametricGeometry( makeSheet, points.length, points[0].length );

		geo.computeVertexNormals();

		return geo;
	};

	TREE.prototype.solidify = function(geo,offset,w,h){

		//works with parametric geometry
		//extrudes along the normals and stitches the edges

		var width = w || 10;
		var height = h || 10;

		var vertsize = geo.vertices.length;
		var facesize = geo.faces.length;

		var tempVerts = [];
		var tempFaces = [];

		for (var i = 0; i < vertsize; i++) {
			geo.vertices.push(geo.vertices[i].clone());
		}
		for (var i = 0; i < facesize; i++) {
			geo.faces.push(geo.faces[i].clone());
		}
		for (var i = facesize; i < geo.faces.length; i++) {

			geo.faces[i].a = geo.faces[i].a + vertsize;
			geo.faces[i].b = geo.faces[i].b + vertsize;
			geo.faces[i].c = geo.faces[i].c + vertsize;

			if(geo.vertices[geo.faces[i].a].off!=true){
				geo.vertices[geo.faces[i].a].sub(geo.faces[i].normal.multiplyScalar(offset));
				geo.vertices[geo.faces[i].a].off=true;
			}
			if(geo.vertices[geo.faces[i].b].off!=true){
				if(i==facesize)//don't know why I have to do this - looks messy
					geo.vertices[geo.faces[i].b].sub(geo.faces[i].normal.multiplyScalar(offset/offset));
				else
				geo.vertices[geo.faces[i].b].sub(geo.faces[i].normal.multiplyScalar(offset));
				geo.vertices[geo.faces[i].b].off=true;
			}	
			if(geo.vertices[geo.faces[i].c].off!=true){
				if(i==facesize)
					geo.vertices[geo.faces[i].c].sub(geo.faces[i].normal.multiplyScalar(offset/offset));
				else
				geo.vertices[geo.faces[i].c].sub(geo.faces[i].normal.multiplyScalar(offset));
				geo.vertices[geo.faces[i].c].off=true;
			
			}
				
			
		}

		for (var i = 0; i < (geo.vertices.length); i++) {

			if(i<width-1){

				var a = i;
				var b = i+1;
				var c = i+vertsize;
				var d = i+1+vertsize;
				geo.faces.push(new THREE.Face3(a,b,c));
				geo.faces.push(new THREE.Face3(d,c,b));

				// var a = i+((width*height)-width);
				// var b = i+1+((width*height)-width);
				// var c = i+vertsize+((width*height)-width);
				// var d = i+1+vertsize+((width*height)-width);
				// geo.faces.push(new THREE.Face3(a,b,c));
				// geo.faces.push(new THREE.Face3(d,c,b));

			}
			if(i<height-1){

				var a = i*(width+1);
				var b = (i+1)*(width+1);
				var c = (i*(width+1))+vertsize;
				var d = (i*(width+1))+(width+1)+vertsize;
				geo.faces.push(new THREE.Face3(c,b,a));
				geo.faces.push(new THREE.Face3(b,c,d));

				// var a = width-1+(i*width);
				// var b = width-1+((i+1)*width);
				// var c = width-1+((i*width)+vertsize);
				// var d = width-1+((i*width)+width+vertsize);
				// geo.faces.push(new THREE.Face3(a,b,c));
				// geo.faces.push(new THREE.Face3(d,c,b));
			
			}
		};
	};

	TREE.prototype.solidSurface = function(points,offset){

		var w = points.length;
		var h = points[0].length;
		var off = offset || 1;

		var geometry;
		geometry = this.openSurface(points);
		this.solidify(geometry,off,w,h);

		geometry.mergeVertices();
		geometry.computeFaceNormals();
		geometry.computeVertexNormals();

		var mesh = new THREE.Mesh(geometry,new THREE.MeshLambertMaterial({side:THREE.DoubleSide}))

		return mesh;
	};

	TREE.prototype.wrapGeo = function(geoToProject,collisionSurface){

		//projects a mesh (on the outside) onto the faces of an object on the inside
		//requires that the outer mesh totally surrounds the inner mesh
		
		//geoToProject is geometry
		//collisionSurface is a Mesh
	
		var geo = geoToProject;
		var obj = collisionSurface;

		for(var i = 0 ; i < geo.faces.length ; i++){
			for(var q = 0 ; q < 3 ; q++){
				if(q===0)
				var v = geo.vertices[geo.faces[i].a];
				else if(q===1)
					var v = geo.vertices[geo.faces[i].b];
				else 
					var v = geo.vertices[geo.faces[i].c];
				var n = geo.faces[i].vertexNormals[q];
				n.multiplyScalar(-1);
				var p = new THREE.Raycaster(v,n);
				var d = p.intersectObject(obj);
				if(d.length>0){
					var p =d[0].point;
					v.x = p.x;
					v.y = p.y;
					v.z = p.z;
					geo.verticesNeedUpdate=true;
				}
			}
		}
		geo.mergeVertices();
		geo.computeFaceNormals();
		geo.computeVertexNormals();
		return new THREE.Mesh(geo,obj.material);
	};

	TREE.prototype.splitShells = function(obj){

		this.geo = obj.geometry.clone();

		this.selected = [];

		this.objFaceTable = [];

		for(var i = 0 ; i < this.geo.faces.length ; i++){
			this.objFaceTable[i]=[];
			this.objFaceTable[i].a = this.geo.faces[i].a;
			this.objFaceTable[i].b = this.geo.faces[i].b;
			this.objFaceTable[i].c = this.geo.faces[i].c;

		}

		this.fillSelect = function(FaceNum,count){

			if(FaceNum===undefined){
				var faceNum = this.findUnvisited();
			}
			else
				var faceNum = FaceNum;

			if(count===undefined)
				var count=0;

			var sf = this.geo.faces[faceNum];
			sf.visited = true;

			this.faceTable[sf.b+","+sf.a]=true;
			this.faceTable[sf.c+","+sf.b]=true;
			this.faceTable[sf.a+","+sf.c]=true;

			var q = 0;

			this.selected[this.selected.length-1].push(sf);

			for(var i = 0 ; i < this.geo.faces.length ; i++){

				if(!this.geo.faces[i].visited){
					var f = this.geo.faces[i];
					if(
						this.faceTable[f.a+","+f.b]||
						this.faceTable[f.b+","+f.c]||
						this.faceTable[f.c+","+f.a]
						)
					{
						f.visited = true;
						this.faceTable[f.b+","+f.a]=true;
						this.faceTable[f.c+","+f.b]=true;
						this.faceTable[f.a+","+f.c]=true;

						this.selected[this.selected.length-1].push(f);
						
						if(count<12)
							this.fillSelect(i,++count);
						
					}
				}
			}
		};

		this.findUnvisited = function(){

			var r = -1;

			for(var i = 0 ; i < this.geo.faces.length ; i++){
				if(!this.geo.faces[i].visited){
					r=i;
					i=this.geo.faces.length;
				}
			}

			return r;

		};

		this.removeVisited = function(){

			var newFaces = [];

			for (var i = 0; i < this.geo.faces.length; i++) {
				if(!this.geo.faces[i].visited)
					newFaces.push(this.geo.faces[i]);
			}

			return newFaces;
		};

		while(this.findUnvisited(this.geo)>-1){
			this.faceTable = [];
			this.geo.faces = this.removeVisited();
			this.selected.push([]);
			this.fillSelect();
		}

		var bb = this.selected;

		var returnObj = new THREE.Object3D();

		for(var i = 0 ; i < bb.length ; i++){
			var geo = new THREE.Geometry();
			for(var j = 0 ; j < bb[i].length ; j++){
				geo.vertices.push(obj.geometry.vertices[bb[i][j].a]);
				geo.vertices.push(obj.geometry.vertices[bb[i][j].b]);
				geo.vertices.push(obj.geometry.vertices[bb[i][j].c]);
				geo.faces.push(new THREE.Face3());
				geo.faces[geo.faces.length-1].a = geo.vertices.length-3;
				geo.faces[geo.faces.length-1].b = geo.vertices.length-2;
				geo.faces[geo.faces.length-1].c = geo.vertices.length-1;
			}
			geo.mergeVertices();
			geo.computeFaceNormals();
			geo.computeVertexNormals();
			returnObj.add(new THREE.Mesh(geo,obj.material));
		}

		return returnObj;
	};

	TREE.prototype.easyBalls = function(args){

		if(!args) args = {};

		var array = args.array || [];
		var size = args.size || 100;
		var res = args.resolution || 100;
		var ballSize = args.ballSize || 1;
		var animated = args.animated ? true:false;	

		var balls = this.metaBalls.init();
		this.metaBalls.effect.animate=animated;
		this.metaBalls.setSize(size);
		this.metaBalls.setResolution(res);
		this.metaBalls.ballSize = ballSize;

		if(!animated){
			this.metaBalls.updateBalls(array);
			return this.metaBalls.generateGeo();
		}
		else
			return balls;
	};

	TREE.prototype.metaBalls = {

		/*
			setup:
				bls = tree.metaBalls.init();
				tree.metaBalls.effect.animate=true;
				tree.metaBalls.setSize(60);
				tree.metaBalls.setResolution(70);
				tree.metaBalls.ballSize = 5.25;
				tree.metaBalls.updateBalls();
				scene.add(bls);
			draw:
				tree.metaBalls.updateBalls();

		 */

		holder:new THREE.Object3D(),
		resolution:100,
		size:500,
		effect:0,
		box:0,
		ballSize:1,

		init:function(){

			if(this.holder.children.length>0){
				for (var i = 0; i < this.holder.children.length; i++) {
					this.holder.remove(this.holder.children[0]);
				}
			}
			this.effect = new THREE.MarchingCubes( this.resolution, new THREE.MeshLambertMaterial({color:0xffffff}),true,true );
			this.effect.scale.set(this.size,this.size,this.size);
			this.box = new THREE.Mesh(new THREE.BoxGeometry(1,1,1),new THREE.MeshLambertMaterial({color:0xffffff,transparent:true,opacity:.2})),

			this.box.scale.set(this.size*2,this.size*2,this.size*2);

			this.holder.add(this.effect);

			return this.holder;
		},

		showBox:function(){
			this.holder.add(this.box);
		},

		hideBox:function(){
			this.holder.remove(this.box);
		},

		setSize:function(val){
			this.size = val;
			var size = this.size;
			this.effect.scale.set( size,size,size );
			this.box.scale.set(size*2,size*2,size*2);
		},

		setResolution:function(val){
			this.resolution = val;
			this.init();
		},

		updateBalls:function(arr) {

			var balls,ballArr,flatArray;


			if(arr==undefined){

				var report = this.treeParent.report();
				ballArr = this.treeParent.worldPositionsArray(report);

				flatArray = [];

				for (var i = 0; i < ballArr.length; i++) {
					for (var j = 0; j < ballArr[i].length; j++) {
						flatArray.push(ballArr[i][j]);
					}
				}
			}

			var balls = arr || flatArray;

			this.effect.reset();

			// fill the field with some metaballs

			var i, ballx, bally, ballz, subtract, strength;

			subtract = 10;
			strength = this.ballSize*.005;

			for ( var i = 0; i < balls.length; i ++ ) {
				ballx = (((balls[i].x+this.size)*  (1/this.size/2))); 
				bally = (((balls[i].y+this.size)*  (1/this.size/2)));
				ballz = (((balls[i].z+this.size)*  (1/this.size/2)));

				this.effect.addBall(ballx, bally, ballz, strength, subtract);
			}


		},

		generateGeo:function(){

			var geo = this.effect.generateGeometry();
			geo.verticesNeedUpdate = true;

			for ( var i = 0; i < geo.vertices.length; i ++ ) {

				(geo.vertices[i].x*=this.size) + (this.size/2); 
				(geo.vertices[i].y*=this.size) + (this.size/2);
				(geo.vertices[i].z*=this.size) + (this.size/2);
			}

			geo.mergeVertices();

			var obj = new THREE.Mesh(geo,new THREE.MeshLambertMaterial());

			return obj;
		}
	};
	
	return TREE;

});
