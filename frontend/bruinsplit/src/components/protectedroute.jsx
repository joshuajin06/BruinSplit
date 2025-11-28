import { Navigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext.jsx'

function ProtectedRoute({children}) {
  const { loading, isAuthenticated } = useAuth();

  if(loading) {
    return <div>Loading...</div>;
  }

  console.log("Authenticated: " + isAuthenticated);

  if(!isAuthenticated) {
    return <Navigate to="/login" replace/>
  }

  return children;
}

export default ProtectedRoute;