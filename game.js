// ==================== SETUP INICIAL ====================
const canvas = document.getElementById('game-canvas');
const ctx = canvas.getContext('2d');
canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

const game = {
    state: 'start',
    currentLevel: 1,
    housesExplored: new Set([1]),
    codesCollected: [],
    chestsOpened: 0,
    inventory: [],
    flashlightOn: false,
    flashlightBattery: 100,
    entityActive: false,
    secretDoorsUnlocked: [],
    deathLocation: null,
    maxStamina: 100,
    currentStamina: 100,
    staminaRegenRate: 0.3,
    isRunning: false,
    hasGun: false,
    ammo: 0,
    bullets: [],
    hasDetector: false,
    detectorCooldown: 0,
    entitiesInLevel: 1,
    levelStartTime: 0,
    spawnedPasswords: {},
    currentPassword: null
};

const player = {
    x: 100,
    y: 100,
    size: 16,
    speed: 4.5,
    runSpeed: 7.5,
    angle: 0,
    direction: 'down'
};

let entities = [];

// Controles
const keys = {};
window.addEventListener('keydown', (e) => {
    keys[e.key.toLowerCase()] = true;
    
    if (e.key.toLowerCase() === 'f' && game.currentLevel >= 3) {
        if (game.flashlightBattery > 0) {
            game.flashlightOn = !game.flashlightOn;
            updateFlashlight();
        } else {
            showMessage(getTranslation('flashlight-empty'));
        }
    }
    
    if (e.key.toLowerCase() === 'e') {
        checkInteraction();
    }
});
window.addEventListener('keyup', (e) => keys[e.key.toLowerCase()] = false);

canvas.addEventListener('click', (e) => {
    if (game.state === 'playing' && game.hasGun && game.ammo > 0) {
        const rect = canvas.getBoundingClientRect();
        const mouseX = e.clientX - rect.left;
        const mouseY = e.clientY - rect.top;
        
        const angle = Math.atan2(mouseY - player.y, mouseX - player.x);
        game.bullets.push({
            x: player.x,
            y: player.y,
            vx: Math.cos(angle) * 10,
            vy: Math.sin(angle) * 10,
            size: 5
        });
        
        game.ammo--;
        updateHUD();
    }
});

// ==================== FUNÇÕES DE DESENHO PIXEL ART ====================

function drawPlayer(x, y) {
    const pixelSize = 2;
    
    ctx.fillStyle = '#3366cc';
    ctx.fillRect(x - 4 * pixelSize, y - 2 * pixelSize, 8 * pixelSize, 6 * pixelSize);
    
    ctx.fillStyle = '#ffcc99';
    ctx.fillRect(x - 3 * pixelSize, y - 6 * pixelSize, 6 * pixelSize, 4 * pixelSize);
    
    ctx.fillStyle = '#4a2511';
    ctx.fillRect(x - 3 * pixelSize, y - 8 * pixelSize, 6 * pixelSize, 3 * pixelSize);
    
    ctx.fillStyle = '#1a1a1a';
    ctx.fillRect(x - 4 * pixelSize, y - 9 * pixelSize, 8 * pixelSize, 2 * pixelSize);
    
    ctx.fillStyle = '#ffcc99';
    ctx.fillRect(x - 2 * pixelSize, y - 5 * pixelSize, 1 * pixelSize, 3 * pixelSize);
    ctx.fillRect(x + 1 * pixelSize, y - 5 * pixelSize, 1 * pixelSize, 3 * pixelSize);
    
    if (game.flashlightOn && game.currentLevel >= 3) {
        ctx.fillStyle = 'rgba(255, 255, 100, 0.3)';
        ctx.beginPath();
        ctx.arc(x, y, 150, -Math.PI / 4, Math.PI / 4);
        ctx.lineTo(x, y);
        ctx.fill();
    }
}

function drawBookshelf(x, y, width, height) {
    const pixelSize = 2;
    
    // Estrutura da estante (marrom escuro)
    ctx.fillStyle = '#4a2511';
    ctx.fillRect(x, y, width, height);
    
    // Prateleiras
    ctx.fillStyle = '#2a1508';
    for (let i = 1; i < 4; i++) {
        ctx.fillRect(x, y + (height / 4) * i, width, pixelSize);
    }
    
    // Livros coloridos
    const bookColors = ['#8b0000', '#00008b', '#006400', '#8b4513', '#4b0082'];
    const timeSeed = Math.floor(Date.now() / 5000);
    for (let shelf = 0; shelf < 4; shelf++) {
        for (let book = 0; book < Math.floor(width / (4 * pixelSize)); book++) {
            const colorIndex = (Math.floor(x) + Math.floor(y) + shelf * 10 + book * 3 + timeSeed) % bookColors.length;
            ctx.fillStyle = bookColors[colorIndex];
            ctx.fillRect(
                x + book * 4 * pixelSize + pixelSize,
                y + shelf * (height / 4) + 2 * pixelSize,
                3 * pixelSize,
                (height / 4) - 4 * pixelSize
            );
        }
    }
}

function drawWall(x, y, width, height) {
    ctx.fillStyle = '#3a2a1a';
    ctx.fillRect(x, y, width, height);
    ctx.strokeStyle = '#2a1a0a';
    ctx.lineWidth = 2;
    ctx.strokeRect(x, y, width, height);
}

function drawEntity(x, y) {
    const pixelSize = 2;
    
    ctx.fillStyle = '#ff6b9d';
    ctx.globalAlpha = 0.8;
    
    // Cabeça
    ctx.fillRect(x - 5 * pixelSize, y - 8 * pixelSize, 10 * pixelSize, 8 * pixelSize);
    
    // Corpo
    ctx.fillRect(x - 6 * pixelSize, y, 12 * pixelSize, 8 * pixelSize);
    
    // Olhos brilhantes
    ctx.fillStyle = '#ffff00';
    ctx.fillRect(x - 4 * pixelSize, y - 6 * pixelSize, 2 * pixelSize, 2 * pixelSize);
    ctx.fillRect(x + 2 * pixelSize, y - 6 * pixelSize, 2 * pixelSize, 2 * pixelSize);
    
    ctx.globalAlpha = 1.0;
}

function drawSpiderweb(x, y, size) {
    ctx.strokeStyle = 'rgba(200, 200, 200, 0.3)';
    ctx.lineWidth = 1;
    
    for (let i = 0; i < 8; i++) {
        const angle = (i / 8) * Math.PI * 2;
        ctx.beginPath();
        ctx.moveTo(x, y);
        ctx.lineTo(x + Math.cos(angle) * size, y + Math.sin(angle) * size);
        ctx.stroke();
    }
    
    for (let i = 0; i < 3; i++) {
        ctx.beginPath();
        ctx.arc(x, y, (i + 1) * (size / 3), 0, Math.PI * 2);
        ctx.stroke();
    }
}

function drawSkull(x, y) {
    ctx.fillStyle = 'rgba(255, 255, 255, 0.1)';
    ctx.fillRect(x - 15, y - 20, 30, 40);
    
    ctx.fillStyle = 'rgba(100, 100, 100, 0.15)';
    ctx.fillRect(x - 10, y - 15, 8, 8);
    ctx.fillRect(x + 2, y - 15, 8, 8);
}

function drawPumpkin(x, y) {
    ctx.fillStyle = '#ff8800';
    ctx.fillRect(x - 8, y - 10, 16, 20);
    
    ctx.fillStyle = '#2a2a2a';
    ctx.fillRect(x - 2, y - 5, 4, 6);
    ctx.fillRect(x - 4, y, 3, 3);
    ctx.fillRect(x + 1, y, 3, 3);
}

function checkBookshelfCollision(x, y) {
    const level = levels[game.currentLevel];
    if (!level.bookshelves) return false;
    
    for (let shelf of level.bookshelves) {
        if (x > shelf.x - 20 && x < shelf.x + shelf.width + 20 &&
            y > shelf.y - 20 && y < shelf.y + shelf.height + 20) {
            return true;
        }
    }
    return false;
}

function checkWallCollision(x, y) {
    const level = levels[game.currentLevel];
    if (!level.walls) return false;
    
    for (let wall of level.walls) {
        if (x > wall.x - 20 && x < wall.x + wall.width + 20 &&
            y > wall.y - 20 && y < wall.y + wall.height + 20) {
            return true;
        }
    }
    return false;
}

function drawBullet(bullet) {
    ctx.fillStyle = '#ffff00';
    ctx.fillRect(bullet.x - bullet.size / 2, bullet.y - bullet.size / 2, bullet.size, bullet.size);
}

function showMessage(text) {
    const messageBox = document.getElementById('message-box');
    messageBox.textContent = text;
    messageBox.style.display = 'block';
    setTimeout(() => messageBox.style.display = 'none', 3000);
}

function updateHUD() {
    document.getElementById('current-level').textContent = game.currentLevel;
    document.getElementById('houses-explored').textContent = game.housesExplored.size;
    document.getElementById('codes-collected').textContent = game.codesCollected.length;
    document.getElementById('chests-opened').textContent = game.chestsOpened;
    
    let inventoryText = 'Inventário: ';
    if (game.hasGun) {
        inventoryText += `Arma (${game.ammo} munição) `;
    }
    if (game.hasDetector) {
        inventoryText += 'Detector ';
    }
    if (game.inventory.length > 0) {
        inventoryText += `Itens (${game.inventory.length}) `;
    }
    document.getElementById('inventory-content').textContent = inventoryText || 'Vazio';
}

// Atualizando overlay da lanterna na função render
let mouseX = window.innerWidth / 2;
let mouseY = window.innerHeight / 2;

document.addEventListener('mousemove', (e) => {
    mouseX = e.clientX;
    mouseY = e.clientY;
});

function updateFlashlightPosition() {
    const overlay = document.getElementById('flashlight-overlay');
    if (game.flashlightOn && game.currentLevel >= 3) {
        overlay.style.setProperty('--flashlight-x', mouseX + 'px');
        overlay.style.setProperty('--flashlight-y', mouseY + 'px');
    }
}

function updateFlashlight() {
    const overlay = document.getElementById('flashlight-overlay');
    const battery = document.getElementById('flashlight-battery');
    
    if (!game.flashlightOn && game.currentLevel >= 3) {
        overlay.style.display = 'block';
        battery.style.display = 'block';
    } else if (game.flashlightOn && game.currentLevel >= 3 && game.flashlightBattery > 0) {
        overlay.style.display = 'block';
        battery.style.display = 'block';
    } else {
        overlay.style.display = 'none';
        battery.style.display = 'none';
    }
}

function updateFlashlightBattery() {
    if (game.flashlightOn && game.currentLevel >= 3) {
        game.flashlightBattery -= 0.1;
        if (game.flashlightBattery <= 0) {
            game.flashlightOn = false;
            game.flashlightBattery = 0;
            updateFlashlight();
            showMessage(getTranslation('flashlight-empty'));
        }
        document.getElementById('battery-level').textContent = Math.floor(game.flashlightBattery);
    }
}

function checkInteraction() {
    const level = levels[game.currentLevel];
    const dist = 50;
    
    // Verificar se está perto de uma porta
    for (let door of level.doors) {
        if (Math.hypot(player.x - door.x, player.y - door.y) < dist) {
            // Se a porta não está trancada, pode passar diretamente
            if (!door.locked) {
                if (door.leadsTo === "exit") {
                    victory();
                } else {
                    changeLevel(door.leadsTo);
                }
                return;
            }
            
            // Se está trancada, verificar se tem a senha
            if (!game.spawnedPasswords[game.currentLevel]) {
                showMessage("Nenhuma senha encontrada! Procure no chão.");
                return;
            }
            
            game.currentPassword = game.spawnedPasswords[game.currentLevel];
            document.getElementById('password-screen').style.display = 'flex';
            document.getElementById('password-input').value = '';
            document.getElementById('password-error').textContent = '';
            document.getElementById('password-input').focus();
            return;
        }
    }
    
    // Verificar coleta de itens
    for (let item of level.items) {
        if (Math.hypot(player.x - item.x, player.y - item.y) < 30) {
            if (item.type === 'note') {
                showMessage(item.content);
            } else if (item.type === 'battery') {
                game.flashlightBattery = Math.min(100, game.flashlightBattery + 50);
                showMessage(item.content);
                level.items.splice(level.items.indexOf(item), 1);
            } else if (item.type === 'flashlight') {
                game.currentLevel >= 3 && (game.currentLevel = game.currentLevel);
                showMessage(getTranslation('flashlight-hint'));
                level.items.splice(level.items.indexOf(item), 1);
            } else if (item.type === 'code') {
                game.codesCollected.push(item.code);
                showMessage(item.content);
                level.items.splice(level.items.indexOf(item), 1);
            } else if (item.type === 'password') {
                game.spawnedPasswords[game.currentLevel] = item.code;
                showMessage(`Senha encontrada: ${item.code}`);
                level.items.splice(level.items.indexOf(item), 1);
            }
            updateHUD();
            return;
        }
    }
    
    // Verificar baús
    for (let chest of level.chests) {
        if (Math.hypot(player.x - chest.x, player.y - chest.y) < 30) {
            if (chest.locked && chest.code) {
                const correctCode = game.codesCollected.includes(chest.code);
                if (correctCode) {
                    chest.locked = false;
                    game.chestsOpened++;
                    game.inventory.push(chest.content);
                    showMessage(chest.content);
                    updateHUD();
                } else {
                    showMessage("Este baú está trancado. Procure uma chave.");
                }
            }
            return;
        }
    }
    
    // Verificar gun
    if (level.gun) {
        if (Math.hypot(player.x - level.gun.x, player.y - level.gun.y) < 30) {
            game.hasGun = true;
            game.ammo = 30;
            showMessage(getTranslation('gun-label'));
            level.gun = null;
            updateHUD();
            return;
        }
    }
}

function findPathToPlayer(entityX, entityY, level) {
    const dx = player.x - entityX;
    const dy = player.y - entityY;
    const dist = Math.hypot(dx, dy);
    
    if (dist === 0) return { x: 0, y: 0 };
    
    let moveX = (dx / dist);
    let moveY = (dy / dist);
    
    // Verificar se pode se mover diretamente
    const testX = entityX + moveX * entity.speed;
    const testY = entityY + moveY * entity.speed;
    
    if (!checkBookshelfCollision(testX, testY) && !checkWallCollision(testX, testY)) {
        return { x: moveX, y: moveY };
    }
    
    // Se há obstáculo, tentar contorná-lo
    const alternatives = [
        { x: moveX, y: 0 },
        { x: 0, y: moveY },
        { x: moveX * 0.707, y: moveY * 0.707 },
        { x: -moveY, y: moveX },
        { x: moveY, y: -moveX }
    ];
    
    for (let alt of alternatives) {
        const altX = entityX + alt.x * entity.speed;
        const altY = entityY + alt.y * entity.speed;
        if (!checkBookshelfCollision(altX, altY) && !checkWallCollision(altX, altY)) {
            return alt;
        }
    }
    
    return { x: 0, y: 0 };
}

function updatePlayer() {
    let dx = 0;
    let dy = 0;
    
    if (keys['w'] || keys['arrowup']) {
        dy -= 1;
        player.direction = 'up';
    }
    if (keys['s'] || keys['arrowdown']) {
        dy += 1;
        player.direction = 'down';
    }
    if (keys['a'] || keys['arrowleft']) {
        dx -= 1;
        player.direction = 'left';
    }
    if (keys['d'] || keys['arrowright']) {
        dx += 1;
        player.direction = 'right';
    }
    
    if (dx !== 0 && dy !== 0) {
        dx *= 0.707;
        dy *= 0.707;
    }
    
    let currentSpeed = player.speed;
    game.isRunning = false;
    
    if (keys['shift'] && (dx !== 0 || dy !== 0) && game.currentStamina > 0) {
        currentSpeed = player.runSpeed;
        game.isRunning = true;
        game.currentStamina -= 0.5;
        if (game.currentStamina < 0) game.currentStamina = 0;
    } else if (!game.isRunning && game.currentStamina < game.maxStamina) {
        game.currentStamina += game.staminaRegenRate;
        if (game.currentStamina > game.maxStamina) game.currentStamina = game.maxStamina;
    }
    
    const newX = player.x + dx * currentSpeed;
    const newY = player.y + dy * currentSpeed;
    
    if (!checkBookshelfCollision(newX, newY) && !checkWallCollision(newX, newY)) {
        player.x = newX;
        player.y = newY;
    }
    
    player.x = Math.max(player.size + 20, Math.min(canvas.width - player.size - 20, player.x));
    player.y = Math.max(player.size + 20, Math.min(canvas.height - player.size - 20, player.y));
    
    if (dx !== 0 || dy !== 0) {
        player.angle = Math.atan2(dy, dx);
    }
}

function updateBullets() {
    const level = levels[game.currentLevel];
    
    for (let i = game.bullets.length - 1; i >= 0; i--) {
        const bullet = game.bullets[i];
        bullet.x += bullet.vx;
        bullet.y += bullet.vy;
        
        if (bullet.x < 0 || bullet.x > canvas.width || bullet.y < 0 || bullet.y > canvas.height) {
            game.bullets.splice(i, 1);
            continue;
        }
        
        let hitWall = false;
        if (level.walls) {
            for (let wall of level.walls) {
                if (bullet.x > wall.x && bullet.x < wall.x + wall.width &&
                    bullet.y > wall.y && bullet.y < wall.y + wall.height) {
                    hitWall = true;
                    break;
                }
            }
        }
        
        if (!hitWall && level.bookshelves) {
            for (let shelf of level.bookshelves) {
                if (bullet.x > shelf.x && bullet.x < shelf.x + shelf.width &&
                    bullet.y > shelf.y && bullet.y < shelf.y + shelf.height) {
                    hitWall = true;
                    break;
                }
            }
        }
        
        if (hitWall) {
            game.bullets.splice(i, 1);
            continue;
        }
        
        for (let j = entities.length - 1; j >= 0; j--) {
            const ent = entities[j];
            if (ent.active) {
                const dist = Math.hypot(bullet.x - ent.x, bullet.y - ent.y);
                if (dist < ent.size) {
                    ent.x = Math.random() * canvas.width;
                    ent.y = Math.random() * canvas.height;
                    
                    while (Math.hypot(player.x - ent.x, player.y - ent.y) < 300) {
                        ent.x = Math.random() * canvas.width;
                        ent.y = Math.random() * canvas.height;
                    }
                    
                    game.bullets.splice(i, 1);
                    showMessage(getTranslation('gun-hit'));
                    break;
                }
            }
        }
    }
}

function updateEntities() {
    for (let ent of entities) {
        if (!ent.active) continue;
        
        const dx = player.x - ent.x;
        const dy = player.y - ent.y;
        const dist = Math.hypot(dx, dy);
        
        const path = findPathToPlayer(ent.x, ent.y, levels[game.currentLevel]);
        const newX = ent.x + path.x * ent.speed;
        const newY = ent.y + path.y * ent.speed;
        
        if (!checkBookshelfCollision(newX, ent.y) && !checkWallCollision(newX, ent.y)) {
            ent.x = newX;
        }
        if (!checkBookshelfCollision(ent.x, newY) && !checkWallCollision(ent.x, newY)) {
            ent.y = newY;
        }
        
        if (dist < player.size + ent.size) {
            gameOver();
            return;
        }
    }
}

function getRandomValidPosition(level) {
    let x, y;
    let attempts = 0;
    const maxAttempts = 100;
    
    do {
        x = Math.random() * (canvas.width - 100) + 50;
        y = Math.random() * (canvas.height - 100) + 50;
        attempts++;
    } while ((checkBookshelfCollision(x, y) || checkWallCollision(x, y)) && attempts < maxAttempts);
    
    return { x, y };
}

function changeLevel(newLevel) {
    game.currentLevel = newLevel;
    game.housesExplored.add(newLevel);
    
    const spawnPositions = {
        1: { x: 100, y: 100 },
        2: { x: 100, y: canvas.height / 2 },
        3: { x: 100, y: 100 },
        4: { x: canvas.width / 2, y: canvas.height - 100 },
        5: { x: 100, y: canvas.height / 2 },
        6: { x: 100, y: canvas.height / 2 },
        7: { x: 100, y: canvas.height / 2 },
        8: { x: canvas.width / 2, y: canvas.height - 100 }
    };
    
    player.x = spawnPositions[newLevel].x;
    player.y = spawnPositions[newLevel].y;
    
    if (levels[newLevel].entitySpawn) {
        // Limpar entidades antigas e criar novas
        entities = [];
        const pos = getRandomValidPosition(levels[newLevel]);
        entities.push({
            x: pos.x,
            y: pos.y,
            size: 20,
            speed: 1.8 + (newLevel * 0.2), // Aumenta velocidade conforme o nível
            active: true
        });
    }
    
    updateHUD();
    updateFlashlight();
    showMessage(`Você entrou em: ${levels[newLevel].name}`);
}

function startGame() {
    document.getElementById('start-screen').style.display = 'none';
    game.state = 'playing';
    game.levelStartTime = Date.now();
    
    // Resetar o jogo
    game.currentLevel = 1;
    game.housesExplored = new Set([1]);
    game.codesCollected = [];
    game.chestsOpened = 0;
    game.inventory = [];
    game.flashlightOn = false;
    game.flashlightBattery = 100;
    game.secretDoorsUnlocked = [];
    game.deathLocation = null;
    game.currentStamina = 100;
    game.isRunning = false;
    game.hasGun = false;
    game.ammo = 0;
    game.bullets = [];
    game.hasDetector = false;
    game.detectorCooldown = 0;
    game.spawnedPasswords = {};
    
    changeLevel(1);
    gameLoop();
}

function gameOver() {
    game.state = 'gameOver';
    game.deathLocation = { x: player.x, y: player.y, level: game.currentLevel };
    document.getElementById('game-over-screen').style.display = 'flex';
}

function victory() {
    game.state = 'victory';
    document.getElementById('victory-screen').style.display = 'flex';
}

function nextLevel() {
    game.currentLevel++;
    game.housesExplored.add(game.currentLevel);
    
    if (game.currentLevel > 8) {
        document.getElementById('victory-screen').style.display = 'flex';
        game.state = 'victory';
        return;
    }
    
    game.levelStartTime = Date.now();
    changeLevel(game.currentLevel);
}

// ==================== DEFINIÇÃO DOS NÍVEIS ====================
const levels = {
    1: {
        name: "Entrada da Livraria",
        bgColor: "#2a1a1a",
        wallColor: "#4a2a1a",
        floorColor: "#3a2a1a",
        walls: [],
        bookshelves: [
            // Estantes nas bordas
            { x: 0, y: 0, width: canvas.width, height: 40 },
            { x: 0, y: canvas.height - 40, width: canvas.width, height: 40 },
            { x: 0, y: 0, width: 40, height: canvas.height },
            { x: canvas.width - 40, y: 0, width: 40, height: canvas.height },
            
            // Labirinto simples
            { x: canvas.width * 0.2, y: canvas.height * 0.2, width: 120, height: 40 },
            { x: canvas.width * 0.6, y: canvas.height * 0.4, width: 120, height: 40 },
            { x: canvas.width * 0.3, y: canvas.height * 0.6, width: 120, height: 40 }
        ],
        doors: [
            { x: canvas.width - 50, y: canvas.height / 2, width: 40, height: 80, locked: false, leadsTo: 2, label: "→ Setor 2" }
        ],
        items: [
            { x: canvas.width * 0.2, y: canvas.height * 0.35, type: "note", content: "Nota: 'Esta livraria guarda segredos sombrios. Procure pelos baús escondidos entre as estantes.'" },
            { x: canvas.width * 0.75, y: canvas.height * 0.55, type: "battery", content: "Pilha encontrada! +50% de bateria" },
            { x: canvas.width * 0.5, y: canvas.height * 0.65, type: "password", code: "2001" }
        ],
        chests: [],
        entitySpawn: false
    },
    2: {
        name: "Corredor dos Livros Antigos",
        bgColor: "#1a1a1a",
        wallColor: "#2a2a2a",
        floorColor: "#1a1a1a",
        walls: [],
        bookshelves: [
            // Estantes nas bordas
            { x: 0, y: 0, width: canvas.width, height: 40 },
            { x: 0, y: canvas.height - 40, width: canvas.width, height: 40 },
            { x: 0, y: 0, width: 40, height: canvas.height },
            { x: canvas.width - 40, y: 0, width: 40, height: canvas.height },
            
            // Labirinto mais complexo
            { x: canvas.width * 0.3, y: canvas.height * 0.2, width: 100, height: 40 },
            { x: canvas.width * 0.6, y: canvas.height * 0.3, width: 100, height: 40 },
            { x: canvas.width * 0.2, y: canvas.height * 0.5, width: 100, height: 40 },
            { x: canvas.width * 0.5, y: canvas.height * 0.6, width: 100, height: 40 },
            { x: canvas.width * 0.7, y: canvas.height * 0.7, width: 100, height: 40 }
        ],
        doors: [
            { x: 50, y: canvas.height / 2, width: 40, height: 80, locked: false, leadsTo: 1, label: "← Setor 1" },
            { x: canvas.width - 50, y: canvas.height / 2, width: 40, height: 80, locked: false, leadsTo: 3, label: "→ Setor 3" }
        ],
        items: [
            { x: canvas.width / 2, y: canvas.height / 2, type: "code", content: "Código: 4721", code: "4721" },
            { x: canvas.width * 0.55, y: canvas.height * 0.75, type: "battery", content: "Pilha encontrada! +50% de bateria" },
            { x: canvas.width * 0.4, y: canvas.height * 0.2, type: "password", code: "1928" }
        ],
        chests: [
            { x: canvas.width * 0.35, y: canvas.height * 0.55, locked: true, code: "4721", content: "Chave encontrada!" }
        ],
        entitySpawn: false
    },
    3: {
        name: "Sala de Leitura Sombria",
        bgColor: "#0a0a0a",
        wallColor: "#1a1a1a",
        floorColor: "#0a0a0a",
        walls: [],
        bookshelves: [
            // Estantes nas bordas
            { x: 0, y: 0, width: canvas.width, height: 40 },
            { x: 0, y: canvas.height - 40, width: canvas.width, height: 40 },
            { x: 0, y: 0, width: 40, height: canvas.height },
            { x: canvas.width - 40, y: 0, width: 40, height: canvas.height },
            
            // Labirinto mais complexo
            { x: canvas.width * 0.2, y: canvas.height * 0.2, width: 120, height: 40 },
            { x: canvas.width * 0.5, y: canvas.height * 0.3, width: 120, height: 40 },
            { x: canvas.width * 0.3, y: canvas.height * 0.5, width: 120, height: 40 },
            { x: canvas.width * 0.6, y: canvas.height * 0.6, width: 120, height: 40 },
            { x: canvas.width * 0.4, y: canvas.height * 0.7, width: 120, height: 40 },
            { x: canvas.width * 0.7, y: canvas.height * 0.4, width: 120, height: 40 }
        ],
        doors: [
            { x: 50, y: canvas.height / 2, width: 40, height: 80, locked: false, leadsTo: 2, label: "← Setor 2" },
            { x: canvas.width - 50, y: canvas.height / 2, width: 40, height: 80, locked: true, leadsTo: 4, label: "→ Setor 4" }
        ],
        items: [
            { x: canvas.width * 0.3, y: canvas.height * 0.3, type: "flashlight", content: getTranslation('flashlight-hint') },
            { x: canvas.width * 0.6, y: canvas.height * 0.7, type: "battery", content: "Pilha encontrada! +50% de bateria" },
            { x: canvas.width * 0.8, y: canvas.height * 0.4, type: "password", code: "5634" }
        ],
        chests: [],
        entitySpawn: true,
        gun: { x: canvas.width * 0.5, y: canvas.height * 0.5 }
    },
    4: {
        name: "Arquivo Proibido",
        bgColor: "#1a0a0a",
        wallColor: "#2a1a1a",
        floorColor: "#1a0a0a",
        walls: [],
        bookshelves: [
            // Estantes nas bordas
            { x: 0, y: 0, width: canvas.width, height: 40 },
            { x: 0, y: canvas.height - 40, width: canvas.width, height: 40 },
            { x: 0, y: 0, width: 40, height: canvas.height },
            { x: canvas.width - 40, y: 0, width: 40, height: canvas.height },
            
            // Labirinto mais complexo
            { x: canvas.width * 0.2, y: canvas.height * 0.2, width: 120, height: 40 },
            { x: canvas.width * 0.5, y: canvas.height * 0.2, width: 120, height: 40 },
            { x: canvas.width * 0.3, y: canvas.height * 0.4, width: 120, height: 40 },
            { x: canvas.width * 0.6, y: canvas.height * 0.4, width: 120, height: 40 },
            { x: canvas.width * 0.2, y: canvas.height * 0.6, width: 120, height: 40 },
            { x: canvas.width * 0.5, y: canvas.height * 0.6, width: 120, height: 40 },
            { x: canvas.width * 0.4, y: canvas.height * 0.8, width: 120, height: 40 }
        ],
        doors: [
            { x: 50, y: canvas.height / 2, width: 40, height: 80, locked: false, leadsTo: 3, label: "← Setor 3" },
            { x: canvas.width - 50, y: canvas.height / 2, width: 40, height: 80, locked: false, leadsTo: 5, label: "→ Setor 5" }
        ],
        items: [
            { x: canvas.width * 0.5, y: canvas.height * 0.5, type: "code", content: "Código: 1928", code: "1928" },
            { x: canvas.width * 0.3, y: canvas.height * 0.7, type: "battery", content: "Pilha encontrada! +50% de bateria" },
            { x: canvas.width * 0.8, y: canvas.height * 0.65, type: "password", code: "9876" }
        ],
        chests: [
            { x: canvas.width * 0.45, y: canvas.height * 0.35, locked: true, code: "1928", content: "Pergaminho antigo encontrado!" }
        ],
        entitySpawn: true
    },
    5: {
        name: "Biblioteca Central",
        bgColor: "#0a0a0a",
        wallColor: "#1a1a1a",
        floorColor: "#0a0a0a",
        walls: [],
        bookshelves: [
            // Estantes nas bordas
            { x: 0, y: 0, width: canvas.width, height: 40 },
            { x: 0, y: canvas.height - 40, width: canvas.width, height: 40 },
            { x: 0, y: 0, width: 40, height: canvas.height },
            { x: canvas.width - 40, y: 0, width: 40, height: canvas.height },
            
            // Labirinto complexo
            { x: canvas.width * 0.2, y: canvas.height * 0.2, width: 120, height: 40 },
            { x: canvas.width * 0.5, y: canvas.height * 0.2, width: 120, height: 40 },
            { x: canvas.width * 0.8, y: canvas.height * 0.2, width: 120, height: 40 },
            { x: canvas.width * 0.2, y: canvas.height * 0.4, width: 120, height: 40 },
            { x: canvas.width * 0.5, y: canvas.height * 0.4, width: 120, height: 40 },
            { x: canvas.width * 0.8, y: canvas.height * 0.4, width: 120, height: 40 },
            { x: canvas.width * 0.2, y: canvas.height * 0.6, width: 120, height: 40 },
            { x: canvas.width * 0.5, y: canvas.height * 0.6, width: 120, height: 40 },
            { x: canvas.width * 0.8, y: canvas.height * 0.6, width: 120, height: 40 }
        ],
        doors: [
            { x: 50, y: canvas.height / 2, width: 40, height: 80, locked: false, leadsTo: 4, label: "← Setor 4" },
            { x: canvas.width - 50, y: canvas.height / 2, width: 40, height: 80, locked: false, leadsTo: 6, label: "→ Setor 6" }
        ],
        items: [
            { x: canvas.width * 0.55, y: canvas.height * 0.75, type: "code", content: "Código: 5634", code: "5634" },
            { x: canvas.width * 0.25, y: canvas.height * 0.5, type: "battery", content: "Pilha encontrada! +50% de bateria" },
            { x: canvas.width * 0.8, y: canvas.height * 0.5, type: "password", code: "3141" }
        ],
        chests: [],
        entitySpawn: true
    },
    6: {
        name: "Câmara Secreta",
        bgColor: "#1a0a0a",
        wallColor: "#2a1a1a",
        floorColor: "#1a0a0a",
        walls: [],
        bookshelves: [
            // Estantes nas bordas
            { x: 0, y: 0, width: canvas.width, height: 40 },
            { x: 0, y: canvas.height - 40, width: canvas.width, height: 40 },
            { x: 0, y: 0, width: 40, height: canvas.height },
            { x: canvas.width - 40, y: 0, width: 40, height: canvas.height },
            
            // Labirinto muito complexo
            { x: canvas.width * 0.2, y: canvas.height * 0.2, width: 120, height: 40 },
            { x: canvas.width * 0.5, y: canvas.height * 0.2, width: 120, height: 40 },
            { x: canvas.width * 0.3, y: canvas.height * 0.4, width: 120, height: 40 },
            { x: canvas.width * 0.6, y: canvas.height * 0.4, width: 120, height: 40 },
            { x: canvas.width * 0.2, y: canvas.height * 0.6, width: 120, height: 40 },
            { x: canvas.width * 0.5, y: canvas.height * 0.6, width: 120, height: 40 },
            { x: canvas.width * 0.4, y: canvas.height * 0.8, width: 120, height: 40 },
            { x: canvas.width * 0.7, y: canvas.height * 0.8, width: 120, height: 40 }
        ],
        doors: [
            { x: 50, y: canvas.height / 2, width: 40, height: 80, locked: false, leadsTo: 5, label: "← Setor 5" },
            { x: canvas.width - 50, y: canvas.height / 2, width: 40, height: 80, locked: false, leadsTo: 7, label: "→ Setor 7" }
        ],
        items: [
            { x: canvas.width * 0.5, y: canvas.height * 0.45, type: "code", content: "Código: 9876", code: "9876" },
            { x: canvas.width * 0.3, y: canvas.height * 0.2, type: "battery", content: "Pilha encontrada! +50% de bateria" },
            { x: canvas.width * 0.8, y: canvas.height * 0.3, type: "password", code: "4721" }
        ],
        chests: [
            { x: canvas.width * 0.5, y: canvas.height * 0.7, locked: true, code: "9876", content: "Mapa do tesouro encontrado!" }
        ],
        entitySpawn: true
    },
    7: {
        name: "Zona Profunda",
        bgColor: "#050505",
        wallColor: "#151515",
        floorColor: "#050505",
        walls: [],
        bookshelves: [
            // Estantes nas bordas
            { x: 0, y: 0, width: canvas.width, height: 40 },
            { x: 0, y: canvas.height - 40, width: canvas.width, height: 40 },
            { x: 0, y: 0, width: 40, height: canvas.height },
            { x: canvas.width - 40, y: 0, width: 40, height: canvas.height },
            
            // Labirinto extremamente complexo
            { x: canvas.width * 0.2, y: canvas.height * 0.2, width: 120, height: 40 },
            { x: canvas.width * 0.5, y: canvas.height * 0.2, width: 120, height: 40 },
            { x: canvas.width * 0.8, y: canvas.height * 0.2, width: 120, height: 40 },
            { x: canvas.width * 0.2, y: canvas.height * 0.4, width: 120, height: 40 },
            { x: canvas.width * 0.5, y: canvas.height * 0.4, width: 120, height: 40 },
            { x: canvas.width * 0.8, y: canvas.height * 0.4, width: 120, height: 40 },
            { x: canvas.width * 0.2, y: canvas.height * 0.6, width: 120, height: 40 },
            { x: canvas.width * 0.5, y: canvas.height * 0.6, width: 120, height: 40 },
            { x: canvas.width * 0.8, y: canvas.height * 0.6, width: 120, height: 40 },
            { x: canvas.width * 0.4, y: canvas.height * 0.8, width: 120, height: 40 }
        ],
        doors: [
            { x: 50, y: canvas.height / 2, width: 40, height: 80, locked: false, leadsTo: 6, label: "← Setor 6" },
            { x: canvas.width - 50, y: canvas.height / 2, width: 40, height: 80, locked: false, leadsTo: 8, label: "→ Setor 8" }
        ],
        items: [
            { x: canvas.width * 0.5, y: canvas.height * 0.35, type: "code", content: "Código: 3141", code: "3141" },
            { x: canvas.width * 0.25, y: canvas.height * 0.6, type: "battery", content: "Pilha encontrada! +50% de bateria" },
            { x: canvas.width * 0.8, y: canvas.height * 0.75, type: "password", code: "5634" }
        ],
        chests: [],
        entitySpawn: true
    },
    8: {
        name: "Câmara Final",
        bgColor: "#000000",
        wallColor: "#0a0a0a",
        floorColor: "#000000",
        walls: [],
        bookshelves: [
            // Estantes nas bordas
            { x: 0, y: 0, width: canvas.width, height: 40 },
            { x: 0, y: canvas.height - 40, width: canvas.width, height: 40 },
            { x: 0, y: 0, width: 40, height: canvas.height },
            { x: canvas.width - 40, y: 0, width: 40, height: canvas.height },
            
            // Labirinto final - muito complexo
            { x: canvas.width * 0.2, y: canvas.height * 0.2, width: 120, height: 40 },
            { x: canvas.width * 0.5, y: canvas.height * 0.2, width: 120, height: 40 },
            { x: canvas.width * 0.8, y: canvas.height * 0.2, width: 120, height: 40 },
            { x: canvas.width * 0.2, y: canvas.height * 0.4, width: 120, height: 40 },
            { x: canvas.width * 0.5, y: canvas.height * 0.4, width: 120, height: 40 },
            { x: canvas.width * 0.8, y: canvas.height * 0.4, width: 120, height: 40 },
            { x: canvas.width * 0.2, y: canvas.height * 0.6, width: 120, height: 40 },
            { x: canvas.width * 0.5, y: canvas.height * 0.6, width: 120, height: 40 },
            { x: canvas.width * 0.8, y: canvas.height * 0.6, width: 120, height: 40 },
            { x: canvas.width * 0.4, y: canvas.height * 0.8, width: 120, height: 40 },
            { x: canvas.width * 0.7, y: canvas.height * 0.8, width: 120, height: 40 }
        ],
        doors: [
            { x: 50, y: canvas.height / 2, width: 40, height: 80, locked: false, leadsTo: 7, label: "← Setor 7" }
        ],
        items: [
            { x: canvas.width / 2, y: canvas.height / 2, type: "code", content: "Código: 2001", code: "2001" },
            { x: canvas.width * 0.2, y: canvas.height * 0.25, type: "battery", content: "Pilha encontrada! +50% de bateria" }
        ],
        chests: [
            { x: canvas.width * 0.5, y: canvas.height * 0.5, locked: true, code: "2001", content: "Você encontrou o segredo final! Escape!" }
        ],
        entitySpawn: true
    }
};

function render() {
    const level = levels[game.currentLevel];
    
    ctx.fillStyle = level.bgColor;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    ctx.fillStyle = '#4a3520';
    for (let y = 0; y < canvas.height; y += 40) {
        ctx.fillRect(0, y, canvas.width, 35);
    }
    
    ctx.fillStyle = '#3a2510';
    for (let y = 0; y < canvas.height; y += 40) {
        ctx.fillRect(0, y + 35, canvas.width, 5);
        
        for (let i = 0; i < 20; i++) {
            const x = (i * 137 + y * 13) % canvas.width;
            const width = ((i * 17 + y * 7) % 20) + 10;
            ctx.fillRect(x, y + ((i * 11) % 30), width, 2);
        }
    }
    
    ctx.fillStyle = '#5a4530';
    for (let y = 0; y < canvas.height; y += 40) {
        for (let i = 0; i < 10; i++) {
            const x = (i * 173 + y * 19) % canvas.width;
            const width = ((i * 23 + y * 11) % 15) + 5;
            const height = ((i * 13 + y * 7) % 8) + 5;
            ctx.fillRect(x, y + ((i * 17) % 30), width, height);
        }
    }
    
    // Teias nos cantos
    drawSpiderweb(80, 80, 60);
    drawSpiderweb(canvas.width - 80, 80, 60);
    drawSpiderweb(80, canvas.height - 80, 60);
    drawSpiderweb(canvas.width - 80, canvas.height - 80, 60);
    
    const skullCount = 6;
    for (let i = 0; i < skullCount; i++) {
        const seedX = (game.currentLevel * 1000 + i * 137) % canvas.width;
        const seedY = (game.currentLevel * 1500 + i * 173) % canvas.height;
        
        const skullX = Math.max(100, Math.min(canvas.width - 100, seedX));
        const skullY = Math.max(100, Math.min(canvas.height - 100, seedY));
        
        drawSkull(skullX, skullY);
    }
    
    const pumpkinPositions = [
        { x: canvas.width * 0.2, y: canvas.height * 0.15 },
        { x: canvas.width * 0.8, y: canvas.height * 0.25 },
        { x: canvas.width * 0.3, y: canvas.height * 0.85 },
        { x: canvas.width * 0.7, y: canvas.height * 0.75 },
        { x: canvas.width * 0.5, y: canvas.height * 0.1 }
    ];
    
    pumpkinPositions.forEach(pos => {
        drawPumpkin(pos.x, pos.y);
    });
    
    ctx.fillStyle = '#5a3a1a';
    ctx.fillRect(0, 0, canvas.width, 20);
    ctx.fillRect(0, canvas.height - 20, canvas.width, 20);
    ctx.fillRect(0, 0, 20, canvas.height);
    ctx.fillRect(canvas.width - 20, 0, 20, canvas.height);
    
    if (level.walls) {
        level.walls.forEach(wall => {
            drawWall(wall.x, wall.y, wall.width, wall.height);
        });
    }
    
    if (level.bookshelves) {
        level.bookshelves.forEach(shelf => {
            drawBookshelf(shelf.x, shelf.y, shelf.width, shelf.height);
        });
    }
    
    level.doors.forEach(door => {
        const baseColor = door.locked ? '#8b0000' : '#2a4a2a';
        ctx.fillStyle = baseColor;
        ctx.fillRect(door.x - door.width / 2, door.y - door.height / 2, door.width, door.height);
        
        ctx.strokeStyle = '#1a1a1a';
        ctx.lineWidth = 2;
        ctx.strokeRect(door.x - door.width / 2, door.y - door.height / 2, door.width, door.height);
        
        ctx.fillStyle = '#fff';
        ctx.font = '12px Courier New';
        ctx.textAlign = 'center';
        ctx.fillText(door.label, door.x, door.y - door.height / 2 - 10);
        
        const dist = Math.hypot(player.x - door.x, player.y - door.y);
        if (dist < 60) {
            ctx.strokeStyle = '#ffff00';
            ctx.lineWidth = 2;
            ctx.strokeRect(door.x - door.width / 2 - 5, door.y - door.height / 2 - 5, door.width + 10, door.height + 10);
            
            ctx.fillStyle = '#ffff00';
            ctx.font = '14px Courier New';
            ctx.fillText(getTranslation('interact-door'), door.x, door.y + door.height / 2 + 25);
        }
    });
    
    if (level.gun) {
        ctx.fillStyle = '#ffaa00';
        ctx.fillRect(level.gun.x - 10, level.gun.y - 5, 20, 10);
        ctx.fillStyle = '#ff8800';
        ctx.fillRect(level.gun.x - 12, level.gun.y - 2, 6, 4);
    }
    
    // Items
    level.items.forEach(item => {
        if (item.type === 'code') {
            ctx.fillStyle = '#ffff00';
            ctx.fillRect(item.x - 15, item.y - 15, 30, 30);
            ctx.fillStyle = '#000';
            ctx.font = 'bold 10px Courier New';
            ctx.textAlign = 'center';
            ctx.fillText('C', item.x, item.y + 5);
        } else if (item.type === 'battery') {
            ctx.fillStyle = '#ff0000';
            ctx.fillRect(item.x - 8, item.y - 12, 16, 24);
            ctx.fillStyle = '#ffff00';
            ctx.fillRect(item.x - 6, item.y - 10, 12, 20);
        } else if (item.type === 'flashlight') {
            ctx.fillStyle = '#ffff99';
            ctx.beginPath();
            ctx.arc(item.x, item.y, 10, 0, Math.PI * 2);
            ctx.fill();
            ctx.fillStyle = '#ffcc00';
            ctx.beginPath();
            ctx.arc(item.x, item.y, 5, 0, Math.PI * 2);
            ctx.fill();
        } else if (item.type === 'password') {
            ctx.fillStyle = '#ff99ff';
            ctx.font = 'bold 12px Courier New';
            ctx.textAlign = 'center';
            ctx.fillText('🔐', item.x, item.y);
            ctx.fillStyle = '#ffccff';
            ctx.font = '10px Courier New';
            ctx.fillText('SENHA', item.x, item.y + 12);
        } else if (item.type === 'note') {
            ctx.fillStyle = '#8b7355';
            ctx.fillRect(item.x - 15, item.y - 15, 30, 30);
            ctx.fillStyle = '#fff';
            ctx.font = '10px Courier New';
            ctx.textAlign = 'center';
            ctx.fillText('📝', item.x, item.y);
        }
        
        const dist = Math.hypot(player.x - item.x, player.y - item.y);
        if (dist < 40) {
            ctx.strokeStyle = '#0f0';
            ctx.lineWidth = 2;
            ctx.strokeRect(item.x - 20, item.y - 20, 40, 40);
        }
    });
    
    // Chests
    level.chests.forEach(chest => {
        if (chest.locked) {
            ctx.fillStyle = '#8b4513';
            ctx.fillRect(chest.x - 20, chest.y - 15, 40, 30);
            ctx.fillStyle = '#d4a574';
            ctx.fillRect(chest.x - 8, chest.y - 5, 16, 15);
            ctx.fillStyle = '#000';
            ctx.fillRect(chest.x - 4, chest.y - 2, 8, 4);
        } else {
            ctx.fillStyle = '#c41e3a';
            ctx.fillRect(chest.x - 20, chest.y - 15, 40, 30);
        }
    });
    
    drawPlayer(player.x, player.y);
    
    for (let ent of entities) {
        if (ent.active) {
            drawEntity(ent.x, ent.y);
        }
    }
    
    // Bullets
    game.bullets.forEach(bullet => {
        drawBullet(bullet);
    });
    
    const staminaBarWidth = 200;
    const staminaBarHeight = 20;
    const staminaBarX = canvas.width / 2 - staminaBarWidth / 2;
    const staminaBarY = canvas.height - 50;
    
    // Fundo da barra
    ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
    ctx.fillRect(staminaBarX - 5, staminaBarY - 5, staminaBarWidth + 10, staminaBarHeight + 10);
    
    // Barra de estamina
    const staminaPercent = game.currentStamina / game.maxStamina;
    ctx.fillStyle = staminaPercent > 0.3 ? '#00ff00' : '#ff0000';
    ctx.fillRect(staminaBarX, staminaBarY, staminaBarWidth * staminaPercent, staminaBarHeight);
    
    // Borda
    ctx.strokeStyle = '#fff';
    ctx.lineWidth = 2;
    ctx.strokeRect(staminaBarX, staminaBarY, staminaBarWidth, staminaBarHeight);
    
    // Texto
    ctx.fillStyle = '#fff';
    ctx.font = '14px Courier New';
    ctx.textAlign = 'center';
    ctx.fillText('ESTAMINA [SHIFT]', canvas.width / 2, staminaBarY - 10);

    // Update flashlight overlay position
    updateFlashlightPosition();
}

function gameLoop() {
    if (game.state !== 'playing') return;
    
    if (game.detectorCooldown > 0) {
        game.detectorCooldown--;
    }

    updatePlayer();
    updateEntities();
    updateBullets();
    updateFlashlightBattery();
    render();
    
    requestAnimationFrame(gameLoop);
}

// ==================== EVENT LISTENERS ====================
document.getElementById('start-btn').addEventListener('click', startGame);

document.getElementById('settings-btn').addEventListener('click', () => {
    document.getElementById('start-screen').style.display = 'none';
    document.getElementById('settings-screen').style.display = 'flex';
});

document.getElementById('language-select').addEventListener('change', (e) => {
    setLanguage(e.target.value);
});

document.getElementById('back-to-start').addEventListener('click', () => {
    document.getElementById('settings-screen').style.display = 'none';
    document.getElementById('start-screen').style.display = 'flex';
});

document.getElementById('password-submit').addEventListener('click', () => {
    const input = document.getElementById('password-input');
    if (input.value.toUpperCase() === game.currentPassword) {
        document.getElementById('password-screen').style.display = 'none';
        showMessage("Porta aberta! Entrando no próximo setor...");
        setTimeout(() => {
            nextLevel();
        }, 1000);
    } else {
        document.getElementById('password-error').textContent = getTranslation('password-error-wrong');
        input.value = '';
    }
});

document.getElementById('password-input').addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
        document.getElementById('password-submit').click();
    }
});

document.getElementById('restart-btn').addEventListener('click', () => {
    document.getElementById('game-over-screen').style.display = 'none';
    game.state = 'playing';
    
    const spawnPositions = {
        1: { x: 100, y: 100 },
        2: { x: 100, y: canvas.height / 2 },
        3: { x: 100, y: 100 },
        4: { x: canvas.width / 2, y: canvas.height - 100 },
        5: { x: 100, y: canvas.height / 2 },
        6: { x: 100, y: canvas.height / 2 },
        7: { x: 100, y: canvas.height / 2 },
        8: { x: canvas.width / 2, y: canvas.height - 100 }
    };
    
    player.x = spawnPositions[game.currentLevel].x;
    player.y = spawnPositions[game.currentLevel].y;
    
    game.currentStamina = game.maxStamina;
    
    // Reposicionar entidades
    entities.forEach(ent => {
        const pos = getRandomValidPosition(levels[game.currentLevel]);
        ent.x = pos.x;
        ent.y = pos.y;
    });
    
    showMessage(getTranslation('respawn-msg'));
    gameLoop();
});

document.getElementById('restart-btn-victory').addEventListener('click', () => {
    document.getElementById('victory-screen').style.display = 'none';
    game.currentLevel = 1;
    game.codesCollected = [];
    game.chestsOpened = 0;
    game.inventory = [];
    game.flashlightBattery = 100;
    game.hasGun = false;
    game.ammo = 0;
    game.spawnedPasswords = {};
    startGame();
});

document.getElementById('register-btn').addEventListener('click', () => {
    document.getElementById('start-screen').style.display = 'none';
    document.getElementById('register-screen').style.display = 'flex';
});

document.getElementById('register-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const name = document.getElementById('register-name').value;
    const email = document.getElementById('register-email').value;
    
    // Simulando envio de email
    console.log(`Email para ${name} (${email}): Bem-vindo! Esse é nosso jogo de trabalho de feira.`);
    showMessage(`Email enviado para ${name}!`);
    
    document.getElementById('register-form').reset();
    document.getElementById('register-screen').style.display = 'none';
    document.getElementById('start-screen').style.display = 'flex';
});

document.getElementById('back-to-menu').addEventListener('click', () => {
    document.getElementById('register-screen').style.display = 'none';
    document.getElementById('start-screen').style.display = 'flex';
});

window.addEventListener('resize', () => {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
});

// Inicializar idioma na tela inicial
updateUILanguage();
document.getElementById('language-select').value = currentLanguage;

// Função para criar fantasmas flutuantes
function createFloatingGhosts() {
    const startScreen = document.getElementById('start-screen');
    const ghostCount = 5;
    
    for (let i = 0; i < ghostCount; i++) {
        const ghost = document.createElement('div');
        ghost.className = 'ghost-float';
        ghost.textContent = '👻';
        ghost.style.setProperty('--offset', `${Math.random() * 80 - 40}%`);
        ghost.style.animationDelay = `${Math.random() * 4}s`;
        startScreen.appendChild(ghost);
    }
}

// Chamar função de fantasmas ao carregar página
createFloatingGhosts();