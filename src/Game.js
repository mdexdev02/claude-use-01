import * as THREE from 'three';
import { Player } from './Player.js';
import { Environment } from './Environment.js';
import { NPC } from './NPC.js';
import { UI } from './UI.js';

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

        // NPC 배열
        this.npcs = [];
        this.maxNPCs = 10;
        this.npcSpawnInterval = 3000; // 3초마다 스폰
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
        for (let i = 0; i < 5; i++) {
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

                // 히트 이펙트
                this.createHitEffect(intersects[0].point);
            }
        }

        // 총구 화염 효과
        this.createMuzzleFlash();
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

    createMuzzleFlash() {
        const flashLight = new THREE.PointLight(0xffaa00, 2, 10);
        flashLight.position.copy(this.camera.position);
        flashLight.position.add(
            this.camera.getWorldDirection(new THREE.Vector3()).multiplyScalar(0.5)
        );
        this.scene.add(flashLight);

        setTimeout(() => {
            this.scene.remove(flashLight);
        }, 50);
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
                        this.player.takeDamage(10);
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
