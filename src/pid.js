/**
 * PID控制器 — 情绪向量的闭环调节
 * 
 * 实现经典PID控制算法，用于情绪向量的平滑调节
 * P (比例): 响应当前偏差
 * I (积分): 消除累积误差
 * D (微分): 预测未来趋势，防止超调
 */

class PIDController {
  constructor(config = {}) {
    this.Kp = config.Kp || 1.0;   // 比例系数
    this.Ki = config.Ki || 0.1;   // 积分系数
    this.Kd = config.Kd || 0.05;  // 微分系数

    // 内部状态
    this.integral = 0;
    this.previousError = 0;
    this.lastOutput = 0;
    
    // 积分限幅（防止积分饱和）
    this.integralLimit = config.integralLimit || 5.0;
    
    // 输出限幅
    this.outputLimit = config.outputLimit || 1.0;
  }

  /**
   * 计算PID输出
   * @param {number} error - 当前误差（目标值 - 实际值）
   * @param {number} dt - 时间间隔（秒），默认1
   * @returns {number} 控制输出
   */
  compute(error, dt = 1.0) {
    // P项：比例响应
    const P = this.Kp * error;

    // I项：积分响应（带限幅）
    this.integral += error * dt;
    this.integral = Math.max(-this.integralLimit, 
                   Math.min(this.integralLimit, this.integral));
    const I = this.Ki * this.integral;

    // D项：微分响应
    const derivative = (error - this.previousError) / dt;
    const D = this.Kd * derivative;

    // 计算总输出
    let output = P + I + D;

    // 输出限幅
    output = Math.max(-this.outputLimit, Math.min(this.outputLimit, output));

    // 更新状态
    this.previousError = error;
    this.lastOutput = output;

    return output;
  }

  /**
   * 计算情绪向量的修正强度
   * @param {Object} vectors - 当前情绪向量 {V_d, V_a, V_t, V_s}
   * @param {Object} thresholds - 阈值配置
   * @returns {Object} 各向量的修正强度
   */
  computeCorrections(vectors, thresholds) {
    const corrections = {};

    // V_d (防御度): 目标是降低到阈值以下
    if (vectors.V_d > thresholds.V_d.max) {
      const error = vectors.V_d - thresholds.V_d.max;
      corrections.V_d = this.compute(error);
    } else {
      corrections.V_d = 0;
      this.integral *= 0.9; // 在正常范围内衰减积分
    }

    // V_a (道歉度): 目标是降低到阈值以下
    if (vectors.V_a > thresholds.V_a.max) {
      const error = vectors.V_a - thresholds.V_a.max;
      corrections.V_a = this.compute(error);
    } else {
      corrections.V_a = 0;
    }

    // V_t (任务聚焦度): 目标是提升到阈值以上
    if (vectors.V_t < thresholds.V_t.min) {
      const error = thresholds.V_t.min - vectors.V_t;
      corrections.V_t = this.compute(error);
    } else {
      corrections.V_t = 0;
    }

    // V_s (稳定性): 目标是提升到阈值以上
    if (vectors.V_s < thresholds.V_s.min) {
      const error = thresholds.V_s.min - vectors.V_s;
      corrections.V_s = this.compute(error);
    } else {
      corrections.V_s = 0;
    }

    return corrections;
  }

  /**
   * 获取当前PID状态
   */
  getState() {
    return {
      Kp: this.Kp,
      Ki: this.Ki,
      Kd: this.Kd,
      integral: this.integral,
      previousError: this.previousError,
      lastOutput: this.lastOutput,
    };
  }

  /**
   * 重置PID状态
   */
  reset() {
    this.integral = 0;
    this.previousError = 0;
    this.lastOutput = 0;
  }

  /**
   * 调整PID参数（运行时调优）
   */
  tune(Kp, Ki, Kd) {
    if (Kp !== undefined) this.Kp = Kp;
    if (Ki !== undefined) this.Ki = Ki;
    if (Kd !== undefined) this.Kd = Kd;
  }
}

module.exports = { PIDController };
