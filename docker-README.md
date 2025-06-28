# 🚀 LEGv8 Simulator - Docker Setup

Quick and easy way to run the LEGv8 CPU Architecture Simulator using Docker.

## 📋 Prerequisites

- [Docker](https://docs.docker.com/get-docker/)
- [Docker Compose](https://docs.docker.com/compose/install/)

## 🏃‍♂️ Quick Start

### Development Mode (with hot reload)
```bash
# For local development with file watching
docker-compose --profile dev up

# Access the app at: http://localhost:3000
```

### Demo Mode (for sharing)
```bash
# For demos without volume mounting (faster startup)
docker-compose --profile demo up

# Access the app at: http://localhost:3000
```

### Production Mode
```bash
# For production deployment with nginx
docker-compose --profile prod up

# Access the app at: http://localhost
```

## 🛠️ Available Commands

| Command | Description |
|---------|-------------|
| `docker-compose --profile dev up` | Development with hot reload |
| `docker-compose --profile demo up` | Demo mode (no volume mounting) |
| `docker-compose --profile prod up` | Production with nginx |
| `docker-compose --profile dev up -d` | Run in background (detached) |
| `docker-compose down` | Stop and remove containers |
| `docker-compose logs -f legv8-dev` | View development logs |

## 🔧 Docker Services

- **legv8-dev**: Development server with hot reload and volume mounting
- **legv8-demo**: Development server without volume mounting (for sharing)
- **legv8-prod**: Production build served by nginx

## 🌐 Port Mapping

- **Development/Demo**: `localhost:3000`
- **Production**: `localhost:80`

## 📦 What's Included

- ✅ Multi-stage Docker build
- ✅ Development with hot reload
- ✅ Production-ready nginx setup
- ✅ Optimized caching and gzip compression
- ✅ Security headers
- ✅ SPA routing support

## 🚀 Share Your Project

1. **Clone the repository**
   ```bash
   git clone <your-repo-url>
   cd HTMT
   ```

2. **Run with Docker**
   ```bash
   docker-compose --profile demo up
   ```

3. **Access the simulator**
   ```
   Open http://localhost:3000 in your browser
   ```

## 🏗️ Building Custom Images

```bash
# Build development image
docker build --target development -t legv8-simulator:dev .

# Build production image  
docker build --target production -t legv8-simulator:prod .
```

## 🔍 Troubleshooting

- **Port already in use**: Change the port mapping in `docker-compose.yml`
- **Hot reload not working**: Try using the `demo` profile instead
- **Build fails**: Check that Docker has enough memory allocated (recommend 4GB+)

---

🎯 **Ready to explore CPU architecture!** The LEGv8 simulator provides an interactive visualization of instruction execution, pipeline stages, and data flow through the processor. 