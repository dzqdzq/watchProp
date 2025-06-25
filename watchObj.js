// 全局对象监听管理器
const watchManager = {
  // 存储原始对象到监听信息的映射
  watchedObjects: new WeakMap(),
  // 存储对象名称到对象的映射（用于eval方案）
  namedObjects: new Map(),
  // 存储Proxy对象的元数据，避免在Proxy上定义属性触发监听
  proxyMetadata: new WeakMap(),

  /**
   * 监听对象 - 高级版本，支持自动替换
   * @param {Object} obj 要监听的对象
   * @param {Object|Boolean} options 配置选项或兼容旧版本的isDebugger参数
   * @param {Boolean|Function} options.debugger 是否开启调试或条件断点函数
   * @param {Boolean} options.log 是否输出日志，默认true
   * @param {Function} options.onBefore 操作前钩子函数
   * @param {Function} options.onAfter 操作后钩子函数
   * @param {Function} options.onAccess 访问属性时的钩子
   * @param {Function} options.onModify 修改属性时的钩子
   * @param {Function} options.onCall 调用方法时的钩子
   * @param {Function} options.onDefine 定义属性时的钩子
   * @param {Function} options.onDelete 删除属性时的钩子
   * @param {Function} options.onConstruct 构造函数调用时的钩子
   * @param {String} objName 对象名称（用于eval替换）
   * @returns {Object} 返回proxy对象
   */
  watchObj(obj, options = {}, objName = null) {
    // 兼容旧版本API
    if (typeof options === "boolean") {
      options = { debugger: options };
    }

    // 默认配置
    const config = {
      debugger: false,
      log: true,
      onBefore: null,
      onAfter: null,
      onAccess: null,
      onModify: null,
      onCall: null,
      onDefine: null,
      onDelete: null,
      onConstruct: null,
      ...options,
    };
    const TAG = "WATCH_OBJ";

    if (!obj || (typeof obj !== "object" && typeof obj !== "function")) {
      console.error(`[${TAG}] 参数必须是对象或函数`);
      return obj;
    }

    // 如果已经被监听，直接返回
    if (this.watchedObjects.has(obj)) {
      console.warn(`[${TAG}] 对象已经被监听`);
      return this.watchedObjects.get(obj).proxy;
    }

    // 辅助函数：条件断点检查
    const shouldDebug = (context) => {
      if (typeof config.debugger === "function") {
        return config.debugger(context);
      }
      return config.debugger;
    };

    // 辅助函数：安全日志输出
    const safeLog = (action, infos) => {
      if (config.log) {
        console.log(
          `[${TAG}] [${action}]`,
          infos,
          "stack:",
          new Error().stack.split("\n").slice(3).join("\n")
        );
      }
    };

    const proxyInfo = Proxy.revocable(obj, {
      apply(target, thisArg, argumentsList) {
        const context = {
          type: "apply",
          target,
          thisArg,
          arguments: argumentsList,
          caller: new Error().stack,
        };

        // 执行前钩子
        if (config.onBefore) {
          config.onBefore(context);
        }
        if (config.onCall) {
          config.onCall(context);
        }

        // 条件断点
        if (shouldDebug(context)) {
          debugger;
        }

        // 日志输出
        safeLog("call/apply", { 调用方法: target, 参数: argumentsList });

        // 执行原函数
        const result = Reflect.apply(target, thisArg, argumentsList);

        // 执行后钩子
        const afterContext = { ...context, result };
        if (config.onAfter) {
          config.onAfter(afterContext);
        }

        return result;
      },

      defineProperty(target, propertyName, desc) {
        const context = {
          type: "defineProperty",
          target,
          property: propertyName,
          descriptor: desc,
          caller: new Error().stack,
        };

        // 执行前钩子
        if (config.onBefore) {
          config.onBefore(context);
        }
        if (config.onDefine) {
          config.onDefine(context);
        }

        // 条件断点
        if (shouldDebug(context)) {
          debugger;
        }

        // 日志输出
        safeLog("defineProperty", {
          target,
          属性名: propertyName,
          属性描述: desc,
        });

        // 执行原操作
        const result = Reflect.defineProperty(target, propertyName, desc);

        // 执行后钩子
        const afterContext = { ...context, result };
        if (config.onAfter) {
          config.onAfter(afterContext);
        }

        return result;
      },
      deleteProperty(target, propertyName) {
        const deletedValue = Reflect.get(target, propertyName);
        const context = {
          type: "deleteProperty",
          target,
          property: propertyName,
          deletedValue,
          caller: new Error().stack,
        };

        // 执行前钩子
        if (config.onBefore) {
          config.onBefore(context);
        }
        if (config.onDelete) {
          config.onDelete(context);
        }

        // 条件断点
        if (shouldDebug(context)) {
          debugger;
        }

        // 日志输出
        safeLog("deleteProperty", {
          target,
          属性名: propertyName,
          删除值: deletedValue,
        });

        // 执行原操作
        const result = Reflect.deleteProperty(target, propertyName);

        // 执行后钩子
        const afterContext = { ...context, result };
        if (config.onAfter) {
          config.onAfter(afterContext);
        }

        return result;
      },
      has(target, propertyName) {
        const context = {
          type: "has",
          target,
          property: propertyName,
          caller: new Error().stack,
        };

        // 执行前钩子
        if (config.onBefore) {
          config.onBefore(context);
        }

        // 条件断点
        if (shouldDebug(context)) {
          debugger;
        }

        // 执行原操作
        const value = Reflect.has(target, propertyName);

        // 日志输出
        safeLog("has", { target, 属性名: propertyName, 是否存在: value });

        // 执行后钩子
        const afterContext = { ...context, exists: value };
        if (config.onAfter) {
          config.onAfter(afterContext);
        }

        return value;
      },
      get(target, prop, receiver) {
        const context = {
          type: "get",
          target,
          property: prop,
          receiver,
          caller: new Error().stack,
        };

        // 执行前钩子
        if (config.onBefore) {
          config.onBefore(context);
        }
        if (config.onAccess) {
          config.onAccess(context);
        }

        // 条件断点
        if (shouldDebug(context)) {
          debugger;
        }

        // 执行原操作
        const value = Reflect.get(target, prop, receiver);

        // 日志输出
        safeLog("get", { target, 属性名: prop, 获取值: value });

        // 执行后钩子
        const afterContext = { ...context, value };
        if (config.onAfter) {
          config.onAfter(afterContext);
        }

        return value;
      },
      set(target, prop, value, receiver) {
        const oldValue = Reflect.get(target, prop);
        const context = {
          type: "set",
          target,
          property: prop,
          oldValue,
          newValue: value,
          receiver,
          caller: new Error().stack,
        };

        // 执行前钩子
        if (config.onBefore) {
          config.onBefore(context);
        }
        if (config.onModify) {
          config.onModify(context);
        }

        // 条件断点
        if (shouldDebug(context)) {
          debugger;
        }

        // 日志输出
        safeLog("set", { target, 属性名: prop, 原值: oldValue, 新值: value });

        // 直接设置属性值，避免触发defineProperty trap
        target[prop] = value;

        // 执行后钩子
        const afterContext = { ...context, success: true };
        if (config.onAfter) {
          config.onAfter(afterContext);
        }

        return true;
      },
      construct(target, argumentsList) {
        const context = {
          type: "construct",
          target,
          arguments: argumentsList,
          caller: new Error().stack,
        };

        // 执行前钩子
        if (config.onBefore) {
          config.onBefore(context);
        }
        if (config.onConstruct) {
          config.onConstruct(context);
        }

        // 条件断点
        if (shouldDebug(context)) {
          debugger;
        }

        // 日志输出
        safeLog("new_class", { target, 参数: argumentsList });

        // 执行原操作
        const result = Reflect.construct(target, argumentsList);

        // 执行后钩子
        const afterContext = { ...context, instance: result };
        if (config.onAfter) {
          config.onAfter(afterContext);
        }

        return result;
      },
      ownKeys(target) {
        const context = {
          type: "ownKeys",
          target,
          caller: new Error().stack,
        };

        // 执行前钩子
        if (config.onBefore) {
          config.onBefore(context);
        }

        // 条件断点
        if (shouldDebug(context)) {
          debugger;
        }

        // 执行原操作
        const value = Reflect.ownKeys(target);

        // 日志输出
        safeLog("ownKeys", { target, keys: value });

        // 执行后钩子
        const afterContext = { ...context, keys: value };
        if (config.onAfter) {
          config.onAfter(afterContext);
        }

        return value;
      },
    });

    const proxy = proxyInfo.proxy;

    // 存储监听信息
    const watchInfo = {
      originalObject: obj,
      proxy: proxy,
      revoke: proxyInfo.revoke,
      config: config,
      objName: objName,
    };

    this.watchedObjects.set(obj, watchInfo);

    // 如果提供了对象名称，存储名称映射
    if (objName) {
      this.namedObjects.set(objName, { original: obj, proxy: proxy });
    }

    console.log(`[${TAG}] 开始监听对象${objName ? ` (${objName})` : ""}`);

    // 使用WeakMap存储Proxy元数据，避免触发监听器
    this.proxyMetadata.set(proxy, {
      isWatchedProxy: true,
      originalObject: obj,
    });

    return proxy;
  },

  /**
   * 取消监听对象
   * @param {Object} objOrName 要取消监听的对象或对象名称
   * @returns {Object|Boolean} 返回原始对象或false
   */
  unwatchObj(objOrName) {
    const TAG = "WATCH_OBJ";

    if (!objOrName) {
      console.error(`[${TAG}] 参数不能为空`);
      return false;
    }

    let watchInfo;
    let originalObj;

    // 如果是字符串，按名称查找
    if (typeof objOrName === "string") {
      const namedObj = this.namedObjects.get(objOrName);
      if (!namedObj) {
        console.warn(`[${TAG}] 未找到名为 '${objOrName}' 的监听对象`);
        return false;
      }
      originalObj = namedObj.original;
      watchInfo = this.watchedObjects.get(originalObj);
    } else {
      // 检查是否是proxy对象（使用WeakMap避免触发监听）
      const proxyMeta = this.proxyMetadata.get(objOrName);
      if (proxyMeta && proxyMeta.isWatchedProxy) {
        originalObj = proxyMeta.originalObject;
        watchInfo = this.watchedObjects.get(originalObj);
      } else {
        // 直接是原始对象
        originalObj = objOrName;
        watchInfo = this.watchedObjects.get(originalObj);
      }
    }

    if (!watchInfo) {
      console.warn(`[${TAG}] 对象未被监听`);
      return false;
    }

    try {
      watchInfo.revoke();

      this.watchedObjects.delete(originalObj);
      if (watchInfo.objName) {
        this.namedObjects.delete(watchInfo.objName);
      }
      this.proxyMetadata.delete(watchInfo.proxy);

      console.log(
        `[${TAG}] 取消监听成功${
          watchInfo.objName ? ` (${watchInfo.objName})` : ""
        }`
      );
      return originalObj; // 返回原始对象
    } catch (e) {
      console.error(`[${TAG}] 取消监听失败:`, e.message);
      return false;
    }
  },
};

// 导出便捷函数
function watchObj(obj, options = {}, objName = null) {
  return watchManager.watchObj(obj, options, objName);
}

function unwatchObj(obj) {
  const result = watchManager.unwatchObj(obj);
  return result !== false ? result : false;
}

export { watchObj, unwatchObj, watchManager };
