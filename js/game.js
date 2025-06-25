// 主游戏类
class Game {
    constructor() {
        this.canvas = null;
        this.ctx = null;
        this.isRunning = false;
        this.lastTime = 0;
        this.timeManager = new TimeManager();
        this.inputManager = null;
        this.audioManager = new AudioManager();
        this.sceneManager = new SceneManager();
        this.characterManager = new CharacterManager();
        
        // 检查ImageManager类是否存在
        if (typeof ImageManager === 'undefined') {
            console.error('ImageManager类未定义！');
            this.imageManager = null;
        } else {
            this.imageManager = new ImageManager();
            Debug.log('ImageManager实例创建成功');
        }
        
        // 游戏状态
        this.currentState = GAME_STATE.LOADING;
        this.isInitialized = false;
        
        Debug.log('游戏实例创建完成');
        
        // 添加全局错误处理
        window.addEventListener('error', (e) => {
            console.error('全局错误:', e.error);
        });
    }
    
    // 初始化游戏
    async init() {
        try {
            Debug.log('开始初始化游戏...');
            
            // 获取Canvas
            this.canvas = document.getElementById('gameCanvas');
            if (!this.canvas) {
                throw new Error('找不到游戏Canvas元素');
            }
            
            this.ctx = this.canvas.getContext('2d');
            if (!this.ctx) {
                throw new Error('无法获取Canvas 2D上下文');
            }
            
            // 设置Canvas大小
            this.canvas.width = CONFIG.CANVAS_WIDTH;
            this.canvas.height = CONFIG.CANVAS_HEIGHT;
            
            // 初始化输入管理器
            this.inputManager = new InputManager(this.canvas);
            
            // 设置全局游戏引用
            window.game = this;
            
            // 加载资源
            await this.loadResources();
            
            // 初始化完成
            this.isInitialized = true;
            
            // 开始游戏循环
            this.start();
            
            // 切换到主菜单
            this.changeScene(GAME_STATE.MAIN_MENU);
            
            Debug.log('游戏初始化完成');
            
        } catch (error) {
            console.error('游戏初始化失败:', error);
            this.showError('游戏初始化失败: ' + error.message);
        }
    }
    
    // 加载资源
    async loadResources() {
        Debug.log('开始加载游戏资源...');
        
        // 显示加载界面
        const loadingElement = document.getElementById('loadingScreen');
        if (loadingElement) {
            loadingElement.classList.remove('hidden');
        }
        
        try {
            // 加载角色图片
            if (this.imageManager) {
                await this.imageManager.preloadCharacterImages();
            } else {
                Debug.log('ImageManager不可用，跳过图片加载');
            }
            
            Debug.log('资源加载完成');
            
        } catch (error) {
            Debug.log('资源加载失败:', error);
            throw error;
        } finally {
            // 隐藏加载界面
            if (loadingElement) {
                loadingElement.classList.add('hidden');
            }
        }
    }
    
    // 开始游戏循环
    start() {
        if (this.isRunning) return;
        
        this.isRunning = true;
        this.lastTime = performance.now();
        this.gameLoop();
        
        Debug.log('游戏循环开始');
    }
    
    // 停止游戏循环
    stop() {
        this.isRunning = false;
        Debug.log('游戏循环停止');
    }
    
    // 主游戏循环
    gameLoop() {
        if (!this.isRunning) return;
        
        const currentTime = performance.now();
        
        // 更新时间管理器
        this.timeManager.update(currentTime);
        const deltaTime = this.timeManager.getDeltaTime();
        
        // FPS计数器已移除
        
        // 更新游戏逻辑
        this.update(deltaTime);
        
        // 渲染游戏
        this.render();
        
        // 继续游戏循环
        requestAnimationFrame(() => this.gameLoop());
    }
    
    // 更新游戏逻辑
    update(deltaTime) {
        if (!this.isInitialized) return;
        
        // 更新场景管理器
        this.sceneManager.update(deltaTime);
        
        // 更新动画管理器
        if (typeof AnimationManager !== 'undefined' && AnimationManager.update) {
            AnimationManager.update(deltaTime);
        }
    }
    
    // 渲染游戏
    render() {
        if (!this.ctx) return;
        
        // 清空画布
        this.ctx.clearRect(0, 0, CONFIG.CANVAS_WIDTH, CONFIG.CANVAS_HEIGHT);
        
        // 渲染当前场景
        this.sceneManager.render(this.ctx);
        
        // 调试信息已移除 - 避免遮挡界面
    }
    
    // 渲染调试信息
    renderDebugInfo() {
        this.ctx.save();
        this.ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
        this.ctx.fillRect(10, 10, 200, 60);
        
        this.ctx.fillStyle = '#FFFFFF';
        this.ctx.font = '12px Arial';
        this.ctx.textAlign = 'left';
        this.ctx.fillText(`场景: ${this.sceneManager.getCurrentScene()?.name || 'None'}`, 20, 30);
        this.ctx.fillText(`动画数量: ${AnimationManager.instance ? AnimationManager.instance.tweens.length : 0}`, 20, 50);
        
        this.ctx.restore();
    }
    
    // 处理鼠标按下事件
    handleMouseDown(x, y) {
        if (!this.isInitialized) return;
        
        // 传递给当前场景处理
        const currentScene = this.sceneManager.getCurrentScene();
        if (currentScene && typeof currentScene.handleMouseDown === 'function') {
            const handled = currentScene.handleMouseDown(x, y);
            if (handled) {
                Debug.log('鼠标按下事件被场景处理:', x, y);
            }
        }
    }
    
    // 处理鼠标释放事件
    handleMouseUp(x, y) {
        if (!this.isInitialized) return;
        
        // 传递给当前场景处理
        const currentScene = this.sceneManager.getCurrentScene();
        if (currentScene && typeof currentScene.handleMouseUp === 'function') {
            const handled = currentScene.handleMouseUp(x, y);
            if (handled) {
                Debug.log('鼠标释放事件被场景处理:', x, y);
            }
        }
    }
    
    // 处理点击事件
    handleClick(x, y) {
        if (!this.isInitialized) return;
        
        Debug.log('点击位置:', x, y);
        
        // 传递给场景管理器处理
        const handled = this.sceneManager.handleClick(x, y);
        
        if (!handled) {
            Debug.log('点击未被处理');
        }
    }
    
    // 处理鼠标移动事件
    handleMouseMove(x, y) {
        if (!this.isInitialized) return;
        
        // 传递给当前场景处理
        const currentScene = this.sceneManager.getCurrentScene();
        if (currentScene && typeof currentScene.handleMouseMove === 'function') {
            currentScene.handleMouseMove(x, y);
        }
    }
    
    // 切换场景
    changeScene(sceneName) {
        Debug.log('切换场景:', sceneName);
        this.currentState = sceneName;
        this.sceneManager.changeScene(sceneName);
    }
    
    // 获取当前场景
    getCurrentScene() {
        return this.sceneManager.getCurrentScene();
    }
    
    // 暂停游戏
    pause() {
        this.timeManager.setTimeScale(0);
        Debug.log('游戏暂停');
    }
    
    // 恢复游戏
    resume() {
        this.timeManager.setTimeScale(1);
        Debug.log('游戏恢复');
    }
    
    // 重置游戏
    reset() {
        Debug.log('重置游戏');
        
        // 清空动画
        if (typeof AnimationManager !== 'undefined' && AnimationManager.clear) {
            AnimationManager.clear();
        }
        
        // 重置角色管理器
        this.characterManager.reset();
        
        // 切换到主菜单
        this.changeScene(GAME_STATE.MAIN_MENU);
    }
    
    // 显示错误信息
    showError(message) {
        console.error(message);
        
        // 在画布上显示错误信息
        if (this.ctx) {
            this.ctx.fillStyle = '#FF0000';
            this.ctx.font = '20px Arial';
            this.ctx.textAlign = 'center';
            this.ctx.fillText(
                '游戏出现错误，请刷新页面重试', 
                CONFIG.CANVAS_WIDTH / 2, 
                CONFIG.CANVAS_HEIGHT / 2
            );
            this.ctx.fillText(
                message, 
                CONFIG.CANVAS_WIDTH / 2, 
                CONFIG.CANVAS_HEIGHT / 2 + 30
            );
        }
    }
    
    // 获取游戏信息
    getGameInfo() {
        return {
            version: '1.0.0',
            isRunning: this.isRunning,
            currentScene: this.getCurrentScene()?.name,
            canvasSize: {
                width: CONFIG.CANVAS_WIDTH,
                height: CONFIG.CANVAS_HEIGHT
            }
        };
    }
    
    // 销毁游戏
    destroy() {
        Debug.log('销毁游戏实例');
        
        this.stop();
        
        // 清空所有管理器
        if (typeof AnimationManager !== 'undefined' && AnimationManager.clear) {
            AnimationManager.clear();
        }
        this.characterManager.reset();
        
        // 清空引用
        this.canvas = null;
        this.ctx = null;
        this.inputManager = null;
        window.game = null;
    }
}

// 初始化错误处理
window.addEventListener('error', (event) => {
    console.error('全局错误:', event.error);
    if (window.game) {
        window.game.showError('发生未知错误: ' + event.error.message);
    }
});

// 页面卸载时清理
window.addEventListener('beforeunload', () => {
    if (window.game) {
        window.game.destroy();
    }
}); 