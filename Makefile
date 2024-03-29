.PHONY: format
format:
	isort --recursive .

.PHONY: lint
lint:
	flake8 .

.PHONY: build-es
build-es:
	docker build -t elasticsearch-icu elasticsearch

.PHONY: run-es
run-es: build-es
	docker run -p 9200:9200 -p 9300:9300 -e "discovery.type=single-node" elasticsearch-icu

.PHONY: play
play:
	python -m dc.play

.PHONY: serve
serve:
	uvicorn dc.server:app
