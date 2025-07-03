/**
 * @file canvas.js
 * @description 负责项目的"视觉呈现"，使用原生Canvas API将数据结构可视化。
 */

// ========================= 配置常量 =========================

const CANVAS_CONFIG = {
    // 座位相关配置
    SEAT_RADIUS: 15,
    ROW_SPACING: 40,
    COL_SPACING: 10,
    
    // 弧形布局配置
    ARC_RADIUS: 600,
    CIRCLE_CENTER: -400,
    ANGLE_FACTOR: Math.PI / 60,
    
    // 画布配置
    CANVAS_PADDING: 50,
    MIN_CANVAS_WIDTH: 800,
    MIN_CANVAS_HEIGHT: 600,
    MIN_ARC_HEIGHT: 400,
    
    // 屏幕配置
    SCREEN_HEIGHT: 50,
    SCREEN_WIDTH_RATIO: 0.8,
    SCREEN_MARGIN: 10,
    
    // 样式配置
    SCREEN_COLOR: '#2c2c2c',
    TEXT_COLOR: 'white',
    SCREEN_FONT: '16px Arial',
    SEAT_FONT: '10px Arial',
    
    // 虚线配置
    AISLE_LINE_COLOR: 'grey',
    AISLE_LINE_WIDTH: 1,
    AISLE_DASH_PATTERN: [8, 4],
    
    // 中心区域配置
    CENTER_ZONE_COLOR: 'orange',
    CENTER_ZONE_WIDTH: 2,
    CENTER_ZONE_DASH: [10, 5],
    CENTER_ZONE_PADDING: 5,
    CENTER_ZONE_MARGIN: 20,
    CENTER_ZONE_RATIO: 0.2,
    
    // 图片路径配置
    IMAGE_PATHS: {
        available: 'img/available.PNG',
        selected: 'img/selected.PNG',
        sold: 'img/sold.PNG'
    },
    
    // 布局类型
    LAYOUT_TYPES: {
        ARC: 'arc',
        PARALLEL: 'parallel'
    }
};

// ========================= 全局变量 =========================

/**
 * 全局状态管理对象
 */
const GLOBAL_STATE = {
    // 座位数据
    seatsArray: [],
    
    // 预加载的图片
    seatImages: {},
    
    // 布局相关
    currentLayout: CANVAS_CONFIG.LAYOUT_TYPES.ARC,
    totalRows: 0,
    totalCols: 0,
    
    // 画布相关
    canvas: null,
    ctx: null,
    canvasWidth: 0,
    canvasHeight: 0,
    
    // 中心区域信息
    centerZoneInfo: null,
    centerSeatsCoords: [],
    
    // 初始化状态
    isInitialized: false
};

// ========================= 核心绘制函数 =========================

/**
 * 绘制单个座位
 * @param {number} x - 座位的中心点 x 坐标
 * @param {number} y - 座位的中心点 y 坐标
 * @param {Object} seat - 座位对象（包含状态、行号、列号等信息）
 */
function drawSeat(x, y, seat) {
    const { SEAT_RADIUS, SEAT_FONT, TEXT_COLOR } = CANVAS_CONFIG;
    const { ctx, seatImages } = GLOBAL_STATE;
    const img = seatImages[seat.status];

    if (img) {
        // 使用 drawImage 绘制贴图，坐标需要调整为左上角
        ctx.drawImage(img, x - SEAT_RADIUS, y - SEAT_RADIUS, SEAT_RADIUS * 2, SEAT_RADIUS * 2);
    } else {
        // 如果某个状态的图片加载失败或不存在，则回退到绘制灰色圆形
        ctx.fillStyle = 'gray';
        ctx.beginPath();
        ctx.arc(x, y, SEAT_RADIUS, 0, Math.PI * 2);
        ctx.fill();
    }

    // 绘制座位号和排号
    ctx.fillStyle = TEXT_COLOR;
    ctx.font = SEAT_FONT;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(`${seat.row}-${seat.col}`, x, y);
}

/**
 * 核心函数：绘制整个影厅的座位布局
 */
function drawCinema() {
    const { canvas, ctx, seatsArray, currentLayout } = GLOBAL_STATE;
    
    if (!canvas || !ctx) {
        console.error('Canvas未初始化');
        return;
    }

    // 更新全局状态
    updateGlobalLayoutInfo();

    // 设置画布尺寸
    const canvasDimensions = calculateCanvasSize();
    canvas.width = canvasDimensions.width;
    canvas.height = canvasDimensions.height;
    GLOBAL_STATE.canvasWidth = canvasDimensions.width;
    GLOBAL_STATE.canvasHeight = canvasDimensions.height;

    console.log(`画布尺寸已调整为: ${canvas.width} x ${canvas.height}`);

    // 清空画布
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // 绘制屏幕和过道
    drawScreen();
    drawAisle();

    // 计算中心区域
    GLOBAL_STATE.centerZoneInfo = calculateCenterZone();
    GLOBAL_STATE.centerSeatsCoords = [];

    // 绘制所有座位
    seatsArray.forEach(seat => {
        const coords = calculateSeatPosition(seat);
        
        // 检查是否为中心座位
        if (isInCenterZone(seat)) {
            GLOBAL_STATE.centerSeatsCoords.push(coords);
        }

        drawSeat(coords.x, coords.y, seat);
    });

    // 绘制中心区域标识
    if (GLOBAL_STATE.centerSeatsCoords.length > 0) {
        if (currentLayout === CANVAS_CONFIG.LAYOUT_TYPES.PARALLEL) {
            drawCenterZone();
        } else {
            drawCenterSector();
        }
    }

    console.log('影厅绘制完毕');
}

/**
 * 更新全局布局信息
 */
function updateGlobalLayoutInfo() {
    const { seatsArray } = GLOBAL_STATE;
    GLOBAL_STATE.totalRows = Math.max(...seatsArray.map(s => s.row));
    GLOBAL_STATE.totalCols = Math.max(...seatsArray.map(s => s.col));
}

/**
 * 绘制屏幕
 */
function drawScreen() {
    const { SCREEN_COLOR, SCREEN_WIDTH_RATIO, SCREEN_MARGIN, TEXT_COLOR, SCREEN_FONT } = CANVAS_CONFIG;
    const { ctx, canvasWidth } = GLOBAL_STATE;
    
    // 绘制屏幕背景
    ctx.fillStyle = SCREEN_COLOR;
    ctx.fillRect(canvasWidth * (1 - SCREEN_WIDTH_RATIO) / 2, SCREEN_MARGIN, canvasWidth * SCREEN_WIDTH_RATIO, 30);

    // 绘制屏幕文字
    ctx.fillStyle = TEXT_COLOR;
    ctx.font = SCREEN_FONT;
    ctx.textAlign = 'center';
    ctx.fillText('屏幕', canvasWidth / 2, 30);
}

/**
 * 绘制中央过道虚线
 */
function drawAisle() {
    const { AISLE_LINE_COLOR, AISLE_LINE_WIDTH, AISLE_DASH_PATTERN } = CANVAS_CONFIG;
    const { ctx, canvasWidth, canvasHeight } = GLOBAL_STATE;
    
    ctx.save();
    ctx.strokeStyle = AISLE_LINE_COLOR;
    ctx.lineWidth = AISLE_LINE_WIDTH;
    ctx.setLineDash(AISLE_DASH_PATTERN);
    ctx.beginPath();
    ctx.moveTo(canvasWidth / 2, 50);
    ctx.lineTo(canvasWidth / 2, canvasHeight - 20);
    ctx.stroke();
    ctx.restore();
}

/**
 * 计算座位位置
 * @param {Object} seat - 座位对象
 * @returns {Object} 包含x和y坐标的对象
 */
function calculateSeatPosition(seat) {
    const { SEAT_RADIUS, ROW_SPACING, COL_SPACING, ARC_RADIUS, CIRCLE_CENTER, ANGLE_FACTOR } = CANVAS_CONFIG;
    const { currentLayout, totalRows, totalCols, canvasWidth } = GLOBAL_STATE;
    
    let x, y;

    if (currentLayout === CANVAS_CONFIG.LAYOUT_TYPES.PARALLEL) {
        // 平行布局计算
        const seatWidth = SEAT_RADIUS * 2;
        const totalWidth = totalCols * (seatWidth + COL_SPACING) - COL_SPACING;
        const xOffset = (canvasWidth - totalWidth) / 2;
        const yOffset = 100; // 顶部留白

        x = xOffset + (seat.col - 1) * (seatWidth + COL_SPACING) + SEAT_RADIUS;
        y = yOffset + (seat.row - 1) * ROW_SPACING + SEAT_RADIUS;
    } else {
        // 弧形布局计算
        const angle = (seat.col - totalCols / 2) * ANGLE_FACTOR;
        const currentArcRadius = ARC_RADIUS + (seat.row - 1) * ROW_SPACING;
        x = canvasWidth / 2 + currentArcRadius * Math.sin(angle);
        y = CIRCLE_CENTER + currentArcRadius * Math.cos(angle);
    }

    return { x, y };
}

/**
 * 计算中心区域信息
 * @returns {Object} 中心区域信息
 */
function calculateCenterZone() {
    const { CENTER_ZONE_RATIO } = CANVAS_CONFIG;
    const { totalRows, totalCols, seatsArray } = GLOBAL_STATE;
    
    const targetCenterCount = Math.floor(seatsArray.length * CENTER_ZONE_RATIO);
    const layoutRatio = Math.sqrt(targetCenterCount / seatsArray.length);
    const numCenterCols = Math.ceil(totalCols * layoutRatio);
    const numCenterRows = Math.ceil(targetCenterCount / numCenterCols);

    const middleRow = Math.ceil(totalRows / 2);
    const middleCol = Math.ceil(totalCols / 2);
    
    return {
        rowStart: middleRow - Math.floor(numCenterRows / 2),
        rowEnd: middleRow - Math.floor(numCenterRows / 2) + numCenterRows - 1,
        colStart: middleCol - Math.floor(numCenterCols / 2),
        colEnd: middleCol - Math.floor(numCenterCols / 2) + numCenterCols - 1
    };
}

/**
 * 判断座位是否在中心区域
 * @param {Object} seat - 座位对象
 * @returns {boolean} 是否在中心区域
 */
function isInCenterZone(seat) {
    const { centerZoneInfo } = GLOBAL_STATE;
    return seat.row >= centerZoneInfo.rowStart && seat.row <= centerZoneInfo.rowEnd &&
           seat.col >= centerZoneInfo.colStart && seat.col <= centerZoneInfo.colEnd;
}

/**
 * 在中心座位周围绘制一个橙色虚线框
 */
function drawCenterZone() {
    const { CENTER_ZONE_COLOR, CENTER_ZONE_WIDTH, CENTER_ZONE_DASH, CENTER_ZONE_PADDING, SEAT_RADIUS } = CANVAS_CONFIG;
    const { ctx, centerSeatsCoords } = GLOBAL_STATE;
    
    // 计算包围盒
    const minX = Math.min(...centerSeatsCoords.map(c => c.x));
    const minY = Math.min(...centerSeatsCoords.map(c => c.y));
    const maxX = Math.max(...centerSeatsCoords.map(c => c.x));
    const maxY = Math.max(...centerSeatsCoords.map(c => c.y));

    // 设置虚线框样式
    ctx.strokeStyle = CENTER_ZONE_COLOR;
    ctx.lineWidth = CENTER_ZONE_WIDTH;
    ctx.setLineDash(CENTER_ZONE_DASH);

    // 绘制矩形
    ctx.strokeRect(
        minX - SEAT_RADIUS - CENTER_ZONE_PADDING,
        minY - SEAT_RADIUS - CENTER_ZONE_PADDING,
        (maxX - minX) + (SEAT_RADIUS * 2) + (CENTER_ZONE_PADDING * 2),
        (maxY - minY) + (SEAT_RADIUS * 2) + (CENTER_ZONE_PADDING * 2)
    );

    // 恢复为实线
    ctx.setLineDash([]);
}

/**
 * 为弧形布局绘制扇形中心区域
 */
function drawCenterSector() {
    const { 
        CENTER_ZONE_COLOR, CENTER_ZONE_WIDTH, CENTER_ZONE_DASH, CENTER_ZONE_MARGIN,
        ARC_RADIUS, ROW_SPACING, CIRCLE_CENTER, ANGLE_FACTOR
    } = CANVAS_CONFIG;
    const { ctx, centerZoneInfo, totalCols, canvasWidth } = GLOBAL_STATE;
    
    const centerX = canvasWidth / 2;
    const centerY = CIRCLE_CENTER;

    // 计算扇形的角度范围
    const baseStartAngle = (centerZoneInfo.colStart - 0.5 - totalCols / 2) * ANGLE_FACTOR;
    const baseEndAngle = (centerZoneInfo.colEnd + 0.5 - totalCols / 2) * ANGLE_FACTOR;
    const startAngleForArc = Math.PI / 2 + baseStartAngle;
    const endAngleForArc = Math.PI / 2 + baseEndAngle;

    // 计算扇形的半径范围
    const innerRadius = ARC_RADIUS + (centerZoneInfo.rowStart - 1) * ROW_SPACING - CENTER_ZONE_MARGIN;
    const outerRadius = ARC_RADIUS + centerZoneInfo.rowEnd * ROW_SPACING + CENTER_ZONE_MARGIN;

    // 设置扇形样式
    ctx.save();
    ctx.strokeStyle = CENTER_ZONE_COLOR;
    ctx.lineWidth = CENTER_ZONE_WIDTH;
    ctx.setLineDash(CENTER_ZONE_DASH);

    // 绘制扇形边界
    drawSectorBoundaries(centerX, centerY, innerRadius, outerRadius, 
                        startAngleForArc, endAngleForArc, baseStartAngle, baseEndAngle);

    ctx.restore();
}

/**
 * 绘制扇形边界
 */
function drawSectorBoundaries(centerX, centerY, innerRadius, outerRadius, 
                            startAngleForArc, endAngleForArc, baseStartAngle, baseEndAngle) {
    const { ctx } = GLOBAL_STATE;
    
    // 绘制内弧
    ctx.beginPath();
    ctx.arc(centerX, centerY, innerRadius, startAngleForArc, endAngleForArc);
    ctx.stroke();

    // 绘制外弧
    ctx.beginPath();
    ctx.arc(centerX, centerY, outerRadius, startAngleForArc, endAngleForArc);
    ctx.stroke();

    // 绘制径向线
    const radialLines = [
        { angle: baseStartAngle, label: '左径向线' },
        { angle: baseEndAngle, label: '右径向线' }
    ];

    radialLines.forEach(({ angle, label }) => {
        const innerX = centerX + innerRadius * Math.sin(angle);
        const innerY = centerY + innerRadius * Math.cos(angle);
        const outerX = centerX + outerRadius * Math.sin(angle);
        const outerY = centerY + outerRadius * Math.cos(angle);

        console.log(`${label}坐标:`, { innerX, innerY, outerX, outerY, angle: angle * 180 / Math.PI });

        ctx.beginPath();
        ctx.moveTo(innerX, innerY);
        ctx.lineTo(outerX, outerY);
        ctx.stroke();
    });
}

/**
 * 预加载所有座位状态的图片
 * @returns {Promise<Object>} - 一个Promise，解析后返回一个包含已加载图片的对象
 */
function preloadSeatImages() {
    const { IMAGE_PATHS } = CANVAS_CONFIG;
    
    const promises = Object.entries(IMAGE_PATHS).map(([status, src]) => {
        return new Promise((resolve, reject) => {
            const img = new Image();
            img.onload = () => resolve({ status, img });
            img.onerror = () => {
                console.error(`图片加载失败: ${src}`);
                reject(`图片加载失败: ${src}`);
            };
            img.src = src;
        });
    });

    return Promise.all(promises).then(results => {
        const images = {};
        results.forEach(({ status, img }) => {
            images[status] = img;
        });
        GLOBAL_STATE.seatImages = images;
        console.log('所有座位图片预加载完毕');
        return images;
    });
}

/**
 * 根据座位布局动态计算画布尺寸
 * @returns {Object} 包含width和height的对象
 */
function calculateCanvasSize() {
    const { 
        CANVAS_PADDING, MIN_CANVAS_WIDTH, MIN_CANVAS_HEIGHT, MIN_ARC_HEIGHT,
        SEAT_RADIUS, ROW_SPACING, COL_SPACING, ARC_RADIUS, CIRCLE_CENTER, ANGLE_FACTOR
    } = CANVAS_CONFIG;
    const { totalRows, totalCols, currentLayout } = GLOBAL_STATE;

    if (currentLayout === CANVAS_CONFIG.LAYOUT_TYPES.PARALLEL) {
        // 平行布局的尺寸计算
        const seatWidth = SEAT_RADIUS * 2;
        const totalWidth = totalCols * (seatWidth + COL_SPACING) - COL_SPACING + (CANVAS_PADDING * 2);
        const totalHeight = totalRows * ROW_SPACING + 100 + (CANVAS_PADDING * 2);

        return {
            width: Math.max(MIN_CANVAS_WIDTH, totalWidth),
            height: Math.max(MIN_CANVAS_HEIGHT, totalHeight)
        };
    } else {
        // 弧形布局的尺寸计算
        const maxRadius = ARC_RADIUS + (totalRows - 1) * ROW_SPACING;
        const maxAngle = (totalCols / 2) * ANGLE_FACTOR;
        const maxX = maxRadius * Math.sin(maxAngle);
        const width = Math.max(MIN_CANVAS_WIDTH, (maxX * 2) + (CANVAS_PADDING * 2));
        const effectiveHeight = CIRCLE_CENTER + ARC_RADIUS + (totalRows - 1) * ROW_SPACING + SEAT_RADIUS + CANVAS_PADDING;
        const height = Math.max(MIN_ARC_HEIGHT, effectiveHeight);

        return {
            width: Math.ceil(width),
            height: Math.ceil(height)
        };
    }
}

// ========================= 虚拟数据和初始化 =========================

/**
 * 从main.js获取实际座位数据并转换为Canvas绘制格式
 * @returns {Array} 座位数据数组
 */
function getActualSeatsData() {
    // 检查main.js模块是否已加载
    if (!window.CinemaData) {
        console.warn('CinemaData模块未加载，使用虚拟数据');
        return generateVirtualSeatsData();
    }

    const config = window.CinemaData.getCurrentConfig();
    const seatsData = [];

    // 遍历所有座位并获取实际数据
    for (let row = 1; row <= config.TOTAL_ROWS; row++) {
        for (let col = 1; col <= config.SEATS_PER_ROW; col++) {
            const seat = window.CinemaData.getSeat(row, col);
            if (seat) {
                seatsData.push({
                    row: seat.row,
                    col: seat.col,
                    status: seat.status,
                    id: seat.id
                });
            }
        }
    }

    console.log(`从main.js获取到${seatsData.length}个座位数据`);
    return seatsData;
}

/**
 * 生成虚拟座位数据（作为后备方案）
 * @returns {Array} 虚拟座位数据数组
 */
function generateVirtualSeatsData() {
    const virtualSeatsData = [];
    const rows = 10;
    const cols = 20;
    
    for (let i = 1; i <= rows; i++) {
        for (let j = 1; j <= cols; j++) {
            let status = 'available';
            if (Math.random() > 0.8) {
                status = 'sold';
            }
            virtualSeatsData.push({ 
                row: i, 
                col: j, 
                status: status,
                id: `seat-${i}-${j}`
            });
        }
    }
    
    console.log('使用虚拟数据生成座位');
    return virtualSeatsData;
}

/**
 * 初始化全局状态
 */
function initializeGlobalState() {
    // 获取Canvas元素
    GLOBAL_STATE.canvas = document.getElementById('cinema-canvas');
    if (!GLOBAL_STATE.canvas || !GLOBAL_STATE.canvas.getContext) {
        console.error('浏览器不支持Canvas或未找到canvas元素');
        return false;
    }
    
    GLOBAL_STATE.ctx = GLOBAL_STATE.canvas.getContext('2d');
    
    // 首先尝试初始化main.js中的座位数据
    if (window.CinemaData && typeof window.CinemaData.initializeCinemaSeats === 'function') {
        // 使用默认配置初始化座位数据
        window.CinemaData.initializeCinemaSeats(10, 20);
        console.log('已初始化main.js中的座位数据');
    }

    // 获取座位数据
    GLOBAL_STATE.seatsArray = getActualSeatsData();
    GLOBAL_STATE.isInitialized = true;
    
    return true;
}

/**
 * 初始化并绘制Cinema
 * @param {string} layoutType - 布局类型
 */
function initializeAndDrawCinema(layoutType = CANVAS_CONFIG.LAYOUT_TYPES.ARC) {
    // 初始化全局状态
    if (!initializeGlobalState()) {
        console.error('初始化失败');
        return;
    }
    
    // 设置当前布局
    GLOBAL_STATE.currentLayout = layoutType;
    
    // 预加载图片并绘制
    preloadSeatImages().then(() => {
        drawCinema();
    }).catch(error => {
        console.error("图片预加载失败:", error);
        drawCinema();
    });

    return GLOBAL_STATE.seatsArray;
}

/**
 * 刷新Canvas显示（用于数据更新后重绘）
 * @param {string} layoutType - 布局类型
 */
function refreshCinemaDisplay(layoutType) {
    if (!GLOBAL_STATE.isInitialized) {
        console.error('Canvas未初始化');
        return;
    }
    
    // 更新布局类型
    if (layoutType) {
        GLOBAL_STATE.currentLayout = layoutType;
    }
    
    // 刷新座位数据
    GLOBAL_STATE.seatsArray = getActualSeatsData();
    
    // 重绘Canvas
    drawCinema();
}

// 页面加载后执行 - 修改版本
window.addEventListener('DOMContentLoaded', () => {
    const canvas = document.getElementById('cinema-canvas');
    const toggleBtn = document.getElementById('toggle-layout-btn');

    if (canvas && toggleBtn) {
        // 等待所有模块加载完成
        setTimeout(() => {
            // 初始化并绘制Cinema
            initializeAndDrawCinema();
        }, 100);

        // 为按钮添加点击事件
        toggleBtn.addEventListener('click', () => {
            const newLayout = (GLOBAL_STATE.currentLayout === CANVAS_CONFIG.LAYOUT_TYPES.ARC) ? 
                             CANVAS_CONFIG.LAYOUT_TYPES.PARALLEL : CANVAS_CONFIG.LAYOUT_TYPES.ARC;
            console.log(`布局已切换为: ${newLayout}`);
            
            // 刷新显示
            refreshCinemaDisplay(newLayout);
        });

    } else {
        if (!canvas) console.error('未找到ID为 cinema-canvas 的 canvas 元素');
        if (!toggleBtn) console.error('未找到ID为 toggle-layout-btn 的按钮元素');
    }
});

// ========================= 模块导出 =========================

window.CanvasRenderer = {
    drawSeat,
    drawCinema,
    drawCenterZone,
    drawCenterSector,
    preloadSeatImages,
    calculateCanvasSize,
    CANVAS_CONFIG,
    GLOBAL_STATE,
    
    // 新增的实际数据相关函数
    getActualSeatsData,
    initializeAndDrawCinema,
    refreshCinemaDisplay,
};

console.log('电影院Canvas渲染模块(canvas.js)已加载 - 使用实际数据和全局状态管理');