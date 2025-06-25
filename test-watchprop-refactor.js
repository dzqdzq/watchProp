import { watchProp, unwatchProp, getWatchedProps } from './watchProp.js';
import { watchObj, unwatchObj } from './watchObj.js';

console.log('=== 测试重构后的 watchProp ===\n');

// 测试对象
const testObj = {
  name: 'test',
  age: 25,
  greet() {
    return `Hello, I'm ${this.name}`;
  }
};

console.log('1. 测试基本属性监听');
const proxy1 = watchProp(testObj, 'name', {
  log: true,
  onBefore: (context) => {
    console.log(`🔍 [BEFORE] ${context.type} 操作即将执行: ${context.property}`);
  },
  onAfter: (context) => {
    console.log(`✅ [AFTER] ${context.type} 操作已完成: ${context.property}`);
  }
});

console.log('设置 name 属性:');
proxy1.name = 'Alice';
console.log('获取 name 属性:', proxy1.name);
console.log('');

console.log('2. 测试方法监听');
watchProp(testObj, 'greet', {
  log: true,
  onCall: (context) => {
    console.log(`📞 [CALL] 方法被调用: ${context.property}`);
  }
});

console.log('调用 greet 方法:');
console.log(proxy1.greet());
console.log('');

console.log('3. 测试条件断点');
watchProp(testObj, 'age', {
  debugger: (context) => {
    // 只有当年龄设置为负数时才断点
    return context.type === 'set' && context.newValue < 0;
  },
  onModify: (context) => {
    console.log(`🔄 年龄修改: ${context.oldValue} -> ${context.newValue}`);
  }
});

console.log('设置正常年龄 (不会断点):');
proxy1.age = 30;
console.log('当前年龄:', proxy1.age);

console.log('设置负数年龄 (会触发断点条件，但在测试中不会真正断点):');
proxy1.age = -5;
console.log('');

console.log('4. 测试获取监听的属性');
const watchedProps = getWatchedProps(testObj);
console.log('当前被监听的属性:', watchedProps);
console.log('');

console.log('5. 测试取消单个属性监听');
console.log('取消 name 属性监听:');
const result1 = unwatchProp(testObj, 'name');
console.log('取消结果:', result1);

console.log('再次获取监听的属性:');
console.log('当前被监听的属性:', getWatchedProps(testObj));
console.log('');

console.log('6. 测试与 watchObj 的兼容性');
const testObj2 = { x: 1, y: 2 };

// 先用 watchObj 监听整个对象
const proxy2 = watchObj(testObj2, {
  log: false,
  onAccess: (context) => {
    console.log(`🔍 [watchObj] 访问属性: ${context.property}`);
  }
});

// 再用 watchProp 监听特定属性
watchProp(testObj2, 'x', {
  log: false,
  onModify: (context) => {
    console.log(`✏️ [watchProp] 修改属性 x: ${context.oldValue} -> ${context.newValue}`);
  }
});

console.log('访问 x 属性 (应该触发两个监听):');
console.log('x =', proxy2.x);

console.log('修改 x 属性:');
proxy2.x = 100;

console.log('访问 y 属性 (只触发 watchObj):');
console.log('y =', proxy2.y);
console.log('');

console.log('7. 测试清理所有监听');
console.log('取消 age 属性监听:');
unwatchProp(testObj, 'age');

console.log('取消 greet 属性监听:');
unwatchProp(testObj, 'greet');

console.log('最终监听状态:');
console.log('testObj 被监听的属性:', getWatchedProps(testObj));
console.log('testObj2 被监听的属性:', getWatchedProps(testObj2));

console.log('\n=== 测试完成 ===');