# Start from an official Node base image
FROM node:20-alpine

# Set the working directory inside the container
WORKDIR /app

# Copy package files first for the same caching reason
COPY package*.json .

# Install JavaScript dependencies
RUN npm install

# Copy the rest of your frontend code
COPY . .

# Start the Next.js development server
CMD ["npm", "run", "dev"]