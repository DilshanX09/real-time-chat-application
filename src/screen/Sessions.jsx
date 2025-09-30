import React, { useContext, useEffect } from "react";
import { ThemeContext } from "../context/ThemeContext";
import { IoArrowBackCircleOutline } from "react-icons/io5";
import { useNavigate } from "react-router-dom";
import { formatLastSeenSriLanka } from "../methods/FormatedDate";
import { MdOutlineEmail, MdOutlineLightMode, MdOutlineNightlight, MdRefresh } from "react-icons/md";

import axios from "axios";
import Cookie from 'js-cookie';

export default function SessionData() {

     const Navigate = useNavigate();

     const [sessionData, setSessionData] = React.useState(null);
     const [loading, setLoading] = React.useState(true);
     const [user, setUser] = React.useState(null);
     const { theme, toggleTheme } = useContext(ThemeContext);
     const [twoFactorEnabled, setTwoFactorEnabled] = React.useState(false);

     const fetchSessionData = async (user) => {
          try {
               const response = await axios.post(`http://localhost:5000/api/v1/user/sessions`, { userId: user });
               setLoading(false);
               setSessionData(response.data.sessions);
          } catch (error) {
               console.error('Failed to fetch session data:', error);
          }
     };

     useEffect(() => {

          const userId = Cookie.get('UUID');

          if (!userId) Navigate('/');

          const fetch2FAStatus = async (user) => {
               try {
                    const response = await axios.post(`http://localhost:5000/api/v1/user/2FA-status`, { userId: user });
                    if (response.data.status === 1) {
                         setTwoFactorEnabled(true);
                    } else {
                         setTwoFactorEnabled(false);
                    }
               } catch (Exception) {
                    console.error('Failed to fetch 2FA status:', Exception);
               }
          };

          fetchSessionData(userId);
          fetch2FAStatus(userId);
          setUser(userId);

     }, []);

     const handle2FA = async (e) => {
          const checked = e.target.checked;
          setTwoFactorEnabled(checked);
          await axios.post(`http://localhost:5000/api/v1/user/2FA-Handle`, { id: user, status: checked ? true : false });
     };


     if (loading) {
          return <div className={`text-center ${theme === 'light' ? 'text-black' : 'text-white'}`}>Loading session data...</div>;
     }

     return (
          <>
               <div className={`${theme === 'light' ? 'bg-white' : 'bg-[#121212]'} h-screen relative`}>
                    <div className="space-y-5 md:mx-10 lg:mx-20 sm:mx-10 xl:mx-40 px-5 pt-8">

                         <div onClick={toggleTheme} className={`fixed right-5 top-5 bg-[#2b2b2b] ${theme === 'light' ? 'bg-gray-100 hover:bg-gray-200' : 'bg-[#2b2b2b] hover:bg-[#1f1f1f]'} p-2 rounded-full cursor-pointer  transition-all duration-300 ease-in-out`}>
                              {theme === 'light' ? <MdOutlineNightlight className='text-[#2b2b2b] text-2xl' /> : <MdOutlineLightMode className='text-white text-2xl' />}
                         </div>

                         <div onClick={(e) => {
                              e.preventDefault(); Navigate('/friend/chat/conversation');
                         }} className='flex gap-2 items-center cursor-pointer'>
                              <IoArrowBackCircleOutline className={`text-2xl ${theme === 'light' ? 'text-black' : "text-white"} rounded-full w-5 h-5`} />
                              <span className={`text-sm SF-pro-regular ${theme === 'light' ? 'text-black' : 'text-white'}`}>Back</span>
                         </div>

                         <div>
                              <h2 className={`SF-pro-regular ${theme === 'light' ? 'text-gray-700' : "text-white"}`}>Security & Authentication</h2>
                              <p className={`mt-1 text-[16px] SF-pro-regular ${theme === 'light' ? 'text-black' : "text-gray-400"} `}>
                                   Our platform guarantees that your app is secured with measures in place.
                              </p>
                         </div>

                         <div>
                              <p className={`mt-1 text-[20px] SF-pro-regular ${theme === 'light' ? 'text-gray-700' : "text-white"} `}>Current Sessions</p>
                              <p className={`mt-1 text-[16px] SF-pro-regular ${theme === 'light' ? 'text-black' : "text-gray-400"} `}>
                                   keep up with your available sessions logged in from your account
                              </p>
                         </div>

                         <button
                              onClick={() => fetchSessionData(user)}
                              className={`flex justify-end px-3 py-2 gap-2 rounded-full ${theme === 'light' ? 'bg-gray-200 text-gray-700 hover:text-black hover:bg-gray-300' : 'bg-[#2b2b2b] hover:text-white text-gray-300'}  transition`}
                              title="Refresh sessions"
                              type="button"
                         >

                              <MdRefresh className={`text-xl mt-[2px] ${theme === 'light' ? 'text-gray-700' : 'text-white'} transition-transform hover:rotate-90`} />
                              Refresh Sessions
                         </button>


                         {
                              sessionData && (
                                   <>
                                        <div className={`border ${theme === 'light' ? 'border-gray-200' : 'border-[#383838]'} rounded-md md:w-[70%] w-[100%] `}>
                                             {
                                                  sessionData && (
                                                       sessionData.map((session, index) => (
                                                            <div className={`flex justify-between items-center p-4 border-b ${theme === 'light' ? 'border-gray-200' : 'border-[#383838]'}`} key={index}>
                                                                 <div>
                                                                      <p className={`${theme === 'light' ? 'bg-gray-200 text-gray-800' : 'bg-[#2b2b2b] text-gray-300'} rounded-sm text-sm px-1 py-2 flex justify-center flex-nowrap w-[80%] items-center`}>IP - {session.IP_ADDRESS}</p>
                                                                      <p className={`${theme === 'light' ? 'text-black' : 'text-white'} text-lg`}>{session.BROWSER_NAME} ,<span className={`text-gray-500 text-sm`}> {session.BROWSER_VERSION}</span></p>
                                                                      <p className={`${theme === 'light' ? 'text-gray-700' : 'text-gray-300'} text-sm`}>{session.LOCATION}</p>
                                                                 </div>
                                                                 <div className={`flex flex-col items-end`}>
                                                                      <span className={`${theme === 'light' ? 'bg-gray-200 text-black' : 'bg-[#2b2b2b] text-white'} px-4 py-1 rounded-full`}>{session.STATUS}</span>
                                                                      <p className={`text-sm ${theme === 'light' ? 'text-gray-800' : 'text-gray-400'} pt-2`}>Date & Time - {formatLastSeenSriLanka(session.DATE)}</p>
                                                                 </div>
                                                            </div>
                                                       ))
                                                  )

                                             }
                                        </div>
                                   </>

                              )

                         }

                         <div>
                              <p className={`mt-1 text-[20px] SF-pro-regular ${theme === 'light' ? 'text-black' : "text-white"} `}>Two-factor authentication (2FA)</p>
                              <p className={`mt-1 text-[16px] SF-pro-regular ${theme === 'light' ? 'text-gray-700' : "text-gray-400"} `}>
                                   keep your account secure by enabling 2FA from an authenticator
                              </p>
                         </div>

                         <div className="flex justify-between items-center md:w-[70%] w-[100%] ">

                              <div className="flex gap-2">
                                   <div><MdOutlineEmail className={`text-3xl ${theme === 'light' ? 'text-gray-800' : 'text-gray-200'} pt-1`} /></div>
                                   <div>
                                        <p className={`text-[18px] SF-pro-medium ${theme === 'light' ? 'text-gray-700' : 'text-white'}`}>Text message (email)</p>
                                        <p className={`${theme === 'light' ? 'text-gray-600' : 'text-gray-400'} text-sm SF-pro-regular`}>Secure your One-Time password is a secure method for two-factor authentication</p>
                                   </div>
                              </div>

                              <div>
                                   <input
                                        type="checkbox"
                                        className="toggle"
                                        onChange={handle2FA}
                                        checked={twoFactorEnabled}
                                   />
                              </div>
                         </div>

                    </div>
               </div >
          </>
     );
}