const { createCanvas, loadImage } = require('@napi-rs/canvas');
const path = require('path');
const fs = require('fs');
const { stripEmoji } = require('../utils/string');

/**
 * 動物画像（ねずみ、ラットなど）のCanvasを生成する
 */
const generateAnimalCanvas = async (chosen, titleMsg, themeColor) => {
    try {
        const imagePath = path.resolve(__dirname, '..', '..', 'images', chosen.file);
        if (!fs.existsSync(imagePath)) return null;

        const img = await loadImage(imagePath);
        const canvasWidth = 600;
        const contentWidth = 500;
        
        const aspectRatio = img.width / img.height;
        const drawHeight = contentWidth / Math.max(0.1, aspectRatio);
        
        const headerHeight = 100;
        const footerHeight = 80;
        const canvasHeight = headerHeight + drawHeight + footerHeight;

        const canvas = createCanvas(canvasWidth, canvasHeight);
        const ctx = canvas.getContext('2d');

        ctx.fillStyle = '#1e1e24';
        ctx.fillRect(0, 0, canvasWidth, canvasHeight);
        ctx.strokeStyle = themeColor;
        ctx.lineWidth = 10;
        ctx.strokeRect(0, 0, canvasWidth, canvasHeight);

        ctx.textAlign = 'center';
        ctx.font = 'bold 32px NotoSansJP';
        ctx.fillStyle = themeColor;
        ctx.fillText(titleMsg, canvasWidth / 2, 60);

        const imgX = (canvasWidth - contentWidth) / 2;
        const imgY = headerHeight;
        ctx.drawImage(img, imgX, imgY, contentWidth, drawHeight);
        
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 4;
        ctx.strokeRect(imgX, imgY, contentWidth, drawHeight);

        ctx.font = 'bold 26px NotoSansJP';
        ctx.fillStyle = '#ffffff';
        ctx.fillText(`この子の名前は ${chosen.name} だちゅ！`, canvasWidth / 2, imgY + drawHeight + 50);

        return await canvas.encode('png');
    } catch (error) {
        throw error;
    }
};

/**
 * クイズ用Canvasを生成する
 */
const generateQuizCanvas = async (chosen, isResult = false, isCorrect = false, options = {}) => {
    try {
        const imagePath = path.resolve(__dirname, '..', '..', 'images', chosen.file);
        if (!fs.existsSync(imagePath)) return null;

        const img = await loadImage(imagePath);
        const canvasWidth = 600;
        const contentWidth = 500;
        const aspectRatio = img.width / img.height;
        const drawHeight = contentWidth / Math.max(0.1, aspectRatio);
        
        const headerHeight = 120;
        const footerHeight = 40;
        const canvasHeight = headerHeight + drawHeight + footerHeight;

        const canvas = createCanvas(canvasWidth, canvasHeight);
        const ctx = canvas.getContext('2d');

        let themeColor = isResult ? (isCorrect ? '#00FF00' : '#FF0000') : '#FFA500';

        ctx.fillStyle = '#1e1e24';
        ctx.fillRect(0, 0, canvasWidth, canvasHeight);
        ctx.strokeStyle = themeColor;
        ctx.lineWidth = 10;
        ctx.strokeRect(0, 0, canvasWidth, canvasHeight);

        ctx.textAlign = 'center';
        
        if (!isResult) {
            ctx.font = 'bold 36px NotoSansJP';
            ctx.fillStyle = themeColor;
            ctx.fillText('ねずみクイズ！', canvasWidth / 2, 50);
            ctx.font = '20px NotoSansJP';
            ctx.fillStyle = '#ffffff';
            ctx.fillText('この画像の子は「ねずみ」かな？', canvasWidth / 2, 90);
        } else {
            ctx.font = 'bold 36px NotoSansJP';
            ctx.fillStyle = themeColor;
            ctx.fillText(isCorrect ? '正解だちゅ！' : 'あちゃ〜、残念だちゅ…', canvasWidth / 2, 50);
            ctx.font = '20px NotoSansJP';
            ctx.fillStyle = '#ffffff';
            ctx.fillText(`この子の正体は ${chosen.name} でした！`, canvasWidth / 2, 90);
        }

        const imgX = (canvasWidth - contentWidth) / 2;
        const imgY = headerHeight;
        ctx.drawImage(img, imgX, imgY, contentWidth, drawHeight);
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 4;
        ctx.strokeRect(imgX, imgY, contentWidth, drawHeight);

        return await canvas.encode('png');
    } catch (error) {
        throw error;
    }
};

module.exports = {
    generateAnimalCanvas,
    generateQuizCanvas
};
