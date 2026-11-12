import type { ReactNode } from "react";
import { HashRouter, Navigate, Route, Routes } from "react-router-dom";
import { StoreProvider, useStore } from "./store/store";
import { ToastProvider } from "./components/toast";
import { Shell } from "./components/Shell";
import type { Role } from "./lib/types";
import { HomeAdmin } from "./pages/HomeAdmin";
import { HomeTeacher } from "./pages/HomeTeacher";
import { HomeStudent } from "./pages/HomeStudent";
import { Assignments } from "./pages/Assignments";
import { AssignmentDetail } from "./pages/AssignmentDetail";
import { NewAssignment } from "./pages/NewAssignment";
import { Review } from "./pages/Review";
import { StudentAssignment } from "./pages/StudentAssignment";
import { Progress } from "./pages/Progress";
import { Students } from "./pages/Students";
import { Teachers } from "./pages/Teachers";
import { Classes } from "./pages/Classes";
import { Courses } from "./pages/Courses";
import { Reports } from "./pages/Reports";
import { Notifications } from "./pages/Notifications";
import { Settings } from "./pages/Settings";
import { About } from "./pages/About";
import { Login } from "./pages/Login";
import { Landing } from "./pages/Landing";
import { Billing } from "./pages/Billing";
import { Store } from "./pages/Store";
import { MotionNotice, Splash } from "./components/fx";

function Home() {
  const { role } = useStore();
  return role === "admin" ? <HomeAdmin /> : role === "teacher" ? <HomeTeacher /> : <HomeStudent />;
}

function Gate({ allow, children }: { allow: Role[]; children: ReactNode }) {
  const { role } = useStore();
  return allow.includes(role) ? <>{children}</> : <Navigate to="/" replace />;
}

function AssignmentRoute() {
  const { role } = useStore();
  return role === "student" ? <StudentAssignment /> : <AssignmentDetail />;
}

const STAFF: Role[] = ["admin", "teacher"];

export default function App() {
  return (
    <StoreProvider>
      <ToastProvider>
        <Splash />
        <MotionNotice />
        <HashRouter>
          <Routes>
            <Route path="login" element={<Login />} />
            <Route path="welcome" element={<Landing />} />
            <Route element={<Shell />}>
              <Route index element={<Home />} />
              <Route path="assignments" element={<Gate allow={STAFF}><Assignments /></Gate>} />
              <Route path="assignments/new" element={<Gate allow={STAFF}><NewAssignment /></Gate>} />
              <Route path="assignments/:id" element={<AssignmentRoute />} />
              <Route path="review/:id" element={<Gate allow={STAFF}><Review /></Gate>} />
              <Route path="students" element={<Gate allow={STAFF}><Students /></Gate>} />
              <Route path="teachers" element={<Gate allow={["admin"]}><Teachers /></Gate>} />
              <Route path="classes" element={<Classes />} />
              <Route path="courses" element={<Gate allow={["admin"]}><Courses /></Gate>} />
              <Route path="reports" element={<Gate allow={["admin"]}><Reports /></Gate>} />
              <Route path="progress" element={<Gate allow={["student"]}><Progress /></Gate>} />
              <Route path="notifications" element={<Notifications />} />
              <Route path="settings" element={<Gate allow={["admin"]}><Settings /></Gate>} />
              <Route path="billing" element={<Gate allow={["admin"]}><Billing /></Gate>} />
              <Route path="store" element={<Gate allow={["admin"]}><Store /></Gate>} />
              <Route path="about" element={<About />} />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Route>
          </Routes>
        </HashRouter>
      </ToastProvider>
    </StoreProvider>
  );
}
