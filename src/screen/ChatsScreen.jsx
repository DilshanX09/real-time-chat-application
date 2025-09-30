import { useCallback, useContext, useEffect, useRef, useState } from "react";
import EmojiPicker from 'emoji-picker-react';
import { useNavigate, useSearchParams } from "react-router-dom";
import Cookies from "js-cookie";
import axios from "axios";
import "../App.css";

import { IoPersonAddOutline, IoSearchOutline } from "react-icons/io5";
import { BsEmojiSmile, BsSendArrowUp } from "react-icons/bs";
import { LuUserRoundPlus } from "react-icons/lu";
import { IoMdClose, IoMdRefresh } from "react-icons/io";
import { FaRegHeart } from "react-icons/fa6";
import { ImAttachment } from "react-icons/im";

import { AnimatePresence } from "framer-motion";
import { formatLastSeenSriLanka } from '../methods/FormatedDate';

import user_image from '../resource/user.svg';
import user_white from '../resource/user-white.png';

import {
    Tab,
    TabGroup,
    TabList,
    TabPanel,
    TabPanels,
} from "@headlessui/react";
import LoggedUserProfileView from "../components/UserDetails";
import Friend from "../components/Friend";
import ProfilePreview from "../components/FriendProfilePreview";
import Message from "../components/Message";
import FilePreview from "../components/FilePreview";
import { BiMessageSquareDetail } from "react-icons/bi";
import { ThemeContext } from "../context/ThemeContext";
import { MdOutlineLightMode, MdOutlineNightlight } from "react-icons/md";
import showNotifications from "../methods/Notification";
import baseUrl from "../methods/BaseUrl";

const Chat = () => {

    const Navigate = useNavigate();
    const chatContainer = useRef(null);
    const sidebarContainer = useRef(null);
    const ws = useRef(null);
    const sidebarRef = useRef(null);
    const startXRef = useRef(0);
    const startWidthRef = useRef(0);
    const inputRef = useRef(null);
    const friendIdRef = useRef(null);
    const typingTimeoutRef = useRef(null);
    const justSwitchedChat = useRef(false);

    const [openModel, setOpenModel] = useState(false);
    const [activeTab, setActiveTab] = useState(0);
    const [user, setUser] = useState([]);
    const [cookieUser, setCookieUser] = useState("");
    const [userAddServerResponse, setUserAddServerResponse] = useState("");
    const [err, setErr] = useState(false);
    const [friends, setFriend] = useState([]);
    const [selectUser, setSelectUser] = useState(null);
    const [selectProfile, setSelectProfile] = useState([]);
    const [selectedFriendId, setSelectedFriendId] = useState(null);
    const [message, setMessage] = useState([]);
    const [selectedUserProfileImage, setSelectedUserProfileImage] = useState('')
    const [showPicker, setShowPicker] = useState(false);
    const [messageText, setMessageText] = useState('')
    const [fvFriends, setFvFriends] = useState([])
    const [hardIsLoading, setHardIsLoading] = useState(false);
    const [textValue, setSearchTextValue] = useState('');
    const [isUserAtBottom, setIsUserAtBottom] = useState(true);
    const [file, setFile] = useState(null);
    const [profileView, setProfilePreview] = useState(false);
    const [showMediaAssetPreview, setShowMediaAssetPreview] = useState(null);
    const [friendTyping, setFriendTyping] = useState(false);
    const [typingStatus, setTypingStatus] = useState({});
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [modalImage, setModalImage] = useState('');
    const [loggedUserData, setLoggedUserData] = useState([] || null);
    const [isResizing, setIsResizing] = useState(false);
    const [sidebarWidth, setSidebarWidth] = useState(430);
    const [replayMessage, setReplayMessage] = useState(false);
    const [replayMessageChatId, setReplayMessageChatId] = useState(false);
    const { theme, toggleTheme } = useContext(ThemeContext);
    const [searchParams, setSearchParams] = useSearchParams();
    const [messageStatus, setMessageStatus] = useState('sent');
    const [allMessages, setAllMessages] = useState({});

    const [unreadCounts, setUnreadCounts] = useState({});

    const hasReadRef = useRef(new Set());


    useEffect(() => {

        if (!selectedFriendId) return;

        justSwitchedChat.current = true;
        fetchAnything();
        fetchUserProfile();

    }, [selectedFriendId]);


    useEffect(() => {
        if (selectedFriendId && allMessages[selectedFriendId]) {
            setMessage(allMessages[selectedFriendId]);
        } else {
            setMessage([]);
        }
    }, [selectedFriendId, allMessages]);

    useEffect(() => {
        const currentId = searchParams.get("f_id");
        friendIdRef.current = currentId;
    }, [searchParams]);

    const playSoundMessageSend = () => {
        try {
            const audio = new Audio('/sounds/sound.mp3');
            audio.play();
        } catch (Exception) {
            console.error("Error playing sound:", Exception);
        }
    };

    useEffect(() => {
        if (cookieUser) {
            axios.get(baseUrl(`/api/v1/unread-counts/${cookieUser}`)).then(res => {
                const counts = {};
                res.data.forEach(item => { counts[item.friendId] = item.count; });
                setUnreadCounts(counts);
            });
        }
    }, [cookieUser, message.length]);

    useEffect(() => {
        const userCookie = Cookies.get("UUID");

        if (!userCookie) Navigate("/");
        else {
            setCookieUser(userCookie);
            websocket(userCookie);
            fetchData(userCookie);
            loadAddedFriends(userCookie);
            fetchFavoriteFriends(userCookie);
        }

        return () => {
            window.removeEventListener('mousemove', handleMouseMove);
            window.removeEventListener('mouseup', stopResizing);
        };

    }, []);

    useEffect(() => {
        if (!selectedFriendId) return;

        const unread = message.filter(
            msg => msg.SENDER === selectedFriendId && msg.STATUS !== 'read'
        );
        if (unread.length === 0) {
            setUnreadCounts(prev => ({
                ...prev,
                [selectedFriendId]: 0
            }));
        }
    }, [selectedFriendId, message]);


    const scrollToBottom = (smooth = true) => {
        if (chatContainer.current) {
            if (smooth) {
                chatContainer.current.scrollTo({
                    top: chatContainer.current.scrollHeight,
                    behavior: "smooth"
                });
            } else {
                chatContainer.current.scrollTop = chatContainer.current.scrollHeight;
            }
        }
    };

    const handleScroll = () => {
        const container = chatContainer.current;
        if (!container) return;
        const threshold = 90;
        const atBottom = container.scrollHeight - container.scrollTop - container.clientHeight < threshold;
        setIsUserAtBottom(atBottom);
    };

    useEffect(() => {
        const container = chatContainer.current;
        if (!container) return;
        container.addEventListener('scroll', handleScroll);
        return () => container.removeEventListener('scroll', handleScroll);
    }, []);

    useEffect(() => {
        if (!chatContainer.current) return;
        const container = chatContainer.current;

        const handleImageLoad = () => {
            if (isUserAtBottom) {
                scrollToBottom(true);
            }
        }

        const images = Array.from(container.querySelectorAll("img:not([data-scroll-bound])"));

        images.forEach(img => {
            img.addEventListener("load", handleImageLoad);
            img.dataset.scrollBound = "true";
        });

        return () => {
            images.forEach(img => {
                img.removeEventListener("load", handleImageLoad);
            });
        };
    }, [message, isUserAtBottom]);

    const handleScrollToBottom = () => {
        scrollToBottom(true);
        setIsUserAtBottom(true);
    };


    let friendId = friendIdRef.current;

    useEffect(() => {

        if (!chatContainer.current || !selectedFriendId || !friendId) return;

        const unreadMessages = message.filter(
            msg => msg.SENDER === selectedFriendId && msg.STATUS !== 'read'
        );

        if (unreadMessages.length > 0 && isUserAtBottom) {
            unreadMessages.forEach(msg => {
                if (!hasReadRef.current.has(msg.CHAT_ID)) {
                    if (ws.current && ws.current.readyState === WebSocket.OPEN) {
                        ws.current.send(JSON.stringify({
                            type: "read",
                            CHAT_ID: msg.CHAT_ID,
                            from: msg.RECEIVER,
                            to: msg.SENDER
                        }));
                        hasReadRef.current.add(msg.CHAT_ID);
                    }
                }
            });
        }

        return () => {
            hasReadRef.current.clear();
        };

    }, [message.length, isUserAtBottom, selectedFriendId, friendId]);

    useEffect(() => {
        if (!selectedFriendId) return;
        const unread = message.filter(
            msg => msg.SENDER === selectedFriendId && msg.STATUS !== 'read'
        );
        if (unread.length === 0) {
            setUnreadCounts(prev => ({
                ...prev,
                [selectedFriendId]: 0
            }));
        }
    }, [selectedFriendId, message]);


    const websocket = (uuid) => {

        if (!ws.current || ws.current.readyState === WebSocket.CLOSED) {
            ws.current = new WebSocket('ws://localhost:5005');
        }

        ws.current.onopen = () => {
            if (ws.current.readyState === WebSocket.OPEN) {
                ws.current.send(JSON.stringify({ type: 'set_user_id', userId: uuid }));
            }
        };

        ws.current.onmessage = async (event) => {

            try {
                const message = JSON.parse(event.data);

                if (message.type === 'typing' && message.from) {
                    setTypingStatus(prev => ({ ...prev, [message.from]: true }));
                } else if (message.type === 'stopTyping' && message.from) {
                    setTypingStatus(prev => ({ ...prev, [message.from]: false }));
                }

                if (message.type === 'delete_message' && message.chat_id) {
                    setMessage(prevMessages =>
                        prevMessages.map(msg =>
                            msg.CHAT_ID === message.chat_id
                                ? { ...msg, MESSAGE: 'Deleted this message.', IMAGE_URL: null }
                                : msg
                        )
                    );
                }

                if (message.type === 'status') {

                    setSelectProfile(prevProfile => {
                        if (prevProfile?.UUID === message.userId) {
                            return {
                                ...prevProfile,
                                STATUS: message.status === 'Online' ? 'Online' : 'Offline',
                                LAST_LOGIN: message.LAST_LOGIN ?? prevProfile.LAST_LOGIN,
                            };
                        }
                        return prevProfile;
                    });

                    setFriend(prevFriends =>
                        prevFriends.map(friend =>
                            friend.UUID === message.userId
                                ? {
                                    ...friend,
                                    STATUS: message.status === 'Online' ? 'Online' : 'Offline',
                                    LAST_LOGIN: message.LAST_LOGIN ?? friend.LAST_LOGIN,
                                }
                                : friend
                        )
                    );
                }


                if (message.type === 'updateFriendList' && message.from && message.to) {

                    setFriend(prevFriends => {
                        const updated = prevFriends.map(friend =>
                            friend.UUID === message.from || friend.UUID === message.to
                                ? {
                                    ...friend,
                                    MESSAGE: message.MESSAGE,
                                    DATE: message.DATE,
                                    IMAGE_URL: message.IMAGE_URL,
                                }
                                : friend
                        );

                        const sortedList = updated.sort(
                            (a, b) => new Date(b.DATE || 0) - new Date(a.DATE || 0)
                        );
                        return sortedList;
                    });
                }

                // ---------------------------------------------------------------------------------------------------------

                if (message.type === 'message' && message.SENDER && message.CHAT_ID) {

                    const newMessageReceiverSide = {
                        CHAT_ID: message.CHAT_ID,
                        DATE: message.DATE,
                        IMAGE_URL: message.IMAGE_URL,
                        PROFILE_IMAGE_URL: message.PROFILE_IMAGE_URL,
                        RECEIVER: message.RECEIVER,
                        REPLAY_IMAGE_URL: message.REPLAY_IMAGE_URL,
                        REPLAY_MESSAGE: message.REPLAY_MESSAGE,
                        REPLAY_TO: message.REPLAY_TO,
                        SENDER: message.SENDER,
                        STATUS: 'delivered',
                        USERNAME: message.USERNAME,
                        MESSAGE: message.messageText
                    }

                    setMessage(prevMessages => {
                        if (prevMessages.some(msg => msg.CHAT_ID === newMessageReceiverSide.CHAT_ID)) {
                            return prevMessages;
                        }
                        return [...prevMessages, newMessageReceiverSide];
                    });

                    showNotifications(message.USERNAME, message.messageText, message.PROFILE_IMAGE_URL, message.IMAGE_URL);

                    if (selectedFriendId !== message.SENDER) {
                        setUnreadCounts(prev => ({
                            ...prev,
                            [message.SENDER]: (prev[message.SENDER] || 0) + 1
                        }));
                    }

                    if (ws.current && ws.current.readyState === WebSocket.OPEN) {
                        ws.current.send(JSON.stringify({
                            type: "delivered",
                            from: newMessageReceiverSide.RECEIVER,
                            to: newMessageReceiverSide.SENDER,
                            CHAT_ID: newMessageReceiverSide.CHAT_ID,
                        }));
                    }

                    setFriend(prevFriends => {
                        const existingFriend = prevFriends.find(friend => friend.UUID === message.SENDER);
                        let updated;
                        if (existingFriend) {
                            updated = prevFriends.map(friend =>
                                friend.UUID === message.SENDER
                                    ? {
                                        ...friend,
                                        MESSAGE: message.messageText,
                                        DATE: message.DATE,
                                        IMAGE_URL: message.IMAGE_URL,
                                    }
                                    : friend
                            );
                        } else {
                            updated = [
                                ...prevFriends,
                                {
                                    UUID: message.SENDER,
                                    USERNAME: message.USERNAME || 'Unknown',
                                    PROFILE_IMAGE_URL: message.PROFILE_IMAGE_URL || null,
                                    STATUS: 'online',
                                    MESSAGE: message.messageText,
                                    DATE: message.DATE,
                                    IMAGE_URL: message.IMAGE_URL,
                                }
                            ];
                        }
                        const sorted = updated.sort((a, b) => new Date(b.DATE || 0) - new Date(a.DATE || 0));
                        return sorted;
                    });

                    setFvFriends(prevFvFriends => {

                        const existingFriend = prevFvFriends.find(friend => friend.UUID === message.SENDER);

                        let updated;

                        if (existingFriend) {
                            updated = prevFvFriends.map(friend =>
                                friend.UUID === message.SENDER
                                    ? {
                                        ...friend,
                                        MESSAGE: message.messageText,
                                        DATE: message.DATE,
                                        IMAGE_URL: message.IMAGE_URL,
                                    }
                                    : friend
                            );

                        } else {
                            updated = [
                                ...prevFvFriends,
                                {
                                    UUID: message.SENDER,
                                    USERNAME: message.USERNAME || 'Unknown',
                                    PROFILE_IMAGE_URL: message.PROFILE_IMAGE_URL || null,
                                    STATUS: 'online',
                                    MESSAGE: message.messageText,
                                    DATE: message.DATE,
                                    IMAGE_URL: message.IMAGE_URL,
                                }
                            ];
                        }

                        const sorted = updated.sort((a, b) => new Date(b.DATE || 0) - new Date(a.DATE || 0));
                        return sorted;

                    });

                }

                if (message.type === 'delivered') {

                    setMessage(prevMessages =>
                        prevMessages.map(msg =>
                            msg.CHAT_ID === message.CHAT_ID
                                ? { ...msg, STATUS: msg.STATUS === 'read' ? 'read' : 'delivered' }
                                : msg
                        )
                    );
                }


                if (message.type === 'read') {

                    setMessage(prevMessages =>
                        prevMessages.map(msg =>
                            msg.CHAT_ID === message.CHAT_ID
                                ? { ...msg, STATUS: 'read' }
                                : msg
                        )
                    );
                }


                if (message.type === "unread_count_update" && message.friendId) {
                    if (selectedFriendId !== message.friendId) {
                        setUnreadCounts(prev => ({
                            ...prev,
                            [message.friendId]: message.count
                        }));
                    }
                }


            } catch (Exception) {
                console.error("Error parsing WebSocket message:", Exception);
            }
        };

        ws.current.onclose = () => {
            console.warn("Socket us on close..");
        };

        return () => {
            if (ws.current && ws.current.readyState === WebSocket.OPEN) {
                ws.current.close();
            }
        };

    };

    const onChangeText = useCallback((e) => {
        const value = e.target.value;
        setMessageText(value);

        if (!friendTyping && ws.current && ws.current.readyState === WebSocket.OPEN) {
            ws.current.send(JSON.stringify({
                type: "typing",
                from: cookieUser,
                to: selectedFriendId
            }));
            setFriendTyping(true);
        }

        if (typingTimeoutRef.current) {
            clearTimeout(typingTimeoutRef.current);
        }

        typingTimeoutRef.current = setTimeout(() => {
            if (ws.current && ws.current.readyState === WebSocket.OPEN) {
                ws.current.send(JSON.stringify({
                    type: "stopTyping",
                    from: cookieUser,
                    to: selectedFriendId
                }));
            }
            setFriendTyping(false);
        }, 700);

    }, [friendTyping, selectedFriendId, setMessageText]);

    const loadAddedFriends = async (user) => {
        await axios.post(baseUrl(`/api/v1/fetch-friend`), { user })
            .then(response => {
                setFriend(response.data);
                setOpenModel(false);
            })
            .catch(error => {
                console.log(error);
            })
    };

    const fetchUserProfile = async () => {
        await axios.post(baseUrl(`/api/v1/user-profile`), { friend: selectUser.UUID })
            .then((response) => {
                setSelectProfile(response.data[0]);
                setSelectedUserProfileImage(`http://localhost:5000${response.data[0].PROFILE_IMAGE_URL}`)
            })
            .catch(error => { console.warn(error) })
    }

    const fetchAnything = async () => {
        if (selectUser) {
            await axios.post(baseUrl(`/api/v1/chat`), { user: cookieUser, friend: selectUser.UUID })
                .then((response) => {
                    setAllMessages(prev => ({
                        ...prev,
                        [selectUser.UUID]: response.data
                    }));
                })
                .catch(error => { console.info(error) });
        }
    }

    const openImagePreviewModel = (imageUrl) => {
        setModalImage(imageUrl);
        setIsModalOpen(true);
    };

    const closeImagePreviewModel = () => {
        setIsModalOpen(false);
        setModalImage('');
    };

    const startResizing = (e) => {

        e.preventDefault();
        setIsResizing(true);
        startXRef.current = e.clientX;
        startWidthRef.current = sidebarWidth;

        document.addEventListener('mousemove', handleMouseMove);
        document.addEventListener('mouseup', stopResizing);

    };

    const handleMouseMove = (e) => {

        if (!isResizing) return;

        const dx = e.clientX - startXRef.current;
        const newWidth = startWidthRef.current + dx;

        const minWidth = 300;
        const maxWidth = 600;

        if (newWidth >= minWidth && newWidth <= maxWidth) {
            setSidebarWidth(newWidth);
        }

    };

    const stopResizing = (e) => {
        if (isResizing) {
            setIsResizing(false);
            document.removeEventListener('mousemove', handleMouseMove);
            document.removeEventListener('mouseup', stopResizing);
        }
    };

    const handlePersonClick = (person_id) => {

        setSelectedFriendId(person_id);
        setSearchParams({ f_id: person_id });

    };

    const sendMessage = async () => {

        if (showPicker) setShowPicker(false);
        else if (messageText.trim() === '' && !file) return;

        const timestamp = new Date().toISOString();

        const friendListMessage = {
            type: 'updateFriendList',
            MESSAGE: messageText.trim(),
            DATE: timestamp,
            IMAGE_URL: null,
            from: cookieUser,
            to: selectedFriendId
        }

        const message = {
            type: 'message',
            CHAT_ID: null,
            messageText: messageText,
            RECEIVER: selectedFriendId,
            SENDER: cookieUser,
            DATE: timestamp,
            IMAGE_URL: null,
            REPLAY_TO: replayMessageChatId || null,
            USERNAME: loggedUserData.username || '',
            PROFILE_IMAGE_URL: loggedUserData.profile_url || '',
            STATUS: 'sent'
        };

        var imagePreviewUrl = null;

        if (file && file.type.startsWith("image/")) {
            imagePreviewUrl = URL.createObjectURL(file);
        }

        const newFriend = {
            UUID: selectedFriendId,
            USERNAME: selectProfile?.USERNAME || 'Loading...',
            PROFILE_IMAGE_URL: selectProfile?.PROFILE_IMAGE_URL || null,
            STATUS: selectProfile?.STATUS || 'offline',
            MESSAGE: messageText.trim(),
            DATE: timestamp,
            IMAGE_URL: imagePreviewUrl,
        };

        const newMessage = {
            MESSAGE: message.messageText,
            RECEIVER: message.RECEIVER,
            SENDER: message.SENDER,
            DATE: message.DATE,
            IMAGE_URL: imagePreviewUrl,
            VIDEO_URL: file || null,
            FILE: file || null,
            REPLAY_TO: replayMessageChatId || null,
            STATUS: 'sent'
        };

        setMessage((prevMessages) => [...prevMessages, newMessage]);

        setFriend(prevFriends => {

            const existingFriend = prevFriends.find(friend => friend.UUID === selectedFriendId);

            let updated;

            if (existingFriend) {
                updated = prevFriends.map(friend =>
                    friend.UUID === selectedFriendId
                        ? {
                            ...friend,
                            MESSAGE: messageText.trim(),
                            DATE: timestamp,
                            IMAGE_URL: imagePreviewUrl,
                        }
                        : friend
                );
            } else {
                updated = [...prevFriends, newFriend];
            }

            const sorted = updated.sort((a, b) => new Date(b.DATE || 0) - new Date(a.DATE || 0));
            return sorted;
        });

        setFvFriends(prevFvFriends => {
            const existingFriend = prevFvFriends.find(friend => friend.UUID === selectedFriendId);

            let updated;

            if (existingFriend) {
                updated = prevFvFriends.map(friend =>
                    friend.UUID === selectedFriendId
                        ? {
                            ...friend,
                            MESSAGE: messageText.trim(),
                            DATE: timestamp,
                            IMAGE_URL: imagePreviewUrl,
                        }
                        : friend
                );
            } else {
                updated = [...prevFvFriends, newFriend];
            }

            const sorted = updated.sort((a, b) => new Date(b.DATE || 0) - new Date(a.DATE || 0));
            return sorted;
        });


        try {

            const formData = new FormData();

            formData.append('senderId', message.SENDER);
            formData.append('receiverId', message.RECEIVER);
            formData.append('messageText', message.messageText);
            formData.append('replayTo', message.REPLAY_TO || '');
            formData.append('status', 'sent');
            formData.append('DATE', message.DATE);

            if (file) formData.append('file', file);

            await axios.post(baseUrl(`/api/v1/store-messages`), formData, {
                headers: { 'Content-Type': 'multipart/form-data' },
            }).then(response => {
                message.CHAT_ID = response.data.chatId;
                newMessage.CHAT_ID = response.data.chatId;
                message.IMAGE_URL = response.data.imageUrl;
                friendListMessage.IMAGE_URL = response.data.imageUrl;
                message.REPLAY_TO = response.data.replayTo;
                message.REPLAY_MESSAGE = response.data.replayMessage;
                message.REPLAY_IMAGE_URL = response.data.replayImageUrl;

            });


            if (ws.current && ws.current.readyState === WebSocket.OPEN) {
                ws.current.send(JSON.stringify(message));
                ws.current.send(JSON.stringify(friendListMessage));
            }

            setMessageText('');
            playSoundMessageSend();
            setReplayMessage(false);
            setReplayMessageChatId(null);
            setFile(null);

        } catch (Exception) {
            console.error('Error sending message:', Exception);
        }
    };

    const openModal = () => {
        setOpenModel(true);
    };

    const searchUser = async (e) => {
        const keyword = e.target.value;
        try {
            const searchResponse = await axios.post(baseUrl(`/api/v1/search-user`), { keyword });
            setUser(searchResponse.data);
        } catch (err) {
            console.log(err);
        }
    };

    const fetchData = async (userID) => {
        try {
            const response = await axios.post(baseUrl(`/api/v1/fetch-user`), { user: userID });
            setLoggedUserData(response.data);
        } catch (err) {
            console.log(err);
        }
    };

    const addFriend = async (friend_uuid) => {

        try {

            const res = await axios.post(baseUrl(`/api/v1/friends/add-friend`), {
                cookieUser, friend_uuid
            });

            if (res.data.status === "success") {
                setUserAddServerResponse(res.data.response);
                setErr(false);
            } else {
                setErr(true);
                setUserAddServerResponse(res.data.err);
            }

        } catch (Exception) {

            console.error(Exception);
        }
    };

    const onEmojiClick = (emojiData) => {
        setMessageText((prevValue) => prevValue + emojiData.emoji);
    };

    const sendMessageBtnPressTO = (event) => {
        if (event.key === 'Enter') {
            sendMessage()
        }
    }

    const addToFavorite = async () => {

        setHardIsLoading(true);

        try {
            const response = await axios.post(baseUrl(`/api/v1/friends/add-to-favorite`), { user: cookieUser, friend: friendIdRef.current });

            console.log(response.data);

            if (response.data.status == 200) {

                setTimeout(() => {
                    fetchFavoriteFriends(cookieUser);
                    setHardIsLoading(false);
                }, 1000);
            }

        } catch (Exception) {

            console.error(Exception);
        }
    }

    const fetchFavoriteFriends = async (uuid) => {
        try {
            await axios.get(baseUrl(`/api/v1/fetch-favorite-friends/${uuid}`))
                .then(response => {
                    setFvFriends(response.data);
                    setTimeout(() => {
                        setHardIsLoading(false);
                    }, 2000);
                })
                .catch(error => {
                    console.log(error);
                })
        } catch (err) {
            console.log(err);
        }
    }


    useEffect(() => {

        if (replayMessage && inputRef.current) {
            inputRef.current.focus();
            const length = inputRef.current.value.length;
            inputRef.current.setSelectionRange(length, length);
        }

    }, [replayMessage, typingStatus[selectedFriendId]]);

    return (
        <div className={`${theme === 'light' ? 'bg-white' : 'bg-[#121212]'} overflow-hidden`}>
            <div className="flex flex-col md:flex-row h-screen">

                <div
                    ref={sidebarRef}
                    className={`relative ${theme === 'light' ? 'border-gray-200' : 'border-[#2B2B2B]'} pt-2 custom-scrollbar border-r`}
                    style={{ width: `${sidebarWidth}px` }}
                >
                    <LoggedUserProfileView
                        data={loggedUserData}
                        open_model={openModal}
                        logged_user={cookieUser}
                        user_image={user_image}
                        user_white={user_white}
                    />

                    <div onClick={() => { setOpenModel(true) }} className={`absolute bottom-4 shadow-xl right-4 z-50  ${theme === 'light' ? 'bg-gray-200 hover:bg-gray-300' : 'bg-[#2b2b2b] hover:bg-[#1f1f1f] border border-[#121212]'} z-50 flex items-center justify-between p-3 rounded-full cursor-pointer`}>
                        <BiMessageSquareDetail className={`${theme === 'light' ? 'text-[#121212]' : 'text-white'} text-2xl`} />
                    </div>

                    <div onClick={toggleTheme} className={`absolute right-4 bottom-[74px] bg-[#2b2b2b] shadow-xl z-50 ${theme === 'light' ? 'bg-gray-200 hover:bg-gray-300' : 'bg-[#2b2b2b] hover:bg-[#1f1f1f]  border border-[#121212]'} p-3 rounded-full cursor-pointer  transition-all duration-300 ease-in-out`}>
                        {theme === 'light' ? <MdOutlineNightlight className='text-[#2b2b2b] text-2xl' /> : <MdOutlineLightMode className='text-white text-2xl' />}
                    </div>

                    <span className={`${theme === 'light' ? 'text-[#121212]' : 'text-white'} px-2 pt-6 text-xl SF-pro-medium`}>Chats</span>
                    <div className="relative pb-3 pt-2 mx-2">
                        <input
                            onChange={(e) => { e.preventDefault(); setSearchTextValue(e.target.value) }}
                            className={`w-full py-3 pl-11 ${theme === 'light' ? 'bg-gray-100 placeholder:text-gray-500 text-black' : 'bg-[#2B2B2B] text-white'} SF-pro-regular rounded-md focus:outline-none `}
                            placeholder="Search friends..."
                            type="text"
                            id="friendSearchInput"
                        />
                        <IoSearchOutline
                            className={`absolute left-3 text-xl ${theme === 'light' ? 'text-gray-500' : 'text-gray-400'}`}
                            style={{ top: "22px" }}
                        />
                    </div>

                    <div className="cursor-pointer " style={{ width: '100%' }}>
                        <div className={friends.length > 0 ? null : "hidden"}>
                            <TabGroup>
                                <div className="flex justify-between items-center mr-2">
                                    <TabList className="flex items-center gap-3 ml-2">
                                        <Tab
                                            className={`${activeTab === 0
                                                ? theme === 'dark'
                                                    ? 'bg-[#2B2B2B] text-white'
                                                    : 'bg-gray-100 text-gray-700'
                                                : theme === 'dark'
                                                    ? 'text-gray-400'
                                                    : 'text-gray-600'
                                                } py-1 px-3 rounded-md outline-none`}
                                            onClick={() => setActiveTab(0)}
                                        >
                                            <span className="text-sm">Recent</span>
                                        </Tab>

                                        <Tab
                                            className={`${activeTab === 1
                                                ? theme === 'dark'
                                                    ? 'bg-[#2B2B2B] text-white'
                                                    : 'bg-gray-100 text-gray-700'
                                                : theme === 'dark'
                                                    ? 'text-gray-400'
                                                    : 'text-gray-600'
                                                } py-1 px-3 rounded-md outline-none`}
                                            onClick={() => setActiveTab(1)}
                                        >
                                            <span className="text-sm">Favorite</span>
                                        </Tab>
                                    </TabList>
                                    <div onClick={() => { loadAddedFriends(cookieUser) }} className={`${theme === 'light' ? 'bg-gray-100' : 'bg-[#2b2b2b]'} p-2 rounded-full`}>
                                        <IoMdRefresh className={`${theme === 'light' ? '' : 'text-white'}`} />
                                    </div>
                                </div>

                                <div
                                    className="px-2 py-2 overflow-y-scroll max-h-[80vh]"
                                    ref={sidebarContainer}
                                    style={{
                                        scrollbarWidth: 'none',
                                        msOverflowStyle: 'none'
                                    }}
                                >
                                    <TabPanels className={`mt-2`}>
                                        <TabPanel>
                                            <AnimatePresence mode="popLayout">
                                                {
                                                    friends
                                                        .filter(friend => friend.USERNAME.toLowerCase().includes(textValue.toLowerCase()))
                                                        .map(friend => (
                                                            <Friend
                                                                key={friend.UUID}
                                                                friend={friend}
                                                                setSelectUser={setSelectUser}
                                                                handlePersonClick={handlePersonClick}
                                                                selected_person={selectedFriendId || friendIdRef.current}
                                                                typingStatus={typingStatus}
                                                                unreadCount={unreadCounts[friend.UUID] || 0}
                                                                isActive={selectedFriendId === friend.UUID}
                                                            />
                                                        ))
                                                }
                                            </AnimatePresence>
                                        </TabPanel>

                                        <TabPanel>
                                            <AnimatePresence mode="popLayout">
                                                {
                                                    fvFriends
                                                        .filter(fv => fv.USERNAME.toLowerCase().includes(textValue.toLowerCase()))
                                                        .map(fvFriend => (
                                                            <Friend
                                                                key={fvFriend.UUID}
                                                                friend={fvFriend}
                                                                setSelectUser={setSelectUser}
                                                                handlePersonClick={handlePersonClick}
                                                                selected_person={selectedFriendId || friendIdRef.current}
                                                                typingStatus={typingStatus}
                                                                unreadCount={unreadCounts[fvFriend.UUID] || 0}
                                                                isActive={selectedFriendId === fvFriend.UUID}
                                                            />
                                                        ))
                                                }
                                            </AnimatePresence>
                                        </TabPanel>
                                    </TabPanels>
                                </div>

                            </TabGroup>
                        </div>

                        <div
                            className={`mx-2 flex flex-col gap-1 ${friends.length > 0 ? "hidden" : null}`}
                        >
                            <span className="text-gray-600 text-xs text-center animate-pulse flex-wrap mt-2">
                                Connect instantly by clicking below – start meaningful conversations, share your thoughts, and stay in touch with friends in real time. It’s simple, fast, and completely free to use.
                            </span>
                            <div className="flex justify-center mt-1">
                                <div className="pt-6">
                                    <button onClick={() => { setOpenModel(true) }} className="bg-[#2B2B2B] py-3 px-5 rounded-full text-white">Connect with Friends</button>
                                </div>
                            </div>
                        </div>


                        {openModel && (
                            <div className="fixed inset-0 z-40 bg-black/30 backdrop-blur-sm flex items-center justify-center">
                                <dialog open className="modal z-50">
                                    <div className={`modal-box ${theme === 'light' ? ' bg-white text-black' : 'bg-[#2b2b2b] text-white'}`}>
                                        <form method="dialog">
                                            <button
                                                onClick={() => setOpenModel(false)}
                                                className="btn btn-sm btn-circle btn-ghost absolute right-2 top-2"
                                            >
                                                ✕
                                            </button>
                                        </form>
                                        <h3 className="text-md pb-3">Start a new Chat Add a new friend</h3>
                                        <span className={`pt-1 text-sm SF-pro-regular ${theme === 'light' ? 'text-gray-600' : 'text-gray-400'}`}>
                                            Easily connect and chat with your friends. View your contacts, see who's online, and start conversations instantly in a simple, organized friend list.
                                        </span>
                                        <div className="mt-4 grid">
                                            <input
                                                type="text"
                                                className={`py-3 px-4  rounded-md placeholder:text-sm ${theme == 'light' ? 'text-black bg-gray-100 placeholder:text-gray-600 border border-gray-200' : 'text-white bg-[#121212] placeholder:text-gray-400'} outline-none`}
                                                placeholder="Search your friend using username"
                                                onChange={searchUser}
                                            />
                                        </div>
                                        {
                                            user.length === 1 &&
                                            <div
                                                className={`${theme === 'light' ? 'bg-gray-100 border border-gray-200' : 'bg-[#121212]'} cursor-pointer flex justify-between mt-2 px-2 gap-4 py-3 rounded-md`}

                                            >
                                                <div className="flex gap-1">
                                                    <div>
                                                        <img className={`w-12 h-12 mr-1 rounded-full ${theme === 'light' ? 'bg-gray-200 ' : 'bg-[#2b2b2b]'}`} src={!user[0].PROFILE_IMAGE_URL ? (theme === 'light' ? user_image : user_white) : `http://localhost:5000${user[0].PROFILE_IMAGE_URL}`} />

                                                    </div>
                                                    <div className="flex flex-col justify-center">
                                                        <span className={`${theme === 'light' ? 'text-gray-700' : 'text-white'}`}>
                                                            {user[0].USERNAME ? user[0].USERNAME : 'Loading...'}
                                                        </span>
                                                        <span className={`${theme === 'light' ? 'text-gray-700' : 'text-white'} text-xs`}>
                                                            {user[0].EMAIL ? user[0].EMAIL : 'Loading...'}
                                                        </span>
                                                    </div>
                                                </div>
                                                <div className="flex justify-end items-center mr-5">
                                                    <LuUserRoundPlus
                                                        className={`text-xl ${theme === 'light' ? 'hover:bg-gray-200 text-black' : 'hover:bg-[#2b2b2b] text-white'} rounded-full w-10 h-10 p-2 `}
                                                        onClick={() => { addFriend(user[0].UUID) }}
                                                    />
                                                </div>
                                            </div>
                                        }

                                        {
                                            userAddServerResponse && <div
                                                className={`py-3 px-2 flex ${theme === 'light' ? 'bg-gray-100 border border-gray-200' : 'bg-[#121212]'} rounded-md  justify-start items-center mt-1`}
                                            >
                                                <span
                                                    className={`${err ? "text-red-600" : theme === 'light' ? 'text-gray-700' : 'text-white'} text-sm`}
                                                >
                                                    {userAddServerResponse}
                                                </span>
                                            </div>
                                        }
                                    </div>
                                </dialog>
                            </div>
                        )}

                    </div>
                    <div
                        className={`absolute right-0 top-0 bottom-0 w-1 cursor-col-resize ${theme === 'light' ? 'hover:bg-gray-300 active:bg-gray-400' : 'hover:bg-[#2B2B2B] active:bg-[#2B2B2B]'}`}
                        onMouseDown={startResizing}
                    />
                </div>

                {
                    selectUser ?
                        <div
                            className="flex-1 flex flex-col"
                            style={{ width: `calc(100% - ${sidebarWidth}px)` }}
                        >
                            <div className={`flex items-center justify-between px-3 py-2 border-b  relative ${theme === 'light' ? 'bg-white border-gray-200' : 'bg-[#121212] border-[#2B2B2B]'}`}>

                                <div className="flex items-center cursor-pointer" onClick={() => {
                                    if (profileView == true) setProfilePreview(false); else setProfilePreview(true);
                                }} >

                                    <img className={`w-12 h-12 mr-2 rounded-full ${theme === 'light' ? 'bg-gray-100' : 'bg-[#2b2b2b]'}`} src={!selectProfile.PROFILE_IMAGE_URL ? (theme === 'light' ? user_image : user_white) : selectedUserProfileImage} />

                                    <div className="flex flex-col">
                                        <span className={`p-0 m-0 ${theme === 'light' ? 'text-[#121212]' : 'text-white'} `}>
                                            {selectProfile ? `${selectProfile.USERNAME}` : "Loading..."}
                                        </span>
                                        <span className={`text-sm ${theme === 'light' ? 'text-gray-500' : 'text-gray-400'}  `}>
                                            {
                                                selectProfile.STATUS === 'Online' ? 'Online' : `Last seen ${formatLastSeenSriLanka(selectProfile.LAST_LOGIN)}`
                                            }
                                        </span>
                                    </div>
                                </div>

                                {
                                    profileView && (
                                        <ProfilePreview
                                            selectFriend={selectProfile}
                                            set_media_asset_preview={setShowMediaAssetPreview}
                                            show_media_asset_preview={showMediaAssetPreview}
                                            selected_user_profile_image={selectedUserProfileImage}
                                            message={message}
                                        />
                                    )
                                }


                                <div className="flex items-center gap-2">
                                    {
                                        hardIsLoading ?
                                            <div className="bg-[#2b2b2b] px-2 py-2 flex justify-center items-center rounded-full">
                                                <span className="loading text-white loading-spinner loading-md"></span>
                                            </div>
                                            :
                                            <div
                                                className="bg-[#2b2b2b] p-2 cursor-pointer rounded-full tooltip tooltip-bottom"
                                                data-tip="Add to a Favorite"
                                                onClick={addToFavorite}
                                            >
                                                <FaRegHeart className="text-white text-xl" />
                                            </div>
                                    }
                                </div>
                            </div>


                            <div className={`flex-1 ${theme === 'light' ? 'light-background-chat-wallpaper' : 'dark-background-chat-wallpaper'} overflow-y-auto`} onScroll={handleScroll} ref={chatContainer}
                                onClick={() => { if (profileView) setProfilePreview(false); if (file) setFile(null); }}
                            >
                                {message.length > 0 &&
                                    <Message
                                        message={message}
                                        user={cookieUser}
                                        is_model_open={isModalOpen}
                                        open_image_preview_model={openImagePreviewModel}
                                        close_image_preview_model={closeImagePreviewModel}
                                        model_image={modalImage}
                                        selected_user={selectedFriendId || friendIdRef.current}
                                        websocket={ws}
                                        message_array={setMessage}
                                        setReplayMessage={setReplayMessage}
                                        setReplayMessageChatId={setReplayMessageChatId}
                                        user_data={selectProfile}
                                        typing={typingStatus[selectedFriendId]}
                                        message_status={messageStatus}
                                        userAtBottom={isUserAtBottom}
                                        handleScrollToBottom={handleScrollToBottom}
                                    />
                                }
                            </div>

                            <div className={`p-2 border-t ${theme === 'light' ? 'border-gray-300 bg-white' : 'border-[#2B2B2B] bg-[#121212]'}  relative`}>

                                {file && <FilePreview file={file} />}

                                <div className="flex items-center relative">
                                    <input type="file" id="fileChoose" onChange={(e) => { setFile(e.target.files[0]) }} className="hidden " accept="image/*, video/*" />
                                    <div className={`flex-1 rounded-md flex flex-col items-end relative`}>
                                        {replayMessage && (
                                            <div
                                                className="z-20 w-[94%]"
                                            >
                                                <div className={`relative ${theme === 'light' ? 'bg-gray-100 border-green-500 text-black' : 'bg-[#1e1e1e] border-green-500 text-white'} p-2 pl-3 pr-10 rounded-md border-l-4 mb-2 shadow-lg`}>
                                                    {(() => {

                                                        const repliedMsg = message.find(msg => msg.CHAT_ID === replayMessageChatId);
                                                        if (!repliedMsg) return <p className="text-sm SF-pro-regular text-gray-400">Original message not found.</p>;

                                                        return (
                                                            <div className="flex flex-col gap-1">
                                                                <span className="text-xs text-green-400 SF-pro-medium">
                                                                    {selectProfile.USERNAME}
                                                                </span>

                                                                {repliedMsg.MESSAGE && (
                                                                    <p className={`text-sm SF-pro-regular ${theme === 'light' ? 'text-black' : 'text-gray-200'} truncate`}>
                                                                        {repliedMsg.MESSAGE}
                                                                    </p>
                                                                )}

                                                                {repliedMsg.IMAGE_URL && (
                                                                    <img
                                                                        src={
                                                                            repliedMsg.IMAGE_URL.startsWith("blob:")
                                                                                ? repliedMsg.IMAGE_URL
                                                                                : `http://localhost:5000${repliedMsg.IMAGE_URL}`
                                                                        }
                                                                        alt="Replied to"
                                                                        className="w-[100px] h-[70px] object-cover rounded mt-1 border border-[#2b2b2b]"
                                                                    />
                                                                )}
                                                            </div>
                                                        );
                                                    })()}
                                                    <span
                                                        onClick={() => setReplayMessage(false)}
                                                        className="absolute top-2 right-2 cursor-pointer"
                                                    >
                                                        <IoMdClose className={`${theme === 'light' ? 'bg-gray-200 text-black hover:bg-gray-300' : 'bg-[#2b2b2b] text-white hover:bg-[#3a3a3a]'} p-1 rounded-full text-xl `} />
                                                    </span>
                                                </div>
                                            </div>
                                        )}

                                        <div className="flex justify-between items-center w-full">


                                            {
                                                showPicker ?
                                                    <IoMdClose
                                                        className="text-2xl text-red-500 p-2 w-10 h-10 rounded-full mr-3 cursor-pointer"
                                                        onClick={() => { setShowPicker(!showPicker) }}
                                                    />
                                                    :
                                                    <BsEmojiSmile
                                                        className={`text-2xl ${theme === 'light' ? 'text-gray-700 hover:bg-gray-200' : 'text-gray-500 hover:bg-[#2b2b2b]'} p-2  w-10 h-10  rounded-full mr-3 cursor-pointer`}
                                                        onClick={() => { setShowPicker(!showPicker) }}
                                                    />
                                            }

                                            {
                                                showPicker &&
                                                <div className="absolute bottom-16">
                                                    <EmojiPicker onEmojiClick={onEmojiClick} theme={theme === 'light' ? 'light' : 'dark'} className="shadow-lg bg-[#121212]" />
                                                </div>
                                            }


                                            {
                                                file === null ? (
                                                    <label htmlFor="fileChoose" className={`mr-2 p-2 w-9 h-9 ${theme === 'light' ? 'hover:bg-gray-200 text-gray-700' : 'hover:bg-[#2b2b2b] text-gray-500'} text-xl cursor-pointer flex justify-center items-center  rounded-full`}>
                                                        <ImAttachment />
                                                    </label>
                                                ) : (

                                                    <IoMdClose onClick={() => { setFile(null) }} className="mr-2 p-2 w-9 h-9 text-xl cursor-pointer flex justify-center items-center text-red-500 rounded-full" />

                                                )
                                            }

                                            <input
                                                ref={inputRef}
                                                value={messageText}
                                                onChange={onChangeText}
                                                onKeyUp={sendMessageBtnPressTO}
                                                className={`w-full bg-transparent overflow-y-auto flex-wrap outline-none SF-pro-regular ${theme === 'light' ? 'text-black' : 'text-white'}`}
                                                placeholder="Type a message..."
                                            />


                                            {
                                                messageText.length > 0 || file ?
                                                    <span
                                                        className=" p-2 rounded-full ml-3 cursor-pointer"
                                                        onClick={sendMessage}
                                                    >
                                                        <BsSendArrowUp className={`${theme === 'light' ? 'text-black' : 'text-white'}  text-2xl`} />
                                                    </span>
                                                    :
                                                    <div className={`${theme === 'light' ? 'bg-white' : 'bg-[#121212]'} rounded-full flex justify-center items-center`}>
                                                        <span className={`loading loading-infinity m-2 p-2 ${theme === 'light' ? 'text-[#121212]' : 'text-white'} loading-md`}></span>
                                                    </div>
                                            }
                                        </div>
                                    </div>


                                </div>
                            </div>
                        </div>
                        :
                        <div className="flex justify-center flex-col w-screen items-center">
                            <h1 className={`${theme === 'light' ? 'text-[#121212]' : 'text-white'} text-3xl SF-pro-bold`}>Convo Chat</h1>
                            <span className={`${theme === 'light' ? 'text-gray-700' : 'text-gray-400'} SF-pro-regular pt-3 w-96 text-center animate-pulse`}>Connect instantly by clicking below – start meaningful conversations, share your thoughts, and stay in touch with friends in real time. It’s simple, fast, and completely free to use.</span>
                            <div className="pt-6">
                                <button onClick={() => { setOpenModel(true) }} className={`${theme === 'light' ? 'bg-gray-200 text-gray-500 hover:bg-gray-300' : 'bg-[#2B2B2B] text-white'} py-3 px-5 rounded-full `}>Connect with Friends</button>
                            </div>
                            <span className="pt-2 text-gray-500 text-sm">Chamod Dilshan | Empowering Sri Lanka’s Digital Future {theme === 'light' ? '🖤' : '🤍'}</span>
                        </div>
                }
            </div>
        </div >
    );
};

export default Chat;
