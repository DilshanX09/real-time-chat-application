import { IoMailOutline } from "react-icons/io5";
import { RiLockPasswordLine } from "react-icons/ri";
import { useContext, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom';
import { MdAlternateEmail, MdOutlineLightMode, MdOutlineNightlight } from "react-icons/md";
import { FaRegEye, FaRegEyeSlash } from "react-icons/fa6";
import axios from 'axios';
import { ThemeContext } from "../context/ThemeContext";
import { motion } from 'framer-motion';

const EmailRegister = () => {

     const Navigate = useNavigate();

     const [email, setEmail] = useState('');
     const [password, setPassword] = useState('');
     const [username, setUsername] = useState('');
     const [showPassword, setShowPassword] = useState(false);

     const [err, setErr] = useState(false);
     const [serverResponse, setServerResponse] = useState('');

     const { theme, toggleTheme } = useContext(ThemeContext);


     const togglePasswordVisibility = () => {
          setShowPassword(!showPassword);
     };

     const handleSubmit = async (e) => {
          e.preventDefault();

          try {

               const response = await axios.post('http://localhost:5000/api/v1/send-email', { email, password, username });

               if (response.data.response === 'success') {
                    setErr(false);
                    setServerResponse('Your OTP Code Send Successfully');
                    Navigate(`/user/auth/v1/verify?uuid=${response.data.uuid}`);
               } else {
                    setErr(true)
                    setServerResponse(response.data);
               }

          } catch (Exception) {
               setServerResponse('Something went wrong, please try again later.');
          }

     }

     return (
          <>
               <div className={`${theme === 'light' ? 'bg-white' : 'bg-[#121212]'} h-screen flex justify-center items-center`}>

                    <div onClick={toggleTheme} className={`fixed right-5 top-5 bg-[#2b2b2b] ${theme === 'light' ? 'bg-gray-100 hover:bg-gray-200' : 'bg-[#2b2b2b] hover:bg-[#1f1f1f]'} p-2 rounded-full cursor-pointer  transition-all duration-300 ease-in-out`}>
                         {theme === 'light' ? <MdOutlineNightlight className='text-[#2b2b2b] text-2xl' /> : <MdOutlineLightMode className='text-white text-2xl' />}
                    </div>

                    {
                         serverResponse && (
                              <motion.div
                                   initial={{ opacity: 0, scale: 0.95 }}
                                   animate={{ opacity: 1, scale: 1 }}
                                   exit={{ opacity: 0, scale: 0.95 }}
                                   className="fixed right-5 bottom-5 text-gray-500 cursor-pointer">
                                   <span className={`${theme == 'light' ? 'text-gray-700 bg-gray-200' : 'text-white bg-[#2b2b2b] '} px-3 py-2 SF-pro-regular text-sm rounded-md`} >
                                        {serverResponse}
                                   </span>
                              </motion.div>
                         )
                    }

                    <div className='flex flex-col items-center md:justify-start'>
                         <h1 className={`text-xl pt-3 pb-1 ${theme === 'light' ? 'text-[#121212]' : 'text-white'} w-3/5 SF-pro text-center`}>Start chatting instantly – enter your email to register, connect with friends, and enjoy real-time messaging, media sharing, and more. Quick, secure, and free – join the conversation now!</h1>
                         <span className={`${theme === 'light' ? 'text-gray-600' : 'text-gray-400'} text-[13px] font-medium SF-pro- mt-10`}>Please Enter your Valid Username , Email & Password</span>
                         <div style={{ width: "350px" }}>
                              <div id="input" className={`mt-4 relative flex flex-col items-end px-1 py-3 rounded-lg ${theme === 'light' ? 'text-[#121212] bg-gray-200' : 'text-white bg-[#2b2b2b]'}  ${err ? 'border-red-500' : 'border-gray-300'} outline-none appearance-none`}>
                                   <input type="email" onChange={(e) => { setUsername(e.target.value) }} className={`w-5/6 SF-pro-regular font-medium outline-none border-none bg-transparent ${theme === 'light' ? 'text-gray-700 placeholder:text-gray-600' : null} `} placeholder='Username' />
                                   <MdAlternateEmail className={`w-5 h-5 font-medium absolute left-5 top-[14px] ${theme === 'light' ? 'text-gray-700' : 'text-gray-400'} `} />
                              </div>
                              <div id="input" className={`mt-2 relative flex flex-col items-end px-1 py-3 rounded-lg ${theme === 'light' ? 'text-[#121212] bg-gray-200' : 'text-white bg-[#2b2b2b]'}  ${err ? 'border-red-500' : 'border-gray-300'} outline-none appearance-none`}>
                                   <input type="email" onChange={(e) => { setEmail(e.target.value) }} className={`w-5/6 SF-pro-regular font-medium outline-none border-none bg-transparent ${theme === 'light' ? 'text-gray-700 placeholder:text-gray-600' : null} `} placeholder='Email Address' />
                                   <IoMailOutline className={`w-5 h-5 font-medium absolute left-5 top-[14px] ${theme === 'light' ? 'text-gray-700' : 'text-gray-400'} `} />
                              </div>

                              <div id="input" className={`mt-2 relative flex flex-col items-end px-1 py-3 rounded-lg ${theme === 'light' ? 'text-[#121212] bg-gray-200' : 'text-white bg-[#2b2b2b]'}  ${err ? 'border-red-500' : 'border-gray-300'} outline-none appearance-none`}>
                                   <input type={showPassword ? "text" : "password"} onChange={(e) => { setPassword(e.target.value) }} className={`w-5/6 SF-pro-regular font-medium outline-none border-none bg-transparent ${theme === 'light' ? 'text-gray-700 placeholder:text-gray-600' : null} `} placeholder='Password' />
                                   <RiLockPasswordLine className={`w-5 h-5 font-medium absolute left-5 top-[14px] ${theme === 'light' ? 'text-gray-700' : 'text-gray-400'} `} />
                                   <span
                                        onClick={togglePasswordVisibility}
                                        style={{
                                             position: 'absolute',
                                             right: '17px',
                                             top: '50%',
                                             transform: 'translateY(-50%)',
                                             cursor: 'pointer'
                                        }}
                                   >
                                        {showPassword ? <FaRegEyeSlash /> : <FaRegEye />}
                                   </span>
                              </div>

                              <div className='grid pt-3'>
                                   <button onClick={handleSubmit} className={`${theme === 'light' ? 'bg-[#121212] text-white' : 'bg-white text-black '} py-3 rounded-lg font-medium text-md`}>Next</button>
                              </div>

                              <div className="pt-3">
                                   <span className={`${theme === 'light' ? 'text-slate-700' : 'text-slate-400'} text-sm font-medium SF-pro-regular`}>
                                        Already have an account ? <Link to='/user/auth/v1/authenticate'> <span className={`${theme === 'light' ? 'text-[#121212]' : 'text-white'} underline font-medium`}>Log in</span> </Link>
                                   </span>
                              </div>
                         </div>
                    </div>
               </div>
          </>
     );

}

export default EmailRegister;
