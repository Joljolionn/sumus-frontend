from node:alpine as builder

workdir /app

copy package*.json ./

copy .env .
copy /assets ./assets
copy /server ./server
copy /Pages ./Pages

RUN npm install

EXPOSE 3000

ENTRYPOINT ["npm", "run", "start"]
