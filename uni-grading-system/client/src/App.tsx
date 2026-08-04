import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import { SessionProvider } from "./contexts/SessionContext";
import Home from "./pages/Home";
import Faculties from "./pages/Faculties";
import Departments from "./pages/Departments";
import Courses from "./pages/Courses";
import Students from "./pages/Students";
import GradeEntry from "./pages/GradeEntry";
import Reports from "./pages/Reports";

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider defaultTheme="light" switchable>
        <SessionProvider>
          <TooltipProvider>
            <Toaster
              position="top-right"
              richColors
              closeButton
            />
            <Router />
          </TooltipProvider>
        </SessionProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

function Router() {
  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/faculties" component={Faculties} />
      <Route path="/departments" component={Departments} />
      <Route path="/courses" component={Courses} />
      <Route path="/students" component={Students} />
      <Route path="/grades" component={GradeEntry} />
      <Route path="/reports" component={Reports} />
      <Route path="/404" component={NotFound} />
      <Route component={NotFound} />
    </Switch>
  );
}

export default App;
