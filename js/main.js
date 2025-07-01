/**
 * 电影院票务系统 - 核心数据与算法模块
 * 角色一：核心数据与算法工程师
 * 具体任务:
    1. 设计和实现票务数据管理，支持预订票、直接购票、取消预定和退票操作
    2. 实现个人自动选座算法，需严格遵守规则：
      - 少年（15岁以下）不能坐前三排
      - 老年人（60岁以上）不能坐最后三排
      - 成年人可以随意坐
    3. 实现团体自动选座核心算法，需严格遵守规则：
      - 团体票（最多20人）成员不能分开，必须坐在同一排
      - 若团体中有老年人或少年，选座时同样要遵循上述年龄限制规则
 */

// ========================= 常量定义 =========================
const CINEMA_CONFIG = {
    TOTAL_SEATS: 200,
    SEATS_PER_ROW: 20,
    TOTAL_ROWS: 10,
    FRONT_RESTRICTED_ROWS: 3,  // 前三排
    BACK_RESTRICTED_ROWS: 3,   // 后三排
    MAX_GROUP_SIZE: 20
};

const AGE_GROUPS = {
    CHILD: 'child',      // 15岁以下
    ADULT: 'adult',      // 15-60岁
    ELDERLY: 'elderly'   // 60岁以上
};

const SEAT_STATUS = {
    AVAILABLE: 'available',
    RESERVED: 'reserved',
    SOLD: 'sold'
};

// ========================= 数据结构定义 =========================

/**
 * 座位数据结构
 * 每个座位包含：行号、座位号、状态、预订信息等
 */
let cinemaSeats = [];

/**
 * 票务记录数据结构
 * 记录所有的预订、购票、退票操作
 */
let ticketRecords = [];

// ========================= 数据初始化 =========================

/**
 * 初始化电影院座位数据
 */
function initializeCinemaSeats() {
    // TODO: 初始化200个座位的数据结构
}

/**
 * 初始化票务系统
 */
function initializeTicketSystem() {
    // TODO: 初始化票务记录和相关配置
}

// ========================= 工具函数 =========================

/**
 * 根据年龄判断年龄组
 * @param {number} age - 年龄
 * @returns {string} 年龄组类型
 */
function getAgeGroup(age) {
    // TODO: 实现年龄分组逻辑
}

/**
 * 检查座位是否可用
 * @param {number} row - 行号 (1-10)
 * @param {number} seat - 座位号 (1-20)
 * @returns {boolean} 座位是否可用
 */
function isSeatAvailable(row, seat) {
    // TODO: 检查指定座位是否可用
}

/**
 * 检查年龄组是否可以坐指定行
 * @param {string} ageGroup - 年龄组
 * @param {number} row - 行号
 * @returns {boolean} 是否可以坐该行
 */
function canSitInRow(ageGroup, row) {
    // TODO: 根据年龄限制规则检查是否可以坐指定行
}

/**
 * 获取座位的唯一标识
 * @param {number} row - 行号
 * @param {number} seat - 座位号
 * @returns {string} 座位标识
 */
function getSeatId(row, seat) {
    // TODO: 生成座位唯一标识
}

// ========================= 个人选座算法 =========================

/**
 * 为个人自动选座
 * @param {number} age - 年龄
 * @param {string} preference - 选座偏好 ('front', 'middle', 'back', 'auto')
 * @returns {Object|null} 选中的座位信息，格式：{row: number, seat: number}
 */
function findSeatForIndividual(age, preference = 'auto') {
    // TODO: 实现个人自动选座算法
    // 需要考虑年龄限制和选座偏好
}

/**
 * 获取推荐座位列表（个人）
 * @param {number} age - 年龄
 * @param {number} count - 推荐座位数量
 * @returns {Array} 推荐座位列表
 */
function getRecommendedSeats(age, count = 5) {
    // TODO: 获取符合年龄限制的推荐座位
}

// ========================= 团体选座算法 =========================

/**
 * 为团体自动选座
 * @param {Array} members - 团体成员信息 [{age: number, name: string}, ...]
 * @param {string} preference - 选座偏好
 * @returns {Array|null} 选中的座位列表，格式：[{row: number, seat: number}, ...]
 */
function findSeatsForGroup(members, preference = 'auto') {
    // TODO: 实现团体自动选座算法
    // 需要确保所有成员坐在同一排，且遵循年龄限制
}

/**
 * 检查团体是否可以坐指定行
 * @param {Array} members - 团体成员
 * @param {number} row - 行号
 * @returns {boolean} 团体是否可以坐该行
 */
function canGroupSitInRow(members, row) {
    // TODO: 检查团体中所有成员是否都能坐指定行
}

/**
 * 在指定行查找连续座位
 * @param {number} row - 行号
 * @param {number} count - 需要的座位数
 * @returns {Array|null} 连续座位列表或null
 */
function findConsecutiveSeatsInRow(row, count) {
    // TODO: 在指定行查找连续的可用座位
}

// ========================= 票务操作核心函数 =========================

/**
 * 预订票务
 * @param {Array} seats - 座位列表 [{row: number, seat: number}, ...]
 * @param {Object} customerInfo - 客户信息
 * @returns {Object} 预订结果 {success: boolean, reservationId: string, message: string}
 */
function reserveTickets(seats, customerInfo) {
    // TODO: 实现票务预订逻辑
    // 1. 验证座位可用性
    // 2. 创建预订记录
    // 3. 更新座位状态
    // 4. 生成预订ID
}

/**
 * 直接购票
 * @param {Array} seats - 座位列表
 * @param {Object} customerInfo - 客户信息
 * @param {Object} paymentInfo - 支付信息
 * @returns {Object} 购票结果 {success: boolean, ticketId: string, message: string}
 */
function purchaseTickets(seats, customerInfo, paymentInfo) {
    // TODO: 实现直接购票逻辑
    // 1. 验证座位可用性
    // 2. 处理支付
    // 3. 创建票务记录
    // 4. 更新座位状态为已售
}

/**
 * 取消预订
 * @param {string} reservationId - 预订ID
 * @returns {Object} 取消结果 {success: boolean, message: string}
 */
function cancelReservation(reservationId) {
    // TODO: 实现取消预订逻辑
    // 1. 查找预订记录
    // 2. 验证预订状态
    // 3. 释放座位
    // 4. 更新记录状态
}

/**
 * 退票
 * @param {string} ticketId - 票务ID
 * @param {string} reason - 退票原因
 * @returns {Object} 退票结果 {success: boolean, refundAmount: number, message: string}
 */
function refundTicket(ticketId, reason) {
    // TODO: 实现退票逻辑
    // 1. 查找票务记录
    // 2. 验证退票条件
    // 3. 计算退款金额
    // 4. 释放座位
    // 5. 更新记录状态
}

// ========================= 查询和管理函数 =========================

/**
 * 获取座位状态
 * @param {number} row - 行号
 * @param {number} seat - 座位号
 * @returns {Object} 座位详细信息
 */
function getSeatStatus(row, seat) {
    // TODO: 获取指定座位的详细状态信息
}

/**
 * 获取电影院当前状态概览
 * @returns {Object} 电影院状态统计
 */
function getCinemaStatus() {
    // TODO: 返回座位统计信息（可用、已预订、已售等）
}

/**
 * 根据条件搜索票务记录
 * @param {Object} criteria - 搜索条件
 * @returns {Array} 符合条件的票务记录
 */
function searchTicketRecords(criteria) {
    // TODO: 实现票务记录搜索功能
}

/**
 * 获取收入统计
 * @param {Date} startDate - 开始日期
 * @param {Date} endDate - 结束日期
 * @returns {Object} 收入统计信息
 */
function getRevenueStatistics(startDate, endDate) {
    // TODO: 统计指定时间段的收入信息
}

// ========================= 数据验证函数 =========================

/**
 * 验证座位参数
 * @param {number} row - 行号
 * @param {number} seat - 座位号
 * @returns {boolean} 参数是否有效
 */
function validateSeatParams(row, seat) {
    // TODO: 验证行号和座位号是否在有效范围内
}

/**
 * 验证客户信息
 * @param {Object} customerInfo - 客户信息
 * @returns {Object} 验证结果 {valid: boolean, errors: Array}
 */
function validateCustomerInfo(customerInfo) {
    // TODO: 验证客户信息的完整性和有效性
}

// ========================= 模块导出 =========================

// 如果在Node.js环境中使用
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        // 初始化函数
        initializeCinemaSeats,
        initializeTicketSystem,
        
        // 选座算法
        findSeatForIndividual,
        findSeatsForGroup,
        getRecommendedSeats,
        
        // 票务操作
        reserveTickets,
        purchaseTickets,
        cancelReservation,
        refundTicket,
        
        // 查询函数
        getSeatStatus,
        getCinemaStatus,
        searchTicketRecords,
        getRevenueStatistics,
        
        // 工具函数
        getAgeGroup,
        isSeatAvailable,
        canSitInRow,
        validateSeatParams,
        validateCustomerInfo
    };
}

// 初始化系统
document.addEventListener('DOMContentLoaded', function() {
    initializeCinemaSeats();
    initializeTicketSystem();
    console.log('电影院票务系统核心模块已初始化');
});

// 票务类型切换功能
function initTicketTypeToggle() {
    const ticketTypes = document.querySelectorAll('.ticket-type');
    const individualControls = document.querySelector('.individual-controls');
    const groupControls = document.querySelector('.group-controls');
    
    ticketTypes.forEach(ticketType => {
        ticketType.addEventListener('click', function() {
            // 移除所有active类
            ticketTypes.forEach(type => type.classList.remove('active'));
            
            // 添加active类到当前点击的类型
            this.classList.add('active');
            
            // 获取选中的票务类型
            const radioButton = this.querySelector('input[type="radio"]');
            if (radioButton) {
                radioButton.checked = true;
                const ticketType = radioButton.value;
                
                // 根据票务类型显示对应的控制面板
                if (ticketType === 'individual') {
                    showIndividualControls();
                } else if (ticketType === 'group') {
                    showGroupControls();
                }
            }
        });
    });
    
    // 初始化显示个人票控制面板
    showIndividualControls();
}

function showIndividualControls() {
    const individualControls = document.querySelector('.individual-controls');
    const groupControls = document.querySelector('.group-controls');
    
    if (individualControls && groupControls) {
        // 显示个人票控制
        individualControls.style.display = 'block';
        individualControls.classList.add('active');
        individualControls.classList.remove('hidden');
        
        // 隐藏团体票控制
        groupControls.style.display = 'none';
        groupControls.classList.add('hidden');
        groupControls.classList.remove('active');
    }
}

function showGroupControls() {
    const individualControls = document.querySelector('.individual-controls');
    const groupControls = document.querySelector('.group-controls');
    
    if (individualControls && groupControls) {
        // 隐藏个人票控制
        individualControls.style.display = 'none';
        individualControls.classList.add('hidden');
        individualControls.classList.remove('active');
        
        // 显示团体票控制
        groupControls.style.display = 'block';
        groupControls.classList.add('active');
        groupControls.classList.remove('hidden');
    }
}

// 在DOM加载完成后初始化
document.addEventListener('DOMContentLoaded', function() {
    initTicketTypeToggle();
});

// 如果你的项目已经有其他初始化函数，可以在那里调用
// 例如在 main.js 的初始化函数中添加：
// initTicketTypeToggle();