/**
 * 电影院票务系统 - 订单管理模块
 * 负责我的订单功能：订单CRUD操作、状态管理、订单详情等
 */

// ========================= 订单管理状态 =========================
const MyOrdersState = {
    orders: [],
    currentFilter: 'all',
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

    // 从 main.js 统一加载订单数据
    loadMyOrdersFromMain();
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
    const ordersList = document.getElementById('orders-list');
    const noOrders = document.getElementById('no-orders');

    if (!ordersList) return;

    // 筛选订单
    let filteredOrders = MyOrdersState.orders;

    // 按状态筛选
    if (MyOrdersState.currentFilter !== 'all') {
        filteredOrders = filteredOrders.filter(order => {
            switch (MyOrdersState.currentFilter) {
                case 'reserved': return order.status === 'reserved';
                case 'paid': return order.status === 'sold' || order.status === 'paid';
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

    // 🔑 修改：按时间排序 - 最新的在上，最旧的在下
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
 * 座位ID转换为“排座”格式
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
    // order 即 ticket 对象
    const orderItem = document.createElement('div');
    orderItem.className = `order-item ${order.status}${isLatest ? ' latest-order' : ''}`;
    orderItem.dataset.orderId = order.ticketId;

    const statusText = {
        'reserved': '已预约',
        'sold': '已支付',
        'cancelled': '已取消',
        'expired': '已过期',
        'refunded': '已退款'
    };

    // 格式化座位信息
    const seatsText = Array.isArray(order.seats) ? order.seats.map(seatIdToText).join('、') : '';

    // 计算过期状态
    let expiryWarning = '';
    if (order.status === 'reserved' && order.expiresAt) {
        const expiryTime = new Date(order.expiresAt);
        const now = new Date();
        const timeLeft = expiryTime - now;

        if (timeLeft > 0) {
            const minutes = Math.floor(timeLeft / (1000 * 60));
            expiryWarning = `<span class=\"expiry-warning\" style=\"color: #dc3545; font-weight: 600;\">还剩 ${minutes} 分钟支付时间</span>`;
        } else {
            expiryWarning = `<span class=\"expiry-warning\" style=\"color: #dc3545; font-weight: 600;\">预约已过期</span>`;
        }
    }

    // 客户信息
    const customer = order.customerInfo || {};
    // 价格（假设每张票45元）
    const unitPrice = order.unitPrice || 45; // 默认票价
    const seatCount = Array.isArray(order.seats) ? order.seats.length : 0;
    const totalPrice = order.totalPrice || (seatCount * unitPrice); // 总价

    // 最新订单标识
    const latestBadge = isLatest ? '<span class="latest-badge">最新</span>' : '';

    orderItem.innerHTML = `
        <div class=\"order-header\">
            <span class=\"order-number\">订单号: ${order.ticketId} ${latestBadge}</span>
            <span class=\"order-status ${order.status}\">${statusText[order.status] || order.status}</span>
        </div>
        <div class=\"order-content\">
            <div class=\"order-details\">
                <h5>客户信息</h5>
                <div class=\"order-meta\">
                    姓名: ${customer.name || '未填写'}<br>
                    年龄: ${customer.age || '未填写'}<br>
                    下单时间: ${formatDate(order.createdAt)}
                    ${order.paidAt ? '<br>支付时间: ' + formatDate(order.paidAt) : ''}
                    ${expiryWarning ? '<br>' + expiryWarning : ''}
                </div>
            </div>
            <div class=\"order-price\">
                <div class=\"price-amount\">¥${totalPrice}</div>
                <div class=\"price-details\">
                    共 ${seatCount} 张票<br>
                    单价：¥${unitPrice}<br>
                    座位: ${seatsText}<br>
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

// ========================= 订单详情管理 =========================

/**
 * 显示订单详情
 */
function showMyOrderDetail(order) {
    const modal = document.getElementById('order-detail-modal');
    if (!modal) return;

    modal.dataset.currentOrderId = order.ticketId;

    const statusText = {
        'reserved': '已预约',
        'sold': '已支付',
        'cancelled': '已取消',
        'expired': '已过期',
        'refunded': '已退款'
    };

    const customer = order.customerInfo || {};

    // 更新订单信息
    document.getElementById('detail-order-id').textContent = order.ticketId;

    const statusElement = document.getElementById('detail-order-status');
    statusElement.textContent = statusText[order.status] || order.status;
    statusElement.className = `detail-value order-status ${order.status}`;

    document.getElementById('detail-created-time').textContent = formatDate(order.createdAt);

    // 支付时间（仅在已支付时显示）
    const paidTimeLabel = document.getElementById('detail-paid-time-label');
    const paidTime = document.getElementById('detail-paid-time');
    if (order.paidAt) {
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
    if (order.expiresAt && order.status === 'reserved') {
        expiresLabel.style.display = 'inline';
        expiresTime.style.display = 'inline';
        expiresTime.textContent = formatDate(order.expiresAt);
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
    document.getElementById('detail-customer-name').textContent = customer.name || '未填写';
    document.getElementById('detail-customer-age').textContent = customer.age || '未填写';

    // 更新费用明细
    const seatCount = Array.isArray(order.seats) ? order.seats.length : 0;
    const unitPrice = order.unitPrice || 45; // 默认票价
    const totalPrice = seatCount * unitPrice;
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
    } else if (order.status === 'paid' || order.status === 'sold') {
        if (refundBtn) refundBtn.style.display = 'inline-block';
    }

    // 显示模态框并确保在视口中央
    modal.style.display = 'flex';

    // 防止页面滚动
    document.body.style.overflow = 'hidden';

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
        getMyOrdersState: () => MyOrdersState
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
