<template>
  <div class="landscape-container">
    <!-- 横屏提示，仅在竖屏时显示 -->
    <div
      class="rotation-prompt"
      v-if="!isLandscape"
    >
      <i class="fas fa-mobile-alt fa-rotate-90"></i>
      <p>请旋转设备至横屏模式</p>
    </div>

    <!-- 主内容区域，仅在横屏时显示 -->
    <div class="content-wrapper" v-else>
      <!-- 控制栏 -->
      <div class="control-bar">
        <div class="nav-buttons">
          <button
            class="exit-btn"
            @click="exitPage"
          >
            <i class="fas fa-sign-out-alt"></i> 退出
          </button>
          <button
            class="back-btn"
            @click="goBack"
            :disabled="!canGoBack || isLoading"
          >
            <i class="fas fa-arrow-left"></i> 返回
          </button>
          <h1>横屏展示</h1>
        </div>
        <div class="control-buttons">
          <button
            class="refresh-btn"
            @click="refreshIframe"
            :disabled="isLoading"
          >
            <i class="fas fa-sync-alt"></i> 刷新
          </button>
        </div>
      </div>

      <!-- 增强的加载提示 - 针对wasm加载时间长的情况 -->
      <div class="loading-overlay" v-if="isLoading">
        <div class="loading-spinner">
          <i class="fas fa-circle-notch fa-spin fa-3x"></i>
          <p class="loading-text">正在加载内容</p>
          <p class="loading-subtext">WASM资源加载可能需要几分钟时间，请耐心等待...</p>
          <div class="progress-bar" v-if="showProgress">
            <div class="progress" :style="{ width: progressPercent + '%' }"></div>
          </div>
        </div>
      </div>

      <!-- iframe容器 -->
      <div class="iframe-container">
        <iframe
          ref="targetIframe"
          :src="targetUrl"
          frameborder="0"
          class="target-iframe"
          @load="handleIframeLoad"
          @error="handleIframeError"
        ></iframe>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: 'LandscapeViewer',
  data() {
    return {
      targetUrl: 'http://192.168.235.147:5711',
      isLandscape: true,
      isLoading: true,
      canGoBack: false,
      showProgress: false, // 是否显示进度条
      progressPercent: 0, // 加载进度百分比
      orientationChangeHandler: null,
      historyCheckInterval: null,
      loadingInterval: null
    }
  },
  mounted() {
    this.checkOrientation();

    this.orientationChangeHandler = () => {
      this.checkOrientation();
    };

    window.addEventListener('resize', this.orientationChangeHandler);
    window.addEventListener('orientationchange', this.orientationChangeHandler);

    this.historyCheckInterval = setInterval(() => {
      this.checkIframeHistory();
    }, 1000);

    // 启动模拟进度更新（如果无法从iframe获取真实进度）
    this.startLoadingSimulation();
  },
  beforeUnmount() {
    window.removeEventListener('resize', this.orientationChangeHandler);
    window.removeEventListener('orientationchange', this.orientationChangeHandler);
    clearInterval(this.historyCheckInterval);
    clearInterval(this.loadingInterval);
  },
  methods: {
    checkOrientation() {
      const windowWidth = window.innerWidth;
      const windowHeight = window.innerHeight;
      this.isLandscape = windowWidth > windowHeight;
    },

    exitPage() {
      window.history.back();
    },

    goBack() {
      const iframe = this.$refs.targetIframe;
      if (iframe && this.canGoBack) {
        try {
          iframe.contentWindow.history.back();
          this.isLoading = true;
          this.startLoadingSimulation();
          setTimeout(() => this.checkIframeHistory(), 500);
        } catch (error) {
          console.log('无法访问iframe历史记录（跨域限制）');
          this.resetToHome();
        }
      }
    },

    refreshIframe() {
      const iframe = this.$refs.targetIframe;
      if (iframe) {
        this.isLoading = true;
        this.startLoadingSimulation();
        iframe.src = iframe.src;
      }
    },

    resetToHome() {
      const iframe = this.$refs.targetIframe;
      if (iframe) {
        this.isLoading = true;
        this.startLoadingSimulation();
        iframe.src = this.targetUrl;
      }
    },

    handleIframeLoad() {
      console.log('内容加载完成');
      this.isLoading = false;
      this.checkIframeHistory();
      clearInterval(this.loadingInterval);
    },

    handleIframeError() {
      console.error('内容加载失败');
      this.isLoading = false;
      clearInterval(this.loadingInterval);
      // 显示错误提示
      alert('加载失败，请尝试刷新页面');
    },

    checkIframeHistory() {
      const iframe = this.$refs.targetIframe;
      if (iframe) {
        try {
          this.canGoBack = iframe.contentWindow.history.length > 1;
        } catch (error) {
          console.log('无法检查iframe历史记录（跨域限制）');
          this.canGoBack = iframe.src !== this.targetUrl;
        }
      }
    },

    // 启动加载模拟（适用于无法获取真实进度的情况）
    startLoadingSimulation() {
      clearInterval(this.loadingInterval);
      this.progressPercent = 0;
      this.showProgress = true;

      // 模拟进度更新，前80%缓慢增长，最后20%等待实际加载完成
      this.loadingInterval = setInterval(() => {
        if (this.progressPercent < 80) {
          // 随机增长1-3%，模拟加载进度
          const increment = Math.floor(Math.random() * 3) + 1;
          this.progressPercent = Math.min(this.progressPercent + increment, 80);
        }
      }, 1000);
    }
  }
}
</script>

<style scoped>
.landscape-container {
  width: 100vw;
  height: 100vh;
  overflow: hidden;
  background-color: #000;
  position: relative;
}

/* 横屏提示样式 */
.rotation-prompt {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  background-color: rgba(0, 0, 0, 0.8);
  color: white;
  z-index: 100;
}

.rotation-prompt i {
  font-size: 5rem;
  margin-bottom: 1rem;
  animation: rotate 2s ease-in-out infinite alternate;
}

.rotation-prompt p {
  font-size: 1.5rem;
  text-align: center;
  padding: 0 1rem;
}

@keyframes rotate {
  from { transform: rotate(0deg); }
  to { transform: rotate(90deg); }
}

/* 内容区域样式 */
.content-wrapper {
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
}

/* 控制栏样式 */
.control-bar {
  padding: 0.3rem 1rem;
  background-color: #2c3e50;
  color: white;
  display: flex;
  justify-content: space-between;
  align-items: center;
  z-index: 10;
  height: 40px;
}

.nav-buttons {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.control-bar h1 {
  font-size: 1rem;
  margin: 0;
  white-space: nowrap;
}

.control-buttons {
  display: flex;
  gap: 0.5rem;
}

.exit-btn, .back-btn, .refresh-btn {
  color: white;
  border: none;
  padding: 0.3rem 0.8rem;
  border-radius: 4px;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 0.3rem;
  transition: background-color 0.3s;
  font-size: 0.9rem;
}

.exit-btn {
  background-color: #f39c12;
}

.exit-btn:hover {
  background-color: #d35400;
}

.back-btn {
  background-color: #e74c3c;
}

.back-btn:disabled {
  background-color: #95a5a6;
  cursor: not-allowed;
}

.back-btn:hover:not(:disabled) {
  background-color: #c0392b;
}

.refresh-btn {
  background-color: #3498db;
}

.refresh-btn:disabled {
  background-color: #95a5a6;
  cursor: not-allowed;
}

.refresh-btn:hover:not(:disabled) {
  background-color: #2980b9;
}

/* 增强的加载提示样式 */
.loading-overlay {
  position: absolute;
  top: 40px;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.85);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 5;
  flex-direction: column;
  padding: 2rem;
}

.loading-spinner {
  color: white;
  text-align: center;
  max-width: 90%;
}

.loading-spinner i {
  margin-bottom: 1.5rem;
  color: #3498db;
  animation: spin 2s linear infinite;
}

.loading-text {
  font-size: 1.5rem;
  margin: 0 0 0.5rem 0;
  font-weight: bold;
}

.loading-subtext {
  font-size: 1rem;
  margin: 0 0 1.5rem 0;
  color: #bdc3c7;
  line-height: 1.4;
}

/* 进度条样式 */
.progress-bar {
  width: 100%;
  max-width: 300px;
  height: 8px;
  background-color: rgba(255, 255, 255, 0.2);
  border-radius: 4px;
  overflow: hidden;
  margin-top: 1rem;
}

.progress {
  height: 100%;
  background-color: #3498db;
  transition: width 0.5s ease;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

/* iframe容器样式 */
.iframe-container {
  flex: 1;
  width: 100%;
  height: calc(100% - 40px);
  overflow: auto;
  -webkit-overflow-scrolling: touch;
  position: relative;
}

.target-iframe {
  width: 100%;
  height: 100%;
  touch-action: manipulation;
}

/* 响应式调整 */
@media (max-width: 768px) {
  .control-bar {
    padding: 0.3rem 0.5rem;
  }

  .nav-buttons {
    gap: 0.3rem;
  }

  .control-bar h1 {
    font-size: 0.85rem;
  }

  .exit-btn, .back-btn, .refresh-btn {
    padding: 0.2rem 0.5rem;
    font-size: 0.75rem;
    gap: 0.2rem;
  }

  .rotation-prompt i {
    font-size: 3rem;
  }

  .rotation-prompt p {
    font-size: 1.2rem;
  }

  .loading-text {
    font-size: 1.2rem;
  }

  .loading-subtext {
    font-size: 0.9rem;
  }

  .loading-spinner i {
    font-size: 2.5rem;
  }
}
</style>
