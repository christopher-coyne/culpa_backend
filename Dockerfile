FROM node:16

# Create app directory
COPY . /app

WORKDIR /app

RUN npm install

EXPOSE 10001

CMD ["node", "server.js"]