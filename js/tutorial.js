// 教程场景类
class TutorialScene extends Scene {
    constructor() {
        super('游戏教程');
        this.currentPage = 0;
        this.totalPages = 3;
        this.setupContent();
        this.setupUI();
    }
    
    setupContent() {
        this.pages = [
            {
                title: '🎯 游戏基础',
                type: 'basic'
            },
            {
                title: '🎮 牌桌界面',
                type: 'ui'
            },
            {
                title: '⚔️ 对抗系统',
                type: 'combat'
            },
            {
                title: '👥 角色选择',
                type: 'character'
            },
            {
                title: '🎉 教程完成',
                type: 'completion'
            }
        ];
    }
    
    setupUI() {
        this.clearButtons();
        
        // 主页按钮（左上角，与对战场景保持一致）
        this.addButton({
            x: 50,
            y: 50,
            width: 60,
            height: 60,
            text: '主页',
            image: 'home',
            onClick: () => window.game.changeScene(GAME_STATE.MAIN_MENU),
            isPointInside: function(x, y) {
                return x >= this.x - this.width/2 && x <= this.x + this.width/2 &&
                       y >= this.y - this.height/2 && y <= this.y + this.height/2;
            }
        });
        
        // 上一页按钮
        if (this.currentPage > 0) {
            this.addButton({
                x: 150,
                y: CONFIG.CANVAS_HEIGHT - 50,
                width: 100,
                height: 40,
                text: '← 上一页',
                onClick: () => this.previousPage(),
                isPointInside: function(x, y) {
                    return x >= this.x - this.width/2 && x <= this.x + this.width/2 &&
                           y >= this.y - this.height/2 && y <= this.y + this.height/2;
                }
            });
        }
        
        // 下一页按钮
        if (this.currentPage < this.totalPages - 1) {
            this.addButton({
                x: CONFIG.CANVAS_WIDTH - 150,
                y: CONFIG.CANVAS_HEIGHT - 50,
                width: 100,
                height: 40,
                text: '下一页 →',
                onClick: () => this.nextPage(),
                isPointInside: function(x, y) {
                    return x >= this.x - this.width/2 && x <= this.x + this.width/2 &&
                           y >= this.y - this.height/2 && y <= this.y + this.height/2;
                }
            });
        }
        
        // 最后一页添加开始游戏按钮
        if (this.currentPage === this.totalPages - 1) {
            this.addButton({
                x: CONFIG.CANVAS_WIDTH / 2,
                y: CONFIG.CANVAS_HEIGHT - 100,
                width: 200,
                height: 50,
                text: '开始游戏',
                onClick: () => window.game.changeScene(GAME_STATE.CHARACTER_SELECT),
                isPointInside: function(x, y) {
                    return x >= this.x - this.width/2 && x <= this.x + this.width/2 &&
                           y >= this.y - this.height/2 && y <= this.y + this.height/2;
                }
            });
        }
    }
    
    previousPage() {
        if (this.currentPage > 0) {
            this.currentPage--;
            this.setupUI();
        }
    }
    
    nextPage() {
        if (this.currentPage < this.totalPages - 1) {
            this.currentPage++;
            this.setupUI();
        }
    }
    
    render(ctx) {
        // 桌游说明书风格背景
        ctx.fillStyle = '#F5F5DC'; // 米色背景
        ctx.fillRect(0, 0, CONFIG.CANVAS_WIDTH, CONFIG.CANVAS_HEIGHT);
        
        // 根据当前页面渲染不同内容
        switch (this.currentPage) {
            case 0:
                this.renderPage1(ctx);
                break;
            case 1:
                this.renderPage2(ctx);
                break;
            case 2:
                this.renderPage3(ctx);
                break;
        }
        
        // 渲染页码指示器（移到底部中央）
        this.renderPageIndicator(ctx);
        
        // 渲染按钮
        this.renderButtons(ctx);
    }
    
    // 渲染页码指示器（底部中央位置）
    renderPageIndicator(ctx) {
        const indicatorX = CONFIG.CANVAS_WIDTH / 2;
        const indicatorY = CONFIG.CANVAS_HEIGHT - 100;
        
        // 页码文字
        ctx.font = 'bold 18px Arial';
        ctx.fillStyle = '#111111'; // 进一步加深
        ctx.textAlign = 'center';
        ctx.fillText(`第 ${this.currentPage + 1} 页 / 共 ${this.totalPages} 页`, indicatorX, indicatorY);
        
        // 圆点指示器
        const dotSize = 8;
        const dotSpacing = 20;
        const totalWidth = (this.totalPages - 1) * dotSpacing;
        const startX = indicatorX - totalWidth / 2;
        
        for (let i = 0; i < this.totalPages; i++) {
            const x = startX + i * dotSpacing;
            ctx.fillStyle = i === this.currentPage ? '#1565C0' : '#999999';
            ctx.beginPath();
            ctx.arc(x, indicatorY + 20, dotSize / 2, 0, Math.PI * 2);
            ctx.fill();
        }
    }
    
    // 第一页：游戏基础
    renderPage1(ctx) {
        // 使用教学图片显示第一页
        const imageManager = window.game?.imageManager;
        if (imageManager) {
            const imageDrawn = imageManager.drawImage(
                ctx,
                '第一页',
                0, 0,
                CONFIG.CANVAS_WIDTH,
                CONFIG.CANVAS_HEIGHT
            );
            
            // 如果图片未加载，显示备用内容
            if (!imageDrawn) {
                ctx.fillStyle = '#F5F5DC';
                ctx.fillRect(0, 0, CONFIG.CANVAS_WIDTH, CONFIG.CANVAS_HEIGHT);
                ctx.fillStyle = '#2C3E50';
                ctx.font = 'bold 24px Arial';
                ctx.textAlign = 'center';
                ctx.fillText('教学图片加载中...', CONFIG.CANVAS_WIDTH / 2, CONFIG.CANVAS_HEIGHT / 2);
            }
        }
    }
    
    // 第二页：牌桌界面
    renderPage2(ctx) {
        // 使用教学图片显示第二页
        const imageManager = window.game?.imageManager;
        if (imageManager) {
            const imageDrawn = imageManager.drawImage(
                ctx,
                '第二页',
                0, 0,
                CONFIG.CANVAS_WIDTH,
                CONFIG.CANVAS_HEIGHT
            );
            
            // 如果图片未加载，显示备用内容
            if (!imageDrawn) {
                ctx.fillStyle = '#F5F5DC';
                ctx.fillRect(0, 0, CONFIG.CANVAS_WIDTH, CONFIG.CANVAS_HEIGHT);
                ctx.fillStyle = '#2C3E50';
                ctx.font = 'bold 24px Arial';
                ctx.textAlign = 'center';
                ctx.fillText('教学图片加载中...', CONFIG.CANVAS_WIDTH / 2, CONFIG.CANVAS_HEIGHT / 2);
            }
        }
    }
    
    // 第三页：对抗系统 - 进一步优化
    renderPage3(ctx) {
        // 使用教学图片显示第三页
        const imageManager = window.game?.imageManager;
        if (imageManager) {
            const imageDrawn = imageManager.drawImage(
                ctx,
                '第三页',
                0, 0,
                CONFIG.CANVAS_WIDTH,
                CONFIG.CANVAS_HEIGHT
            );
            
            // 如果图片未加载，显示备用内容
            if (!imageDrawn) {
                ctx.fillStyle = '#F5F5DC';
                ctx.fillRect(0, 0, CONFIG.CANVAS_WIDTH, CONFIG.CANVAS_HEIGHT);
                ctx.fillStyle = '#2C3E50';
                ctx.font = 'bold 24px Arial';
                ctx.textAlign = 'center';
                ctx.fillText('教学图片加载中...', CONFIG.CANVAS_WIDTH / 2, CONFIG.CANVAS_HEIGHT / 2);
            }
        }
    }
    

    

    
    renderInfoBox(ctx, config) {
        // 背景框
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(config.x, config.y, config.width, config.height);
        ctx.strokeStyle = '#cccccc';
        ctx.lineWidth = 2;
        ctx.strokeRect(config.x, config.y, config.width, config.height);
        
        // 标题
        ctx.font = 'bold 20px Arial';
        ctx.fillStyle = '#2196F3';
        ctx.textAlign = 'left';
        ctx.fillText(config.title, config.x + 20, config.y + 30);
        
        // 内容项
        ctx.font = '16px Arial';
        ctx.fillStyle = '#2F2F2F';
        config.items.forEach((item, index) => {
            ctx.fillText(item, config.x + 20, config.y + 55 + index * 25);
        });
    }
    
    renderCharacterInfo(ctx, config) {
        // 背景框
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(config.x, config.y, config.width, config.height);
        ctx.strokeStyle = config.color;
        ctx.lineWidth = 2;
        ctx.strokeRect(config.x, config.y, config.width, config.height);
        
        // 角色名称
        ctx.font = 'bold 18px Arial';
        ctx.fillStyle = config.color;
        ctx.textAlign = 'left';
        ctx.fillText(config.name, config.x + 20, config.y + 20);
        
        // 角色描述
        ctx.font = '14px Arial';
        ctx.fillStyle = '#2F2F2F';
        ctx.fillText(config.desc, config.x + 20, config.y + 40);
    }
    
    renderButtons(ctx) {
        this.buttons.forEach(button => {
            // 按钮背景
            let gradient;
            if (button.text === '主页') {
                // 主页按钮特殊样式
                gradient = ctx.createLinearGradient(
                    button.x - button.width/2, button.y - button.height/2,
                    button.x + button.width/2, button.y + button.height/2
                );
                gradient.addColorStop(0, '#607D8B');
                gradient.addColorStop(1, '#546E7A');
            } else if (button.text === '开始游戏') {
                // 开始游戏按钮
                gradient = ctx.createLinearGradient(
                    button.x - button.width/2, button.y - button.height/2,
                    button.x + button.width/2, button.y + button.height/2
                );
                gradient.addColorStop(0, '#4CAF50');
                gradient.addColorStop(1, '#45a049');
            } else {
                // 普通按钮
                gradient = ctx.createLinearGradient(
                    button.x - button.width/2, button.y - button.height/2,
                    button.x + button.width/2, button.y + button.height/2
                );
                gradient.addColorStop(0, '#2196F3');
                gradient.addColorStop(1, '#1976D2');
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
            ctx.lineWidth = 2;
            ctx.strokeRect(
                button.x - button.width/2, 
                button.y - button.height/2, 
                button.width, 
                button.height
            );
            
            // 按钮文字
            ctx.fillStyle = '#FFFFFF';
            ctx.font = button.text === '主页' ? 'bold 12px Arial' : 'bold 16px Arial';
            ctx.textAlign = 'center';
            ctx.fillText(button.text, button.x, button.y + 5);
        });
    }
    
    handleClick(x, y) {
        // 处理按钮点击
        for (let button of this.buttons) {
            if (button.isPointInside(x, y)) {
                button.onClick();
                return true;
            }
        }
        return false;
    }
    
    update(deltaTime) {
        // 教程场景不需要更新逻辑，保持空方法
    }
} 