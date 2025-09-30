import React, { useState, useEffect, useContext, useRef } from "react";
import { createPortal } from "react-dom";
import { IoMdClose } from "react-icons/io";
import { AiOutlineDelete } from "react-icons/ai";
import { MdDone, MdDoneAll, MdOutlineCancel } from "react-icons/md";
import { TbArrowForwardUp } from "react-icons/tb";
import formatDate from "../methods/NormalDateFormat";
import renderMessageWithLinks from "../methods/renderMessageWithLinks";
import { motion, AnimatePresence } from "framer-motion";
import { ThemeContext } from "../context/ThemeContext";
import { FaArrowDown } from "react-icons/fa6";
import { useSearchParams } from "react-router-dom";
import isSingleEmoji from "../methods/EmojiPattern";
import groupMessagesByDate from "../methods/GroupMessageByDate";
import '../App.css';
import { BsBan } from "react-icons/bs";

export default function Message({
     message = [],
     user,
     is_model_open,
     open_image_preview_model,
     close_image_preview_model,
     model_image,
     selected_user,
     websocket,
     setReplayMessage,
     setReplayMessageChatId,
     user_data,
     typing,
     userAtBottom,
     handleScrollToBottom
}) {

     const friendIdRef = useRef(null);
     let chatIdRef = useRef(null);
     let endOfChatRef = useRef(null);

     const { theme } = useContext(ThemeContext);
     const [contextMenu, setContextMenu] = useState(null);
     const [searchParams] = useSearchParams();

     useEffect(() => {
          const currentId = searchParams.get("f_id");
          friendIdRef.current = currentId;
     }, [searchParams]);

     let friend_uuid = friendIdRef.current;

     const isCurrentChat = (msg) =>
          (msg.SENDER === friend_uuid && msg.RECEIVER === user) ||
          (msg.SENDER === user && msg.RECEIVER === friend_uuid);

     async function deleteMessage(chatId) {

          for (let msg of message) {
               if (msg.CHAT_ID === chatId && (msg.SENDER === user || !msg.SENDER)) {

                    msg.MESSAGE = "You deleted this message.";
                    msg.IMAGE_URL = null;
                    msg.STATUS = null;

                    websocket.current.send(JSON.stringify({
                         type: "delete_message",
                         chat_id: chatId,
                         user,
                         selected_user,
                    }));

                    break;
               }
          }
     }

     useEffect(() => {
          endOfChatRef.current?.scrollIntoView({ behavior: "auto" });
     }, [message.length, friend_uuid, typing]);

     const messageMap = React.useMemo(() => {
          const map = new Map();
          message.forEach(m => map.set(m.CHAT_ID, m));
          return map;
     }, [message]);

     const closeContextMenu = () => setContextMenu(null);

     useEffect(() => {
          const handleClick = () => closeContextMenu();
          window.addEventListener("click", handleClick);
          return () => window.removeEventListener("click", handleClick);
     }, []);

     const seenMessages = new Set();
     const currentChatMessages = message.filter(isCurrentChat);

     const uniqueChatMessages = currentChatMessages.filter((msg) => {
          if (seenMessages.has(msg.CHAT_ID)) return false;
          seenMessages.add(msg.CHAT_ID);
          return true;
     });

     const groupedMessages = groupMessagesByDate(uniqueChatMessages);


     const ContextMenuPortal = () => {

          if (!contextMenu) return null;

          const { x, y, messageId } = contextMenu;
          const menuHeight = 140;
          const screenHeight = window.innerHeight;
          const screenWidth = window.innerWidth;
          const menuWidth = 160;

          const adjustedX = x + menuWidth > screenWidth ? screenWidth - menuWidth - 10 : x;
          const adjustedY = y + menuHeight > screenHeight ? y - menuHeight - 10 : y;

          return createPortal(
               <AnimatePresence>
                    <div
                         className="bg-[#121212] border border-[#2b2b2b] rounded-tl-none rounded-bl-2xl rounded-br-2xl rounded-tr-2xl w-40 shadow-lg text-sm"
                         style={{
                              position: "fixed",
                              top: adjustedY,
                              left: adjustedX,
                              zIndex: 1000,
                         }}
                    >
                         <li
                              className="m-2 flex items-center gap-3 hover:bg-[#2b2b2b] p-2 rounded-md text-white cursor-pointer"

                              onClick={() => {
                                   setReplayMessageChatId(messageId);
                                   setReplayMessage(true);
                                   closeContextMenu();
                              }}
                         >
                              <TbArrowForwardUp className="bg-[#2b2b2b] p-1 rounded-full text-2xl" />
                              Reply
                         </li>
                         <li
                              className="m-2 flex items-center gap-3 hover:bg-[#2b2b2b] p-2 rounded-md text-red-600 cursor-pointer"
                              onClick={() => {
                                   if (messageId) deleteMessage(messageId);
                                   closeContextMenu();
                              }}
                         >
                              <AiOutlineDelete className="bg-[#2b2b2b] p-1 rounded-full text-2xl" />
                              Delete
                         </li>
                         <li
                              className="m-2 p-2 flex items-center text-white gap-3 hover:bg-[#2b2b2b] cursor-pointer rounded-md"
                              onClick={closeContextMenu}
                         >
                              <MdOutlineCancel className="bg-[#2b2b2b] p-1 rounded-full text-2xl" />
                              Cancel
                         </li>
                    </div>
               </AnimatePresence>,
               document.body
          );
     };

     return (
          groupedMessages.length > 0 && (
               <div className="mb-4 mx-14 relative">

                    {groupedMessages.map((group, groupIndex) => (

                         <div key={groupIndex} >

                              <div className="text-center text-sm my-4">
                                   <span className="bg-[#202c33] text-white px-2 py-1 rounded-md text-xs">{group.date}</span>
                              </div>


                              {group.messages.map((msg) => {

                                   const isSender = msg.SENDER === user;
                                   const hasImage = !!msg.IMAGE_URL;
                                   const messageId = msg.CHAT_ID;
                                   chatIdRef.current = messageId;

                                   const handleContextMenu = (e) => {

                                        e.preventDefault();

                                        setContextMenu({
                                             x: e.clientX,
                                             y: e.clientY,
                                             messageId,
                                        });
                                   };

                                   const imageUrl = msg.IMAGE_URL?.startsWith("blob:")
                                        ? msg.IMAGE_URL
                                        : `http://localhost:5000${msg.IMAGE_URL}`;


                                   return (

                                        <div className={`chat py-[1px] my-0 relative space-y-0 ${isSender ? "chat-end" : "chat-start"}`} key={msg.CHAT_ID || `${msg.SENDER}-${msg.DATE}-${messageId}`}>

                                             <div
                                                  onContextMenu={handleContextMenu}
                                                  className="flex flex-col max-w-3xl w-fit"
                                             >

                                                  {/* Only single image */}
                                                  {hasImage && !msg.MESSAGE && (

                                                       <div className={`${isSender ? 'bg-[#075e54]' : 'bg-[#202c33]'} p-[2px] rounded-md relative`}>

                                                            <img
                                                                 src={imageUrl}
                                                                 alt="attachment"
                                                                 onClick={() => open_image_preview_model(imageUrl)}
                                                                 className="cursor-pointer max-w-[300px] max-h-[200px] rounded-md shadow"
                                                            />
                                                            <span
                                                                 className="absolute  bottom-[1px] right-2 pl-[10px] text-[10px] text-gray-800 SF-pro-regular pr-[1px] pb-[2px] flex items-center gap-1"
                                                            >

                                                                 {formatDate(msg.DATE)}

                                                                 {isSender && (
                                                                      <>
                                                                           {msg.STATUS === "sent" && (
                                                                                <MdDone className="text-gray-800 ml-[2px] text-[16px]" />
                                                                           )}
                                                                           {msg.STATUS === "delivered" && (
                                                                                <MdDoneAll className="text-gray-800 ml-[2px] text-[16px]" />
                                                                           )}
                                                                           {msg.STATUS === "read" && (
                                                                                <MdDoneAll className="text-blue-400 ml-[2px] text-[16px]" />
                                                                           )}
                                                                           {msg.STATUS === null && (
                                                                                <BsBan className="text-gray-400 ml-[5px] mb-[1px] pr-[2px] text-[13px]" />
                                                                           )}
                                                                      </>
                                                                 )}
                                                            </span>
                                                       </div>
                                                  )}

                                                  {/* image or message */}
                                                  {(msg.MESSAGE || hasImage) && (
                                                       <div className={`rounded-md flex flex-col ${isSender ? "items-end" : "items-start"}`}>

                                                            {hasImage && msg.MESSAGE && (
                                                                 <img
                                                                      src={imageUrl}
                                                                      alt="attachment"
                                                                      onClick={() => open_image_preview_model(imageUrl)}
                                                                      className={`cursor-pointer max-w-[300px] max-h-[200px] p-[2px] rounded-md mb-1 ${isSender ? "bg-[#075e54]" : "bg-[#202c33]"}`}
                                                                 />
                                                            )}

                                                            <div className={`relative rounded-md ${msg.MESSAGE && 'px-1 py-1'} max-w-full ${isSender ? "bg-[#075e54] text-white" : "bg-[#202c33] text-white"}`}>

                                                                 {msg.REPLAY_TO && (
                                                                      <div
                                                                           className={`cursor-pointer rounded-md px-1 py-1  mb-1 border-l-4 w-full ${isSender ? "border-blue-400 bg-[#0b3c36]/80" : "border-green-500 bg-[#1a2328]/80"
                                                                                }`}
                                                                           title="Jump to original message"
                                                                      >
                                                                           <span className={`block text-xs ${isSender ? "text-blue-300" : "text-green-500"} mb-1`}>
                                                                                {isSender ? user_data.USERNAME : "You"}
                                                                           </span>
                                                                           <span className="block text-sm text-white truncate max-w-full">
                                                                                {(() => {
                                                                                     const getValidString = (str) => typeof str === 'string' && str.toLowerCase() !== 'null' && str.trim() !== '';

                                                                                     const hasReplayMessage = getValidString(msg.REPLAY_MESSAGE);
                                                                                     const hasReplayImage = msg.REPLAY_IMAGE_URL && msg.REPLAY_IMAGE_URL !== 'null' && msg.REPLAY_IMAGE_URL.trim() !== '';

                                                                                     let repliedMsg;

                                                                                     if (hasReplayMessage || hasReplayImage) {
                                                                                          repliedMsg = {
                                                                                               MESSAGE: hasReplayMessage ? msg.REPLAY_MESSAGE : null,
                                                                                               IMAGE_URL: hasReplayImage ? msg.REPLAY_IMAGE_URL : null,
                                                                                          };
                                                                                     } else {
                                                                                          repliedMsg = messageMap.get(msg.REPLAY_TO);
                                                                                     }

                                                                                     const isMessageDeleted = !repliedMsg || (
                                                                                          !getValidString(repliedMsg.MESSAGE) &&
                                                                                          (!repliedMsg.IMAGE_URL || repliedMsg.IMAGE_URL === 'null' || repliedMsg.IMAGE_URL.trim() === '')
                                                                                     );

                                                                                     if (isMessageDeleted) {
                                                                                          return <i className={`${theme === "light" ? "text-white" : "text-gray-400"} pr-2`}>Message is deleted</i>;
                                                                                     }

                                                                                     if (repliedMsg.IMAGE_URL) {
                                                                                          const repliedImageUrl = repliedMsg.IMAGE_URL.startsWith("blob:")
                                                                                               ? repliedMsg.IMAGE_URL
                                                                                               : `http://localhost:5000${repliedMsg.IMAGE_URL}`;
                                                                                          return (
                                                                                               <span className="flex items-center gap-2 max-w-[180px] truncate">
                                                                                                    <img
                                                                                                         src={repliedImageUrl}
                                                                                                         alt="replied"
                                                                                                         className="w-10 h-10 object-cover rounded"
                                                                                                    />
                                                                                                    {getValidString(repliedMsg.MESSAGE) && (
                                                                                                         <span className="truncate SF-pro-regular">{renderMessageWithLinks(repliedMsg.MESSAGE)}</span>
                                                                                                    )}
                                                                                               </span>
                                                                                          );
                                                                                     }

                                                                                     return <span className="truncate max-w-[180px] SF-pro-regular">{renderMessageWithLinks(repliedMsg.MESSAGE)}</span>;
                                                                                })()}
                                                                           </span>
                                                                      </div>
                                                                 )}

                                                                 {msg.MESSAGE &&

                                                                      <div className="relative">

                                                                           <p
                                                                                className={`break-words px-1 pr-[68px] ${msg.MESSAGE === "You deleted this message." || msg.MESSAGE === "Deleted this message."
                                                                                     ? "SF-pro-regular text-gray-400 text-[14px]"
                                                                                     : isSingleEmoji(msg.MESSAGE)
                                                                                          ? "text-[35px]"
                                                                                          : "text-[17px] SF-pro-regular"
                                                                                     }`}
                                                                           >
                                                                                {renderMessageWithLinks(msg.MESSAGE)}
                                                                           </p>

                                                                           <span
                                                                                className={`absolute bottom-[-2px] right-0 pl-[10px] text-[10px] text-gray-400 SF-pro-regular pr-[1px] pb-[2px] flex items-center gap-1`}
                                                                           >
                                                                                {formatDate(msg.DATE)}

                                                                                {isSender && (
                                                                                     <>
                                                                                          {msg.STATUS === "sent" && (
                                                                                               <MdDone className="text-gray-400 ml-[2px] text-[16px]" />
                                                                                          )}
                                                                                          {msg.STATUS === "delivered" && (
                                                                                               <MdDoneAll className="text-gray-400 ml-[2px] text-[16px]" />
                                                                                          )}
                                                                                          {msg.STATUS === "read" && (
                                                                                               <MdDoneAll className="text-blue-400 ml-[2px] text-[16px]" />
                                                                                          )}
                                                                                          {msg.STATUS === null && (
                                                                                               <BsBan className="text-gray-400 ml-[5px] mb-[1px] pr-[2px] text-[13px]" />
                                                                                          )}
                                                                                     </>
                                                                                )}

                                                                           </span>
                                                                      </div>

                                                                 }


                                                            </div>

                                                       </div>
                                                  )}

                                             </div>

                                             <div ref={endOfChatRef} />

                                        </div>


                                   );
                              })}


                              {groupIndex === groupMessagesByDate(message).length - 1 && typing && (
                                   <div className="flex justify-start mt-1">
                                        <div className="flex items-center gap-2 bg-[#202c33] rounded-md px-2 py-2 shadow max-w-xs">
                                             <span className="flex items-center h-4">
                                                  <span
                                                       className="dot bg-gray-300 rounded-full w-[5px] h-[5px] mx-0.5 animate-bounce"
                                                       style={{ animationDelay: "0s" }}
                                                  />
                                                  <span
                                                       className="dot bg-gray-300 rounded-full w-[5px] h-[5px] mx-0.5 animate-bounce"
                                                       style={{ animationDelay: "0.2s" }}
                                                  />
                                                  <span
                                                       className="dot bg-gray-300 rounded-full w-[5px] h-[5px] mx-0.5 animate-bounce"
                                                       style={{ animationDelay: "0.4s" }}
                                                  />
                                             </span>
                                        </div>
                                   </div>
                              )}


                              {
                                   !userAtBottom && (
                                        <motion.div className="fixed right-6 bottom-20 cursor-pointer"
                                             initial={{ opacity: 0, y: 0, scale: 0.98 }}
                                             animate={{ opacity: 1, y: 0, scale: 1 }}
                                             exit={{ opacity: 0, y: 0, scale: 0.98 }}
                                             transition={{ type: "spring", stiffness: 300, damping: 25, mass: 0.5 }}
                                        >
                                             <FaArrowDown onClick={handleScrollToBottom} className={`${theme === 'light' ? 'bg-[#2b2b2b] text-white' : 'text-white bg-[#2b2b2b]'} rounded-md p-2 text-[2rem]`} />
                                        </motion.div>
                                   )
                              }

                         </div>
                    ))}

                    <ContextMenuPortal />

                    {is_model_open && (
                         <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-70">
                              <div className="relative">
                                   <button
                                        onClick={close_image_preview_model}
                                        className="absolute top-2 right-2 text-white text-xl bg-black bg-opacity-50 rounded-full p-2"
                                        aria-label="Close image preview"
                                   >
                                        <IoMdClose />
                                   </button>
                                   <img
                                        src={model_image}
                                        alt="Preview"
                                        className="max-w-[90vw] max-h-[90vh] rounded-lg shadow-xl"
                                   />
                              </div>
                         </div>
                    )}

                    <style>{`
                    @keyframes bounce {
                         0%, 80%, 100% { transform: scale(1); }
                         40% { transform: scale(1.4); }
                    }
                    .animate-bounce {
                         animation: bounce 1.2s infinite;
                    }`}
                    </style>

               </div>
          )
     );
}
