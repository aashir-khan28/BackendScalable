# Use an official Node.js runtime as a parent image
FROM node:18-alpine

# Set the working directory in the container
WORKDIR /src

# Copy package.json and package-lock.json to the working directory
COPY package*.json ./

# Install any needed dependencies
RUN npm install

# Copy the current directory contents into the container at /src
COPY . .

# Expose the port the app runs on
EXPOSE 8080

# Command to start the app
CMD [ "node", "./server.js" ]
