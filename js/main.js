import * as BABYLON from 'babylonjs';
import HavokPhysics from './physics/HavokPhysics_es';

import Obstacles from './obstacles';

let btn = document.getElementById('startBtn');
btn.addEventListener('click', () => {
  let mainDiv = document.getElementById('main');
  mainDiv.style.display = 'none';

  const canvas = document.getElementById('renderCanvas');
  canvas.style.display = 'block';
  const engine = new BABYLON.Engine(canvas, true);


  const createScene = async function () {
    const scene = new BABYLON.Scene(engine);
    scene.clearColor = new BABYLON.Color3(1, 1, 1);
    // scene.debugLayer.show({
    //   overlay: true,
    // });

    // camera setup (fixed camera)
    const camera = new BABYLON.ArcRotateCamera("camera", 0, 0, 0, new BABYLON.Vector3(0, 0, 0), scene);
    camera.setPosition(new BABYLON.Vector3(0, 35, -25));
    camera.target = new BABYLON.Vector3(0, 0, 18);

    // light setup
    const light = new BABYLON.DirectionalLight("dir01", new BABYLON.Vector3(-2, -2, 1), scene);
    light.position = new BABYLON.Vector3(80, 120, 100);

    const ambientLight = new BABYLON.HemisphericLight("ambientLight", new BABYLON.Vector3(0, 1, 0), scene);
    ambientLight.intensity = 0.5;

    // add fog
    scene.fogMode = BABYLON.Scene.FOGMODE_EXP;
    scene.fogDensity = 0.01;
    scene.fogColor = new BABYLON.Color3(0.1, 0.1, 0.15);

    // shadow setup
    const shadowGenerator = new BABYLON.ShadowGenerator(1024, light);
    shadowGenerator.useBlurExponentialShadowMap = true;

    const havokInstance = await HavokPhysics();
    const hk = new BABYLON.HavokPlugin(true, havokInstance);
    scene.enablePhysics(new BABYLON.Vector3(0, -9.8, 0), hk);

    // Create ground with Tiled Ground
    const floorMaterial = new BABYLON.StandardMaterial("floor", scene);
    floorMaterial.diffuseTexture = new BABYLON.Texture("/wood.jpg");
    const tiledGround = BABYLON.MeshBuilder.CreateTiledGround("ground",
      {
        xmin: -100,
        zmin: -70,
        xmax: 100,
        zmax: 120,
        subdivisions: {
          'h': 40,
          'w': 50
        }
      }, scene);
    tiledGround.receiveShadows = true;
    tiledGround.material = floorMaterial;


    tiledGround.aggregate = new BABYLON.PhysicsAggregate(tiledGround, BABYLON.PhysicsShapeType.BOX, {
      mass: 0
    }, scene);

    BABYLON.GUI

    // Create obstacles
    scene.obstacles = new Obstacles(scene, shadowGenerator);

      return scene;
  }

  createScene().then((scene) => {
    engine.runRenderLoop(function () {
      scene.render();
    });

    window.addEventListener("resize", function () {
      engine.resize();
    });
  });

})