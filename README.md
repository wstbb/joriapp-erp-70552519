
# 智汇-ERP 系统设计与架构文档 (V6.2 - 前端架构更新)

本文档旨在阐明“智汇-ERP”后端系统的整体架构、组件职责、数据模型和部署流程，以便于未来的维护和开发。

---

## 1. 默认凭证和密码策略

为了便于开发、调试和演示，系统设定了以下固定的初始凭证。**核心原则是：登录名和邮箱是两个独立的字段**。

| 角色 / 服务             | **登录用户名** | **密码**     | 关联邮箱 (非登录凭证) | 作用范围                                     |
| :---------------------- | :----------- | :----------- | :-------------------- | :------------------------------------------- |
| **超级管理员**          | `superadmin` | `test1234`   | N/A                   | 登录**平台后台**，管理所有租户。               |
| **数据库主用户**        | `postgres`   | `test1234`   | N/A                   | SAM模板中定义的RDS数据库管理员密码。         |
| **租户管理员**          | `admin`      | `123456`     | `admin@example.com`   | 登录**租户ERP系统**，管理企业内部事务。        |
| **租户-财务**           | `fin`        | `123456`     | `fin@example.com`     | 登录**租户ERP系统**，使用财务功能。          |
| **租户-仓库**           | `wh`         | `123456`     | `wh@example.com`      | 登录**租户ERP系统**，使用仓库功能。          |
| **租户-销售**           | `sales`      | `123456`     | `sales@example.com`   | 登录**租户ERP系统**，使用销售功能。          |

**关键区别**: 
- 平台级的管理（超级管理员、数据库）使用 `test1234`。
- 企业租户内部的所有预设用户，统一使用 `123456`。
- 用户在前端“账号”一栏输入的是简短的**登录用户名**（如 `admin`），而非邮箱地址。

---

## 2. 工程文件全景目录解析 (前端重构后)

本仓库是一个前后端分离的全栈项目，主要包含两个核心目录：`智汇云-erp` (前端) 和 `backend` (后端)。

```
. (项目根目录)
├── 智汇云-erp/           # 前端 Vite/React 应用
│   ├── pages/            # 页面路由
│   │   ├── saas-admin/   # [新] SaaS 后台管理模块
│   │   │   ├── index.tsx               # 主仪表盘 (租户列表)
│   │   │   ├── tenants/[tenantId].tsx    # 单个租户的管理控制台
│   │   │   ├── plans.tsx               # 订阅方案管理 (占位)
│   │   │   ├── industries.tsx          # 行业类型管理 (占位)
│   │   │   └── tickets.tsx             # 工单中心 (占位)
│   │   ├── Dashboard.tsx         # ERP 主业务仪表盘
│   │   ├── InventoryPages.tsx    # 库存相关页面
│   │   ├── OrderPages.tsx        # 订单相关页面
│   │   └── ...                 # 其他业务页面
│   ├── components/       # 可重用UI组件 (e.g., Layout, Sidebar)
│   ├── api/              # API客户端和请求封装
│   ├── utils/            # 全局辅助函数
│   │   └── saasUtils.ts  # [新] SaaS模块专用辅助函数
│   ├── types.ts          # 全局 TypeScript 类型定义
│   ├── package.json      # 前端依赖和脚本
│   └── ...
│
├── backend/              # 后端 Python/Lambda 服务
│   ├── lambda/           # Lambda 函数代码
│   │   ├── saas_admin/     # SaaS 后台管理相关API
│   │   ├── tenants/        # 租户管理API
│   │   ├── users/          # 用户管理API
│   │   └── ...           # 其他业务逻辑API
│   ├── layers/           # Lambda Layers (共享代码)
│   └── template.yaml     # SAM / CloudFormation 配置文件
│
├── README.md             # 项目的快速上手指南
└── SYSTEM_DESIGN.md      # 本文档
```

- **`智汇云-erp/pages/saas-admin/`**: **SaaS后台管理的核心**。这是一个全新的、结构化的模块，负责平台运营的所有功能。它已经从单个文件重构为多个页面和组件，以提高可维护性和可扩展性。
    - `index.tsx`: 主仪表盘，展示租户列表和全局统计数据。
    - `tenants/[tenantId].tsx`: 独立的租户管理页面，通过动态路由实现，负责单个租户的生命周期管理。
- **`智汇云-erp/utils/saasUtils.ts`**: 新增的工具文件，用于存放SaaS后台模块共享的辅助函数（如数据转换）和可重用组件。

---

## 3. 初始数据、角色与权限体系

为了方便测试和演示，系统在首次部署时会自动创建一系列初始数据。

### 3.1. 订阅方案 (Plans)

系统预设了三种订阅方案，定义于 `schema_public.sql`，供租户选择：

- **基础版 (`basic`)**: 包含核心进销存功能，满足基本日常运营需求。
- **专业版 (`pro`)**: 包含所有基础版功能，并增加移动端App支持和高级报表。
- **企业版 (`enterprise`)**: 包含所有专业版功能，并提供AI智能分析、开放平台和专属客户支持。

### 3.2. 行业 (Industries)

系统预设了多个行业分类，如“零售贸易”、“生产制造”等，用于租户注册时进行选择，以便后续进行数据分析和功能定制。

### 3.3. Demo 租户与用户角色

系统会自动创建一个名为 **demo (demo)** 的演示租户，并为其预设多名拥有不同权限的用户。

| 登录用户名 | 密码     | 角色             | 核心权限说明                                       |
| :------- | :------- | :--------------- | :------------------------------------------------- |
| `admin`  | `123456` | **租户管理员**   | **最高权限**。管理公司信息、用户账号、分配权限。     |
| `fin`    | `123456` | **财务 (Finance)** | 查看和管理财务报表、处理应收应付款项、进行成本核算。 |
| `wh`     | `123456` | **仓库 (Warehouse)** | 管理库存、处理出入库单据、进行库存盘点。           |
| `sales`  | `123456` | **销售 (Sales)**     | 管理销售订单、客户关系等。                         |

---

## 4. 后台管理页面介绍

系统拥有两层后台管理体系：

### 4.1. 超级管理员后台

- **登录用户**: `superadmin`
- **核心功能**: 这是一个面向平台运营者的全局管理后台。
    - **租户管理**: 查看所有租户的列表（公司名、域名、状态、订阅方案等）。
    - **生命周期操作**: 手动创建新租户、停用/激活现有租户、删除租户、为租户升级/降级订阅方案。
    - **平台监控**: 查看平台整体的运营数据（如总租户数、活跃用户数等）。

### 4.2. 租户管理员后台

- **登录用户**: 每个租户自己的 `admin` 用户（例如 `demo` 公司的 `admin`）。
- **核心功能**: 这是一个面向客户的、企业内部的管理后台。
    - **用户管理**: 在自己的公司内部，创建新员工账号（如 `fin`, `wh`）。
    - **权限分配**: 为公司内的不同员工分配不同的角色和权限。
    - **企业设置**: 配置公司信息、业务流程等。
    - **使用 ERP 功能**: 进行进销存、财务管理等日常业务操作。

---

## 5. 部署方式

本系统使用 AWS SAM (Serverless Application Model) CLI 进行部署。请确保您已在本地配置好 AWS CLI 和 SAM CLI。

1.  **环境准备**:
    ```bash
    # 配置您的 AWS 账户凭证
    aws configure
    ```

2.  **首次部署 (引导式)**:
    ```bash
    # sam build 会根据 template.yaml 构建项目
    sam build

    # sam deploy --guided 会引导您完成首次部署的配置
    sam deploy --guided
    ```
    在引导过程中，系统会提示您输入堆栈名称（例如 `jori-erp-backend`）、AWS 区域等信息。请接受默认选项，并在提示权限相关问题时，输入 `Y` 以确认。SAM 会将您的配置保存在根目录的 `samconfig.toml` 文件中。

3.  **后续更新**:
    在首次部署之后，如果您修改了任何后端代码（例如 `tenants.py`），只需再次运行以下命令即可将变更快速部署到云端：
    ```bash
    sam build && sam deploy
    ```

---

## 6. 高层架构概览

本系统是一个基于 AWS Serverless 服务构建的、支持多租户的 ERP 后端。其核心设计思想是**安全、隔离、可扩展**。

*   **前端**：一个单页应用（SPA），静态文件托管在 **S3** 上。
*   **API 网关**：所有请求的唯一入口，使用 **API Gateway (HTTP API)**，负责路由、CORS 和初步请求处理。
*   **计算层**：一系列 **Lambda 函数**，每个函数负责一个独立的业务领域（如认证、租户管理），实现了微服务理念。
*   **数据层**：一个 **RDS PostgreSQL** 数据库，采用“共享数据库，独立 Schema”的模式实现多租户数据隔离。
*   **安全与网络**：通过 **VPC** 实现网络隔离，使用 **IAM** 进行权限控制，并通过 **Secrets Manager** 管理敏感凭据。
*   **共享逻辑**：通过 **Lambda Layer** 封装数据库连接和授权等通用逻辑，确保所有函数行为一致。

### AWS 架构图 (Mermaid 语法)

```mermaid
graph TD
    subgraph "用户端"
        A[用户浏览器]
    end

    subgraph "AWS 云"
        subgraph "网络边缘"
            B[API Gateway (HTTP API)]
            C[S3 Bucket (前端静态网站)]
        end

        subgraph "VPC (虚拟私有云)"
            subgraph "公共子网"
                D[NAT 网关]
            end
            
            subgraph "私有子网"
                E[Lambda: auth]
                F[Lambda: tenants]
                G[Lambda: users]
                H[Lambda: db_setup]
                I[RDS PostgreSQL 实例]
            end
        end

        J[Lambda Layer: db_utils]
        K[Secrets Manager]
        L[IAM 角色]
    end

    A -- HTTPS --> B
    A -- HTTP --> C

    B -- 触发 --> E
    B -- 触发 --> F
    B -- 触发 --> G

    E -- 使用/连接 --> I
    F -- 使用/连接 --> I
    G -- 使用/连接 --> I
    H -- 使用/连接 --> I
    
    E -- 引用 --> J
    F -- 引用 --> J
    G -- 引用 --> J
    H -- 引用 --> J

    E -- 读取 --> K
    
    I -- 位于 --> PrivateSubnet
    E -- 位于 --> PrivateSubnet
    F -- 位于 --> PrivateSubnet
    G -- 位于 --> PrivateSubnet
    H -- 位于 --> PrivateSubnet
    
    PrivateSubnet -- 路由 --> D
    D -- 出口 --> Internet

    E -- 扮演 --> L
    F -- 扮演 --> L
    G -- 扮演 --> L
    H -- 扮演 --> L
```

## 7. 核心组件详解

### 7.1. API Gateway

*   **职责**: 作为系统的“前门”，将不同的 HTTP 请求路径（如 `/api/auth/login`, `/api/tenants`）精确路由到对应的 Lambda 函数。
*   **关键配置**:
    *   `CorsConfiguration`: 允许来自任何源 (`*`) 的跨域请求，这对于前后端分离的 Web 应用至关重要。
    *   `Events` (在 Lambda 配置中): 定义了路径、HTTP 方法和目标 Lambda 之间的绑定关系。

### 7.2. Lambda 函数层

每个函数都是一个独立的微服务，职责单一。

*   `AuthFunction`: 处理所有与**身份认证**相关的逻辑，包括超级管理员和租户用户的登录。
*   `TenantsFunction`: 负责**租户的生命周期管理**，包括创建、查询、更新、删除租户等。**这是超级管理员的核心功能**。
*   `UsersFunction`: 负责**租户内部的用户管理**，例如租户管理员添加、修改自己公司的员工账号。
*   `DbSetupFunction`: 一个特殊的初始化函数，用于在系统首次部署时，创建 `public` schema 下的全局表（如 `plans`, `industries`）。

### 7.3. Lambda Layer (`db_utils`)

这是整个架构的“瑞士军刀”和**安全基石**。它将数据库连接和授权逻辑从业务代码中抽离，实现了代码复用和一致性。

*   **`get_public_connection()`**: 获取一个**公共连接**。它只能看到 `public` schema，用于无需登录的场景，如在登录页显示租户列表。
*   **`get_tenant_db_connection(schema)`**: 获取一个**租户直连**。它直接将会话的 `search_path` 设置为指定的租户 schema（如 `tenant_123`），专门用于登录时验证该租户下的用户名和密码。
*   **`get_db_connection(event)`**: **最核心的“智能”安全连接**。它通过检查请求中的 JWT 来决定连接的“视野”：
    *   **如果 JWT 表明是超级管理员**: `search_path` 会被设置为 `public`，允许其访问所有管理表。
    *   **如果 JWT 表明是普通租户用户**: `search_path` 会被设置为该用户的租户 schema，实现严格的数据隔离。
    *   **如果 JWT 无效或缺失**: 直接返回 `None`，拒绝访问。

### 7.4. RDS PostgreSQL 多租户模型

系统采用“**共享数据库，独立 Schema**”的模式。

*   `public` **Schema**: 存放全局共享数据，包括：
    *   `tenants`: 所有租户的元数据列表（ID, 名称, 域名, 状态等）。
    *   `plans`, `industries`: 全局的套餐和行业信息。
*   `tenant_xxx` **Schemas**: 每个租户都有一个自己独立的 schema (例如 `tenant_1`, `tenant_jori`)。这些 schema 包含租户的业务数据，如 `users`, `products`, `orders` 等。**不同租户的 Schema 之间在数据库层面是完全隔离的。**

## 8. 关键数据流

### 8.1. 超级管理员登录并查看租户列表

1.  **前端**: `superadmin` 在登录页输入凭据。
2.  **API Gateway**: `POST /api/auth/login` 请求被路由到 `AuthFunction`。
3.  `AuthFunction`:
    *   从 Secrets Manager 获取超级管理员的真实凭据。
    *   验证用户输入。
    *   生成一个包含 `{ "is_super_admin": True }` 的 JWT 令牌并返回。
4.  **前端**: 保存 JWT，请求 `GET /api/tenants`，并在请求头中附加 `Authorization: Bearer <jwt>`。
5.  **API Gateway**: 请求被路由到 `TenantsFunction`。
6.  `TenantsFunction`:
    *   调用 `get_db_connection(event)`。
    *   `db_utils` 库解码 JWT，发现 `is_super_admin: True`。
    *   `db_utils` 建立数据库连接，并执行 `SET search_path TO public`。
    *   `TenantsFunction` 使用这个已被授权的连接，查询 `public.tenants` 表，成功返回所有租户的详细列表。

### 8.2. 租户用户登录

1.  **前端**: 用户选择租户 `demo`，输入用户名 `admin` 和密码 `123456`。
2.  **API Gateway**: `POST /api/auth/login` 请求被路由到 `AuthFunction`。
3.  `AuthFunction`:
    *   发现请求体中包含租户域名 `demo`。
    *   从 `public.tenants` 表中查找域名 `demo` 对应的 schema 名称（如 `tenant_demo`）。
    *   调用 `get_tenant_db_connection('tenant_demo')`，获取一个直连到该租户数据库的连接。
    *   在该连接上，查询 `users` 表，**使用 `name` 字段来匹配用户名 `admin`**。
    *   验证密码哈希。
    *   验证成功后，生成一个包含 `{ "tenant_id": "..." }` 的 JWT 并返回。

### 5.2. 前端部署 (S3)

前端是一个独立的 React 应用。在本地修改代码后，需要经过“构建”和“上传”两个步骤才能生效。

**步骤 1: 本地构建**

此命令会使用 Vite 将 `src` 目录下的源代码打包到 `智汇云-erp/dist` 目录中。

```bash
# 进入前端项目目录，安装依赖并执行构建
cd 智汇云-erp && npm install && npm run build
```

**步骤 2: 同步到 S3**

此命令会将 `dist` 目录下的所有文件上传到为前端配置的 S3 存储桶中。`--delete` 参数会确保云端和本地 `dist` 目录完全同步。

```bash
# [请将桶名替换为您环境的实际名称]
aws s3 sync 智汇云-erp/dist/ s3://joriapp-erp-backend-frontendbucket-tk8kikka7kj0 --delete
```

### 5.3. 获取访问 URL

您可以通过以下命令查询已部署的前端应用的公开访问网址：

```bash
aws cloudformation describe-stacks --stack-name jori-erp-backend --query "Stacks[0].Outputs[?OutputKey=='FrontendURL'].OutputValue" --output text
```
---

## 9. 当前架构与资源清单（与 template.yaml 对应）

### 9.1. 后端资源一览

| 资源类型 | 逻辑 ID | 说明 |
|--------|---------|------|
| 存储 | FrontendBucket | S3 静态网站，托管前端构建产物 |
| API | ZhiHuiErpHttpApi | HTTP API，CORS 已配置，为所有 Lambda 提供路由 |
| 网络 | VPC, PublicSubnetA/B, PrivateSubnetA/B, NAT, 安全组 | Lambda 与 RDS 部署在 VPC 内，RDS 仅内网可访问 |
| 数据库 | DBInstance (RDS PostgreSQL) | 多租户：public schema + 每租户独立 tenant_* schema |
| 凭据 | SuperAdminSecret (Secrets Manager) | 超级管理员账号密码 |
| Layer | DatabaseUtilsLayer | 提供 db_utils（get_public_connection / get_db_connection / get_tenant_db_connection / build_response） |
| Lambda | DbSetupFunction | 执行 schema_public.sql、schema_tenant.sql，创建 demo 租户并写入 seed |
| Lambda | DbSetupInvokerFunction | CloudFormation Custom Resource 处理器，部署时调用 DbSetup，带重试 |
| Custom Resource | DbSetupCustomResource | 依赖 DbSetupFunction、DBInstance，Create/Update 时触发 DbSetup |
| Lambda | AuthFunction | POST /api/auth/login：超级管理员与租户用户登录，返回 JWT 与 user |
| Lambda | SaasAdminFunction | /admin/{proxy+}：plans、industries 等管理接口，需超级管理员 JWT |
| Lambda | TenantsFunction | GET/POST /api/tenants、/api/tenants/:id/usage|history|status|plan|reset-password|provision-subdomain、DELETE 租户 |
| Lambda | UsersFunction | 租户内用户管理，按 JWT 的 tenant_id 设置 search_path |
| Lambda | TicketsFunction | 工单 API，公共连接读 public.tickets |
| Lambda | DebugDbDumpFunction | 调试用，导出库表信息 |

### 9.2. 前端应用结构（智汇云-erp）

- **技术栈**：Vite + React + TypeScript，路由 React Router。
- **入口**：`App.tsx`。根据是否登录、是否超级管理员决定渲染登录页、SaaS 管理（SaasAdmin）或租户内 ERP（Layout + 各 Page）。
- **认证**：登录后 token 存 localStorage，并写入 `apiClient.defaults.headers.common['Authorization']`；从 localStorage 恢复会话时同样恢复该 header。
- **API 基地址**：`智汇云-erp/api/index.ts` 中 `baseURL` 指向 API Gateway 的 Invoke URL（与 CloudFormation 输出 ApiGatewayEndpoint 一致）。
- **关键页面**：
  - `LoginPage.tsx`：租户选择 + 账号密码；超级管理员不选租户；移动端默认使用 demo 租户。
  - `SaasAdmin.tsx`：超级管理员后台入口，子路由包含租户管理、订阅方案、行业、工单等。
  - `pages/saas-admin/index.tsx`：SaaS 主仪表盘，展示租户列表与统计；请求 GET /api/tenants 与 GET /admin/plans、GET /admin/industries。
  - `pages/saas-admin/tenants/[tenantId].tsx`：单个租户管理控制台。
- **工具**：`utils/saasUtils.tsx` 提供 `getTenantsArrayFromResponse`（解析租户列表响应）、`transformTenantFromApi`（转为前端 Tenant 类型）、`formatDate`、`StatCard`。

### 9.3. 关键数据流（与当前实现一致）

- **超级管理员登录 → 租户列表**：POST /api/auth/login（无 tenantDomain）→ 返回 JWT（含 is_super_admin）→ GET /api/tenants 带 Bearer → TenantsFunction 用 get_db_connection(event) 得到 public 连接 → 查询 public.tenants 返回完整列表。
- **租户用户登录**：POST /api/auth/login 带 tenantDomain → Auth 查 public.tenants 得 schema → get_tenant_db_connection(schema) 验证用户 → 返回 JWT（含 tenant_id）及 user（含 role/name 等）。
- **租户列表展示**：前端用 getTenantsArrayFromResponse(response.data) 取数组（兼容直接数组或 Lambda 代理 body 字符串），再 map(transformTenantFromApi) 后 setState 渲染表格。

---

## 10. 近期修改记录（架构与问题修复）

以下修改已纳入当前代码，反映在 README 中便于维护与排错。

### 10.1. 租户用户登录后白屏

- **原因**：登录接口返回的 user 缺少 `role`/`name`，前端用 `hasAccess(activePage)` 依赖 `user.role`；无 role 时视为无权限，渲染 UnauthorizedPage，原实现为空 div，表现为白屏。
- **后端**（`backend/lambda/auth/auth.py`）：在租户用户登录成功返回的 `user_object` 中补充 `name`、`fullName`、`role`（从 DB role 规范为 admin/sales/warehouse/finance/staff）、`tenant_id`，保证前端权限与展示所需字段齐全。
- **前端**（`智汇云-erp/App.tsx`）：  
  - `hasAccess`：当 `user.role` 缺失时默认视为 `'admin'`，避免有用户却无权限导致一直进无权限页。  
  - `UnauthorizedPage`：由空 div 改为提示「您没有权限访问该页面」+「返回仪表盘」按钮，避免完全白屏。

### 10.2. 超级管理员登录后租户一览为空

- **原因 1（后端）**：DbSetup 仅在手动或 Custom Resource 执行时创建 demo 租户；且 schema_public.sql 中部分触发器重复创建会报错，导致 DbSetup 失败、public.tenants 无数据。
- **后端修改**：  
  - **schema_public.sql**：在相关 `CREATE TRIGGER` 前增加 `DROP TRIGGER IF EXISTS ...`（update_tenants_changetimestamp、on_tenant_insert_create_schema、update_tickets_changetimestamp），使脚本可重复执行。  
  - **DbSetup**（`backend/lambda/db_setup_assets/db_setup.py`）：连接成功后打 `[DBSETUP_DEBUG]` 日志（host/dbname/current_database）；commit 后再打 public.tenants 行数，便于与 TenantsFunction 日志对比。  
  - **DbSetup Invoker**（`backend/lambda/db_setup_invoker/db_setup_invoker.py`）：CloudFormation Custom Resource 处理器，在 Create/Update 时调用 DbSetup；增加重试（次数与间隔可配置），避免 RDS 未就绪导致失败。  
  - **template.yaml**：新增 DbSetupInvokerFunction、DbSetupInvokerPermission、DbSetupCustomResource（DependsOn: DbSetupFunction, DBInstance），部署时自动执行 DbSetup。  
  - **TenantsFunction**（`backend/lambda/tenants/tenants.py`）：管理员列表接口中增加 `[TENANTS_DEBUG]` 日志（current_database、current_schema、public.tenants 行数、首行关键字段）；返回列表中 id 统一转为字符串，与前端 Tenant 类型一致。
- **原因 2（前端）**：Promise.all 中若 GET /admin/plans 或 GET /admin/industries 失败，整次 fetch 失败，setTenants 未执行；此外未兼容 Lambda 代理返回的 body 字符串或包装结构。
- **前端修改**：  
  - **utils/saasUtils.tsx**：新增 `getTenantsArrayFromResponse(data)`，兼容 response.data 为数组或带 `body` 的字符串/数组；`transformTenantFromApi` 中 id/plan_code 转为字符串、status 限定为合法枚举、created_at 为字符串。  
  - **pages/saas-admin/index.tsx**：先单独请求 GET /api/tenants，成功即用 getTenantsArrayFromResponse + transformTenantFromApi 设置 tenants；再并行请求 plans/industries，失败不影响已展示的租户列表。  
  - **pages/saas-admin/tenants/[tenantId].tsx**：租户列表同样通过 getTenantsArrayFromResponse 解析后再查找当前 tenantId。

### 10.3. 登录页与移动端

- **LoginPage.tsx**：移动端登录不再使用占位符 `YOUR_DEFAULT_TENANT_DOMAIN`，改为固定使用租户域名 `demo`，与预置 demo 租户一致。  
- **智汇云-erp**：已安装 `@types/react`、`@types/react-dom`，消除 React/JSX 相关 TypeScript 报错（LoginPage 等）。

### 10.4. 调试与运维

- **docs/debug-tenant-list-curl.sh**：使用 superadmin 登录获取 token，再请求 GET /api/tenants，用于不经过前端直接验证后端返回。  
- **docs/DEBUGGING-TENANT-LIST.md**：说明如何用 curl、CloudWatch 中 [TENANTS_DEBUG] 与 [DBSETUP_DEBUG] 日志对比库与行数，以及如何再次手动执行 DbSetup 确保 demo 租户存在。