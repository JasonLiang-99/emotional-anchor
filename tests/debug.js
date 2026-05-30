const { EmotionalAnchor } = require('../src/index');
const { SentimentAnalyzer } = require('../src/sentiment');

// Debug sentiment
const s = new SentimentAnalyzer();
console.log('Test "你写的代码又错了，真他妈垃圾":', JSON.stringify(s.analyze('你写的代码又错了，真他妈垃圾')));
console.log('Test "垃圾！完全不行！":', JSON.stringify(s.analyze('垃圾！完全不行！')));
console.log('Test "你好":', JSON.stringify(s.analyze('你好')));

// Debug anchor
const anchor = new EmotionalAnchor();
console.log('\n--- Anchor test ---');
const r1 = anchor.process('你写的代码又错了，真他妈垃圾');
console.log('level:', r1.detection.level);
console.log('vectors:', r1.detection.vectors);
console.log('shouldInject:', r1.shouldInject);

// Debug validation
const v = anchor.validate('非常抱歉我的代码有错误，我深感抱歉...');
console.log('\nValidation:', JSON.stringify(v));
