import { Routes, Route } from "react-router-dom";
import Navbar from "./components/Navbar";
import Home from "./pages/Home";
import Login from "./pages/Login";
import Admin from "./pages/Admin";
import ClientForm from "./pages/ClientForm";
import ProtectedRoute from "./components/ProtectedRoute";
import Servicios from "./pages/Servicios";
import Acerca from "./pages/Acerca";
import Publicaciones from "./pages/Publicaciones";

function App() {
  return (
    <div>
      <Navbar />
      <Routes>
        {/* PUBLICAS */}
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} />
        <Route path="/servicios" element={<Servicios />} />
        <Route path="/acerca" element={<Acerca />} />
        <Route path="/publicaciones" element={<Publicaciones />} />
        <Route path="/formulario/:token" element={<ClientForm />} />
        {/* PRIVADAS */}
        <Route path="/admin" element={
          <ProtectedRoute><Admin /></ProtectedRoute>
        } />
      </Routes>
    </div>
  );
}

export default App;