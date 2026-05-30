/**
 * 历史记录追踪器 — 维护情绪向量的历史状态
 * 
 * 用于：
 * 1. 检测连续否定模式
 * 2. 计算情绪趋势
 * 3. PID控制器的积分项
 */

class HistoryTracker {
  constructor(maxSize = 10) {
    this.maxSize = maxSize;
    this.records = [];
  }

  /**
   * 添加一条记录
   */
  add(record) {
    this.records.push({
      ...record,
      timestamp: record.timestamp || Date.now(),
    });

    // 超出容量时移除最旧的
    if (this.records.length > this.maxSize) {
      this.records.shift();
    }
  }

  /**
   * 获取最近N条记录
   */
  getRecent(n = 5) {
    return this.records.slice(-n);
  }

  /**
   * 获取所有记录
   */
  getAll() {
    return [...this.records];
  }

  /**
   * 获取记录数量
   */
  count() {
    return this.records.length;
  }

  /**
   * 统计连续负面轮次
   */
  countConsecutiveNegative() {
    let count = 0;
    for (let i = this.records.length - 1; i >= 0; i--) {
      if (this.records[i].sentiment?.polarity === 'negative' || 
          this.records[i].isNegative) {
        count++;
      } else {
        break;
      }
    }
    return count;
  }

  /**
   * 统计最近N轮中的负面轮次
   */
  countNegativeInLast(n = 5) {
    const recent = this.getRecent(n);
    return recent.filter(r => 
      r.sentiment?.polarity === 'negative' || r.isNegative
    ).length;
  }

  /**
   * 检测是否处于连续挫败模式
   */
  isFrustrationMode() {
    return this.countConsecutiveNegative() >= 3;
  }

  /**
   * 获取情绪趋势
   */
  getTrend() {
    if (this.records.length < 2) return 'stable';
    
    const recentScores = this.records.slice(-5).map(r => r.sentiment?.score || 0);
    const avg = recentScores.reduce((a, b) => a + b, 0) / recentScores.length;
    
    if (avg > 0.2) return 'improving';
    if (avg < -0.2) return 'declining';
    return 'stable';
  }

  /**
   * 获取向量历史统计
   */
  getVectorStats() {
    if (this.records.length === 0) return null;
    
    const vectors = this.records.map(r => r.vectors).filter(Boolean);
    if (vectors.length === 0) return null;

    const stats = { V_d: [], V_a: [], V_t: [], V_s: [] };
    for (const v of vectors) {
      if (v.V_d !== undefined) stats.V_d.push(v.V_d);
      if (v.V_a !== undefined) stats.V_a.push(v.V_a);
      if (v.V_t !== undefined) stats.V_t.push(v.V_t);
      if (v.V_s !== undefined) stats.V_s.push(v.V_s);
    }

    return {
      V_d: this.calcStats(stats.V_d),
      V_a: this.calcStats(stats.V_a),
      V_t: this.calcStats(stats.V_t),
      V_s: this.calcStats(stats.V_s),
    };
  }

  /**
   * 计算统计值
   */
  calcStats(arr) {
    if (arr.length === 0) return { avg: 0, min: 0, max: 0, latest: 0 };
    
    const avg = arr.reduce((a, b) => a + b, 0) / arr.length;
    return {
      avg: parseFloat(avg.toFixed(3)),
      min: parseFloat(Math.min(...arr).toFixed(3)),
      max: parseFloat(Math.max(...arr).toFixed(3)),
      latest: parseFloat(arr[arr.length - 1].toFixed(3)),
    };
  }

  /**
   * 清空历史
   */
  clear() {
    this.records = [];
  }

  /**
   * 导出历史（用于持久化）
   */
  export() {
    return JSON.stringify(this.records, null, 2);
  }

  /**
   * 导入历史
   */
  import(json) {
    try {
      const data = typeof json === 'string' ? JSON.parse(json) : json;
      this.records = data.slice(-this.maxSize);
      return true;
    } catch (e) {
      return false;
    }
  }
}

module.exports = { HistoryTracker };
