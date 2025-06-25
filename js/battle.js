// 对战场景类
class BattleScene extends Scene {
    constructor() {
        super('对战');
        this.roundTime = CONFIG.ROUND_TIME;
        this.currentRoundTime = this.roundTime;
        this.gamePhase = 'playing'; // playing, revealing, calculating, finished
        
        // 玩家数据
        this.playerCharacter = null;
        this.aiCharacter = null;
        this.ai = new BattleAI();
        
        // 固定手牌（5张基础卡牌）
        this.handCards = this.createHandCards();
        
        // 选择的卡牌
        this.playerSelectedCards = [];
        this.aiSelectedCards = [];
        
        // UI状态
        this.isAttackMode = false; // 卡牌模式：false=防御类，true=攻击类
        
        // 表情系统
        this.showEmotePanel = false;
        this.playerEmote = null;
        this.playerEmoteTimer = 0;
        this.aiEmote = null;
        this.aiEmoteTimer = 0;
        this.emoteList = [
            { name: 'smile', icon: '😊', text: '微笑' },
            { name: 'thumbsup', icon: '👍', text: '点赞' },
            { name: 'cry', icon: '😢', text: '哭脸' }
        ];
        
        // 紧急重置系统
        this.phaseStartTime = Date.now();
        this.maxPhaseTime = 10000; // 10秒超时
        
        // UI图片资源
        this.uiImages = {};
        this.uiImagesInitialized = false; // 图片初始化标志
        
        // UI元素
        this.setupUI();
        
        // 结果显示
        this.battleResult = null;
        this.showResult = false;
        this.battleNarrative = []; // 存储解说文本
        
        // 开牌效果
        this.showCards = false;
        this.cardRevealTime = 2000; // 开牌显示时间
        this.cardFlipProgress = 0; // 翻牌进度 0-1
        
        // 设置管理器
        this.settingsManager = new SettingsManager();
        // 强制关闭设置面板，避免黑幕影响UI测试
        this.settingsManager.isVisible = false;
        
        // 卡牌介绍相关
        this.hoveredCard = null;
        this.tooltipTimer = 0;
        this.tooltipDelay = 500; // 悬停500ms后显示介绍
        
        // 新增：拖拽和双击相关
        this.isDragging = false;
        this.draggedCard = null;
        this.dragStartX = 0;
        this.dragStartY = 0;
        this.lastClickTime = 0;
        this.lastClickedCard = null;
        this.doubleClickDelay = 300; // 双击间隔时间（毫秒）
        this.dragThreshold = 10; // 拖拽最小距离阈值
    }
    
    createHandCards() {
        // 防御类卡牌：回气、防御、闪避、反弹
        const defenseCards = ['回气', '防御', '闪避', '反弹'];
        // 攻击类卡牌：击打、气功、刺杀、大波
        const attackCards = ['击打', '气功', '刺杀', '大波'];
        
        // 创建防御类手牌
        this.defenseHandCards = [];
        defenseCards.forEach((type, index) => {
            const card = new Card(type);
            this.defenseHandCards.push(card);
        });
        
        // 创建攻击类手牌
        this.attackHandCards = [];
        attackCards.forEach((type, index) => {
            const card = new Card(type);
            this.attackHandCards.push(card);
        });
        
        // 默认显示防御类手牌
        this.isAttackMode = false;
        this.handCards = this.defenseHandCards;
        this.updateHandCardsPositions();
        
        return this.handCards;
    }
    
    // 更新手牌位置
    updateHandCardsPositions() {
        const handWidth = this.handCards.length * (CONFIG.CARD_WIDTH + 20) - 20;
        const startX = (CONFIG.CANVAS_WIDTH - handWidth) / 2 + CONFIG.CARD_WIDTH / 2;
        const handY = CONFIG.CANVAS_HEIGHT - CONFIG.CARD_HEIGHT / 2 - 50;
        
        this.handCards.forEach((card, index) => {
            const x = startX + index * (CONFIG.CARD_WIDTH + 20);
            card.setPosition(x, handY);
        });
    }
    
    // 检查卡牌是否可以使用
    canPlayCard(card) {
        const cost = this.getCardDisplayCost(card);
        return this.playerCharacter.currentEnergy >= cost;
    }
    
    // 获取可用的卡牌
    getPlayableCards() {
        return this.handCards.filter(card => this.canPlayCard(card));
    }
    
    enter() {
        super.enter();
        this.initializeBattle();
    }
    
    initializeBattle() {
        Debug.log('=== initializeBattle 被调用 ===');
        Debug.log('调用堆栈:', new Error().stack);
        
        // 初始化角色
        const selectedType = window.game.characterManager.getSelectedCharacter() || '骑士';
        this.playerCharacter = new Character(selectedType, CONFIG.CANVAS_WIDTH/2, CONFIG.CANVAS_HEIGHT - 100);
        this.aiCharacter = this.createRandomAICharacter();
        
        // 完全重置角色状态
        this.playerCharacter.reset();
        this.aiCharacter.reset();
        this.playerCharacter.setPosition(CONFIG.CANVAS_WIDTH/2, CONFIG.CANVAS_HEIGHT - 100);
        this.aiCharacter.setPosition(CONFIG.CANVAS_WIDTH/2, 100);
        
        Debug.log(`对战开始 - 玩家费用: ${this.playerCharacter.currentEnergy}, AI费用: ${this.aiCharacter.currentEnergy}`);
        
        // 重置选择
        this.playerSelectedCards = [];
        this.aiSelectedCards = [];
        this.resetCardSelections();
        
        // 重置回合和游戏状态
        this.currentRoundTime = this.roundTime;
        this.gamePhase = 'playing';
        this.showResult = false;
        this.showCards = false; // ✅ 重置开牌显示标志
        this.cardFlipProgress = 0; // ✅ 重置翻牌进度
        this.isAttackMode = false; // 默认显示防御类卡牌
        
        // 重置UI状态
        this.battleResult = null; // ✅ 清除战斗结果
        this.battleNarrative = []; // ✅ 清除解说文本
        this.winnerMessage = ''; // ✅ 清除胜利消息
        
        // 重置表情系统
        this.showEmotePanel = false;
        this.playerEmote = null;
        this.playerEmoteTimer = 0;
        
        // 确保设置面板关闭
        this.settingsManager.isVisible = false;
        
        // 重新创建手牌
        this.createHandCards();
        
        Debug.log('游戏状态完全重置完成');
    }
    
    resetCardSelections() {
        // 重置所有手牌的选择状态
        if (this.defenseHandCards) {
            this.defenseHandCards.forEach(card => {
                card.setSelected(false);
            });
        }
        if (this.attackHandCards) {
            this.attackHandCards.forEach(card => {
                card.setSelected(false);
            });
        }
    }
    
    createRandomAICharacter() {
        const characters = Object.keys(CHARACTER_TYPE);
        const randomType = characters[Math.floor(Math.random() * characters.length)];
        return new Character(randomType, CONFIG.CANVAS_WIDTH/2, 100);
    }
    
    initUIImages() {
        // 加载UI图片资源
        const imageNames = ['设置1', '主页图标1', '防御按键图标', '攻击按键图标'];
        const imageKeys = ['settings', 'home', 'defense', 'attack'];
        
        // 存储图片尺寸信息
        this.imageSizes = {};
        
        imageNames.forEach((imageName, index) => {
            const img = new Image();
            img.onload = () => {
                Debug.log(`UI图片加载成功: ${imageName} -> ${img.src}`);
                Debug.log(`图片尺寸: ${img.naturalWidth}x${img.naturalHeight}`);
                
                // 存储图片的原始尺寸
                this.imageSizes[imageKeys[index]] = {
                    width: img.naturalWidth,
                    height: img.naturalHeight
                };
                
                // 当图片加载完成后，重新设置UI以应用正确的尺寸
                this.refreshUI();
            };
            img.onerror = (err) => {
                Debug.log(`UI图片加载失败: ${imageName} -> ${img.src}`);
                console.error('图片加载错误:', err);
            };
            img.src = `ui素材图/${imageName}.png`;
            this.uiImages[imageKeys[index]] = img;
            Debug.log(`设置图片路径: ${imageKeys[index]} -> ${img.src}`);
        });
        
        Debug.log('UI图片初始化完成，开始加载:', imageNames);
        Debug.log('uiImages对象:', this.uiImages);
    }
    
    // 根据图片尺寸计算按钮尺寸
    getButtonSize(imageKey, maxSize = 60) {
        if (this.imageSizes && this.imageSizes[imageKey]) {
            const imgSize = this.imageSizes[imageKey];
            const ratio = imgSize.width / imgSize.height;
            
            // 根据图片比例和最大尺寸计算合适的按钮尺寸
            if (ratio > 1) {
                // 宽度较大，以宽度为准
                return {
                    width: Math.min(maxSize, imgSize.width * 0.5),
                    height: Math.min(maxSize, imgSize.width * 0.5) / ratio
                };
            } else {
                // 高度较大，以高度为准
                return {
                    width: Math.min(maxSize, imgSize.height * 0.5) * ratio,
                    height: Math.min(maxSize, imgSize.height * 0.5)
                };
            }
        }
        // 默认尺寸
        return { width: maxSize, height: maxSize };
    }
    
    updateButtonSizes() {
        // 查找并更新现有按钮的尺寸
        if (this.buttons && this.buttons.length > 0) {
            this.buttons.forEach(button => {
                if (button.image) {
                    const size = this.getButtonSize(button.image);
                    button.width = size.width;
                    button.height = size.height;
                    Debug.log(`更新按钮尺寸: ${button.text} -> ${size.width}x${size.height}`);
                }
            });
        } else {
            Debug.log('按钮数组为空，跳过尺寸更新');
        }
    }

    refreshUI() {
        // 延迟执行，确保所有图片都已加载
        setTimeout(() => {
            if (this.buttons && this.buttons.length > 0) {
                Debug.log('图片加载完成，刷新UI按钮尺寸');
                this.updateButtonSizes();
            } else {
                Debug.log('图片加载完成，但按钮还未创建，重新设置UI');
                this.setupUI();
            }
        }, 100);
    }

    setupUI() {
        this.clearButtons();
        
        // 初始化UI图片资源（只在第一次调用时初始化）
        if (!this.uiImagesInitialized) {
            this.initUIImages();
            this.uiImagesInitialized = true;
        }
        
        // 攻击/防御模式切换按钮
        const attackDefenseSize = this.getButtonSize(this.isAttackMode ? 'defense' : 'attack', 60);
        this.addButton({
            x: CONFIG.CANVAS_WIDTH - 60,
            y: CONFIG.CANVAS_HEIGHT - 130,
            width: attackDefenseSize.width,
            height: attackDefenseSize.height,
            text: this.isAttackMode ? '防御' : '攻击',
            image: this.isAttackMode ? 'defense' : 'attack',
            onClick: () => this.toggleCardMode(),
            isPointInside: function(x, y) {
                return x >= this.x - this.width/2 && x <= this.x + this.width/2 &&
                       y >= this.y - this.height/2 && y <= this.y + this.height/2;
            }
        });
        
        // 主页按钮（移至左上角）
        const homeSize = this.getButtonSize('home', 70);
        this.addButton({
            x: 70,
            y: 50,
            width: homeSize.width,
            height: homeSize.height,
            text: '主页',
            image: 'home',
            onClick: () => window.game.changeScene(GAME_STATE.MAIN_MENU),
            isPointInside: function(x, y) {
                return x >= this.x - this.width/2 && x <= this.x + this.width/2 &&
                       y >= this.y - this.height/2 && y <= this.y + this.height/2;
            }
        });
        
        // Canvas版本的设置按钮已移除，使用HTML版本
        // 设置按钮功能由HTML中的#settingsPanel处理
    }
    

    
    toggleCardMode() {
        this.isAttackMode = !this.isAttackMode;
        Debug.log('卡牌模式:', this.isAttackMode ? '攻击' : '防御');
        
        // 切换手牌
        if (this.isAttackMode) {
            this.handCards = this.attackHandCards;
        } else {
            this.handCards = this.defenseHandCards;
        }
        
        // 更新手牌位置
        this.updateHandCardsPositions();
        
        // 清除当前选择
        this.playerSelectedCards = [];
        this.resetCardSelections();
        
        // 更新按钮文本
        this.setupUI();
        
        // 显示可用卡牌信息
        const playableCards = this.getPlayableCards();
        Debug.log(`当前费用: ${this.playerCharacter.currentEnergy}, 可用卡牌: ${playableCards.length}/${this.handCards.length}`);
        playableCards.forEach(card => {
            Debug.log(`可用: ${this.getCardDisplayName(card)} (${this.getCardDisplayCost(card)}费用)`);
        });
    }
    
    // 切换表情面板显示
    toggleEmotePanel() {
        // 允许在任何状态下切换表情面板显示
        this.showEmotePanel = !this.showEmotePanel;
        Debug.log('表情面板状态:', this.showEmotePanel ? '显示' : '隐藏', '- 游戏状态:', this.gamePhase);
        
        // 只在非playing状态下给出提示，但不阻止面板切换
        if (this.gamePhase !== 'playing') {
            Debug.log('当前不在游戏中，无法发送表情，但可以查看表情面板');
        }
    }
    
    // 发送表情
    sendEmote(emoteName) {
        if (this.gamePhase !== 'playing') {
            Debug.log('游戏结束后无法发送表情');
            return;
        }
        
        const emote = this.emoteList.find(e => e.name === emoteName);
        if (!emote) {
            Debug.log('无效的表情:', emoteName);
            return;
        }
        
        // 新表情替代旧表情
        this.playerEmote = emote;
        this.playerEmoteTimer = 3000; // 3秒显示时间
        this.showEmotePanel = false; // 发送后关闭面板
        
        Debug.log('玩家发送表情:', emote.text, emote.icon);
    }
    
    // 更新表情系统
    updateEmotes(deltaTime) {
        // 更新玩家表情计时器
        if (this.playerEmoteTimer > 0) {
            this.playerEmoteTimer -= deltaTime;
            if (this.playerEmoteTimer <= 0) {
                this.playerEmote = null;
            }
        }
        
        // 更新AI表情计时器
        if (this.aiEmoteTimer > 0) {
            this.aiEmoteTimer -= deltaTime;
            if (this.aiEmoteTimer <= 0) {
                this.aiEmote = null;
            }
        }
    }
    
    // 处理表情面板点击
    handleEmotePanelClick(x, y) {
        // 新的表情系统位置：在玩家角色面板上方
        const emoteToggleX = 50;
        const emoteToggleY = CONFIG.CANVAS_HEIGHT - 280; // 角色面板上方
        const toggleSize = 30;
        
        Debug.log(`表情点击检测 - 点击位置: (${x}, ${y}), 开关位置: (${emoteToggleX}, ${emoteToggleY}), 尺寸: ${toggleSize}`);
        
        // 检查是否点击表情开关
        if (x >= emoteToggleX && x <= emoteToggleX + toggleSize && 
            y >= emoteToggleY && y <= emoteToggleY + toggleSize) {
            Debug.log('表情开关被点击！');
            this.toggleEmotePanel();
            return true;
        }
        
        // 如果面板打开，检查表情选择
        if (this.showEmotePanel) {
            const panelX = emoteToggleX + toggleSize + 10; // 开关右侧
            const panelY = emoteToggleY - 10;
            const panelWidth = 150;
            const panelHeight = 40;
            
            Debug.log(`表情面板检测 - 面板位置: (${panelX}, ${panelY}), 尺寸: ${panelWidth}x${panelHeight}`);
            
            // 检查是否点击在面板内
            if (x >= panelX && x <= panelX + panelWidth && 
                y >= panelY && y <= panelY + panelHeight) {
                
                Debug.log('点击在表情面板内');
                
                // 检查点击的是哪个表情
                const emoteSize = 35;
                const emoteSpacing = 40;
                const startX = panelX + 10;
                
                for (let i = 0; i < this.emoteList.length; i++) {
                    const emoteX = startX + i * emoteSpacing;
                    const emoteY = panelY + 5;
                    
                    if (x >= emoteX && x <= emoteX + emoteSize && 
                        y >= emoteY && y <= emoteY + emoteSize) {
                        Debug.log(`点击了表情: ${this.emoteList[i].name}`);
                        this.sendEmote(this.emoteList[i].name);
                        return true;
                    }
                }
                return true; // 点击在面板内但不在表情上
            } else {
                // 点击在面板外部，关闭面板
                Debug.log('点击在表情面板外部，关闭面板');
                this.showEmotePanel = false;
                return true;
            }
        }
        
        return false; // 没有点击在表情区域内
    }
    
    update(deltaTime) {
        super.update(deltaTime);
        
        // 更新表情系统
        this.updateEmotes(deltaTime);
        
        // 紧急重置检查 - 如果在非playing状态停留太久，强制重置
        if (this.gamePhase !== 'playing') {
            const phaseTime = Date.now() - this.phaseStartTime;
            if (phaseTime > this.maxPhaseTime) {
                Debug.log(`🚨 紧急重置：${this.gamePhase}状态超时${phaseTime}ms，强制回到playing状态`);
                this.emergencyReset();
                return;
            }
        } else {
            // 在playing状态时更新时间戳
            this.phaseStartTime = Date.now();
        }
        
        if (this.gamePhase === 'playing') {
            // 更新回合计时器
            this.currentRoundTime -= deltaTime / 1000;
            
            if (this.currentRoundTime <= 0) {
                this.timeUp();
            }
            
            // AI延迟选择 - 给AI一个思考时间，避免立即选择
            if (this.aiSelectedCards.length === 0 && this.playerCharacter && this.aiCharacter) {
                // 只在回合时间剩余不足50%时AI才开始选择，或者玩家已经选择了卡牌
                const timeRatio = this.currentRoundTime / this.roundTime;
                const playerHasSelected = this.playerSelectedCards.length > 0;
                
                // 增加额外检查：必须经过至少2秒的思考时间
                const hasThinkingTime = this.currentRoundTime < (this.roundTime - 2);
                
                // 额外安全检查：确保手牌已创建
                const handsReady = this.defenseHandCards && this.attackHandCards && 
                                 this.defenseHandCards.length > 0 && this.attackHandCards.length > 0;
                
                if (handsReady && ((timeRatio <= 0.5 && hasThinkingTime) || playerHasSelected)) {
                    Debug.log(`AI选择条件：时间比例=${timeRatio.toFixed(2)}, 剩余时间=${this.currentRoundTime.toFixed(1)}秒, 玩家已选择=${playerHasSelected}, 思考时间充足=${hasThinkingTime}`);
                    
                    // 创建AI的完整卡牌池（所有8种卡牌）
                    const aiAllCards = [...this.defenseHandCards, ...this.attackHandCards];
                    Debug.log(`AI可用卡牌: ${aiAllCards.map(c => c.type).join(', ')}`);
                    
                    this.ai.selectCards(aiAllCards, this.aiCharacter, false, this.playerCharacter);
                    this.aiSelectedCards = this.ai.getSelectedCards();
                    
                    // 详细的AI选择调试信息
                    if (this.aiSelectedCards.length === 0) {
                        Debug.log(`警告：AI没有选择任何卡牌！AI费用: ${this.aiCharacter.currentEnergy}`);
                        Debug.log(`AI可用卡牌详情: ${aiAllCards.map(c => `${c.type}(${c.data.cost}费)`).join(', ')}`);
                    } else {
                        Debug.log(`AI选择成功: ${this.aiSelectedCards.map(c => c.type).join(', ')}`);
                        Debug.log(`AI选择的卡牌详情: ${this.aiSelectedCards.map(c => `${c.type}(${c.data.cost}费)`).join(', ')}`);
                        Debug.log(`AI在回合时间剩余${Math.ceil(this.currentRoundTime)}秒时选择了卡牌`);
                    }
                }
            }
        }
        
        // 更新角色
        this.playerCharacter.update(deltaTime);
        this.aiCharacter.update(deltaTime);
        
        // 更新卡牌介绍计时器
        if (this.hoveredCard && this.settingsManager.getSetting('showCardTooltips')) {
            this.tooltipTimer += deltaTime;
        } else {
            this.tooltipTimer = 0;
        }
    }
    
    // 紧急重置功能
    emergencyReset() {
        Debug.log('🔧 执行紧急重置，恢复游戏到正常状态');
        
        // 重置游戏状态
        this.gamePhase = 'playing';
        this.phaseStartTime = Date.now();
        
        // 重置选择
        this.resetCardSelections();
        this.playerSelectedCards = [];
        this.aiSelectedCards = [];
        
        // 重置显示状态
        this.showResult = false;
        this.showCards = false;
        this.cardFlipProgress = 0;
        this.battleResult = null;
        
        // 重置回合时间
        this.currentRoundTime = this.roundTime;
        
        Debug.log('✅ 紧急重置完成，游戏已恢复正常');
    }
    
    handleClick(x, y) {
        Debug.log(`点击事件 - 位置: (${x}, ${y}), 游戏状态: ${this.gamePhase}`);
        
        // 优先处理表情系统点击（无论面板是否显示）
        if (this.handleEmotePanelClick(x, y)) {
            return true;
        }
        
        // 暂时注释掉设置面板的点击处理，避免干扰UI测试
        // if (this.settingsManager.handleClick(x, y)) {
        //     return true;
        // }
        
        // if (this.settingsManager.isVisible) {
        //     this.settingsManager.hide();
        //     return true;
        // }
        
        // 游戏结束时处理特殊按钮
        if (this.gamePhase === 'finished') {
            Debug.log('处理游戏结束状态的按钮点击');
            // 再来一次按钮
            const playAgainBtn = {
                x: CONFIG.CANVAS_WIDTH/2 - 100,
                y: CONFIG.CANVAS_HEIGHT/2,
                width: 150,
                height: 50
            };
            
            // 回到菜单按钮
            const mainMenuBtn = {
                x: CONFIG.CANVAS_WIDTH/2 + 100,
                y: CONFIG.CANVAS_HEIGHT/2,
                width: 150,
                height: 50
            };
            
            // 检查再来一次按钮
            if (x >= playAgainBtn.x - playAgainBtn.width/2 && 
                x <= playAgainBtn.x + playAgainBtn.width/2 &&
                y >= playAgainBtn.y - playAgainBtn.height/2 && 
                y <= playAgainBtn.y + playAgainBtn.height/2) {
                this.initializeBattle();
                return true;
            }
            
            // 检查回到菜单按钮
            if (x >= mainMenuBtn.x - mainMenuBtn.width/2 && 
                x <= mainMenuBtn.x + mainMenuBtn.width/2 &&
                y >= mainMenuBtn.y - mainMenuBtn.height/2 && 
                y <= mainMenuBtn.y + mainMenuBtn.height/2) {
                window.game.changeScene(GAME_STATE.MAIN_MENU);
                return true;
            }
        }
        
        // 只在playing状态下检查按钮和手牌点击
        if (this.gamePhase === 'playing') {
            // 先检查按钮
            if (super.handleClick(x, y)) {
                Debug.log('playing状态下的按钮点击被处理');
                return true;
            }
            
            // 检查手牌点击 - 新增双击检测
            for (let card of this.handCards) {
                if (card.isPointInside(x, y)) {
                    this.handleCardClick(card, x, y);
                    return true;
                }
            }
        } else {
            // 非playing状态下的点击（用于调试）
            Debug.log(`非游戏状态下的点击被忽略 - 当前状态: ${this.gamePhase}, 位置: (${x}, ${y})`);
        }
        
        return false;
    }
    
    // 新增：处理卡牌点击（支持双击）
    handleCardClick(card, x, y) {
        const currentTime = Date.now();
        
        // 检测双击
        if (this.lastClickedCard === card && 
            currentTime - this.lastClickTime < this.doubleClickDelay) {
            Debug.log(`双击卡牌：${this.getCardDisplayName(card)}`);
            this.handleDoubleClick(card);
            this.lastClickedCard = null;
            this.lastClickTime = 0;
        } else {
            // 单击处理
            this.lastClickedCard = card;
            this.lastClickTime = currentTime;
            this.toggleCardSelection(card);
        }
    }
    
    // 处理双击事件
    handleDoubleClick(card) {
        // 双击直接打出卡牌
        if (!this.canPlayCard(card)) {
            Debug.log(`费用不足，无法使用 ${this.getCardDisplayName(card)}（需要 ${this.getCardDisplayCost(card)} 费用，当前 ${this.playerCharacter.currentEnergy}）`);
            return;
        }
        
        // 清除之前的选择
        this.resetCardSelections();
        
        // 设置为选中并直接打出
        this.playerSelectedCards = [card];
        card.setSelected(true);
        
        Debug.log(`双击直接打出：${this.getCardDisplayName(card)}`);
        this.resolveBattle();
    }
    
    // 新增：处理鼠标按下事件
    handleMouseDown(x, y) {
        if (this.gamePhase !== 'playing') return false;
        
        // 检查是否按下了卡牌
        for (let card of this.handCards) {
            if (card.isPointInside(x, y)) {
                this.draggedCard = card;
                this.dragStartX = x;
                this.dragStartY = y;
                this.isDragging = false; // 还未开始拖拽，需要超过阈值
                Debug.log(`鼠标按下卡牌：${this.getCardDisplayName(card)}`);
                return true;
            }
        }
        return false;
    }
    
    // 新增：处理鼠标释放事件
    handleMouseUp(x, y) {
        if (this.draggedCard) {
            if (this.isDragging) {
                // 检查是否拖拽到了牌桌区域
                if (this.isInPlayArea(x, y)) {
                    Debug.log(`拖拽打出卡牌：${this.getCardDisplayName(this.draggedCard)}`);
                    this.handleDragPlay(this.draggedCard);
                } else {
                    Debug.log('拖拽取消，未拖拽到牌桌区域');
                }
            }
            
            // 重置拖拽状态
            this.isDragging = false;
            this.draggedCard = null;
            return true;
        }
        return false;
    }
    
    // 处理鼠标移动（用于卡牌悬停检测和拖拽）
    handleMouseMove(x, y) {
        // 处理拖拽
        if (this.draggedCard && !this.isDragging) {
            const dragDistance = Math.sqrt(
                Math.pow(x - this.dragStartX, 2) + 
                Math.pow(y - this.dragStartY, 2)
            );
            
            if (dragDistance > this.dragThreshold) {
                this.isDragging = true;
                Debug.log(`开始拖拽：${this.getCardDisplayName(this.draggedCard)}`);
            }
        }
        
        // 处理卡牌悬停提示
        if (!this.settingsManager.getSetting('showCardTooltips')) {
            this.hoveredCard = null;
            return;
        }
        
        // 检查鼠标是否悬停在卡牌上
        let cardUnderMouse = null;
        if (this.gamePhase === 'playing') {
            for (let card of this.handCards) {
                if (card.isPointInside(x, y)) {
                    cardUnderMouse = card;
                    break;
                }
            }
        }
        
        // 如果悬停卡牌发生变化，重置计时器
        if (cardUnderMouse !== this.hoveredCard) {
            this.hoveredCard = cardUnderMouse;
            this.tooltipTimer = 0;
        }
    }
    
    // 新增：检查坐标是否在牌桌区域
    isInPlayArea(x, y) {
        // 牌桌区域定义为画布中央区域
        const playAreaX = CONFIG.CANVAS_WIDTH * 0.2;
        const playAreaY = CONFIG.CANVAS_HEIGHT * 0.2;
        const playAreaWidth = CONFIG.CANVAS_WIDTH * 0.6;
        const playAreaHeight = CONFIG.CANVAS_HEIGHT * 0.4;
        
        return x >= playAreaX && x <= playAreaX + playAreaWidth &&
               y >= playAreaY && y <= playAreaY + playAreaHeight;
    }
    
    // 处理拖拽打出卡牌
    handleDragPlay(card) {
        // 检查费用
        if (!this.canPlayCard(card)) {
            Debug.log(`费用不足，无法使用 ${this.getCardDisplayName(card)}（需要 ${this.getCardDisplayCost(card)} 费用，当前 ${this.playerCharacter.currentEnergy}）`);
            return;
        }
        
        // 清除之前的选择
        this.resetCardSelections();
        
        // 设置为选中并直接打出
        this.playerSelectedCards = [card];
        card.setSelected(true);
        
        Debug.log(`拖拽直接打出：${this.getCardDisplayName(card)}`);
        this.resolveBattle();
    }
    
    toggleCardSelection(card) {
        const cardIndex = this.playerSelectedCards.indexOf(card);
        
        if (cardIndex >= 0) {
            // 取消选择
            this.playerSelectedCards.splice(cardIndex, 1);
            card.setSelected(false);
        } else {
            // 检查是否有足够费用
            if (!this.canPlayCard(card)) {
                Debug.log(`费用不足，无法使用 ${this.getCardDisplayName(card)}（需要 ${this.getCardDisplayCost(card)} 费用，当前 ${this.playerCharacter.currentEnergy}）`);
                return;
            }
            
            // 每回合只能选择一张卡牌
            if (this.playerSelectedCards.length < 1) {
                this.playerSelectedCards.push(card);
                card.setSelected(true);
            } else {
                // 如果已经选择了一张，先取消之前的选择
                this.playerSelectedCards[0].setSelected(false);
                this.playerSelectedCards = [card];
                card.setSelected(true);
            }
        }
        
        Debug.log('玩家选择卡牌:', this.playerSelectedCards.map(c => 
            this.getCardDisplayName(c)
        ));
    }
    
    getCardDisplayName(card) {
        return card.getName();
    }
    
    getCardDisplayCost(card) {
        return card.getCost(this.playerCharacter);
    }
    
    // 获取AI卡牌的显示费用（用于AI费用计算）
    getAICardDisplayCost(card) {
        return card.getCost(this.aiCharacter);
    }
    

    
    timeUp() {
        Debug.log('时间到！');
        
        // 如果玩家没有确认选择，但有点击选中的卡牌，使用选中的卡牌
        if (this.playerSelectedCards.length === 0) {
            // 检查是否有卡牌被选中但未确认
            const selectedCard = this.handCards.find(card => card.isSelected);
            
            if (selectedCard && this.canPlayCard(selectedCard)) {
                // 使用选中的卡牌
                this.playerSelectedCards = [selectedCard];
                const cost = this.getCardDisplayCost(selectedCard);
                Debug.log(`时间到，使用选中的 ${this.getCardDisplayName(selectedCard)}，需要 ${cost} 费用`);
            } else {
                // 完全没有选择，默认使用回气
                const huiqiCard = this.handCards.find(card => card.type === '回气');
                if (huiqiCard && this.canPlayCard(huiqiCard)) {
                    this.playerSelectedCards = [huiqiCard];
                    huiqiCard.setSelected(true);
                    const cost = this.getCardDisplayCost(huiqiCard);
                    Debug.log(`时间到，自动使用回气，需要 ${cost} 费用`);
                } else {
                    // 连回气都用不起，从可用卡牌中选择
                    const playableCards = this.getPlayableCards();
                    if (playableCards.length > 0) {
                        const randomCard = playableCards[Math.floor(Math.random() * playableCards.length)];
                        this.playerSelectedCards = [randomCard];
                        randomCard.setSelected(true);
                        const cost = this.getCardDisplayCost(randomCard);
                        Debug.log(`时间到，自动选择 ${this.getCardDisplayName(randomCard)}，需要 ${cost} 费用`);
                    } else {
                        // 强制选择回气，无论费用如何
                        const huiqiCardForced = this.handCards.find(card => card.type === '回气');
                        if (huiqiCardForced) {
                            this.playerSelectedCards = [huiqiCardForced];
                            huiqiCardForced.setSelected(true);
                            Debug.log(`强制选择回气，即使费用不足`);
                        } else {
                            Debug.log('警告：找不到回气卡牌，玩家将跳过回合');
                        }
                    }
                }
            }
        }
        
        // 确保AI也有选择的卡牌
        if (this.aiSelectedCards.length === 0) {
            Debug.log('时间到时AI还没有选择卡牌，强制AI选择');
            const aiAllCards = [...this.defenseHandCards, ...this.attackHandCards];
            this.ai.selectCards(aiAllCards, this.aiCharacter, false, this.playerCharacter);
            this.aiSelectedCards = this.ai.getSelectedCards();
            
            if (this.aiSelectedCards.length === 0) {
                // 强制AI选择回气
                const aiHuiqiCard = aiAllCards.find(card => card.type === '回气');
                if (aiHuiqiCard) {
                    this.aiSelectedCards = [aiHuiqiCard];
                    Debug.log('强制AI选择回气卡牌');
                } else {
                    Debug.log('警告：AI无法找到任何可用卡牌');
                }
            }
        }
        
        // 再次确认两个玩家都有卡牌选择
        Debug.log(`时间到确认 - 玩家卡牌: ${this.playerSelectedCards.length}, AI卡牌: ${this.aiSelectedCards.length}`);
        
        this.resolveBattle();
    }
    
    resolveBattle() {
        this.gamePhase = 'revealing';
        this.phaseStartTime = Date.now(); // 记录状态变更时间
        Debug.log('🎬 进入revealing状态，开始战斗解决流程');
        
        // 保存当前选择的卡牌，防止在异步过程中被清空
        const playerCards = [...this.playerSelectedCards];
        const aiCards = [...this.aiSelectedCards];
        
        // 调试信息：确保卡牌数据正确
        Debug.log('开始战斗解决 - 玩家卡牌:', playerCards.map(c => c.type));
        Debug.log('开始战斗解决 - AI卡牌:', aiCards.map(c => c.type));
        
        // 确保两个玩家都有卡牌
        if (playerCards.length === 0 || aiCards.length === 0) {
            Debug.log('❌ 错误：有玩家没有选择卡牌！强制回到playing状态');
            Debug.log(`玩家卡牌数量: ${playerCards.length}, AI卡牌数量: ${aiCards.length}`);
            this.gamePhase = 'playing';
            return;
        }
        
        // 先显示开牌阶段
        this.showCards = true;
        this.cardFlipProgress = 0;
        Debug.log('🎴 开始开牌阶段，显示时间:', this.cardRevealTime, 'ms');
        
        // 开始翻牌动画
        this.startCardFlipAnimation();
        
        // 不要清空原始数据，保持在整个开牌过程中有效
        // 注意：不在这里清空playerSelectedCards和aiSelectedCards
        
        setTimeout(() => {
            Debug.log('⏰ 开牌时间结束，开始计算战斗结果');
            
            // 再次确认卡牌数据 - 使用保存的副本而不是原始数据
            Debug.log('计算阶段 - 使用保存的玩家卡牌:', playerCards.map(c => c.type));
            Debug.log('计算阶段 - 使用保存的AI卡牌:', aiCards.map(c => c.type));
            
            // 使用保存的卡牌数据进行计算
            this.battleResult = CardEffectCalculator.calculateBattle(
                playerCards,
                aiCards,
                this.playerCharacter,
                this.aiCharacter
            );
            
            Debug.log('💯 战斗结果计算完成:', this.battleResult);
            
            // 应用结果 - 传递保存的卡牌数据
            this.applyBattleResult(playerCards, aiCards);
            
            // 延迟显示结果 - 只有游戏未结束时才继续
            if (this.gamePhase !== 'finished') {
                Debug.log('⏱️ 等待1500ms后显示战斗结果');
                setTimeout(() => {
                    // 再次检查游戏状态，防止异步问题
                    if (this.gamePhase !== 'finished') {
                        Debug.log('📊 切换到calculating状态，显示战斗结果');
                        this.gamePhase = 'calculating';
                        this.phaseStartTime = Date.now(); // 记录状态变更时间
                        this.showCards = false;
                        this.cardFlipProgress = 0;
                        this.showBattleResult();
                    } else {
                        Debug.log('🏁 游戏已结束，跳过结果显示');
                    }
                }, 1500);
            } else {
                Debug.log('🏁 游戏已结束，停止战斗流程');
            }
        }, this.cardRevealTime);
    }
    
    startCardFlipAnimation() {
        const flipDuration = 800; // 翻牌动画持续时间
        const startTime = performance.now();
        
        const animateFlip = (currentTime) => {
            const elapsed = currentTime - startTime;
            this.cardFlipProgress = Math.min(elapsed / flipDuration, 1);
            
            if (this.cardFlipProgress < 1) {
                requestAnimationFrame(animateFlip);
            }
        };
        
        requestAnimationFrame(animateFlip);
    }
    

    
    applyBattleResult(playerCards = null, aiCards = null) {
        const result = this.battleResult;
        
        // 检查结果是否有效 - 只检查结构是否正确，不检查数值
        if (!result || !result.player1 || !result.player2) {
            Debug.log('战斗结果结构无效:', result);
            return;
        }
        
        // 使用传入的卡牌数据，如果没有传入则使用实例的数据
        const usedPlayerCards = playerCards || this.playerSelectedCards;
        const usedAiCards = aiCards || this.aiSelectedCards;
        
        // 生成解说文本
        this.generateBattleNarrative();
        
        // 扣除使用卡牌的费用 - 使用保存的卡牌数据
        const playerCost = usedPlayerCards.reduce((total, card) => {
            return total + this.getCardDisplayCost(card);
        }, 0);
        const aiCost = usedAiCards.reduce((total, card) => {
            return total + this.getAICardDisplayCost(card);
        }, 0);
        
        Debug.log('应用战斗结果:', {
            玩家伤害: result.player1.damageTaken,
            AI伤害: result.player2.damageTaken,
            玩家费用增加: result.player1.energyGained,
            AI费用增加: result.player2.energyGained,
            玩家费用扣除: playerCost,
            AI费用扣除: aiCost,
            玩家治疗: result.player1.healthGained,
            AI治疗: result.player2.healthGained
        });
        
        // 扣除使用卡牌的费用
        this.playerCharacter.currentEnergy -= playerCost;
        this.aiCharacter.currentEnergy -= aiCost;
        
        // 应用伤害
        if (result.player1.damageTaken > 0) {
            this.playerCharacter.takeDamage(result.player1.damageTaken);
        }
        if (result.player2.damageTaken > 0) {
            this.aiCharacter.takeDamage(result.player2.damageTaken);
        }
        
        // 应用治疗
        if (result.player1.healthGained > 0) {
            this.playerCharacter.heal(result.player1.healthGained);
        }
        if (result.player2.healthGained > 0) {
            this.aiCharacter.heal(result.player2.healthGained);
        }
        
        // 应用费用增加
        const playerEnergyWin = this.playerCharacter.gainEnergy(result.player1.energyGained);
        const aiEnergyWin = this.aiCharacter.gainEnergy(result.player2.energyGained);
        
        Debug.log(`回合结算完成 - 玩家费用: ${this.playerCharacter.currentEnergy}, AI费用: ${this.aiCharacter.currentEnergy}`);
        
        // 检查胜利条件
        if (playerEnergyWin || this.aiCharacter.currentHealth <= 0) {
            this.endGame('player');
        } else if (aiEnergyWin || this.playerCharacter.currentHealth <= 0) {
            this.endGame('ai');
        }
    }
    
    showBattleResult() {
        Debug.log('📊 显示战斗结果，等待3000ms后开始下一回合');
        this.showResult = true;
        
        // 只有游戏未结束时才自动开始下一回合，游戏结束时停留在结果页面让玩家选择
        if (this.gamePhase !== 'finished') {
            // 3秒后开始下一回合
            setTimeout(() => {
                Debug.log('⏰ 3秒等待结束，检查是否可以开始下一回合');
                if (this.gamePhase !== 'finished') {
                    Debug.log('🔄 开始下一回合');
                    this.startNextRound();
                } else {
                    Debug.log('🏁 游戏已结束，不开始下一回合');
                }
            }, 3000);
        } else {
            Debug.log('🏁 游戏已结束，停留在结果页面');
        }
        // 游戏结束时不设置定时器，让玩家自己选择
    }
    
    startNextRound() {
        // 检查游戏是否已经结束，如果结束则直接返回，不启动新回合
        if (this.gamePhase === 'finished') {
            Debug.log('🛑 游戏已结束，取消新回合启动');
            return;
        }
        
        Debug.log('🔄 启动新回合，重置游戏状态');
        
        // 重置选择
        this.resetCardSelections();
        this.playerSelectedCards = [];
        this.aiSelectedCards = [];
        
        Debug.log(`新回合开始 - 玩家费用: ${this.playerCharacter.currentEnergy}, AI费用: ${this.aiCharacter.currentEnergy}`);
        
        // 重置回合时间和状态
        this.currentRoundTime = this.roundTime;
        this.gamePhase = 'playing';
        this.showResult = false;
        this.showCards = false;
        
        Debug.log('✅ 回到playing状态，可以正常游戏了');
    }
    
    endGame(winner) {
        this.gamePhase = 'finished';
        this.phaseStartTime = Date.now(); // 记录状态变更时间
        
        if (winner === 'player') {
            this.playerCharacter.setEmotion('victory');
            this.aiCharacter.setEmotion('defeated');
        } else {
            this.aiCharacter.setEmotion('victory');
            this.playerCharacter.setEmotion('defeated');
        }
        
        Debug.log('游戏结束，获胜者:', winner);
    }
    
    render(ctx) {
        // 背景
        this.renderBackground(ctx);
        
        // 卡牌拖拽区域
        this.renderPlayArea(ctx);
        
        // 角色信息
        this.renderCharacterInfo(ctx);
        
        // 新的表情系统：在角色面板上方
        this.renderCharacterEmoteSystem(ctx);
        
        // 手牌
        this.renderHandCards(ctx);
        
        // 已选择的卡牌信息
        this.renderSelectedCardsInfo(ctx);
        
        // 表情气泡（保持不变）
        this.renderPlayerEmotes(ctx);
        
        // 回合信息
        this.renderRoundInfo(ctx);
        
        // 按钮
        this.renderButtons(ctx);
        
        // 如果有拖拽卡牌，渲染它
        if (this.isDragging && this.draggedCard) {
            this.renderDraggedCard(ctx);
        }
        
        // 卡牌介绍提示框
        if (this.hoveredCard && this.tooltipTimer >= this.tooltipDelay) {
            this.renderCardTooltip(ctx, this.hoveredCard);
        }
        
        // 开牌效果
        if (this.showCards) {
            this.renderCardReveal(ctx);
        }
        
        // 战斗结果
        if (this.showResult) {
            this.renderBattleResult(ctx);
        }
        
        // 游戏结束界面
        if (this.gamePhase === 'finished') {
            this.renderGameOver(ctx);
        }
        
        // 设置界面
        // 暂时注释掉设置面板渲染，避免黑幕影响UI测试
        // this.settingsManager.render(ctx);
    }
    
    // 新增：渲染拖拽中的卡牌
    renderDraggedCard(ctx) {
        if (!this.draggedCard) return;
        
        // 获取鼠标位置作为卡牌中心
        const mousePos = window.game.inputManager.getMousePos();
        
        ctx.save();
        
        // 添加阴影效果
        ctx.shadowColor = 'rgba(0, 0, 0, 0.5)';
        ctx.shadowBlur = 10;
        ctx.shadowOffsetX = 5;
        ctx.shadowOffsetY = 5;
        
        // 稍微放大拖拽的卡牌
        const scale = 1.1;
        const cardWidth = CONFIG.CARD_WIDTH * scale;
        const cardHeight = CONFIG.CARD_HEIGHT * scale;
        
        // 半透明效果
        ctx.globalAlpha = 0.8;
        
        // 绘制卡牌背景
        ctx.fillStyle = CARD_TYPE[this.draggedCard.type].color;
        this.roundRect(ctx, 
            mousePos.x - cardWidth/2, 
            mousePos.y - cardHeight/2, 
            cardWidth, 
            cardHeight, 
            8);
        ctx.fill();
        
        // 绘制卡牌边框
        ctx.strokeStyle = '#FFD700'; // 金色边框表示拖拽状态
        ctx.lineWidth = 3;
        ctx.stroke();
        
        // 绘制卡牌名称
        ctx.fillStyle = '#FFFFFF';
        ctx.font = 'bold 14px Arial';
        ctx.textAlign = 'center';
        ctx.fillText(this.getCardDisplayName(this.draggedCard), 
                    mousePos.x, 
                    mousePos.y - cardHeight/4);
        
        // 绘制费用
        const cost = this.getCardDisplayCost(this.draggedCard);
        ctx.font = 'bold 12px Arial';
        ctx.fillText(`${cost}费`, 
                    mousePos.x, 
                    mousePos.y + cardHeight/4);
        
        ctx.restore();
    }
    
    renderBackground(ctx) {
        // 牌桌背景图片
        const imageManager = window.game?.imageManager;
        let backgroundDrawn = false;
        
        if (imageManager && imageManager.isImageLoaded('牌桌背景')) {
            // 使用牌桌图片作为背景
            const backgroundImg = imageManager.getImage('牌桌背景');
            if (backgroundImg) {
                try {
                    // 绘制背景图片，覆盖整个画布
                    ctx.drawImage(backgroundImg, 0, 0, CONFIG.CANVAS_WIDTH, CONFIG.CANVAS_HEIGHT);
                    backgroundDrawn = true;
                } catch (error) {
                    Debug.log('背景图片绘制失败:', error);
                }
            }
        }
        
        // 如果背景图片未加载或绘制失败，使用原来的渐变背景作为后备
        if (!backgroundDrawn) {
            const gradient = ctx.createLinearGradient(0, 0, 0, CONFIG.CANVAS_HEIGHT);
            gradient.addColorStop(0, '#1a1a2e');
            gradient.addColorStop(0.5, '#2d1b69');
            gradient.addColorStop(1, '#16213e');
            ctx.fillStyle = gradient;
            ctx.fillRect(0, 0, CONFIG.CANVAS_WIDTH, CONFIG.CANVAS_HEIGHT);
        }
        
        // 牌桌区域提示（拖拽时高亮显示）
        if (this.isDragging) {
            this.renderPlayArea(ctx);
        }
        
        // 分界线（只有在使用牌桌背景时才显示，因为牌桌图片可能已经包含了分界）
        if (!backgroundDrawn) {
            ctx.strokeStyle = '#444444';
            ctx.lineWidth = 2;
            ctx.setLineDash([10, 5]);
            ctx.beginPath();
            ctx.moveTo(0, CONFIG.CANVAS_HEIGHT / 2);
            ctx.lineTo(CONFIG.CANVAS_WIDTH, CONFIG.CANVAS_HEIGHT / 2);
            ctx.stroke();
            ctx.setLineDash([]);
        }
    }
    
    // 新增：渲染牌桌区域
    renderPlayArea(ctx) {
        const playAreaX = CONFIG.CANVAS_WIDTH * 0.2;
        const playAreaY = CONFIG.CANVAS_HEIGHT * 0.2;
        const playAreaWidth = CONFIG.CANVAS_WIDTH * 0.6;
        const playAreaHeight = CONFIG.CANVAS_HEIGHT * 0.4;
        
        // 半透明背景
        ctx.fillStyle = 'rgba(76, 175, 80, 0.2)'; // 绿色半透明
        ctx.fillRect(playAreaX, playAreaY, playAreaWidth, playAreaHeight);
        
        // 边框
        ctx.strokeStyle = '#4CAF50';
        ctx.lineWidth = 3;
        ctx.setLineDash([15, 10]);
        ctx.strokeRect(playAreaX, playAreaY, playAreaWidth, playAreaHeight);
        ctx.setLineDash([]);
        
        // 提示文字
        ctx.fillStyle = '#4CAF50';
        ctx.font = 'bold 20px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('拖拽到这里打出卡牌', 
                    playAreaX + playAreaWidth / 2, 
                    playAreaY + playAreaHeight / 2);
    }
    
    renderCharacterInfo(ctx) {
        // AI角色信息（上方）
        this.renderCharacterPanel(ctx, this.aiCharacter, CONFIG.CANVAS_WIDTH/2 - 140, 30, '对手');
        
        // 玩家角色信息（下方，向上移动避免被手牌遮挡）
        this.renderCharacterPanel(ctx, this.playerCharacter, 50, CONFIG.CANVAS_HEIGHT - 230, '玩家');
    }
    
    renderCharacterPanel(ctx, character, x, y, label) {
        // 面板背景
        ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
        ctx.fillRect(x, y, 280, 70);
        ctx.strokeStyle = character.data.color;
        ctx.lineWidth = 2;
        ctx.strokeRect(x, y, 280, 70);
        
        // 角色头像
        const imageManager = window.game?.imageManager;
        const avatarSize = 60;
        const avatarX = x + 5;
        const avatarY = y + 5;
        
        // 头像背景框
        ctx.fillStyle = 'rgba(255, 255, 255, 0.1)';
        ctx.fillRect(avatarX, avatarY, avatarSize, avatarSize);
        
        // 渲染角色头像
        let avatarDrawn = false;
        if (imageManager) {
            avatarDrawn = imageManager.drawImage(
                ctx,
                `${character.type}头像`,
                avatarX,
                avatarY,
                avatarSize,
                avatarSize
            );
        }
        
        // 如果图片未加载，显示备用颜色
        if (!avatarDrawn) {
            ctx.fillStyle = character.data.color;
            ctx.fillRect(avatarX, avatarY, avatarSize, avatarSize);
            ctx.fillStyle = '#FFFFFF';
            ctx.font = 'bold 12px Arial';
            ctx.textAlign = 'center';
            ctx.fillText(character.type, avatarX + avatarSize/2, avatarY + avatarSize/2 + 4);
        }
        
        // 头像边框
        ctx.strokeStyle = character.data.color;
        ctx.lineWidth = 2;
        ctx.strokeRect(avatarX, avatarY, avatarSize, avatarSize);
        
        // 角色信息 - 只显示数字，不显示进度条
        ctx.fillStyle = '#FFFFFF';
        ctx.font = 'bold 14px Arial';
        ctx.textAlign = 'left';
        ctx.fillText(`${label}: ${character.type}`, x + 75, y + 20);
        
        ctx.font = '12px Arial';
        ctx.fillText(`血量: ${character.currentHealth}/${character.maxHealth}`, x + 75, y + 38);
        ctx.fillText(`费用: ${character.currentEnergy}/${CONFIG.MAX_ENERGY}`, x + 75, y + 56);
    }
    
    renderHandCards(ctx) {
        // 计算手牌区域的实际范围
        const handWidth = this.handCards.length * (CONFIG.CARD_WIDTH + 20) - 20;
        const handCenterX = CONFIG.CANVAS_WIDTH / 2;
        const handAreaX = handCenterX - handWidth / 2 - 40; // 左边留40px空隙
        const handAreaWidth = handWidth + 80; // 两边各留40px空隙
        const handAreaY = CONFIG.CANVAS_HEIGHT - CONFIG.CARD_HEIGHT - 80;
        const handAreaHeight = CONFIG.CARD_HEIGHT + 60;
        
        // 只在手牌中央区域渲染背景，不覆盖左右角色头像区域
        ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
        ctx.fillRect(handAreaX, handAreaY, handAreaWidth, handAreaHeight);
        
        // 渲染每张手牌，只有可用的卡牌正常显示
        this.handCards.forEach(card => {
            this.renderHandCard(ctx, card);
        });
    }
    
    renderHandCard(ctx, card) {
        ctx.save();
        
        // 应用变换
        ctx.translate(card.x, card.y);
        
        // 选中的卡牌稍微放大和上移
        if (card.isSelected) {
            ctx.scale(1.1, 1.1);
            ctx.translate(0, -10);
        }
        
        // 检查卡牌是否可用
        const canPlay = this.canPlayCard(card);
        
        // 不可用卡牌透明度降低
        if (!canPlay) {
            ctx.globalAlpha = 0.5;
        }
        
        // 获取显示数据（动态根据升级模式获取）
        const displayName = this.getCardDisplayName(card);
        const displayCost = this.getCardDisplayCost(card);
        
        // 渲染卡牌背景（使用图片或渐变色）
        this.renderCardBackground(ctx, card, canPlay);
        
        // 选中边框
        if (card.isSelected) {
            ctx.strokeStyle = '#FFD700';
            ctx.lineWidth = 3;
            this.roundRect(ctx, -CONFIG.CARD_WIDTH/2, -CONFIG.CARD_HEIGHT/2, CONFIG.CARD_WIDTH, CONFIG.CARD_HEIGHT, 8);
            ctx.stroke();
        } else {
            ctx.strokeStyle = '#FFFFFF';
            ctx.lineWidth = 1;
            this.roundRect(ctx, -CONFIG.CARD_WIDTH/2, -CONFIG.CARD_HEIGHT/2, CONFIG.CARD_WIDTH, CONFIG.CARD_HEIGHT, 8);
            ctx.stroke();
        }
        
        // 卡牌内容 - 动态显示名称和费用
        ctx.fillStyle = '#FFFFFF';
        ctx.font = 'bold 14px Arial';
        ctx.textAlign = 'center';
        ctx.strokeStyle = '#000000';
        ctx.lineWidth = 2;
        ctx.strokeText(displayName, 0, -CONFIG.CARD_HEIGHT/2 + 25);
        ctx.fillText(displayName, 0, -CONFIG.CARD_HEIGHT/2 + 25);
        
        ctx.font = '12px Arial';
        ctx.strokeText(`费用: ${displayCost}`, 0, -CONFIG.CARD_HEIGHT/2 + 45);
        ctx.fillText(`费用: ${displayCost}`, 0, -CONFIG.CARD_HEIGHT/2 + 45);
        
        // 卡牌类别指示器
        const category = card.data.category || 'unknown';
        const categoryColor = category === 'attack' ? '#F44336' : '#4CAF50';
        ctx.fillStyle = categoryColor;
        ctx.fillRect(CONFIG.CARD_WIDTH/2 - 15, -CONFIG.CARD_HEIGHT/2 + 5, 12, 12);
        ctx.fillStyle = '#FFFFFF';
        ctx.font = 'bold 8px Arial';
        ctx.fillText(category === 'attack' ? '攻' : '防', CONFIG.CARD_WIDTH/2 - 9, -CONFIG.CARD_HEIGHT/2 + 13);
        
        // 费用不足提示
        if (!canPlay) {
            ctx.fillStyle = 'rgba(255, 0, 0, 0.8)';
            ctx.font = 'bold 10px Arial';
            ctx.textAlign = 'center';
            ctx.fillText('费用不足', 0, CONFIG.CARD_HEIGHT/2 - 10);
        }
        
        ctx.restore();
    }
    
    // 渲染卡牌背景（优先使用图片，否则使用渐变色）
    renderCardBackground(ctx, card, canPlay) {
        // 尝试使用卡牌图片
        if (card.image && card.image.complete) {
            // Debug.log(`使用图片渲染卡牌: ${card.type}`);
            ctx.save();
            
            // 圆角裁剪
            ctx.beginPath();
            this.roundRect(ctx, -CONFIG.CARD_WIDTH/2, -CONFIG.CARD_HEIGHT/2, CONFIG.CARD_WIDTH, CONFIG.CARD_HEIGHT, 8);
            ctx.clip();
            
            // 绘制图片，保持比例适应卡牌尺寸
            const imageAspect = card.image.width / card.image.height;
            const cardAspect = CONFIG.CARD_WIDTH / CONFIG.CARD_HEIGHT;
            
            let drawWidth, drawHeight;
            if (imageAspect > cardAspect) {
                // 图片更宽，以高度为准
                drawHeight = CONFIG.CARD_HEIGHT;
                drawWidth = drawHeight * imageAspect;
            } else {
                // 图片更高，以宽度为准
                drawWidth = CONFIG.CARD_WIDTH;
                drawHeight = drawWidth / imageAspect;
            }
            
            ctx.drawImage(
                card.image,
                -drawWidth/2, -drawHeight/2,
                drawWidth, drawHeight
            );
            
            // 添加半透明遮罩，确保文字可见，但只在卡牌内部
            if (canPlay) {
                ctx.fillStyle = 'rgba(0, 0, 0, 0.2)'; // 减少遮罩透明度
            } else {
                ctx.fillStyle = 'rgba(0, 0, 0, 0.5)'; // 不可用时保持较暗
            }
            
            // 使用圆角矩形绘制遮罩，确保不超出卡牌边界
            ctx.beginPath();
            this.roundRect(ctx, -CONFIG.CARD_WIDTH/2, -CONFIG.CARD_HEIGHT/2, CONFIG.CARD_WIDTH, CONFIG.CARD_HEIGHT, 8);
            ctx.fill();
            
            ctx.restore();
        } else {
            // 没有图片时使用渐变背景
            // Debug.log(`使用渐变背景渲染卡牌: ${card.type}, 有图片: ${!!card.image}, 图片完成: ${card.image?.complete}`);
            const color = CARD_TYPE[card.type]?.color || '#4CAF50'; // 默认绿色
            const gradient = ctx.createLinearGradient(-CONFIG.CARD_WIDTH/2, -CONFIG.CARD_HEIGHT/2, 
                                                    CONFIG.CARD_WIDTH/2, CONFIG.CARD_HEIGHT/2);
            
            if (!canPlay) {
                // 不可用卡牌使用灰色调
                gradient.addColorStop(0, '#666666');
                gradient.addColorStop(1, '#333333');
            } else {
                gradient.addColorStop(0, color);
                gradient.addColorStop(1, this.darkenColor(color, 0.3));
            }
            
            ctx.fillStyle = gradient;
            this.roundRect(ctx, -CONFIG.CARD_WIDTH/2, -CONFIG.CARD_HEIGHT/2, CONFIG.CARD_WIDTH, CONFIG.CARD_HEIGHT, 8);
            ctx.fill();
        }
    }
    
    // 渲染开牌阶段的卡牌背景（优先使用图片，否则使用渐变色）
    renderRevealedCardBackground(ctx, card, cardWidth, cardHeight) {
        // 尝试使用卡牌图片
        if (card.image && card.image.complete) {
            // Debug.log(`开牌阶段使用图片渲染: ${card.type}`);
            ctx.save();
            
            // 圆角裁剪
            ctx.beginPath();
            this.roundRect(ctx, -cardWidth/2, -cardHeight/2, cardWidth, cardHeight, 8);
            ctx.clip();
            
            // 绘制图片，保持比例适应卡牌尺寸
            const imageAspect = card.image.width / card.image.height;
            const cardAspect = cardWidth / cardHeight;
            
            let drawWidth, drawHeight;
            if (imageAspect > cardAspect) {
                // 图片更宽，以高度为准
                drawHeight = cardHeight;
                drawWidth = drawHeight * imageAspect;
            } else {
                // 图片更高，以宽度为准
                drawWidth = cardWidth;
                drawHeight = drawWidth / imageAspect;
            }
            
            ctx.drawImage(
                card.image,
                -drawWidth/2, -drawHeight/2,
                drawWidth, drawHeight
            );
            
            // 添加半透明遮罩，确保文字可见，使用圆角边界
            ctx.fillStyle = 'rgba(0, 0, 0, 0.2)'; // 减少遮罩透明度
            
            // 使用圆角矩形绘制遮罩，确保不超出卡牌边界
            ctx.beginPath();
            this.roundRect(ctx, -cardWidth/2, -cardHeight/2, cardWidth, cardHeight, 8);
            ctx.fill();
            
            ctx.restore();
        } else {
            // 没有图片时使用渐变背景
            // Debug.log(`开牌阶段使用渐变背景: ${card.type}, 有图片: ${!!card.image}, 图片完成: ${card.image?.complete}`);
            const color = CARD_TYPE[card.type]?.color || '#4CAF50';
            const gradient = ctx.createLinearGradient(-cardWidth/2, -cardHeight/2, cardWidth/2, cardHeight/2);
            
            gradient.addColorStop(0, color);
            gradient.addColorStop(1, this.darkenColor(color, 0.3));
            
            ctx.fillStyle = gradient;
            this.roundRect(ctx, -cardWidth/2, -cardHeight/2, cardWidth, cardHeight, 8);
            ctx.fill();
        }
    }
    
    renderCardIcon(ctx, cardType, x, y, iconType = 'normal') {
        ctx.save();
        
        ctx.fillStyle = '#FFFFFF';
        ctx.font = 'bold 16px Arial';
        ctx.textAlign = 'center';
        
        // 所有卡牌的图标（现在都是独立卡牌）
        switch(cardType) {
            case '回气':
                ctx.fillText('⚡', x, y);
                break;
            case '击打':
                ctx.fillText('⚔️', x, y);
                break;
            case '气功':
                ctx.fillText('💫', x, y);
                break;
            case '防御':
                ctx.fillText('🛡️', x, y);
                break;
            case '闪避':
                ctx.fillText('💨', x, y);
                break;
            case '刺杀':
                ctx.fillText('🗡️', x, y);
                break;
            case '大波':
                ctx.fillText('💥', x, y);
                break;
            case '反弹':
                ctx.fillText('🔃', x, y);
                break;
            default:
                ctx.fillText('?', x, y);
        }
        
        ctx.restore();
    }
    
    renderSelectedCardsInfo(ctx) {
        if (this.playerSelectedCards.length === 0) return;
        
        // 选中卡牌信息面板
        const panelX = CONFIG.CANVAS_WIDTH - 220;
        const panelY = CONFIG.CANVAS_HEIGHT - 120;
        const panelWidth = 200;
        const panelHeight = 80;
        
        ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
        ctx.fillRect(panelX, panelY, panelWidth, panelHeight);
        ctx.strokeStyle = '#FFFFFF';
        ctx.strokeRect(panelX, panelY, panelWidth, panelHeight);
        
        ctx.fillStyle = '#FFFFFF';
        ctx.font = 'bold 12px Arial';
        ctx.textAlign = 'left';
        ctx.fillText('已选择:', panelX + 10, panelY + 20);
        
        ctx.font = '10px Arial';
        this.playerSelectedCards.forEach((card, index) => {
            const displayName = this.getCardDisplayName(card);
            const displayCost = this.getCardDisplayCost(card);
            ctx.fillText(`• ${displayName} (${displayCost})`, 
                        panelX + 10, panelY + 35 + index * 12);
        });
        
        // 总费用
        const totalCost = this.playerSelectedCards.reduce((total, card) => {
            return total + this.getCardDisplayCost(card);
        }, 0);
        
        ctx.font = 'bold 10px Arial';
        ctx.fillText(`总费用: ${totalCost}`, panelX + 10, panelY + 70);
    }
    
    renderCardModeIndicator(ctx) {
        const modeText = this.isAttackMode ? '攻击模式' : '防御模式';
        const modeColor = this.isAttackMode ? '#F44336' : '#4CAF50';
        
        ctx.fillStyle = `${modeColor}CC`;
        ctx.fillRect(CONFIG.CANVAS_WIDTH - 150, CONFIG.CANVAS_HEIGHT - 250, 120, 30);
        
        ctx.fillStyle = '#FFFFFF';
        ctx.font = 'bold 12px Arial';
        ctx.textAlign = 'center';
        ctx.fillText(modeText, CONFIG.CANVAS_WIDTH - 90, CONFIG.CANVAS_HEIGHT - 235);
    }
    
    renderCardReveal(ctx) {
        // 开牌区域背景
        ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
        ctx.fillRect(0, 0, CONFIG.CANVAS_WIDTH, CONFIG.CANVAS_HEIGHT);
        
        const centerX = CONFIG.CANVAS_WIDTH / 2;
        const centerY = CONFIG.CANVAS_HEIGHT / 2;
        
        // 标题
        ctx.fillStyle = '#FFFFFF';
        ctx.font = 'bold 24px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('决斗！', centerX, centerY - 100);
        
        // 调试信息：显示卡牌数据状态
        Debug.log(`开牌渲染 - 玩家卡牌数量: ${this.playerSelectedCards.length}, AI卡牌数量: ${this.aiSelectedCards.length}`);
        if (this.playerSelectedCards.length > 0) {
            Debug.log(`玩家卡牌: ${this.playerSelectedCards[0].type}`);
        }
        if (this.aiSelectedCards.length > 0) {
            Debug.log(`AI卡牌: ${this.aiSelectedCards[0].type}`);
        }
        
        // 渲染玩家选择的卡牌
        if (this.playerSelectedCards.length > 0) {
            this.renderRevealedCard(ctx, this.playerSelectedCards[0], centerX - 100, centerY, '玩家', false);
        } else {
            // 显示缺失提示
            ctx.fillStyle = '#FF0000';
            ctx.font = '14px Arial';
            ctx.fillText('玩家卡牌缺失', centerX - 100, centerY);
        }
        
        // 渲染AI选择的卡牌
        if (this.aiSelectedCards.length > 0) {
            this.renderRevealedCard(ctx, this.aiSelectedCards[0], centerX + 100, centerY, 'AI', false);
        } else {
            // 显示缺失提示
            ctx.fillStyle = '#FF0000';
            ctx.font = '14px Arial';
            ctx.fillText('AI卡牌缺失', centerX + 100, centerY);
        }
        
        // VS标识
        ctx.fillStyle = '#FFD700';
        ctx.font = 'bold 20px Arial';
        ctx.fillText('VS', centerX, centerY + 60);
    }

    renderRevealedCard(ctx, card, x, y, playerLabel, useUpgrade) {
        ctx.save();
        ctx.translate(x, y);
        
        const cardWidth = CONFIG.CARD_WIDTH * 0.8;
        const cardHeight = CONFIG.CARD_HEIGHT * 0.8;
        
        // 翻牌效果：使用缩放模拟3D翻转
        if (this.cardFlipProgress < 0.5) {
            // 前半段：显示卡牌背面，从正面缩放到0
            const scaleX = 1 - (this.cardFlipProgress * 2);
            ctx.scale(scaleX, 1);
            
            // 绘制卡牌背面
            ctx.fillStyle = '#444444';
            this.roundRect(ctx, -cardWidth/2, -cardHeight/2, cardWidth, cardHeight, 8);
            ctx.fill();
            
            ctx.strokeStyle = '#FFFFFF';
            ctx.lineWidth = 2;
            this.roundRect(ctx, -cardWidth/2, -cardHeight/2, cardWidth, cardHeight, 8);
            ctx.stroke();
            
            // 背面图案
            ctx.fillStyle = '#888888';
            ctx.font = 'bold 24px Arial';
            ctx.textAlign = 'center';
            ctx.fillText('?', 0, 8);
            
        } else {
            // 后半段：显示卡牌正面，从0缩放到正面
            const scaleX = (this.cardFlipProgress - 0.5) * 2;
            ctx.scale(scaleX, 1);
            
            // 卡牌数据
            const displayName = card.getName();
            const displayCost = card.data.cost;
            
            // 渲染卡牌正面背景（使用图片或渐变）
            this.renderRevealedCardBackground(ctx, card, cardWidth, cardHeight);
            
            ctx.strokeStyle = '#FFFFFF';
            ctx.lineWidth = 2;
            this.roundRect(ctx, -cardWidth/2, -cardHeight/2, cardWidth, cardHeight, 8);
            ctx.stroke();
            
            // 卡牌内容 - 加描边确保在图片上可见
            ctx.fillStyle = '#FFFFFF';
            ctx.strokeStyle = '#000000';
            ctx.lineWidth = 2;
            ctx.font = 'bold 12px Arial';
            ctx.textAlign = 'center';
            ctx.strokeText(displayName, 0, -cardHeight/2 + 20);
            ctx.fillText(displayName, 0, -cardHeight/2 + 20);
            
            ctx.font = '10px Arial';
            ctx.strokeText(`费用: ${displayCost}`, 0, -cardHeight/2 + 35);
            ctx.fillText(`费用: ${displayCost}`, 0, -cardHeight/2 + 35);
        }
        
        // 玩家标签（始终显示）
        ctx.scale(1/Math.max(ctx.getTransform().a, 0.1), 1); // 重置X缩放以显示标签
        ctx.fillStyle = '#CCCCCC';
        ctx.font = '10px Arial';
        ctx.textAlign = 'center';
        ctx.fillText(playerLabel, 0, cardHeight/2 + 15);
        
        ctx.restore();
    }

    renderRoundInfo(ctx) {
        // 开牌阶段不显示倒计时
        if (this.gamePhase === 'revealing' || this.showCards) {
            return;
        }
        
        // 倒计时显示
        const timerX = CONFIG.CANVAS_WIDTH/2;
        const timerY = 200;
        
        // 倒计时圆圈
        ctx.beginPath();
        ctx.arc(timerX, timerY, 25, 0, Math.PI * 2);
        ctx.fillStyle = this.currentRoundTime <= 5 ? '#F44336' : '#2196F3';
        ctx.fill();
        ctx.strokeStyle = '#FFFFFF';
        ctx.lineWidth = 2;
        ctx.stroke();
        
        // 倒计时数字
        this.renderCountdownNumber(ctx, Math.ceil(this.currentRoundTime), timerX, timerY);
        
        // VS标识
        ctx.font = 'bold 20px Arial';
        ctx.fillText('VS', timerX, timerY + 40);
        
        // 游戏阶段提示
        let phaseText = '';
        switch(this.gamePhase) {
            case 'playing': phaseText = '选择行动中...'; break;
            case 'revealing': phaseText = '揭示卡牌中...'; break;
            case 'calculating': phaseText = '计算结果中...'; break;
            case 'finished': phaseText = '游戏结束'; break;
        }
        
        ctx.font = '12px Arial';
        ctx.fillStyle = '#CCCCCC';
        ctx.fillText(phaseText, timerX, timerY + 60);
    }
    
    renderBattleResult(ctx) {
        if (!this.battleResult || !this.battleResult.player1 || !this.battleResult.player2) {
            return;
        }
        
        // 结果面板 - 调整大小以容纳解说文本
        const panelX = CONFIG.CANVAS_WIDTH/2 - 200;
        const panelY = 220;
        const panelWidth = 400;
        const panelHeight = 120;
        
        ctx.fillStyle = 'rgba(0, 0, 0, 0.9)';
        ctx.fillRect(panelX, panelY, panelWidth, panelHeight);
        ctx.strokeStyle = '#FFD700';
        ctx.lineWidth = 2;
        ctx.strokeRect(panelX, panelY, panelWidth, panelHeight);
        
        // 标题
        ctx.fillStyle = '#FFD700';
        ctx.font = 'bold 16px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('战斗解说', CONFIG.CANVAS_WIDTH/2, panelY + 20);
        
        // 解说文本
        ctx.fillStyle = '#FFFFFF';
        ctx.font = '12px Arial';
        ctx.textAlign = 'left';
        
        let yOffset = 40;
        
        // 显示解说文本
        if (this.battleNarrative && this.battleNarrative.length > 0) {
            this.battleNarrative.forEach((narrative, index) => {
                if (yOffset < panelHeight - 15) { // 确保文本不会超出面板
                    ctx.fillText(narrative, panelX + 15, panelY + yOffset);
                    yOffset += 16;
                }
            });
        } else {
            // 降级显示基础信息
            ctx.font = '11px Arial';
            const result = this.battleResult;
            
            if (result.player1.damageTaken > 0) {
                ctx.fillText(`玩家受到 ${result.player1.damageTaken} 点伤害`, panelX + 15, panelY + yOffset);
                yOffset += 14;
            }
            if (result.player2.damageTaken > 0) {
                ctx.fillText(`对手受到 ${result.player2.damageTaken} 点伤害`, panelX + 15, panelY + yOffset);
                yOffset += 14;
            }
            if (result.player1.energyGained > 0) {
                ctx.fillText(`玩家获得 ${result.player1.energyGained} 费用`, panelX + 15, panelY + yOffset);
                yOffset += 14;
            }
            if (result.player2.energyGained > 0) {
                ctx.fillText(`对手获得 ${result.player2.energyGained} 费用`, panelX + 15, panelY + yOffset);
            }
        }
    }
    
    renderEmotions(ctx) {
        // 显示角色表情
        if (this.playerCharacter) {
            this.renderEmotionIcon(ctx, this.playerCharacter.currentEmotion, 30, CONFIG.CANVAS_HEIGHT - 30);
        }
        if (this.aiCharacter) {
            this.renderEmotionIcon(ctx, this.aiCharacter.currentEmotion, 30, 30);
        }
    }
    
    renderEmotionIcon(ctx, emotion, x, y) {
        let emotionText = '';
        switch(emotion) {
            case 'normal': emotionText = '😐'; break;
            case 'happy': emotionText = '😊'; break;
            case 'hurt': emotionText = '😢'; break;
            case 'victory': emotionText = '🎉'; break;
            case 'defeated': emotionText = '💀'; break;
            default: emotionText = '😐'; break;
        }
        
        ctx.font = '20px Arial';
        ctx.textAlign = 'center';
        ctx.fillStyle = '#FFFFFF';
        ctx.fillText(emotionText, x, y);
    }
    
    // 渲染玩家表情
    renderPlayerEmotes(ctx) {
        // 渲染玩家表情（在玩家角色头像旁边）
        if (this.playerEmote && this.playerEmoteTimer > 0) {
            const emoteX = 140; // 玩家头像右侧
            const emoteY = CONFIG.CANVAS_HEIGHT - 200;
            this.renderEmoteBubble(ctx, this.playerEmote, emoteX, emoteY);
        }
        
        // 渲染AI表情（在AI角色头像旁边）
        if (this.aiEmote && this.aiEmoteTimer > 0) {
            const emoteX = 140; // AI头像右侧
            const emoteY = 100;
            this.renderEmoteBubble(ctx, this.aiEmote, emoteX, emoteY);
        }
    }
    
    // 渲染表情气泡
    renderEmoteBubble(ctx, emote, x, y) {
        const bubbleWidth = 80;
        const bubbleHeight = 35;
        
        // 气泡背景
        ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
        ctx.fillRect(x, y, bubbleWidth, bubbleHeight);
        
        // 气泡边框
        ctx.strokeStyle = '#333333';
        ctx.lineWidth = 2;
        ctx.strokeRect(x, y, bubbleWidth, bubbleHeight);
        
        // 表情图标
        ctx.font = '20px Arial';
        ctx.textAlign = 'center';
        ctx.fillStyle = '#000000';
        ctx.fillText(emote.icon, x + bubbleWidth/2, y + bubbleHeight/2 + 7);
    }
    
    // 渲染表情面板
    renderEmotePanel(ctx) {
        // 表情按钮的位置
        const emoteButtonX = CONFIG.CANVAS_WIDTH - 90;
        const emoteButtonY = CONFIG.CANVAS_HEIGHT - 175;
        
        // 面板在按钮正上方
        const panelWidth = 120;
        const panelHeight = 140;
        const panelX = emoteButtonX - panelWidth/2; // 居中对齐
        const panelY = emoteButtonY - panelHeight - 25; // 在按钮上方25px，避免遮挡
        
        // 面板背景
        ctx.fillStyle = 'rgba(0, 0, 0, 0.9)';
        ctx.fillRect(panelX, panelY, panelWidth, panelHeight);
        
        // 面板边框
        ctx.strokeStyle = '#FFFFFF';
        ctx.lineWidth = 2;
        ctx.strokeRect(panelX, panelY, panelWidth, panelHeight);
        
        // 渲染表情列表 - 只显示图标，不显示文字
        const emoteSize = 40;
        const emoteSpacing = 45;
        const startY = panelY + 15;
        
        this.emoteList.forEach((emote, index) => {
            const emoteY = startY + index * emoteSpacing;
            const emoteX = panelX + (panelWidth - emoteSize) / 2; // 居中
            
            // 表情背景
            ctx.fillStyle = 'rgba(255, 255, 255, 0.1)';
            ctx.fillRect(emoteX, emoteY, emoteSize, emoteSize);
            
            // 表情边框
            ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
            ctx.lineWidth = 1;
            ctx.strokeRect(emoteX, emoteY, emoteSize, emoteSize);
            
            // 表情图标 - 放大并居中
            ctx.font = '28px Arial';
            ctx.textAlign = 'center';
            ctx.fillStyle = '#FFFFFF';
            ctx.fillText(emote.icon, emoteX + emoteSize/2, emoteY + 30);
        });
    }
    
    renderButtons(ctx) {
        this.buttons.forEach(button => {
                    // 设置按钮渲染已移除，使用HTML版本
            
            if (button.image && this.uiImages[button.image]) {
                // 使用图片渲染按钮
                const img = this.uiImages[button.image];
                if (img.complete && img.naturalHeight !== 0) {
                    // 保持图片原始比例，避免压缩变形
                    const imgRatio = img.naturalWidth / img.naturalHeight;
                    const buttonRatio = button.width / button.height;
                    
                    let drawWidth, drawHeight;
                    
                    // 计算保持比例的绘制尺寸
                    if (imgRatio > buttonRatio) {
                        // 图片比按钮更宽，以按钮宽度为准
                        drawWidth = button.width;
                        drawHeight = button.width / imgRatio;
                    } else {
                        // 图片比按钮更高，以按钮高度为准
                        drawHeight = button.height;
                        drawWidth = button.height * imgRatio;
                    }
                    
                    // 居中绘制图片
                    const drawX = button.x - drawWidth/2;
                    const drawY = button.y - drawHeight/2;
                    
                    ctx.drawImage(
                        img,
                        drawX,
                        drawY,
                        drawWidth,
                        drawHeight
                    );
                    
                    // 为攻击/防御按钮添加高亮效果
                    if ((button.text === '攻击' && this.isAttackMode) || (button.text === '防御' && !this.isAttackMode)) {
                        ctx.strokeStyle = '#FFD700';
                        ctx.lineWidth = 3;
                        ctx.strokeRect(
                            drawX,
                            drawY,
                            drawWidth,
                            drawHeight
                        );
                    }
                } else {
                    // 图片未加载时显示原始按钮
                    Debug.log(`按钮图片未加载完成: ${button.text}, 图片key: ${button.image}`);
                    this.renderFallbackButton(ctx, button);
                }
            } else {
                // 没有图片时显示原始按钮
                Debug.log(`按钮没有图片或图片不存在: ${button.text}, 图片key: ${button.image}`);
                this.renderFallbackButton(ctx, button);
            }
        });
    }
    
    renderFallbackButton(ctx, button) {
        // 按钮背景颜色
        let bgColor = '#4CAF50';
        if ((button.text === '攻击' && this.isAttackMode) || (button.text === '防御' && !this.isAttackMode)) {
            bgColor = '#FFD700'; // 当前模式时高亮
        }
        
        ctx.fillStyle = bgColor;
        ctx.fillRect(
            button.x - button.width/2,
            button.y - button.height/2,
            button.width,
            button.height
        );
        
        // 按钮边框
        ctx.strokeStyle = '#FFFFFF';
        ctx.lineWidth = 1;
        ctx.strokeRect(
            button.x - button.width/2,
            button.y - button.height/2,
            button.width,
            button.height
        );
        
        // 按钮文字
        ctx.fillStyle = ((button.text === '攻击' && this.isAttackMode) || (button.text === '防御' && !this.isAttackMode)) ? '#000000' : '#FFFFFF';
        ctx.font = '10px Arial';
        ctx.textAlign = 'center';
        ctx.fillText(button.text, button.x, button.y + 3);
    }
    
    renderCountdownNumber(ctx, number, x, y) {
        // 暂时直接使用文字显示，等待用户提供单独的数字图片
        ctx.fillStyle = '#FFFFFF';
        ctx.font = 'bold 16px Arial';
        ctx.textAlign = 'center';
        ctx.fillText(number.toString(), x, y + 5);
    }
    
    renderGameOver(ctx) {
        // 游戏结束遮罩
        ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
        ctx.fillRect(0, 0, CONFIG.CANVAS_WIDTH, CONFIG.CANVAS_HEIGHT);
        
        // 结果文字
        ctx.font = 'bold 36px Arial';
        ctx.textAlign = 'center';
        
        let resultText = '';
        if (this.playerCharacter.currentHealth <= 0 || this.aiCharacter.currentEnergy >= CONFIG.MAX_ENERGY) {
            resultText = '失败！';
            ctx.fillStyle = '#F44336';
        } else {
            resultText = '胜利！';
            ctx.fillStyle = '#4CAF50';
        }
        
        ctx.fillText(resultText, CONFIG.CANVAS_WIDTH/2, CONFIG.CANVAS_HEIGHT/2 - 80);
        
        // 游戏结束选项按钮
        this.renderGameOverButtons(ctx);
    }
    
    renderGameOverButtons(ctx) {
        // 再来一次按钮
        const playAgainBtn = {
            x: CONFIG.CANVAS_WIDTH/2 - 100,
            y: CONFIG.CANVAS_HEIGHT/2,
            width: 150,
            height: 50,
            text: '再来一次'
        };
        
        // 回到菜单按钮
        const mainMenuBtn = {
            x: CONFIG.CANVAS_WIDTH/2 + 100,
            y: CONFIG.CANVAS_HEIGHT/2,
            width: 150,
            height: 50,
            text: '回到菜单'
        };
        
        [playAgainBtn, mainMenuBtn].forEach(button => {
            // 按钮背景
            ctx.fillStyle = button.text === '再来一次' ? '#4CAF50' : '#607D8B';
            ctx.fillRect(
                button.x - button.width/2,
                button.y - button.height/2,
                button.width,
                button.height
            );
            
            // 按钮边框
            ctx.strokeStyle = '#FFFFFF';
            ctx.lineWidth = 2;
            ctx.strokeRect(
                button.x - button.width/2,
                button.y - button.height/2,
                button.width,
                button.height
            );
            
            // 按钮文字
            ctx.fillStyle = '#FFFFFF';
            ctx.font = 'bold 16px Arial';
            ctx.textAlign = 'center';
            ctx.fillText(button.text, button.x, button.y + 5);
        });
    }
    
    // 辅助方法
    roundRect(ctx, x, y, width, height, radius) {
        ctx.beginPath();
        ctx.moveTo(x + radius, y);
        ctx.lineTo(x + width - radius, y);
        ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
        ctx.lineTo(x + width, y + height - radius);
        ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
        ctx.lineTo(x + radius, y + height);
        ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
        ctx.lineTo(x, y + radius);
        ctx.quadraticCurveTo(x, y, x + radius, y);
        ctx.closePath();
    }
    
    darkenColor(color, amount) {
        const hex = color.replace('#', '');
        const r = Math.max(0, parseInt(hex.substr(0, 2), 16) * (1 - amount));
        const g = Math.max(0, parseInt(hex.substr(2, 2), 16) * (1 - amount));
        const b = Math.max(0, parseInt(hex.substr(4, 2), 16) * (1 - amount));
        
        return `rgb(${Math.floor(r)}, ${Math.floor(g)}, ${Math.floor(b)})`;
    }
    
    // 获取卡牌介绍内容
    getCardDescription(card) {
        const descriptions = {
            '回气': '获得1点费用，积累资源',
            '击打': '造成1点伤害，基础攻击',
            '气功': '造成1点伤害，远程攻击',
            '防御': '抵挡击打和刺杀，近战防御',
            '闪避': '抵挡气功和大波，远程防御',
            '刺杀': '造成2点伤害，高级近战攻击',
            '大波': '造成2点伤害，高级远程攻击',
            '反弹': '反弹所有攻击给攻击者'
        };
        
        return descriptions[card.type] || '未知卡牌';
    }
    
    // 渲染卡牌介绍提示框
    renderCardTooltip(ctx, card) {
        const tooltip = {
            x: card.x + CONFIG.CARD_WIDTH/2 + 10,
            y: card.y - CONFIG.CARD_HEIGHT/2,
            width: 200,
            height: 120
        };
        
        // 确保提示框不超出画布边界
        if (tooltip.x + tooltip.width > CONFIG.CANVAS_WIDTH) {
            tooltip.x = card.x - CONFIG.CARD_WIDTH/2 - tooltip.width - 10;
        }
        if (tooltip.y < 0) {
            tooltip.y = 10;
        }
        
        // 背景
        ctx.fillStyle = 'rgba(0, 0, 0, 0.9)';
        ctx.fillRect(tooltip.x, tooltip.y, tooltip.width, tooltip.height);
        ctx.strokeStyle = '#FFD700';
        ctx.lineWidth = 2;
        ctx.strokeRect(tooltip.x, tooltip.y, tooltip.width, tooltip.height);
        
        // 卡牌名称
        ctx.fillStyle = '#FFD700';
        ctx.font = 'bold 14px Arial';
        ctx.textAlign = 'left';
        const displayName = this.getCardDisplayName(card);
        ctx.fillText(displayName, tooltip.x + 10, tooltip.y + 20);
        
        // 费用信息
        ctx.fillStyle = '#FFFFFF';
        ctx.font = '12px Arial';
        const displayCost = this.getCardDisplayCost(card);
        ctx.fillText(`费用: ${displayCost}`, tooltip.x + 10, tooltip.y + 40);
        
        // 描述
        ctx.fillStyle = '#CCCCCC';
        ctx.font = '11px Arial';
        const description = this.getCardDescription(card);
        this.wrapText(ctx, description, tooltip.x + 10, tooltip.y + 60, tooltip.width - 20, 14);
        
        // 卡牌类别指示
        const category = card.data.category || 'unknown';
        ctx.fillStyle = category === 'attack' ? '#F44336' : '#4CAF50';
        ctx.font = 'bold 10px Arial';
        ctx.fillText(`[${category === 'attack' ? '攻击' : '防御'}]`, tooltip.x + 10, tooltip.y + 110);
    }
    
    // 文本自动换行
    wrapText(ctx, text, x, y, maxWidth, lineHeight) {
        const words = text.split(' ');
        let line = '';
        let currentY = y;
        
        for (let n = 0; n < words.length; n++) {
            const testLine = line + words[n] + ' ';
            const metrics = ctx.measureText(testLine);
            const testWidth = metrics.width;
            
            if (testWidth > maxWidth && n > 0) {
                ctx.fillText(line, x, currentY);
                line = words[n] + ' ';
                currentY += lineHeight;
            } else {
                line = testLine;
            }
        }
        ctx.fillText(line, x, currentY);
    }
    
    // 生成战斗解说文本
    generateBattleNarrative() {
        this.battleNarrative = [];
        
        if (!this.playerSelectedCards.length || !this.aiSelectedCards.length) {
            return;
        }
        
        const playerCard = this.playerSelectedCards[0];
        const aiCard = this.aiSelectedCards[0];
        
        const playerCardName = this.getCardDisplayName(playerCard);
        const aiCardName = this.getCardDisplayName(aiCard);
        
        const playerCharName = this.playerCharacter.type;
        const aiCharName = this.aiCharacter.type;
        
        // 获取卡牌优先级
        const playerPriority = this.getCardPriority(playerCard);
        const aiPriority = this.getCardPriority(aiCard);
        
        // 分析战斗情况 - 基于实际效果而不是卡牌优先级
        const playerIsAttack = this.isAttackCard(playerCard);
        const aiIsAttack = this.isAttackCard(aiCard);
        const playerIsDefense = this.isDefenseCard(playerCard);
        const aiIsDefense = this.isDefenseCard(aiCard);
        
        const result = this.battleResult;
        
        // 分析谁是成功的一方（基于伤害结果）
        const playerTookDamage = result.player1.damageTaken > 0;
        const aiTookDamage = result.player2.damageTaken > 0;
        
        if (playerIsAttack && aiIsDefense) {
            // 玩家攻击 vs AI防御
            if (!aiTookDamage) {
                // 防御成功
                if (aiCardName === '闪避') {
                    this.battleNarrative.push(`${aiCharName}灵活地躲过了${playerCharName}的${playerCardName}！`);
                } else {
                    this.battleNarrative.push(`${aiCharName}成功用${aiCardName}格挡了${playerCharName}的${playerCardName}！`);
                }
            } else {
                // 攻击突破防御
                this.battleNarrative.push(`${playerCharName}的${playerCardName}突破了${aiCharName}的${aiCardName}！`);
            }
        } else if (aiIsAttack && playerIsDefense) {
            // AI攻击 vs 玩家防御
            if (!playerTookDamage) {
                // 防御成功
                if (playerCardName === '闪避') {
                    this.battleNarrative.push(`${playerCharName}灵活地躲过了${aiCharName}的${aiCardName}！`);
                } else {
                    this.battleNarrative.push(`${playerCharName}成功用${playerCardName}格挡了${aiCharName}的${aiCardName}！`);
                }
            } else {
                // 攻击突破防御
                this.battleNarrative.push(`${aiCharName}的${aiCardName}突破了${playerCharName}的${playerCardName}！`);
            }
        } else if (playerIsAttack && aiIsAttack) {
            // 双方都是攻击
            if (playerTookDamage && aiTookDamage) {
                this.battleNarrative.push(`${playerCharName}和${aiCharName}同时发动攻击，双方两败俱伤！`);
            } else if (playerTookDamage && !aiTookDamage) {
                this.battleNarrative.push(`${aiCharName}的${aiCardName}压制了${playerCharName}的${playerCardName}！`);
            } else if (!playerTookDamage && aiTookDamage) {
                this.battleNarrative.push(`${playerCharName}的${playerCardName}压制了${aiCharName}的${aiCardName}！`);
            } else {
                this.battleNarrative.push(`${playerCharName}和${aiCharName}同时使用了攻击技能，势均力敌！`);
            }
        } else {
            // 其他情况（辅助技能等）
            this.battleNarrative.push(`${playerCharName}使用了${playerCardName}，${aiCharName}选择了${aiCardName}！`);
        }
        
        // 添加效果描述
        if (result) {
            if (result.player1.damageTaken > 0) {
                this.battleNarrative.push(`${playerCharName}受到了${result.player1.damageTaken}点伤害！`);
            }
            if (result.player2.damageTaken > 0) {
                this.battleNarrative.push(`${aiCharName}受到了${result.player2.damageTaken}点伤害！`);
            }
            if (result.player1.energyGained > 0) {
                this.battleNarrative.push(`${playerCharName}获得了${result.player1.energyGained}点费用！`);
            }
            if (result.player2.energyGained > 0) {
                this.battleNarrative.push(`${aiCharName}获得了${result.player2.energyGained}点费用！`);
            }
            if (result.player1.healthGained > 0) {
                this.battleNarrative.push(`${playerCharName}回复了${result.player1.healthGained}点血量！`);
            }
            if (result.player2.healthGained > 0) {
                this.battleNarrative.push(`${aiCharName}回复了${result.player2.healthGained}点血量！`);
            }
        }
    }
    
    // 获取卡牌优先级（用于判断压制关系）
    getCardPriority(card) {
        const cardName = this.getCardDisplayName(card);
        const priorities = {
            '大波': 4,
            '气功': 3,
            '刺杀': 2,
            '击打': 1,
            '防御': 0,
            '闪避': 0,
            '反弹': 0,
            '回气': 0
        };
        return priorities[cardName] || 0;
    }
    
    // 判断是否为攻击卡
    isAttackCard(card) {
        const cardName = this.getCardDisplayName(card);
        const attackCards = ['击打', '刺杀', '气功', '大波'];
        return attackCards.includes(cardName);
    }
    
    // 判断是否为防御卡
    isDefenseCard(card) {
        const cardName = this.getCardDisplayName(card);
        const defenseCards = ['防御', '闪避', '反弹'];
        return defenseCards.includes(cardName);
    }
    
    // 渲染角色表情系统（在角色面板上方）
    renderCharacterEmoteSystem(ctx) {
        // 表情开关位置：在玩家角色面板上方
        const emoteToggleX = 50;
        const emoteToggleY = CONFIG.CANVAS_HEIGHT - 280;
        const toggleSize = 30;
        
        // 表情开关背景
        ctx.fillStyle = this.showEmotePanel ? '#FFD700' : 'rgba(255, 255, 255, 0.8)';
        ctx.fillRect(emoteToggleX, emoteToggleY, toggleSize, toggleSize);
        
        // 表情开关边框
        ctx.strokeStyle = '#333333';
        ctx.lineWidth = 2;
        ctx.strokeRect(emoteToggleX, emoteToggleY, toggleSize, toggleSize);
        
        // 表情开关图标（笑脸）
        ctx.font = '20px Arial';
        ctx.textAlign = 'center';
        ctx.fillStyle = '#333333';
        ctx.fillText('😊', emoteToggleX + toggleSize/2, emoteToggleY + toggleSize/2 + 6);
        
        // 如果面板打开，渲染表情选择面板
        if (this.showEmotePanel) {
            this.renderCharacterEmotePanel(ctx, emoteToggleX, emoteToggleY, toggleSize);
        }
    }
    
    // 渲染角色表情面板
    renderCharacterEmotePanel(ctx, toggleX, toggleY, toggleSize) {
        const panelX = toggleX + toggleSize + 10; // 开关右侧
        const panelY = toggleY - 10;
        const panelWidth = 150;
        const panelHeight = 40;
        
        // 面板背景
        ctx.fillStyle = 'rgba(0, 0, 0, 0.9)';
        ctx.fillRect(panelX, panelY, panelWidth, panelHeight);
        
        // 面板边框
        ctx.strokeStyle = '#FFD700';
        ctx.lineWidth = 2;
        ctx.strokeRect(panelX, panelY, panelWidth, panelHeight);
        
        // 渲染表情列表 - 水平排列
        const emoteSize = 30;
        const emoteSpacing = 40;
        const startX = panelX + 10;
        
        this.emoteList.forEach((emote, index) => {
            const emoteX = startX + index * emoteSpacing;
            const emoteY = panelY + 5;
            
            // 表情背景
            ctx.fillStyle = 'rgba(255, 255, 255, 0.1)';
            ctx.fillRect(emoteX, emoteY, emoteSize, emoteSize);
            
            // 表情边框
            ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
            ctx.lineWidth = 1;
            ctx.strokeRect(emoteX, emoteY, emoteSize, emoteSize);
            
            // 表情图标
            ctx.font = '22px Arial';
            ctx.textAlign = 'center';
            ctx.fillStyle = '#FFFFFF';
            ctx.fillText(emote.icon, emoteX + emoteSize/2, emoteY + emoteSize/2 + 6);
        });
    }
}

// 机器人AI类
class BattleAI {
    constructor() {
        this.selectedCards = [];
        this.difficulty = 'random';
    }
    
    selectCards(handCards, character, upgradeMode = false, playerCharacter = null) {
        this.selectedCards = [];
        
        // 筛选AI可以使用的卡牌（根据AI的费用）
        const playableCards = handCards.filter(card => {
            let cost = upgradeMode && CARD_TYPE[card.type].upgraded ? 
                      CARD_TYPE[card.type].upgraded.cost : 
                      CARD_TYPE[card.type].cost;
            
            // 应用AI角色能力影响费用
            if (character) {
                const context = {
                    cardType: card.type,
                    cost: cost,
                    isUpgraded: upgradeMode && CARD_TYPE[card.type].upgraded
                };
                const modifiedContext = character.applyAbility(context);
                cost = modifiedContext.cost;
            }
            
            return character.currentEnergy >= cost;
        });
        
        if (playableCards.length === 0) {
            Debug.log(`AI没有可用卡牌！当前费用: ${character.currentEnergy}`);
        }
        
        if (playableCards.length > 0) {
            // 智能选择：基于对手费用判断
            const selectedCard = this.intelligentCardSelection(playableCards, playerCharacter, character);
            this.selectedCards = [selectedCard];
            
            // 记录费用但不立即扣除
            let cost = upgradeMode && CARD_TYPE[selectedCard.type].upgraded ? 
                      CARD_TYPE[selectedCard.type].upgraded.cost : 
                      CARD_TYPE[selectedCard.type].cost;
            
            // 应用AI角色能力影响费用
            if (character) {
                const context = {
                    cardType: selectedCard.type,
                    cost: cost,
                    isUpgraded: upgradeMode && CARD_TYPE[selectedCard.type].upgraded
                };
                const modifiedContext = character.applyAbility(context);
                cost = modifiedContext.cost;
            }
            
            Debug.log(`AI选择卡牌: ${selectedCard.type}, 需要 ${cost} 费用（回合结算后扣除）`);
        } else {
            Debug.log('AI没有可用卡牌，跳过回合');
        }
    }
    
    // 智能卡牌选择逻辑 - 重构：实现全新的8卡牌选择策略
    intelligentCardSelection(playableCards, playerCharacter, aiCharacter) {
        if (!playerCharacter) {
            // 没有玩家信息，随机选择
            return playableCards[Math.floor(Math.random() * playableCards.length)];
        }
        
        Debug.log(`AI开始选择，可用卡牌: ${playableCards.map(c => c.type).join(', ')}`);
        
        // 第一步：分析玩家威胁能力
        const playerCanAttack = this.canPlayerAttack(playerCharacter, aiCharacter);
        const playerCanUseQigong = playerCanAttack.qigong;
        const playerCanUseShouren = playerCanAttack.shouren;
        const playerCanUseCisha = playerCanAttack.cisha;
        const playerCanUseDabo = playerCanAttack.dabo;
        
        Debug.log(`AI威胁分析: 击打=${playerCanUseShouren}, 气功=${playerCanUseQigong}, 刺杀=${playerCanUseCisha}, 大波=${playerCanUseDabo}`);
        
        // 第二步：基于威胁评估筛选合理卡牌
        let reasonableCards = [...playableCards];
        
        // 如果玩家完全没有攻击能力，避免防御卡牌
        if (!playerCanUseShouren && !playerCanUseQigong && !playerCanUseCisha && !playerCanUseDabo) {
            Debug.log('AI判断：玩家无攻击能力，排除所有防御卡');
            reasonableCards = reasonableCards.filter(card => 
                card.type !== '防御' && card.type !== '闪避' && card.type !== '反弹'
            );
        } else {
            // 玩家有攻击能力时，进行针对性筛选
            
            // 如果玩家只能使用近战攻击（击打、刺杀），闪避就没用
            if ((playerCanUseShouren || playerCanUseCisha) && !playerCanUseQigong && !playerCanUseDabo) {
                Debug.log('AI判断：玩家只能近战攻击，排除闪避');
                reasonableCards = reasonableCards.filter(card => card.type !== '闪避');
            }
            
            // 如果玩家只能使用远程攻击（气功、大波），防御就没用
            if ((playerCanUseQigong || playerCanUseDabo) && !playerCanUseShouren && !playerCanUseCisha) {
                Debug.log('AI判断：玩家只能远程攻击，排除防御');
                reasonableCards = reasonableCards.filter(card => card.type !== '防御');
            }
        }
        
        // 第三步：如果筛选后没有卡牌，使用原始列表
        if (reasonableCards.length === 0) {
            Debug.log('AI判断：筛选后无可用卡牌，使用全部可用卡牌');
            reasonableCards = [...playableCards];
        }
        
        // 第四步：随机选择
        const selectedCard = reasonableCards[Math.floor(Math.random() * reasonableCards.length)];
        Debug.log(`AI最终选择: ${selectedCard.type} (从${reasonableCards.length}张合理卡牌中选择)`);
        
        return selectedCard;
    }
    
    // 分析玩家的攻击能力 - 重构：支持全部4种攻击卡牌和特殊职业
    canPlayerAttack(playerCharacter, aiCharacter) {
        // 计算所有攻击卡牌的费用
        let shourenCost = CARD_TYPE['击打'].cost;
        let qigongCost = CARD_TYPE['气功'].cost;
        let cishaCost = CARD_TYPE['刺杀'].cost;
        let daboCost = CARD_TYPE['大波'].cost;
        
        // 应用玩家角色能力
        if (playerCharacter.type === '法师') {
            // 法师：气功和大波费用-1
            qigongCost = Math.max(0, qigongCost - 1);
            daboCost = Math.max(0, daboCost - 1);
        } else if (playerCharacter.type === '肉盾') {
            // 肉盾：所有攻击类卡牌费用+1
            shourenCost += 1;
            qigongCost += 1;
            cishaCost += 1;
            daboCost += 1;
            Debug.log('AI考虑玩家肉盾能力：所有攻击费用+1');
        }
        
        // 应用AI角色能力对玩家的影响（肉盾的被动能力）
        if (aiCharacter && aiCharacter.type === '肉盾') {
            // AI是肉盾：玩家攻击AI的所有攻击类卡牌费用+1
            shourenCost += 1;
            qigongCost += 1;
            cishaCost += 1;
            daboCost += 1;
            Debug.log('AI考虑AI肉盾能力：玩家攻击费用再+1');
        }
        
        Debug.log(`AI最终费用分析：击打${shourenCost}, 气功${qigongCost}, 刺杀${cishaCost}, 大波${daboCost} (玩家当前${playerCharacter.currentEnergy}费用)`);
        
        return {
            shouren: playerCharacter.currentEnergy >= shourenCost,
            qigong: playerCharacter.currentEnergy >= qigongCost,
            cisha: playerCharacter.currentEnergy >= cishaCost,
            dabo: playerCharacter.currentEnergy >= daboCost
        };
    }
    
    getSelectedCards() {
        return this.selectedCards;
    }
} 