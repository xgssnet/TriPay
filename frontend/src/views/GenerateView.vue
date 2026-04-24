<template>
  <div class="generate-container">
    <div class="result-card glass-card animate-fade-in">
      <div class="success-icon">
        <el-icon :size="64" color="#67C23A"><CircleCheck /></el-icon>
      </div>
      <h1 class="title">生成成功！</h1>
      <p class="subtitle">你的三合一收款码已创建</p>

      <div class="qr-display-section">
        <div class="main-qr" ref="qrContainer">
          <div class="qr-header">
            <h3 v-if="qrcodeData?.nickname">{{ qrcodeData.nickname }}</h3>
            <p v-if="qrcodeData?.description">{{ qrcodeData.description }}</p>
          </div>
          <div class="qr-code-wrapper">
            <canvas ref="qrCanvas"></canvas>
          </div>
          <div class="qr-footer">
            <div class="platform-icons">
              <span v-if="qrcodeData?.qqImage" class="platform-tag qq-tag">QQ</span>
              <span v-if="qrcodeData?.wechatImage" class="platform-tag wechat-tag">微信</span>
              <span v-if="qrcodeData?.alipayImage" class="platform-tag alipay-tag">支付宝</span>
            </div>
            <p class="scan-hint">扫一扫，选择支付方式</p>
          </div>
        </div>
      </div>

      <div class="action-buttons">
        <el-button
          type="primary"
          size="large"
          class="action-btn copy-btn"
          @click="copyLink"
        >
          <el-icon><DocumentCopy /></el-icon>
          复制链接
        </el-button>

        <el-button
          type="success"
          size="large"
          class="action-btn preview-btn"
          @click="previewPage"
        >
          <el-icon><View /></el-icon>
          预览页面
        </el-button>

        <el-button
          type="warning"
          size="large"
          class="action-btn download-btn"
          @click="downloadQR"
          v-if="qrDataUrl"
        >
          <el-icon><Download /></el-icon>
          下载二维码
        </el-button>
      </div>

      <div class="link-section">
        <p class="link-label">你的专属链接</p>
        <div class="link-box">
          <code>{{ payUrl }}</code>
        </div>
      </div>

      <el-divider />

      <div class="tips-section">
        <h3>使用提示</h3>
        <ul>
          <li>将链接分享给他人，对方扫码即可看到收款码</li>
          <li>手机访问时会自动识别支付应用</li>
          <li>可以保存上方二维码图片，直接展示给他人扫描</li>
        </ul>
      </div>

      <el-button
        type="info"
        plain
        class="back-btn"
        @click="$router.push('/')"
      >
        <el-icon><ArrowLeft /></el-icon>
        返回首页
      </el-button>
    </div>
  </div>
</template>

<script>
import { ref, onMounted, nextTick, reactive } from 'vue'
import { useRoute } from 'vue-router'
import { ElMessage } from 'element-plus'
import QRCode from 'qrcode'
import { getQRCode } from '../api'

export default {
  name: 'GenerateView',
  props: ['id'],
  setup(props) {
    const route = useRoute()
    const qrCanvas = ref(null)
    const qrContainer = ref(null)
    const qrcodeData = ref(null)
    const qrDataUrl = ref('')
    const payUrl = ref('')

    const qrOptions = reactive({
      width: 200,
      margin: 2,
      color: {
        dark: '#000000',
        light: '#ffffff'
      }
    })

    const id = props.id || route.params.id
    payUrl.value = `${window.location.origin}/pay/${id}`

    onMounted(async () => {
      try {
        const response = await getQRCode(id)
        if (response.data.success) {
          qrcodeData.value = response.data.data
          await nextTick()
          generateQR()
        }
      } catch (error) {
        console.error(error)
        ElMessage.error('获取收款码信息失败')
      }
    })

    const generateQR = async () => {
      if (!qrCanvas.value) return
      try {
        await QRCode.toCanvas(qrCanvas.value, payUrl.value, qrOptions)
        qrDataUrl.value = qrCanvas.value.toDataURL('image/png')
      } catch (err) {
        console.error('QR generation failed:', err)
      }
    }

    const copyLink = () => {
      navigator.clipboard.writeText(payUrl.value).then(() => {
        ElMessage.success('链接已复制到剪贴板')
      }).catch(() => {
        // Fallback
        const input = document.createElement('input')
        input.value = payUrl.value
        document.body.appendChild(input)
        input.select()
        document.execCommand('copy')
        document.body.removeChild(input)
        ElMessage.success('链接已复制到剪贴板')
      })
    }

    const previewPage = () => {
      window.open(payUrl.value, '_blank')
    }

    const downloadQR = () => {
      if (!qrDataUrl.value) return
      const link = document.createElement('a')
      link.download = `收款码-${id}.png`
      link.href = qrDataUrl.value
      link.click()
      ElMessage.success('二维码已下载')
    }

    return {
      qrCanvas,
      qrContainer,
      qrcodeData,
      qrDataUrl,
      payUrl,
      copyLink,
      previewPage,
      downloadQR
    }
  }
}
</script>

<style scoped>
.generate-container {
  max-width: 600px;
  margin: 0 auto;
  padding: 40px 20px;
  min-height: 100vh;
}

.result-card {
  padding: 40px;
  text-align: center;
}

.success-icon {
  margin-bottom: 20px;
  animation: pulse 2s ease-in-out infinite;
}

.title {
  font-size: 1.8rem;
  color: #303133;
  margin-bottom: 8px;
}

.subtitle {
  color: #909399;
  margin-bottom: 30px;
}

.qr-display-section {
  margin: 30px 0;
}

.main-qr {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border-radius: 20px;
  padding: 30px;
  color: white;
  max-width: 320px;
  margin: 0 auto;
}

.qr-header h3 {
  font-size: 1.2rem;
  margin-bottom: 4px;
}

.qr-header p {
  font-size: 0.85rem;
  opacity: 0.9;
  margin-bottom: 16px;
}

.qr-code-wrapper {
  background: white;
  border-radius: 16px;
  padding: 16px;
  margin: 16px 0;
  display: inline-block;
}

.qr-code-wrapper canvas {
  display: block;
}

.platform-icons {
  display: flex;
  justify-content: center;
  gap: 8px;
  margin-bottom: 8px;
}

.platform-tag {
  padding: 4px 12px;
  border-radius: 20px;
  font-size: 0.75rem;
  font-weight: 500;
}

.qq-tag { background: #12B7F5; }
.wechat-tag { background: #07C160; }
.alipay-tag { background: #1677FF; }

.scan-hint {
  font-size: 0.85rem;
  opacity: 0.9;
}

.action-buttons {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  justify-content: center;
  margin: 30px 0;
}

.action-btn {
  min-width: 140px;
  border-radius: 12px;
}

.copy-btn {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border: none;
}

.preview-btn {
  background: linear-gradient(135deg, #07C160 0%, #059B4C 100%);
  border: none;
}

.download-btn {
  background: linear-gradient(135deg, #FF6B6B 0%, #EE5A6F 100%);
  border: none;
}

.link-section {
  margin: 20px 0;
  padding: 16px;
  background: #f5f7fa;
  border-radius: 12px;
}

.link-label {
  font-size: 0.85rem;
  color: #909399;
  margin-bottom: 8px;
}

.link-box {
  word-break: break-all;
}

.link-box code {
  font-size: 0.85rem;
  color: #606266;
  background: white;
  padding: 8px 12px;
  border-radius: 8px;
  display: inline-block;
}

.tips-section {
  text-align: left;
  margin: 20px 0;
}

.tips-section h3 {
  font-size: 1rem;
  color: #303133;
  margin-bottom: 12px;
}

.tips-section ul {
  list-style: none;
  padding: 0;
}

.tips-section li {
  padding: 8px 0;
  color: #606266;
  font-size: 0.9rem;
  position: relative;
  padding-left: 20px;
}

.tips-section li::before {
  content: '•';
  color: #667eea;
  font-weight: bold;
  position: absolute;
  left: 0;
}

.back-btn {
  margin-top: 20px;
}

@media (max-width: 768px) {
  .generate-container {
    padding: 20px 10px;
  }

  .result-card {
    padding: 24px;
  }

  .action-buttons {
    flex-direction: column;
  }

  .action-btn {
    width: 100%;
  }
}
</style>
