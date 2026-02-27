
import json
from users import lambda_handler as users_handler
from products import lambda_handler as products_handler
from orders import lambda_handler as orders_handler
from inventory import lambda_handler as inventory_handler
from finance import lambda_handler as finance_handler
from approvals import lambda_handler as approvals_handler
from partners import lambda_handler as partners_handler

def lambda_handler(event, context):
    path = event.get('path', '')
    
    # Simple path-based routing
    if path.startswith('/users') or path == '/login':
        return users_handler(event, context)
    elif path.startswith('/products'):
        return products_handler(event, context)
    elif path.startswith('/orders'):
        return orders_handler(event, context)
    elif path.startswith('/inventory'):
        return inventory_handler(event, context)
    elif path.startswith('/finance'):
        return finance_handler(event, context)
    elif path.startswith('/approvals'):
        return approvals_handler(event, context)
    elif path.startswith('/partners'):
        return partners_handler(event, context)
    else:
        return {
            'statusCode': 404,
            'body': json.dumps({"error": "Not Found"})
        }
