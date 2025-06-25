// 游戏配置常量
const CONFIG = {
    // 画布设置
    CANVAS_WIDTH: 800,
    CANVAS_HEIGHT: 600,
    
    // 游戏设置
    ROUND_TIME: 9, // 每回合时间（秒）
    MAX_HEALTH: 3,  // 最大血量
    MAX_ENERGY: 9, // 胜利条件：达到9费用
    
    // 卡牌设置
    HAND_SIZE: 4,   // 手牌数量
    CARD_WIDTH: 80,
    CARD_HEIGHT: 120,
    
    // 动画设置
    ANIMATION_SPEED: 0.016, // 60fps
    TWEEN_DURATION: 300,    // 默认动画时长（毫秒）
    
    // 颜色主题
    COLORS: {
        PRIMARY: '#4CAF50',
        SECONDARY: '#2196F3',
        DANGER: '#F44336',
        WARNING: '#FF9800',
        SUCCESS: '#8BC34A',
        BACKGROUND: '#1E1E1E',
        CARD_BG: '#2D2D2D',
        TEXT: '#FFFFFF',
        TEXT_SECONDARY: '#CCCCCC'
    }
};

// 游戏状态枚举
const GAME_STATE = {
    LOADING: 'loading',
    MAIN_MENU: 'main_menu',
    CHARACTER_SELECT: 'character_select',
    BATTLE: 'battle',
    RESULT: 'result',
    TUTORIAL: 'tutorial'
};

// 卡牌类型枚举
const CARD_TYPE = {
    // 防御类卡牌
    回气: { 
        name: '回气', 
        cost: 0, 
        effect: 'gain_energy', 
        value: 1, 
        color: '#4CAF50',
        category: 'defense'
    },
    防御: {
        name: '防御',
        cost: 0,
        category: 'defense',
        color: '#607D8B',
        description: '抵挡击打和刺杀攻击，只对近战攻击有效',
        target: ['击打', '刺杀'],
        effect: 'defense'
    },
    闪避: {
        name: '闪避',
        cost: 0,
        category: 'defense',
        color: '#9E9E9E',
        description: '无效化气功和大波攻击，只对远程攻击有效',
        target: ['气功', '大波'],
        effect: 'dodge'
    },
    反弹: {
        name: '反弹',
        cost: 2,
        category: 'defense',
        color: '#FF9800',
        description: '反弹所有攻击给攻击者，通用防御手段',
        target: ['击打', '刺杀', '气功', '大波'],
        effect: 'reflect'
    },
    
    // 攻击类卡牌
    击打: {
        name: '击打',
        cost: 1,
        category: 'attack',
        priority: 1,
        value: 1,
        color: '#FF5722',
        effect: 'damage',
        description: '造成1点伤害，基础近战攻击'
    },
    气功: {
        name: '气功', 
        cost: 2, 
        effect: 'damage', 
        value: 1, 
        color: '#2196F3',
        category: 'attack',
        priority: 2,
        description: '造成1点伤害，基础远程攻击'
    },
    刺杀: {
        name: '刺杀',
        cost: 3,
        effect: 'damage',
        value: 2,
        color: '#E91E63',
        category: 'attack',
        priority: 3,
        description: '造成2点伤害，高伤害近战攻击'
    },
    大波: {
        name: '大波',
        cost: 4,
        effect: 'damage',
        value: 2,
        color: '#3F51B5',
        category: 'attack',
        priority: 4,
        description: '造成2点伤害，高伤害远程攻击'
    }
};

// 角色类型枚举
const CHARACTER_TYPE = {
    骑士: { 
        name: '骑士', 
        health: 3, 
        ability: null,
        color: '#607D8B',
        description: '均衡的战士，没有特殊能力'
    },
    法师: { 
        name: '法师', 
        health: 2, 
        ability: 'qi_wave_discount',
        color: '#3F51B5',
        description: '气功和大波费用-1，但血量较少'
    },
    肉盾: { 
        name: '肉盾', 
        health: 4, 
        ability: 'enemy_attack_cost',
        color: '#795548',
        description: '血量4，初始费用1，所有攻击牌费用+1'
    },
    刺客: { 
        name: '刺客', 
        health: 2, 
        ability: 'upgrade_damage',
        color: '#9C27B0',
        description: '刺杀伤害+1'
    },
    狂战士: { 
        name: '狂战士', 
        health: 2, 
        maxHealth: 3,
        ability: 'berserker',
        color: '#E91E63',
        description: '血量2血量上限3，初始0费用，造成伤害回复1血量'
    }
};

// 数学工具函数
const MathUtils = {
    // 线性插值
    lerp(start, end, factor) {
        return start + (end - start) * factor;
    },
    
    // 缓动函数
    easeOutCubic(t) {
        return 1 - Math.pow(1 - t, 3);
    },
    
    easeInOutCubic(t) {
        return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
    },
    
    easeOutBack(t) {
        const c1 = 1.70158;
        const c3 = c1 + 1;
        return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2);
    },
    
    // 角度转弧度
    degToRad(degrees) {
        return degrees * Math.PI / 180;
    },
    
    // 弧度转角度
    radToDeg(radians) {
        return radians * 180 / Math.PI;
    },
    
    // 随机整数
    randomInt(min, max) {
        return Math.floor(Math.random() * (max - min + 1)) + min;
    },
    
    // 随机浮点数
    randomFloat(min, max) {
        return Math.random() * (max - min) + min;
    },
    
    // 数值约束
    clamp(value, min, max) {
        return Math.min(Math.max(value, min), max);
    },
    
    // 距离计算
    distance(x1, y1, x2, y2) {
        return Math.sqrt(Math.pow(x2 - x1, 2) + Math.pow(y2 - y1, 2));
    }
};

// 事件管理器
class EventManager {
    constructor() {
        this.events = {};
    }
    
    on(event, callback) {
        if (!this.events[event]) {
            this.events[event] = [];
        }
        this.events[event].push(callback);
    }
    
    off(event, callback) {
        if (this.events[event]) {
            this.events[event] = this.events[event].filter(cb => cb !== callback);
        }
    }
    
    emit(event, ...args) {
        if (this.events[event]) {
            this.events[event].forEach(callback => callback(...args));
        }
    }
    
    clear() {
        this.events = {};
    }
}

// 时间管理器
class TimeManager {
    constructor() {
        this.deltaTime = 0;
        this.lastTime = 0;
        this.timeScale = 1;
    }
    
    update(currentTime) {
        if (this.lastTime === 0) {
            this.lastTime = currentTime;
        }
        
        this.deltaTime = (currentTime - this.lastTime) * this.timeScale;
        this.lastTime = currentTime;
    }
    
    getDeltaTime() {
        return this.deltaTime;
    }
    
    setTimeScale(scale) {
        this.timeScale = scale;
    }
}

// 输入管理器
class InputManager {
    constructor(canvas) {
        this.canvas = canvas;
        this.mousePos = { x: 0, y: 0 };
        this.isMouseDown = false;
        this.keys = {};
        
        this.setupEventListeners();
    }
    
    setupEventListeners() {
        // 鼠标事件
        this.canvas.addEventListener('mousemove', (e) => {
            const rect = this.canvas.getBoundingClientRect();
            this.mousePos.x = e.clientX - rect.left;
            this.mousePos.y = e.clientY - rect.top;
            
            // 触发鼠标移动事件
            this.onMouseMove(e);
        });
        
        this.canvas.addEventListener('mousedown', (e) => {
            this.isMouseDown = true;
            this.onMouseDown(e);
        });
        
        this.canvas.addEventListener('mouseup', (e) => {
            this.isMouseDown = false;
            this.onMouseUp(e);
        });
        
        this.canvas.addEventListener('click', (e) => {
            this.onMouseClick(e);
        });
        
        // 触摸事件（移动端支持）
        this.canvas.addEventListener('touchstart', (e) => {
            e.preventDefault();
            const touch = e.touches[0];
            const rect = this.canvas.getBoundingClientRect();
            this.mousePos.x = touch.clientX - rect.left;
            this.mousePos.y = touch.clientY - rect.top;
            this.onMouseClick(e);
        });
        
        this.canvas.addEventListener('touchmove', (e) => {
            e.preventDefault();
            const touch = e.touches[0];
            const rect = this.canvas.getBoundingClientRect();
            this.mousePos.x = touch.clientX - rect.left;
            this.mousePos.y = touch.clientY - rect.top;
        });
        
        // 键盘事件
        window.addEventListener('keydown', (e) => {
            this.keys[e.code] = true;
        });
        
        window.addEventListener('keyup', (e) => {
            this.keys[e.code] = false;
        });
    }
    
    onMouseDown(e) {
        // 由各个场景处理鼠标按下事件
        if (window.game) {
            window.game.handleMouseDown(this.mousePos.x, this.mousePos.y);
        }
    }
    
    onMouseUp(e) {
        // 由各个场景处理鼠标释放事件
        if (window.game) {
            window.game.handleMouseUp(this.mousePos.x, this.mousePos.y);
        }
    }
    
    onMouseClick(e) {
        // 由各个场景处理点击事件
        if (window.game) {
            window.game.handleClick(this.mousePos.x, this.mousePos.y);
        }
    }
    
    onMouseMove(e) {
        // 由各个场景处理鼠标移动事件
        if (window.game) {
            window.game.handleMouseMove(this.mousePos.x, this.mousePos.y);
        }
    }
    
    getMousePos() {
        return { ...this.mousePos };
    }
    
    isKeyPressed(keyCode) {
        return !!this.keys[keyCode];
    }
}

// 音效管理器
class AudioManager {
    constructor() {
        this.sounds = {};
        this.music = null;
        this.volume = 1.0;
        this.musicVolume = 0.5;
    }
    
    loadSound(name, url) {
        return new Promise((resolve, reject) => {
            const audio = new Audio(url);
            audio.addEventListener('canplaythrough', () => {
                this.sounds[name] = audio;
                resolve();
            });
            audio.addEventListener('error', reject);
        });
    }
    
    playSound(name, volume = 1.0) {
        if (this.sounds[name]) {
            const audio = this.sounds[name].cloneNode();
            audio.volume = volume * this.volume;
            audio.play().catch(e => console.warn('Audio play failed:', e));
        }
    }
    
    playMusic(url, loop = true) {
        if (this.music) {
            this.music.pause();
        }
        
        this.music = new Audio(url);
        this.music.loop = loop;
        this.music.volume = this.musicVolume;
        this.music.play().catch(e => console.warn('Music play failed:', e));
    }
    
    stopMusic() {
        if (this.music) {
            this.music.pause();
            this.music = null;
        }
    }
    
    setVolume(volume) {
        this.volume = MathUtils.clamp(volume, 0, 1);
    }
    
    setMusicVolume(volume) {
        this.musicVolume = MathUtils.clamp(volume, 0, 1);
        if (this.music) {
            this.music.volume = this.musicVolume;
        }
    }
}

// 调试工具
const Debug = {
    enabled: true,
    
    log(...args) {
        if (this.enabled) {
            console.log('[DEBUG]', ...args);
        }
    },
    
    drawRect(ctx, x, y, width, height, color = 'red') {
        if (this.enabled) {
            ctx.strokeStyle = color;
            ctx.strokeRect(x, y, width, height);
        }
    },
    
    drawPoint(ctx, x, y, radius = 2, color = 'red') {
        if (this.enabled) {
            ctx.fillStyle = color;
            ctx.beginPath();
            ctx.arc(x, y, radius, 0, Math.PI * 2);
            ctx.fill();
        }
    }
};

// 全局实例
window.eventManager = new EventManager();

// 图片管理器
class ImageManager {
    constructor() {
        this.images = {};
        this.loadPromises = {};
        this.loaded = false;
    }
    
    // 预加载所有角色图片和动作图片
    async preloadCharacterImages() {
        const characterTypes = ['骑士', '法师', '肉盾', '刺客', '狂战士'];
        const actionTypes = ['击打', '刺杀', '防御', '气功', '大波', '闪避', '反弹', '回气'];
        const loadPromises = [];
        
        // 加载角色图片
        for (const character of characterTypes) {
            // 头像
            const avatarPromise = this.loadImage(`${character}头像`, `角色图片/${character}头像.png`);
            loadPromises.push(avatarPromise);
            
            // 全身
            const fullPromise = this.loadImage(`${character}全身`, `角色图片/${character}全身.png`);
            loadPromises.push(fullPromise);
        }
        
        // 加载动作图片
        for (const action of actionTypes) {
            const actionPromise = this.loadImage(`${action}图像`, `动作图片/${action}图像.png`);
            loadPromises.push(actionPromise);
        }
        
        // 加载牌桌背景图片
        const backgroundPromise = this.loadImage('牌桌背景', '牌桌.png');
        loadPromises.push(backgroundPromise);
        
        // 加载主页及角色选择背景图片
        const menuBackgroundPromise = this.loadImage('主页及角色选择背景', '主页及角色选择.png');
        loadPromises.push(menuBackgroundPromise);
        
        // 加载教学图片
        const tutorialPages = ['第一页', '第二页', '第三页'];
        for (const page of tutorialPages) {
            const tutorialPromise = this.loadImage(page, `教学图片/${page}.png`);
            loadPromises.push(tutorialPromise);
        }
        
        try {
            await Promise.all(loadPromises);
            this.loaded = true;
            Debug.log('所有角色图片、动作图片、背景图片和教学图片加载完成');
        } catch (error) {
            Debug.log('图片加载失败:', error);
            throw error;
        }
    }
    
    // 加载单个图片
    async loadImage(name, url) {
        if (this.loadPromises[name]) {
            return this.loadPromises[name];
        }
        
        const promise = new Promise((resolve, reject) => {
            const img = new Image();
            img.onload = () => {
                this.images[name] = img;
                resolve(img);
            };
            img.onerror = () => {
                Debug.log(`图片加载失败: ${url}`);
                // 即使失败也resolve，避免阻塞游戏
                resolve(null);
            };
            img.src = url;
        });
        
        this.loadPromises[name] = promise;
        return promise;
    }
    
    // 获取图片
    getImage(name) {
        return this.images[name] || null;
    }
    
    // 检查图片是否已加载
    isImageLoaded(name) {
        return !!this.images[name];
    }
    
    // 清理图片缓存
    clear() {
        this.images = {};
        this.loadPromises = {};
        this.loaded = false;
    }
    
    // 居中绘制图片
    drawImageCentered(ctx, imageName, x, y, width, height) {
        const img = this.getImage(imageName);
        if (!img || !img.complete) {
            return false; // 图片未加载或加载失败
        }
        
        try {
            // 保存当前状态
            ctx.save();
            
            // 创建圆角裁剪区域（可选）
            ctx.beginPath();
            ctx.rect(x - width/2, y - height/2, width, height);
            ctx.clip();
            
            // 计算图片绘制位置和尺寸，保持比例
            const imgAspect = img.width / img.height;
            const targetAspect = width / height;
            
            let drawWidth, drawHeight;
            if (imgAspect > targetAspect) {
                // 图片更宽，以高度为准
                drawHeight = height;
                drawWidth = drawHeight * imgAspect;
            } else {
                // 图片更高或比例相同，以宽度为准
                drawWidth = width;
                drawHeight = drawWidth / imgAspect;
            }
            
            // 居中绘制
            const drawX = x - drawWidth / 2;
            const drawY = y - drawHeight / 2;
            
            ctx.drawImage(img, drawX, drawY, drawWidth, drawHeight);
            
            // 恢复状态
            ctx.restore();
            
            return true; // 绘制成功
        } catch (error) {
            Debug.log(`绘制图片失败: ${imageName}`, error);
            ctx.restore();
            return false;
        }
    }
    
    // 绘制图片（指定左上角位置）
    drawImage(ctx, imageName, x, y, width, height) {
        const img = this.getImage(imageName);
        if (!img || !img.complete) {
            return false; // 图片未加载或加载失败
        }
        
        try {
            // 直接绘制完整图片，不进行裁剪和比例调整
            ctx.drawImage(img, x, y, width, height);
            return true; // 绘制成功
        } catch (error) {
            Debug.log(`绘制图片失败: ${imageName}`, error);
            return false;
        }
    }
}

// 全局FPS计数器实例将在ui.js中创建