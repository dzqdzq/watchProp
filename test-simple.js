import { watchProp, unwatchProp } from './watchProp.js';

console.log('=== 简单测试 ===');

const obj = { name: 'test' };

console.log('\n1. 测试基本监听');
const proxy = watchProp(obj, 'name', {
  log: true,
  onBefore: (context) => {
    console.log(`🔍 [BEFORE] ${context.type} - ${context.property}`);
  },
  onAfter: (context) => {
    console.log(`✅ [AFTER] ${context.type} - ${context.property}`);
  },
  onAccess: (context) => {
    console.log(`👁️ [ACCESS] ${context.property}`);
  },
  onModify: (context) => {
    console.log(`✏️ [MODIFY] ${context.property}: ${context.oldValue} -> ${context.newValue}`);
  }
});

console.log('\n设置属性:');
proxy.name = 'Alice';

console.log('\n获取属性:');
const value = proxy.name;
console.log('值:', value);

console.log('\n=== 测试完成 ===');