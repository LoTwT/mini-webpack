const fs = require("fs")
const parser = require("@babel/parser")
const traverse = require("@babel/traverse").default
const { transformFromAst } = require("@babel/core")
const path = require("path")
const ejs = require("ejs")

let id = 1
let globalConfig = {}

// 1. 获取文件的内容和依赖关系
function createAsset(filename) {
  // 获取文件内容
  let source = fs.readFileSync(filename, "utf-8")
  const loaders = globalConfig.module.rules
  loaders.forEach(loaderConfig => {
    const { test, use } = loaderConfig
    if (test.test(filename)) {
      source = use(source)
    }
  })

  // 获取文件的依赖关系
  // 借助 ast 解析，获取到依赖
  // https://astexplorer.net/
  const ast = parser.parse(source, { sourceType: "module" })

  const deps = []
  traverse(ast, {
    ImportDeclaration({ node }) {
      deps.push(node.source.value)
    },
  })

  // es6+ => es5
  const { code } = transformFromAst(ast, null, {
    presets: ["@babel/preset-env"],
  })

  return {
    id: id++,
    code,
    deps,
    filename,
    mapping: {},
  }
}

function createGraph() {
  const filename = globalConfig.entry
  const mainAsset = createAsset(filename)
  const dirname = path.dirname(filename)

  const queue = [mainAsset]
  for (const asset of queue) {
    asset.deps.forEach((relativePath) => {
      // 补全路径
      const child = createAsset(path.resolve(dirname, relativePath))
      asset.mapping[relativePath] = child.id
      queue.push(child)
    })
  }

  return queue
}

function bundle(graph) {
  // 先构建 modules
  function createModules() {
    const modules = {}
    graph.forEach((asset) => {
      modules[asset.id] = [asset.code, asset.mapping]
    })
    return modules
  }

  function emitFile(context) {
    fs.writeFileSync("./example/dist/bundle.js", context)
  }

  const modules = createModules()
  const bundleTempalte = fs.readFileSync("./bundle.template.ejs", "utf-8")
  const code = ejs.render(bundleTempalte, {
    modules,
  })

  emitFile(code)
}

const mdLoader = function (source) {
  // 把非 js 代码，转换为 js 代码
  // todo md -> js
  return `export default 'this is a doc'`
}
const webpackConfig = {
  entry: "./example/main.js",
  module: {
    rules: [{ test: /\.md$/, use: mdLoader }],
  },
}

function webpack(config) {
  globalConfig = config
  const graph = createGraph()
  bundle(graph)
}

webpack(webpackConfig)
