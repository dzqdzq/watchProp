# watchProps

一个强大的JavaScript对象和属性监听工具库，支持监听对象的所有操作（读取、写入、删除、方法调用等）。

## 功能特性

- 🔍 **属性监听**: 监听对象特定属性的访问、修改和调用
- 📦 **对象监听**: 监听整个对象的所有操作
- 🚀 **用户友好**: 提供多种使用方案，适应不同场景
- 🛠️ **调试支持**: 内置debugger支持，方便调试
- 📝 **详细日志**: 提供完整的调用栈信息
- ♻️ **可撤销**: 支持随时取消监听

## 安装

```bash
npm install watch-props
```

## 快速开始

### 属性监听

```javascript
import { watchProp } from 'watch-props';

const obj = { name: 'test', value: 42 };

// 监听特定属性
watchProp(obj, 'name', true); // 第三个参数为是否开启debugger

obj.name = 'changed'; // 会输出监听日志
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

### watchProp(targetObject, propertyName, isDebugger)

监听对象的特定属性。

**参数:**
- `targetObject` (Object): 目标对象
- `propertyName` (String|Symbol): 要监听的属性名
- `isDebugger` (Boolean): 是否开启debugger，默认false

### watchObj(obj, isDebugger, objName)

创建对象监听proxy。

**参数:**
- `obj` (Object): 要监听的对象
- `isDebugger` (Boolean): 是否开启debugger，默认false
- `objName` (String): 对象名称（可选）

**返回:** Proxy对象

### unwatchObj(objOrName)

取消对象监听。

**参数:**
- `objOrName` (Object|String): 要取消监听的对象或对象名称

**返回:** Boolean - 是否成功取消

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

## 使用场景

### 调试对象变化

```javascript
let userState = { name: 'John', age: 30 };

// 开启调试模式监听
eval(createWatchCode('userState', true));

// 任何对userState的操作都会触发debugger
userState.name = 'Jane';
```

### 监听数组操作

```javascript
let myArray = [1, 2, 3];

const arrayProxy = watchObj(myArray);
myArray = arrayProxy;

// 监听数组操作
myArray.push(4); // 会输出日志
myArray[0] = 'changed'; // 会输出日志
```

### 监听函数调用

```javascript
let api = {
  getData() { return 'data'; },
  setData(value) { this.data = value; }
};

const apiProxy = watchObj(api);
api = apiProxy;

// 监听方法调用
api.getData(); // 会输出调用日志
api.setData('new data'); // 会输出调用日志
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

## 许可证

MIT