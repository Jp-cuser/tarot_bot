const path = require('path');
const fs = require('fs');
const sharp = require('sharp');
const { AttachmentBuilder } = require('discord.js');

async function compressAndGetAttachment(imageFileName, targetWidth = 500, prefix = 'img') {
    try {
        const imagePath = path.join(__dirname, '..', '..', 'images', imageFileName);
        if (!fs.existsSync(imagePath)) return null;

        const imageBuffer = await sharp(imagePath)
            .resize(targetWidth)
            .webp({ quality: 60 })
            .toBuffer();

        const randomName = `${prefix}_${Date.now()}.webp`;
        return new AttachmentBuilder(imageBuffer, { name: randomName });
    } catch (error) {
        console.error('画像圧縮エラー:', error.message);
        return null;
    }
}

async function getCardImage(imageFileName, isReversed) {
    try {
        const imagePath = path.join(__dirname, '..', '..', 'images', imageFileName);
        let imageProcessor = sharp(imagePath).resize(500);
        if (isReversed) imageProcessor = imageProcessor.flip();

        const processedImageBuffer = await imageProcessor.webp({ quality: 60 }).toBuffer();
        const filename = `n_${Math.floor(Math.random() * 1000)}.webp`;
        return new AttachmentBuilder(processedImageBuffer, { name: filename });
    } catch (error) {
        console.error('画像処理エラー:', error.message);
        return null;
    }
}

async function getJokeImage(fileName) {
    const imagePath = path.join(__dirname, '..', '..', 'images', fileName);
    if (!fs.existsSync(imagePath)) {
        console.log(`❌ ファイル不在: ${imagePath}`);
        return null;
    }
    try {
        const imageProcessor = sharp(imagePath);
        const processedImageBuffer = await imageProcessor.webp({ quality: 60 }).toBuffer();
        const randomName = `j_${Math.floor(Math.random() * 1000)}.webp`;
        return new AttachmentBuilder(processedImageBuffer, { name: randomName });
    } catch (error) {
        console.error(`❌ ジョーク画像の処理に失敗: ${error.message}`);
        return null;
    }
}

async function getCardImageBase64(imageFileName, isReversed) {
    try {
        const imagePath = path.join(__dirname, '..', '..', 'images', imageFileName);
        if (!fs.existsSync(imagePath)) return null;

        let transform = sharp(imagePath)
            .resize(250)
            .webp({ quality: 80 });

        if (isReversed) {
            transform = transform.rotate(180);
        }

        const buffer = await transform.toBuffer();
        return `data:image/webp;base64,${buffer.toString('base64')}`;
    } catch (error) {
        console.error('Base64画像生成エラー:', error.message);
        return null;
    }
}

module.exports = {
    compressAndGetAttachment,
    getCardImage,
    getJokeImage,
    getCardImageBase64
};
