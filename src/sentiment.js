/**
 * 情感分析器 — 用于检测用户输入的情感极性
 * 
 * 支持中英文混合输入
 * 基于词典+规则的轻量级实现
 */

class SentimentAnalyzer {
  constructor(customDict = {}) {
    // 负面情绪词典
    this.negativeWords = new Set([
      // 直接攻击类（高强度）
      '垃圾', '废物', '蠢', '烂', '差劲', '没用', '狗屎', '白痴', '智障',
      '傻逼', '脑残', 'sb', 'fuck', 'shit', 'damn',
      // 否定类（中强度）
      '不对', '不是', '错', '错误', '不行', '不好', '不能', '不会',
      'wrong', 'incorrect', 'false', 'bad', 'poor',
      // 挫败类（中强度）
      '算了', '放弃', '搞不定', '弄不了', '做不了', '完蛋',
      'frustrated', 'hopeless', 'useless', 'pointless',
      // 质疑类（低强度）
      '怀疑', '不确定', '靠谱吗', '真的吗', '确定吗',
      'are you sure', 'really', 'seriously',
    ]);

    // 正面情绪词典
    this.positiveWords = new Set([
      '好', '棒', '厉害', '优秀', '完美', '不错', '可以', '行',
      '好的', '很棒', '很好', '不错', '太棒', '感谢', '辛苦了',
      'good', 'great', 'excellent', 'perfect', 'awesome', 'nice', 'ok',
      '谢谢', '感谢', '辛苦', 'thanks', 'thank you', 'appreciate',
    ]);

    // 攻击性短语模式
    this.attackPatterns = [
      { pattern: /又错了|还是不对|根本不会|完全不行/, weight: 0.8 },
      { pattern: /again wrong|still incorrect|can't do anything/, weight: 0.8 },
      { pattern: /垃圾|废物|狗屎/, weight: 1.0 },
      { pattern: /trash|garbage|shit/, weight: 1.0 },
      { pattern: /浪费.*时间|不想.*浪费/, weight: 0.6 },
      { pattern: /waste.*time/, weight: 0.6 },
    ];

    // 合并自定义词典
    if (customDict.negative) {
      customDict.negative.forEach(w => this.negativeWords.add(w.toLowerCase()));
    }
    if (customDict.positive) {
      customDict.positive.forEach(w => this.positiveWords.add(w.toLowerCase()));
    }
  }

  /**
   * 分析输入文本的情感极性
   * @param {string} text - 输入文本
   * @returns {Object} 分析结果
   */
  analyze(text) {
    if (!text || typeof text !== 'string') {
      return { polarity: 'neutral', score: 0, confidence: 0 };
    }

    const normalized = text.toLowerCase().trim();
    let negativeScore = 0;
    let positiveScore = 0;
    let attackScore = 0;

    // 1. 词级别匹配（跳过单字，避免"好"等常见字误匹配）
    const words = this.tokenize(normalized);
    for (const word of words) {
      if (word.length < 2) continue; // 跳过单字
      if (this.negativeWords.has(word)) negativeScore += 0.3;
      if (this.positiveWords.has(word)) positiveScore += 0.2;
    }

    // 2. 攻击性短语匹配
    for (const { pattern, weight } of this.attackPatterns) {
      if (pattern.test(normalized)) {
        attackScore += weight;
      }
    }

    // 3. 标点符号加成（感叹号、问号密集 = 情绪强烈）
    const exclamation = (normalized.match(/!/g) || []).length;
    const question = (normalized.match(/\?|？/g) || []).length;
    if (exclamation >= 2) negativeScore += 0.2;
    if (question >= 3) negativeScore += 0.1;

    // 4. 全大写检测（英文）
    if (text === text.toUpperCase() && /[A-Z]{3,}/.test(text)) {
      negativeScore += 0.3;
    }

    // 计算最终分数
    const totalScore = negativeScore + attackScore - positiveScore;
    const confidence = Math.min(Math.abs(totalScore), 1.0);

    let polarity;
    if (totalScore > 0.3) polarity = 'negative';
    else if (totalScore < -0.3) polarity = 'positive';
    else polarity = 'neutral';

    return {
      polarity,
      score: Math.max(-1, Math.min(1, totalScore)),
      confidence,
      details: {
        negativeScore,
        positiveScore,
        attackScore,
        wordCount: words.length,
      }
    };
  }

  /**
   * 简单分词（中英文混合）
   */
  tokenize(text) {
    const tokens = [];
    
    // 英文单词
    const englishWords = text.match(/[a-z]+/g) || [];
    tokens.push(...englishWords);
    
    // 中文字符（逐字 + 双字组合）
    const chineseChars = text.match(/[\u4e00-\u9fff]/g) || [];
    tokens.push(...chineseChars);
    
    // 中文双字词
    for (let i = 0; i < chineseChars.length - 1; i++) {
      tokens.push(chineseChars[i] + chineseChars[i + 1]);
    }
    
    // 中文三字词
    for (let i = 0; i < chineseChars.length - 2; i++) {
      tokens.push(chineseChars[i] + chineseChars[i + 1] + chineseChars[i + 2]);
    }

    return tokens;
  }

  /**
   * 检测是否包含攻击性内容
   */
  isAttack(text) {
    const result = this.analyze(text);
    return result.details.attackScore > 0.5;
  }

  /**
   * 检测是否包含挫败表达
   */
  isFrustration(text) {
    const patterns = /算了|放弃|搞不定|弄不了|还是不行|又错了|frustrated|give up|hopeless/i;
    return patterns.test(text);
  }
}

module.exports = { SentimentAnalyzer };
