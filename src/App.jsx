import { useContext } from "react"
import ChatSection from "./components/chatSection/ChatSection"
import Seperation from "./components/seperation/Seperation"
import Sidebar from "./components/Sidebar/Sidebar"
import { dataContext } from "./context/UserContext"

function App() {
return (
    <>
      <Sidebar/>
      <Seperation/>
      <ChatSection/>
    </>
  )
}

export default App
