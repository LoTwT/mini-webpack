// 打包后的 bundle.js 的样子
// 1. 如何把 esm 转换成 cjs 的形式
// 2. 需要自己写自己的 require 方法

;(function (modules) {
  function require(id) {
    const module = {
      exports: {},
    }

    // 需要通过 filename 找到对应的模块函数
    // 使用映射
    const [fn, mapping] = modules[id]

    function localRequire(filename) {
      const id = mapping[filename]
      return require(id)
    }

    fn(localRequire, module, module.exports)

    return module.exports
  }

  require(1)
})({
  
    1: [function (require, module, exports) {
      "use strict";

var _foo = require("./foo.js");

var _doc = _interopRequireDefault(require("./doc.md"));

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { "default": obj }; }

console.log("main");
console.log(_doc["default"]);
(0, _foo.foo)();
    }, {"./foo.js":2,"./doc.md":3}],
  
    2: [function (require, module, exports) {
      "use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.foo = void 0;

var foo = function foo() {
  return console.log("foo");
};

exports.foo = foo;
    }, {}],
  
    3: [function (require, module, exports) {
      "use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports["default"] = void 0;
var _default = 'this is a doc';
exports["default"] = _default;
    }, {}],
  
})
