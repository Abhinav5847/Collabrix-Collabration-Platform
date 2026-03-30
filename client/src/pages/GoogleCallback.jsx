import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { api } from "../services/api";

const GoogleCallback = () => {
  const navigate = useNavigate();

  useEffect(() => {
    const code = new URLSearchParams(window.location.search).get("code");

    if (code) {
      api
        .post("/accounts/google_login/", { code })
        .then((res) => {
          localStorage.setItem("access", res.data.access);
          localStorage.setItem("refresh", res.data.refresh);

          toast.success("Logged in with Google!", {
            position: "top-right",
            autoClose: 3000,
          });

          setTimeout(() => navigate("/dashboard"), 1000);
        })
        .catch((err) => {
          console.error(err);
          toast.error("Google login failed!", {
            position: "top-right",
            autoClose: 5000,
          });
          navigate("/login");
        });
    }
  }, [navigate]);

  return (
    <div className="d-flex justify-content-center align-items-center vh-100">
      <h3>Logging in with Google...</h3>
      <ToastContainer />
    </div>
  );
};

export default GoogleCallback;