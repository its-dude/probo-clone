import { Link } from "react-router-dom"

export function FormBottomWarning({message, buttonText, to}: {message:string, buttonText: string, to: string}) {
    return <div className="text-sm font-semibold text-center mt-5">
        <span className="text-neutral-400 ">{message}</span>
            <Link className="underline cursor-pointer pl-1 text-black-500 hover:text-black-800" to={to}>
             {buttonText}
            </Link>
    </div>
}