FROM node:lts

# Set working directory
WORKDIR /usr/src/app

# Install all dependencies
COPY package.json .
RUN npm i && npm i typescript -g

#Compile
ADD . /usr/src/app
RUN npx tsc

# Run start script
CMD [ "node", "src/chat.js" ]