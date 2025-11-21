export class UI {
    constructor(game) {
        this.game = game;

        // UI 요소들
        this.healthFill = document.getElementById('health-fill');
        this.currentAmmoDisplay = document.getElementById('current-ammo');
        this.totalAmmoDisplay = document.getElementById('total-ammo');
        this.killsDisplay = document.getElementById('kills');

        // 초기화
        this.updateHealth(100);
        this.updateAmmo(30, 120);
        this.updateKills(0);
    }

    updateHealth(health) {
        const healthPercent = Math.max(0, Math.min(100, health));
        this.healthFill.style.width = healthPercent + '%';

        // 체력에 따라 색상 변경
        if (healthPercent > 50) {
            this.healthFill.style.background = 'linear-gradient(90deg, #00ff00, #7fff7f)';
        } else if (healthPercent > 25) {
            this.healthFill.style.background = 'linear-gradient(90deg, #ffff00, #ffff7f)';
        } else {
            this.healthFill.style.background = 'linear-gradient(90deg, #ff0000, #ff6b6b)';
        }

        // 체력이 낮을 때 화면 효과
        if (healthPercent < 30) {
            this.showLowHealthEffect();
        }
    }

    showLowHealthEffect() {
        // 화면 가장자리를 빨갛게 표시
        const vignette = document.createElement('div');
        vignette.style.position = 'fixed';
        vignette.style.top = '0';
        vignette.style.left = '0';
        vignette.style.width = '100%';
        vignette.style.height = '100%';
        vignette.style.background = 'radial-gradient(circle, transparent 50%, rgba(255, 0, 0, 0.3) 100%)';
        vignette.style.pointerEvents = 'none';
        vignette.style.zIndex = '50';
        vignette.style.animation = 'pulse 1s infinite';
        vignette.id = 'low-health-vignette';

        // 기존 비네트 제거
        const existingVignette = document.getElementById('low-health-vignette');
        if (existingVignette) {
            existingVignette.remove();
        }

        document.body.appendChild(vignette);

        // CSS 애니메이션 추가
        if (!document.getElementById('pulse-animation')) {
            const style = document.createElement('style');
            style.id = 'pulse-animation';
            style.textContent = `
                @keyframes pulse {
                    0%, 100% { opacity: 0.3; }
                    50% { opacity: 0.6; }
                }
            `;
            document.head.appendChild(style);
        }
    }

    removeLowHealthEffect() {
        const vignette = document.getElementById('low-health-vignette');
        if (vignette) {
            vignette.remove();
        }
    }

    updateAmmo(current, total) {
        this.currentAmmoDisplay.textContent = current;
        this.totalAmmoDisplay.textContent = total;

        // 탄약이 부족할 때 색상 변경
        if (current === 0) {
            this.currentAmmoDisplay.style.color = '#ff0000';
        } else if (current < 10) {
            this.currentAmmoDisplay.style.color = '#ffff00';
        } else {
            this.currentAmmoDisplay.style.color = '#ffffff';
        }
    }

    updateKills(kills) {
        this.killsDisplay.textContent = kills;

        // 킬 카운트가 증가할 때 애니메이션
        if (kills > 0) {
            this.killsDisplay.style.transform = 'scale(1.5)';
            this.killsDisplay.style.color = '#ffaa00';

            setTimeout(() => {
                this.killsDisplay.style.transform = 'scale(1)';
                this.killsDisplay.style.color = '#ffffff';
            }, 300);
        }
    }

    showHitMarker() {
        const hitMarker = document.createElement('div');
        hitMarker.style.position = 'fixed';
        hitMarker.style.top = '50%';
        hitMarker.style.left = '50%';
        hitMarker.style.transform = 'translate(-50%, -50%)';
        hitMarker.style.width = '30px';
        hitMarker.style.height = '30px';
        hitMarker.style.pointerEvents = 'none';
        hitMarker.style.zIndex = '999';
        hitMarker.innerHTML = `
            <svg width="30" height="30" viewBox="0 0 30 30">
                <line x1="5" y1="15" x2="12" y2="15" stroke="white" stroke-width="2"/>
                <line x1="18" y1="15" x2="25" y2="15" stroke="white" stroke-width="2"/>
                <line x1="15" y1="5" x2="15" y2="12" stroke="white" stroke-width="2"/>
                <line x1="15" y1="18" x2="15" y2="25" stroke="white" stroke-width="2"/>
            </svg>
        `;

        document.body.appendChild(hitMarker);

        setTimeout(() => {
            document.body.removeChild(hitMarker);
        }, 100);
    }

    showMessage(message, duration = 3000) {
        const messageElement = document.createElement('div');
        messageElement.style.position = 'fixed';
        messageElement.style.top = '50%';
        messageElement.style.left = '50%';
        messageElement.style.transform = 'translate(-50%, -50%)';
        messageElement.style.padding = '20px 40px';
        messageElement.style.background = 'rgba(0, 0, 0, 0.8)';
        messageElement.style.color = 'white';
        messageElement.style.fontSize = '24px';
        messageElement.style.borderRadius = '10px';
        messageElement.style.zIndex = '1000';
        messageElement.style.pointerEvents = 'none';
        messageElement.textContent = message;

        document.body.appendChild(messageElement);

        setTimeout(() => {
            document.body.removeChild(messageElement);
        }, duration);
    }
}
