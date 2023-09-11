import * as BABYLON from 'babylonjs';
import HavokPhysics from './physics/HavokPhysics_es';

import Obstacles from './obstacles';
import Tank from './tank';
class CustomLoadingScreen {
  constructor() {
    this._loadingDiv = document.getElementById("loadingScreen");
    this._loadingDivProgress = document.getElementById("loadingProgress");
  }

  hideLoadingUI() {
    this._loadingDiv.style.display = "none";

    
    let countScore = document.getElementById('countScore');
  
    countScore.style.display = 'block'
  }
  updateProgress(value) {
    this._loadingDivProgress.style.width = value + "%";
  }
}
function startGame() { 
  

  const canvas = document.getElementById('renderCanvas');
  canvas.style.display = 'block';
  const engine = new BABYLON.Engine(canvas, true);

  engine.loadingScreen = new CustomLoadingScreen();
  let loading = 0;
  let interval = setInterval(() => {
    loading += Math.random() * 0.1 + 0.1;
    //update the progress on the loading screen
    engine.loadingScreen.updateProgress(loading * 100);
    if (loading >= 1) {
      clearInterval(interval);
      // hide the loading user interface
      engine.loadingScreen.hideLoadingUI();
    }
  }, 1000);

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
    
    // Create tank
    scene.playerTank = new Tank("player", new BABYLON.Vector3(0, 2, 10), scene, shadowGenerator, true, canvas);

    // Create enemies
    scene.enemies = [];

    // Tank movement variables
    var moveForward = false;
    var moveBackward = false;
    var rotateLeft = false;
    var rotateRight = false;
    var pressBreak = false;
    var isShoot = false;

      // Event listeners for key presses
      window.addEventListener("keydown", function (event) {
        switch (event.keyCode) {
          case 87: // W
            moveForward = true;
            break;
          case 83: // S
            moveBackward = true;
            break;
          case 65: // A
            rotateLeft = true;
            break;
          case 68: // D
            rotateRight = true;
            break;
          case 32: // Space
            pressBreak = true;
            break;
          case 70:
            isShoot = true;
            break;
        }
      });

      // Event listeners for key releases
      window.addEventListener("keyup", function (event) {
        switch (event.keyCode) {
          case 87: // W
            moveForward = false;
            break;
          case 83: // S
            moveBackward = false;
            break;
          case 65: // A
            rotateLeft = false;
            break;
          case 68: // D
            rotateRight = false;
            break;
          case 32: // Space
            pressBreak = false;
            break;
          case 70: // F
            isShoot = false;
            break;
        }
      });
    
      window.addEventListener("pointerdown", function (event) {
        isShoot = true;
      });

      window.addEventListener("pointerup", function (event) {
        isShoot = false;
      });
      
    function addEnemy() {
      let positionX = createRandom(-25, 25);
      let positionZ = createRandom(42, 47);
      let enemy = new Tank("enemy", new BABYLON.Vector3(positionX, 2, positionZ), scene, shadowGenerator, false);
      enemy.shootGap = Math.random() * 200 + 200;
      let index = scene.enemies.length;
      scene.enemies.push({
        enemyTank: enemy,
        enemyMoveForward: true,
        enemyMoveBackward: false,
        enemyRotateLeft: true,
        enemyRotateRight: false,
        enemyPressBreak: false,
        enemyIsShoot: false,
         // enemy moving in a random way
        updateIntervel: setInterval(() => {
          let random = Math.random();
          if (random < 0.25) {
            scene.enemies[index].enemyMoveForward = true;
            scene.enemies[index].enemyMoveBackward = false;
            scene.enemies[index].enemyRotateLeft = Math.random() < 0.2 ? true : false;
            scene.enemies[index].enemyRotateRight = false;
            scene.enemies[index].enemyPressBreak = false;
          } else if (random < 0.5) {
            scene.enemies[index].enemyMoveForward = true;
            scene.enemies[index].enemyMoveBackward = false;
            scene.enemies[index].enemyRotateLeft = false;
            scene.enemies[index].enemyRotateRight = Math.random() < 0.2 ? true : false;
            scene.enemies[index].enemyPressBreak = false;
          } else if (random < 0.75) {
            scene.enemies[index].enemyMoveForward = false;
            scene.enemies[index].enemyMoveBackward = true;
            scene.enemies[index].enemyRotateLeft = Math.random() < 0.2 ? true : false;
            scene.enemies[index].enemyRotateRight = false;
            scene.enemies[index].enemyPressBreak = false;
          } else {
            scene.enemies[index].enemyMoveForward = false;
            scene.enemies[index].enemyMoveBackward = true;
            scene.enemies[index].enemyRotateLeft = false;
            scene.enemies[index].enemyRotateRight = Math.random() < 0.2 ? true : false;
            scene.enemies[index].enemyPressBreak = false;
          }
        }, 5000)
      });
    }

    addEnemy();  
    
    scene.registerBeforeRender(function () {
      scene.playerTank.update(moveForward, moveBackward, rotateLeft, rotateRight, pressBreak, isShoot);
      for (let i = 0; i < scene.enemies.length; i++) {
        scene.enemies[i].enemyTank.update(scene.enemies[i].enemyMoveForward, scene.enemies[i].enemyMoveBackward, scene.enemies[i].enemyRotateLeft, scene.enemies[i].enemyRotateRight, scene.enemies[i].enemyPressBreak, scene.enemies[i].enemyIsShoot);

        if (scene.enemies[i].enemyTank.tank.health <= 0) {

          scene.enemies[i].enemyTank.tank.dispose();
          scene.enemies[i].enemyTank.advancedTexture.dispose();
          clearInterval(scene.enemies[i].updateIntervel);
          scene.enemies.splice(i, 1);
        }
      }
    })
    function createRandom(min, max) {
      return Math.random() * (max - min) + min;
    }

    
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
}

let btn = document.getElementById('startBtn');
btn.addEventListener('click', () => {
  let mainDiv = document.getElementById('main');
  mainDiv.style.display = 'none';

  let loadingScreen = document.getElementById('loadingScreen');
  loadingScreen.style.display = 'block';

  startGame();

})