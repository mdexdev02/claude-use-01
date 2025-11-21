import * as THREE from 'three';
import { Player } from './Player.js';
import { Environment } from './Environment.js';
import { NPC } from './NPC.js';
import { UI } from './UI.js';
import { ParticleSystem } from './ParticleSystem.js';

export class Game {
    constructor() {
        this.scene = new THREE.Scene();
        this.camera = new THREE.PerspectiveCamera(
            75,
            window.innerWidth / window.innerHeight,
            0.1,
            1000
        );

        this.renderer = new THREE.WebGLRenderer({
            antialias: true,
            powerPreference: "high-performance"
        });
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.renderer.shadowMap.enabled = true;
        this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
        this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

        document.body.appendChild(this.renderer.domElement);

        // 고급 조명 설정
        this.setupLighting();

        // 게임 상태
        this.isRunning = false;
        this.isPaused = false;
        this.kills = 0;

        // 플레이어 초기화
        this.player = new Player(this.camera, this.scene);

        // 환경 초기화
        this.environment = new Environment(this.scene);

        // UI 초기화
        this.ui = new UI(this);

        // 파티클 시스템 초기화
        this.particleSystem = new ParticleSystem(this.scene);

        // NPC 배열
        this.npcs = [];
        this.maxNPCs = 8; // 10 → 8 (최대 NPC 수 감소)
        this.npcSpawnInterval = 6000; // 3초 → 6초 (스폰 속도 절반으로)
        this.lastNPCSpawn = 0;

        // 시간 관리
        this.clock = new THREE.Clock();
        this.deltaTime = 0;

        // Raycaster for shooting
        this.raycaster = new THREE.Raycaster();

        // 초기 NPC 생성
        this.spawnInitialNPCs();

        // 이벤트 리스너
        this.setupEventListeners();
    }

    setupLighting() {
        // 환경 조명
        this.scene.background = new THREE.Color(0x87CEEB);
        this.scene.fog = new THREE.Fog(0x87CEEB, 50, 200);

        // 태양광 (주광원)
        const sunLight = new THREE.DirectionalLight(0xffffff, 1.2);
        sunLight.position.set(50, 100, 50);
        sunLight.castShadow = true;
        sunLight.shadow.camera.left = -100;
        sunLight.shadow.camera.right = 100;
        sunLight.shadow.camera.top = 100;
        sunLight.shadow.camera.bottom = -100;
        sunLight.shadow.camera.near = 0.5;
        sunLight.shadow.camera.far = 500;
        sunLight.shadow.mapSize.width = 2048;
        sunLight.shadow.mapSize.height = 2048;
        sunLight.shadow.bias = -0.0001;
        this.scene.add(sunLight);

        // 환경광 (부드러운 전체 조명)
        const ambientLight = new THREE.AmbientLight(0x404040, 0.6);
        this.scene.add(ambientLight);

        // 반구광 (하늘과 땅의 색상 차이)
        const hemisphereLight = new THREE.HemisphereLight(0x87CEEB, 0x545454, 0.5);
        this.scene.add(hemisphereLight);
    }

    setupEventListeners() {
        // 사격 이벤트
        document.addEventListener('click', (e) => {
            if (this.isRunning && !this.isPaused && document.pointerLockElement) {
                this.handleShooting();
            }
        });

        // 재장전 이벤트
        document.addEventListener('keydown', (e) => {
            if (e.key === 'r' || e.key === 'R') {
                this.player.weapon.reload();
            }
        });
    }

    spawnInitialNPCs() {
        for (let i = 0; i < 3; i++) { // 5 → 3 (초기 NPC 수 감소)
            this.spawnNPC();
        }
    }

    spawnNPC() {
        if (this.npcs.length >= this.maxNPCs) return;

        // 플레이어 주변에서 랜덤 위치 생성 (플레이어로부터 일정 거리 떨어진 곳)
        const spawnDistance = 30 + Math.random() * 40;
        const angle = Math.random() * Math.PI * 2;
        const x = Math.cos(angle) * spawnDistance;
        const z = Math.sin(angle) * spawnDistance;

        const npc = new NPC(this.scene, new THREE.Vector3(x, 0, z), this.player);
        this.npcs.push(npc);
    }

    handleShooting() {
        if (!this.player.weapon.canShoot()) return;

        this.player.weapon.shoot();

        // 레이캐스팅으로 명중 확인
        this.raycaster.setFromCamera(new THREE.Vector2(0, 0), this.camera);

        const npcMeshes = this.npcs
            .filter(npc => npc.isAlive)
            .map(npc => npc.mesh);

        const intersects = this.raycaster.intersectObjects(npcMeshes, true);

        if (intersects.length > 0) {
            // NPC 찾기
            const hitMesh = intersects[0].object;
            const hitNPC = this.npcs.find(npc =>
                npc.mesh === hitMesh || npc.mesh.children.includes(hitMesh)
            );

            if (hitNPC && hitNPC.isAlive) {
                const damage = this.player.weapon.damage;
                const killed = hitNPC.takeDamage(damage);

                if (killed) {
                    this.kills++;
                    this.ui.updateKills(this.kills);

                    // NPC를 배열에서 제거
                    setTimeout(() => {
                        const index = this.npcs.indexOf(hitNPC);
                        if (index > -1) {
                            this.npcs.splice(index, 1);
                        }
                    }, 2000);
                }

                // 히트 이펙트 (혈흔 파티클)
                const hitPoint = intersects[0].point;
                const direction = this.camera.getWorldDirection(new THREE.Vector3());
                this.particleSystem.createBloodEffect(hitPoint, direction);
                this.createHitEffect(hitPoint);
            }
        } else {
            // 빗나간 경우 - 벽이나 바닥에 충돌 체크
            this.checkEnvironmentHit();
        }

        // 총구 화염 효과 (파티클)
        const muzzlePosition = this.camera.position.clone();
        const muzzleDirection = this.camera.getWorldDirection(new THREE.Vector3());
        muzzlePosition.add(muzzleDirection.clone().multiplyScalar(0.5));
        this.particleSystem.createMuzzleFlash(muzzlePosition, muzzleDirection);

        // 탄피 배출
        const casingPosition = muzzlePosition.clone();
        casingPosition.x += 0.2;
        this.particleSystem.createShellCasing(casingPosition, muzzleDirection);
    }

    createHitEffect(position) {
        const geometry = new THREE.SphereGeometry(0.2, 8, 8);
        const material = new THREE.MeshBasicMaterial({ color: 0xff0000 });
        const effect = new THREE.Mesh(geometry, material);
        effect.position.copy(position);
        this.scene.add(effect);

        setTimeout(() => {
            this.scene.remove(effect);
            geometry.dispose();
            material.dispose();
        }, 100);
    }

    checkEnvironmentHit() {
        // 환경(벽, 바닥 등)에 명중 체크
        this.raycaster.setFromCamera(new THREE.Vector2(0, 0), this.camera);

        const environmentObjects = [];
        this.scene.traverse((child) => {
            if (child.isMesh && !child.parent?.isGroup) {
                environmentObjects.push(child);
            }
        });

        const intersects = this.raycaster.intersectObjects(environmentObjects, false);

        if (intersects.length > 0) {
            const hitPoint = intersects[0].point;
            const normal = intersects[0].face.normal;

            // 스파크 효과
            this.particleSystem.createImpactSpark(hitPoint, normal);

            // 간단한 데칼 (충격 자국)
            const decalGeometry = new THREE.CircleGeometry(0.1, 8);
            const decalMaterial = new THREE.MeshBasicMaterial({
                color: 0x2a2a2a,
                transparent: true,
                opacity: 0.6,
                depthWrite: false
            });
            const decal = new THREE.Mesh(decalGeometry, decalMaterial);
            decal.position.copy(hitPoint);
            decal.lookAt(hitPoint.clone().add(normal));
            decal.position.add(normal.multiplyScalar(0.01));
            this.scene.add(decal);

            // 데칼 페이드 아웃
            setTimeout(() => {
                const fadeStart = Date.now();
                const fadeDuration = 2000;

                const fade = () => {
                    const elapsed = Date.now() - fadeStart;
                    const progress = elapsed / fadeDuration;

                    if (progress < 1) {
                        decalMaterial.opacity = 0.6 * (1 - progress);
                        requestAnimationFrame(fade);
                    } else {
                        this.scene.remove(decal);
                        decalGeometry.dispose();
                        decalMaterial.dispose();
                    }
                };

                fade();
            }, 3000);
        }
    }

    start() {
        this.isRunning = true;
        this.player.enableControls();
        this.animate();
    }

    restart() {
        // NPC 제거
        this.npcs.forEach(npc => npc.remove());
        this.npcs = [];

        // 플레이어 리셋
        this.player.reset();

        // 킬 카운트 리셋
        this.kills = 0;
        this.ui.updateKills(0);

        // 새로운 NPC 생성
        this.spawnInitialNPCs();

        // 게임 재시작
        this.isRunning = true;
        this.isPaused = false;
    }

    gameOver() {
        this.isRunning = false;
        this.player.disableControls();
        document.exitPointerLock();

        const gameOverScreen = document.getElementById('game-over');
        const finalScore = document.getElementById('final-score');
        finalScore.textContent = `처치: ${this.kills}`;
        gameOverScreen.style.display = 'flex';
    }

    update() {
        this.deltaTime = this.clock.getDelta();

        if (!this.isRunning || this.isPaused) return;

        // 플레이어 업데이트
        this.player.update(this.deltaTime, this.environment.getCollisionObjects());

        // NPC 업데이트 및 스폰
        const currentTime = Date.now();
        if (currentTime - this.lastNPCSpawn > this.npcSpawnInterval) {
            this.spawnNPC();
            this.lastNPCSpawn = currentTime;
        }

        // NPC 업데이트
        this.npcs.forEach(npc => {
            if (npc.isAlive) {
                npc.update(this.deltaTime, this.environment.getCollisionObjects());

                // NPC가 플레이어를 공격할 수 있는지 확인
                if (npc.canShoot()) {
                    const hit = npc.shootAtPlayer();
                    if (hit) {
                        this.player.takeDamage(npc.damage); // 10 → npc.damage (5)
                        this.ui.updateHealth(this.player.health);

                        if (this.player.health <= 0) {
                            this.gameOver();
                        }
                    }
                }
            }
        });
    }

    animate() {
        if (!this.isRunning && this.player.health > 0) return;

        requestAnimationFrame(() => this.animate());

        this.update();
        this.renderer.render(this.scene, this.camera);
    }

    onWindowResize() {
        this.camera.aspect = window.innerWidth / window.innerHeight;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize(window.innerWidth, window.innerHeight);
    }
}
