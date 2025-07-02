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