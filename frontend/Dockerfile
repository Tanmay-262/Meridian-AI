FROM node:20-alpine

WORKDIR /app

# Copy package files first
COPY package.json package-lock.json* ./

# Install dependencies inside the container
RUN npm install

# Copy the rest of the application code
COPY . .

# Expose port 3000 for Next.js
EXPOSE 3000

# Start command for Next.js dev server
CMD ["npm", "run", "dev"]
