import { signIn, signOut, useSession } from "next-auth/react"
import { Container } from "./Container"

export const LoggedOutBanner = () => {
    const { data: session } = useSession()

    if(session) {
        return null;
    }

  return (
    <div className="bg-sky-600 fixed bottom-0 w-full p-4">
        <Container classNames="bg-transparent flex justify-between items-center">
        <p className="text-white font-light text-sm">Do not miss out</p>
        <div>
            <button className="text-white shadow-md px-4 py-2 bg-sky-500 rounded-lg text-sm hover:bg-sky-400 transition duration-200" onClick={() => signIn('discord')}>Login</button>
        </div>
        </Container>
    </div>
  )
}