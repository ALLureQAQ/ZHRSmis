<template>
	<div id="app">
		<!-- 顶部标题栏 -->
		<div class="app-header">
			<div class="app-title">
				<i class="icon icon-complete"></i>
				<h1>缺陷消缺</h1>
			</div>
			<p class="app-subtitle">请填写消缺信息并提交</p>
		</div>

		<!-- 主内容区 -->
		<div class="form-container">
			<!-- 消缺人信息（只显示不编辑） -->
			<div class="section">
				<div class="section-header">
					<div class="section-icon">
						<i class="icon icon-handler"></i>
					</div>
					<h2 class="section-title">消缺人信息</h2>
				</div>

				<div class="display-group">
					<label class="display-label">消缺人</label>
					<div class="display-value">{{ handlerName }}</div>
				</div>




			</div>

			<!-- 消缺内容 -->
			<div class="section">
				<div class="section-header">
					<div class="section-icon">
						<i class="icon icon-content"></i>
					</div>
					<h2 class="section-title">消缺内容</h2>
				</div>



				<div class="display-group">
					<label class="display-label">消缺内容</label>
					<div class="display-value">{{ qxname }}</div>
				</div>
			</div>

			<!-- 消缺证明 -->
			<div class="section">
				<div class="section-header">
					<div class="section-icon">
						<i class="icon icon-proof"></i>
					</div>
					<h2 class="section-title">消缺结果</h2>
				</div>

				<div class="input-group">
					<label class="input-label required">消缺完成照片</label>
					<div class="upload-area"
						:class="{ 'active': isUploading, 'has-image': photoPath, 'error': showPhotoError }"
						@click="takePhoto">
						<div v-if="!photoPath" class="upload-content">
							<div class="upload-icon">
								<i class="icon icon-camera"></i>
							</div>
							<div class="upload-text">点击拍摄照片</div>

						</div>

						<div v-else class="image-preview">
							<img :src="photoPath" class="uploaded-image" alt="缺陷图片">
							<div class="remove-image" @click.stop="removePhoto">
								<i class="icon icon-close"></i>
							</div>
						</div>
					</div>
					<div class="error-message" v-if="showPhotoError">
						请上传消缺完成照片
					</div>
				</div>

				<div class="input-group">
					<label class="input-label">备注说明</label>
					<textarea class="textarea-field" v-model="notes" placeholder="可填写其他说明信息" rows="2"></textarea>
				</div>
			</div>

			<!-- 状态提示 -->
			<div class="status-message" :class="statusClass" v-if="statusMessage">
				<i class="icon" :class="statusIcon"></i>
				{{ statusMessage }}
			</div>

			<!-- 提交按钮 -->
			<div class="section">
				<button class="submit-btn" @click="submitForm" :disabled="isSubmitting">
					{{ isSubmitting ? '提交中...' : '提交消缺记录' }}
				</button>
			</div>

			
		</div>
	</div>
</template>

<script>
	var url;
	export default {
		name: 'DefectResolution',
		data() {
			return {
				// 消缺人信息（从缓存获取）
				gdid: '',
				handlerName: '',
				qxname: '',
				// 消缺内容
				solution: '',
				result: '',
				// 消缺证明
				photoPath: '',
				notes: '',
				// 状态
				statusMessage: '',
				statusClass: '',
				isSubmitting: false,
				isUploading: false,
				showPhotoError: false

			}
		},

		onLoad: function(options) {
			// 从本地存储获取用户信息
			const userInfo = uni.getStorageSync('username');
			const token = uni.getStorageSync('token');
			this.handlerName = userInfo;
			// 如果有传递的缺陷ID，可以加载相关信息
			if (options.id) {
				this.gdid = options.id
				var that = this
				uni.request({
					url: 'https://fdjt.qdsteel.com:5018/prod-api/mes/gd/' + options.id,
					method: 'GET',
					header: {
						'content-type': 'application/json',
						'Authorization': token
					},
					success: function(res) {
						that.qxname = res.data.data.qxname
					}
				});
			}
		},

		computed: {
			statusIcon() {
				if (this.statusClass === 'success') return '✓'
				if (this.statusClass === 'error') return '!'
				return 'ℹ️'
			}
		},

		methods: {
			selectResult(result) {
				this.result = result;
			},
			takePhoto: function() {
				var that = this
				uni.chooseImage({
					sourceType: ['album','camera'], // 仅限摄像头拍摄
					success: function(res) {
						uni.uploadFile({
							url: 'https://fdjt.qdsteel.com:5018/prod-api/common/upload', //仅为示例，非真实的接口地址
							filePath: res.tempFilePaths[0],
							name: 'file',
							success: (uploadFileRes) => {
								url=JSON.parse(uploadFileRes.data).fileName
								that.photoPath='https://fdjt.qdsteel.com:5018/prod-api'+url;
							}
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
			// 获取图片
			removePhoto() {
				this.photoPath = '';
				this.showPhotoError = false;
			},
			// 表单提交
			submitForm() {
				// 图片必填验证
				if (!this.photoPath) {
					this.showError('请上传消缺完成照片');
					this.showPhotoError = true;
					return;
				}

				this.isSubmitting = true;
				this.statusMessage = '正在提交消缺记录，请稍候...';
				this.statusClass = 'info';



				// 模拟API请求
				setTimeout(() => {
					// 在实际应用中，这里会调用真实的API


					// 模拟成功响应
					this.statusMessage = '消缺记录提交成功！';
					this.statusClass = 'success';
					this.isSubmitting = false;
					
					// 在实际应用中，这里可能会跳转到成功页面或返回上一页
					setTimeout(() => {
						uni.request({
							url: 'https://fdjt.qdsteel.com:5018/prod-api/mes/gd/xiao',
							method: 'PUT',
							header: {
								'content-type': 'application/json',
								'Authorization': uni.getStorageSync('token')
							},
							data: {
								gdid: this.gdid,
								xq_picture: url,
								bz: this.notes
							},
							success: function(res) {

								if (res.data.code == 200) {
									this.statusMessage = '上报成功！';
									this.statusClass = 'success';
									this.isSubmitting = false;
									// 在实际应用中，这里会跳转页面或重置表单
									setTimeout(() => {
										// 重置表单
										this.notes = '';
										this.showPhotoError = false;
										uni.showToast({
											title: '上报成功',
											icon: 'success'
										});
										uni.reLaunch({
											url: '/pages/message/workorder/index' // 首页的路径
										});
									}, 500);
								}
							}
						});
					}, 200);
				}, 1500);
			},

			// 显示错误信息
			showError(message) {
				this.statusMessage = message;
				this.statusClass = 'error';

				// 3秒后清除错误信息
				setTimeout(() => {
					this.statusMessage = '';
				}, 3000);
			}
		}
	}
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
		padding: 15px;
	}

	#app {
		max-width: 800px;
		margin: 0 auto;
	}

	.app-header {
		background: linear-gradient(135deg, #27ae60 0%, #219653 100%);
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
		background: #e8f5e9;
		border-radius: 10px;
		display: flex;
		align-items: center;
		justify-content: center;
		margin-right: 12px;
		color: #27ae60;
		font-size: 18px;
	}

	.section-title {
		font-size: 18px;
		font-weight: 600;
		color: #2c3e50;
	}

	/* 显示组样式 */
	.display-group {
		margin-bottom: 15px;
		padding: 12px;
		background: #f8f9fa;
		border-radius: 8px;
		border: 1px solid #e9ecef;
	}

	.display-label {
		font-size: 14px;
		color: #6c757d;
		margin-bottom: 5px;
		display: block;
	}

	.display-value {
		font-size: 30px;
		padding: 0px;
		border-radius: 10px;
		font-weight: 500;
		color: #2c3e50;
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

	.textarea-field {
		width: 100%;
		padding: 14px;
		border: 2px solid #e9ecef;
		border-radius: 10px;
		font-size: 16px;
		transition: all 0.3s;
		background: #fdfdfd;
		resize: vertical;
		font-family: inherit;
	}

	.textarea-field:focus {
		border-color: #27ae60;
		outline: none;
		box-shadow: 0 0 0 3px rgba(39, 174, 96, 0.2);
	}

	.char-count {
		text-align: right;
		font-size: 14px;
		color: #7f8c8d;
		margin-top: 5px;
	}

	.radio-group {
		display: grid;
		grid-template-columns: repeat(3, 1fr);
		gap: 12px;
		margin-top: 10px;
	}

	.radio-item {
		flex: 1;
		min-width: 0;
	}

	.radio-label {
		display: flex;
		align-items: center;
		justify-content: center;
		padding: 12px 8px;
		border: 2px solid #e9ecef;
		border-radius: 10px;
		cursor: pointer;
		transition: all 0.3s;
		background: #f8fafc;
		font-weight: 500;
		text-align: center;
		height: 100%;
		min-height: 50px;
		word-break: break-all;
	}

	.radio-label:hover {
		border-color: #27ae60;
		background: #f0f9f1;
	}

	.radio-label.selected {
		border-color: #27ae60;
		background: #e8f5e9;
		color: #27ae60;
		font-weight: 600;
	}

	.photo-upload-container {
		display: flex;
		flex-direction: column;
		gap: 20px;
	}

	.photo-upload-area {
		width: 100%;
		height: 250px;
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

	.photo-upload-area:hover {
		border-color: #27ae60;
		background: #f0f9f1;
	}

	.photo-upload-area.active {
		border-color: #27ae60;
		background: #e8f5e9;
	}

	.photo-upload-area.has-image {
		border-style: solid;
		border-color: #27ae60;
		padding: 0;
	}

	.photo-upload-area.error {
		border-color: #e74c3c;
		background: #fdf2f2;
	}

	.upload-content {
		text-align: center;
		padding: 20px;
	}

	.upload-icon {
		font-size: 48px;
		color: #7f8c8d;
		margin-bottom: 12px;
		transition: all 0.3s;
	}

	.photo-upload-area:hover .upload-icon {
		color: #27ae60;
	}

	.photo-upload-area.error .upload-icon {
		color: #e74c3c;
	}

	.upload-text {
		font-size: 16px;
		color: #7f8c8d;
		font-weight: 500;
		margin-bottom: 5px;
	}

	.upload-hint {
		font-size: 14px;
		color: #95a5a6;
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

	.submit-btn {
		width: 100%;
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
		background: linear-gradient(135deg, #27ae60 0%, #219653 100%);
		color: white;
		box-shadow: 0 4px 15px rgba(39, 174, 96, 0.3);
		margin-top: 10px;
	}

	.submit-btn:hover {
		transform: translateY(-2px);
		box-shadow: 0 6px 20px rgba(39, 174, 96, 0.4);
	}

	.submit-btn:disabled {
		opacity: 0.6;
		cursor: not-allowed;
		transform: none !important;
	}

	.status-message {
		padding: 15px;
		border-radius: 10px;
		margin: 15px 0;
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

	.error-message {
		color: #e74c3c;
		font-size: 14px;
		margin-top: 8px;
	}

	/* 响应式设计 */
	@media (max-width: 768px) {
		.radio-group {
			grid-template-columns: 1fr;
		}
	}

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

		.photo-upload-area {
			height: 200px;
		}
	}

	/* 图标样式 */
	.icon {
		font-family: Arial;
		font-style: normal;
	}

	.icon-complete:before {
		content: "✅";
	}

	.icon-handler:before {
		content: "";
	}

	.icon-content:before {
		content: "";
	}

	.icon-proof:before {
		content: "";
	}

	.icon-camera:before {
		content: "";
	}

	.icon-close:before {
		content: "✕";
	}
</style>