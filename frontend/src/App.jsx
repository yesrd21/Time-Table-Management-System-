import React, { useState } from "react";

export default function TimetableApp() {
  const [currentView, setCurrentView] = useState("login");
  const [userData, setUserData] = useState(null);

  // --- LOGIN HANDLERS ---
  const handleAdminLogin = (e) => {
    e.preventDefault();
    setCurrentView("admin");
  };

  const handleTeacherLogin = (e) => {
    e.preventDefault();
    const teacherId = e.target.teacherId.value;
    setUserData({ id: teacherId });
    setCurrentView("teacher");
  };

  const handleStudentLogin = (e) => {
    e.preventDefault();
    const rollNo = e.target.rollNo.value;
    const studentClass = e.target.studentClass.value;
    setUserData({ rollNo, class: studentClass });
    setCurrentView("student");
  };

  const logout = () => {
    setCurrentView("login");
    setUserData(null);
  };

  // --- REUSABLE CENTERED STYLE ---
  // This forces everything inside the view to stack neatly in the center
  const viewStyle = {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    padding: "30px",
    border: "2px solid #ddd",
    borderRadius: "8px",
    maxWidth: "600px",
    margin: "40px auto", // 'auto' pushes it to the center of the page horizontally
    backgroundColor: "#f9f9f9",
  };

  // --- VIEWS ---
  const AdminView = () => (
    <div style={viewStyle}>
      <h2>Admin Dashboard</h2>
      <p>Welcome, Admin. You have full edit access.</p>
      <div style={{ display: "flex", gap: "10px", marginBottom: "20px" }}>
        <button>Generate New Timetable</button>
        <button>Edit Existing Timetable</button>
      </div>
      <button onClick={logout} style={{ marginTop: "20px" }}>
        Logout
      </button>
    </div>
  );

  const TeacherView = () => (
    <div style={viewStyle}>
      <h2>Teacher Timetable</h2>
      <p>
        Showing schedule for Teacher ID: <strong>{userData?.id}</strong>
      </p>

      {/* Table centered automatically by the flex container */}
      <table
        border="1"
        cellPadding="15"
        style={{ borderCollapse: "collapse", backgroundColor: "#fff" }}>
        <tbody>
          <tr>
            <th>Time</th>
            <th>Monday</th>
            <th>Tuesday</th>
          </tr>
          <tr>
            <td>09:00 AM</td>
            <td>Math (Room 101)</td>
            <td>Physics (Room 102)</td>
          </tr>
        </tbody>
      </table>

      <button onClick={logout} style={{ marginTop: "20px" }}>
        Logout
      </button>
    </div>
  );

  const StudentView = () => (
    <div style={viewStyle}>
      <h2>Student Timetable</h2>
      <p>
        Showing schedule for Class: <strong>{userData?.class}</strong> | Roll
        No: <strong>{userData?.rollNo}</strong>
      </p>

      <table
        border="1"
        cellPadding="15"
        style={{ borderCollapse: "collapse", backgroundColor: "#fff" }}>
        <tbody>
          <tr>
            <th>Time</th>
            <th>Monday</th>
            <th>Tuesday</th>
          </tr>
          <tr>
            <td>09:00 AM</td>
            <td>English</td>
            <td>Chemistry</td>
          </tr>
        </tbody>
      </table>

      <button onClick={logout} style={{ marginTop: "20px" }}>
        Logout
      </button>
    </div>
  );

  // --- LOGIN PORTAL ---
  const LoginPortal = () => (
    <div
      style={{
        maxWidth: "900px", // limit width
        margin: "50px auto", // center horizontally
        display: "flex",
        flexWrap: "wrap",
        gap: "20px",
        justifyContent: "center",
      }}>
      <div
        style={{
          padding: "30px",
          border: "1px solid #ccc",
          borderRadius: "8px",
          textAlign: "center",
        }}>
        <h3>Admin Login</h3>
        <form
          onSubmit={handleAdminLogin}
          style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
          <input type="text" placeholder="Admin Username" required />
          <input type="password" placeholder="Password" required />
          <button type="submit">Login</button>
        </form>
      </div>

      <div
        style={{
          padding: "30px",
          border: "1px solid #ccc",
          borderRadius: "8px",
          textAlign: "center",
        }}>
        <h3>Teacher Access</h3>
        <form
          onSubmit={handleTeacherLogin}
          style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
          <input
            type="text"
            name="teacherId"
            placeholder="Teacher ID"
            required
          />
          <button type="submit">View Timetable</button>
        </form>
      </div>

      <div
        style={{
          padding: "30px",
          border: "1px solid #ccc",
          borderRadius: "8px",
          textAlign: "center",
        }}>
        <h3>Student Access</h3>
        <form
          onSubmit={handleStudentLogin}
          style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
          <input type="text" name="rollNo" placeholder="Roll Number" required />
          <input
            type="text"
            name="studentClass"
            placeholder="Class/Section"
            required
          />
          <button type="submit">View Timetable</button>
        </form>
      </div>
    </div>
  );


 
  return (
    <div
      style={{
        fontFamily: "sans-serif",
        minHeight: "100vh", // full screen height
        width: "100%", // full width
        display: "flex",
        justifyContent: "center", // horizontal center
        alignItems: "center", // vertical center
        padding: "20px",
        boxSizing: "border-box",
      }}>
      <div
        style={{
          width: "100%",
          maxWidth: "1000px",
          textAlign: "center",
        }}>
        <h1 style={{ marginBottom: "30px" }}>Timetable Management System</h1>

        {currentView === "login" && <LoginPortal />}
        {currentView === "admin" && <AdminView />}
        {currentView === "teacher" && <TeacherView />}
        {currentView === "student" && <StudentView />}
      </div>
    </div>
  );

}
