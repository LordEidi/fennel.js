FROM node:9-alpine

# Install dependencies (for libxml)
RUN apk update
RUN apk add python make g++

# Copy code to container
WORKDIR /
COPY . .

# Dependencies
RUN npm install

# Run!
CMD ["node", "server.js"]