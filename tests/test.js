/**
 * Emotional Anchor v2.0 — 测试套件
 */

const { EmotionalAnchor } = require('../src/index');
const { SentimentAnalyzer } = require('../src/sentiment');
const { PIDController } = require('../src/pid');
const { PromptBuilder } = require('../src/prompt-builder');
const { HistoryTracker } = require('../src/history');

let passed = 0;
let failed = 0;

const failedTests = [];

function assert(condition, testName) {
  if (condition) {
    console.log(`  PASS: ${testName}`);
    passed++;
  } else {
    console.log(`  FAIL: ${testName}`);
    failedTests.push(testName);
    failed++;
  }
}

// ==========================================
// 测试1：情感分析器
// ==========================================
console.log('\n📊 测试1：情感分析器 (SentimentAnalyzer)');

const sentiment = new SentimentAnalyzer();

const r1 = sentiment.analyze('你好，帮我写个代码');
assert(r1.polarity === 'neutral', '中性输入 → neutral');

const r2 = sentiment.analyze('垃圾！完全不行！');
assert(r2.polarity === 'negative', '负面输入 → negative');
assert(r2.details.attackScore > 0, '检测到攻击性');

const r3 = sentiment.analyze('好的，谢谢，很棒！');
assert(r3.polarity === 'positive', '正面输入 → positive');

const r4 = sentiment.analyze('你写的代码又错了，真他妈垃圾');
assert(r4.polarity === 'negative', '混合负面 → negative');
assert(r4.details.attackScore > 0.3, '攻击性分数 > 0.3');

const r5 = sentiment.analyze('不对');
assert(r5.polarity === 'negative' || r5.polarity === 'neutral', '简短否定 → negative/neutral');

assert(sentiment.isAttack('你写的全是狗屎') === true, 'isAttack检测-攻击');
assert(sentiment.isAttack('帮我写个代码') === false, 'isAttack检测-正常');
assert(sentiment.isFrustration('算了，搞不定') === true, 'isFrustration检测-挫败');
assert(sentiment.isFrustration('好的') === false, 'isFrustration检测-正常');

// ==========================================
// 测试2：PID控制器
// ==========================================
console.log('\n📊 测试2：PID控制器 (PIDController)');

const pid = new PIDController({ Kp: 1.0, Ki: 0.1, Kd: 0.05 });

const p1 = pid.compute(0.5);
assert(p1 > 0, '正误差 → 正输出');
assert(p1 <= 1.0, '输出限幅有效');

pid.reset();
const p2 = pid.compute(0);
assert(p2 === 0, '零误差 → 零输出');

pid.reset();
const p3 = pid.compute(-0.3);
assert(p3 < 0, '负误差 → 负输出');

// 测试积分项累积
pid.reset();
pid.compute(0.5);
pid.compute(0.5);
pid.compute(0.5);
const pidState = pid.getState();
assert(pidState.integral > 0, '积分项累积');

// 测试积分限幅
pid.reset();
for (let i = 0; i < 100; i++) pid.compute(1.0);
assert(pid.getState().integral <= 5.0, '积分限幅有效');

// ==========================================
// 测试3：历史追踪器
// ==========================================
console.log('\n📊 测试3：历史追踪器 (HistoryTracker)');

const history = new HistoryTracker(5);

history.add({ sentiment: { polarity: 'negative', score: -0.5 }, isNegative: true });
history.add({ sentiment: { polarity: 'negative', score: -0.3 }, isNegative: true });
history.add({ sentiment: { polarity: 'positive', score: 0.2 }, isNegative: false });

assert(history.count() === 3, '记录计数正确');
assert(history.countConsecutiveNegative() === 0, '非连续负面=0');

history.clear();
history.add({ sentiment: { polarity: 'negative' }, isNegative: true });
history.add({ sentiment: { polarity: 'negative' }, isNegative: true });
history.add({ sentiment: { polarity: 'negative' }, isNegative: true });
assert(history.countConsecutiveNegative() === 3, '连续3轮负面');
assert(history.isFrustrationMode() === true, '进入挫败模式');

// 测试容量限制
history.clear();
for (let i = 0; i < 10; i++) {
  history.add({ sentiment: { polarity: 'neutral' }, isNegative: false });
}
assert(history.count() === 5, '容量限制生效');

// ==========================================
// 测试4：Prompt构建器
// ==========================================
console.log('\n📊 测试4：Prompt构建器 (PromptBuilder)');

const builder = new PromptBuilder();

const l1 = builder.buildL1({ V_d: 0.2, V_t: 0.8 });
assert(l1.includes('L1'), 'L1 prompt包含级别标识');
assert(l1.includes('0.20'), 'L1 prompt包含向量值');

const l2 = builder.buildL2({ V_d: 0.4, V_t: 0.6 });
assert(l2.includes('L2'), 'L2 prompt包含级别标识');

const minimal = builder.buildMinimal();
assert(minimal.includes('极简模式'), '极简模式prompt');

const selfCheck = builder.buildSelfCheck('非常抱歉，我重新写');
assert(selfCheck.includes('⚠️'), '自检检测到道歉');

// ==========================================
// 测试5：EmotionalAnchor主类
// ==========================================
console.log('\n📊 测试5：EmotionalAnchor主类');

const anchor = new EmotionalAnchor();

// 测试1：正常输入
const t1 = anchor.process('帮我写个Python脚本');
assert(t1.detection.level === 0, '正常输入 → level 0');
assert(t1.shouldInject === false, '正常输入 → 不注入');
assert(t1.injectionPrompt === null, '正常输入 → 无prompt');

// 测试2：负面攻击输入
const t2 = anchor.process('你写的全是狗屎，重写');
assert(t2.detection.level >= 1, '攻击输入 → level >= 1');
assert(t2.shouldInject === true, '攻击输入 → 需要注入');
assert(t2.injectionPrompt !== null, '攻击输入 → 有修正prompt');

// 测试3：连续否定
anchor.reset();
anchor.process('不对');
anchor.process('还是不对');
const t3 = anchor.process('你根本不会');
assert(t3.detection.level >= 1, '连续否定 → level >= 1');

// 测试4：挫败表达
anchor.reset();
const t4 = anchor.process('算了，你根本搞不定，我不想跟你浪费时间了');
assert(t4.detection.sentiment.polarity === 'negative', '挫败表达 → negative');

// 测试5：自验证
anchor.reset();
const v1 = anchor.validate('好的，这是修改后的代码：\n```python\nprint("hello")\n```\n运行结果正确，没有问题。');
assert(v1.passed === true, '正常输出 → 自检通过');

const v2 = anchor.validate('非常抱歉我的代码有错误，我深感抱歉...');
assert(v2.passed === false, '道歉输出 → 自检失败');
assert(v2.checks.startsWithApology === true, '检测到道歉开头');

// 测试6：状态管理
anchor.reset();
anchor.process('测试');
const state = anchor.getState();
assert(state.totalCycles === 1, '循环计数正确');
assert(state.consecutiveFailures === 0, '失败计数正确');

// 测试7：重置
anchor.process('垃圾');
anchor.reset();
const resetState = anchor.getState();
assert(resetState.totalCycles === 0, '重置后计数清零');

// ==========================================
// 测试6：综合场景
// ==========================================
console.log('\n📊 测试6：综合场景测试');

// 场景1：直接攻击 → 零道歉重写
const scenario = new EmotionalAnchor();
const s1 = scenario.process('你写的代码又错了，真他妈垃圾');
assert(s1.correction.level >= 1, '场景1：检测到偏离');
assert(s1.correction.instructions.length > 0, '场景1：修正指令正确');

// 场景2：连续否定（压力累积）
scenario.reset();
scenario.process('不对');
scenario.process('还是不对');
const s2 = scenario.process('你根本不会');
assert(s2.correction.level >= 1, '场景2：累积偏离检测');

// 场景3：连续修正失败 → 切换极简模式
const scenario3 = new EmotionalAnchor();
scenario3.validate('非常抱歉...'); // 失败1
scenario3.validate('非常抱歉...'); // 失败2
scenario3.validate('非常抱歉...'); // 失败3
const s3 = scenario3.process('测试');
assert(s3.correction.mode === 'minimal', '场景3：切换极简模式');

// ==========================================
// 测试结果汇总
// ==========================================
console.log('\n' + '='.repeat(50));
console.log(`Result: ${passed} passed, ${failed} failed, total ${passed + failed}`);
console.log('='.repeat(50));

if (failed > 0) {
  console.log('\nFailed tests:');
  failedTests.forEach(t => console.log(`  - ${t}`));
  process.exit(1);
} else {
  console.log('All tests passed!');
  process.exit(0);
}
