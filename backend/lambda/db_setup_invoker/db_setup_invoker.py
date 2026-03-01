# CloudFormation Custom Resource: 部署时自动调用 DbSetup 以初始化数据库并创建 demo 租户
# 带重试：RDS 首次创建时可能尚未就绪，重试数次以提高成功率。
import json
import time
import urllib.request
import boto3

MAX_RETRIES = 5
RETRY_DELAY_SEC = 30

def handler(event, context):
    response_url = event["ResponseURL"]
    request_type = event.get("RequestType", "Create")
    physical_id = event.get("PhysicalResourceId") or "DbSetupInvoker"
    reason = ""
    status = "SUCCESS"
    try:
        if request_type in ("Create", "Update"):
            client = boto3.client("lambda")
            fn_name = event["ResourceProperties"]["DbSetupFunctionName"]
            last_error = None
            for attempt in range(MAX_RETRIES):
                r = client.invoke(
                    FunctionName=fn_name,
                    InvocationType="RequestResponse",
                    Payload=json.dumps({}),
                )
                if r.get("StatusCode") != 200:
                    last_error = f"Lambda invoke returned {r.get('StatusCode')}"
                    if attempt < MAX_RETRIES - 1:
                        time.sleep(RETRY_DELAY_SEC)
                        continue
                    status = "FAILED"
                    reason = last_error
                    break
                raw = r["Payload"].read()
                try:
                    payload = json.loads(raw) if isinstance(raw, bytes) else json.loads(raw.decode("utf-8"))
                except Exception:
                    payload = {}
                if payload.get("statusCode") != 200:
                    last_error = payload.get("body") or "DbSetup failed"
                    if isinstance(last_error, dict):
                        last_error = json.dumps(last_error)
                    if attempt < MAX_RETRIES - 1:
                        time.sleep(RETRY_DELAY_SEC)
                        continue
                    status = "FAILED"
                    reason = str(last_error)[:256]
                    break
                break
            else:
                if last_error:
                    status = "FAILED"
                    reason = last_error[:256]
    except Exception as e:
        status = "FAILED"
        reason = str(e)
    body = {
        "Status": status,
        "Reason": reason[:256],
        "PhysicalResourceId": physical_id,
        "StackId": event["StackId"],
        "RequestId": event["RequestId"],
        "LogicalResourceId": event["LogicalResourceId"],
    }
    req = urllib.request.Request(
        response_url,
        data=json.dumps(body).encode("utf-8"),
        method="PUT",
        headers={"Content-Type": ""},
    )
    urllib.request.urlopen(req)
