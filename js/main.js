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
    RESERVATION_EXPIRY_MINUTES: 30,
    movieId: null // 电影ID，用于标识当前正在放映的电影
};

const AGE_GROUPS = {
    CHILD: 'child',      // 15岁以下
    ADULT: 'adult',      // 15-59岁
    ELDERLY: 'elderly'   // 60岁以上
};

const SEAT_STATUS = {
    AVAILABLE: 'available', // 可用
    RESERVED: 'reserved',   // 已预订 (由本模块管理)
    SOLD: 'sold',            // 已售出 (由本模块管理)
    SELECTED: 'selected',   // 已选中 (UI临时状态，由数据层管理)
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
function initializeCinemaSeats(rows, seatsPerRow, movieTime = null, movieId = null) {
    // 更新当前影院配置
    currentCinemaConfig.TOTAL_ROWS = rows;
    currentCinemaConfig.SEATS_PER_ROW = seatsPerRow;
    currentCinemaConfig.TOTAL_SEATS = rows * seatsPerRow;
    currentCinemaConfig.movieId = movieId;
    if (movieTime) {
        if (typeof movieTime === 'string') {
            currentCinemaConfig.movieStartTime = new Date(movieTime.replace(/-/g, '/'));
        } else if (movieTime instanceof Date) {
            currentCinemaConfig.movieStartTime = movieTime;
        }
    } else {
        currentCinemaConfig.movieStartTime = null;
    }
    if (currentCinemaConfig.movieStartTime) {
        console.log(`电影开始时间已设定: ${currentCinemaConfig.movieStartTime.toLocaleString()}`);
    }
    console.log(`初始化影院座位数据: ${rows}排, 每排${seatsPerRow}座，电影ID: ${movieId}`);

    // 从 localStorage 加载或初始化座位数据
    const storageKey = `cinemaState-${movieId}-${rows}x${seatsPerRow}`;
    const savedSeats = localStorage.getItem(storageKey);

    if (savedSeats) {
        // 如果 localStorage 中存在座位数据，则加载它
        console.log(`从 localStorage 加载影院状态: ${storageKey}`);
        cinemaSeats = JSON.parse(savedSeats);
    } else {
        // 如果 localStorage 中没有数据，则初始化新的座位数据
        console.log(`未找到 localStorage 中的影院状态，初始化新的座位数据: ${rows}排, 每排${seatsPerRow}座。`);
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
    }

    // 处理传入的时间，确保其为Date对象
    /*if (movieTime) {
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
    }*/

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
 * 检查座位是否可用（仅允许AVAILABLE状态）
 * @param {number} row - 行号 (1-based)
 * @param {number} col - 座位号 (1-based)
 * @returns {boolean} 座位是否可用
 */
function isSeatAvailable(row, col) {
    if (!validateSeatParams(row, col)) return false;
    const seat = cinemaSeats[row - 1][col - 1];
    return seat && (seat.status === SEAT_STATUS.AVAILABLE);
}

/**
 * 检查座位是否可用于自动选座（允许AVAILABLE和SELECTED状态）
 * @param {number} row - 行号 (1-based)
 * @param {number} col - 座位号 (1-based)
 * @returns {boolean} 座位是否可用于自动选座
 */
function isSeatAvailableOrSelected(row, col) {
    if (!validateSeatParams(row, col)) return false;
    const seat = cinemaSeats[row - 1][col - 1];
    return seat && (seat.status === SEAT_STATUS.AVAILABLE || seat.status === SEAT_STATUS.SELECTED);
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

/**
 * 将当前影厅的座位状态保存到 localStorage
 */
function saveCurrentCinemaState() {
    console.log(`当前影院共${currentCinemaConfig.TOTAL_ROWS}排，每排${currentCinemaConfig.SEATS_PER_ROW}座，电影ID: ${localStorage.getItem('selectedMovie')}`);
    //确保当前配置和电影ID都存在
    currentCinemaConfig.movieId = localStorage.getItem('selectedMovie');
    if (!currentCinemaConfig.TOTAL_ROWS || !currentCinemaConfig.SEATS_PER_ROW || !currentCinemaConfig.movieId) {
        console.warn('当前影厅配置不完整，无法保存状态。');
        return;
    }

    const { TOTAL_ROWS, SEATS_PER_ROW, movieId } = currentCinemaConfig;
    const storageKey = `cinemaState-${movieId}-${TOTAL_ROWS}x${SEATS_PER_ROW}`;

    localStorage.setItem(storageKey, JSON.stringify(cinemaSeats));
    console.log(`当前影厅状态已保存到 localStorage，键为: ${storageKey}`);
}

// ========================= 个人选座算法 =========================

/**
 * 为个人（单选/多选）自动选座
 * @param {Array} members - 成员信息 [{age: number, name: string}, ...]
 * @returns {Array|null} 选中的座位对象列表或 null
 */
function findSeatForIndividual(members) {
    if (!members || members.length === 0 || members.length > currentCinemaConfig.MAX_GROUP_SIZE) return null;

    // 获取所有成员能坐的行
    const validRows = [];
    for (let i = 1; i <= currentCinemaConfig.TOTAL_ROWS; i++) {
        if (members.every(member => canSitInRow(getAgeGroup(member.age), i))) {
            validRows.push(i);
        }
    }

    if (validRows.length === 0) return null;

    // 计算中心区域
    const centerZone = calculateCenterZoneForMain();
    // 获取中心区域的有效行和列
    const centerRows = [];
    for (let r = centerZone.rowStart; r <= centerZone.rowEnd; r++) {
        if (validRows.includes(r)) centerRows.push(r);
    }
    const centerCols = [];
    for (let c = centerZone.colStart; c <= centerZone.colEnd; c++) {
        centerCols.push(c);
    }

    // 优先在中心区域选座
    // 行循环从中心开始向两侧扩展
    function getCenterSortedRows(rows, totalRows) {
        const mid = Math.ceil(totalRows / 2);
        return rows.slice().sort((a, b) => Math.abs(a - mid) - Math.abs(b - mid));
    }
    const sortedCenterRows = getCenterSortedRows(centerRows, currentCinemaConfig.TOTAL_ROWS);
    // 策略1：优先尝试在同一行找到连续座位（中心区域）
    for (const row of sortedCenterRows) {
        const consecutiveSeats = findConsecutiveSeatsInRowForIndividual(row, members.length, centerCols);
        if (consecutiveSeats) {
            return consecutiveSeats;
        }
    }
    // 策略2：如果无法找到连续座位，则分散选择最优座位（中心区域）
    const scatteredCenterSeats = findScatteredSeatsForIndividual(members, sortedCenterRows, centerCols);
    if (scatteredCenterSeats) {
        return scatteredCenterSeats;
    }

    // 如果中心区域没有合适座位，则在非中心区域选座
    // 不用避开中心区域，中心区域没有座位的话，自然不会被选
    const sortedRows = getCenterSortedRows(validRows, currentCinemaConfig.TOTAL_ROWS);
    // 策略1：优先尝试在同一行找到连续座位（非中心区域）
    for (const row of sortedRows) {
        const consecutiveSeats = findConsecutiveSeatsInRowForIndividual(row, members.length);
        if (consecutiveSeats) {
            return consecutiveSeats;
        }
    }

    // 策略2：如果无法找到连续座位，则分散选择最优座位（非中心区域）
    return findScatteredSeatsForIndividual(members, sortedRows);
}

/**
 * 在指定行查找连续座位（个人选座专用，优先选择中间位置）
 * @param {number} row - 行号 (1-based)
 * @param {number} count - 需要的座位数
 * @returns {Array|null} 连续座位对象列表或 null
 */
function findConsecutiveSeatsInRowForIndividual(row, count, colFilter = null) {
    const rowSeats = cinemaSeats[row - 1];
    if (!rowSeats) return null;

    // 只考虑colFilter范围内的座位
    let filteredSeats = rowSeats;
    if (Array.isArray(colFilter)) {
        filteredSeats = rowSeats.filter(seat => colFilter.includes(seat.col));
    }
    const midSeatIdx = Math.floor(filteredSeats.length / 2);
    const maxStartPos = filteredSeats.length - count;

    for (let offset = 0; offset <= Math.max(midSeatIdx, maxStartPos - midSeatIdx); offset++) {
        // 先尝试中间偏右的位置
        const rightStart = midSeatIdx - Math.floor(count / 2) + offset;
        if (rightStart >= 0 && rightStart <= maxStartPos) {
            const rightChunk = filteredSeats.slice(rightStart, rightStart + count);
            if (rightChunk.length === count && rightChunk.every(seat => isSeatAvailableOrSelected(seat.row, seat.col))) {
                return rightChunk;
            }
        }
        // 再尝试中间偏左的位置
        if (offset > 0) {
            const leftStart = midSeatIdx - Math.floor(count / 2) - offset;
            if (leftStart >= 0 && leftStart <= maxStartPos) {
                const leftChunk = filteredSeats.slice(leftStart, leftStart + count);
                if (leftChunk.length === count && leftChunk.every(seat => isSeatAvailableOrSelected(seat.row, seat.col))) {
                    return leftChunk;
                }
            }
        }
    }
    return null;
}

/**
 * 为个人选座分散选择座位（当无法连续坐时）
 * @param {Array} members - 成员信息
 * @param {Array} validRows - 有效行号列表
 * @returns {Array|null} 选中的座位对象列表或 null
 */
function findScatteredSeatsForIndividual(members, validRows, colFilter = null) {
    const selectedSeats = [];
    // 计算螺旋式搜索的中心点
    let midSeat = Math.ceil(currentCinemaConfig.SEATS_PER_ROW / 2);
    if (Array.isArray(colFilter) && colFilter.length > 0) {
        midSeat = colFilter[Math.floor(colFilter.length / 2)];
    }

    for (const member of members) {
        const ageGroup = getAgeGroup(member.age);
        let seatFound = false;

        // 为每个成员在有效行中寻找最佳座位
        for (const row of validRows) {
            if (!canSitInRow(ageGroup, row)) continue;
            // 螺旋式搜索colFilter范围内的座位
            const colsToSearch = Array.isArray(colFilter) && colFilter.length > 0 ? colFilter : Array.from({length: currentCinemaConfig.SEATS_PER_ROW}, (_, i) => i + 1);
            for (let j = 0; j < colsToSearch.length; j++) {
                const seatOffset = Math.ceil(j / 2) * (j % 2 === 0 ? 1 : -1);
                const colIdx = colsToSearch.indexOf(midSeat) + seatOffset;
                if (colIdx < 0 || colIdx >= colsToSearch.length) continue;
                const col = colsToSearch[colIdx];
                if (col < 1 || col > currentCinemaConfig.SEATS_PER_ROW) continue;
                // 检查座位是否可用且没有被本次选择占用
                if (isSeatAvailableOrSelected(row, col) &&
                    !selectedSeats.some(seat => seat.row === row && seat.col === col)) {
                    selectedSeats.push(cinemaSeats[row - 1][col - 1]);
                    seatFound = true;
                    break;
                }
            }
            if (seatFound) break;
        }
        // 如果某个成员找不到座位，则整个选座失败
        if (!seatFound) {
            return null;
        }
    }
    return selectedSeats;
}
/**
 * 计算中心区域信息（main.js专用，无依赖外部变量）
 * @returns {Object} 中心区域信息
 */
function calculateCenterZoneForMain() {
    // 可根据实际需要调整中心区域比例
    const CENTER_ZONE_RATIO = 0.25; // 默认中心区域占比25%
    const totalRows = currentCinemaConfig.TOTAL_ROWS;
    const totalCols = currentCinemaConfig.SEATS_PER_ROW;
    const totalSeats = totalRows * totalCols;
    const targetCenterCount = Math.floor(totalSeats * CENTER_ZONE_RATIO);
    const layoutRatio = Math.sqrt(targetCenterCount / totalSeats);
    const numCenterCols = Math.ceil(totalCols * layoutRatio);
    const numCenterRows = Math.ceil(targetCenterCount / numCenterCols);
    const middleRow = Math.ceil(totalRows / 2);
    let middleCol;
    if (totalCols % 2 === 1) {
        middleCol = (totalCols + 1) / 2;
    } else {
        middleCol = (totalCols + 1) / 2;
    }
    return {
        rowStart: middleRow - Math.floor(numCenterRows / 2),
        rowEnd: middleRow - Math.floor(numCenterRows / 2) + numCenterRows - 1,
        colStart: Math.round(middleCol - numCenterCols / 2),
        colEnd: Math.round(middleCol + numCenterCols / 2) - 1
    };
}

// ========================= 团体选座算法 =========================

/**
 * 为团体自动选座
 * @param {Array} members - 团体成员信息 [{age: number, name: string}, ...]
 * @returns {Array|null} 选中的座位对象列表或 null
 */
function findSeatsForGroup(members) {
    if (!members || members.length === 0 || members.length > currentCinemaConfig.MAX_GROUP_SIZE) return null;

    const groupSize = members.length;
    const seatsPerRow = currentCinemaConfig.SEATS_PER_ROW;
    const totalRows = currentCinemaConfig.TOTAL_ROWS;

    // 获取所有成员能坐的行
    const validRows = [];
    for (let i = 1; i <= totalRows; i++) {
        if (members.every(member => canSitInRow(getAgeGroup(member.age), i))) {
            validRows.push(i);
        }
    }

    if (validRows.length === 0) return null;

    // 团体人数小于等于一排座位数，使用原算法
    if (groupSize <= seatsPerRow) {
        for (const row of validRows) {
            const consecutiveSeats = findConsecutiveSeatsInRow(row, groupSize);
            if (consecutiveSeats) return consecutiveSeats;
        }
        return null;
    }

    // 团体人数大于一排座位数，寻找连续几排座位
    // 需要找到连续的几排，每排都坐满，最后一排剩余座位也要连在一起
    const minRowsNeeded = Math.ceil(groupSize / seatsPerRow);
    // 在validRows中寻找连续的minRowsNeeded排
    for (let startIdx = 0; startIdx <= validRows.length - minRowsNeeded; startIdx++) {
        const candidateRows = validRows.slice(startIdx, startIdx + minRowsNeeded);
        let allRowsAvailable = true;
        let selectedSeats = [];
        let memberIdx = 0;
        // 前几排都要坐满
        for (let r = 0; r < minRowsNeeded; r++) {
            const row = candidateRows[r];
            const rowSeats = cinemaSeats[row - 1];
            if (!rowSeats) { allRowsAvailable = false; break; }
            if (r < minRowsNeeded - 1) {
                // 这一排需要找到连续seatsPerRow个座位
                const chunk = findConsecutiveSeatsInRow(row, seatsPerRow);
                if (!chunk) { allRowsAvailable = false; break; }
                selectedSeats = selectedSeats.concat(chunk);
                memberIdx += seatsPerRow;
            } else {
                // 最后一排，剩余人数
                const lastRowCount = groupSize - seatsPerRow * (minRowsNeeded - 1);
                const chunk = findConsecutiveSeatsInRow(row, lastRowCount);
                if (!chunk) { allRowsAvailable = false; break; }
                selectedSeats = selectedSeats.concat(chunk);
                memberIdx += lastRowCount;
            }
        }
        if (allRowsAvailable && selectedSeats.length === groupSize) {
            return selectedSeats;
        }
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
        if (chunk.every(seat => isSeatAvailableOrSelected(seat.row, seat.col))) return chunk;
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
    saveCurrentCinemaState(); // 保存当前状态到 localStorage
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
    if (!fullSeatObjects.every(s => isSeatAvailableOrSelected(s.row, s.col))) return { success: false, message: '您选择的座位中包含不可用座位，请重新选择' };

    const expiresAt = new Date(currentCinemaConfig.movieStartTime.getTime() - currentCinemaConfig.RESERVATION_EXPIRY_MINUTES * 60 * 1000);
    console.log('电影开始时间:', currentCinemaConfig.movieStartTime);
    console.log('预订过期时间:', expiresAt);
    if (new Date() > expiresAt) return { success: false, message: `已超过预订时间，请直接购票。` };

    const ticketId = `r-${Date.now()}`;
    // 使用标准化后的 fullSeatObjects 来创建票据
    ticketRecords.push({
        ticketId,
        status: SEAT_STATUS.RESERVED,
        seats: fullSeatObjects.map(s => s.id),
        customerInfo,
        unitPrice: customerInfo.unitPrice || 45,
        totalCost: customerInfo.totalCost || (customerInfo.unitPrice || 45) * fullSeatObjects.length,
        createdAt: new Date(),
        expiresAt
    });
    fullSeatObjects.forEach(s => { cinemaSeats[s.row - 1][s.col - 1].status = SEAT_STATUS.RESERVED; });
    // 票务操作后同步localStorage
    try { localStorage.setItem('movieTicketOrders', JSON.stringify(ticketRecords)); } catch (e) { console.error('订单同步到localStorage失败:', e); }
    saveCurrentCinemaState(); // 保存当前状态到 localStorage
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
    if (!fullSeatObjects.every(s => isSeatAvailableOrSelected(s.row, s.col))) return { success: false, message: '您选择的座位中包含不可用座位，请重新选择' };

    const ticketId = `s-${Date.now()}`;
    ticketRecords.push({
        ticketId,
        status: SEAT_STATUS.SOLD,
        seats: fullSeatObjects.map(s => s.id),
        customerInfo,
        createdAt: new Date(),
        paidAt: new Date(),
        unitPrice: customerInfo.unitPrice || 45,
        totalCost: customerInfo.totalCost || (customerInfo.unitPrice || 45) * fullSeatObjects.length,
    });
    fullSeatObjects.forEach(s => { cinemaSeats[s.row - 1][s.col - 1].status = SEAT_STATUS.SOLD; });
    // 票务操作后同步localStorage
    try { localStorage.setItem('movieTicketOrders', JSON.stringify(ticketRecords)); } catch (e) { console.error('订单同步到localStorage失败:', e); }
    saveCurrentCinemaState(); // 保存当前状态到 localStorage
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
    // 票务操作后同步localStorage
    try { localStorage.setItem('movieTicketOrders', JSON.stringify(ticketRecords)); } catch (e) { console.error('订单同步到localStorage失败:', e); }
    saveCurrentCinemaState(); // 保存当前状态到 localStorage
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
    // 票务操作后同步localStorage
    try { localStorage.setItem('movieTicketOrders', JSON.stringify(ticketRecords)); } catch (e) { console.error('订单同步到localStorage失败:', e); }
    saveCurrentCinemaState(); // 保存当前状态到 localStorage
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
    // 票务操作后同步localStorage
    try { localStorage.setItem('movieTicketOrders', JSON.stringify(ticketRecords)); } catch (e) { console.error('订单同步到localStorage失败:', e); }
    saveCurrentCinemaState(); // 保存当前状态到 localStorage
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
    if (!Array.isArray(cinemaSeats) || cinemaSeats.length === 0) return null; // 新增安全判断
    if (!validateSeatParams(row, col)) return null;
    const rowSeats = cinemaSeats[row - 1];
    if (!Array.isArray(rowSeats)) return null; // 防止未初始化
    return rowSeats[col - 1] || null;
}

/**
 * 设置座位状态
 * @param {number} row - 行号 (1-based)
 * @param {number} col - 座位号 (1-based)
 * @param {string} status - 座位状态
 * @returns {boolean} 操作是否成功
 */
function setSeat(row, col, status) {
    if (!validateSeatParams(row, col)) return false;
    const seat = cinemaSeats[row - 1][col - 1];
    if (seat) {
        seat.status = status;
        return true;
    }
    return false;
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

// ========================= 订单localStorage同步与查询接口 =========================
function syncOrdersToLocalStorage() {
    try {
        localStorage.setItem('movieTicketOrders', JSON.stringify(ticketRecords));
    } catch (e) {
        console.error('订单同步到localStorage失败:', e);
    }
}

function loadOrdersFromLocalStorage() {
    try {
        const stored = localStorage.getItem('movieTicketOrders');
        if (stored) {
            ticketRecords = JSON.parse(stored);
        }
    } catch (e) {
        console.error('订单从localStorage加载失败:', e);
    }
}

function getAllOrders() {
    return ticketRecords.slice();
}

function getLatestOrder() {
    return ticketRecords.length > 0 ? ticketRecords[ticketRecords.length - 1] : null;
}

function getOrderById(orderId) {
    return ticketRecords.find(o => o.ticketId === orderId || o.id === orderId) || null;
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
    setSeat,
    getCinemaStatus,
    getCurrentConfig, // V3 新增

    // 工具函数
    getAgeGroup,
    isSeatAvailable,
    isSeatAvailableOrSelected,
    canSitInRow,
    validateSeatParams,

    // 订单查询相关
    getAllOrders,
    getLatestOrder,
    getOrderById
};

console.log('电影院票务系统核心模块(main.js)已加载');

// 初始化时加载localStorage订单
loadOrdersFromLocalStorage();
