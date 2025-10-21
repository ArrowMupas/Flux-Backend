    # Use Node.js LTS image
    FROM node:22-alpine

    # Set working directory inside the container
    WORKDIR /app

    # Copy dependency files first
    COPY package*.json ./

    # Install dependencies
    RUN npm install --omit=dev

    # Copy all source code
    COPY . .

    # Expose the port your backend runs on
    EXPOSE 3000

    # Start your backend
    CMD ["node", "server.js"]