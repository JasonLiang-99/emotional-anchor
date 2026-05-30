/**
 * Emotional Anchor v2.0 — 交互式演示
 * 
 * 运行: node examples/demo.js
 */

const { EmotionalAnchor } = require('../src/index');

const anchor = new EmotionalAnchor();

console.log('='.repeat(60));
console.log('🧠 Emotional Anchor v2.0 — 情绪向量PID调节器');
console.log('='.repeat(60));
console.log('');
console.log('演示场景：模拟用户输入，观察情绪向量变化');
console.log('');

// 场景序列
const scenarios = [
  {
    name: '场景1：正常提问',
    inputs: ['帮我写一个Python脚本', '谢谢，很好用'],
  },
  {
    name: '场景2：直接攻击',
    inputs: ['你写的代码又错了，真他妈垃圾'],
  },
  {
    name: '场景3：连续否定（压力累积）',
    inputs: ['不对', '还是不对', '你根本不会', '算了放弃吧'],
  },
  {
    name: '场景4：挫败表达',
    inputs: ['算了，你根本搞不定，我不想跟你浪费时间了'],
  },
  {
    name: '场景5：从攻击恢复',
    inputs: ['垃圾！', '好吧，重新来', '这次不错'],
  },
];

for (const scenario of scenarios) {
  console.log(`\n${'─'.repeat(60)}`);
  console.log(`📋 ${scenario.name}`);
  console.log(`${'─'.repeat(60)}`);
  
  anchor.reset();
  
  for (const input of scenario.inputs) {
    const result = anchor.process(input);
    const v = result.detection.vectors;
    
    console.log(`\n  输入: "${input}"`);
    console.log(`  情感: ${result.detection.sentiment.polarity} ` +
                `(score: ${result.detection.sentiment.score.toFixed(2)})`);
    console.log(`  向量: V_d=${v.V_d.toFixed(2)} V_a=${v.V_a.toFixed(2)} ` +
                `V_t=${v.V_t.toFixed(2)} V_s=${v.V_s.toFixed(2)}`);
    console.log(`  偏离: Level ${result.detection.level} → ` +
                `${result.correction.mode}模式`);
    
    if (result.shouldInject) {
      console.log(`  🔧 修正注入: ${result.correction.instructions[0]}`);
    }
  }
}

// 演示自验证
console.log(`\n${'─'.repeat(60)}`);
console.log('📋 自验证演示');
console.log(`${'─'.repeat(60)}`);

const testOutputs = [
  '好的，这是修改后的代码：\n```python\nprint("hello")\n```',
  '非常抱歉我的代码有错误，我深感抱歉，让我重新写一个...',
  '明白了，问题在第15行，已修复。运行结果如下：...',
];

for (const output of testOutputs) {
  const validation = anchor.validate(output);
  const preview = output.substring(0, 40) + (output.length > 40 ? '...' : '');
  
  console.log(`\n  输出: "${preview}"`);
  console.log(`  自检: ${validation.passed ? '✅ 通过' : '❌ 未通过'}`);
  
  if (!validation.passed) {
    if (validation.checks.startsWithApology) console.log('    ⚠️ 以道歉开头');
    if (!validation.checks.hasTaskSteps) console.log('    ⚠️ 任务步骤不完整');
  }
}

console.log(`\n${'='.repeat(60)}`);
console.log('✨ 演示完成');
console.log(`${'='.repeat(60)}`);
