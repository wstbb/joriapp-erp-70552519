# ERP System Infrastructure and Backend

This directory contains the backend logic and infrastructure definitions for the Cloud Native ERP system.

## Architecture
- **Front-end**: React/TypeScript (Vite)
- **API Management**: Amazon API Gateway
- **Business Logic**: AWS Lambda (Python)
- **Database**: Amazon RDS for PostgreSQL
- **Printing**: Local Printer Agent (WebSocket via API Gateway/IoT)
- **External Integration**: Tax Bureau API for Invoicing

## Directory Structure
- `backend/database/schema.sql`: PostgreSQL database schema.
- `backend/lambda/main.py`: Main Lambda handler for API requests.
- `template.yaml`: AWS SAM template for infrastructure deployment.

## Implementation Details

### Multi-tenancy
The system uses a `tenant_id` column in all major tables to support multi-tenancy. API requests must include an `X-Tenant-ID` header.

### Local Printing
The "Print Center" in the frontend is designed to communicate with a "Local Print Agent". This agent (not included in this repo) should run on a local machine in the same LAN as the printers and maintain a WebSocket connection to AWS.

### Invoicing
The `issue_invoice` function in Lambda mocks the integration with an external Tax Bureau API.

## Deployment
To deploy this backend:
1. Install [AWS SAM CLI](https://docs.aws.amazon.com/serverless-application-model/latest/developerguide/install-sam-cli.html).
2. Run `sam build`.
3. Run `sam deploy --guided`.
