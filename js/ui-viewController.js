/**
 * 视图控制器 - 负责页面视图间的切换逻辑
 * 重构为函数式模块，使用window导出
 */

// ========================= 常量定义 =========================
const VIEW_CONFIG = {
    // 视图名称
    VIEWS: {
        CONFIG: 'config',
        MOVIE: 'movie',
        SEAT: 'seat',
        PAYMENT: 'payment',
        CONFIRM: 'confirm'
    },

    // 视图顺序
    VIEW_ORDER: ['config', 'movie', 'seat', 'payment', 'confirm'],

    // 预设配置
    PRESET_CONFIGS: {
        small: { rows: 8, cols: 12, name: '小厅' },
        medium: { rows: 10, cols: 20, name: '中厅' },
        large: { rows: 12, cols: 25, name: '大厅' }
    }
};

// ========================= 全局状态变量 =========================
let viewState = {
    currentView: 'config',
    viewHistory: ['config'],
    selectedMovie: null,
    selectedCinemaSize: null,
    cinemaConfigSelected: false,
    configSelectorInitialized: false
};

// ========================= 初始化函数 =========================

/**
 * 初始化视图控制器
 */
function initializeViewController() {
    console.log('视图控制器开始初始化...');

    // 初始化事件监听器
    initializeEventListeners();

    // 初始化影厅配置选择器
    initializeCinemaConfigSelector();

    // 初始化按钮状态
    initializeButtonStates();

    console.log('视图控制器初始化完成');
}

/**
 * 初始化所有视图切换的事件监听器
 */
function initializeEventListeners() {
    // 配置视图 -> 电影选择视图
    const nextToMovieBtn = document.getElementById('next-to-movie');
    if (nextToMovieBtn) {
        nextToMovieBtn.addEventListener('click', () => {
            switchToView('movie');
        });
    }

    // 电影选择视图 -> 选座视图
    const nextToSeatBtn = document.getElementById('next-to-seat');
    if (nextToSeatBtn) {
        nextToSeatBtn.addEventListener('click', () => {
            // 确保用户已完成影厅和电影的选择
            if (viewState.selectedCinemaSize && viewState.selectedMovie) {
                localStorage.setItem('selectedMovie', viewState.selectedMovie);
                // 【核心改动】在这里执行唯一一次权威的座位初始化
                console.log('🚀 执行最终初始化，传入影厅和电影信息...');
                window.CinemaData.initializeCinemaSeats(
                    viewState.selectedCinemaSize.rows,
                    viewState.selectedCinemaSize.cols,
                    viewState.selectedMovieInfo.startTime,
                    viewState.selectedMovie // movieId 参数，现在保证有值
                );
                console.log('viewController,此时得到的电影开始时间为:', viewState.selectedMovieInfo.startTime);

                // 初始化成功后，才切换视图
                switchToView('seat');

            } else {
                // 如果信息不完整，给出提示
                showMessage('请确保已选择影厅规模和电影', 'warning');
            }
        });
    }

    // 选座视图 -> 支付视图
    const nextToPaymentBtn = document.getElementById('next-to-payment');
    if (nextToPaymentBtn) {
        nextToPaymentBtn.addEventListener('click', () => {
            switchToView('payment');
        });
    }

    // 返回按钮事件
    const backToConfigBtn = document.getElementById('back-to-config');
    if (backToConfigBtn) {
        backToConfigBtn.addEventListener('click', () => {
            switchToView('config');
        });
    }

    const backToMovieBtn = document.getElementById('back-to-movie');
    if (backToMovieBtn) {
        backToMovieBtn.addEventListener('click', () => {
            switchToView('movie');
        });
    }

    const backToSeatBtn = document.getElementById('back-to-seat');
    if (backToSeatBtn) {
        backToSeatBtn.addEventListener('click', () => {
            switchToView('seat');
        });
    }

    // 🔑 新增：预订和购票按钮（从ui-core.js移过来）
    const purchaseSeatsBtn = document.getElementById('purchase-seats');
    if (purchaseSeatsBtn) {
        purchaseSeatsBtn.addEventListener('click', () => {
            console.log('点击直接购票按钮');
            if (window.UIValidation && window.UIValidation.handleDirectPurchase) {
                window.UIValidation.handleDirectPurchase();
            }
        });
    }

    const reserveSeatsBtn = document.getElementById('reserve-seats');
    if (reserveSeatsBtn) {
        reserveSeatsBtn.addEventListener('click', () => {
            console.log('点击预订座位按钮');
            if (window.UIValidation && window.UIValidation.handleReservation) {
                window.UIValidation.handleReservation();
            }
            if (window.CanvasRenderer && typeof window.CanvasRenderer.refreshCinemaDisplay === 'function') {
                window.CanvasRenderer.refreshCinemaDisplay();
                console.log('预订后已刷新座位Canvas');
            }
        });
    }

    // 支付确认按钮
    const confirmPaymentBtn = document.getElementById('confirm-payment');
    if (confirmPaymentBtn) {
        confirmPaymentBtn.addEventListener('click', () => {
            handlePaymentConfirmation();
        });
    }

    // 确认页面的支付按钮
    const confirmPayBtn = document.querySelector('#confirm-view .btn-pay');
    if (confirmPayBtn) {
        confirmPayBtn.addEventListener('click', () => {
            if (window.UIPayment && window.UIPayment.handleFinalPayment) {
                window.UIPayment.handleFinalPayment();
            }
        });
    }

    // 顶部导航步骤点击事件
    const stepElements = document.querySelectorAll('.nav-steps .step');
    stepElements.forEach(step => {
        step.addEventListener('click', (e) => {
            const targetView = e.target.dataset.step;
            if (canNavigateToView(targetView)) {
                switchToView(targetView);
            }
        });
    });
}

// ========================= 视图切换核心函数 =========================

/**
 * 切换到指定视图（整合了ui-core.js的switchView功能）
 * @param {string} viewName - 目标视图名称
 * @param {Object} options - 切换选项
 */
function switchToView(viewName, options = {}) {
    // 验证视图是否存在
    const targetView = document.getElementById(`${viewName}-view`);
    if (!targetView) {
        console.error(`视图 ${viewName}-view 不存在`);
        return;
    }

    // 验证是否可以导航到目标视图
    if (!canNavigateToView(viewName)) {
        showMessage('请完成当前步骤后再继续', 'warning');
        return;
    }

    console.log(`视图切换: 从 ${viewState.currentView} 切换到 ${viewName}`);

    // 隐藏当前活动视图
    const currentActiveView = document.querySelector('.view.active');
    if (currentActiveView) {
        currentActiveView.classList.remove('active');
    }

    // 显示目标视图
    targetView.classList.add('active');

    // *** 新增：根据视图切换背景 ***
    handleBackgroundForView(viewName);

    // 更新导航步骤状态
    updateNavigationSteps(viewName);

    // 更新当前视图状态
    viewState.currentView = viewName;
    console.log(`当前视图已更新为: ${viewState.currentView}`);

    // 限制历史记录大小
    viewState.viewHistory.push(viewName);
    if (viewState.viewHistory.length > 10) {
        viewState.viewHistory = viewState.viewHistory.slice(-10);
    }

    console.log(`视图历史: ${viewState.viewHistory.join(' -> ')}`);

    // 🔑 特殊视图的处理逻辑（从ui-core.js移过来）
    handleSpecialViewLogic(viewName, options);

    // 触发视图切换后的回调
    onViewChanged(viewName);
}

/**
 * 处理特殊视图的逻辑（从ui-core.js移过来）
 * @param {string} viewName - 视图名称
 * @param {Object} options - 选项
 */
function handleSpecialViewLogic(viewName, options) {
    // 如果切换到座位选择页面
    if (viewName === 'seat') {
        setTimeout(() => {
            // 检查是否是从支付页面返回的
            const isReturnFromPayment = viewState.viewHistory.length >= 2 &&
                viewState.viewHistory[viewState.viewHistory.length - 2] === 'payment';

            if (!isReturnFromPayment && window.CanvasRenderer && window.CanvasRenderer.refreshCinemaDisplay) {
                window.CanvasRenderer.refreshCinemaDisplay();
                console.log('座位视图已刷新');
            } else if (isReturnFromPayment) {
                console.log('从支付页面返回，保留座位选择状态');
                if (window.CanvasRenderer && window.CanvasRenderer.refreshCinemaDisplay) {
                    window.CanvasRenderer.refreshCinemaDisplay();
                }
            }

            // 添加：在控制台显示当前所有座位的状态
            logSeatStatus();
        }, 100);
    }

    // 如果切换到支付页面，更新支付页面数据
    if (viewName === 'payment') {
        setTimeout(() => {
            if (window.UIPayment && window.UIPayment.updatePaymentPageData) {
                window.UIPayment.updatePaymentPageData();
            }
        }, 100);
    }

    // 如果切换到确认页面，初始化确认页面数据
    if (viewName === 'confirm') {
        setTimeout(() => {
            if (window.UIPayment && window.UIPayment.initializeConfirmPage) {
                window.UIPayment.initializeConfirmPage();
            }
        }, 100);
    }
}

// ========================= 导航验证函数 =========================

/**
 * 检查是否可以导航到指定视图
 * @param {string} viewName - 目标视图名称
 * @returns {boolean}
 */
function canNavigateToView(viewName) {
    console.log(`尝试导航到视图: ${viewName}, 当前视图: ${viewState.currentView}`);
    const currentIndex = VIEW_CONFIG.VIEW_ORDER.indexOf(viewState.currentView);
    const targetIndex = VIEW_CONFIG.VIEW_ORDER.indexOf(viewName);

    console.log(`当前视图索引: ${currentIndex}, 目标视图索引: ${targetIndex}`);

    // 基本导航规则：可以向后导航，或者向前导航一步
    const basicNavigation = targetIndex <= currentIndex || targetIndex === currentIndex + 1;

    console.log(`基本导航检查结果: ${basicNavigation ? '通过' : '未通过'}`);

    if (!basicNavigation) {
        console.log('导航失败: 只能按顺序导航或返回到之前的视图');
        showMessage('请按顺序进行操作', 'warning');
        return false;
    }

    // 特殊验证规则
    switch (viewName) {
        case 'movie':
            console.log(`检查进入电影选择页面条件, 影厅配置已选择: ${viewState.cinemaConfigSelected}`);
            // 进入电影选择页面需要先配置影厅
            if (!viewState.cinemaConfigSelected) {
                console.log('导航失败: 未选择影厅规模');
                showMessage('请先选择影厅规模', 'warning');
                return false;
            }
            break;
        case 'seat':
            console.log(`检查进入选座页面条件, 已选择电影: ${viewState.selectedMovie}`);
            // 进入选座页面需要先选择电影
            if (!viewState.selectedMovie) {
                console.log('导航失败: 未选择电影');
                showMessage('请先选择电影', 'warning');
                return false;
            }
            break;
        case 'payment':
            // 进入支付页面需要选择座位
            console.log(`检查进入支付页面条件，当前视图: ${viewState.currentView}`);

            // 如果有StateManager，检查是否已选座位
            if (window.StateManager && typeof window.StateManager.getSelectedCount === 'function') {
                const selectedCount = window.StateManager.getSelectedCount();
                console.log(`已选座位数量: ${selectedCount}`);

                if (selectedCount === 0) {
                    console.log('导航失败: 未选择座位');
                    showMessage('请先选择至少一个座位', 'warning');
                    return false;
                } else {
                    console.log('座位选择验证通过');
                }
            } else {
                console.log('警告: StateManager不可用，无法验证座位选择');
            }
            break;
    }

    console.log(`导航到 ${viewName} 验证通过`);
    return true;
}

// ========================= 导航状态管理 =========================

/**
 * 更新顶部导航步骤的状态
 * @param {string} activeViewName - 当前激活的视图名称
 */
function updateNavigationSteps(activeViewName) {
    const stepElements = document.querySelectorAll('.nav-steps .step');

    stepElements.forEach(step => {
        step.classList.remove('active', 'completed');

        const stepView = step.dataset.step;
        if (stepView === activeViewName) {
            step.classList.add('active');
        } else if (isViewCompleted(stepView, activeViewName)) {
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
function isViewCompleted(viewName, currentView) {
    const viewIndex = VIEW_CONFIG.VIEW_ORDER.indexOf(viewName);
    const currentIndex = VIEW_CONFIG.VIEW_ORDER.indexOf(currentView);

    return viewIndex < currentIndex;
}

// ========================= 视图激活回调函数 =========================

/**
 * 视图切换后的回调函数
 * @param {string} viewName - 新视图名称
 */
function onViewChanged(viewName) {
    switch (viewName) {
        case 'config':
            onConfigViewActivated();
            break;
        case 'movie':
            onMovieViewActivated();
            break;
        case 'seat':
            onSeatViewActivated();
            break;
        case 'payment':
            onPaymentViewActivated();
            break;
        case 'confirm':
            onConfirmViewActivated();
            break;
    }
}

function onConfigViewActivated() {
    console.log('配置视图已激活');
    // 确保配置选择器已初始化
    if (!viewState.configSelectorInitialized) {
        initializeCinemaConfigSelector();
        viewState.configSelectorInitialized = true;
    }
}

function onMovieViewActivated() {
    console.log('电影选择视图已激活');
    // 确保按钮状态正确
    updateMovieNextButton();
}

function onSeatViewActivated() {
    console.log('选座视图已激活，开始执行初始化流程...');

    // 检查是否是从支付页面返回的
    const isReturnFromPayment = viewState.viewHistory.length >= 2 &&
        viewState.viewHistory[viewState.viewHistory.length - 2] === 'payment';

    // 使用 requestAnimationFrame 确保在下一次浏览器重绘前执行初始化，
    // 这能保证视图（DOM元素）已经可见。
    requestAnimationFrame(() => {
        // 仅在不是从支付页面返回的情况下完全初始化
        initializeSeatView(!isReturnFromPayment);
    });
}

function onPaymentViewActivated() {
    console.log('支付视图已激活');

    // 强制更新导航步骤状态
    updateNavigationSteps('payment');

    // 强制更新UI状态反映当前是支付页面
    const paymentStep = document.querySelector('.nav-steps .step[data-step="payment"]');
    if (paymentStep) {
        document.querySelectorAll('.nav-steps .step').forEach(step => {
            step.classList.remove('active');
        });
        paymentStep.classList.add('active');
    }
}

function onConfirmViewActivated() {
    console.log('确认视图已激活');
}

// ========================= 座位视图初始化 =========================

function initializeSeatView(resetSelection = true) {
    // 1. 检查核心依赖是否存在
    if (!window.CinemaData || !window.CanvasRenderer || !window.StateManager) {
        console.error('错误：一个或多个核心模块 (CinemaData, CanvasRenderer, StateManager) 未加载！');
        showMessage('核心模块加载失败，请刷新页面重试。', 'error');
        return;
    }

    const config = window.CinemaData.getCurrentConfig();// 获取当前配置
    const selectedMovie = localStorage.getItem('selectedMovie') || config.movieId;// 获取选中的电影ID

    if (!config || !selectedMovie) {
        console.error('错误：当前影厅配置或选中电影未设置！');
        showMessage('影厅配置或选中电影未设置，请检查。', 'error');
        return;
    }

    console.log(`✅ 座位数据已根据影厅(${config.TOTAL_ROWS}x${config.SEATS_PER_ROW})和电影(${selectedMovie})完成加载/创建。`);

    // 2. 初始化或刷新Canvas绘图 (canvas.js)
    console.log('正在初始化 Canvas...');
    try {
        if (resetSelection) {
            // 完全重新初始化（不是从支付页面返回时）
            window.CanvasRenderer.initializeAndDrawCinema();
            console.log('✅ Canvas 初始化并绘制完成。');
        } else {
            // 从支付页面返回时，只刷新显示，不重置选座状态
            window.CanvasRenderer.refreshCinemaDisplay();
            console.log('✅ Canvas 刷新显示完成（保留选座状态）。');
        }
    } catch (e) {
        console.error('Canvas 绘制失败:', e);
        showMessage('影厅座位图绘制失败！', 'error');
        return; // 如果绘制失败，则中断后续步骤
    }

    // 3. 初始化或重置交互状态管理器 (stateManager.js)
    console.log('正在初始化 StateManager...');
    try {
        if (resetSelection) {
            // 完全重置 StateManager（不是从支付页面返回时）
            window.StateManager.resetStateManager();
            console.log('✅ StateManager 重置完成。');
        } else {
            // 从支付页面返回时，不重置选座状态，只刷新通知
            window.StateManager.notifySelectionChange();
            console.log('✅ StateManager 选座状态已保留。');
        }
    } catch (e) {
        console.error('StateManager 初始化失败:', e);
        showMessage('座位交互系统初始化失败！', 'error');
    }

    // 4. 更新UI上的统计信息（可选，但推荐）
    updateCinemaStatusDisplay();

    console.log('🚀 选座视图所有组件已准备就绪！');
}

// ========================= 影厅配置管理 =========================

/**
 * 修改后的影厅配置选择器初始化
 */
function initializeCinemaConfigSelector() {
    const presetRadios = document.querySelectorAll('input[name="cinema-preset"]');
    const customConfig = document.querySelector('.custom-config');

    // 监听预设选项变化
    presetRadios.forEach(radio => {
        radio.addEventListener('change', (e) => {
            if (e.target.checked) {
                const selectedPreset = e.target.value;
                viewState.cinemaConfigSelected = true;

                if (selectedPreset === 'custom') {
                    // 显示自定义配置
                    if (customConfig) {
                        customConfig.style.display = 'block';
                    }
                    // 检查自定义配置是否有效
                    validateCustomConfig();
                } else {
                    // 隐藏自定义配置
                    if (customConfig) {
                        customConfig.style.display = 'none';
                    }

                    // 应用预设配置
                    const config = VIEW_CONFIG.PRESET_CONFIGS[selectedPreset];
                    if (config) {
                        viewState.selectedCinemaSize = config;
                    }
                }

                // 更新按钮状态
                updateConfigNextButton();
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
            validateCustomConfig();
            if (viewState.cinemaConfigSelected) {
                viewState.selectedCinemaSize = { rows, cols, name: '自定义' };
            }
        }
        updateConfigNextButton();
    };

    if (customRowsInput) {
        customRowsInput.addEventListener('input', updateCustomConfig);
    }
    if (customSeatsInput) {
        customSeatsInput.addEventListener('input', updateCustomConfig);
    }

    // 初始状态：没有选择任何配置
    viewState.cinemaConfigSelected = false;
    updateConfigNextButton();
}

/**
 * 验证自定义配置
 */
function validateCustomConfig() {
    const customRowsInput = document.getElementById('custom-rows');
    const customSeatsInput = document.getElementById('custom-seats');

    const rows = parseInt(customRowsInput?.value) || 0;
    const cols = parseInt(customSeatsInput?.value) || 0;

    // 验证自定义配置是否有效
    const isValid = rows >= 5 && rows <= 20 && cols >= 10 && cols <= 30;

    if (isValid) {
        viewState.cinemaConfigSelected = true;
        applyConfigToModules(rows, cols, '自定义');
    } else {
        viewState.cinemaConfigSelected = false;
    }

    updateConfigNextButton();
}

// ========================= 按钮状态管理 =========================

/**
 * 初始化按钮状态管理
 */
function initializeButtonStates() {
    // 初始化时设置按钮为禁用状态
    updateConfigNextButton();
    updateMovieNextButton();

    // 监听电影选择变化
    initializeMovieSelection();
}

/**
 * 更新配置页面的下一步按钮状态
 */
function updateConfigNextButton() {
    const nextButton = document.getElementById('next-to-movie');
    if (!nextButton) return;

    if (viewState.cinemaConfigSelected) {
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
function updateMovieNextButton() {
    const nextButton = document.getElementById('next-to-seat');
    if (!nextButton) return;

    if (viewState.selectedMovie) {
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
function initializeMovieSelection() {
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
            viewState.selectedMovie = movieItem.dataset.movie;

            viewState.selectedMovieInfo = {
                id: movieItem.dataset.movie,
                title: movieItem.querySelector('h3').textContent,
                startTime: movieItem.querySelector('.movie-time').textContent,
                price: movieItem.querySelector('.movie-price').textContent,
                image: movieItem.querySelector('img').src
            };

            // 更新按钮状态
            updateMovieNextButton();

            console.log(`选择了电影: ${viewState.selectedMovie}`);
        }
    });
}

// ========================= 其他功能函数 =========================

/**
 * 处理支付确认
 */
function handlePaymentConfirmation() {
    // 生成订单信息
    const latestOrder = window.CinemaData && window.CinemaData.getLatestOrder ? window.CinemaData.getLatestOrder() : null;
    const orderNumberElement = document.getElementById('order-number');
    const purchaseTimeElement = document.getElementById('purchase-time');
    if (latestOrder) {
        if (orderNumberElement) orderNumberElement.textContent = latestOrder.ticketId || latestOrder.id || '';
        if (purchaseTimeElement) purchaseTimeElement.textContent = latestOrder.paidAt ? new Date(latestOrder.paidAt).toLocaleString('zh-CN') : (latestOrder.createdAt ? new Date(latestOrder.createdAt).toLocaleString('zh-CN') : '');
    } else {
        if (orderNumberElement) orderNumberElement.textContent = '';
        if (purchaseTimeElement) purchaseTimeElement.textContent = '';
    }
    // 显示订单确认视图
    switchToView('confirm');
}

/**
 * 根据视图处理背景切换
 * @param {string} viewName - 视图名称
 */
function handleBackgroundForView(viewName) {
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
 * 记录座位状态（从ui-core.js移过来）
 */
function logSeatStatus() {
    if (window.CinemaData) {
        const config = window.CinemaData.getCurrentConfig();
        console.log('=== 当前座位状态 ===');

        // 创建状态统计对象
        let statusStats = {
            'available': 0,
            'selected': 0,
            'sold': 0,
            'reserved': 0
        };

        // 获取并记录所有座位状态
        for (let row = 1; row <= config.TOTAL_ROWS; row++) {
            for (let col = 1; col <= config.SEATS_PER_ROW; col++) {
                const seat = window.CinemaData.getSeat(row, col);
                if (seat) {
                    statusStats[seat.status] = (statusStats[seat.status] || 0) + 1;
                }
            }
        }

        // 输出状态统计
        console.log('状态统计:', statusStats);

        // 获取已选座位并输出详细信息
        if (window.StateManager && window.StateManager.getSelectedSeats) {
            const selectedSeats = window.StateManager.getSelectedSeats();
            console.log('已选座位:', selectedSeats.length > 0 ?
                selectedSeats.map(s => `${s.row}排${s.col}座`).join(', ') :
                '无');
        }

        console.log('=====================');
    } else {
        console.warn('CinemaData模块未加载，无法获取座位状态');
    }
}

/**
 * 将配置应用到各个模块
 * @param {number} rows - 行数
 * @param {number} cols - 列数
 * @param {string} name - 配置名称
 */
function applyConfigToModules(rows, cols, name, movieId = null) {
    console.log(`🔧 应用影厅配置: ${name} (${rows}行 × ${cols}列)，电影ID:${movieId}`);

    // 1. 如果已经在选座界面，更新 Canvas 显示
    if (window.initializeAndDrawCinema && typeof window.initializeAndDrawCinema === 'function') {
        // 延迟执行，确保数据已经更新
        setTimeout(() => {
            window.initializeAndDrawCinema();
            console.log(`✅ Canvas 显示已更新`);
        }, 50);
    }

    // 2. 如果状态管理器已初始化，刷新数据
    if (window.StateManager && typeof window.StateManager.loadInitialSeatsData === 'function') {
        window.StateManager.loadInitialSeatsData();
        console.log(`✅ StateManager 数据已刷新`);
    }

    // 3. 更新UI显示的统计信息
    updateCinemaStatusDisplay();

    // 4. 显示配置更改提示
    showMessage(`影厅配置已更新为：${name}`, 'success');
}

/**
 * 更新影厅状态显示
 */
function updateCinemaStatusDisplay() {
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
 * 重置到开始状态
 */
function resetToStart() {
    viewState.currentView = 'config';
    viewState.viewHistory = ['config'];

    // 重置背景为田野背景
    if (window.movieSelector) {
        window.movieSelector.restoreConfigBackground();
    }

    switchToView('config');
    resetAllForms();
    showMessage('已重置，可以开始新的订单', 'info');
}

/**
 * 重置所有表单数据
 */
function resetAllForms() {
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

// ========================= 工具函数 =========================

/**
 * 显示消息提示
 */
function showMessage(message, type = 'info') {
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
        background: ${getMessageColor(type)};
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

function getMessageColor(type) {
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
function showLoading(text = '正在加载...') {
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
function hideLoading() {
    const loadingOverlay = document.getElementById('loading-overlay');
    if (loadingOverlay) {
        loadingOverlay.style.display = 'none';
    }
}

// ========================= 模块导出 =========================

// 在浏览器环境中，将函数暴露到全局
if (typeof window !== 'undefined') {
    window.UIViewController = {
        // 核心初始化
        initializeViewController,

        // 视图切换
        switchToView,
        canNavigateToView,

        // 导航管理
        updateNavigationSteps,
        isViewCompleted,

        // 视图激活回调
        onViewChanged,
        onConfigViewActivated,
        onMovieViewActivated,
        onSeatViewActivated,
        onPaymentViewActivated,
        onConfirmViewActivated,

        // 配置管理
        initializeCinemaConfigSelector,
        validateCustomConfig,
        applyConfigToModules,

        // 按钮状态管理
        initializeButtonStates,
        updateConfigNextButton,
        updateMovieNextButton,

        // 其他功能
        handlePaymentConfirmation,
        resetToStart,
        resetAllForms,
        logSeatStatus,
        updateCinemaStatusDisplay,

        // 工具函数
        showMessage,
        showLoading,
        hideLoading,

        // 状态访问
        getViewState: () => viewState,
        VIEW_CONFIG,
        viewState
    };
}

// 页面加载完成后自动初始化
document.addEventListener('DOMContentLoaded', function () {
    console.log('页面加载完成，初始化视图控制器');

    // 等待其他模块加载完成后再初始化
    setTimeout(() => {
        initializeViewController();
        console.log('视图控制器初始化完成');
    }, 100);
});

console.log('视图控制器模块已加载');