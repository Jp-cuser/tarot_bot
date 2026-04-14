// Canvasで長い文章を指定の幅で綺麗に折り返して描画する関数
function drawCanvasText(ctx, text, x, y, maxWidth, lineHeight) {
    const paragraphs = text.split('\n');
    let currentY = y;
    for (const p of paragraphs) {
        if (p === '') {
            currentY += lineHeight;
            continue;
        }
        let line = '';
        for (let i = 0; i < p.length; i++) {
            const testLine = line + p[i];
            const metrics = ctx.measureText(testLine);
            if (metrics.width > maxWidth && i > 0) {
                ctx.fillText(line, x, currentY);
                line = p[i];
                currentY += lineHeight;
            } else {
                line = testLine;
            }
        }
        ctx.fillText(line, x, currentY);
        currentY += lineHeight;
    }
    return currentY;
}

// 事前に文章の高さを計算して、キャンバスの大きさを決める関数
function measureTextHeight(ctx, text, maxWidth, lineHeight) {
    const paragraphs = text.split('\n');
    let height = 0;
    for (const p of paragraphs) {
        if (p === '') {
            height += lineHeight;
            continue;
        }
        let line = '';
        for (let i = 0; i < p.length; i++) {
            const testLine = line + p[i];
            const metrics = ctx.measureText(testLine);
            if (metrics.width > maxWidth && i > 0) {
                height += lineHeight;
                line = p[i];
            } else {
                line = testLine;
            }
        }
        height += lineHeight;
    }
    return height;
}

module.exports = {
    drawCanvasText,
    measureTextHeight
};
