import * as THREE from 'three';

import Stats from 'three/addons/libs/stats.module.js';

import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';

import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { DRACOLoader } from 'three/addons/loaders/DRACOLoader.js';

let mixer;

const clock = new THREE.Clock();
const container = document.getElementById( 'threedcontainer' );

const stats = new Stats();
container.appendChild( stats.dom );

const renderer = new THREE.WebGLRenderer( { antialias: true } );
renderer.setPixelRatio( window.devicePixelRatio );
renderer.setSize( window.innerWidth, window.innerHeight );
container.appendChild( renderer.domElement );

const pmremGenerator = new THREE.PMREMGenerator( renderer );

const scene = new THREE.Scene();
scene.background = new THREE.Color( 0xbfe3dd );
scene.environment = pmremGenerator.fromScene( new RoomEnvironment( renderer ), 0.04 ).texture;

const camera = new THREE.PerspectiveCamera( 40, window.innerWidth / window.innerHeight, 1, 100 );
camera.position.set( 5, 2, 8 );

const controls = new OrbitControls( camera, renderer.domElement );
controls.target.set( 0, 0.5, 0 );
controls.update();
controls.enablePan = false;
controls.enableDamping = true;

const dracoLoader = new DRACOLoader();
dracoLoader.setDecoderPath( 'jsm/libs/draco/gltf/' );

const loader = new GLTFLoader();
loader.setDRACOLoader( dracoLoader );
let filename = localStorage.getItem("threedfilename");
if ( filename !== null && filename.length > 0) {
    load(filename);
}

function load(filename) {
    loader.load(filename, function ( gltf ) {

        const model = gltf.scene;
        var bbox = new THREE.Box3().setFromObject(model);
        var cent = bbox.getCenter(new THREE.Vector3());
        var size = bbox.getSize(new THREE.Vector3());
        //Rescale the object to normalized space
        var maxAxis = Math.max(size.x, size.y, size.z);
        model.scale.multiplyScalar(5.0 / maxAxis);
        bbox.setFromObject(model);
        bbox.getCenter(cent);
        size = bbox.getSize(size);
        console.log("x: %d y: %d z: %d", size.x, size.y, size.z);
        //Reposition to 0,halfY,0
        // model.position.copy(cent).multiplyScalar(-1);
        // model.position.y-= (size.y * 0.5);
        model.position.set( 1, 1, 0 );
        //model.scale.set( 0.01, 0.01, 0.01 );
        scene.add( model );
    
        mixer = new THREE.AnimationMixer( model );
        gltf.animations.forEach ((animation, index) =>
        {
            console.log("animation index: %d", index);
            mixer.clipAction(animation).play();
        });
        //mixer.clipAction( gltf.animations[ 0 ] ).play();
    
        animate();
    
    }, undefined, function ( e ) {
    
        console.error( e );
    
    } );
};

window.onresize = function () {

    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();

    renderer.setSize( window.innerWidth, window.innerHeight );

};


function animate() {

    requestAnimationFrame( animate );

    const delta = clock.getDelta();

    mixer.update( delta );

    controls.update();

    stats.update();

    renderer.render( scene, camera );
}
