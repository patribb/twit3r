import { useState } from "react"
import { object, string } from "zod";
import { trpc } from "../utils/trpc";

export const tweetSchema = object({
    text: string({required_error: 'Tweet text is required'}).min(10).max(280)
})

export const CreateTweet = () => {
    const [text, setText] = useState('');
    const [error, setError] = useState('');
    const utils = trpc.useContext();

    const {mutateAsync} = trpc.tweet.create.useMutation({
        onSuccess: () => {
          setText('');
          utils.tweet.invalidate()
        }
    })

    const handleSubmit = async(e: { preventDefault: () => void }) => {
        e.preventDefault();
        try {
            await tweetSchema.parse({text})
            setText('')
        } catch (err) {
            setError(err.message)
            return
        }
        mutateAsync({text});
    }

  return (
    <>
    <form onSubmit={handleSubmit} className='flex w-full flex-col border-2 p-4 rounded-md mb-4'>
        <textarea
         className="outline-none shadow p-4 w-full text-gray-600 font-extralight text-sm"
         onChange={(e) => setText(e.target.value)} />
        <div className="mt-4 flex justify-end">
            <button className="bg-sky-500 text-sm hover:bg-sky-400 transition duration-200 text-white px-4 py-2 rounded-xl" type="submit">Twe3t</button>
        </div>
    </form>
    {error && <div className="error">{error}</div>}
    </>
  )
}