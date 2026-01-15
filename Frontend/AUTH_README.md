# Frontend Authentication Service with Redux Toolkit

This directory contains the passwordless authentication setup using magic links, Redux Toolkit, and axios.

## Structure

```
src/
├── config/
│   └── axios.config.js          # Axios instance with interceptors
├── services/
│   └── auth.service.js          # Authentication API service
└── store/
    ├── store.js                 # Redux store configuration
    └── slices/
        └── authSlice.js         # Auth state slice with actions
```

## Features

### Passwordless Magic Link Authentication

This app uses a passwordless authentication system where users receive a magic link via email instead of using passwords.

### axios.config.js
- Configured axios instance with base URL
- Cookie-based authentication (no manual token management)
- Response interceptor to handle 401 errors
- Automatic redirect to login on authentication failure

### auth.service.js
- **sendEmail(email)** - Send magic link to user's college email
- **login(magictoken)** - Login using magic token from URL
- **getUser()** - Fetch current authenticated user data
- **logout()** - Logout and clear user session

### authSlice.js
Redux Toolkit slice with:
- State management for user, loading, error states
- `emailSent` state to track magic link delivery
- Async thunks for all auth operations
- Automatic state updates based on action results

## Authentication Flow

1. **User enters email** → Frontend calls `sendEmail(email)`
2. **Backend validates college email** → Generates magic token
3. **User receives email** → Clicks magic link
4. **Frontend extracts token** → Calls `login(magictoken)`
5. **Backend validates token** → Sets httpOnly cookie
6. **User is authenticated** → All requests include cookie automatically

## Usage Example

### Sending Magic Link

```jsx
import { useDispatch, useSelector } from 'react-redux';
import { sendEmail, reset } from './store/slices/authSlice';

function LoginComponent() {
  const dispatch = useDispatch();
  const { emailSent, isLoading, isError, message } = useSelector((state) => state.auth);

  const handleSendEmail = async (e) => {
    e.preventDefault();
    const email = 'student@college.edu';
    
    try {
      await dispatch(sendEmail(email)).unwrap();
      // Show success message - check your email
    } catch (error) {
      // Handle error
      console.error(error);
    }
  };

  return (
    <form onSubmit={handleSendEmail}>
      <input type="email" name="email" required />
      <button type="submit" disabled={isLoading}>
        {isLoading ? 'Sending...' : 'Send Magic Link'}
      </button>
      {emailSent && <p>Magic link sent! Check your email.</p>}
      {isError && <p>{message}</p>}
    </form>
  );
}
```

### Handling Magic Link Login

```jsx
import { useEffect } from 'react';
import { useDispatch } from 'react-redux';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { login } from './store/slices/authSlice';

function MagicLinkHandler() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  useEffect(() => {
    const magictoken = searchParams.get('magictoken');
    
    if (magictoken) {
      dispatch(login(magictoken))
        .unwrap()
        .then(() => {
          navigate('/dashboard');
        })
        .catch((error) => {
          console.error('Login failed:', error);
          navigate('/login');
        });
    }
  }, [searchParams, dispatch, navigate]);

  return <div>Logging you in...</div>;
}
```

### Getting Current User

```jsx
import { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { getUser } from './store/slices/authSlice';

function Dashboard() {
  const dispatch = useDispatch();
  const { user, isLoading } = useSelector((state) => state.auth);

  useEffect(() => {
    dispatch(getUser());
  }, [dispatch]);

  if (isLoading) return <div>Loading...</div>;

  return (
    <div>
      <h1>Welcome, {user?.username}</h1>
      <p>Email: {user?.email}</p>
    </div>
  );
}
```

### Logout

```jsx
import { useDispatch } from 'react-redux';
import { logout } from './store/slices/authSlice';

function LogoutButton() {
  const dispatch = useDispatch();

  const handleLogout = () => {
    dispatch(logout())
      .unwrap()
      .then(() => {
        // Redirect to login
      });
  };

  return <button onClick={handleLogout}>Logout</button>;
}
```

### Protected Routes

```jsx
import { useSelector } from 'react-redux';
import { Navigate } from 'react-router-dom';

function ProtectedRoute({ children }) {
  const { isAuthenticated } = useSelector((state) => state.auth);
  
  return isAuthenticated ? children : <Navigate to="/login" />;
}
```

## Environment Variables

Create a `.env` file in the Frontend directory:

```env
VITE_API_URL=http://localhost:8000/api/v1
```

## Authentication Storage

- User data is stored in `localStorage` for persistence
- Access tokens are stored in **httpOnly cookies** by the backend (more secure)
- Cookies are automatically sent with every request via `withCredentials: true`
- No manual token management needed on frontend

## Backend Requirements

Your backend must:
1. Validate college email addresses
2. Generate magic tokens and send emails
3. Set httpOnly cookies on successful login
4. Clear cookies on logout
5. Verify cookies on protected routes
