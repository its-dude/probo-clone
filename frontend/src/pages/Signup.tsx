import { Link } from "react-router-dom"

const Signup = () => {
    return <>
        <div className="min-h-screen flex items-center justify-center bg-(--neutral-100) px-4 sm:px-6 lg:px-8">

            <div className="w-full max-w-md bg-white rounded-2xl shadow-lg p-5 sm:p-6">

                <h1 className="text-center text-lg sm:text-xl font-semibold mb-5">
                    probo.
                </h1>

                <div className="text-center mb-6">
                    <h2 className="text-xl sm:text-2xl font-semibold text-(--neutral-900)">
                        Create your account
                    </h2>
                    <p className="text-sm text-(--neutral-500) mt-1">
                        Enter your details to get started
                    </p>
                </div>

                <form className="space-y-4">

                    <div>
                        <label className="text-sm font-medium text-(--neutral-900)">
                            Full Name
                        </label>
                        <input
                            type="text"
                            placeholder="John Doe"
                            className="w-full mt-1 px-3 py-2.5 rounded-lg border border-gray-300 
                 focus:outline-none focus:ring-2 focus:ring-(--primary-500) 
                 focus:border-(--primary-500) transition"
                        />
                    </div>

                    <div>
                        <label className="text-sm font-medium text-(--neutral-900)">
                            Email Address
                        </label>
                        <input
                            type="email"
                            placeholder="hello@example.com"
                            className="w-full mt-1 px-3 py-2.5 rounded-lg border border-gray-300 
                 focus:outline-none focus:ring-2 focus:ring-(--primary-500) 
                 focus:border-(--primary-500) transition"
                        />
                    </div>

                    <div>
                        <label className="text-sm font-medium text-(--neutral-900)">
                            Password
                        </label>
                        <input
                            type="password"
                            placeholder="••••••••"
                            className="w-full mt-1 px-3 py-2.5 rounded-lg border border-gray-300 
                 focus:outline-none focus:ring-2 focus:ring-(--primary-500) 
                 focus:border-(--primary-500) transition"
                        />
                    </div>

                    <div>
                        <label className="text-sm font-medium text-(--neutral-900)">
                            Confirm Password
                        </label>
                        <input
                            type="password"
                            placeholder="••••••••"
                            className="w-full mt-1 px-3 py-2.5 rounded-lg border border-gray-300 
                 focus:outline-none focus:ring-2 focus:ring-(--primary-500) 
                 focus:border-(--primary-500) transition"
                        />
                    </div>

                    <div className="flex items-start gap-2 text-sm">
                        <input
                            type="checkbox"
                            className="mt-1 accent-(--primary-500) cursor-pointer"
                        />
                        <span className="text-(--neutral-500) leading-tight">
                            I agree to the terms & conditions
                        </span>
                    </div>

                    <button
                        className="w-full bg-(--primary-500) text-white py-2.5 rounded-lg 
               hover:bg-(--primary-700) active:scale-[0.99] 
               transition font-medium"
                    >
                        Sign up
                    </button>

                    <p className="text-sm text-center text-(--neutral-500)">
                        Already have an account?
                        <Link to={"/login"} className="text-(--primary-500) hover:underline font-medium">
                            Log in
                        </Link>
                    </p>

                </form>
            </div>
        </div>
    </>
}

export default Signup