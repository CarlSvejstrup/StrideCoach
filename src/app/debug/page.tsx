'use client'

import { useState } from 'react'

export default function DebugPage() {
    const [count, setCount] = useState(0)

    return (
        <div className="p-10 flex flex-col gap-4">
            <h1 className="text-2xl font-bold">Debug Page</h1>
            <p>Count: {count}</p>
            <button
                className="bg-blue-500 text-white p-2 rounded"
                onClick={() => {
                    console.log("Debug button clicked")
                    setCount(c => c + 1)
                }}
            >
                Increment
            </button>
            <form onSubmit={(e) => {
                e.preventDefault()
                alert("Form submitted!")
            }}>
                <input className="border p-2" placeholder="Type here" />
                <button type="submit" className="bg-green-500 text-white p-2 rounded">Submit</button>
            </form>
        </div>
    )
}
