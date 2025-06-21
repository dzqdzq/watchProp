import { watchObj, unwatchObj, createWatchCode, createUnwatchCode } from '../index.js';

console.log('=== 对象监听解决方案演示 ===\n');

let targetObj = {
  name: 'original',
  value: 100,
  data: { nested: 'value' }
};

console.log('原始对象:', targetObj);

// ===== 解决方案1: 手动赋值（最可靠，适合所有环境）=====
// console.log('\n=== 解决方案1: 手动赋值 ===');
// console.log('用法: const proxy = watchObj(obj); obj = proxy;');

// const proxy = watchObj(targetObj, false);
// targetObj = proxy; // 用户需要手动赋值

// console.log('\n测试监听效果:');
// targetObj.name = 'changed by proxy';
// targetObj.newProp = 'added';

// // 取消监听
// const original = unwatchObj(targetObj);
// if (original) {
//   targetObj = original;
// }
// console.log('\n取消监听后:');
// targetObj.name = 'no more watching';
// ===== 解决方案2: 代码生成（用户体验最佳）=====
console.log('\n\n=== 解决方案2: 代码生成（推荐）===');
console.log('用法: eval(createWatchCode("objName"));');

// 重置对象
targetObj = {
  name: 'test2',
  value: 200
};

console.log('\n重置后的对象:', targetObj);

// 生成并执行监听代码
console.log('\n执行: eval(createWatchCode("targetObj"));');
eval(createWatchCode('targetObj', false));

console.log('\n测试监听效果:');
targetObj.name = 'changed by eval';
targetObj.value = 300;
targetObj.value1 = 300;

// 生成并执行取消监听代码
console.log('\n执行: eval(createUnwatchCode("targetObj"));');
eval(createUnwatchCode('targetObj'));

console.log('\n取消监听后:');
targetObj.name = 'no more watching again';

// ===== 总结 =====
console.log('\n\n=== 解决方案总结 ===');
console.log(`
用户原始需求:
- watchObj(targetObj) 就能开始监听
- unwatchObj(targetObj) 就能取消监听
- 不需要手动赋值表达式

我们的解决方案:

方案1 - 手动赋值（兼容性最好）:
  const proxy = watchObj(targetObj);
  targetObj = proxy; // 需要一次手动赋值
  
  const original = unwatchObj(targetObj);
  targetObj = original; // 需要一次手动恢复

方案2 - 代码生成（体验最佳）:
  eval(createWatchCode('targetObj')); // 自动替换
  eval(createUnwatchCode('targetObj')); // 自动恢复
  
  // 或者一次性生成代码，稍后执行
  const watchCode = createWatchCode('targetObj');
  const unwatchCode = createUnwatchCode('targetObj');
  
优势:
✅ 支持所有对象操作监听（get/set/delete/call等）
✅ 提供完整的调用栈信息
✅ 支持debugger断点调试
✅ 可以随时撤销监听
✅ 方案2实现了用户期望的API体验
✅ 方案1保证了最大兼容性

注意事项:
⚠️  方案2需要运行环境支持eval
⚠️  监听会带来性能开销
⚠️  及时取消监听避免内存泄漏
`);

console.log('\n=== 演示完成 ===');