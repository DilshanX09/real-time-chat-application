import { useCallback, useContext, useEffect, useMemo, useReducer, useState } from 'react';
import { IoArrowBackCircleOutline } from "react-icons/io5";
import { useNavigate } from 'react-router-dom';
import { FaRegEdit } from "react-icons/fa";
import Cookies from 'js-cookie';
import axios from 'axios';
import { ThemeContext } from '../context/ThemeContext';
import { motion } from 'framer-motion';

import user_image from '../resource/user.svg';
import user_white from '../resource/user-white.png';
import { MdOutlineLightMode, MdOutlineNightlight } from 'react-icons/md';

const Profile = () => {

     const { theme, toggleTheme } = useContext(ThemeContext);
     const [serverResponse, setServerResponse] = useState("" || null);

     const initialState = {
          bio: '',
          image: null,
          mobile: ''
     };

     const reducer = (state, action) => {
          switch (action.type) {
               case 'SET_BIO':
                    return { ...state, bio: action.payload };
               case 'SET_IMAGE':
                    return { ...state, image: action.payload };
               case 'SET_MOBILE':
                    return { ...state, mobile: action.payload };
               default:
                    return state;
          }
     }

     const [state, dispatch] = useReducer(reducer, initialState);
     const [imagePreview, setImagePreview] = useState(null);

     const Navigate = useNavigate();
     const [data, setData] = useState([]);
     const [loggedUser, setLoggedUser] = useState('');
     const [url, setUrl] = useState("");

     useEffect(() => {

          const userCookie = Cookies.get("UUID");

          if (userCookie) {

               axios.get(`http://localhost:5000/api/v1/user/profile/${userCookie}`).then((response) => {
                    const profileData = response.data[0];
                    setData(profileData);
                    setUrl(profileData.PROFILE_IMAGE_URL);
                    dispatch({ type: 'SET_BIO', payload: profileData.BIO || '' });
                    dispatch({ type: 'SET_MOBILE', payload: profileData.MOBILE || '' });
               });
          } else {
               Navigate('/user/auth/v1/log-in');
          }

          setLoggedUser(userCookie);

     }, []);


     const handleFileChange = useCallback((e) => {
          const file = e.target.files[0];
          dispatch({ type: 'SET_IMAGE', payload: file });

          const reader = new FileReader();
          reader.onloadend = () => {
               setImagePreview(reader.result);
          };
          reader.readAsDataURL(file);
     }, []);

     const saveProfile = useCallback(async (e) => {
          e.preventDefault();

          const formData = new FormData();
          formData.append('bio', state.bio);
          formData.append('image', state.image);
          formData.append('mobile', state.mobile);
          formData.append('user', loggedUser);

          try {
               const res = await axios.put('http://localhost:5000/api/v1/user/update-profile', formData, {
                    headers: {
                         'Content-Type': 'multipart/form-data',
                    },
               });

               if (res.data.status === 200) setServerResponse("Profile updated");

               document.getElementById('my_modal_1').close();
               setTimeout(() => {
                    if (res.data.image) {
                         setUrl(res.data.image);
                    }
               }, 1000);
          } catch (Exception) {
               setServerResponse("Somthing wen't wrong!")
          }
     }, [state.bio, state.image, state.mobile, loggedUser]);

     const profileImageSrc = useMemo(() => {
          if (imagePreview) return imagePreview;
          return url ? `http://localhost:5000${url}` : (theme === 'light' ? user_image : user_white);
     }, [imagePreview, url, theme]);

     const profileData = useMemo(() => ({
          username: data.USERNAME || '',
          email: data.EMAIL || '',
          bio: data.BIO || '',
          mobile: data.MOBILE || ''
     }), [data]);

     return (

          <div className={`${theme === 'light' ? 'bg-white' : 'bg-[#121212]'} h-screen w-screen relative`}>
               <div className="space-y-3 lg:mx-80 mx-20 pt-5 pb-10">

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
                         <h2 className={`SF-pro-regular ${theme === 'light' ? 'text-black' : "text-gray-400"}`}>Profile information</h2>
                         <p className={`mt-1 text-sm SF-pro-regular ${theme === 'light' ? 'text-black' : "text-white"} `}>
                              This information will be displayed publicly so be careful what you share.
                         </p>

                         <div className="mt-10 grid grid-cols-1 gap-x-6 gap-y-8 sm:grid-cols-6">

                              <div className="col-span-full">
                                   <label htmlFor="photo" className={`block text-sm SF-pro-regular font-medium leading-6 ${theme === 'light' ? 'text-black' : 'text-gray-400'}`}>
                                        Photo
                                   </label>
                                   <div className="mt-2 flex items-center gap-x-3">

                                        <img className={`rounded-full w-20 h-20 object-fill p-1 ${theme === 'light' ? 'bg-gray-100' : 'bg-[#2b2b2b]'} `} src={url ? `http://localhost:5000${url}` : (theme === 'light' ? user_image : user_white)} />

                                        <button className={`relative ${theme === 'light' ? 'bg-white text-black border border-gray-200' : 'bg-[#2b2b2b] text-white'} px-5 py-2 cursor-pointer rounded-full  text-sm`} onClick={() => document.getElementById('my_modal_1').showModal()}>Change</button>

                                        <dialog id="my_modal_1" className="modal fixed inset-0 z-40 bg-black/30 backdrop-blur-sm">
                                             <div className={`modal-box ${theme === 'light' ? 'bg-white text-black' : 'bg-[#121212] text-white'} relative`}>
                                                  <span className=' flex justify-end'>
                                                       <span className='text-sm text-gray-500'>Press </span>
                                                       <kbd className="kbd kbd-sm mx-1 bg-[#2b2b2b] text-white"> Esc </kbd>
                                                       <span className='text-sm text-gray-500'> to exit model</span>
                                                  </span>
                                                  <h3 className={`text-lg ${theme === 'light' ? 'text-black' : 'text-white'}`}>Select profile image</h3>
                                                  <p className="pt-1 pb-3 text-gray-400">Select a profile image from your device.</p>
                                                  <div className="flex justify-center items-center relative">

                                                       {
                                                            imagePreview ?
                                                                 (
                                                                      <img src={imagePreview} className='h-56 w-56 rounded-full object-cover' alt="profile_image" />
                                                                 )

                                                                 :

                                                                 <img src={profileImageSrc} className={`h-56 w-56 rounded-full object-cover ${theme === 'light' ? 'bg-gray-100' : 'bg-[#2b2b2b]'}`} alt="profile_image" />

                                                       }

                                                       <label
                                                            htmlFor="file-upload"
                                                            className={`absolute right-28 bottom-6 p-4 cursor-pointer rounded-full ${theme === 'light' ? 'bg-gray-200 text-black' : 'bg-[#2b2b2b] text-white'}  font-semibold text-sm focus-within:outline-none`}
                                                       >
                                                            <FaRegEdit className={`w-4 h-4 ${theme === 'light' ? 'text-black' : 'text-white'}`} />
                                                            <input id="file-upload" name="file-upload" onChange={handleFileChange} type="file" className="sr-only" />
                                                       </label>
                                                  </div>
                                                  <div className="modal-action">
                                                       <form method="dialog">
                                                            <button onClick={saveProfile} className={`relative ms-2 px-5 py-2 cursor-pointer rounded-full ${theme === 'light' ? 'bg-gray-100  text-black' : 'bg-[#2b2b2b]  text-white'} text-sm focus-within:outline-none`}>Save</button>
                                                            <button className={`relative ms-2 px-5 py-2 cursor-pointer rounded-full ${theme === 'light' ? 'bg-gray-100  text-black' : 'bg-[#2b2b2b]  text-white'} text-sm focus-within:outline-none`}>Close</button>
                                                       </form>
                                                  </div>
                                             </div>
                                        </dialog>

                                   </div>
                              </div>

                              <div className="sm:col-span-4">
                                   <label htmlFor="photo" className={`block text-sm SF-pro-regular font-medium leading-6 ${theme === 'light' ? 'text-black' : 'text-gray-400'}`}>
                                        Username
                                   </label>
                                   <div className="mt-2">
                                        <div className="flex gap-2 sm:max-w-md">
                                             <span className="flex select-none items-center pl-3 text-gray-500 sm:text-sm">@ /</span>
                                             <input
                                                  id="username"
                                                  value={profileData.username}
                                                  name="username"
                                                  type="text"
                                                  autoComplete="username"
                                                  disabled
                                                  className={`block flex-1 SF-pro-regular ${theme === 'light' ? 'text-gray-700 placeholder:text-white  bg-gray-100' : 'text-white placeholder:text-white  bg-[#2b2b2b]'} rounded-md font-medium outline-none py-1.5 pl-1 focus:ring-0 sm:text-sm sm:leading-6`}
                                             />
                                        </div>
                                   </div>
                              </div>

                              <div className="col-span-full">
                                   <label htmlFor="photo" className={`block text-sm SF-pro-regular font-medium leading-6 ${theme === 'light' ? 'text-black' : 'text-gray-400'}`}>
                                        Bio
                                   </label>
                                   <div className="mt-2">
                                        <textarea
                                             id="text"
                                             name="text"
                                             type="text"
                                             rows={3}
                                             defaultValue={profileData.bio}
                                             className={`block w-full p-2 rounded-md border-0 outline-none ${theme === 'light' ? 'bg-gray-100 text-gray-700' : 'text-white bg-[#2b2b2b]'} py-1.5  shadow-sm placeholder:text-gray-400 sm:text-sm sm:leading-6`}
                                             onChange={(e) => dispatch({ type: 'SET_BIO', payload: e.target.value })}
                                        />
                                   </div>
                              </div>
                         </div>
                    </div>

                    <div className="pb-1">
                         <h2 className={`text-base leading-7 ${theme === 'light' ? 'text-black' : 'text-gray-400'}`}>Personal Information</h2>
                         <p className="mt-1 text-sm leading-6 text-gray-600">Use a permanent address where you can receive mail.</p>

                         <div className="mt-10 grid grid-cols-1 gap-x-6 gap-y-8 sm:grid-cols-6">
                              <div className="sm:col-span-3">
                                   <label htmlFor="email" className={`block text-sm SF-pro-regular font-medium leading-6 ${theme === 'light' ? 'text-black' : 'text-gray-400'}`}>
                                        Email Address
                                   </label>
                                   <div className="mt-2">
                                        <input
                                             id="email"
                                             name="email"
                                             type="email"
                                             autoComplete="email"
                                             value={profileData.email}
                                             readOnly
                                             className={`block w-full rounded-md border-0 p-2 ${theme === 'light' ? 'bg-gray-100 text-gray-600' : 'bg-[#2b2b2b]  text-white'}  outline-none py-1.5 shadow-sm  placeholder:text-gray-400 sm:text-sm sm:leading-6`}
                                        />
                                   </div>
                              </div>

                              <div className="sm:col-span-3">
                                   <label htmlFor="mobile" className={`block text-sm SF-pro-regular font-medium leading-6 ${theme === 'light' ? 'text-black' : 'text-gray-400'}`}>
                                        Mobile
                                   </label>
                                   <div className="mt-2">
                                        <input
                                             id="mobile"
                                             name="mobile"
                                             type="mobile"
                                             autoComplete="mobile"
                                             defaultValue={profileData.mobile ? profileData.mobile : null}
                                             onChange={(e) => dispatch({ type: 'SET_MOBILE', payload: e.target.value })}
                                             className={`block w-full rounded-md border-0 p-2 ${theme === 'light' ? 'bg-gray-100 text-gray-600' : 'bg-[#2b2b2b]  text-white'}  outline-none py-1.5 shadow-sm  placeholder:text-gray-400 sm:text-sm sm:leading-6`}
                                        />
                                   </div>
                              </div>

                         </div>
                    </div>

                    <div className="flex items-center justify-end gap-x-3">
                         <button type="button" onClick={(e) => { e.preventDefault(); Navigate('/friend/chat/conversation'), { userCookie } }} className={`text-sm leading-6 ${theme === 'light' ? 'text-black' : 'text-white'}`}>
                              Cancel
                         </button>
                         <button
                              onClick={saveProfile}
                              type="submit"
                              className={`${theme === 'light' ? 'bg-gray-100 text-black ' : 'bg-[#2b2b2b] text-white '} px-6 rounded-full py-2 text-sm   shadow-sm  focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2`}
                         >
                              Save
                         </button>
                    </div>
               </div>
          </div >

     )
}

export default Profile;