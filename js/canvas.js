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
    CENTER_ZONE_RATIO: 0.25,

    // 图片路径配置
    IMAGE_PATHS: {
        available: 'img/seat_available.png',
        selected: 'img/seat_selected.png',
        sold: 'img/seat_sold.png',
        reserved: 'img/seat_reserved.png'
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
 * 设置高分辨率Canvas，避免图片模糊
 * @param {HTMLCanvasElement} canvas - Canvas元素
 * @param {CanvasRenderingContext2D} ctx - Canvas上下文
 * @param {number} width - 逻辑宽度
 * @param {number} height - 逻辑高度
 */
function setupHighDPICanvas(canvas, ctx, width, height) {
    const devicePixelRatio = window.devicePixelRatio || 1;
    
    // 设置Canvas的实际分辨率
    canvas.width = width * devicePixelRatio;
    canvas.height = height * devicePixelRatio;
    
    // 设置CSS显示尺寸
    canvas.style.width = width + 'px';
    canvas.style.height = height + 'px';
    
    // 缩放上下文以匹配设备像素比
    ctx.scale(devicePixelRatio, devicePixelRatio);
    
    // 启用抗锯齿和图像平滑
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';
}

/**
 * 绘制单个座位 - 优化版本（移除文字绘制）
 * @param {number} x - 座位的中心点 x 坐标
 * @param {number} y - 座位的中心点 y 坐标
 * @param {Object} seat - 座位对象（包含状态、行号、列号等信息）
 */
function drawSeat(x, y, seat) {
    const { SEAT_RADIUS } = CANVAS_CONFIG;
    const { ctx, seatImages } = GLOBAL_STATE;

    // 确定显示状态：如果座位被选中，显示selected状态，否则显示原状态
    let displayStatus = seat.status;
    if (seat.isSelected && seat.status === 'available') {
        displayStatus = 'selected';
    }

    // 计算座位大小：直接从StateManager的globalState获取悬停状态
    let isHovered = false;
    if (window.StateManager && window.StateManager.getCurrentState) {
        const stateManagerState = window.StateManager.getCurrentState();
        const hoveredSeatInfo = stateManagerState.hoveredSeat;
        if (hoveredSeatInfo) {
            const [hoveredRow, hoveredCol] = hoveredSeatInfo.split('-').map(Number);
            isHovered = (seat.row === hoveredRow && seat.col === hoveredCol);
        }
    }

    const scaleFactor = isHovered ? 1.2 : 1.0;
    const currentRadius = SEAT_RADIUS * scaleFactor;

    const img = seatImages[displayStatus];

    if (img) {
        // 保存当前状态
        ctx.save();
        
        // 为图片绘制启用最佳质量设置
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';
        
        // 使用整数坐标避免亚像素渲染
        const drawX = Math.round(x - currentRadius);
        const drawY = Math.round(y - currentRadius);
        const drawSize = Math.round(currentRadius * 2);
        
        ctx.drawImage(
            img,
            drawX,
            drawY,
            drawSize,
            drawSize
        );
        
        ctx.restore();
    } else {
        // 如果某个状态的图片加载失败或不存在，则回退到绘制灰色圆形
        ctx.fillStyle = 'gray';
        ctx.beginPath();
        ctx.arc(x, y, currentRadius, 0, Math.PI * 2);
        ctx.fill();
    }
}

/**
 * 绘制行列标识文字
 */
function drawRowColumnLabels() {
    const { TEXT_COLOR, SEAT_FONT } = CANVAS_CONFIG;
    const { ctx, totalRows, totalCols, currentLayout } = GLOBAL_STATE;

    ctx.save();
    ctx.fillStyle = TEXT_COLOR;
    ctx.font = SEAT_FONT;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    // 收集每行和每列的座位位置信息
    const rowPositions = new Map(); // 行号 -> {minX, maxX, y}
    const colPositions = new Map(); // 列号 -> {x, minY, maxY}

    // 获取座位数据
    const seatsArray = window.CinemaData.getCinemaSeats().flat();

    // 分析每个座位的位置，收集行列信息
    seatsArray.forEach(seat => {
        const coords = calculateSeatPosition(seat);
        
        // 收集行信息
        if (!rowPositions.has(seat.row)) {
            rowPositions.set(seat.row, {
                minX: coords.x,
                maxX: coords.x,
                y: coords.y
            });
        } else {
            const rowInfo = rowPositions.get(seat.row);
            rowInfo.minX = Math.min(rowInfo.minX, coords.x);
            rowInfo.maxX = Math.max(rowInfo.maxX, coords.x);
        }

        // 收集列信息
        if (!colPositions.has(seat.col)) {
            colPositions.set(seat.col, {
                x: coords.x,
                minY: coords.y,
                maxY: coords.y
            });
        } else {
            const colInfo = colPositions.get(seat.col);
            colInfo.minY = Math.min(colInfo.minY, coords.y);
            colInfo.maxY = Math.max(colInfo.maxY, coords.y);
        }
    });

    // 绘制行标识（在每行左侧）
    ctx.textAlign = 'right';
    ctx.textBaseline = 'middle';
    rowPositions.forEach((rowInfo, rowNum) => {
        const labelX = rowInfo.minX - 40; // 在最左边座位左侧40像素处
        const labelY = rowInfo.y;
        ctx.fillText(`第${rowNum}排`, labelX, labelY);
    });

    // 绘制列标识 - 根据布局类型采用不同策略
    if (currentLayout === CANVAS_CONFIG.LAYOUT_TYPES.PARALLEL) {
        // 平行布局：在每列下方绘制
        ctx.textAlign = 'center';
        ctx.textBaseline = 'top';
        colPositions.forEach((colInfo, colNum) => {
            const labelX = colInfo.x;
            const labelY = colInfo.maxY + 40; // 在最下边座位下方40像素处
            ctx.fillText(`第${colNum}列`, labelX, labelY);
        });
    } else {
        // 弧形布局：在每列的最后排（最后一行）座位下方绘制
        ctx.textAlign = 'center';
        ctx.textBaseline = 'top';
        
        // 找到每列最后一行的座位位置
        for (let col = 1; col <= totalCols; col++) {
            // 找到该列最后一行的座位
            const lastRowSeat = seatsArray.find(seat => seat.col === col && seat.row === totalRows);
            if (lastRowSeat) {
                const coords = calculateSeatPosition(lastRowSeat);
                const labelX = coords.x;
                const labelY = coords.y + 40; // 在最后一行座位下方40像素处
                ctx.fillText(`第${col}列`, labelX, labelY);
            }
        }
    }

    ctx.restore();
}

/**
 * 修改后的绘制影厅函数
 */
function drawCinema() {
    const { canvas, ctx, currentLayout } = GLOBAL_STATE;

    if (!canvas || !ctx) {
        console.error('Canvas未初始化');
        return;
    }

    // 从 main.js 获取座位数据
    if (!window.CinemaData || !window.CinemaData.getCinemaSeats) {
        console.error('CinemaData模块未加载或getCinemaSeats函数不可用');
        return;
    }

    const seatsArray = window.CinemaData.getCinemaSeats().flat(); // 将二维数组转为一维数组

    if (!seatsArray || seatsArray.length === 0) {
        console.error('座位数据为空');
        return;
    }

    // 更新全局布局信息
    GLOBAL_STATE.totalRows = Math.max(...seatsArray.map(s => s.row));
    GLOBAL_STATE.totalCols = Math.max(...seatsArray.map(s => s.col));

    // 设置画布尺寸 - 使用高DPI适配
    const canvasDimensions = calculateCanvasSize();
    
    // 使用高DPI设置替代原来的尺寸设置
    setupHighDPICanvas(canvas, ctx, canvasDimensions.width, canvasDimensions.height);
    
    GLOBAL_STATE.canvasWidth = canvasDimensions.width;
    GLOBAL_STATE.canvasHeight = canvasDimensions.height;

    // 清空画布
    ctx.clearRect(0, 0, canvasDimensions.width, canvasDimensions.height);
    const { canvasWidth, canvasHeight } = GLOBAL_STATE;

    // ===== 绘制中央过道虚线 =====
    const { AISLE_LINE_COLOR, AISLE_LINE_WIDTH, AISLE_DASH_PATTERN } = CANVAS_CONFIG;

    ctx.save();
    ctx.strokeStyle = AISLE_LINE_COLOR;
    ctx.lineWidth = AISLE_LINE_WIDTH;
    ctx.setLineDash(AISLE_DASH_PATTERN);
    ctx.beginPath();
    ctx.moveTo(canvasWidth / 2, 50);
    ctx.lineTo(canvasWidth / 2, canvasHeight - 20);
    ctx.stroke();
    ctx.restore();

    // ===== 计算中心区域 =====
    GLOBAL_STATE.centerZoneInfo = calculateCenterZone();
    GLOBAL_STATE.centerSeatsCoords = [];

    // 内联的 isInCenterZone 判断逻辑
    const isInCenterZone = (seat) => {
        const { centerZoneInfo } = GLOBAL_STATE;
        return seat.row >= centerZoneInfo.rowStart && seat.row <= centerZoneInfo.rowEnd &&
            seat.col >= centerZoneInfo.colStart && seat.col <= centerZoneInfo.colEnd;
    };

    // ===== 绘制所有座位 =====
    seatsArray.forEach(seat => {
        const coords = calculateSeatPosition(seat);

        // 从StateManager获取选中状态（如果StateManager已加载）
        if (window.StateManager && window.StateManager.getSelectedSeats) {
            const selectedSeats = window.StateManager.getSelectedSeats();
            seat.isSelected = selectedSeats.some(selectedSeat => selectedSeat.id === seat.id);
        } else {
            seat.isSelected = false; // 默认未选中
        }

        // 检查是否为中心座位
        if (isInCenterZone(seat)) {
            GLOBAL_STATE.centerSeatsCoords.push(coords);
        }

        drawSeat(coords.x, coords.y, seat);
    });

    // ===== 绘制行列标识 =====
    drawRowColumnLabels();

    // ===== 绘制中心区域标识 ======
    // 无论是否有centerSeatsCoords，都尝试绘制中心区域（基于centerZoneInfo）
    if (GLOBAL_STATE.centerZoneInfo) {
        drawCenterZone();
    } else {
        console.warn('centerZoneInfo 为空，无法绘制中心区域');
    }
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
        // 调整角度计算以确保座位以中央虚线为中心对称分布
        // 总列数为奇数时：中央虚线在中间列上
        // 总列数为偶数时：中央虚线在中间两列之间
        let columnOffset;
        if (totalCols % 2 === 1) {
            // 奇数列：以中间列为中心，第(totalCols+1)/2列的角度为0
            const centerCol = (totalCols + 1) / 2;
            columnOffset = seat.col - centerCol;
        } else {
            // 偶数列：以中间两列之间为中心
            const centerPoint = (totalCols + 1) / 2;
            columnOffset = seat.col - centerPoint;
        }

        const angle = columnOffset * ANGLE_FACTOR;
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
    const { totalRows, totalCols } = GLOBAL_STATE;

    // 从 main.js 获取座位总数
    const config = window.CinemaData ? window.CinemaData.getCurrentConfig() : null;
    const totalSeats = config ? config.TOTAL_SEATS : totalRows * totalCols;

    const targetCenterCount = Math.floor(totalSeats * CENTER_ZONE_RATIO);
    const layoutRatio = Math.sqrt(targetCenterCount / totalSeats);
    const numCenterCols = Math.ceil(totalCols * layoutRatio);
    const numCenterRows = Math.ceil(targetCenterCount / numCenterCols);

    const middleRow = Math.ceil(totalRows / 2);

    // 使用与座位位置计算相同的中心对齐逻辑
    let middleCol;
    if (totalCols % 2 === 1) {
        // 奇数列：中心点是中间列
        middleCol = (totalCols + 1) / 2;
    } else {
        // 偶数列：中心点是中间两列之间（使用非整数值）
        middleCol = (totalCols + 1) / 2;
    }

    return {
        rowStart: middleRow - Math.floor(numCenterRows / 2),
        rowEnd: middleRow - Math.floor(numCenterRows / 2) + numCenterRows - 1,
        colStart: Math.round(middleCol - numCenterCols / 2),
        colEnd: Math.round(middleCol + numCenterCols / 2) - 1
    };
}

/**
 * 绘制中心区域标识（支持平行布局和弧形布局）
 */
function drawCenterZone() {

    const {
        CENTER_ZONE_COLOR, CENTER_ZONE_WIDTH, CENTER_ZONE_DASH, CENTER_ZONE_PADDING, CENTER_ZONE_MARGIN,
        SEAT_RADIUS, ARC_RADIUS, ROW_SPACING, CIRCLE_CENTER, ANGLE_FACTOR
    } = CANVAS_CONFIG;
    const { ctx, centerSeatsCoords, centerZoneInfo, totalCols, canvasWidth, currentLayout } = GLOBAL_STATE;

    // 设置通用样式
    ctx.save();
    ctx.strokeStyle = CENTER_ZONE_COLOR;
    ctx.lineWidth = CENTER_ZONE_WIDTH;
    ctx.setLineDash(CENTER_ZONE_DASH);

    if (currentLayout === CANVAS_CONFIG.LAYOUT_TYPES.PARALLEL) {
        // ===== 平行布局：绘制矩形虚线框 =====
        if (centerSeatsCoords.length > 0) {
            // 计算包围盒
            const minX = Math.min(...centerSeatsCoords.map(c => c.x));
            const minY = Math.min(...centerSeatsCoords.map(c => c.y));
            const maxX = Math.max(...centerSeatsCoords.map(c => c.x));
            const maxY = Math.max(...centerSeatsCoords.map(c => c.y));

            // 绘制矩形
            ctx.strokeRect(
                minX - SEAT_RADIUS - CENTER_ZONE_PADDING,
                minY - SEAT_RADIUS - CENTER_ZONE_PADDING,
                (maxX - minX) + (SEAT_RADIUS * 2) + (CENTER_ZONE_PADDING * 2),
                (maxY - minY) + (SEAT_RADIUS * 2) + (CENTER_ZONE_PADDING * 2)
            );
        }
    } else {
        // ===== 弧形布局：绘制扇形区域 =====
        if (centerZoneInfo) {
            const centerX = canvasWidth / 2;
            const centerY = CIRCLE_CENTER;

            // 计算扇形的角度范围 - 使用与座位位置计算相同的逻辑
            let startColumnOffset, endColumnOffset;
            if (totalCols % 2 === 1) {
                // 奇数列：以中间列为中心
                const centerCol = (totalCols + 1) / 2;
                startColumnOffset = (centerZoneInfo.colStart - 0.5) - centerCol;
                endColumnOffset = (centerZoneInfo.colEnd + 0.5) - centerCol;
            } else {
                // 偶数列：以中间两列之间为中心
                const centerPoint = (totalCols + 1) / 2;
                startColumnOffset = (centerZoneInfo.colStart - 0.5) - centerPoint;
                endColumnOffset = (centerZoneInfo.colEnd + 0.5) - centerPoint;
            }

            const baseStartAngle = startColumnOffset * ANGLE_FACTOR;
            const baseEndAngle = endColumnOffset * ANGLE_FACTOR;
            const startAngleForArc = Math.PI / 2 + baseStartAngle;
            const endAngleForArc = Math.PI / 2 + baseEndAngle;

            // 计算扇形的半径范围
            const innerRadius = ARC_RADIUS + (centerZoneInfo.rowStart - 1) * ROW_SPACING - CENTER_ZONE_MARGIN;
            const outerRadius = ARC_RADIUS + centerZoneInfo.rowEnd * ROW_SPACING + CENTER_ZONE_MARGIN;

            // 绘制内弧
            ctx.beginPath();
            ctx.arc(centerX, centerY, innerRadius, startAngleForArc, endAngleForArc);
            ctx.stroke();

            // 绘制外弧
            ctx.beginPath();
            ctx.arc(centerX, centerY, outerRadius, startAngleForArc, endAngleForArc);
            ctx.stroke();

            // 计算内弧起点和终点坐标
            const innerStartX = centerX + innerRadius * Math.cos(startAngleForArc);
            const innerStartY = centerY + innerRadius * Math.sin(startAngleForArc);
            const innerEndX = centerX + innerRadius * Math.cos(endAngleForArc);
            const innerEndY = centerY + innerRadius * Math.sin(endAngleForArc);

            // 计算外弧起点和终点坐标
            const outerStartX = centerX + outerRadius * Math.cos(startAngleForArc);
            const outerStartY = centerY + outerRadius * Math.sin(startAngleForArc);
            const outerEndX = centerX + outerRadius * Math.cos(endAngleForArc);
            const outerEndY = centerY + outerRadius * Math.sin(endAngleForArc);

            // 绘制连接内外弧线顶点的橙色虚线
            ctx.save();
            ctx.strokeStyle = CENTER_ZONE_COLOR; // 使用橙色
            ctx.lineWidth = CENTER_ZONE_WIDTH;
            ctx.setLineDash(CENTER_ZONE_DASH); // 使用虚线样式

            // 绘制左侧连接线（连接内弧起点和外弧起点）
            ctx.beginPath();
            ctx.moveTo(innerStartX, innerStartY);
            ctx.lineTo(outerStartX, outerStartY);
            ctx.stroke();

            // 绘制右侧连接线（连接内弧终点和外弧终点）
            ctx.beginPath();
            ctx.moveTo(innerEndX, innerEndY);
            ctx.lineTo(outerEndX, outerEndY);
            ctx.stroke();

            ctx.restore();

        }
    }

    // 恢复Canvas状态
    ctx.restore();
}

/**
 * 优化图片预加载函数
 */
function preloadSeatImages() {
    const { IMAGE_PATHS } = CANVAS_CONFIG;

    const promises = Object.entries(IMAGE_PATHS).map(([status, src]) => {
        return new Promise((resolve, reject) => {
            const img = new Image();
            
            // 设置图片平滑处理
            img.style.imageRendering = 'auto';
            
            img.onload = () => {
                // 确保图片完全加载
                console.log(`图片加载成功: ${status} (${img.naturalWidth}x${img.naturalHeight})`);
                resolve({ status, img });
            };
            
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
 * 初始化并绘制Cinema - 集成了数据获取、状态初始化和绘制功能
 * @param {string} layoutType - 布局类型
 */
function initializeAndDrawCinema(layoutType = CANVAS_CONFIG.LAYOUT_TYPES.ARC) {
    // ===== 初始化全局状态 =====
    GLOBAL_STATE.canvas = document.getElementById('cinema-canvas');

    GLOBAL_STATE.ctx = GLOBAL_STATE.canvas.getContext('2d');

    // ===== 确保座位数据已初始化 =====
    if (window.CinemaData && typeof window.CinemaData.initializeCinemaSeats === 'function') {
        const currentConfig = window.CinemaData.getCurrentConfig();
        
        // 检查是否已有有效的座位数据
        const currentSeats = window.CinemaData.getCinemaSeats();
        
        if (!currentSeats || currentSeats.length === 0 || currentSeats.flat().length === 0) {
            // 如果没有座位数据，使用默认配置初始化
            console.log('座位数据为空，使用默认配置初始化');
            window.CinemaData.initializeCinemaSeats(10, 20);
        } else {
            console.log(`发现现有座位数据: ${currentSeats.length}排，共${currentSeats.flat().length}个座位`);
        }
    } else {
        console.error('CinemaData模块未加载或initializeCinemaSeats函数不可用');
        return;
    }

    const seatsData = window.CinemaData.getCinemaSeats().flat(); 

    // 设置状态
    GLOBAL_STATE.isInitialized = true;
    GLOBAL_STATE.currentLayout = layoutType;

    // ===== 预加载图片并绘制 =====
    preloadSeatImages().then(() => {
        drawCinema();
    }).catch(error => {
        console.error("图片预加载失败:", error);
        drawCinema();
    });

    return seatsData;
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

    // 重绘Canvas
    drawCinema();
}

// ========================= 布局切换函数 =========================

/**
 * 切换布局模式
 */
function toggleLayout() {
    GLOBAL_STATE.currentLayout = (GLOBAL_STATE.currentLayout === CANVAS_CONFIG.LAYOUT_TYPES.ARC)
        ? CANVAS_CONFIG.LAYOUT_TYPES.PARALLEL
        : CANVAS_CONFIG.LAYOUT_TYPES.ARC;

    // 重新绘制
    if (GLOBAL_STATE.isInitialized) {
        drawCinema();
    }
}

// ========================= 页面加载初始化 =========================
window.addEventListener('DOMContentLoaded', () => {
    const canvas = document.getElementById('cinema-canvas');
    const toggleBtn = document.getElementById('toggle-layout-btn');

    if (canvas && toggleBtn) {
        setTimeout(() => {
            initializeAndDrawCinema();
        }, 200); 

        // 为按钮添加点击事件
        toggleBtn.addEventListener('click', () => {
            const newLayout = (GLOBAL_STATE.currentLayout === CANVAS_CONFIG.LAYOUT_TYPES.ARC) ?
                CANVAS_CONFIG.LAYOUT_TYPES.PARALLEL : CANVAS_CONFIG.LAYOUT_TYPES.ARC;
            console.log(`布局已切换为: ${newLayout}`);

            // 刷新显示
            refreshCinemaDisplay(newLayout);
        });

    } else {
        console.error('Canvas或切换按钮未找到，请检查HTML结构');
    }
});

// ========================= 模块导出 =========================

window.CanvasRenderer = {
    drawSeat,
    drawCinema,
    drawCenterZone,
    preloadSeatImages,
    calculateSeatPosition,
    calculateCanvasSize,
    CANVAS_CONFIG,
    GLOBAL_STATE,

    initializeAndDrawCinema,
    refreshCinemaDisplay,
    toggleLayout, 
};

console.log('电影院Canvas渲染模块已加载');