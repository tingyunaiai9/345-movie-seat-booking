/**
 * 电影选择器 - 处理电影选择的交互逻辑
 */
const movieBackgrounds = {
    'cat': './img/background_cat.webp',      // 罗小黑战记 -> 猫咪背景
    'girl': './img/background_girl.webp',   // 蓦然回首 -> 女孩背景
    'love': './img/background_love.webp'    // 情书 -> 爱情背景
};

class MovieSelector {
    constructor() {
        this.selectedMovie = null;
        this.init();
    }

    init() {
        this.bindMovieSelection();
        // 移除自动应用默认背景的逻辑
        // this.applyDefaultBackground();
        
        // 只在非配置页面时恢复电影背景
        this.restoreMovieBackgroundIfNeeded();
    }

    /**
     * 如果不是配置页面且有保存的电影选择，则恢复背景
     */
    restoreMovieBackgroundIfNeeded() {
        // 检查当前是否在配置页面
        const isConfigPage = document.querySelector('#config-view.active');
        if (isConfigPage) {
            console.log('当前在配置页面，保持田野背景');
            return;
        }

        // 如果不在配置页面，检查是否有保存的电影选择
        const selectedMovieId = localStorage.getItem('selectedMovie');
        if (selectedMovieId) {
            this.applyBackgroundById(selectedMovieId);
            console.log('恢复电影背景:', selectedMovieId);
        }
    }

    /**
     * 根据电影ID应用背景
     * @param {string} movieId - 电影ID
     */
    applyBackgroundById(movieId) {
        const backgroundImage = movieBackgrounds[movieId] || movieBackgrounds.cat;
        
        // 应用背景
        document.body.style.background = `url('${backgroundImage}') no-repeat center center fixed`;
        document.body.style.backgroundSize = 'cover';
        
        // 更新body类名
        this.updateBodyClass(movieId);
        
        console.log('背景已应用:', backgroundImage);
    }

    /**
     * 恢复配置页面的田野背景
     */
    restoreConfigBackground() {
        document.body.style.background = `url('./img/background-field.png') no-repeat center center fixed`;
        document.body.style.backgroundSize = 'cover';
        
        // 移除电影相关的CSS类
        document.body.className = document.body.className.replace(/movie-\w+/g, '');
        
        console.log('已恢复配置页面背景');
    }

    bindMovieSelection() {
        const movieItems = document.querySelectorAll('.movie-item');
        movieItems.forEach(item => {
            item.addEventListener('click', (e) => {
                this.selectMovie(item);
            });
        });
    }

    selectMovie(movieElement) {
        // 移除所有active类
        document.querySelectorAll('.movie-item').forEach(item => {
            item.classList.remove('active');
        });
        
        // 添加active类到选中的电影
        movieElement.classList.add('active');

        // 提取电影数据
        const movieData = {
            id: movieElement.dataset.movie,
            title: movieElement.querySelector('h3').textContent,
            time: movieElement.querySelector('.movie-time').textContent,
            price: movieElement.querySelector('.movie-price').textContent,
            image: movieElement.querySelector('img').src
        };
        
        this.selectedMovie = movieData;
        console.log('选中电影:', movieData);

        // 更改背景
        this.changeBackgroundMovie(movieData);
        
        // 保存到localStorage
        localStorage.setItem('selectedMovie', movieData.id);
        
        // 通知其他组件更新
        this.notifyMovieSelection(movieData);
    }

    changeBackgroundMovie(movieData) {
        this.applyBackgroundById(movieData.id);
    }

    updateBodyClass(movieId) {
        // 移除现有的电影类名
        document.body.className = document.body.className.replace(/movie-\w+/g, '');
        
        // 添加新的电影类名
        document.body.classList.add(`movie-${movieId}`);
    }

    notifyMovieSelection(movieData) {
        // 触发自定义事件
        const event = new CustomEvent('movieSelected', {
            detail: movieData
        });
        document.dispatchEvent(event);
    }

    getSelectedMovie() {
        return this.selectedMovie;
    }
}

// 页面加载完成后初始化
document.addEventListener('DOMContentLoaded', function() {
    console.log('初始化电影选择器...');
    window.movieSelector = new MovieSelector();
});