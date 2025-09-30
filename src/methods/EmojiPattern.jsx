export default function isSingleEmoji(text) {
     if (!text) return false;
     const trimmed = text.trim();
     const emojiRegex = /^(?:\p{Extended_Pictographic}(?:\uFE0F|\u200D\p{Extended_Pictographic})*)+$/u;
     return emojiRegex.test(trimmed);
}
