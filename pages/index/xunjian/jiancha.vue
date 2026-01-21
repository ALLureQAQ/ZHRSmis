<template>
	<view class="contentBox">
		<view class="big-title">巡检记录</view>
		
		<view class="info-section">
			<view class="info-item">
				<text class="info-label">巡检位置：</text>
				<text class="info-value">{{ inspectionLocation }}</text>
			</view>
			
			<view class="info-item">
				<text class="info-label">巡检人：</text>
				<text class="info-value">{{ inspector }}</text>
			</view>
		</view>
		
		<view>
			<view class="questionBox" v-for="(item, index) in inspectionData" :key="item.id">
				<!-- 问题标题 -->
				<view class="question-title">
					<text class="question-order">{{ index + 1 }}.</text>
					<text class="question-content">{{ item.inspectionContent }}</text>
				</view>

				<!-- 状态选择（正常/异常） -->
				<view v-if="item.inspectionType === '1'" class="status-section">
					<view class="btn-group-status">
						<button 
							class="status-btn normal-btn"
							:class="{ 'active': item.inspection_result === 'normal' }"
							@click="selectStatus(index, 'normal')"
						>
							<text class="btn-text">正常</text>
						</button>
						<button 
							class="status-btn abnormal-btn"
							:class="{ 'active': item.inspection_result === 'abnormal' }"
							@click="selectStatus(index, 'abnormal')"
						>
							<text class="btn-text">异常</text>
						</button>
					</view>
				</view>
				
				<!-- 数值填报 -->
				<view v-else-if="item.inspectionType === '2'" class="numeric-section">
					<view class="numeric-card">
						<view class="input-row">
							<text class="input-label">填写数值：</text>
							<input 
								class="numeric-input" 
								type="number" 
								v-model="item.numeric_value" 
								placeholder="请输入"
								@input="onNumericInput(index, $event)"
								@blur="validateNumericValue(index)"
							/>
							<text class="unit" v-if="item.unit">{{ item.unit }}</text>
						</view>
						
						<!-- 数值范围提示 -->
						
						
						<!-- 数值验证状态 -->
						
					</view>
				</view>
				
				<!-- 异常描述 -->
				<view v-if="item.inspection_result === 'abnormal'" class="abnormal-section">
					<view class="abnormal-card">
						<text class="abnormal-label">异常描述：</text>
						<textarea 
							class="abnormal-textarea" 
							v-model="item.abnormal_description" 
							placeholder="请详细描述异常情况..."
							maxlength="200"
							@input="onAbnormalDescriptionInput(index, $event)"
						/>
						<view class="textarea-footer">
							<text class="char-count">{{ item.abnormal_description ? item.abnormal_description.length : 0 }}/200</text>
							<text class="required-tip" v-if="!item.abnormal_description">* 必填</text>
						</view>
					</view>
				</view>
				
				<!-- 照片上传 - 修改为单张上传 -->
				<view class="photo-section">
					<view class="photo-card">
						<view class="photo-header">
							<text class="photo-label">现场照片</text>
							<text class="photo-count">({{ item.photos && item.photos.length > 0 ? '已上传' : '未上传' }})</text>
						</view>
						
						<view class="photo-list">
							<!-- 已上传的照片 -->
							<view 
								class="photo-item" 
								v-if="item.photos && item.photos.length > 0"
							>
								<image 
									class="photo-image" 
									:src="item.photos" 
									mode="aspectFill"
									@click="previewImage(item.photos, 0)"
								></image>
								<view class="photo-overlay">
									<view class="photo-actions">
										<view class="action-btn preview-btn" @click="previewImage(item.photos, 0)">
											<text class="action-icon">👁️</text>
										</view>
										<view class="action-btn delete-btn" @click="removePhoto(index)">
											<text class="action-icon">🗑️</text>
										</view>
									</view>
								</view>
							</view>
							
							<!-- 添加照片按钮 -->
							<view 
								class="add-photo-btn" 
								v-if="!item.photos || item.photos.length === 0"
								@click="addPhoto(index)"
							>
								<view class="add-icon">+</view>
								<text class="add-text">添加照片</text>
								
							</view>
							
							<!-- 替换照片按钮 -->
							<view 
								class="replace-photo-btn" 
								v-if="item.photos && item.photos.length > 0"
								@click="replacePhoto(index)"
							>
								<text class="replace-icon">🔄</text>
								<text class="replace-text">更换照片</text>
							</view>
						</view>
						
						<text class="photo-tip" v-if="!item.photos || item.photos.length === 0">
							请上传现场照片
						</text>
					</view>
				</view>
				
				<view class="divider"></view>
			</view>
		</view>
		
		<!-- 底部操作按钮 -->
		<view class="bottom-actions">
			<view class="progress-indicator">
				<text class="progress-text">
					已完成 {{ getCompletedCount() }}/{{ inspectionData.length }} 项
				</text>
				<progress 
					class="progress-bar" 
					:percent="getProgressPercent()" 
					stroke-width="4"
					activeColor="#457cde"
				/>
			</view>
			
			<view class="btn-group">
				
				<view 
					class="btn submit-btn" 
					:class="{ 'disabled': !isAllCompleted() }"
					@click="submitInspection"
				>
					<text class="btn-icon">📤</text>
					<text class="btn-text">提交巡检</text>
				</view>
			</view>
		</view>
	</view>
</template>

<script>
	export default {
		data() {
			return {
				apiBaseUrl: 'https://fdjt.qdsteel.com:5018/prod-api/mes/gd/',
				area_id: "",
				inspectionLocation: "",
				inspectionTime: this.formatDate(new Date()),
				inspector: "",
				inspectionData: []
			};
		},
		onLoad: function(options) {
			var that = this;
			const token = uni.getStorageSync('token');
			this.inspector= uni.getStorageSync('username');
			uni.request({
				url: 'https://fdjt.qdsteel.com:5018/prod-api/mes/cmproduction/' +options.deviceId,
				method: 'GET',
				header: {
					'content-type': 'application/json',
					'Authorization': `Bearer ${token}`
				},
				success: function(res) {
					
					that.inspectionLocation=res.data.data.name
					
					
				}
			});		

			
			this.area_id=options.id
			if (token) {
				uni.request({
					url: 'https://fdjt.qdsteel.com:5018/prod-api/mes/f/find/' +options.deviceId,
					method: 'GET',
					header: {
						'content-type': 'application/json',
						'Authorization': `Bearer ${token}`
					},
					success: function(res) {
						
						if (res.data && res.data.data) {
							that.inspectionData = res.data.data.map(item => {
								return {
									...item,
									inspection_result: item.inspection_result || '',
									numeric_value: item.numeric_value || null,
									abnormal_description: item.abnormal_description || '',
									photos: item.photos || [],
									...(typeof item.photos === 'string' ? { 
										photos: item.photos ? [item.photos] : [] 
									} : {})
								};
							});
							
						}
					},
					fail: function(err) {
						console.error('请求失败:', err);
						uni.showToast({
							title: '加载数据失败',
							icon: 'none'
						});
					}
				});
			}
			
			
		},
		
		methods: {
			
			selectStatus(index, status) {
				
				this.inspectionData[index].inspection_result = status;
				
				if (status === 'normal') {
					this.inspectionData[index].abnormal_description = '';
				}
				
				this.$forceUpdate();
			},
			
			onNumericInput(index, event) {
				const value = event.detail.value;
				
				this.inspectionData[index].numeric_value = value;
				
				if (value !== '' && value !== null) {
					const numValue = parseFloat(value);
					const item = this.inspectionData[index];
					
					if ((item.min_value !== null && numValue < item.min_value) || 
						(item.max_value !== null && numValue > item.max_value)) {
						item.inspection_result = 'abnormal';
					} else {
						item.inspection_result = 'normal';
						item.abnormal_description = '';
					}
				}
			},
			
			validateNumericValue(index) {
				const item = this.inspectionData[index];
				if (item.numeric_value === null || item.numeric_value === '') {
					return;
				}
				
				const value = parseFloat(item.numeric_value);
				if (isNaN(value)) {
					uni.showToast({
						title: '请输入有效数字',
						icon: 'none'
					});
				}
			},
			
			
			
			onAbnormalDescriptionInput(index, event) {
				this.inspectionData[index].abnormal_description = event.detail.value;
			},
			
			getValidationClass(item) {
				if (item.numeric_value === null || item.numeric_value === '') {
					return '';
				}
				
				const value = parseFloat(item.numeric_value);
				if ((item.min_value !== null && value < item.min_value) || 
					(item.max_value !== null && value > item.max_value)) {
					return 'invalid';
				}
				return 'valid';
			},
			
			getValidationText(item) {
				if (item.numeric_value === null || item.numeric_value === '') {
					return '';
				}
				
				const value = parseFloat(item.numeric_value);
				if (item.min_value !== null && value < item.min_value) {
					return `过低（低于最小值 ${item.min_value}${item.unit || ''}）`;
				}
				if (item.max_value !== null && value > item.max_value) {
					return `过高（超过最大值 ${item.max_value}${item.unit || ''}）`;
				}
				return '正常范围';
			},
			
			// 添加照片（单张）
			addPhoto(index) {
				var that=this
				uni.chooseImage({
					count: 1, // 只选择一张
					sizeType: ['compressed'],
					sourceType: ['camera'],
					success: (res) => {
						uni.uploadFile({
							url: 'https://fdjt.qdsteel.com:5018/prod-api/common/upload', //仅为示例，非真实的接口地址
							filePath: res.tempFilePaths[0],
							name: 'file',
							success: (uploadFileRes) => {
								that.inspectionData[index].photos='https://fdjt.qdsteel.com:5018/prod-api'+JSON.parse(uploadFileRes.data).fileName;	
							}
						});
						this.$forceUpdate();
						
						uni.showToast({
							title: '照片上传成功',
							icon: 'success'
						});
					},
					fail: (err) => {
						console.error('选择照片失败:', err);
						uni.showToast({
							title: '照片选择失败',
							icon: 'none'
						});
					}
				});
			},
			
			// 替换照片
			replacePhoto(index) {
				var that =this;
				uni.chooseImage({
					count: 1,
					sizeType: ['compressed'],
					sourceType: ['camera', 'album'],
					success: (res) => {
						uni.uploadFile({
							url: 'https://fdjt.qdsteel.com:5018/prod-api/common/upload', //仅为示例，非真实的接口地址
							filePath: res.tempFilePaths[0],
							name: 'file',
							success: (uploadFileRes) => {
								
								that.inspectionData[index].photos='https://fdjt.qdsteel.com:5018/prod-api'+JSON.parse(uploadFileRes.data).fileName;
							}
						});
						
						// 替换照片
						
						
						this.$forceUpdate();
						
						uni.showToast({
							title: '照片已更换',
							icon: 'success'
						});
					},
					fail: (err) => {
						console.error('选择照片失败:', err);
						uni.showToast({
							title: '照片选择失败',
							icon: 'none'
						});
					}
				});
			},
			// 移除照片
			removePhoto(index) {
				console.log(`移除照片: 第${index}项`);
				this.inspectionData[index].photos = [];
				
				this.$forceUpdate();
				
				uni.showToast({
					title: '照片已移除',
					icon: 'success'
				});
			},
			
			previewImage(images, current) {
				if (!images || images.length === 0) return;
				
				uni.previewImage({
					urls: images,
					current
				});
			},
			
			formatDate(date) {
				const year = date.getFullYear();
				const month = String(date.getMonth() + 1).padStart(2, '0');
				const day = String(date.getDate()).padStart(2, '0');
				const hour = String(date.getHours()).padStart(2, '0');
				const minute = String(date.getMinutes()).padStart(2, '0');
				return `${year}-${month}-${day} ${hour}:${minute}`;
			},
			
			getCompletedCount() {
				return this.inspectionData.filter(item => {
					if (item.inspectionType === '1') {
						return item.inspection_result !== '';
					} else if (item.inspectionType === '2') {
						return item.numeric_value !== null && item.numeric_value !== '';
					}
					return false;
				}).length;
			},
			
			getProgressPercent() {
				const total = this.inspectionData.length;
				const completed = this.getCompletedCount();
				return Math.round((completed / total) * 100);
			},
			
			isAllCompleted() {
				return this.getCompletedCount() === this.inspectionData.length;
			},
			
			submitInspection() {
				const validationResult = this.validateData();
				if (!validationResult.valid) {
					uni.showToast({
						title: validationResult.message,
						icon: 'none'
					});
					return;
				}
				
				const submitData = {
					location: this.inspectionLocation,
					time: this.inspectionTime,
					inspector: this.inspector,
					inspection_data: this.inspectionData.map(item => ({
						...item,
						numeric_value: item.inspectionType === '2' ? parseFloat(item.numeric_value) : null,
						photos: item.photos || [],
						inspection_result: item.inspection_result || '',
						abnormal_description: item.abnormal_description || ''
					})),
					submit_time: new Date().getTime()
				};
				
				
				
				uni.showModal({
					title: '提交确认',
					content: '确认提交巡检记录吗？',
					success: (res) => {
						if (res.confirm) {
							this.doSubmit(submitData);
						}
					}
				});
			},
			
			validateData() {
				var flag=0;
				for (let i = 0; i < this.inspectionData.length; i++) {
					const item = this.inspectionData[i];
					
					if(item.photos.length >0){
						flag=1;
					}
					if (item.inspectionType === '1') {
						if (!item.inspection_result) {
							return {
								valid: false,
								message: `请选择第${i + 1}项的状态`
							};
						}
						
						if (item.inspection_result === 'abnormal' && !item.abnormal_description.trim()) {
							return {
								valid: false,
								message: `请填写第${i + 1}项的异常描述`
							};
						}
					}
					
					if (item.inspectionType === '2') {
						if (item.numeric_value === null || item.numeric_value === '') {
							return {
								valid: false,
								message: `请填写第${i + 1}项的数值`
							};
						}
						
						const value = parseFloat(item.numeric_value);
						if (isNaN(value)) {
							return {
								valid: false,
								message: `第${i + 1}项的数值格式不正确`
							};
						}
					}
				}
				if(flag==0){
					return  {
								valid: false,
								message: `请至少上传一张照片`
							};
				}
				return { valid: true };
			},
			
			doSubmit(submitData) {
				uni.showLoading({
					title: '提交中...',
					mask: true
				});
				console.log(submitData)
				uni.request({
					url: 'https://fdjt.qdsteel.com:5018/prod-api/mes/r/insert' ,
					method: 'POST',
					header: {
						'content-type': 'application/json',
					},
					data:submitData,
					success: function(res) {
							
							setTimeout(() => {
								uni.hideLoading();
								
								uni.showToast({
									title: '提交成功',
									icon: 'success',
									duration: 2000
								});
								
								setTimeout(() => {
									uni.navigateTo({
										url: '/pages/index/index'
									});
								}, 1500);
							}, 2000);
						
						
						
					}
				});

			}
		}
	};
</script>

<style lang="scss">
	.contentBox {
		padding: 20rpx;
		background-color: #f5f7fa;
		min-height: 100vh;
	}
	
	.big-title {
		font-size: 40rpx;
		font-weight: bold;
		color: #2c3e50;
		text-align: center;
		margin: 20rpx 0 30rpx;
		padding-bottom: 20rpx;
		border-bottom: 2rpx solid #457cde;
	}
	
	.info-section {
		background: linear-gradient(135deg, #ffffff, #f8fafc);
		border-radius: 20rpx;
		padding: 30rpx;
		margin-bottom: 30rpx;
		box-shadow: 0 4rpx 20rpx rgba(69, 124, 222, 0.1);
		border: 1rpx solid #e1e8f0;
		
		.info-item {
			display: flex;
			align-items: center;
			margin-bottom: 20rpx;
			
			&:last-child {
				margin-bottom: 0;
			}
			
			.info-label {
				font-size: 28rpx;
				color: #4a5568;
				font-weight: 500;
				width: 140rpx;
			}
			
			.info-value {
				font-size: 28rpx;
				color: #2d3748;
				font-weight: 600;
				flex: 1;
			}
		}
	}
	
	.questionBox {
		background: white;
		border-radius: 20rpx;
		padding: 30rpx;
		margin-bottom: 24rpx;
		box-shadow: 0 2rpx 16rpx rgba(0, 0, 0, 0.06);
		border: 1rpx solid #e2e8f0;
	}
	
	.question-title {
		display: flex;
		align-items: center;
		margin-bottom: 30rpx;
		padding-bottom: 20rpx;
		border-bottom: 1rpx solid #f1f5f9;
		
		.question-order {
			font-size: 32rpx;
			font-weight: bold;
			color: #457cde;
			margin-right: 16rpx;
			background: #ebf4ff;
			width: 48rpx;
			height: 48rpx;
			border-radius: 50%;
			display: flex;
			align-items: center;
			justify-content: center;
		}
		
		.question-content {
			font-size: 32rpx;
			color: #2d3748;
			font-weight: 600;
			flex: 1;
			line-height: 1.4;
		}
	}
	
	// 状态选择样式
	.status-section {
		margin-bottom: 30rpx;
		
		.btn-group-status {
			display: flex;
			gap: 24rpx;
			
			.status-btn {
				flex: 1;
				height: 100rpx;
				border-radius: 16rpx;
				border: none;
				display: flex;
				align-items: center;
				justify-content: center;
				font-size: 28rpx;
				font-weight: 500;
				transition: all 0.3s ease;
				position: relative;
				overflow: hidden;
				
				&::after {
					display: none;
				}
				
				.btn-text {
					font-size: 28rpx;
				}
				
				&.normal-btn {
					background: linear-gradient(135deg, #f0f9ff, #e0f2fe);
					color: #0ea5e9;
					border: 2rpx solid #bae6fd;
					
					&.active {
						background: linear-gradient(135deg, #0ea5e9, #0284c7);
						color: white;
						border-color: #0ea5e9;
						box-shadow: 0 4rpx 20rpx rgba(14, 165, 233, 0.3);
					}
				}
				
				&.abnormal-btn {
					background: linear-gradient(135deg, #fef2f2, #fee2e2);
					color: #ef4444;
					border: 2rpx solid #fecaca;
					
					&.active {
						background: linear-gradient(135deg, #ef4444, #dc2626);
						color: white;
						border-color: #ef4444;
						box-shadow: 0 4rpx 20rpx rgba(239, 68, 68, 0.3);
					}
				}
			}
		}
	}
	
	// 数值填报样式
	.numeric-section {
		margin-bottom: 30rpx;
		
		.numeric-card {
			background: #f8fafc;
			border-radius: 16rpx;
			padding: 24rpx;
			border: 1rpx solid #e2e8f0;
		}
		
		.input-row {
			display: flex;
			align-items: center;
			margin-bottom: 20rpx;
			
			.input-label {
				font-size: 28rpx;
				color: #4a5568;
				font-weight: 500;
				margin-right: 20rpx;
				white-space: nowrap;
			}
			
			.numeric-input {
				flex: 1;
				height: 88rpx;
				padding: 0 24rpx;
				border: 2rpx solid #e2e8f0;
				border-radius: 12rpx;
				font-size: 32rpx;
				font-weight: 500;
				background: white;
				color: #2d3748;
				transition: all 0.3s ease;
				
				&:focus {
					border-color: #457cde;
					box-shadow: 0 0 0 3rpx rgba(69, 124, 222, 0.1);
				}
			}
			
			.unit {
				font-size: 28rpx;
				color: #718096;
				margin-left: 16rpx;
				font-weight: 500;
			}
		}
		
		.range-hint {
			display: flex;
			align-items: center;
			margin-bottom: 16rpx;
			padding: 12rpx 16rpx;
			background: #edf2f7;
			border-radius: 8rpx;
			
			.hint-label {
				font-size: 24rpx;
				color: #718096;
				margin-right: 12rpx;
			}
			
			.hint-value {
				font-size: 26rpx;
				color: #4a5568;
				font-weight: 500;
			}
		}
		
		.validation-status {
			padding: 12rpx 16rpx;
			border-radius: 8rpx;
			
			.validation-text {
				font-size: 26rpx;
				font-weight: 500;
				
				&.valid {
					color: #10b981;
					background: #d1fae5;
				}
				
				&.invalid {
					color: #ef4444;
					background: #fee2e2;
				}
			}
		}
	}
	
	// 异常描述样式
	.abnormal-section {
		margin-bottom: 30rpx;
		
		.abnormal-card {
			background: #fff5f5;
			border-radius: 16rpx;
			padding: 24rpx;
			border: 1rpx solid #fed7d7;
		}
		
		.abnormal-label {
			font-size: 28rpx;
			color: #ef4444;
			font-weight: 500;
			margin-bottom: 16rpx;
			display: block;
		}
		
		.abnormal-textarea {
			width: 100%;
			height: 200rpx;
			padding: 20rpx;
			border: 2rpx solid #fed7d7;
			border-radius: 12rpx;
			font-size: 28rpx;
			background: white;
			color: #2d3748;
			line-height: 1.5;
			margin-bottom: 12rpx;
			transition: all 0.3s ease;
			
			&:focus {
				border-color: #ef4444;
				box-shadow: 0 0 0 3rpx rgba(239, 68, 68, 0.1);
			}
		}
		
		.textarea-footer {
			display: flex;
			justify-content: space-between;
			align-items: center;
			
			.char-count {
				font-size: 24rpx;
				color: #a0aec0;
			}
			
			.required-tip {
				font-size: 24rpx;
				color: #ef4444;
				font-weight: 500;
			}
		}
	}
	
	// 照片上传样式 - 单张上传
	.photo-section {
		margin-bottom: 20rpx;
		
		.photo-card {
			background: #f8fafc;
			border-radius: 16rpx;
			padding: 24rpx;
			border: 1rpx solid #e2e8f0;
		}
		
		.photo-header {
			display: flex;
			align-items: center;
			margin-bottom: 24rpx;
			
			.photo-label {
				font-size: 28rpx;
				color: #4a5568;
				font-weight: 500;
				margin-right: 12rpx;
			}
			
			.photo-count {
				font-size: 24rpx;
				color: #718096;
			}
		}
		
		.photo-list {
			display: flex;
			flex-direction: column;
			align-items: center;
			gap: 20rpx;
			margin-bottom: 16rpx;
			
			.photo-item {
				position: relative;
				width: 100%;
				height: 300rpx;
				border-radius: 12rpx;
				overflow: hidden;
				box-shadow: 0 4rpx 12rpx rgba(0, 0, 0, 0.1);
				
				.photo-image {
					width: 100%;
					height: 100%;
				}
				
				.photo-overlay {
					position: absolute;
					top: 0;
					left: 0;
					width: 100%;
					height: 100%;
					background: rgba(0, 0, 0, 0.5);
					opacity: 0;
					transition: opacity 0.3s ease;
					display: flex;
					align-items: center;
					justify-content: center;
					
					&:hover {
						opacity: 1;
					}
					
					.photo-actions {
						display: flex;
						gap: 40rpx;
						
						.action-btn {
							width: 80rpx;
							height: 80rpx;
							border-radius: 50%;
							display: flex;
							align-items: center;
							justify-content: center;
							background: rgba(255, 255, 255, 0.9);
							transition: all 0.3s ease;
							
							&:active {
								transform: scale(0.9);
							}
							
							.action-icon {
								font-size: 36rpx;
							}
							
							&.delete-btn {
								background: rgba(239, 68, 68, 0.9);
								color: white;
							}
						}
					}
				}
			}
			
			.add-photo-btn {
				width: 100%;
				height: 300rpx;
				border: 2rpx dashed #cbd5e0;
				border-radius: 12rpx;
				display: flex;
				flex-direction: column;
				align-items: center;
				justify-content: center;
				color: #718096;
				transition: all 0.3s ease;
				
				&:active {
					background: #edf2f7;
					border-color: #457cde;
					color: #457cde;
				}
				
				.add-icon {
					font-size: 80rpx;
					margin-bottom: 20rpx;
					font-weight: 300;
					color: #457cde;
				}
				
				.add-text {
					font-size: 28rpx;
					margin-bottom: 8rpx;
					color: #4a5568;
				}
				
				.add-hint {
					font-size: 24rpx;
					color: #a0aec0;
				}
			}
			
			.replace-photo-btn {
				width: 100%;
				height: 80rpx;
				background: #457cde;
				border-radius: 12rpx;
				display: flex;
				align-items: center;
				justify-content: center;
				color: white;
				font-size: 28rpx;
				font-weight: 500;
				transition: all 0.3s ease;
				
				&:active {
					background: #2a5db0;
					transform: scale(0.98);
				}
				
				.replace-icon {
					margin-right: 12rpx;
					font-size: 32rpx;
				}
			}
		}
		
		.photo-tip {
			font-size: 24rpx;
			color: #a0aec0;
			display: block;
			text-align: center;
			padding-top: 12rpx;
			border-top: 1rpx solid #e2e8f0;
		}
	}
	
	.divider {
		height: 1rpx;
		background: linear-gradient(to right, transparent, #e2e8f0, transparent);
		margin-top: 30rpx;
	}
	
	// 底部操作区域
	.bottom-actions {
		position: sticky;
		bottom: 0;
		background: white;
		padding: 30rpx 20rpx 40rpx;
		margin-top: 20rpx;
		border-top: 1rpx solid #e2e8f0;
		box-shadow: 0 -4rpx 20rpx rgba(0, 0, 0, 0.05);
	}
	
	.progress-indicator {
		margin-bottom: 30rpx;
		
		.progress-text {
			display: block;
			font-size: 26rpx;
			color: #4a5568;
			text-align: center;
			margin-bottom: 16rpx;
			font-weight: 500;
		}
		
		.progress-bar {
			width: 100%;
		}
	}
	
	.btn-group {
		display: flex;
		gap: 24rpx;
		
		.btn {
			flex: 1;
			height: 96rpx;
			border-radius: 48rpx;
			display: flex;
			align-items: center;
			justify-content: center;
			font-size: 30rpx;
			font-weight: 600;
			transition: all 0.3s ease;
			
			.btn-icon {
				margin-right: 12rpx;
				font-size: 32rpx;
			}
			
			&.save-btn {
				background: linear-gradient(135deg, #ffffff, #f8fafc);
				color: #457cde;
				border: 2rpx solid #457cde;
				
				&:active {
					background: linear-gradient(135deg, #f1f5f9, #e2e8f0);
					transform: scale(0.98);
				}
			}
			
			&.submit-btn {
				background: linear-gradient(135deg, #457cde, #2a5db0);
				color: white;
				box-shadow: 0 6rpx 24rpx rgba(69, 124, 222, 0.4);
				
				&:active {
					background: linear-gradient(135deg, #2a5db0, #1e4b8f);
					transform: scale(0.98);
				}
				
				&.disabled {
					background: linear-gradient(135deg, #cbd5e0, #a0aec0);
					box-shadow: none;
					opacity: 0.7;
					
					&:active {
						transform: none;
					}
				}
			}
		}
	}
</style>