// 基础场景类
class Scene {
    constructor(name) {
        this.name = name;
        this.isActive = false;
        this.buttons = [];
        this.elements = [];
    }
    
    enter() {
        this.isActive = true;
        Debug.log(`进入场景: ${this.name}`);
    }
    
    exit() {
        this.isActive = false;
        Debug.log(`离开场景: ${this.name}`);
    }
    
    update(deltaTime) {
        // 子类重写
    }
    
    render(ctx) {
        // 子类重写
    }
    
    handleClick(x, y) {
        // 检查按钮点击
        for (let button of this.buttons) {
            if (button.isPointInside(x, y)) {
                button.onClick();
                return true;
            }
        }
        return false;
    }
    
    addButton(button) {
        this.buttons.push(button);
    }
    
    clearButtons() {
        this.buttons = [];
    }
}

// 主菜单场景
class MainMenuScene extends Scene {
    constructor() {
        super('主菜单');
        this.title = '气功卡牌对战';
        this.setupButtons();
    }
    
    setupButtons() {
        // 选择角色按钮（左上角）
        this.addButton({
            x: 120,
            y: 50,
            width: 120,
            height: 40,
            text: '选择角色',
            onClick: () => {
                window.game.changeScene(GAME_STATE.CHARACTER_SELECT);
            },
            isPointInside: function(x, y) {
                return x >= this.x - this.width/2 && x <= this.x + this.width/2 &&
                       y >= this.y - this.height/2 && y <= this.y + this.height/2;
            }
        });
        
        // 开始游戏按钮
        this.addButton({
            x: CONFIG.CANVAS_WIDTH / 2,
            y: 300,
            width: 200,
            height: 50,
            text: '开始游戏',
            onClick: () => {
                // 确保有选择的角色，如果没有则设置默认角色
                if (!window.game.characterManager.getSelectedCharacter()) {
                    window.game.characterManager.setSelectedCharacter('骑士');
                }
                window.game.changeScene(GAME_STATE.BATTLE);
            },
            isPointInside: function(x, y) {
                return x >= this.x - this.width/2 && x <= this.x + this.width/2 &&
                       y >= this.y - this.height/2 && y <= this.y + this.height/2;
            }
        });
        
        // 教程按钮
        this.addButton({
            x: CONFIG.CANVAS_WIDTH / 2,
            y: 370,
            width: 200,
            height: 50,
            text: '游戏教程',
            onClick: () => {
                window.game.changeScene(GAME_STATE.TUTORIAL);
            },
            isPointInside: function(x, y) {
                return x >= this.x - this.width/2 && x <= this.x + this.width/2 &&
                       y >= this.y - this.height/2 && y <= this.y + this.height/2;
            }
        });
    }
    
    render(ctx) {
        // 绘制背景图片
        const imageManager = window.game?.imageManager;
        let backgroundDrawn = false;
        
        if (imageManager) {
            backgroundDrawn = imageManager.drawImage(
                ctx,
                '主页及角色选择背景',
                0, 0,
                CONFIG.CANVAS_WIDTH,
                CONFIG.CANVAS_HEIGHT
            );
        }
        
        // 如果背景图片未加载，使用渐变背景作为备用
        if (!backgroundDrawn) {
            const gradient = ctx.createLinearGradient(0, 0, 0, CONFIG.CANVAS_HEIGHT);
            gradient.addColorStop(0, '#1a1a2e');
            gradient.addColorStop(1, '#16213e');
            ctx.fillStyle = gradient;
            ctx.fillRect(0, 0, CONFIG.CANVAS_WIDTH, CONFIG.CANVAS_HEIGHT);
        }
        
        // 标题
        ctx.fillStyle = '#FFFFFF';
        ctx.font = 'bold 48px Arial';
        ctx.textAlign = 'center';
        ctx.fillText(this.title, CONFIG.CANVAS_WIDTH / 2, 150);
        
        // 副标题
        ctx.font = '18px Arial';
        ctx.fillStyle = '#CCCCCC';
        ctx.fillText('选择你的战士，开始气功对决', CONFIG.CANVAS_WIDTH / 2, 200);
        
        // 当前选中角色显示
        const selectedCharacter = window.game?.characterManager?.getSelectedCharacter();
        if (selectedCharacter) {
            const character = CHARACTER_TYPE[selectedCharacter];
            ctx.font = 'bold 16px Arial';
            ctx.fillStyle = character.color;
            ctx.fillText(`当前角色：${character.name}`, CONFIG.CANVAS_WIDTH / 2, 250);
        }
        
        // 渲染按钮
        this.renderButtons(ctx);
        
        // 版本信息
        ctx.font = '12px Arial';
        ctx.fillStyle = '#666666';
        ctx.textAlign = 'right';
        ctx.fillText('Demo v1.0', CONFIG.CANVAS_WIDTH - 20, CONFIG.CANVAS_HEIGHT - 20);
    }
    
    renderButtons(ctx) {
        this.buttons.forEach(button => {
            // 区分左上角小按钮和主要按钮
            const isSmallButton = button.width <= 120;
            
            // 按钮背景
            const gradient = ctx.createLinearGradient(
                button.x - button.width/2, button.y - button.height/2,
                button.x + button.width/2, button.y + button.height/2
            );
            
            if (isSmallButton) {
                // 小按钮使用更低调的颜色
                gradient.addColorStop(0, '#607D8B');
                gradient.addColorStop(1, '#546E7A');
            } else {
                // 主要按钮使用绿色
                gradient.addColorStop(0, '#4CAF50');
                gradient.addColorStop(1, '#45a049');
            }
            
            ctx.fillStyle = gradient;
            ctx.fillRect(
                button.x - button.width/2, 
                button.y - button.height/2, 
                button.width, 
                button.height
            );
            
            // 按钮边框
            ctx.strokeStyle = '#FFFFFF';
            ctx.lineWidth = isSmallButton ? 1 : 2;
            ctx.strokeRect(
                button.x - button.width/2, 
                button.y - button.height/2, 
                button.width, 
                button.height
            );
            
            // 按钮文字
            ctx.fillStyle = '#FFFFFF';
            ctx.font = isSmallButton ? 'bold 12px Arial' : 'bold 16px Arial';
            ctx.textAlign = 'center';
            ctx.fillText(button.text, button.x, button.y + (isSmallButton ? 3 : 5));
        });
    }
}

// 角色选择场景
class CharacterSelectScene extends Scene {
    constructor() {
        super('角色选择');
        this.selectedCharacter = window.game?.characterManager?.getSelectedCharacter() || '骑士';
        
        // UI图片资源
        this.uiImages = {};
        this.uiImagesInitialized = false;
        
        this.setupButtons();
    }
    
    enter() {
        super.enter();
        this.selectedCharacter = window.game.characterManager.getSelectedCharacter() || '骑士';
        this.setupButtons(); // 重新设置按钮以更新选中状态
    }
    
    initUIImages() {
        // 加载UI图片资源（只加载主页图标）
        const imageNames = ['主页图标1'];
        const imageKeys = ['home'];
        
        imageNames.forEach((imageName, index) => {
            const img = new Image();
            img.onload = () => {
                Debug.log(`角色选择场景UI图片加载成功: ${imageName}`);
            };
            img.onerror = (err) => {
                Debug.log(`角色选择场景UI图片加载失败: ${imageName}`);
                console.error('图片加载错误:', err);
            };
            img.src = `ui素材图/${imageName}.png`;
            this.uiImages[imageKeys[index]] = img;
        });
        
        Debug.log('角色选择场景UI图片初始化完成');
    }
    
    setupButtons() {
        this.clearButtons();
        
        // 初始化UI图片资源（只在第一次调用时初始化）
        if (!this.uiImagesInitialized) {
            this.initUIImages();
            this.uiImagesInitialized = true;
        }
        
        // 角色头像选择按钮（水平排列）
        const characterTypes = Object.keys(CHARACTER_TYPE);
        const buttonSize = 120; // 正方形头像按钮
        const margin = 40;
        const totalWidth = characterTypes.length * (buttonSize + margin) - margin;
        const startX = (CONFIG.CANVAS_WIDTH - totalWidth) / 2 + buttonSize / 2;
        const buttonY = 180;
        
        characterTypes.forEach((type, index) => {
            const character = CHARACTER_TYPE[type];
            const x = startX + index * (buttonSize + margin);
            
            this.addButton({
                x: x,
                y: buttonY,
                width: buttonSize,
                height: buttonSize,
                text: character.name,
                characterType: type,
                isSelected: type === this.selectedCharacter,
                onClick: () => {
                    this.selectedCharacter = type;
                    window.game.characterManager.setSelectedCharacter(type);
                    this.setupButtons(); // 重新设置按钮以更新选中状态
                },
                isPointInside: function(x, y) {
                    return x >= this.x - this.width/2 && x <= this.x + this.width/2 &&
                           y >= this.y - this.height/2 && y <= this.y + this.height/2;
                }
            });
        });
        
        // 确定选择按钮
        this.addButton({
            x: CONFIG.CANVAS_WIDTH / 2,
            y: 560,
            width: 200,
            height: 50,
            text: '开始战斗',
            onClick: () => {
                window.game.changeScene(GAME_STATE.BATTLE);
            },
            isPointInside: function(x, y) {
                return x >= this.x - this.width/2 && x <= this.x + this.width/2 &&
                       y >= this.y - this.height/2 && y <= this.y + this.height/2;
            }
        });
        
        // 主页按钮（与对战场景保持一致）
        this.addButton({
            x: 70,
            y: 50,
            width: 70,
            height: 70,
            text: '主页',
            image: 'home',
            onClick: () => {
                window.game.changeScene(GAME_STATE.MAIN_MENU);
            },
            isPointInside: function(x, y) {
                return x >= this.x - this.width/2 && x <= this.x + this.width/2 &&
                       y >= this.y - this.height/2 && y <= this.y + this.height/2;
            }
        });
    }
    
    render(ctx) {
        // 绘制背景图片
        const imageManager = window.game?.imageManager;
        let backgroundDrawn = false;
        
        if (imageManager) {
            backgroundDrawn = imageManager.drawImage(
                ctx,
                '主页及角色选择背景',
                0, 0,
                CONFIG.CANVAS_WIDTH,
                CONFIG.CANVAS_HEIGHT
            );
        }
        
        // 如果背景图片未加载，使用渐变背景作为备用
        if (!backgroundDrawn) {
            const gradient = ctx.createLinearGradient(0, 0, 0, CONFIG.CANVAS_HEIGHT);
            gradient.addColorStop(0, '#2d1b69');
            gradient.addColorStop(1, '#1a1a2e');
            ctx.fillStyle = gradient;
            ctx.fillRect(0, 0, CONFIG.CANVAS_WIDTH, CONFIG.CANVAS_HEIGHT);
        }
        
        // 标题
        ctx.fillStyle = '#FFFFFF';
        ctx.font = 'bold 36px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('选择角色', CONFIG.CANVAS_WIDTH / 2, 80);
        
        // 渲染角色头像按钮
        this.renderCharacterAvatarButtons(ctx);
        
        // 渲染选中角色的全身像
        this.renderSelectedCharacterFullBody(ctx);
        
        // 渲染角色介绍
        this.renderCharacterDescription(ctx);
        
        // 渲染其他按钮
        this.renderOtherButtons(ctx);
    }
    
    // 渲染角色头像按钮
    renderCharacterAvatarButtons(ctx) {
        this.buttons.filter(btn => btn.characterType).forEach(button => {
            const character = CHARACTER_TYPE[button.characterType];
            const imageManager = window.game?.imageManager;
            
            // 按钮边框
            if (button.isSelected) {
                ctx.strokeStyle = '#FFD700';
                ctx.lineWidth = 4;
            } else {
                ctx.strokeStyle = '#FFFFFF';
                ctx.lineWidth = 2;
            }
            ctx.strokeRect(
                button.x - button.width/2,
                button.y - button.height/2,
                button.width,
                button.height
            );
            
            // 渲染头像
            let avatarDrawn = false;
            if (imageManager) {
                avatarDrawn = imageManager.drawImageCentered(
                    ctx, 
                    `${button.characterType}头像`, 
                    button.x, 
                    button.y - 10, 
                    button.width - 8, 
                    button.height - 30
                );
            }
            
            // 如果图片未加载，显示备用颜色
            if (!avatarDrawn) {
                ctx.fillStyle = character.color;
                ctx.fillRect(
                    button.x - button.width/2 + 4,
                    button.y - button.height/2 + 4,
                    button.width - 8,
                    button.height - 30
                );
            }
            
            // 角色名称
            ctx.fillStyle = '#FFFFFF';
            ctx.font = 'bold 14px Arial';
            ctx.textAlign = 'center';
            ctx.fillText(button.text, button.x, button.y + button.height/2 - 8);
            
            // 选中高亮效果
            if (button.isSelected) {
                ctx.fillStyle = 'rgba(255, 215, 0, 0.3)';
                ctx.fillRect(
                    button.x - button.width/2,
                    button.y - button.height/2,
                    button.width,
                    button.height
                );
            }
        });
    }
    
    // 渲染选中角色的全身像
    renderSelectedCharacterFullBody(ctx) {
        const character = CHARACTER_TYPE[this.selectedCharacter];
        if (!character) return;
        
        const imageManager = window.game?.imageManager;
        const fullBodyX = 150; // 左下角位置（调整）
        const fullBodyY = 450;
        const fullBodyWidth = 180;
        const fullBodyHeight = 220;
        
        // 背景框
        ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
        ctx.fillRect(fullBodyX - fullBodyWidth/2, fullBodyY - fullBodyHeight/2, fullBodyWidth, fullBodyHeight);
        
        ctx.strokeStyle = character.color;
        ctx.lineWidth = 3;
        ctx.strokeRect(fullBodyX - fullBodyWidth/2, fullBodyY - fullBodyHeight/2, fullBodyWidth, fullBodyHeight);
        
        // 渲染全身像
        let fullBodyDrawn = false;
        if (imageManager) {
            fullBodyDrawn = imageManager.drawImageCentered(
                ctx,
                `${this.selectedCharacter}全身`,
                fullBodyX,
                fullBodyY,
                fullBodyWidth - 20,
                fullBodyHeight - 20
            );
        }
        
        // 如果图片未加载，显示备用内容
        if (!fullBodyDrawn) {
            ctx.fillStyle = character.color;
            ctx.fillRect(
                fullBodyX - fullBodyWidth/2 + 10,
                fullBodyY - fullBodyHeight/2 + 10,
                fullBodyWidth - 20,
                fullBodyHeight - 20
            );
            
            ctx.fillStyle = '#FFFFFF';
            ctx.font = 'bold 24px Arial';
            ctx.textAlign = 'center';
            ctx.fillText(character.name, fullBodyX, fullBodyY);
        }
    }
    
    // 渲染角色介绍
    renderCharacterDescription(ctx) {
        const character = CHARACTER_TYPE[this.selectedCharacter];
        if (!character) return;
        
        const descX = 600; // 右下角位置（调整到画布内）
        const descY = 380;
        const descWidth = 180;
        const descHeight = 200;
        
        // 背景框
        ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
        ctx.fillRect(descX - descWidth/2, descY - descHeight/2, descWidth, descHeight);
        
        ctx.strokeStyle = character.color;
        ctx.lineWidth = 2;
        ctx.strokeRect(descX - descWidth/2, descY - descHeight/2, descWidth, descHeight);
        
        // 角色信息
        ctx.fillStyle = '#FFFFFF';
        ctx.font = 'bold 16px Arial';
        ctx.textAlign = 'center';
        ctx.fillText(character.name, descX, descY - 70);
        
        ctx.font = '12px Arial';
        ctx.textAlign = 'left';
        const leftX = descX - descWidth/2 + 15;
        
        // 血量
        ctx.fillText(`血量：${character.health}`, leftX, descY - 40);
        
        // 特殊能力
        ctx.fillText('特殊能力：', leftX, descY - 20);
        
        // 多行描述
        const description = character.description;
        const maxWidth = descWidth - 30;
        const lineHeight = 16;
        const lines = this.wrapText(ctx, description, maxWidth);
        
        ctx.font = '11px Arial';
        lines.forEach((line, index) => {
            ctx.fillText(line, leftX, descY + 5 + index * lineHeight);
        });
    }
    
    // 文本换行工具方法
    wrapText(ctx, text, maxWidth) {
        const words = text.split('');
        const lines = [];
        let currentLine = '';
        
        for (let i = 0; i < words.length; i++) {
            const testLine = currentLine + words[i];
            const metrics = ctx.measureText(testLine);
            const testWidth = metrics.width;
            
            if (testWidth > maxWidth && currentLine !== '') {
                lines.push(currentLine);
                currentLine = words[i];
            } else {
                currentLine = testLine;
            }
        }
        lines.push(currentLine);
        return lines;
    }
    
    renderOtherButtons(ctx) {
        this.buttons.filter(btn => !btn.characterType).forEach(button => {
            if (button.image && this.uiImages[button.image]) {
                // 使用UI图片渲染按钮（与对战场景完全一致）
                const img = this.uiImages[button.image];
                if (img.complete && img.naturalHeight !== 0) {
                    ctx.drawImage(
                        img,
                        button.x - button.width/2,
                        button.y - button.height/2,
                        button.width,
                        button.height
                    );
                } else {
                    // 图片未加载完成时显示备用按钮
                    Debug.log(`主页按钮图片未加载完成: ${button.image}`);
                    this.renderFallbackButton(ctx, button);
                }
            } else {
                // 没有图片时显示普通按钮
                this.renderFallbackButton(ctx, button);
            }
        });
    }
    
    renderFallbackButton(ctx, button) {
        // 普通按钮背景
        ctx.fillStyle = '#4CAF50';
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
        ctx.fillStyle = '#FFFFFF';
        ctx.font = 'bold 14px Arial';
        ctx.textAlign = 'center';
        ctx.fillText(button.text, button.x, button.y + 3);
    }
    
    getShortAbilityText(type) {
        switch(type) {
            case '骑士': return '无特殊能力';
            case '法师': return '气功-1费用';
            case '肉盾': return '初始费用1，所有攻击牌+1费用';
            case '刺客': return '升级击打+1伤害';
            case '狂战士': return '初始0费用，受伤+1';
            default: return '';
        }
    }
    
    darkenColor(color, amount) {
        const hex = color.replace('#', '');
        const r = Math.max(0, parseInt(hex.substr(0, 2), 16) * (1 - amount));
        const g = Math.max(0, parseInt(hex.substr(2, 2), 16) * (1 - amount));
        const b = Math.max(0, parseInt(hex.substr(4, 2), 16) * (1 - amount));
        
        return `rgb(${Math.floor(r)}, ${Math.floor(g)}, ${Math.floor(b)})`;
    }
}

// 场景管理器
class SceneManager {
    constructor() {
        this.scenes = {};
        this.currentScene = null;
        this.initializeScenes();
    }
    
    initializeScenes() {
        this.scenes[GAME_STATE.MAIN_MENU] = new MainMenuScene();
        this.scenes[GAME_STATE.CHARACTER_SELECT] = new CharacterSelectScene();
        this.scenes[GAME_STATE.BATTLE] = new BattleScene(); // 直接初始化
        // 延迟初始化教程场景，避免加载顺序问题
        this.scenes[GAME_STATE.TUTORIAL] = null;
    }
    
    changeScene(sceneName) {
        if (this.currentScene) {
            this.currentScene.exit();
        }
        
        // 延迟初始化教程场景
        if (sceneName === GAME_STATE.TUTORIAL && !this.scenes[GAME_STATE.TUTORIAL]) {
            try {
                this.scenes[GAME_STATE.TUTORIAL] = new TutorialScene();
                Debug.log('教程场景初始化成功');
            } catch (error) {
                Debug.log('教程场景初始化失败:', error);
                alert('教程功能暂时不可用: ' + error.message);
                return;
            }
        }
        
        this.currentScene = this.scenes[sceneName];
        if (this.currentScene) {
            this.currentScene.enter();
            
            // 更新UI显示
            const sceneElement = document.getElementById('currentScene');
            if (sceneElement) {
                sceneElement.textContent = this.currentScene.name;
            }
        } else {
            Debug.log('场景不存在:', sceneName);
        }
    }
    
    update(deltaTime) {
        if (this.currentScene) {
            this.currentScene.update(deltaTime);
        }
    }
    
    render(ctx) {
        if (this.currentScene) {
            this.currentScene.render(ctx);
        }
    }
    
    handleClick(x, y) {
        if (this.currentScene) {
            return this.currentScene.handleClick(x, y);
        }
        return false;
    }
    
    getCurrentScene() {
        return this.currentScene;
    }
} 