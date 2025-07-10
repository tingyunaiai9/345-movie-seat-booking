/**
 * 电影院票务系统 - 支付页面管理模块
 * 负责支付页面数据更新、确认页面管理等
 */

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

    // 从验证模块获取真实选中座位数据
    const selectedSeats = window.UIValidation ?
        window.UIValidation.getMySelectedSeatsData() :
        [{ row: 5, col: 8 }, { row: 5, col: 9 }];

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

    // 从验证模块获取真实数据
    const selectedSeats = window.UIValidation ?
        window.UIValidation.getMySelectedSeatsData() :
        [{ row: 5, col: 8 }, { row: 5, col: 9 }];

    const unitPrice = 45;
    const quantity = selectedSeats.length;
    const total = unitPrice * quantity;

    if (unitPriceEl) unitPriceEl.textContent = `¥${unitPrice}`;
    if (ticketQuantityEl) ticketQuantityEl.textContent = quantity;
    if (finalTotalEl) finalTotalEl.textContent = `¥${total}`;
}

/**
 * 更新支付页面中的客户信息（增强版）
 */
function updatePaymentCustomerInfo() {
    const customerInfoEl = document.getElementById('payment-customer-info');
    if (!customerInfoEl) return;

    let infoHtml = '';
    const uiState = window.UICoreModule ? window.UICoreModule.uiState : { ticketType: 'individual' };

    // 根据票务类型获取数据
    if (uiState && uiState.ticketType === 'individual') {
        const members = window.UIMemberManagement ?
            window.UIMemberManagement.getIndividualMembersList() : [];

        if (members.length > 0) {
            infoHtml = `
                <div class="customer-info-item">
                    <span class="label">票务类型:</span>
                    <span class="value">个人票</span>
                </div>
                <div class="customer-info-item">
                    <span class="label">人数:</span>
                    <span class="value">${members.length}人</span>
                </div>
            `;

            members.forEach((member, index) => {
                infoHtml += `
                    <div class="customer-info-item">
                        <span class="label">${index + 1}. ${member.name}:</span>
                        <span class="value">${member.age}岁</span>
                    </div>
                `;
            });
        } else {
            infoHtml = `
                <div class="customer-info-item">
                    <span class="label">客户信息:</span>
                    <span class="value">请添加成员信息</span>
                </div>
            `;
        }
    } else {
        // 团体票逻辑
        const customerName = document.getElementById('customer-name')?.value || '未填写';
        const customerAge = document.getElementById('customer-age')?.value || '未填写';

        infoHtml = `
            <div class="customer-info-item">
                <span class="label">姓名:</span>
                <span class="value">${customerName}</span>
            </div>
            <div class="customer-info-item">
                <span class="label">年龄:</span>
                <span class="value">${customerAge}</span>
            </div>
        `;
    }

    customerInfoEl.innerHTML = infoHtml;
}

// ========================= 确认页面管理 =========================

/**
 * 初始化确认页面
 */
function initializeConfirmPage() {
    console.log('初始化确认页面');
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

    // 从验证模块获取数据
    const movieTitle = window.UIValidation ?
        window.UIValidation.getMySelectedMovieTitle() : '罗小黑战记';
    const movieTime = window.UIValidation ?
        window.UIValidation.getMySelectedMovieTime() : '2025-6-1 19:30';

    if (movieTitleEl) movieTitleEl.textContent = movieTitle;
    if (movieTimeEl) movieTimeEl.textContent = movieTime;
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

    // 从验证模块获取真实选中座位数据
    const selectedSeats = window.UIValidation ?
        window.UIValidation.getMySelectedSeatsData() : [];

    if (selectedSeats.length === 0) {
        seatListEl.innerHTML = '<span class="no-seats">未选择座位</span>';
        return;
    }

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

    // 从验证模块获取真实选中座位数据
    const selectedSeats = window.UIValidation ?
        window.UIValidation.getMySelectedSeatsData() : [];
    const unitPrice = 45; // 单价，应该从配置或状态管理器获取
    const quantity = selectedSeats.length;
    const total = unitPrice * quantity;

    if (unitPriceEl) unitPriceEl.textContent = `¥${unitPrice}`;
    if (ticketQuantityEl) ticketQuantityEl.textContent = quantity;
    if (finalTotalEl) finalTotalEl.textContent = `¥${total}`;
}

/**
 * 更新确认页面中的客户信息（增强版）
 */
function updateConfirmCustomerInfo() {
    const customerNameEl = document.getElementById('confirm-customer-name');
    const customerAgeEl = document.getElementById('confirm-customer-age');
    const customerPhoneEl = document.getElementById('confirm-customer-phone');
    const ticketTypeEl = document.getElementById('confirm-ticket-type');

    const uiState = window.UICoreModule ? window.UICoreModule.uiState : { ticketType: 'individual' };

    if (uiState && uiState.ticketType === 'individual') {
        const members = window.UIMemberManagement ?
            window.UIMemberManagement.getIndividualMembersList() : [];

        if (members.length > 0) {
            if (customerNameEl) customerNameEl.textContent = `${members[0].name} 等${members.length}人`;
            if (customerAgeEl) customerAgeEl.textContent = `${members[0].age}岁 (主要联系人)`;
            if (customerPhoneEl) customerPhoneEl.textContent = '未填写';
            if (ticketTypeEl) ticketTypeEl.textContent = `个人票 (${members.length}人)`;
        } else {
            if (customerNameEl) customerNameEl.textContent = '未添加成员';
            if (customerAgeEl) customerAgeEl.textContent = '未填写';
            if (customerPhoneEl) customerPhoneEl.textContent = '未填写';
            if (ticketTypeEl) ticketTypeEl.textContent = '个人票';
        }
    } else {
        // 团体票逻辑保持不变
        const customerName = document.getElementById('customer-name')?.value || '未填写';
        const customerAge = document.getElementById('customer-age')?.value || '未填写';

        if (customerNameEl) customerNameEl.textContent = customerName;
        if (customerAgeEl) customerAgeEl.textContent = customerAge;
        if (customerPhoneEl) customerPhoneEl.textContent = '未填写';
        if (ticketTypeEl) ticketTypeEl.textContent = uiState.ticketType === 'group' ? '团体票' : '个人票';
    }
}

/**
 * 处理最终支付（确认页面使用）
 */
function handleFinalPayment() {
    console.log('处理最终支付确认...');

    // 获取客户信息
    const customerInfo = window.UIMemberManagement && window.UIMemberManagement.getMyCustomerDataEnhanced
        ? window.UIMemberManagement.getMyCustomerDataEnhanced()
        : { ticketType: 'individual', members: [] };

    // 调用StateManager的购票函数
    let result = null;
    if (window.StateManager && window.StateManager.performPurchase) {
        result = window.StateManager.performPurchase(customerInfo);
    } else {
        alert('购票功能暂不可用，请稍后再试');
        return;
    }

    if (result && result.success) {
        alert('支付成功！订单已确认。');
        // 创建购票订单记录
        if (window.UIOrders && window.UIOrders.createMyPurchaseOrder) {
            window.UIOrders.createMyPurchaseOrder();
        }

        // 切换到 final-view
        if (window.UICoreModule && window.UICoreModule.switchView) {
            window.UICoreModule.switchView('final-view');
        } else {
            // 兜底：直接用DOM切换
            document.querySelectorAll('.view').forEach(v => v.classList.remove('active'));
            var finalView = document.getElementById('final-view');
            if(finalView) finalView.classList.add('active');
        }

        console.log('支付完成');
    } else {
        const errorMessage = result && result.message ? result.message : '支付失败，请重试';
        alert('支付失败：' + errorMessage);
        console.error('❌ 支付失败:', errorMessage);
    }
}

// ========================= 图片处理工具函数 =========================

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

// ========================= 模块导出 =========================

// 在浏览器环境中，将函数暴露到全局
if (typeof window !== 'undefined') {
    window.UIPayment = {
        // 支付页面管理
        updatePaymentPageData,
        updatePaymentMovieInfo,
        updatePaymentSeatInfo,
        updatePaymentPriceInfo,
        updatePaymentCustomerInfo,

        // 确认页面管理
        initializeConfirmPage,
        updateConfirmPageData,
        updateConfirmMovieInfo,
        updateConfirmSeatInfo,
        updateConfirmPriceInfo,
        updateConfirmCustomerInfo,
        handleFinalPayment,

        // 图片处理工具
        checkImageCompatibility,
        setSafeImageSrc
    };
}

console.log('UI支付管理模块已加载');
