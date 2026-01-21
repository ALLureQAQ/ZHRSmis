<template>
	<div id="app">
		<!-- 顶部标题栏 -->
		<div class="app-header">
			<div class="app-title">
				<i class="fas fa-clipboard-check"></i>
				<h1>设备巡检填报系统</h1>
			</div>
			<p class="app-subtitle">请按要求完成设备巡检并填写数据</p>
		</div>

		<!-- 主内容区 -->
		<div class="form-container">
			<!-- 设备信息 -->
			<div class="section">
				<div class="section-header">
					<div class="section-icon">
						<i class="fas fa-info-circle"></i>
					</div>
					<h2 class="section-title">设备信息</h2>
				</div>

				<div class="info-grid">
					
					<div class="info-item">
						<div class="info-label">设备名称</div>
						<div class="info-value">{{ nameFun || '加载中...' }}</div>
					</div>
				</div>
			</div>

			<!-- 巡检要求 -->
			<div class="section">
				<div class="section-header">
					<div class="section-icon">
						<i class="fas fa-tasks"></i>
					</div>
					<h2 class="section-title">巡检要求</h2>
				</div>

				<div class="requirement-content">
					{{ yaoqiu || '正在加载巡检要求...' }}
				</div>
			</div>

			<!-- 巡检数据 -->
			<div class="section">
				<div class="section-header">
					<div class="section-icon">
						<i class="fas fa-chart-line"></i>
					</div>
					<h2 class="section-title">巡检数据</h2>
				</div>

				<div class="input-group">
					<label class="input-label required">抄表数据</label>
					<input type="text" class="input-field" v-model="value" placeholder="请抄表"
						:class="{ 'error': showError && !value }">
					<div class="error-message" v-if="showError && !value">
						请填写抄表数据
					</div>
				</div>
			</div>

			<!-- 现场记录 -->
			<div class="section">
				<div class="section-header">
					<div class="section-icon">
						<i class="fas fa-camera"></i>
					</div>
					<h2 class="section-title">现场记录</h2>
				</div>

				<div class="input-group">
					<label class="input-label">现场照片</label>
					<div class="upload-area" :class="{ 'active': isUploading, 'has-image': photoPath }"
						@click="takePhoto">
						<div v-if="!photoPath" class="upload-content">
							<div class="upload-icon">
								<i class="fas fa-camera"></i>
							</div>
							<div class="upload-text">点击拍摄照片</div>
							<div class="upload-hint">支持 JPG、PNG 格式，不超过 5MB</div>
						</div>

						<div v-else class="image-preview">
							<img :src="photoPath" class="uploaded-image" alt="现场照片">
							<div class="remove-image" @click.stop="removePhoto">
								<i class="fas fa-times"></i>
							</div>
						</div>
					</div>
					<div class="error-message" v-if="showError && !photoPath">
						请拍摄现场照片
					</div>
				</div>
			</div>

			<!-- 状态提示 -->
			<div class="status-message" :class="statusClass" v-if="statusMessage">
				<i class="fas" :class="statusIcon"></i>
				{{ statusMessage }}
			</div>

			<!-- 操作按钮 -->
			<div class="section action-section">
				<div class="action-buttons">
					<button class="btn btn-primary" @click="submitForm" :disabled="isSubmitting">
						<i class="fas fa-paper-plane"></i>
						{{ isSubmitting ? '提交中...' : '提交巡检' }}
					</button>
					<button class="btn btn-danger" @click="submitForm2">
						<i class="fas fa-exclamation-triangle"></i>
						上报异常
					</button>
				</div>
			</div>
			
			
		</div>
	</div>
</template>

<script>
	

	var url;
	export default {
		data() {
			return {
				deviceid: '',
				name: '',
				yaoqiu: '',
				value: '',
				nameFun: '',
				photoPath: '',
				statusMessage: '',
				statusClass: '',
				isSubmitting: false,
				showError: false,
				isUploading: false,
				uploadfile: null,
				showPhotoError: false
			};
		},
		onLoad: function(options) {
			
			var id = options.deviceId
			
			var that = this;
			
			uni.request({
				url: 'https://fdjt.qdsteel.com:5018/prod-api/mes/cmproduction/' + options.deviceId,
				method: 'GET',
				header: {
					'content-type': 'application/json'
				},
				success: function(res) {
					
					if (res.statusCode == 200) {
						var array = res.data;
						that.setData({
							deviceid: id,
							nameFun: res.data.data.name,
							yaoqiu: res.data.data.describe
						});
					}
				},
				fail: function() {
					uni.showToast({
						icon: 'none',
						mask: true,
						title: '接口调用失败，请稍后再试。'
					});
				}
			});
		},

		methods: {
			handleInput: function(e) {
				this.setData({
					value: e.detail.value
				});
			},

			// 拍照功能
			takePhoto: function() {
				const that = this;
				uni.chooseImage({
					sourceType: ['camera'], // 仅限摄像头拍摄
					success: function(res) {
						that.setData({
							photoPath: res.tempFilePaths[0]
						});
						
					},
					fail: function(err) {
						uni.showToast({
							title: '拍照失败，请重试',
							icon: 'none'
						});
					}
				});
			},
			
			
			// 提交表单
			submitForm: function() {
				if (!this.value) {
					uni.showToast({
						title: '请填写抄表数据',
						icon: 'none'
					});
					return;
				}
				const username=uni.getStorageSync('username')
				const that = this;
				// 先执行文件上传
				setTimeout(() =>{
					uni.request({
					url: 'https://fdjt.qdsteel.com:5018/prod-api/mes/irproduction/updateByToday',
					data: {
						checkMenuProductionId: that.deviceid,
						value: that.value,
						isChecked: '已检',
						isConfirm: '已确认',
						picture: photofile ,// 使用上传返回的文件名,
						updateByN:username
					},
					method: 'POST',
					header: {
						'content-type': 'application/json'
					},
					success: function(res) {
						console.log(res)
						uni.showToast({
							title: '提交成功',
							icon: 'success',
							duration: 2000
						});
						setTimeout(() => {
							uni.navigateBack();
						}, 2000);
					},
					fail: function() {
						uni.showToast({
							icon: 'none',
							mask: true,
							title: '接口调用失败，请稍后再试。'
						});
					}
				});
					
				},1500)
				
			},

			nameFun1: function(res) {
				this.setData({
					value: res.detail.value
				});
			},

			submitForm2: function() {
				uni.navigateTo({
					url: '/pages/index/xunjian/quexian/index',
					success: {}
				});
			}
		}
	};
</script>


<style>
	* {
		margin: 0;
		padding: 0;
		box-sizing: border-box;
		-webkit-tap-highlight-color: transparent;
	}

	body {
		font-family: 'PingFang SC', 'Helvetica Neue', Arial, sans-serif;
		background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);
		color: #333;
		line-height: 1.6;
		min-height: 100vh;
		padding: 10px;
	}

	#app {
		max-width: 800px;
		margin: 0 auto;
	}

	.app-header {
		background: linear-gradient(135deg, #3498db 0%, #2c3e50 100%);
		color: white;
		padding: 20px;
		border-radius: 16px 16px 0 0;
		box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
		text-align: center;
		margin-bottom: 20px;
	}

	.app-title {
		font-size: 24px;
		font-weight: 600;
		margin-bottom: 8px;
		display: flex;
		align-items: center;
		justify-content: center;
	}

	.app-title i {
		margin-right: 12px;
		font-size: 28px;
	}

	.app-subtitle {
		font-size: 16px;
		opacity: 0.9;
	}

	.form-container {
		background: white;
		border-radius: 16px;
		box-shadow: 0 6px 25px rgba(0, 0, 0, 0.08);
		overflow: hidden;
		margin-bottom: 20px;
	}

	.section {
		padding: 20px;
		border-bottom: 1px solid #f0f0f0;
	}

	.section:last-child {
		border-bottom: none;
	}

	.section-header {
		display: flex;
		align-items: center;
		margin-bottom: 18px;
	}

	.section-icon {
		width: 40px;
		height: 40px;
		background: #e3f2fd;
		border-radius: 10px;
		display: flex;
		align-items: center;
		justify-content: center;
		margin-right: 12px;
		color: #3498db;
		font-size: 18px;
	}

	.section-title {
		font-size: 18px;
		font-weight: 600;
		color: #2c3e50;
	}

	.info-grid {
		display: grid;
		grid-template-columns: 1fr 1fr;
		gap: 15px;
	}

	.info-item {
		background: #f8fafc;
		padding: 15px;
		border-radius: 10px;
		border-left: 4px solid #3498db;
	}

	.info-label {
		font-size: 14px;
		color: #7f8c8d;
		margin-bottom: 5px;
	}

	.info-value {
		font-size: 16px;
		font-weight: 600;
		color: #2c3e50;
	}

	.requirement-content {
		background: #f8fafc;
		padding: 18px;
		border-radius: 10px;
		font-size: 15px;
		line-height: 1.7;
		color: #34495e;
		white-space: pre-line;
	}

	.input-group {
		margin-bottom: 20px;
	}

	.input-label {
		display: block;
		font-size: 16px;
		font-weight: 500;
		margin-bottom: 10px;
		color: #2c3e50;
	}

	.input-label.required::after {
		content: " *";
		color: #e74c3c;
	}

	.input-field {
		width: 100%;
		padding: 0px;
		border: 2px solid #e9ecef;
		border-radius: 10px;
		font-size: 30px;
		transition: all 0.3s;
		background: #fdfdfd;
	}

	.input-field:focus {
		border-color: #3498db;
		outline: none;
		box-shadow: 0 0 0 3px rgba(52, 152, 219, 0.2);
	}

	.input-field.error {
		border-color: #e74c3c;
	}

	.error-message {
		color: #e74c3c;
		font-size: 14px;
		margin-top: 8px;
	}

	.upload-area {
		width: 100%;
		height: 200px;
		border: 2px dashed #bdc3c7;
		border-radius: 12px;
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		background: #f8fafc;
		cursor: pointer;
		transition: all 0.3s;
		overflow: hidden;
		position: relative;
	}

	.upload-area:hover {
		border-color: #3498db;
		background: #f0f7ff;
	}

	.upload-area.active {
		border-color: #3498db;
		background: #e3f2fd;
	}

	.upload-area.has-image {
		border-style: solid;
		border-color: #3498db;
		padding: 0;
	}

	.upload-content {
		text-align: center;
	}

	.upload-icon {
		font-size: 48px;
		color: #7f8c8d;
		margin-bottom: 12px;
		transition: all 0.3s;
	}

	.upload-area:hover .upload-icon {
		color: #3498db;
	}

	.upload-text {
		font-size: 16px;
		color: #7f8c8d;
	}

	.upload-hint {
		font-size: 14px;
		color: #95a5a6;
		margin-top: 8px;
	}

	.image-preview {
		width: 100%;
		height: 100%;
		position: relative;
	}

	.uploaded-image {
		width: 100%;
		height: 100%;
		object-fit: cover;
		border-radius: 10px;
	}

	.remove-image {
		position: absolute;
		top: 10px;
		right: 10px;
		width: 36px;
		height: 36px;
		background: rgba(231, 76, 60, 0.9);
		color: white;
		border-radius: 50%;
		display: flex;
		align-items: center;
		justify-content: center;
		cursor: pointer;
		font-size: 18px;
		transition: all 0.3s;
	}

	.remove-image:hover {
		background: #e74c3c;
		transform: scale(1.1);
	}

	.status-message {
		padding: 15px;
		border-radius: 10px;
		margin: 15px 20px;
		display: flex;
		align-items: center;
		font-size: 15px;
	}

	.status-message i {
		margin-right: 10px;
		font-size: 18px;
	}

	.status-message.info {
		background: #e3f2fd;
		color: #0277bd;
		border-left: 4px solid #3498db;
	}

	.status-message.success {
		background: #e8f5e9;
		color: #2e7d32;
		border-left: 4px solid #4caf50;
	}

	.status-message.error {
		background: #ffebee;
		color: #c62828;
		border-left: 4px solid #f44336;
	}

	.action-section {
		padding-top: 10px;
	}

	.action-buttons {
		display: grid;
		grid-template-columns: 1fr 1fr;
		gap: 15px;
	}

	.btn {
		padding: 16px;
		border: none;
		border-radius: 12px;
		font-size: 16px;
		font-weight: 600;
		cursor: pointer;
		transition: all 0.3s;
		display: flex;
		align-items: center;
		justify-content: center;
	}

	.btn:disabled {
		opacity: 0.6;
		cursor: not-allowed;
		transform: none !important;
	}

	.btn-primary {
		background: linear-gradient(135deg, #3498db 0%, #2980b9 100%);
		color: white;
		box-shadow: 0 4px 15px rgba(52, 152, 219, 0.3);
	}

	.btn-primary:hover:not(:disabled) {
		transform: translateY(-2px);
		box-shadow: 0 6px 20px rgba(52, 152, 219, 0.4);
	}

	.btn-danger {
		background: linear-gradient(135deg, #e74c3c 0%, #c0392b 100%);
		color: white;
		box-shadow: 0 4px 15px rgba(231, 76, 60, 0.3);
	}

	.btn-danger:hover {
		transform: translateY(-2px);
		box-shadow: 0 6px 20px rgba(231, 76, 60, 0.4);
	}

	.btn i {
		margin-right: 8px;
		font-size: 18px;
	}

	/* 响应式设计 */
	@media (max-width: 600px) {
		.app-header {
			padding: 15px;
		}

		.app-title {
			font-size: 20px;
		}

		.section {
			padding: 15px;
		}

		.info-grid {
			grid-template-columns: 1fr;
		}

		.action-buttons {
			grid-template-columns: 1fr;
		}

		.btn {
			padding: 14px;
		}
	}

	/* Font Awesome 图标 (简化版) */
	.fas {
		font-family: Arial;
		font-style: normal;
	}

	.fa-clipboard-check:before {
		content: "";
	}

	.fa-info-circle:before {
		content: "ℹ️";
	}

	.fa-tasks:before {
		content: "✅";
	}

	.fa-chart-line:before {
		content: "";
	}

	.fa-camera:before {
		content: "";
	}

	.fa-paper-plane:before {
		content: "✈️";
	}

	.fa-exclamation-triangle:before {
		content: "⚠️";
	}

	.fa-times:before {
		content: "✕";
	}

	.fa-check-circle:before {
		content: "✓";
	}

	.fa-exclamation-circle:before {
		content: "!";
	}
</style>