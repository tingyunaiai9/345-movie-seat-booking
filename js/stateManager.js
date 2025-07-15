/**
 * 电影院票务系统 - 交互逻辑与状态管理模块
 * 角色三：交互逻辑与状态管理器
 * 主要职责：负责项目的"指挥中枢"，处理所有用户交互，管理座位状态的变更，连接视觉与算法。
 */

// ========================= 常量定义 =========================
const INTERACTION_CONFIG = {
    // 选座模式
    MODE: {
        SINGLE: 'single',     // 单选模式
        MULTI: 'multi'        // 多选模式（Ctrl+点击）
    },

    // 键盘按键
    KEYS: {
        CTRL: 'Control',      // Windows上的Ctrl键
        META: 'Meta'          // Mac上的Command键
    }
};

// ========================= 全局状态变量 =========================
let globalState = {
    // Canvas相关
    canvasElement: null,
    canvasRect: null,

    // 交互状态
    hoveredSeat: null,        // 当前悬停的座位

    // 键盘状态
    isCtrlPressed: false,

    // 初始化状态
    isInitialized: false
};

// ========================= 初始化函数 =========================

/**
 * 初始化状态管理器
 * @param {string} canvasId - Canvas元素的ID
 */
function initializeStateManager(canvasId) {
    try {
        // 获取Canvas元素
        globalState.canvasElement = document.getElementById(canvasId);
        if (!globalState.canvasElement) {
            throw new Error(`未找到ID为 ${canvasId} 的Canvas元素`);
        }

        // 更新Canvas位置信息
        globalState.canvasRect = globalState.canvasElement.getBoundingClientRect();

        // 绑定事件监听器
        globalState.canvasElement.addEventListener('click', handleCanvasClick);
        globalState.canvasElement.addEventListener('mousemove', handleCanvasMouseMove);
        globalState.canvasElement.addEventListener('mouseleave', handleCanvasMouseLeave);
        document.addEventListener('keydown', handleKeyDown);
        document.addEventListener('keyup', handleKeyUp);
        window.addEventListener('resize', () => {
            if (globalState.canvasElement) {
                globalState.canvasRect = globalState.canvasElement.getBoundingClientRect();
            }
        });

        // 检查是否有CinemaData模块
        if (!window.CinemaData) {
            console.warn('CinemaData模块未加载，无法获取座位数据');
        } else {
            const config = window.CinemaData.getCurrentConfig();
            console.log(`状态管理器已连接到 ${config.TOTAL_ROWS}x${config.SEATS_PER_ROW} 的影厅`);
        }

        globalState.isInitialized = true;
        console.log('状态管理器初始化成功');

    } catch (error) {
        console.error('状态管理器初始化失败:', error);
    }
}

// ========================= 鼠标事件处理函数 =========================

/**
 * 获取鼠标相对Canvas的位置
 * @param {MouseEvent} event - 鼠标事件
 * @returns {Object} 鼠标位置坐标 {x, y}
 */
function getMousePosition(event) {
    globalState.canvasRect = globalState.canvasElement.getBoundingClientRect();
    const rect = globalState.canvasRect;
    const canvas = globalState.canvasElement;
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;

    return {
        x: (event.clientX - rect.left) * scaleX,
        y: (event.clientY - rect.top) * scaleY
    };
}

/**
 * 执行座位命中检测
 * @param {Object} mousePos - 鼠标位置 {x, y}
 * @returns {Object|null} 命中的座位对象或null
 */
function performSeatHitDetection(mousePos) {
    if (!window.CinemaData) return null;
    
    const config = window.CinemaData.getCurrentConfig();
    
    // 直接在此函数中遍历所有座位，避免创建临时数组
    for (let row = 1; row <= config.TOTAL_ROWS; row++) {
        for (let col = 1; col <= config.SEATS_PER_ROW; col++) {
            const seat = window.CinemaData.getSeat(row, col);
            if (seat) {
                // 为UI添加悬停状态
                seat.isHovered = (globalState.hoveredSeat &&
                    globalState.hoveredSeat.row === seat.row &&
                    globalState.hoveredSeat.col === seat.col);
                
                // 计算座位位置并检查命中
                const seatPos = window.CanvasRenderer.calculateSeatPosition(seat);
                const distance = Math.sqrt(Math.pow(mousePos.x - seatPos.x, 2) + Math.pow(mousePos.y - seatPos.y, 2));
                const detectionRadius = seat.isHovered ?
                    window.CanvasRenderer.CANVAS_CONFIG.SEAT_RADIUS * 1.2 :
                    window.CanvasRenderer.CANVAS_CONFIG.SEAT_RADIUS;

                if (distance <= detectionRadius) {
                    return seat;
                }
            }
        }
    }

    return null;
}

/**
 * 处理Canvas点击事件
 * @param {MouseEvent} event - 鼠标点击事件
 */
function handleCanvasClick(event) {
    if (!globalState.isInitialized || !window.CinemaData) return;

    // 获取鼠标相对位置
    const mousePos = getMousePosition(event);

    // 执行命中检测
    const hitSeat = performSeatHitDetection(mousePos);

    if (hitSeat) {
        // 处理座位点击逻辑
        if (hitSeat.status !== 'available' && hitSeat.status !== 'selected') {
            console.log(`座位 ${hitSeat.row}-${hitSeat.col} 不可选择（状态：${hitSeat.status}）`);
            return;
        }

        // 根据Ctrl键状态决定选择模式
        if (globalState.isCtrlPressed) {
            // 多选模式
            if (hitSeat.status === 'available') {
                selectSeat(hitSeat);
            } else if (hitSeat.status === 'selected') {
                deselectSeat(hitSeat);
            }
        } else {
            // 单选模式：如果点击的是已选中的座位，则取消选择；否则清除其他选择，选择当前座位
            if (hitSeat.status === 'selected') {
                deselectSeat(hitSeat);
            } else {
                clearAllSelections();
                selectSeat(hitSeat);
            }
        }

        // 触发界面重绘
        if (window.CanvasRenderer && typeof window.CanvasRenderer.drawCinema === 'function') {
            console.log('触发界面重绘');
            window.CanvasRenderer.refreshCinemaDisplay();
        }

        // 重要：无论是单选还是多选模式，都确保调用通知函数
        notifySelectionChange();
        console.log('通知选座状态变化');
    }
}/**
 * 处理Canvas鼠标移动事件
 * @param {MouseEvent} event - 鼠标移动事件
 */
function handleCanvasMouseMove(event) {
    if (!globalState.isInitialized || !window.CinemaData) return;

    // 获取鼠标相对位置
    const mousePos = getMousePosition(event);

    // 执行命中检测
    const hitSeat = performSeatHitDetection(mousePos);

    // 更新悬停状态
    if (globalState.hoveredSeat) {
        globalState.hoveredSeat.isHovered = false;
    }
    globalState.hoveredSeat = hitSeat;
    if (hitSeat) {
        hitSeat.isHovered = true;
    }

    // 直接调用Canvas重绘
    if (window.CanvasRenderer && typeof window.CanvasRenderer.drawCinema === 'function') {
        window.CanvasRenderer.refreshCinemaDisplay();
    }
}

/**
 * 处理Canvas鼠标离开事件
 */
function handleCanvasMouseLeave() {
    // 更新悬停状态
    if (globalState.hoveredSeat) {
        globalState.hoveredSeat.isHovered = false;
    }
    globalState.hoveredSeat = null;

    // 直接调用Canvas重绘
    if (window.CanvasRenderer && typeof window.CanvasRenderer.drawCinema === 'function') {
        window.CanvasRenderer.refreshCinemaDisplay();
    }
}

// ========================= 键盘事件处理函数 =========================

/**
 * 处理键盘按下事件
 * @param {KeyboardEvent} event - 键盘事件
 */
function handleKeyDown(event) {
    if (event.key === INTERACTION_CONFIG.KEYS.CTRL || event.key === INTERACTION_CONFIG.KEYS.META) {
        globalState.isCtrlPressed = true;
    }
}

/**
 * 处理键盘释放事件
 * @param {KeyboardEvent} event - 键盘事件
 */
function handleKeyUp(event) {
    if (event.key === INTERACTION_CONFIG.KEYS.CTRL || event.key === INTERACTION_CONFIG.KEYS.META) {
        globalState.isCtrlPressed = false;
    }
}

// ========================= 核心交互逻辑 =========================

/**
 * 选择一个座位
 * @param {Object} seat - 座位对象
 * @returns {boolean} 操作是否成功
 */
function selectSeat(seat) {
    if (seat && seat.status === 'available') {
        // 使用 main.js 中的 setSeat 函数修改座位状态
        const success = window.CinemaData.setSeat(seat.row, seat.col, 'selected');
        if (success) {
            console.log(`座位 ${seat.row}-${seat.col} 已选择`);
            return true;
        }
    }
    return false;
}

/**
 * 取消选择一个座位
 * @param {Object} seat - 座位对象
 * @returns {boolean} 操作是否成功
 */
function deselectSeat(seat) {
    if (seat && seat.status === 'selected') {
        const success = window.CinemaData.setSeat(seat.row, seat.col, 'available');
        if (success) {
            console.log(`座位 ${seat.row}-${seat.col} 已取消选择`);

            // 立即更新UI和重绘
            if (window.CanvasRenderer && typeof window.CanvasRenderer.drawCinema === 'function') {
                window.CanvasRenderer.refreshCinemaDisplay();
            }
            notifySelectionChange();
            return true;
        }
    }
    return false;
}

/**
 * 清除所有座位的选中状态，将它们恢复为可用
 */
function clearAllSelections() {
    if (!window.CinemaData) return;

    const selectedSeats = getSelectedSeats();
    selectedSeats.forEach(seat => {
        window.CinemaData.setSeat(seat.row, seat.col, 'available');
    });

    console.log('已清除所有选择');
    if (window.CanvasRenderer && typeof window.CanvasRenderer.drawCinema === 'function') {
        window.CanvasRenderer.refreshCinemaDisplay();
    }
    notifySelectionChange();
}

// ========================= 业务逻辑接口 =========================

/**
 * 执行自动选座（个人）
 * @param {Object} userInfo - 用户信息 [{age: number, name: string}, ...]
 */
function performAutoIndividualSelection(userInfo) {
    if (!window.CinemaData) {
        console.error('CinemaData模块未加载');
        return;
    }

    clearAllSelections();

    const recommendedSeat = window.CinemaData.findSeatForIndividual(userInfo);
    if (recommendedSeat && recommendedSeat.length > 0) {
        recommendedSeat.forEach(seat => {
            selectSeat(seat);
        });
        if (window.CanvasRenderer && typeof window.CanvasRenderer.drawCinema === 'function') {
            window.CanvasRenderer.refreshCinemaDisplay();
        }
        notifySelectionChange();
        console.log(`自动选座成功：${recommendedSeat.length}个座位`);
    } else {
        console.log('未找到合适的座位');
    }
}

/**
 * 执行自动选座（团体）
 * @param {Array} groupInfo - 团体信息 [{age: number, name: string}, ...]
 */
function performAutoGroupSelection(groupInfo) {
    if (!window.CinemaData) {
        console.error('CinemaData模块未加载');
        return;
    }

    clearAllSelections();

    const recommendedSeats = window.CinemaData.findSeatsForGroup(groupInfo);
    if (recommendedSeats && recommendedSeats.length > 0) {
        recommendedSeats.forEach(seat => {
            selectSeat(seat);
        });

        if (window.CanvasRenderer && typeof window.CanvasRenderer.drawCinema === 'function') {
            window.CanvasRenderer.refreshCinemaDisplay();
        }
        notifySelectionChange();
        console.log(`自动团体选座成功：${recommendedSeats.length}个座位`);
    } else {
        console.log('未找到合适的座位组合');
    }
}

/**
 * 执行预订操作
 * @param {Object} customerInfo - 客户信息
 * @returns {Object} 预订结果
 */
function performReservation(customerInfo) {
    if (!window.CinemaData) {
        console.error('CinemaData模块未加载');
        return { success: false, message: 'CinemaData模块未加载' };
    }

    // 获取选中的座位（从本模块获取）
    const selectedSeats = getSelectedSeats();
    if (selectedSeats.length === 0) {
        return { success: false, message: '请先选择座位' };
    }

    const result = window.CinemaData.reserveTickets(selectedSeats, customerInfo);

    if (result.success) {
        if (window.CanvasRenderer && typeof window.CanvasRenderer.drawCinema === 'function') {
            window.CanvasRenderer.refreshCinemaDisplay();
        }
        notifySelectionChange();
    }

    return result;
}

/**
 * 执行购票操作
 * @param {Object} customerInfo - 客户信息
 * @returns {Object} 购票结果
 */
function performPurchase(customerInfo) {
    if (!window.CinemaData) {
        console.error('CinemaData模块未加载');
        return { success: false, message: 'CinemaData模块未加载' };
    }

    // 获取选中的座位（从本模块获取）
    const selectedSeats = getSelectedSeats();
    if (selectedSeats.length === 0) {
        return { success: false, message: '请先选择座位' };
    }

    const result = window.CinemaData.purchaseTickets(selectedSeats, customerInfo);

    if (result.success) {
        if (window.CanvasRenderer && typeof window.CanvasRenderer.drawCinema === 'function') {
            window.CanvasRenderer.refreshCinemaDisplay();
        }
        notifySelectionChange();
    }

    return result;
}

// ========================= 通知函数 =========================

/**
 * 通知选座状态变化
 */
function notifySelectionChange() {
    // 获取选中的座位（直接从本模块获取）
    const selectedSeats = getSelectedSeats();

    // 从 localStorage 获取电影票价
    let ticketPrice = 45; // 默认价格
    try {
        const movieData = JSON.parse(localStorage.getItem('selectedMovieInfo'));
        if (movieData && movieData.price) {
            ticketPrice = Number(movieData.price);
        }
    } catch (e) {
        console.warn('无法从 localStorage 获取电影票价，使用默认价格:', e);
    }

    const totalPrice = selectedSeats.length * ticketPrice;

    // 发送自定义事件
    const event = new CustomEvent('seatSelectionChange', {
        detail: {
            selectedSeats: selectedSeats,
            selectedCount: selectedSeats.length,
            totalPrice: totalPrice
        }
    });
    document.dispatchEvent(event);

    // 直接更新UI显示
    const selectedList = document.getElementById('selected-seats-list');
    const selectedCount = document.getElementById('selected-count');
    const totalPriceElement = document.getElementById('total-price');

    if (!selectedList || !selectedCount || !totalPriceElement) return;

    // 更新已选座位列表
    if (selectedSeats.length === 0) {
        selectedList.innerHTML = '<p class="no-selection">暂未选择座位</p>';
    } else {
        const seatsHtml = selectedSeats.map(seat =>
            `<div class="seat-tag" data-seat-id="${seat.id}">
                <span class="seat-number">${seat.row}排${seat.col}座</span>
                <button class="seat-remove" data-row="${seat.row}" data-col="${seat.col}">×</button>
            </div>`
        ).join('');
        selectedList.innerHTML = seatsHtml;

        // 为删除按钮添加点击事件
        const removeButtons = selectedList.querySelectorAll('.seat-remove');
        removeButtons.forEach(button => {
            button.addEventListener('click', function() {
                const row = parseInt(this.getAttribute('data-row'));
                const col = parseInt(this.getAttribute('data-col'));
                const seat = window.CinemaData.getSeat(row, col);
                if (seat) {
                    deselectSeat(seat);
                }
            });
        });
    }

    // 更新统计信息
    selectedCount.textContent = selectedSeats.length;
    totalPriceElement.textContent = `¥${totalPrice}`;

    // 更新按钮状态
    const nextButton = document.getElementById('next-to-payment');
    const reserveButton = document.getElementById('reserve-seats');
    const purchaseButton = document.getElementById('purchase-seats');

    const hasSelection = selectedSeats.length > 0;
    if (nextButton) nextButton.disabled = !hasSelection;
    if (reserveButton) reserveButton.disabled = !hasSelection;
    if (purchaseButton) purchaseButton.disabled = !hasSelection;
}
// ========================= 查询接口 =========================
/**
 * 获取所有当前被选中的座位
 * @returns {Array<Object>} 选中的座位对象数组
 */
function getSelectedSeats() {
    if (!window.CinemaData) return [];

    const config = window.CinemaData.getCurrentConfig();
    const selectedSeats = [];

    for (let row = 1; row <= config.TOTAL_ROWS; row++) {
        for (let col = 1; col <= config.SEATS_PER_ROW; col++) {
            const seat = window.CinemaData.getSeat(row, col);
            if (seat && seat.status === 'selected') {
                selectedSeats.push(seat);
            }
        }
    }

    return selectedSeats;
}

/**
 * 获取选中座位的数量
 * @returns {number} 选中座位数量
 */
function getSelectedCount() {
    const selectedSeats = getSelectedSeats();
    return selectedSeats.length;
}

/**
 * 获取状态管理器的当前状态
 * @returns {Object} 当前状态信息
 */
function getCurrentState() {
    return {
        isInitialized: globalState.isInitialized,
        selectedCount: getSelectedCount(),
        isCtrlPressed: globalState.isCtrlPressed,
        hoveredSeat: globalState.hoveredSeat ? `${globalState.hoveredSeat.row}-${globalState.hoveredSeat.col}` : null
    };
}

// ========================= 重置和清理 =========================

/**
 * 重置状态管理器
 */
function resetStateManager() {
    clearAllSelections();
    globalState.hoveredSeat = null;
    globalState.isCtrlPressed = false;

    if (window.CanvasRenderer && typeof window.CanvasRenderer.drawCinema === 'function') {
        window.CanvasRenderer.refreshCinemaDisplay();
    }
    notifySelectionChange();
    console.log('状态管理器已重置');
}

/**
 * 销毁状态管理器
 */
function destroyStateManager() {
    // 解绑事件监听器
    if (globalState.canvasElement) {
        globalState.canvasElement.removeEventListener('click', handleCanvasClick);
        globalState.canvasElement.removeEventListener('mousemove', handleCanvasMouseMove);
        globalState.canvasElement.removeEventListener('mouseleave', handleCanvasMouseLeave);
    }

    document.removeEventListener('keydown', handleKeyDown);
    document.removeEventListener('keyup', handleKeyUp);

    // 清理状态
    globalState.canvasElement = null;
    globalState.canvasRect = null;
    globalState.hoveredSeat = null;
    globalState.isInitialized = false;

    console.log('状态管理器已销毁');
}

// ========================= 模块导出 =========================

if (typeof window !== 'undefined') {
    window.StateManager = {
        // 初始化和生命周期
        initializeStateManager,
        resetStateManager,
        destroyStateManager,

        // 自动选座
        performAutoIndividualSelection,
        performAutoGroupSelection,

        // 票务操作
        performReservation,
        performPurchase,

        // 手动选座
        selectSeat,
        deselectSeat,
        clearAllSelections,

        // 查询接口
        getSelectedSeats,
        getSelectedCount,
        getCurrentState,

        // 通知函数
        notifySelectionChange
    };
}

console.log('交互逻辑与状态管理模块已加载');
