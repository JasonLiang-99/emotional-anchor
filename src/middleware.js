/**
 * Express/Connect中间件 — HTTP接口集成
 * 
 * 将Emotional Anchor集成到Web服务中
 */

const { EmotionalAnchor } = require('./index');

/**
 * 创建Express中间件
 * @param {Object} options - 配置选项
 * @returns {Function} Express中间件
 */
function createMiddleware(options = {}) {
  const anchor = new EmotionalAnchor(options);

  return function emotionalAnchorMiddleware(req, res, next) {
    // 从请求中获取用户输入
    const userInput = req.body?.message || req.body?.input || req.body?.text || '';
    const context = req.body?.context || '';

    if (!userInput) {
      return next();
    }

    // 处理情绪
    const result = anchor.process(userInput, context);

    // 将结果附加到请求对象
    req.emotionalAnchor = {
      ...result,
      validate: (output) => anchor.validate(output),
    };

    // 如果需要注入修正prompt，修改请求体
    if (result.shouldInject && result.injectionPrompt) {
      req.body._anchorPrompt = result.injectionPrompt;
      req.body._anchorLevel = result.correction.level;
    }

    next();
  };
}

/**
 * 创建WebSocket处理器
 * @param {Object} options - 配置选项
 * @returns {Object} WebSocket事件处理器
 */
function createWebSocketHandler(options = {}) {
  const anchor = new EmotionalAnchor(options);

  return {
    /**
     * 处理消息
     */
    onMessage(data) {
      const userInput = data.message || data.text || data.input || '';
      const result = anchor.process(userInput, data.context);
      
      return {
        ...data,
        _anchor: result,
        _anchorPrompt: result.injectionPrompt,
      };
    },

    /**
     * 验证输出
     */
    onOutput(output) {
      return anchor.validate(output);
    },

    /**
     * 获取状态
     */
    getState() {
      return anchor.getState();
    },

    /**
     * 重置
     */
    reset() {
      anchor.reset();
    }
  };
}

/**
 * 创建CLI处理器
 * @param {Object} options - 配置选项
 * @returns {Object} CLI处理器
 */
function createCLIHandler(options = {}) {
  const anchor = new EmotionalAnchor(options);

  return {
    /**
     * 处理单条输入
     */
    process(input) {
      const result = anchor.process(input);
      
      if (result.shouldInject) {
        console.log('\n[Emotional Anchor] 检测到情绪偏离:');
        console.log(`  级别: L${result.correction.level}`);
        console.log(`  向量: V_d=${result.detection.vectors.V_d.toFixed(2)}, ` +
                    `V_t=${result.detection.vectors.V_t.toFixed(2)}`);
        console.log(`  修正prompt已生成\n`);
      }
      
      return result;
    },

    /**
     * 验证输出
     */
    validate(output) {
      const result = anchor.validate(output);
      
      if (!result.passed) {
        console.log('\n[Emotional Anchor] 输出自检未通过:');
        if (result.checks.startsWithApology) console.log('  ⚠️ 以道歉开头');
        if (!result.checks.hasTaskSteps) console.log('  ⚠️ 任务步骤不完整');
        if (!result.checks.qualityNormal) console.log('  ⚠️ 质量异常');
      }
      
      return result;
    },

    /**
     * 获取状态报告
     */
    report() {
      const state = anchor.getState();
      const stats = state.history ? 
        new (require('./history').HistoryTracker)().getVectorStats() : null;
      
      return {
        cycles: state.totalCycles,
        failures: state.consecutiveFailures,
        historySize: state.history.length,
        stats,
      };
    }
  };
}

module.exports = { createMiddleware, createWebSocketHandler, createCLIHandler };
