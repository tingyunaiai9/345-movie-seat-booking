
/**
 * @file canvas.js
 * @description 负责项目的“视觉呈现”，使用原生Canvas API将数据结构可视化。
 */

/**
 * 绘制单个座位
 * @param {CanvasRenderingContext2D} ctx - Canvas 2D 上下文
 * @param {number} x - 座位的中心点 x 坐标
 * @param {number} y - 座位的中心点 y 坐标
 * @param {number} radius - 座位的半径
 * @param {string} status - 座位状态 ('available', 'selected', 'sold')
 * @param {string} seatNumber - 座位号
 * @param {string} rowNumber - 排号
 * @param {Object} seatImages - 预加载的图片对象
 */
function drawSeat(ctx, x, y, radius, status, seatNumber, rowNumber, seatImages) {
    const img = seatImages[status];

    if (img) {
        // 使用 drawImage 绘制贴图，坐标需要调整为左上角
        // 以 (x, y) 为中心进行绘制
        ctx.drawImage(img, x - radius, y - radius, radius * 2, radius * 2);
    } else {
        // 如果某个状态的图片加载失败或不存在，则回退到绘制灰色圆形
        ctx.fillStyle = 'gray';
        ctx.beginPath();
        ctx.arc(x, y, radius, 0, Math.PI * 2);
        ctx.fill();
    }

    // 绘制座位号和排号
    ctx.fillStyle = 'white';
    ctx.font = '10px Arial';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(`${rowNumber}-${seatNumber}`, x, y);
}

/**
 * 核心函数：绘制整个影厅的座位布局
 * @param {Array<Object>} seatsArray - 座位对象数组
 * @param {Object} seatImages - 预加载的图片对象
 * @param {string} [layoutType='arc'] - 布局类型 ('arc' 或 'parallel')
 */
function drawCinema(seatsArray, seatImages, layoutType = 'arc') {
    const canvas = document.getElementById('cinema-canvas');
    if (!canvas.getContext) {
        console.error('浏览器不支持Canvas');
        return;
    }
    const ctx = canvas.getContext('2d');

    // 清空画布
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // --- 绘制屏幕 ---
    ctx.fillStyle = '#2c2c2c'; // 深灰色屏幕
    ctx.fillRect(canvas.width * 0.1, 10, canvas.width * 0.8, 30);

    // 屏幕文字
    ctx.fillStyle = 'white';
    ctx.font = '16px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('屏幕', canvas.width / 2, 30);

    // --- 绘制中央过道虚线 ---
    ctx.save(); // 保存当前绘图状态
    ctx.strokeStyle = 'grey';
    ctx.lineWidth = 1;
    ctx.setLineDash([8, 4]); // 8px的线段，4px的间隔
    ctx.beginPath();
    ctx.moveTo(canvas.width / 2, 50); // 从屏幕下方开始
    ctx.lineTo(canvas.width / 2, canvas.height - 20); // 延伸到底部
    ctx.stroke();
    ctx.restore(); // 恢复绘图状态，以免影响后续绘制

    // --- 核心绘图逻辑 ---
    // TODO: 在这里实现弧形布局的计算逻辑
    // 您需要根据传入的 seatsArray (或其行列数) 来计算每个座位的坐标

    const totalRows = Math.max(...seatsArray.map(s => s.row));
    const totalCols = Math.max(...seatsArray.map(s => s.col));
    const seatRadius = 15; // 座位半径 (可参数化)
    const rowSpacing = 40; // 行间距 (可参数化)
    const colSpacing = 10; // 列间距 (仅用于平行布局)
    const arcRadius = 600; // 弧形布局的基准半径 (可参数化)
    const circleCenter = -400;  // 圆心位置，调整为与弧形布局一致

    // --- 动态计算中心区域 ---
    const totalSeats = seatsArray.length;
    const targetCenterCount = Math.floor(totalSeats * 0.2); // 目标数量为总数的20%

    // 计算中心区域的行数和列数，使其形状与影厅比例相似
    const layoutRatio = Math.sqrt(targetCenterCount / totalSeats);
    const numCenterCols = Math.ceil(totalCols * layoutRatio);
    const numCenterRows = Math.ceil(targetCenterCount / numCenterCols);

    // 计算中心区域的起始和结束行/列
    const middleRow = Math.ceil(totalRows / 2);
    const middleCol = Math.ceil(totalCols / 2);
    const centerRowsStart = middleRow - Math.floor(numCenterRows / 2);
    const centerRowsEnd = centerRowsStart + numCenterRows - 1;
    const centerColsStart = middleCol - Math.floor(numCenterCols / 2);
    const centerColsEnd = centerColsStart + numCenterCols - 1;

    const centerSeatsCoords = []; // 存储中心座位的坐标

    seatsArray.forEach(seat => {
        let x, y;

        // 根据布局类型计算坐标
        if (layoutType === 'parallel') {
            // --- 平行布局计算 ---
            const seatWidth = seatRadius * 2;
            const totalWidth = totalCols * (seatWidth + colSpacing) - colSpacing;
            const xOffset = (canvas.width - totalWidth) / 2;
            const yOffset = 80; // 顶部留白，为屏幕留出空间

            x = xOffset + (seat.col - 1) * (seatWidth + colSpacing) + seatRadius;
            y = yOffset + (seat.row - 1) * rowSpacing + seatRadius;
        } else {
            // --- 弧形布局计算 (默认) ---
            const angle = (seat.col - totalCols / 2) * (Math.PI / 60); // 减小角度间隔，从PI/18改为PI/36
            const currentArcRadius = arcRadius + (seat.row - 1) * rowSpacing;
            x = canvas.width / 2 + currentArcRadius * Math.sin(angle);
            // 将圆心移动到画布上方，使第一排靠近屏幕位置
            y = circleCenter + currentArcRadius * Math.cos(angle);
        }

        // 检查是否为中心座位，并存储其坐标
        if (seat.row >= centerRowsStart && seat.row <= centerRowsEnd &&
            seat.col >= centerColsStart && seat.col <= centerColsEnd) {
            centerSeatsCoords.push({ x, y });
        }

        drawSeat(ctx, x, y, seatRadius, seat.status, seat.col, seat.row, seatImages);
    });

    // 在所有座位绘制完毕后，绘制中心区域的标识
    if (centerSeatsCoords.length > 0) {
        if (layoutType === 'parallel') {
            drawCenterZone(ctx, centerSeatsCoords, seatRadius);
        } else {
            // 弧形布局时绘制扇形区域
            drawCenterSector(ctx, centerRowsStart, centerRowsEnd, centerColsStart, centerColsEnd,
                totalCols, arcRadius, rowSpacing, circleCenter);
        }
    }

    console.log('影厅绘制完毕');
}

/**
 * 在中心座位周围绘制一个橙色虚线框
 * @param {CanvasRenderingContext2D} ctx - Canvas 2D 上下文
 * @param {Array<Object>} coords - 中心座位坐标的数组
 * @param {number} seatRadius - 座位的半径
 */
function drawCenterZone(ctx, coords, seatRadius) {
    // 计算包围盒
    const minX = Math.min(...coords.map(c => c.x));
    const minY = Math.min(...coords.map(c => c.y));
    const maxX = Math.max(...coords.map(c => c.x));
    const maxY = Math.max(...coords.map(c => c.y));

    const padding = 5; // 虚线框与座位之间的间距

    // 设置虚线框样式
    ctx.strokeStyle = 'orange';
    ctx.lineWidth = 2;
    ctx.setLineDash([10, 5]); // 10px的线段，5px的间隔

    // 绘制矩形
    ctx.strokeRect(
        minX - seatRadius - padding,
        minY - seatRadius - padding,
        (maxX - minX) + (seatRadius * 2) + (padding * 2),
        (maxY - minY) + (seatRadius * 2) + (padding * 2)
    );

    // 恢复为实线，以免影响后续绘制
    ctx.setLineDash([]);
}

/**
 * 为弧形布局绘制扇形中心区域
 * @param {CanvasRenderingContext2D} ctx - Canvas 2D 上下文
 * @param {number} centerRowsStart - 中心区域起始行
 * @param {number} centerRowsEnd - 中心区域结束行
 * @param {number} centerColsStart - 中心区域起始列
 * @param {number} centerColsEnd - 中心区域结束列
 * @param {number} totalCols - 总列数
 * @param {number} arcRadius - 弧形布局基准半径
 * @param {number} rowSpacing - 行间距
 * @param {number} circleCenter - 圆心Y坐标
 */
function drawCenterSector(ctx, centerRowsStart, centerRowsEnd, centerColsStart, centerColsEnd,
    totalCols, arcRadius, rowSpacing, circleCenter) {
    const centerX = ctx.canvas.width / 2;
    const centerY = circleCenter; // 使用传入的圆心位置参数

    // 计算扇形的角度范围 - 注意角度需要调整，因为Canvas的0角度是水平向右，我们需要垂直向下
    const baseStartAngle = (centerColsStart - 0.5 - totalCols / 2) * (Math.PI / 60);
    const baseEndAngle = (centerColsEnd + 0.5 - totalCols / 2) * (Math.PI / 60);

    // 调整角度，使其从垂直向下开始（Math.PI/2 是垂直向下）
    // 弧线需要调整角度，但径向线使用原始角度
    const startAngleForArc = Math.PI / 2 + baseStartAngle;
    const endAngleForArc = Math.PI / 2 + baseEndAngle;

    // 计算扇形的半径范围
    const innerRadius = arcRadius + (centerRowsStart - 1) * rowSpacing - 20;
    const outerRadius = arcRadius + centerRowsEnd * rowSpacing + 20;

    // 设置扇形样式
    ctx.save();
    ctx.strokeStyle = 'orange';
    ctx.lineWidth = 2;
    ctx.setLineDash([10, 5]); // 虚线样式

    // 1. 绘制内弧
    ctx.beginPath();
    ctx.arc(centerX, centerY, innerRadius, startAngleForArc, endAngleForArc);
    ctx.stroke();

    // 2. 绘制外弧
    ctx.beginPath();
    ctx.arc(centerX, centerY, outerRadius, startAngleForArc, endAngleForArc);
    ctx.stroke();

    // 3. 绘制左侧径向线
    ctx.beginPath();
    // 使用与座位计算相同的公式
    const leftInnerX = centerX + innerRadius * Math.sin(baseStartAngle);
    const leftInnerY = centerY + innerRadius * Math.cos(baseStartAngle);
    const leftOuterX = centerX + outerRadius * Math.sin(baseStartAngle);
    const leftOuterY = centerY + outerRadius * Math.cos(baseStartAngle);

    console.log('左径向线坐标（修正后）:', {
        leftInnerX, leftInnerY, leftOuterX, leftOuterY,
        baseStartAngle: baseStartAngle * 180 / Math.PI
    });

    ctx.moveTo(leftInnerX, leftInnerY);
    ctx.lineTo(leftOuterX, leftOuterY);
    ctx.stroke();

    // 4. 绘制右侧径向线
    ctx.beginPath();
    const rightInnerX = centerX + innerRadius * Math.sin(baseEndAngle);
    const rightInnerY = centerY + innerRadius * Math.cos(baseEndAngle);
    const rightOuterX = centerX + outerRadius * Math.sin(baseEndAngle);
    const rightOuterY = centerY + outerRadius * Math.cos(baseEndAngle);

    console.log('右径向线坐标（修正后）:', {
        rightInnerX, rightInnerY, rightOuterX, rightOuterY,
        baseEndAngle: baseEndAngle * 180 / Math.PI
    });

    ctx.moveTo(rightInnerX, rightInnerY);
    ctx.lineTo(rightOuterX, rightOuterY);
    ctx.stroke();

    ctx.restore();
}

/**
 * 预加载所有座位状态的图片
 * @returns {Promise<Object>} - 一个Promise，解析后返回一个包含已加载图片的对象
 */
function preloadSeatImages() {
    const imageSources = {
        available: '../img/available.PNG',
        selected: '../img/selected.PNG',
        sold: '../img/sold.PNG'
    };

    const promises = Object.entries(imageSources).map(([status, src]) => {
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
        console.log('所有座位图片预加载完毕');
        return images;
    });
}


// --- 开发初期使用的虚拟数据 ---
const virtualSeatsData = [];
const rows = 10;
const cols = 20;
for (let i = 1; i <= rows; i++) {
    for (let j = 1; j <= cols; j++) {
        let status = 'available';
        if (Math.random() > 0.8) {
            status = 'sold';
        }
        virtualSeatsData.push({ row: i, col: j, status: status });
    }
}


// --- 页面加载后执行 ---
window.onload = () => {
    const canvas = document.getElementById('cinema-canvas');
    const toggleBtn = document.getElementById('toggle-layout-btn');

    if (canvas && toggleBtn) {
        canvas.width = 1200;
        canvas.height = 800;

        let currentLayout = 'arc'; // 初始布局为弧形
        let loadedImages = {}; // 用于存储加载后的图片

        // 预加载图片
        preloadSeatImages().then(seatImages => {
            loadedImages = seatImages;
            // 初始绘制
            drawCinema(virtualSeatsData, loadedImages, currentLayout);
        }).catch(error => {
            console.error("图片预加载失败:", error);
            // 即使失败，也进行一次初始绘制
            drawCinema(virtualSeatsData, {}, currentLayout);
        });

        // 为按钮添加点击事件
        toggleBtn.addEventListener('click', () => {
            // 切换布局模式
            currentLayout = (currentLayout === 'arc') ? 'parallel' : 'arc';
            console.log(`布局已切换为: ${currentLayout}`);
            // 使用新的布局重新绘制
            drawCinema(virtualSeatsData, loadedImages, currentLayout);
        });

    } else {
        if (!canvas) console.error('未找到ID为 cinema-canvas 的 canvas 元素');
        if (!toggleBtn) console.error('未找到ID为 toggle-layout-btn 的按钮元素');
    }
};

// ========================= 模块导出 =========================

// 通过在 window 对象上挂载，让其他模块可以访问 Canvas 渲染相关的函数
window.CanvasRenderer = {
    drawSeat,          // 绘制单个座位
    drawCinema,        // 绘制整个影厅布局
    drawCenterZone,    // 绘制中心区域虚线框
    drawCenterSector,  // 绘制弧形布局的中心扇形区域
    preloadSeatImages  // 预加载座位状态图片
};

console.log('电影院Canvas渲染模块(canvas.js)已加载');
