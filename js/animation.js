// 补间动画类
class Tween {
    constructor(target) {
        this.target = target;
        this.startValues = {};
        this.endValues = {};
        this.duration = CONFIG.TWEEN_DURATION;
        this.elapsed = 0;
        this.isActive = false;
        this.isComplete = false;
        this.easingFunction = MathUtils.easeOutCubic;
        this.onCompleteCallback = null;
        this.onUpdateCallback = null;
    }
    
    to(endValues, duration = this.duration) {
        this.endValues = { ...endValues };
        this.duration = duration;
        return this;
    }
    
    easing(easingFunction) {
        this.easingFunction = easingFunction;
        return this;
    }
    
    onComplete(callback) {
        this.onCompleteCallback = callback;
        return this;
    }
    
    onUpdate(callback) {
        this.onUpdateCallback = callback;
        return this;
    }
    
    start() {
        // 记录初始值
        for (let key in this.endValues) {
            this.startValues[key] = this.target[key] || 0;
        }
        
        this.elapsed = 0;
        this.isActive = true;
        this.isComplete = false;
        
        // 添加到动画管理器
        AnimationManager.addTween(this);
        return this;
    }
    
    stop() {
        this.isActive = false;
        AnimationManager.removeTween(this);
    }
    
    update(deltaTime) {
        if (!this.isActive || this.isComplete) return;
        
        this.elapsed += deltaTime;
        const progress = Math.min(this.elapsed / this.duration, 1);
        const easedProgress = this.easingFunction(progress);
        
        // 更新目标对象的属性
        for (let key in this.endValues) {
            const startValue = this.startValues[key];
            const endValue = this.endValues[key];
            this.target[key] = MathUtils.lerp(startValue, endValue, easedProgress);
        }
        
        // 调用更新回调
        if (this.onUpdateCallback) {
            this.onUpdateCallback(easedProgress);
        }
        
        // 检查是否完成
        if (progress >= 1) {
            this.isComplete = true;
            this.isActive = false;
            
            if (this.onCompleteCallback) {
                this.onCompleteCallback();
            }
            
            AnimationManager.removeTween(this);
        }
    }
}

// 动画管理器
class AnimationManager {
    constructor() {
        this.tweens = [];
        this.effects = [];
    }
    
    static instance = new AnimationManager();
    
    static addTween(tween) {
        this.instance.tweens.push(tween);
    }
    
    static removeTween(tween) {
        const index = this.instance.tweens.indexOf(tween);
        if (index > -1) {
            this.instance.tweens.splice(index, 1);
        }
    }
    
    static addEffect(effect) {
        this.instance.effects.push(effect);
    }
    
    static removeEffect(effect) {
        const index = this.instance.effects.indexOf(effect);
        if (index > -1) {
            this.instance.effects.splice(index, 1);
        }
    }
    
    static update(deltaTime) {
        // 更新补间动画
        for (let i = this.instance.tweens.length - 1; i >= 0; i--) {
            this.instance.tweens[i].update(deltaTime);
        }
        
        // 更新特效
        for (let i = this.instance.effects.length - 1; i >= 0; i--) {
            const effect = this.instance.effects[i];
            effect.update(deltaTime);
            
            if (effect.isFinished()) {
                this.instance.effects.splice(i, 1);
            }
        }
    }
    
    static render(ctx) {
        // 渲染所有特效
        this.instance.effects.forEach(effect => {
            effect.render(ctx);
        });
    }
    
    static clear() {
        this.instance.tweens = [];
        this.instance.effects = [];
    }
}

// 创建补间动画的便捷函数
function tween(target) {
    return new Tween(target);
}

// 粒子类
class Particle {
    constructor(x, y, options = {}) {
        this.x = x;
        this.y = y;
        this.vx = options.vx || MathUtils.randomFloat(-2, 2);
        this.vy = options.vy || MathUtils.randomFloat(-2, 2);
        this.life = options.life || 1000; // 毫秒
        this.maxLife = this.life;
        this.size = options.size || MathUtils.randomFloat(2, 6);
        this.color = options.color || '#FFFFFF';
        this.gravity = options.gravity || 0.1;
        this.friction = options.friction || 0.98;
        this.alpha = 1;
    }
    
    update(deltaTime) {
        this.x += this.vx * deltaTime / 16.67; // 标准化到60fps
        this.y += this.vy * deltaTime / 16.67;
        
        this.vy += this.gravity;
        this.vx *= this.friction;
        this.vy *= this.friction;
        
        this.life -= deltaTime;
        this.alpha = this.life / this.maxLife;
        
        return this.life > 0;
    }
    
    render(ctx) {
        ctx.save();
        ctx.globalAlpha = this.alpha;
        ctx.fillStyle = this.color;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
    }
}

// 粒子系统类
class ParticleSystem {
    constructor(x, y, options = {}) {
        this.x = x;
        this.y = y;
        this.particles = [];
        this.particleCount = options.count || 20;
        this.emissionRate = options.rate || 0; // 0表示一次性发射
        this.life = options.life || 2000;
        this.maxLife = this.life;
        this.particleOptions = options.particle || {};
        
        if (this.emissionRate === 0) {
            this.createBurst();
        }
    }
    
    createBurst() {
        for (let i = 0; i < this.particleCount; i++) {
            this.particles.push(new Particle(this.x, this.y, this.particleOptions));
        }
    }
    
    update(deltaTime) {
        // 更新粒子
        for (let i = this.particles.length - 1; i >= 0; i--) {
            if (!this.particles[i].update(deltaTime)) {
                this.particles.splice(i, 1);
            }
        }
        
        this.life -= deltaTime;
        return this.life > 0 || this.particles.length > 0;
    }
    
    render(ctx) {
        this.particles.forEach(particle => {
            particle.render(ctx);
        });
    }
    
    isFinished() {
        return this.life <= 0 && this.particles.length === 0;
    }
}

// 卡牌动画效果
class CardAnimations {
    // 卡牌出牌动画
    static playCard(card, targetX, targetY) {
        const originalX = card.x;
        const originalY = card.y;
        
        return tween(card)
            .to({ 
                x: targetX, 
                y: targetY, 
                scale: 1.2, 
                rotation: MathUtils.degToRad(15) 
            }, 400)
            .easing(MathUtils.easeOutBack)
            .onComplete(() => {
                // 播放特效
                this.createPlayEffect(targetX, targetY, card.type);
                
                // 卡牌回到原位（或移除）
                setTimeout(() => {
                    tween(card)
                        .to({ 
                            x: originalX, 
                            y: originalY, 
                            scale: 1, 
                            rotation: 0,
                            alpha: 0.5
                        }, 300)
                        .start();
                }, 500);
            });
    }
    
    // 卡牌翻转动画
    static flipCard(card) {
        return tween(card)
            .to({ scaleX: 0 }, 150)
            .onComplete(() => {
                // 在中间点切换卡牌正反面
                card.isRevealed = true;
                tween(card)
                    .to({ scaleX: 1 }, 150)
                    .easing(MathUtils.easeOutCubic)
                    .start();
            });
    }
    
    // 卡牌悬停动画
    static hoverCard(card) {
        if (card.hoverTween) {
            card.hoverTween.stop();
        }
        
        card.hoverTween = tween(card)
            .to({ y: card.originalY - 20, scale: 1.1 }, 200)
            .easing(MathUtils.easeOutCubic)
            .start();
    }
    
    // 卡牌取消悬停
    static unhoverCard(card) {
        if (card.hoverTween) {
            card.hoverTween.stop();
        }
        
        card.hoverTween = tween(card)
            .to({ y: card.originalY, scale: 1 }, 200)
            .easing(MathUtils.easeOutCubic)
            .start();
    }
    
    // 创建卡牌出牌特效
    static createPlayEffect(x, y, cardType) {
        const color = CARD_TYPE[cardType].color;
        
        // 创建粒子爆炸效果
        const particleSystem = new ParticleSystem(x, y, {
            count: 15,
            particle: {
                color: color,
                size: MathUtils.randomFloat(3, 8),
                life: 800,
                vx: MathUtils.randomFloat(-5, 5),
                vy: MathUtils.randomFloat(-5, 5),
                gravity: 0.2
            }
        });
        
        AnimationManager.addEffect(particleSystem);
    }
}

// 战斗特效
class BattleEffects {
    // 攻击特效
    static createAttackEffect(fromX, fromY, toX, toY, type) {
        const effect = new AttackEffect(fromX, fromY, toX, toY, type);
        AnimationManager.addEffect(effect);
        return effect;
    }
    
    // 伤害数字
    static createDamageNumber(x, y, damage, color = '#FF0000') {
        const effect = new DamageNumber(x, y, damage, color);
        AnimationManager.addEffect(effect);
        return effect;
    }
    
    // 治疗特效
    static createHealEffect(x, y, amount) {
        const effect = new HealEffect(x, y, amount);
        AnimationManager.addEffect(effect);
        return effect;
    }
    
    // 防御特效
    static createBlockEffect(x, y) {
        const effect = new BlockEffect(x, y);
        AnimationManager.addEffect(effect);
        return effect;
    }
}

// 攻击特效类
class AttackEffect {
    constructor(fromX, fromY, toX, toY, type) {
        this.fromX = fromX;
        this.fromY = fromY;
        this.toX = toX;
        this.toY = toY;
        this.type = type;
        this.progress = 0;
        this.duration = 500;
        this.particles = [];
        
        // 根据攻击类型设置颜色
        this.color = type === '气功' ? '#2196F3' : '#F44336';
    }
    
    update(deltaTime) {
        this.progress += deltaTime / this.duration;
        
        // 更新粒子轨迹
        if (this.progress < 1) {
            const currentX = MathUtils.lerp(this.fromX, this.toX, this.progress);
            const currentY = MathUtils.lerp(this.fromY, this.toY, this.progress);
            
            // 创建轨迹粒子
            this.particles.push(new Particle(currentX, currentY, {
                color: this.color,
                size: 4,
                life: 300,
                vx: 0,
                vy: 0,
                gravity: 0
            }));
        }
        
        // 更新所有粒子
        for (let i = this.particles.length - 1; i >= 0; i--) {
            if (!this.particles[i].update(deltaTime)) {
                this.particles.splice(i, 1);
            }
        }
        
        return this.progress < 1 || this.particles.length > 0;
    }
    
    render(ctx) {
        this.particles.forEach(particle => {
            particle.render(ctx);
        });
        
        // 绘制攻击轨迹
        if (this.progress < 1) {
            ctx.strokeStyle = this.color;
            ctx.lineWidth = 3;
            ctx.beginPath();
            ctx.moveTo(this.fromX, this.fromY);
            
            const currentX = MathUtils.lerp(this.fromX, this.toX, this.progress);
            const currentY = MathUtils.lerp(this.fromY, this.toY, this.progress);
            ctx.lineTo(currentX, currentY);
            ctx.stroke();
        }
    }
    
    isFinished() {
        return this.progress >= 1 && this.particles.length === 0;
    }
}

// 伤害数字类
class DamageNumber {
    constructor(x, y, damage, color) {
        this.x = x;
        this.y = y;
        this.originalY = y;
        this.damage = damage;
        this.color = color;
        this.life = 1000;
        this.maxLife = this.life;
        this.scale = 1;
        
        // 启动动画
        tween(this)
            .to({ y: this.y - 50, scale: 1.5 }, 300)
            .easing(MathUtils.easeOutCubic)
            .start();
    }
    
    update(deltaTime) {
        this.life -= deltaTime;
        return this.life > 0;
    }
    
    render(ctx) {
        const alpha = this.life / this.maxLife;
        
        ctx.save();
        ctx.globalAlpha = alpha;
        ctx.fillStyle = this.color;
        ctx.font = `bold ${24 * this.scale}px Arial`;
        ctx.textAlign = 'center';
        ctx.fillText(`-${this.damage}`, this.x, this.y);
        ctx.restore();
    }
    
    isFinished() {
        return this.life <= 0;
    }
}

// 治疗特效类
class HealEffect {
    constructor(x, y, amount) {
        this.x = x;
        this.y = y;
        this.amount = amount;
        this.life = 1000;
        this.particles = [];
        
        // 创建治疗粒子
        for (let i = 0; i < 10; i++) {
            this.particles.push(new Particle(x, y, {
                color: '#4CAF50',
                size: 3,
                life: 800,
                vx: MathUtils.randomFloat(-2, 2),
                vy: MathUtils.randomFloat(-3, -1),
                gravity: -0.1
            }));
        }
    }
    
    update(deltaTime) {
        this.life -= deltaTime;
        
        for (let i = this.particles.length - 1; i >= 0; i--) {
            if (!this.particles[i].update(deltaTime)) {
                this.particles.splice(i, 1);
            }
        }
        
        return this.life > 0 || this.particles.length > 0;
    }
    
    render(ctx) {
        this.particles.forEach(particle => {
            particle.render(ctx);
        });
        
        // 绘制治疗文字
        if (this.life > 500) {
            ctx.fillStyle = '#4CAF50';
            ctx.font = 'bold 20px Arial';
            ctx.textAlign = 'center';
            ctx.fillText(`+${this.amount}`, this.x, this.y - 30);
        }
    }
    
    isFinished() {
        return this.life <= 0 && this.particles.length === 0;
    }
}

// 防御特效类
class BlockEffect {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.life = 500;
        this.maxLife = this.life;
        this.scale = 0;
        
        // 启动缩放动画
        tween(this)
            .to({ scale: 1 }, 200)
            .easing(MathUtils.easeOutBack)
            .start();
    }
    
    update(deltaTime) {
        this.life -= deltaTime;
        return this.life > 0;
    }
    
    render(ctx) {
        const alpha = this.life / this.maxLife;
        
        ctx.save();
        ctx.globalAlpha = alpha;
        ctx.strokeStyle = '#FFD700';
        ctx.lineWidth = 4;
        ctx.scale(this.scale, this.scale);
        
        // 绘制盾牌形状
        ctx.beginPath();
        ctx.arc(this.x, this.y, 30, 0, Math.PI * 2);
        ctx.stroke();
        
        ctx.restore();
    }
    
    isFinished() {
        return this.life <= 0;
    }
} 