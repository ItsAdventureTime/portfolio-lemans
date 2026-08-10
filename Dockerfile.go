FROM golang:alpine AS builder
RUN apk add --no-cache git ca-certificates
WORKDIR /app
COPY go.mod go.sum ./
RUN go mod download
COPY . .
RUN CGO_ENABLED=0 GOOS=linux go build -o /lemans-api ./cmd/api

FROM alpine:latest
RUN apk --no-cache add ca-certificates
WORKDIR /
COPY --from=builder /lemans-api /lemans-api

ENV LISTEN_ADDR=:8080
ENV DEMO_MODE=true
EXPOSE 8080

ENTRYPOINT ["/lemans-api"]
