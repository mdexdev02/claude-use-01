import * as THREE from 'three';

export class Weapon {
    constructor(scene, camera) {
        this.scene = scene;
        this.camera = camera;

        // 무기 속성
        this.damage = 25;
        this.fireRate = 0.1; // 초당 발사 속도
        this.lastShotTime = 0;
        this.currentAmmo = 30;
        this.maxAmmo = 30;
        this.totalAmmo = 120;
        this.reloadTime = 2.0;
        this.isReloading = false;
        this.reloadStartTime = 0;

        // 무기 모델 생성
        this.createWeaponModel();

        // 반동 효과
        this.recoilAmount = 0;
        this.recoilRecoverySpeed = 5;
    }

    createWeaponModel() {
        // 간단한 무기 모델 (총의 형태)
        this.weaponGroup = new THREE.Group();

        // 총몸
        const bodyGeometry = new THREE.BoxGeometry(0.1, 0.15, 0.5);
        const bodyMaterial = new THREE.MeshStandardMaterial({
            color: 0x2a2a2a,
            metalness: 0.8,
            roughness: 0.2
        });
        const body = new THREE.Mesh(bodyGeometry, bodyMaterial);
        body.position.set(0, -0.1, -0.3);
        this.weaponGroup.add(body);

        // 총열
        const barrelGeometry = new THREE.CylinderGeometry(0.02, 0.02, 0.4, 8);
        const barrelMaterial = new THREE.MeshStandardMaterial({
            color: 0x1a1a1a,
            metalness: 0.9,
            roughness: 0.1
        });
        const barrel = new THREE.Mesh(barrelGeometry, barrelMaterial);
        barrel.rotation.z = Math.PI / 2;
        barrel.position.set(0, -0.05, -0.5);
        this.weaponGroup.add(barrel);

        // 손잡이
        const gripGeometry = new THREE.BoxGeometry(0.08, 0.2, 0.1);
        const gripMaterial = new THREE.MeshStandardMaterial({
            color: 0x3a3a3a,
            metalness: 0.3,
            roughness: 0.7
        });
        const grip = new THREE.Mesh(gripGeometry, gripMaterial);
        grip.position.set(0, -0.25, -0.1);
        this.weaponGroup.add(grip);

        // 조준경
        const sightGeometry = new THREE.BoxGeometry(0.05, 0.05, 0.1);
        const sightMaterial = new THREE.MeshStandardMaterial({
            color: 0x4a4a4a,
            metalness: 0.5,
            roughness: 0.5
        });
        const sight = new THREE.Mesh(sightGeometry, sightMaterial);
        sight.position.set(0, 0.05, -0.2);
        this.weaponGroup.add(sight);

        // 무기를 카메라에 부착
        this.weaponGroup.position.set(0.2, -0.2, -0.5);
        this.camera.add(this.weaponGroup);
    }

    canShoot() {
        const currentTime = Date.now() / 1000;
        return (
            !this.isReloading &&
            this.currentAmmo > 0 &&
            currentTime - this.lastShotTime >= this.fireRate
        );
    }

    shoot() {
        if (!this.canShoot()) return false;

        this.currentAmmo--;
        this.lastShotTime = Date.now() / 1000;

        // 반동 효과
        this.recoilAmount = 0.05;

        // UI 업데이트
        this.updateAmmoUI();

        // 총구 화염 효과는 Game.js에서 처리

        // 자동 재장전
        if (this.currentAmmo === 0) {
            this.reload();
        }

        return true;
    }

    reload() {
        if (this.isReloading || this.currentAmmo === this.maxAmmo || this.totalAmmo === 0) {
            return;
        }

        this.isReloading = true;
        this.reloadStartTime = Date.now() / 1000;

        setTimeout(() => {
            const ammoNeeded = this.maxAmmo - this.currentAmmo;
            const ammoToReload = Math.min(ammoNeeded, this.totalAmmo);

            this.currentAmmo += ammoToReload;
            this.totalAmmo -= ammoToReload;

            this.isReloading = false;
            this.updateAmmoUI();
        }, this.reloadTime * 1000);
    }

    updateAmmoUI() {
        document.getElementById('current-ammo').textContent = this.currentAmmo;
        document.getElementById('total-ammo').textContent = this.totalAmmo;
    }

    update(deltaTime) {
        // 반동 복구
        if (this.recoilAmount > 0) {
            this.recoilAmount -= this.recoilRecoverySpeed * deltaTime;
            this.recoilAmount = Math.max(0, this.recoilAmount);
        }

        // 무기 위치 업데이트 (반동 효과)
        this.weaponGroup.position.z = -0.5 + this.recoilAmount;

        // 무기 흔들림 효과 (걷기)
        const time = Date.now() / 1000;
        const bobAmount = 0.01;
        const bobSpeed = 10;

        this.weaponGroup.position.y = -0.2 + Math.sin(time * bobSpeed) * bobAmount;
        this.weaponGroup.rotation.z = Math.sin(time * bobSpeed * 0.5) * bobAmount;
    }

    reset() {
        this.currentAmmo = this.maxAmmo;
        this.totalAmmo = 120;
        this.isReloading = false;
        this.updateAmmoUI();
    }
}
