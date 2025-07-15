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
 * 更新支付页面中的支付方式信息
 */
function updateConfirmPaymentMethod() {
    const paymentMethodEl = document.getElementById('confirm-payment-method');
    if (!paymentMethodEl) return;
    console.log('payment 当前的支付方式:', localStorage.getItem('selectedPaymentMethod'));
    const method = localStorage.getItem('selectedPaymentMethod') || 'wechat';
    let methodText = '微信支付';
    if (method === 'alipay') methodText = '支付宝';
    if (method === 'card') methodText = '银行卡';

    paymentMethodEl.textContent = methodText;
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
        window.StateManager.getSelectedSeats() :
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

    // 获取最新票价
    let unitPrice = 45;
    try {
        const movieData = JSON.parse(localStorage.getItem('selectedMovieInfo'));
        if (movieData && movieData.price) {
            unitPrice = Number(movieData.price);
        }
    } catch (e) { }

    // 获取已选座位数量
    const selectedSeats = window.UIValidation ?
        window.StateManager.getSelectedSeats() :
        [{ row: 5, col: 8 }, { row: 5, col: 9 }];

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

    // 更新支付方式信息
    updateConfirmPaymentMethod();
}

/**
 * 更新确认页面中的电影信息
 */
function updateConfirmMovieInfo() {
    const movieTitleEl = document.getElementById('confirm-movie-title');
    const movieTimeEl = document.getElementById('confirm-showtime');
    const movieCinemaEl = document.getElementById('confirm-cinema');

    let movieData = null;
    try {
        movieData = JSON.parse(localStorage.getItem('selectedMovieInfo'));
    } catch (e) {
        movieData = null;
    }

    // 判断影厅类型
    let cinemaInfo = '中厅 (10排×20座)';
    if (movieData && movieData.rows && movieData.cols) {
        if (movieData.rows === 8 && movieData.cols === 15) {
            cinemaInfo = '小厅 (8排×15座)';
        } else if (movieData.rows === 10 && movieData.cols === 20) {
            cinemaInfo = '中厅 (10排×20座)';
        } else if (movieData.rows === 12 && movieData.cols === 25) {
            cinemaInfo = '大厅 (12排×25座)';
        } else {
            cinemaInfo = `自定义影厅 (${movieData.rows}排×${movieData.cols}座)`;
        }
    }

    if (movieData) {
        if (movieTitleEl) movieTitleEl.textContent = movieData.title || '-';
        if (movieTimeEl) movieTimeEl.textContent = movieData.time || '-';
        if (movieCinemaEl) movieCinemaEl.textContent = cinemaInfo;
    } else {
        // 默认值
        if (movieTitleEl) movieTitleEl.textContent = '罗小黑战记';
        if (movieTimeEl) movieTimeEl.textContent = '2025-6-1 19:30';
        if (movieCinemaEl) movieCinemaEl.textContent = '中厅 (10排×20座)';
    }
}

/**
 * 更新确认页面中的座位信息
 */
function updateConfirmSeatInfo() {
    const seatListEl = document.getElementById('confirm-seat-list');
    if (!seatListEl) return;

    // 清空现有座位信息
    seatListEl.innerHTML = '';

    // 获取选中的座位数据
    const selectedSeats = window.UIValidation ?
        window.StateManager.getSelectedSeats() : [];

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
    const ticketCostEl = document.getElementById('ticket-cost');
    const serviceFeeEl = document.getElementById('service-fee');
    const totalCostEl = document.getElementById('total-cost');

    // 获取票价和已选座位数
    let unitPrice = 45; // 默认票价
    let serviceFee = 0; // 可自定义服务费
    let quantity = 1;

    // 从 localStorage 获取电影票价
    try {
        const movieData = JSON.parse(localStorage.getItem('selectedMovieInfo'));
        if (movieData && movieData.price) {
            unitPrice = Number(movieData.price);
        }
    } catch (e) { }

    // 获取已选座位数量
    const selectedSeats = window.UIValidation ?
        window.StateManager.getSelectedSeats() : [];
    quantity = selectedSeats.length;

    // 计算费用
    const ticketCost = unitPrice * quantity;
    const totalCost = ticketCost + serviceFee;

    // 更新页面
    if (ticketCostEl) ticketCostEl.textContent = `¥${unitPrice} × ${quantity} = ¥${ticketCost}`;
    if (serviceFeeEl) serviceFeeEl.textContent = `¥${serviceFee}`;
    if (totalCostEl) totalCostEl.textContent = `¥${totalCost}`;
}

/**
 * 更新确认页面中的客户信息
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
            if (customerAgeEl) customerAgeEl.textContent = `${members[0].age}岁`;
            if (customerPhoneEl) customerPhoneEl.textContent = '未填写';
            if (ticketTypeEl) ticketTypeEl.textContent = `个人票 (${members.length}人)`;
        } else {
            if (customerNameEl) customerNameEl.textContent = '未添加成员';
            if (customerAgeEl) customerAgeEl.textContent = '未填写';
            if (customerPhoneEl) customerPhoneEl.textContent = '未填写';
            if (ticketTypeEl) ticketTypeEl.textContent = '个人票';
        }
    } else if (uiState && uiState.ticketType === 'group') {
        // 团体票逻辑：获取团体成员列表
        const groupMembers = window.UIMemberManagement ?
            window.UIMemberManagement.getGroupMembersList() : [];

        if (groupMembers && groupMembers.length > 0) {
            if (customerNameEl) customerNameEl.textContent = `${groupMembers[0].name} 等${groupMembers.length}人`;
            if (customerAgeEl) customerAgeEl.textContent = `${groupMembers[0].age}岁`;
            if (customerPhoneEl) customerPhoneEl.textContent = '未填写';
            if (ticketTypeEl) ticketTypeEl.textContent = `团体票 (${groupMembers.length}人)`;
        } else {
            if (customerNameEl) customerNameEl.textContent = '未添加成员';
            if (customerAgeEl) customerAgeEl.textContent = '未填写';
            if (customerPhoneEl) customerPhoneEl.textContent = '未填写';
            if (ticketTypeEl) ticketTypeEl.textContent = '团体票';
        }
    } else {
        // 默认逻辑
        if (customerNameEl) customerNameEl.textContent = '未填写';
        if (customerAgeEl) customerAgeEl.textContent = '未填写';
        if (customerPhoneEl) customerPhoneEl.textContent = '未填写';
        if (ticketTypeEl) ticketTypeEl.textContent = '个人票';
    }
}

/**
 * 处理最终支付（确认页面使用）
 */
function handleFinalPayment() {
    console.log('处理最终支付确认...');

    let unitPrice = 45; // 默认票价
    let totalCost = 0;
    try {
        const movieData = JSON.parse(localStorage.getItem('selectedMovieInfo'));
        if (movieData && movieData.price) {
            unitPrice = Number(movieData.price);
        }
    } catch (e) { }
    const selectedSeats = window.StateManager ? window.StateManager.getSelectedSeats() : [];
    totalCost = unitPrice * selectedSeats.length;

    // 获取客户信息
    const customerInfo = window.UIMemberManagement && window.UIMemberManagement.getMyCustomerDataEnhanced
        ? window.UIMemberManagement.getMyCustomerDataEnhanced()
        : { ticketType: 'individual', members: [] };

    customerInfo.totalCost = totalCost;
    customerInfo.unitPrice = unitPrice;

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
        // 订单已由 main.js 创建，UI 层无需再创建订单

        // 清空当前的用户数据
        if (window.UIMemberManagement && window.UIMemberManagement.clearMembers) {
            window.UIMemberManagement.clearMembers();
            console.log('已清除当前用户数据');
        }

        // 切换到 final-view，优先用UIViewController.switchToView
        if (window.UIViewController && typeof window.UIViewController.switchToView === 'function') {
            window.UIViewController.switchToView('final');
        } else {
            // 兜底方案：保持在当前确认页面
            console.warn('UIViewController 不可用，保持在当前确认页面');
        }

        console.log('支付完成');
    } else {
        const errorMessage = result && result.message ? result.message : '支付失败，请重试';
        alert('支付失败：' + errorMessage);
        console.error('❌ 支付失败:', errorMessage);
    }
}

/**
 * 绑定支付方式选择事件
 */
function bindPaymentMethodEvents() {
    const paymentOptions = document.querySelectorAll('.payment-option');
    
    paymentOptions.forEach(option => {
        // 单击事件 - 选择支付方式
        option.addEventListener('click', function() {
            // 移除其他选项的active状态
            paymentOptions.forEach(opt => opt.classList.remove('active'));
            
            // 为当前选项添加active状态
            this.classList.add('active');
            
            // 获取选择的支付方式
            const radioInput = this.querySelector('input[type="radio"]');
            if (radioInput) {
                radioInput.checked = true;
                const selectedPayment = radioInput.value;
                console.log('选择的支付方式:', selectedPayment);
                
                // 保存到localStorage
                localStorage.setItem('selectedPaymentMethod', selectedPayment);
                
                // 更新支付方式信息
                updatePaymentMethod(selectedPayment);
            }
        });

        // 双击事件 - 显示支付方式详细图片
        option.addEventListener('dblclick', function(e) {
            e.preventDefault();
            e.stopPropagation();
            
            const radioInput = this.querySelector('input[type="radio"]');
            if (radioInput) {
                const paymentType = radioInput.value;
                showPaymentMethodImage(paymentType);
            }
        });
    });
}

/**
 * 显示支付方式详细图片
 * @param {string} paymentType - 支付方式类型
 */
function showPaymentMethodImage(paymentType) {
    const imageData = getPaymentMethodImageData(paymentType);
    if (!imageData) {
        console.warn('未找到支付方式图片:', paymentType);
        return;
    }

    // 创建模态框
    createPaymentImageModal(imageData);
}

/**
 * 获取支付方式图片数据
 * @param {string} paymentType - 支付方式类型
 * @returns {Object|null} 图片数据对象
 */
function getPaymentMethodImageData(paymentType) {
    const imageDatabase = {
        'Genshin': {
            title: '原石支付详情',
            description: '原神游戏内货币支付方式',
            base64: 'data:image/png;base64,' // 这里应该是完整的base64编码
        },
        'Deltaforce': {
            title: '哈夫币支付详情',
            description: '三角洲部队游戏内货币支付方式',
            base64: 'data:image/png;base64,***' // 这里应该是完整的base64编码
        },
        'Arknights': {
            title: '源石支付详情',
            description: '明日方舟游戏内货币支付方式',
            base64: 'data:image/png;base64,***' // 这里应该是完整的base64编码
        },
        'IdentityV': {
            title: '回声支付详情',
            description: '第五人格游戏内货币支付方式',
            base64: 'data:image/png;base64,***' // 这里应该是完整的base64编码
        }
    };

    return imageDatabase[paymentType] || null;
}

/**
 * 创建支付方式图片模态框
 * @param {Object} imageData - 图片数据
 */
function createPaymentImageModal(imageData) {
    // 检查是否已存在模态框，如果存在则先移除
    const existingModal = document.getElementById('payment-image-modal');
    if (existingModal) {
        existingModal.remove();
    }

    // 创建模态框HTML
    const modalHTML = `
        <div class="payment-image-modal" id="payment-image-modal">
            <div class="payment-image-overlay">
                <div class="payment-image-container">
                    <div class="payment-image-header">
                        <h3>${imageData.title}</h3>
                        <button class="payment-image-close" id="payment-image-close">×</button>
                    </div>
                    <div class="payment-image-body">
                        <img src="${imageData.base64}" alt="${imageData.title}" class="payment-detail-image">
                        <p class="payment-image-description">${imageData.description}</p>
                    </div>
                </div>
            </div>
        </div>
    `;

    // 添加到页面
    document.body.insertAdjacentHTML('beforeend', modalHTML);

    // 绑定关闭事件
    bindPaymentImageModalEvents();

    // 显示模态框
    const modal = document.getElementById('payment-image-modal');
    if (modal) {
        modal.style.display = 'flex';
        // 添加显示动画
        setTimeout(() => {
            modal.classList.add('show');
        }, 10);
    }
}

/**
 * 绑定支付图片模态框事件
 */
function bindPaymentImageModalEvents() {
    const modal = document.getElementById('payment-image-modal');
    const closeBtn = document.getElementById('payment-image-close');
    const overlay = modal?.querySelector('.payment-image-overlay');

    // 关闭按钮事件
    if (closeBtn) {
        closeBtn.addEventListener('click', closePaymentImageModal);
    }

    // 点击遮罩层关闭
    if (overlay) {
        overlay.addEventListener('click', function(e) {
            if (e.target === overlay) {
                closePaymentImageModal();
            }
        });
    }

    // ESC键关闭
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape' && modal && modal.style.display === 'flex') {
            closePaymentImageModal();
        }
    });
}

/**
 * 关闭支付图片模态框
 */
function closePaymentImageModal() {
    const modal = document.getElementById('payment-image-modal');
    if (modal) {
        modal.classList.remove('show');
        setTimeout(() => {
            modal.remove();
        }, 300);
    }
}

/**
 * 更新支付方式信息
 */
function updatePaymentMethod(paymentType) {
    const paymentNames = {
        'Genshin': '原石支付',
        'Deltaforce': '哈夫币支付',
        'Arknights': '源石支付',
        'IdentityV': '回声支付'
    };
    
    // 更新确认页面的支付方式显示
    const confirmPaymentMethod = document.getElementById('confirm-payment-method');
    if (confirmPaymentMethod) {
        confirmPaymentMethod.textContent = paymentNames[paymentType] || paymentType;
    }
}

// 在支付页面初始化时调用
function initializePaymentView() {
    // 绑定支付方式事件
    bindPaymentMethodEvents();
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

        img.onload = function () {
            console.log('图片格式兼容:', imageSrc);
            resolve(imageSrc);
        };

        img.onerror = function () {
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
        imgElement.onerror = function () {
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

        // 支付方式管理
        bindPaymentMethodEvents,
        showPaymentMethodImage,
        initializePaymentView,

        // 图片处理工具
        checkImageCompatibility,
        setSafeImageSrc
    };
}

// 页面加载时初始化支付方式事件
document.addEventListener('DOMContentLoaded', function() {
    // 等待页面完全加载后绑定事件
    setTimeout(() => {
        if (document.getElementById('payment-view')) {
            bindPaymentMethodEvents();
        }
    }, 500);
});

console.log('UI支付管理模块已加载');
