# Win GATE Study Tracker - Backend API

A comprehensive FastAPI backend with PostgreSQL database for the Win GATE Study Tracker application.

## 🚀 Features

- **User Authentication**: Registration and login, JWT-based authentication
- **Study Hours Tracking**: Support for both authenticated users and visitors
- **Curriculum Management**: Progress tracking for GATE CS exam preparation
- **Visitor Support**: Non-authenticated user support with local storage fallback
- **PostgreSQL Database**: Robust data storage with SQLAlchemy ORM
- **RESTful API**: Complete REST API with automatic documentation

## 📁 Project Structure

```
backend/
├── main.py                    # Main FastAPI application
├── database_models.py         # SQLAlchemy database models
├── auth_endpoints.py          # Authentication API endpoints
├── study_hours_endpoints.py   # Study hours API endpoints
├── curriculum_endpoints.py    # Curriculum API endpoints
├── visitor_endpoints.py       # Visitor API endpoints
├── requirements.txt           # Python dependencies
├── setup_database.py         # Database setup script
├── test_api.py              # API testing script
├── .env.example             # Environment configuration template
└── README.md                # This file
```

## 🛠 Installation & Setup

### 1. Prerequisites

- Python 3.8+
- PostgreSQL 12+
- pip package manager

### 2. Database Setup

1. **Install PostgreSQL** (if not already installed)
   ```bash
   # Ubuntu/Debian
   sudo apt-get install postgresql postgresql-contrib
   
   # macOS
   brew install postgresql
   
   # Windows
   # Download from https://www.postgresql.org/download/
   ```

2. **Create Database**
   ```bash
   # Connect to PostgreSQL
   psql -U postgres
   
   # Create database
   CREATE DATABASE win_gate_db;
   CREATE USER win_gate_user WITH ENCRYPTED PASSWORD 'your_password';
   GRANT ALL PRIVILEGES ON DATABASE win_gate_db TO win_gate_user;
   \q
   ```

3. **Setup Backend**
   ```bash
   # Navigate to backend directory
   cd backend
   
   # Create virtual environment
   python -m venv venv
   
   # Activate virtual environment
   # Windows
   venv\Scripts\activate
   
   # macOS/Linux
   source venv/bin/activate
   
   # Install dependencies
   pip install -r requirements.txt
   ```

4. **Environment Configuration**
   ```bash
   # Copy environment template
   cp .env.example .env
   
   # Edit .env file with your settings
   nano .env
   ```

5. **Database Initialization**
   ```bash
   # Run database setup script
   python setup_database.py
   ```

### 3. Running the Application

```bash
# Start the FastAPI server
python main.py

# Server will be available at:
# - API: http://localhost:8000
# - Documentation: http://localhost:8000/docs
# - Health Check: http://localhost:8000/health
```

## 🔧 API Endpoints

### Authentication (`/api/auth`)
- `POST /register` - User registration
- `POST /login` - User login
- `GET /me` - Get current user information

### Study Hours (`/api/study-hours`)
- `POST /save-day` - Save study hours (authenticated users)
- `GET /month/{month}/{year}` - Get monthly study hours
- `GET /all` - Get all study hours
- `DELETE /all` - Delete all study hours
- `POST /visitor/save-day` - Save study hours (visitors)
- `GET /visitor/{visitor_id}/{month}/{year}` - Get visitor study hours

### Curriculum (`/api/curriculum`)
- `POST /save` - Save curriculum topic (authenticated users)
- `GET /all` - Get all curriculum data
- `GET /subject/{subject}` - Get curriculum by subject
- `POST /visitor/save` - Save curriculum topic (visitors)
- `GET /visitor/{visitor_id}` - Get visitor curriculum data

### Visitor (`/api/visitor`)
- `POST /register` - Register visitor
- `GET /data/{visitor_id}` - Get all visitor data
- `DELETE /data/{visitor_id}` - Delete all visitor data
- `POST /study-hours/save` - Save visitor study hours
- `POST /curriculum/save` - Save visitor curriculum topic

## 🧪 Testing

```bash
# Run API tests
python test_api.py

# Tests will verify:
# - Health endpoint
# - Visitor registration
# - Study hours endpoints
# - Curriculum endpoints
# - API documentation
```

## 🔐 Security Features

- **JWT Authentication**: Secure token-based authentication
- **Password Hashing**: bcrypt password hashing
- **CORS Configuration**: Configurable cross-origin requests
- **Environment Variables**: Secure configuration management

## 📊 Database Schema

### Users Table
- `id` (Primary Key)
- `email` (Unique)
- `password_hash`
- `name`
- `created_at`
- `updated_at`

### Study Hours Table
- `id` (Primary Key)
- `user_id` (Foreign Key, nullable)
- `visitor_id` (String, nullable)
- `month`, `year`, `day`
- `hours`
- `created_at`, `updated_at`

### Curriculum Data Table
- `id` (Primary Key)
- `user_id` (Foreign Key, nullable)
- `visitor_id` (String, nullable)
- `subject`, `topic`
- `watched`, `revised`, `tested` (Boolean)
- `created_at`, `updated_at`

### Visitor Data Table
- `id` (Primary Key)
- `visitor_id` (Unique)
- `created_at`
- `last_activity`


## 🔧 Configuration

### Environment Variables

```bash
# Database
DATABASE_URL=postgresql://user:password@localhost:5432/win_gate_db

# Security
SECRET_KEY=your-super-secret-key-change-in-production

# Email (optional, for notifications)
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your-email@gmail.com
EMAIL_PASSWORD=your-app-password

# Application
ENVIRONMENT=development
DEBUG=true
ALLOWED_HOSTS=localhost,127.0.0.1
```

## 📈 Usage Examples

### User Registration
```bash
curl -X POST "http://localhost:8000/api/auth/register" \
     -H "Content-Type: application/json" \
     -d '{
       "email": "user@example.com",
       "password": "securepassword",
       "name": "John Doe"
     }'
```

### Save Study Hours
```bash
curl -X POST "http://localhost:8000/api/study-hours/save-day" \
     -H "Authorization: Bearer YOUR_JWT_TOKEN" \
     -H "Content-Type: application/json" \
     -d '{
       "month": 11,
       "year": 2024,
       "day": 15,
       "hours": 6.5
     }'
```

### Visitor Study Hours
```bash
curl -X POST "http://localhost:8000/api/visitor/study-hours/save" \
     -H "Content-Type: application/json" \
     -d '{
       "visitor_id": "visitor_123",
       "month": 11,
       "year": 2024,
       "day": 15,
       "hours": 6.5
     }'
```

## 🚀 Deployment

### Production Checklist

1. **Environment Variables**
   - Set `SECRET_KEY` to a strong secret key
   - Configure `DATABASE_URL` for production database
   - Set `ENVIRONMENT=production`
   - Set `DEBUG=false`

2. **Database**
   - Use production PostgreSQL instance
   - Enable SSL connections
   - Configure proper backup strategy

3. **Security**
   - Use HTTPS in production
   - Configure proper CORS origins
   - Enable rate limiting
   - Use environment variables for all secrets

4. **Monitoring**
   - Set up application monitoring
   - Configure logging
   - Set up health checks

### Docker Deployment (Optional)

```dockerfile
FROM python:3.9-slim

WORKDIR /app
COPY requirements.txt .
RUN pip install -r requirements.txt

COPY . .
EXPOSE 8000

CMD ["python", "main.py"]
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License.

## 🆘 Support

For issues and questions:
1. Check the API documentation at `/docs`
2. Run the test script to verify functionality
3. Check the logs for error details
4. Verify database connection and configuration

---

**Win GATE Study Tracker API** - Built with FastAPI and PostgreSQL
