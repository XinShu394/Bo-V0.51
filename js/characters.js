// 角色类
class Character {
    constructor(type, x = 0, y = 0) {
        this.type = type;
        this.data = CHARACTER_TYPE[type];
        
        if (!this.data) {
            console.error('无效的角色类型:', type);
            this.data = CHARACTER_TYPE['骑士']; // 默认为骑士角色
        }
        
        this.x = x;
        this.y = y;
        this.width = 60;
        this.height = 80;
        this.scale = 1;
        
        // 基础属性
        this.maxHealth = this.data.maxHealth || this.data.health; // 支持血量上限
        this.currentHealth = this.data.health; // 初始血量使用基础血量
        this.currentEnergy = 0;
        
        // 状态
        this.isSelected = false;
        this.isAlive = true;
        
        // 表情系统
        this.currentEmotion = 'normal';
        this.emotionTimer = 0;
    }
    
    // 重置角色状态
    reset() {
        this.currentHealth = this.data.health; // 重置为基础血量
        // 肉盾角色初始费用为1，其他角色为0
        this.currentEnergy = this.type === '肉盾' ? 1 : 0;
        this.isAlive = true;
        this.currentEmotion = 'normal';
        this.emotionTimer = 0;
    }
    
    // 受到伤害
    takeDamage(damage) {
        if (!this.isAlive) return 0;
        
        const actualDamage = Math.min(damage, this.currentHealth);
        this.currentHealth -= actualDamage;
        
        if (this.currentHealth <= 0) {
            this.currentHealth = 0;
            this.isAlive = false;
            this.setEmotion('defeated');
        } else {
            this.setEmotion('hurt');
        }
        
        return actualDamage;
    }
    
    // 恢复血量
    heal(amount) {
        if (!this.isAlive) return 0;
        
        const actualHeal = Math.min(amount, this.maxHealth - this.currentHealth);
        this.currentHealth += actualHeal;
        
        if (actualHeal > 0) {
            this.setEmotion('happy');
        }
        
        return actualHeal;
    }
    
    // 获得费用
    gainEnergy(amount) {
        const oldEnergy = this.currentEnergy;
        this.currentEnergy = Math.min(this.currentEnergy + amount, CONFIG.MAX_ENERGY);
        
        Debug.log(`${this.type}费用增加: ${oldEnergy} -> ${this.currentEnergy} (+${amount})`);
        
        // 检查胜利条件
        if (this.currentEnergy >= CONFIG.MAX_ENERGY) {
            this.setEmotion('victory');
            return true; // 返回true表示达到胜利条件
        }
        
        return false;
    }
    
    // 设置表情
    setEmotion(emotion, duration = 2000) {
        this.currentEmotion = emotion;
        this.emotionTimer = duration;
    }
    
    // 更新角色状态
    update(deltaTime) {
        // 更新表情计时器
        if (this.emotionTimer > 0) {
            this.emotionTimer -= deltaTime;
            if (this.emotionTimer <= 0) {
                this.currentEmotion = this.isAlive ? 'normal' : 'defeated';
            }
        }
    }
    
    // 获取角色能力描述
    getAbilityDescription() {
        return this.data.description;
    }
    
    // 检查是否应用特殊能力
    applyAbility(context) {
        switch(this.data.ability) {
            case 'qi_wave_discount':
                return this.applyQiWaveDiscount(context);
            case 'enemy_attack_cost':
                return this.applyEnemyAttackCost(context);
                    case 'upgrade_damage':
            return this.applySpecialDamage(context);
            case 'berserker':
                return this.applyBerserkerAbility(context);
            default:
                return context;
        }
    }
    
    // 法师能力：法术攻击费用-1
    applyQiWaveDiscount(context) {
        if (context.cardType === '气功' || context.cardType === '大波') {
            context.cost = Math.max(0, context.cost - 1);
        }
        return context;
    }
    
    // 肉盾能力：攻击类型卡牌费用+1
    applyEnemyAttackCost(context) {
        // 对所有攻击类型卡牌费用+1
        const attackCards = ['击打', '气功', '刺杀', '大波'];
        
        if (attackCards.includes(context.cardType)) {
            context.cost += 1;
        }
        return context;
    }
    
    // 刺客能力：刺杀伤害+1
    applySpecialDamage(context) {
        if (context.cardType === '刺杀') {
            context.damage += 1;
        }
        return context;
    }
    
    // 狂战士能力：无特殊费用修改（只有初始费用为0）
    applyBerserkerAbility(context) {
        // 狂战士没有费用修改能力，卡牌费用正常
        return context;
    }
    
    // 渲染角色
    render(ctx) {
        ctx.save();
        
        // 应用变换
        ctx.translate(this.x, this.y);
        ctx.scale(this.scale, this.scale);
        
        // 绘制角色背景
        this.renderBackground(ctx);
        
        // 绘制角色形象
        this.renderCharacter(ctx);
        
        // 绘制状态信息
        this.renderStatus(ctx);
        
        // 绘制表情
        this.renderEmotion(ctx);
        
        ctx.restore();
    }
    
    // 渲染背景
    renderBackground(ctx) {
        // 角色背景圆圈
        const gradient = ctx.createRadialGradient(0, 0, 0, 0, 0, this.width/2);
        gradient.addColorStop(0, this.data.color + '40'); // 40% 透明度
        gradient.addColorStop(1, this.data.color + '00'); // 完全透明
        
        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.arc(0, 0, this.width/2, 0, Math.PI * 2);
        ctx.fill();
        
        // 选中状态的边框
        if (this.isSelected) {
            ctx.strokeStyle = '#FFD700';
            ctx.lineWidth = 3;
            ctx.beginPath();
            ctx.arc(0, 0, this.width/2 + 5, 0, Math.PI * 2);
            ctx.stroke();
        }
    }
    
    // 渲染角色形象
    renderCharacter(ctx) {
        // 绘制角色主体（简化的图形表示）
        ctx.fillStyle = this.data.color;
        
        switch(this.type) {
            case '骑士':
                this.renderKnightCharacter(ctx);
                break;
            case '法师':
                this.renderMageCharacter(ctx);
                break;
            case '肉盾':
                this.renderTankCharacter(ctx);
                break;
            case '刺客':
                this.renderAssassinCharacter(ctx);
                break;
            case '狂战士':
                this.renderBerserkerCharacter(ctx);
                break;
        }
    }
    
    // 渲染骑士角色
    renderKnightCharacter(ctx) {
        // 简单的人形
        ctx.beginPath();
        ctx.arc(0, -10, 12, 0, Math.PI * 2); // 头部
        ctx.fill();
        
        ctx.fillRect(-6, 2, 12, 20); // 身体
        
        // 武器
        ctx.strokeStyle = this.data.color;
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(8, 5);
        ctx.lineTo(20, -5);
        ctx.stroke();
    }
    
    // 渲染法师角色
    renderMageCharacter(ctx) {
        // 法师帽
        ctx.beginPath();
        ctx.moveTo(-8, -15);
        ctx.lineTo(8, -15);
        ctx.lineTo(12, -25);
        ctx.closePath();
        ctx.fill();
        
        // 头部
        ctx.beginPath();
        ctx.arc(0, -10, 10, 0, Math.PI * 2);
        ctx.fill();
        
        // 长袍
        ctx.fillRect(-8, 2, 16, 20);
        
        // 法杖
        ctx.strokeStyle = '#8B4513';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(10, 0);
        ctx.lineTo(10, -20);
        ctx.stroke();
        
        // 法杖顶部宝石
        ctx.fillStyle = '#00BFFF';
        ctx.beginPath();
        ctx.arc(10, -22, 3, 0, Math.PI * 2);
        ctx.fill();
    }
    
    // 渲染肉盾角色
    renderTankCharacter(ctx) {
        // 更大的身体
        ctx.fillRect(-10, 2, 20, 25);
        
        // 头部
        ctx.beginPath();
        ctx.arc(0, -8, 14, 0, Math.PI * 2);
        ctx.fill();
        
        // 盾牌
        ctx.fillStyle = '#C0C0C0';
        ctx.beginPath();
        ctx.arc(-15, 10, 8, 0, Math.PI * 2);
        ctx.fill();
        
        // 盾牌边框
        ctx.strokeStyle = '#696969';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(-15, 10, 8, 0, Math.PI * 2);
        ctx.stroke();
    }
    
    // 渲染刺客角色
    renderAssassinCharacter(ctx) {
        // 斗篷
        ctx.beginPath();
        ctx.arc(0, -5, 15, Math.PI, 0);
        ctx.fill();
        
        // 头部（较小）
        ctx.beginPath();
        ctx.arc(0, -12, 8, 0, Math.PI * 2);
        ctx.fill();
        
        // 身体（较瘦）
        ctx.fillRect(-4, 2, 8, 18);
        
        // 双刀
        ctx.strokeStyle = '#C0C0C0';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(-8, 8);
        ctx.lineTo(-15, 0);
        ctx.moveTo(8, 8);
        ctx.lineTo(15, 0);
        ctx.stroke();
    }
    
    // 渲染狂战士角色
    renderBerserkerCharacter(ctx) {
        // 魁梧的身体
        ctx.fillRect(-12, 2, 24, 25);
        
        // 头部
        ctx.beginPath();
        ctx.arc(0, -8, 12, 0, Math.PI * 2);
        ctx.fill();
        
        // 巨斧
        ctx.fillStyle = '#8B4513';
        ctx.fillRect(-18, -5, 4, 20);  // 斧柄
        
        ctx.fillStyle = '#C0C0C0';
        ctx.fillRect(-22, -8, 8, 6);   // 斧刃
        
        // 眼部特效（狂化状态）
        ctx.fillStyle = '#FF0000';
        ctx.beginPath();
        ctx.arc(-4, -12, 2, 0, Math.PI * 2);
        ctx.arc(4, -12, 2, 0, Math.PI * 2);
        ctx.fill();
    }
    
    // 渲染状态信息
    renderStatus(ctx) {
        const statusY = this.height/2 + 10;
        
        // 只显示文字信息，不显示进度条
        this.renderHealthText(ctx, -25, statusY);
        
        // 费用显示
        this.renderEnergyDisplay(ctx, -25, statusY + 15);
        
        // 角色名称
        ctx.fillStyle = '#FFFFFF';
        ctx.font = 'bold 12px Arial';
        ctx.textAlign = 'center';
        ctx.fillText(this.type, 0, statusY + 30);
    }
    
    // 渲染血量文字
    renderHealthText(ctx, x, y) {
        // 血量文字
        ctx.fillStyle = '#FFFFFF';
        ctx.font = '10px Arial';
        ctx.textAlign = 'left';
        ctx.fillText(`${this.currentHealth}/${this.maxHealth}`, x, y + 5);
    }
    
    // 渲染费用显示
    renderEnergyDisplay(ctx, x, y) {
        // 费用图标和数值
        ctx.fillStyle = '#FFD700';
        ctx.font = 'bold 12px Arial';
        ctx.textAlign = 'left';
        ctx.fillText(`⚡${this.currentEnergy}/${CONFIG.MAX_ENERGY}`, x, y);
    }
    
    // 渲染表情
    renderEmotion(ctx) {
        if (this.emotionTimer <= 0) return;
        
        let emoticon = '';
        let color = '#FFFFFF';
        
        switch(this.currentEmotion) {
            case 'happy':
                emoticon = '😊';
                color = '#4CAF50';
                break;
            case 'hurt':
                emoticon = '😣';
                color = '#F44336';
                break;
            case 'victory':
                emoticon = '🎉';
                color = '#FFD700';
                break;
            case 'defeated':
                emoticon = '😵';
                color = '#666666';
                break;
            case 'angry':
                emoticon = '😠';
                color = '#F44336';
                break;
            default:
                return;
        }
        
        // 表情气泡
        const bubbleX = 20;
        const bubbleY = -30;
        const bubbleSize = 25;
        
        ctx.fillStyle = color + '80';
        ctx.beginPath();
        ctx.arc(bubbleX, bubbleY, bubbleSize/2, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.strokeStyle = color;
        ctx.lineWidth = 2;
        ctx.stroke();
        
        // 表情符号
        ctx.font = '16px Arial';
        ctx.textAlign = 'center';
        ctx.fillStyle = '#000000';
        ctx.fillText(emoticon, bubbleX, bubbleY + 4);
    }
    
    // 检查点击
    isPointInside(x, y) {
        const dx = x - this.x;
        const dy = y - this.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        return distance <= this.width / 2;
    }
    
    // 设置位置
    setPosition(x, y) {
        this.x = x;
        this.y = y;
    }
    
    // 获取角色信息对象
    getInfo() {
        return {
            type: this.type,
            name: this.data.name,
            health: `${this.currentHealth}/${this.maxHealth}`,
            energy: this.currentEnergy,
            ability: this.data.description,
            isAlive: this.isAlive
        };
    }
}

// 角色管理器
class CharacterManager {
    constructor() {
        this.availableCharacters = Object.keys(CHARACTER_TYPE);
        this.selectedCharacter = null;
    }
    
    // 创建角色选择界面的角色列表
    createCharacterSelectionList() {
        const characters = [];
        const positions = [
            { x: 200, y: 200 },
            { x: 350, y: 200 },
            { x: 500, y: 200 },
            { x: 650, y: 200 }
        ];
        
        this.availableCharacters.forEach((type, index) => {
            const character = new Character(type);
            if (positions[index]) {
                character.setPosition(positions[index].x, positions[index].y);
            }
            characters.push(character);
        });
        
        return characters;
    }
    
    // 创建指定类型的角色
    createCharacter(type, x, y) {
        if (!this.availableCharacters.includes(type)) {
            Debug.log('无效的角色类型:', type);
            return null;
        }
        
        const character = new Character(type, x, y);
        Debug.log('创建角色:', character.getInfo());
        return character;
    }
    
    // 设置选中的角色
    setSelectedCharacter(type) {
        if (this.availableCharacters.includes(type)) {
            this.selectedCharacter = type;
            Debug.log('选择角色:', type);
            return true;
        }
        return false;
    }
    
    // 获取选中的角色类型
    getSelectedCharacter() {
        return this.selectedCharacter;
    }
    
    // 获取角色类型列表
    getAvailableCharacters() {
        return [...this.availableCharacters];
    }
    
    // 比较两个角色的能力
    compareCharacters(type1, type2) {
        const char1 = CHARACTER_TYPE[type1];
        const char2 = CHARACTER_TYPE[type2];
        
        return {
            [type1]: {
                health: char1.health,
                ability: char1.description
            },
            [type2]: {
                health: char2.health,
                ability: char2.description
            }
        };
    }
    
    // 重置选择
    reset() {
        this.selectedCharacter = null;
    }
}

// 表情管理器
class EmoteManager {
    constructor() {
        this.emotes = [
            { name: 'taunt1', icon: '😏', message: '来啊！' },
            { name: 'taunt2', icon: '🤔', message: '就这？' },
            { name: 'laugh', icon: '😂', message: '哈哈哈！' },
            { name: 'thinking', icon: '🤯', message: '让我想想...' },
            { name: 'surprised', icon: '😱', message: '什么！' },
            { name: 'confident', icon: '😎', message: '稳了！' }
        ];
        this.currentEmote = null;
        this.emoteTimer = 0;
    }
    
    // 使用表情
    useEmote(character, emoteName) {
        const emote = this.emotes.find(e => e.name === emoteName);
        if (!emote) return false;
        
        character.setEmotion(emoteName, 3000);
        this.currentEmote = emote;
        this.emoteTimer = 3000;
        
        // 触发事件
        window.eventManager.emit('emoteUsed', {
            character: character,
            emote: emote
        });
        
        return true;
    }
    
    // 更新表情状态
    update(deltaTime) {
        if (this.emoteTimer > 0) {
            this.emoteTimer -= deltaTime;
            if (this.emoteTimer <= 0) {
                this.currentEmote = null;
            }
        }
    }
    
    // 获取可用表情列表
    getAvailableEmotes() {
        return [...this.emotes];
    }
    
    // 渲染表情界面
    renderEmoteUI(ctx, x, y) {
        if (!this.currentEmote) return;
        
        const bubbleWidth = 120;
        const bubbleHeight = 40;
        
        // 表情气泡
        ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
        ctx.fillRect(x, y, bubbleWidth, bubbleHeight);
        
        ctx.strokeStyle = '#FFFFFF';
        ctx.lineWidth = 2;
        ctx.strokeRect(x, y, bubbleWidth, bubbleHeight);
        
        // 表情文字
        ctx.fillStyle = '#FFFFFF';
        ctx.font = '14px Arial';
        ctx.textAlign = 'center';
        ctx.fillText(
            `${this.currentEmote.icon} ${this.currentEmote.message}`,
            x + bubbleWidth / 2,
            y + bubbleHeight / 2 + 5
        );
    }
} 