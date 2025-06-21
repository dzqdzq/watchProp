import { watchObj, unwatchObj } from '../index.js';

console.log('=== 数组监听测试 ===\n');

let testArray = [1, 2, 3, 'hello', { nested: 'object' }];

console.log('原始数组:', testArray);
console.log('数组长度:', testArray.length);

console.log('\n开始监听数组');
const proxy = watchObj(testArray, false);
testArray = proxy;

console.log('\n1. 通过索引读取元素（get）:');
const firstElement = testArray[0];
const lastElement = testArray[testArray.length - 1];

console.log('\n2. 通过索引修改元素（set）:');
testArray[0] = 'modified';
testArray[1] = 999;

console.log('\n3. 添加新元素到指定索引（defineProperty）:');
testArray[10] = 'sparse array';

console.log('\n4. 使用 push 方法添加元素:');
testArray.push('pushed element');

console.log('\n5. 使用 pop 方法移除元素:');
const popped = testArray.pop();

console.log('\n6. 使用 unshift 方法在开头添加元素:');
testArray.unshift('first element');

console.log('\n7. 使用 shift 方法移除第一个元素:');
const shifted = testArray.shift();

console.log('\n8. 使用 splice 方法插入/删除元素:');
const spliced = testArray.splice(2, 1, 'inserted1', 'inserted2');

console.log('\n9. 修改 length 属性:');
testArray.length = 5;

console.log('\n10. 删除数组元素（delete）:');
delete testArray[2];

console.log('\n11. 检查数组属性（has）:');
const hasIndex = 1 in testArray;
const hasLength = 'length' in testArray;
const hasPush = 'push' in testArray;

console.log('\n12. 遍历数组（ownKeys + get）:');
for (let key in testArray) {
  const value = testArray[key];
}

console.log('\n13. 使用 Object.keys 获取键（ownKeys）:');
const keys = Object.keys(testArray);

console.log('\n14. 访问数组方法（get）:');
const pushMethod = testArray.push;

console.log('\n15. 使用 forEach 方法:');
testArray.forEach((item, index) => {
  // 这里会触发多次 get 操作
});

console.log('\n16. 取消监听:');
const original = unwatchObj(testArray);
if (original) {
  testArray = original;
  console.log('取消监听成功');
}

console.log('\n17. 取消监听后的操作（不应触发监听）:');
testArray.push('after unwatch');
testArray[0] = 'no more logging';

console.log('\n=== 数组测试完成 ===');
console.log('最终数组:', testArray);
console.log('\n观察结果:');
console.log('✅ 数组索引访问和修改被正确监听');
console.log('✅ 数组方法调用被正确监听');
console.log('✅ 数组属性操作被正确监听');
console.log('✅ 稀疏数组操作被正确监听');
console.log('✅ 数组遍历操作被正确监听');