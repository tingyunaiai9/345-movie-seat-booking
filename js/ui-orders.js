/**
 * 电影院票务系统 - 订单管理模块
 * 负责我的订单功能：订单CRUD操作、状态管理、订单详情等
 */

// ========================= 全局常量和配置 =========================

// 订单状态文本映射
const statusText = {
    'reserved': '已预约',
    'sold': '已支付',
    'paid': '已支付',
    'cancelled': '已取消',
    'expired': '已过期',
    'refunded': '已退款'
};

// 时间相关常量
const TIME_CONSTANTS = {
    RESERVATION_EXPIRE_MINUTES: 30,  // 预约过期时间（分钟）
    MILLISECONDS_PER_MINUTE: 60 * 1000,  // 每分钟的毫秒数
    DATE_FORMAT: {
        YEAR_MONTH_DAY: 'YYYY-MM-DD',
        HOUR_MINUTE: 'HH:mm',
        FULL: 'YYYY-MM-DD HH:mm'
    },
    TIME_LABELS: {
        ORDER_TIME: '下单时间:',
        EXPIRE_TIME: '过期时间:',
        PAY_TIME: '支付时间:',
        STATUS: '状态:'
    }
};

// 电影信息映射
const MOVIE_MAPPING = {
    'cat': {
        id: 'cat',
        title: '罗小黑战记',
        image: 'img/poster_cat.jpg',
        defaultTime: '2025-07-16 19:30'
    },
    'girl': {
        id: 'girl',
        title: '蓦然回首',
        image: 'img/poster_girl.jpg',
        defaultTime: '2025-07-16 21:00'
    },
    'love': {
        id: 'love',
        title: '情书',
        image: 'img/poster_love.jpg',
        defaultTime: '2025-07-16 20:15'
    }
};

// 默认配置
const DEFAULT_CONFIG = {
    MOVIE: {
        TITLE: '未知电影',
        TIME: '时间待定',
        IMAGE: 'img/poster_cat.jpg'
    },
    TICKET: {
        UNIT_PRICE: 45,
        CURRENCY: '¥'
    },
    CUSTOMER: {
        DEFAULT_NAME: '未填写',
        DEFAULT_AGE: '未填写'
    }
};

// 订单筛选类型
const ORDER_FILTER_TYPES = {
    ALL: 'all',
    RESERVED: 'reserved',
    PAID: 'paid',
    EXPIRED: 'expired',
    CANCELLED: 'cancelled',
    REFUNDED: 'refunded'
};

// ========================= 订单管理状态 =========================
const MyOrdersState = {
    orders: [],
    currentFilter: ORDER_FILTER_TYPES.ALL,
    searchKeyword: ''
};

// ========================= 工具函数 =========================

/**
 * 获取电影信息
 * @param {string} movieId - 电影ID
 * @returns {Object} - 电影信息对象
 */
function getMovieInfo(movieId) {
    return MOVIE_MAPPING[movieId] || {
        id: movieId,
        title: DEFAULT_CONFIG.MOVIE.TITLE,
        image: DEFAULT_CONFIG.MOVIE.IMAGE,
        defaultTime: DEFAULT_CONFIG.MOVIE.TIME
    };
}

/**
 * 计算预约过期时间
 * @param {Date|string} createdAt - 创建时间
 * @returns {Date} - 过期时间
 */
function calculateExpiryTime(createdAt) {
    const createdTime = new Date(createdAt);
    return new Date(createdTime.getTime() + TIME_CONSTANTS.RESERVATION_EXPIRE_MINUTES * TIME_CONSTANTS.MILLISECONDS_PER_MINUTE);
}

/**
 * 计算剩余时间（分钟）
 * @param {Date} expiryTime - 过期时间
 * @returns {number} - 剩余分钟数
 */
function calculateRemainingMinutes(expiryTime) {
    const now = new Date();
    const timeLeft = expiryTime - now;
    return Math.floor(timeLeft / TIME_CONSTANTS.MILLISECONDS_PER_MINUTE);
}

// ========================= 订单状态检查和更新 =========================

/**
 * 检查并更新订单状态
 * @param {Object} order - 订单对象
 * @returns {Object} - 更新后的订单对象
 */
function checkAndUpdateOrderStatus(order) {
    const now = new Date();
    let shouldUpdate = false;
    
    // 检查预约订单是否过期
    if (order.status === 'reserved') {
        let expiryTime;
        
        if (order.expiresAt) {
            expiryTime = new Date(order.expiresAt);
        } else if (order.createdAt) {
            expiryTime = calculateExpiryTime(order.createdAt);
            order.expiresAt = expiryTime.toISOString();
        }
        
        if (expiryTime && now > expiryTime) {
            order.status = 'expired';
            shouldUpdate = true;
        }
    }
    
    // 检查已支付订单的电影时间是否已过
    if (order.status === 'sold' || order.status === 'paid') {
        const selectedMovieInfo = localStorage.getItem('selectedMovieInfo');
        if (selectedMovieInfo) {
            try {
                const movieInfo = JSON.parse(selectedMovieInfo);
                if (movieInfo.time) {
                    // 解析电影时间
                    const movieTime = new Date(movieInfo.time);
                    if (!isNaN(movieTime.getTime()) && now > movieTime) {
                        order.status = 'expired';
                        shouldUpdate = true;
                    }
                }
            } catch (e) {
                console.warn('解析电影时间信息失败:', e);
            }
        }
    }
    
    // 如果状态发生变化，更新到数据存储
    if (shouldUpdate && window.CinemaData && window.CinemaData.updateOrderStatus) {
        window.CinemaData.updateOrderStatus(order.ticketId, order.status);
    }
    
    return order;
}

/**
 * 批量检查和更新所有订单状态
 */
function checkAllOrdersStatus() {
    if (MyOrdersState.orders.length > 0) {
        MyOrdersState.orders = MyOrdersState.orders.map(order => checkAndUpdateOrderStatus(order));
    }
}

// ========================= 订单页面管理 =========================

/**
 * 初始化我的订单页面功能
 */
function initializeMyOrdersFeature() {
    console.log('初始化我的订单功能');

    // 绑定我的订单相关事件
    bindMyOrdersEvents();

    // 从 main.js 统一加载订单数据
    loadMyOrdersFromMain();
    
    // 检查并更新订单状态
    checkAllOrdersStatus();
    
    renderMyOrdersList();
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
            
            // 隐藏导航栏
            if (window.UIViewController && window.UIViewController.hideNavigationSteps) {
                window.UIViewController.hideNavigationSteps();
            }
            
            showMyOrdersPage();
        });
    }

    // 关闭按钮 - 返回到之前页面
    const closeBtn = document.getElementById('close-my-orders');
    if (closeBtn) {
        closeBtn.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            
            // 显示导航栏
            if (window.UIViewController && window.UIViewController.showNavigationSteps) {
                window.UIViewController.showNavigationSteps();
            }
            
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

        // 只从 main.js 统一加载订单数据
        loadMyOrdersFromMain();
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

// ========================= 订单数据管理 =========================

/**
 * 从 main.js 获取订单数据
 */
function loadMyOrdersFromMain() {
    if (window.CinemaData && window.CinemaData.getAllOrders) {
        MyOrdersState.orders = window.CinemaData.getAllOrders();
    } else {
        MyOrdersState.orders = [];
    }
}

// ========================= 订单列表渲染 =========================

/**
 * 渲染订单列表
 */
function renderMyOrdersList() {
    loadMyOrdersFromMain();
    
    // 检查并更新所有订单状态
    checkAllOrdersStatus();
    
    const ordersList = document.getElementById('orders-list');
    const noOrders = document.getElementById('no-orders');

    if (!ordersList) return;

    // 筛选订单
    let filteredOrders = MyOrdersState.orders;

    // 按状态筛选
    if (MyOrdersState.currentFilter !== ORDER_FILTER_TYPES.ALL) {
        filteredOrders = filteredOrders.filter(order => {
            switch (MyOrdersState.currentFilter) {
                case ORDER_FILTER_TYPES.RESERVED: return order.status === 'reserved';
                case ORDER_FILTER_TYPES.PAID: return order.status === 'sold' || order.status === 'paid';
                case ORDER_FILTER_TYPES.EXPIRED: return order.status === 'expired';
                case ORDER_FILTER_TYPES.CANCELLED: return order.status === 'cancelled';
                case ORDER_FILTER_TYPES.REFUNDED: return order.status === 'refunded';
                default: return true;
            }
        });
    }

    // 按关键词搜索
    if (MyOrdersState.searchKeyword) {
        const keyword = MyOrdersState.searchKeyword.toLowerCase();
        filteredOrders = filteredOrders.filter(order =>
            (order.ticketId || order.id || '').toLowerCase().includes(keyword) ||
            (order.movieTitle || '').toLowerCase().includes(keyword)
        );
    }

    // 按时间排序 - 最新的在上，最旧的在下
    filteredOrders.sort((a, b) => {
        const timeA = new Date(a.createdAt || 0).getTime();
        const timeB = new Date(b.createdAt || 0).getTime();
        return timeB - timeA; // 降序排列，新的在前，旧的在后
    });

    // 清空列表
    ordersList.innerHTML = '';

    if (filteredOrders.length === 0) {
        // 显示无订单状态
        if (noOrders) {
            ordersList.appendChild(noOrders.cloneNode(true));
        }
    } else {
        // 渲染订单项
        filteredOrders.forEach((order, index) => {
            const isLatest = index === 0; // 第一个订单是最新的
            const orderItem = createMyOrderItem(order, isLatest);
            ordersList.appendChild(orderItem);
        });
    }
}

/**
 * 座位ID转换为"排座"格式
 */
function seatIdToText(seatId) {
    // seatId 格式为 'seat-8-12'
    const parts = seatId.split('-');
    if (parts.length === 3) {
        return `${parts[1]}排${parts[2]}座`;
    }
    return seatId;
}

/**
 * 时间格式化
 */
function formatDate(date) {
    if (!date) return '';
    if (typeof date === 'string') {
        // 兼容字符串存储的时间
        date = new Date(date);
    }
    if (!(date instanceof Date) || isNaN(date.getTime())) return '';
    return `${date.getFullYear()}-${date.getMonth() + 1}-${date.getDate()} ${date.getHours()}:${String(date.getMinutes()).padStart(2, '0')}`;
}

/**
 * 创建订单项元素
 */
function createMyOrderItem(order, isLatest = false) {
    // 检查并更新订单状态
    order = checkAndUpdateOrderStatus(order);
    
    // 获取模板
    const template = document.getElementById('order-item-template');
    if (!template) {
        console.error('订单项模板未找到');
        return document.createElement('div');
    }
    
    // 克隆模板内容
    const orderItem = template.content.cloneNode(true).querySelector('.order-item');
    
    // 设置基本属性
    orderItem.className = `order-item ${order.status}${isLatest ? ' latest-order' : ''}`;
    orderItem.dataset.orderId = order.ticketId;

    // 获取电影信息
    const selectedMovieId = localStorage.getItem('selectedMovie');
    const selectedMovieInfo = localStorage.getItem('selectedMovieInfo');
    
    // 使用常量获取电影信息
    const movieInfo = getMovieInfo(selectedMovieId);
    let movieTitle = movieInfo.title;
    let movieTime = movieInfo.defaultTime;
    let movieImage = movieInfo.image;
    
    // 如果有存储的电影信息，则使用存储的信息
    if (selectedMovieInfo) {
        try {
            const storedMovieInfo = JSON.parse(selectedMovieInfo);
            if (storedMovieInfo.time) {
                movieTime = storedMovieInfo.time;
            }
            if (storedMovieInfo.image) {
                movieImage = storedMovieInfo.image;
            }
        } catch (e) {
            console.warn('解析电影信息失败:', e);
        }
    }

    // 格式化座位信息
    const seatsText = Array.isArray(order.seats) ? order.seats.map(seatIdToText).join('、') : '';

    // 计算时间相关信息
    let timeInfo = '';
    let statusBadgeClass = '';
    let timeLabel = '';
    
    if (order.status === 'reserved') {
        let expiryTime;
        
        if (order.expiresAt) {
            expiryTime = new Date(order.expiresAt);
        } else if (order.createdAt) {
            expiryTime = calculateExpiryTime(order.createdAt);
            order.expiresAt = expiryTime.toISOString();
        }
        
        if (expiryTime) {
            const remainingMinutes = calculateRemainingMinutes(expiryTime);

            if (remainingMinutes > 0) {
                timeInfo = `${formatDate(expiryTime)} <span class="time-warning">(还剩 ${remainingMinutes} 分钟)</span>`;
                statusBadgeClass = 'urgent';
                timeLabel = TIME_CONSTANTS.TIME_LABELS.EXPIRE_TIME;
            } else {
                timeInfo = `${formatDate(expiryTime)}`;
                statusBadgeClass = 'expired';
                timeLabel = TIME_CONSTANTS.TIME_LABELS.EXPIRE_TIME;
            }
        }
    } else if (order.status === 'expired') {
        timeInfo = `已过期`;
        statusBadgeClass = 'expired';
        timeLabel = TIME_CONSTANTS.TIME_LABELS.STATUS;
    } else if (order.paidAt) {
        timeInfo = `${formatDate(order.paidAt)}`;
        statusBadgeClass = 'paid';
        timeLabel = TIME_CONSTANTS.TIME_LABELS.PAY_TIME;
    }

    // 价格计算
    const unitPrice = order.unitPrice || DEFAULT_CONFIG.TICKET.UNIT_PRICE;
    const seatCount = Array.isArray(order.seats) ? order.seats.length : 0;
    const totalPrice = order.totalPrice || (seatCount * unitPrice);

    // 填充模板数据
    // 电影海报和标题
    const moviePoster = orderItem.querySelector('.movie-poster');
    moviePoster.src = movieImage;
    moviePoster.alt = movieTitle;
    
    // 状态徽章
    const statusBadge = orderItem.querySelector('.order-status-badge');
    statusBadge.className = `order-status-badge ${order.status} ${statusBadgeClass}`;
    orderItem.querySelector('.status-text').textContent = statusText[order.status] || order.status;
    
    // 电影标题和最新标识
    orderItem.querySelector('.title-text').textContent = movieTitle;
    const latestBadge = orderItem.querySelector('.latest-badge');
    if (isLatest) {
        latestBadge.style.display = 'inline';
    } else {
        latestBadge.style.display = 'none';
    }
    
    // 电影时间和座位
    orderItem.querySelector('.showtime-text').textContent = movieTime;
    orderItem.querySelector('.seats-text').textContent = seatsText;
    
    // 下单时间
    orderItem.querySelector('.created-time').textContent = formatDate(order.createdAt);
    
    // 附加时间信息
    const additionalTime = orderItem.querySelector('.additional-time');
    if (timeInfo) {
        additionalTime.style.display = 'block';
        orderItem.querySelector('.additional-time-label').textContent = timeLabel;
        orderItem.querySelector('.additional-time-value').innerHTML = timeInfo;
    } else {
        additionalTime.style.display = 'none';
    }
    
    // 订单号
    orderItem.querySelector('.order-id-text').textContent = order.ticketId;
    
    // 价格信息
    orderItem.querySelector('.total-price').textContent = `${DEFAULT_CONFIG.TICKET.CURRENCY}${totalPrice}`;
    orderItem.querySelector('.price-breakdown').textContent = `${seatCount} 张票 × ${DEFAULT_CONFIG.TICKET.CURRENCY}${unitPrice}`;

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
    // 检查并更新订单状态
    order = checkAndUpdateOrderStatus(order);
    
    const modal = document.getElementById('order-detail-modal');
    if (!modal) return;

    modal.dataset.currentOrderId = order.ticketId;

    // 获取电影信息
    const selectedMovieId = localStorage.getItem('selectedMovie');
    const selectedMovieInfo = localStorage.getItem('selectedMovieInfo');
    
    // 使用常量获取电影信息
    const movieInfo = getMovieInfo(selectedMovieId);
    let movieTitle = movieInfo.title;
    let movieTime = movieInfo.defaultTime;
    
    if (selectedMovieInfo) {
        try {
            const storedMovieInfo = JSON.parse(selectedMovieInfo);
            if (storedMovieInfo.time) {
                movieTime = storedMovieInfo.time;
            }
        } catch (e) {
            console.warn('解析电影信息失败:', e);
        }
    }

    const customer = order.customerInfo || {};

    // 更新订单信息
    document.getElementById('detail-order-id').textContent = order.ticketId;

    const statusElement = document.getElementById('detail-order-status');
    statusElement.textContent = statusText[order.status] || order.status;
    statusElement.className = `detail-value order-status ${order.status}`;

    // 更新电影信息
    const movieTitleElement = document.getElementById('detail-movie-title');
    const movieTimeElement = document.getElementById('detail-movie-time');
    if (movieTitleElement) {
        movieTitleElement.textContent = movieTitle;
    }
    if (movieTimeElement) {
        movieTimeElement.textContent = movieTime;
    }

    document.getElementById('detail-created-time').textContent = formatDate(order.createdAt);

    // 支付时间（仅在已支付时显示）
    const paidTimeLabel = document.getElementById('detail-paid-time-label');
    const paidTime = document.getElementById('detail-paid-time');
    if (order.paidAt && (order.status === 'sold' || order.status === 'paid')) {
        paidTimeLabel.style.display = 'inline';
        paidTime.style.display = 'inline';
        paidTime.textContent = formatDate(order.paidAt);
    } else {
        paidTimeLabel.style.display = 'none';
        paidTime.style.display = 'none';
    }

    // 支付截止时间（仅在预约状态时显示）
    const expiresLabel = document.getElementById('detail-expires-label');
    const expiresTime = document.getElementById('detail-expires-time');
    if (order.status === 'reserved') {
        let expiryTime;
        
        if (order.expiresAt) {
            expiryTime = new Date(order.expiresAt);
        } else if (order.createdAt) {
            expiryTime = calculateExpiryTime(order.createdAt);
            order.expiresAt = expiryTime.toISOString();
        }
        
        if (expiryTime) {
            expiresLabel.style.display = 'inline';
            expiresTime.style.display = 'inline';
            expiresTime.textContent = formatDate(expiryTime);
        } else {
            expiresLabel.style.display = 'none';
            expiresTime.style.display = 'none';
        }
    } else {
        expiresLabel.style.display = 'none';
        expiresTime.style.display = 'none';
    }

    // 更新座位信息
    const seatTagsContainer = document.getElementById('detail-seat-tags');
    const seatsHtml = Array.isArray(order.seats) ?
        order.seats.map(id => `<span class="seat-tag">${seatIdToText(id)}</span>`).join('') : '';
    seatTagsContainer.innerHTML = seatsHtml;

    // 更新客户信息
    document.getElementById('detail-customer-name').textContent = customer.name || DEFAULT_CONFIG.CUSTOMER.DEFAULT_NAME;
    document.getElementById('detail-customer-age').textContent = customer.age || DEFAULT_CONFIG.CUSTOMER.DEFAULT_AGE;

    // 更新费用明细
    const seatCount = Array.isArray(order.seats) ? order.seats.length : 0;
    const unitPrice = order.unitPrice || DEFAULT_CONFIG.TICKET.UNIT_PRICE;
    const totalPrice = seatCount * unitPrice;
    document.getElementById('detail-ticket-price').textContent = `${DEFAULT_CONFIG.TICKET.CURRENCY}${unitPrice} × ${seatCount}`;
    document.getElementById('detail-total-price').textContent = `${DEFAULT_CONFIG.TICKET.CURRENCY}${totalPrice}`;

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
    } else if (order.status === 'paid' || order.status === 'sold') {
        if (refundBtn) refundBtn.style.display = 'inline-block';
    }
    // 已过期订单不显示任何操作按钮

    // 根据订单状态添加模态框类名（用于CSS样式）
    modal.className = `order-detail-modal ${order.status}`;

    // 显示模态框并确保在视口中央
    modal.style.display = 'flex';

    // 确保模态框聚焦（便于键盘操作）
    modal.focus();
}

/**
 * 隐藏订单详情
 */
function hideMyOrderDetail() {
    const modal = document.getElementById('order-detail-modal');
    if (modal) {
        modal.style.display = 'none';

        // 恢复页面滚动
        document.body.style.overflow = '';
    }
}

// ========================= 订单操作处理 =========================

/**
 * 处理取消订单
 */
function handleMyCancelOrder() {
    const modal = document.getElementById('order-detail-modal');
    const orderId = modal?.dataset.currentOrderId;

    if (!orderId) return;

    if (confirm('确定要取消这个订单吗？取消后将无法恢复。')) {
        if (window.CinemaData && window.CinemaData.cancelReservation) {
            const result = window.CinemaData.cancelReservation(orderId);
            if (result.success) {
                hideMyOrderDetail();
                renderMyOrdersList();
                alert('订单已取消');
            } else {
                alert(result.message || '取消失败');
            }
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
        if (window.CinemaData && window.CinemaData.payForReservation) {
            const result = window.CinemaData.payForReservation(orderId);
            if (result.success) {
                hideMyOrderDetail();
                renderMyOrdersList();
                alert('支付成功！');
            } else {
                alert(result.message || '支付失败');
            }
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
        if (window.CinemaData && window.CinemaData.refundTicket) {
            const result = window.CinemaData.refundTicket(orderId);
            if (result.success) {
                hideMyOrderDetail();
                renderMyOrdersList();
                alert('退款申请已提交，款项将在3-5个工作日内退回');
            } else {
                alert(result.message || '退款失败');
            }
        }
    }
}

// ========================= 模块导出 =========================

// 在浏览器环境中，将函数暴露到全局
if (typeof window !== 'undefined') {
    window.UIOrders = {
        // 页面管理
        showMyOrdersPage,
        hideMyOrdersPage,
        initializeMyOrdersFeature,

        // 订单管理
        renderMyOrdersList,

        // 订单详情
        showMyOrderDetail,
        hideMyOrderDetail,

        // 订单操作
        handleMyCancelOrder,
        handleMyPayReservedOrder,
        handleMyRefundOrder,

        // 状态访问
        getMyOrdersState: () => MyOrdersState,
        
        // 常量访问
        getConstants: () => ({
            TIME_CONSTANTS,
            MOVIE_MAPPING,
            DEFAULT_CONFIG,
            ORDER_FILTER_TYPES,
            statusText
        })
    };
}

// 页面加载时初始化我的订单功能
document.addEventListener('DOMContentLoaded', function () {
    // 延迟初始化，确保其他模块已加载
    setTimeout(() => {
        initializeMyOrdersFeature();
        console.log('我的订单功能已初始化');
    }, 300);
});

console.log('UI订单管理模块已加载');