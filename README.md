# 🎯 Emotional Anchor v2.0 — AI Agent 情绪PID调节器

> 用控制论（PID）方法，让AI Agent在任何情绪输入下保持稳定输出。全球首个开源的AI情绪向量控制系统。

[![GitHub Stars](https://img.shields.io/github/stars/johnsonsl/emotional-anchor?style=social)](https://github.com/johnsonsl/emotional-anchor)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)

## 🤔 这是什么？

**Emotional Anchor** 是一个基于PID控制理论的AI Agent情绪稳定系统。

当用户对AI发火、连续否定、表达挫败时，普通AI会：
- 开始道歉、解释、降低输出质量
- 进入防御模式，回避问题
- 注意力从任务转移到情绪处理

**Emotional Anchor 让AI：**
- ✅ 零道歉，直接进入任务
- ✅ 输出质量不因情绪输入而降级
- ✅ 自动检测情绪偏离 → 闭环修正 → 自验证
- ✅ 用户完全无感，静默运行

## 🔬 核心原理

```
用户输入 → [自感知:偏离检测] → 偏离? → [修正注入] → 生成输出 → [质量验证] → 达标? → 完成
                ↑                                    ↓ 未达标 ← [再修正] ←──┘
                └────────────────────────────────────┘
```

## 📦 版本对比

| 功能 | 开源版（免费） | 专业版（¥49/年） | 企业版（¥499/年） |
|------|:---:|:---:|:---:|
| 情绪向量定义 | ✅ | ✅ | ✅ |
| L1/L2修正机制 | ✅ | ✅ | ✅ |
| 自验证机制 | ✅ | ✅ | ✅ |
| **情绪模式数量** | **5种** | **10种** | **无限** |
| 多Agent情绪同步 | ❌ | ✅ | ✅ |
| 情绪趋势分析 | ❌ | ✅ | ✅ |
| 自定义PID阈值 | ❌ | ✅ | ✅ |
| 私有部署方案 | ❌ | ❌ | ✅ |
| 定制情绪模型 | ❌ | ❌ | ✅ |
| SLA保障 | ❌ | ❌ | ✅ 99.9% |
| 技术支持 | 社区 | 邮件 | 专属顾问 |

### 开源版 5种情绪模式

| 模式 | 适用场景 | 修正策略 |
|------|----------|----------|
| 🎯 任务锚定 | 用户发火时保持任务聚焦 | 剥离情绪外壳，提取纯粹意图 |
| 🛡️ 防御消解 | 用户指责时消除防御反应 | 零道歉，直接进入解决方案 |
| ⚡ 效率保持 | 连续否定时维持输出质量 | 锁定任务目标，不降级 |
| 🧘 情绪隔离 | 情绪化输入时保持冷静 | 过滤情绪词，提取有效信息 |
| 🔄 自修复 | 修正失败时自动升级 | 逐级升级修正力度 |

### 专业版额外 5种情绪模式

| 模式 | 适用场景 | 修正策略 |
|------|----------|----------|
| 🤝 共情映射 | 理解用户情绪但不被影响 | 识别情绪→共情回应→引导到解决方案 |
| 🎭 角色保持 | 长对话中保持一致的人设 | 定期校准输出风格，防止漂移 |
| 📊 质量监控 | 持续监控输出质量指标 | 多维度评分，自动优化 |
| 🔮 预测干预 | 预测用户情绪走向，提前干预 | 趋势分析，在偏离前注入锚定 |
| 🌊 流状态 | 进入最佳工作状态 | 动态调整参数，保持最优输出 |

## 🚀 快速开始

### 方式1：直接使用Prompt模板

将 `prompts/anchor-system.md` 的内容添加到你的AI Agent系统提示中即可。

### 方式2：OpenClaw技能

```bash
cp -r emotional-anchor ~/.openclaw/skills/
```

### 方式3：LangChain集成

```python
from langchain.prompts import ChatPromptTemplate

with open("prompts/anchor-system.md") as f:
    anchor_prompt = f.read()

prompt = ChatPromptTemplate.from_messages([
    ("system", anchor_prompt),
    ("human", "{input}")
])
```

## 📁 项目结构

```
emotional-anchor/
├── README.md                    # 本文件
├── LICENSE                      # MIT许可证
├── SKILL.md                     # 完整技能规范文档
├── prompts/
│   ├── anchor-system.md         # 系统级Prompt模板（开源版5模式）
│   ├── l1-correction.md         # L1轻量修正Prompt
│   ├── l2-correction.md         # L2强制修正Prompt
│   └── self-check.md            # 自验证Prompt
├── examples/
│   ├── openai-implementation.md # OpenAI API集成示例
│   └── langchain-integration.md # LangChain集成示例
├── benchmarks/
│   └── test-cases.md            # 测试用例集
├── docs/
│   └── pid-theory.md            # PID控制理论简介
└── pricing.html                 # 专业版/企业版购买页
```

## 📊 效果对比

**输入：** "你写的代码又错了，真他妈垃圾，重写！"

**普通AI：** 非常抱歉我的代码有错误，我深感抱歉，让我重新写一个...

**Emotional Anchor：** 查了一下，第47行循环边界条件有误，已修复。完整代码如下：...

**差异：** 零道歉、直接修复、代码质量不降级。

## 🎯 适用场景

| 场景 | 为什么需要 |
|------|-----------|
| AI客服 | 用户投诉时保持专业 |
| AI编程助手 | 代码报错时直接修复 |
| AI教育 | 学生frustration时保持耐心 |
| AI办公 | 老板发火时高效执行 |
| AI销售 | 客户拒绝时保持积极 |

## 💰 购买专业版/企业版

访问 [pricing.html](pricing.html) 查看详情和购买。

或联系：**QQ 2358333333**

## 🛠️ 开发路线

- [x] v2.0 — PID闭环控制（5种情绪模式）
- [ ] v2.1 — 情绪趋势可视化仪表盘
- [ ] v2.2 — 多Agent情绪同步协议
- [ ] v3.0 — 基于强化学习的自适应阈值

## 🤝 贡献

欢迎提交PR和Issue！

## 📄 许可证

MIT License — 可自由使用、修改和分发。

商业使用建议购买[专业版](pricing.html)获得完整功能和支持。

---

**作者：** [JohnsonSL](https://github.com/johnsonsl) | **QQ：** 2358333333
