import * as THREE from 'three';

export class ParticleSystem {
    constructor(scene) {
        this.scene = scene;
        this.particles = [];
    }

    // 총구 화염 파티클
    createMuzzleFlash(position, direction) {
        const particleCount = 30;
        const geometry = new THREE.BufferGeometry();
        const positions = [];
        const colors = [];
        const velocities = [];

        for (let i = 0; i < particleCount; i++) {
            // 원뿔 형태로 파티클 분산
            const spreadAngle = 0.3;
            const randomDir = direction.clone();
            randomDir.x += (Math.random() - 0.5) * spreadAngle;
            randomDir.y += (Math.random() - 0.5) * spreadAngle;
            randomDir.z += (Math.random() - 0.5) * spreadAngle;
            randomDir.normalize();

            positions.push(position.x, position.y, position.z);

            // 오렌지-노란색 그라데이션
            const colorValue = Math.random() * 0.5 + 0.5;
            colors.push(1, colorValue * 0.8, 0);

            // 속도
            const speed = Math.random() * 2 + 1;
            velocities.push(
                randomDir.x * speed,
                randomDir.y * speed,
                randomDir.z * speed
            );
        }

        geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
        geometry.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));

        const material = new THREE.PointsMaterial({
            size: 0.15,
            vertexColors: true,
            transparent: true,
            opacity: 1,
            blending: THREE.AdditiveBlending,
            depthWrite: false
        });

        const particleSystem = new THREE.Points(geometry, material);
        this.scene.add(particleSystem);

        // 애니메이션
        const startTime = Date.now();
        const duration = 200;

        const animate = () => {
            const elapsed = Date.now() - startTime;
            const progress = elapsed / duration;

            if (progress < 1) {
                const positions = geometry.attributes.position.array;

                for (let i = 0; i < particleCount; i++) {
                    positions[i * 3] += velocities[i * 3] * 0.016;
                    positions[i * 3 + 1] += velocities[i * 3 + 1] * 0.016;
                    positions[i * 3 + 2] += velocities[i * 3 + 2] * 0.016;
                }

                geometry.attributes.position.needsUpdate = true;
                material.opacity = 1 - progress;

                requestAnimationFrame(animate);
            } else {
                this.scene.remove(particleSystem);
                geometry.dispose();
                material.dispose();
            }
        };

        animate();

        // 밝은 플래시 라이트
        const flashLight = new THREE.PointLight(0xffaa00, 5, 5);
        flashLight.position.copy(position);
        this.scene.add(flashLight);

        setTimeout(() => {
            this.scene.remove(flashLight);
        }, 50);
    }

    // 혈흔 파티클 (히트)
    createBloodEffect(position, direction) {
        const particleCount = 20;
        const geometry = new THREE.BufferGeometry();
        const positions = [];
        const colors = [];
        const velocities = [];

        for (let i = 0; i < particleCount; i++) {
            // 뒤쪽으로 튀는 효과
            const spreadAngle = 0.5;
            const backDir = direction.clone().multiplyScalar(-1);
            backDir.x += (Math.random() - 0.5) * spreadAngle;
            backDir.y += (Math.random() - 0.5) * spreadAngle;
            backDir.z += (Math.random() - 0.5) * spreadAngle;
            backDir.normalize();

            positions.push(position.x, position.y, position.z);

            // 어두운 빨간색
            const redValue = Math.random() * 0.3 + 0.4;
            colors.push(redValue, 0, 0);

            // 속도
            const speed = Math.random() * 1.5 + 0.5;
            velocities.push(
                backDir.x * speed,
                backDir.y * speed - 2, // 중력
                backDir.z * speed
            );
        }

        geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
        geometry.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));

        const material = new THREE.PointsMaterial({
            size: 0.1,
            vertexColors: true,
            transparent: true,
            opacity: 1,
            depthWrite: false
        });

        const particleSystem = new THREE.Points(geometry, material);
        this.scene.add(particleSystem);

        // 애니메이션
        const startTime = Date.now();
        const duration = 600;

        const animate = () => {
            const elapsed = Date.now() - startTime;
            const progress = elapsed / duration;

            if (progress < 1) {
                const positions = geometry.attributes.position.array;

                for (let i = 0; i < particleCount; i++) {
                    positions[i * 3] += velocities[i * 3] * 0.016;
                    positions[i * 3 + 1] += velocities[i * 3 + 1] * 0.016;
                    positions[i * 3 + 2] += velocities[i * 3 + 2] * 0.016;

                    // 중력
                    velocities[i * 3 + 1] -= 0.1;
                }

                geometry.attributes.position.needsUpdate = true;
                material.opacity = 1 - progress;

                requestAnimationFrame(animate);
            } else {
                this.scene.remove(particleSystem);
                geometry.dispose();
                material.dispose();
            }
        };

        animate();
    }

    // 탄환 궤적 효과
    createBulletTracer(start, end) {
        const points = [start, end];
        const geometry = new THREE.BufferGeometry().setFromPoints(points);
        const material = new THREE.LineBasicMaterial({
            color: 0xffff00,
            transparent: true,
            opacity: 0.8,
            linewidth: 2
        });

        const line = new THREE.Line(geometry, material);
        this.scene.add(line);

        // 페이드 아웃
        const startTime = Date.now();
        const duration = 100;

        const animate = () => {
            const elapsed = Date.now() - startTime;
            const progress = elapsed / duration;

            if (progress < 1) {
                material.opacity = 0.8 * (1 - progress);
                requestAnimationFrame(animate);
            } else {
                this.scene.remove(line);
                geometry.dispose();
                material.dispose();
            }
        };

        animate();
    }

    // 충격 스파크 (벽/바닥 명중)
    createImpactSpark(position, normal) {
        const particleCount = 15;
        const geometry = new THREE.BufferGeometry();
        const positions = [];
        const colors = [];
        const velocities = [];

        for (let i = 0; i < particleCount; i++) {
            // 표면 법선 방향으로 튀어나감
            const spreadAngle = 0.8;
            const sparkDir = normal.clone();
            sparkDir.x += (Math.random() - 0.5) * spreadAngle;
            sparkDir.y += Math.random() * 0.5;
            sparkDir.z += (Math.random() - 0.5) * spreadAngle;
            sparkDir.normalize();

            positions.push(position.x, position.y, position.z);

            // 노란색-흰색 스파크
            const brightness = Math.random() * 0.5 + 0.5;
            colors.push(brightness, brightness, brightness * 0.7);

            // 속도
            const speed = Math.random() * 3 + 1;
            velocities.push(
                sparkDir.x * speed,
                sparkDir.y * speed,
                sparkDir.z * speed
            );
        }

        geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
        geometry.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));

        const material = new THREE.PointsMaterial({
            size: 0.08,
            vertexColors: true,
            transparent: true,
            opacity: 1,
            blending: THREE.AdditiveBlending,
            depthWrite: false
        });

        const particleSystem = new THREE.Points(geometry, material);
        this.scene.add(particleSystem);

        // 애니메이션
        const startTime = Date.now();
        const duration = 300;

        const animate = () => {
            const elapsed = Date.now() - startTime;
            const progress = elapsed / duration;

            if (progress < 1) {
                const positions = geometry.attributes.position.array;

                for (let i = 0; i < particleCount; i++) {
                    positions[i * 3] += velocities[i * 3] * 0.016;
                    positions[i * 3 + 1] += velocities[i * 3 + 1] * 0.016 - 0.05;
                    positions[i * 3 + 2] += velocities[i * 3 + 2] * 0.016;
                }

                geometry.attributes.position.needsUpdate = true;
                material.opacity = 1 - progress;

                requestAnimationFrame(animate);
            } else {
                this.scene.remove(particleSystem);
                geometry.dispose();
                material.dispose();
            }
        };

        animate();
    }

    // 쉘 케이스 방출 (탄피)
    createShellCasing(position, direction) {
        const geometry = new THREE.CylinderGeometry(0.02, 0.02, 0.1, 8);
        const material = new THREE.MeshStandardMaterial({
            color: 0xccaa66,
            metalness: 0.8,
            roughness: 0.2
        });

        const shell = new THREE.Mesh(geometry, material);
        shell.position.copy(position);
        shell.rotation.z = Math.PI / 2;
        shell.castShadow = true;

        // 오른쪽으로 튀어나가는 방향
        const right = new THREE.Vector3();
        right.crossVectors(direction, new THREE.Vector3(0, 1, 0)).normalize();

        const velocity = new THREE.Vector3(
            right.x * 2 + (Math.random() - 0.5),
            Math.random() * 3 + 2,
            right.z * 2 + (Math.random() - 0.5)
        );

        const angularVelocity = new THREE.Vector3(
            Math.random() * 0.3,
            Math.random() * 0.3,
            Math.random() * 0.3
        );

        this.scene.add(shell);

        // 물리 애니메이션
        const startTime = Date.now();
        const duration = 2000;

        const animate = () => {
            const elapsed = Date.now() - startTime;
            const progress = elapsed / duration;

            if (progress < 1 && shell.position.y > 0) {
                // 위치 업데이트
                shell.position.add(velocity.clone().multiplyScalar(0.016));

                // 중력
                velocity.y -= 0.3;

                // 회전
                shell.rotation.x += angularVelocity.x;
                shell.rotation.y += angularVelocity.y;
                shell.rotation.z += angularVelocity.z;

                // 바닥 충돌
                if (shell.position.y < 0.05) {
                    shell.position.y = 0.05;
                    velocity.y = Math.abs(velocity.y) * 0.3; // 바운스
                    velocity.x *= 0.8;
                    velocity.z *= 0.8;
                }

                requestAnimationFrame(animate);
            } else {
                // 페이드 아웃
                material.transparent = true;
                const fadeStart = Date.now();
                const fadeDuration = 500;

                const fadeOut = () => {
                    const fadeElapsed = Date.now() - fadeStart;
                    const fadeProgress = fadeElapsed / fadeDuration;

                    if (fadeProgress < 1) {
                        material.opacity = 1 - fadeProgress;
                        requestAnimationFrame(fadeOut);
                    } else {
                        this.scene.remove(shell);
                        geometry.dispose();
                        material.dispose();
                    }
                };

                fadeOut();
            }
        };

        animate();
    }
}
