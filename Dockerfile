FROM python:3.7

RUN pip install pipenv

WORKDIR /tmp
COPY Pipfile Pipfile.lock ./
RUN pipenv lock --requirements > requirements.txt && pip install -r requirements.txt

WORKDIR /usr/src/app
COPY . .

CMD ["uvicorn", "--host", "0.0.0.0", "--port", "8000", "dc.server:app"]
