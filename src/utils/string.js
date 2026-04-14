/**
 * 絵文字を取り除くユーティリティ（Canvas描画時の文字化け防止用）
 * @param {string} str 
 * @returns {string}
 */
function stripEmoji(str) {
    if (!str) return '';
    return str
        .replace(/[\uD800-\uDBFF][\uDC00-\uDFFF]/g, '') // サロゲートペア（絵文字など）
        .replace(/[\u2600-\u27BF]/g, '')               // 装飾記号
        .trim();
}

module.exports = {
    stripEmoji
};
