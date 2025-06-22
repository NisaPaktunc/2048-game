// 2048 Oyunu - Modüler Yapı
class Game2048 {
  constructor() {
    this.board = document.getElementById("game-board");
    this.scoreDisplay = document.getElementById("score");
    this.highscoreDisplay = document.getElementById("highscore");
    this.restartBtn = document.getElementById("restart-btn");
    this.undoBtn = document.getElementById("undo-btn");
    this.soundToggle = document.getElementById("sound-toggle");
    this.soundIcon = document.getElementById("sound-icon");
    this.gameOverModal = document.getElementById("game-over-modal");
    this.finalScoreDisplay = document.getElementById("final-score");
    this.playAgainBtn = document.getElementById("play-again-btn");
    this.themeSelect = document.getElementById("theme-select");
    this.statsBtn = document.getElementById("stats-btn");
    this.statsModal = document.getElementById("stats-modal");
    this.closeStatsBtn = document.getElementById("close-stats-btn");
    
    this.boardArray = [];
    this.score = 0;
    this.highscore = 0;
    this.soundEnabled = this.loadSoundPreference();
    this.isGameOver = false;
    this.touchStartX = 0;
    this.touchStartY = 0;
    this.minSwipeDistance = 30;
    this.moveHistory = []; // Hamle geçmişi için
    
    // İstatistik verileri
    this.stats = {
      totalGames: 0,
      wins: 0,
      bestScore: 0,
      highestTile: 0,
      totalScore: 0,
      totalTime: 0,
      gameStartTime: 0
    };
    
    // Başarımlar
    this.achievements = {
      first_win: { icon: '🏆', title: 'İlk Zafer', desc: 'İlk oyununu kazan', unlocked: false },
      reach_512: { icon: '🔥', title: 'Ateşli', desc: '512 taşına ulaş', unlocked: false },
      reach_1024: { icon: '🚀', title: 'Roket Adam', desc: '1024 taşına ulaş', unlocked: false },
      reach_2048: { icon: '👑', title: 'Kral', desc: '2048 taşına ulaş', unlocked: false },
      score_1000: { icon: '💯', title: 'Yüzlerce', desc: '1000 puan yap', unlocked: false },
      score_5000: { icon: '🎯', title: 'Hedef Vurucu', desc: '5000 puan yap', unlocked: false },
      play_10_games: { icon: '🕹️', title: 'Müptelası', desc: '10 oyun oyna', unlocked: false },
      play_50_games: { icon: '🎮', title: 'Uzman', desc: '50 oyun oyna', unlocked: false }
    };
    
    // Web Audio API için ses sistemi
    this.audioContext = null;
    this.initAudio();
    
    this.init();
  }
  
  init() {
    this.loadHighscore();
    this.loadThemePreference();
    this.loadStats();
    this.loadAchievements();
    this.setupEventListeners();
    this.updateSoundUI();
    this.createBoard();
  }
  
  setupEventListeners() {
    document.addEventListener("keydown", (e) => this.handleKeyPress(e));
    this.restartBtn.addEventListener("click", () => this.restartGame());
    this.undoBtn.addEventListener("click", () => this.undoMove());
    this.soundToggle.addEventListener("click", () => this.toggleSound());
    this.playAgainBtn.addEventListener("click", () => this.restartGame());
    this.themeSelect.addEventListener("change", (e) => this.changeTheme(e.target.value));
    this.statsBtn.addEventListener("click", () => this.showStatsModal());
    this.closeStatsBtn.addEventListener("click", () => this.hideStatsModal());
    
    // Ses sistemi için kullanıcı etkileşimi
    document.addEventListener("click", () => this.initAudioOnUserInteraction());
    
    this.board.addEventListener("touchstart", (e) => this.handleTouchStart(e), { passive: true });
    this.board.addEventListener("touchend", (e) => this.handleTouchEnd(e), { passive: true });
    this.board.addEventListener("touchmove", (e) => e.preventDefault(), { passive: false });
    
    this.gameOverModal.addEventListener("click", (e) => {
      if (e.target === this.gameOverModal) {
        this.hideGameOverModal();
      }
    });
    
    this.statsModal.addEventListener("click", (e) => {
      if (e.target === this.statsModal) {
        this.hideStatsModal();
      }
    });
    
    // Tab sistemi için event listener'lar
    this.statsModal.querySelectorAll('.tab-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const tabId = btn.dataset.tab;
        this.switchTab(tabId);
      });
    });
    
    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape") {
        if (this.gameOverModal.style.display !== "none") {
          this.hideGameOverModal();
        } else if (this.statsModal.style.display !== "none") {
          this.hideStatsModal();
        }
      }
    });
  }
  
  createBoard() {
    this.boardArray = [];
    this.board.innerHTML = "";
    this.score = 0;
    this.isGameOver = false;
    this.moveHistory = []; // Hamle geçmişini temizle
    this.updateUndoButton(); // Undo butonunu güncelle
    this.stats.gameStartTime = Date.now(); // Oyun başlangıç zamanını kaydet
    
    for (let i = 0; i < 16; i++) {
      const cell = document.createElement("div");
      cell.classList.add("cell");
      
      const span = document.createElement("span");
      span.textContent = "";
      cell.appendChild(span);
      
      this.board.appendChild(cell);
      this.boardArray.push(cell);
    }
    
    this.updateScore();
    this.generateNewTile();
    this.generateNewTile();
    this.updateCells();
  }
  
  generateNewTile() {
    const emptyCells = this.boardArray.filter(cell => 
      cell.querySelector("span").textContent === ""
    );
    
    if (emptyCells.length === 0) return;
    
    const randomCell = emptyCells[Math.floor(Math.random() * emptyCells.length)];
    const value = Math.random() < 0.9 ? "2" : "4";
    const span = randomCell.querySelector("span");
    
    span.textContent = value;
    randomCell.setAttribute("data-value", value);
    randomCell.classList.add("new-tile");
    
    setTimeout(() => {
      randomCell.classList.remove("new-tile");
    }, 300);
    
    this.playSound("newTile");
  }
  
  slide(row) {
    row = row.filter(num => num !== 0);
    
    for (let i = 0; i < row.length - 1; i++) {
      if (row[i] === row[i + 1]) {
        row[i] *= 2;
        this.score += row[i];
        row[i + 1] = 0;
        this.playSound("merge");
      }
    }
    
    row = row.filter(num => num !== 0);
    while (row.length < 4) {
      row.push(0);
    }
    
    return row;
  }
  
  move(direction) {
    if (this.isGameOver) return;
    
    // Hamle öncesi durumu kaydet
    this.saveMoveState();
    
    let moved = false;
    let newValues = [];

    const getRow = (i) => [
        parseInt(this.boardArray[i * 4].querySelector("span").textContent) || 0,
        parseInt(this.boardArray[i * 4 + 1].querySelector("span").textContent) || 0,
        parseInt(this.boardArray[i * 4 + 2].querySelector("span").textContent) || 0,
        parseInt(this.boardArray[i * 4 + 3].querySelector("span").textContent) || 0
    ];
    
    const getCol = (i) => [
        parseInt(this.boardArray[i].querySelector("span").textContent) || 0,
        parseInt(this.boardArray[i + 4].querySelector("span").textContent) || 0,
        parseInt(this.boardArray[i + 8].querySelector("span").textContent) || 0,
        parseInt(this.boardArray[i + 12].querySelector("span").textContent) || 0
    ];
    
    if (direction === 'left' || direction === 'right') {
        for (let i = 0; i < 4; i++) {
            let row = getRow(i);
            const originalRow = [...row];
            if (direction === 'right') row.reverse();
            let newRow = this.slide(row);
            if (direction === 'right') newRow.reverse();
            newValues.push(...newRow);
            if (JSON.stringify(originalRow) !== JSON.stringify(newRow)) moved = true;
        }
        this.updateBoard(newValues);
    } else { // up or down
        for (let i = 0; i < 4; i++) {
            let col = getCol(i);
            const originalCol = [...col];
            if (direction === 'down') col.reverse();
            let newCol = this.slide(col);
            if (direction === 'down') newCol.reverse();
            for (let j = 0; j < 4; j++) {
                this.boardArray[j * 4 + i].querySelector("span").textContent = newCol[j] === 0 ? "" : newCol[j];
            }
            if (JSON.stringify(originalCol) !== JSON.stringify(newCol)) moved = true;
        }
    }
    
    if (moved) {
      this.generateNewTile();
      this.updateScore();
      this.updateCells();
      this.updateUndoButton(); // Undo butonunu güncelle
      this.checkGameOver();
    } else {
      // Hamle yapılmadıysa geçmişten son durumu çıkar
      this.moveHistory.pop();
    }
  }

  updateBoard(newValues) {
    for (let i = 0; i < 16; i++) {
      const span = this.boardArray[i].querySelector("span");
      span.textContent = newValues[i] === 0 ? "" : newValues[i];
    }
  }
  
  handleKeyPress(e) {
    if (this.isGameOver && e.key !== "Escape") return;
    
    switch (e.key) {
      case "ArrowLeft": e.preventDefault(); this.move('left'); break;
      case "ArrowRight": e.preventDefault(); this.move('right'); break;
      case "ArrowUp": e.preventDefault(); this.move('up'); break;
      case "ArrowDown": e.preventDefault(); this.move('down'); break;
      case "r": case "R": this.restartGame(); break;
      case "z": case "Z": e.preventDefault(); this.undoMove(); break;
    }
  }
  
  handleTouchStart(e) {
    this.touchStartX = e.touches[0].clientX;
    this.touchStartY = e.touches[0].clientY;
  }
  
  handleTouchEnd(e) {
    if (this.isGameOver) return;
    
    const endX = e.changedTouches[0].clientX;
    const endY = e.changedTouches[0].clientY;
    
    const deltaX = endX - this.touchStartX;
    const deltaY = endY - this.touchStartY;
    
    if (Math.abs(deltaX) > this.minSwipeDistance || Math.abs(deltaY) > this.minSwipeDistance) {
        if (Math.abs(deltaX) > Math.abs(deltaY)) {
            this.move(deltaX > 0 ? 'right' : 'left');
        } else {
            this.move(deltaY > 0 ? 'down' : 'up');
        }
    }
  }
  
  checkGameOver() {
    const isFull = this.boardArray.every(cell => 
      cell.querySelector("span").textContent !== ""
    );
    
    if (!isFull) return;
    
    for (let i = 0; i < 16; i++) {
      const current = parseInt(this.boardArray[i].querySelector("span").textContent);
      const right = (i % 4 !== 3) ? parseInt(this.boardArray[i + 1].querySelector("span").textContent) : null;
      const down = (i < 12) ? parseInt(this.boardArray[i + 4].querySelector("span").textContent) : null;
      
      if (current === right || current === down) return;
    }
    
    this.gameOver();
  }
  
  gameOver() {
    this.isGameOver = true;
    this.playSound("gameOver");
    
    // İstatistikleri güncelle
    this.updateStats();
    this.checkAchievements();
    
    setTimeout(() => {
      this.showGameOverModal();
    }, 300);
  }
  
  showGameOverModal() {
    this.finalScoreDisplay.textContent = this.score;
    this.gameOverModal.style.display = "flex";
    this.playAgainBtn.focus();
  }
  
  hideGameOverModal() {
    this.gameOverModal.style.display = "none";
  }
  
  restartGame() {
    this.hideGameOverModal();
    this.createBoard();
  }
  
  updateScore() {
    this.scoreDisplay.textContent = this.score;
    this.updateHighscore();
  }
  
  updateHighscore() {
    if (this.score > this.highscore) {
      this.highscore = this.score;
      localStorage.setItem("2048_highscore", this.highscore);
    }
    this.highscoreDisplay.textContent = this.highscore;
  }
  
  loadHighscore() {
    this.highscore = parseInt(localStorage.getItem("2048_highscore")) || 0;
    this.highscoreDisplay.textContent = this.highscore;
  }
  
  updateCells() {
    this.boardArray.forEach((cell, index) => {
      const span = cell.querySelector("span");
      const value = span.textContent;
      
      cell.removeAttribute("data-value");
      if (value !== "") {
        cell.setAttribute("data-value", value);
      }
    });
  }
  
  toggleSound() {
    this.soundEnabled = !this.soundEnabled;
    this.saveSoundPreference();
    this.updateSoundUI();
    
    // Ses açıldığında test sesi çal
    if (this.soundEnabled) {
      // Audio context'i başlat (kullanıcı etkileşimi gerekli)
      if (this.audioContext && this.audioContext.state === 'suspended') {
        this.audioContext.resume();
      }
      this.createSoftSound(400, 0.2, 'sine'); // Yumuşak test sesi
    }
  }
  
  updateSoundUI() {
    this.soundIcon.textContent = this.soundEnabled ? "🔊" : "🔇";
    this.soundToggle.setAttribute("aria-label", 
      this.soundEnabled ? "Ses efektlerini kapat" : "Ses efektlerini aç"
    );
  }
  
  playSound(soundType) {
    if (!this.soundEnabled) return;
    
    switch (soundType) {
      case 'move':
        this.createSoftSound(350, 0.12, 'sine');
        break;
      case 'merge':
        this.createMelodicSound([400, 500, 600], 0.4);
        break;
      case 'gameOver':
        this.createSoftSound(250, 1.0, 'sine');
        break;
      case 'newTile':
        this.createSoftSound(450, 0.08, 'triangle');
        break;
      case 'undo':
        this.createSoftSound(300, 0.2, 'sine');
        break;
    }
  }
  
  // Yumuşak ses efekti oluştur
  createSoftSound(frequency, duration, type = 'sine') {
    if (!this.audioContext || !this.soundEnabled) return;
    
    try {
      const oscillator = this.audioContext.createOscillator();
      const gainNode = this.audioContext.createGain();
      
      oscillator.connect(gainNode);
      gainNode.connect(this.audioContext.destination);
      
      oscillator.frequency.setValueAtTime(frequency, this.audioContext.currentTime);
      oscillator.type = type;
      
      // Çok düşük ses seviyesi ve yumuşak başlangıç
      gainNode.gain.setValueAtTime(0, this.audioContext.currentTime);
      gainNode.gain.linearRampToValueAtTime(0.02, this.audioContext.currentTime + 0.03);
      gainNode.gain.exponentialRampToValueAtTime(0.001, this.audioContext.currentTime + duration);
      
      oscillator.start(this.audioContext.currentTime);
      oscillator.stop(this.audioContext.currentTime + duration);
    } catch (error) {
      console.log('Ses oluşturulamadı:', error);
    }
  }
  
  // Melodik ses efekti oluştur (birden fazla not)
  createMelodicSound(frequencies, duration) {
    if (!this.audioContext || !this.soundEnabled) return;
    
    try {
      const gainNode = this.audioContext.createGain();
      gainNode.connect(this.audioContext.destination);
      
      // Çok düşük ses seviyesi
      gainNode.gain.setValueAtTime(0, this.audioContext.currentTime);
      gainNode.gain.linearRampToValueAtTime(0.015, this.audioContext.currentTime + 0.05);
      gainNode.gain.exponentialRampToValueAtTime(0.001, this.audioContext.currentTime + duration);
      
      frequencies.forEach((freq, index) => {
        const oscillator = this.audioContext.createOscillator();
        oscillator.connect(gainNode);
        
        oscillator.frequency.setValueAtTime(freq, this.audioContext.currentTime);
        oscillator.type = 'triangle';
        
        const startTime = this.audioContext.currentTime + (index * 0.1);
        const endTime = startTime + 0.2;
        
        oscillator.start(startTime);
        oscillator.stop(endTime);
      });
    } catch (error) {
      console.log('Melodik ses oluşturulamadı:', error);
    }
  }
  
  loadSoundPreference() {
    const saved = localStorage.getItem("2048_sound_enabled");
    return saved === null ? true : saved === "true";
  }
  
  saveSoundPreference() {
    localStorage.setItem("2048_sound_enabled", this.soundEnabled);
  }
  
  // Tema fonksiyonalitesi
  loadThemePreference() {
    const savedTheme = localStorage.getItem("2048_theme") || "default";
    this.themeSelect.value = savedTheme;
    this.applyTheme(savedTheme);
  }
  
  changeTheme(themeName) {
    this.applyTheme(themeName);
    this.saveThemePreference(themeName);
  }
  
  applyTheme(themeName) {
    // Önceki tema sınıflarını temizle
    document.body.classList.remove("dark-theme", "ocean-theme", "nature-theme", "purple-theme");
    
    // Yeni tema sınıfını ekle
    if (themeName !== "default") {
      document.body.classList.add(`${themeName}-theme`);
    }
  }
  
  saveThemePreference(themeName) {
    localStorage.setItem("2048_theme", themeName);
  }
  
  // Undo fonksiyonalitesi
  saveMoveState() {
    const currentState = {
      board: this.boardArray.map(cell => cell.querySelector("span").textContent),
      score: this.score
    };
    this.moveHistory.push(currentState);
    
    // Geçmişi 10 hamle ile sınırla
    if (this.moveHistory.length > 10) {
      this.moveHistory.shift();
    }
  }
  
  undoMove() {
    if (this.moveHistory.length === 0 || this.isGameOver) return;
    
    const previousState = this.moveHistory.pop();
    
    // Tahtayı önceki duruma geri döndür
    for (let i = 0; i < 16; i++) {
      const span = this.boardArray[i].querySelector("span");
      span.textContent = previousState.board[i];
    }
    
    // Skoru geri döndür
    this.score = previousState.score;
    
    // UI'yi güncelle
    this.updateScore();
    this.updateCells();
    this.updateUndoButton();
    
    this.playSound("undo");
  }
  
  updateUndoButton() {
    this.undoBtn.disabled = this.moveHistory.length === 0 || this.isGameOver;
    this.undoBtn.style.opacity = this.undoBtn.disabled ? "0.5" : "1";
  }
  
  // İstatistik fonksiyonalitesi
  loadStats() {
    const savedStats = localStorage.getItem("2048_stats");
    if (savedStats) {
      this.stats = { ...this.stats, ...JSON.parse(savedStats) };
    }
  }
  
  saveStats() {
    localStorage.setItem("2048_stats", JSON.stringify(this.stats));
  }
  
  updateStats() {
    this.stats.totalGames++;
    this.stats.totalScore += this.score;
    
    if (this.score > this.stats.bestScore) {
      this.stats.bestScore = this.score;
    }
    
    // En yüksek taşı kontrol et
    const currentHighestTile = Math.max(...this.boardArray.map(cell => 
      parseInt(cell.querySelector("span").textContent) || 0
    ));
    if (currentHighestTile > this.stats.highestTile) {
      this.stats.highestTile = currentHighestTile;
    }
    
    // Oyun süresini hesapla
    const gameTime = Math.floor((Date.now() - this.stats.gameStartTime) / 1000);
    this.stats.totalTime += gameTime;
    
    // 2048'e ulaştıysa kazanma sayısını artır
    if (currentHighestTile >= 2048) {
      this.stats.wins++;
    }
    
    this.saveStats();
  }
  
  // Başarım fonksiyonalitesi
  loadAchievements() {
    const savedAchievements = localStorage.getItem("2048_achievements");
    if (savedAchievements) {
      const unlockedAchievements = JSON.parse(savedAchievements);
      unlockedAchievements.forEach(id => {
        if (this.achievements[id]) {
          this.achievements[id].unlocked = true;
        }
      });
    }
  }
  
  saveAchievements() {
    const unlockedAchievements = Object.keys(this.achievements).filter(id => 
      this.achievements[id].unlocked
    );
    localStorage.setItem("2048_achievements", JSON.stringify(unlockedAchievements));
  }
  
  checkAchievements() {
    const currentHighestTile = Math.max(...this.boardArray.map(cell => 
      parseInt(cell.querySelector("span").textContent) || 0
    ));
    
    const newAchievements = [];
    
    // Başarımları kontrol et
    if (!this.achievements.first_win.unlocked && currentHighestTile >= 2048) {
      this.achievements.first_win.unlocked = true;
      newAchievements.push('first_win');
    }
    
    if (!this.achievements.reach_512.unlocked && currentHighestTile >= 512) {
      this.achievements.reach_512.unlocked = true;
      newAchievements.push('reach_512');
    }
    
    if (!this.achievements.reach_1024.unlocked && currentHighestTile >= 1024) {
      this.achievements.reach_1024.unlocked = true;
      newAchievements.push('reach_1024');
    }
    
    if (!this.achievements.reach_2048.unlocked && currentHighestTile >= 2048) {
      this.achievements.reach_2048.unlocked = true;
      newAchievements.push('reach_2048');
    }
    
    if (!this.achievements.score_1000.unlocked && this.score >= 1000) {
      this.achievements.score_1000.unlocked = true;
      newAchievements.push('score_1000');
    }
    
    if (!this.achievements.score_5000.unlocked && this.score >= 5000) {
      this.achievements.score_5000.unlocked = true;
      newAchievements.push('score_5000');
    }
    
    if (!this.achievements.play_10_games.unlocked && this.stats.totalGames >= 10) {
      this.achievements.play_10_games.unlocked = true;
      newAchievements.push('play_10_games');
    }
    
    if (!this.achievements.play_50_games.unlocked && this.stats.totalGames >= 50) {
      this.achievements.play_50_games.unlocked = true;
      newAchievements.push('play_50_games');
    }
    
    // Yeni başarımları kaydet ve bildir
    if (newAchievements.length > 0) {
      this.saveAchievements();
      this.showAchievementNotification(newAchievements[0]); // İlk başarımı göster
    }
  }
  
  showAchievementNotification(achievementId) {
    const achievement = this.achievements[achievementId];
    if (!achievement) return;
    
    // Basit bir bildirim göster
    const notification = document.createElement('div');
    notification.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      background: var(--primary-color);
      color: white;
      padding: 15px;
      border-radius: var(--border-radius);
      box-shadow: var(--shadow);
      z-index: 2000;
      animation: slideInRight 0.5s ease;
    `;
    notification.innerHTML = `
      <div style="display: flex; align-items: center; gap: 10px;">
        <span style="font-size: 2rem;">${achievement.icon}</span>
        <div>
          <div style="font-weight: bold;">Yeni Başarım!</div>
          <div>${achievement.title}</div>
        </div>
      </div>
    `;
    
    document.body.appendChild(notification);
    
    setTimeout(() => {
      notification.remove();
    }, 3000);
  }
  
  // Modal fonksiyonları
  showStatsModal() {
    this.updateStatsDisplay();
    this.updateAchievementsDisplay();
    this.statsModal.style.display = "flex";
    this.closeStatsBtn.focus();
  }
  
  hideStatsModal() {
    this.statsModal.style.display = "none";
  }
  
  switchTab(tabId) {
    // Tüm tab butonlarını ve içeriklerini pasif yap
    this.statsModal.querySelectorAll('.tab-btn, .tab-content').forEach(el => {
      el.classList.remove('active');
    });
    
    // Seçilen tab'ı aktif yap
    this.statsModal.querySelector(`[data-tab="${tabId}"]`).classList.add('active');
    document.getElementById(`${tabId}-tab`).classList.add('active');
  }
  
  updateStatsDisplay() {
    document.getElementById('total-games').textContent = this.stats.totalGames;
    document.getElementById('wins').textContent = this.stats.wins;
    document.getElementById('best-score').textContent = this.stats.bestScore;
    document.getElementById('highest-tile').textContent = this.stats.highestTile;
    
    const avgScore = this.stats.totalGames > 0 ? Math.round(this.stats.totalScore / this.stats.totalGames) : 0;
    document.getElementById('avg-score').textContent = avgScore;
    
    const totalTimeMinutes = Math.floor(this.stats.totalTime / 60);
    const totalTimeSeconds = this.stats.totalTime % 60;
    document.getElementById('total-time').textContent = 
      `${String(totalTimeMinutes).padStart(2, '0')}:${String(totalTimeSeconds).padStart(2, '0')}`;
  }
  
  updateAchievementsDisplay() {
    const list = document.getElementById('achievements-list');
    list.innerHTML = '';
    
    Object.entries(this.achievements).forEach(([id, achievement]) => {
      const item = document.createElement('div');
      item.className = `achievement-item ${achievement.unlocked ? 'unlocked' : ''}`;
      item.innerHTML = `
        <div class="icon">${achievement.icon}</div>
        <div class="details">
          <h4>${achievement.title}</h4>
          <p>${achievement.desc}</p>
        </div>
      `;
      list.appendChild(item);
    });
  }
  
  // Ses sistemi - Web Audio API
  initAudio() {
    try {
      // Web Audio API'yi başlat
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      this.audioContext = new AudioContext();
    } catch (error) {
      console.log('Web Audio API desteklenmiyor:', error);
    }
  }
  
  initAudioOnUserInteraction() {
    // Audio context'i başlat (kullanıcı etkileşimi gerekli)
    if (this.audioContext && this.audioContext.state === 'suspended') {
      this.audioContext.resume().then(() => {
        console.log('Ses sistemi başlatıldı');
      });
    }
  }
}

document.addEventListener("DOMContentLoaded", () => {
  new Game2048();
});
