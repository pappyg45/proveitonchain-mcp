FROM node:20-alpine
WORKDIR /app
COPY package.json ./
RUN npm install --omit=dev --no-audit --no-fund
COPY bin ./bin
COPY README.md LICENSE server.json ./
ENV PROVEITONCHAIN_MCP_URL=https://proveitonchain.com/mcp
ENTRYPOINT ["node", "bin/proveitonchain-mcp.js"]
