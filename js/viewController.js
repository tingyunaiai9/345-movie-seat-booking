/**
 * 视图控制器 - 负责页面视图间的切换逻辑
 */
class ViewController {
    constructor() {
        this.currentView = 'config';
        this.viewHistory = ['config'];
        this.selectedMovie = null;
        this.cinemaConfigSelected = false; // 新增：影厅配置选择状态
        this.initializeEventListeners();
        this.initializeCinemaConfigSelector();
        this.initializeButtonStates(); // 新增：初始化按钮状态
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
            this.showMessage('请按顺序进行操作', 'warning');
            return false;
        }

        // 特殊验证规则
        switch (viewName) {
            case 'movie':
                // 进入电影选择页面需要先配置影厅
                if (!this.cinemaConfigSelected) {
                    this.showMessage('请先选择影厅规模', 'warning');
                    return false;
                }
                break;
            case 'seat':
                // 进入选座页面需要先选择电影
                if (!this.selectedMovie) {
                    this.showMessage('请先选择电影', 'warning');
                    return false;
                }
                break;
            case 'payment':
                // 进入支付页面需要选择座位
                // 这里可以添加座位选择的验证
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
        // this.showLoading('正在处理支付...');

        // setTimeout(() => {
        //     this.hideLoading();
        //     this.generateOrderInfo();
        //     this.switchToView('confirm');
        //     this.showMessage('支付成功！', 'success');
        // }, 2000);

        this.generateOrderInfo();
        this.switchToView('confirm');
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
        // 确保配置选择器已初始化
        if (!this.configSelectorInitialized) {
            this.initializeCinemaConfigSelector();
            this.configSelectorInitialized = true;
        }
    }

    /**
     * 初始化按钮状态管理
     */
    initializeButtonStates() {
        // 初始化时设置按钮为禁用状态
        this.updateConfigNextButton();
        this.updateMovieNextButton();

        // 监听电影选择变化
        this.initializeMovieSelection();
    }

    /**
     * 更新配置页面的下一步按钮状态
     */
    updateConfigNextButton() {
        const nextButton = document.getElementById('next-to-movie');
        if (!nextButton) return;

        if (this.cinemaConfigSelected) {
            nextButton.disabled = false;
            nextButton.classList.remove('btn-disabled');
            nextButton.textContent = '下一步：选择电影';
        } else {
            nextButton.disabled = true;
            nextButton.classList.add('btn-disabled');
            nextButton.textContent = '请先选择影厅规模';
        }
    }

    /**
     * 更新电影页面的下一步按钮状态
     */
    updateMovieNextButton() {
        const nextButton = document.getElementById('next-to-seat');
        if (!nextButton) return;

        if (this.selectedMovie) {
            nextButton.disabled = false;
            nextButton.classList.remove('btn-disabled');
            nextButton.textContent = '下一步：选择座位';
        } else {
            nextButton.disabled = true;
            nextButton.classList.add('btn-disabled');
            nextButton.textContent = '请先选择电影';
        }
    }

    /**
     * 初始化电影选择监听
     */
    initializeMovieSelection() {
        // 监听电影项点击
        document.addEventListener('click', (e) => {
            const movieItem = e.target.closest('.movie-item');
            if (movieItem) {
                // 移除所有电影的选中状态
                document.querySelectorAll('.movie-item').forEach(item => {
                    item.classList.remove('active');
                });

                // 为当前电影添加选中状态
                movieItem.classList.add('active');

                // 更新选中的电影
                this.selectedMovie = movieItem.dataset.movie;

                // 更新按钮状态
                this.updateMovieNextButton();

                console.log(`选择了电影: ${this.selectedMovie}`);
            }
        });
    }

    /**
     * 修改后的影厅配置选择器初始化
     */
    initializeCinemaConfigSelector() {
        const presetRadios = document.querySelectorAll('input[name="cinema-preset"]');
        const customConfig = document.querySelector('.custom-config');

        // 预设配置映射
        const presetConfigs = {
            small: { rows: 8, cols: 12, name: '小厅' },
            medium: { rows: 10, cols: 20, name: '中厅' },
            large: { rows: 12, cols: 25, name: '大厅' }
        };

        // 监听预设选项变化
        presetRadios.forEach(radio => {
            radio.addEventListener('change', (e) => {
                if (e.target.checked) {
                    const selectedPreset = e.target.value;

                    // 标记影厅配置已选择
                    this.cinemaConfigSelected = true;

                    if (selectedPreset === 'custom') {
                        // 显示自定义配置
                        if (customConfig) {
                            customConfig.style.display = 'block';
                        }
                        // 检查自定义配置是否有效
                        this.validateCustomConfig();
                    } else {
                        // 隐藏自定义配置
                        if (customConfig) {
                            customConfig.style.display = 'none';
                        }

                        // 应用预设配置
                        const config = presetConfigs[selectedPreset];
                        if (config) {
                            this.applyConfigToModules(config.rows, config.cols, config.name);
                        }
                    }

                    // 更新按钮状态
                    this.updateConfigNextButton();
                }
            });
        });

        // 监听自定义配置变化
        const customRowsInput = document.getElementById('custom-rows');
        const customSeatsInput = document.getElementById('custom-seats');
        const totalSeatsSpan = document.getElementById('total-seats');

        const updateCustomConfig = () => {
            const rows = parseInt(customRowsInput?.value) || 10;
            const cols = parseInt(customSeatsInput?.value) || 20;
            const total = rows * cols;

            if (totalSeatsSpan) {
                totalSeatsSpan.textContent = total;
            }

            // 如果当前选中的是自定义配置，则应用更改
            const selectedPreset = document.querySelector('input[name="cinema-preset"]:checked');
            if (selectedPreset && selectedPreset.value === 'custom') {
                this.validateCustomConfig();
                if (this.cinemaConfigSelected) {
                    this.applyConfigToModules(rows, cols, '自定义');
                }
            }
        };

        if (customRowsInput) {
            customRowsInput.addEventListener('input', updateCustomConfig);
        }
        if (customSeatsInput) {
            customSeatsInput.addEventListener('input', updateCustomConfig);
        }

        // 初始状态：没有选择任何配置
        this.cinemaConfigSelected = false;
        this.updateConfigNextButton();
    }

    /**
     * 验证自定义配置
     */
    validateCustomConfig() {
        const customRowsInput = document.getElementById('custom-rows');
        const customSeatsInput = document.getElementById('custom-seats');

        const rows = parseInt(customRowsInput?.value) || 0;
        const cols = parseInt(customSeatsInput?.value) || 0;

        // 验证自定义配置是否有效
        const isValid = rows >= 5 && rows <= 20 && cols >= 10 && cols <= 30;

        if (isValid) {
            this.cinemaConfigSelected = true;
            this.applyConfigToModules(rows, cols, '自定义');
        } else {
            this.cinemaConfigSelected = false;
        }

        this.updateConfigNextButton();
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
        // 确保配置选择器已初始化
        if (!this.configSelectorInitialized) {
            this.initializeCinemaConfigSelector();
            this.configSelectorInitialized = true;
        }
    }

    onMovieViewActivated() {
        console.log('电影选择视图已激活');
        // 确保按钮状态正确
        this.updateMovieNextButton();
    }

    onSeatViewActivated() {
        console.log('选座视图已激活，开始执行初始化流程...');

        // 使用 requestAnimationFrame 确保在下一次浏览器重绘前执行初始化，
        // 这能保证视图（DOM元素）已经可见。
        requestAnimationFrame(() => {
            this.initializeSeatView();
        });
    }

    initializeSeatView() {
        // 1. 检查核心依赖是否存在
        if (!window.CinemaData || !window.CanvasRenderer || !window.StateManager) {
            console.error('错误：一个或多个核心模块 (CinemaData, CanvasRenderer, StateManager) 未加载！');
            this.showMessage('核心模块加载失败，请刷新页面重试。', 'error');
            return;
        }

        console.log('✅ 核心模块已确认加载。');

        // 2. 初始化或刷新Canvas绘图 (canvas.js)
        //    initializeAndDrawCinema 会从 CinemaData 获取最新配置来绘制。
        console.log('正在初始化 Canvas...');
        try {
            // 注意：我们调用的是 CanvasRenderer 命名空间下的函数，更规范
            window.CanvasRenderer.initializeAndDrawCinema();
            console.log('✅ Canvas 初始化并绘制完成。');
        } catch (e) {
            console.error('Canvas 绘制失败:', e);
            this.showMessage('影厅座位图绘制失败！', 'error');
            return; // 如果绘制失败，则中断后续步骤
        }

        // 3. 初始化或重置交互状态管理器 (stateManager.js)
        //    StateManager 会读取 CinemaData 和 Canvas 的状态。
        console.log('正在初始化 StateManager...');
        try {
            // 使用 reset 而不是 initialize，避免重复绑定事件监听器。
            // 如果需要更复杂的逻辑，可以为 StateManager 增加一个 dedicated 的 refresh 方法。
            // 在这里，我们假设 resetStateManager 能够安全地重置状态并重新加载数据。
            window.StateManager.resetStateManager();
            console.log('✅ StateManager 初始化/重置完成。');
        } catch (e) {
            console.error('StateManager 初始化失败:', e);
            this.showMessage('座位交互系统初始化失败！', 'error');
        }

        // 4. 更新UI上的统计信息（可选，但推荐）
        //    确保右下角的影厅状态是最新的。
        this.updateCinemaStatusDisplay();

        console.log('🚀 选座视图所有组件已准备就绪！');
    }


    onPaymentViewActivated() {
        console.log('支付视图已激活');
    }

    onConfirmViewActivated() {
        console.log('确认视图已激活');
    }

    /**
     * 将配置应用到各个模块
     * @param {number} rows - 行数
     * @param {number} cols - 列数
     * @param {string} name - 配置名称
     */
    applyConfigToModules(rows, cols, name) {
        console.log(`🔧 应用影厅配置: ${name} (${rows}行 × ${cols}列)`);

        // 1. 更新 main.js 中的座位数据
        if (window.CinemaData && typeof window.CinemaData.initializeCinemaSeats === 'function') {
            window.CinemaData.initializeCinemaSeats(rows, cols);
            console.log(`✅ main.js 座位数据已更新`);
        }

        // 2. 如果已经在选座界面，更新 Canvas 显示
        if (window.initializeAndDrawCinema && typeof window.initializeAndDrawCinema === 'function') {
            // 延迟执行，确保数据已经更新
            setTimeout(() => {
                window.initializeAndDrawCinema();
                console.log(`✅ Canvas 显示已更新`);
            }, 50);
        }

        // 3. 如果状态管理器已初始化，刷新数据
        if (window.StateManager && typeof window.StateManager.loadInitialSeatsData === 'function') {
            window.StateManager.loadInitialSeatsData();
            console.log(`✅ StateManager 数据已刷新`);
        }

        // 4. 更新UI显示的统计信息
        this.updateCinemaStatusDisplay();

        // 5. 显示配置更改提示
        this.showMessage(`影厅配置已更新为：${name}`, 'success');
    }

    /**
     * 更新影厅状态显示
     */
    updateCinemaStatusDisplay() {
        if (window.CinemaData && typeof window.CinemaData.getCinemaStatus === 'function') {
            const status = window.CinemaData.getCinemaStatus();

            // 更新各种计数器
            const availableCountEl = document.getElementById('available-count');
            const soldCountEl = document.getElementById('sold-count');
            const reservedCountEl = document.getElementById('reserved-count');
            const occupancyRateEl = document.getElementById('occupancy-rate');

            if (availableCountEl) availableCountEl.textContent = status.available;
            if (soldCountEl) soldCountEl.textContent = status.sold;
            if (reservedCountEl) reservedCountEl.textContent = status.reserved;
            if (occupancyRateEl) {
                const occupancyRate = Math.round(((status.sold + status.reserved) / status.total) * 100);
                occupancyRateEl.textContent = `${occupancyRate}%`;
            }
        }
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
