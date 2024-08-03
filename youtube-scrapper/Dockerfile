
FROM golang:1.22-alpine AS builder

WORKDIR /usr/src/app

# Copy the Go modules files
COPY go.mod go.sum ./

# Download dependencies
RUN go mod download && go mod verify

# Copy the rest of the application source code
COPY . .

# Build the Go application
RUN CGO_ENABLED=0 GOOS=linux go build -a -installsuffix nocgo -o /app .

# Stage 2: Create the final lightweight image

FROM alpine:latest

# Install Chromium and its dependencies
RUN apk add --no-cache \
    chromium \
    chromium-chromedriver \
    udev \
    ttf-freefont \
    font-noto \
    freetype \
    freetype-dev \
    ca-certificates \
    dbus \
    xvfb

# Set environment variables for Chrome
ENV CHROME_BIN=/usr/bin/chromium-browser \
    CHROME_PATH=/usr/lib/chromium/ \
    CHROMIUM_FLAGS="--no-sandbox --headless --disable-gpu --disable-software-rasterizer --disable-dev-shm-usage"

# Create a non-root user
RUN adduser -D appuser
USER appuser
WORKDIR /home/appuser

#COPY --from=builder /app .
#
## Expose port
#EXPOSE 8080
##
### Set entry point to your application
##CMD ["app"]
#CMD ["./app"]


COPY --from=builder /app /usr/local/bin/app

# Run as root (not ideal, but sometimes necessary for Chromium in Docker)
USER root

EXPOSE 8080

CMD ["/usr/local/bin/app"]