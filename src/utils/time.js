// 日本時間を取得する共通関数
function getJSTInfo() {
    const now = new Date();
    const jstStr = now.toLocaleString("en-US", { timeZone: "Asia/Tokyo" });
    const jstDate = new Date(jstStr);

    const y = jstDate.getFullYear();
    const m = jstDate.getMonth() + 1;
    const d = jstDate.getDate();

    return {
        dateStr: `${y}-${m}-${d}`,
        displayDate: `${y}/${m}/${d}`,
        seedDate: (y * 10000) + (m * 100) + d
    };
}

module.exports = {
    getJSTInfo
};
