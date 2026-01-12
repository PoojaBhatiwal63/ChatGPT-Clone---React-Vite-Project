import React, { createContext, useState } from 'react'
import run from '../gemini'
export const dataContext=createContext()

function UserContext({children}) {
const [input,setInput]=useState("")
const [showResult,setShowResult]=useState(false)
const [loading,setLoading]=useState(false)
const [resultData,setResultData]=useState("")
const [recentPrompt,setRecentPrompt]=useState("")
const [prevPrompt,setPrevPrompt]=useState([])

function newChat(){
    setShowResult(false)
    setLoading(false)
}

async function sent(input){
 setResultData("")
    setShowResult(true)
    setRecentPrompt(input)
    setLoading(true)
    setPrevPrompt(prev=>[...prev,input])
  try {
    const response = await run(input);
    // Ensure resultData is a displayable string or array
    const display = typeof response === 'string' ? response : JSON.stringify(response);
    setResultData(display);
  } catch (err) {
    const msg = err?.message || String(err);
    setResultData(`Error: ${msg}`);
  } finally {
    setLoading(false);
    setInput("");
  }
}
 const data={
input,
setInput,   
sent,
loading,
setLoading,
showResult,
setShowResult,
resultData,
setResultData,
recentPrompt,
setRecentPrompt,
prevPrompt,
newChat
    }
  return (
    <>
    <dataContext.Provider value={data}>
     {children}
     </dataContext.Provider>
    </>
  )
}

export default UserContext
