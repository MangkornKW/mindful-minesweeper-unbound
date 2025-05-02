
import { useNavigate } from "react-router-dom";
import { useEffect } from "react";

const Index = () => {
  const navigate = useNavigate();
  
  // Automatically redirect to the main menu
  useEffect(() => {
    navigate("/");
  }, [navigate]);
  
  return (
    <div className="min-h-screen flex items-center justify-center">
      <p>Loading...</p>
    </div>
  );
};

export default Index;
