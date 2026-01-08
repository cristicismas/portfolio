# Throw-away build stage to reduce size of final image
ARG NODE_VERSION=22.14.0
FROM node:${NODE_VERSION}-slim AS base

WORKDIR /app

COPY . .

RUN npm i -g serve

CMD [ "serve", "/app" ]
