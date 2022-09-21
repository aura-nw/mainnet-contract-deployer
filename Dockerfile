FROM node:16-alpine3.15

# Working directory
WORKDIR /app

# Install dependencies npm
COPY package.json package-lock.json ./

# Add moleculer
RUN npm install -g moleculer-cli

# Add all supported transporters except kafka
RUN npm install -g amqp \
	nats \
	node-nats-streaming \
	ioredis \
	mqtt \
	amqplib \
	rhea-promise

# Add all supported serializers
RUN npm install -g avsc \
	msgpack5 \
	notepack.io \
	protobufjs \
	thrift

# install project dependencies
RUN npm ci --silent

# Copy source
COPY . .

# Build and cleanup
# ENV NODE_ENV=production

# build
RUN npm run build \
	&& npm prune

# Start server
CMD ["npm", "run", "start"]