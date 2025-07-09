# UI模块拆分说明

## 拆分概述

原本的 `ui.js` 文件（2343行）已经被拆分成5个更小、更专注的模块文件，每个模块负责特定的功能领域。

## 拆分后的文件结构

### 1. `ui-core.js` - 核心UI管理模块
**职责：**
- 系统初始化和启动
- 视图切换管理
- 票务类型管理（个人票/团体票）
- 页面导航控制
- 支付方式选择
- 自动选座按钮绑定
- 基础工具函数

**主要函数：**
- `initializeUI()` - 系统初始化
- `switchView()` - 视图切换
- `initializeTicketTypeControl()` - 票务类型控制
- `bindNavigationButtons()` - 导航按钮绑定
- `showMessage()` - 消息提示

**暴露的全局对象：** `window.UICoreModule`

### 2. `ui-member-management.js` - 成员管理模块
**职责：**
- 个人票成员管理
- 团体票成员管理
- 成员输入验证
- 成员列表操作（增删改查）
- 客户数据获取

**主要函数：**
- `initializeIndividualMemberManagement()` - 个人票成员管理初始化
- `initializeGroupMemberManagement()` - 团体票成员管理初始化
- `addIndividualMember()` - 添加个人票成员
- `addMemberToList()` - 添加团体票成员
- `getMyCustomerDataEnhanced()` - 获取客户数据

**暴露的全局对象：** `window.UIMemberManagement`

### 3. `ui-validation.js` - 选座验证模块
**职责：**
- 选座规则验证
- 个人票/团体票业务规则验证
- 年龄限制验证
- 座位连续性检查
- 购票和预订流程处理
- 数据获取辅助函数

**主要函数：**
- `validateSeatSelection()` - 选座验证
- `validateIndividualSeatSelection()` - 个人票验证
- `validateGroupSeatSelection()` - 团体票验证
- `handleDirectPurchase()` - 处理直接购票
- `handleReservation()` - 处理预订
- `getMySelectedSeatsData()` - 获取选中座位数据

**暴露的全局对象：** `window.UIValidation`

### 4. `ui-payment.js` - 支付页面管理模块
**职责：**
- 支付页面数据更新
- 确认页面管理
- 电影信息显示
- 座位信息显示
- 价格计算和显示
- 客户信息显示
- 图片处理工具

**主要函数：**
- `updatePaymentPageData()` - 更新支付页面数据
- `updatePaymentMovieInfo()` - 更新电影信息
- `updatePaymentSeatInfo()` - 更新座位信息
- `updatePaymentPriceInfo()` - 更新价格信息
- `initializeConfirmPage()` - 初始化确认页面
- `handleFinalPayment()` - 处理最终支付

**暴露的全局对象：** `window.UIPayment`

### 5. `ui-orders.js` - 订单管理模块
**职责：**
- 我的订单页面管理
- 订单CRUD操作
- 订单状态管理
- 订单详情显示
- 订单搜索和筛选
- 订单操作（取消、支付、退款）
- localStorage数据管理

**主要函数：**
- `showMyOrdersPage()` - 显示订单页面
- `renderMyOrdersList()` - 渲染订单列表
- `createMyReservationOrder()` - 创建预约订单
- `createMyPurchaseOrder()` - 创建购票订单
- `handleMyCancelOrder()` - 处理取消订单
- `handleMyPayReservedOrder()` - 处理支付预约订单

**暴露的全局对象：** `window.UIOrders`

## 模块间依赖关系

```
ui-core.js (核心模块)
    ↓
ui-member-management.js (成员管理)
    ↓
ui-validation.js (验证模块)
    ↓
ui-payment.js (支付模块)
    ↓
ui-orders.js (订单模块)
```

**依赖说明：**
- `ui-core.js` 是基础模块，提供核心功能和全局状态
- `ui-member-management.js` 依赖核心模块的状态管理
- `ui-validation.js` 依赖成员管理模块获取客户数据
- `ui-payment.js` 依赖验证模块获取座位和价格数据
- `ui-orders.js` 依赖验证模块获取订单相关数据

## 文件大小对比

| 文件 | 行数 | 主要内容 |
|------|------|----------|
| **原 ui.js** | 2343行 | 所有UI功能 |
| **ui-core.js** | 约400行 | 核心初始化和视图管理 |
| **ui-member-management.js** | 约300行 | 成员管理功能 |
| **ui-validation.js** | 约350行 | 选座验证和业务逻辑 |
| **ui-payment.js** | 约300行 | 支付和确认页面 |
| **ui-orders.js** | 约600行 | 订单管理完整功能 |

## 使用方法

### 1. HTML文件引入
```html
<!-- 按顺序引入模块 -->
<script src="js/ui-core.js"></script>
<script src="js/ui-member-management.js"></script>
<script src="js/ui-validation.js"></script>
<script src="js/ui-payment.js"></script>
<script src="js/ui-orders.js"></script>
```

### 2. 模块调用示例
```javascript
// 切换视图
window.UICoreModule.switchView('seat-view');

// 获取个人票成员列表
const members = window.UIMemberManagement.getIndividualMembersList();

// 验证选座
const isValid = window.UIValidation.validateSeatSelection();

// 更新支付页面
window.UIPayment.updatePaymentPageData();

// 显示订单页面
window.UIOrders.showMyOrdersPage();
```

## 优势

### 1. **可维护性提升**
- 每个模块职责单一，便于理解和修改
- 代码结构清晰，减少了查找特定功能的时间

### 2. **可扩展性增强**
- 新功能可以独立添加到相应模块
- 模块间接口清晰，便于功能扩展

### 3. **团队协作友好**
- 不同开发者可以同时修改不同模块
- 减少了代码冲突的可能性

### 4. **性能优化**
- 可以按需加载模块（未来可实现懒加载）
- 便于代码压缩和优化

### 5. **测试友好**
- 每个模块可以独立测试
- 便于编写单元测试

## 向后兼容性

- 原有的 `ui.js` 文件仍然保留，可以随时回退
- 新的模块化设计保持了相同的API接口
- 现有的HTML和其他JS文件无需修改（除了script标签）

## 注意事项

1. **加载顺序**：必须按照依赖关系的顺序加载模块
2. **全局变量**：每个模块都会向`window`对象添加一个全局变量
3. **错误处理**：每个模块都包含了适当的错误处理机制
4. **浏览器兼容性**：代码保持了与原版本相同的浏览器兼容性

## 未来改进建议

1. **ES6模块化**：可以进一步改造为ES6模块格式
2. **TypeScript**：可以添加类型定义，提高代码质量
3. **构建工具**：可以使用Webpack等工具进行模块打包
4. **懒加载**：可以实现按需加载模块的功能
5. **单元测试**：为每个模块编写单元测试
