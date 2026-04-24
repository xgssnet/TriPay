/**
 * QR Code Platform Detector
 * Detects which payment platform a QR code belongs to by analyzing its content
 */

// Platform URL patterns
const PLATFORM_PATTERNS = {
  qq: [
    /qq\.com/i,
    /mqq/i,
    /qqpay/i,
    /p\.qq\.com/i,
    /qianbao\.qq\.com/i
  ],
  wechat: [
    /wx\.qq\.com/i,
    /weixin\.qq\.com/i,
    /wxp:\/\//i,
    /weixin:\/\//i,
    /tenpay\.com/i
  ],
  alipay: [
    /alipay\.com/i,
    /alipay\.cn/i,
    /alipays:\/\//i,
    /alipay:\/\//i,
    /mapi\.com/i
  ]
};

/**
 * Detect platform from QR code content
 * @param {string} qrContent - The decoded QR code content
 * @returns {string|null} - Platform type or null if unknown
 */
export function detectPlatformFromQR(qrContent) {
  if (!qrContent || typeof qrContent !== 'string') {
    return null;
  }

  for (const [platform, patterns] of Object.entries(PLATFORM_PATTERNS)) {
    for (const pattern of patterns) {
      if (pattern.test(qrContent)) {
        return platform;
      }
    }
  }

  return null;
}

/**
 * Decode QR code from image data URL using a lightweight approach
 * Note: For production, use a dedicated QR decoding library like jsQR
 * @param {string} imageDataUrl - Base64 image data URL
 * @returns {Promise<string|null>} - Decoded QR content or null
 */
export async function decodeQRFromImage(imageDataUrl) {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      canvas.width = img.width;
      canvas.height = img.height;
      ctx.drawImage(img, 0, 0);

      // Try to use jsQR if available
      try {
        // Dynamic import for jsQR
        import('jsqr').then((jsQR) => {
          const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
          const code = jsQR.default(imageData.data, imageData.width, imageData.height, {
            inversionAttempts: 'attemptBoth'
          });
          resolve(code ? code.data : null);
        }).catch(() => {
          // jsQR not available, return null
          resolve(null);
        });
      } catch {
        resolve(null);
      }
    };
    img.onerror = () => resolve(null);
    img.src = imageDataUrl;
  });
}

/**
 * Auto-detect platform from uploaded image
 * @param {File} file - Image file
 * @returns {Promise<string|null>} - Detected platform or null
 */
export async function detectPlatformFromImage(file) {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = async (e) => {
      const dataUrl = e.target.result;
      const qrContent = await decodeQRFromImage(dataUrl);
      if (qrContent) {
        const platform = detectPlatformFromQR(qrContent);
        resolve(platform);
      } else {
        resolve(null);
      }
    };
    reader.onerror = () => resolve(null);
    reader.readAsDataURL(file);
  });
}

/**
 * Get platform display info
 * @param {string} platform - Platform type
 * @returns {Object} - Platform display info
 */
export function getPlatformInfo(platform) {
  const info = {
    qq: { name: 'QQ', color: '#12B7F5', icon: 'ChatDotRound' },
    wechat: { name: '微信', color: '#07C160', icon: 'ChatLineRound' },
    alipay: { name: '支付宝', color: '#1677FF', icon: 'Wallet' }
  };
  return info[platform] || { name: '未知', color: '#909399', icon: 'QuestionFilled' };
}
