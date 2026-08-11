FROM golang:alpine AS builder
RUN apk add --no-cache git ca-certificates bash curl
WORKDIR /app
COPY backend/go.mod backend/go.sum ./
RUN go mod download
COPY backend/. .
RUN CGO_ENABLED=0 GOOS=linux go build -o /lemans-api ./cmd/api

FROM alpine:latest
RUN apk --no-cache add ca-certificates bash curl
WORKDIR /
COPY --from=builder /lemans-api /lemans-api
COPY quadlet/remote-demo/reset-demo.sh /usr/local/bin/reset-demo.sh
RUN chmod +x /usr/local/bin/reset-demo.sh

ENV LISTEN_ADDR=:8080
ENV DEMO_MODE=true
EXPOSE 8080

ENTRYPOINT ["/lemans-api"]
