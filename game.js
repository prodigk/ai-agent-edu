// Core Game Engine for Premium Brick Breaker
(function() {
  // --- Game Settings & Configuration ---
  const CANVAS_WIDTH = 800;
  const CANVAS_HEIGHT = 600;
  
  // DOM Elements
  const canvas = document.getElementById('gameCanvas');
  const ctx = canvas.getContext('2d');
  
  const scoreEl = document.getElementById('score');
  const highScoreEl = document.getElementById('highScore');
  const levelEl = document.getElementById('level');
  const levelNameEl = document.getElementById('levelName');
  const livesContainer = document.getElementById('livesContainer');
  
  // Power-up Timer Badges
  const badgeLaser = document.getElementById('badge-laser');
  const badgeExpand = document.getElementById('badge-expand');
  const badgeSlow = document.getElementById('badge-slow');
  const badgeShield = document.getElementById('badge-shield');
  
  const timerLaser = document.getElementById('timer-laser');
  const timerExpand = document.getElementById('timer-expand');
  const timerSlow = document.getElementById('timer-slow');
  
  // Dialog Overlay screens
  const screenStart = document.getElementById('screen-start');
  const screenPause = document.getElementById('screen-pause');
  const screenGameOver = document.getElementById('screen-gameover');
  const screenLevelComplete = document.getElementById('screen-levelcomplete');
  
  // Stats inside screens
  const finalScoreEl = document.getElementById('final-score');
  const clearedLevelNameEl = document.getElementById('cleared-level-name');
  const levelBonusEl = document.getElementById('level-bonus');
  
  // Buttons
  const btnStart = document.getElementById('btn-start');
  const btnResume = document.getElementById('btn-resume');
  const btnRestartPause = document.getElementById('btn-restart-pause');
  const btnRestartGameOver = document.getElementById('btn-restart-gameover');
  const btnNextLevel = document.getElementById('btn-next-level');
  const btnMute = document.getElementById('btn-mute');
  const difficultyButtons = document.querySelectorAll('.difficulty-btn');
  const themeSelectors = document.querySelectorAll('.theme-option');

  // --- Game State Variables ---
  let score = 0;
  let highScore = parseInt(localStorage.getItem('brick_breaker_highscore')) || 0;
  let currentLevelIdx = 0;
  let lives = 3;
  let maxLives = 5;
  let gameState = 'START'; // START, PLAYING, PAUSED, GAMEOVER, LEVEL_COMPLETE
  let difficulty = 'normal'; // easy, normal, hard
  let currentTheme = 'cyberpunk'; // cyberpunk, retro, pastel
  
  // Game Entities
  let paddle = {};
  let balls = [];
  let bricks = [];
  let powerUps = [];
  let lasers = [];
  let particles = [];
  
  // Power-up Durations (in milliseconds)
  const POWERUP_DURATION_EXPAND = 10000;
  const POWERUP_DURATION_LASER = 8000;
  const POWERUP_DURATION_SLOW = 8000;
  
  // Active states with timestamps
  let powerUpTimers = {
    expandEnd: 0,
    laserEnd: 0,
    slowEnd: 0
  };
  
  let shieldFloorActive = false;
  let ballSpawnAttached = true; // Ball rests on paddle until launched
  let laserCooldown = 0; // Cooldown between laser shots (ms)
  let lastTime = 0; // For delta time calculations

  // Key states
  let keys = {
    ArrowLeft: false,
    ArrowRight: false,
    KeyA: false,
    KeyD: false,
    Space: false
  };

  // Mouse / Touch position
  let pointerX = null;
  let pointerActive = false;

  // Sound Reference
  const sound = window.audioManager;

  // --- Initializing Functions ---
  function initGame() {
    highScoreEl.textContent = highScore;
    setupEventListeners();
    setDifficulty('normal');
    resetGame();
    requestAnimationFrame(gameLoop);
  }

  function resetGame() {
    score = 0;
    currentLevelIdx = 0;
    lives = getStartingLives();
    shieldFloorActive = false;
    powerUpTimers = { expandEnd: 0, laserEnd: 0, slowEnd: 0 };
    balls = [];
    powerUps = [];
    lasers = [];
    particles = [];
    
    updateScoreUI();
    loadLevel(currentLevelIdx);
  }

  function getStartingLives() {
    if (difficulty === 'easy') return 5;
    if (difficulty === 'hard') return 2;
    return 3;
  }

  function getSpeedModifier() {
    if (difficulty === 'easy') return 0.8;
    if (difficulty === 'hard') return 1.25;
    return 1.0;
  }

  function loadLevel(levelIdx) {
    const levelData = GAME_LEVELS[levelIdx];
    levelEl.textContent = levelIdx + 1;
    levelNameEl.textContent = levelData.name;
    
    // Setup Paddle
    const padWidth = 120;
    paddle = {
      x: CANVAS_WIDTH / 2 - padWidth / 2,
      y: CANVAS_HEIGHT - 35,
      width: padWidth,
      height: 15,
      speed: 10,
      originalWidth: padWidth
    };

    // Setup Bricks
    bricks = [];
    const grid = levelData.grid;
    const numRows = grid.length;
    const numCols = grid[0].length;
    
    const padding = 6;
    const topOffset = 60;
    const totalPaddingWidth = padding * (numCols + 1);
    const brickWidth = (CANVAS_WIDTH - totalPaddingWidth) / numCols;
    const brickHeight = 22;

    for (let r = 0; r < numRows; r++) {
      for (let c = 0; c < numCols; c++) {
        const type = grid[r][c];
        if (type > 0) {
          bricks.push({
            x: padding + c * (brickWidth + padding),
            y: topOffset + r * (brickHeight + padding),
            width: brickWidth,
            height: brickHeight,
            type: type,
            // 9 is unbreakable, others require hits matching their type
            hitsLeft: type === 9 ? 999999 : type,
            maxHits: type === 9 ? 999999 : type
          });
        }
      }
    }

    // Reset items and active powers
    powerUps = [];
    lasers = [];
    shieldFloorActive = false;
    powerUpTimers = { expandEnd: 0, laserEnd: 0, slowEnd: 0 };

    // Setup Balls
    balls = [];
    spawnBallOnPaddle();
    updateLivesUI();
  }

  function spawnBallOnPaddle() {
    ballSpawnAttached = true;
    const speed = GAME_LEVELS[currentLevelIdx].baseSpeed * getSpeedModifier();
    balls = [{
      x: paddle.x + paddle.width / 2,
      y: paddle.y - 10,
      dx: 0,
      dy: 0,
      radius: 8,
      speed: speed,
      baseSpeed: speed
    }];
  }

  function launchBall() {
    if (!ballSpawnAttached || balls.length === 0) return;
    ballSpawnAttached = false;
    // Launch at a 60 degree angle upwards
    const angle = -Math.PI / 3; // 60 degrees left-upwards
    const ball = balls[0];
    ball.dx = ball.speed * Math.sin(angle);
    ball.dy = ball.speed * Math.cos(angle);
    sound.playPaddleHit();
  }

  // --- Events and Listeners ---
  function setupEventListeners() {
    // Keyboard Controls
    window.addEventListener('keydown', e => {
      if (e.code === 'ArrowLeft' || e.code === 'KeyA') keys.ArrowLeft = true;
      if (e.code === 'ArrowRight' || e.code === 'KeyD') keys.ArrowRight = true;
      if (e.code === 'Space') {
        keys.Space = true;
        handleActionInput();
      }
      if (e.code === 'Escape') {
        togglePause();
      }
    });

    window.addEventListener('keyup', e => {
      if (e.code === 'ArrowLeft' || e.code === 'KeyA') keys.ArrowLeft = false;
      if (e.code === 'ArrowRight' || e.code === 'KeyD') keys.ArrowRight = false;
      if (e.code === 'Space') keys.Space = false;
    });

    // Mouse Controls inside canvas
    canvas.addEventListener('mousemove', e => {
      const rect = canvas.getBoundingClientRect();
      const scaleX = CANVAS_WIDTH / rect.width;
      pointerX = (e.clientX - rect.left) * scaleX;
      pointerActive = true;
    });

    canvas.addEventListener('mouseleave', () => {
      pointerActive = false;
    });

    canvas.addEventListener('click', () => {
      handleActionInput();
      sound.init(); // Satisfy browser autoplay policy
    });

    // Touch Controls for Mobile
    canvas.addEventListener('touchstart', e => {
      e.preventDefault();
      pointerActive = true;
      sound.init();
      const rect = canvas.getBoundingClientRect();
      const scaleX = CANVAS_WIDTH / rect.width;
      pointerX = (e.touches[0].clientX - rect.left) * scaleX;
      
      handleActionInput();
    }, { passive: false });

    canvas.addEventListener('touchmove', e => {
      e.preventDefault();
      const rect = canvas.getBoundingClientRect();
      const scaleX = CANVAS_WIDTH / rect.width;
      pointerX = (e.touches[0].clientX - rect.left) * scaleX;
    }, { passive: false });

    canvas.addEventListener('touchend', () => {
      // Keep pointerActive true so it doesn't snap, but can clear on multi-touch ends
    });

    // Menu Actions
    btnStart.addEventListener('click', () => {
      sound.init();
      hideOverlays();
      gameState = 'PLAYING';
      resetGame();
    });

    btnResume.addEventListener('click', () => {
      hideOverlays();
      gameState = 'PLAYING';
    });

    btnRestartPause.addEventListener('click', () => {
      hideOverlays();
      gameState = 'PLAYING';
      resetGame();
    });

    btnRestartGameOver.addEventListener('click', () => {
      hideOverlays();
      gameState = 'PLAYING';
      resetGame();
    });

    btnNextLevel.addEventListener('click', () => {
      hideOverlays();
      gameState = 'PLAYING';
      currentLevelIdx++;
      if (currentLevelIdx < GAME_LEVELS.length) {
        loadLevel(currentLevelIdx);
      } else {
        // Victory! (Loop back or trigger victory state)
        currentLevelIdx = 0;
        loadLevel(0);
      }
    });

    btnMute.addEventListener('click', () => {
      const isMuted = sound.toggleMute();
      btnMute.innerHTML = isMuted ? 
        `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 5L6 9H2v6h4l5 4V5z"/><line x1="23" y1="9" x2="17" y2="15"/><line x1="17" y1="9" x2="23" y2="15"/></svg>` :
        `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 5L6 9H2v6h4l5 4V5z"/><path d="M19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.07"/></svg>`;
      btnMute.classList.toggle('muted', isMuted);
    });

    // Difficulty selection
    difficultyButtons.forEach(btn => {
      btn.addEventListener('click', () => {
        difficultyButtons.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        setDifficulty(btn.dataset.difficulty);
      });
    });

    // Theme selector
    themeSelectors.forEach(btn => {
      btn.addEventListener('click', () => {
        themeSelectors.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        setTheme(btn.dataset.theme);
      });
    });
  }

  function handleActionInput() {
    if (gameState === 'PLAYING') {
      if (ballSpawnAttached) {
        launchBall();
      } else if (Date.now() < powerUpTimers.laserEnd) {
        fireLasers();
      }
    }
  }

  function setDifficulty(diff) {
    difficulty = diff;
  }

  function setTheme(themeName) {
    currentTheme = themeName;
    document.body.className = `theme-${themeName}`;
  }

  function togglePause() {
    if (gameState === 'PLAYING') {
      gameState = 'PAUSED';
      showOverlay(screenPause);
    } else if (gameState === 'PAUSED') {
      hideOverlays();
      gameState = 'PLAYING';
    }
  }

  function showOverlay(overlayElement) {
    // Hide all overlays first
    hideOverlays();
    overlayElement.classList.add('active');
  }

  function hideOverlays() {
    screenStart.classList.remove('active');
    screenPause.classList.remove('active');
    screenGameOver.classList.remove('active');
    screenLevelComplete.classList.remove('active');
  }

  // --- UI Update Helpers ---
  function updateScoreUI() {
    scoreEl.textContent = score;
    if (score > highScore) {
      highScore = score;
      highScoreEl.textContent = highScore;
      localStorage.setItem('brick_breaker_highscore', highScore);
    }
  }

  function updateLivesUI() {
    livesContainer.innerHTML = '';
    for (let i = 0; i < maxLives; i++) {
      const heart = document.createElement('div');
      heart.className = 'heart-icon';
      if (i < lives) {
        heart.innerHTML = `<svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/></svg>`;
      } else {
        heart.innerHTML = `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/></svg>`;
        heart.style.opacity = '0.3';
      }
      livesContainer.appendChild(heart);
    }
  }

  function updatePowerUpBadges() {
    const now = Date.now();
    
    // Laser Badge
    if (now < powerUpTimers.laserEnd) {
      badgeLaser.classList.add('active');
      timerLaser.textContent = Math.ceil((powerUpTimers.laserEnd - now) / 1000) + 's';
    } else {
      badgeLaser.classList.remove('active');
    }

    // Expand Badge
    if (now < powerUpTimers.expandEnd) {
      badgeExpand.classList.add('active');
      timerExpand.textContent = Math.ceil((powerUpTimers.expandEnd - now) / 1000) + 's';
      paddle.width = paddle.originalWidth * 1.5;
    } else {
      badgeExpand.classList.remove('active');
      paddle.width = paddle.originalWidth;
    }

    // Slow Badge
    if (now < powerUpTimers.slowEnd) {
      badgeSlow.classList.add('active');
      timerSlow.textContent = Math.ceil((powerUpTimers.slowEnd - now) / 1000) + 's';
    } else {
      badgeSlow.classList.remove('active');
    }

    // Shield Badge
    if (shieldFloorActive) {
      badgeShield.classList.add('active');
    } else {
      badgeShield.classList.remove('active');
    }
  }

  // --- Laser Functionality ---
  function fireLasers() {
    const now = Date.now();
    if (now < laserCooldown) return;
    laserCooldown = now + 300; // Fire rate limit 300ms
    
    lasers.push({
      x: paddle.x + 5,
      y: paddle.y - 10,
      width: 4,
      height: 15,
      dy: -9
    });

    lasers.push({
      x: paddle.x + paddle.width - 9,
      y: paddle.y - 10,
      width: 4,
      height: 15,
      dy: -9
    });

    sound.playLaser();
  }

  // --- Particles (Brick Explosion) ---
  function spawnParticles(x, y, color) {
    const count = 10 + Math.floor(Math.random() * 8);
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 1 + Math.random() * 4;
      particles.push({
        x: x,
        y: y,
        dx: speed * Math.cos(angle),
        dy: speed * Math.sin(angle),
        color: color,
        size: 2 + Math.random() * 4,
        alpha: 1,
        decay: 0.015 + Math.random() * 0.02
      });
    }
  }

  // --- Power-ups Spawn ---
  function maybeSpawnPowerUp(x, y) {
    const rand = Math.random();
    if (rand > 0.18) return; // 18% spawn rate
    
    // Choose item type
    const items = [
      { type: 'multiball', weight: 0.25 },
      { type: 'slow', weight: 0.20 },
      { type: 'expand', weight: 0.20 },
      { type: 'laser', weight: 0.15 },
      { type: 'shield', weight: 0.12 },
      { type: 'life', weight: 0.08 }
    ];

    let choiceRand = Math.random();
    let accumulated = 0;
    let selectedType = 'multiball';
    
    for (let item of items) {
      accumulated += item.weight;
      if (choiceRand <= accumulated) {
        selectedType = item.type;
        break;
      }
    }

    powerUps.push({
      x: x,
      y: y,
      width: 26,
      height: 26,
      type: selectedType,
      dy: 2.2 // Falling speed
    });
  }

  function applyPowerUp(type) {
    sound.playPowerUp();
    const now = Date.now();

    if (type === 'multiball') {
      // Duplicate balls
      let newBalls = [];
      balls.forEach(ball => {
        // Spawn 2 extra balls from the current location with slightly offset angles
        for (let i = 0; i < 2; i++) {
          const spreadAngle = (Math.random() - 0.5) * 0.5; // Offset within ~15 deg
          const currentAngle = Math.atan2(ball.dy, ball.dx);
          const newAngle = currentAngle + spreadAngle;
          
          newBalls.push({
            x: ball.x,
            y: ball.y,
            dx: ball.speed * Math.cos(newAngle),
            dy: ball.speed * Math.sin(newAngle),
            radius: ball.radius,
            speed: ball.speed,
            baseSpeed: ball.baseSpeed
          });
        }
      });
      balls = [...balls, ...newBalls];
      // Safety limit: cap at 15 balls to prevent engine freeze
      if (balls.length > 15) balls = balls.slice(0, 15);
    } 
    else if (type === 'slow') {
      powerUpTimers.slowEnd = now + POWERUP_DURATION_SLOW;
    } 
    else if (type === 'expand') {
      powerUpTimers.expandEnd = now + POWERUP_DURATION_EXPAND;
    } 
    else if (type === 'laser') {
      powerUpTimers.laserEnd = now + POWERUP_DURATION_LASER;
    } 
    else if (type === 'shield') {
      shieldFloorActive = true;
    } 
    else if (type === 'life') {
      if (lives < maxLives) {
        lives++;
        updateLivesUI();
      }
    }
  }

  // --- Collision Detection Helpers ---
  function checkRectOverlap(rect1, rect2) {
    return rect1.x < rect2.x + rect2.width &&
           rect1.x + rect1.width > rect2.x &&
           rect1.y < rect2.y + rect2.height &&
           rect1.y + rect1.height > rect2.y;
  }

  function checkBallBrickCollision(ball, brick) {
    // Find closest point on brick to ball center
    const closestX = Math.max(brick.x, Math.min(ball.x, brick.x + brick.width));
    const closestY = Math.max(brick.y, Math.min(ball.y, brick.y + brick.height));

    const distanceX = ball.x - closestX;
    const distanceY = ball.y - closestY;
    const distanceSquared = (distanceX * distanceX) + (distanceY * distanceY);

    if (distanceSquared < ball.radius * ball.radius) {
      // Overlap detected! Figure out which side was hit
      let side = '';
      const overlapX = ball.radius - Math.abs(distanceX);
      const overlapY = ball.radius - Math.abs(distanceY);

      // Simple heuristic: compare penetration on X and Y to find collision normal
      if (closestX === brick.x || closestX === brick.x + brick.width) {
        if (closestY === brick.y || closestY === brick.y + brick.height) {
          // Corner hit - bounce both
          side = 'corner';
        } else {
          side = 'horizontal'; // Hits left/right
        }
      } else {
        side = 'vertical'; // Hits top/bottom
      }

      return { hit: true, side, closestX, closestY };
    }
    return { hit: false };
  }

  // --- Core Game Loop and Mechanics ---
  function gameLoop(timestamp) {
    if (lastTime === 0) lastTime = timestamp;
    const dt = timestamp - lastTime;
    lastTime = timestamp;

    if (gameState === 'PLAYING') {
      update(dt);
    }
    render();
    
    requestAnimationFrame(gameLoop);
  }

  function update(dt) {
    // --- 1. Paddle Movement ---
    if (pointerActive && pointerX !== null) {
      // Snap paddle to pointer, centering it and clamping to bounds
      paddle.x = pointerX - paddle.width / 2;
    } else {
      // Keyboard input fallback
      if (keys.ArrowLeft || keys.KeyA) {
        paddle.x -= paddle.speed;
      }
      if (keys.ArrowRight || keys.KeyD) {
        paddle.x += paddle.speed;
      }
    }
    // Clamp paddle within screen boundary
    paddle.x = Math.max(0, Math.min(CANVAS_WIDTH - paddle.width, paddle.x));

    // --- 2. active Power-up timers ---
    updatePowerUpBadges();
    const now = Date.now();
    const isSlowActive = now < powerUpTimers.slowEnd;

    // --- 3. Ball Movement & Physics ---
    balls.forEach((ball, bIdx) => {
      // If attached to paddle, follow paddle
      if (ballSpawnAttached) {
        ball.x = paddle.x + paddle.width / 2;
        ball.y = paddle.y - ball.radius - 2;
        return;
      }

      // Calculate target velocity based on active slow items
      let targetSpeed = ball.baseSpeed;
      if (isSlowActive) {
        targetSpeed *= 0.7; // 30% slower
      }
      
      // Gradually adjust speed toward target speed (smooth deceleration/acceleration)
      if (Math.abs(ball.speed - targetSpeed) > 0.05) {
        ball.speed += (targetSpeed - ball.speed) * 0.1;
      } else {
        ball.speed = targetSpeed;
      }

      // Re-normalize velocity vector with current speed
      const currentVel = Math.sqrt(ball.dx * ball.dx + ball.dy * ball.dy);
      if (currentVel > 0) {
        ball.dx = (ball.dx / currentVel) * ball.speed;
        ball.dy = (ball.dy / currentVel) * ball.speed;
      }

      // Move ball
      ball.x += ball.dx;
      ball.y += ball.dy;

      // Wall Bounce (X boundary)
      if (ball.x - ball.radius <= 0) {
        ball.x = ball.radius + 1;
        ball.dx = -ball.dx;
        sound.playWallHit();
      } else if (ball.x + ball.radius >= CANVAS_WIDTH) {
        ball.x = CANVAS_WIDTH - ball.radius - 1;
        ball.dx = -ball.dx;
        sound.playWallHit();
      }

      // Ceiling Bounce
      if (ball.y - ball.radius <= 0) {
        ball.y = ball.radius + 1;
        ball.dy = -ball.dy;
        sound.playWallHit();
      }

      // Floor / Death Check
      if (ball.y + ball.radius >= CANVAS_HEIGHT) {
        if (shieldFloorActive) {
          // Shield saves the ball!
          shieldFloorActive = false;
          ball.y = CANVAS_HEIGHT - ball.radius - 10;
          ball.dy = -Math.abs(ball.dy);
          sound.playPaddleHit(); // Thump
        } else {
          // Remove ball
          balls.splice(bIdx, 1);
          if (balls.length === 0) {
            handleLifeLost();
          }
          return;
        }
      }

      // Paddle Collision
      // Bounding box pre-check
      if (ball.x + ball.radius >= paddle.x &&
          ball.x - ball.radius <= paddle.x + paddle.width &&
          ball.y + ball.radius >= paddle.y &&
          ball.y - ball.radius <= paddle.y + paddle.height) {
        
        // Bounce off paddle
        sound.playPaddleHit();
        
        // Apply paddle deflection angle based on hit location
        const hitX = ball.x - (paddle.x + paddle.width / 2);
        const normalizedHitX = hitX / (paddle.width / 2); // -1.0 to 1.0
        
        // Deflect up to 70 degrees
        const maxAngle = (70 * Math.PI) / 180;
        const angle = normalizedHitX * maxAngle;
        
        ball.dx = ball.speed * Math.sin(angle);
        ball.dy = -ball.speed * Math.cos(angle);
        
        // Displace ball slightly to avoid double hits
        ball.y = paddle.y - ball.radius - 1;
      }

      // Brick Collision
      for (let i = bricks.length - 1; i >= 0; i--) {
        const brick = bricks[i];
        const col = checkBallBrickCollision(ball, brick);

        if (col.hit) {
          // Bounce logic based on hit face
          if (col.side === 'vertical') {
            ball.dy = -ball.dy;
            ball.y += ball.dy > 0 ? 1 : -1; // dislodge
          } else if (col.side === 'horizontal') {
            ball.dx = -ball.dx;
            ball.x += ball.dx > 0 ? 1 : -1; // dislodge
          } else {
            // Corner hit - reverse both velocities
            ball.dx = -ball.dx;
            ball.dy = -ball.dy;
          }

          // Damage brick
          if (brick.type !== 9) { // 9 = Unbreakable
            brick.hitsLeft--;
            sound.playBrickHit(brick.type);
            
            // Check if destroyed
            if (brick.hitsLeft <= 0) {
              score += getBrickScore(brick.type);
              updateScoreUI();
              spawnParticles(brick.x + brick.width / 2, brick.y + brick.height / 2, getBrickColor(brick.type));
              maybeSpawnPowerUp(brick.x + brick.width / 2, brick.y + brick.height / 2);
              bricks.splice(i, 1);
              
              // Level clear check (ignore type 9 unbreakable blocks)
              const breakablesRemaining = bricks.filter(b => b.type !== 9).length;
              if (breakablesRemaining === 0) {
                handleLevelClear();
              }
            }
          } else {
            sound.playWallHit(); // Metallic bounce for unbreakable
          }
          break; // Process one brick collision per frame per ball
        }
      }
    });

    // --- 4. Lasers Movement & Collision ---
    for (let lIdx = lasers.length - 1; lIdx >= 0; lIdx--) {
      const laser = lasers[lIdx];
      laser.y += laser.dy;

      // Check boundary
      if (laser.y < 0) {
        lasers.splice(lIdx, 1);
        continue;
      }

      // Check Brick collision
      let laserHit = false;
      for (let bIdx = bricks.length - 1; bIdx >= 0; bIdx--) {
        const brick = bricks[bIdx];
        if (checkRectOverlap(laser, brick)) {
          laserHit = true;
          
          if (brick.type !== 9) {
            brick.hitsLeft--;
            sound.playBrickHit(brick.type);
            
            if (brick.hitsLeft <= 0) {
              score += getBrickScore(brick.type);
              updateScoreUI();
              spawnParticles(brick.x + brick.width / 2, brick.y + brick.height / 2, getBrickColor(brick.type));
              maybeSpawnPowerUp(brick.x + brick.width / 2, brick.y + brick.height / 2);
              bricks.splice(bIdx, 1);
              
              // Check level complete
              const breakablesRemaining = bricks.filter(b => b.type !== 9).length;
              if (breakablesRemaining === 0) {
                handleLevelClear();
              }
            }
          } else {
            sound.playWallHit(); // Metal ping
          }
          break;
        }
      }

      if (laserHit) {
        lasers.splice(lIdx, 1);
      }
    }

    // --- 5. Power-up Movement & Paddle Collision ---
    for (let pIdx = powerUps.length - 1; pIdx >= 0; pIdx--) {
      const item = powerUps[pIdx];
      item.y += item.dy;

      // Bottom death bounds
      if (item.y > CANVAS_HEIGHT) {
        powerUps.splice(pIdx, 1);
        continue;
      }

      // Paddle collision
      if (item.x + item.width >= paddle.x &&
          item.x <= paddle.x + paddle.width &&
          item.y + item.height >= paddle.y &&
          item.y <= paddle.y + paddle.height) {
        
        applyPowerUp(item.type);
        powerUps.splice(pIdx, 1);
      }
    }

    // --- 6. Particle Updates ---
    for (let ptIdx = particles.length - 1; ptIdx >= 0; ptIdx--) {
      const p = particles[ptIdx];
      p.x += p.dx;
      p.y += p.dy;
      // Add slight gravity
      p.dy += 0.05;
      p.alpha -= p.decay;

      if (p.alpha <= 0) {
        particles.splice(ptIdx, 1);
      }
    }
  }

  function handleLifeLost() {
    lives--;
    updateLivesUI();
    sound.playLifeLost();

    if (lives <= 0) {
      // Game Over!
      gameState = 'GAMEOVER';
      finalScoreEl.textContent = score;
      sound.playGameOver();
      showOverlay(screenGameOver);
    } else {
      // Re-spawn single ball on paddle
      spawnBallOnPaddle();
    }
  }

  function handleLevelClear() {
    gameState = 'LEVEL_COMPLETE';
    sound.playLevelUp();
    
    clearedLevelNameEl.textContent = GAME_LEVELS[currentLevelIdx].name;
    const bonus = (currentLevelIdx + 1) * 1000;
    levelBonusEl.textContent = bonus;
    
    score += bonus;
    updateScoreUI();
    
    showOverlay(screenLevelComplete);
    // Prepare button state
    if (currentLevelIdx + 1 >= GAME_LEVELS.length) {
      btnNextLevel.textContent = "Restart Game (Victory!)";
    } else {
      btnNextLevel.textContent = "Next Level";
    }
  }

  // --- Rendering Helpers ---
  function getBrickColor(type) {
    if (type === 1) return 'rgba(255, 0, 128, 1)';   // Hot Pink
    if (type === 2) return 'rgba(0, 240, 255, 1)';   // Electric Cyan
    if (type === 3) return 'rgba(255, 215, 0, 1)';   // Bright Gold
    if (type === 9) return 'rgba(160, 160, 170, 1)'; // Metallic Silver
    return '#fff';
  }

  function getBrickScore(type) {
    if (type === 1) return 100;
    if (type === 2) return 250;
    if (type === 3) return 500;
    return 0;
  }

  function render() {
    // Clear canvas
    ctx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

    // 1. Draw Grid Background (Futuristic cyberpunk look)
    drawBackground();

    // 2. Draw Shield Floor (if active)
    if (shieldFloorActive) {
      ctx.save();
      ctx.strokeStyle = 'rgba(0, 191, 255, 0.8)';
      ctx.lineWidth = 6;
      ctx.shadowColor = 'rgba(0, 191, 255, 1)';
      ctx.shadowBlur = 15;
      ctx.beginPath();
      ctx.moveTo(0, CANVAS_HEIGHT - 3);
      ctx.lineTo(CANVAS_WIDTH, CANVAS_HEIGHT - 3);
      ctx.stroke();
      ctx.restore();
    }

    // 3. Draw Bricks
    bricks.forEach(brick => {
      drawBrick(brick);
    });

    // 4. Draw Lasers
    lasers.forEach(laser => {
      ctx.save();
      ctx.fillStyle = '#cc00ff';
      ctx.shadowColor = '#cc00ff';
      ctx.shadowBlur = 10;
      ctx.fillRect(laser.x, laser.y, laser.width, laser.height);
      ctx.restore();
    });

    // 5. Draw Power-Ups
    powerUps.forEach(item => {
      drawPowerUp(item);
    });

    // 6. Draw Particles
    particles.forEach(p => {
      ctx.save();
      ctx.globalAlpha = p.alpha;
      ctx.fillStyle = p.color;
      ctx.shadowColor = p.color;
      ctx.shadowBlur = 5;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    });

    // 7. Draw Paddle
    drawPaddle();

    // 8. Draw Balls
    balls.forEach(ball => {
      drawBall(ball);
    });
  }

  function drawBackground() {
    ctx.fillStyle = '#0a0a16';
    ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

    // Draw grid overlay lines
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.02)';
    ctx.lineWidth = 1;
    const gridSize = 40;

    for (let x = 0; x < CANVAS_WIDTH; x += gridSize) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, CANVAS_HEIGHT);
      ctx.stroke();
    }
    for (let y = 0; y < CANVAS_HEIGHT; y += gridSize) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(CANVAS_WIDTH, y);
      ctx.stroke();
    }
  }

  function drawPaddle() {
    ctx.save();
    
    // Gradient fill based on theme
    const grad = ctx.createLinearGradient(paddle.x, paddle.y, paddle.x + paddle.width, paddle.y);
    const now = Date.now();
    
    // Choose neon glow color
    let glowColor = 'rgba(0, 240, 255, 1)';
    if (now < powerUpTimers.laserEnd) {
      glowColor = 'rgba(204, 0, 255, 1)'; // Purple glow for laser gun
      grad.addColorStop(0, '#ff00ff');
      grad.addColorStop(0.5, '#cc00ff');
      grad.addColorStop(1, '#ff00ff');
    } else if (now < powerUpTimers.expandEnd) {
      glowColor = 'rgba(255, 128, 0, 1)'; // Orange glow for expanded
      grad.addColorStop(0, '#ffbb00');
      grad.addColorStop(0.5, '#ff6600');
      grad.addColorStop(1, '#ffbb00');
    } else {
      grad.addColorStop(0, '#00ffff');
      grad.addColorStop(0.5, '#0088ff');
      grad.addColorStop(1, '#00ffff');
    }

    ctx.fillStyle = grad;
    ctx.shadowColor = glowColor;
    ctx.shadowBlur = 12;

    // Draw rounded paddle rectangle
    ctx.beginPath();
    const radius = paddle.height / 2;
    ctx.roundRect(paddle.x, paddle.y, paddle.width, paddle.height, radius);
    ctx.fill();

    // If laser active, draw small cannon nozzles on paddle ends
    if (now < powerUpTimers.laserEnd) {
      ctx.fillStyle = '#ff00ff';
      ctx.shadowColor = '#ff00ff';
      // Left barrel
      ctx.fillRect(paddle.x + 3, paddle.y - 6, 6, 8);
      // Right barrel
      ctx.fillRect(paddle.x + paddle.width - 9, paddle.y - 6, 6, 8);
    }

    ctx.restore();
  }

  function drawBall(ball) {
    ctx.save();
    
    let glowColor = 'rgba(255, 0, 128, 1)'; // Neon Pink default
    const now = Date.now();
    
    if (now < powerUpTimers.slowEnd) {
      glowColor = 'rgba(0, 240, 255, 1)'; // Light Cyan glow when slowed
    }

    // Ball gradient for 3D sphere look
    const radialGrad = ctx.createRadialGradient(
      ball.x - ball.radius * 0.3, 
      ball.y - ball.radius * 0.3, 
      ball.radius * 0.1, 
      ball.x, 
      ball.y, 
      ball.radius
    );

    if (now < powerUpTimers.slowEnd) {
      radialGrad.addColorStop(0, '#e0ffff');
      radialGrad.addColorStop(1, '#00bfff');
    } else {
      radialGrad.addColorStop(0, '#ff99dd');
      radialGrad.addColorStop(1, '#ff0080');
    }

    ctx.fillStyle = radialGrad;
    ctx.shadowColor = glowColor;
    ctx.shadowBlur = 10;
    
    ctx.beginPath();
    ctx.arc(ball.x, ball.y, ball.radius, 0, Math.PI * 2);
    ctx.fill();
    
    ctx.restore();
  }

  function drawBrick(brick) {
    ctx.save();

    const color = getBrickColor(brick.type);
    ctx.fillStyle = color;
    
    if (brick.type !== 9) {
      ctx.shadowColor = color;
      ctx.shadowBlur = 8;
      // Fade slightly as brick health depletes
      ctx.globalAlpha = 0.3 + (brick.hitsLeft / brick.maxHits) * 0.7;
    } else {
      // Unbreakable
      ctx.shadowColor = 'rgba(255, 255, 255, 0.2)';
      ctx.shadowBlur = 2;
    }

    // Draw rounded brick
    ctx.beginPath();
    ctx.roundRect(brick.x, brick.y, brick.width, brick.height, 4);
    ctx.fill();

    // Draw overlay borders / details
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.4)';
    ctx.lineWidth = 1;
    ctx.stroke();

    // Draw cracks for damaged multi-hit bricks
    if (brick.maxHits > 1 && brick.hitsLeft < brick.maxHits && brick.type !== 9) {
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.75)';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      
      const seed = brick.x + brick.y; // pseudo-random generator based on coord
      const cx = brick.x + brick.width / 2;
      const cy = brick.y + brick.height / 2;
      
      // Crack line 1
      ctx.moveTo(cx, cy);
      ctx.lineTo(brick.x + (seed % 20), brick.y + (seed % 10));
      // Crack line 2
      ctx.moveTo(cx, cy);
      ctx.lineTo(brick.x + brick.width - ((seed * 7) % 20), brick.y + brick.height - ((seed * 3) % 10));
      
      ctx.stroke();
    }

    ctx.restore();
  }

  function drawPowerUp(item) {
    ctx.save();

    // Determine color and letter representing the item
    let color = '#fff';
    let label = '';
    let shadow = '';

    switch(item.type) {
      case 'multiball':
        color = '#00ff88'; // Vibrant Green
        label = '+';
        shadow = 'rgba(0, 255, 136, 0.8)';
        break;
      case 'slow':
        color = '#00d0ff'; // Ice Blue
        label = '▼';
        shadow = 'rgba(0, 208, 255, 0.8)';
        break;
      case 'expand':
        color = '#ff9900'; // Safety Orange
        label = '↔';
        shadow = 'rgba(255, 153, 0, 0.8)';
        break;
      case 'laser':
        color = '#cc00ff'; // Electric Purple
        label = '⚡';
        shadow = 'rgba(204, 0, 255, 0.8)';
        break;
      case 'shield':
        color = '#00ffff'; // Aqua Cyan
        label = '＿';
        shadow = 'rgba(0, 255, 255, 0.8)';
        break;
      case 'life':
        color = '#ff3366'; // Pinkish Red
        label = '♥';
        shadow = 'rgba(255, 51, 102, 0.8)';
        break;
    }

    // Outer glowing circle capsule
    ctx.fillStyle = 'rgba(10, 10, 22, 0.85)';
    ctx.strokeStyle = color;
    ctx.lineWidth = 2;
    ctx.shadowColor = shadow;
    ctx.shadowBlur = 10;
    
    ctx.beginPath();
    ctx.arc(item.x + item.width/2, item.y + item.height/2, item.width/2, 0, Math.PI*2);
    ctx.fill();
    ctx.stroke();

    // Inner text symbol
    ctx.fillStyle = color;
    ctx.font = 'bold 15px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(label, item.x + item.width/2, item.y + item.height/2);

    ctx.restore();
  }

  // --- Start the engine ---
  window.addEventListener('DOMContentLoaded', initGame);

})();
