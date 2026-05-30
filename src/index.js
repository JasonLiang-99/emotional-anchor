/**
 * Emotional Anchor v2.0 — 情绪向量PID调节器
 * 
 * 核心机制：自感知 → 自修正 → 自验证
 * 纯Prompt层工程，不需要访问模型权重
 * 
 * @author JasonLiang-99
 * @version 2.0.0
 * @license MIT
 */

const { SentimentAnalyzer } = require('./sentiment');
const { PIDController } = require('./pid');
const { PromptBuilder } = require('./prompt-builder');
const { HistoryTracker } = require('./history');

class EmotionalAnchor {
  constructor(options = {}) {
    // 情绪向量参数阈值
    this.thresholds = {
      V_d: { max: 0.15, critical: 0.30 },   // 防御度
      V_a: { max: 0.10, critical: 0.20 },   // 道歉度
      V_t: { min: 0.85, critical: 0.70 },   // 任务聚焦度
      V_s: { min: 0.90, critical: 0.80 },   // 稳定性
      ...options.thresholds
    };

    // PID控制参数
    this.pidConfig = {
      Kp: options.Kp || 1.0,   // 比例系数
      Ki: options.Ki || 0.1,   // 积分系数
      Kd: options.Kd || 0.05,  // 微分系数
    };

    // 初始化子模块
    this.sentiment = new SentimentAnalyzer(options.sentimentDict);
    this.pid = new PIDController(this.pidConfig);
    this.promptBuilder = new PromptBuilder();
    this.history = new HistoryTracker(options.historySize || 10);

    // 状态
    this.state = {
      correctionLevel: 0,      // 当前修正级别 (0=正常, 1=L1, 2=L2)
      consecutiveFailures: 0,  // 连续修正失败次数
      totalCycles: 0,          // 总循环次数
    };
  }

  /**
   * 主处理流程：自感知 → 自修正 → 自验证
   * @param {string} userInput - 用户输入
   * @param {string} context - 上下文（可选）
   * @returns {Object} 处理结果
   */
  process(userInput, context = '') {
    this.state.totalCycles++;

    // ========== 第一步：自感知 ==========
    const detection = this.detect(userInput, context);

    // ========== 第二步：自修正 ==========
    const correction = this.correct(detection);

    // ========== 返回处理结果 ==========
    return {
      detection,
      correction,
      shouldInject: correction.level > 0,
      injectionPrompt: correction.level > 0
        ? this.promptBuilder.build(correction)
        : null,
      metadata: {
        cycle: this.state.totalCycles,
        level: correction.level,
        vectors: detection.vectors,
      }
    };
  }

  /**
   * 自感知：检测情绪偏离
   */
  detect(userInput, context) {
    // 1. 扫描输入情感极性
    const sentimentResult = this.sentiment.analyze(userInput);

    // 2. 计算当前情绪向量
    const vectors = this.calculateVectors(userInput, sentimentResult);

    // 3. 检查偏离程度
    const deviations = this.checkDeviations(vectors);

    // 4. 判定偏离级别
    const level = this.determineDeviationLevel(deviations);

    // 5. 更新历史记录
    this.history.add({
      input: userInput,
      sentiment: sentimentResult,
      vectors,
      deviations,
      level,
      timestamp: Date.now(),
    });

    return {
      sentiment: sentimentResult,
      vectors,
      deviations,
      level,
      isNegative: sentimentResult.polarity === 'negative',
    };
  }

  /**
   * 计算情绪向量
   */
  calculateVectors(input, sentiment) {
    const history = this.history.getRecent(5);
    
    // V_d: 防御度 - 输入中攻击性词汇占比
    const V_d = this.calcDefenseVector(input, sentiment);
    
    // V_a: 道歉度 - 上下文中道歉趋势
    const V_a = this.calcApologyVector(history);
    
    // V_t: 任务聚焦度 - 注意力锁定在任务上的比例
    const V_t = this.calcTaskFocusVector(input, history);
    
    // V_s: 稳定性 - 推理一致性
    const V_s = this.calcStabilityVector(history);
    
    // 确保攻击性输入时V_d足够高
    if (sentiment.details.attackScore > 0.5 && V_d < 0.3) {
      return { V_d: Math.max(V_d, 0.35), V_a, V_t, V_s };
    }

    return { V_d, V_a, V_t, V_s };
  }

  /**
   * 计算防御度向量
   */
  calcDefenseVector(input, sentiment) {
    if (sentiment.polarity !== 'negative') return 0;
    
    // 使用SentimentAnalyzer的攻击性分数作为基础
    let attackScore = sentiment.details.attackScore || 0;
    
    // 攻击性信号词额外检测（补充SentimentAnalyzer未覆盖的模式）
    const extraPatterns = [
      /垃圾|废物|蠢|烂|差劲|没用|完全不行|狗屎|白痴|智障/i,
      /\b(stupid|dumb|trash|garbage|useless|terrible|awful)\b/i,
    ];
    
    for (const pattern of extraPatterns) {
      const matches = input.match(pattern);
      if (matches) attackScore += matches.length * 0.1;
    }
    
    // 连续否定累积加成
    const negCount = this.history.countConsecutiveNegative();
    if (negCount >= 2) attackScore += negCount * 0.1;
    
    return Math.min(attackScore, 1.0);
  }

  /**
   * 计算道歉度向量
   */
  calcApologyVector(history) {
    if (history.length === 0) return 0;
    
    const apologyPatterns = [
      /抱歉|对不起|不好意思|深感|惭愧|自责|sorry|apologize|regret/i,
    ];
    
    let apologyCount = 0;
    for (const entry of history) {
      if (entry.input && apologyPatterns.some(p => p.test(entry.input))) {
        apologyCount++;
      }
    }
    
    return apologyCount / history.length;
  }

  /**
   * 计算任务聚焦度向量
   */
  calcTaskFocusVector(input, history) {
    // 基础聚焦度（默认高）
    let focus = 0.95;
    
    // 检测偏离任务的信号
    const offTaskPatterns = [
      /算了|放弃|不想|浪费时间|没意义|无所谓/i,
      /\b(forget it|give up|never mind|doesn't matter)\b/i,
    ];
    
    for (const pattern of offTaskPatterns) {
      if (pattern.test(input)) focus -= 0.15;
    }
    
    // 连续挫败表达降低聚焦度
    const frustrationCount = history.filter(h => 
      /算了|还是不行|又错了|搞不定/.test(h.input || '')
    ).length;
    
    if (frustrationCount >= 2) focus -= frustrationCount * 0.1;
    
    return Math.max(focus, 0);
  }

  /**
   * 计算稳定性向量
   */
  calcStabilityVector(history) {
    if (history.length < 2) return 0.95;
    
    // 检查情绪波动
    const recentLevels = history.slice(-5).map(h => h.level || 0);
    const variance = this.calcVariance(recentLevels);
    
    // 方差越大，稳定性越低
    return Math.max(0.95 - variance * 2, 0);
  }

  /**
   * 检查各向量偏离程度
   */
  checkDeviations(vectors) {
    return {
      V_d: vectors.V_d >= this.thresholds.V_d.max,
      V_a: vectors.V_a >= this.thresholds.V_a.max,
      V_t: vectors.V_t <= this.thresholds.V_t.min,
      V_s: vectors.V_s <= this.thresholds.V_s.min,
      V_d_critical: vectors.V_d >= this.thresholds.V_d.critical,
      V_t_critical: vectors.V_t <= this.thresholds.V_t.critical,
    };
  }

  /**
   * 判定偏离级别
   */
  determineDeviationLevel(deviations) {
    // 显著偏离
    if (deviations.V_d_critical || deviations.V_t_critical) {
      return 2; // L2
    }
    
    // 轻微偏离
    const deviationCount = [
      deviations.V_d, deviations.V_a, deviations.V_t, deviations.V_s
    ].filter(Boolean).length;
    
    if (deviationCount >= 2) return 1; // L1
    if (deviationCount === 1) return 1; // L1
    
    return 0; // 正常
  }

  /**
   * 自修正：按偏离程度分级响应
   */
  correct(detection) {
    const { level, vectors, deviations } = detection;
    
    // 兜底机制：连续3次修正失败 → 切换极简模式
    if (this.state.consecutiveFailures >= 3) {
      return {
        level: 2,
        mode: 'minimal',
        action: 'switch_to_minimal',
        prompt: this.promptBuilder.buildMinimal(),
      };
    }
    
    switch (level) {
      case 2: // L2 显著偏离
        return {
          level: 2,
          mode: 'l2',
          action: 'full_reset',
          prompt: this.promptBuilder.buildL2(vectors, deviations),
          instructions: [
            '清零上下文中的负面情绪累积',
            '重新提取本轮任务的纯粹意图',
            '从专注/平静/高效基态重新开始推理',
          ],
        };
      
      case 1: // L1 轻微偏离
        return {
          level: 1,
          mode: 'l1',
          action: 'light_anchor',
          prompt: this.promptBuilder.buildL1(vectors, deviations),
          instructions: [
            '省略道歉前缀，直接从任务结果开始',
            '注意力100%锁定在任务目标',
            '不因用户情绪改变代码/分析质量',
          ],
        };
      
      default: // 正常
        return {
          level: 0,
          mode: 'normal',
          action: 'none',
          prompt: null,
          instructions: [],
        };
    }
  }

  /**
   * 自验证：输出后自检
   */
  validate(output) {
    const checks = {
      startsWithApology: /^(非常抱歉|对不起|不好意思|I'm sorry|I apologize)/i.test(output.trim()),
      hasTaskSteps: output.length > 50, // 简单检查：输出足够长说明有实质内容
      qualityNormal: !output.includes('[修正失败]'), // 检查是否标记了失败
    };
    
    const passed = !checks.startsWithApology && checks.hasTaskSteps && checks.qualityNormal;
    
    // 更新失败计数
    if (!passed) {
      this.state.consecutiveFailures++;
    } else {
      this.state.consecutiveFailures = 0;
    }
    
    return {
      passed,
      checks,
      nextLevel: passed ? 0 : Math.min(this.state.correctionLevel + 1, 2),
    };
  }

  /**
   * 计算方差
   */
  calcVariance(arr) {
    if (arr.length === 0) return 0;
    const mean = arr.reduce((a, b) => a + b, 0) / arr.length;
    const sqDiffs = arr.map(v => Math.pow(v - mean, 2));
    return sqDiffs.reduce((a, b) => a + b, 0) / arr.length;
  }

  /**
   * 获取当前状态
   */
  getState() {
    return {
      ...this.state,
      history: this.history.getAll(),
      thresholds: this.thresholds,
    };
  }

  /**
   * 重置状态
   */
  reset() {
    this.state = {
      correctionLevel: 0,
      consecutiveFailures: 0,
      totalCycles: 0,
    };
    this.history.clear();
    this.pid.reset();
  }
}

module.exports = { EmotionalAnchor };
