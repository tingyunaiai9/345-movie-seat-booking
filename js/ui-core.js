/**
 * 电影院票务系统 - 核心UI管理模块
 * 负责系统初始化、视图切换、基础配置等核心功能
 */

// ========================= 常量定义 =========================
const UI_CONFIG = {
    // 视图状态
    VIEWS: {
        CONFIG: 'config-view',
        MOVIE: 'movie-view',
        SEAT: 'seat-view',
        PAYMENT: 'payment-view',
        CONFIRM: 'confirm-view',
        FINAL: 'final-view' // 最终展示的页面
    },

    // 票务类型
    TICKET_TYPES: {
        INDIVIDUAL: 'individual',
        GROUP: 'group'
    }
};

// ========================= 全局状态变量 =========================
let uiState = {
    currentView: UI_CONFIG.VIEWS.CONFIG,
    ticketType: UI_CONFIG.TICKET_TYPES.INDIVIDUAL,
    memberCount: 0,
    maxMembers: 20,
    systemInitialized: false
};

// ========================= 初始化函数 =========================

/**
 * 初始化UI系统
 */
function initializeUI() {
    console.log('UI模块开始初始化...');

    // 绑定所有事件监听器
    bindUIEvents();

    // 初始化票务类型控制
    initializeTicketTypeControl();

    // 初始化页面导航
    initializeNavigation();
    initializeCinemaSeats();

    // 初始化支付方式选择
    initializePaymentMethods();

    // 设置默认状态
    setDefaultStates();

    // 🔑 关键修复：初始化StateManager
    setTimeout(() => {
        if (window.StateManager && window.StateManager.initializeStateManager) {
            window.StateManager.initializeStateManager('cinema-canvas');
            console.log('StateManager已初始化 - Canvas现在可以点击了');
        } else {
            console.error('StateManager模块未加载或initializeStateManager方法不存在');
        }
    }, 200); // 延迟确保Canvas已经创建

    uiState.systemInitialized = true;
    console.log('UI模块初始化完成');
}

// ========================= 视图管理函数 =========================

/**
 * 切换视图
 * @param {string} viewId - 目标视图ID
 * @param {Object} options - 切换选项
 * @param {boolean} options.preserveSeats - 是否保留选座数据
 */
function switchView(viewId, options = {}) {
    console.log('切换到视图:', viewId);

    // 隐藏所有视图
    const views = document.querySelectorAll('.view');
    views.forEach(view => {
        view.classList.remove('active');
    });

    // 显示目标视图
    const targetView = document.getElementById(viewId);
    if (targetView) {
        targetView.classList.add('active');
        uiState.currentView = viewId;

        // 如果切换到座位选择页面
        if (viewId === UI_CONFIG.VIEWS.SEAT) {
            setTimeout(() => {
                // 无论如何都刷新Canvas显示
                if (window.CanvasRenderer && window.CanvasRenderer.refreshCinemaDisplay) {
                    window.CanvasRenderer.refreshCinemaDisplay();
                    console.log('座位视图已刷新');
                    
                    // 添加：在控制台显示当前所有座位的状态
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
            }, 100);
        }
        
        // 如果切换到支付页面，更新支付页面数据
        if (viewId === UI_CONFIG.VIEWS.PAYMENT) {
            setTimeout(() => {
                if (window.UIPayment && window.UIPayment.updatePaymentPageData) {
                    window.UIPayment.updatePaymentPageData();
                }
            }, 100);
        }

        // 如果切换到确认页面，初始化确认页面数据
        if (viewId === UI_CONFIG.VIEWS.CONFIRM) {
            setTimeout(() => {
                if (window.UIPayment && window.UIPayment.initializeConfirmPage) {
                    window.UIPayment.initializeConfirmPage();
                }
            }, 100);
        }
    }
}

// ========================= 票务类型管理 =========================

/**
 * 初始化票务类型控制
 */
function initializeTicketTypeControl() {
    const ticketTypes = document.querySelectorAll('.ticket-type');
    const individualControls = document.querySelector('.individual-controls');
    const groupControls = document.querySelector('.group-controls');

    ticketTypes.forEach((ticketType, index) => {
        ticketType.addEventListener('click', function() {
            console.log(`点击了票务类型 ${index}`);

            // 移除所有active类
            ticketTypes.forEach(type => type.classList.remove('active'));

            // 添加active类到当前点击的类型
            this.classList.add('active');

            // 获取选中的票务类型
            const radioButton = this.querySelector('input[type="radio"]');
            if (radioButton) {
                radioButton.checked = true;
                const ticketType = radioButton.value;
                console.log('选中的票务类型:', ticketType);

                // 根据票务类型显示对应的控制面板
                if (ticketType === 'individual') {
                    showIndividualControls(individualControls, groupControls);
                } else if (ticketType === 'group') {
                    showGroupControls(individualControls, groupControls);
                }
            }
        });
    });
}

/**
 * 显示个人票控制面板
 */
function showIndividualControls(individualControls, groupControls) {
    console.log('显示个人票控制面板');
    if (individualControls && groupControls) {
        individualControls.style.display = 'block';
        individualControls.classList.add('active');
        individualControls.classList.remove('hidden');

        groupControls.style.display = 'none';
        groupControls.classList.add('hidden');
        groupControls.classList.remove('active');

        uiState.ticketType = UI_CONFIG.TICKET_TYPES.INDIVIDUAL;
    }
}

/**
 * 显示团体票控制面板
 */
function showGroupControls(individualControls, groupControls) {
    console.log('显示团体票控制面板');
    if (individualControls && groupControls) {
        individualControls.style.display = 'none';
        individualControls.classList.add('hidden');
        individualControls.classList.remove('active');

        groupControls.style.display = 'block';
        groupControls.classList.add('active');
        groupControls.classList.remove('hidden');

        uiState.ticketType = UI_CONFIG.TICKET_TYPES.GROUP;
    }
}

// ========================= 页面导航管理 =========================

/**
 * 初始化页面导航
 */
function initializeNavigation() {
    bindNavigationButtons();
    bindBackButtons();
}

/**
 * 绑定导航按钮
 */
function bindNavigationButtons() {
    // 配置页面 -> 电影选择
    const nextToMovieBtn = document.getElementById('next-to-movie');
    if (nextToMovieBtn) {
        nextToMovieBtn.addEventListener('click', function() {
            switchView(UI_CONFIG.VIEWS.MOVIE);
        });
    }

    // 电影选择 -> 选座页面
    const nextToSeatBtn = document.getElementById('next-to-seat');
    if (nextToSeatBtn) {
        nextToSeatBtn.addEventListener('click', function() {
            switchView(UI_CONFIG.VIEWS.SEAT);
        });
    }

    // 选座页面 -> 支付页面
    const nextToPaymentBtn = document.getElementById('next-to-payment');
    if (nextToPaymentBtn) {
        nextToPaymentBtn.disabled = false;
        nextToPaymentBtn.addEventListener('click', function() {
            console.log('跳转到支付页面');
            switchView(UI_CONFIG.VIEWS.PAYMENT);
        });
    }

    // 🔑 修正：直接购票按钮
    const purchaseSeatsBtn = document.getElementById('purchase-seats');
    if (purchaseSeatsBtn) {
        purchaseSeatsBtn.addEventListener('click', function() {
            console.log('点击直接购票按钮');
            if (window.UIValidation && window.UIValidation.handleDirectPurchase) {
                window.UIValidation.handleDirectPurchase();
            }
        });
    }

    // 🔑 修正：预订座位按钮
    const reserveSeatsBtn = document.getElementById('reserve-seats');
    if (reserveSeatsBtn) {
        reserveSeatsBtn.addEventListener('click', function() {
            console.log('点击预订座位按钮');
            if (window.UIValidation && window.UIValidation.handleReservation) {
                window.UIValidation.handleReservation();
            }
        });
    }

    // 支付页面 -> 确认页面
    const confirmPaymentBtn = document.getElementById('confirm-payment');
    if (confirmPaymentBtn) {
        confirmPaymentBtn.disabled = false;
        confirmPaymentBtn.addEventListener('click', function() {
            console.log('确认支付，跳转到确认页面');
            switchView(UI_CONFIG.VIEWS.CONFIRM);
        });
    }

    // 支付页面 -> 返回选座页面
    const backToSeatFromPaymentBtn = document.getElementById('back-to-seat-from-payment');
    if (backToSeatFromPaymentBtn) {
        backToSeatFromPaymentBtn.addEventListener('click', function() {
            console.log('从支付页面返回选座页面');
            switchView(UI_CONFIG.VIEWS.SEAT);
        });
    }

    // 确认页面的支付按钮
    const confirmPayBtn = document.querySelector('#confirm-view .btn-pay');
    if (confirmPayBtn) {
        confirmPayBtn.disabled = false;
        confirmPayBtn.addEventListener('click', function() {
            if (window.UIPayment && window.UIPayment.handleFinalPayment) {
                window.UIPayment.handleFinalPayment();
            }
        });
    }
}

/**
 * 绑定返回按钮
 */
function bindBackButtons() {
    const backToConfigBtn = document.getElementById('back-to-config');
    if (backToConfigBtn) {
        backToConfigBtn.addEventListener('click', function() {
            switchView(UI_CONFIG.VIEWS.CONFIG);
        });
    }

    const backToMovieBtn = document.getElementById('back-to-movie');
    if (backToMovieBtn) {
        backToMovieBtn.addEventListener('click', function() {
            switchView(UI_CONFIG.VIEWS.MOVIE);
        });
    }

    const backToSeatBtns = document.querySelectorAll('#back-to-seat');
    backToSeatBtns.forEach(btn => {
        btn.addEventListener('click', function() {
            switchView(UI_CONFIG.VIEWS.SEAT);
        });
    });
}

// ========================= 支付方式管理 =========================

/**
 * 初始化支付方式选择
 */
function initializePaymentMethods() {
    const paymentOptions = document.querySelectorAll('.payment-option');
    paymentOptions.forEach(option => {
        option.addEventListener('click', function() {
            handlePaymentMethodSelection(this);
        });
    });
}

/**
 * 处理支付方式选择
 * @param {HTMLElement} selectedOption - 选中的支付选项
 */
function handlePaymentMethodSelection(selectedOption) {
    // 移除所有active类
    const allOptions = selectedOption.parentElement.querySelectorAll('.payment-option');
    allOptions.forEach(opt => opt.classList.remove('active'));

    // 添加active类到当前选项
    selectedOption.classList.add('active');

    // 选中对应的radio按钮
    const radio = selectedOption.querySelector('input[type="radio"]');
    if (radio) {
        radio.checked = true;
    }

    console.log('选择支付方式:', radio ? radio.value : '未知');
    showMessage(`已选择${radio ? radio.value : '未知'}支付方式`, 'success');
}

// ========================= 设置默认状态 =========================

/**
 * 设置默认状态
 */
function setDefaultStates() {
    // 初始化：确保个人票是激活状态
    const individualTicketType = document.querySelector('.ticket-type input[value="individual"]');
    if (individualTicketType) {
        const parentLabel = individualTicketType.parentElement;
        parentLabel.classList.add('active');
        individualTicketType.checked = true;
    }

    // 初始化：显示个人票控制面板
    const individualControls = document.querySelector('.individual-controls');
    const groupControls = document.querySelector('.group-controls');
    showIndividualControls(individualControls, groupControls);
}

// ========================= 工具函数 =========================

/**
 * 显示消息提示
 * @param {string} message - 消息内容
 * @param {string} type - 消息类型 (success/error/warning/info)
 * @param {number} duration - 显示时长（毫秒）
 */
function showMessage(message, type = 'info', duration = 3000) {
    // 简单的alert实现，后续可以改为更美观的提示组件
    if (type === 'error') {
        alert('错误: ' + message);
    } else if (type === 'success') {
        console.log('成功: ' + message);
        // 可以显示绿色提示框
    } else {
        console.log('提示: ' + message);
    }
}

/**
 * 显示确认对话框
 * @param {string} message - 确认消息
 * @param {Function} onConfirm - 确认回调
 * @param {Function} onCancel - 取消回调
 */
function showConfirmDialog(message, onConfirm, onCancel) {
    if (confirm(message)) {
        if (onConfirm) onConfirm();
    } else {
        if (onCancel) onCancel();
    }
}

// ========================= 事件绑定函数 =========================

/**
 * 绑定所有UI事件
 */
function bindUIEvents() {
    // 初始化团体成员管理
    if (window.UIMemberManagement && window.UIMemberManagement.initializeGroupMemberManagement) {
        window.UIMemberManagement.initializeGroupMemberManagement();
    }

    // 初始化个人成员管理
    if (window.UIMemberManagement && window.UIMemberManagement.initializeIndividualMemberManagement) {
        window.UIMemberManagement.initializeIndividualMemberManagement();
    }

    // 绑定窗口大小变化事件
    window.addEventListener('resize', handleWindowResize);

    // 绑定键盘事件
    document.addEventListener('keydown', handleKeyboardEvents);

    // 🔑 新增：绑定自动选座按钮事件
    bindAutoSeatButtons();
}

/**
 * 绑定自动选座按钮事件
 */
function bindAutoSeatButtons() {
    // 启用自动选座按钮
    enableAutoSeatButtons();

    const autoSelectIndividualBtn = document.getElementById('auto-select-individual');
    if (autoSelectIndividualBtn) {
        autoSelectIndividualBtn.addEventListener('click', function() {
            console.log('🎯 个人票自动选座');

            // 获取个人票成员信息
            const members = window.UIMemberManagement ? window.UIMemberManagement.getIndividualMembersList() : [];
            if (members.length > 0) {
                if (window.StateManager && window.StateManager.performAutoIndividualSelection) {
                    window.StateManager.performAutoIndividualSelection(members);
                    alert('自动选座成功！');
                } else {
                    console.error('StateManager未加载或函数不存在');
                    alert('自动选座功能暂不可用，请手动选择座位');
                }
            } else {
                alert('请先添加成员信息');
            }
        });
    }

    // 团体票自动选座按钮
    const autoSelectGroupBtn = document.getElementById('auto-select-group');
    if (autoSelectGroupBtn) {
        autoSelectGroupBtn.addEventListener('click', function() {
            console.log('🎯 团体票自动选座');

            // 获取团体成员信息
            const groupInfo = window.UIMemberManagement ? window.UIMemberManagement.getGroupMembersList() : [];
            if (groupInfo.length > 0) {
                if (window.StateManager && window.StateManager.performAutoGroupSelection) {
                    window.StateManager.performAutoGroupSelection(groupInfo);
                    alert('团体票自动选座成功！');
                } else {
                    console.error('StateManager未加载或函数不存在');
                }
            } else {
                alert('请先添加团体成员信息');
            }
        });
    }
}

/**
 * 启用自动选座按钮
 */
function enableAutoSeatButtons() {
    const autoSelectIndividualBtn = document.getElementById('auto-select-individual');
    const autoSelectGroupBtn = document.getElementById('auto-select-group');

    if (autoSelectIndividualBtn) {
        autoSelectIndividualBtn.disabled = false;
        autoSelectIndividualBtn.style.backgroundColor = '#68a530';
        autoSelectIndividualBtn.style.color = 'white';
        autoSelectIndividualBtn.style.cursor = 'pointer';
        console.log('✅ 个人票自动选座按钮已启用');
    }

    if (autoSelectGroupBtn) {
        autoSelectGroupBtn.disabled = false;
        autoSelectGroupBtn.style.backgroundColor = '#68a530';
        autoSelectGroupBtn.style.color = 'white';
        autoSelectGroupBtn.style.cursor = 'pointer';
        console.log('✅ 团体票自动选座按钮已启用');
    }
}

/**
 * 处理窗口大小变化
 */
function handleWindowResize() {
    console.log('窗口大小发生变化');
    // TODO: 可以在这里调整Canvas大小等
}

/**
 * 处理键盘事件
 * @param {KeyboardEvent} event - 键盘事件
 */
function handleKeyboardEvents(event) {
    // ESC键关闭模态框等
    if (event.key === 'Escape') {
        // TODO: 关闭当前打开的模态框
    }
}

// ========================= 系统集成函数 =========================

/**
 * 初始化完整系统
 * @param {Object} config - 系统配置
 */
function initializeCompleteSystem(config) {
    console.log('初始化完整系统', config);
    return true;
}

/**
 * 初始化座位布局切换功能
 */
function initializeSeatLayoutToggle() {
    const toggleBtn = document.getElementById('toggle-layout-btn');
    if (toggleBtn) {
        // 移除可能存在的旧事件监听器
        const newToggleBtn = toggleBtn.cloneNode(true);
        toggleBtn.parentNode.replaceChild(newToggleBtn, toggleBtn);

        // 添加新的事件监听器
        newToggleBtn.addEventListener('click', function() {
            console.log('布局切换按钮被点击');

            // 获取当前布局类型
            const currentLayout = this.dataset.layout || 'arc';
            const newLayout = currentLayout === 'arc' ? 'parallel' : 'arc';

            // 更新按钮数据和文本
            this.dataset.layout = newLayout;
            this.textContent = newLayout === 'arc' ? '切换到平行布局' : '切换到弧形布局';

            // 检查canvas.js是否已加载
            if (window.CanvasRenderer && window.CanvasRenderer.drawCinema) {
                // 使用canvas.js中的虚拟数据重新绘制
                const testSeatsData = [];
                const rows = 10;
                const cols = 20;
                for (let i = 1; i <= rows; i++) {
                    for (let j = 1; j <= cols; j++) {
                        let status = 'available';
                        if (Math.random() > 0.8) {
                            status = 'sold';
                        }
                        testSeatsData.push({ row: i, col: j, status: status });
                    }
                }

                window.CanvasRenderer.drawCinema(testSeatsData, {}, newLayout);
            } else {
                console.warn('CanvasRenderer未找到，无法切换布局');
            }
        });
    }
}

// ========================= 兼容性函数 =========================

/**
 * 初始化电影院座位（兼容性函数）
 */
function initializeCinemaSeats() {
    // 这个函数保持为空，确保不会报错
    console.log('初始化电影院座位...');
}

// ========================= 模块导出 =========================

// 在浏览器环境中，将函数暴露到全局
if (typeof window !== 'undefined') {
    window.UICoreModule = {
        // 核心初始化
        initializeUI,
        initializeCompleteSystem,
        initializeSeatLayoutToggle,

        // 视图管理
        switchView,

        // 票务类型管理
        showIndividualControls,
        showGroupControls,

        // 工具函数
        showMessage,
        showConfirmDialog,

        // 状态访问
        getUIState: () => uiState,
        UI_CONFIG,
        uiState
    };
}

// 页面加载完成后自动初始化
document.addEventListener('DOMContentLoaded', function() {
    console.log('页面加载完成，初始化核心UI功能');

    // 等待其他模块加载完成后再初始化UI
    setTimeout(() => {
        initializeUI();
        console.log('核心UI功能初始化完成');
    }, 100);
});

console.log('UI核心模块已加载');
