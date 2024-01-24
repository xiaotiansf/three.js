import * as THREE from '../build/three.module.js';

import Stats from './jsm/libs/stats.module.js';

import { OrbitControls } from './jsm/controls/OrbitControls.js';
import { RoomEnvironment } from './jsm/environments/RoomEnvironment.js';

import { GLTFLoader } from './jsm/loaders/GLTFLoader.js';
import { DRACOLoader } from './jsm/loaders/DRACOLoader.js';

export class GlbModel {
    constructor() 
    {
        this.mixer = null;
        this.clock = null;
        this.stats = null;
        this.renderer = null;
        this.pmremGenerator = null;
        this.scene = null;
        this.camera = null;
        this.controls = null;
        this.dracoLoader = null;
        this.loader = null;
        this.container = null;
    }

    Init()
    {
        this.clock = new THREE.Clock();
        this.container = document.getElementById( 'threedcontainer' );

        this.stats = new Stats();
        this.container.appendChild( this.stats.dom );

        this.renderer = new THREE.WebGLRenderer( { antialias: true } );
        this.renderer.setPixelRatio( window.devicePixelRatio );
        this.renderer.setSize( window.innerWidth, window.innerHeight );
        this.container.appendChild( this.renderer.domElement );

        this.pmremGenerator = new THREE.PMREMGenerator( this.renderer );

        this.scene = new THREE.Scene();
        this.scene.background = new THREE.Color( 0xbfe3dd );
        this.scene.environment = this.pmremGenerator.fromScene( new RoomEnvironment( this.renderer ), 0.04 ).texture;

        this.camera = new THREE.PerspectiveCamera( 40, window.innerWidth / window.innerHeight, 1, 100 );
        this.camera.position.set( 5, 2, 8 );

        this.controls = new OrbitControls( this.camera, this.renderer.domElement );
        this.controls.target.set( 0, 0.5, 0 );
        this.controls.update();
        this.controls.enablePan = false;
        this.controls.enableDamping = true;

        this.dracoLoader = new DRACOLoader();
        this.dracoLoader.setDecoderPath( 'jsm/libs/draco/gltf/' );

        this.loader = new GLTFLoader();
        this.loader.setDRACOLoader( this.dracoLoader );

        window.addEventListener('resize', function()
        {
            this.camera.aspect = window.innerWidth / window.innerHeight;
            this.camera.updateProjectionMatrix();
            this.renderer.setSize( window.innrWidth, window.innerHeight );
        });
    }

    animate = () => {

        requestAnimationFrame( this.animate );
    
        const delta = this.clock.getDelta();
    
        this.mixer.update( delta );
    
        this.controls.update();
    
        this.stats.update();
    
        this.renderer.render( this.scene, this.camera );
    }

    load (filename) {
        this.loader.load(filename, gltf => {
            const model = gltf.scene;
            model.position.set( 1, 1, 0 );
            model.scale.set( 0.01, 0.01, 0.01 );
            this.scene.add( model );
        
            this.mixer = new THREE.AnimationMixer( model );
            gltf.animations.forEach ((animation, index) =>
            {
                console.log("animation index: %d", index);
                this.mixer.clipAction(animation).play();
            });
            //mixer.clipAction( gltf.animations[ 0 ] ).play();
        
           this.animate();
        
        }, undefined, function ( e ) {
        
            console.error( e );
        } );
    }

    resize() {
        
    }
}


