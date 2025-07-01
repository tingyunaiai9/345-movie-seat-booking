/**
 * 视图控制器 - 负责页面视图间的切换逻辑
 * 角色四：前端UI与总成工程师的核心功能
 */
class ViewController {
    constructor() {
        this.currentView = 'config';
        this.viewHistory = ['config'];
        this.initializeEventListeners();
    }

    /**
     * 初始化所有视图切换的事件监听器
     */
    initializeEventListeners() {
        // 配置视图 -> 电影选择视图
        const nextToMovieBtn = document.getElementById('next-to-movie');
        if (nextToMovieBtn) {
            nextToMovieBtn.addEventListener('click', () => {
                this.switchToView('movie');
            });
        }

        // 电影选择视图 -> 选座视图
        const nextToSeatBtn = document.getElementById('next-to-seat');
        if (nextToSeatBtn) {
            nextToSeatBtn.addEventListener('click', () => {
                this.switchToView('seat');
            });
        }

        // 选座视图 -> 支付视图
        const nextToPaymentBtn = document.getElementById('next-to-payment');
        if (nextToPaymentBtn) {
            nextToPaymentBtn.addEventListener('click', () => {
                this.switchToView('payment');
            });
        }

        // 返回按钮事件
        const backToConfigBtn = document.getElementById('back-to-config');
        if (backToConfigBtn) {
            backToConfigBtn.addEventListener('click', () => {
                this.switchToView('config');
            });
        }

        const backToMovieBtn = document.getElementById('back-to-movie');
        if (backToMovieBtn) {
            backToMovieBtn.addEventListener('click', () => {
                this.switchToView('movie');
            });
        }

        const backToSeatBtn = document.getElementById('back-to-seat');
        if (backToSeatBtn) {
            backToSeatBtn.addEventListener('click', () => {
                this.switchToView('seat');
            });
        }

        // 支付确认按钮
        const confirmPaymentBtn = document.getElementById('confirm-payment');
        if (confirmPaymentBtn) {
            confirmPaymentBtn.addEventListener('click', () => {
                this.handlePaymentConfirmation();
            });
        }

        // 新订单按钮
        const newOrderBtn = document.getElementById('new-order');
        if (newOrderBtn) {
            newOrderBtn.addEventListener('click', () => {
                this.resetToStart();
            });
        }

        // 顶部导航步骤点击事件
        const stepElements = document.querySelectorAll('.nav-steps .step');
        stepElements.forEach(step => {
            step.addEventListener('click', (e) => {
                const targetView = e.target.dataset.step;
                if (this.canNavigateToView(targetView)) {
                    this.switchToView(targetView);
                }
            });
        });
    }

    /**
     * 切换到指定视图
     * @param {string} viewName - 目标视图名称
     */
    switchToView(viewName) {
        // 验证视图是否存在
        const targetView = document.getElementById(`${viewName}-view`);
        if (!targetView) {
            console.error(`视图 ${viewName}-view 不存在`);
            return;
        }

        // 验证是否可以导航到目标视图
        if (!this.canNavigateToView(viewName)) {
            this.showMessage('请完成当前步骤后再继续', 'warning');
            return;
        }

        // 隐藏当前活动视图
        const currentActiveView = document.querySelector('.view.active');
        if (currentActiveView) {
            currentActiveView.classList.remove('active');
        }

        // 显示目标视图
        targetView.classList.add('active');

        // 更新导航步骤状态
        this.updateNavigationSteps(viewName);

        // 更新当前视图状态
        this.currentView = viewName;
        this.viewHistory.push(viewName);

        // 触发视图切换后的回调
        this.onViewChanged(viewName);

        console.log(`已切换到视图: ${viewName}`);
    }

    /**
     * 检查是否可以导航到指定视图
     * @param {string} viewName - 目标视图名称
     * @returns {boolean}
     */
    canNavigateToView(viewName) {
        const viewOrder = ['config', 'movie', 'seat', 'payment', 'confirm'];
        const currentIndex = viewOrder.indexOf(this.currentView);
        const targetIndex = viewOrder.indexOf(viewName);

        // 可以向后导航，或者向前导航一步
        return targetIndex <= currentIndex || targetIndex === currentIndex + 1;
    }

    /**
     * 更新顶部导航步骤的状态
     * @param {string} activeViewName - 当前激活的视图名称
     */
    updateNavigationSteps(activeViewName) {
        const stepElements = document.querySelectorAll('.nav-steps .step');
        
        stepElements.forEach(step => {
            step.classList.remove('active', 'completed');
            
            const stepView = step.dataset.step;
            if (stepView === activeViewName) {
                step.classList.add('active');
            } else if (this.isViewCompleted(stepView, activeViewName)) {
                step.classList.add('completed');
            }
        });
    }

    /**
     * 检查指定视图是否已完成
     * @param {string} viewName - 要检查的视图名称
     * @param {string} currentView - 当前视图名称
     * @returns {boolean}
     */
    isViewCompleted(viewName, currentView) {
        const viewOrder = ['config', 'movie', 'seat', 'payment', 'confirm'];
        const viewIndex = viewOrder.indexOf(viewName);
        const currentIndex = viewOrder.indexOf(currentView);
        
        return viewIndex < currentIndex;
    }

    /**
     * 处理支付确认
     */
    handlePaymentConfirmation() {
        // 显示加载状态
        this.showLoading('正在处理支付...');

        // 模拟支付处理
        setTimeout(() => {
            this.hideLoading();
            
            // 生成订单信息
            this.generateOrderInfo();
            
            // 切换到确认视图
            this.switchToView('confirm');
            
            this.showMessage('支付成功！', 'success');
        }, 2000);
    }

    /**
     * 生成订单信息
     */
    generateOrderInfo() {
        const orderNumber = 'ORD' + Date.now();
        const purchaseTime = new Date().toLocaleString('zh-CN');

        // 更新确认页面的信息
        document.getElementById('order-number').textContent = orderNumber;
        document.getElementById('purchase-time').textContent = purchaseTime;
        
        // 这里可以添加更多订单信息的更新逻辑
    }

    /**
     * 重置到开始状态
     */
    resetToStart() {
        this.currentView = 'config';
        this.viewHistory = ['config'];
        this.switchToView('config');
        
        // 重置表单数据
        this.resetAllForms();
        
        this.showMessage('已重置，可以开始新的订单', 'info');
    }

    /**
     * 重置所有表单数据
     */
    resetAllForms() {
        // 重置配置表单
        const configForm = document.querySelector('#config-view');
        if (configForm) {
            const inputs = configForm.querySelectorAll('input');
            inputs.forEach(input => {
                if (input.type === 'radio' && input.value === 'medium') {
                    input.checked = true;
                } else if (input.type === 'radio') {
                    input.checked = false;
                } else if (input.type === 'number') {
                    input.value = input.defaultValue || '';
                }
            });
        }

        // 重置其他表单...
    }

    /**
     * 视图切换后的回调函数
     * @param {string} viewName - 新视图名称
     */
    onViewChanged(viewName) {
        switch (viewName) {
            case 'config':
                this.onConfigViewActivated();
                break;
            case 'movie':
                this.onMovieViewActivated();
                break;
            case 'seat':
                this.onSeatViewActivated();
                break;
            case 'payment':
                this.onPaymentViewActivated();
                break;
            case 'confirm':
                this.onConfirmViewActivated();
                break;
        }
    }

    /**
     * 配置视图激活时的处理
     */
    onConfigViewActivated() {
        console.log('配置视图已激活');
        // 可以在这里添加配置视图特有的逻辑
    }

    /**
     * 电影选择视图激活时的处理
     */
    onMovieViewActivated() {
        console.log('电影选择视图已激活');
        // 可以在这里加载电影数据或处理电影选择逻辑
    }

    /**
     * 选座视图激活时的处理
     */
    onSeatViewActivated() {
        console.log('选座视图已激活');
        // 这里将来会调用Canvas渲染和状态管理的初始化
    }

    /**
     * 支付视图激活时的处理
     */
    onPaymentViewActivated() {
        console.log('支付视图已激活');
        // 更新支付页面的订单信息
    }

    /**
     * 确认视图激活时的处理
     */
    onConfirmViewActivated() {
        console.log('确认视图已激活');
        // 生成二维码等
    }

    /**
     * 显示消息提示
     * @param {string} message - 消息内容
     * @param {string} type - 消息类型 (success, error, warning, info)
     */
    showMessage(message, type = 'info') {
        const messageContainer = document.getElementById('message-container');
        if (!messageContainer) return;

        const messageElement = document.createElement('div');
        messageElement.className = `message message-${type}`;
        messageElement.innerHTML = `
            <span class="message-text">${message}</span>
            <button class="message-close">×</button>
        `;

        messageContainer.appendChild(messageElement);

        // 添加关闭事件
        const closeBtn = messageElement.querySelector('.message-close');
        closeBtn.addEventListener('click', () => {
            messageElement.remove();
        });

        // 自动关闭
        setTimeout(() => {
            if (messageElement.parentNode) {
                messageElement.remove();
            }
        }, 3000);
    }

    /**
     * 显示加载状态
     * @param {string} text - 加载文本
     */
    showLoading(text = '正在加载...') {
        const loadingOverlay = document.getElementById('loading-overlay');
        const loadingText = document.getElementById('loading-text');
        
        if (loadingOverlay && loadingText) {
            loadingText.textContent = text;
            loadingOverlay.style.display = 'flex';
        }
    }

    /**
     * 隐藏加载状态
     */
    hideLoading() {
        const loadingOverlay = document.getElementById('loading-overlay');
        if (loadingOverlay) {
            loadingOverlay.style.display = 'none';
        }
    }
}

// 初始化视图控制器
document.addEventListener('DOMContentLoaded', () => {
    window.viewController = new ViewController();
    console.log('视图控制器已初始化');
});