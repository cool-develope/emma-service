FROM node:14.17.1 as base

WORKDIR /usr/src/app

# Add package file
COPY package*.json ./

# Install deps
RUN npm i

# Copy source
COPY src ./src
COPY tsconfig.json ./tsconfig.json

EXPOSE 3000