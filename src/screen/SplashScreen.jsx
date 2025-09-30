import React, { useContext, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { MdOutlineLightMode, MdOutlineNightlight } from "react-icons/md";
import { ThemeContext } from "../context/ThemeContext";
import { welcomeScreenText } from "../constant/Text";
import Cookies from "js-cookie";
import "../App.css";
import baseUrl from "../methods/BaseUrl";
import getBrowserInfo from "../methods/GetDeviceInformation";
import axios from "axios";

function SplashScreen() {
  const Navigate = useNavigate();
  const [isLoading, setIsLoading] = React.useState(true);
  const [loadingStateMessage, setLoadingStateLoadingStateMessages] =
    React.useState("Loading...");
  const [text, setText] = React.useState(welcomeScreenText.text1);
  const { theme, toggleTheme } = useContext(ThemeContext);

  useEffect(() => {

    if ('Notification' in window) {
      Notification.requestPermission();
    }

    let uuid = Cookies.get("UUID");

    const fetchDeviceInfo = async (uuid) => {
      const info = await getBrowserInfo(uuid);
      await axios.post(baseUrl(`/api/v1/sessions/store-device-information`), { userId: info.userId, data: info });
    }

    const updateMessageAndRedirect = (newText, newMessage, redirectPath) => {
      setTimeout(() => {
        setText(newText);
        setLoadingStateLoadingStateMessages(newMessage);
        setTimeout(() => {
          setIsLoading(false);
          Navigate(redirectPath);
        }, 2000);
      }, 3000);
    };

    if (uuid) {
      fetchDeviceInfo(uuid);
      setTimeout(() => {
        updateMessageAndRedirect(
          welcomeScreenText.text2,
          "Redirecting to Chat history...",
          "/friend/chat/conversation"
        );
      }, 2000);
    } else {
      updateMessageAndRedirect(
        welcomeScreenText.text3,
        "Redirecting to Log in...",
        "/user/auth/v1/authenticate"
      );
    }
  }, []);

  return (
    <div
      className={`${theme === "light" ? "bg-white" : "bg-[#121212]"} relative`}
    >
      <div
        onClick={toggleTheme}
        className={`fixed right-5 top-5 bg-[#2b2b2b] ${theme === "light"
          ? "bg-gray-100 hover:bg-gray-200"
          : "bg-[#2b2b2b] hover:bg-[#1f1f1f]"
          } p-2 rounded-full cursor-pointer  transition-all duration-300 ease-in-out`}
      >
        {theme === "light" ? (
          <MdOutlineNightlight className="text-[#2b2b2b] text-2xl" />
        ) : (
          <MdOutlineLightMode className="text-white text-2xl" />
        )}
      </div>
      <div className="mx-auto h-screen flex-col flex items-center justify-center w-96">
        <span
          className={`${theme === "light" ? "light-loader" : "dark-loader"}`}
        ></span>
        {isLoading && (
          <>
            <span
              className={`text-lg ${theme === "light" ? "text-black" : "text-white"
                }`}
            >
              {loadingStateMessage}
            </span>
            <span className="mt-5 text-center text-sm text-gray-500 animate-pulse">
              {text}
            </span>
          </>
        )}

        <span
          className={`mt-5 SF-pro-medium px-3 py-1 text-sm  rounded-full ${theme === "light"
            ? "bg-gray-100 text-black"
            : "bg-[#2b2b2b] text-white"
            }`}
        >
          Convo Chat
        </span>

        <div className="pt-5 fixed bottom-2">
          <span className="text-gray-500 text-sm">
            Developed By Chamod Dilshan 🤍
          </span>
        </div>
      </div>
    </div>
  );
}

export default SplashScreen;
