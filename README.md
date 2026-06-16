# Decentralized File Upload System

A secure file upload system with admin and user authentication, featuring unique code generation for file access.

## Features

- **User Authentication**: Separate login/signup for admin and regular users
- **File Upload**: Users can upload files and receive unique access codes
- **Admin Code Checking**: Admins can check files using codes, which automatically regenerates new codes
- **Secure Access**: Files are only accessible through valid codes
- **Modern UI**: Beautiful, responsive interface built with Bootstrap

## Prerequisites

- Node.js (v14 or higher)
- MongoDB (running locally or MongoDB Atlas)
- npm or yarn

## Installation

1. **Clone or download the project**
   ```bash
   cd /Users/kapil/Desktop/COMPANY/COLLEGE PROJECTS GRL/decentrallization
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   - Copy `config.env` to `.env` (or create `.env` file)
   - Update the following variables:
   ```
   MONGO_URI=mongodb://localhost:27017
   DATABASE_NAME=decentralized_files
   JWT_SECRET=your_super_secret_jwt_key_here_change_this_in_production
   PORT=3000
   ```

4. **Start MongoDB**
   - Make sure MongoDB is running on your system
   - For local MongoDB: `mongod`
   - For MongoDB Atlas: Use your connection string in MONGO_URI

5. **Start the application**
   ```bash
   npm start
   ```
   
   For development with auto-restart:
   ```bash
   npm run dev
   ```

6. **Access the application**
   - Open your browser and go to `http://localhost:3000`

## Usage

### For Users:
1. **Sign Up**: Create an account with role "user"
2. **Login**: Use your credentials to access the user dashboard
3. **Upload Files**: Drag & drop or click to upload files
4. **Get Code**: Receive a unique upload code for each file
5. **Share Code**: Share the code with admin for file access

### For Admins:
1. **Sign Up**: Create an account with role "admin"
2. **Login**: Use your credentials to access the admin dashboard
3. **Check Files**: Enter upload codes to view file details
4. **Code Regeneration**: After checking, a new code is automatically generated
5. **View All Files**: See all uploaded files in the system

## API Endpoints

### Authentication
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `GET /api/auth/profile` - Get current user profile

### Files (User)
- `POST /api/files/upload` - Upload file (requires user authentication)
- `GET /api/files/my-files` - Get user's uploaded files

### Files (Admin)
- `POST /api/files/check-code` - Check file by upload code
- `GET /api/files/get-file/:uploadCode` - Get file details by code
- `GET /api/files/download/:uploadCode` - Download file by code
- `GET /api/files/all` - Get all files in system

## File Structure

```
decentrallization/
├── models/
│   ├── User.js          # User model with authentication
│   └── File.js          # File model with code generation
├── routes/
│   ├── auth.js          # Authentication routes
│   └── files.js         # File management routes
├── middleware/
│   └── auth.js          # Authentication middleware
├── utils/
│   └── upload.js        # File upload configuration
├── public/
│   ├── index.html       # Frontend interface
│   └── app.js           # Frontend JavaScript
├── uploads/             # File storage directory (auto-created)
├── server.js            # Main server file
├── package.json         # Dependencies and scripts
├── config.env           # Environment variables template
└── README.md            # This file
```

## Security Features

- **Password Hashing**: All passwords are hashed using bcrypt
- **JWT Authentication**: Secure token-based authentication
- **Role-based Access**: Separate permissions for admin and user
- **File Validation**: File type and size restrictions
- **Code Regeneration**: Automatic code change after admin check

## Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `MONGO_URI` | MongoDB connection string | `mongodb://localhost:27017` |
| `DATABASE_NAME` | Database name | `decentralized_files` |
| `JWT_SECRET` | Secret key for JWT tokens | Required |
| `PORT` | Server port | `3000` |

## Development

To run in development mode with auto-restart:
```bash
npm run dev
```

## Production Deployment

1. Set `NODE_ENV=production`
2. Use a strong JWT_SECRET
3. Configure proper MongoDB connection
4. Set up file storage (consider cloud storage for production)
5. Use a reverse proxy (nginx) for serving static files

## Troubleshooting

### Common Issues:

1. **MongoDB Connection Error**
   - Ensure MongoDB is running
   - Check MONGO_URI in your environment file

2. **File Upload Fails**
   - Check uploads directory permissions
   - Verify file size limits

3. **Authentication Issues**
   - Clear browser localStorage
   - Check JWT_SECRET configuration

## License

MIT License - feel free to use this project for educational or commercial purposes.

 ## Project Goals

- Provide secure file storage
- Enable role-based access control
- Prevent unauthorized file access
- Support future decentralized storage integration
- Improve data security and reliability


