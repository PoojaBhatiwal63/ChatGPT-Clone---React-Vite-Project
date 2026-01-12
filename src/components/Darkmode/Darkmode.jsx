import React, { useEffect, useState } from 'react'
import { MdOutlineWbSunny } from "react-icons/md"
import { LuMoon } from "react-icons/lu";
import "./Darkmode.css"
function Darkmode() {
  const [mode,setMode]=useState("darkmode")
  function toggle(){
    if(mode==="darkmode"){
      setMode("lightmode")
    }else{
      setMode("darkmode")
    }
  }
  useEffect(()=>{
document.body.className=mode
  },[mode])
  return (
    <button className="darkmodebtn" onClick={()=>{
      toggle()
      console.log(mode);
      
    }}>{mode==="darkmode"?<MdOutlineWbSunny />:<LuMoon />}</button>
  )
}

export default Darkmode
