# 调试：管理员登录后租户一览为空

## 1. 用 curl 直接看 API 返回（不经过前端）

```bash
cd docs
chmod +x debug-tenant-list-curl.sh
./debug-tenant-list-curl.sh
```

或手动执行（把 `BASE` 换成你的 API 根地址，见 CloudFormation 输出 **ApiGatewayEndpoint**）：

```bash
# 登录拿 token
TOKEN=$(curl -s -X POST "https://rbg9venhb0.execute-api.ap-northeast-1.amazonaws.com/api/auth/login" \
  -H "Content-Type: application/json" \
  -d '{"username":"superadmin","password":"test1234"}' | python3 -c "import sys,json; print(json.load(sys.stdin).get('token',''))")

# 拉取租户列表（带 token）
curl -s -X GET "https://rbg9venhb0.execute-api.ap-northeast-1.amazonaws.com/api/tenants" \
  -H "Authorization: Bearer $TOKEN"
```

- 若返回 `[]`：说明后端确实返回了空数组，继续看下面日志。
- 若返回 `[{...}]`：说明后端有数据，问题在前端展示或请求头（例如 token 未带上）。

## 2. 看 CloudWatch 日志确认 schema 与行数

部署本次修改后，再请求一次 **GET /api/tenants**（用上面 curl 或前端），然后到 **CloudWatch → 日志组 → /aws/lambda/erp-tenants-function** 查看对应请求的日志，应能看到：

- `[TENANTS_DEBUG] current_database=xxx, current_schema=xxx`  
  → 确认当前连接到的库和 schema（应为 **public**）。
- `[TENANTS_DEBUG] public.tenants row count=N`  
  → **N=0** 表示该 Lambda 连到的库里 `public.tenants` 确实没有行。
- 若有行，还会有：`[TENANTS_DEBUG] first row keys=..., id=..., name=..., domain=...`  
  → 确认返回字段和前端 `transformTenantFromApi` 期望一致（id/name/domain/plan_name/industry_name 等）。

若 **row count=0**，再对比 DbSetup 的日志（**/aws/lambda/erp-db-setup-function**）：

- `[DBSETUP_DEBUG] connected host=... dbname=... current_database=...`  
  → 确认 DbSetup 连的是哪个库。
- `[DBSETUP_DEBUG] after commit: public.tenants count=M`  
  → 若 **M≥1** 而 Tenants 里 **N=0**，说明两个 Lambda 连接的**不是同一个数据库**（例如不同栈/环境），需要检查部署的栈、VPC、环境变量是否一致。

## 3. 确保 demo 租户存在（同一库）

若确认是同一库且 Tenants 仍为 0 行，可再执行一次 DbSetup 写入 demo，再立刻用 curl 请求 GET /api/tenants：

```bash
aws lambda invoke --function-name erp-db-setup-function --payload '{}' --region ap-northeast-1 /tmp/out.json
cat /tmp/out.json
# 看到 statusCode 200 后，马上执行上面的 curl GET /api/tenants
```

## 4. 本次代码改动摘要

- **TenantsFunction**  
  - 查询前打日志：`current_database`、`current_schema`、`public.tenants` 行数。  
  - 若有行，打第一条的 keys/id/name/domain。  
  - 返回给前端的列表中，将 `id` 转为字符串，与前端 `Tenant.id` 类型一致。
- **DbSetup**  
  - 连接成功后打 `host/dbname/current_database`；  
  - commit 后打 `public.tenants` 行数，便于与 Tenants 日志对比。

部署后按 1→2→3 顺序排查，即可定位是「库不一致」还是「表为空」或「前端/请求」问题。
