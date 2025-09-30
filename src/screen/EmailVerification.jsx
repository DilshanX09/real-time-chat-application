import axios from 'axios';
import { useContext, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { useLocation, useNavigate } from 'react-router-dom';
import { ThemeContext } from '../context/ThemeContext';

const EmailVerify = () => {

     const Navigate = useNavigate();

     const location = useLocation();
     const searchParams = new URLSearchParams(location.search);
     const UUID = searchParams.get('uuid');

     const { theme } = useContext(ThemeContext);

     const fieldsRef = useRef();
     const [state, setState] = useState({ code1: "", code2: "", code3: "", code4: "" });
     const [err, setErr] = useState(false);
     const [serverResponse, setServerResponse] = useState('')

     const inputFocus = (e) => {
          const elements = fieldsRef.current.children
          const dataIndex = +e.target.getAttribute("data-index")
          if ((e.key === "Delete" || e.key === "Backspace")) {
               const next = dataIndex - 1;
               if (next > -1) {
                    elements[next].focus()
               }
          } else {

               const next = dataIndex + 1
               if (next < elements.length && e.target.value !== " " && e.target.value !== "" && e.key.length === 1) {
                    elements[next].focus()
               }
          }
     }


     const handleChange = (e, codeNumber) => {
          const value = e.target.value
          setState({ ...state, [codeNumber]: value.slice(value.length - 1) })
     }


     const handleClick = async (e) => {

          e.preventDefault();

          const code = state.code1 + state.code2 + state.code3 + state.code4;

          const userTypedCode = {
               uuid: UUID,
               code: code
          }

          try {
               const response = await axios.post('http://localhost:5000/api/v1/verify-otp', userTypedCode);
               if (response.data.response === 'success') {
                    setErr(false)
                    setServerResponse('Your are Verified!')
                    Navigate('/user/auth/v1/authenticate');
               } else {
                    setErr(true);
                    setServerResponse(response.data.error);
               }
          } catch (Exception) {
               setServerResponse('Something went wrong, please try again later.');
          }
     }

     if (UUID !== "") {
          Navigate('/');
     }

     return (

          <div className='bg-[#121212] h-screen flex justify-center items-center'>
               <div className='flex flex-col items-center md:justify-start justify-center'>
                    <h1 className='text-xl pt-3 pb-1 text-white SF-pro-bold text-center'>Please Verify Your Email Address to Continue</h1>
                    <span className='text-gray-400 text-sm'>Please Enter your OTP Code</span>
                    <div style={{ width: "350px" }}>

                         <div className='my-5 flex justify-evenly'>
                              <div ref={fieldsRef} className="mt-2 flex items-center gap-x-4">
                                   <input type="text" data-index="0" placeholder="0" value={state.code1} className={`w-12 h-12 rounded-lg bg-[#2b2b2b] text-white ${err ? 'border-red-500' : 'border-gray-300'} ${err && 'focus:border-red-600'}  outline-none text-center text-2xl`}
                                        onChange={(e) => handleChange(e, "code1")}
                                        onKeyUp={inputFocus}
                                   />
                                   <input type="text" data-index="1" placeholder="0" value={state.code2} className={`w-12 h-12 rounded-lg bg-[#2b2b2b]  text-white ${err ? 'border-red-500' : 'border-gray-300'} ${err && 'focus:border-red-600'} outline-none text-center text-2xl`}
                                        onChange={(e) => handleChange(e, "code2")}
                                        onKeyUp={inputFocus}
                                   />
                                   <input type="text" data-index="2" placeholder="0" value={state.code3} className={`w-12 h-12 rounded-lg bg-[#2b2b2b]  text-white ${err ? 'border-red-500' : 'border-gray-300'} ${err ? 'focus:border-red-600' : 'focus:border-black'} outline-none text-center text-2xl`}
                                        onChange={(e) => handleChange(e, "code3")}
                                        onKeyUp={inputFocus}
                                   />
                                   <input type="text" data-index="3" placeholder="0" value={state.code4} className={`w-12 h-12 rounded-lg bg-[#2b2b2b]  text-white ${err ? 'border-red-500' : 'border-gray-300'} ${err ? 'focus:border-red-600' : 'focus:border-black'} outline-none text-center text-2xl`}
                                        onChange={(e) => handleChange(e, "code4")}
                                        onKeyUp={inputFocus}
                                   />
                              </div>
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
                         <div className='my-3'>
                              <span className='text-sm px-2 text-gray-500'>Next Step Go to Press The Button</span>
                         </div>
                         <div className='grid'>
                              <button onClick={handleClick} className='bg-white py-4 rounded-lg text-black font-medium text-md'>Verify</button>
                         </div>
                    </div>
               </div>
          </div>
     )

}

export default EmailVerify;
