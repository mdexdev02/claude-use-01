import * as THREE from 'three';
import { Game } from './Game.js';

// 게임 인스턴스
let game = null;

// 시작 화면 처리
document.getElementById('start-button').addEventListener('click', () => {
    document.getElementById('start-screen').style.display = 'none';

    // 게임 초기화 및 시작
    if (!game) {
        game = new Game();
    }

    game.start();
});

// 재시작 버튼
document.getElementById('restart-button').addEventListener('click', () => {
    document.getElementById('game-over').style.display = 'none';

    if (game) {
        game.restart();
    }
});

// 윈도우 리사이즈 처리
window.addEventListener('resize', () => {
    if (game) {
        game.onWindowResize();
    }
});
