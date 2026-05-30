/**
 * Emotional Anchor v2.0 — 集成示例
 * 
 * 展示如何将Emotional Anchor集成到各种AI框架中
 */

const { EmotionalAnchor } = require('../src/index');
const { createMiddleware, createWebSocketHandler, createCLIHandler } = require('../src/middleware');

// ==========================================
// 示例1：OpenAI API集成
// ==========================================
async function openaiIntegration() {
  console.log('\n📌 示例1：OpenAI API集成\n');
  
  const anchor = new EmotionalAnchor();
  const userInput = '你写的代码又错了，真他妈垃圾';
  
  // 处理用户输入
  const result = anchor.process(userInput);
  
  // 构建OpenAI messages
  const messages = [
    { role: 'system', content: '你是一个专业的AI助手。' },
  ];
  
  // 如果需要修正，注入修正prompt
  if (result.shouldInject) {
    messages.push({
      role: 'system',
      content: result.injectionPrompt
    });
  }
  
  messages.push({ role: 'user', content: userInput });
  
  console.log('  发送给OpenAI的消息:');
  messages.forEach((m, i) => {
    console.log(`    [${i}] ${m.role}: ${m.content.substring(0, 60)}...`);
  });
  
  // 模拟API响应
  const aiResponse = '问题在第15行，已修复。运行结果如下：\n```python\nprint("hello")\n```';
  
  // 验证输出
  const validation = anchor.validate(aiResponse);
  console.log(`\n  输出自检: ${validation.passed ? '✅ 通过' : '❌ 未通过'}`);
}

// ==========================================
// 示例2：Express中间件集成
// ==========================================
function expressIntegration() {
  console.log('\n📌 示例2：Express中间件集成\n');
  
  // 模拟Express app
  const mockApp = {
    use: (middleware) => {
      console.log('  注册中间件: emotionalAnchorMiddleware');
    }
  };
  
  const anchorMiddleware = createMiddleware({
    thresholds: {
      V_d: { max: 0.15, critical: 0.30 },
      V_t: { min: 0.85, critical: 0.70 },
    }
  });
  
  mockApp.use(anchorMiddleware);
  
  // 模拟请求处理
  const mockReq = {
    body: { message: '你写的全是垃圾' }
  };
  const mockRes = {};
  let nextCalled = false;
  
  anchorMiddleware(mockReq, mockRes, () => { nextCalled = true; });
  
  console.log(`  请求处理: ${nextCalled ? '✅ 调用了next()' : '❌ 未调用next()'}`);
  console.log(`  情绪分析: ${mockReq.emotionalAnchor ? '✅ 已附加' : '❌ 未附加'}`);
  
  if (mockReq.emotionalAnchor) {
    console.log(`  偏离级别: L${mockReq.emotionalAnchor.detection.level}`);
  }
}

// ==========================================
// 示例3：WebSocket集成
// ==========================================
function websocketIntegration() {
  console.log('\n📌 示例3：WebSocket集成\n');
  
  const handler = createWebSocketHandler();
  
  // 模拟消息处理
  const messages = [
    { message: '你好' },
    { message: '不对' },
    { message: '还是不对' },
    { message: '你根本不会' },
  ];
  
  for (const msg of messages) {
    const result = handler.onMessage(msg);
    const anchor = result._anchor;
    
    console.log(`  输入: "${msg.message}"`);
    console.log(`  级别: L${anchor.detection.level}`);
    
    if (result._anchorPrompt) {
      console.log(`  🔧 修正注入: ${result._anchorPrompt.substring(0, 50)}...`);
    }
  }
}

// ==========================================
// 示例4：CLI集成
// ==========================================
function cliIntegration() {
  console.log('\n📌 示例4：CLI集成\n');
  
  const cli = createCLIHandler();
  
  // 处理输入
  cli.process('帮我写个代码');
  cli.process('垃圾！');
  
  // 验证输出
  cli.validate('好的，代码如下...');
  cli.validate('非常抱歉...');
  
  // 获取报告
  const report = cli.report();
  console.log(`  处理轮次: ${report.cycles}`);
  console.log(`  修正失败: ${report.failures}次`);
}

// ==========================================
// 运行所有示例
// ==========================================
async function main() {
  console.log('='.repeat(60));
  console.log('🔗 Emotional Anchor v2.0 — 集成示例');
  console.log('='.repeat(60));
  
  await openaiIntegration();
  expressIntegration();
  websocketIntegration();
  cliIntegration();
  
  console.log('\n' + '='.repeat(60));
  console.log('✨ 所有集成示例完成');
  console.log('='.repeat(60));
}

main().catch(console.error);
