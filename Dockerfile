# Use an official Node.js image
FROM node:18

# Set working directory
WORKDIR /src

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy the rest of your app
COPY . .

# Build TypeScript into JavaScript
RUN npm run build

# Expose the port your app runs on
EXPOSE 5001

# Start the server using the compiled JS
CMD ["npm", "start"]
