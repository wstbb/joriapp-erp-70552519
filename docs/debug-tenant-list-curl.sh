#!/usr/bin/env bash
# 调试「管理员登录后租户一览为空」：用 curl 直接调 API 看返回内容与后端日志。
# 用法: API_BASE_URL=https://你的API根地址 ./debug-tenant-list-curl.sh
# 默认与 智汇云-erp/api/index.ts 里 baseURL 一致（CloudFormation 输出 ApiGatewayEndpoint）。

BASE="${API_BASE_URL:-https://rbg9venhb0.execute-api.ap-northeast-1.amazonaws.com}"

echo "=== 1. 超级管理员登录，获取 token ==="
LOGIN_RESP=$(curl -s -X POST "$BASE/api/auth/login" \
  -H "Content-Type: application/json" \
  -d '{"username":"superadmin","password":"test1234"}')
echo "$LOGIN_RESP" | head -c 500
echo ""

TOKEN=$(echo "$LOGIN_RESP" | python3 -c "import sys,json; d=json.load(sys.stdin); print(d.get('token',''))" 2>/dev/null)
if [ -z "$TOKEN" ]; then
  echo "失败: 未获取到 token，请检查登录返回"
  exit 1
fi
echo "已获取 token (前 20 字符): ${TOKEN:0:20}..."

echo ""
echo "=== 2. GET /api/tenants（带管理员 token）==="
curl -s -X GET "$BASE/api/tenants" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" | python3 -m json.tool 2>/dev/null || cat

echo ""
echo "=== 3. 同时可在 CloudWatch 查看 TenantsFunction 日志：[TENANTS_DEBUG] current_database=..., current_schema=..., row count=..., first row ... ==="
