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
    console.log('📥 开始加载初始座位数据');

    if (!window.CinemaData || typeof window.CinemaData.getCurrentConfig !== 'function') {
        console.warn('❌ CinemaData模块未加载，无法获取座位数据');
        return;
    }

    const config = window.CinemaData.getCurrentConfig();
    console.log('⚙️ 获取到配置:', config);

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
            } else {
                console.warn(`⚠️ 无法获取座位 ${row}-${col} 的数据`);
            }
        }
    }

    globalState.currentSeatsData = seatsData;
    console.log(`✅ 已加载 ${seatsData.length} 个座位数据`);

    // 输出前几个座位的详细信息用于调试
    if (seatsData.length > 0) {
        console.log('🔍 前3个座位的详细信息:');
        seatsData.slice(0, 3).forEach(seat => {
            console.log(`  座位 ${seat.row}-${seat.col}:`, {
                id: seat.id,
                status: seat.status,
                isSelected: seat.isSelected,
                isHovered: seat.isHovered
            });
        });
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
    console.log('🖱️ Canvas点击事件触发');

    if (!globalState.isInitialized) {
        console.warn('❌ 状态管理器未初始化，忽略点击事件');
        return;
    }

    const mousePos = getRelativeMousePosition(event);
    console.log('📍 鼠标相对位置:', mousePos);

    const hitSeat = performHitDetection(mousePos.x, mousePos.y);
    console.log('🎯 命中检测结果:', hitSeat ? `座位 ${hitSeat.row}-${hitSeat.col}` : '未命中任何座位');

    if (hitSeat) {
        console.log('🪑 座位详细信息:', {
            id: hitSeat.id,
            row: hitSeat.row,
            col: hitSeat.col,
            status: hitSeat.status,
            isSelected: hitSeat.isSelected,
            isHovered: hitSeat.isHovered
        });
        handleSeatClick(hitSeat);
    } else {
        console.log('🚫 点击位置没有座位');
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

    // 只在悬停座位变化时输出日志
    if (hitSeat !== globalState.hoveredSeat) {
        console.log('👆 悬停座位变化:', {
            from: globalState.hoveredSeat ? `${globalState.hoveredSeat.row}-${globalState.hoveredSeat.col}` : 'null',
            to: hitSeat ? `${hitSeat.row}-${hitSeat.col}` : 'null'
        });
    }

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
    console.log('🎫 处理座位点击:', `${seat.row}-${seat.col}`);
    console.log('🎫 座位当前状态:', seat.status);
    console.log('🎫 座位是否已选中:', seat.isSelected);
    console.log('⌨️ Ctrl键是否按下:', globalState.isCtrlPressed);

    // 检查座位是否可点击
    if (!isSeatClickable(seat)) {
        console.warn(`❌ 座位 ${seat.row}-${seat.col} 不可选择（状态：${seat.status}）`);
        return;
    }

    console.log('✅ 座位可点击，开始处理选择逻辑');

    // 根据Ctrl键状态决定选择模式
    if (globalState.isCtrlPressed) {
        console.log('🔀 多选模式：切换选择状态');
        toggleSeatSelection(seat);
    } else {
        console.log('🔄 单选模式：清除其他选择，只选择当前座位');
        clearAllSelections();
        selectSeat(seat);
    }

    console.log('🎨 触发界面重绘');
    triggerRedraw();

    console.log('📢 触发选座状态变化事件');
    notifySelectionChange();
}

/**
 * 选择座位
 * @param {Object} seat - 要选择的座位
 */
function selectSeat(seat) {
    console.log('➕ 尝试选择座位:', `${seat.row}-${seat.col}`);

    if (!seat) {
        console.warn('❌ 座位对象为空，无法选择');
        return;
    }

    if (seat.isSelected) {
        console.log('⚠️ 座位已被选中，跳过选择');
        return;
    }

    seat.isSelected = true;
    globalState.selectedSeats.push(seat);

    console.log(`✅ 座位 ${seat.row}-${seat.col} 已选择`);
    console.log('📊 当前选中座位数:', globalState.selectedSeats.length);
    console.log('📋 选中座位列表:', globalState.selectedSeats.map(s => `${s.row}-${s.col}`));
}

/**
 * 取消选择座位
 * @param {Object} seat - 要取消选择的座位
 */
function deselectSeat(seat) {
    console.log('➖ 尝试取消选择座位:', `${seat.row}-${seat.col}`);

    if (!seat) {
        console.warn('❌ 座位对象为空，无法取消选择');
        return;
    }

    if (!seat.isSelected) {
        console.log('⚠️ 座位未被选中，跳过取消选择');
        return;
    }

    seat.isSelected = false;
    const index = globalState.selectedSeats.findIndex(s => s.id === seat.id);
    if (index !== -1) {
        globalState.selectedSeats.splice(index, 1);
        console.log(`✅ 座位 ${seat.row}-${seat.col} 已从选中列表中移除`);
    } else {
        console.warn(`⚠️ 座位 ${seat.row}-${seat.col} 不在选中列表中`);
    }

    console.log('📊 当前选中座位数:', globalState.selectedSeats.length);
    console.log('📋 选中座位列表:', globalState.selectedSeats.map(s => `${s.row}-${s.col}`));
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
    console.log('🗑️ 清除所有选择');
    console.log('📊 清除前选中座位数:', globalState.selectedSeats.length);

    globalState.selectedSeats.forEach(seat => {
        seat.isSelected = false;
        console.log(`🔄 取消选择座位: ${seat.row}-${seat.col}`);
    });
    globalState.selectedSeats = [];

    console.log('✅ 已清除所有选择');
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
    console.log('🔍 开始命中检测:', { x, y });

    if (!globalState.currentSeatsData) {
        console.warn('❌ 座位数据为空，无法进行命中检测');
        return null;
    }

    console.log('📊 座位数据总数:', globalState.currentSeatsData.length);

    // 检查Canvas渲染器是否可用
    if (!window.CanvasRenderer || !window.CanvasRenderer.CANVAS_CONFIG) {
        console.error('❌ CanvasRenderer模块未加载或配置缺失');
        return null;
    }

    const seatRadius = window.CanvasRenderer.CANVAS_CONFIG.SEAT_RADIUS;
    console.log('🎯 座位半径:', seatRadius);

    let closestSeat = null;
    let closestDistance = Infinity;

    // 遍历所有座位，检查鼠标点击位置
    for (const seat of globalState.currentSeatsData) {
        const seatPos = calculateSeatPosition(seat);
        if (!seatPos) {
            console.warn(`⚠️ 无法计算座位 ${seat.row}-${seat.col} 的位置`);
            continue;
        }

        const distance = Math.sqrt(Math.pow(x - seatPos.x, 2) + Math.pow(y - seatPos.y, 2));

        // 记录最近的座位用于调试
        if (distance < closestDistance) {
            closestDistance = distance;
            closestSeat = seat;
        }

        // 使用座位半径进行命中检测
        if (distance <= seatRadius) {
            console.log(`🎯 命中座位 ${seat.row}-${seat.col}:`, {
                seatPos,
                distance: distance.toFixed(2),
                seatRadius
            });
            return seat;
        }
    }

    console.log('🚫 未命中任何座位');
    console.log('🎯 最近的座位:', closestSeat ? {
        seat: `${closestSeat.row}-${closestSeat.col}`,
        distance: closestDistance.toFixed(2),
        seatRadius
    } : '无');

    return null;
}

/**
 * 计算座位在Canvas上的位置
 * @param {Object} seat - 座位对象
 * @returns {Object} 座位的x,y坐标
 */
function calculateSeatPosition(seat) {
    // 检查依赖模块
    if (!window.CanvasRenderer || !window.CanvasRenderer.CANVAS_CONFIG || !window.CanvasRenderer.GLOBAL_STATE) {
        console.error('❌ CanvasRenderer模块未完全加载');
        return null;
    }

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
    const clickable = seat.status === 'available';
    console.log('🔍 座位可点击性检查:', {
        seat: `${seat.row}-${seat.col}`,
        status: seat.status,
        clickable
    });
    return clickable;
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
    console.log('🎨 触发Canvas重绘');

    if (!window.CanvasRenderer || typeof window.CanvasRenderer.drawCinema !== 'function') {
        console.error('❌ CanvasRenderer模块未加载或drawCinema函数不存在');
        return;
    }

    // 更新Canvas渲染器的座位数据
    window.CanvasRenderer.GLOBAL_STATE.seatsArray = globalState.currentSeatsData;
    console.log('📊 更新Canvas渲染器座位数据，数量:', globalState.currentSeatsData.length);

    try {
        window.CanvasRenderer.drawCinema();
        console.log('✅ Canvas重绘完成');
    } catch (error) {
        console.error('❌ Canvas重绘失败:', error);
    }
}

/**
 * 通知选座状态变化
 */
function notifySelectionChange() {
    console.log('📢 发送选座状态变化事件');

    const eventDetail = {
        selectedSeats: globalState.selectedSeats,
        selectedCount: globalState.selectedSeats.length
    };

    console.log('📊 事件详情:', eventDetail);

    // 发送自定义事件，供其他模块监听
    const event = new CustomEvent('seatSelectionChange', {
        detail: eventDetail
    });

    document.dispatchEvent(event);
    console.log('✅ 选座状态变化事件已发送');
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