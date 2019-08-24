## API

### GET /search1

#### Query Parameters

- keyword
- district
- year

### GET /search2

#### Query Parameters

- keyword
- district
- year
- meeting_type
- meeting_number
- document_type

### district

- wc
- south
- east
- kt
- ssp
- ytm
- wts
- kc
- island
- tw
- yl
- north
- st
- sk
- kwt
- tp
- tm

### meeting_type

- full_council

### document_type

- agenda
- minutes
- audio

## Development

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
