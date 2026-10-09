FROM node:20-alpine

WORKDIR /app

# Install dependencies
COPY package*.json ./
RUN npm install

# Copy application source
COPY . .

EXPOSE 5173

# Start Vite server with host exposed for Docker
CMD ["npm", "run", "dev", "--", "--host"]
