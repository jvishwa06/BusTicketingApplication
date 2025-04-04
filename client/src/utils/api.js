import api from "../utils/api";  
import { useEffect, useState } from "react";

const UserProfile = () => {
  const [user, setUser] = useState(null);

  useEffect(() => {
    api.get("/users/profile")  
      .then(response => setUser(response.data))
      .catch(error => console.error("Error fetching profile:", error));
  }, []);

  return user ? <div>Welcome, {user.name}!</div> : <div>Loading...</div>;
};

export default UserProfile;
