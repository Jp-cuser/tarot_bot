const fs = require('fs');

function loadJSON(filePath, defaultData = {}) {
    if (fs.existsSync(filePath)) {
        try {
            return JSON.parse(fs.readFileSync(filePath, 'utf8'));
        } catch (e) {
            console.error(`データの読み込みエラー (${filePath}):`, e);
            return defaultData;
        }
    }
    return defaultData;
}

function saveJSON(filePath, data) {
    try {
        fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
        return true;
    } catch (e) {
        console.error(`データの保存エラー (${filePath}):`, e);
        return false;
    }
}

module.exports = {
    loadJSON,
    saveJSON
};
