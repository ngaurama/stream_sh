FROM node:18-alpine as frontend-build

ARG VITE_API_URL
ARG VITE_WS_URL
ARG VITE_IMAGE_URL
ARG VITE_BASE_URL

ENV VITE_API_URL=${VITE_API_URL}
ENV VITE_WS_URL=${VITE_WS_URL}
ENV VITE_IMAGE_URL=${VITE_IMAGE_URL}
ENV VITE_BASE_URL=${VITE_BASE_URL}

WORKDIR /app

COPY frontend/package*.json ./
RUN npm ci --only=production

COPY frontend/ ./
RUN npm run build

FROM tiangolo/nginx-rtmp

COPY --from=frontend-build /app/dist /usr/share/nginx/html

COPY nginx/nginx.conf /etc/nginx/nginx.conf

RUN mkdir -p /tmp/hls/live
VOLUME ["/tmp/hls"]

EXPOSE 80
EXPOSE 443
EXPOSE 1935

CMD ["nginx", "-g", "daemon off;"]
