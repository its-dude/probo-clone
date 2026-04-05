import { Routes, Route } from "react-router-dom";
import Home from "./pages/Home";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import { useState } from "react";

function App() {
  const [isLogin, setIsLogin] = useState(false)
  return (
    <Routes>
      <Route path="/" element={<Home isLogin={isLogin} />} />
      <Route path="/login" element={<Login setIsLogin={setIsLogin}/>} />
      <Route path="/signup" element={<Signup />} />
    </Routes>
  );
}

export default App;