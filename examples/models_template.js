import * as THREE from 'three';

import Stats from 'three/addons/libs/stats.module.js';

import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';

import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { DRACOLoader } from 'three/addons/loaders/DRACOLoader.js';
import { FBXLoader } from 'three/addons/loaders/FBXLoader.js';
import { ColladaLoader } from 'three/addons/loaders/ColladaLoader.js';
import { MTLLoader } from 'three/addons/loaders/MTLLoader.js';
import { OBJLoader } from 'three/addons/loaders/OBJLoader.js';
import { IFCLoader } from 'web-ifc-three';
import { IFCSPACE } from 'web-ifc';

const timeout = 5000;
let retrying = true;
const socket = new WebSocket('ws://127.0.0.1:8080');
// Connect
console.log('Models: Connecting to ws://127.0.0.1:8080...');
MakeConnection();

let mixer, camera, scene, renderer, stats, loader, controls;
let video, videotexture;

const clock = new THREE.Clock();
const container = document.getElementById( 'container' );
stats = new Stats();

scene = new THREE.Scene();

container.appendChild( stats.dom );
render_commons_init();

let modelformat = 'glb';
if (modelformat === 'glb') {
	glbinit();
	videotextureloader();
	glbmodelloader();
}
else if (modelformat === 'fbx') {
	fbxinit();
	fbxmodelloader();
}
else if (modelformat === 'gltf') {
	glbinit();
	gltfmodelloader();
}
else if (modelformat === 'dae') {
	daeinit();
	daemodelloader();
}
else if (modelformat === 'obj') {
	mixer = null;
	objinit();
	objmodelloader();
}
else if (modelformat === 'ifc') {
	ifcinit();
	await ifcmodelloader();
}

//videotextureloader();
//textureLoader();

function textureLoader() {
	// Test Load the background texture
	var textureloader = new THREE.TextureLoader();
	textureloader.load('textures/land_ocean_ice_cloud_2048.jpg' , function(texture) {
		scene.background = texture;
	});
}

function videotextureloader() {
	video = document.getElementById( 'video' );
	video.play();
	video.addEventListener( 'play', function () {
		this.currentTime = 3;
	} );
	videotexture = new THREE.VideoTexture( video );
	videotexture.colorSpace = THREE.SRGBColorSpace;
	scene.background = videotexture;
}

function glbmodelloader() {
  const dracoLoader = new DRACOLoader();
  dracoLoader.setDecoderPath( 'jsm/libs/draco/gltf/' );

  loader = new GLTFLoader();
  loader.setDRACOLoader( dracoLoader );
  glbload('models/gltf/ferrari.glb');
}

function fbxmodelloader() {
  loader = new FBXLoader();
  fbxload('models/fbx/Samba Dancing.fbx');
}

function gltfmodelloader() {
  gltfload('models/gltf/DamagedHelmet/glTF/', 'DamagedHelmet.gltf');
}

function daemodelloader() {
  daeload('./models/collada/stormtrooper/stormtrooper.dae');
}

function objmodelloader() {
  objload('models/obj/male02/', 'male02.mtl', 'male02.obj');
}

async function ifcmodelloader() {
  await ifcload('models/ifc/rac_advanced_sample_project.ifc');
}

function render_commons_init() {
  renderer = new THREE.WebGLRenderer( { antialias: true } );
  renderer.setPixelRatio( window.devicePixelRatio );
  renderer.setSize( window.innerWidth, window.innerHeight );
  container.appendChild( renderer.domElement );
}

function glbinit() {
  
  const pmremGenerator = new THREE.PMREMGenerator( renderer );

  scene.background = new THREE.Color( 0xbfe3dd );
  scene.environment = pmremGenerator.fromScene( new RoomEnvironment( renderer ), 0.04 ).texture;

  camera = new THREE.PerspectiveCamera( 40, window.innerWidth / window.innerHeight, 1, 100 );
  camera.position.set( 5, 2, 8 );

  controls = new OrbitControls( camera, renderer.domElement );
  controls.target.set( 0, 0.5, 0 );
  controls.update();
  controls.enablePan = false;
  controls.enableDamping = true;
  controls.autoRotate = true;
  window.addEventListener( 'resize', onWindowResize );
}

function fbxinit() {

  camera = new THREE.PerspectiveCamera( 45, window.innerWidth / window.innerHeight, 1, 2000 );
  camera.position.set( 100, 200, 300 );

  scene.background = new THREE.Color( 0xa0a0a0 );
  scene.fog = new THREE.Fog( 0xa0a0a0, 200, 1000 );

  const hemiLight = new THREE.HemisphereLight( 0xffffff, 0x444444, 5 );
  hemiLight.position.set( 0, 200, 0 );
  scene.add( hemiLight );

  const dirLight = new THREE.DirectionalLight( 0xffffff, 5 );
  dirLight.position.set( 0, 200, 100 );
  dirLight.castShadow = true;
  dirLight.shadow.camera.top = 180;
  dirLight.shadow.camera.bottom = - 100;
  dirLight.shadow.camera.left = - 120;
  dirLight.shadow.camera.right = 120;
  scene.add( dirLight );

  // scene.add( new THREE.CameraHelper( dirLight.shadow.camera ) );

  // ground
  const mesh = new THREE.Mesh( new THREE.PlaneGeometry( 2000, 2000 ), new THREE.MeshPhongMaterial( { color: 0x999999, depthWrite: false } ) );
  mesh.rotation.x = - Math.PI / 2;
  mesh.receiveShadow = true;
  scene.add( mesh );

  const grid = new THREE.GridHelper( 2000, 20, 0x000000, 0x000000 );
  grid.material.opacity = 0.2;
  grid.material.transparent = true;
  scene.add( grid );

  renderer.shadowMap.enabled = true;
  
  controls = new OrbitControls( camera, renderer.domElement );
  controls.target.set( 0, 100, 0 );
  controls.autoRotate = true;
  controls.update();

  window.addEventListener( 'resize', onWindowResize );
}

function daeinit() {

  camera = new THREE.PerspectiveCamera( 25, window.innerWidth / window.innerHeight, 1, 1000 );
  camera.position.set( 15, 10, - 15 );

  const gridHelper = new THREE.GridHelper( 10, 20, 0xc1c1c1, 0x8d8d8d );
  scene.add( gridHelper );

  const ambientLight = new THREE.AmbientLight( 0xffffff, 0.6 );
  scene.add( ambientLight );

  const directionalLight = new THREE.DirectionalLight( 0xffffff, 3 );
  directionalLight.position.set( 1.5, 1, - 1.5 );
  scene.add( directionalLight );
  //
  controls = new OrbitControls( camera, renderer.domElement );
  controls.screenSpacePanning = true;
  controls.minDistance = 5;
  controls.maxDistance = 40;
  controls.target.set( 0, 2, 0 );
  controls.update();

  window.addEventListener( 'resize', onWindowResize );
}

function objinit() {

  camera = new THREE.PerspectiveCamera( 45, window.innerWidth / window.innerHeight, 0.1, 20 );
  camera.position.z = 2.5;

  const ambientLight = new THREE.AmbientLight( 0xffffff );
  scene.add( ambientLight );

  const pointLight = new THREE.PointLight( 0xffffff, 15 );
  camera.add( pointLight );
  scene.add( camera );

  controls = new OrbitControls( camera, renderer.domElement );
  controls.minDistance = 2;
  controls.maxDistance = 5;
  controls.autoRotate = true;
  
  window.addEventListener( 'resize', onWindowResize );
}

function ifcinit() {

  scene.background = new THREE.Color( 0x8cc7de );

  //Camera
  camera = new THREE.PerspectiveCamera( 45, window.innerWidth / window.innerHeight, 0.1, 1000 );
  camera.position.z = - 70;
  camera.position.y = 25;
  camera.position.x = 90;

  //Initial cube
  const geometry = new THREE.BoxGeometry();
  const material = new THREE.MeshPhongMaterial( { color: 0xffffff } );
  const cube = new THREE.Mesh( geometry, material );
  scene.add( cube );

  //Lights
  const directionalLight1 = new THREE.DirectionalLight( 0xffeeff, 2.5 );
  directionalLight1.position.set( 1, 1, 1 );
  scene.add( directionalLight1 );

  const directionalLight2 = new THREE.DirectionalLight( 0xffffff, 2.5 );
  directionalLight2.position.set( - 1, 0.5, - 1 );
  scene.add( directionalLight2 );

  const ambientLight = new THREE.AmbientLight( 0xffffee, 0.75 );
  scene.add( ambientLight );

  //Controls
  controls = new OrbitControls( camera, renderer.domElement );
  controls.addEventListener( 'change', render );
  controls.autoRotate = true;

  window.addEventListener( 'resize', onWindowResize );

  render();
}

function render() {
  renderer.render( scene, camera );
}

function modelscale(model) {
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
}

function glbload(filename) {
  loader.load(filename, function ( gltf ) {
    const model = gltf.scene;
    modelscale(model);
    //model.scale.set( 0.01, 0.01, 0.01 );
    scene.add( model );
    model.visible = true; //turn on/off model show
    onWindowResize();

    mixer = new THREE.AnimationMixer( model );
    gltf.animations.forEach ((animation, index) =>
    {
      console.log("animation index: %d", index);
      mixer.clipAction(animation).play();
    });
    animate();

  }, undefined, function ( e ) {

    console.error( e );

  });
}

function fbxload(filename) {
  loader.load(filename, function ( object ) {
    object.position.set( 0, 1, 0 );
    //model.scale.set( 0.01, 0.01, 0.01 );
    scene.add( object );
    object.visible = true; //turn on/off model show
    onWindowResize();

    mixer = new THREE.AnimationMixer( object );
    object.animations.forEach ((animation, index) =>
    {
      console.log("animation index: %d", index);
      mixer.clipAction(animation).play();
    });

    object.traverse( function ( child ) {
      if ( child.isMesh ) {
        child.castShadow = true;
        child.receiveShadow = true;
      }
    } );
    animate();

  }, undefined, function ( e ) {
    console.error( e );
  });
}

function gltfload(filepath, filename) {
  loader = new GLTFLoader().setPath( filepath );
  loader.load(filename, async function ( gltf ) {
    const model = gltf.scene;
    await renderer.compileAsync( model, camera, scene );
    modelscale(model);
    //model.scale.set( 0.01, 0.01, 0.01 );
    scene.add( model );
    model.visible = true; //turn on/off model show
    onWindowResize();

    mixer = new THREE.AnimationMixer( model );
    gltf.animations.forEach ((animation, index) =>
    {
      console.log("animation index: %d", index);
      mixer.clipAction(animation).play();
    });
    animate();
  }, undefined, function ( e ) {
    console.error( e );
  });
}

function daeload(filename) {
  loader = new ColladaLoader();
  loader.load(filename, function ( collada ) {
    const model = collada.scene;
    mixer = new THREE.AnimationMixer( model );
    collada.animations.forEach ((animation, index) =>
    {
      console.log("animation index: %d", index);
      mixer.clipAction(animation).play();
    });
    scene.add( model );
    animate();
  }, undefined, function ( e ) {
    console.error( e );
  });
}

function objload(mtlpath, mtlfilename, objfilename) {
  const onProgress = function ( xhr ) {
    if ( xhr.lengthComputable ) {
      const percentComplete = xhr.loaded / xhr.total * 100;
      console.log( percentComplete.toFixed( 2 ) + '% downloaded' );
    }
  };
  new MTLLoader()
    .setPath( mtlpath )
    .load( mtlfilename, function ( materials ) {
    materials.preload();
    new OBJLoader()
      .setMaterials( materials )
      .setPath( mtlpath )
      .load(objfilename, function ( object ) {
        object.position.y = - 0.95;
        object.scale.setScalar( 0.01 );
        scene.add( object );
        animate();
      }, onProgress );
  } );
}

async function ifcload(filename) {
  //Setup IFC Loader
  const ifcLoader = new IFCLoader();
  await ifcLoader.ifcManager.setWasmPath( 'https://unpkg.com/web-ifc@0.0.36/', true );

  await ifcLoader.ifcManager.parser.setupOptionalCategories( {
    [ IFCSPACE ]: false,
  } );

  await ifcLoader.ifcManager.applyWebIfcConfig( {
    USE_FAST_BOOLS: true
  } );

  ifcLoader.load( filename, function ( model ) {

    scene.add( model.mesh );
    render();
  } );
}

function onWindowResize() {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize( window.innerWidth, window.innerHeight );
}

function animate() {
  requestAnimationFrame( animate );
  const delta = clock.getDelta();
  if (mixer !== null) {
    mixer.update( delta );
  }
  controls.update();
  stats.update();
  renderer.render( scene, camera );
}

// Functions to handle socket events
function MakeConnection ()
{
    // Connection opened
    socket.addEventListener('open', function (event) {
        socket.send('Models: Hello Server!');
        console.log('Models: connected to palacio-display-server!');
        console.log("Models: current href: %s", window.location.href);
        retrying = false;
    });
    if (socket.readyState !== socket.OPEN) {
        console.log('Models: Connection open: failed and retry later');
        setTimeout(MakeConnection, timeout);
    }
}

// Listen for messages
socket.addEventListener('message', function (event) {
  console.log(event.data.toString());
  let cmd_string = event.data.toString();
  let hashtag_index = cmd_string.indexOf('{');
  if (hashtag_index === 0) {
      let json = cmd_string.slice(hashtag_index);
      const obj = JSON.parse(json);
      if (obj.cmd === 'video' ) {
      }
      if (obj.cmd === 'image' || obj.cmd === 'gif') {
      }
      else if (obj.cmd === 'model') {
          let index = obj.filename.indexOf("image-uploads");
          let zipfilename = obj.filename.substr(index);
      }
  }
})

socket.addEventListener('close', function (event) {
  console.log('Connection closed');
  if (!retrying) {
      retrying = true;
      console.log('Reconnecting...');
  }
  setTimeout(MakeConnection, timeout);
})

socket.addEventListener('error', function (event) {
  console.log('Connection error: failed and retry later');
  if (!retrying) {
      retrying = true;
      console.log('Reconnecting...');
  }
  setTimeout(MakeConnection, timeout);
})
