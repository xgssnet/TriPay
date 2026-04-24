<template>
  <div class="home-container">
    <div class="hero-section animate-fade-in">
      <h1 class="title">
        <span class="gradient-text">三合一收款码</span>
      </h1>
      <p class="subtitle">将 QQ、微信、支付宝收款码合并为一个</p>
      <p class="description">上传你的收款码，生成专属链接，他人扫码即可选择支付方式</p>
    </div>

    <div class="upload-section glass-card animate-fade-in" style="animation-delay: 0.2s">
      <h2 class="section-title">上传收款码</h2>

      <el-form :model="form" ref="formRef" :rules="rules" label-position="top">
        <el-form-item label="收款人昵称（可选）" prop="nickname">
          <el-input
            v-model="form.nickname"
            placeholder="例如：张三的小店"
            size="large"
            maxlength="20"
            show-word-limit
          />
        </el-form-item>

        <el-form-item label="收款说明（可选）" prop="description">
          <el-input
            v-model="form.description"
            type="textarea"
            placeholder="例如：感谢您的支持！"
            size="large"
            maxlength="100"
            show-word-limit
            :rows="2"
          />
        </el-form-item>

        <div class="upload-grid">
          <div
            class="upload-item"
            v-for="(item, index) in uploadItems"
            :key="item.type"
          >
            <div
              class="upload-zone"
              :class="{ 'dragover': dragOverIndex === index, [`${item.type}-border`]: true, 'detected-mismatch': detectedPlatforms[item.type] && detectedPlatforms[item.type] !== item.type }"
              @dragover.prevent="dragOverIndex = index"
              @dragleave="dragOverIndex = -1"
              @drop.prevent="handleDrop($event, item.type)"
              @click="triggerUpload(item.type)"
            >
              <input
                type="file"
                :ref="el => fileInputs[item.type] = el"
                accept="image/*"
                style="display: none"
                @change="handleFileChange($event, item.type)"
              />

              <template v-if="!previews[item.type]">
                <div class="upload-icon" :class="`${item.type}-theme`">
                  <el-icon :size="48">
                    <component :is="item.icon" />
                  </el-icon>
                </div>
                <p class="upload-text">{{ item.label }}</p>
                <p class="upload-hint">点击或拖拽上传</p>
                <p class="upload-format">支持 JPG、PNG、GIF</p>
              </template>

              <template v-else>
                <div class="preview-container">
                  <img :src="previews[item.type]" :alt="item.label" class="preview-image" />
                  <div class="preview-overlay">
                    <el-button
                      type="danger"
                      circle
                      size="small"
                      @click.stop="removeFile(item.type)"
                    >
                      <el-icon><Delete /></el-icon>
                    </el-button>
                  </div>
                  <div v-if="detectedPlatforms[item.type]" class="detected-badge" :class="detectedPlatforms[item.type]">
                    {{ getPlatformName(detectedPlatforms[item.type]) }}
                  </div>
                </div>
              </template>
            </div>
          </div>
        </div>

        <el-form-item>
          <el-button
            type="primary"
            size="large"
            class="submit-btn"
            :loading="loading"
            :disabled="!hasAnyFile"
            @click="submitForm"
          >
            <el-icon><MagicStick /></el-icon>
            生成三合一收款码
          </el-button>
        </el-form-item>
      </el-form>
    </div>

    <div class="features-section">
      <div class="feature-item" v-for="(feature, index) in features" :key="index">
        <el-icon :size="32" class="feature-icon">
          <component :is="feature.icon" />
        </el-icon>
        <h3>{{ feature.title }}</h3>
        <p>{{ feature.desc }}</p>
      </div>
    </div>
  </div>
</template>

<script>
import { ref, reactive, computed } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { uploadQRCodes } from '../api'
import { detectPlatformFromImage, getPlatformInfo } from '../utils/qrDetector'

export default {
  name: 'HomeView',
  setup() {
    const router = useRouter()
    const formRef = ref(null)
    const loading = ref(false)
    const dragOverIndex = ref(-1)
    const fileInputs = reactive({})
    const files = reactive({})
    const previews = reactive({})
    const detectedPlatforms = reactive({})

    const form = reactive({
      nickname: '',
      description: ''
    })

    const rules = {
      nickname: [
        { max: 20, message: '昵称不能超过20个字符', trigger: 'blur' }
      ],
      description: [
        { max: 100, message: '说明不能超过100个字符', trigger: 'blur' }
      ]
    }

    const uploadItems = [
      { type: 'qq', label: 'QQ 收款码', icon: 'ChatDotRound' },
      { type: 'wechat', label: '微信收款码', icon: 'ChatLineRound' },
      { type: 'alipay', label: '支付宝收款码', icon: 'Wallet' }
    ]

    const features = [
      { icon: 'Mobile', title: '手机友好', desc: '完美适配手机扫码访问' },
      { icon: 'Link', title: '专属链接', desc: '生成短链接，方便分享' },
      { icon: 'Shield', title: '安全可靠', desc: '图片本地存储，隐私保护' }
    ]

    const hasAnyFile = computed(() => {
      return Object.keys(files).length > 0
    })

    const getPlatformName = (platform) => {
      const info = getPlatformInfo(platform)
      return info.name
    }

    const triggerUpload = (type) => {
      if (fileInputs[type]) {
        fileInputs[type].click()
      }
    }

    const handleFileChange = (event, type) => {
      const file = event.target.files[0]
      if (file) {
        processFile(file, type)
      }
    }

    const handleDrop = (event, type) => {
      dragOverIndex.value = -1
      const file = event.dataTransfer.files[0]
      if (file) {
        processFile(file, type)
      }
    }

    const processFile = async (file, type) => {
      if (!file.type.startsWith('image/')) {
        ElMessage.error('请上传图片文件')
        return
      }
      if (file.size > 5 * 1024 * 1024) {
        ElMessage.error('文件大小不能超过5MB')
        return
      }

      files[type] = file
      const reader = new FileReader()
      reader.onload = (e) => {
        previews[type] = e.target.result
      }
      reader.readAsDataURL(file)

      // Auto-detect platform from QR code
      const detectedPlatform = await detectPlatformFromImage(file)
      if (detectedPlatform) {
        detectedPlatforms[type] = detectedPlatform
        if (detectedPlatform !== type) {
          const platformName = getPlatformName(detectedPlatform)
          ElMessage.warning(`检测到这是 ${platformName} 收款码，但上传到了 ${getPlatformName(type)} 区域`)
        } else {
          ElMessage.success(`成功识别为 ${getPlatformName(detectedPlatform)} 收款码`)
        }
      } else {
        ElMessage.info(`${getPlatformName(type)} 收款码已选择（未能自动识别）`)
      }
    }

    const removeFile = (type) => {
      delete files[type]
      delete previews[type]
      delete detectedPlatforms[type]
      if (fileInputs[type]) {
        fileInputs[type].value = ''
      }
    }

    const submitForm = async () => {
      if (!hasAnyFile.value) {
        ElMessage.warning('请至少上传一个收款码')
        return
      }

      loading.value = true
      try {
        const formData = new FormData()
        formData.append('nickname', form.nickname)
        formData.append('description', form.description)

        Object.keys(files).forEach(key => {
          formData.append(key, files[key])
        })

        const response = await uploadQRCodes(formData)
        if (response.data.success) {
          ElMessage.success('生成成功！')
          router.push(`/generate/${response.data.id}`)
        }
      } catch (error) {
        console.error(error)
        ElMessage.error(error.response?.data?.error || '生成失败，请重试')
      } finally {
        loading.value = false
      }
    }

    return {
      formRef,
      form,
      rules,
      loading,
      dragOverIndex,
      fileInputs,
      previews,
      detectedPlatforms,
      uploadItems,
      features,
      hasAnyFile,
      getPlatformName,
      triggerUpload,
      handleFileChange,
      handleDrop,
      removeFile,
      submitForm
    }
  }
}
</script>

<style scoped>
.home-container {
  max-width: 800px;
  margin: 0 auto;
  padding: 40px 20px;
  min-height: 100vh;
}

.hero-section {
  text-align: center;
  margin-bottom: 40px;
  color: white;
}

.title {
  font-size: 2.5rem;
  font-weight: 700;
  margin-bottom: 16px;
}

.subtitle {
  font-size: 1.2rem;
  opacity: 0.9;
  margin-bottom: 8px;
}

.description {
  font-size: 0.9rem;
  opacity: 0.7;
}

.upload-section {
  padding: 40px;
  margin-bottom: 40px;
}

.section-title {
  text-align: center;
  margin-bottom: 30px;
  font-size: 1.5rem;
  color: #303133;
}

.upload-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 20px;
  margin-bottom: 30px;
}

.upload-item {
  width: 100%;
}

.upload-zone {
  width: 100%;
  min-height: 200px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  position: relative;
}

.qq-border:hover { border-color: var(--qq-color) !important; }
.wechat-border:hover { border-color: var(--wechat-color) !important; }
.alipay-border:hover { border-color: var(--alipay-color) !important; }

.upload-zone.detected-mismatch {
  border-color: #F56C6C !important;
  background: #fef0f0;
}

.upload-icon {
  margin-bottom: 12px;
}

.upload-text {
  font-size: 1rem;
  font-weight: 500;
  color: #303133;
  margin-bottom: 4px;
}

.upload-hint {
  font-size: 0.8rem;
  color: #909399;
  margin-bottom: 4px;
}

.upload-format {
  font-size: 0.75rem;
  color: #c0c4cc;
}

.preview-container {
  position: relative;
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
}

.preview-image {
  max-width: 150px;
  max-height: 150px;
  border-radius: 8px;
  object-fit: contain;
}

.preview-overlay {
  position: absolute;
  top: 8px;
  right: 8px;
  opacity: 0;
  transition: opacity 0.3s;
}

.preview-container:hover .preview-overlay {
  opacity: 1;
}

.detected-badge {
  position: absolute;
  bottom: 8px;
  left: 50%;
  transform: translateX(-50%);
  padding: 4px 12px;
  border-radius: 20px;
  font-size: 0.75rem;
  font-weight: 500;
  color: white;
}

.detected-badge.qq { background: #12B7F5; }
.detected-badge.wechat { background: #07C160; }
.detected-badge.alipay { background: #1677FF; }

.submit-btn {
  width: 100%;
  height: 50px;
  font-size: 1.1rem;
  border-radius: 12px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border: none;
}

.submit-btn:hover {
  background: linear-gradient(135deg, #5a67d8 0%, #6b46c1 100%);
  transform: translateY(-2px);
  box-shadow: 0 10px 20px rgba(102, 126, 234, 0.4);
}

.features-section {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 20px;
}

.feature-item {
  text-align: center;
  padding: 30px 20px;
  color: white;
}

.feature-item h3 {
  font-size: 1.1rem;
  margin: 12px 0 8px;
}

.feature-item p {
  font-size: 0.9rem;
  opacity: 0.8;
}

.feature-icon {
  color: white;
  opacity: 0.9;
}

@media (max-width: 768px) {
  .home-container {
    padding: 20px 10px;
  }

  .title {
    font-size: 1.8rem;
  }

  .upload-section {
    padding: 20px;
  }

  .upload-grid {
    grid-template-columns: 1fr;
  }

  .upload-zone {
    min-height: 160px;
  }
}
</style>
