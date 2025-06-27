# watchProp

在实际项目中或者逆向工程中, 经常会遇到某个值修改了, 但是不知道谁修改了它。<br/>
这个工具可以帮助你拦截到这个修改, 或者在修改之前, 或者修改之后, 做一些事情。<br/>
对象级别的监控工具: npm i -g watchobj

## 特性

- 🎯 **对象属性监听**: 精确监控特定属性的访问、修改和调用
- 🐛 **条件断点**: 支持函数式条件断点，精确调试
- 🔧 **高度可配置**: 灵活的选项配置，满足不同场景需求
- 🚀 **零依赖**: 纯 JavaScript 实现，无外部依赖

## 安装

```bash
npm i -g watchprop
```

## 快速开始

### 拷贝到剪切板, 然后粘贴到你需要的地方(一般是chrome开发者工具)

```bash
watchprop # copy to clipboard
```

### 基本用法

```javascript
// 监控特定属性
const obj = { name: 'test', age: 25 };
watchProp(obj, 'name', true);

obj.name = 'Alice'; // 此处自动触发断点

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
```

## API 文档

### watchProp(targetObject, propertyName, options)

监听对象的特定属性。

**参数:**
- `targetObject` (`Object`): 目标对象。
- `propertyName` (`string`): 要监控的属性名，支持普通属性和 `Symbol`。
- `options` (`Object` | `boolean`): 配置选项。如果为布尔值，则等同于设置 `options.debugger`。

**配置选项 (`options`):**
- `debugger` (`boolean` | `Function`): 是否开启调试。设置为 `true` 时，在属性被访问、修改或调用时会触发 `debugger`。也可以提供一个函数 `(context) => boolean` 来实现条件断点。
- `log` (`boolean`): 是否在控制台输出日志，默认为 `true`。
- `onModResult` (`Function`): 一个回调函数，用于在属性被操作（获取、设置、调用）时自定义行为。它可以接收一个 `context` 对象，并根据需要返回一个新值来覆盖原始操作的结果。

```javascript
// 简单用法: 开启调试
watchProp(obj, 'name', true);

// 完整配置: 条件断点和自定义结果
watchProp(obj, 'name', {
  debugger: (context) => context.type === 'set' && context.newValue === 'danger',
  log: true,
  onModResult: (context) => {
    if (context.type === 'get') {
      // 修改获取到的值
      return `[Protected] ${context.result}`;
    }
    if (context.type === 'set') {
      // 验证并修改将要设置的值
      if (context.newValue.length < 3) {
        console.error('Name is too short!');
        return context.oldValue; // 阻止修改
      }
      return context.newValue.toUpperCase(); // 将新值转为大写
    }
    // 对于函数调用，可以决定是否执行原函数
    if (context.type === 'call') {
      console.log(`Function ${context.property} is being called.`);
      // 不执行原函数
      return;
    }
  }
});
```

## 配置选项

### Options 对象

```javascript
{
  debugger: boolean | function,  // 是否开启断点或条件断点函数
  log: boolean,                  // 是否开启日志输出,默认为true
  onModResult: function          // 操作结果处理函数
}
```

### Context 对象

`onModResult` 和 `debugger` 函数接收的 `context` 对象包含以下信息：

```javascript
{
  type: string,        // 操作类型: 'get', 'set', 'call'
  target: object,      // 目标对象
  property: string,    // 属性名
  caller: string,      // 调用堆栈信息

  // 仅在 'set' 类型下可用
  oldValue: any,       // 旧值
  newValue: any,       // 新值

  // 仅在 'get' 和 'set' 类型下可用
  result: any,         // 原始操作的结果

  // 仅在 'call' 类型下可用
  arguments: array,    // 函数调用时的参数
  func: function       // 原始函数
}
```

## 许可证

MIT