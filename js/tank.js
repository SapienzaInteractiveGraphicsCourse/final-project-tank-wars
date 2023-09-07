import * as BABYLON from 'babylonjs';
import { AdvancedDynamicTexture, Rectangle } from 'babylonjs-gui';

class Tank {
    
    constructor(name, startPosition, scene, shadowGenerator, isGunControlled = false, canvas = null) {
        this.debug = false

        this.name = name;
        this.startPosition = startPosition;
        this.scene = scene;
        this.shadowGenerator = shadowGenerator;
        this.isGunControlled = isGunControlled;
        this.canvas = canvas;

        this.tankMaterial = new BABYLON.StandardMaterial("tankMaterial", this.scene);
        this.tankMaterial.diffuseTexture = new BABYLON.Texture("/tank.jpg");
        this.wheelMaterial = new BABYLON.StandardMaterial("wheelMaterial", this.scene);
        this.wheelMaterial.diffuseTexture = new BABYLON.Texture("/wheel.png");

        this.tankSpeed = 0.08;
        this.maxTankSpeed = 8;
        this.rotationSpeed = 0.02;
        this.maxRotationSpeed = 1;
        this.breakForce = 2;
        this.gunRotationSpeed = 0.01;
        this.steeringAngle = 0;
        this.maxSteeringAngle = Math.PI / 4;
        this.lastBulletTime = 0;
        this.shootGap = 100;


        this.tank = null;

        this.wheels = [];
        this.constraints = [];

        this.advancedTexture = AdvancedDynamicTexture.CreateFullscreenUI("UI");

        this.createTank();
    }

    createTank() {
        this.tank = BABYLON.MeshBuilder.CreateBox(this.name, { width: 3, height: 1, depth: 3 }, this.scene);
        this.tank.position = this.startPosition;
        this.tank.previousPosition = this.tank.position.clone();
        this.tank.material = this.tankMaterial;
        this.tank.direction = 1;
        this.tank.health = 100;
        this.shadowGenerator.addShadowCaster(this.tank);

        //stick that delimit the range of the tank
        const leftSideStick = BABYLON.MeshBuilder.CreateBox("leftSideStick", { width: 0.2, height: 1, depth: 0.2 }, this.scene);
        leftSideStick.position = new BABYLON.Vector3(-1.5, 0.5, 0);
        leftSideStick.material = this.tankMaterial;
        leftSideStick.parent = this.tank;
        this.shadowGenerator.addShadowCaster(leftSideStick);

        const rightSideStick = BABYLON.MeshBuilder.CreateBox("rightSideStick", { width: 0.2, height: 1, depth: 0.2 }, this.scene);
        rightSideStick.position = new BABYLON.Vector3(1.5, 0.5, 0);
        rightSideStick.material = this.tankMaterial;
        rightSideStick.parent = this.tank;
        this.shadowGenerator.addShadowCaster(rightSideStick);


        const turret1 = BABYLON.MeshBuilder.CreateSphere("turret1", { diameter: 1.5 }, this.scene);
        turret1.position = new BABYLON.Vector3(0, 0.3, 0);
        turret1.material = this.tankMaterial;
        turret1.parent = this.tank;
        this.shadowGenerator.addShadowCaster(turret1);

        const turret2 = BABYLON.MeshBuilder.CreateSphere("turret2", { diameter: 0.8 }, this.scene);
        turret2.position = new BABYLON.Vector3(0, 0.6, 0);
        turret2.material = this.tankMaterial;
        turret2.parent = turret1;
        this.shadowGenerator.addShadowCaster(turret2);

        const gun = BABYLON.MeshBuilder.CreateCylinder("gun", { height: 3, diameter: 0.42 }, this.scene);
        gun.position = new BABYLON.Vector3(0, -0.2, 1.2);
        gun.rotation = new BABYLON.Vector3(Math.PI / 2, 0, 0);
        gun.material = this.tankMaterial;
        gun.parent = turret2;
        this.shadowGenerator.addShadowCaster(gun);

        const wheelUV = [];
        wheelUV[0] = new BABYLON.Vector4(0, 0, 1, 1);
        wheelUV[1] = new BABYLON.Vector4(0, 0.5, 0, 0.5);
        wheelUV[2] = new BABYLON.Vector4(0, 0, 1, 1);

        this.wheels[0] = BABYLON.MeshBuilder.CreateCylinder("wheel0", { height: 0.5, diameter: 1.2, faceUV: wheelUV }, this.scene);
        this.wheels[0].rotation.z = Math.PI / 2;
        this.wheels[0].position = new BABYLON.Vector3(-1.8, 0, 1.3);
        this.wheels[0].material = this.wheelMaterial;
        this.shadowGenerator.addShadowCaster(this.wheels[0]);
        this.wheels[1] = BABYLON.MeshBuilder.CreateCylinder("wheel1", { height: 0.5, diameter: 1.2, faceUV: wheelUV }, this.scene);
        this.wheels[1].rotation.z = Math.PI / 2;
        this.wheels[1].position = new BABYLON.Vector3(1.8, 0, 1.3);
        this.wheels[1].material = this.wheelMaterial;
        this.shadowGenerator.addShadowCaster(this.wheels[1]);
        this.wheels[2] = BABYLON.MeshBuilder.CreateCylinder("wheel2", { height: 0.5, diameter: 1.2, faceUV: wheelUV }, this.scene);
        this.wheels[2].rotation.z = Math.PI / 2;
        this.wheels[2].position = new BABYLON.Vector3(-1.8, 0, -1.3);
        this.wheels[2].material = this.wheelMaterial;
        this.shadowGenerator.addShadowCaster(this.wheels[2]);
        this.wheels[3] = BABYLON.MeshBuilder.CreateCylinder("wheel3", { height: 0.5, diameter: 1.2, faceUV: wheelUV }, this.scene);
        this.wheels[3].rotation.z = Math.PI / 2;
        this.wheels[3].position = new BABYLON.Vector3(1.8, 0, -1.3);
        this.wheels[3].material = this.wheelMaterial;
        this.shadowGenerator.addShadowCaster(this.wheels[3]);


        const wheelsContainer = new BABYLON.Mesh("wheelsContainer", this.scene);
        wheelsContainer.addChild(this.wheels[0]);
        wheelsContainer.addChild(this.wheels[1]);
        wheelsContainer.addChild(this.wheels[2]);
        wheelsContainer.addChild(this.wheels[3]);

        //assigning the whheels  as a childs of the tank
        wheelsContainer.parent = this.tank;


        this.tank.aggregate = new BABYLON.PhysicsAggregate(this.tank, BABYLON.PhysicsShapeType.BOX, {
            mass: 20
        }, this.scene);

        // associates the physics body of the tank with the aggregated physics representation
        this.tank.physicsBody = this.tank.aggregate.body;
        //Damping reduces the velocity of the object over time
        this.tank.physicsBody.setLinearDamping(0.5);
        //Angular damping reduces the rotation velocity over time
        this.tank.physicsBody.setAngularDamping(1);

    }

    
}

export default Tank;