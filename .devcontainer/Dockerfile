FROM node:20

RUN apt-get update && apt-get install -y \
    git \
    curl \
    bash \
    postgresql-client \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /workspace

USER node
