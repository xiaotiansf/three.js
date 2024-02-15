import * as THREE from 'three';

import Stats from 'three/addons/libs/stats.module.js';
import { GUI } from 'three/addons/libs/lil-gui.module.min.js';
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

const overlay_info = {
  title: " ",
  artist_date: " ",
  details: " ",
  medium: " ",
  credit: " ",
};

const image_uploads = "image-uploads";
const threed_uploads = "image-uploads/cg";

const timeout = 5000;
let retrying = true;
const socket = new WebSocket('ws://127.0.0.1:8181');

let gui, mixer, camera, stats, controls;
let video;
let videotexture = null;
let imagetexture = null; 
let mesh = null;
let scene = null;
let renderer = null;

const clock = new THREE.Clock();
const container = document.getElementById( 'container' );
stats = new Stats();
container.appendChild( stats.dom );

gui = new GUI({ width: 400 });
gui.title("Art Information");
gui.show(true);
// Connect
console.log('Models: Connecting to ws://127.0.0.1:8181...');
MakeConnection();

function dummymodelloader() {
  if (scene !== null) {
    Remove();
  }
  else {
    scene = new THREE.Scene();
  }
  //just add something to show initially
  // const geometry = new THREE.BoxGeometry( 0.2, 0.2, 0.2 );
  // const material = new THREE.MeshNormalMaterial();
  // mesh = new THREE.Mesh( geometry, material );
  // scene.add( mesh );
  // mesh.visible = false;
  const width = window.innerWidth, height = window.innerHeight;
  camera = new THREE.PerspectiveCamera( 70, width / height, 0.01, 10 );
  camera.position.z = 1;
  renderer = new THREE.WebGLRenderer( { antialias: true } );
  renderer.setSize( width, height );
  renderer.setAnimationLoop( dummyanimation );
  document.body.appendChild( renderer.domElement );
}

//videotextureloader();
//textureLoader();

function imagetextureLoader(filename) {
	// Test Load the background texture
  imagetexture = new THREE.TextureLoader().load(filename);
	scene.background = imagetexture;
}

function imagetextureunloader() {
	// Test Unload the background texture
  if (imagetexture !== null) {
    imagetexture.dispose();
    imagetexture = null;
  }
}

function videotextureloader(videofilename) {
	video = document.getElementById( 'video' );
  video.src = videofilename;
	video.play();
	video.addEventListener( 'play', function () {
		this.currentTime = 0;
	} );
	videotexture = new THREE.VideoTexture( video );
	videotexture.colorSpace = THREE.SRGBColorSpace;
	scene.background = videotexture;
}

function videotextureunloader() {
	video = document.getElementById( 'video' );
	video.pause();
  if (videotexture !== null) {
    videotexture.dispose();
	  videotexture = null;
  }
}

function setupArtGui(info) {
  gui.add( info, 'title' ).name( info.title );
  gui.add( info, 'artist_date').name( info.artist_date );
  gui.add( info, 'details' ).name( info.details );
  gui.add( info, 'medium' ).name( info.medium );
  gui.add( info, 'credit' ).name( info.credit );
  document.getElementById("Title").innerHTML = info.title;
  document.getElementById("Artist_Date").innerHTML = info.artist_date;
  document.getElementById("Details").innerHTML = info.details;
  document.getElementById("Medium").innerHTML = info.medium;
  document.getElementById("Credit").innerHTML = info.credit;
}

function render_commons_init() {
  renderer = new THREE.WebGLRenderer( { antialias: true } );
  renderer.setPixelRatio( window.devicePixelRatio );
  renderer.setSize( window.innerWidth, window.innerHeight );
  container.appendChild( renderer.domElement );
}

function glbinit() {
  if (scene !== null) {
    Remove();
  }
  else {
    scene = new THREE.Scene();
  }
  render_commons_init();
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
  if (scene !== null) {
    Remove();
  }
  else {
    scene = new THREE.Scene();
  }
  render_commons_init();
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
  if (scene !== null) {
    Remove();
  }
  else {
    scene = new THREE.Scene();
  }
  render_commons_init();
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
  if (scene !== null) {
    Remove();
  }
  else {
    scene = new THREE.Scene();
  }
  render_commons_init();
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
  if (scene !== null) {
    Remove();
  }
  else {
    scene = new THREE.Scene();
  }
  render_commons_init();
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
  const dracoLoader = new DRACOLoader();
  dracoLoader.setDecoderPath( 'jsm/libs/draco/gltf/' );
  const loader = new GLTFLoader();
  loader.setDRACOLoader( dracoLoader );
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
  const loader = new FBXLoader();
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
  const loader = new GLTFLoader().setPath( filepath );
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
  const loader = new ColladaLoader();
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

function dummyanimation( time ) {
  if (mesh !== null) {
    mesh.rotation.x = time / 2000;
	  mesh.rotation.y = time / 1000;
  }
	renderer.render( scene, camera );
}

function Remove() {
  while(scene.children.length > 0){ 
    scene.remove(scene.children[0]); 
  }
  if (renderer !== null && renderer !==undefined) {
    document.body.removeChild(renderer.domElement);
  }
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
      if (obj.cmd === 'video' || obj.cmd === 'image' || obj.cmd === 'gif' || obj.cmd === 'model') {
        overlay_info.title = obj.info.title;
        overlay_info.artist_date = obj.info.artist + "   " + obj.info.date;
        overlay_info.details = obj.info.details;
        overlay_info.medium = obj.info.medium;
        overlay_info.credit = obj.info.credit;
        setupArtGui(overlay_info);
      }
      if (obj.cmd === 'video' || obj.cmd === 'gif' ) {
        let index = obj.filename.indexOf(image_uploads);
        let videofilename = obj.filename.substr(index);
        let  filename_length = videofilename.length;
        videofilename = videofilename.substr(0, filename_length - 4) + '.mp4'
        dummymodelloader();
        videotextureloader(videofilename);
        imagetextureunloader();
      }
      else if (obj.cmd === 'image' ) {
        let index = obj.filename.indexOf(image_uploads);
        let imagefilename = obj.filename.substr(index)
        dummymodelloader();
        imagetextureLoader(imagefilename);
        videotextureunloader();
        //$("#artinfo").show();
      }
      else if (obj.cmd === 'model') {
        let index = obj.filename.lastIndexOf("/");
        let zipfilename = obj.filename.substr(index);
        let asset_dir = threed_uploads + zipfilename.substr(0, zipfilename.lastIndexOf("."));
        $.getJSON(asset_dir, files => {
          console.log(`${asset_dir}: ${files}`);
          var items = files;
            // now apply your filter:
          items = files.filter(function(file) {
            // return the filtered value
            if (file.indexOf('.glb')) {
              console.log('Found glb file');
              glbinit();
              let modelfilename = asset_dir + '/' + file;
              glbload(modelfilename);
            }
          });
        });
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
