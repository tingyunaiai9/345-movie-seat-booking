/**
 * 电影选择器 - 处理电影选择的交互逻辑
 */
class MovieSelector {
    constructor() {
        this.selectedMovie = null;
        this.init();
    }

    init() {
        this.bindMovieSelection();
        this.setDefaultSelection();
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
        
        // 通知其他组件更新
        this.notifyMovieSelection(movieData);
    }

    notifyMovieSelection(movieData) {
        // 触发自定义事件
        const event = new CustomEvent('movieSelected', {
            detail: movieData
        });
        document.dispatchEvent(event);
    }

    setDefaultSelection() {
        const defaultMovie = document.querySelector('.movie-item.active');
        if (defaultMovie) {
            this.selectMovie(defaultMovie);
        }
    }

    getSelectedMovie() {
        return this.selectedMovie;
    }
}

// 初始化电影选择器
const movieSelector = new MovieSelector();

// 监听电影选择事件
document.addEventListener('movieSelected', (event) => {
    console.log('电影选择事件:', event.detail);
    // 这里可以通知UI模块更新支付页面
    if (window.CinemaUI && window.CinemaUI.updatePaymentPageData) {
        window.CinemaUI.updatePaymentPageData();
    }
});