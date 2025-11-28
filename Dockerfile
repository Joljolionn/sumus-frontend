from node:alpine as builder

workdir /app

copy package*.json ./

copy .env .
copy /public ./public
copy /server ./server

RUN npm install

EXPOSE 3000

ENTRYPOINT ["npm", "run", "start"]
