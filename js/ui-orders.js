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

// ========================= 订单数据管理 =========================

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

// ========================= 订单列表渲染 =========================

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

// ========================= 订单详情管理 =========================

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

// ========================= 订单操作处理 =========================

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

// ========================= 订单创建接口 =========================

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
    return window.UIValidation ? window.UIValidation.getMySelectedSeatsData() : [];
}

/**
 * 获取客户数据
 */
function getMyCustomerData() {
    return window.UIValidation ? window.UIValidation.getMyCustomerData() : {
        name: '未填写',
        age: '未填写',
        phone: '未填写'
    };
}

/**
 * 计算总价格
 */
function calculateMyTotalPrice() {
    return window.UIValidation ? window.UIValidation.calculateMyTotalPrice() : 90;
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
        createMyReservationOrder,
        createMyPurchaseOrder,
        loadMyOrdersFromStorage,
        saveMyOrderToStorage,
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
document.addEventListener('DOMContentLoaded', function() {
    // 延迟初始化，确保其他模块已加载
    setTimeout(() => {
        initializeMyOrdersFeature();
        console.log('我的订单功能已初始化');
    }, 300);
});

console.log('UI订单管理模块已加载');
