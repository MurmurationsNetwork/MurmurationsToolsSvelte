FROM node:20

WORKDIR /app

RUN apt-get update
RUN apt-get install -y --no-install-recommends curl dpkg-dev git lsb-release wget software-properties-common gnupg tcl

# Install pnpm
RUN npm install -g pnpm

ADD . .

ENV NODE_ENV="development"

EXPOSE 80
