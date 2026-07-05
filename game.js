// Game Canvas Setup
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const gameContainer = document.getElementById('gameContainer');
const menu = document.getElementById('menu');
const gameOverScreen = document.getElementById('gameOverScreen');

canvas.width = gameContainer.offsetWidth;
canvas.height = gameContainer.offsetHeight;

// Game Variables
let gameRunning = false;
let gameDifficulty = 'medium';
let score = 0;
let enemiesKilled = 0;

// Player Object
const player = {
    x: canvas.width / 2,
    y: canvas.height / 2,
    width: 20,
    height: 20,
    speed: 5,
    health: 100,
    maxHealth: 100,
    velocityX: 0,
    velocityY: 0,
    angle: 0
};

// Arrays for game objects
let enemies = [];
let bullets = [];

// Input handling
const keys = {
    w: false,
    a: false,
    s: false,
    d: false
};

const mouse = {
    x: canvas.width / 2,
    y: canvas.height / 2,
    clicked: false
};

// Event Listeners
window.addEventListener('keydown', (e) => {
    const key = e.key.toLowerCase();
    if (key === 'w') keys.w = true;
    if (key === 'a') keys.a = true;
    if (key === 's') keys.s = true;
    if (key === 'd') keys.d = true;
});

window.addEventListener('keyup', (e) => {
    const key = e.key.toLowerCase();
    if (key === 'w') keys.w = false;
    if (key === 'a') keys.a = false;
    if (key === 's') keys.s = false;
    if (key === 'd') keys.d = false;
});

document.addEventListener('mousemove', (e) => {
    const rect = canvas.getBoundingClientRect();
    mouse.x = e.clientX - rect.left;
    mouse.y = e.clientY - rect.top;
    
    // Update crosshair
    const crosshair = document.getElementById('crosshair');
    crosshair.style.left = (mouse.x - 15) + 'px';
    crosshair.style.top = (mouse.y - 15) + 'px';
});

document.addEventListener('mousedown', () => {
    if (gameRunning) {
        shoot();
    }
});

// Start Game Function
function startGame(difficulty) {
    gameDifficulty = difficulty;
    menu.style.display = 'none';
    gameContainer.classList.add('active');
    document.getElementById('crosshair').style.display = 'block';
    gameRunning = true;
    
    // Initialize enemies
    spawnEnemies();
    gameLoop();
}

// Enemy Class
class Enemy {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.width = 25;
        this.height = 25;
        this.health = 100;
        this.speed = this.getSpeed();
        this.color = '#FF6B6B';
    }
    
    getSpeed() {
        switch(gameDifficulty) {
            case 'easy': return 1.5;
            case 'medium': return 2.5;
            case 'hard': return 4;
            default: return 2.5;
        }
    }
    
    update() {
        // Chase player
        const dx = player.x - this.x;
        const dy = player.y - this.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        if (distance > 0) {
            this.x += (dx / distance) * this.speed;
            this.y += (dy / distance) * this.speed;
        }
    }
    
    draw() {
        ctx.fillStyle = this.color;
        ctx.fillRect(this.x - this.width / 2, this.y - this.height / 2, this.width, this.height);
        
        // Draw eyes
        ctx.fillStyle = 'white';
        ctx.fillRect(this.x - 8, this.y - 5, 4, 4);
        ctx.fillRect(this.x + 4, this.y - 5, 4, 4);
        
        // Draw pupils
        ctx.fillStyle = 'black';
        ctx.fillRect(this.x - 7, this.y - 4, 2, 2);
        ctx.fillRect(this.x + 5, this.y - 4, 2, 2);
        
        // Draw health bar
        const barWidth = this.width;
        const barHeight = 4;
        ctx.fillStyle = 'red';
        ctx.fillRect(this.x - barWidth / 2, this.y - this.height / 2 - 10, barWidth, barHeight);
        ctx.fillStyle = 'green';
        ctx.fillRect(this.x - barWidth / 2, this.y - this.height / 2 - 10, (this.health / 100) * barWidth, barHeight);
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
        return (
            Math.abs(player.x - this.x) < this.width &&
            Math.abs(player.y - this.y) < this.height
        );
    }
}

// Bullet Class
class Bullet {
    constructor(x, y, angle) {
        this.x = x;
        this.y = y;
        this.angle = angle;
        this.speed = 7;
        this.radius = 4;
        this.damage = 20;
    }
    
    update() {
        this.x += Math.cos(this.angle) * this.speed;
        this.y += Math.sin(this.angle) * this.speed;
    }
    
    draw() {
        ctx.fillStyle = '#FFD700';
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
        ctx.fill();
    }
    
    isOutOfBounds() {
        return this.x < 0 || this.x > canvas.width || this.y < 0 || this.y > canvas.height;
    }
}

// Shooting Function
function shoot() {
    const angle = Math.atan2(mouse.y - player.y, mouse.x - player.x);
    const bullet = new Bullet(player.x, player.y, angle);
    bullets.push(bullet);
}

// Spawn Enemies
function spawnEnemies() {
    enemies = [];
    let enemyCount;
    
    switch(gameDifficulty) {
        case 'easy': enemyCount = 3; break;
        case 'medium': enemyCount = 6; break;
        case 'hard': enemyCount = 10; break;
        default: enemyCount = 6;
    }
    
    for (let i = 0; i < enemyCount; i++) {
        let x, y;
        let valid = false;
        
        while (!valid) {
            x = Math.random() * (canvas.width - 100) + 50;
            y = Math.random() * (canvas.height - 100) + 50;
            
            // Ensure enemies spawn away from player
            if (Math.hypot(x - player.x, y - player.y) > 150) {
                valid = true;
            }
        }
        
        enemies.push(new Enemy(x, y));
    }
    
    updateEnemyCount();
}

// Update HUD
function updateHUD() {
    document.getElementById('playerHealth').textContent = player.health;
    document.getElementById('enemyCount').textContent = enemies.length;
    document.getElementById('score').textContent = score;
}

function updateEnemyCount() {
    document.getElementById('enemyCount').textContent = enemies.length;
}

// Update Player Position
function updatePlayer() {
    player.velocityX = 0;
    player.velocityY = 0;
    
    if (keys.w) player.velocityY -= player.speed;
    if (keys.s) player.velocityY += player.speed;
    if (keys.a) player.velocityX -= player.speed;
    if (keys.d) player.velocityX += player.speed;
    
    player.x += player.velocityX;
    player.y += player.velocityY;
    
    // Boundary check
    if (player.x - player.width / 2 < 0) player.x = player.width / 2;
    if (player.x + player.width / 2 > canvas.width) player.x = canvas.width - player.width / 2;
    if (player.y - player.height / 2 < 0) player.y = player.height / 2;
    if (player.y + player.height / 2 > canvas.height) player.y = canvas.height - player.height / 2;
}

// Draw Player
function drawPlayer() {
    // Draw body
    ctx.fillStyle = '#4A90E2';
    ctx.fillRect(player.x - player.width / 2, player.y - player.height / 2, player.width, player.height);
    
    // Draw gun barrel
    const barrelLength = 15;
    const angle = Math.atan2(mouse.y - player.y, mouse.x - player.x);
    ctx.strokeStyle = '#333';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(player.x, player.y);
    ctx.lineTo(
        player.x + Math.cos(angle) * barrelLength,
        player.y + Math.sin(angle) * barrelLength
    );
    ctx.stroke();
    
    // Draw eyes
    ctx.fillStyle = 'white';
    ctx.fillRect(player.x - 5, player.y - 5, 3, 3);
    ctx.fillRect(player.x + 2, player.y - 5, 3, 3);
    
    ctx.fillStyle = 'black';
    ctx.fillRect(player.x - 4, player.y - 4, 2, 2);
    ctx.fillRect(player.x + 3, player.y - 4, 2, 2);
}

// Game Over
function endGame() {
    gameRunning = false;
    gameOverScreen.style.display = 'block';
    document.getElementById('finalScore').textContent = score;
    document.getElementById('enemiesKilled').textContent = enemiesKilled;
}

// Game Loop
function gameLoop() {
    // Clear canvas
    ctx.fillStyle = 'rgba(135, 206, 235, 0.1)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    if (!gameRunning) return;
    
    // Update
    updatePlayer();
    
    // Update bullets
    for (let i = bullets.length - 1; i >= 0; i--) {
        bullets[i].update();
        
        if (bullets[i].isOutOfBounds()) {
            bullets.splice(i, 1);
            continue;
        }
        
        // Check collision with enemies
        for (let j = enemies.length - 1; j >= 0; j--) {
            if (enemies[j].isHit(bullets[i])) {
                enemies[j].health -= bullets[i].damage;
                bullets.splice(i, 1);
                
                if (enemies[j].health <= 0) {
                    score += 100;
                    enemiesKilled++;
                    enemies.splice(j, 1);
                    updateEnemyCount();
                    
                    // Spawn new enemy if all defeated
                    if (enemies.length === 0) {
                        spawnEnemies();
                    }
                }
                break;
            }
        }
    }
    
    // Update enemies
    for (let i = 0; i < enemies.length; i++) {
        enemies[i].update();
        
        // Check collision with player
        if (enemies[i].collideWithPlayer()) {
            player.health -= 0.5;
            if (player.health <= 0) {
                endGame();
                return;
            }
        }
    }
    
    // Draw
    drawPlayer();
    
    bullets.forEach(bullet => bullet.draw());
    enemies.forEach(enemy => enemy.draw());
    
    // Update HUD
    updateHUD();
    
    requestAnimationFrame(gameLoop);
}