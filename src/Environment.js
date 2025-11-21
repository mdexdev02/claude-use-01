import * as THREE from 'three';

export class Environment {
    constructor(scene) {
        this.scene = scene;
        this.collisionObjects = [];

        this.createGround();
        this.createBuildings();
        this.createProps();
        this.createWalls();
    }

    createGround() {
        // 상세한 지면 텍스처
        const groundSize = 200;
        const groundGeometry = new THREE.PlaneGeometry(groundSize, groundSize, 50, 50);

        // 지형에 약간의 노이즈 추가
        const vertices = groundGeometry.attributes.position.array;
        for (let i = 0; i < vertices.length; i += 3) {
            vertices[i + 2] = Math.random() * 0.3; // z 좌표에 랜덤 높이
        }
        groundGeometry.attributes.position.needsUpdate = true;
        groundGeometry.computeVertexNormals();

        const groundMaterial = new THREE.MeshStandardMaterial({
            color: 0x4a7c59,
            roughness: 0.8,
            metalness: 0.2,
        });

        const ground = new THREE.Mesh(groundGeometry, groundMaterial);
        ground.rotation.x = -Math.PI / 2;
        ground.receiveShadow = true;
        this.scene.add(ground);

        // 지면 충돌 박스
        const groundBox = new THREE.Box3(
            new THREE.Vector3(-groundSize / 2, -1, -groundSize / 2),
            new THREE.Vector3(groundSize / 2, 0, groundSize / 2)
        );
        this.collisionObjects.push(groundBox);
    }

    createBuildings() {
        // 건물 1: 큰 본부 건물
        this.createDetailedBuilding(
            new THREE.Vector3(30, 0, -30),
            { width: 15, height: 20, depth: 15 },
            0x8b7355
        );

        // 건물 2: 중간 크기 건물
        this.createDetailedBuilding(
            new THREE.Vector3(-40, 0, -20),
            { width: 12, height: 15, depth: 10 },
            0x6b5d52
        );

        // 건물 3: 작은 건물
        this.createDetailedBuilding(
            new THREE.Vector3(20, 0, 40),
            { width: 8, height: 10, depth: 8 },
            0x7a6b5d
        );

        // 건물 4: 긴 건물
        this.createDetailedBuilding(
            new THREE.Vector3(-30, 0, 30),
            { width: 20, height: 12, depth: 8 },
            0x8a7a6d
        );

        // 건물 5: 타워
        this.createDetailedBuilding(
            new THREE.Vector3(50, 0, 10),
            { width: 6, height: 25, depth: 6 },
            0x5d4e42
        );
    }

    createDetailedBuilding(position, size, color) {
        const buildingGroup = new THREE.Group();

        // 메인 건물 구조
        const buildingGeometry = new THREE.BoxGeometry(size.width, size.height, size.depth);
        const buildingMaterial = new THREE.MeshStandardMaterial({
            color: color,
            roughness: 0.7,
            metalness: 0.3,
        });
        const building = new THREE.Mesh(buildingGeometry, buildingMaterial);
        building.position.y = size.height / 2;
        building.castShadow = true;
        building.receiveShadow = true;
        buildingGroup.add(building);

        // 창문 추가
        const windowSize = 1.5;
        const windowSpacing = 2.5;
        const windowMaterial = new THREE.MeshStandardMaterial({
            color: 0x4a90e2,
            emissive: 0x2a5a92,
            emissiveIntensity: 0.3,
            metalness: 0.9,
            roughness: 0.1,
        });

        // 전면 창문
        for (let y = 2; y < size.height - 1; y += windowSpacing) {
            for (let x = -size.width / 2 + 2; x < size.width / 2 - 1; x += windowSpacing) {
                const windowGeometry = new THREE.BoxGeometry(windowSize, windowSize, 0.2);
                const window = new THREE.Mesh(windowGeometry, windowMaterial);
                window.position.set(x, y, size.depth / 2 + 0.1);
                buildingGroup.add(window);
            }
        }

        // 측면 창문
        for (let y = 2; y < size.height - 1; y += windowSpacing) {
            for (let z = -size.depth / 2 + 2; z < size.depth / 2 - 1; z += windowSpacing) {
                const windowGeometry = new THREE.BoxGeometry(0.2, windowSize, windowSize);
                const window = new THREE.Mesh(windowGeometry, windowMaterial);
                window.position.set(size.width / 2 + 0.1, y, z);
                buildingGroup.add(window);
            }
        }

        // 옥상 디테일
        const roofGeometry = new THREE.BoxGeometry(size.width + 1, 0.5, size.depth + 1);
        const roofMaterial = new THREE.MeshStandardMaterial({
            color: 0x3a3a3a,
            roughness: 0.6,
            metalness: 0.4,
        });
        const roof = new THREE.Mesh(roofGeometry, roofMaterial);
        roof.position.y = size.height + 0.25;
        roof.castShadow = true;
        buildingGroup.add(roof);

        // 에어컨 실외기 (옥상)
        for (let i = 0; i < 3; i++) {
            const acGeometry = new THREE.BoxGeometry(1, 1, 0.5);
            const acMaterial = new THREE.MeshStandardMaterial({ color: 0x7a7a7a });
            const ac = new THREE.Mesh(acGeometry, acMaterial);
            ac.position.set(
                (Math.random() - 0.5) * (size.width - 2),
                size.height + 1,
                (Math.random() - 0.5) * (size.depth - 2)
            );
            ac.castShadow = true;
            buildingGroup.add(ac);
        }

        buildingGroup.position.copy(position);
        this.scene.add(buildingGroup);

        // 충돌 박스 추가
        const buildingBox = new THREE.Box3(
            new THREE.Vector3(
                position.x - size.width / 2,
                position.y,
                position.z - size.depth / 2
            ),
            new THREE.Vector3(
                position.x + size.width / 2,
                position.y + size.height,
                position.z + size.depth / 2
            )
        );
        this.collisionObjects.push(buildingBox);
    }

    createProps() {
        // 나무들
        this.createTree(new THREE.Vector3(10, 0, 10));
        this.createTree(new THREE.Vector3(-15, 0, 15));
        this.createTree(new THREE.Vector3(25, 0, -10));
        this.createTree(new THREE.Vector3(-25, 0, -25));
        this.createTree(new THREE.Vector3(40, 0, 25));

        // 상자들 (엄폐물)
        this.createCrate(new THREE.Vector3(5, 0, 5));
        this.createCrate(new THREE.Vector3(-8, 0, -8));
        this.createCrate(new THREE.Vector3(15, 0, -15));
        this.createCrate(new THREE.Vector3(-20, 0, 10));

        // 배럴 (드럼통)
        this.createBarrel(new THREE.Vector3(12, 0, -5));
        this.createBarrel(new THREE.Vector3(-10, 0, 8));
        this.createBarrel(new THREE.Vector3(8, 0, -12));
    }

    createTree(position) {
        const treeGroup = new THREE.Group();

        // 나무 줄기
        const trunkGeometry = new THREE.CylinderGeometry(0.3, 0.4, 4, 8);
        const trunkMaterial = new THREE.MeshStandardMaterial({
            color: 0x4a3728,
            roughness: 0.9,
        });
        const trunk = new THREE.Mesh(trunkGeometry, trunkMaterial);
        trunk.position.y = 2;
        trunk.castShadow = true;
        treeGroup.add(trunk);

        // 나뭇잎 (여러 개의 구체로 구성)
        const foliageMaterial = new THREE.MeshStandardMaterial({
            color: 0x2d5016,
            roughness: 0.8,
        });

        for (let i = 0; i < 3; i++) {
            const foliageGeometry = new THREE.SphereGeometry(1.5 - i * 0.3, 8, 8);
            const foliage = new THREE.Mesh(foliageGeometry, foliageMaterial);
            foliage.position.y = 4 + i * 0.8;
            foliage.position.x = (Math.random() - 0.5) * 0.5;
            foliage.position.z = (Math.random() - 0.5) * 0.5;
            foliage.castShadow = true;
            treeGroup.add(foliage);
        }

        treeGroup.position.copy(position);
        this.scene.add(treeGroup);

        // 충돌 박스
        const treeBox = new THREE.Box3(
            new THREE.Vector3(position.x - 0.5, position.y, position.z - 0.5),
            new THREE.Vector3(position.x + 0.5, position.y + 4, position.z + 0.5)
        );
        this.collisionObjects.push(treeBox);
    }

    createCrate(position) {
        const crateSize = 2;
        const crateGeometry = new THREE.BoxGeometry(crateSize, crateSize, crateSize);
        const crateMaterial = new THREE.MeshStandardMaterial({
            color: 0x8b6914,
            roughness: 0.8,
            metalness: 0.1,
        });

        const crate = new THREE.Mesh(crateGeometry, crateMaterial);
        crate.position.copy(position);
        crate.position.y = crateSize / 2;
        crate.castShadow = true;
        crate.receiveShadow = true;

        // 나무 질감을 위한 라인 추가
        const edgesGeometry = new THREE.EdgesGeometry(crateGeometry);
        const edgesMaterial = new THREE.LineBasicMaterial({ color: 0x5a4a0f });
        const edges = new THREE.LineSegments(edgesGeometry, edgesMaterial);
        crate.add(edges);

        this.scene.add(crate);

        // 충돌 박스
        const crateBox = new THREE.Box3(
            new THREE.Vector3(position.x - crateSize / 2, position.y, position.z - crateSize / 2),
            new THREE.Vector3(position.x + crateSize / 2, position.y + crateSize, position.z + crateSize / 2)
        );
        this.collisionObjects.push(crateBox);
    }

    createBarrel(position) {
        const barrelGeometry = new THREE.CylinderGeometry(0.5, 0.5, 1.5, 16);
        const barrelMaterial = new THREE.MeshStandardMaterial({
            color: 0x8a8a8a,
            roughness: 0.4,
            metalness: 0.7,
        });

        const barrel = new THREE.Mesh(barrelGeometry, barrelMaterial);
        barrel.position.copy(position);
        barrel.position.y = 0.75;
        barrel.castShadow = true;
        barrel.receiveShadow = true;

        // 배럴 링 디테일
        const ringGeometry = new THREE.TorusGeometry(0.52, 0.05, 8, 16);
        const ringMaterial = new THREE.MeshStandardMaterial({
            color: 0x4a4a4a,
            metalness: 0.8,
        });

        const ring1 = new THREE.Mesh(ringGeometry, ringMaterial);
        ring1.rotation.x = Math.PI / 2;
        ring1.position.y = 0.3;
        barrel.add(ring1);

        const ring2 = ring1.clone();
        ring2.position.y = 1.2;
        barrel.add(ring2);

        this.scene.add(barrel);

        // 충돌 박스
        const barrelBox = new THREE.Box3(
            new THREE.Vector3(position.x - 0.5, position.y, position.z - 0.5),
            new THREE.Vector3(position.x + 0.5, position.y + 1.5, position.z + 0.5)
        );
        this.collisionObjects.push(barrelBox);
    }

    createWalls() {
        // 경계 벽들 (맵 끝)
        const wallHeight = 5;
        const wallThickness = 1;
        const mapSize = 100;

        const wallMaterial = new THREE.MeshStandardMaterial({
            color: 0x6b6b6b,
            roughness: 0.7,
            metalness: 0.2,
        });

        // 북쪽 벽
        const northWall = new THREE.Mesh(
            new THREE.BoxGeometry(mapSize, wallHeight, wallThickness),
            wallMaterial
        );
        northWall.position.set(0, wallHeight / 2, -mapSize / 2);
        northWall.castShadow = true;
        northWall.receiveShadow = true;
        this.scene.add(northWall);

        // 남쪽 벽
        const southWall = northWall.clone();
        southWall.position.z = mapSize / 2;
        this.scene.add(southWall);

        // 동쪽 벽
        const eastWall = new THREE.Mesh(
            new THREE.BoxGeometry(wallThickness, wallHeight, mapSize),
            wallMaterial
        );
        eastWall.position.set(mapSize / 2, wallHeight / 2, 0);
        eastWall.castShadow = true;
        eastWall.receiveShadow = true;
        this.scene.add(eastWall);

        // 서쪽 벽
        const westWall = eastWall.clone();
        westWall.position.x = -mapSize / 2;
        this.scene.add(westWall);

        // 충돌 박스 추가
        this.collisionObjects.push(
            new THREE.Box3(
                new THREE.Vector3(-mapSize / 2, 0, -mapSize / 2 - wallThickness / 2),
                new THREE.Vector3(mapSize / 2, wallHeight, -mapSize / 2 + wallThickness / 2)
            )
        );
        this.collisionObjects.push(
            new THREE.Box3(
                new THREE.Vector3(-mapSize / 2, 0, mapSize / 2 - wallThickness / 2),
                new THREE.Vector3(mapSize / 2, wallHeight, mapSize / 2 + wallThickness / 2)
            )
        );
        this.collisionObjects.push(
            new THREE.Box3(
                new THREE.Vector3(mapSize / 2 - wallThickness / 2, 0, -mapSize / 2),
                new THREE.Vector3(mapSize / 2 + wallThickness / 2, wallHeight, mapSize / 2)
            )
        );
        this.collisionObjects.push(
            new THREE.Box3(
                new THREE.Vector3(-mapSize / 2 - wallThickness / 2, 0, -mapSize / 2),
                new THREE.Vector3(-mapSize / 2 + wallThickness / 2, wallHeight, mapSize / 2)
            )
        );
    }

    getCollisionObjects() {
        return this.collisionObjects;
    }
}
