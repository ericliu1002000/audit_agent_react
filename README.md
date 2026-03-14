## 1. 核心技术栈规范
| 核心框架 | React 18+ |
| 类型系统 | TypeScript 5.x |
| 路由管理 | React Router 6+ |
| 状态管理 | Redux Toolkit + RTK Query |
| UI组件库 | Ant Design 5.x |
| 样式方案 | TailwindCSS v3 |
| 网络请求 | Axios 统一封装 |
| 工程化 | ESLint + Prettier + Husky |
## 2. 标准项目目录结构
```
├── src/
│   ├── api/          # 接口封装与拦截配置
│   ├── assets/       # 静态资源
│   ├── components/   # 通用可复用组件
│   ├── hooks/        # 自定义业务Hooks
│   ├── layouts/      # 布局与权限容器
│   ├── pages/        # 业务页面模块
│   ├── router/       # 路由配置（含权限守卫）
│   ├── store/        # 全局状态管理
│   ├── styles/       # 全局样式与主题扩展
│   └── utils/        # 通用工具函数
├── .env.*            # 多环境变量配置
├── trae.config.ts    # Trae构建配置
├── tailwind.config.ts# Tailwind主题配置
```
## 3. 核心开发规范
### 3.1 样式开发规范
- 强制使用TailwindCSS原子化类开发，禁止行内样式与零散CSS文件；
- 业务主题、品牌色、通用尺寸统一在`tailwind.config.ts`中扩展配置；
- 高频复用的复合样式通过`@apply`在全局样式中抽取，生产环境自动裁剪无用样式。
- 自定义方法：封装常用业务逻辑到`utils`目录下，保持代码可维护性与复用性，并且定义的函数都要标注方法、参数、返回结果注释说明。
### 3.2 核心模块规则
路由：统一使用`createBrowserRouter`配置，权限路由通过`AuthGuard`组件管控，非首屏路由强制使用`React.lazy + Suspense`懒加载；
状态管理：全局共享状态使用RTK，接口请求优先使用RTK Query做缓存管理，局部状态使用React原生Hooks，禁止滥用全局状态；
类型规范：全量业务代码强制TypeScript类型校验，禁止使用`any`类型，接口、组件Props必须明确定义类型。
## 4. 工程化与交付标准
- 提交管控：Husky强制前置校验，提交前必须通过ESLint语法检查与Prettier格式化，无error方可入库；
- 环境管理：区分开发/测试/生产环境，接口地址等配置通过环境变量注入，禁止硬编码；
- 交付要求：生产构建无报错、无类型错误、无控制台异常，构建产物开启压缩、Tree Shaking与分包优化，满足性能验收标准。
## 5.打包
- npm run build  node环境 >18+