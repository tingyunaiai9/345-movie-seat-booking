/**
 * 电影院票务系统 - 交互逻辑与状态管理模块
 * 角色三：交互逻辑与状态管理器
 * 具体任务:
 *  1. 为Canvas添加点击事件监听，并实现精确的“命中检测”逻辑，判断用户点击的具体座位。
    2. 实现手动选座的交互逻辑：
      - 支持鼠标单击座位进行单选
      - 支持按住Ctrl键+鼠标单击座位进行多选
    3. 管理座位数据状态的实时变更。当座位被选择、取消选择、购买或退票后，更新座位数组中的status字段。
    4. 在任何状态变更后，调用角色二的 drawCinema() 函数，触发Canvas重绘，刷新界面。
 */

// ========================= 常量定义 =========================
const INTERACTION_CONFIG = {
    // 交互模式
    MODE: {
        MANUAL_SINGLE: 'manual_single',     // 手动单选
        MANUAL_MULTI: 'manual_multi',       // 手动多选
        AUTO_INDIVIDUAL: 'auto_individual', // 自动个人选座
        AUTO_GROUP: 'auto_group'            // 自动团体选座
    },
    
    // 键盘按键
    KEYS: {
        CTRL: 'Control',
        SHIFT: 'Shift',
        ALT: 'Alt'
    },
    
    // 操作类型
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
    // 当前交互模式
    interactionMode: INTERACTION_CONFIG.MODE.MANUAL_SINGLE,
    
    // 当前选中的座位
    selectedSeats: [],
    
    // 键盘状态
    keyboardState: {
        ctrlPressed: false,
        shiftPressed: false,
        altPressed: false
    },
    
    // Canvas相关
    canvasElement: null,
    canvasRect: null,
    
    // 座位数据引用
    seatsData: null,
    
    // 当前用户信息
    currentUser: null,
    
    // 操作历史
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
    currentState.canvasElement.addEventListener('mouseenter', handleCanvasMouseEnter);
    currentState.canvasElement.addEventListener('mouseleave', handleCanvasMouseLeave);
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
    currentState.canvasElement.removeEventListener('mouseenter', handleCanvasMouseEnter);
    currentState.canvasElement.removeEventListener('mouseleave', handleCanvasMouseLeave);
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
        // 显示悬停效果
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
 * 处理座位选择
 * @param {Object} seat - 座位对象
 * @param {boolean} isCtrlPressed - 是否按下Ctrl键
 */
function handleSeatSelection(seat, isCtrlPressed) {
    if (!isSeatSelectable(seat)) return;

    if (isCtrlPressed) {
        handleMultiSelection(seat);
    } else {
        handleSingleSelection(seat);
    }
    triggerRedraw();
}

/**
 * 单选模式座位选择
 * @param {Object} seat - 座位对象
 */
function handleSingleSelection(seat) {
    currentState.selectedSeats = [seat];
}

/**
 * 多选模式座位选择
 * @param {Object} seat - 座位对象
 */
function handleMultiSelection(seat) {
    const index = currentState.selectedSeats.indexOf(seat);
    if (index === -1) {
        currentState.selectedSeats.push(seat);
    } else {
        currentState.selectedSeats.splice(index, 1);
    }
}

/**
 * 检查座位是否可选
 * @param {Object} seat - 座位对象
 * @returns {boolean} 是否可选
 */
function isSeatSelectable(seat) {
    return seat.status === 'available';
}

/**
 * 更新Canvas矩形信息
 */
function updateCanvasRect() {
    currentState.canvasRect = currentState.canvasElement.getBoundingClientRect();
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
 * @param {Object} options - 重绘选项
 */
function triggerRedraw(options = {}) {
    if (typeof drawCinema === 'function') {
        drawCinema(currentState.seatsData, options);
    }
}



// 如果在浏览器环境中，将函数暴露到全局
if (typeof window !== 'undefined') {
    window.StateManager = {
        initializeStateManager,
        setInteractionMode,
        performAutoIndividualSelection,
        performAutoGroupSelection,
        performReservation,
        performPurchase,
        getSelectedSeats,
        clearAllSelections,
        addEventListener
    };
}

console.log('状态管理模块已加载');