FROM node:20-alpine

WORKDIR /app

# Install pnpm
RUN npm install -g pnpm

ADD . .

ENV NODE_ENV="development"

EXPOSE 80
