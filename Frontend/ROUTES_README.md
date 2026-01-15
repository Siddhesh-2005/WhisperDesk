# Protected Routes Setup

This directory contains route protection components for authentication-based navigation.

## Components

### ProtectedRoute
Located at `src/components/ProtectedRoute.jsx`

Wraps routes that require authentication. If user is not authenticated, redirects to `/login` and saves the original location.

```jsx
<Route 
  path="/dashboard" 
  element={
    <ProtectedRoute>
      <DashboardPage />
    </ProtectedRoute>
  } 
/>
```

### PublicRoute
Located at `src/components/PublicRoute.jsx`

Wraps routes that should only be accessible when NOT authenticated (like login page). If user is already authenticated, redirects to `/dashboard`.

```jsx
<Route 
  path="/login" 
  element={
    <PublicRoute>
      <LoginPage />
    </PublicRoute>
  } 
/>
```

## Usage

### Install React Router (if not already installed)

```bash
npm install react-router-dom
```

### Import Routes in App.jsx

```jsx
import AppRoutes from './routes/AppRoutes';

function App() {
  return <AppRoutes />;
}

export default App;
```

### Example Route Structure

See `src/routes/AppRoutes.jsx` for a complete example with:
- Public routes (accessible to everyone)
- Public-only routes (redirect if authenticated)
- Protected routes (require authentication)

### Features

- **Automatic redirect**: Unauthenticated users redirected to `/login`
- **Return to original location**: After login, users return to the page they tried to access
- **Loading state**: Shows loading indicator while checking authentication
- **Clean separation**: Public and protected routes clearly distinguished

### Creating Protected Pages

Any page that requires authentication:

```jsx
// pages/MyPostsPage.jsx
import { useSelector } from 'react-redux';

function MyPostsPage() {
  const { user } = useSelector((state) => state.auth);
  
  return (
    <div>
      <h1>My Posts - {user?.username}</h1>
      {/* Your content */}
    </div>
  );
}
```

Then wrap it in `ProtectedRoute` in your routes file:

```jsx
<Route 
  path="/my-posts" 
  element={
    <ProtectedRoute>
      <MyPostsPage />
    </ProtectedRoute>
  } 
/>
```
