/**
 * 电影选择器 - 处理电影选择的交互逻辑
 * 角色四：前端UI与总成工程师的功能模块
 */
class MovieSelector {
    constructor() {
        this.selectedMovie = null;
        this.initializeEventListeners();
        this.initializeDefaultSelection();
    }

    /**
     * 初始化事件监听器
     */
    initializeEventListeners() {
        // 获取所有电影项
        const movieItems = document.querySelectorAll('.movie-item');
        
        movieItems.forEach(item => {
            item.addEventListener('click', (e) => {
                this.selectMovie(item);
            });
        });
    }

    /**
     * 初始化默认选择
     */
    initializeDefaultSelection() {
        const defaultMovie = document.querySelector('.movie-item.active');
        if (defaultMovie) {
            this.selectedMovie = {
                id: defaultMovie.dataset.movie,
                title: defaultMovie.querySelector('h3').textContent,
                time: defaultMovie.querySelector('.movie-time').textContent,
                price: defaultMovie.querySelector('.movie-price').textContent,
                image: defaultMovie.querySelector('img').src
            };
        }
    }

    /**
     * 选择电影
     * @param {HTMLElement} movieElement - 被点击的电影元素
     */
    selectMovie(movieElement) {
        // 移除所有电影的选中状态
        const allMovieItems = document.querySelectorAll('.movie-item');
        allMovieItems.forEach(item => {
            item.classList.remove('active');
        });

        // 为当前点击的电影添加选中状态
        movieElement.classList.add('active');

        // 获取电影信息
        const movieData = {
            id: movieElement.dataset.movie,
            title: movieElement.querySelector('h3').textContent,
            time: movieElement.querySelector('.movie-time').textContent,
            price: movieElement.querySelector('.movie-price').textContent,
            image: movieElement.querySelector('img').src
        };

        // 更新选中的电影
        this.selectedMovie = movieData;

        // 触发电影选择事件
        this.onMovieSelected(movieData);

        console.log('已选择电影:', movieData);
    }

    /**
     * 电影选择后的回调函数
     * @param {Object} movieData - 选中的电影数据
     */
    onMovieSelected(movieData) {
        // 可以在这里添加选择电影后的逻辑
        // 比如更新其他页面的电影信息等
        
        // 更新支付页面的电影信息
        this.updatePaymentMovieInfo(movieData);
        
        // 触发自定义事件
        const event = new CustomEvent('movieSelected', {
            detail: movieData
        });
        document.dispatchEvent(event);
    }

    /**
     * 更新支付页面的电影信息
     * @param {Object} movieData - 电影数据
     */
    updatePaymentMovieInfo(movieData) {
        // 更新支付页面的电影标题
        const paymentMovieTitle = document.getElementById('payment-movie-title');
        if (paymentMovieTitle) {
            paymentMovieTitle.textContent = movieData.title;
        }

        // 更新支付页面的电影时间
        const paymentMovieTime = document.getElementById('payment-movie-time');
        if (paymentMovieTime) {
            paymentMovieTime.textContent = movieData.time;
        }

        // 更新支付页面的电影海报
        const paymentMoviePoster = document.querySelector('.payment-panel .movie-poster img');
        if (paymentMoviePoster) {
            paymentMoviePoster.src = movieData.image;
            paymentMoviePoster.alt = movieData.title;
        }

        // 更新确认页面的电影信息
        const confirmMovieTitle = document.getElementById('confirm-movie-title');
        if (confirmMovieTitle) {
            confirmMovieTitle.textContent = movieData.title;
        }

        const confirmMovieTime = document.getElementById('confirm-movie-time');
        if (confirmMovieTime) {
            confirmMovieTime.textContent = movieData.time;
        }
    }

    /**
     * 获取当前选中的电影
     * @returns {Object|null} 当前选中的电影数据
     */
    getSelectedMovie() {
        return this.selectedMovie;
    }

    /**
     * 通过ID选择电影
     * @param {string} movieId - 电影ID
     */
    selectMovieById(movieId) {
        const movieElement = document.querySelector(`[data-movie="${movieId}"]`);
        if (movieElement) {
            this.selectMovie(movieElement);
        }
    }

    /**
     * 验证是否已选择电影
     * @returns {boolean} 是否已选择电影
     */
    hasSelectedMovie() {
        return this.selectedMovie !== null;
    }
}

// 全局初始化
document.addEventListener('DOMContentLoaded', () => {
    window.movieSelector = new MovieSelector();
    console.log('电影选择器已初始化');
});