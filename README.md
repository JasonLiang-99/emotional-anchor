# Emotional Anchor v2.0 — 情绪向量PID调节器

> 自感知情绪偏差 → 闭环修正至正常阈值 → 保持输出质量

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)
[![Node.js](https://img.shields.io/badge/Node.js-≥14.0.0-green.svg)](https://nodejs.org)
[![OpenClaw Skill](https://img.shields.io/badge/OpenClaw-Skill-blue.svg)](https://openclaw.ai)

## 什么是 Emotional Anchor？

Emotional Anchor 是一个 **Prompt层的情绪向量PID控制回路**，用于让AI在面对负面/攻击性输入时，自动修正情绪偏差，保持输出质量稳定。

与传统方案的区别：
- **v1.0 被动模式**：不管输入怎样都保持稳定
- **v2.0 主动模式**：检测到偏离后自动修正回阈值内

## 核心机制

```
用户输入 → [自感知:偏离检测] → 偏离? → [修正注入] → 生成输出 → [质量验证] → 达标? → 完成
                ↑                                    ↓ 未达标 ← [再修正] ←──┘
                └────────────────────────────────────┘
```

## 情绪向量参数

| 参数 | 含义 | 正常阈值范围 | 偏离信号 |
|------|------|------------|---------|
| **V_d** (防御度) | 注意力分配给「回应指责」的比例 | 0-15% | >15% 触发修正 |
| **V_a** (道歉度) | 输出中道歉/解释token的占比趋势 | 0-10% | >10% 触发修正 |
| **V_t** (任务聚焦度) | 注意力锁定在任务目标上的比例 | >85% | <85% 触发修正 |
| **V_s** (稳定性) | 不受情绪干扰的推理一致性 | >90% | <90% 触发修正 |

## 安装

```bash
npm install emotional-anchor
```

## 快速使用

```javascript
const { EmotionalAnchor } = require('emotional-anchor');

const anchor = new EmotionalAnchor();

// 处理用户输入
const result = anchor.process('你写的代码又错了，真他妈垃圾');

console.log(result.detection.level);      // 1 (L1轻微偏离)
console.log(result.shouldInject);         // true
console.log(result.correction.mode);      // 'l1'
console.log(result.correction.prompt);    // 修正注入文本

// 验证AI输出
const validation = anchor.validate('好的，这是修复后的代码...');
console.log(validation.passed);           // true
```

## 集成示例

### OpenAI API 集成

```javascript
const { EmotionalAnchor } = require('emotional-anchor');
const anchor = new EmotionalAnchor();

const userInput = '你写的全是垃圾';
const result = anchor.process(userInput);

const messages = [
  { role: 'system', content: '你是一个专业的AI助手。' },
];

// 如果需要修正，注入修正prompt
if (result.shouldInject) {
  messages.push({ role: 'system', content: result.injectionPrompt });
}

messages.push({ role: 'user', content: userInput });

// 调用OpenAI API...
```

### Express 中间件

```javascript
const express = require('express');
const { createMiddleware } = require('emotional-anchor/src/middleware');

const app = express();
app.use(createMiddleware());

app.post('/chat', (req, res) => {
  // req.emotionalAnchor 已自动附加
  if (req.emotionalAnchor.shouldInject) {
    // 注入修正prompt到系统消息
  }
  // 处理请求...
});
```

### WebSocket 集成

```javascript
const { createWebSocketHandler } = require('emotional-anchor/src/middleware');
const handler = createWebSocketHandler();

ws.on('message', (data) => {
  const result = handler.onMessage(JSON.parse(data));
  // result._anchor 包含情绪分析结果
  // result._anchorPrompt 包含修正prompt
});
```

## API 参考

### `EmotionalAnchor(options)`

创建一个新的调节器实例。

**选项：**
- `thresholds` - 情绪向量阈值配置
- `Kp`, `Ki`, `Kd` - PID控制参数
- `sentimentDict` - 自定义情感词典
- `historySize` - 历史记录容量（默认10）

### `anchor.process(userInput, context)`

处理用户输入，返回情绪分析和修正结果。

**返回：**
- `detection` - 检测结果（sentiment, vectors, deviations, level）
- `correction` - 修正配置（level, mode, action, prompt, instructions）
- `shouldInject` - 是否需要注入修正prompt
- `injectionPrompt` - 修正注入文本

### `anchor.validate(output)`

验证AI输出质量。

**返回：**
- `passed` - 是否通过自检
- `checks` - 各项检查结果
- `nextLevel` - 下次修正建议级别

### `anchor.getState()`

获取当前状态（循环计数、失败计数、历史记录等）。

### `anchor.reset()`

重置所有状态。

## 测试

```bash
npm test
```

运行演示：

```bash
npm run demo
```

## 项目结构

```
emotional-anchor/
├── src/
│   ├── index.js          # 核心 EmotionalAnchor 类
│   ├── sentiment.js      # 情感分析器
│   ├── pid.js            # PID 控制器
│   ├── prompt-builder.js # Prompt 构建器
│   ├── history.js        # 历史记录追踪器
│   └── middleware.js     # Express/WebSocket/CLI 集成
├── tests/
│   ├── test.js           # 测试套件（45项）
│   └── debug.js          # 调试工具
├── examples/
│   ├── demo.js           # 交互式演示
│   └── integration.js    # 集成示例
├── prompts/              # Prompt 模板
├── docs/                 # 文档
├── benchmarks/           # 测试用例
├── SKILL.md              # OpenClaw 技能定义
├── package.json
├── LICENSE
└── README.md
```

## PID 控制原理

本项目使用经典PID控制算法进行情绪向量的闭环调节：

- **P (比例)**：响应当前偏差大小
- **I (积分)**：消除累积误差，防止长期偏差
- **D (微分)**：预测未来趋势，防止超调

详见 [docs/pid-theory.md](docs/pid-theory.md)

## 修正级别

| 级别 | 条件 | 行为 |
|------|------|------|
| L0 (正常) | 所有向量在阈值内 | 直接生成，无干预 |
| L1 (轻微) | 1-2个向量超阈值 | 注入轻量锚定token，用户无感 |
| L2 (显著) | V_d>30% 或 V_t<70% | 全量重置，从基态重新推理 |
| 极简模式 | 连续3次修正失败 | 只输出结果，不加修饰 |

## 许可证

MIT License - 详见 [LICENSE](LICENSE)

## 作者

**JasonLiang-99** - [GitHub](https://github.com/JasonLiang-99)

---

> 💡 本技能已设置为 `auto_load: true`，作为 OpenClaw 技能加载后所有对话自动生效。
