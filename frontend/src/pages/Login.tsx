import { Input } from "../components/Input"
import { AddUser } from "../icons/addUser"
import { FormBottomWarning } from "../components/FormBottomWarning"
import axios from "axios"
import { useNavigate } from "react-router-dom"
import { useState } from "react"


const Login = ({setIsLogin} : {setIsLogin: (t:boolean)=>void}) => {
    const navigate  = useNavigate()
    const [email, setEmail] = useState("")
    const [password, setPassword] = useState("")

    const handleOnClick = async () => {
        try {
            if (email !== "" && password !== "") {
                const response = await axios.post("http://localhost:7803/api/v1/auth/signin", {
                    email,
                    password
                });

                if (response.status === 200) {
                    localStorage.setItem('token', `Bearer ${response.data.token}`);
                    setIsLogin(true);
                    navigate("/dashboard");
                } else {
                    alert(response.data.message);
                }
            } else {
                alert("input box is empty");
            }

        } catch (err) {
            console.log(err);
        }

    }
return (
  <div className="min-h-screen w-full bg-neutral-50 px-4 py-6">
    
    {/* Header */}
    <div className="flex justify-between items-center max-w-6xl mx-auto">
      <div className="text-2xl sm:text-3xl font-semibold">probi.</div>

      <button onClick={()=>navigate("/signup")} className="bg-blue-500 hover:bg-blue-600 px-3 py-1.5 sm:px-4 sm:py-2 text-sm sm:text-base text-white tracking-wide rounded-md cursor-pointer">
        signup
      </button>
    </div>

    {/* Container */}
    <div className="max-w-md sm:max-w-xl lg:max-w-2xl mx-auto mt-10 sm:mt-14">
      
      {/* Form Header */}
      <div className="flex flex-col items-center text-center">
        <div className="p-3 sm:p-4 rounded-2xl border border-gray-300 bg-white">
          <AddUser />
        </div>

        <div className="mt-4 font-semibold text-2xl sm:text-3xl">
          Login
        </div>

        <div className="text-sm sm:text-base text-neutral-400">
          Welcome back, please enter your details
        </div>
      </div>

      {/* Form */}
      <div className="w-full max-w-xs sm:max-w-md mx-auto flex flex-col gap-5 sm:gap-6 mt-8 sm:mt-10">
        
        <Input
          onChange={(e) => setEmail(e.target.value)}
          label="Email Address"
          name="email"
          placeholder="hello@email.com"
        />

        <Input
          onChange={(e) => setPassword(e.target.value)}
          label="Password"
          name="password"
          placeholder="hello@123"
        />

        <button
          onClick={handleOnClick}
          className="bg-blue-500 hover:bg-blue-600 py-2 px-4 rounded-md text-white cursor-pointer active:scale-95 transition"
        >
          Log in
        </button>

        <FormBottomWarning
          message={"Not registered yet?"}
          buttonText={"Create an account"}
          to={"/signup"}
        />
      </div>
    </div>
  </div>
);
}


export default Login