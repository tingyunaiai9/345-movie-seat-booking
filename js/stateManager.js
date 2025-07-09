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
    },

    // 座位状态（UI层面的状态，与main.js中的业务状态配合使用）
    SEAT_UI_STATUS: {
        // SELECTED: 'selected',     // 用户已选择（UI状态）
        HOVERED: 'hovered'        // 鼠标悬停（UI状态）
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

        // 更新Canvas位置信息
        if (globalState.canvasElement) {
            globalState.canvasRect = globalState.canvasElement.getBoundingClientRect();
        }

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

        // 加载初始座位数据
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

        globalState.isInitialized = true;
        console.log('状态管理器初始化成功');

    } catch (error) {
        console.error('状态管理器初始化失败:', error);
    }
}

// ========================= 鼠标事件处理函数 =========================

/**
 * 处理Canvas点击事件
 * @param {MouseEvent} event - 鼠标点击事件
 */
function handleCanvasClick(event) {
    if (!globalState.isInitialized) return;

    // 获取鼠标相对位置（内联）
    if (globalState.canvasElement) {
        globalState.canvasRect = globalState.canvasElement.getBoundingClientRect();
    }
    
    const rect = globalState.canvasRect;
    const canvas = globalState.canvasElement;
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    const mousePos = {
        x: (event.clientX - rect.left) * scaleX,
        y: (event.clientY - rect.top) * scaleY
    };

    // 执行命中检测（内联）
    let hitSeat = null;
    if (globalState.currentSeatsData) {
        for (const seat of globalState.currentSeatsData) {
            const seatPos = window.CanvasRenderer.calculateSeatPosition(seat);
            const distance = Math.sqrt(Math.pow(mousePos.x - seatPos.x, 2) + Math.pow(mousePos.y - seatPos.y, 2));
            const detectionRadius = seat.isHovered ? 
                window.CanvasRenderer.CANVAS_CONFIG.SEAT_RADIUS * 1.2 : 
                window.CanvasRenderer.CANVAS_CONFIG.SEAT_RADIUS;
                
            if (distance <= detectionRadius) {
                hitSeat = seat;
                break;
            }
        }
    }

    if (hitSeat) {
        // 处理座位点击逻辑（内联）
        if (hitSeat.status !== 'available' && hitSeat.status !== 'selected') {
            console.log(`座位 ${hitSeat.row}-${hitSeat.col} 不可选择（状态：${hitSeat.status}）`);
            return;
        }

        // 根据Ctrl键状态决定选择模式
        if (globalState.isCtrlPressed) {
            // 多选模式：切换选择状态
            if (hitSeat.status === 'selected') {
                deselectSeat(hitSeat);
            } else {
                selectSeat(hitSeat);
            }
        } else {
            // 单选模式：清除其他选择，只选择当前座位
            clearAllSelections();
            selectSeat(hitSeat);
        }

        // 触发界面重绘和状态变化通知
        triggerRedraw();
        notifySelectionChange();
    }
}

/**
 * 处理Canvas鼠标移动事件
 * @param {MouseEvent} event - 鼠标移动事件
 */
function handleCanvasMouseMove(event) {
    if (!globalState.isInitialized) return;

    // 获取鼠标相对位置（内联）
    if (globalState.canvasElement) {
        globalState.canvasRect = globalState.canvasElement.getBoundingClientRect();
    }
    
    const rect = globalState.canvasRect;
    const canvas = globalState.canvasElement;
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    const mousePos = {
        x: (event.clientX - rect.left) * scaleX,
        y: (event.clientY - rect.top) * scaleY
    };

    // 执行命中检测（内联）
    let hitSeat = null;
    if (globalState.currentSeatsData) {
        for (const seat of globalState.currentSeatsData) {
            const seatPos = window.CanvasRenderer.calculateSeatPosition(seat);
            const distance = Math.sqrt(Math.pow(mousePos.x - seatPos.x, 2) + Math.pow(mousePos.y - seatPos.y, 2));
            const detectionRadius = seat.isHovered ? 
                window.CanvasRenderer.CANVAS_CONFIG.SEAT_RADIUS * 1.2 : 
                window.CanvasRenderer.CANVAS_CONFIG.SEAT_RADIUS;
                
            if (distance <= detectionRadius) {
                hitSeat = seat;
                break;
            }
        }
    }

    // 更新悬停状态（内联）
    if (globalState.hoveredSeat) {
        globalState.hoveredSeat.isHovered = false;
    }
    globalState.hoveredSeat = hitSeat;
    if (hitSeat) {
        hitSeat.isHovered = true;
    }
    triggerRedraw();
}

/**
 * 处理Canvas鼠标离开事件
 */
function handleCanvasMouseLeave() {
    // 更新悬停状态（内联）
    if (globalState.hoveredSeat) {
        globalState.hoveredSeat.isHovered = false;
    }
    globalState.hoveredSeat = null;
    triggerRedraw();
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
 * 选择座位（直接使用main.js的selectSeat函数）
 * @param {Object} seat - 要选择的座位
 */
function selectSeat(seat) {
    if (!seat || seat.status === 'selected') return;

    // 直接调用main.js的selectSeat函数来修改cinemaSeats
    const success = window.CinemaData.selectSeat(seat.row, seat.col);
    if (success) {
        console.log(`座位 ${seat.row}-${seat.col} 已选择`);
        // 更新本地数据引用的状态
        seat.status = 'selected';
    }
}

/**
 * 取消选择座位（直接使用main.js的deselectSeat函数）
 * @param {Object} seat - 要取消选择的座位
 */
function deselectSeat(seat) {
    if (!seat || seat.status !== 'selected') return;

    // 直接调用main.js的deselectSeat函数来修改cinemaSeats
    const success = window.CinemaData.deselectSeat(seat.row, seat.col);
    if (success) {
        console.log(`座位 ${seat.row}-${seat.col} 已取消选择`);
        // 更新本地数据引用的状态
        seat.status = 'available';
        
        // 立即更新UI和重绘
        triggerRedraw();
        notifySelectionChange();
    }
}

/**
 * 清除所有选择（直接使用main.js的clearAllSelections函数）
 */
function clearAllSelections() {
    // 直接调用main.js的clearAllSelections函数
    window.CinemaData.clearAllSelections();
    
    // 更新本地数据引用的状态
    if (globalState.currentSeatsData) {
        globalState.currentSeatsData.forEach(seat => {
            if (seat.status === 'selected') {
                seat.status = 'available';
            }
        });
    }

    console.log('已清除所有选择');
    triggerRedraw();
    notifySelectionChange();
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

    // 获取选中的座位（从main.js）
    const selectedSeats = window.CinemaData.getSelectedSeats();
    if (selectedSeats.length === 0) {
        return { success: false, message: '请先选择座位' };
    }

    const result = window.CinemaData.reserveTickets(selectedSeats, customerInfo);

    if (result.success) {
        // 刷新座位数据状态（内联）
        if (window.CinemaData) {
            globalState.currentSeatsData.forEach(uiSeat => {
                const dataSeat = window.CinemaData.getSeat(uiSeat.row, uiSeat.col);
                if (dataSeat) {
                    uiSeat.status = dataSeat.status;
                }
            });
        }
        
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

    // 获取选中的座位（从main.js）
    const selectedSeats = window.CinemaData.getSelectedSeats();
    if (selectedSeats.length === 0) {
        return { success: false, message: '请先选择座位' };
    }

    const result = window.CinemaData.purchaseTickets(selectedSeats, customerInfo);

    if (result.success) {
        // 刷新座位数据状态（内联）
        if (window.CinemaData) {
            globalState.currentSeatsData.forEach(uiSeat => {
                const dataSeat = window.CinemaData.getSeat(uiSeat.row, uiSeat.col);
                if (dataSeat) {
                    uiSeat.status = dataSeat.status;
                }
            });
        }
        
        triggerRedraw();
        notifySelectionChange();
    }

    return result;
}

// ========================= 工具函数 =========================

/**
 * 触发Canvas重绘
 */
function triggerRedraw() {
    if (window.CanvasRenderer && typeof window.CanvasRenderer.drawCinema === 'function') {
        window.CanvasRenderer.GLOBAL_STATE.seatsArray = globalState.currentSeatsData;
        window.CanvasRenderer.drawCinema();
    }
}

/**
 * 通知选座状态变化
 */
function notifySelectionChange() {
    // 获取选中的座位（从main.js）
    const selectedSeats = window.CinemaData ? window.CinemaData.getSelectedSeats() : [];
    
    // 获取当前电影价格（内联）
    const activeMovie = document.querySelector('.movie-item.active');
    let ticketPrice = 45; // 默认价格
    if (activeMovie) {
        const priceText = activeMovie.querySelector('.movie-price').textContent;
        const price = priceText.match(/¥(\d+)/);
        if (price) ticketPrice = parseInt(price[1]);
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
                <button class="seat-remove" onclick="StateManager.deselectSeat(${JSON.stringify(seat).replace(/"/g, '&quot;')})">×</button>
            </div>`
        ).join('');
        selectedList.innerHTML = seatsHtml;
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
 * 获取当前选中的座位（从main.js获取）
 * @returns {Array} 选中的座位列表
 */
function getSelectedSeats() {
    return window.CinemaData ? window.CinemaData.getSelectedSeats() : [];
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

    // 重新加载座位数据（内联）
    if (window.CinemaData && typeof window.CinemaData.getCurrentConfig === 'function') {
        const config = window.CinemaData.getCurrentConfig();
        const seatsData = [];

        for (let row = 1; row <= config.TOTAL_ROWS; row++) {
            for (let col = 1; col <= config.SEATS_PER_ROW; col++) {
                const seat = window.CinemaData.getSeat(row, col);
                if (seat) {
                    seatsData.push({
                        ...seat,
                        isHovered: false
                    });
                }
            }
        }

        globalState.currentSeatsData = seatsData;
        console.log(`已重新加载 ${seatsData.length} 个座位数据`);
    }

    triggerRedraw();
    notifySelectionChange();
    console.log('状态管理器已重置');
}

/**
 * 销毁状态管理器
 */
function destroyStateManager() {
    // 解绑事件监听器（内联）
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
        clearAllSelections,

        // 查询接口
        getSelectedSeats,
        getSelectedCount,
        getCurrentState
    };
}

console.log('交互逻辑与状态管理模块已加载');