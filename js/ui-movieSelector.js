/**
 * 电影选择器 - 处理电影选择的交互逻辑
 * 负责电影选择、背景切换以及状态管理
 */

// ========================= 常量定义 =========================
const movieBackgrounds = {
    'cat': './img/background_cat.webp',      // 罗小黑战记 -> 猫咪背景
    'girl': './img/background_girl.webp',   // 蓦然回首 -> 女孩背景
    'love': './img/background_love.webp'    // 情书 -> 爱情背景
};

// ========================= 全局状态变量 =========================
let movieSelectorState = {
    selectedMovie: null // 当前选中的电影数据
};

// ========================= 初始化函数 =========================

/**
 * 初始化电影选择器
 * - 绑定电影选择事件
 * - 恢复背景（如果有保存的电影选择）
 */
function initializeMovieSelector() {
    console.log('初始化电影选择器...');
    
    // 获取所有电影元素并绑定点击事件
    const movieItems = document.querySelectorAll('.movie-item');
    movieItems.forEach(item => {
        item.addEventListener('click', () => {
            selectMovie(item); // 点击电影时调用选择电影函数
        });
    });

    // 检查当前是否在配置页面
    const isConfigPage = document.querySelector('#config-view.active');
    if (!isConfigPage) {
        // 如果不是配置页面，尝试恢复之前选中的电影背景
        const selectedMovieId = localStorage.getItem('selectedMovie');
        if (selectedMovieId) {
            const backgroundImage = movieBackgrounds[selectedMovieId] || movieBackgrounds.cat;

            // 设置页面背景为选中电影的背景
            document.body.style.background = `url('${backgroundImage}') no-repeat center center fixed`;
            document.body.style.backgroundSize = 'cover';

            // 更新页面的类名以反映选中的电影
            document.body.className = document.body.className.replace(/movie-\w+/g, '');
            document.body.classList.add(`movie-${selectedMovieId}`);

            console.log('恢复电影背景:', selectedMovieId);
        }
    } else {
        // 如果是配置页面，保持默认田野背景
        console.log('当前在配置页面，保持田野背景');
    }
}

/**
 * 选择电影
 * @param {HTMLElement} movieElement - 被点击的电影元素
 * - 更新选中状态
 * - 切换背景
 * - 保存选中电影到 localStorage
 * - 触发电影选择事件
 */
function selectMovie(movieElement) {
    // 移除所有电影元素的选中状态
    document.querySelectorAll('.movie-item').forEach(item => {
        item.classList.remove('active');
    });

    // 设置当前点击的电影为选中状态
    movieElement.classList.add('active');

    // 提取电影数据
    const rawPrice = movieElement.querySelector('.movie-price').textContent;
    const priceNumber = rawPrice.match(/\d+/) ? rawPrice.match(/\d+/)[0] : '0';

    const movieData = {
        id: movieElement.dataset.movie, // 电影ID
        title: movieElement.querySelector('h3').textContent, // 电影标题
        time: movieElement.querySelector('.movie-time').textContent, // 电影时间
        price: priceNumber, // 电影票价
        image: movieElement.querySelector('img').src // 电影图片
    };

    // 更新全局状态
    movieSelectorState.selectedMovie = movieData;

    // 切换页面背景为选中电影的背景
    const backgroundImage = movieBackgrounds[movieData.id] || movieBackgrounds.cat;
    document.body.style.background = `url('${backgroundImage}') no-repeat center center fixed`;
    document.body.style.backgroundSize = 'cover';

    // 更新页面的类名以反映选中的电影
    document.body.className = document.body.className.replace(/movie-\w+/g, '');
    document.body.classList.add(`movie-${movieData.id}`);

    // 保存选中电影到 localStorage
    localStorage.setItem('selectedMovie', movieData.id);
    localStorage.setItem('selectedMovieInfo', JSON.stringify(movieData));

    // 触发自定义事件，通知其他模块电影已被选中
    const event = new CustomEvent('movieSelected', {
        detail: movieData
    });
    document.dispatchEvent(event);

    console.log('背景已应用:', backgroundImage);
    console.log('选择了电影:', movieData);
}

/**
 * 获取选中的电影
 * @returns {Object} - 当前选中的电影数据
 */
function getSelectedMovie() {
    return movieSelectorState.selectedMovie;
}

// ========================= 模块导出 =========================

// 在浏览器环境中，将函数暴露到全局
if (typeof window !== 'undefined') {
    window.UIMovieSelector = {
        initializeMovieSelector, // 初始化电影选择器
        selectMovie,             // 选择电影
        getSelectedMovie         // 获取选中的电影
    };
}

// 页面加载完成后自动初始化
document.addEventListener('DOMContentLoaded', function () {
    console.log('页面加载完成，初始化电影选择器');
    initializeMovieSelector();
});