# WEB前端开发规约

## 一、选型
一个前端工程允许同时存在两种开发模式的页面，根据页面是否具有SEO需求进行划分。  

1.无SEO需求的页面
- 基于nodejs，使用npm进行模块管理，通过webpack进行预编译构建  
- 采用ES6语法，通过import/export方式导入和定义模块  
- 这也是默认的开发模式，绝大部分的场景均适用  

2.有SEO需求的页面  
- 传统的开发模式，不进行预编译构建
- 采用ES5语法，通过requirejs导入和定义模块

## 二、通用规约

1. 【强制】js代码末尾必须加分号
2. 【推荐】字符串常量的引号：js代码中默认使用单引号，其它代码（包括html、css、json等）中默认使用双引号
3. 【强制】对象、组件内部不希望外界直接访问的属性和方法，应尽量避免export，
如果实在难以避免，则其名称必须以下划线_开头，调用者不允许直接访问这些属性和方法

## 三、ES6编码规约

1. 【强制】不得使用var定义变量，必须使用const或let定义变量。尽可能的使用const，仅当变量可能被修改时才使用let。
2. 【强制】函数声明方式：args=>{...}，无法取得this对象，当需要用到this对象时，必须使用传统方式：function(args){...}

## 四、ES5编码规约

## 五、Vue和jQuery混合编码规约
允许Vue和jQuery并存进行混合编码，但必须遵循以下原则：
1. 【强制】优先使用Vue，仅当Vue不适用的场景才使用jQuery，如：DOM元素操作，高级动效，图形图像等
2. 【注意】Vue采用虚拟DOM技术，这导致通过Vue渲染的DOM元素，在jQuery中无法通过传统方式获得，从而无法进行操作。
jQuery只能操作那些在浏览器开发者工具（F12）中能跟踪到的DOM元素。
3. 【强制】所有jQuery对象的变量名一律使用$开头，以特别区分。