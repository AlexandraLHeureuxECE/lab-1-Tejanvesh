/**
 * Tic-Tac-Toe Game
 * A fully accessible, keyboard-navigable game with two-player and computer modes.
 */

// Game State
const gameState = {
    board: ['', '', '', '', '', '', '', '', ''],
    currentPlayer: 'X',
    gameActive: true,
    winner: null,
    mode: null, // 'two-player' or 'vs-computer'
    isComputerTurn: false
};

// Winning Combinations (indices)
const WINNING_COMBINATIONS = [
    [0, 1, 2], // Top row
    [3, 4, 5], // Middle row
    [6, 7, 8], // Bottom row
    [0, 3, 6], // Left column
    [1, 4, 7], // Middle column
    [2, 5, 8], // Right column
    [0, 4, 8], // Diagonal top-left to bottom-right
    [2, 4, 6]  // Diagonal top-right to bottom-left
];

// DOM Elements
const modeSelection = document.getElementById('modeSelection');
const gameArea = document.getElementById('gameArea');
const cells = document.querySelectorAll('.cell');
const turnIndicator = document.getElementById('turnIndicator');
const gameMessage = document.getElementById('gameMessage');
const restartBtn = document.getElementById('restartBtn');
const changeModeBtn = document.getElementById('changeModeBtn');
const twoPlayerBtn = document.getElementById('twoPlayerBtn');
const vsComputerBtn = document.getElementById('vsComputerBtn');
const currentModeDisplay = document.getElementById('currentMode');
const gameBoard = document.getElementById('gameBoard');

// Confetti Canvas
const confettiCanvas = document.getElementById('confettiCanvas');
const confettiCtx = confettiCanvas.getContext('2d');
let confettiParticles = [];
let confettiAnimationId = null;

/**
 * Initialize the game
 */
function initGame() {
    // Add mode selection listeners
    twoPlayerBtn.addEventListener('click', () => selectMode('two-player'));
    twoPlayerBtn.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            selectMode('two-player');
        }
    });

    vsComputerBtn.addEventListener('click', () => selectMode('vs-computer'));
    vsComputerBtn.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            selectMode('vs-computer');
        }
    });

    // Add click listeners to cells
    cells.forEach(cell => {
        cell.addEventListener('click', handleCellClick);
        cell.addEventListener('keydown', handleCellKeydown);
    });

    // Add restart button listener
    restartBtn.addEventListener('click', restartGame);
    restartBtn.addEventListener('keydown', handleRestartKeydown);

    // Add change mode button listener
    changeModeBtn.addEventListener('click', showModeSelection);
    changeModeBtn.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            showModeSelection();
        }
    });

    // Global keyboard listener for arrow keys
    document.addEventListener('keydown', handleGlobalKeydown);

    // Setup confetti canvas
    resizeConfettiCanvas();
    window.addEventListener('resize', resizeConfettiCanvas);
}

/**
 * Select game mode and start the game
 * @param {string} mode - 'two-player' or 'vs-computer'
 */
function selectMode(mode) {
    gameState.mode = mode;
    
    // Hide mode selection, show game area
    modeSelection.classList.add('hidden');
    gameArea.classList.remove('hidden');
    
    // Update mode display
    currentModeDisplay.textContent = mode === 'two-player' 
        ? '👥 Two Player Mode' 
        : '🤖 vs Computer Mode';
    
    // Reset and start game
    resetGameState();
    updateTurnIndicator();
}

/**
 * Show mode selection screen
 */
function showModeSelection() {
    gameArea.classList.add('hidden');
    modeSelection.classList.remove('hidden');
    currentModeDisplay.textContent = '';
    turnIndicator.textContent = 'Select Game Mode';
    turnIndicator.className = 'turn-indicator';
    
    // Reset game state
    resetGameState();
    
    // Focus first mode button
    twoPlayerBtn.focus();
}

/**
 * Handle cell click event
 * @param {Event} event - Click event
 */
function handleCellClick(event) {
    // Ignore if it's computer's turn
    if (gameState.isComputerTurn) return;
    
    const cell = event.target;
    const index = parseInt(cell.dataset.index);
    makeMove(index, cell);
}

/**
 * Handle keyboard events on cells
 * @param {KeyboardEvent} event - Keyboard event
 */
function handleCellKeydown(event) {
    // Ignore if it's computer's turn
    if (gameState.isComputerTurn) return;
    
    const cell = event.target;
    const index = parseInt(cell.dataset.index);
    
    // Enter key places the mark
    if (event.key === 'Enter') {
        event.preventDefault();
        makeMove(index, cell);
        return;
    }
    
    // Arrow key navigation
    handleArrowNavigation(event, index);
}

/**
 * Handle arrow key navigation
 * @param {KeyboardEvent} event - Keyboard event
 * @param {number} currentIndex - Current cell index (or -1 if none focused)
 */
function handleArrowNavigation(event, currentIndex) {
    let targetIndex = -1;
    const index = currentIndex >= 0 ? currentIndex : 0;
    
    switch (event.key) {
        case 'ArrowUp':
            targetIndex = index - 3;
            if (targetIndex < 0) targetIndex = index + 6; // Wrap to bottom
            break;
        case 'ArrowDown':
            targetIndex = index + 3;
            if (targetIndex > 8) targetIndex = index - 6; // Wrap to top
            break;
        case 'ArrowLeft':
            if (index % 3 === 0) {
                targetIndex = index + 2; // Wrap to right of same row
            } else {
                targetIndex = index - 1;
            }
            break;
        case 'ArrowRight':
            if (index % 3 === 2) {
                targetIndex = index - 2; // Wrap to left of same row
            } else {
                targetIndex = index + 1;
            }
            break;
    }
    
    if (targetIndex >= 0 && targetIndex <= 8) {
        event.preventDefault();
        cells[targetIndex].focus();
    }
}

/**
 * Handle global keyboard events for arrow navigation
 * @param {KeyboardEvent} event - Keyboard event
 */
function handleGlobalKeydown(event) {
    // Only handle if game area is visible and game is active
    if (gameArea.classList.contains('hidden')) return;
    if (gameState.isComputerTurn) return;
    
    // Check if arrow key pressed
    if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(event.key)) {
        // If no cell is focused, focus the first one or navigate from current
        const focusedCell = document.activeElement;
        const isCellFocused = focusedCell && focusedCell.classList.contains('cell');
        
        if (!isCellFocused) {
            event.preventDefault();
            cells[0].focus();
        }
        // If a cell is focused, the cell's own keydown handler will manage navigation
    }
    
    // Handle Enter on focused cell
    if (event.key === 'Enter') {
        const focusedCell = document.activeElement;
        if (focusedCell && focusedCell.classList.contains('cell')) {
            event.preventDefault();
            const index = parseInt(focusedCell.dataset.index);
            makeMove(index, focusedCell);
        }
    }
}

/**
 * Handle keyboard events on restart button
 * @param {KeyboardEvent} event - Keyboard event
 */
function handleRestartKeydown(event) {
    if (event.key === 'Enter' || event.key === ' ') {
        event.preventDefault();
        restartGame();
    }
}

/**
 * Make a move on the board
 * @param {number} index - Cell index (0-8)
 * @param {HTMLElement} cell - Cell DOM element
 */
function makeMove(index, cell) {
    // Validate move
    if (!gameState.gameActive || gameState.board[index] !== '') {
        return;
    }

    // Update game state
    gameState.board[index] = gameState.currentPlayer;

    // Update UI
    cell.textContent = gameState.currentPlayer;
    cell.classList.add(gameState.currentPlayer.toLowerCase(), 'taken');
    cell.setAttribute('aria-label', `Cell ${index + 1}, ${gameState.currentPlayer}`);

    // Check for win or draw
    const winResult = checkWin();
    
    if (winResult) {
        handleWin(winResult);
    } else if (checkDraw()) {
        handleDraw();
    } else {
        // Switch player
        switchPlayer();
        
        // If vs computer mode and it's now O's turn (computer), make computer move
        if (gameState.mode === 'vs-computer' && gameState.currentPlayer === 'O' && gameState.gameActive) {
            makeComputerMove();
        }
    }
}

/**
 * Check for a winning combination
 * @returns {number[]|null} Winning combination indices or null
 */
function checkWin() {
    for (const combination of WINNING_COMBINATIONS) {
        const [a, b, c] = combination;
        if (
            gameState.board[a] &&
            gameState.board[a] === gameState.board[b] &&
            gameState.board[a] === gameState.board[c]
        ) {
            return combination;
        }
    }
    return null;
}

/**
 * Check for a draw
 * @returns {boolean} True if draw
 */
function checkDraw() {
    return gameState.board.every(cell => cell !== '');
}

/**
 * Handle win scenario
 * @param {number[]} winningCells - Indices of winning cells
 */
function handleWin(winningCells) {
    gameState.gameActive = false;
    gameState.winner = gameState.currentPlayer;

    // Highlight winning cells
    winningCells.forEach(index => {
        cells[index].classList.add('winning');
    });

    // Mark all cells as game over
    cells.forEach(cell => {
        cell.classList.add('game-over');
    });

    // Display winner message
    let winnerMessage;
    if (gameState.mode === 'vs-computer') {
        winnerMessage = gameState.winner === 'X' 
            ? '🎉 You Win!' 
            : '🤖 Computer Wins!';
    } else {
        winnerMessage = `🎉 Player ${gameState.winner} Wins!`;
    }
    gameMessage.textContent = winnerMessage;
    gameMessage.className = 'game-message winner';

    // Update turn indicator
    turnIndicator.textContent = 'Game Over';
    turnIndicator.className = 'turn-indicator';

    // Start confetti celebration
    startConfetti();
    
    // Stop confetti after 5 seconds
    setTimeout(() => {
        stopConfetti();
    }, 5000);
}

/**
 * Resize confetti canvas to match window
 */
function resizeConfettiCanvas() {
    confettiCanvas.width = window.innerWidth;
    confettiCanvas.height = window.innerHeight;
}

/**
 * Create a confetti particle
 */
function createConfettiParticle() {
    const colors = ['#0ea5e9', '#38bdf8', '#7dd3fc', '#ec4899', '#f472b6', '#10b981', '#fbbf24', '#f97316'];
    return {
        x: Math.random() * confettiCanvas.width,
        y: Math.random() * confettiCanvas.height - confettiCanvas.height,
        size: Math.random() * 10 + 5,
        color: colors[Math.floor(Math.random() * colors.length)],
        speedY: Math.random() * 3 + 2,
        speedX: Math.random() * 4 - 2,
        rotation: Math.random() * 360,
        rotationSpeed: Math.random() * 10 - 5,
        shape: Math.random() > 0.5 ? 'rect' : 'circle'
    };
}

/**
 * Start confetti animation
 */
function startConfetti() {
    confettiParticles = [];
    
    // Create initial particles
    for (let i = 0; i < 150; i++) {
        confettiParticles.push(createConfettiParticle());
    }

    animateConfetti();
}

/**
 * Animate confetti particles
 */
function animateConfetti() {
    confettiCtx.clearRect(0, 0, confettiCanvas.width, confettiCanvas.height);

    confettiParticles.forEach((particle, index) => {
        // Update position
        particle.y += particle.speedY;
        particle.x += particle.speedX;
        particle.rotation += particle.rotationSpeed;

        // Draw particle
        confettiCtx.save();
        confettiCtx.translate(particle.x, particle.y);
        confettiCtx.rotate((particle.rotation * Math.PI) / 180);
        confettiCtx.fillStyle = particle.color;
        
        if (particle.shape === 'rect') {
            confettiCtx.fillRect(-particle.size / 2, -particle.size / 2, particle.size, particle.size * 0.6);
        } else {
            confettiCtx.beginPath();
            confettiCtx.arc(0, 0, particle.size / 2, 0, Math.PI * 2);
            confettiCtx.fill();
        }
        
        confettiCtx.restore();

        // Reset particle if off screen
        if (particle.y > confettiCanvas.height + 20) {
            confettiParticles[index] = createConfettiParticle();
            confettiParticles[index].y = -20;
        }
    });

    confettiAnimationId = requestAnimationFrame(animateConfetti);
}

/**
 * Stop confetti animation
 */
function stopConfetti() {
    if (confettiAnimationId) {
        cancelAnimationFrame(confettiAnimationId);
        confettiAnimationId = null;
    }
    confettiCtx.clearRect(0, 0, confettiCanvas.width, confettiCanvas.height);
    confettiParticles = [];
}

/**
 * Handle draw scenario
 */
function handleDraw() {
    gameState.gameActive = false;

    // Mark all cells as game over
    cells.forEach(cell => {
        cell.classList.add('game-over');
    });

    // Display draw message
    gameMessage.textContent = "🤝 It's a Draw!";
    gameMessage.className = 'game-message draw';

    // Update turn indicator
    turnIndicator.textContent = 'Game Over';
    turnIndicator.className = 'turn-indicator';
}

/**
 * Switch to the other player
 */
function switchPlayer() {
    gameState.currentPlayer = gameState.currentPlayer === 'X' ? 'O' : 'X';
    updateTurnIndicator();
}

/**
 * Update the turn indicator display
 */
function updateTurnIndicator() {
    const playerLabel = gameState.mode === 'vs-computer' && gameState.currentPlayer === 'O' 
        ? "Computer's" 
        : `Player ${gameState.currentPlayer}'s`;
    turnIndicator.textContent = `${playerLabel} Turn`;
    turnIndicator.className = `turn-indicator player-${gameState.currentPlayer.toLowerCase()}`;
}

/**
 * Make computer move
 */
function makeComputerMove() {
    gameState.isComputerTurn = true;
    
    // Disable cells visually during computer turn
    cells.forEach(cell => cell.classList.add('disabled'));
    gameBoard.classList.add('thinking');
    
    // Add a small delay to make it feel more natural
    setTimeout(() => {
        if (!gameState.gameActive) {
            gameState.isComputerTurn = false;
            cells.forEach(cell => cell.classList.remove('disabled'));
            gameBoard.classList.remove('thinking');
            return;
        }
        
        const moveIndex = findBestMove();
        
        if (moveIndex !== -1) {
            const cell = cells[moveIndex];
            
            // Update game state
            gameState.board[moveIndex] = 'O';
            
            // Update UI
            cell.textContent = 'O';
            cell.classList.add('o', 'taken');
            cell.setAttribute('aria-label', `Cell ${moveIndex + 1}, O`);
            
            // Check for win or draw
            const winResult = checkWin();
            
            if (winResult) {
                handleWin(winResult);
            } else if (checkDraw()) {
                handleDraw();
            } else {
                switchPlayer();
            }
        }
        
        // Re-enable cells
        gameState.isComputerTurn = false;
        cells.forEach(cell => cell.classList.remove('disabled'));
        gameBoard.classList.remove('thinking');
    }, 600);
}

/**
 * Find the best move for the computer
 * Uses a simple strategy: try to win, block opponent, or pick best available
 * @returns {number} Index of the best move
 */
function findBestMove() {
    const emptyIndices = gameState.board
        .map((val, idx) => val === '' ? idx : -1)
        .filter(idx => idx !== -1);
    
    if (emptyIndices.length === 0) return -1;
    
    // 1. Try to win
    for (const index of emptyIndices) {
        gameState.board[index] = 'O';
        if (checkWin()) {
            gameState.board[index] = '';
            return index;
        }
        gameState.board[index] = '';
    }
    
    // 2. Block opponent from winning
    for (const index of emptyIndices) {
        gameState.board[index] = 'X';
        if (checkWin()) {
            gameState.board[index] = '';
            return index;
        }
        gameState.board[index] = '';
    }
    
    // 3. Take center if available
    if (emptyIndices.includes(4)) {
        return 4;
    }
    
    // 4. Take a corner if available
    const corners = [0, 2, 6, 8].filter(c => emptyIndices.includes(c));
    if (corners.length > 0) {
        return corners[Math.floor(Math.random() * corners.length)];
    }
    
    // 5. Take any available edge
    const edges = [1, 3, 5, 7].filter(e => emptyIndices.includes(e));
    if (edges.length > 0) {
        return edges[Math.floor(Math.random() * edges.length)];
    }
    
    // Fallback: random empty cell
    return emptyIndices[Math.floor(Math.random() * emptyIndices.length)];
}

/**
 * Reset game state (without changing mode)
 */
function resetGameState() {
    gameState.board = ['', '', '', '', '', '', '', '', ''];
    gameState.currentPlayer = 'X';
    gameState.gameActive = true;
    gameState.winner = null;
    gameState.isComputerTurn = false;
    
    // Reset cells
    cells.forEach((cell, index) => {
        cell.textContent = '';
        cell.className = 'cell';
        cell.setAttribute('aria-label', `Cell ${index + 1}, empty`);
    });
    
    // Clear message
    gameMessage.textContent = '';
    gameMessage.className = 'game-message';
}

/**
 * Restart the game
 */
function restartGame() {
    // Reset game state
    resetGameState();

    // Update turn indicator
    updateTurnIndicator();
}

// Initialize the game when DOM is ready
document.addEventListener('DOMContentLoaded', initGame);
