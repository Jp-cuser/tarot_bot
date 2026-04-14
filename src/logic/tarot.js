const { createCanvas, loadImage } = require('@napi-rs/canvas');
const path = require('path');
const fs = require('fs');
const { measureTextHeight, drawCanvasText } = require('../utils/canvas');
const { getJSTInfo } = require('../utils/time');
const { stripEmoji } = require('../utils/string');

function calculateScore(card, isReversed) {
    if (card.tone === 'positive') return isReversed ? 1 : 2;
    if (card.tone === 'negative') return isReversed ? -1 : -2;
    return 0;
}

function generateTarotStory(past, present, future) {
    const s1 = calculateScore(past.card, past.isReversed);
    const s2 = calculateScore(present.card, present.isReversed);
    const s3 = calculateScore(future.card, future.isReversed);
    const totalScore = s1 + s2 + s3;

    let storyType = "";
    let message = "";

    if (s1 < s2 && s2 < s3) {
        if (s1 < 0) {
            storyType = "夜明け（V字回復） 🌅";
            message = "過去はボロボロのチーズみたいに大変だったけど、ついに光が見えてきたよ！これからは美味しいごちそうが待ってる予感がするんだ、ちゅ！";
        } else {
            storyType = "飛躍（右肩上がり） 🚀";
            message = "今の勢いは本物だよ！まるで大きなひまわりの種を見つけた時みたいに、どんどん良くなっていくよ。自信を持って進んでね！";
        }
    } else if (s1 > s2 && s2 > s3) {
        storyType = "警告（右肩下がり） ⚠️";
        message = "ううっ、なんだか嫌な予感がするよ……。今は無理に動かず、巣穴でじっとして体力を蓄えるのが一番。足元をよーく確認してね！";
    } else {
        storyType = "つかの間の停滞 ☕";
        if (totalScore >= 0) {
            message = "今はちょっと一休み。お気に入りの場所で毛づくろいでもして、エネルギーを貯めよう。またすぐに良い波がやってくるはずだよ、ちゅ！";
        } else {
            message = "周りがバタバタしてるけど、慌てちゃダメだよ。一歩ずつ, 鼻をヒクヒクさせて慎重に進めば、きっと出口が見つかるからね。";
        }
    }
    return { storyType, totalScore, message };
}

function getSingleCardComment(card, isReversed) {
    if (!isReversed) {
        if (card.tone === 'positive') return "わあ！とっても良いカードだね。今日は美味しいチーズに出会えるかも！ちゅ！";
        if (card.tone === 'negative') return "ちょっと怖いカードだけど、正位置なら「新しい出発」の意味もあるよ。鼻をヒクヒクさせて慎重に進もう！";
        return "落ち着いた運勢だね。たまには巣穴でゆっくり毛づくろいするのもいいと思うよ。";
    } else {
        if (card.tone === 'positive') return "せっかくの良い運勢がひっくり返っちゃった。焦らずに、ひまわりの種でも食べて落ち着いてね。";
        if (card.tone === 'negative') return "運気が逆転して、悪いことが去っていくサインかも！これからどんどん良くなるよ, ちゅ！";
        return "なんだかソワソワしちゃうね。深呼吸して、尻尾を落ち着かせてから行動しよう！";
    }
}

/**
 * タロット1枚引きのCanvasを生成する
 */
const generateTarot1Canvas = async (user, selectedCard, isReversed, mouseWhisper, geminiExplanation) => {
    try {
        const cardWidth = 250;
        let drawHeight = 430; 
        let img = null;
        const imagePath = path.join(__dirname, '..', '..', 'images', selectedCard.image);
        
        if (fs.existsSync(imagePath)) {
            img = await loadImage(imagePath);
            const aspectRatio = img.width / img.height;
            drawHeight = cardWidth / Math.max(0.1, aspectRatio);
        }

        const safeExp = stripEmoji(geminiExplanation || "運命の糸が絡まってうまく読めなかったちゅ…。");
        const safeWhisper = stripEmoji(mouseWhisper);
        const safeMeaning = stripEmoji(isReversed ? selectedCard.reversed : selectedCard.upright);

        const dummyCanvas = createCanvas(1, 1);
        const dummyCtx = dummyCanvas.getContext('2d');
        const maxTextWidth = 600 - 120; 
        
        dummyCtx.font = '18px NotoSansJP';
        const meaningHeight = measureTextHeight(dummyCtx, safeMeaning, maxTextWidth, 26);
        dummyCtx.font = 'italic 18px NotoSansJP';
        const whisperHeight = measureTextHeight(dummyCtx, safeWhisper, maxTextWidth, 26);
        dummyCtx.font = '18px NotoSansJP';
        const expHeight = measureTextHeight(dummyCtx, safeExp, maxTextWidth, 26);

        const boxContentHeight = (24 + 15 + meaningHeight) + 25 + (24 + 15 + whisperHeight) + 25 + (24 + 15 + expHeight);
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
        ctx.strokeStyle = '#5865F2';
        ctx.lineWidth = 10;
        ctx.strokeRect(0, 0, canvasWidth, canvasHeight);

        ctx.textAlign = 'center';
        ctx.font = 'bold 32px NotoSansJP';
        ctx.fillStyle = '#FFD700';
        ctx.fillText(`${user.username}さんの今日のお告げ`, canvasWidth / 2, 60);

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
        ctx.fillText(selectedCard.name, centerX, textYStart);

        ctx.font = '20px NotoSansJP';
        ctx.fillStyle = isReversed ? '#FF6347' : '#e0e0e0';
        ctx.fillText(isReversed ? '逆位置' : '正位置', centerX, textYStart + 30);

        ctx.fillStyle = '#2b2d31';
        ctx.fillRect(40, boxStartY, canvasWidth - 80, boxHeight);
        ctx.strokeStyle = '#444';
        ctx.lineWidth = 2;
        ctx.strokeRect(40, boxStartY, canvasWidth - 80, boxHeight);

        let textY = boxStartY + 45; 
        const textX = 60;

        ctx.textAlign = 'left';
        ctx.font = 'bold 22px NotoSansJP';
        ctx.fillStyle = '#5865F2';
        ctx.fillText('カードの意味', textX, textY);
        textY += 30;
        ctx.font = '18px NotoSansJP';
        ctx.fillStyle = '#e0e0e0';
        textY = drawCanvasText(ctx, safeMeaning, textX, textY, maxTextWidth, 26);
        
        textY += 25;
        
        ctx.font = 'bold 22px NotoSansJP';
        ctx.fillStyle = '#00FA9A';
        ctx.fillText('ねずみのささやき', textX, textY);
        textY += 30;
        ctx.font = 'italic 18px NotoSansJP';
        ctx.fillStyle = '#e0e0e0';
        textY = drawCanvasText(ctx, safeWhisper, textX, textY, maxTextWidth, 26);

        textY += 25;

        ctx.font = 'bold 22px NotoSansJP';
        ctx.fillStyle = '#FFD700';
        ctx.fillText('ねずみの特別解説', textX, textY);
        textY += 30;
        ctx.font = '18px NotoSansJP';
        ctx.fillStyle = '#ffffff';
        drawCanvasText(ctx, safeExp, textX, textY, maxTextWidth, 26);

        ctx.textAlign = 'right';
        ctx.font = '16px NotoSansJP';
        ctx.fillStyle = '#888';
        ctx.fillText(`今日（${getJSTInfo().displayDate}）のお告げだちゅ！`, canvasWidth - 50, canvasHeight - 20);

        return await canvas.encode('png');
    } catch (error) {
        throw error;
    }
};

/**
 * タロット3枚引きのCanvasを生成する
 */
const generateTarot3Canvas = async (user, drawnResults, storyResult, geminiExplanation) => {
    try {
        const loadedImages = [];
        let maxDrawHeight = 0;
        const cardWidth = 200;

        for (let i = 0; i < 3; i++) {
            const imagePath = path.join(__dirname, '..', '..', 'images', drawnResults[i].card.image);
            if (fs.existsSync(imagePath)) {
                const img = await loadImage(imagePath);
                loadedImages.push(img);
                const aspectRatio = img.width / img.height;
                const drawHeight = cardWidth / Math.max(0.1, aspectRatio);
                if (drawHeight > maxDrawHeight) maxDrawHeight = drawHeight;
            } else {
                loadedImages.push(null);
                if (344 > maxDrawHeight) maxDrawHeight = 344;
            }
        }

        const safeExp = stripEmoji(geminiExplanation || "運命の糸が絡まってうまく読めなかったちゅ…。");
        const dummyCanvas = createCanvas(1, 1);
        const dummyCtx = dummyCanvas.getContext('2d');
        
        dummyCtx.font = 'italic 18px NotoSansJP';
        const storyHeight = measureTextHeight(dummyCtx, storyResult.message, 840 - 120, 26);
        dummyCtx.font = '18px NotoSansJP';
        const expHeight = measureTextHeight(dummyCtx, safeExp, 840 - 120, 26);

        const boxPadding = 40;
        const boxContentHeight = 24 + 35 + storyHeight + 25 + 22 + 35 + expHeight;
        const boxHeight = boxContentHeight + boxPadding * 2;

        const cardAreaTop = 140;
        const boxStartY = cardAreaTop + maxDrawHeight + 90; 
        
        const canvasWidth = 840;
        const canvasHeight = boxStartY + boxHeight + 50;

        const canvas = createCanvas(canvasWidth, canvasHeight);
        const ctx = canvas.getContext('2d');

        ctx.fillStyle = '#1e1e24';
        ctx.fillRect(0, 0, canvasWidth, canvasHeight);
        ctx.strokeStyle = '#5865F2';
        ctx.lineWidth = 10;
        ctx.strokeRect(0, 0, canvasWidth, canvasHeight);

        ctx.textAlign = 'center';
        ctx.font = 'bold 36px NotoSansJP';
        ctx.fillStyle = '#FFD700';
        ctx.fillText(`${user.username}さんの運命の3枚引き`, canvasWidth / 2, 60);

        const startX = 60;
        const gap = 60;

        for (let i = 0; i < 3; i++) {
            const result = drawnResults[i];
            const cx = startX + (cardWidth + gap) * i;
            const centerX = cx + cardWidth / 2;

            ctx.textAlign = 'center';
            ctx.font = 'bold 24px NotoSansJP';
            ctx.fillStyle = '#00FA9A';
            ctx.fillText(result.position, centerX, 120);

            const img = loadedImages[i];
            if (img) {
                const aspectRatio = img.width / img.height;
                const drawHeight = cardWidth / aspectRatio;
                const yOffset = (maxDrawHeight - drawHeight) / 2;
                ctx.save();
                ctx.translate(cx + cardWidth / 2, cardAreaTop + yOffset + drawHeight / 2);
                if (result.isReversed) ctx.rotate(Math.PI); 
                ctx.drawImage(img, -cardWidth / 2, -drawHeight / 2, cardWidth, drawHeight);
                ctx.restore();
            } else {
                ctx.fillStyle = '#333';
                ctx.fillRect(cx, cardAreaTop, cardWidth, 344);
                ctx.fillStyle = '#fff';
                ctx.font = '16px NotoSansJP';
                ctx.fillText('画像なし', centerX, cardAreaTop + 344 / 2);
            }

            const textYStart = cardAreaTop + maxDrawHeight + 35;
            ctx.font = 'bold 20px NotoSansJP';
            ctx.fillStyle = '#ffffff';
            ctx.fillText(result.card.name, centerX, textYStart);

            ctx.font = '18px NotoSansJP';
            ctx.fillStyle = result.isReversed ? '#FF6347' : '#e0e0e0';
            ctx.fillText(result.isReversed ? '逆位置' : '正位置', centerX, textYStart + 30);
        }

        ctx.fillStyle = '#2b2d31';
        ctx.fillRect(40, boxStartY, canvasWidth - 80, boxHeight);
        ctx.strokeStyle = '#444';
        ctx.lineWidth = 2;
        ctx.strokeRect(40, boxStartY, canvasWidth - 80, boxHeight);

        let textY = boxStartY + 45; 
        ctx.textAlign = 'left';
        ctx.font = 'bold 24px NotoSansJP';
        ctx.fillStyle = '#5865F2';
        ctx.fillText(`あなたの物語: ${stripEmoji(storyResult.storyType)}`, 60, textY);

        textY += 35;
        ctx.font = 'italic 18px NotoSansJP';
        ctx.fillStyle = '#e0e0e0';
        textY = drawCanvasText(ctx, storyResult.message, 60, textY, canvasWidth - 120, 26);

        textY += 25;
        ctx.font = 'bold 22px NotoSansJP';
        ctx.fillStyle = '#e0e0e0';
        ctx.fillText('ねずみの統合リーディング', 60, textY);

        textY += 35;
        ctx.font = '18px NotoSansJP';
        ctx.fillStyle = '#ffffff';
        drawCanvasText(ctx, safeExp, 60, textY, canvasWidth - 120, 26);

        ctx.textAlign = 'right';
        ctx.font = '16px NotoSansJP';
        ctx.fillStyle = '#888';
        ctx.fillText(`今日（${getJSTInfo().displayDate}）の運命だちゅ！`, canvasWidth - 50, canvasHeight - 20);

        return await canvas.encode('png');
    } catch (error) {
        throw error;
    }
};

module.exports = {
    calculateScore,
    generateTarotStory,
    getSingleCardComment,
    generateTarot1Canvas,
    generateTarot3Canvas
};
