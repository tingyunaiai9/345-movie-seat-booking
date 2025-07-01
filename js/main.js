/**
 * 电影院票务系统 - 核心数据与算法模块
 * 角色一：核心数据与算法工程师
 * 职责: 管理所有核心数据（座位、票务），并提供业务逻辑算法（自动选座、票务处理）。
 * 该模块不直接与任何UI元素（DOM/Canvas）交互。
 */

// ========================= 常量定义 =========================
const CINEMA_CONFIG = {
    // 默认配置，可以被初始化函数覆盖
    TOTAL_SEATS: 200,
    SEATS_PER_ROW: 20,
    TOTAL_ROWS: 10,
    // 年龄限制规则
    FRONT_RESTRICTED_ROWS: 3,  // 少年不可坐的前排数
    BACK_RESTRICTED_ROWS: 3,   // 老人不可坐的后排数
    MAX_GROUP_SIZE: 20,         // 团体票最大人数
    // 预订票在电影开始前多少分钟必须付款，否则作废
    RESERVATION_EXPIRY_MINUTES: 30
};

const AGE_GROUPS = {
    CHILD: 'child',      // 15岁以下
    ADULT: 'adult',      // 15-59岁
    ELDERLY: 'elderly'   // 60岁以上
};

const SEAT_STATUS = {
    AVAILABLE: 'available', // 可用
    RESERVED: 'reserved',   // 已预订 (由本模块管理)
    SOLD: 'sold'            // 已售出 (由本模块管理)
    // 'selected' 状态由 stateManager.js 在UI层面管理，不属于核心数据状态
};

// ========================= 数据结构定义 =========================

/**
 * 座位数据结构
 * cinemaSeats 是一个二维数组，例如 cinemaSeats[row][col]
 */
let cinemaSeats = [];

/**
 * 票务记录数据结构
 * 记录所有的预订、购票、退票操作
 */
let ticketRecords = [];

// 用于动态配置影厅的变量
let currentCinemaConfig = { ...CINEMA_CONFIG };


// ========================= 数据初始化 =========================

/**
 * 初始化或重置电影院座位数据。
 * 此函数应由 viewController 在切换到选座视图时调用。
 * @param {number} rows - 总排数
 * @param {number} seatsPerRow - 每排座位数
 * @param {string | Date | null} movieTime - 电影开始时间 (可以是Date对象或"HH:MM"格式的字符串)
 */
function initializeCinemaSeats(rows, seatsPerRow, movieTime = null) {
    // 更新当前影院配置
    currentCinemaConfig.TOTAL_ROWS = rows;
    currentCinemaConfig.SEATS_PER_ROW = seatsPerRow;
    currentCinemaConfig.TOTAL_SEATS = rows * seatsPerRow;

    // 处理传入的时间，确保其为Date对象
    if (movieTime) {
        if (typeof movieTime === 'string') {
            const [hours, minutes] = movieTime.split(':');
            const startTime = new Date();
            startTime.setHours(parseInt(hours, 10), parseInt(minutes, 10), 0, 0);
            currentCinemaConfig.movieStartTime = startTime;
        } else if (movieTime instanceof Date) {
            currentCinemaConfig.movieStartTime = movieTime;
        }
    } else {
        currentCinemaConfig.movieStartTime = null;
    }

    cinemaSeats = []; // 清空旧数据
    for (let i = 0; i < rows; i++) {
        const rowSeats = [];
        for (let j = 0; j < seatsPerRow; j++) {
            rowSeats.push({
                row: i + 1,       // 排号 (1-based)
                col: j + 1,       // 座位号 (1-based)
                id: getSeatId(i + 1, j + 1), // 唯一ID
                status: SEAT_STATUS.AVAILABLE, // 初始状态为可用
            });
        }
        cinemaSeats.push(rowSeats);
    }
    console.log(`影院座位已初始化: ${rows}排, 每排${seatsPerRow}座。`);
    if (currentCinemaConfig.movieStartTime) {
        console.log(`电影开始时间已设定: ${currentCinemaConfig.movieStartTime.toLocaleString()}`);
    }
    return cinemaSeats;
}

/**
 * 初始化票务系统
 */
function initializeTicketSystem() {
    ticketRecords = []; // 清空票务记录
    console.log('票务系统已初始化');
}

// ========================= 工具函数 =========================

/**
 * 根据年龄判断年龄组
 * @param {number} age - 年龄
 * @returns {string} 年龄组类型 ('child', 'adult', 'elderly')
 */
function getAgeGroup(age) {
    if (age < 15) return AGE_GROUPS.CHILD;
    if (age >= 60) return AGE_GROUPS.ELDERLY;
    return AGE_GROUPS.ADULT;
}

/**
 * 检查座位是否可用
 * @param {number} row - 行号 (1-based)
 * @param {number} col - 座位号 (1-based)
 * @returns {boolean} 座位是否可用
 */
function isSeatAvailable(row, col) {
    if (!validateSeatParams(row, col)) return false;
    const seat = cinemaSeats[row - 1][col - 1];
    return seat && seat.status === SEAT_STATUS.AVAILABLE;
}

/**
 * 检查年龄组是否可以坐指定行
 * @param {string} ageGroup - 年龄组
 * @param {number} row - 行号 (1-based)
 * @returns {boolean} 是否可以坐该行
 */
function canSitInRow(ageGroup, row) {
    if (ageGroup === AGE_GROUPS.CHILD && row <= currentCinemaConfig.FRONT_RESTRICTED_ROWS) return false;
    if (ageGroup === AGE_GROUPS.ELDERLY && row > currentCinemaConfig.TOTAL_ROWS - currentCinemaConfig.BACK_RESTRICTED_ROWS) return false;
    return true;
}

/**
 * 获取座位的唯一标识
 * @param {number} row - 行号
 * @param {number} col - 座位号
 * @returns {string} 座位标识, e.g., "seat-1-5"
 */
function getSeatId(row, col) {
    return `seat-${row}-${col}`;
}

// ========================= 个人选座算法 =========================

/**
 * 为个人自动选座
 * @param {number} age - 年龄
 * @returns {Object|null} 选中的座位对象或 null
 */
function findSeatForIndividual(age) {
    const ageGroup = getAgeGroup(age);
    const midRow = Math.ceil(currentCinemaConfig.TOTAL_ROWS / 2);
    for (let i = 0; i < currentCinemaConfig.TOTAL_ROWS; i++) {
        const offset = Math.ceil(i / 2) * (i % 2 === 0 ? 1 : -1);
        const row = midRow + offset;
        if (row < 1 || row > currentCinemaConfig.TOTAL_ROWS || !canSitInRow(ageGroup, row)) continue;

        const midSeat = Math.ceil(currentCinemaConfig.SEATS_PER_ROW / 2);
        for (let j = 0; j < currentCinemaConfig.SEATS_PER_ROW; j++) {
            const seatOffset = Math.ceil(j / 2) * (j % 2 === 0 ? 1 : -1);
            const col = midSeat + seatOffset;
            if (col < 1 || col > currentCinemaConfig.SEATS_PER_ROW) continue;
            if (isSeatAvailable(row, col)) return cinemaSeats[row - 1][col - 1];
        }
    }
    return null;
}


// ========================= 团体选座算法 =========================

/**
 * 为团体自动选座
 * @param {Array} members - 团体成员信息 [{age: number, name: string}, ...]
 * @returns {Array|null} 选中的座位对象列表或 null
 */
function findSeatsForGroup(members) {
    if (!members || members.length === 0 || members.length > currentCinemaConfig.MAX_GROUP_SIZE) return null;

    const validRows = [];
    for (let i = 1; i <= currentCinemaConfig.TOTAL_ROWS; i++) {
        if (members.every(member => canSitInRow(getAgeGroup(member.age), i))) {
            validRows.push(i);
        }
    }

    if (validRows.length === 0) return null;

    for (const row of validRows) {
        const consecutiveSeats = findConsecutiveSeatsInRow(row, members.length);
        if (consecutiveSeats) return consecutiveSeats;
    }
    return null;
}

/**
 * 在指定行查找连续座位
 * @param {number} row - 行号 (1-based)
 * @param {number} count - 需要的座位数
 * @returns {Array|null} 连续座位对象列表或 null
 */
function findConsecutiveSeatsInRow(row, count) {
    const rowSeats = cinemaSeats[row - 1];
    if (!rowSeats) return null;
    for (let i = 0; i <= rowSeats.length - count; i++) {
        const chunk = rowSeats.slice(i, i + count);
        if (chunk.every(seat => seat.status === SEAT_STATUS.AVAILABLE)) return chunk;
    }
    return null;
}

// ========================= 票务操作核心函数 =========================

/**
 * 检查并释放过期的预订
 * @returns {Array} 被释放的座位ID列表
 */
function checkAndReleaseExpiredReservations() {
    const now = new Date();
    const releasedSeatIds = [];
    ticketRecords.forEach(ticket => {
        if (ticket.status === SEAT_STATUS.RESERVED && ticket.expiresAt && now > ticket.expiresAt) {
            ticket.status = 'expired';
            ticket.seats.forEach(seatId => {
                const [_, row, col] = seatId.split('-');
                if (validateSeatParams(row, col)) {
                    cinemaSeats[row - 1][col - 1].status = SEAT_STATUS.AVAILABLE;
                    releasedSeatIds.push(seatId);
                }
            });
        }
    });
    return releasedSeatIds;
}

/**
 * 预订票务
 * @param {Array} seats - 座位对象列表，可以是不完整的对象，如 {row: 8, col: 8}
 * @param {Object} customerInfo - 客户信息
 * @returns {Object} 预订结果
 */
function reserveTickets(seats, customerInfo) {
    if (!currentCinemaConfig.movieStartTime) return { success: false, message: '无法预订：未设置电影开始时间。' };

    // 即使调用者只传入 {row, col}，也通过 getSeat 获取完整的座位对象，确保 id 存在。
    const fullSeatObjects = seats.map(s => getSeat(s.row, s.col));
    if (fullSeatObjects.some(s => s === null)) {
        return { success: false, message: '选择的座位中包含无效或不存在的座位。' };
    }

    if (fullSeatObjects.length === 0) return { success: false, message: '未选择任何座位' };
    if (!fullSeatObjects.every(s => isSeatAvailable(s.row, s.col))) return { success: false, message: '您选择的座位中包含不可用座位，请重新选择' };

    const expiresAt = new Date(currentCinemaConfig.movieStartTime.getTime() - currentCinemaConfig.RESERVATION_EXPIRY_MINUTES * 60 * 1000);
    if (new Date() > expiresAt) return { success: false, message: `已超过预订时间，请直接购票。` };

    const ticketId = `r-${Date.now()}`;
    // 使用标准化后的 fullSeatObjects 来创建票据
    ticketRecords.push({ ticketId, status: SEAT_STATUS.RESERVED, seats: fullSeatObjects.map(s => s.id), customerInfo, createdAt: new Date(), expiresAt });
    fullSeatObjects.forEach(s => { cinemaSeats[s.row - 1][s.col - 1].status = SEAT_STATUS.RESERVED; });
    return { success: true, reservationId: ticketId, message: `预订成功！请在 ${expiresAt.toLocaleString()} 前完成支付。` };
}

/**
 * 直接购票
 * @param {Array} seats - 座位对象列表，可以是不完整的对象
 * @param {Object} customerInfo - 客户信息
 * @returns {Object} 购票结果
 */
function purchaseTickets(seats, customerInfo) {
    const fullSeatObjects = seats.map(s => getSeat(s.row, s.col));
    if (fullSeatObjects.some(s => s === null)) {
        return { success: false, message: '选择的座位中包含无效或不存在的座位。' };
    }

    if (fullSeatObjects.length === 0) return { success: false, message: '未选择任何座位' };
    if (!fullSeatObjects.every(s => isSeatAvailable(s.row, s.col))) return { success: false, message: '您选择的座位中包含不可用座位，请重新选择' };

    const ticketId = `s-${Date.now()}`;
    ticketRecords.push({ ticketId, status: SEAT_STATUS.SOLD, seats: fullSeatObjects.map(s => s.id), customerInfo, createdAt: new Date(), paidAt: new Date() });
    fullSeatObjects.forEach(s => { cinemaSeats[s.row - 1][s.col - 1].status = SEAT_STATUS.SOLD; });
    return { success: true, ticketId, message: '购票成功！' };
}

/**
 * 为已预订的票付款
 * @param {string} reservationId - 预订ID
 * @returns {Object} 操作结果
 */
function payForReservation(reservationId) {
    const ticket = ticketRecords.find(t => t.ticketId === reservationId);
    if (!ticket) return { success: false, message: '未找到该预订记录。' };
    if (ticket.status !== SEAT_STATUS.RESERVED) return { success: false, message: `该票据状态为[${ticket.status}]，无法支付。` };
    if (new Date() > ticket.expiresAt) {
        checkAndReleaseExpiredReservations();
        return { success: false, message: '该预订已过期。' };
    }

    ticket.status = SEAT_STATUS.SOLD;
    ticket.paidAt = new Date();
    delete ticket.expiresAt;

    ticket.seats.forEach(seatId => {
        const [_, row, col] = seatId.split('-');
        if (validateSeatParams(row, col)) cinemaSeats[row - 1][col - 1].status = SEAT_STATUS.SOLD;
    });

    return { success: true, ticketId: ticket.ticketId, message: '支付成功！' };
}

/**
 * 取消预订 (只能取消未付款的预订)
 * @param {string} reservationId - 预订ID
 * @returns {Object} 取消结果
 */
function cancelReservation(reservationId) {
    const ticket = ticketRecords.find(t => t.ticketId === reservationId);
    if (!ticket) return { success: false, message: '未找到对应的预订记录' };
    if (ticket.status !== SEAT_STATUS.RESERVED) return { success: false, message: `操作失败：该票据已[${ticket.status}]，无法取消预订。` };

    ticket.status = 'cancelled';
    ticket.seats.forEach(seatId => {
        const [_, row, col] = seatId.split('-');
        if (validateSeatParams(row, col)) cinemaSeats[row - 1][col - 1].status = SEAT_STATUS.AVAILABLE;
    });
    return { success: true, message: '预订已成功取消！' };
}

/**
 * 退票 (只能为已付款的票退款)
 * @param {string} ticketId - 票务ID
 * @returns {Object} 退票结果
 */
function refundTicket(ticketId) {
    const ticket = ticketRecords.find(t => t.ticketId === ticketId);
    if (!ticket) return { success: false, message: '未找到对应的票务记录' };
    if (ticket.status !== SEAT_STATUS.SOLD) return { success: false, message: `操作失败：该票据未付款或已取消，无法退票。` };
    if (currentCinemaConfig.movieStartTime && new Date() > currentCinemaConfig.movieStartTime) return { success: false, message: '电影已开始，无法退票。' };

    ticket.status = 'refunded';
    ticket.seats.forEach(seatId => {
        const [_, row, col] = seatId.split('-');
        if (validateSeatParams(row, col)) cinemaSeats[row - 1][col - 1].status = SEAT_STATUS.AVAILABLE;
    });
    return { success: true, message: '退票成功！' };
}

// ========================= 查询和管理函数 =========================

/**
 * 获取座位对象
 * @param {number} row - 行号 (1-based)
 * @param {number} col - 座位号 (1-based)
 * @returns {Object|null} 座位详细信息
 */
function getSeat(row, col) {
    if (!validateSeatParams(row, col)) return null;
    return cinemaSeats[row - 1][col - 1];
}

/**
 * 获取电影院当前状态概览
 * @returns {Object} 电影院状态统计
 */
function getCinemaStatus() {
    let available = 0, reserved = 0, sold = 0;
    cinemaSeats.flat().forEach(seat => {
        if (seat.status === SEAT_STATUS.AVAILABLE) available++;
        else if (seat.status === SEAT_STATUS.RESERVED) reserved++;
        else if (seat.status === SEAT_STATUS.SOLD) sold++;
    });
    return { total: currentCinemaConfig.TOTAL_SEATS, available, reserved, sold };
}

/**
 * 获取当前影院配置
 * @returns {Object}
 */
function getCurrentConfig() {
    return { ...currentCinemaConfig };
}

// ========================= 数据验证函数 =========================

/**
 * 验证座位参数
 * @param {number | string} row - 行号
 * @param {number | string} col - 座位号
 * @returns {boolean} 参数是否有效
 */
function validateSeatParams(row, col) {
    const r = parseInt(row, 10);
    const c = parseInt(col, 10);
    return !isNaN(r) && !isNaN(c) && r >= 1 && r <= currentCinemaConfig.TOTAL_ROWS && c >= 1 && c <= currentCinemaConfig.SEATS_PER_ROW;
}

/**
 * 验证客户信息
 * @param {Object} customerInfo - 客户信息
 * @returns {Object} 验证结果 {valid: boolean, errors: Array}
 */
function validateCustomerInfo(customerInfo) {
    const errors = [];
    if (!customerInfo.name || customerInfo.name.trim() === '') errors.push('姓名不能为空');
    if (customerInfo.age === undefined || isNaN(customerInfo.age) || customerInfo.age <= 0) errors.push('年龄必须是有效的数字');
    return { valid: errors.length === 0, errors };
}

// ========================= 模块导出 =========================

// 通过在window对象上挂载，让其他<script>标签可以访问
window.CinemaData = {
    // 初始化函数
    initializeCinemaSeats,
    initializeTicketSystem,

    // 选座算法
    findSeatForIndividual,
    findSeatsForGroup,

    // 票务操作
    reserveTickets,
    purchaseTickets,
    payForReservation,
    cancelReservation,
    refundTicket,
    checkAndReleaseExpiredReservations,

    // 查询函数
    getSeat,
    getCinemaStatus,
    getCurrentConfig, // V3 新增

    // 工具函数
    getAgeGroup,
    isSeatAvailable,
    canSitInRow,
    validateSeatParams,
    validateCustomerInfo
};

console.log('电影院票务系统核心模块(main.js)已加载');
