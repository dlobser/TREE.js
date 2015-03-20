// requirejs.config({
//     // "baseUrl": "../../src",
//     "paths": {
//       // "app": "./src",
//       "THREE" : "../deps/three",
//     },
//     "shim": {
//       "THREE" : {
// 			 exports : "THREE"
// 		  },
//     }
// });

// Load the main app module to start the app

define([

    'core',
    'objects/Params',
    'objects/Branch',
    'objects/Joint',
    'utility/BuildUtil',
    'utility/FindAndReport',
    'utility/Utils',
    'utility/Modify',
    'utility/Model',
    'utility/Boolean',
    'utility/threeExtension',

    

], function (TREE) {

    'use strict';
    window.TREE = TREE;
    return TREE;

});