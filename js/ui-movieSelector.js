/**
 * 电影选择器 - 处理电影选择的交互逻辑
 */

// ========================= 常量定义 =========================
const movieBackgrounds = {
    'cat': './img/background_cat.webp',      // 罗小黑战记 -> 猫咪背景
    'girl': './img/background_girl.webp',   // 蓦然回首 -> 女孩背景
    'love': './img/background_love.webp'    // 情书 -> 爱情背景
};

// ========================= 全局状态变量 =========================
let movieSelectorState = {
    selectedMovie: null
};

// ========================= 初始化函数 =========================

/**
 * 初始化电影选择器
 */
function initializeMovieSelector() {
    console.log('初始化电影选择器...');
    bindMovieSelection();
    restoreMovieBackgroundIfNeeded();
}

/**
 * 如果不是配置页面且有保存的电影选择，则恢复背景
 */
function restoreMovieBackgroundIfNeeded() {
    const isConfigPage = document.querySelector('#config-view.active');
    if (isConfigPage) {
        console.log('当前在配置页面，保持田野背景');
        return;
    }

    const selectedMovieId = localStorage.getItem('selectedMovie');
    if (selectedMovieId) {
        applyBackgroundById(selectedMovieId);
        console.log('恢复电影背景:', selectedMovieId);
    }
}

/**
 * 根据电影ID应用背景
 * @param {string} movieId - 电影ID
 */
function applyBackgroundById(movieId) {
    const backgroundImage = movieBackgrounds[movieId] || movieBackgrounds.cat;

    document.body.style.background = `url('${backgroundImage}') no-repeat center center fixed`;
    document.body.style.backgroundSize = 'cover';

    updateBodyClass(movieId);

    console.log('背景已应用:', backgroundImage);
}

/**
 * 恢复配置页面的田野背景
 */
function restoreConfigBackground() {
    document.body.style.background = `url('./img/background-field.png') no-repeat center center fixed`;
    document.body.style.backgroundSize = 'cover';

    document.body.className = document.body.className.replace(/movie-\w+/g, '');

    console.log('已恢复配置页面背景');
}

/**
 * 绑定电影选择事件
 */
function bindMovieSelection() {
    const movieItems = document.querySelectorAll('.movie-item');
    movieItems.forEach(item => {
        item.addEventListener('click', () => {
            selectMovie(item);
        });
    });
}

/**
 * 选择电影
 * @param {HTMLElement} movieElement - 电影元素
 */
function selectMovie(movieElement) {
    document.querySelectorAll('.movie-item').forEach(item => {
        item.classList.remove('active');
    });

    movieElement.classList.add('active');

    const rawPrice = movieElement.querySelector('.movie-price').textContent;
    const priceNumber = rawPrice.match(/\d+/) ? rawPrice.match(/\d+/)[0] : '0';

    const movieData = {
        id: movieElement.dataset.movie,
        title: movieElement.querySelector('h3').textContent,
        time: movieElement.querySelector('.movie-time').textContent,
        price: priceNumber,
        image: movieElement.querySelector('img').src
    };

    movieSelectorState.selectedMovie = movieData;

    changeBackgroundMovie(movieData);

    localStorage.setItem('selectedMovie', movieData.id);
    localStorage.setItem('selectedMovieInfo', JSON.stringify(movieData));

    notifyMovieSelection(movieData);
}

/**
 * 更改背景为选中电影的背景
 * @param {Object} movieData - 电影数据
 */
function changeBackgroundMovie(movieData) {
    applyBackgroundById(movieData.id);
}

/**
 * 更新body的类名
 * @param {string} movieId - 电影ID
 */
function updateBodyClass(movieId) {
    document.body.className = document.body.className.replace(/movie-\w+/g, '');
    document.body.classList.add(`movie-${movieId}`);
}

/**
 * 通知其他组件电影选择事件
 * @param {Object} movieData - 电影数据
 */
function notifyMovieSelection(movieData) {
    const event = new CustomEvent('movieSelected', {
        detail: movieData
    });
    document.dispatchEvent(event);
}

/**
 * 获取选中的电影
 * @returns {Object} - 选中的电影数据
 */
function getSelectedMovie() {
    return movieSelectorState.selectedMovie;
}

// ========================= 模块导出 =========================

// 在浏览器环境中，将函数暴露到全局
if (typeof window !== 'undefined') {
    window.UIMovieSelector = {
        initializeMovieSelector,
        restoreMovieBackgroundIfNeeded,
        applyBackgroundById,
        restoreConfigBackground,
        selectMovie,
        getSelectedMovie
    };
}

// 页面加载完成后自动初始化
document.addEventListener('DOMContentLoaded', function () {
    console.log('页面加载完成，初始化电影选择器');
    initializeMovieSelector();
});