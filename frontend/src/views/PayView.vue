<template>
  <div class="pay-container">
    <!-- Loading State -->
    <div v-if="loading" class="loading-state">
      <el-icon class="is-loading" :size="48"><Loading /></el-icon>
      <p>加载中...</p>
    </div>

    <!-- Error State -->
    <div v-else-if="error" class="error-state">
      <el-icon :size="64" color="#F56C6C"><CircleClose /></el-icon>
      <h2>收款码不存在</h2>
      <p>该链接已失效或不存在</p>
      <el-button type="primary" @click="$router.push('/')">返回首页</el-button>
    </div>

    <!-- Payment Content -->
    <template v-else>
      <!-- Header -->
      <div class="pay-header">
        <div class="user-info">
          <el-avatar :size="60" class="animate-float">
            <el-icon :size="32"><User /></el-icon>
          </el-avatar>
          <h2>{{ qrcodeData?.nickname || '收款人' }}</h2>
          <p v-if="qrcodeData?.description">{{ qrcodeData.description }}</p>
        </div>
      </div>

      <!-- Auto-detect hint -->
      <div v-if="detectedApp" class="detect-hint animate-fade-in">
        <el-alert
          :title="`检测到您正在使用 ${detectedApp.name}，点击下方的 ${detectedApp.name} 按钮即可支付`"
          :type="detectedApp.type"
          :closable="false"
          show-icon
        />
      </div>

      <!-- Payment Options -->
      <div class="payment-options">
        <div
          v-if="qrcodeData?.qqImage"
          class="payment-card qq-bg animate-fade-in"
          style="animation-delay: 0.1s"
          @click="showQR('qq')"
        >
          <div class="card-content">
            <el-icon :size="40"><ChatDotRound /></el-icon>
            <h3>QQ 支付</h3>
            <p>点击使用 QQ 扫码支付</p>
          </div>
          <el-icon class="arrow-icon" :size="24"><ArrowRight /></el-icon>
        </div>

        <div
          v-if="qrcodeData?.wechatImage"
          class="payment-card wechat-bg animate-fade-in"
          style="animation-delay: 0.2s"
          @click="showQR('wechat')"
        >
          <div class="card-content">
            <el-icon :size="40"><ChatLineRound /></el-icon>
            <h3>微信支付</h3>
            <p>点击使用微信扫码支付</p>
          </div>
          <el-icon class="arrow-icon" :size="24"><ArrowRight /></el-icon>
        </div>

        <div
          v-if="qrcodeData?.alipayImage"
          class="payment-card alipay-bg animate-fade-in"
          style="animation-delay: 0.3s"
          @click="showQR('alipay')"
        >
          <div class="card-content">
            <el-icon :size="40"><Wallet /></el-icon>
            <h3>支付宝</h3>
            <p>点击使用支付宝扫码支付</p>
          </div>
          <el-icon class="arrow-icon" :size="24"><ArrowRight /></el-icon>
        </div>
      </div>

      <!-- Footer -->
      <div class="pay-footer">
        <p>由 三合一收款码 提供技术支持</p>
      </div>
    </template>

    <!-- QR Code Dialog -->
    <el-dialog
      v-model="dialogVisible"
      :title="selectedPlatform?.label"
      width="90%"
      max-width="400px"
      center
      class="qr-dialog"
    >
      <div class="qr-dialog-content">
        <div class="qr-image-container">
          <img :src="selectedQRImage" :alt="selectedPlatform?.label" />
        </div>
        <p class="qr-hint">请使用{{ selectedPlatform?.label }}扫描上方二维码</p>
        <el-button
          v-if="selectedPlatform?.scheme"
          type="primary"
          size="large"
          class="open-app-btn"
          @click="openApp"
        >
          打开{{ selectedPlatform?.label }}
        </el-button>
      </div>
    </el-dialog>
  </div>
</template>

<script>
import { ref, onMounted, computed } from 'vue'
import { useRoute } from 'vue-router'
import { getQRCode } from '../api'

const platformConfig = {
  qq: {
    label: 'QQ',
    type: 'info',
    scheme: 'mqq://',
    uaKeywords: ['QQ', 'MQQBrowser']
  },
  wechat: {
    label: '微信',
    type: 'success',
    scheme: 'weixin://',
    uaKeywords: ['MicroMessenger', 'WeChat']
  },
  alipay: {
    label: '支付宝',
    type: 'warning',
    scheme: 'alipays://',
    uaKeywords: ['Alipay', 'AliApp']
  }
}

export default {
  name: 'PayView',
  props: ['id'],
  setup(props) {
    const route = useRoute()
    const loading = ref(true)
    const error = ref(false)
    const qrcodeData = ref(null)
    const dialogVisible = ref(false)
    const selectedPlatformKey = ref('')
    const detectedApp = ref(null)

    const id = props.id || route.params.id

    const selectedPlatform = computed(() => {
      return platformConfig[selectedPlatformKey.value]
    })

    const selectedQRImage = computed(() => {
      if (!qrcodeData.value) return ''
      const baseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000'
      switch (selectedPlatformKey.value) {
        case 'qq': return baseUrl + qrcodeData.value.qqImage
        case 'wechat': return baseUrl + qrcodeData.value.wechatImage
        case 'alipay': return baseUrl + qrcodeData.value.alipayImage
        default: return ''
      }
    })

    onMounted(async () => {
      try {
        const response = await getQRCode(id)
        if (response.data.success) {
          qrcodeData.value = response.data.data
          detectApp()
        } else {
          error.value = true
        }
      } catch (err) {
        console.error(err)
        error.value = true
      } finally {
        loading.value = false
      }
    })

    const detectApp = () => {
      const ua = navigator.userAgent
      for (const [key, config] of Object.entries(platformConfig)) {
        if (config.uaKeywords.some(keyword => ua.includes(keyword))) {
          detectedApp.value = { name: config.label, type: config.type }
          break
        }
      }
    }

    const showQR = (platform) => {
      selectedPlatformKey.value = platform
      dialogVisible.value = true
    }

    const openApp = () => {
      const scheme = platformConfig[selectedPlatformKey.value]?.scheme
      if (scheme) {
        window.location.href = scheme
      }
    }

    return {
      loading,
      error,
      qrcodeData,
      dialogVisible,
      selectedPlatform,
      selectedQRImage,
      detectedApp,
      showQR,
      openApp
    }
  }
}
</script>

<style scoped>
.pay-container {
  min-height: 100vh;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  padding: 20px;
}

.loading-state,
.error-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 100vh;
  color: white;
  text-align: center;
}

.loading-state p,
.error-state p {
  margin-top: 16px;
  opacity: 0.8;
}

.error-state h2 {
  margin: 16px 0 8px;
}

.pay-header {
  text-align: center;
  padding: 40px 0 20px;
  color: white;
}

.user-info {
  display: flex;
  flex-direction: column;
  align-items: center;
}

.user-info h2 {
  margin-top: 12px;
  font-size: 1.3rem;
}

.user-info p {
  margin-top: 4px;
  opacity: 0.8;
  font-size: 0.9rem;
}

.detect-hint {
  max-width: 400px;
  margin: 0 auto 20px;
}

.payment-options {
  max-width: 400px;
  margin: 0 auto;
  display: flex;
  flex-direction: column;
  gap: 16px;
  padding-bottom: 40px;
}

.payment-card {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 24px;
  border-radius: 16px;
  color: white;
  cursor: pointer;
  transition: all 0.3s ease;
  position: relative;
  overflow: hidden;
}

.payment-card::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: linear-gradient(135deg, rgba(255,255,255,0.2) 0%, transparent 100%);
  opacity: 0;
  transition: opacity 0.3s;
}

.payment-card:hover::before {
  opacity: 1;
}

.payment-card:hover {
  transform: translateY(-3px);
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.2);
}

.card-content {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.card-content h3 {
  font-size: 1.2rem;
  font-weight: 600;
}

.card-content p {
  font-size: 0.85rem;
  opacity: 0.9;
}

.arrow-icon {
  opacity: 0.7;
}

.pay-footer {
  text-align: center;
  padding: 20px;
  color: white;
  opacity: 0.6;
  font-size: 0.8rem;
}

/* Dialog Styles */
.qr-dialog :deep(.el-dialog) {
  border-radius: 20px;
  overflow: hidden;
}

.qr-dialog :deep(.el-dialog__header) {
  text-align: center;
  padding: 20px;
  margin: 0;
}

.qr-dialog :deep(.el-dialog__body) {
  padding: 0 20px 20px;
}

.qr-dialog-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 16px;
}

.qr-image-container {
  background: white;
  border-radius: 16px;
  padding: 16px;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.1);
}

.qr-image-container img {
  max-width: 250px;
  max-height: 250px;
  display: block;
}

.qr-hint {
  color: #606266;
  font-size: 0.9rem;
  text-align: center;
}

.open-app-btn {
  width: 100%;
  border-radius: 12px;
  height: 44px;
}

@media (max-width: 768px) {
  .pay-container {
    padding: 10px;
  }

  .pay-header {
    padding: 20px 0 10px;
  }

  .payment-card {
    padding: 18px;
  }
}
</style>
