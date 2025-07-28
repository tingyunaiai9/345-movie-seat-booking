/**
 * 电影院票务系统 - 核心UI管理模块
 * 负责系统初始化、基础配置等核心功能（不包含视图切换）
 */

// ========================= 常量定义 =========================
const UI_CONFIG = {
    // 票务类型
    TICKET_TYPES: {
        INDIVIDUAL: 'individual',
        GROUP: 'group'
    }
};

// ========================= 全局状态变量 =========================
let uiState = {
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
    // 检测是否已有视图控制器
    if (window.viewController) {
        console.log('检测到 viewController，跳过视图管理初始化');
        // 只初始化非视图管理的功能
        initializeNonViewFunctions();
        return;
    }

    // 如果没有viewController，则继续原有逻辑
    initializeNonViewFunctions();
}

/**
 * 初始化非视图切换的功能
 */
function initializeNonViewFunctions() {
    // 绑定所有事件监听器（除视图切换外）
    bindUIEvents();

    // 初始化票务类型控制
    initializeTicketTypeControl();

    initializeCinemaSeats();

    // 初始化支付方式选择
    initializePaymentMethods();

    // 设置默认状态
    setDefaultStates();

    // 初始化StateManager
    setTimeout(() => {
        if (window.StateManager && window.StateManager.initializeStateManager) {
            window.StateManager.initializeStateManager('cinema-canvas');
            console.log('StateManager已初始化 - Canvas现在可以点击了');
        } else {
            console.error('StateManager模块未加载或initializeStateManager方法不存在');
        }
    }, 200); // 延迟确保Canvas已经创建

    uiState.systemInitialized = true;
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
        ticketType.addEventListener('click', function () {
            console.log(`点击了票务类型 ${index}`);

            // 切换票务类型时清空当前选座
            if (window.StateManager && typeof window.StateManager.resetStateManager === 'function') {
                window.StateManager.resetStateManager();
                console.log('切换票务类型，已清空选座');
            }

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

// ========================= 支付方式管理 =========================

/**
 * 初始化支付方式选择
 */
function initializePaymentMethods() {
    document.querySelectorAll('input[name="payment-method"]').forEach(radio => {
        radio.addEventListener('change', function () {
            localStorage.setItem('selectedPaymentMethod', this.value);
            console.log('已选择支付方式:', this.value);
            // 移除所有active类
            document.querySelectorAll('.payment-option').forEach(opt => opt.classList.remove('active'));
            // 给当前radio的父label加active
            this.parentElement.classList.add('active');

            // 提示
            showMessage(`已选择${this.value}支付方式`, 'success');
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
        localStorage.setItem('selectedPaymentMethod', radio.value);
    }

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
    // alert实现
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
 * 绑定所有UI事件（不包含视图切换）
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

    // 绑定自动选座按钮事件
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
        autoSelectIndividualBtn.addEventListener('click', function () {

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
        autoSelectGroupBtn.addEventListener('click', function () {

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
    }

    if (autoSelectGroupBtn) {
        autoSelectGroupBtn.disabled = false;
        autoSelectGroupBtn.style.backgroundColor = '#68a530';
        autoSelectGroupBtn.style.color = 'white';
        autoSelectGroupBtn.style.cursor = 'pointer';
    }
}


/**
 * 处理窗口大小变化
 */
function handleWindowResize() {
    console.log('窗口大小发生变化');
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
        newToggleBtn.addEventListener('click', function () {
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

if (typeof window !== 'undefined') {
    window.UICoreModule = {
        // 核心初始化
        initializeUI,
        initializeCompleteSystem,
        initializeSeatLayoutToggle,

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
document.addEventListener('DOMContentLoaded', function () {
    console.log('页面加载完成，初始化核心UI功能');

    // 等待其他模块加载完成后再初始化UI
    setTimeout(() => {
        initializeUI();
        console.log('核心UI功能初始化完成');
    }, 100);
});

console.log('UI核心模块已加载');
