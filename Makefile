PYTHON_PACKAGE := dc

.PHONY: format
format:
	isort --recursive $(PYTHON_PACKAGE)
	black $(PYTHON_PACKAGE)

.PHONY: lint
lint:
	flake8 $(PYTHON_PACKAGE)

.PHONY: build-es
build-es:
	docker build -t elasticsearch-icu elasticsearch

.PHONY: run-es
run-es: build-es
	docker run -p 9200:9200 -p 9300:9300 -e "discovery.type=single-node" elasticsearch-icu

.PHONY: reindex
reindex:
	python -m dc.cmd.reindex

.PHONY: serve
serve:
	uvicorn dc.server:app
