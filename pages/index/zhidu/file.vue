<template>
  <div class="iframe-container">
    <!-- 使用 :src 绑定动态数据 -->
    <iframe
      :src="iframeSrc"
      width="100%"
      height="100%"
      frameborder="0"
      allowfullscreen
      @load="onIframeLoad"
      @error="onIframeError"
    ></iframe>
    
    <!-- 加载提示 -->
    <div v-if="loading" class="loading">正在加载...</div>
    
    <!-- 错误提示 -->
    <div v-if="error" class="error">
      加载失败，<button @click="reload">重新加载</button>
    </div>
  </div>
</template>

<script>
export default {
  name: 'IframePage',
  data() {
    return {
      iframeSrc: '',
      loading: true,
      error: false,
      pageTitle: '预览'
    }
  },
  onLoad(options) {
    
    
    // 处理参数
    if (options && options.src) {
      // 解码参数
      const src = decodeURIComponent(options.src)
      
      // 构建完整URL
      const baseUrl = 'https://fdjt.qdsteel.com:5018/prod-api'
      const fileUrl = baseUrl + src
      
      // 构建预览URL
      const previewUrl = 'https://www.pfile.com.cn/api/profile/onlinePreview'
      this.iframeSrc = previewUrl + '?url=' + encodeURIComponent(fileUrl)
      

      // 设置页面标题
      if (options.title) {
        this.pageTitle = decodeURIComponent(options.title)
        uni.setNavigationBarTitle({
          title: this.pageTitle
        })
      }
    } else {
      // 没有参数时，显示错误或默认页面
      this.error = true
      uni.showToast({
        title: '缺少文件参数',
        icon: 'none'
      })
    }
  },
  methods: {
    onIframeLoad() {
      
      this.loading = false
      this.error = false
    },
    onIframeError() {
      
      this.loading = false
      this.error = true
      
      uni.showToast({
        title: '文件加载失败',
        icon: 'none'
      })
    },
    reload() {
      this.loading = true
      this.error = false
      
      // 重新加载当前页面
      const pages = getCurrentPages()
      const currentPage = pages[pages.length - 1]
      const options = currentPage.options
      
      this.onLoad(options)
    },
    // 返回上一页
    goBack() {
      uni.navigateBack()
    }
  },

}
</script>

<style scoped>
.iframe-container {
  width: 100%;
  height: 100vh;
  position: relative;
  overflow: hidden;
}

iframe {
  width: 100%;
  height: 100%;
  border: none;
}

.loading, .error {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  display: flex;
  justify-content: center;
  align-items: center;
  background: #f5f5f5;
  z-index: 10;
}

.loading {
  color: #666;
  font-size: 16px;
}

.error {
  color: #f56c6c;
  flex-direction: column;
}

.error button {
  margin-top: 20px;
  padding: 10px 20px;
  background: #409eff;
  color: white;
  border: none;
  border-radius: 4px;
}
</style>