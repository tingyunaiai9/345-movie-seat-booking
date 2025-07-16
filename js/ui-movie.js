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

// 电影信息常量
const movieInfo = {
    'cat': {
        id: 'cat',
        title: '罗小黑战记',
        time: '时间待定',
        price: '45',
        image: './img/movie_cat.jpg'
    },
    'girl': {
        id: 'girl',
        title: '蓦然回首',
        time: '时间待定',
        price: '50',
        image: './img/movie_girl.jpg'
    },
    'love': {
        id: 'love',
        title: '情书',
        time: '时间待定',
        price: '55',
        image: './img/movie_love.jpg'
    }
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
 * - 设置电影时间显示
 */
function initializeMovieSelector() {
    console.log('初始化电影选择器...');
    
    // 设置电影时间显示
    setMovieShowTimes();
    
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
 * 设置电影放映时间显示
 * 从本模块获取各电影的放映时间并更新到页面上
 */
function setMovieShowTimes() {
    console.log('设置电影放映时间...');
    
    // 电影ID到放映时间的映射
    const movieIds = ['cat', 'girl', 'love'];
    
    movieIds.forEach(movieId => {
        const movieElement = document.querySelector(`.movie-item[data-movie="${movieId}"]`);
        if (movieElement) {
            const timeElement = movieElement.querySelector('.movie-time');
            if (timeElement) {
                // 从本模块获取电影放映时间
                const showTime = getMovieShowTime(movieId);
                if (showTime) {
                    // 格式化时间显示
                    const timeString = formatMovieShowTime(showTime);
                    timeElement.textContent = timeString;
                    // 更新常量中的时间信息
                    movieInfo[movieId].time = timeString;
                    console.log(`设置电影 ${movieId} 的放映时间: ${timeString}`);
                } else {
                    timeElement.textContent = '时间待定';
                    movieInfo[movieId].time = '时间待定';
                    console.warn(`无法获取电影 ${movieId} 的放映时间`);
                }
            } else {
                console.warn(`未找到电影 ${movieId} 的时间显示元素`);
            }
        } else {
            console.warn(`未找到电影 ${movieId} 的DOM元素`);
        }
    });
}

/**
 * 获取指定电影的放映时间
 * @param {string} movieId - 电影ID
 * @returns {Date|null} 电影放映时间
 */
function getMovieShowTime(movieId) {
    const movieTimeMapping = {
        'cat': '10:00',      // 罗小黑战记 - 10:00
        'girl': '12:00',     // 蓦然回首 - 12:00
        'love': '18:00'      // 情书 - 18:00
    };

    if (movieId && movieTimeMapping[movieId]) {
        // 创建明天的指定时间
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1); // 设置为明天

        const [hours, minutes] = movieTimeMapping[movieId].split(':');
        tomorrow.setHours(parseInt(hours, 10), parseInt(minutes, 10), 0, 0);

        return tomorrow;
    }

    return null;
}

/**
 * 格式化电影放映时间显示
 * @param {Date} showTime - 电影放映时间
 * @returns {string} 格式化的时间字符串
 */
function formatMovieShowTime(showTime) {
    if (!(showTime instanceof Date) || isNaN(showTime.getTime())) {
        return '时间待定';
    }
    
    // 格式化为 "2025-7-16 12:00" 的格式
    const year = showTime.getFullYear();
    const month = showTime.getMonth() + 1; // getMonth() 返回 0-11，需要加1
    const day = showTime.getDate();
    
    // 格式化时间部分 (HH:MM)
    const timeStr = showTime.toLocaleTimeString('zh-CN', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: false
    });
    
    return `${year}-${month}-${day} ${timeStr}`;
}

/**
 * 更新电影时间显示
 * 当配置改变时重新设置时间显示
 */
function updateMovieShowTimes() {
    setMovieShowTimes();
}

/**
 * 获取电影信息
 * @param {string} movieId - 电影ID
 * @returns {Object|null} - 电影信息对象，如果找不到则返回null
 */
function getMovieInfo(movieId) {
    return movieInfo[movieId] || null;
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

    // 获取电影ID
    const movieId = movieElement.dataset.movie;
    
    // 从常量中获取基本电影信息
    let movieData = getMovieInfo(movieId);
    
    if (!movieData) {
        // 如果常量中没有，则从DOM元素提取（兜底方案）
        const rawPrice = movieElement.querySelector('.movie-price').textContent;
        const priceNumber = rawPrice.match(/\d+/) ? rawPrice.match(/\d+/)[0] : '0';

        movieData = {
            id: movieId,
            title: movieElement.querySelector('h3').textContent,
            time: movieElement.querySelector('.movie-time').textContent,
            price: priceNumber,
            image: movieElement.querySelector('img').src
        };
    } else {
        // 使用常量中的信息，但更新实时的时间和价格
        const timeElement = movieElement.querySelector('.movie-time');
        const priceElement = movieElement.querySelector('.movie-price');
        
        if (timeElement) {
            movieData.time = timeElement.textContent;
        }
        
        if (priceElement) {
            const rawPrice = priceElement.textContent;
            const priceNumber = rawPrice.match(/\d+/) ? rawPrice.match(/\d+/)[0] : movieData.price;
            movieData.price = priceNumber;
        }
        
        // 获取实际的图片路径
        const imgElement = movieElement.querySelector('img');
        if (imgElement) {
            movieData.image = imgElement.src;
        }
    }

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
        getSelectedMovie,        // 获取选中的电影
        getMovieInfo,            // 获取电影信息
        getMovieShowTime,        // 获取电影放映时间
        setMovieShowTimes,       // 设置电影放映时间
        updateMovieShowTimes,    // 更新电影时间显示
        formatMovieShowTime      // 格式化电影放映时间
    };
}

// 页面加载完成后自动初始化
document.addEventListener('DOMContentLoaded', function () {
    console.log('页面加载完成，初始化电影选择器');
    // 延迟初始化，确保主模块已加载
    setTimeout(() => {
        initializeMovieSelector();
    }, 100);
});