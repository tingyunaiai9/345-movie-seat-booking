/**
 * 视图控制器 - 负责页面视图间的切换逻辑
 */
class ViewController {
    constructor() {
        this.currentView = 'config';
        this.viewHistory = ['config'];
        this.selectedMovie = null;
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

        // *** 新增：根据视图切换背景 ***
        this.handleBackgroundForView(viewName);

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
     * 根据视图处理背景切换
     * @param {string} viewName - 视图名称
     */
    handleBackgroundForView(viewName) {
        if (viewName === 'config') {
            // 配置页面：使用田野背景
            if (window.movieSelector) {
                window.movieSelector.restoreConfigBackground();
            }
        } else {
            // 其他页面：使用选中电影的背景（如果有）
            const selectedMovieId = localStorage.getItem('selectedMovie');
            if (selectedMovieId && window.movieSelector) {
                window.movieSelector.applyBackgroundById(selectedMovieId);
            }
        }
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

        // 基本导航规则：可以向后导航，或者向前导航一步
        const basicNavigation = targetIndex <= currentIndex || targetIndex === currentIndex + 1;
        
        if (!basicNavigation) {
            return false;
        }

        // 特殊验证规则
        switch (viewName) {
            case 'seat':
                // 进入选座页面需要先选择电影
                if (window.movieSelector && !window.movieSelector.getSelectedMovie()) {
                    this.showMessage('请先选择电影', 'warning');
                    return false;
                }
                break;
            case 'payment':
                // 进入支付页面需要选择座位
                break;
        }

        return true;
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
        this.showLoading('正在处理支付...');

        setTimeout(() => {
            this.hideLoading();
            this.generateOrderInfo();
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

        const orderNumberElement = document.getElementById('order-number');
        if (orderNumberElement) {
            orderNumberElement.textContent = orderNumber;
        }
        
        const purchaseTimeElement = document.getElementById('purchase-time');
        if (purchaseTimeElement) {
            purchaseTimeElement.textContent = purchaseTime;
        }
    }

    /**
     * 重置到开始状态
     */
    resetToStart() {
        this.currentView = 'config';
        this.viewHistory = ['config'];
        
        // 重置背景为田野背景
        if (window.movieSelector) {
            window.movieSelector.restoreConfigBackground();
        }
        
        this.switchToView('config');
        this.resetAllForms();
        this.showMessage('已重置，可以开始新的订单', 'info');
    }

    /**
     * 重置所有表单数据
     */
    resetAllForms() {
        // 重置电影选择为第一个
        const allMovieItems = document.querySelectorAll('.movie-item');
        allMovieItems.forEach(item => {
            item.classList.remove('active');
        });
        
        const firstMovie = document.querySelector('.movie-item');
        if (firstMovie) {
            firstMovie.classList.add('active');
            if (window.movieSelector) {
                window.movieSelector.selectMovie(firstMovie);
            }
        }
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

    onConfigViewActivated() {
        console.log('配置视图已激活');
    }

    onMovieViewActivated() {
        console.log('电影选择视图已激活');
    }

    onSeatViewActivated() {
        console.log('选座视图已激活');
        this.initializeCanvasDrawing();
    }

    initializeCanvasDrawing() {
        const canvas = document.getElementById('cinema-canvas');
        if (!canvas) {
            console.error('未找到Canvas元素');
            return;
        }
        
        console.log('Canvas元素已找到，Canvas.js将自动绘制');
        
        setTimeout(() => {
            const ctx = canvas.getContext('2d');
            const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
            const hasContent = imageData.data.some(channel => channel !== 0);
            
            if (!hasContent) {
                console.log('Canvas内容为空，尝试手动触发绘制');
            }
        }, 500);
    }

    onPaymentViewActivated() {
        console.log('支付视图已激活');
    }

    onConfirmViewActivated() {
        console.log('确认视图已激活');
    }

    /**
     * 显示消息提示
     */
    showMessage(message, type = 'info') {
        let messageContainer = document.getElementById('message-container');
        if (!messageContainer) {
            messageContainer = document.createElement('div');
            messageContainer.id = 'message-container';
            messageContainer.style.cssText = 'position:fixed;top:20px;right:20px;z-index:9999;';
            document.body.appendChild(messageContainer);
        }

        const messageElement = document.createElement('div');
        messageElement.className = `message message-${type}`;
        messageElement.style.cssText = `
            background: ${this.getMessageColor(type)};
            color: white;
            padding: 12px 16px;
            margin: 8px 0;
            border-radius: 4px;
            box-shadow: 0 2px 8px rgba(0,0,0,0.2);
            display: flex;
            align-items: center;
            justify-content: space-between;
            min-width: 250px;
        `;
        
        messageElement.innerHTML = `
            <span>${message}</span>
            <button onclick="this.parentNode.remove()" style="background:none;border:none;color:white;font-size:16px;cursor:pointer;margin-left:10px;">×</button>
        `;

        messageContainer.appendChild(messageElement);

        setTimeout(() => {
            if (messageElement.parentNode) {
                messageElement.remove();
            }
        }, 3000);
    }

    getMessageColor(type) {
        const colors = {
            success: '#28a745',
            error: '#dc3545',
            warning: '#ffc107',
            info: '#17a2b8'
        };
        return colors[type] || colors.info;
    }

    /**
     * 显示加载状态
     */
    showLoading(text = '正在加载...') {
        let loadingOverlay = document.getElementById('loading-overlay');
        if (!loadingOverlay) {
            loadingOverlay = document.createElement('div');
            loadingOverlay.id = 'loading-overlay';
            loadingOverlay.style.cssText = `
                position: fixed;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                background: rgba(0,0,0,0.5);
                display: flex;
                align-items: center;
                justify-content: center;
                z-index: 10000;
            `;
            
            loadingOverlay.innerHTML = `
                <div style="background:white;padding:30px;border-radius:8px;text-align:center;">
                    <div style="border:4px solid #f3f3f3;border-top:4px solid #3498db;border-radius:50%;width:40px;height:40px;animation:spin 1s linear infinite;margin:0 auto 15px;"></div>
                    <div>${text}</div>
                </div>
            `;
            
            document.body.appendChild(loadingOverlay);
            
            const style = document.createElement('style');
            style.textContent = '@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }';
            document.head.appendChild(style);
        }
        
        loadingOverlay.style.display = 'flex';
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