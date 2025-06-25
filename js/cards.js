// 卡牌类
class Card {
    constructor(type, x = 0, y = 0) {
        this.type = type;
        this.data = CARD_TYPE[type];
        this.x = x;
        this.y = y;
        this.originalX = x;
        this.originalY = y;
        this.width = CONFIG.CARD_WIDTH;
        this.height = CONFIG.CARD_HEIGHT;
        this.scale = 1;
        this.scaleX = 1;
        this.rotation = 0;
        this.alpha = 1;
        
        // 状态
        this.isSelected = false;
        this.isHovered = false;
        this.isRevealed = true;
        this.isPlayable = true;
        
        // 动画相关
        this.hoverTween = null;
        
        // 图片资源
        this.image = null;
        this.loadCardImage();
    }
    
    // 加载卡牌图片
    loadCardImage() {
        const imageMap = {
            '回气': '回气图像.png',
            '击打': '击打图像.png', 
            '气功': '气功图像.png',
            '防御': '防御图像.png',
            '闪避': '闪避图像.png',
            '刺杀': '刺杀图像.png',
            '大波': '大波图像.png',
            '反弹': '反弹图像.png'
        };
        
        if (imageMap[this.type]) {
            this.image = new Image();
            this.image.src = `动作图片/${imageMap[this.type]}`;
            this.image.onload = () => {
                Debug.log(`卡牌图片加载成功: ${this.type} -> ${this.image.src}`);
            };
            this.image.onerror = () => {
                Debug.log(`卡牌图片加载失败: ${this.type} -> ${this.image.src}`);
            };
        }
    }
    
    // 获取显示名称
    getName() {
        return this.data.name;
    }
    
    // 获取费用（考虑角色能力）
    getCost(character = null) {
        let cost = this.data.cost;
        
        if (character) {
                    // 法师：气功和大波费用-1
        if (character.type === '法师' && (this.type === '气功' || this.type === '大波')) {
                cost = Math.max(0, cost - 1);
            }
            
            // 肉盾：攻击类卡牌费用+1
            if (character.type === '肉盾' && this.data.category === 'attack') {
                cost += 1;
            }
        }
        
        return Math.max(0, cost);
    }
    
    // 获取伤害值（考虑角色能力）
    getDamage(character = null) {
        let damage = this.data.value || 0;
        
        // 刺客：刺杀伤害+1
        if (character && character.type === '刺客' && this.type === '刺杀') {
            damage += 1;
        }
        
        return damage;
    }
    
    // 检查是否在指定位置
    isPointInside(x, y) {
        return x >= this.x - this.width/2 && 
               x <= this.x + this.width/2 && 
               y >= this.y - this.height/2 && 
               y <= this.y + this.height/2;
    }
    
    // 设置位置
    setPosition(x, y) {
        this.x = x;
        this.y = y;
        this.originalX = x;
        this.originalY = y;
    }
    
    // 设置选中状态
    setSelected(selected) {
        this.isSelected = selected;
        if (selected) {
            CardAnimations.hoverCard(this);
        } else {
            CardAnimations.unhoverCard(this);
        }
    }
    
    // 设置悬停状态
    setHovered(hovered) {
        if (this.isHovered === hovered) return;
        
        this.isHovered = hovered;
        if (hovered && !this.isSelected) {
            CardAnimations.hoverCard(this);
        } else if (!hovered && !this.isSelected) {
            CardAnimations.unhoverCard(this);
        }
    }
    
    // 渲染卡牌
    render(ctx) {
        ctx.save();
        
        // 应用变换
        ctx.translate(this.x, this.y);
        ctx.scale(this.scale * this.scaleX, this.scale);
        ctx.rotate(this.rotation);
        ctx.globalAlpha = this.alpha;
        
        // 绘制卡牌背景
        this.renderBackground(ctx);
        
        // 绘制卡牌内容
        if (this.isRevealed) {
            this.renderContent(ctx);
        } else {
            this.renderBack(ctx);
        }
        
        // 绘制边框效果
        this.renderBorder(ctx);
        
        ctx.restore();
    }
    
    // 渲染背景
    renderBackground(ctx) {
        // 如果有图片，则绘制图片作为背景
        if (this.image && this.image.complete) {
            ctx.save();
            
            // 圆角裁剪
            ctx.beginPath();
            this.roundRect(ctx, -this.width/2, -this.height/2, this.width, this.height, 8);
            ctx.clip();
            
            // 绘制图片，保持比例适应卡牌尺寸
            const imageAspect = this.image.width / this.image.height;
            const cardAspect = this.width / this.height;
            
            let drawWidth, drawHeight;
            if (imageAspect > cardAspect) {
                // 图片更宽，以高度为准
                drawHeight = this.height;
                drawWidth = drawHeight * imageAspect;
            } else {
                // 图片更高，以宽度为准
                drawWidth = this.width;
                drawHeight = drawWidth / imageAspect;
            }
            
            ctx.drawImage(
                this.image,
                -drawWidth/2, -drawHeight/2,
                drawWidth, drawHeight
            );
            
            // 添加半透明遮罩，确保文字可见，使用圆角边界
            ctx.fillStyle = 'rgba(0, 0, 0, 0.2)'; // 减少遮罩透明度
            
            // 使用圆角矩形绘制遮罩，确保不超出卡牌边界
            ctx.beginPath();
            this.roundRect(ctx, -this.width/2, -this.height/2, this.width, this.height, 8);
            ctx.fill();
            
            ctx.restore();
        } else {
            // 没有图片时使用原来的渐变背景
            const gradient = ctx.createLinearGradient(-this.width/2, -this.height/2, this.width/2, this.height/2);
            gradient.addColorStop(0, this.data.color);
            gradient.addColorStop(1, this.darkenColor(this.data.color, 0.3));
            
            ctx.fillStyle = gradient;
            
            // 圆角处理
            ctx.beginPath();
            this.roundRect(ctx, -this.width/2, -this.height/2, this.width, this.height, 8);
            ctx.fill();
        }
    }
    
    // 渲染卡牌内容
    renderContent(ctx) {
        // 绘制卡牌名称（带描边效果）
        this.drawTextWithOutline(ctx, this.getName(), 0, -this.height/2 + 20, 'bold 14px Arial', '#FFFFFF', '#000000', 2);
        
        // 绘制费用
        this.drawTextWithOutline(ctx, `费用: ${this.data.cost}`, 0, -this.height/2 + 40, 'bold 12px Arial', '#FFFFFF', '#000000', 2);
        
        // 绘制效果图标
        this.renderIcon(ctx);
        
        // 绘制效果描述
        ctx.font = '10px Arial';
        ctx.fillStyle = '#FFFFFF';
        ctx.strokeStyle = '#000000';
        ctx.lineWidth = 1;
        const description = this.getDescription();
        this.wrapTextWithOutline(ctx, description, 0, this.height/2 - 30, this.width - 10, 12);
    }
    
    // 绘制带描边的文字
    drawTextWithOutline(ctx, text, x, y, font, fillColor, strokeColor, strokeWidth) {
        ctx.font = font;
        ctx.textAlign = 'center';
        ctx.lineWidth = strokeWidth;
        
        // 先绘制描边
        ctx.strokeStyle = strokeColor;
        ctx.strokeText(text, x, y);
        
        // 再绘制填充
        ctx.fillStyle = fillColor;
        ctx.fillText(text, x, y);
    }
    
    // 换行文字（带描边）
    wrapTextWithOutline(ctx, text, x, y, maxWidth, lineHeight) {
        const words = text.split(' ');
        let line = '';
        let currentY = y;
        
        for (let n = 0; n < words.length; n++) {
            const testLine = line + words[n] + ' ';
            const metrics = ctx.measureText(testLine);
            const testWidth = metrics.width;
            
            if (testWidth > maxWidth && n > 0) {
                // 绘制当前行（带描边）
                ctx.strokeText(line, x, currentY);
                ctx.fillText(line, x, currentY);
                
                line = words[n] + ' ';
                currentY += lineHeight;
            } else {
                line = testLine;
            }
        }
        
        // 绘制最后一行（带描边）
        ctx.strokeText(line, x, currentY);
        ctx.fillText(line, x, currentY);
    }
    
    // 渲染卡牌背面
    renderBack(ctx) {
        ctx.fillStyle = '#444444';
        ctx.fillRect(-this.width/2, -this.height/2, this.width, this.height);
        
        ctx.fillStyle = '#FFFFFF';
        ctx.font = 'bold 16px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('?', 0, 0);
    }
    
    // 渲染边框
    renderBorder(ctx) {
        ctx.strokeStyle = this.isSelected ? '#FFD700' : 
                         this.isHovered ? '#FFFFFF' : 
                         '#666666';
        ctx.lineWidth = this.isSelected ? 3 : 2;
        
        ctx.beginPath();
        this.roundRect(ctx, -this.width/2, -this.height/2, this.width, this.height, 8);
        ctx.stroke();
    }
    
    // 渲染图标
    renderIcon(ctx) {
        const iconSize = 30;
        const iconY = -10;
        
        ctx.fillStyle = '#FFFFFF';
        ctx.font = 'bold 24px Arial';
        ctx.textAlign = 'center';
        
        // 根据卡牌类型绘制不同图标
        switch(this.type) {
            case '回气':
                ctx.fillText('⚡', 0, iconY);
                break;
            case '击打':
                ctx.fillText('⚔️', 0, iconY);
                break;
            case '气功':
                ctx.fillText('💫', 0, iconY);
                break;
            case '防御':
                ctx.fillText('🛡️', 0, iconY);
                break;
            case '闪避':
                ctx.fillText('💨', 0, iconY);
                break;
            case '反弹':
                ctx.fillText('🔄', 0, iconY);
                break;
            case '刺杀':
                ctx.fillText('🗡️', 0, iconY);
                break;
            case '大波':
                ctx.fillText('💥', 0, iconY);
                break;
            case '反弹':
                ctx.fillText('🔄', 0, iconY);
                break;
            default:
                ctx.fillText('?', 0, iconY);
        }
    }
    
    // 获取效果描述
    getDescription() {
        switch(this.type) {
            case '回气':
                return '获得1费用';
            case '击打':
                return `造成${this.getDamage()}点伤害`;
            case '气功':
                return `造成${this.getDamage()}点伤害\n优先级高于击打`;
            case '防御':
                return '抵挡击打攻击';
            case '闪避':
                return '抵挡气功攻击';
            case '反弹':
                return '反弹所有攻击';
            case '刺杀':
                return '造成2点伤害\n可被防御阻挡';
            case '大波':
                return '造成2点伤害\n可被闪避阻挡';
            case '反弹':
                return '反弹所有攻击';
            default:
                return '未知效果';
        }
    }
    
    // 工具函数：圆角矩形
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
    
    // 工具函数：文字换行
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
    
    // 工具函数：颜色加深
    darkenColor(color, amount) {
        const col = parseInt(color.slice(1), 16);
        const r = Math.max(0, Math.floor((col >> 16) * (1 - amount)));
        const g = Math.max(0, Math.floor(((col >> 8) & 0x00FF) * (1 - amount)));
        const b = Math.max(0, Math.floor((col & 0x0000FF) * (1 - amount)));
        return `#${((r << 16) | (g << 8) | b).toString(16).padStart(6, '0')}`;
    }
}

// 卡牌管理器
class CardManager {
    constructor() {
        this.allCards = [];
    }
    
    // 清空所有卡牌
    clear() {
        this.allCards = [];
    }
    
    // 获取指定类型的卡牌
    getCardsOfType(type) {
        return this.allCards.filter(card => card.type === type);
    }
}

// 卡牌效果计算器
class CardEffectCalculator {
    // 计算卡牌对战结果
    static calculateBattle(player1Cards, player2Cards, player1Character, player2Character) {
        const result = {
            player1: {
                damageTaken: 0,
                energyGained: 0,
                healthGained: 0
            },
            player2: {
                damageTaken: 0,
                energyGained: 0,
                healthGained: 0
            },
            effects: []
        };
        
        // 处理反弹效果
        this.processReflection(player1Cards, result, 'player1');
        this.processReflection(player2Cards, result, 'player2');
        
        // 处理回气效果
        this.processEnergyGain(player1Cards, result, 'player1');
        this.processEnergyGain(player2Cards, result, 'player2');
        
        // 处理攻击与防御
        this.processCombat(player1Cards, player2Cards, result, player1Character, player2Character);
        
        return result;
    }
    
    // 处理反弹效果
    static processReflection(cards, result, playerKey) {
        const reflectionCards = cards.filter(card => card.type === '反弹');
        if (reflectionCards.length > 0) {
            // 反弹效果在processCombat中处理
            // 这里只是标记有反弹卡牌
            result[playerKey].hasReflection = true;
        }
    }
    
    // 处理费用获取
    static processEnergyGain(cards, result, playerKey) {
        const huiqiCards = cards.filter(card => card.type === '回气');
        if (huiqiCards.length > 0) {
            const energyGain = huiqiCards.reduce((total, card) => {
                return total + (card.data.value || 1);
            }, 0);
            result[playerKey].energyGained = energyGain;
        }
    }
    
    // 处理攻击与防御
    static processCombat(player1Cards, player2Cards, result, player1Character, player2Character) {
        // 获取攻击卡牌
        const p1Attacks = this.getAttackCards(player1Cards);
        const p2Attacks = this.getAttackCards(player2Cards);
        
        // 获取防御卡牌
        const p1Defenses = this.getDefenseCards(player1Cards);
        const p2Defenses = this.getDefenseCards(player2Cards);
        
        // 检查反弹（现在反弹是独立卡牌）
        const p1HasReflect = player1Cards.some(card => card.type === '反弹');
        const p2HasReflect = player2Cards.some(card => card.type === '反弹');
        
        // 处理攻击卡牌对抗判定
        const combatResult = this.resolveCombat(p1Attacks, p2Attacks, p1Defenses, p2Defenses, player1Character, player2Character);
        
        // 处理反弹效果（修改：反弹所有攻击）
        if (p2HasReflect && combatResult.p1Damage > 0) {
            result.player1.damageTaken = combatResult.p1Damage; // 反弹给攻击者
            result.player2.damageTaken = 0; // 目标不受伤害
            result.effects.push('玩家2反弹了攻击');
        } else {
            result.player2.damageTaken = combatResult.p1Damage;
        }
        
        if (p1HasReflect && combatResult.p2Damage > 0) {
            result.player2.damageTaken = combatResult.p2Damage; // 反弹给攻击者
            result.player1.damageTaken = 0; // 目标不受伤害
            result.effects.push('玩家1反弹了攻击');
        } else {
            result.player1.damageTaken = combatResult.p2Damage;
        }
        
        // 添加对抗判定效果信息
        result.effects = result.effects.concat(combatResult.effects);
        
        // 处理狂战士特殊能力：造成伤害回复血量
        this.processBerserkerHealing(result, player1Character, player2Character);
    }
    
    // 获取攻击卡牌
    static getAttackCards(cards) {
        return cards.filter(card => 
            card.type === '击打' || card.type === '气功' || card.type === '刺杀' || card.type === '大波'
        );
    }
    
    // 获取防御卡牌
    static getDefenseCards(cards) {
        return cards.filter(card => 
            card.type === '防御' || card.type === '闪避' || card.type === '反弹'
        );
    }
    
    // 新增：卡牌对抗判定核心方法（基于优先级）
    static resolveCombat(p1Attacks, p2Attacks, p1Defenses, p2Defenses, player1Character, player2Character) {
        const result = {
            p1Damage: 0,
            p2Damage: 0,
            effects: []
        };
        
        // 获取双方所有攻击卡牌并按优先级排序
        const p1AttackList = this.getAttackListByPriority(p1Attacks, player1Character);
        const p2AttackList = this.getAttackListByPriority(p2Attacks, player2Character);
        
        // 进行优先级对抗判定
        const combatResult = this.resolvePriorityCombat(p1AttackList, p2AttackList);
        result.effects = result.effects.concat(combatResult.effects);
        
        // 计算获胜方的伤害（不考虑反弹，反弹在外层处理）
        if (combatResult.p1WinningAttacks.length > 0) {
            result.p1Damage = this.calculatePriorityDamageNoReflect(combatResult.p1WinningAttacks, p2Defenses);
        }
        if (combatResult.p2WinningAttacks.length > 0) {
            result.p2Damage = this.calculatePriorityDamageNoReflect(combatResult.p2WinningAttacks, p1Defenses);
        }
        
        return result;
    }
    
    // 获取攻击卡牌列表并按优先级排序
    static getAttackListByPriority(attacks, character) {
        const attackList = [];
        
        attacks.forEach(attack => {
            let priority = 0;
            let name = attack.type;
            let damage = attack.getDamage(character);
            
            // 确定攻击类型和优先级（基于新的独立卡牌系统）
                    if (attack.type === '击打') {
            priority = 1; // 击打
            name = '击打';
            } else if (attack.type === '刺杀') {
                priority = 2; // 刺杀
                name = '刺杀';
            } else if (attack.type === '气功') {
                priority = 3; // 气功
                name = '气功';
            } else if (attack.type === '大波') {
                priority = 4; // 大波（最高优先级）
                name = '大波';
            }
            
            attackList.push({
                type: attack.type,
                name: name,
                priority: priority,
                damage: damage
            });
        });
        
        // 按优先级降序排序（优先级高的在前）
        return attackList.sort((a, b) => b.priority - a.priority);
    }
    
    // 进行优先级对抗判定（1v1单卡对抗）
    static resolvePriorityCombat(p1Attacks, p2Attacks) {
        const result = {
            p1WinningAttacks: [],
            p2WinningAttacks: [],
            effects: []
        };
        
        // 如果一方没有攻击，另一方全胜
        if (p1Attacks.length === 0) {
            result.p2WinningAttacks = [...p2Attacks];
            return result;
        }
        if (p2Attacks.length === 0) {
            result.p1WinningAttacks = [...p1Attacks];
            return result;
        }
        
        // 每回合只有一张攻击卡牌，取第一张进行1v1对抗
        const p1Attack = p1Attacks[0];
        const p2Attack = p2Attacks[0];
        
        if (p1Attack.priority > p2Attack.priority) {
            // 玩家1优先级更高，获胜
            result.p1WinningAttacks = [p1Attack];
            result.effects.push(`玩家1的${p1Attack.name}压制了玩家2的${p2Attack.name}`);
        } else if (p2Attack.priority > p1Attack.priority) {
            // 玩家2优先级更高，获胜
            result.p2WinningAttacks = [p2Attack];
            result.effects.push(`玩家2的${p2Attack.name}压制了玩家1的${p1Attack.name}`);
        } else {
            // 优先级相同，互相抵消
            result.effects.push(`${p1Attack.name}与${p2Attack.name}互相抵消`);
        }
        
        return result;
    }
    
    // 计算优先级判定后的伤害（考虑防御，不包括反弹）
    static calculatePriorityDamageNoReflect(winningAttacks, defenses) {
        let totalDamage = 0;
        
        winningAttacks.forEach(attack => {
            // 检查是否被防御（不包括反弹，反弹在外层处理）
            // 防御阻挡击打和刺杀，闪避阻挡气功和大波
            const isBlocked = defenses.some(defense => {
                return ((attack.name === '击打' || attack.name === '刺杀') && defense.type === '防御') ||
                       ((attack.name === '气功' || attack.name === '大波') && defense.type === '闪避');
            });
            
            if (!isBlocked) {
                totalDamage += attack.damage;
            }
        });
        
        return totalDamage;
    }
    
    // 计算优先级判定后的伤害（考虑所有防御，包括反弹）
    static calculatePriorityDamage(winningAttacks, defenses) {
        let totalDamage = 0;
        
        winningAttacks.forEach(attack => {
            // 检查是否被防御
            // 防御阻挡击打和刺杀，闪避阻挡气功和大波，反弹阻挡所有攻击
            const isBlocked = defenses.some(defense => {
                return ((attack.name === '击打' || attack.name === '刺杀') && defense.type === '防御') ||
                       ((attack.name === '气功' || attack.name === '大波') && defense.type === '闪避') ||
                       (defense.type === '反弹'); // 反弹阻挡所有攻击
            });
            
            if (!isBlocked) {
                totalDamage += attack.damage;
            }
        });
        
        return totalDamage;
    }
    
    // 计算特定类型攻击的伤害（考虑防御）- 保留旧方法以防其他地方使用
    static calculateAttackDamage(attackCards, defenses, attackType, attackerCharacter) {
        let totalDamage = 0;
        
        attackCards.forEach(attack => {
            let damage = attack.isUpgraded && attack.data.upgraded ? 
                        attack.data.upgraded.value : 
                        (attack.data.value || 1);
            
            // 角色能力：刺客的升级击打伤害加成
            if (attackerCharacter && attackerCharacter.type === '刺客' && 
                attack.isUpgraded && attack.type === '击打') {
                damage += 1;
            }
            
            // 检查是否被防御
            const isBlocked = defenses.some(defense => {
                return (attackType === '击打' && defense.type === '防御') ||
                       (attackType === '气功' && defense.type === '闪避');
            });
            
            if (!isBlocked) {
                totalDamage += damage;
            } else {
                // 防御成功时的提示（可选）
                // result.effects.push(`${attackType}被${defense.type}抵挡`);
            }
        });
        
        return totalDamage;
    }
    
    // 处理狂战士回血特殊能力
    static processBerserkerHealing(result, player1Character, player2Character) {
        // 玩家1是狂战士且造成了伤害
        if (player1Character && player1Character.type === '狂战士' && result.player2.damageTaken > 0) {
            result.player1.healthGained += 1;
            result.effects.push('狂战士造成伤害，回复1点血量');
        }
        
        // 玩家2是狂战士且造成了伤害  
        if (player2Character && player2Character.type === '狂战士' && result.player1.damageTaken > 0) {
            result.player2.healthGained += 1;
            result.effects.push('狂战士造成伤害，回复1点血量');
        }
    }
} 