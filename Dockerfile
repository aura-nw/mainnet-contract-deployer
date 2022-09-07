FROM node:lts-alpine

# Working directory
WORKDIR /app

# Install dependencies npm
COPY package.json package-lock.json ./

# Add moleculer
RUN npm install -g moleculer-cli
# RUN yarn global add moleculer-cli

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

# build
RUN npm run build \
	&& npm prune

# Start server
CMD ["npm", "run", "start"]