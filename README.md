# Mainnet Contract Deployer Service

This is a service to help end-users deploy their contract from Euphoria Staging Network to Mainnet.

## Main flow

There are 2 steps to deploy contract(s) to Mainnet:

- From our AuraScan site, user choose contract(s) that have been verified and request to deploy contract(s)'s `Code ID` to Mainnet.
- From this service site, our admin will review each request and decide whether approve or reject the request. If approved, your contract(s)'s Code ID from Euphoria will be stored on Mainnet and an email with the new Code ID(s) on Mainnet will be sent to your requested email. If rejected, an email with rejection reason will be sent to your requested email.

![image](docs/images/Contract%20Deployer%20Sequence%20Diagram.png)

## List services

-   **api-gateway**: API Gateway for backend API, query and update data from DB
    -   _login_: Admin login to application to show list of requests, approve or reject a request
    -   _request_: End user request to deploy their contract(s) on Mainnet
    -   _all-requests_: Show list of all requests
    -   _approve_: Admin approve a request
    -   _reject_: Admin reject a request

-   **handle-request**: Create a new request

-   **handle-deployment**: Handle approval or rejection action

## How to run
```bash
# create file env
cp .env.example .env
# then replace env field with your own value, point SERVICE to service you want to run
​
# run with moleculer cli
npm run dev
```