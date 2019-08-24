```sh
pipenv install --dev
pipenv install
pipenv shell
npm install

npm run generate
make run-es
make reindex

make serve
```

## Deployment

```sh
kubectl apply -f k8s.yaml
# For the first time, the es pod will enter a crash loop
# because it cannot write to the mounted volume.
# See https://github.com/elastic/helm-charts/issues/137
# The proper fix is to add init container to chown.
# But k8s complains that volume cannot be mounted multiple times.
kubectl delete deploy/es
kubectl create -f fix-file-permission.yaml
# Wait until the pod completed
kubectl delete -f fix-file-permission.yaml
kubectl apply -f k8s.yaml
```
