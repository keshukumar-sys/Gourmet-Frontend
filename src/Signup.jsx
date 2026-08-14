import { useState } from "react";
import { NavLink } from "react-router-dom";
import { useNavigate } from "react-router-dom"
import "./Signup.css";

export default function SignUp() {

  const navigate = useNavigate()
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const submitForm = (e) => {
    e.preventDefault();
    

    if(name==="" || email==="" || password===""){
        alert("Fill the Empty Fields")
    }

    fetch("/signup", {
        method:"POST",
        headers:{
            "Content-Type":"application/json"
        },
        body:JSON.stringify({
            name:name,
            email:email,
            password:password
        })
    })
    .then(res=>res.json())
    .then(data=>{
        
        //if(data === "Login Successfully")
        //data = message stored in data in by using node.js code eg: res.send("Login Successfully") 

if(data.token){ //Doubt
    alert("SignUp Successfull") 
    sessionStorage.setItem("token", data.token)
    navigate("/booking")

    setTimeout(() => {

        sessionStorage.removeItem("token")

        alert("Session Expired. Please Login")

        navigate("/")

    }, 120000)
    
    // setEmail("");
    // setPassword("");
}
else{
    alert(data.message)
}
})
    .catch(err=>console.log(err))
    setName("");
    setEmail("");
    setPassword("");
  }

  

  return (
    <div className="signup-container">

      <div className="signup-card">

        {/* LEFT SIDE */}
        <div className="form-section">
          <h1>Hello there.</h1>
          <p>You need an account to continue.</p>

          <form onSubmit={submitForm}>
            <input
              type="text"
              placeholder="Full Name"
              value={name}
              required="true"
              onChange={(e)=>setName(e.target.value)}
            />

            <input
              type="email"
              placeholder="Email"
              value={email}
              required="true"
              onChange={(e)=>setEmail(e.target.value)}
            />

            <input
              type="password"
              placeholder="Password"
              value={password}
              required="true"
              onChange={(e)=>setPassword(e.target.value)}
            />

            <button type="submit">Sign Up</button>
          </form>

          <NavLink to="/" className="login-link">
            I already have an account
          </NavLink>

          
            
          
        </div>

      </div>

    </div>
  );
}