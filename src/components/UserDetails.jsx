import { Menu, MenuButton, MenuItem, MenuItems } from "@headlessui/react"
import { IoPersonAddOutline, IoSettingsOutline } from "react-icons/io5"
import { useNavigate } from "react-router-dom";
import Cookies from "js-cookie";
import { HiOutlineBars3BottomRight } from "react-icons/hi2";
import { ThemeContext } from "../context/ThemeContext";
import { useContext } from "react";
import { IoMdLogIn } from "react-icons/io";


export default function LoggedUserProfileView({ open_model, data, logged_user, user_image, user_white }) {

     const { theme } = useContext(ThemeContext);

     const Navigate = useNavigate();
     const handleLoggedOut = async () => {

          const socket = new WebSocket('http://localhost:8080');

          try {

               if (socket && socket.readyState === WebSocket.OPEN) {
                    socket.send(JSON.stringify({ type: 'logged_status', userId: logged_user }));
                    socket.close();
               }

               Cookies.remove('UUID');

               setInterval(() => {
                    window.location.reload();
                    Navigate("/");
               }, 1000);

          } catch (err) {
               console.info(err);
          }
     }

     return (
          <>
               <div className="flex items-center justify-between  px-2 pt-2 mb-3 rounded-lg">

                    <div className="flex items-center">
                         <img className={`w-12 h-12 rounded-full ${theme === 'light' ? 'bg-gray-100' : 'bg-[#2b2b2b]'}`} src={data.profile_url ? `http://localhost:5000${data.profile_url}` : (theme === 'light' ? user_image : user_white)} alt="profileImageView" />
                         <div className="flex flex-col ml-3">
                              <span className={`text-sm ${theme === 'light' ? 'text-[#121212]' : 'text-white'}  SF-pro-regular font-semibold`}>
                                   {data.username ? data.username : "Loading..."}
                              </span>
                              <span className={`${theme === 'light' ? 'text-gray-600' : 'text-gray-300'} SF-pro-regular text-[0.80rem]`}>{data.email ? data.email : 'Loading..'}</span>
                         </div>
                    </div>

                    <Menu as="div" className="relative inline-block text-left">
                         <div>
                              <MenuButton className="inline-flex w-full justify-center gap-x-1.5 font-semibold  text-gray-900">
                                   <HiOutlineBars3BottomRight className={`font-medium text-xl ${theme === 'light' ? 'text-[#2b2b2b] hover:bg-gray-100' : 'text-white hover:bg-[#2B2B2B]'} w-9 h-9 p-2 cursor-pointer  rounded-full`} />
                              </MenuButton>
                         </div>
                         <MenuItems
                              transition
                              className={`absolute right-0 z-10 mt-2 w-56 origin-top-right rounded-lg ${theme === 'light' ? 'border-gray-300  bg-white' : 'border-[#2b2b2b]  bg-[#121212]'} border  shadow-lg transition focus:outline-none data-[closed]:scale-95 data-[closed]:transform data-[closed]:opacity-0 data-[enter]:duration-100 data-[leave]:duration-75 data-[enter]:ease-out data-[leave]:ease-in`}
                         >
                              <div className="py-1">
                                   <MenuItem>
                                        <span
                                             onClick={() => { Navigate('/user/auth/v1/profile') }}
                                             className={`flex SF-pro-regular py-2 px-1 flex-row items-center gap-2 text-sm ${theme === 'light' ? 'text-gray-700 data-[focus]:bg-gray-100 ' : 'text-gray-300 data-[focus]:bg-[#2b2b2b] '} cursor-pointer mx-2 my-1 rounded-md `}
                                        >
                                             <IoSettingsOutline className="text-lg" /> Account Settings
                                        </span>
                                   </MenuItem>
                                   <MenuItem>
                                        <span
                                             onClick={open_model}
                                             className={`flex SF-pro-regular py-2 px-1 flex-row items-center gap-2 text-sm ${theme === 'light' ? 'text-gray-700 data-[focus]:bg-gray-100 ' : 'text-gray-300 data-[focus]:bg-[#2b2b2b] '} cursor-pointer mx-2 my-1 rounded-md `}
                                        >
                                             <IoPersonAddOutline className="text-lg" /> Add a new person
                                        </span>
                                   </MenuItem>
                                   <MenuItem>
                                        <span
                                             onClick={() => { Navigate('/user/auth/v1/sessions') }}
                                             className={`flex SF-pro-regular py-2 px-1 flex-row items-center gap-2 text-sm ${theme === 'light' ? 'text-gray-700 data-[focus]:bg-gray-100 ' : 'text-gray-300 data-[focus]:bg-[#2b2b2b] '} cursor-pointer mx-2 my-1 rounded-md `}
                                        >
                                             <IoMdLogIn className="text-lg" /> Privacy Data
                                        </span>
                                   </MenuItem>
                                   <MenuItem>
                                        <span
                                             onClick={handleLoggedOut}
                                             className="py-2 SF-pro-regular items-center flex justify-center flex-row text-sm cursor-pointer text-white bg-[#2b2b2b]  mx-2 my-1 rounded-md"
                                        >
                                             Log out
                                        </span>
                                   </MenuItem>
                              </div>
                         </MenuItems>
                    </Menu>
               </div>
          </>
     )
}