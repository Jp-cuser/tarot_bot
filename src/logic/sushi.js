const { createCanvas, loadImage } = require('@napi-rs/canvas');
const path = require('path');
const fs = require('fs');
const { measureTextHeight, drawCanvasText } = require('../utils/canvas');

const generateOaisoCanvas = async (game, state, extraMsg, displayImageName) => {
    const canvasWidth = 600;
    const dummyCanvas = createCanvas(1, 1);
    const dummyCtx = dummyCanvas.getContext('2d');

    const orderText = game.orderedItems.length > 0 ? game.orderedItems.join('、') : 'まだ注文はないちゅ';

    dummyCtx.font = '20px NotoSansJP';
    const orderTextHeight = measureTextHeight(dummyCtx, orderText, canvasWidth - 120, 30);

    dummyCtx.font = 'bold 22px NotoSansJP';
    const msgHeight = extraMsg ? measureTextHeight(dummyCtx, extraMsg, canvasWidth - 120, 32) : 0;

    let img = null;
    let imgDrawHeight = 0;
    const imgContentWidth = 500;

    if (displayImageName) {
        const imagePath = path.join(__dirname, '..', '..', 'images', displayImageName);
        if (fs.existsSync(imagePath)) {
            img = await loadImage(imagePath);
            const aspectRatio = img.width / img.height;
            imgDrawHeight = imgContentWidth / Math.max(0.1, aspectRatio);
        }
    }

    const headerHeight = 100;
    const imgSectionHeight = img ? (imgDrawHeight + 40) : 0;
    const infoBoxHeight = 140;
    const orderBoxHeight = 60 + orderTextHeight;
    const msgBoxHeight = extraMsg ? 40 + msgHeight : 0;
    const padding = 20;

    const canvasHeight = headerHeight + imgSectionHeight + infoBoxHeight + padding + orderBoxHeight + padding + msgBoxHeight + padding + 40;

    const canvas = createCanvas(canvasWidth, canvasHeight);
    const ctx = canvas.getContext('2d');

    let mainColor = '#d4a373';
    if (state === 'result') {
        const diff = Math.abs(game.currentTotal - game.target);
        if (diff === 0) mainColor = '#FFD700';
        else if (diff <= 200) mainColor = '#00FA9A';
        else mainColor = '#ff6b6b';
    }

    ctx.fillStyle = '#2c221a';
    ctx.fillRect(0, 0, canvasWidth, canvasHeight);
    ctx.strokeStyle = mainColor;
    ctx.lineWidth = 10;
    ctx.strokeRect(0, 0, canvasWidth, canvasHeight);

    ctx.textAlign = 'center';
    ctx.font = 'bold 36px NotoSansJP';
    ctx.fillStyle = mainColor;
    ctx.fillText(state === 'result' ? 'おあいそ結果発表！！' : 'おあいそゲーム！', canvasWidth / 2, 60);

    let currentY = headerHeight;

    if (img) {
        const imgX = (canvasWidth - imgContentWidth) / 2;
        ctx.drawImage(img, imgX, currentY, imgContentWidth, imgDrawHeight);
        ctx.strokeStyle = '#faedcd';
        ctx.lineWidth = 4;
        ctx.strokeRect(imgX, currentY, imgContentWidth, imgDrawHeight);
        currentY += imgDrawHeight + 40;
    }

    ctx.fillStyle = '#3e2f23';
    ctx.fillRect(40, currentY, canvasWidth - 80, infoBoxHeight);
    ctx.strokeStyle = '#5a4535';
    ctx.lineWidth = 2;
    ctx.strokeRect(40, currentY, canvasWidth - 80, infoBoxHeight);

    ctx.textAlign = 'center';
    ctx.font = 'bold 26px NotoSansJP';
    ctx.fillStyle = '#fefae0';
    ctx.fillText(`目標金額: ${game.target}円`, canvasWidth / 2, currentY + 45);

    ctx.font = 'bold 32px NotoSansJP';
    ctx.fillStyle = state === 'result' ? mainColor : '#87CEEB';
    ctx.fillText(`現在の合計: ${state === 'result' ? game.currentTotal : '？？？'} 円`, canvasWidth / 2, currentY + 100);

    currentY += infoBoxHeight + padding;

    ctx.fillStyle = '#3e2f23';
    ctx.fillRect(40, currentY, canvasWidth - 80, orderBoxHeight);
    ctx.strokeRect(40, currentY, canvasWidth - 80, orderBoxHeight);

    ctx.textAlign = 'left';
    ctx.font = 'bold 22px NotoSansJP';
    ctx.fillStyle = '#d4a373';
    ctx.fillText('注文履歴', 60, currentY + 40);

    ctx.font = '20px NotoSansJP';
    ctx.fillStyle = '#e0e0e0';
    drawCanvasText(ctx, orderText, 60, currentY + 80, canvasWidth - 120, 30);

    currentY += orderBoxHeight + padding;

    if (extraMsg) {
        ctx.fillStyle = '#3e2f23';
        ctx.fillRect(40, currentY, canvasWidth - 80, msgBoxHeight);
        ctx.strokeRect(40, currentY, canvasWidth - 80, msgBoxHeight);

        ctx.textAlign = 'left';
        ctx.font = 'bold 22px NotoSansJP';
        ctx.fillStyle = '#ffffff';
        drawCanvasText(ctx, extraMsg, 60, currentY + 40, canvasWidth - 120, 32);
    }

    return await canvas.encode('png');
};

const generateSushiWelcomeCanvas = async () => {
    const canvasWidth = 800;
    const canvasHeight = 500;
    const canvas = createCanvas(canvasWidth, canvasHeight);
    const ctx = canvas.getContext('2d');

    ctx.fillStyle = '#3e2f23';
    ctx.fillRect(0, 0, canvasWidth, canvasHeight);
    ctx.strokeStyle = '#faedcd';
    ctx.lineWidth = 10;
    ctx.strokeRect(0, 0, canvasWidth, canvasHeight);

    ctx.textAlign = 'center';
    ctx.font = 'bold 40px NotoSansJP';
    ctx.fillStyle = '#ffffff';
    ctx.fillText('- ねずみ寿司へようこそ！ -', canvasWidth / 2, 70);

    ctx.font = '24px NotoSansJP';
    ctx.fillText('ウチ自慢のネタを見てってちゅ！', canvasWidth / 2, 110);

    let img = null;
    const imagePath = path.join(__dirname, '..', '..', 'images', 'daisho.jpg');
    if (fs.existsSync(imagePath)) {
        img = await loadImage(imagePath);
        const imgWidth = 500;
        const imgHeight = 250;
        ctx.drawImage(img, (canvasWidth - imgWidth) / 2, 140, imgWidth, imgHeight);
        ctx.strokeStyle = '#faedcd';
        ctx.lineWidth = 4;
        ctx.strokeRect((canvasWidth - imgWidth) / 2, 140, imgWidth, imgHeight);
    } else {
        ctx.fillStyle = '#2c221a';
        ctx.fillRect((canvasWidth - 500) / 2, 140, 500, 250);
        ctx.fillStyle = '#ffffff';
        ctx.fillText('大将仕込み中...', canvasWidth / 2, 265);
    }

    ctx.font = 'bold 30px NotoSansJP';
    ctx.fillStyle = '#ffffff';
    ctx.fillText('- 下のリストから注文してちゅ！ -', canvasWidth / 2, 450);

    return await canvas.encode('png');
};

module.exports = {
    generateOaisoCanvas,
    generateSushiWelcomeCanvas
};
