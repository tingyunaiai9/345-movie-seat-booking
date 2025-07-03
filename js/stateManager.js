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
        CTRL: 'Control'
    },
    
    // 座位状态（UI层面的状态，与main.js中的业务状态配合使用）
    SEAT_UI_STATUS: {
        SELECTED: 'selected',     // 用户已选择（UI状态）
        HOVERED: 'hovered'        // 鼠标悬停（UI状态）
    }
};

// ========================= 全局状态变量 =========================
let globalState = {
    // Canvas相关
    canvasElement: null,
    canvasRect: null,
    
    // 交互状态
    selectedSeats: [],        // 当前选中的座位列表
    hoveredSeat: null,        // 当前悬停的座位
    
    // 键盘状态
    isCtrlPressed: false,
    
    // 数据状态
    currentSeatsData: null,   // 当前座位数据的引用
    
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
        
        // 获取Canvas位置信息
        updateCanvasRect();
        
        // 绑定事件监听器
        bindEventListeners();
        
        // 获取初始座位数据
        loadInitialSeatsData();
        
        globalState.isInitialized = true;
        console.log('状态管理器初始化成功');
        
    } catch (error) {
        console.error('状态管理器初始化失败:', error);
    }
}

/**
 * 更新Canvas位置信息
 */
function updateCanvasRect() {
    if (globalState.canvasElement) {
        globalState.canvasRect = globalState.canvasElement.getBoundingClientRect();
    }
}

/**
 * 加载初始座位数据
 */
function loadInitialSeatsData() {
    if (window.CinemaData && typeof window.CinemaData.getCurrentConfig === 'function') {
        const config = window.CinemaData.getCurrentConfig();
        const seatsData = [];
        
        // 从main.js获取所有座位数据
        for (let row = 1; row <= config.TOTAL_ROWS; row++) {
            for (let col = 1; col <= config.SEATS_PER_ROW; col++) {
                const seat = window.CinemaData.getSeat(row, col);
                if (seat) {
                    seatsData.push({
                        ...seat,
                        isSelected: false,  // UI状态
                        isHovered: false    // UI状态
                    });
                }
            }
        }
        
        globalState.currentSeatsData = seatsData;
        console.log(`已加载 ${seatsData.length} 个座位数据`);
    } else {
        console.warn('CinemaData模块未加载，无法获取座位数据');
    }
}

// ========================= 事件监听器绑定 =========================

/**
 * 绑定所有事件监听器
 */
function bindEventListeners() {
    // Canvas事件
    globalState.canvasElement.addEventListener('click', handleCanvasClick);
    globalState.canvasElement.addEventListener('mousemove', handleCanvasMouseMove);
    globalState.canvasElement.addEventListener('mouseleave', handleCanvasMouseLeave);
    
    // 键盘事件
    document.addEventListener('keydown', handleKeyDown);
    document.addEventListener('keyup', handleKeyUp);
    
    // 窗口大小变化事件
    window.addEventListener('resize', handleWindowResize);
}

/**
 * 解绑所有事件监听器
 */
function unbindEventListeners() {
    if (globalState.canvasElement) {
        globalState.canvasElement.removeEventListener('click', handleCanvasClick);
        globalState.canvasElement.removeEventListener('mousemove', handleCanvasMouseMove);
        globalState.canvasElement.removeEventListener('mouseleave', handleCanvasMouseLeave);
    }
    
    document.removeEventListener('keydown', handleKeyDown);
    document.removeEventListener('keyup', handleKeyUp);
    window.removeEventListener('resize', handleWindowResize);
}

// ========================= 鼠标事件处理函数 =========================

/**
 * 处理Canvas点击事件
 * @param {MouseEvent} event - 鼠标点击事件
 */
function handleCanvasClick(event) {
    if (!globalState.isInitialized) return;
    
    const mousePos = getRelativeMousePosition(event);
    const hitSeat = performHitDetection(mousePos.x, mousePos.y);
    
    if (hitSeat) {
        handleSeatClick(hitSeat);
    }
}

/**
 * 处理Canvas鼠标移动事件
 * @param {MouseEvent} event - 鼠标移动事件
 */
function handleCanvasMouseMove(event) {
    if (!globalState.isInitialized) return;
    
    const mousePos = getRelativeMousePosition(event);
    const hitSeat = performHitDetection(mousePos.x, mousePos.y);
    
    // 更新悬停状态
    updateHoverState(hitSeat);
}

/**
 * 处理Canvas鼠标离开事件
 */
function handleCanvasMouseLeave() {
    updateHoverState(null);
}

/**
 * 处理窗口大小变化事件
 */
function handleWindowResize() {
    updateCanvasRect();
}

// ========================= 键盘事件处理函数 =========================

/**
 * 处理键盘按下事件
 * @param {KeyboardEvent} event - 键盘事件
 */
function handleKeyDown(event) {
    if (event.key === INTERACTION_CONFIG.KEYS.CTRL) {
        globalState.isCtrlPressed = true;
    }
}

/**
 * 处理键盘释放事件
 * @param {KeyboardEvent} event - 键盘事件
 */
function handleKeyUp(event) {
    if (event.key === INTERACTION_CONFIG.KEYS.CTRL) {
        globalState.isCtrlPressed = false;
    }
}

// ========================= 核心交互逻辑 =========================

/**
 * 处理座位点击逻辑
 * @param {Object} seat - 被点击的座位对象
 */
function handleSeatClick(seat) {
    // 检查座位是否可点击
    if (!isSeatClickable(seat)) {
        console.log(`座位 ${seat.row}-${seat.col} 不可选择（状态：${seat.status}）`);
        return;
    }
    
    // 根据Ctrl键状态决定选择模式
    if (globalState.isCtrlPressed) {
        // 多选模式：切换选择状态
        toggleSeatSelection(seat);
    } else {
        // 单选模式：清除其他选择，只选择当前座位
        clearAllSelections();
        selectSeat(seat);
    }
    
    // 触发界面重绘
    triggerRedraw();
    
    // 触发选座状态变化事件
    notifySelectionChange();
}

/**
 * 选择座位
 * @param {Object} seat - 要选择的座位
 */
function selectSeat(seat) {
    if (!seat || seat.isSelected) return;
    
    seat.isSelected = true;
    globalState.selectedSeats.push(seat);
    
    console.log(`座位 ${seat.row}-${seat.col} 已选择`);
}

/**
 * 取消选择座位
 * @param {Object} seat - 要取消选择的座位
 */
function deselectSeat(seat) {
    if (!seat || !seat.isSelected) return;
    
    seat.isSelected = false;
    const index = globalState.selectedSeats.findIndex(s => s.id === seat.id);
    if (index !== -1) {
        globalState.selectedSeats.splice(index, 1);
    }
    
    console.log(`座位 ${seat.row}-${seat.col} 已取消选择`);
}

/**
 * 切换座位选择状态
 * @param {Object} seat - 要切换的座位
 */
function toggleSeatSelection(seat) {
    if (seat.isSelected) {
        deselectSeat(seat);
    } else {
        selectSeat(seat);
    }
}

/**
 * 清除所有选择
 */
function clearAllSelections() {
    globalState.selectedSeats.forEach(seat => {
        seat.isSelected = false;
    });
    globalState.selectedSeats = [];
    
    console.log('已清除所有选择');
}

/**
 * 更新悬停状态
 * @param {Object|null} newHoveredSeat - 新的悬停座位
 */
function updateHoverState(newHoveredSeat) {
    // 清除之前的悬停状态
    if (globalState.hoveredSeat) {
        globalState.hoveredSeat.isHovered = false;
    }
    
    // 设置新的悬停状态
    globalState.hoveredSeat = newHoveredSeat;
    if (newHoveredSeat) {
        newHoveredSeat.isHovered = true;
    }
    
    // 触发重绘
    triggerRedraw();
}

// ========================= 命中检测算法 =========================

/**
 * 执行命中检测，判断鼠标点击的座位
 * @param {number} x - 鼠标相对于Canvas的X坐标
 * @param {number} y - 鼠标相对于Canvas的Y坐标
 * @returns {Object|null} 命中的座位对象或null
 */
function performHitDetection(x, y) {
    if (!globalState.currentSeatsData) return null;
    
    // 遍历所有座位，检查鼠标点击位置
    for (const seat of globalState.currentSeatsData) {
        const seatPos = calculateSeatPosition(seat);
        const distance = Math.sqrt(Math.pow(x - seatPos.x, 2) + Math.pow(y - seatPos.y, 2));
        
        // 使用座位半径进行命中检测
        if (distance <= window.CanvasRenderer.CANVAS_CONFIG.SEAT_RADIUS) {
            return seat;
        }
    }
    
    return null;
}

/**
 * 计算座位在Canvas上的位置
 * @param {Object} seat - 座位对象
 * @returns {Object} 座位的x,y坐标
 */
function calculateSeatPosition(seat) {
    // 使用canvas.js中的座位位置计算逻辑
    const { SEAT_RADIUS, ROW_SPACING, COL_SPACING, ARC_RADIUS, CIRCLE_CENTER, ANGLE_FACTOR } = window.CanvasRenderer.CANVAS_CONFIG;
    const { currentLayout, totalRows, totalCols, canvasWidth } = window.CanvasRenderer.GLOBAL_STATE;
    
    let x, y;
    
    if (currentLayout === 'parallel') {
        // 平行布局计算
        const seatWidth = SEAT_RADIUS * 2;
        const totalWidth = totalCols * (seatWidth + COL_SPACING) - COL_SPACING;
        const xOffset = (canvasWidth - totalWidth) / 2;
        const yOffset = 100; // 顶部留白
        
        x = xOffset + (seat.col - 1) * (seatWidth + COL_SPACING) + SEAT_RADIUS;
        y = yOffset + (seat.row - 1) * ROW_SPACING + SEAT_RADIUS;
    } else {
        // 弧形布局计算
        const angle = (seat.col - totalCols / 2) * ANGLE_FACTOR;
        const currentArcRadius = ARC_RADIUS + (seat.row - 1) * ROW_SPACING;
        x = canvasWidth / 2 + currentArcRadius * Math.sin(angle);
        y = CIRCLE_CENTER + currentArcRadius * Math.cos(angle);
    }
    
    return { x, y };
}

// ========================= 业务逻辑接口 =========================

/**
 * 执行自动选座（个人）
 * @param {Object} userInfo - 用户信息 {age: number, name: string}
 */
function performAutoIndividualSelection(userInfo) {
    if (!window.CinemaData) {
        console.error('CinemaData模块未加载');
        return;
    }
    
    clearAllSelections();
    
    const recommendedSeat = window.CinemaData.findSeatForIndividual(userInfo.age);
    if (recommendedSeat) {
        // 在UI数据中找到对应的座位
        const uiSeat = globalState.currentSeatsData.find(s => s.id === recommendedSeat.id);
        if (uiSeat) {
            selectSeat(uiSeat);
            triggerRedraw();
            notifySelectionChange();
            console.log(`自动选座成功：${uiSeat.row}-${uiSeat.col}`);
        }
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
        // 在UI数据中找到对应的座位
        recommendedSeats.forEach(seat => {
            const uiSeat = globalState.currentSeatsData.find(s => s.id === seat.id);
            if (uiSeat) {
                selectSeat(uiSeat);
            }
        });
        
        triggerRedraw();
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
    
    if (globalState.selectedSeats.length === 0) {
        return { success: false, message: '请先选择座位' };
    }
    
    // 调用main.js的预订函数
    const result = window.CinemaData.reserveTickets(globalState.selectedSeats, customerInfo);
    
    if (result.success) {
        // 更新UI状态
        refreshSeatsData();
        clearAllSelections();
        triggerRedraw();
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
    
    if (globalState.selectedSeats.length === 0) {
        return { success: false, message: '请先选择座位' };
    }
    
    // 调用main.js的购票函数
    const result = window.CinemaData.purchaseTickets(globalState.selectedSeats, customerInfo);
    
    if (result.success) {
        // 更新UI状态
        refreshSeatsData();
        clearAllSelections();
        triggerRedraw();
        notifySelectionChange();
    }
    
    return result;
}

// ========================= 工具函数 =========================

/**
 * 获取鼠标相对于Canvas的位置
 * @param {MouseEvent} event - 鼠标事件
 * @returns {Object} 相对位置 {x, y}
 */
function getRelativeMousePosition(event) {
    updateCanvasRect(); // 确保位置信息是最新的
    
    return {
        x: event.clientX - globalState.canvasRect.left,
        y: event.clientY - globalState.canvasRect.top
    };
}

/**
 * 检查座位是否可点击
 * @param {Object} seat - 座位对象
 * @returns {boolean} 是否可点击
 */
function isSeatClickable(seat) {
    // 只有available状态的座位才可以点击选择
    return seat.status === 'available';
}

/**
 * 刷新座位数据状态
 */
function refreshSeatsData() {
    if (!window.CinemaData) return;
    
    const config = window.CinemaData.getCurrentConfig();
    
    // 更新每个座位的状态
    globalState.currentSeatsData.forEach(uiSeat => {
        const dataSeat = window.CinemaData.getSeat(uiSeat.row, uiSeat.col);
        if (dataSeat) {
            uiSeat.status = dataSeat.status;
        }
    });
}

/**
 * 触发Canvas重绘
 */
function triggerRedraw() {
    if (window.CanvasRenderer && typeof window.CanvasRenderer.drawCinema === 'function') {
        // 更新Canvas渲染器的座位数据
        window.CanvasRenderer.GLOBAL_STATE.seatsArray = globalState.currentSeatsData;
        window.CanvasRenderer.drawCinema();
    }
}

/**
 * 通知选座状态变化
 */
function notifySelectionChange() {
    // 发送自定义事件，供其他模块监听
    const event = new CustomEvent('seatSelectionChange', {
        detail: {
            selectedSeats: globalState.selectedSeats,
            selectedCount: globalState.selectedSeats.length
        }
    });
    document.dispatchEvent(event);
}

// ========================= 查询接口 =========================

/**
 * 获取当前选中的座位
 * @returns {Array} 选中的座位列表
 */
function getSelectedSeats() {
    return [...globalState.selectedSeats];
}

/**
 * 获取选中座位的数量
 * @returns {number} 选中座位数量
 */
function getSelectedCount() {
    return globalState.selectedSeats.length;
}

/**
 * 检查是否有选中的座位
 * @returns {boolean} 是否有选中座位
 */
function hasSelectedSeats() {
    return globalState.selectedSeats.length > 0;
}

/**
 * 获取状态管理器的当前状态
 * @returns {Object} 当前状态信息
 */
function getCurrentState() {
    return {
        isInitialized: globalState.isInitialized,
        selectedCount: globalState.selectedSeats.length,
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
    
    // 重新加载座位数据
    loadInitialSeatsData();
    
    // 触发重绘
    triggerRedraw();
    notifySelectionChange();
    
    console.log('状态管理器已重置');
}

/**
 * 销毁状态管理器
 */
function destroyStateManager() {
    unbindEventListeners();
    
    globalState.canvasElement = null;
    globalState.canvasRect = null;
    globalState.selectedSeats = [];
    globalState.hoveredSeat = null;
    globalState.currentSeatsData = null;
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
        toggleSeatSelection,
        clearAllSelections,
        
        // 查询接口
        getSelectedSeats,
        getSelectedCount,
        hasSelectedSeats,
        getCurrentState,
        
        // 工具函数
        refreshSeatsData,
        triggerRedraw
    };
}

console.log('交互逻辑与状态管理模块已加载');