const express = require('express');
const cors = require('cors');
const sqlite3 = require('sqlite3').verbose();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { v4: uuidv4 } = require('uuid');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Ensure upload directory exists
const uploadDir = path.join(__dirname, 'uploads', 'qrcodes');
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
}

// SQLite Database
const db = new sqlite3.Database(path.join(__dirname, 'database.sqlite'));

db.serialize(() => {
    db.run(`CREATE TABLE IF NOT EXISTS qrcodes (
        id TEXT PRIMARY KEY,
        qq_image TEXT,
        wechat_image TEXT,
        alipay_image TEXT,
        nickname TEXT,
        description TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        view_count INTEGER DEFAULT 0
    )`);
});

// Multer storage configuration
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
        const uniqueName = `${Date.now()}-${Math.round(Math.random() * 1E9)}${path.extname(file.originalname)}`;
        cb(null, uniqueName);
    }
});

const upload = multer({
    storage: storage,
    limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
    fileFilter: (req, file, cb) => {
        const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
        if (allowedTypes.includes(file.mimetype)) {
            cb(null, true);
        } else {
            cb(new Error('只允许上传图片文件'));
        }
    }
});

// Upload QR codes
app.post('/api/qrcode', upload.fields([
    { name: 'qq', maxCount: 1 },
    { name: 'wechat', maxCount: 1 },
    { name: 'alipay', maxCount: 1 }
]), (req, res) => {
    try {
        const { nickname, description } = req.body;
        const files = req.files;

        if (!files || (!files.qq && !files.wechat && !files.alipay)) {
            return res.status(400).json({ error: '请至少上传一个收款码' });
        }

        const id = uuidv4().slice(0, 8); // Short ID
        const qqImage = files.qq ? `/uploads/qrcodes/${files.qq[0].filename}` : null;
        const wechatImage = files.wechat ? `/uploads/qrcodes/${files.wechat[0].filename}` : null;
        const alipayImage = files.alipay ? `/uploads/qrcodes/${files.alipay[0].filename}` : null;

        db.run(
            `INSERT INTO qrcodes (id, qq_image, wechat_image, alipay_image, nickname, description)
             VALUES (?, ?, ?, ?, ?, ?)`,
            [id, qqImage, wechatImage, alipayImage, nickname || null, description || null],
            function(err) {
                if (err) {
                    console.error(err);
                    return res.status(500).json({ error: '保存失败' });
                }

                res.json({
                    success: true,
                    id: id,
                    url: `http://localhost:${PORT}/p/${id}`
                });
            }
        );
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: '服务器错误' });
    }
});

// Get QR code info
app.get('/api/qrcode/:id', (req, res) => {
    const { id } = req.params;

    db.get('SELECT * FROM qrcodes WHERE id = ?', [id], (err, row) => {
        if (err) {
            return res.status(500).json({ error: '查询失败' });
        }
        if (!row) {
            return res.status(404).json({ error: '未找到收款码' });
        }

        // Update view count
        db.run('UPDATE qrcodes SET view_count = view_count + 1 WHERE id = ?', [id]);

        res.json({
            success: true,
            data: {
                id: row.id,
                qqImage: row.qq_image,
                wechatImage: row.wechat_image,
                alipayImage: row.alipay_image,
                nickname: row.nickname,
                description: row.description,
                createdAt: row.created_at
            }
        });
    });
});

// Payment page redirect
app.get('/p/:id', (req, res) => {
    const { id } = req.params;

    db.get('SELECT * FROM qrcodes WHERE id = ?', [id], (err, row) => {
        if (err || !row) {
            return res.status(404).send('收款码不存在');
        }

        // Update view count
        db.run('UPDATE qrcodes SET view_count = view_count + 1 WHERE id = ?', [id]);

        // Serve the payment page (will be built by frontend)
        res.redirect(`http://localhost:5173/pay/${id}`);
    });
});

// Health check
app.get('/api/health', (req, res) => {
    res.json({ status: 'ok' });
});

// Error handling
app.use((error, req, res, next) => {
    if (error instanceof multer.MulterError) {
        if (error.code === 'LIMIT_FILE_SIZE') {
            return res.status(400).json({ error: '文件大小不能超过5MB' });
        }
    }
    res.status(500).json({ error: error.message || '服务器错误' });
});

app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});

module.exports = app;