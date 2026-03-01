# 智汇-ERP 系统设计与架构文档 (V6.1 - 结构增补版)

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

## 2. 工程文件全景目录解析

```
.
├── backend/                 # 所有后端服务的根目录
│   ├── lambda/              # 存放所有 Lambda 函数的源代码
│   │   ├── auth/            # [函数] 处理登录认证
│   │   ├── tenants/         # [函数] 管理租户生命周期
│   │   └── ...
├── 智汇云-erp/              # [前端] React + TypeScript 项目的根目录
│   ├── src/
│   │   ├── api/             # 封装所有对后端 API 的调用
│   │   │   └── index.ts
│   │   ├── pages/           # 页面级组件
│   │   │   └── LoginPage.tsx # [关键] 登录页面实现
│   │   └── App.tsx          # 应用主入口
│   └── ...
├── SYSTEM_DESIGN.md         # 本文档
└── template.yaml            # AWS SAM 核心模板，定义了所有云资源
```

- **`智汇云-erp/`**: 这是一个使用 Vite 构建的现代化前端应用。`LoginPage.tsx` 包含了登录页面的全部 UI 和交互逻辑，而 `api/index.ts` 则负责构建和发送真实的 HTTP 请求到后端。
- **`backend/`**: 这是使用 AWS SAM 构建的 Serverless 后端，所有业务逻辑都封装在 `lambda` 目录下的 Python 函数中。
- **`layers/database_utils/`**: **关键共享层**。`db_utils.py` 封装了数据库连接和授权逻辑，是确保系统安全和一致性的基石。
- **`template.yaml`**: **基础设施即代码 (IaC)** 的体现。它描述了需要创建的每一个AWS资源，使得整个后端环境可以被一键复制和部署。

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