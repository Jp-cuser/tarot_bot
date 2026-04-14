/**
 * メッセージ削除ユーティリティ（busterからの移植）
 */

const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

/**
 * 再帰的にメッセージを取得して削除する
 * @param {TextChannel} channel 
 * @param {User} targetUser 
 * @param {number} targetTimestamp 
 * @param {string|null} lastMsgId 
 * @param {number} deletedCount 
 * @returns {Promise<number>}
 */
async function deleteMessagesRecursively(channel, targetUser, targetTimestamp, lastMsgId = null, deletedCount = 0) {
    const fetchOptions = { limit: 100 };
    if (lastMsgId) fetchOptions.before = lastMsgId;

    const fetchedMessages = await channel.messages.fetch(fetchOptions);
    if (fetchedMessages.size === 0) return deletedCount;

    const now = Date.now();
    const twoWeeksAgo = now - (14 * 24 * 60 * 60 * 1000);

    const targetMessages = fetchedMessages.filter(msg => {
        return msg.author.id === targetUser.id && msg.createdTimestamp >= targetTimestamp;
    });

    const bulkDeletable = targetMessages.filter(msg => msg.createdTimestamp > twoWeeksAgo);
    const singleDeletable = targetMessages.filter(msg => msg.createdTimestamp <= twoWeeksAgo);

    try {
        if (bulkDeletable.size > 0) {
            await channel.bulkDelete(bulkDeletable, true);
            deletedCount += bulkDeletable.size;
        }

        if (singleDeletable.size > 0) {
            for (const msg of singleDeletable.values()) {
                await msg.delete();
                deletedCount++;
                await sleep(1500); // レートリミット回避
            }
        }
    } catch (error) {
        console.error('削除処理中にエラー:', error);
        return deletedCount;
    }

    const oldestMsgId = fetchedMessages.last().id;
    // 基準日より古いメッセージまで遡ったか、取得メッセージが0になるまで継続
    if (fetchedMessages.last().createdTimestamp < targetTimestamp) {
        return deletedCount;
    }

    return await deleteMessagesRecursively(channel, targetUser, targetTimestamp, oldestMsgId, deletedCount);
}

module.exports = {
    deleteMessagesRecursively
};
