// 设置管理器
class SettingsManager {
    constructor() {
        this.settings = {
            showCardTooltips: true,
            soundVolume: 0.5,
            musicVolume: 0.5
        };
        this.loadSettings();
        this.isVisible = false;
    }
    
    loadSettings() {
        const saved = localStorage.getItem('gameSettings');
        if (saved) {
            this.settings = {...this.settings, ...JSON.parse(saved)};
        }
    }
    
    saveSettings() {
        localStorage.setItem('gameSettings', JSON.stringify(this.settings));
    }
    
    getSetting(key) {
        return this.settings[key];
    }
    
    setSetting(key, value) {
        this.settings[key] = value;
        this.saveSettings();
    }
    
    toggleSetting(key) {
        this.settings[key] = !this.settings[key];
        this.saveSettings();
    }
    
    show() {
        this.isVisible = true;
    }
    
    hide() {
        this.isVisible = false;
    }
    
    toggle() {
        this.isVisible = !this.isVisible;
    }
    
    handleClick(x, y) {
        if (!this.isVisible) return false;
        
        // 设置面板区域
        const panelX = CONFIG.CANVAS_WIDTH - 250;
        const panelY = 60;
        const panelWidth = 230;
        const panelHeight = 200;
        
        if (x >= panelX && x <= panelX + panelWidth && 
            y >= panelY && y <= panelY + panelHeight) {
            
            // 卡牌提示开关
            if (x >= panelX + 20 && x <= panelX + 40 && 
                y >= panelY + 40 && y <= panelY + 60) {
                this.toggleSetting('showCardTooltips');
                return true;
            }
            
            return true; // 点击在面板内
        }
        
        return false;
    }
    
    render(ctx) {
        if (!this.isVisible) return;
        
        // 设置面板
        const panelX = CONFIG.CANVAS_WIDTH - 250;
        const panelY = 60;
        const panelWidth = 230;
        const panelHeight = 200;
        
        // 背景
        ctx.fillStyle = 'rgba(0, 0, 0, 0.9)';
        ctx.fillRect(panelX, panelY, panelWidth, panelHeight);
        ctx.strokeStyle = '#FFFFFF';
        ctx.lineWidth = 2;
        ctx.strokeRect(panelX, panelY, panelWidth, panelHeight);
        
        // 标题
        ctx.fillStyle = '#FFFFFF';
        ctx.font = 'bold 16px Arial';
        ctx.textAlign = 'left';
        ctx.fillText('游戏设置', panelX + 10, panelY + 25);
        
        // 卡牌提示开关
        this.renderToggle(ctx, panelX + 20, panelY + 50, this.settings.showCardTooltips, '显示卡牌介绍');
        
        // 音量设置（占位符）
        ctx.font = '12px Arial';
        ctx.fillStyle = '#CCCCCC';
        ctx.fillText('音效音量: ' + Math.round(this.settings.soundVolume * 100) + '%', panelX + 20, panelY + 100);
        ctx.fillText('背景音乐: ' + Math.round(this.settings.musicVolume * 100) + '%', panelX + 20, panelY + 130);
        
        // 关闭说明
        ctx.fillStyle = '#888888';
        ctx.font = '10px Arial';
        ctx.fillText('点击外部区域关闭', panelX + 20, panelY + 180);
    }
    
    renderToggle(ctx, x, y, state, label) {
        // 开关背景
        ctx.fillStyle = state ? '#4CAF50' : '#757575';
        ctx.fillRect(x, y - 10, 20, 20);
        ctx.strokeStyle = '#FFFFFF';
        ctx.lineWidth = 1;
        ctx.strokeRect(x, y - 10, 20, 20);
        
        // 勾选标记
        if (state) {
            ctx.strokeStyle = '#FFFFFF';
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.moveTo(x + 4, y);
            ctx.lineTo(x + 8, y + 4);
            ctx.lineTo(x + 16, y - 4);
            ctx.stroke();
        }
        
        // 标签
        ctx.fillStyle = '#FFFFFF';
        ctx.font = '12px Arial';
        ctx.textAlign = 'left';
        ctx.fillText(label, x + 30, y + 5);
    }
}

// UI工具函数
const UIUtils = {
    // 绘制圆角矩形
    drawRoundedRect(ctx, x, y, width, height, radius) {
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
    },
    
    // 绘制渐变按钮
    drawGradientButton(ctx, x, y, width, height, color1, color2, text, textColor = '#FFFFFF') {
        const gradient = ctx.createLinearGradient(x, y, x, y + height);
        gradient.addColorStop(0, color1);
        gradient.addColorStop(1, color2);
        
        ctx.fillStyle = gradient;
        ctx.fillRect(x, y, width, height);
        
        ctx.strokeStyle = '#FFFFFF';
        ctx.lineWidth = 2;
        ctx.strokeRect(x, y, width, height);
        
        ctx.fillStyle = textColor;
        ctx.font = 'bold 16px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(text, x + width / 2, y + height / 2);
    },
    
    // 绘制阴影文字
    drawShadowText(ctx, text, x, y, color = '#FFFFFF', shadowColor = '#000000', shadowOffset = 2) {
        // 绘制阴影
        ctx.fillStyle = shadowColor;
        ctx.fillText(text, x + shadowOffset, y + shadowOffset);
        
        // 绘制文字
        ctx.fillStyle = color;
        ctx.fillText(text, x, y);
    }
};

// FPS计数器已在HTML中定义，这里不再重复定义 