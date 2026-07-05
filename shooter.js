// Game Canvas Setup
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const gameContainer = document.getElementById('gameContainer');
const menu = document.getElementById('menu');
const gameOverScreen = document.getElementById('gameOverScreen');

canvas.width = gameContainer.offsetWidth;
canvas.height = gameContainer.offsetHeight;

// Game State
let gameRunning = false;
let gameDifficulty = 'medium';
let score = 0;
let enemiesKilled = 0;
let waveNumber = 1;

// Player Object
const player = {
    x: canvas.width / 2,
    y: canvas.height / 2,
    width: 25,
    height: 25,
    speed: 6,
    health: 100,
    maxHealth: 100,
    velocityX: 0,
    velocityY: 0,
    radius: 12,
    shoots: 0
};

// Game Arrays
let enemies = [];
let bullets = [];
let explosions = [];
let powerups = [];

// Input Handling
const keys = {};
const mouse = {
    x: canvas.width / 2,
    y: canvas.height / 2
};

window.addEventListener('keydown', (e) => {
    keys[e.key.toLowerCase()] = true;
});

window.addEventListener('keyup', (e) => {
    keys[e.key.toLowerCase()] = false;
});

document.addEventListener('mousemove', (e) => {
    const rect = canvas.getBoundingClientRect();
    mouse.x = e.clientX - rect.left;
    mouse.y = e.clientY - rect.top;
    
    const crosshair = document.getElementById('crosshair');
    crosshair.style.left = (mouse.x - 20) + 'px';
    crosshair.style.top = (mouse.y - 20) + 'px';
});

document.addEventListener('click', () => {
    if (gameRunning) shoot();
});

// Start Game
function startGame(difficulty) {
    gameDifficulty = difficulty;
    menu.style.display = 'none';
    gameContainer.classList.add('active');
    document.getElementById('crosshair').style.display = 'block';
    gameRunning = true;
    
    player.x = canvas.width / 2;
    player.y = canvas.height / 2;
    player.health = player.maxHealth;
    
    spawnWave();
    gameLoop();
}

// Enemy Class
class Enemy {
    constructor(x, y, type = 'basic') {
        this.x = x;
        this.y = y;
        this.type = type;
        this.width = this.getWidth();
        this.height = this.getHeight();
        this.health = this.getHealth();
        this.maxHealth = this.health;
        this.speed = this.getSpeed();
        this.color = this.getColor();
        this.shootTimer = Math.random() * 100;
        this.shootInterval = this.getShootInterval();
    }
    
    getWidth() {
        return this.type === 'tank' ? 35 : this.type === 'fast' ? 15 : 25;
    }
    
    getHeight() {
        return this.type === 'tank' ? 35 : this.type === 'fast' ? 15 : 25;
    }
    
    getHealth() {
        switch(this.type) {
            case 'tank': return 150;
            case 'fast': return 40;
            case 'shooter': return 60;
            default: return 100;
        }
    }
    
    getSpeed() {
        let baseSpeed;
        switch(this.type) {
            case 'tank': baseSpeed = 1; break;
            case 'fast': baseSpeed = 3.5; break;
            case 'shooter': baseSpeed = 1.5; break;
            default: baseSpeed = 2;
        }
        
        return baseSpeed * (1 + waveNumber * 0.1);
    }
    
    getColor() {
        switch(this.type) {
            case 'tank': return '#FF4444';
            case 'fast': return '#44FF44';
            case 'shooter': return '#4444FF';
            default: return '#FF6B6B';
        }
    }
    
    getShootInterval() {
        return this.type === 'shooter' ? 60 : Infinity;
    }
    
    update() {
        const dx = player.x - this.x;
        const dy = player.y - this.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        if (distance > 0) {
            this.x += (dx / distance) * this.speed;
            this.y += (dy / distance) * this.speed;
        }
        
        if (this.type === 'shooter') {
            this.shootTimer++;
            if (this.shootTimer > this.shootInterval) {
                this.shootTimer = 0;
                enemyShoot(this);
            }
        }
    }
    
    draw() {
        ctx.fillStyle = this.color;
        
        if (this.type === 'tank') {
            ctx.fillRect(this.x - this.width / 2, this.y - this.height / 2, this.width, this.height);
            ctx.fillStyle = '#FF0000';
            ctx.fillRect(this.x - 8, this.y - 8, 16, 16);
        } else if (this.type === 'fast') {
            ctx.beginPath();
            ctx.moveTo(this.x + this.width / 2, this.y);
            ctx.lineTo(this.x - this.width / 2, this.y + this.height / 2);
            ctx.lineTo(this.x - this.width / 2, this.y - this.height / 2);
            ctx.fill();
        } else {
            ctx.fillRect(this.x - this.width / 2, this.y - this.height / 2, this.width, this.height);
        }
        
        // Health bar
        const barWidth = this.width;
        const barHeight = 3;
        ctx.fillStyle = '#FF0000';
        ctx.fillRect(this.x - barWidth / 2, this.y - this.height / 2 - 10, barWidth, barHeight);
        ctx.fillStyle = '#00FF00';
        ctx.fillRect(this.x - barWidth / 2, this.y - this.height / 2 - 10, (this.health / this.maxHealth) * barWidth, barHeight);
    }
    
    isHit(bullet) {
        return (
            bullet.x > this.x - this.width / 2 &&
            bullet.x < this.x + this.width / 2 &&
            bullet.y > this.y - this.height / 2 &&
            bullet.y < this.y + this.height / 2
        );
    }
    
    collideWithPlayer() {
        return Math.hypot(this.x - player.x, this.y - player.y) < this.width;
    }
}

// Bullet Class
class Bullet {
    constructor(x, y, angle, isEnemy = false) {
        this.x = x;
        this.y = y;
        this.angle = angle;
        this.speed = isEnemy ? 5 : 8;
        this.radius = isEnemy ? 3 : 4;
        this.damage = isEnemy ? 15 : 25;
        this.isEnemy = isEnemy;
    }
    
    update() {
        this.x += Math.cos(this.angle) * this.speed;
        this.y += Math.sin(this.angle) * this.speed;
    }
    
    draw() {
        ctx.fillStyle = this.isEnemy ? '#FF4444' : '#00FF88';
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
        ctx.fill();
        
        if (!this.isEnemy) {
            ctx.strokeStyle = '#00FFFF';
            ctx.lineWidth = 1;
            ctx.stroke();
        }
    }
    
    isOutOfBounds() {
        return this.x < 0 || this.x > canvas.width || this.y < 0 || this.y > canvas.height;
    }
}

// Explosion Class
class Explosion {
    constructor(x, y, size = 20) {
        this.x = x;
        this.y = y;
        this.size = size;
        this.maxSize = size;
        this.opacity = 1;
        this.duration = 30;
        this.frame = 0;
    }
    
    update() {
        this.frame++;
        this.size = this.maxSize * (1 + this.frame / 10);
        this.opacity = 1 - (this.frame / this.duration);
    }
    
    draw() {
        ctx.fillStyle = `rgba(255, 165, 0, ${this.opacity})`;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.strokeStyle = `rgba(255, 69, 0, ${this.opacity})`;
        ctx.lineWidth = 2;
        ctx.stroke();
    }
    
    isDone() {
        return this.frame > this.duration;
    }
}

// Power-up Class
class PowerUp {
    constructor(x, y, type) {
        this.x = x;
        this.y = y;
        this.type = type;
        this.width = 20;
        this.height = 20;
        this.timer = 300;
    }
    
    update() {
        this.timer--;
        this.y += Math.sin(Date.now() / 1000) * 0.5;
    }
    
    draw() {
        ctx.fillStyle = this.type === 'health' ? '#FF6B6B' : '#FFD700';
        ctx.fillRect(this.x - this.width / 2, this.y - this.height / 2, this.width, this.height);
        ctx.fillStyle = 'white';
        ctx.font = 'bold 12px Arial';
        ctx.textAlign = 'center';
        ctx.fillText(this.type === 'health' ? '❤️' : '⚡', this.x, this.y + 4);
    }
    
    collideWithPlayer() {
        return Math.hypot(this.x - player.x, this.y - player.y) < this.width;
    }
}

// Functions
function shoot() {
    const angle = Math.atan2(mouse.y - player.y, mouse.x - player.x);
    const bullet = new Bullet(player.x, player.y, angle);
    bullets.push(bullet);
    player.shoots++;
}

function enemyShoot(enemy) {
    const angle = Math.atan2(player.y - enemy.y, player.x - enemy.x);
    const bullet = new Bullet(enemy.x, enemy.y, angle, true);
    bullets.push(bullet);
}

function spawnWave() {
    enemies = [];
    let enemyCount = Math.floor(3 + waveNumber * 1.5);
    let tankCount = Math.floor(waveNumber * 0.3);
    let fastCount = Math.floor(waveNumber * 0.4);
    let shooterCount = Math.floor(waveNumber * 0.2);
    
    for (let i = 0; i < enemyCount; i++) {
        let type = 'basic';
        if (tankCount > 0 && Math.random() < 0.3) {
            type = 'tank';
            tankCount--;
        } else if (fastCount > 0 && Math.random() < 0.4) {
            type = 'fast';
            fastCount--;
        } else if (shooterCount > 0 && Math.random() < 0.3) {
            type = 'shooter';
            shooterCount--;
        }
        
        let x, y, valid = false;
        while (!valid) {
            x = Math.random() * (canvas.width - 100) + 50;
            y = Math.random() * (canvas.height - 100) + 50;
            if (Math.hypot(x - player.x, y - player.y) > 150) valid = true;
        }
        
        enemies.push(new Enemy(x, y, type));
    }
    
    showWaveNotification();
}

function showWaveNotification() {
    const notification = document.getElementById('waveNotification');
    notification.textContent = `WAVE ${waveNumber}`;
    notification.style.opacity = '1';
    
    let alpha = 1;
    const interval = setInterval(() => {
        alpha -= 0.02;
        notification.style.opacity = alpha;
        if (alpha <= 0) clearInterval(interval);
    }, 50);
}

function updateHUD() {
    document.getElementById('playerHealth').textContent = Math.max(0, Math.round(player.health));
    document.getElementById('score').textContent = score;
    document.getElementById('enemyCount').textContent = enemies.length;
    document.getElementById('waveCount').textContent = waveNumber;
}

function updatePlayer() {
    player.velocityX = 0;
    player.velocityY = 0;
    
    if (keys['w'] || keys['arrowup']) player.velocityY -= player.speed;
    if (keys['s'] || keys['arrowdown']) player.velocityY += player.speed;
    if (keys['a'] || keys['arrowleft']) player.velocityX -= player.speed;
    if (keys['d'] || keys['arrowright']) player.velocityX += player.speed;
    
    player.x += player.velocityX;
    player.y += player.velocityY;
    
    // Boundary check
    if (player.x - player.radius < 0) player.x = player.radius;
    if (player.x + player.radius > canvas.width) player.x = canvas.width - player.radius;
    if (player.y - player.radius < 0) player.y = player.radius;
    if (player.y + player.radius > canvas.height) player.y = canvas.height - player.radius;
}

function drawPlayer() {
    ctx.fillStyle = '#00FF88';
    ctx.beginPath();
    ctx.arc(player.x, player.y, player.radius, 0, Math.PI * 2);
    ctx.fill();
    
    ctx.strokeStyle = '#00FFFF';
    ctx.lineWidth = 2;
    ctx.stroke();
    
    // Gun barrel
    const angle = Math.atan2(mouse.y - player.y, mouse.x - player.x);
    ctx.strokeStyle = '#00FF88';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(player.x, player.y);
    ctx.lineTo(
        player.x + Math.cos(angle) * 20,
        player.y + Math.sin(angle) * 20
    );
    ctx.stroke();
}

function endGame() {
    gameRunning = false;
    gameOverScreen.style.display = 'block';
    document.getElementById('finalScore').textContent = score;
    document.getElementById('enemiesKilled').textContent = enemiesKilled;
    document.getElementById('wavesSurvived').textContent = waveNumber - 1;
}

function gameLoop() {
    ctx.fillStyle = 'rgba(15, 52, 96, 0.2)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    if (!gameRunning) return;
    
    updatePlayer();
    
    // Update bullets
    for (let i = bullets.length - 1; i >= 0; i--) {
        bullets[i].update();
        
        if (bullets[i].isOutOfBounds()) {
            bullets.splice(i, 1);
            continue;
        }
        
        if (bullets[i].isEnemy) {
            if (Math.hypot(bullets[i].x - player.x, bullets[i].y - player.y) < player.radius) {
                player.health -= bullets[i].damage;
                explosions.push(new Explosion(bullets[i].x, bullets[i].y, 15));
                bullets.splice(i, 1);
                if (player.health <= 0) {
                    endGame();
                    return;
                }
            }
        } else {
            for (let j = enemies.length - 1; j >= 0; j--) {
                if (enemies[j].isHit(bullets[i])) {
                    enemies[j].health -= bullets[i].damage;
                    explosions.push(new Explosion(bullets[i].x, bullets[i].y));
                    bullets.splice(i, 1);
                    
                    if (enemies[j].health <= 0) {
                        score += enemies[j].type === 'tank' ? 500 : enemies[j].type === 'fast' ? 200 : enemies[j].type === 'shooter' ? 300 : 100;
                        enemiesKilled++;
                        explosions.push(new Explosion(enemies[j].x, enemies[j].y, 30));
                        
                        if (Math.random() < 0.15) {
                            powerups.push(new PowerUp(enemies[j].x, enemies[j].y, Math.random() < 0.6 ? 'health' : 'ammo'));
                        }
                        
                        enemies.splice(j, 1);
                    }
                    break;
                }
            }
        }
    }
    
    // Update enemies
    for (let i = 0; i < enemies.length; i++) {
        enemies[i].update();
        
        if (enemies[i].collideWithPlayer()) {
            player.health -= 0.5;
            if (player.health <= 0) {
                endGame();
                return;
            }
        }
    }
    
    // Update power-ups
    for (let i = powerups.length - 1; i >= 0; i--) {
        powerups[i].update();
        
        if (powerups[i].collideWithPlayer()) {
            if (powerups[i].type === 'health') {
                player.health = Math.min(player.health + 30, player.maxHealth);
            }
            powerups.splice(i, 1);
        } else if (powerups[i].timer <= 0) {
            powerups.splice(i, 1);
        }
    }
    
    // Update explosions
    for (let i = explosions.length - 1; i >= 0; i--) {
        explosions[i].update();
        if (explosions[i].isDone()) explosions.splice(i, 1);
    }
    
    // Check wave completion
    if (enemies.length === 0) {
        waveNumber++;
        spawnWave();
    }
    
    // Draw everything
    bullets.forEach(bullet => bullet.draw());
    enemies.forEach(enemy => enemy.draw());
    powerups.forEach(powerup => powerup.draw());
    explosions.forEach(explosion => explosion.draw());
    drawPlayer();
    
    updateHUD();
    requestAnimationFrame(gameLoop);
}

window.addEventListener('DOMContentLoaded', () => {
    document.getElementById('crosshair').style.display = 'none';
});
