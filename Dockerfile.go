# Compile with the native Go toolchain and emit a binary for TARGETPLATFORM.
# This keeps cross-architecture builds free of target-CPU emulation.
FROM --platform=$BUILDPLATFORM golang:alpine AS builder
ARG TARGETOS
ARG TARGETARCH
RUN apk add --no-cache git ca-certificates bash curl
WORKDIR /app
COPY backend/go.mod backend/go.sum ./
RUN go mod download
COPY backend/. .
RUN CGO_ENABLED=0 GOOS="${TARGETOS}" GOARCH="${TARGETARCH}" go build -o /lemans-api ./cmd/api

FROM alpine:latest
WORKDIR /
COPY --from=builder /lemans-api /lemans-api
COPY quadlet/remote-demo/reset-demo.sh /usr/local/bin/reset-demo.sh

ENV LISTEN_ADDR=:8080
ENV DEMO_MODE=true
EXPOSE 8080

ENTRYPOINT ["/lemans-api"]
