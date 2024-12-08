FROM node:18

WORKDIR /usr/src/app

COPY package*.json ./

RUN npm install

COPY . .

EXPOSE 3005 3006

# Define the command to start the application
CMD ["npm", "start"]
