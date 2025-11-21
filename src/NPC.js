import * as THREE from 'three';

export class NPC {
    constructor(scene, position, player) {
        this.scene = scene;
        this.position = position.clone();
        this.player = player;

        // NPC 속성
        this.health = 50; // 100 → 50 (더 빨리 죽음)
        this.maxHealth = 50;
        this.isAlive = true;
        this.moveSpeed = 2.5; // 3 → 2.5 (약간 느리게)
        this.detectionRange = 35; // 50 → 35 (감지 범위 축소)
        this.shootRange = 25; // 40 → 25 (사격 범위 축소)
        this.accuracy = 0.25; // 70% → 25% (명중률 대폭 감소)

        // AI 상태
        this.state = 'patrol'; // patrol, chase, attack
        this.patrolPoints = this.generatePatrolPoints();
        this.currentPatrolIndex = 0;
        this.stateChangeTime = 0;

        // 사격 관련
        this.lastShotTime = 0;
        this.fireRate = 2.5; // 1.5 → 2.5초 (더 느리게 사격)
        this.damage = 5; // NPC 데미지

        // NPC 모델 생성
        this.createDetailedModel();

        // 바운딩 박스
        this.boundingBox = new THREE.Box3();
        this.updateBoundingBox();

        // 레이캐스터
        this.raycaster = new THREE.Raycaster();
    }

    createDetailedModel() {
        this.mesh = new THREE.Group();

        // 몸통 (전술 조끼)
        const bodyGeometry = new THREE.CapsuleGeometry(0.3, 1.2, 8, 16);
        const bodyMaterial = new THREE.MeshStandardMaterial({
            color: 0x2a4a5a,
            roughness: 0.6,
            metalness: 0.3,
            flatShading: false
        });
        const body = new THREE.Mesh(bodyGeometry, bodyMaterial);
        body.position.y = 1;
        body.castShadow = true;
        body.receiveShadow = true;
        this.mesh.add(body);

        // 전술 조끼 플레이트
        const plateGeometry = new THREE.BoxGeometry(0.5, 0.4, 0.15);
        const plateMaterial = new THREE.MeshStandardMaterial({
            color: 0x1a2a3a,
            roughness: 0.5,
            metalness: 0.4
        });
        const chestPlate = new THREE.Mesh(plateGeometry, plateMaterial);
        chestPlate.position.set(0, 1.2, 0.25);
        chestPlate.castShadow = true;
        this.mesh.add(chestPlate);

        // 어깨 패드
        const shoulderGeometry = new THREE.SphereGeometry(0.15, 8, 8);
        const shoulderMaterial = new THREE.MeshStandardMaterial({
            color: 0x3a3a3a,
            roughness: 0.6,
            metalness: 0.5
        });

        const leftShoulder = new THREE.Mesh(shoulderGeometry, shoulderMaterial);
        leftShoulder.position.set(-0.4, 1.5, 0);
        leftShoulder.castShadow = true;
        this.mesh.add(leftShoulder);

        const rightShoulder = new THREE.Mesh(shoulderGeometry, shoulderMaterial);
        rightShoulder.position.set(0.4, 1.5, 0);
        rightShoulder.castShadow = true;
        this.mesh.add(rightShoulder);

        // 머리
        const headGeometry = new THREE.SphereGeometry(0.25, 16, 16);
        const headMaterial = new THREE.MeshStandardMaterial({
            color: 0xffdbac,
            roughness: 0.8,
        });
        const head = new THREE.Mesh(headGeometry, headMaterial);
        head.position.y = 2;
        head.castShadow = true;
        this.mesh.add(head);

        // 전술 헬멧 (더 디테일하게)
        const helmetGeometry = new THREE.SphereGeometry(0.28, 16, 16, 0, Math.PI * 2, 0, Math.PI * 1.5);
        const helmetMaterial = new THREE.MeshStandardMaterial({
            color: 0x2a2a2a,
            roughness: 0.4,
            metalness: 0.7,
            envMapIntensity: 1
        });
        const helmet = new THREE.Mesh(helmetGeometry, helmetMaterial);
        helmet.position.y = 2.15;
        helmet.castShadow = true;
        helmet.receiveShadow = true;
        this.mesh.add(helmet);

        // 헬멧 바이저
        const visorGeometry = new THREE.BoxGeometry(0.35, 0.12, 0.02);
        const visorMaterial = new THREE.MeshStandardMaterial({
            color: 0x000000,
            roughness: 0.1,
            metalness: 0.9,
            transparent: true,
            opacity: 0.7
        });
        const visor = new THREE.Mesh(visorGeometry, visorMaterial);
        visor.position.set(0, 2, 0.25);
        visor.castShadow = true;
        this.mesh.add(visor);

        // 헬멧 레일 (장비 장착용)
        const railGeometry = new THREE.BoxGeometry(0.3, 0.05, 0.05);
        const railMaterial = new THREE.MeshStandardMaterial({
            color: 0x4a4a4a,
            roughness: 0.3,
            metalness: 0.8
        });
        const rail = new THREE.Mesh(railGeometry, railMaterial);
        rail.position.set(0, 2.3, 0.15);
        this.mesh.add(rail);

        // 눈 (두 개)
        const eyeGeometry = new THREE.SphereGeometry(0.05, 8, 8);
        const eyeMaterial = new THREE.MeshStandardMaterial({
            color: 0x000000,
            emissive: 0xff0000,
            emissiveIntensity: 0.5,
        });

        const leftEye = new THREE.Mesh(eyeGeometry, eyeMaterial);
        leftEye.position.set(-0.1, 2, 0.2);
        this.mesh.add(leftEye);

        const rightEye = new THREE.Mesh(eyeGeometry, eyeMaterial);
        rightEye.position.set(0.1, 2, 0.2);
        this.mesh.add(rightEye);

        // 팔 (왼쪽)
        const armGeometry = new THREE.CapsuleGeometry(0.1, 0.8, 4, 8);
        const armMaterial = new THREE.MeshStandardMaterial({
            color: 0x2a4a5a,
            roughness: 0.7,
        });
        const leftArm = new THREE.Mesh(armGeometry, armMaterial);
        leftArm.position.set(-0.4, 1.3, 0);
        leftArm.rotation.z = 0.3;
        leftArm.castShadow = true;
        this.mesh.add(leftArm);

        // 팔 (오른쪽)
        const rightArm = new THREE.Mesh(armGeometry, armMaterial);
        rightArm.position.set(0.4, 1.3, 0);
        rightArm.rotation.z = -0.3;
        rightArm.castShadow = true;
        this.mesh.add(rightArm);

        // 다리 (왼쪽)
        const legGeometry = new THREE.CapsuleGeometry(0.12, 0.9, 4, 8);
        const legMaterial = new THREE.MeshStandardMaterial({
            color: 0x1a3a4a,
            roughness: 0.8,
        });
        const leftLeg = new THREE.Mesh(legGeometry, legMaterial);
        leftLeg.position.set(-0.15, 0.3, 0);
        leftLeg.castShadow = true;
        this.mesh.add(leftLeg);

        // 다리 (오른쪽)
        const rightLeg = new THREE.Mesh(legGeometry, legMaterial);
        rightLeg.position.set(0.15, 0.3, 0);
        rightLeg.castShadow = true;
        this.mesh.add(rightLeg);

        // 무기 (더 디테일한 라이플)
        const weaponGroup = new THREE.Group();

        // 총몸
        const weaponBodyGeometry = new THREE.BoxGeometry(0.12, 0.12, 0.7);
        const weaponMaterial = new THREE.MeshStandardMaterial({
            color: 0x1a1a1a,
            roughness: 0.3,
            metalness: 0.8,
        });
        const weaponBody = new THREE.Mesh(weaponBodyGeometry, weaponMaterial);
        weaponGroup.add(weaponBody);

        // 총열
        const barrelGeometry = new THREE.CylinderGeometry(0.025, 0.025, 0.5, 12);
        const barrel = new THREE.Mesh(barrelGeometry, weaponMaterial);
        barrel.rotation.z = Math.PI / 2;
        barrel.position.set(0, 0.02, -0.5);
        weaponGroup.add(barrel);

        // 개머리판
        const stockGeometry = new THREE.BoxGeometry(0.08, 0.15, 0.3);
        const stockMaterial = new THREE.MeshStandardMaterial({
            color: 0x2a2a2a,
            roughness: 0.6,
            metalness: 0.4
        });
        const stock = new THREE.Mesh(stockGeometry, stockMaterial);
        stock.position.set(0, -0.05, 0.5);
        weaponGroup.add(stock);

        // 탄창
        const magGeometry = new THREE.BoxGeometry(0.08, 0.25, 0.12);
        const magMaterial = new THREE.MeshStandardMaterial({
            color: 0x2a2a2a,
            roughness: 0.5,
            metalness: 0.6
        });
        const magazine = new THREE.Mesh(magGeometry, magMaterial);
        magazine.position.set(0, -0.15, 0);
        weaponGroup.add(magazine);

        // 조준경
        const scopeGeometry = new THREE.CylinderGeometry(0.04, 0.04, 0.15, 12);
        const scopeMaterial = new THREE.MeshStandardMaterial({
            color: 0x0a0a0a,
            roughness: 0.2,
            metalness: 0.9
        });
        const scope = new THREE.Mesh(scopeGeometry, scopeMaterial);
        scope.rotation.z = Math.PI / 2;
        scope.position.set(0, 0.1, -0.1);
        weaponGroup.add(scope);

        // 총구
        const muzzleGeometry = new THREE.CylinderGeometry(0.035, 0.03, 0.08, 12);
        const muzzleMaterial = new THREE.MeshStandardMaterial({
            color: 0x0a0a0a,
            roughness: 0.3,
            metalness: 0.8
        });
        const muzzle = new THREE.Mesh(muzzleGeometry, muzzleMaterial);
        muzzle.rotation.z = Math.PI / 2;
        muzzle.position.set(0, 0.02, -0.78);
        weaponGroup.add(muzzle);

        weaponGroup.position.set(0.3, 1.4, 0.35);
        weaponGroup.rotation.y = -Math.PI / 4;
        weaponGroup.rotation.x = -0.1;
        this.mesh.add(weaponGroup);
        this.weaponGroup = weaponGroup;

        // 체력바
        this.createHealthBar();

        // 위치 설정
        this.mesh.position.copy(this.position);
        this.scene.add(this.mesh);
    }

    createHealthBar() {
        // 체력바 배경
        const barWidth = 1;
        const barHeight = 0.1;

        const barBackGeometry = new THREE.PlaneGeometry(barWidth, barHeight);
        const barBackMaterial = new THREE.MeshBasicMaterial({
            color: 0x000000,
            transparent: true,
            opacity: 0.5,
        });
        const barBackground = new THREE.Mesh(barBackGeometry, barBackMaterial);
        barBackground.position.y = 2.8;
        this.mesh.add(barBackground);

        // 체력바 전경
        const barForeGeometry = new THREE.PlaneGeometry(barWidth, barHeight);
        const barForeMaterial = new THREE.MeshBasicMaterial({
            color: 0x00ff00,
        });
        this.healthBar = new THREE.Mesh(barForeGeometry, barForeMaterial);
        this.healthBar.position.y = 2.8;
        this.healthBar.position.z = 0.01;
        this.mesh.add(this.healthBar);

        // 항상 카메라를 향하도록 설정
        this.healthBarGroup = new THREE.Group();
        this.healthBarGroup.add(barBackground);
        this.healthBarGroup.add(this.healthBar);
    }

    generatePatrolPoints() {
        const points = [];
        const numPoints = 4;
        const radius = 15;

        for (let i = 0; i < numPoints; i++) {
            const angle = (i / numPoints) * Math.PI * 2;
            const x = this.position.x + Math.cos(angle) * radius;
            const z = this.position.z + Math.sin(angle) * radius;
            points.push(new THREE.Vector3(x, 0, z));
        }

        return points;
    }

    updateAI(deltaTime) {
        if (!this.isAlive) return;

        const distanceToPlayer = this.position.distanceTo(this.player.position);

        // 상태 결정
        if (distanceToPlayer < this.shootRange) {
            this.state = 'attack';
        } else if (distanceToPlayer < this.detectionRange) {
            this.state = 'chase';
        } else {
            this.state = 'patrol';
        }

        // 상태에 따른 행동
        switch (this.state) {
            case 'patrol':
                this.patrol(deltaTime);
                break;
            case 'chase':
                this.chase(deltaTime);
                break;
            case 'attack':
                this.attack(deltaTime);
                break;
        }

        // 플레이어를 향해 회전
        if (this.state !== 'patrol') {
            this.lookAtPlayer();
        }
    }

    patrol(deltaTime) {
        const targetPoint = this.patrolPoints[this.currentPatrolIndex];
        const direction = targetPoint.clone().sub(this.position);
        direction.y = 0;

        if (direction.length() < 1) {
            this.currentPatrolIndex = (this.currentPatrolIndex + 1) % this.patrolPoints.length;
        } else {
            direction.normalize();
            this.position.add(direction.multiplyScalar(this.moveSpeed * 0.5 * deltaTime));

            // 이동 방향으로 회전
            const angle = Math.atan2(direction.x, direction.z);
            this.mesh.rotation.y = angle;
        }
    }

    chase(deltaTime) {
        const direction = this.player.position.clone().sub(this.position);
        direction.y = 0;
        direction.normalize();

        this.position.add(direction.multiplyScalar(this.moveSpeed * deltaTime));
    }

    attack(deltaTime) {
        // 공격 상태에서는 천천히 이동하거나 정지
        const direction = this.player.position.clone().sub(this.position);
        direction.y = 0;

        if (direction.length() > this.shootRange * 0.7) {
            direction.normalize();
            this.position.add(direction.multiplyScalar(this.moveSpeed * 0.3 * deltaTime));
        }
    }

    lookAtPlayer() {
        const direction = this.player.position.clone().sub(this.position);
        const angle = Math.atan2(direction.x, direction.z);
        this.mesh.rotation.y = angle;
    }

    canShoot() {
        const currentTime = Date.now() / 1000;
        return (
            this.isAlive &&
            this.state === 'attack' &&
            currentTime - this.lastShotTime >= this.fireRate
        );
    }

    shootAtPlayer() {
        this.lastShotTime = Date.now() / 1000;

        // 레이캐스팅으로 플레이어 명중 확인
        const direction = this.player.position.clone().sub(this.position).normalize();
        this.raycaster.set(this.position, direction);

        // 정확도 적용 (랜덤 편차)
        const hit = Math.random() < this.accuracy;

        if (hit) {
            // 총구 화염 효과
            this.createMuzzleFlash();
            return true;
        }

        return false;
    }

    createMuzzleFlash() {
        // 더 밝고 큰 총구 화염
        const flashLight = new THREE.PointLight(0xff6600, 4, 8);
        const worldPos = new THREE.Vector3();
        this.weaponGroup.getWorldPosition(worldPos);
        flashLight.position.copy(worldPos);
        this.scene.add(flashLight);

        // 파티클 효과도 추가 (간단한 버전)
        const particleGeometry = new THREE.SphereGeometry(0.15, 4, 4);
        const particleMaterial = new THREE.MeshBasicMaterial({
            color: 0xffaa00,
            transparent: true,
            opacity: 0.8
        });
        const particle = new THREE.Mesh(particleGeometry, particleMaterial);
        particle.position.copy(worldPos);
        this.scene.add(particle);

        setTimeout(() => {
            this.scene.remove(flashLight);
            this.scene.remove(particle);
            particleGeometry.dispose();
            particleMaterial.dispose();
        }, 50);
    }

    takeDamage(amount) {
        if (!this.isAlive) return false;

        this.health -= amount;

        // 체력바 업데이트
        const healthPercent = this.health / this.maxHealth;
        this.healthBar.scale.x = healthPercent;
        this.healthBar.position.x = -(1 - healthPercent) * 0.5;

        // 체력바 색상 변경
        if (healthPercent > 0.5) {
            this.healthBar.material.color.setHex(0x00ff00);
        } else if (healthPercent > 0.25) {
            this.healthBar.material.color.setHex(0xffff00);
        } else {
            this.healthBar.material.color.setHex(0xff0000);
        }

        if (this.health <= 0) {
            this.die();
            return true;
        }

        return false;
    }

    die() {
        this.isAlive = false;

        // 죽는 애니메이션 (넘어지기)
        const fallDuration = 1000;
        const startRotation = this.mesh.rotation.x;
        const startTime = Date.now();

        const animate = () => {
            const elapsed = Date.now() - startTime;
            const progress = Math.min(elapsed / fallDuration, 1);

            this.mesh.rotation.x = startRotation + (Math.PI / 2) * progress;
            this.mesh.position.y = -progress * 0.5;

            if (progress < 1) {
                requestAnimationFrame(animate);
            } else {
                // 페이드 아웃
                this.fadeOut();
            }
        };

        animate();
    }

    fadeOut() {
        const fadeDuration = 1000;
        const startTime = Date.now();

        const animate = () => {
            const elapsed = Date.now() - startTime;
            const progress = Math.min(elapsed / fadeDuration, 1);

            this.mesh.traverse((child) => {
                if (child.material) {
                    child.material.transparent = true;
                    child.material.opacity = 1 - progress;
                }
            });

            if (progress < 1) {
                requestAnimationFrame(animate);
            }
        };

        animate();
    }

    updateBoundingBox() {
        this.boundingBox.setFromCenterAndSize(
            this.position,
            new THREE.Vector3(1, 2, 1)
        );
    }

    update(deltaTime, collisionObjects) {
        if (!this.isAlive) return;

        this.updateAI(deltaTime);

        // 위치 업데이트
        this.mesh.position.copy(this.position);
        this.updateBoundingBox();

        // 체력바가 항상 카메라를 향하도록
        if (this.healthBar) {
            this.healthBar.parent.lookAt(this.player.camera.position);
        }

        // 걷기 애니메이션 (간단한 상하 움직임)
        if (this.state === 'patrol' || this.state === 'chase') {
            const time = Date.now() / 1000;
            this.mesh.position.y = Math.abs(Math.sin(time * 8)) * 0.1;
        }
    }

    remove() {
        this.scene.remove(this.mesh);

        // 메모리 정리
        this.mesh.traverse((child) => {
            if (child.geometry) child.geometry.dispose();
            if (child.material) {
                if (Array.isArray(child.material)) {
                    child.material.forEach(material => material.dispose());
                } else {
                    child.material.dispose();
                }
            }
        });
    }
}
