/**
 * 监控对象某个属性行为
 * @param {Object} target 目标对象
 * @param {string} propertyName 要监控的属性名， 支持Symbol
 * @param {Object|Boolean} options 配置选项, if options is boolean, options is debugger
 * @param {Boolean|Function} options.debugger 是否开启调试或条件断点函数
 * @param {Boolean} options.log 是否输出日志，默认true
 * @param {Function} options.onModResult 返回值处理函数
 */
function watchProp(targetObject, propertyName, options = {}) {
  const TAG = "WATCH_PROP";
  if(typeof options === "boolean"){
    options = {
      debugger: options
    }
  }
  const config = {
    debugger: false,
    log: true,
    onModResult: null,
    ...options
  };

  function getCallerInfo() {
    const error = new Error();
    const stack = error.stack.split('\n');
    return stack.slice(2).join('\n');
  }

  // 防止无限递归
  const safeLog = (message, ...args) => {
    if (config.log && targetObject !== console && propertyName !== 'log') {
      console.log(`[${TAG}]`, message, ...args);
    }
  };

  // 防止无限递归
  const errorLog = (message, ...args) => {
    const isErrorHook = targetObject === console && propertyName === 'error';
    const log = isErrorHook ? console.log : console.error;
    log(`[${TAG}]`, message, ...args);
  };
  
  if (!targetObject) {
    errorLog(`targetObject不能为空`);
    return;
  }

  if(typeof propertyName !== 'string'){
    errorLog(`参数错误, propertyName必须是string`);
    return;
  }

  propertyName = propertyName.trim();
  if(propertyName === ""){
    errorLog(`参数错误, propertyName不能为空`);
    return;
  }

  let prop = propertyName;
  if (propertyName.startsWith("Symbol(")) {
    propertyName = propertyName.replace(/"/g, "").replace(/'/g, "");
    let sym = Object.getOwnPropertySymbols(targetObject).find(
      (symbol) => symbol.toString() === propertyName
    );
    if (!sym) {
      errorLog(`${propertyName} Symbol属性不存在`);
      return;
    }
    prop = sym;
  }

  const desc = Object.getOwnPropertyDescriptor(targetObject, prop);
  if (!desc) {
    errorLog("无法监控",`${propertyName} 属性不存在, `);
    return;
  }
  if (!desc.configurable) {
    errorLog("无法监控",`${propertyName} 被限制修改`);
    return;
  }

  if(!watchProp._watchmap){
    watchProp._watchmap = new WeakMap();
  }

  if(!watchProp._watchmap.get(targetObject)){
    watchProp._watchmap.set(targetObject, {});
  }

  if(watchProp._watchmap.get(targetObject)[propertyName]){
    errorLog("无法监控",`当前对象的${propertyName}属性已经被监控`);
    return;
  }

  const shouldDebug = (context) => {
    if (typeof config.debugger === 'function') {
      return config.debugger(context);
    }
    return config.debugger;
  };
  
  const { set, get } = desc;
  if (typeof desc.value === "function") {
    let func = desc.value;
    targetObject[prop] = function (...args) {
      const context = {
        type: 'call',
        target: targetObject,
        property: propertyName,
        arguments: args,
        caller: getCallerInfo()
      };

      if (shouldDebug(context)) {
        debugger;
      }

      safeLog(`[call] ${propertyName} args:`, args, "调用位置:\n",
        context.caller
      );

      if (config.onModResult) {
        return config.onModResult({ ...context, func: func.bind(this) });
      }
      return func.apply(this, args);
    };
    return;// end hook function
  } else if (set || get) {
    let oldSet = set;
    let oldGet = get;
    if (oldSet) {
      desc.set = function (value) {
        const context = {
          type: 'set',
          target: targetObject,
          property: propertyName,
          oldValue: oldGet? oldGet.call(this) : this[prop],
          newValue: value,
          caller: getCallerInfo()
        };

        if (shouldDebug(context)) {
          debugger;
        }
        
        if (typeof config.onModResult === 'function') {
          const newVal = config.onModResult({ ...context, result: value });
          safeLog(`[set] ${propertyName}`, "onModResult成功", "原值",context.oldValue,
            "应该修改为:", value, "实际修改为:", newVal, 
            "修改位置:\n", context.caller
          );
          oldSet.call(this, newVal);
          return;
        }// end if
        safeLog(`[set] ${propertyName}`, "原值", context.oldValue, "新值",value, 
          "修改位置:\n", context.caller
        );
        oldSet.call(this, value);
        return;
      };
    }
    if (oldGet) {
      desc.get = function () {
        const context = {
          type: 'get',
          target: targetObject,
          property: propertyName,
          caller: getCallerInfo()
        };

        // 条件断点
        if (shouldDebug(context)) {
          debugger;
        }
        
        // 执行原getter
        const result = oldGet.apply(this);
        
        if (typeof config.onModResult === 'function') {
          const newVal = config.onModResult({ ...context, result });
          oldSet && oldSet.call(this, newVal);
          safeLog(`[get] ${propertyName}`, "onModResult成功", 
            "应该获取:", result, "实际获取:", newVal, 
            "获取位置:\n", context.caller
          );
          return newVal;
        }

        safeLog(`[get] ${propertyName}`, "获取值:", result, 
          "获取位置:\n", context.caller
        );
        return result;
      };
    }
    Object.defineProperty(targetObject, prop, desc);
    return;//end hook set get
  } else {
    let _value = targetObject[prop];
    Object.defineProperty(targetObject, prop, {
      get: function () {
        const context = {
          type: 'get',
          target: targetObject,
          property: propertyName,
          value: _value,
          caller: getCallerInfo()
        };
        
        if (shouldDebug(context)) {
          debugger;
        }
        
        if (typeof config.onModResult === 'function') {
          const result = _value;
          _value = config.onModResult({ ...context, result });
          safeLog(`[get] ${propertyName}`, "onModResult成功", 
            "应该获取:", result, "实际获取:", _value, 
            "获取位置:\n", context.caller
          );
          return;
        }

        safeLog(`[get] ${propertyName} 值:`, _value, "位置:\n", context.caller);
        return _value;
      },
      set: function (value) {
        const context = {
          type: 'set',
          target: targetObject,
          property: propertyName,
          oldValue: _value,
          newValue: value,
          caller: getCallerInfo()
        };
        
        if (shouldDebug(context)) {
          debugger;
        }
        
        if (typeof config.onModResult === 'function') {
          _value = config.onModResult({ ...context, result: value });
          safeLog(`[set] ${propertyName}`, "onModResult成功", "原值",context.oldValue,
            "应该修改为:", value, "实际修改为:", _value, 
            "修改位置:\n", context.caller
          );
          return;
        }

        safeLog(`[set] ${propertyName} 原值:`, _value, "新值:", value, 
          "修改位置:\n", context.caller
        );
        _value = value;
      },
      configurable: true,
      enumerable: true,
    });
  }

  watchProp._watchmap.get(targetObject)[propertyName] = config;
  if(!watchProp.getConfig){
    watchProp.getConfig = function(targetObject, propertyName){
      return watchProp._watchmap.get(targetObject)[propertyName];
    }
  }
  return config;
}
