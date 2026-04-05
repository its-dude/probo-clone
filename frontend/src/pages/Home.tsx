import { Navigate } from "react-router-dom"

const Home = ({isLogin}: {isLogin:boolean}) => {
    if (!isLogin) {
        return <Navigate to={"/login"} replace />
    }

    return <div>home</div>
}

export default Home