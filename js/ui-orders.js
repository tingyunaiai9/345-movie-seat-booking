/**
 * 电影院票务系统 - 订单管理模块
 * 负责我的订单功能：订单CRUD操作、状态管理、订单详情等
 */

// ========================= 全局常量和配置 =========================

// 订单状态文本映射
const statusText = {
    'reserved': '已预约',
    'sold': '已支付',
    'cancelled': '已取消',
    'expired': '已过期',
    'refunded': '已退款'
};

// 预约过期时间常量（分钟）
const RESERVATION_EXPIRE_MINUTES = 30;

// 订单筛选类型
const ORDER_FILTER_TYPES = {
    ALL: 'all',
    RESERVED: 'reserved',
    SOLD: 'sold',
    INVALID: 'invalid',
    EXPIRED: 'expired',
    CANCELLED: 'cancelled',
    REFUNDED: 'refunded'
};

// 订单管理状态
const MyOrdersState = {
    orders: [],
    currentFilter: ORDER_FILTER_TYPES.ALL,
    searchKeyword: ''
};

// ========================= 订单页面管理 =========================

/**
 * 初始化我的订单页面功能
 */
function initializeMyOrdersFeature() {
    console.log('初始化我的订单功能');

    // 绑定我的订单相关事件
    bindMyOrdersEvents();

    // 直接从 localStorage 加载订单数据
    loadMyOrdersFromLocalStorage();
    
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

        // 从 localStorage 加载订单数据
        loadMyOrdersFromLocalStorage();
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
 * 直接从 localStorage 获取订单数据
 */
function loadMyOrdersFromLocalStorage() {
    try {
        const stored = localStorage.getItem('movieTicketOrders');
        if (stored) {
            MyOrdersState.orders = JSON.parse(stored);
        } else {
            MyOrdersState.orders = [];
        }
    } catch (e) {
        console.error('从 localStorage 加载订单失败:', e);
        MyOrdersState.orders = [];
    }
}

/**
 * 检查并更新所有订单状态（使用 CinemaData 的函数）
 */
function checkAllOrdersStatus() {
    if (window.CinemaData && window.CinemaData.checkAndReleaseExpiredReservations) {
        const releasedSeats = window.CinemaData.checkAndReleaseExpiredReservations();
        if (releasedSeats.length > 0) {
            console.log('已释放过期预订座位:', releasedSeats);
            // 重新加载订单数据
            loadMyOrdersFromLocalStorage();
            // 对订单进行排序
            MyOrdersState.orders = sortOrders(MyOrdersState.orders);
        }
    }
}

/**
 * 检查并更新单个订单状态
 */
function checkAndUpdateOrderStatus(order) {
    // 如果是预约状态，检查是否过期
    if (order.status === 'reserved' && order.expiresAt) {
        const now = new Date();
        const expiresAt = new Date(order.expiresAt);
        if (now > expiresAt) {
            const oldStatus = order.status;
            order.status = 'expired';
            
            console.log(`订单状态变更: ${order.ticketId} 从 ${oldStatus} 变更为 ${order.status}`);
            
            // 状态改变后，重新排序所有订单
            MyOrdersState.orders = sortOrders(MyOrdersState.orders);
            
            // 打印当前所有订单的状态
            console.log('当前所有订单状态:');
            console.table(MyOrdersState.orders.map(ord => ({
                订单号: ord.ticketId,
                状态: ord.status,
                状态文本: statusText[ord.status] || ord.status,
                创建时间: ord.createdAt,
                过期时间: ord.expiresAt || '无',
                电影: ord.movieInfo?.title || '未知'
            })));
        }
    }
    return order;
}

/**
 * 订单排序函数
 * 自定义排序：活跃状态在上，失效状态在下，各自按时间排序
 * @param {Array} orders - 订单数组
 * @returns {Array} 排序后的订单数组
 */
function sortOrders(orders) {
    return orders.sort((a, b) => {
        // 定义订单状态的优先级
        const getStatusPriority = (status) => {
            switch (status) {
                case 'reserved': return 1; // 预约和支付状态最优先
                case 'sold': return 1; 
                case 'cancelled': return 2; // 失效状态放在后面
                case 'expired': return 2;
                case 'refunded': return 2;
                default: return 3; // 未知状态最后
            }
        };

        const priorityA = getStatusPriority(a.status);
        const priorityB = getStatusPriority(b.status);

        // 首先按状态优先级排序
        if (priorityA !== priorityB) {
            return priorityA - priorityB;
        }

        // 相同优先级内按时间排序（最新的在前）
        const timeA = new Date(a.createdAt || 0).getTime();
        const timeB = new Date(b.createdAt || 0).getTime();
        return timeB - timeA; // 降序排列，新的在前，旧的在后
    });
}

// ========================= 订单列表渲染 =========================

/**
 * 创建订单项元素
 */
function createMyOrderItem(order) {
    // 更新订单状态
    order = checkAndUpdateOrderStatus(order);
    
    const template = document.getElementById('order-item-template');
    const orderItem = template.content.cloneNode(true);
    
    // 获取电影信息
    let movieTitle = '未知电影';
    let movieImage = 'img/poster_cat.jpg';
    let movieTime = '时间待定';
    
    if (order.movieInfo) {
        movieTitle = order.movieInfo.title || movieTitle;
        movieImage = order.movieInfo.image || movieImage;
        movieTime = order.movieInfo.time || movieTime;
    } else {
        // 从电影ID获取信息
        const selectedMovieId = localStorage.getItem('selectedMovie');
        if (selectedMovieId) {
            const movieInfo = getMovieInfo(selectedMovieId);
            if (movieInfo) {
                movieTitle = movieInfo.title;
                movieImage = movieInfo.image;
            }
        }
    }

    // 设置订单ID
    const orderContainer = orderItem.querySelector('.order-item');
    orderContainer.dataset.orderId = order.ticketId;

    // 设置电影海报
    const moviePoster = orderItem.querySelector('.movie-poster');
    moviePoster.src = movieImage;
    moviePoster.alt = movieTitle;

    // 设置状态标签
    const statusBadge = orderItem.querySelector('.order-status-badge .status-text');
    statusBadge.textContent = statusText[order.status] || order.status;
    statusBadge.parentElement.className = `order-status-badge ${order.status}`;

    // 设置电影标题
    const titleText = orderItem.querySelector('.title-text');
    titleText.textContent = movieTitle;

    // 设置放映时间
    const showtimeText = orderItem.querySelector('.showtime-text');
    showtimeText.textContent = movieTime;

    // 设置座位信息
    const seatsText = orderItem.querySelector('.seats-text');
    const seatCount = Array.isArray(order.seats) ? order.seats.length : 0;
    const seatList = Array.isArray(order.seats) ? 
        order.seats.map(seatId => seatIdToText(seatId)).join(', ') : '无座位信息';
    seatsText.textContent = `${seatCount}张票 (${seatList})`;

    // 设置下单时间
    const createdTime = orderItem.querySelector('.created-time');
    createdTime.textContent = window.UIMovieSelector && window.UIMovieSelector.formatMovieShowTime 
        ? window.UIMovieSelector.formatMovieShowTime(new Date(order.createdAt))
        : order.createdAt;

    // 设置额外时间信息（支付时间或过期时间）
    const additionalTime = orderItem.querySelector('.additional-time');
    const additionalTimeLabel = orderItem.querySelector('.additional-time-label');
    const additionalTimeValue = orderItem.querySelector('.additional-time-value');
    
    if (order.status === 'reserved' && order.expiresAt) {
        additionalTime.style.display = 'block';
        additionalTimeLabel.textContent = '支付截止:';
        additionalTimeValue.textContent = window.UIMovieSelector && window.UIMovieSelector.formatMovieShowTime 
            ? window.UIMovieSelector.formatMovieShowTime(new Date(order.expiresAt))
            : order.expiresAt;
    } else if (order.status === 'sold' && order.paidAt) {
        additionalTime.style.display = 'block';
        additionalTimeLabel.textContent = '支付时间:';
        additionalTimeValue.textContent = window.UIMovieSelector && window.UIMovieSelector.formatMovieShowTime 
            ? window.UIMovieSelector.formatMovieShowTime(new Date(order.paidAt))
            : order.paidAt;
    }

    // 设置订单号
    const orderIdText = orderItem.querySelector('.order-id-text');
    orderIdText.textContent = order.ticketId;

    // 设置价格信息
    const totalPrice = orderItem.querySelector('.total-price');
    const priceBreakdown = orderItem.querySelector('.price-breakdown');
    const unitPrice = order.unitPrice || 45;
    const total = order.totalCost || (unitPrice * seatCount);
    
    totalPrice.textContent = `¥${total}`;
    priceBreakdown.textContent = `¥${unitPrice} × ${seatCount}张`;

    // 绑定点击事件
    orderContainer.addEventListener('click', () => {
        showMyOrderDetail(order);
    });

    return orderItem;
}

/**
 * 渲染订单列表
 */
function renderMyOrdersList() {
    loadMyOrdersFromLocalStorage();
    
    // 检查并更新所有订单状态
    checkAllOrdersStatus();
    
    const ordersList = document.getElementById('orders-list');
    const noOrders = document.getElementById('no-orders');

    if (!ordersList) return;

    console.log('渲染我的订单列表', MyOrdersState.orders);
    
    // 筛选订单
    let filteredOrders = MyOrdersState.orders;

    // 按状态筛选
    if (MyOrdersState.currentFilter !== ORDER_FILTER_TYPES.ALL) {
        filteredOrders = filteredOrders.filter(order => {
            switch (MyOrdersState.currentFilter) {
                case ORDER_FILTER_TYPES.RESERVED: return order.status === 'reserved';
                case ORDER_FILTER_TYPES.SOLD: return order.status === 'sold';
                case ORDER_FILTER_TYPES.INVALID: 
                    // 已失效：包括已取消、已过期、已退款
                    return order.status === 'cancelled' || order.status === 'expired' || order.status === 'refunded';
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
        filteredOrders = filteredOrders.filter(order => {
            // 搜索订单号、电影标题
            const movieTitle = order.movieInfo ? order.movieInfo.title : '';
            return (order.ticketId || order.id || '').toLowerCase().includes(keyword) ||
                   movieTitle.toLowerCase().includes(keyword);
        });
    }

    // 对筛选后的订单进行排序
    filteredOrders = sortOrders(filteredOrders);

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
            const orderItem = createMyOrderItem(order);
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
 * 显示订单详情
 */
function showMyOrderDetail(order) {
    // 检查并更新订单状态
    order = checkAndUpdateOrderStatus(order);
    
    const modal = document.getElementById('order-detail-modal');
    if (!modal) return;

    modal.dataset.currentOrderId = order.ticketId;

    // 获取电影信息
    let movieTitle = '未知电影';
    let movieTime = '时间待定';
    
    if (order.movieInfo) {
        movieTitle = order.movieInfo.title || movieTitle;
        movieTime = order.movieInfo.time || movieTime;
    } else {
        // 从当前选中的电影获取信息
        const selectedMovieId = localStorage.getItem('selectedMovie');
        if (selectedMovieId) {
            const movieInfo = getMovieInfo(selectedMovieId);
            if (movieInfo) {
                movieTitle = movieInfo.title;
                movieTime = movieInfo.defaultTime;
            }
        }
    }

    const customer = order.customerInfo || {};

    // 按新的顺序更新订单信息：电影名称、订单号、放映时间、状态、创建时间、支付时间/支付截止时间
    
    // 1. 电影名称（第一个显示）
    const movieTitleElement = document.getElementById('detail-movie-title');
    if (movieTitleElement) {
        movieTitleElement.textContent = movieTitle;
    }

    // 2. 订单号（第二个显示）
    document.getElementById('detail-order-id').textContent = order.ticketId;

    // 3. 放映时间（第三个显示）
    const movieTimeElement = document.getElementById('detail-movie-time');
    if (movieTimeElement) {
        movieTimeElement.textContent = movieTime;
    }

    // 4. 状态（第四个显示）
    const statusElement = document.getElementById('detail-order-status');
    statusElement.textContent = statusText[order.status] || order.status;
    statusElement.className = `detail-value order-status ${order.status}`;

    // 5. 创建时间（第五个显示）
    document.getElementById('detail-created-time').textContent = window.UIMovieSelector && window.UIMovieSelector.formatMovieShowTime 
        ? window.UIMovieSelector.formatMovieShowTime(new Date(order.createdAt))
        : order.createdAt;

    // 6. 支付时间/支付截止时间（第六个显示，根据状态动态显示）
    const paidTimeLabel = document.getElementById('detail-paid-time-label');
    const paidTime = document.getElementById('detail-paid-time');
    const expiresLabel = document.getElementById('detail-expires-label');
    const expiresTime = document.getElementById('detail-expires-time');

    // 重置所有时间相关显示
    [paidTimeLabel, paidTime, expiresLabel, expiresTime].forEach(element => {
        if (element) element.style.display = 'none';
    });

    if (order.status === 'reserved') {
        // 预约状态：显示支付截止时间
        let expiryTime;
        
        if (order.expiresAt) {
            expiryTime = new Date(order.expiresAt);
        } else if (order.createdAt) {
            // 直接计算预约过期时间
            const createdTime = new Date(order.createdAt);
            expiryTime = new Date(createdTime.getTime() + RESERVATION_EXPIRE_MINUTES * 60 * 1000);
            order.expiresAt = expiryTime.toISOString();
        }
        
        if (expiryTime) {
            expiresLabel.style.display = 'inline';
            expiresTime.style.display = 'inline';
            expiresTime.textContent = window.UIMovieSelector && window.UIMovieSelector.formatMovieShowTime 
                ? window.UIMovieSelector.formatMovieShowTime(expiryTime)
                : expiryTime;
        }
    } else if (order.paidAt && order.status === 'sold') {
        // 已支付状态：显示支付时间
        paidTimeLabel.style.display = 'inline';
        paidTime.style.display = 'inline';
        paidTime.textContent = window.UIMovieSelector && window.UIMovieSelector.formatMovieShowTime 
            ? window.UIMovieSelector.formatMovieShowTime(new Date(order.paidAt))
            : order.paidAt;
    }

    // 更新座位信息
    const seatTagsContainer = document.getElementById('detail-seat-tags');
    const seatsHtml = Array.isArray(order.seats) ?
        order.seats.map(id => `<span class="seat-tag">${seatIdToText(id)}</span>`).join('') : '';
    seatTagsContainer.innerHTML = seatsHtml;

    // 更新客户信息
    document.getElementById('detail-customer-name').textContent = customer.name || '未填写';
    document.getElementById('detail-customer-age').textContent = customer.age || '未填写';

    // 更新费用明细
    const seatCount = Array.isArray(order.seats) ? order.seats.length : 0;
    const unitPrice = order.unitPrice || 45;
    const totalPrice = order.totalCost || (seatCount * unitPrice);
    document.getElementById('detail-ticket-price').textContent = `¥${unitPrice} × ${seatCount}`;
    document.getElementById('detail-total-price').textContent = `¥${totalPrice}`;

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
    } else if (order.status === 'sold') {
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
            RESERVATION_EXPIRE_MINUTES,
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