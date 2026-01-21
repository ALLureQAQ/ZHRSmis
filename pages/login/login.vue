<template>
    <!-- pages/login/login.wxml -->
    <view class="container">
        <!-- 背景图容器 -->
        <view class="background-container">
            <!-- 背景图片 -->
            <image src="/static/images/login-bg.jpg" class="background-image" mode="aspectFill"></image>
            <!-- 背景遮罩层，增强文字可读性 -->
            <view class="background-overlay"></view>
            <!-- 背景装饰元素 -->
            <view class="background-decoration">
                <view class="decoration-circle circle-1"></view>
                <view class="decoration-circle circle-2"></view>
                <view class="decoration-circle circle-3"></view>
            </view>
        </view>
        
        <!-- 登录表单容器 -->
        <view class="form-wrapper">
            
            <view class="title">用户登录</view>
            <view class="subtitle">欢迎使用智慧燃烧Mis</view>
            
            <view class="input-group">
                <view class="input-item">
                    <view class="input-icon">
                        <text class="icon"></text>
                    </view>
                    <input
                        type="text"
                        placeholder="请输入工号"
                        v-model="username"
                        class="input-field"
                        placeholder-class="placeholder"
                    />
                </view>
                <view class="input-item">
                    <view class="input-icon">
                        <text class="icon"></text>
                    </view>
                    <input
                        :type="showPassword ? 'text' : 'password'"
                        placeholder="请输入密码"
                        v-model="password"
                        class="input-field"
                        placeholder-class="placeholder"
                        @confirm="login"
                    />
                    <view class="password-toggle" @tap="togglePassword">
                        <text class="toggle-icon">{{ showPassword ? '️' : '️‍️' }}</text>
                        <text class="toggle-text">{{ showPassword ? '隐藏' : '显示' }}</text>
                    </view>
                </view>
            </view>
            
            <button class="login-btn" @tap="login" :disabled="isLogging">
                <text v-if="!isLogging">登录</text>
                <text v-else class="loading-text">
                    <text class="loading-dots">...</text>
                </text>
            </button>
            
            <!-- 底部链接 -->
            <view class="footer-links">
                <text class="footer-text">智慧燃烧Mis</text>
                <!-- 可以根据需要添加其他链接 -->
                <!-- <text class="footer-link">忘记密码?</text>
                <text class="footer-link">注册账号</text> -->
            </view>
        </view>
    </view>
</template>

<script>
// pages/login/login.js
export default {
    data() {
        return {
            username: '',
            password: '',
            showPassword: false,
            isLogging: false
        };
    },
	
	onLoad: function(options){
		// 检查本地存储中是否有token
		const token = uni.getStorageSync('token');
		var that =this;
		if(token){
			uni.request({
			    url: 'https://fdjt.qdsteel.com:5018/prod-api/getInfo',
			    method: 'GET',
			    header: {
			        'content-type': 'application/json',
					'Authorization': token
			    },
			    success: function (res) {
					if(res.data.code == 200){
						uni.setStorage({
						    key: 'username',
						    data: res.data.user.nickName
						});
						
						uni.showToast({
						    title: '自动登录成功',
						    icon: 'success'
						});
						uni.reLaunch({
						    url: '/pages/index/index' // 首页的路径
						});
					} else {
						// token无效，清除存储
						uni.removeStorageSync('token');
						that.username=uni.getStorageSync('username');
						that.password=uni.getStorageSync('token');
						
					}
			    },
				fail: function() {
					// 网络请求失败，清除存储
					uni.removeStorageSync('token');
					uni.removeStorageSync('password');
				}
			});
		}
	},
    methods: {
        // 切换密码显示/隐藏
        togglePassword: function () {
            this.showPassword = !this.showPassword;
        },

        // 登录按钮点击事件
        login: function () {
            let username = this.username.trim();
            let password = this.password.trim();
            
            // 简单的输入验证
            if (!username || !password) {
				
                uni.showToast({
                    title: '工号和密码不能为空',
                    icon: 'none',
                    duration: 2000
                });
			
                return;
            }
			
			if(password=='123456'){
				uni.showToast({
				    title: '密码强度过低，请联系管理员修改密码',
				    icon: 'none',
				    duration: 2000
				});
				return;
			}
            

            
            this.isLogging = true;
            
            // 这里应该是实际的登录逻辑
            uni.request({
                url: 'https://fdjt.qdsteel.com:5018/prod-api/mes/test1/test1',
                data: {
                    username: username,
                    password: password
                },
                method: 'POST',
                header: {
                    'content-type': 'application/json'
                },
                success: (res) => {
					uni.setStorageSync('password',password);              	
                    if (res.data.code == '200') {
                        // 保存token到本地存储
                        uni.setStorageSync('token', res.data.token);
                        
                        // 获取用户信息
                        uni.request({
                            url: 'https://fdjt.qdsteel.com:5018/prod-api/getInfo',
                            method: 'GET',
                            header: {
                                'content-type': 'application/json',
                                'Authorization': res.data.token
                            },
                            success: (userRes) => {
                                uni.setStorageSync('username', userRes.data.user.nickName);
                                uni.showToast({
                                    title: '登录成功',
                                    icon: 'success',
                                    duration: 1500
                                });
                                // 跳转到首页
                                setTimeout(() => {
                                    uni.reLaunch({
                                        url: '/pages/index/index'
                                    });
                                }, 1500);
                            },
                            fail: () => {
                                uni.showToast({
                                    title: '获取用户信息失败',
                                    icon: 'none'
                                });
                                this.isLogging = false;
                            }
                        });
                    } else {
                        uni.showToast({
                            title: '用户名或密码错误',
                            icon: 'none',
                            duration: 2000
                        });
                        this.isLogging = false;
                    }
                },
                fail: () => {
                    uni.showToast({
                        title: '网络连接失败，请检查网络',
                        icon: 'none',
                        duration: 2000
                    });
                    this.isLogging = false;
                },
                complete: () => {
                    // 如果不是成功跳转，重置登录状态
                    setTimeout(() => {
                        if (this.isLogging) {
                            this.isLogging = false;
                        }
                    }, 3000);
                }
            });
        }
    }
};
</script>

<style>
.container {
    height: 100vh;
    width: 100vw;
    position: relative;
    overflow: hidden;
}

/* 背景图容器 */
.background-container {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    z-index: 0;
}

.background-image {
    width: 100%;
    height: 100%;
    filter: brightness(0.7); /* 降低亮度，使文字更清晰 */
}

.background-overlay {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: linear-gradient(135deg, rgba(41, 128, 185, 0.7) 0%, rgba(52, 152, 219, 0.5) 100%);
    z-index: 1;
}

/* 背景装饰元素 */
.background-decoration {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    z-index: 2;
    pointer-events: none;
}

.decoration-circle {
    position: absolute;
    border-radius: 50%;
    background: rgba(255, 255, 255, 0.1);
}

.circle-1 {
    width: 300rpx;
    height: 300rpx;
    top: -100rpx;
    right: -100rpx;
}

.circle-2 {
    width: 200rpx;
    height: 200rpx;
    bottom: 100rpx;
    left: -80rpx;
}

.circle-3 {
    width: 150rpx;
    height: 150rpx;
    bottom: 200rpx;
    right: 100rpx;
}

/* 表单容器 */
.form-wrapper {
    position: relative;
    z-index: 10;
    width: 90%;
    max-width: 600rpx;
    margin: 0 auto;
    padding: 60rpx 50rpx;
    background-color: rgba(255, 255, 255, 0.92);
    border-radius: 24rpx;
    box-shadow: 0 20rpx 60rpx rgba(0, 0, 0, 0.15);
    backdrop-filter: blur(10rpx);
    margin-top: 20vh;
    display: flex;
    flex-direction: column;
    align-items: center;
}

.logo {
    margin-bottom: 40rpx;
    display: flex;
    align-items: center;
    justify-content: center;
}

.logo image {
    width: 160rpx;
    height: 160rpx;
    border-radius: 16rpx;
    box-shadow: 0 8rpx 20rpx rgba(0, 0, 0, 0.1);
}

.title {
    font-size: 48rpx;
    font-weight: bold;
    margin-bottom: 16rpx;
    color: #2c3e50;
    text-align: center;
}

.subtitle {
    font-size: 28rpx;
    margin-bottom: 60rpx;
    color: #7f8c8d;
    text-align: center;
}

.input-group {
    width: 100%;
    margin-bottom: 60rpx;
}

.input-item {
    position: relative;
    margin-bottom: 40rpx;
    background-color: #ffffff;
    border-radius: 16rpx;
    overflow: hidden;
    box-shadow: 0 4rpx 12rpx rgba(0, 0, 0, 0.08);
    border: 2rpx solid #e0e0e0;
    transition: all 0.3s ease;
    display: flex;
    align-items: center;
    padding-left: 20rpx;
}

.input-item:focus-within {
    border-color: #3498db;
    box-shadow: 0 4rpx 16rpx rgba(52, 152, 219, 0.2);
}

.input-icon {
    margin-right: 20rpx;
    font-size: 36rpx;
}

.input-field {
    flex: 1;
    height: 100rpx;
    padding: 0 20rpx;
    padding-right: 140rpx;
    box-sizing: border-box;
    font-size: 32rpx;
    border: none;
    outline: none;
    background: transparent;
}

.placeholder {
    color: #95a5a6;
    font-size: 30rpx;
}

.password-toggle {
    position: absolute;
    right: 20rpx;
    top: 50%;
    transform: translateY(-50%);
    padding: 10rpx 20rpx;
    background-color: #f5f7fa;
    border-radius: 8rpx;
    display: flex;
    align-items: center;
    cursor: pointer;
    transition: background-color 0.3s;
}

.password-toggle:active {
    background-color: #e0e6ed;
}

.toggle-icon {
    font-size: 28rpx;
    margin-right: 8rpx;
}

.toggle-text {
    font-size: 24rpx;
    color: #666;
}

.login-btn {
    width: 100%;
    height: 96rpx;
    background: linear-gradient(135deg, #3498db 0%, #2980b9 100%);
    color: #ffffff;
    border-radius: 16rpx;
    border: none;
    font-size: 32rpx;
    font-weight: 600;
    display: flex;
    align-items: center;
    justify-content: center;
    margin-top: 20rpx;
    box-shadow: 0 8rpx 20rpx rgba(52, 152, 219, 0.3);
    transition: all 0.3s ease;
    position: relative;
    overflow: hidden;
}

.login-btn::after {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: rgba(255, 255, 255, 0.1);
    transform: translateX(-100%);
    transition: transform 0.5s ease;
}

.login-btn:active {
    transform: translateY(2rpx);
    box-shadow: 0 4rpx 12rpx rgba(52, 152, 219, 0.3);
}

.login-btn:active::after {
    transform: translateX(100%);
}

.login-btn:disabled {
    opacity: 0.7;
    transform: none;
    box-shadow: 0 4rpx 12rpx rgba(0, 0, 0, 0.1);
}

.loading-text {
    display: flex;
    align-items: center;
}

.loading-dots {
    animation: loading 1.5s infinite;
    font-size: 40rpx;
    letter-spacing: 4rpx;
}

@keyframes loading {
    0%, 20% { content: "."; }
    40% { content: ".."; }
    60%, 100% { content: "..."; }
}

.footer-links {
    margin-top: 60rpx;
    display: flex;
    flex-direction: column;
    align-items: center;
    width: 100%;
}

.footer-text {
    font-size: 24rpx;
    color: #7f8c8d;
    text-align: center;
}

.footer-link {
    font-size: 26rpx;
    color: #3498db;
    margin-top: 20rpx;
    text-decoration: none;
}

.footer-link:active {
    opacity: 0.7;
}

/* 响应式调整 */
@media (max-width: 600rpx) {
    .form-wrapper {
        width: 85%;
        padding: 50rpx 40rpx;
        margin-top: 15vh;
    }
    
    .title {
        font-size: 42rpx;
    }
    
    .subtitle {
        font-size: 26rpx;
    }
}

@media (min-width: 1000rpx) {
    .form-wrapper {
        max-width: 500rpx;
        margin-top: 25vh;
    }
}
</style>