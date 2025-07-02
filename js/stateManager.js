/**
 * 电影院票务系统 - 交互逻辑与状态管理模块
 * 角色三：交互逻辑与状态管理器
 */

// ========================= 常量定义 =========================
const INTERACTION_CONFIG = {
    MODE: {
        MANUAL_SINGLE: 'manual_single',
        MANUAL_MULTI: 'manual_multi',
        AUTO_INDIVIDUAL: 'auto_individual',
        AUTO_GROUP: 'auto_group'
    },
    KEYS: {
        CTRL: 'Control',
        SHIFT: 'Shift',
        ALT: 'Alt'
    },
    OPERATION: {
        SELECT: 'select',
        DESELECT: 'deselect',
        RESERVE: 'reserve',
        PURCHASE: 'purchase',
        CANCEL: 'cancel',
        REFUND: 'refund'
    }
};

// ========================= 全局状态变量 =========================
let currentState = {
    interactionMode: INTERACTION_CONFIG.MODE.MANUAL_SINGLE,
    selectedSeats: [],
    keyboardState: {
        ctrlPressed: false,
        shiftPressed: false,
        altPressed: false
    },
    canvasElement: null,
    canvasRect: null,
    seatsData: null,
    currentUser: null,
    operationHistory: []
};

// ========================= 初始化函数 =========================

/**
 * 初始化状态管理器
 * @param {string} canvasId - Canvas元素ID
 * @param {Array} initialSeatsData - 初始座位数据
 */
function initializeStateManager(canvasId, initialSeatsData) {
    currentState.canvasElement = document.getElementById(canvasId);
    if (!currentState.canvasElement) {
        console.error('Canvas元素未找到');
        return;
    }
    currentState.canvasRect = currentState.canvasElement.getBoundingClientRect();
    currentState.seatsData = initialSeatsData;

    bindCanvasEventListeners();
    bindKeyboardEventListeners();
    triggerRedraw();
}

/**
 * 设置初始座位数据
 * @param {Array} seatsData - 座位数据数组
 */
function setSeatsData(seatsData) {
    currentState.seatsData = seatsData;
    triggerRedraw();
}

/**
 * 重置状态管理器
 */
function resetStateManager() {
    currentState.interactionMode = INTERACTION_CONFIG.MODE.MANUAL_SINGLE;
    currentState.selectedSeats = [];
    currentState.keyboardState = { ctrlPressed: false, shiftPressed: false, altPressed: false };
    currentState.operationHistory = [];
    triggerRedraw();
}

// ========================= 事件监听器绑定 =========================

/**
 * 绑定Canvas事件监听器
 */
function bindCanvasEventListeners() {
    currentState.canvasElement.addEventListener('click', handleCanvasClick);
    currentState.canvasElement.addEventListener('mousemove', handleCanvasMouseMove);
}

/**
 * 绑定键盘事件监听器
 */
function bindKeyboardEventListeners() {
    document.addEventListener('keydown', handleKeyDown);
    document.addEventListener('keyup', handleKeyUp);
}

/**
 * 解绑所有事件监听器
 */
function unbindEventListeners() {
    currentState.canvasElement.removeEventListener('click', handleCanvasClick);
    currentState.canvasElement.removeEventListener('mousemove', handleCanvasMouseMove);
    document.removeEventListener('keydown', handleKeyDown);
    document.removeEventListener('keyup', handleKeyUp);
}

// ========================= 鼠标事件处理函数 =========================

/**
 * 处理Canvas点击事件
 * @param {Event} event - 鼠标点击事件
 */
function handleCanvasClick(event) {
    const { x, y } = getRelativeMouseCoordinates(event);
    const seat = performHitDetection(x, y);
    if (seat) {
        handleSeatSelection(seat, currentState.keyboardState.ctrlPressed);
    }
}

/**
 * 处理Canvas鼠标移动事件
 * @param {Event} event - 鼠标移动事件
 */
function handleCanvasMouseMove(event) {
    const { x, y } = getRelativeMouseCoordinates(event);
    const seat = performHitDetection(x, y);
    if (seat) {
        seat.isHovered = true;
        triggerRedraw();
    }
}

// ========================= 键盘事件处理函数 =========================

/**
 * 处理键盘按下事件
 * @param {Event} event - 键盘事件
 */
function handleKeyDown(event) {
    if (event.key === INTERACTION_CONFIG.KEYS.CTRL) {
        currentState.keyboardState.ctrlPressed = true;
    }
}

/**
 * 处理键盘释放事件
 * @param {Event} event - 键盘事件
 */
function handleKeyUp(event) {
    if (event.key === INTERACTION_CONFIG.KEYS.CTRL) {
        currentState.keyboardState.ctrlPressed = false;
    }
}

// ========================= 座位操作函数 =========================

/**
 * 自动选座（个人）
 * @param {Object} userInfo - 用户信息（包含年龄等）
 */
function performAutoIndividualSelection(userInfo) {
    const seat = CinemaData.findSeatForIndividual(userInfo.age);
    if (seat) {
        handleSingleSelection(seat);
        triggerRedraw();
    } else {
        console.warn('未找到符合条件的座位');
    }
}

/**
 * 自动选座（团体）
 * @param {Array} groupInfo - 团体成员信息数组
 */
function performAutoGroupSelection(groupInfo) {
    const seats = CinemaData.findSeatsForGroup(groupInfo);
    if (seats && seats.length > 0) {
        currentState.selectedSeats = seats;
        triggerRedraw();
    } else {
        console.warn('未找到符合条件的座位');
    }
}

/**
 * 预订座位
 */
function performReservation() {
    const result = CinemaData.reserveTickets(currentState.selectedSeats, currentState.currentUser);
    if (result.success) {
        console.log(result.message);
        triggerRedraw();
    } else {
        console.error(result.message);
    }
}

/**
 * 购票
 */
function performPurchase() {
    const result = CinemaData.purchaseTickets(currentState.selectedSeats, currentState.currentUser);
    if (result.success) {
        console.log(result.message);
        triggerRedraw();
    } else {
        console.error(result.message);
    }
}

// ========================= 工具函数 =========================

/**
 * 执行座位命中检测
 * @param {number} x - 鼠标X坐标
 * @param {number} y - 鼠标Y坐标
 * @returns {Object|null} 命中的座位对象或null
 */
function performHitDetection(x, y) {
    if (!currentState.seatsData) return null;
    for (const seat of currentState.seatsData) {
        if (
            x >= seat.x &&
            x <= seat.x + seat.width &&
            y >= seat.y &&
            y <= seat.y + seat.height
        ) {
            return seat;
        }
    }
    return null;
}

/**
 * 获取鼠标相对于Canvas的坐标
 * @param {Event} event - 鼠标事件
 * @returns {Object} 相对坐标 {x, y}
 */
function getRelativeMouseCoordinates(event) {
    const rect = currentState.canvasRect;
    return {
        x: event.clientX - rect.left,
        y: event.clientY - rect.top
    };
}

/**
 * 触发Canvas重绘
 */
function triggerRedraw() {
    CanvasRenderer.drawCinema(currentState.seatsData, {}, 'arc');
}

// ========================= 模块导出 =========================

if (typeof window !== 'undefined') {
    window.StateManager = {
        initializeStateManager,
        setSeatsData,
        resetStateManager,
        performAutoIndividualSelection,
        performAutoGroupSelection,
        performReservation,
        performPurchase
    };
}

console.log('状态管理模块已加载');