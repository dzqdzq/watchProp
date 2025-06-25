# watchProps

强大的 JavaScript 对象属性监听工具，支持细粒度的属性监控和对象行为追踪。

## 特性

- 🎯 **属性级监听**: 精确监控特定属性的访问、修改和调用
- 🔍 **对象级监听**: 全面监控对象的所有操作
- 🪝 **丰富的钩子**: 支持 before/after 钩子，类似 Frida 的拦截机制
- 🐛 **条件断点**: 支持函数式条件断点，精确调试
- 🔧 **高度可配置**: 灵活的选项配置，满足不同场景需求
- 🔄 **向后兼容**: 完全兼容旧版本 API
- 🚀 **零依赖**: 纯 JavaScript 实现，无外部依赖

## 安装

```bash
npm install watch-props
```

## 快速开始

### 基本用法

```javascript
import { watchProp, watchObj } from 'watch-props';

// 监控特定属性
const obj = { name: 'test', age: 25 };
const proxy = watchProp(obj, 'name', {
  onModify: (context) => {
    console.log(`属性 ${context.property} 从 ${context.oldValue} 改为 ${context.newValue}`);
  }
});

proxy.name = 'Alice'; // 触发监听

// 监控整个对象
const objProxy = watchObj(obj, {
  onAccess: (context) => {
    console.log(`访问了属性: ${context.property}`);
  }
});
```

### 高级用法

```javascript
// 条件断点
watchProp(user, 'password', {
  debugger: (context) => {
    // 只有在设置弱密码时才断点
    return context.type === 'set' && context.newValue.length < 8;
  }
});

// 性能监控
watchObj(apiClient, {
  onCall: (context) => {
    context.startTime = performance.now();
  },
  onAfter: (context) => {
    if (context.type === 'apply') {
      console.log(`API 调用耗时: ${performance.now() - context.startTime}ms`);
    }
  }
});
```

### 对象监听

#### 方案1: 手动赋值（最可靠）

```javascript
import { watchObj, unwatchObj } from 'watch-props';

let myObj = { name: 'test', value: 42 };

// 创建监听proxy
const proxy = watchObj(myObj, false);
myObj = proxy; // 手动替换原对象

// 现在所有操作都会被监听
myObj.name = 'changed';
myObj.newProp = 'new value';
delete myObj.value;

// 取消监听
unwatchObj(myObj);
```

#### 方案2: 代码生成（推荐）

```javascript
import { createWatchCode, createUnwatchCode } from 'watch-props';

let myObj = { name: 'test', value: 42 };

// 生成监听代码
const watchCode = createWatchCode('myObj', false);
eval(watchCode); // 自动替换myObj为proxy

// 测试监听
myObj.name = 'changed'; // 会输出监听日志

// 生成取消监听代码
const unwatchCode = createUnwatchCode('myObj');
eval(unwatchCode); // 自动恢复原对象
```

## API 文档

### watchProp(target, property, options)

监听对象的特定属性。

**参数:**
- `target` - 目标对象
- `property` - 要监听的属性名
- `options` - 配置选项（可以是布尔值或对象）

**返回:** 代理对象

```javascript
// 简单用法（向后兼容）
watchProp(obj, 'name', true); // 开启调试

// 完整配置
watchProp(obj, 'name', {
  debugger: true, // 或函数
  log: true,
  onBefore: (context) => { /* ... */ },
  onAfter: (context) => { /* ... */ },
  onAccess: (context) => { /* ... */ },
  onModify: (context) => { /* ... */ },
  onCall: (context) => { /* ... */ }
});
```

### watchObj(target, options)

监听整个对象的所有操作。

**参数:**
- `target` - 目标对象
- `options` - 配置选项（可以是布尔值或对象）

**返回:** 代理对象

```javascript
// 简单用法
watchObj(obj, true); // 开启调试

// 完整配置
watchObj(obj, {
  debugger: (context) => context.type === 'set',
  log: false,
  onBefore: (context) => console.log('操作前:', context),
  onAfter: (context) => console.log('操作后:', context)
});
```

### unwatchProp(target, property)

取消对特定属性的监听。

```javascript
unwatchProp(obj, 'name');
```

### unwatchObj(target)

取消对整个对象的监听。

```javascript
unwatchObj(obj);
```

### getWatchedProps(target)

获取对象当前被监听的所有属性。

```javascript
const props = getWatchedProps(obj);
console.log('被监听的属性:', props);
```

### createWatchCode(objName, isDebugger)

生成用于监听对象的可执行代码。

**参数:**
- `objName` (String): 对象变量名
- `isDebugger` (Boolean): 是否开启debugger，默认false

**返回:** String - 可执行的代码

### createUnwatchCode(objName)

生成用于取消监听的可执行代码。

**参数:**
- `objName` (String): 对象变量名

**返回:** String - 可执行的代码

## 配置选项

### Options 对象

```javascript
{
  debugger: boolean | function,  // 是否开启断点或条件断点函数
  log: boolean,                  // 是否开启日志输出
  onBefore: function,            // 操作前钩子
  onAfter: function,             // 操作后钩子
  onAccess: function,            // 属性访问钩子
  onModify: function,            // 属性修改钩子
  onCall: function               // 方法调用钩子
}
```

### Context 对象

钩子函数接收的 context 对象包含以下信息：

```javascript
{
  type: string,        // 操作类型: 'get', 'set', 'apply', 'deleteProperty' 等
  target: object,      // 目标对象
  property: string,    // 属性名（如果适用）
  value: any,          // 当前值或返回值
  oldValue: any,       // 旧值（set 操作时）
  newValue: any,       // 新值（set 操作时）
  args: array,         // 方法参数（apply 操作时）
  result: any,         // 操作结果
  caller: string,      // 调用者信息
  timestamp: number    // 时间戳
}
```

## 使用场景

### 1. 开发调试

```javascript
// 调试状态变化
const state = { count: 0, user: null };
watchProp(state, 'count', {
  debugger: (context) => context.newValue > 10, // 只在 count > 10 时断点
  onModify: (context) => {
    console.log(`计数器从 ${context.oldValue} 变为 ${context.newValue}`);
  }
});
```

### 2. 数据验证

```javascript
// 属性验证
watchProp(user, 'email', {
  onModify: (context) => {
    if (!context.newValue.includes('@')) {
      throw new Error('无效的邮箱地址');
    }
  }
});
```

### 3. 性能监控

```javascript
// API 性能监控
watchObj(apiClient, {
  onCall: (context) => {
    context.startTime = performance.now();
    console.log(`开始调用 ${context.property}`);
  },
  onAfter: (context) => {
    if (context.type === 'apply') {
      const duration = performance.now() - context.startTime;
      console.log(`${context.property} 耗时: ${duration.toFixed(2)}ms`);
    }
  }
});
```

### 4. 状态同步

```javascript
// 自动同步到 localStorage
watchObj(appState, {
  onModify: (context) => {
    localStorage.setItem('appState', JSON.stringify(context.target));
  }
});
```

### 5. 安全监控

```javascript
// 监控敏感操作
watchProp(secureObject, 'password', {
  onAccess: (context) => {
    console.warn('密码被访问!', context.caller);
    // 记录访问日志
  },
  onModify: (context) => {
    console.warn('密码被修改!', context.caller);
    // 触发安全检查
  }
});
```

## 注意事项

⚠️ **性能影响**：监听会带来一定的性能开销，建议在开发调试时使用

⚠️ **内存管理**：及时调用 `unwatchObj()` 取消监听，避免内存泄漏

⚠️ **eval安全性**：方案2使用了 `eval`，请确保在安全的环境中使用

⚠️ **兼容性**：某些环境可能不支持 `eval`，此时请使用方案1

✅ **内部优化**：
  - 使用 WeakMap 存储 Proxy 元数据，避免在监听过程中触发额外的监听事件
  - 优化 set trap 实现，避免 Reflect.set 触发重复的 defineProperty 监听

## 高级用法

### 自定义监听管理

```javascript
import { watchManager } from 'watch-props';

// 直接使用管理器
const proxy = watchManager.watchObj(myObj, false, 'myCustomObj');

// 按名称取消监听
watchManager.unwatchObj('myCustomObj');
```

### 批量监听

```javascript
const objects = [obj1, obj2, obj3];
const proxies = objects.map(obj => watchObj(obj));

// 批量取消
proxies.forEach(proxy => unwatchObj(proxy));
```

## 高级用法

### 自定义监听管理

```javascript
import { watchManager } from 'watch-props';

// 直接使用管理器
const proxy = watchManager.watchObj(myObj, false, 'myCustomObj');

// 按名称取消监听
watchManager.unwatchObj('myCustomObj');
```

### 批量监听

```javascript
const objects = [obj1, obj2, obj3];
const proxies = objects.map(obj => watchObj(obj));

// 批量取消
proxies.forEach(proxy => unwatchObj(proxy));
```

## 许可证

MIT