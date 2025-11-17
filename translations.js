// ==================== SISTEMA DE IDIOMAS ====================
const translations = {
    'pt-BR': {
        'start-description': 'Você acordou em uma livraria abandonada e misteriosa. Estantes de livros formam um labirinto complexo. Encontre baús secretos, colete códigos e descubra a saída... se conseguir sobreviver.',
        'start-btn': 'INICIAR JOGO',
        'settings-btn': '⚙️ CONFIGURAÇÕES',
        'gameover-title': 'VOCÊ MORREU',
        'gameover-text': 'A entidade te encontrou...',
        'restart-btn': 'TENTAR NOVAMENTE',
        'victory-title': 'VOCÊ ESCAPOU!',
        'victory-text': 'Parabéns! Você coletou todos os códigos e descobriu o segredo final. Você conseguiu escapar da Livraria Abandonada!',
        'restart-btn-victory': 'JOGAR NOVAMENTE',
        'password-title': 'INSIRA A SENHA',
        'password-instruction': 'Você encontrou uma porta bloqueada. Digite a senha para continuar:',
        'password-submit': 'ABRIR PORTA',
        'password-error-wrong': 'Senha incorreta! Tente novamente.',
        'hud-level': 'Setor:',
        'hud-explored': 'Setores Explorados:',
        'hud-codes': 'Códigos:',
        'hud-chests': 'Baús Abertos:',
        'interact-door': '[E] Interagir',
        'flashlight-hint': 'Lanterna encontrada! Pressione F para ligar/desligar.',
        'gun-label': 'Arma encontrada! Use Clique para atirar.',
        'flashlight-empty': 'A bateria da lanterna está vazia!',
        'respawn-msg': 'Você respawnou! Volte ao local da morte para recuperar seus itens.',
        'gun-hit': 'Você acertou o fantasma! Ele foi repelido.',
        'register-title': 'CADASTRO',
        'register-placeholder-name': 'Nome',
        'register-placeholder-email': 'Email',
        'register-placeholder-password': 'Senha',
        'register-button': 'CADASTRAR',
        'register-success': 'Cadastro realizado!',
        'entity-spawn-msg': 'Nova entidade surgiu! Cuidado!'
    },
    'en': {
        'start-description': 'You woke up in a mysterious abandoned library. Bookshelves form a complex maze. Find secret chests, collect codes and discover the exit... if you can survive.',
        'start-btn': 'START GAME',
        'settings-btn': '⚙️ SETTINGS',
        'gameover-title': 'YOU DIED',
        'gameover-text': 'The entity found you...',
        'restart-btn': 'TRY AGAIN',
        'victory-title': 'YOU ESCAPED!',
        'victory-text': 'Congratulations! You collected all codes and discovered the final secret. You managed to escape the Abandoned Library!',
        'restart-btn-victory': 'PLAY AGAIN',
        'password-title': 'ENTER PASSWORD',
        'password-instruction': 'You found a locked door. Enter the password to continue:',
        'password-submit': 'OPEN DOOR',
        'password-error-wrong': 'Wrong password! Try again.',
        'hud-level': 'Sector:',
        'hud-explored': 'Sectors Explored:',
        'hud-codes': 'Codes:',
        'hud-chests': 'Chests Opened:',
        'interact-door': '[E] Interact',
        'flashlight-hint': 'Flashlight found! Press F to turn on/off.',
        'gun-label': 'Gun found! Use Click to shoot.',
        'flashlight-empty': 'Flashlight battery is empty!',
        'respawn-msg': 'You respawned! Return to your death location to recover your items.',
        'gun-hit': 'You hit the ghost! It was repelled.',
        'register-title': 'REGISTER',
        'register-placeholder-name': 'Name',
        'register-placeholder-email': 'Email',
        'register-placeholder-password': 'Password',
        'register-button': 'REGISTER',
        'register-success': 'Registration completed!',
        'entity-spawn-msg': 'New entity appeared! Be careful!'
    },
    'es': {
        'start-description': 'Despertaste en una misteriosa biblioteca abandonada. Las estanterías forman un laberinto complejo. Encuentra cofres secretos, recoge códigos y descubre la salida... si logras sobrevivir.',
        'start-btn': 'INICIAR JUEGO',
        'settings-btn': '⚙️ CONFIGURACIÓN',
        'gameover-title': '¡MORISTE!',
        'gameover-text': 'La entidad te encontró...',
        'restart-btn': 'INTENTAR DE NUEVO',
        'victory-title': '¡ESCAPASTE!',
        'victory-text': '¡Felicidades! Recolectaste todos los códigos y descubriste el secreto final. ¡Lograste escapar de la Biblioteca Abandonada!',
        'restart-btn-victory': 'JUGAR DE NUEVO',
        'password-title': 'INGRESA LA CONTRASEÑA',
        'password-instruction': 'Encontraste una puerta bloqueada. Ingresa la contraseña para continuar:',
        'password-submit': 'ABRIR PUERTA',
        'password-error-wrong': '¡Contraseña incorrecta! Intenta de nuevo.',
        'hud-level': 'Sector:',
        'hud-explored': 'Sectores Explorados:',
        'hud-codes': 'Códigos:',
        'hud-chests': 'Cofres Abiertos:',
        'interact-door': '[E] Interactuar',
        'flashlight-hint': '¡Linterna encontrada! Presiona F para encender/apagar.',
        'gun-label': '¡Arma encontrada! Usa Clic para disparar.',
        'flashlight-empty': '¡La batería de la linterna está vacía!',
        'respawn-msg': '¡Reapareciste! Regresa al lugar de tu muerte para recuperar tus objetos.',
        'gun-hit': '¡Acertaste al fantasma! Fue repelido.',
        'register-title': 'REGISTRO',
        'register-placeholder-name': 'Nombre',
        'register-placeholder-email': 'Correo',
        'register-placeholder-password': 'Contraseña',
        'register-button': 'REGISTRARSE',
        'register-success': '¡Registro completado!',
        'entity-spawn-msg': '¡Nueva entidad apareció! ¡Ten cuidado!'
    }
};

let currentLanguage = localStorage.getItem('gameLanguage') || 'pt-BR';

function setLanguage(lang) {
    currentLanguage = lang;
    localStorage.setItem('gameLanguage', lang);
    updateUILanguage();
}

function getTranslation(key) {
    return translations[currentLanguage][key] || translations['pt-BR'][key];
}

function updateUILanguage() {
    document.getElementById('start-description').textContent = getTranslation('start-description');
    document.getElementById('start-btn').textContent = getTranslation('start-btn');
    document.getElementById('settings-btn').textContent = getTranslation('settings-btn');
    document.getElementById('register-btn').textContent = getTranslation('register-title');
}