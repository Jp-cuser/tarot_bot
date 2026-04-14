const { createCanvas, loadImage } = require('@napi-rs/canvas');
const path = require('path');
const fs = require('fs');
const { measureTextHeight, drawCanvasText } = require('../utils/canvas');
const { getJSTInfo } = require('../utils/time');
const { stripEmoji } = require('../utils/string');

/**
 * ルーン占いのCanvasを生成する
 */
const generateRuneCanvas = async (selectedRune, isReversed, geminiExplanation) => {
    try {
        const cardWidth = 250;
        let drawHeight = 250; 
        let img = null;
        const imagePath = path.join(__dirname, '..', '..', 'images', selectedRune.image);
        
        if (fs.existsSync(imagePath)) {
            img = await loadImage(imagePath);
            const aspectRatio = img.width / img.height;
            drawHeight = cardWidth / Math.max(0.1, aspectRatio);
        }

        const safeSymbol = selectedRune.symbol; 
        const safeStoneMeaning = stripEmoji(isReversed ? selectedRune.reversed : selectedRune.upright);
        const safeMeaningString = stripEmoji(selectedRune.meaning);
        const safeExp = stripEmoji(geminiExplanation || "石の言葉がうまく読み取れなかったちゅ…。");

        const dummyCanvas = createCanvas(1, 1);
        const dummyCtx = dummyCanvas.getContext('2d');
        const maxTextWidth = 600 - 120; 
        
        dummyCtx.font = '18px NotoSansJP';
        const meaningHeight = measureTextHeight(dummyCtx, safeStoneMeaning, maxTextWidth, 26);
        const expHeight = measureTextHeight(dummyCtx, safeExp, maxTextWidth, 26);

        const symbolTitleHeight = 24 + 15 + 26;
        const meaningSectionHeight = 24 + 15 + meaningHeight;
        const expSectionHeight = 24 + 15 + expHeight;
        
        const boxContentHeight = symbolTitleHeight + 25 + meaningSectionHeight + 25 + expSectionHeight;
        const boxPadding = 40;
        const boxHeight = boxContentHeight + boxPadding * 2;

        const cardAreaTop = 110;
        const textYStart = cardAreaTop + drawHeight + 35;
        const boxStartY = textYStart + 60; 
        
        const canvasWidth = 600; 
        const canvasHeight = boxStartY + boxHeight + 50; 

        const canvas = createCanvas(canvasWidth, canvasHeight);
        const ctx = canvas.getContext('2d');

        ctx.fillStyle = '#1e1e24';
        ctx.fillRect(0, 0, canvasWidth, canvasHeight);
        ctx.strokeStyle = '#8B4513'; 
        ctx.lineWidth = 10;
        ctx.strokeRect(0, 0, canvasWidth, canvasHeight);

        ctx.textAlign = 'center';
        ctx.font = 'bold 32px NotoSansJP';
        ctx.fillStyle = '#FFD700'; 
        ctx.fillText(`今日のルーン：${safeSymbol} ${selectedRune.name}`, canvasWidth / 2, 60);

        const centerX = canvasWidth / 2;
        if (img) {
            ctx.save();
            ctx.translate(centerX, cardAreaTop + drawHeight / 2);
            if (isReversed) ctx.rotate(Math.PI);
            ctx.drawImage(img, -cardWidth / 2, -drawHeight / 2, cardWidth, drawHeight);
            ctx.restore();
        } else {
            ctx.fillStyle = '#333';
            ctx.fillRect(centerX - cardWidth / 2, cardAreaTop, cardWidth, drawHeight);
            ctx.fillStyle = '#fff';
            ctx.font = '16px NotoSansJP';
            ctx.fillText('画像なし', centerX, cardAreaTop + drawHeight / 2);
        }

        ctx.font = 'bold 24px NotoSansJP';
        ctx.fillStyle = '#ffffff';
        ctx.fillText(selectedRune.name, centerX, textYStart);

        ctx.font = '20px NotoSansJP';
        ctx.fillStyle = isReversed ? '#FF6347' : '#e0e0e0';
        ctx.fillText(isReversed ? '逆位置' : '正位置', centerX, textYStart + 30);

        ctx.fillStyle = '#2b2d31';
        ctx.fillRect(40, boxStartY, canvasWidth - 80, boxHeight);
        ctx.strokeStyle = '#8B4513';
        ctx.lineWidth = 2;
        ctx.strokeRect(40, boxStartY, canvasWidth - 80, boxHeight);

        let textY = boxStartY + 45; 
        const textX = 60;

        ctx.textAlign = 'left';
        ctx.font = 'bold 22px NotoSansJP';
        ctx.fillStyle = '#D2691E';
        ctx.fillText('象徴', textX, textY);
        textY += 30;
        ctx.font = '18px NotoSansJP';
        ctx.fillStyle = '#e0e0e0';
        ctx.fillText(safeMeaningString, textX, textY);
        
        textY += 35; 
        
        ctx.font = 'bold 22px NotoSansJP';
        ctx.fillStyle = '#D2691E';
        ctx.fillText('石に刻まれた意味', textX, textY);
        textY += 30;
        ctx.font = '18px NotoSansJP';
        ctx.fillStyle = '#e0e0e0';
        textY = drawCanvasText(ctx, safeStoneMeaning, textX, textY, maxTextWidth, 26);

        textY += 25;

        ctx.font = 'bold 22px NotoSansJP';
        ctx.fillStyle = '#FFD700';
        ctx.fillText('ねずみのお告げ', textX, textY);
        textY += 30;
        ctx.font = '18px NotoSansJP';
        ctx.fillStyle = '#ffffff';
        drawCanvasText(ctx, safeExp, textX, textY, maxTextWidth, 26);

        ctx.textAlign = 'right';
        ctx.font = '16px NotoSansJP';
        ctx.fillStyle = '#888';
        ctx.fillText(`${getJSTInfo().displayDate} の石の言葉だちゅ！`, canvasWidth - 50, canvasHeight - 20);

        return await canvas.encode('png');
    } catch (error) {
        throw error;
    }
};

module.exports = {
    generateRuneCanvas
};
