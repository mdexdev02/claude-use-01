import * as THREE from 'three';
import { Weapon } from './Weapon.js';

export class Player {
    constructor(camera, scene, canvas) {
        this.camera = camera;
        this.scene = scene;
        this.canvas = canvas;

        // 플레이어 위치 및 속성
        this.position = new THREE.Vector3(0, 2, 0);
        this.velocity = new THREE.Vector3();
        this.health = 100;
        this.maxHealth = 100;

        // 이동 속성
        this.moveSpeed = 10;
        this.sprintMultiplier = 1.5;
        this.jumpForce = 8;
        this.gravity = 20;
        this.isGrounded = false;
        this.playerHeight = 2;
        this.playerRadius = 0.5;

        // 마우스 컨트롤
        this.mouseSensitivity = 0.002;
        this.pitch = 0;
        this.yaw = 0;

        // 입력 상태
        this.keys = {};
        this.mouseMovement = { x: 0, y: 0 };

        // 무기
        this.weapon = new Weapon(scene, camera);

        // 카메라 초기 위치
        this.camera.position.copy(this.position);

        // 바운딩 박스 (충돌 감지용)
        this.boundingBox = new THREE.Box3();
        this.updateBoundingBox();

        // 컨트롤 활성화 상태
        this.controlsEnabled = false;
    }

    enableControls() {
        this.controlsEnabled = true;

        // 이벤트 리스너 추가
        document.addEventListener('keydown', this.onKeyDown.bind(this));
        document.addEventListener('keyup', this.onKeyUp.bind(this));
        document.addEventListener('mousemove', this.onMouseMove.bind(this));
        document.addEventListener('pointerlockchange', this.onPointerLockChange.bind(this));

        // 클릭 시 포인터 락 요청
        if (this.canvas) {
            this.canvas.addEventListener('click', () => {
                if (!document.pointerLockElement) {
                    this.canvas.requestPointerLock();
                    console.log('Pointer lock requested'); // 디버깅
                }
            });
        }
    }

    disableControls() {
        this.controlsEnabled = false;
        this.keys = {};
    }

    onKeyDown(event) {
        this.keys[event.code] = true;
        console.log('Key pressed:', event.code); // 디버깅
    }

    onKeyUp(event) {
        this.keys[event.code] = false;
    }

    onMouseMove(event) {
        if (!this.controlsEnabled || !document.pointerLockElement) return;

        this.mouseMovement.x = event.movementX;
        this.mouseMovement.y = event.movementY;
    }

    onPointerLockChange() {
        if (document.pointerLockElement) {
            console.log('Pointer lock activated!'); // 디버깅
        } else {
            console.log('Pointer lock deactivated'); // 디버깅
        }
    }

    handleMouseLook() {
        if (!this.controlsEnabled) return;

        // 요 (좌우 회전)
        this.yaw -= this.mouseMovement.x * this.mouseSensitivity;

        // 피치 (상하 회전)
        this.pitch -= this.mouseMovement.y * this.mouseSensitivity;
        this.pitch = Math.max(-Math.PI / 2, Math.min(Math.PI / 2, this.pitch));

        // 카메라 회전 적용
        this.camera.rotation.set(this.pitch, this.yaw, 0, 'YXZ');

        // 마우스 이동 리셋
        this.mouseMovement.x = 0;
        this.mouseMovement.y = 0;
    }

    handleMovement(deltaTime, collisionObjects) {
        if (!this.controlsEnabled) {
            console.log('Controls not enabled!'); // 디버깅
            return;
        }

        const direction = new THREE.Vector3();
        const right = new THREE.Vector3();

        // 카메라의 정면과 오른쪽 방향 계산 (y축 고정)
        const forward = new THREE.Vector3(0, 0, -1);
        forward.applyQuaternion(this.camera.quaternion);
        forward.y = 0;
        forward.normalize();

        right.crossVectors(forward, new THREE.Vector3(0, 1, 0)).normalize();

        // 이동 입력
        let moving = false;
        if (this.keys['KeyW']) {
            direction.add(forward);
            moving = true;
            console.log('W pressed - moving forward');
        }
        if (this.keys['KeyS']) {
            direction.sub(forward);
            moving = true;
            console.log('S pressed - moving backward');
        }
        if (this.keys['KeyA']) {
            direction.sub(right);
            moving = true;
            console.log('A pressed - moving left');
        }
        if (this.keys['KeyD']) {
            direction.add(right);
            moving = true;
            console.log('D pressed - moving right');
        }

        if (moving) {
            console.log('Player position BEFORE:', this.position.x.toFixed(2), this.position.y.toFixed(2), this.position.z.toFixed(2));
            console.log('Direction:', direction.x.toFixed(2), direction.y.toFixed(2), direction.z.toFixed(2));
            console.log('deltaTime:', deltaTime);
        }

        // 달리기
        const isSprinting = this.keys['ShiftLeft'] || this.keys['ShiftRight'];
        const currentSpeed = this.moveSpeed * (isSprinting ? this.sprintMultiplier : 1);

        // 이동 적용
        if (direction.length() > 0) {
            direction.normalize();
            this.velocity.x = direction.x * currentSpeed;
            this.velocity.z = direction.z * currentSpeed;
        } else {
            this.velocity.x *= 0.9; // 감속
            this.velocity.z *= 0.9;
        }

        // 점프
        if ((this.keys['Space']) && this.isGrounded) {
            this.velocity.y = this.jumpForce;
            this.isGrounded = false;
        }

        // 중력 적용
        if (!this.isGrounded) {
            this.velocity.y -= this.gravity * deltaTime;
        }

        // 위치 업데이트 (충돌 감지 포함)
        const nextPosition = this.position.clone();
        nextPosition.x += this.velocity.x * deltaTime;
        nextPosition.z += this.velocity.z * deltaTime;
        nextPosition.y += this.velocity.y * deltaTime;

        // 충돌 감지
        const tempBox = this.boundingBox.clone();
        tempBox.min.add(nextPosition).sub(this.position);
        tempBox.max.add(nextPosition).sub(this.position);

        let collided = false;
        for (const obj of collisionObjects) {
            if (tempBox.intersectsBox(obj)) {
                collided = true;
                break;
            }
        }

        if (!collided) {
            this.position.copy(nextPosition);
        } else {
            this.velocity.x = 0;
            this.velocity.z = 0;
        }

        // 바닥 충돌 검사
        if (this.position.y <= this.playerHeight / 2) {
            this.position.y = this.playerHeight / 2;
            this.velocity.y = 0;
            this.isGrounded = true;
        }

        // 카메라 위치 업데이트
        this.camera.position.copy(this.position);
        this.updateBoundingBox();

        // 위치 변경 로그
        if (moving) {
            console.log('Player position AFTER:', this.position.x.toFixed(2), this.position.y.toFixed(2), this.position.z.toFixed(2));
            console.log('---');
        }
    }

    updateBoundingBox() {
        this.boundingBox.setFromCenterAndSize(
            this.position,
            new THREE.Vector3(this.playerRadius * 2, this.playerHeight, this.playerRadius * 2)
        );
    }

    takeDamage(amount) {
        this.health = Math.max(0, this.health - amount);

        // 피격 효과 (화면 빨갛게)
        this.createDamageEffect();
    }

    createDamageEffect() {
        const overlay = document.createElement('div');
        overlay.style.position = 'fixed';
        overlay.style.top = '0';
        overlay.style.left = '0';
        overlay.style.width = '100%';
        overlay.style.height = '100%';
        overlay.style.background = 'radial-gradient(circle, transparent 30%, rgba(255, 0, 0, 0.3) 100%)';
        overlay.style.pointerEvents = 'none';
        overlay.style.zIndex = '999';
        document.body.appendChild(overlay);

        setTimeout(() => {
            document.body.removeChild(overlay);
        }, 200);
    }

    reset() {
        this.position.set(0, 2, 0);
        this.velocity.set(0, 0, 0);
        this.health = this.maxHealth;
        this.camera.position.copy(this.position);
        this.pitch = 0;
        this.yaw = 0;
        this.weapon.reset();
        this.enableControls();
    }

    update(deltaTime, collisionObjects) {
        this.handleMouseLook();
        this.handleMovement(deltaTime, collisionObjects);
        this.weapon.update(deltaTime);
    }
}
