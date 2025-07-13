/**
 * 电影院票务系统 - 选座验证模块
 * 负责选座规则验证、购票验证、业务逻辑验证等
 */

// ========================= 选座验证函数 =========================

/**
 * 验证选座规则
 * @returns {boolean} 是否通过验证
 */
function validateSeatSelection() {
    console.log('开始验证选座规则...');

    // 获取选中的座位
    const selectedSeats = getMySelectedSeatsData();

    if (!selectedSeats || selectedSeats.length === 0) {
        alert('请先选择座位');
        return false;
    }

    // 获取客户信息
    const customerInfo = window.UIMemberManagement ?
        window.UIMemberManagement.getMyCustomerDataEnhanced() :
        { ticketType: 'individual', members: [] };

    // 根据票务类型进行不同的验证
    if (customerInfo.ticketType === 'individual') {
        return validateIndividualSeatSelection(selectedSeats, customerInfo);
    } else {
        return validateGroupSeatSelection(selectedSeats, customerInfo);
    }
}

/**
 * 验证个人票选座规则
 * @param {Array} selectedSeats - 选中的座位
 * @param {Object} customerInfo - 客户信息
 * @returns {boolean} 是否通过验证
 */
function validateIndividualSeatSelection(selectedSeats, customerInfo) {
    console.log('验证个人票选座规则...');

    // 检查座位数量是否与成员数量匹配
    const memberCount = customerInfo.members ? customerInfo.members.length : 0;

    if (memberCount === 0) {
        alert('请先添加成员信息');
        return false;
    }

    if (selectedSeats.length !== memberCount) {
        alert(`选中的座位数量（${selectedSeats.length}个）与成员数量（${memberCount}人）不匹配`);
        return false;
    }

    // 验证年龄限制
    if (!validateAgeRestriction(customerInfo.members, selectedSeats)) {
        return false;
    }

    return true;
}

/**
 * 验证团体票选座规则
 * @param {Array} selectedSeats - 选中的座位
 * @param {Object} customerInfo - 客户信息
 * @returns {boolean} 是否通过验证
 */
function validateGroupSeatSelection(selectedSeats, customerInfo) {
    console.log('验证团体票选座规则...');

    // 检查座位数量是否与成员数量匹配
    const memberCount = customerInfo.members ? customerInfo.members.length : 0;

    if (memberCount === 0) {
        alert('请先添加团体成员信息');
        return false;
    }

    if (selectedSeats.length !== memberCount) {
        alert(`选中的座位数量（${selectedSeats.length}个）与团体成员数量（${memberCount}人）不匹配`);
        return false;
    }

    // 验证年龄限制
    if (!validateAgeRestriction(customerInfo.members, selectedSeats)) {
        return false;
    }

    // 团体票要求座位必须连续
    if (selectedSeats.length > 1 && !areSeatsConsecutive(selectedSeats)) {
        alert('团体票要求座位必须连续，请重新选择');
        return false;
    }

    return true;
}

/**
 * 验证年龄限制
 * @param {Array} members - 成员列表
 * @param {Array} seats - 座位数组
 * @returns {boolean} 是否通过验证
 */
function validateAgeRestriction(members, seats) {
    if (!members || members.length === 0) {
        return true;
    }
    if (!seats || seats.length !== members.length) {
        alert('成员数量与座位数量不一致，无法进行年龄限制验证');
        return false;
    }
    for (let i = 0; i < members.length; i++) {
        const member = members[i];
        const seat = seats[i];
        const ageGroup = window.CinemaData.getAgeGroup(member.age);
        if (!window.CinemaData.canSitInRow(ageGroup, seat.row)) {
            alert(`成员“${member.name || ''}”年龄为${member.age}岁，不能坐在第${seat.row}排，请重新选择座位或调整成员顺序。`);
            return false;
        }
    }
    return true;
}

/**
 * 检查座位是否连续
 * @param {Array} seats - 座位数组
 * @returns {boolean} 是否连续
 */
function areSeatsConsecutive(seats) {
    if (!seats || seats.length <= 1) {
        return true;
    }

    // 按行和列排序
    const sortedSeats = seats.sort((a, b) => {
        if (a.row !== b.row) {
            return a.row - b.row;
        }
        return a.col - b.col;
    });

    // 检查是否在同一行且连续
    let currentRow = sortedSeats[0].row;
    let expectedCol = sortedSeats[0].col;

    for (let i = 0; i < sortedSeats.length; i++) {
        const seat = sortedSeats[i];

        if (seat.row !== currentRow || seat.col !== expectedCol) {
            return false;
        }

        expectedCol = seat.col + 1;
    }

    return true;
}

// ========================= 业务逻辑处理 =========================

/**
 * 处理直接购票
 */
function handleDirectPurchase() {
    console.log('开始处理直接购票...');

    // 验证选座规则
    if (!validateSeatSelection()) {
        return; // 验证失败，函数内部已处理提示
    }

    // 获取客户信息
    const customerInfo = window.UIMemberManagement ?
        window.UIMemberManagement.getMyCustomerDataEnhanced() :
        { ticketType: 'individual', members: [] };

    console.log('客户信息:', customerInfo);

    try {
        // 跳转到支付页面
        if (window.UICoreModule && window.UICoreModule.switchView) {
            window.UICoreModule.switchView(window.UICoreModule.UI_CONFIG.VIEWS.PAYMENT);
        }
    } catch (error) {
        console.error('购票过程中发生错误:', error);
        alert('购票过程中发生错误，请重试');
    }
}

/**
 * 处理预订座位
 */
function handleReservation() {
    console.log('开始处理预订座位...');

    // 检查StateManager是否可用
    if (!window.StateManager || !window.StateManager.performReservation) {
        console.error('StateManager未加载或performReservation函数不存在');
        alert('预订功能暂不可用，请稍后再试');
        return;
    }

    // 验证选座规则
    if (!validateSeatSelection()) {
        return; // 验证失败，函数内部已处理提示
    }

    // 获取客户信息
    const customerInfo = window.UIMemberManagement ?
        window.UIMemberManagement.getMyCustomerDataEnhanced() :
        { ticketType: 'individual', members: [] };

    console.log('客户信息:', customerInfo);

    try {
        // 调用StateManager的预订函数
        const result = window.StateManager.performReservation(customerInfo);

        console.log('预订结果:', result);

        // 根据返回结果处理
        if (result && result.success) {
            console.log('✅ 预订成功');
            alert('预订成功！请在30分钟内完成支付');
            // 订单已由 main.js 创建，UI 层无需再创建订单

            // 清空当前的用户数据
            if (window.UIMemberManagement && window.UIMemberManagement.clearMembers) {
                window.UIMemberManagement.clearMembers();
                console.log('已清除当前用户数据');
            }

            // 切换到 final-view，优先用UICoreModule.switchView
            if (window.UICoreModule && typeof window.UICoreModule.switchView === 'function') {
                window.UICoreModule.switchView('final-view');
            } else {
                // 兜底：直接用DOM切换
                document.querySelectorAll('.view').forEach(v => v.classList.remove('active'));
                var finalView = document.getElementById('final-view');
                if(finalView) finalView.classList.add('active');
            }
        } else {
            // 预订失败 - 显示错误信息
            const errorMessage = result && result.message ? result.message : '预订失败，请重试';
            console.error('❌ 预订失败:', errorMessage);
            alert('预订失败：' + errorMessage);
        }

    } catch (error) {
        console.error('预订过程中发生错误:', error);
        alert('预订过程中发生错误，请重试');
    }
}

// ========================= 数据获取辅助函数 =========================

/**
 * 获取选中座位数据
 * 优先从StateManager获取真实选中座位数据，否则从UI解析，最后使用示例数据
 */
function getMySelectedSeatsData() {
    // 优先从StateManager获取真实选中座位数据
    if (window.StateManager && typeof window.StateManager.getSelectedSeats === 'function') {
        const selectedSeats = window.StateManager.getSelectedSeats();
        if (selectedSeats && selectedSeats.length > 0) {
            return selectedSeats.map(seat => ({
                row: seat.row,
                col: seat.col,
                status: seat.status
            }));
        }
    }

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

    // 最后使用示例数据（保持向后兼容）
    return [
        { row: 5, col: 8 },
        { row: 5, col: 9 }
    ];
}

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
    const unitPrice = 45; // 单价，应该从配置或状态管理器获取
    return seats.length * unitPrice;
}

// ========================= 模块导出 =========================

// 在浏览器环境中，将函数暴露到全局
if (typeof window !== 'undefined') {
    window.UIValidation = {
        // 验证函数
        validateSeatSelection,
        validateIndividualSeatSelection,
        validateGroupSeatSelection,
        validateAgeRestriction,
        areSeatsConsecutive,

        // 业务逻辑处理
        handleDirectPurchase,
        handleReservation,

        // 数据获取辅助函数
        getMySelectedSeatsData,
        getMySelectedMovieTitle,
        getMySelectedMovieTime,
        getMySelectedMoviePoster,
        getMyCustomerData,
        calculateMyTotalPrice
    };
}

console.log('UI验证模块已加载');
