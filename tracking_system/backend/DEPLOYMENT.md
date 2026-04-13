# 🚀 Production Deployment Guide - Smart Bus Tracking Backend

Complete guide for deploying the Smart Bus Tracking Backend to production.

## Table of Contents

1. [Pre-deployment Checklist](#pre-deployment-checklist)
2. [Environment Setup](#environment-setup)
3. [Database Setup](#database-setup)
4. [Server Deployment](#server-deployment)
5. [Security Hardening](#security-hardening)
6. [Monitoring & Logging](#monitoring--logging)
7. [Scaling & Load Balancing](#scaling--load-balancing)
8. [Disaster Recovery](#disaster-recovery)
9. [Performance Tuning](#performance-tuning)

---

## Pre-deployment Checklist

- [ ] Code reviewed and tested
- [ ] All dependencies locked in package-lock.json
- [ ] Environment variables documented
- [ ] Database migrations tested
- [ ] SSL/TLS certificates obtained
- [ ] Backup strategy defined
- [ ] Monitoring setup planned
- [ ] Security audit completed
- [ ] Load testing performed
- [ ] Fallback plan documented

---

## Environment Setup

### Production .env Configuration

```env
# Server Configuration
NODE_ENV=production
PORT=5000

# Database (use AWS RDS, Azure Database, or self-hosted)
DB_HOST=your-production-db.rds.amazonaws.com
DB_PORT=5432
DB_NAME=smart_bus_tracking
DB_USER=postgres_user
DB_PASSWORD=secure_random_password_min_16_chars

# JWT Configuration (use strong, unique secret)
JWT_SECRET=your_extremely_secure_secret_key_min_32_chars_use_openssl_rand_-base64_32
JWT_EXPIRE=7d

# CORS Configuration
SOCKET_IO_CORS=https://yourdomain.com,https://www.yourdomain.com,https://app.yourdomain.com

# Logging
LOG_LEVEL=info
LOG_FILE=/var/log/bus-tracking/app.log

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100

# Session Configuration
SESSION_SECRET=another_unique_secure_random_string
```

### Generate Secure Secrets

```bash
# Generate JWT_SECRET
openssl rand -base64 32

# Generate SESSION_SECRET
openssl rand -base64 32

# Store in secure vault (AWS Secrets Manager, HashiCorp Vault, etc.)
```

---

## Database Setup

### Production Database Configuration

#### AWS RDS PostgreSQL

```bash
# Create RDS instance via AWS Console or CLI
aws rds create-db-instance \
  --db-instance-identifier smart-bus-tracking-prod \
  --db-instance-class db.t3.medium \
  --engine postgres \
  --allocated-storage 100 \
  --master-username postgres \
  --master-userpassword "ComplexPassword123!" \
  --vpc-security-group-ids sg-xxxxxxxx \
  --db-subnet-group-name default \
  --backup-retention-period 30 \
  --multi-az \
  --storage-encrypted \
  --enable-cloudwatch-logs-exports postgresql
```

#### Database Initialization

```bash
# 1. Connect to production database
psql -h your-db-host -U postgres -d smart_bus_tracking

# 2. Create application user (separate from admin)
CREATE USER app_user WITH ENCRYPTED PASSWORD 'secure_password';
GRANT CONNECT ON DATABASE smart_bus_tracking TO app_user;
GRANT USAGE ON SCHEMA public TO app_user;
GRANT CREATE ON SCHEMA public TO app_user;

# 3. Run migration script
npm run db:init

# 4. Verify schema
\dt
```

### Database Backup Strategy

```bash
#!/bin/bash
# backup-database.sh

BACKUP_DIR="/backups/postgres"
DB_HOST="your-db-host"
DB_NAME="smart_bus_tracking"
DATE=$(date +%Y%m%d_%H%M%S)

# Create backup
pg_dump -h $DB_HOST -U postgres $DB_NAME | gzip > "$BACKUP_DIR/backup_$DATE.sql.gz"

# Keep only last 30 days
find $BACKUP_DIR -name "backup_*.sql.gz" -mtime +30 -delete

# Upload to S3
aws s3 cp "$BACKUP_DIR/backup_$DATE.sql.gz" s3://your-backup-bucket/database/
```

Schedule with cron:
```bash
# Daily backup at 2 AM
0 2 * * * /scripts/backup-database.sh
```

---

## Server Deployment

### Option 1: Docker Deployment

#### Dockerfile

```dockerfile
FROM node:18-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci --only=production

# Copy application
COPY . .

# Expose port
EXPOSE 5000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
    CMD node -e "require('http').get('http://localhost:5000/health', (r) => {if (r.statusCode !== 200) throw new Error(r.statusCode)})"

# Start application
CMD ["npm", "start"]
```

#### Docker Compose (Production)

```yaml
version: '3.8'

services:
  backend:
    build: .
    container_name: smart-bus-tracking-backend
    restart: always
    ports:
      - "5000:5000"
    environment:
      - NODE_ENV=production
      - DB_HOST=postgres
      - DB_NAME=smart_bus_tracking
      - DB_USER=app_user
      - DB_PASSWORD=${DB_PASSWORD}
      - JWT_SECRET=${JWT_SECRET}
    depends_on:
      - postgres
    networks:
      - app-network
    logging:
      driver: "json-file"
      options:
        max-size: "10m"
        max-file: "3"

  postgres:
    image: postgres:15-alpine
    container_name: smart-bus-tracking-db
    restart: always
    environment:
      - POSTGRES_DB=smart_bus_tracking
      - POSTGRES_USER=app_user
      - POSTGRES_PASSWORD=${DB_PASSWORD}
    volumes:
      - postgres-data:/var/lib/postgresql/data
      - ./db/schema.sql:/docker-entrypoint-initdb.d/01-schema.sql
    networks:
      - app-network

  nginx:
    image: nginx:alpine
    container_name: smart-bus-tracking-nginx
    restart: always
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx.conf:/etc/nginx/nginx.conf:ro
      - /etc/letsencrypt:/etc/letsencrypt:ro
    depends_on:
      - backend
    networks:
      - app-network

networks:
  app-network:
    driver: bridge

volumes:
  postgres-data:
```

#### Build & Deploy

```bash
# Build image
docker build -t smart-bus-tracking-backend:latest .

# Tag for registry
docker tag smart-bus-tracking-backend:latest registry.example.com/smart-bus-tracking-backend:latest

# Push to registry
docker push registry.example.com/smart-bus-tracking-backend:latest

# Deploy
docker-compose -f docker-compose.prod.yml up -d
```

### Option 2: Traditional Server Deployment

#### Via SSH

```bash
# 1. SSH into server
ssh ubuntu@your-server-ip

# 2. Clone repository
cd /home/ubuntu/apps
git clone https://github.com/yourepo/bus-tracking-backend.git
cd bus-tracking-backend

# 3. Install dependencies
npm ci --production

# 4. Create .env file
cp .env.example .env
nano .env  # Edit with production values

# 5. Initialize database
npm run db:init

# 6. Start with PM2
npm install -g pm2
pm2 start src/server.js --name "bus-tracking-api"
pm2 save
pm2 startup
```

#### PM2 Ecosystem File

```javascript
// ecosystem.config.js
module.exports = {
  apps: [{
    name: 'bus-tracking-api',
    script: './src/server.js',
    instances: 'max',
    exec_mode: 'cluster',
    env: {
      NODE_ENV: 'production',
      PORT: 5000
    },
    error_file: './logs/error.log',
    out_file: './logs/out.log',
    log_file: './logs/combined.log',
    time_format: 'YYYY-MM-DD HH:mm:ss Z',
    merge_logs: true
  }]
};
```

### Option 3: Kubernetes Deployment

#### Deployment Manifest

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: bus-tracking-backend
  namespace: production
spec:
  replicas: 3
  selector:
    matchLabels:
      app: bus-tracking-backend
  template:
    metadata:
      labels:
        app: bus-tracking-backend
    spec:
      containers:
      - name: backend
        image: registry.example.com/smart-bus-tracking-backend:latest
        ports:
        - containerPort: 5000
        env:
        - name: NODE_ENV
          value: "production"
        - name: DB_HOST
          valueFrom:
            configMapKeyRef:
              name: db-config
              key: host
        - name: DB_PASSWORD
          valueFrom:
            secretKeyRef:
              name: db-secret
              key: password
        - name: JWT_SECRET
          valueFrom:
            secretKeyRef:
              name: app-secret
              key: jwt_secret
        resources:
          requests:
            memory: "512Mi"
            cpu: "500m"
          limits:
            memory: "1Gi"
            cpu: "1000m"
        livenessProbe:
          httpGet:
            path: /health
            port: 5000
          initialDelaySeconds: 30
          periodSeconds: 10
        readinessProbe:
          httpGet:
            path: /health
            port: 5000
          initialDelaySeconds: 10
          periodSeconds: 5

---
apiVersion: v1
kind: Service
metadata:
  name: bus-tracking-backend-service
  namespace: production
spec:
  selector:
    app: bus-tracking-backend
  ports:
  - protocol: TCP
    port: 80
    targetPort: 5000
  type: LoadBalancer
```

---

## Security Hardening

### 1. HTTPS/TLS

```bash
# Get SSL certificate (Let's Encrypt)
certbot certonly --standalone -d yourdomain.com -d api.yourdomain.com

# Auto-renewal with cron
0 0 1 * * certbot renew --quiet
```

### 2. CORS Configuration

```javascript
// Strict CORS in production
const corsOptions = {
  origin: process.env.SOCKET_IO_CORS?.split(',') || [],
  credentials: true,
  optionsSuccessStatus: 200,
  methods: ['GET', 'POST', 'PATCH', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization']
};
```

### 3. Rate Limiting

```javascript
import rateLimit from 'express-rate-limit';

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,  // 15 minutes
  max: 100,                   // max 100 requests per window
  message: 'Too many requests'
});

app.use('/api/', limiter);
```

### 4. Security Headers

```javascript
import helmet from 'helmet';

app.use(helmet());  // Sets X-Frame-Options, X-XSS-Protection, etc.
```

### 5. Input Validation

- Validate all inputs
- Use prepared statements (already done with pg library)
- Sanitize output
- Implement rate limiting

### 6. Database Security

```sql
-- Create restricted application user
CREATE USER app_user WITH ENCRYPTED PASSWORD 'secure_password';
GRANT CONNECT ON DATABASE smart_bus_tracking TO app_user;

-- Grant minimal privileges
GRANT SELECT, INSERT, UPDATE ON users TO app_user;
GRANT SELECT, INSERT ON seat_reports TO app_user;
-- etc.

-- No superuser privileges
```

### 7. Regular Updates

```bash
# Keep dependencies updated
npm audit fix
npm update --save

# Monitor vulnerabilities
npm audit
```

---

## Monitoring & Logging

### Application Logging

```javascript
// Configure Winston logger
import winston from 'winston';

const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: winston.format.json(),
  transports: [
    new winston.transports.File({ filename: 'error.log', level: 'error' }),
    new winston.transports.File({ filename: 'combined.log' }),
    new winston.transports.Console()
  ]
});

logger.info('Application started');
logger.error('Error occurred', { error });
```

### Health Monitoring

```bash
# Endpoint for monitoring
curl http://localhost:5000/health

# Response should be:
# {
#   "status": "ok",
#   "message": "...",
#   "connectedUsers": 42
# }
```

### APM (Application Performance Monitoring)

```javascript
// New Relic integration
import newrelic from 'newrelic';

// Automatically tracks:
// - Response times
// - Error rates
// - Database queries
// - External API calls
```

### Database Monitoring

```bash
# Monitor active connections
SELECT count(*) FROM pg_stat_activity;

# Monitor slow queries
SELECT * FROM pg_stat_statements ORDER BY mean_time DESC LIMIT 10;

# Monitor table sizes
SELECT tablename, pg_size_pretty(pg_total_relation_size(tablename)) 
FROM pg_tables 
WHERE schemaname='public' 
ORDER BY pg_total_relation_size(tablename) DESC;
```

---

## Scaling & Load Balancing

### Nginx Configuration

```nginx
# nginx.conf
upstream backend {
    least_conn;
    server backend1:5000 max_fails=3 fail_timeout=30s;
    server backend2:5000 max_fails=3 fail_timeout=30s;
    server backend3:5000 max_fails=3 fail_timeout=30s;
}

server {
    listen 80;
    server_name api.yourdomain.com;

    # Socket.io upgrade
    map $http_upgrade $connection_upgrade {
        default upgrade;
        '' close;
    }

    location / {
        proxy_pass http://backend;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection $connection_upgrade;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        
        # Timeouts
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
    }

    # SSL redirect
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name api.yourdomain.com;

    ssl_certificate /etc/letsencrypt/live/yourdomain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/yourdomain.com/privkey.pem;
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;

    location / {
        proxy_pass http://backend;
        # ... same as above
    }
}
```

### Auto-scaling Configuration

```yaml
# Kubernetes Horizontal Pod Autoscaler
apiVersion: autoscaling/v2
kind: HorizontalPodAutoscaler
metadata:
  name: bus-tracking-hpa
spec:
  scaleTargetRef:
    apiVersion: apps/v1
    kind: Deployment
    name: bus-tracking-backend
  minReplicas: 2
  maxReplicas: 10
  metrics:
  - type: Resource
    resource:
      name: cpu
      target:
        type: Utilization
        averageUtilization: 70
  - type: Resource
    resource:
      name: memory
      target:
        type: Utilization
        averageUtilization: 80
```

---

## Disaster Recovery

### Backup & Restore Strategy

```bash
#!/bin/bash
# Automated backup script

BACKUP_DIR="/backups"
DATE=$(date +%Y%m%d_%H%M%S)
S3_BUCKET="s3://backups-bucket"

# Database backup
pg_dump -h $DB_HOST -U postgres $DB_NAME | gzip > "$BACKUP_DIR/db_$DATE.sql.gz"

# Configuration backup
tar -czf "$BACKUP_DIR/config_$DATE.tar.gz" /etc/bus-tracking/

# Upload to S3
aws s3 cp "$BACKUP_DIR/db_$DATE.sql.gz" "$S3_BUCKET/database/"
aws s3 cp "$BACKUP_DIR/config_$DATE.tar.gz" "$S3_BUCKET/config/"

# Keep local backups for 7 days
find $BACKUP_DIR -mtime +7 -delete

# Keep S3 backups for 90 days (via lifecycle policy)
```

### Restore Procedure

```bash
# 1. Download backup
aws s3 cp s3://backups-bucket/database/db_YYYYMMDD_HHMMSS.sql.gz .

# 2. Restore database
gunzip < db_YYYYMMDD_HHMMSS.sql.gz | psql -h localhost -U postgres $DB_NAME

# 3. Verify data
psql -c "SELECT COUNT(*) FROM users;"
```

### Failover Strategy

```
Primary DC (Region A)
    ↓
    → Dedicated backup (cross-region)
    → Read replicas for distribution
    
If Primary fails:
    → DNS failover to Secondary DC (Region B)
    → Promote read replica to primary
    → Point apps to new primary
    
RTO: 5 minutes
RPO: < 1 minute
```

---

## Performance Tuning

### Database Query Optimization

```sql
-- Add missing indexes based on queries
CREATE INDEX idx_passenger_sessions_active 
ON passenger_sessions(bus_id, is_active) 
WHERE is_active = true;

-- Analyze query plans
EXPLAIN ANALYZE SELECT * FROM active_buses WHERE is_active = true;

-- Vacuuming for optimization
VACUUM ANALYZE;
```

### Connection Pool Tuning

```javascript
// Optimize pool settings
const pool = new Pool({
  max: 40,                    // Max connections
  min: 5,                     // Keep minimum alive
  idleTimeoutMillis: 30000,   // 30s timeout
  connectionTimeoutMillis: 2000,
  statement_timeout: 30000,   // 30s max query
  application_name: 'bus-tracking'
});
```

### Caching Strategy

```javascript
// Redis caching layer
import redis from 'redis';

const redisClient = redis.createClient({
  host: process.env.REDIS_HOST,
  port: 6379
});

// Cache routes (rarely change)
async function getRoutes() {
  const cached = await redisClient.get('routes');
  if (cached) return JSON.parse(cached);
  
  const routes = await Route.getAll();
  await redisClient.setEx('routes', 3600, JSON.stringify(routes));
  return routes;
}
```

### Response Compression

```javascript
import compression from 'compression';

app.use(compression());  // Gzip all responses
```

---

## Monitoring Checklist

- [ ] CPU usage < 70%
- [ ] Memory usage < 80%
- [ ] Database connections healthy
- [ ] Response times < 500ms
- [ ] Error rate < 0.5%
- [ ] Uptime > 99.9%
- [ ] Backups running daily
- [ ] SSL certificates valid
- [ ] All services healthy

---

## Deployment Script

```bash
#!/bin/bash
# deploy.sh

set -e

echo "🚀 Deploying Smart Bus Tracking Backend..."

# 1. Pull latest code
echo "📥 Pulling latest code..."
git pull origin main

# 2. Install dependencies
echo "📦 Installing dependencies..."
npm ci --production

# 3. Run tests
echo "✅ Running tests..."
npm test

# 4. Backup database
echo "💾 Backing up database..."
/scripts/backup-database.sh

# 5. Run migrations
echo "🗄️  Running migrations..."
npm run db:migrate

# 6. Restart application
echo "🔄 Restarting application..."
pm2 restart bus-tracking-api --wait-ready

# 7. Verify health
echo "❤️  Verifying health..."
sleep 5
curl http://localhost:5000/health

echo "✨ Deployment successful!"
```

---

## Troubleshooting

### High Database Load

1. Check slow queries: `SELECT * FROM pg_stat_statements ORDER BY mean_time DESC;`
2. Add missing indexes
3. Optimize queries with EXPLAIN ANALYZE
4. Increase connection pool size
5. Scale database vertically/horizontally

### Memory Leaks

1. Monitor with: `pm2 monit`
2. Check for event listener leaks
3. Use heap snapshots with node --inspect
4. Restart periodically with PM2 autorestart

### Socket.io Connection Issues

1. Check CORS configuration
2. Verify proxy/load balancer settings
3. Check firewall rules
4. Monitor with Socket.io dashboard

---

## Support & Maintenance

For production issues:
1. Check application logs
2. Review error tracking (New Relic, Sentry)
3. Check database health
4. Verify network connectivity
5. Consult architecture documentation
