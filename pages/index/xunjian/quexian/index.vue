<template>
	<div id="app">
		<!-- 顶部标题栏 -->
		<div class="app-header">
			<div class="app-title">
				<i class="icon icon-report"></i>
				<h1>缺陷上报系统</h1>
			</div>
			<p class="app-subtitle">请填写缺陷信息并提交</p>
		</div>

		<!-- 主内容区 -->
		<div class="form-container">
			<!-- 上报人信息 -->
			<div class="section">
				<div class="section-header">
					<div class="section-icon">
						<i class="icon icon-user"></i>
					</div>
					<h2 class="section-title">上报人信息</h2>
				</div>

				<div class="input-group">
					<label class="input-label required">上报人</label>
					<input type="text" class="input-field" v-model="username" placeholder="请填写上报人姓名">
				</div>
			</div>

			<!-- 设备信息 -->
			<div class="section">
				<div class="section-header">
					<div class="section-icon">
						<i class="icon icon-device"></i>
					</div>
					<h2 class="section-title">设备信息</h2>
				</div>

				<div class="input-group">
					<label class="input-label required">设备名称</label>
					<input type="text" class="input-field" v-model="value1" placeholder="请填写设备名称">
				</div>

				<div class="input-group">
					<label class="input-label required">区域</label>
					<input type="text" class="input-field" v-model="area" placeholder="请填写设备所在区域">
				</div>
			</div>

			<!-- 专业信息 -->
			<div class="section">
				<div class="section-header">
					<div class="section-icon">
						<i class="icon icon-profession"></i>
					</div>
					<h2 class="section-title">专业信息</h2>
				</div>
				<div class="input-group">
					<div class="input-group">
						<label class="input-label required">专业</label>
						<div class="radio-group">
							<div class="radio-item" v-for="(item, index) in professions" :key="index"
								@click="selectProfession(item.name)">
								<div class="radio-label" :class="{ 'selected': profession=== item.name }">
									{{ item.value }}
								</div>
							</div>
						</div>
					</div>
				</div>
			</div>

			<!-- 缺陷信息 -->
			<div class="section">
				<div class="section-header">
					<div class="section-icon">
						<i class="icon icon-defect"></i>
					</div>
					<h2 class="section-title">缺陷信息</h2>
				</div>

				<div class="input-group">
					<label class="input-label required">缺陷名称</label>
					<input type="text" class="input-field" v-model="value" placeholder="请填写缺陷名称">
				</div>

				<div class="input-group">

					<div class="radio-group">
						<div class="input-group">
							<label class="input-label required">缺陷等级</label>
							<div class="radio-group">
								<div class="radio-item" v-for="(item, index) in items" :key="index"
									@click="selectLevel(item.name)">
									<div class="radio-label" :class="{ 'selected': value2 === item.name }">
										{{ item.value }}
									</div>
								</div>
							</div>
						</div>
					</div>
				</div>

				<!-- 缺陷图片上传 -->
				<div class="input-group">
					<label class="input-label required">缺陷图片</label>
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
						请上传缺陷图片
					</div>
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
					{{ isSubmitting ? '提交中...' : '上报缺陷' }}
				</button>
			</div>
		</div>
	</div>
</template>

<script>
	import {
		LOG
	} from '@zxing/library/esm/core/datamatrix/encoder/constants';

	var photofile;
	var url;
	export default {
		name: 'App',
		data() {
			return {
				items: [{
						value: '一级(停主机等)',
						name: 'Ⅰ级'
					},
					{
						value: '二级(停辅机，降出力等)',
						name: 'Ⅱ级'
					},
					{
						value: '三级(一般设备缺陷)三级',
						name: 'Ⅲ级'
					},
					{
						value: '四级(设备以外缺陷)',
						name: 'Ⅳ级'
					}
				],
				professions: [{
						value: '锅炉',
						name: '锅炉'
					},
					{
						value: '汽机',
						name: '汽机'
					},
					{
						value: '电气',
						name: '电气'
					},
					{
						value: '热控',
						name: '热控'
					},
					{
						value: '化验',
						name: '化验'
					},
					{
						value: '燃机',
						name: '燃机'
					},
					{
						value: '脱硫',
						name: '脱硫'
					},
					{
						value: '环保机务',
						name: '环保机务'
					},
					{
						value: '环保热控',
						name: '环保热控'
					},
					{
						value: '环保电气',
						name: '环保电气'
					}
				],
				value: '',
				isShowImg: false,
				value1: '',
				value2: '',
				username: '',
				area: '',
				profession: '',
				photoPath: '',
				statusMessage: '',
				statusClass: '',
				isSubmitting: false,
				isUploading: false,
				uploadfile: null,
				showPhotoError: false

			}
		},

		onLoad: function(options) {
			// 从本地存储获取用户名
			this.username = uni.getStorageSync('username');
		},
		computed: {
			statusIcon() {
				if (this.statusClass === 'success') return '✓'
				if (this.statusClass === 'error') return '!'
				return 'ℹ️'
			}
		},
		methods: {
			selectLevel(level) {
				this.value2 = level;
			},
			selectProfession(profession) {
				this.profession = profession;
			},
			// 拍照功能
			takePhoto: function() {
				var that=this
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
			removePhoto() {
				this.photoPath = '';
				this.showPhotoError = false;
			},
			submitForm() {
				// 表单验证
				if (!this.username) {
					this.statusMessage = '请填写上报人';
					this.statusClass = 'error';
					return;
				}

				if (!this.value1) {
					this.statusMessage = '请填写设备名称';
					this.statusClass = 'error';
					return;
				}

				if (!this.area) {
					this.statusMessage = '请填写区域';
					this.statusClass = 'error';
					return;
				}

				if (!this.profession) {
					this.statusMessage = '请选择专业';
					this.statusClass = 'error';
					return;
				}

				if (!this.value) {
					this.statusMessage = '请填写缺陷名称';
					this.statusClass = 'error';
					return;
				}



				// 图片必填验证
				if (!this.photoPath) {
					this.statusMessage = '请上传缺陷图片';
					this.statusClass = 'error';
					this.showPhotoError = true;
					return;
				}

				this.isSubmitting = true;
				this.statusMessage = '正在提交数据，请稍候...';
				this.statusClass = 'info';

				var that = this
				// PI请求
				setTimeout(() => {

					uni.request({
						url: 'https://fdjt.qdsteel.com:5018/prod-api/mes/gd',
						method: 'POST',
						header: {
							'content-type': 'application/json',
							'Authorization': uni.getStorageSync('token')
						},
						data: {
							qxname: this.value,
							deviceid: this.value1,
							form: this.value2,
							peo: this.username,
							location: this.area,
							special: this.profession,
							qx_picture: url
						},
						success: function(res) {
							if (res.data.code == 200) {
								this.statusMessage = '上报成功！';
								this.statusClass = 'success';
								this.isSubmitting = false;
								// 在实际应用中，这里会跳转页面或重置表单
								setTimeout(() => {
									// 重置表单
									this.value = '';
									this.value1 = '';
									this.value2 = '';
									this.area = '';
									this.profession = '';
									this.photoPath = '';
									this.statusMessage = '';
									this.showPhotoError = false;
									uni.showToast({
										title: '上报成功',
										icon: 'success'
									});

								}, 500);
								uni.reLaunch({
									url: '/pages/index/index' // 首页的路径
								});
							}
						}
					});
				}, 1000);
			},
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
		font-size: 15px;
	}

	.radio-label:hover {
		border-color: #3498db;
		background: #f0f7ff;
	}

	.radio-label.selected {
		border-color: #3498db;
		background: #e3f2fd;
		color: #3498db;
		font-weight: 600;
	}

	.radio-input {
		margin-right: 10px;
		transform: scale(1.2);
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

	.upload-area.error {
		border-color: #e74c3c;
		background: #fdf2f2;
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

	.upload-area.error .upload-icon {
		color: #e74c3c;
	}

	.upload-text {
		font-size: 16px;
		color: #7f8c8d;
	}

	.upload-area.error .upload-text {
		color: #e74c3c;
	}

	.upload-hint {
		font-size: 14px;
		color: #95a5a6;
		margin-top: 8px;
	}

	.upload-area.error .upload-hint {
		color: #e74c3c;
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
		background: linear-gradient(135deg, #3498db 0%, #2980b9 100%);
		color: white;
		box-shadow: 0 4px 15px rgba(52, 152, 219, 0.3);
		margin-top: 10px;
	}

	.submit-btn:hover {
		transform: translateY(-2px);
		box-shadow: 0 6px 20px rgba(52, 152, 219, 0.4);
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
			grid-template-columns: repeat(2, 1fr);
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

		.radio-group {
			grid-template-columns: 1fr;
		}

		.radio-item {
			min-width: auto;
		}
	}

	/* 图标样式 */
	.icon {
		font-family: Arial;
		font-style: normal;
	}

	.icon-report:before {
		content: "";
	}

	.icon-user:before {
		content: "";
	}

	.icon-device:before {
		content: "⚙️";
	}

	.icon-profession:before {
		content: "";
	}

	.icon-defect:before {
		content: "⚠️";
	}

	.icon-level:before {
		content: "";
	}

	.icon-camera:before {
		content: "";
	}

	.icon-close:before {
		content: "✕";
	}
</style>