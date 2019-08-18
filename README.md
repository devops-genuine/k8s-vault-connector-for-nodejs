# k8s-vault-connector-for-nodejs

# Important! : This libray is supported only vault engine which it integerated with kubernetes api.

The library to connect and query secret data from vault engine for nodes, this library only supports for vault K/V secret version 2+.

## Run in local development
1) Port forward
```sh
NAMESPACE="secrets"
VAULTSERVICE="vault-cluster-01"
kubectl -n ${NAMESPACE} get vault ${VAULTSERVICE} -o jsonpath='{.status.vaultStatus.active}' | xargs -0 -I {} kubectl -n ${NAMESPACE} port-forward {} 8200
```
2) Get Service Account Token
```sh
secret_name=$(kubectl -n local get serviceaccount deployer -o jsonpath="{.secrets[0].name}")
kubectl get secret ${secret_name} -n local -o jsonpath="{.data.token}" | base64 --decode > /tmp/ServiceAccountToken
```

3) Export required environment variables
```sh
export VAULT_URL="https://127.0.0.1:8200"
export VAULT_ROLE_NAME="local-read-only-role"
export VAULT_SECRET_MOUNTPOINT="/v1/secret/data/local/apps/demo-app1"
export VAULT_LOGIN_CONTEXT="/v1/auth/kubernetes/login"
export K8S_TOKEN_FILE="/tmp/ServiceAccountToken" # Define only on localhost, after deployed to kubenetes, automatic use /var/run/secrets/kubernetes.io/serviceaccount/token
```
4) Install connector as dependency
```sh
npm install github.com/devops-genuine/k8s-vault-connector-for-nodejs.git#<RELEASE_VERSION>
npm install github.com/devops-genuine/k8s-vault-connector-for-nodejs.git#1.0.0
```
5) How to use, you can check it out in example folder
