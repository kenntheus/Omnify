FROM node:20-alpine
WORKDIR /app
RUN apk add --no-cache curl
COPY package*.json ./
RUN npm ci --only=production
COPY . .
RUN mkdir -p uploads/resumes uploads/avatars
EXPOSE 5000
CMD ["node", "src/server.js"]
