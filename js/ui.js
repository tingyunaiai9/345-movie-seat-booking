/**
 * 电影院票务系统 - 前端UI与总成模块
 * 角色四：前端UI与总成工程师
 */

// ========================= 常量定义 =========================
const UI_CONFIG = {
    // 视图状态
    VIEWS: {
        CONFIG: 'config-view',
        MOVIE: 'movie-view', 
        SEAT: 'seat-view',
        PAYMENT: 'payment-view',
        CONFIRM: 'confirm-view'
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
 */
function switchView(viewId) {
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
        
        // 如果切换到支付页面，更新支付页面数据
        if (viewId === UI_CONFIG.VIEWS.PAYMENT) {
            setTimeout(() => {
                updatePaymentPageData();
            }, 100);
        }
        
        // 如果切换到确认页面，初始化确认页面数据
        if (viewId === UI_CONFIG.VIEWS.CONFIRM) {
            setTimeout(() => {
                initializeConfirmPage();
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

// ========================= 团体成员管理 =========================

/**
 * 初始化团体成员管理
 */
function initializeGroupMemberManagement() {
    const memberList = document.querySelector('.member-list');
    const addMemberBtn = document.getElementById('add-member');
    const memberNameInput = document.getElementById('member-name');
    const memberAgeInput = document.getElementById('member-age');
    const memberCountSpan = document.getElementById('member-count');
    
    if (addMemberBtn) {
        addMemberBtn.addEventListener('click', function() {
            const name = memberNameInput.value.trim();
            const age = memberAgeInput.value.trim();
            
            if (!validateMemberInput(name, age)) {
                return;
            }
            
            // 添加成员到列表
            addMemberToList(memberList, name, age);
            
            // 清空输入框
            memberNameInput.value = '';
            memberAgeInput.value = '';
            
            // 更新计数
            uiState.memberCount++;
            updateMemberCount(memberCountSpan);
        });
    }
}

/**
 * 验证成员输入
 * @param {string} name - 成员姓名
 * @param {string} age - 成员年龄
 * @returns {boolean} 是否有效
 */
function validateMemberInput(name, age) {
    if (!name) {
        showMessage('请输入成员姓名', 'error');
        return false;
    }
    
    if (!age || age < 1 || age > 120) {
        showMessage('请输入有效年龄（1-120）', 'error');
        return false;
    }
    
    if (uiState.memberCount >= uiState.maxMembers) {
        showMessage(`最多只能添加${uiState.maxMembers}名成员`, 'error');
        return false;
    }
    
    return true;
}

/**
 * 添加成员到列表
 * @param {HTMLElement} memberList - 成员列表容器
 * @param {string} name - 成员姓名
 * @param {string} age - 成员年龄
 */
function addMemberToList(memberList, name, age) {
    const memberItem = document.createElement('div');
    memberItem.className = 'member-item';
    memberItem.innerHTML = `
        <div class="member-info">
            <span class="member-name">${name}</span>
            <span class="member-age">${age}岁</span>
        </div>
        <button class="remove-member" onclick="CinemaUI.removeMember(this)">删除</button>
    `;
    memberList.appendChild(memberItem);
}

/**
 * 删除成员
 * @param {HTMLElement} button - 删除按钮
 */
function removeMember(button) {
    const memberItem = button.parentElement;
    memberItem.remove();
    uiState.memberCount--;
    
    const memberCountSpan = document.getElementById('member-count');
    updateMemberCount(memberCountSpan);
}

/**
 * 更新成员计数显示
 * @param {HTMLElement} memberCountSpan - 计数显示元素
 */
function updateMemberCount(memberCountSpan) {
    if (memberCountSpan) {
        memberCountSpan.textContent = uiState.memberCount;
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
    
    // 支付页面 -> 确认页面
    const confirmPaymentBtn = document.getElementById('confirm-payment');
    if (confirmPaymentBtn) {
        confirmPaymentBtn.disabled = false;
        confirmPaymentBtn.addEventListener('click', function() {
            console.log('跳转到确认页面');
            switchView(UI_CONFIG.VIEWS.CONFIRM);
        });
    }
    
    // 确认页面的支付按钮
    const confirmPayBtn = document.querySelector('#confirm-view .btn-pay');
    if (confirmPayBtn) {
        confirmPayBtn.disabled = false;
        confirmPayBtn.addEventListener('click', function() {
            handleFinalPayment();
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

// ========================= 业务逻辑处理 =========================

/**
 * 处理最终支付
 */
function handleFinalPayment() {
    showMessage('支付成功！订单已确认。', 'success');
    console.log('支付完成');
    
    // TODO: 这里可以添加实际的支付处理逻辑
    // 例如调用支付API、更新订单状态等
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

/**
 * 检查图片格式兼容性
 * @param {string} imageSrc - 图片路径
 * @returns {Promise<string>} - 返回可用的图片路径
 */
function checkImageCompatibility(imageSrc) {
    return new Promise((resolve) => {
        const img = new Image();
        
        img.onload = function() {
            console.log('图片格式兼容:', imageSrc);
            resolve(imageSrc);
        };
        
        img.onerror = function() {
            console.warn('图片格式不兼容:', imageSrc);
            // 如果是webp格式，尝试使用jpg格式
            if (imageSrc.includes('.webp')) {
                const jpgSrc = imageSrc.replace('.webp', '.jpg');
                resolve(jpgSrc);
            } else {
                // 使用占位符图片
                resolve('https://via.placeholder.com/100x150?text=电影海报');
            }
        };
        
        img.src = imageSrc;
    });
}

/**
 * 安全设置图片源
 * @param {HTMLImageElement} imgElement - 图片元素
 * @param {string} src - 图片源
 * @param {string} alt - 替代文本
 */
async function setSafeImageSrc(imgElement, src, alt) {
    if (!imgElement) return;
    
    try {
        const safeSrc = await checkImageCompatibility(src);
        imgElement.src = safeSrc;
        imgElement.alt = alt;
        
        // 添加最终的错误处理
        imgElement.onerror = function() {
            this.src = 'https://via.placeholder.com/100x150?text=' + encodeURIComponent(alt);
        };
        
    } catch (error) {
        console.error('设置图片失败:', error);
        imgElement.src = 'https://via.placeholder.com/100x150?text=' + encodeURIComponent(alt);
    }
}

// ========================= 事件绑定函数 =========================

/**
 * 绑定所有UI事件
 */
function bindUIEvents() {
    // 初始化团体成员管理
    initializeGroupMemberManagement();
    
    // 绑定窗口大小变化事件
    window.addEventListener('resize', handleWindowResize);
    
    // 绑定键盘事件
    document.addEventListener('keydown', handleKeyboardEvents);
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
    
    // TODO: 
    // 1. 初始化座位数据（调用main.js）
    // 2. 初始化Canvas渲染（调用canvas.js）
    // 3. 初始化状态管理（调用stateManager.js）
    
    return true;
}

// ========================= 支付页面管理 =========================

/**
 * 更新支付页面数据
 */
function updatePaymentPageData() {
    // 更新电影信息
    updatePaymentMovieInfo();
    
    // 更新座位信息
    updatePaymentSeatInfo();
    
    // 更新价格信息
    updatePaymentPriceInfo();
    
    // 更新客户信息
    updatePaymentCustomerInfo();
}

/**
 * 更新支付页面中的电影信息
 */
function updatePaymentMovieInfo() {
    const movieTitleEl = document.getElementById('payment-movie-title');
    const movieTimeEl = document.getElementById('payment-movie-time');
    const movieCinemaEl = document.getElementById('payment-cinema-info');
    const moviePosterEl = document.querySelector('.payment-panel .movie-poster img');
    
    // 获取当前选中的电影
    const selectedMovieEl = document.querySelector('.movie-item.active');
    
    if (selectedMovieEl) {
        const movieData = {
            title: selectedMovieEl.querySelector('h3').textContent,
            time: selectedMovieEl.querySelector('.movie-time').textContent,
            image: selectedMovieEl.querySelector('img').src,
            cinema: '中厅 (10排×20座)'
        };
        
        // 更新文本信息
        if (movieTitleEl) movieTitleEl.textContent = movieData.title;
        if (movieTimeEl) movieTimeEl.textContent = movieData.time;
        if (movieCinemaEl) movieCinemaEl.textContent = movieData.cinema;
        
        // 安全设置图片
        setSafeImageSrc(moviePosterEl, movieData.image, movieData.title);
        
    } else {
        // 使用默认数据
        if (movieTitleEl) movieTitleEl.textContent = '罗小黑战记';
        if (movieTimeEl) movieTimeEl.textContent = '2025-6-1 19:30';
        if (movieCinemaEl) movieCinemaEl.textContent = '中厅 (10排×20座)';
        
        setSafeImageSrc(moviePosterEl, 'img/LUOXIAOHEI.webp', '罗小黑战记');
    }
}

/**
 * 更新支付页面中的座位信息
 */
function updatePaymentSeatInfo() {
    const seatListEl = document.getElementById('payment-seats-list');
    if (!seatListEl) return;
    
    // 清空现有座位信息
    seatListEl.innerHTML = '';
    
    // 这里应该从选座状态获取真实数据，暂时使用示例数据
    const selectedSeats = [
        { row: 5, col: 8 },
        { row: 5, col: 9 }
    ];
    
    selectedSeats.forEach(seat => {
        const seatTag = document.createElement('span');
        seatTag.className = 'payment-seat-tag';
        seatTag.textContent = `${seat.row}排${seat.col}座`;
        seatListEl.appendChild(seatTag);
    });
}

/**
 * 更新支付页面中的价格信息
 */
function updatePaymentPriceInfo() {
    const unitPriceEl = document.getElementById('unit-price');
    const ticketQuantityEl = document.getElementById('ticket-quantity');
    const finalTotalEl = document.getElementById('final-total');
    
    // 示例数据，实际应该从状态管理器获取
    const unitPrice = 45;
    const quantity = 2;
    const total = unitPrice * quantity;
    
    if (unitPriceEl) unitPriceEl.textContent = `¥${unitPrice}`;
    if (ticketQuantityEl) ticketQuantityEl.textContent = quantity;
    if (finalTotalEl) finalTotalEl.textContent = `¥${total}`;
}

/**
 * 更新支付页面中的客户信息
 */
function updatePaymentCustomerInfo() {
    const customerInfoEl = document.getElementById('payment-customer-info');
    if (!customerInfoEl) return;
    
    // 获取客户信息
    const customerName = document.getElementById('customer-name')?.value || '未填写';
    const customerAge = document.getElementById('customer-age')?.value || '未填写';
    const customerPhone = document.getElementById('customer-phone')?.value || '未填写';
    
    customerInfoEl.innerHTML = `
        <div class="customer-info-item">
            <span class="label">姓名:</span>
            <span class="value">${customerName}</span>
        </div>
        <div class="customer-info-item">
            <span class="label">年龄:</span>
            <span class="value">${customerAge}</span>
        </div>
        <div class="customer-info-item">
            <span class="label">电话:</span>
            <span class="value">${customerPhone}</span>
        </div>
    `;
}

// ========================= 确认页面管理 =========================

/**
 * 初始化确认页面
 */
function initializeConfirmPage() {
    console.log('初始化确认页面');
    
    // TODO: 从状态管理器获取订单信息并更新显示
    updateConfirmPageData();
}

/**
 * 更新确认页面数据
 */
function updateConfirmPageData() {
    // 更新电影信息
    updateConfirmMovieInfo();
    
    // 更新座位信息
    updateConfirmSeatInfo();
    
    // 更新价格信息
    updateConfirmPriceInfo();
    
    // 更新客户信息
    updateConfirmCustomerInfo();
}

/**
 * 更新确认页面中的电影信息
 */
function updateConfirmMovieInfo() {
    const movieTitleEl = document.getElementById('confirm-movie-title');
    const movieTimeEl = document.getElementById('confirm-movie-time');
    const movieCinemaEl = document.getElementById('confirm-cinema-info');
    
    // 这里应该从状态管理器获取数据，暂时使用示例数据
    if (movieTitleEl) movieTitleEl.textContent = '罗小黑战记';
    if (movieTimeEl) movieTimeEl.textContent = '2025-6-1 19:30';
    if (movieCinemaEl) movieCinemaEl.textContent = '中厅 (10排×20座)';
}

/**
 * 更新确认页面中的座位信息
 */
function updateConfirmSeatInfo() {
    const seatListEl = document.getElementById('confirm-seats-list');
    if (!seatListEl) return;
    
    // 清空现有座位信息
    seatListEl.innerHTML = '';
    
    // 这里应该从选座状态获取真实数据，暂时使用示例数据
    const selectedSeats = [
        { row: 5, col: 8 },
        { row: 5, col: 9 }
    ];
    
    selectedSeats.forEach(seat => {
        const seatTag = document.createElement('span');
        seatTag.className = 'confirm-seat-tag';
        seatTag.textContent = `${seat.row}排${seat.col}座`;
        seatListEl.appendChild(seatTag);
    });
}

/**
 * 更新确认页面中的价格信息
 */
function updateConfirmPriceInfo() {
    const unitPriceEl = document.getElementById('confirm-unit-price');
    const ticketQuantityEl = document.getElementById('confirm-ticket-quantity');
    const finalTotalEl = document.getElementById('confirm-final-total');
    
    // 示例数据，实际应该从状态管理器获取
    const unitPrice = 45;
    const quantity = 2;
    const total = unitPrice * quantity;
    
    if (unitPriceEl) unitPriceEl.textContent = `¥${unitPrice}`;
    if (ticketQuantityEl) ticketQuantityEl.textContent = quantity;
    if (finalTotalEl) finalTotalEl.textContent = `¥${total}`;
}

/**
 * 更新确认页面中的客户信息
 */
function updateConfirmCustomerInfo() {
    const customerInfoEl = document.getElementById('confirm-customer-info');
    if (!customerInfoEl) return;
    
    // 获取客户信息
    const customerName = document.getElementById('customer-name')?.value || '未填写';
    const customerAge = document.getElementById('customer-age')?.value || '未填写';
    const customerPhone = document.getElementById('customer-phone')?.value || '未填写';
    
    customerInfoEl.innerHTML = `
        <div class="customer-info-item">
            <span class="label">姓名:</span>
            <span class="value">${customerName}</span>
        </div>
        <div class="customer-info-item">
            <span class="label">年龄:</span>
            <span class="value">${customerAge}</span>
        </div>
        <div class="customer-info-item">
            <span class="label">电话:</span>
            <span class="value">${customerPhone}</span>
        </div>
    `;
}

// ========================= 模块导出 =========================

// 在浏览器环境中，将函数暴露到全局
if (typeof window !== 'undefined') {
    window.CinemaUI = {
        // 核心初始化
        initializeUI,
        initializeCompleteSystem,
        
        // 视图管理
        switchView,
        
        // 票务类型管理
        showIndividualControls,
        showGroupControls,
        
        // 团体成员管理
        removeMember,
        addMemberToList,
        
        // 确认页面管理
        initializeConfirmPage,
        updateConfirmPageData,
        handleFinalPayment,
        
        // 支付页面管理
        updatePaymentPageData,
        updatePaymentMovieInfo,
        updatePaymentSeatInfo,
        updatePaymentPriceInfo,
        updatePaymentCustomerInfo,
        
        // 工具函数
        showMessage,
        showConfirmDialog,
        
        // 状态访问
        getUIState: () => uiState
    };
}

// 页面加载完成后自动初始化
document.addEventListener('DOMContentLoaded', function() {
    console.log('页面加载完成，初始化所有功能');
    
    // 等待其他模块加载完成后再初始化UI
    setTimeout(() => {
        initializeUI();
        console.log('所有功能初始化完成');
    }, 100);
});

console.log('UI与总成模块已加载');

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

// 在 ui.js 文件的末尾添加以下代码（不修改现有任何代码）

// ========================= 我的订单页面管理 =========================

/**
 * 订单管理状态 - 独立的命名空间，避免冲突
 */
const MyOrdersState = {
    orders: [],
    currentFilter: 'all',
    searchKeyword: ''
};

/**
 * 初始化我的订单页面功能
 */
function initializeMyOrdersFeature() {
    console.log('初始化我的订单功能');
    
    // 绑定我的订单相关事件
    bindMyOrdersEvents();
    
    // 从localStorage加载订单数据
    loadMyOrdersFromStorage();
}

/**
 * 绑定我的订单页面所有事件
 */
function bindMyOrdersEvents() {
    // 我的订单按钮 - 显示订单页面
    const myOrdersBtn = document.getElementById('my-orders-btn');
    if (myOrdersBtn) {
        myOrdersBtn.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            showMyOrdersPage();
        });
    }
    
    // 关闭按钮 - 返回到之前页面
    const closeBtn = document.getElementById('close-my-orders');
    if (closeBtn) {
        closeBtn.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            hideMyOrdersPage();
        });
    }
    
    // 筛选标签事件
    const filterTabs = document.querySelectorAll('.filter-tab');
    filterTabs.forEach(tab => {
        tab.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            
            // 移除所有active类
            filterTabs.forEach(t => t.classList.remove('active'));
            // 添加当前active类
            tab.classList.add('active');
            
            // 更新筛选状态
            MyOrdersState.currentFilter = tab.dataset.filter;
            renderMyOrdersList();
        });
    });
    
    // 搜索功能
    const searchBtn = document.getElementById('search-orders');
    const searchInput = document.getElementById('order-search');
    
    if (searchBtn && searchInput) {
        searchBtn.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            MyOrdersState.searchKeyword = searchInput.value.trim();
            renderMyOrdersList();
        });
        
        searchInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                MyOrdersState.searchKeyword = searchInput.value.trim();
                renderMyOrdersList();
            }
        });
    }
    
    // 订单详情模态框关闭
    const closeDetailBtn = document.getElementById('close-order-detail');
    if (closeDetailBtn) {
        closeDetailBtn.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            hideMyOrderDetail();
        });
    }
    
    // 订单操作按钮
    const cancelOrderBtn = document.getElementById('cancel-order');
    const payReservedBtn = document.getElementById('pay-reserved-order');
    const refundOrderBtn = document.getElementById('refund-order');
    
    if (cancelOrderBtn) {
        cancelOrderBtn.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            handleMyCancelOrder();
        });
    }
    
    if (payReservedBtn) {
        payReservedBtn.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            handleMyPayReservedOrder();
        });
    }
    
    if (refundOrderBtn) {
        refundOrderBtn.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            handleMyRefundOrder();
        });
    }
}

/**
 * 显示我的订单页面
 */
function showMyOrdersPage() {
    console.log('显示我的订单页面');
    
    // 记录当前活动的页面
    const currentActiveView = document.querySelector('.view.active');
    if (currentActiveView) {
        currentActiveView.dataset.previousView = 'true';
    }
    
    // 隐藏所有其他视图
    const views = document.querySelectorAll('.view');
    views.forEach(view => {
        view.classList.remove('active');
    });
    
    // 显示我的订单视图
    const myOrdersView = document.getElementById('my-orders-view');
    if (myOrdersView) {
        myOrdersView.classList.add('active');
        
        // 刷新订单数据
        loadMyOrdersFromStorage();
        renderMyOrdersList();
    }
}

/**
 * 隐藏我的订单页面
 */
function hideMyOrdersPage() {
    console.log('隐藏我的订单页面');
    
    const myOrdersView = document.getElementById('my-orders-view');
    if (myOrdersView) {
        myOrdersView.classList.remove('active');
    }
    
    // 恢复之前的视图
    const previousView = document.querySelector('[data-previous-view="true"]');
    if (previousView) {
        previousView.classList.add('active');
        previousView.removeAttribute('data-previous-view');
    } else {
        // 默认返回配置页面
        const configView = document.getElementById('config-view');
        if (configView) {
            configView.classList.add('active');
        }
    }
}

/**
 * 从localStorage加载订单数据
 */
function loadMyOrdersFromStorage() {
    try {
        const storedOrders = localStorage.getItem('movieTicketOrders');
        if (storedOrders) {
            MyOrdersState.orders = JSON.parse(storedOrders);
        } else {
            MyOrdersState.orders = [];
        }
        console.log('已加载我的订单数据:', MyOrdersState.orders.length + '条');
    } catch (error) {
        console.error('加载我的订单数据失败:', error);
        MyOrdersState.orders = [];
    }
}

/**
 * 保存订单到localStorage
 */
function saveMyOrderToStorage(orderData) {
    try {
        // 生成订单ID
        const orderId = 'ORD' + Date.now() + Math.random().toString(36).substr(2, 5).toUpperCase();
        
        const order = {
            id: orderId,
            movieTitle: orderData.movieTitle || getMySelectedMovieTitle(),
            movieTime: orderData.movieTime || getMySelectedMovieTime(),
            moviePoster: orderData.moviePoster || getMySelectedMoviePoster(),
            seats: orderData.seats || getMySelectedSeatsData(),
            customerInfo: orderData.customerInfo || getMyCustomerData(),
            totalPrice: orderData.totalPrice || calculateMyTotalPrice(),
            status: orderData.status || 'reserved', // reserved, paid, cancelled
            createTime: new Date().toLocaleString('zh-CN'),
            payTime: orderData.status === 'paid' ? new Date().toLocaleString('zh-CN') : null,
            expiresAt: orderData.status === 'reserved' ? 
                new Date(Date.now() + 30 * 60 * 1000).toLocaleString('zh-CN') : null // 30分钟后过期
        };
        
        // 加载现有订单
        loadMyOrdersFromStorage();
        
        // 添加新订单
        MyOrdersState.orders.unshift(order);
        
        // 保存到localStorage
        localStorage.setItem('movieTicketOrders', JSON.stringify(MyOrdersState.orders));
        
        console.log('我的订单已保存:', order.id);
        return order;
    } catch (error) {
        console.error('保存我的订单失败:', error);
        return null;
    }
}

/**
 * 渲染订单列表
 */
function renderMyOrdersList() {
    const ordersList = document.getElementById('orders-list');
    const noOrders = document.getElementById('no-orders');
    
    if (!ordersList) return;
    
    // 筛选订单
    let filteredOrders = MyOrdersState.orders;
    
    // 按状态筛选
    if (MyOrdersState.currentFilter !== 'all') {
        filteredOrders = filteredOrders.filter(order => {
            switch (MyOrdersState.currentFilter) {
                case 'reserved':
                    return order.status === 'reserved';
                case 'paid':
                    return order.status === 'paid';
                default:
                    return true;
            }
        });
    }
    
    // 按关键词搜索
    if (MyOrdersState.searchKeyword) {
        const keyword = MyOrdersState.searchKeyword.toLowerCase();
        filteredOrders = filteredOrders.filter(order => 
            order.id.toLowerCase().includes(keyword) ||
            order.movieTitle.toLowerCase().includes(keyword)
        );
    }
    
    // 清空列表
    ordersList.innerHTML = '';
    
    if (filteredOrders.length === 0) {
        // 显示无订单状态
        if (noOrders) {
            ordersList.appendChild(noOrders.cloneNode(true));
        }
    } else {
        // 渲染订单项
        filteredOrders.forEach(order => {
            const orderItem = createMyOrderItem(order);
            ordersList.appendChild(orderItem);
        });
    }
}

/**
 * 创建订单项元素
 */
function createMyOrderItem(order) {
    const orderItem = document.createElement('div');
    orderItem.className = `order-item ${order.status}`;
    orderItem.dataset.orderId = order.id;
    
    // 状态文本映射
    const statusText = {
        'reserved': '已预约',
        'paid': '已支付',
        'cancelled': '已取消'
    };
    
    // 格式化座位信息
    const seatsText = order.seats.map(seat => {
        if (typeof seat === 'object' && seat.row && seat.col) {
            return `${seat.row}排${seat.col}座`;
        }
        return seat.toString();
    }).join('、');
    
    // 计算过期状态
    let expiryWarning = '';
    if (order.status === 'reserved' && order.expiresAt) {
        const expiryTime = new Date(order.expiresAt);
        const now = new Date();
        const timeLeft = expiryTime - now;
        
        if (timeLeft > 0) {
            const minutes = Math.floor(timeLeft / (1000 * 60));
            expiryWarning = `<span class="expiry-warning" style="color: #dc3545; font-weight: 600;">
                还剩 ${minutes} 分钟支付时间
            </span>`;
        } else {
            expiryWarning = `<span class="expiry-warning" style="color: #dc3545; font-weight: 600;">
                预约已过期
            </span>`;
        }
    }
    
    orderItem.innerHTML = `
        <div class="order-header">
            <span class="order-number">订单号: ${order.id}</span>
            <span class="order-status ${order.status}">${statusText[order.status]}</span>
        </div>
        <div class="order-content">
            <div class="order-movie">
                <img src="${order.moviePoster}" alt="${order.movieTitle}" onerror="this.src='img/LUOXIAOHEI.webp'">
                <div class="movie-info">
                    <h4>${order.movieTitle}</h4>
                    <p>放映时间: ${order.movieTime}</p>
                    <p>座位: ${seatsText}</p>
                </div>
            </div>
            <div class="order-details">
                <h5>客户信息</h5>
                <div class="order-meta">
                    姓名: ${order.customerInfo.name || '未填写'}<br>
                    年龄: ${order.customerInfo.age || '未填写'}<br>
                    电话: ${order.customerInfo.phone || '未填写'}<br>
                    下单时间: ${order.createTime}
                    ${order.payTime ? '<br>支付时间: ' + order.payTime : ''}
                    ${expiryWarning ? '<br>' + expiryWarning : ''}
                </div>
            </div>
            <div class="order-price">
                <div class="price-amount">¥${order.totalPrice}</div>
                <div class="price-details">
                    共 ${order.seats.length} 张票<br>
                    点击查看详情
                </div>
            </div>
        </div>
    `;
    
    // 添加点击事件
    orderItem.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        showMyOrderDetail(order);
    });
    
    return orderItem;
}

/**
 * 显示订单详情
 */
function showMyOrderDetail(order) {
    const modal = document.getElementById('order-detail-modal');
    const content = document.getElementById('order-detail-content');
    
    if (!modal || !content) return;
    
    // 存储当前订单ID
    modal.dataset.currentOrderId = order.id;
    
    // 状态文本映射
    const statusText = {
        'reserved': '已预约',
        'paid': '已支付',
        'cancelled': '已取消'
    };
    
    // 格式化座位信息
    const seatsHtml = order.seats.map(seat => {
        let seatText = '';
        if (typeof seat === 'object' && seat.row && seat.col) {
            seatText = `${seat.row}排${seat.col}座`;
        } else {
            seatText = seat.toString();
        }
        return `<span class="seat-tag">${seatText}</span>`;
    }).join('');
    
    content.innerHTML = `
        <div class="order-detail-section">
            <h4>订单信息</h4>
            <div class="detail-grid">
                <span class="detail-label">订单号:</span>
                <span class="detail-value">${order.id}</span>
                <span class="detail-label">状态:</span>
                <span class="detail-value order-status ${order.status}">${statusText[order.status]}</span>
                <span class="detail-label">创建时间:</span>
                <span class="detail-value">${order.createTime}</span>
                ${order.payTime ? `
                    <span class="detail-label">支付时间:</span>
                    <span class="detail-value">${order.payTime}</span>
                ` : ''}
                ${order.expiresAt && order.status === 'reserved' ? `
                    <span class="detail-label">支付截止:</span>
                    <span class="detail-value">${order.expiresAt}</span>
                ` : ''}
            </div>
        </div>
        
        <div class="order-detail-section">
            <h4>电影信息</h4>
            <div class="detail-grid">
                <span class="detail-label">电影名称:</span>
                <span class="detail-value">${order.movieTitle}</span>
                <span class="detail-label">放映时间:</span>
                <span class="detail-value">${order.movieTime}</span>
            </div>
        </div>
        
        <div class="order-detail-section">
            <h4>座位信息</h4>
            <div class="seat-tags">
                ${seatsHtml}
            </div>
        </div>
        
        <div class="order-detail-section">
            <h4>客户信息</h4>
            <div class="detail-grid">
                <span class="detail-label">姓名:</span>
                <span class="detail-value">${order.customerInfo.name || '未填写'}</span>
                <span class="detail-label">年龄:</span>
                <span class="detail-value">${order.customerInfo.age || '未填写'}</span>
                <span class="detail-label">电话:</span>
                <span class="detail-value">${order.customerInfo.phone || '未填写'}</span>
            </div>
        </div>
        
        <div class="order-detail-section">
            <h4>费用明细</h4>
            <div class="detail-grid">
                <span class="detail-label">票价:</span>
                <span class="detail-value">¥45 × ${order.seats.length}</span>
                <span class="detail-label">总计:</span>
                <span class="detail-value" style="color: #398d37; font-weight: 700; font-size: 18px;">¥${order.totalPrice}</span>
            </div>
        </div>
    `;
    
    // 显示/隐藏操作按钮
    const cancelBtn = document.getElementById('cancel-order');
    const payBtn = document.getElementById('pay-reserved-order');
    const refundBtn = document.getElementById('refund-order');
    
    // 隐藏所有按钮
    [cancelBtn, payBtn, refundBtn].forEach(btn => {
        if (btn) btn.style.display = 'none';
    });
    
    // 根据订单状态显示相应按钮
    if (order.status === 'reserved') {
        if (cancelBtn) cancelBtn.style.display = 'inline-block';
        if (payBtn) payBtn.style.display = 'inline-block';
    } else if (order.status === 'paid') {
        if (refundBtn) refundBtn.style.display = 'inline-block';
    }
    
    // 显示模态框
    modal.style.display = 'flex';
}

/**
 * 隐藏订单详情
 */
function hideMyOrderDetail() {
    const modal = document.getElementById('order-detail-modal');
    if (modal) {
        modal.style.display = 'none';
    }
}

/**
 * 处理取消订单
 */
function handleMyCancelOrder() {
    const modal = document.getElementById('order-detail-modal');
    const orderId = modal?.dataset.currentOrderId;
    
    if (!orderId) return;
    
    if (confirm('确定要取消这个订单吗？取消后将无法恢复。')) {
        // 更新订单状态
        const orderIndex = MyOrdersState.orders.findIndex(order => order.id === orderId);
        if (orderIndex !== -1) {
            MyOrdersState.orders[orderIndex].status = 'cancelled';
            
            // 保存到localStorage
            localStorage.setItem('movieTicketOrders', JSON.stringify(MyOrdersState.orders));
            
            // 刷新显示
            hideMyOrderDetail();
            renderMyOrdersList();
            
            console.log('订单已取消:', orderId);
            alert('订单已取消');
        }
    }
}

/**
 * 处理支付预约订单
 */
function handleMyPayReservedOrder() {
    const modal = document.getElementById('order-detail-modal');
    const orderId = modal?.dataset.currentOrderId;
    
    if (!orderId) return;
    
    if (confirm('确定要支付这个订单吗？')) {
        // 更新订单状态
        const orderIndex = MyOrdersState.orders.findIndex(order => order.id === orderId);
        if (orderIndex !== -1) {
            MyOrdersState.orders[orderIndex].status = 'paid';
            MyOrdersState.orders[orderIndex].payTime = new Date().toLocaleString('zh-CN');
            MyOrdersState.orders[orderIndex].expiresAt = null;
            
            // 保存到localStorage
            localStorage.setItem('movieTicketOrders', JSON.stringify(MyOrdersState.orders));
            
            // 刷新显示
            hideMyOrderDetail();
            renderMyOrdersList();
            
            console.log('订单支付成功:', orderId);
            alert('支付成功！');
        }
    }
}

/**
 * 处理退款
 */
function handleMyRefundOrder() {
    const modal = document.getElementById('order-detail-modal');
    const orderId = modal?.dataset.currentOrderId;
    
    if (!orderId) return;
    
    if (confirm('确定要申请退款吗？退款后订单将被取消。')) {
        // 更新订单状态
        const orderIndex = MyOrdersState.orders.findIndex(order => order.id === orderId);
        if (orderIndex !== -1) {
            MyOrdersState.orders[orderIndex].status = 'cancelled';
            
            // 保存到localStorage
            localStorage.setItem('movieTicketOrders', JSON.stringify(MyOrdersState.orders));
            
            // 刷新显示
            hideMyOrderDetail();
            renderMyOrdersList();
            
            console.log('订单退款申请已提交:', orderId);
            alert('退款申请已提交，款项将在3-5个工作日内退回');
        }
    }
}

// ========================= 数据获取辅助函数 =========================

/**
 * 获取选中的电影标题
 */
function getMySelectedMovieTitle() {
    const selectedMovie = document.querySelector('.movie-item.active h3');
    return selectedMovie ? selectedMovie.textContent : '罗小黑战记';
}

/**
 * 获取选中的电影时间
 */
function getMySelectedMovieTime() {
    const selectedMovie = document.querySelector('.movie-item.active .movie-time');
    return selectedMovie ? selectedMovie.textContent : '2025-6-1 19:30';
}

/**
 * 获取选中的电影海报
 */
function getMySelectedMoviePoster() {
    const selectedMovie = document.querySelector('.movie-item.active img');
    return selectedMovie ? selectedMovie.src : 'img/LUOXIAOHEI.webp';
}

/**
 * 获取选中座位数据
 */
function getMySelectedSeatsData() {
    // 尝试从页面中获取已选座位
    const seatTags = document.querySelectorAll('#selected-seats-list .seat-tag');
    if (seatTags.length > 0) {
        return Array.from(seatTags).map(tag => {
            const text = tag.textContent.trim();
            const match = text.match(/(\d+)排(\d+)座/);
            if (match) {
                return { row: parseInt(match[1]), col: parseInt(match[2]) };
            }
            return text;
        });
    }
    
    // 默认示例数据
    return [
        { row: 5, col: 8 },
        { row: 5, col: 9 }
    ];
}

/**
 * 获取客户数据
 */
function getMyCustomerData() {
    return {
        name: document.getElementById('customer-name')?.value || '未填写',
        age: document.getElementById('customer-age')?.value || '未填写',
        phone: document.getElementById('customer-phone')?.value || '未填写'
    };
}

/**
 * 计算总价格
 */
function calculateMyTotalPrice() {
    const seats = getMySelectedSeatsData();
    return seats.length * 45; // 假设每张票45元
}

// ========================= 创建订单接口函数 =========================

/**
 * 创建预约订单
 */
function createMyReservationOrder() {
    const order = saveMyOrderToStorage({
        status: 'reserved'
    });
    
    if (order) {
        console.log('预约订单已创建:', order.id);
        alert(`预约成功！订单号：${order.id}`);
        return order;
    } else {
        alert('预约失败，请重试');
        return null;
    }
}

/**
 * 创建购票订单
 */
function createMyPurchaseOrder() {
    const order = saveMyOrderToStorage({
        status: 'paid'
    });
    
    if (order) {
        console.log('购票订单已创建:', order.id);
        alert(`购票成功！订单号：${order.id}`);
        return order;
    } else {
        alert('购票失败，请重试');
        return null;
    }
}

// ========================= 扩展现有CinemaUI对象 =========================

// 页面加载时初始化我的订单功能
document.addEventListener('DOMContentLoaded', function() {
    // 延迟初始化，确保其他模块已加载
    setTimeout(() => {
        initializeMyOrdersFeature();
        console.log('我的订单功能已初始化');
    }, 300);
});

// 扩展现有的CinemaUI对象，添加我的订单功能
if (typeof window !== 'undefined' && window.CinemaUI) {
    // 只添加新功能，不覆盖现有功能
    window.CinemaUI.MyOrders = {
        // 页面管理
        showMyOrdersPage,
        hideMyOrdersPage,
        
        // 订单管理
        createMyReservationOrder,
        createMyPurchaseOrder,
        loadMyOrdersFromStorage,
        saveMyOrderToStorage,
        
        // 状态访问
        getMyOrdersState: () => MyOrdersState
    };
    
    console.log('我的订单功能已添加到CinemaUI');
}

console.log('我的订单模块已加载完成');


// 在ui.js中添加调试函数
function checkCanvasEventBinding() {
    const canvas = document.getElementById('cinema-canvas');
    if (!canvas) {
        console.error('❌ Canvas元素不存在');
        return false;
    }
    
    // 检查StateManager状态
    if (window.StateManager) {
        const state = window.StateManager.getCurrentState();
        console.log('📊 StateManager状态:', state);
        
        if (!state.isInitialized) {
            console.error('❌ StateManager未初始化');
            return false;
        }
    } else {
        console.error('❌ StateManager模块未加载');
        return false;
    }
    
    console.log('✅ Canvas事件绑定检查通过');
    return true;
}

// 在页面加载完成后检查
document.addEventListener('DOMContentLoaded', function() {
    setTimeout(() => {
        checkCanvasEventBinding();
    }, 500);
});