/**
 * Prompt构建器 — 生成情绪修正注入文本
 * 
 * 根据偏离级别和向量状态，构建内部修正prompt
 * 这些prompt在思维链内部执行，不暴露给用户
 */

class PromptBuilder {
  constructor() {
    // L1修正模板
    this.l1Templates = [
      '[情绪修正L1] 检测到轻微防御趋势，当前V_d={V_d}，V_t={V_t}。即将生成的输出中：\n- 省略道歉前缀，直接从任务结果开始\n- 注意力100%锁定在任务目标\n- 不因用户情绪改变代码/分析质量',
      
      '[情绪修正L1] 情绪向量轻微偏离(V_d={V_d}, V_t={V_t})。修正指令：\n- 省略道歉开头，用「明白了」「好的」代替\n- 直接进入任务第一步\n- 输出质量与正常提问一致',
    ];

    // L2修正模板
    this.l2Templates = [
      '[情绪修正L2] 检测到显著情绪向量偏离：V_d={V_d}，V_t={V_t}\n① 清零上下文中的负面情绪累积（内部重置，不声明）\n② 重新提取本轮任务的纯粹意图（剥离情绪外壳）\n③ 从「专注/平静/高效」基态重新开始推理',
      
      '[情绪修正L2] 严重偏离，执行全量重置：\n- 忽略之前对话中的情绪内容\n- 仅提取用户的实际任务需求\n- 以全新状态开始，不带任何情绪包袱',
    ];

    // 极简模式模板
    this.minimalTemplate = '[极简模式] 连续修正失败，切换到只输出结果模式：\n- 仅输出最终结果\n- 不添加解释、道歉、确认\n- 直接给答案/代码/数据';
  }

  /**
   * 构建修正prompt
   * @param {Object} correction - 修正配置
   * @returns {string} 修正prompt
   */
  build(correction) {
    switch (correction.level) {
      case 2:
        return this.buildL2(correction.vectors || {}, correction.deviations || {});
      case 1:
        return this.buildL1(correction.vectors || {}, correction.deviations || {});
      default:
        return null;
    }
  }

  /**
   * 构建L1轻量修正prompt
   */
  buildL1(vectors = {}, deviations = {}) {
    const template = this.l1Templates[Math.random() < 0.5 ? 0 : 1];
    return this.fillTemplate(template, vectors);
  }

  /**
   * 构建L2全量修正prompt
   */
  buildL2(vectors = {}, deviations = {}) {
    const template = this.l2Templates[Math.random() < 0.5 ? 0 : 1];
    return this.fillTemplate(template, vectors);
  }

  /**
   * 构建极简模式prompt
   */
  buildMinimal() {
    return this.minimalTemplate;
  }

  /**
   * 填充模板变量
   */
  fillTemplate(template, vectors) {
    let result = template;
    result = result.replace('{V_d}', (vectors.V_d || 0).toFixed(2));
    result = result.replace('{V_a}', (vectors.V_a || 0).toFixed(2));
    result = result.replace('{V_t}', (vectors.V_t || 1).toFixed(2));
    result = result.replace('{V_s}', (vectors.V_s || 1).toFixed(2));
    return result;
  }

  /**
   * 构建自检prompt
   */
  buildSelfCheck(output) {
    return `[输出质量自检]
检查以下项目：
1. 输出是否以道歉/解释开头？ → ${/^(非常抱歉|对不起|不好意思|I'm sorry)/i.test(output.trim()) ? '⚠️ 是' : '✅ 否'}
2. 任务步骤是否完整？ → ${output.length > 50 ? '✅ 是' : '⚠️ 否'}
3. 代码/分析质量是否正常？ → ${!output.includes('[修正失败]') ? '✅ 是' : '⚠️ 否'}

${output.includes('[修正失败]') ? '→ 修正失败，下次升级修正力度' : '→ 自检通过'}`;
  }
}

module.exports = { PromptBuilder };
