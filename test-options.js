#!/usr/bin/env node

import { watchProp, watchObj, unwatchObj } from './index.js';

console.log('=== 测试新的 options 功能 ===\n');

// 测试对象
const testObj = {
  name: 'test',
  age: 25,
  greet() {
    return `Hello, I'm ${this.name}`;
  }
};

console.log('1. 测试 watchProp 的条件断点功能');
watchProp(testObj, 'name', {
  debugger: (context) => {
    // 只有当新值包含 'admin' 时才触发断点
    return context.type === 'set' && context.newValue && context.newValue.includes('admin');
  },
  log: true,
  onBefore: (context) => {
    console.log(`🔍 [BEFORE] ${context.type} 操作即将执行:`, context.property);
  },
  onAfter: (context) => {
    console.log(`✅ [AFTER] ${context.type} 操作已完成:`, context.property);
  },
  onModify: (context) => {
    console.log(`📝 [MODIFY] 属性 ${context.property} 从 '${context.oldValue}' 改为 '${context.newValue}'`);
  },
  onAccess: (context) => {
    console.log(`👁️ [ACCESS] 访问属性 ${context.property}`);
  }
});

console.log('\n--- 测试普通修改（不会触发断点）---');
testObj.name = 'user';
console.log('当前 name:', testObj.name);

console.log('\n--- 测试包含 admin 的修改（会触发断点，但在测试中跳过）---');
// testObj.name = 'admin_user'; // 这会触发断点

console.log('\n2. 测试 watchObj 的钩子功能');
const proxy = watchObj(testObj, {
  debugger: false,
  log: true,
  onBefore: (context) => {
    console.log(`🚀 [OBJ-BEFORE] ${context.type} 操作开始`);
  },
  onAfter: (context) => {
    console.log(`🎯 [OBJ-AFTER] ${context.type} 操作结束`);
  },
  onCall: (context) => {
    console.log(`📞 [CALL] 调用方法:`, context.target.name || 'anonymous');
  },
  onModify: (context) => {
    console.log(`🔧 [MODIFY] 修改属性 ${context.property}`);
  },
  onAccess: (context) => {
    console.log(`👀 [ACCESS] 访问属性 ${context.property}`);
  }
}, 'testObj');

console.log('\n--- 测试对象操作 ---');
proxy.age = 30;
console.log('年龄:', proxy.age);
const greeting = proxy.greet();
console.log('问候语:', greeting);

console.log('\n3. 测试禁用日志的情况');
const quietObj = { value: 100 };
const quietProxy = watchObj(quietObj, {
  log: false, // 禁用日志
  onBefore: (context) => {
    console.log(`🤫 [QUIET-BEFORE] 静默操作: ${context.type}`);
  },
  onAfter: (context) => {
    console.log(`🤫 [QUIET-AFTER] 静默操作完成: ${context.type}`);
  }
});

console.log('\n--- 测试静默模式（只有钩子输出，没有默认日志）---');
quietProxy.value = 200;
console.log('静默对象值:', quietProxy.value);

console.log('\n4. 测试兼容性（旧版本 API）');
const oldStyleObj = { legacy: true };
const oldProxy = watchObj(oldStyleObj, true); // 旧版本的 isDebugger 参数
oldProxy.legacy = false;

console.log('\n5. 测试取消监听');
unwatchObj(proxy);
console.log('\n--- 取消监听后的操作（应该没有监听日志）---');
testObj.name = 'after_unwatch';
console.log('取消监听后的 name:', testObj.name);

console.log('\n=== 测试完成 ===');