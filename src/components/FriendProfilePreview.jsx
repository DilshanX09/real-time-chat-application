import { motion } from 'framer-motion';
import { IoIosLink } from 'react-icons/io';
import { MdCloudQueue, MdDriveFolderUpload, MdFormatQuote } from 'react-icons/md';
import { formatLastSeenSriLanka } from '../methods/FormatedDate';
import formatDate from '../methods/NormalDateFormat';
import { ThemeContext } from '../context/ThemeContext';
import { useContext, useEffect, useRef, useState } from 'react';
import Cookies from 'js-cookie'


import user from '../resource/user.svg';
import user_white from '../resource/user-white.png';
import baseUrl from '../methods/BaseUrl';
import axios from 'axios';

export default function ProfilePreview(

     {
          selectFriend,
          show_media_asset_preview,
          set_media_asset_preview,
          selected_user_profile_image,
          message,
     }

) {

     const userId = useRef(null)
     const { theme } = useContext(ThemeContext);

     const [mediaAssetSelectedUser, setMediaAssetSelectedUser] = useState([])
     const [selectedTab, setSelectedTab] = useState("overview");

     useEffect(() => {
          userId.current = Cookies.get('UUID');
          return;
     }, []);

     const getMessagesWithOnlyLinks = (messages) => {
          return messages.filter(msg =>
               msg.MESSAGE && msg.MESSAGE.trim().match(/^((https?:\/\/)?(www\.)?[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}([^\s]*)?)$/)
          );
     };

     const mediaAssetFetch = async () => {
          await axios.post(baseUrl(`/api/v1/media`), { sender: userId.current, receiver: selectFriend.UUID })
               .then(response => { setMediaAssetSelectedUser(response.data); })
               .catch(error => { console.log('Media fetching error, internal error' , error); })
     }

     return (
          <>
               <motion.div
                    className={`w-[650px] h-[500px] fixed rounded-lg ${theme === 'light' ? 'bg-white border-gray-200' : 'bg-[#121212] border-[#2b2b2b]'} border  shadow-xl top-20 z-50`}
                    initial={{ y: 100, opacity: 0 }}
                    animate={{
                         y: [100, -10, 5, 0],
                         opacity: 1,
                    }}
                    transition={{
                         duration: 0.4,
                         ease: "easeOut",
                    }}
               >

                    <div className="flex w-full h-full gap-3 p-2 relative">
                         <div className={` w-[180px] h-full ${theme === 'light' ? 'text-black  bg-white border-gray-100 ' : 'text-white bg-[#121212] border-[#2b2b2b] '} py-4 px-2 flex flex-col gap-3 border-r`}>
                              <button
                                   className={`text-left flex SF-pro-regular items-center gap-2 p-2 rounded ${selectedTab === 'overview'
                                        ? theme === 'light'
                                             ? 'bg-gray-100'
                                             : 'bg-[#3a3a3a]'
                                        : ''
                                        }`}


                                   onClick={() => setSelectedTab("overview")}
                              >
                                   <MdFormatQuote />
                                   <span>Overview</span>
                              </button>

                              <button
                                   className={`text-left flex items-center SF-pro-regular gap-2 p-2 rounded ${selectedTab === 'media'
                                        ? theme === 'light'
                                             ? 'bg-gray-100'
                                             : 'bg-[#3a3a3a]'
                                        : ''
                                        }`}

                                   onClick={
                                        () => {
                                             setSelectedTab("media"); mediaAssetFetch();
                                        }
                                   }
                              >
                                   <MdCloudQueue />
                                   <span>Media</span>
                              </button>

                              <button
                                   className={`text-left flex items-center SF-pro-regular gap-2 p-2 rounded ${selectedTab === 'links'
                                        ? theme === 'light'
                                             ? 'bg-gray-100'
                                             : 'bg-[#3a3a3a]'
                                        : ''
                                        }`}

                                   onClick={() => setSelectedTab("links")}
                              >
                                   <IoIosLink />
                                   <span>Links</span>
                              </button>

                              <button
                                   className={`text-left flex items-center SF-pro-regular gap-2 p-2 rounded ${selectedTab === 'files'
                                        ? theme === 'light'
                                             ? 'bg-gray-100'
                                             : 'bg-[#3a3a3a]'
                                        : ''
                                        }`}

                                   onClick={() => setSelectedTab("files")}
                              >
                                   <MdDriveFolderUpload />
                                   <span >Files</span>
                              </button>
                         </div>

                         <div className="flex-1 h-full rounded-md text-black p-4 overflow-y-auto ">
                              {selectedTab === "overview" && (
                                   <>
                                        <div className="flex flex-col items-center gap-2">
                                             <div>
                                                  <img
                                                       onMouseEnter={() => { selectFriend.PROFILE_IMAGE_URL ? set_media_asset_preview(selected_user_profile_image) : null }}
                                                       onMouseLeave={() => { set_media_asset_preview(null) }}
                                                       src={selectFriend.PROFILE_IMAGE_URL ? selected_user_profile_image : (theme === 'light' ? user : user_white)}
                                                       className={`w-28 h-28 mt-5 rounded-full ${theme === 'light' ? 'bg-gray-100' : 'bg-[#2b2b2b]'} `}
                                                  />
                                             </div>
                                             <div className="flex flex-col items-center mt-2">
                                                  <span className={`text-lg ${theme === 'light' ? 'text-black' : 'text-white'}`}>
                                                       {selectFriend.USERNAME || "Loading..."}
                                                  </span>
                                                  <span className={`text-sm ${theme === 'light' ? 'text-gray-500' : 'text-gray-400'}`}>
                                                       {selectFriend.EMAIL || "Loading..."}
                                                  </span>
                                             </div>
                                        </div>

                                        <div className="mt-6 text-sm">
                                             <p className={`${theme === 'light' ? 'text-gray-500' : 'text-gray-400'} mb-1`}>Last seen</p>
                                             {selectFriend.STATUS === 'Online' ? (
                                                  <p className={`mb-4 SF-pro-regular ${theme === 'light' ? 'text-black' : 'text-white'}`}>online</p>
                                             ) : (
                                                  <p className={`mb-4 SF-pro-regular ${theme === 'light' ? 'text-black' : 'text-white'}`}>
                                                       {`Last seen ${formatLastSeenSriLanka(selectFriend.LAST_LOGIN)}`}
                                                  </p>
                                             )}

                                             {selectFriend.BIO && (
                                                  <>
                                                       <p className={`${theme === 'light' ? 'text-gray-500' : 'text-gray-400'} mb-1`}>About</p>
                                                       <p className={`mb-4 SF-pro-regular ${theme === 'light' ? 'text-black' : 'text-white'}`}>{selectFriend.BIO}</p>
                                                  </>
                                             )}

                                             {
                                                  selectFriend.MOBILE && (
                                                       <>
                                                            <p className={`${theme === 'light' ? 'text-gray-500' : 'text-gray-400'} mb-1`}>Phone number</p>
                                                            <p className={`mb-4 SF-pro-regular ${theme === 'light' ? 'text-black' : 'text-white'}`}>{selectFriend.MOBILE}</p>
                                                       </>
                                                  )
                                             }

                                             <p className={`${theme === 'light' ? 'text-gray-500' : 'text-gray-400'} mb-1`}>Disappearing messages</p>
                                             <p className={`mb-4 SF-pro-regular ${theme === 'light' ? 'text-black' : 'text-white'}`}>Off</p>

                                             <p className={`${theme === 'light' ? 'text-gray-500' : 'text-gray-400'} mb-1`}>Mute notifications</p>
                                             <button className="bg-gray-200 px-3 py-1 rounded hover:bg-gray-600 mt-1">
                                                  🔕 Mute
                                             </button>
                                        </div>
                                   </>
                              )}

                              <div className="relative">
                                   <div className='flex flex-wrap'>
                                        {selectedTab === "media" &&
                                             mediaAssetSelectedUser.map((image, index) =>
                                                  image.IMAGE_URL !== null && (

                                                       <img
                                                            key={index}
                                                            onMouseEnter={() => { set_media_asset_preview(`http://localhost:5000${image.IMAGE_URL}`) }}
                                                            onMouseLeave={() => { set_media_asset_preview(null) }}
                                                            src={`http://localhost:5000${image.IMAGE_URL}`}
                                                            className="w-32 h-32 object-cover rounded-md p-[1px]"
                                                       />

                                                  )
                                             )
                                        }
                                   </div>

                              </div>

                              {
                                   show_media_asset_preview && (
                                        <motion.div
                                             initial={{ y: 100, opacity: 0 }}
                                             animate={{
                                                  y: [100, -10, 5, 0],
                                                  opacity: 1,
                                             }}
                                             transition={{
                                                  duration: 0.4,
                                                  ease: "easeOut",
                                             }}
                                             className="w-[400px] h-[400px] top-0 left-[650px] absolute border-gray-200">
                                             <img src={show_media_asset_preview} className="p-1 w-full h-full rounded-lg" />
                                        </motion.div>
                                   )
                              }

                              {selectedTab === "links" && (
                                   <div>
                                        {(() => {
                                             const linkMessages = getMessagesWithOnlyLinks(message);

                                             return linkMessages.length > 0 ? (
                                                  linkMessages.map((msg, index) => {

                                                       const matchedLinks = msg.MESSAGE.match(/((https?:\/\/)?(www\.)?[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})([^\s]*)?/g);
                                                       if (!matchedLinks) return null;

                                                       return (
                                                            <div key={index} className="p-2 bg-white/10 text-white border-b border-gray-200 mb-1">
                                                                 {matchedLinks.map((link, idx) => {
                                                                      const href = link.startsWith('http') ? link : `https://${link}`;
                                                                      return (
                                                                           <a
                                                                                key={idx}
                                                                                href={href}
                                                                                target="_blank"
                                                                                rel="noopener noreferrer"
                                                                                className="text-blue-400 underline block  text-sm hover:text-blue-600 break-all"
                                                                           >
                                                                                {link}
                                                                           </a>
                                                                      );
                                                                 })}
                                                                 <p className="text-xs text-gray-400 mt-1">{formatDate(msg.DATE)}</p>
                                                            </div>
                                                       );
                                                  })
                                             ) : (
                                                  <p className="text-gray-400 px-2 py-4">🔗 No shared links yet...</p>
                                             );
                                        })()}
                                   </div>
                              )}

                         </div>
                    </div>

               </motion.div>

          </>
     );
}