import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { Toaster } from "./components/ui/toaster";
import NotFound from "./pages/NotFound";
import WelcomePage from "./pages/WelcomePage";
import { ThemeProvider } from "./providers/theme-provider";
import { Dashboard } from "./pages/Dashboard";
import AuthPage from "./pages/AuthPage";
import DatabaseForm from "./pages/Database";
import ForecastsPage from "./pages/ForecastPage";
import NotificationsPage from "./pages/NotificationsPage";
import { ReportProvider } from "./ReportContext";
import { useEffect } from "react";
import { connectSocket } from "./socket";



function App() {

useEffect(() => {
  const token = localStorage.getItem("token");
  if (token) {
    console.log("Connecting socket with token:", token);
    connectSocket(token);
  }
}, []);
  return (
    <ThemeProvider defaultTheme="light">
        <div className="min-h-screen bg-background">
          <Router>
       
            <ReportProvider>
            
              <Routes>
              
                <Route path="/" element={<WelcomePage />} />
                <Route path="/home" element={<Dashboard />} />
                <Route path="/login" element={<AuthPage isLogin={true} />} />
                <Route path="/signup" element={<AuthPage isLogin={false} />} />
                <Route path="/database" element={<DatabaseForm />} />
                <Route path="/forecasts" element={<ForecastsPage />} />
                <Route path="/notifications" element={<NotificationsPage />} />
                <Route path="*" element={<NotFound />} />
             
              </Routes>
             
            </ReportProvider>

          </Router>
          <Toaster />
        </div>
    </ThemeProvider>
  );
}

export default App;

