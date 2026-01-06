import "./App.css";
import heroImg from "./assets/mental-health.png";
import { signInWithGoogle } from "./auth"; // ✅ correct import

export default function App() {
  const handleGoogleLogin = async () => {
    try {
      const user = await signInWithGoogle();
      alert(`Welcome, ${user.displayName || user.email}`);
      console.log("Logged in user:", user);
    } catch (err) {
      console.error(err);
      alert("Google Login Failed");
    }
  };

  return (
    <div className="page">
      {/* NAVBAR */}
      <header className="nav">
        <div className="navBrand">
          <span className="brandIcon">✓</span>
          <span className="brandText">CheckIn</span>
        </div>

        <nav className="navLinks">
          <a className="navLink" href="#home">Home</a>
          <a className="navLink" href="#dashboard">Dashboard</a>
          <a className="navLink" href="#appointment">Appointment</a>
          <a className="navLink" href="#phq">PHQ-9</a>
        </nav>

        <div className="navBtns">
          <button className="navLoginBtn">Login</button>
          <button className="navSignBtn">Sign-up</button>
        </div>
      </header>

      {/* CONTENT */}
      <main className="content">
        {/* LEFT LOGIN */}
        <section className="loginBox">
          <h1 className="welcomeTitle">WELCOME</h1>
          <p className="welcomeSub">Welcome. Please enter your details.</p>

          <div className="form">
            <label className="label">Email</label>
            <input className="input" type="email" placeholder="Enter your email" />

            <label className="label">Password</label>
            <input className="input" type="password" placeholder="********" />

            <div className="row">
              <label className="remember">
                <input type="checkbox" />
                <span>Remember me</span>
              </label>

              <a className="forgot" href="#forgot">Forgot password</a>
            </div>

            <button className="btnLogin">Login</button>

            {/* ✅ REAL GOOGLE LOGIN (Firebase) */}
            <button className="btnGoogle" onClick={handleGoogleLogin}>
              <span className="gIcon">G</span>
              <span>Login with Google</span>
            </button>

            <p className="bottom">
              Don't have an account? <a href="#signup">Sign up for free!</a>
            </p>
          </div>
        </section>

        {/* RIGHT IMAGE */}
        <section className="hero">
          <img className="heroImg" src={heroImg} alt="Mental Health" />
        </section>
      </main>
    </div>
  );
}
