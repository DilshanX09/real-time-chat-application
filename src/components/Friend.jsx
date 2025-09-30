import React, { useContext } from 'react';
import { motion } from 'framer-motion';
import { IoImageOutline } from "react-icons/io5";
import { ThemeContext } from '../context/ThemeContext';

import user from '../resource/user.svg';
import user_white from '../resource/user-white.png';
import formatDateForList from '../methods/FriendListShowDate';

const Friend = React.forwardRef(({ friend, selected_person, isActive, setSelectUser, handlePersonClick, typingStatus, unreadCount }, ref) => {

     const { theme } = useContext(ThemeContext);

     return (
          <motion.div
               ref={ref}
               layout
               initial={{ opacity: 0, y: 16, scale: 0.98 }}
               animate={{ opacity: 1, y: 0, scale: 1 }}
               exit={{ opacity: 0, y: -16, scale: 0.98 }}
               transition={{ type: "spring", stiffness: 300, damping: 25, mass: 0.5 }}
               className={`flex items-center relative justify-between px-2 py-2 rounded-md ${selected_person === friend.UUID
                    ? theme === 'dark'
                         ? 'bg-[#2B2B2B]'
                         : 'bg-gray-100'
                    : ''
                    }`}
               style={{ width: '100%', backfaceVisibility: 'hidden' }}
               onClick={() => {
                    setSelectUser(friend);
                    handlePersonClick(friend.UUID);
               }}
          >
               <div className="flex items-center">


                    {
                         !friend.PROFILE_IMAGE_URL ? <img src={theme === 'light' ? user : user_white} className={`${theme === 'light' ? 'bg-gray-100' : 'bg-[#2b2b2b]'}  w-14 h-14 mr-3   p-1 rounded-full `} /> : <img
                              className={`w-14 h-14 mr-3 rounded-full ${friend.STATUS == 'Online' && 'border-green-500 border-[3px]'} `}
                              src={`http://localhost:5000${friend.PROFILE_IMAGE_URL}`}
                              alt="profile_image"
                         />
                    }

                    <div>
                         <h3 className={`text-[1rem] ${theme === 'light' ? 'text-[#2b2b2b]' : 'text-white'}`}>
                              {friend.USERNAME || 'Loading...'}
                         </h3>

                         <div className="text-gray-500 text-sm font-medium w-56 overflow-hidden text-wrap text-muted">
                              {
                                   typingStatus && typingStatus[friend.UUID] ? (
                                        <span className={` text-sm ${theme === 'light' ? 'text-green-400' : 'text-green-400'} mr-2`}>typing...</span>
                                   ) : friend.IMAGE_URL ? (
                                        <span className="flex items-center gap-1"><IoImageOutline /> image</span>
                                   ) : (
                                        friend.MESSAGE
                                   )
                              }
                         </div>

                    </div>

               </div>

               {
                    friend.DATE && (
                         <span className="text-xs absolute right-2 top-3 pb-4 font-medium ">
                              <span className={`px-1 py-1 rounded-md ${theme === 'light' ? (!isActive && unreadCount > 0 ? 'text-green-300' : 'text-gray-700') : (!isActive && unreadCount > 0 ? 'text-green-300' : 'text-gray-400')}`}>
                                   {formatDateForList(friend.DATE)}
                              </span>
                         </span>
                    )
               }

               {!isActive && unreadCount > 0 && (
                    <span
                         className="unread-badge-whatsapp"
                    >{unreadCount != 99 ? unreadCount : '99+'}</span>
               )}

          </motion.div>
     );
});

export default Friend;
