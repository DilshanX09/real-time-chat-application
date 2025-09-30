import React from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { ThemeContext } from "../context/ThemeContext";
import { MdOutlineLightMode, MdOutlineNightlight } from "react-icons/md";
import axios from "axios";
import { motion } from "framer-motion";

export default function TwoFactorScreen() {

  const location = useLocation();
  const Navigate = useNavigate();
  const { uuid, email } = location.state;
  const { theme, toggleTheme } = React.useContext(ThemeContext);
  const [code, setCode] = React.useState(null);
  const [error, seterroror] = React.useState(false);

  const hideEmail = email.split("@")[0].slice(0, 4) + "*******@" + email.split("@")[1];

  const resendCode = () => {

    const id = localStorage.getItem('uuid');

    try {

      const response = axios.post('http://localhost:5000/api/v1/resend-otp', { id }, { withCredentials: true });
      console.log(response.data);
      
    } catch (Exception) {
      seterroror("Failed to resend OTP. Please try again later.");
      console.log('erroror in Resend OTP:', Exception);
    }
  }

  const handleSubmit = async () => {

    if (!code) seterroror("Please enter the verification code.");

    if (!uuid) seterroror("User ID is missing.");

    try {
      const response = await axios.post(
        "http://localhost:5000/api/v1/user/2FA-verify",
        {
          uuid,
          code,
        },
        { withCredentials: true }
      );

      if (response.data.erroror) {
        seterroror(response.data.erroror);
      } else if (response.data.message) {
        seterroror(response.data.message);
        setTimeout(() => {
          Navigate("/friend/chat/conversation");
        }, 1000);
      }
    } catch (Exception) {
      seterroror("Verification failed. Please check your code and try again.");
      console.log("erroror in Two Factor Authentication:", Exception);
    }
  };

  return (
    <>
      <div
        className={`flex flex-col h-screen px-5 py-20 sm:px-10 sm:py-10 md:px-30 lg:px-40 md:py-20 ${theme === "light" ? "bg-white" : "bg-[#121212]"
          } relative`}
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

        <h3
          className={`${theme === "light"
            ? "text-black border-black"
            : "text-white border-white"
            } SF-pro-medium text-2xl border-l-2  px-4`}
        >
          Two Factor Authentication
        </h3>

        <div className="py-10">
          <p
            className={`${theme === "light" ? "text-black" : "text-gray-400"
              } SF-pro-regular text-[15px]`}
          >
            Email setup
          </p>
          <p
            className={`${theme === "light" ? "text-black" : "text-gray-400"
              } SF-pro-regular text-[15px]`}
          >
            We have sent a verification code to :
          </p>
          <p
            className={`${theme === "light" ? "text-black" : "text-white"
              } SF-pro-medium text-[18px]`}
          >
            {hideEmail}
          </p>
        </div>

        <div className="flex flex-col gap-5">
          <div>
            <span
              className={`${theme === "light" ? "text-gray-700" : "text-gray-400"
                }`}
            >
              1. Go to your inbox
            </span>
            <p
              className={`${theme === "light" ? "text-black" : "text-white"
                } SF-pro-regular`}
            >
              Can’t find the verification code ? Make sure to check your spam
              folder.
            </p>
          </div>

          <div>
            <span
              className={`${theme === "light" ? "text-gray-700" : "text-gray-400"
                }`}
            >
              2. Finish setup
            </span>
            <p
              className={`${theme === "light" ? "text-black" : "text-white"
                } SF-pro-regular`}
            >
              Enter the verification code we sent to your email. This code will
              be valid for 15 minutes.
            </p>
          </div>

          <div className="flex gap-3 items-center mt-4">
            <div
              className={`flex flex-col w-[80%] md:w-[30%] lg:w-[17%] gap-2 px-3 py-4 rounded-md ${theme === "light" ? "bg-[#f6f6f6]" : "bg-[#2b2b2b]"
                }`}
            >
              <input
                type="text"
                onChange={(e) => {
                  setCode(e.target.value);
                }}
                className={`bg-transparent outline-none px-0 py-0 ${theme === "light" ? "text-black" : "text-white"
                  }`}
                placeholder="One Time Passcode"
              />
            </div>

            <button
              onClick={handleSubmit}
              className={` px-5 py-[14px] rounded-md ${theme === "light"
                ? "bg-black text-white"
                : "bg-white text-black"
                }`}
            >
              Submit
            </button>
          </div>

          {error && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="fixed right-5 bottom-5 text-gray-500 cursor-pointer"
            >
              <span
                className={`${theme == "light"
                  ? "text-gray-700 bg-gray-200"
                  : "text-white bg-[#2b2b2b] "
                  } px-3 py-2 SF-pro-regular text-sm rounded-md`}
              >
                {error}
              </span>
            </motion.div>
          )}

          <span
            className={`${theme === "light" ? "text-gray-700" : "text-gray-400"
              }`}
          >
            Not received code ?{" "}
            <a
              onClick={resendCode}
              className={`${theme === "light" ? "text-black" : "text-white"
                } cursor-pointer`}
            >
              Resend code
            </a>
          </span>
        </div>
      </div>
    </>
  );
}
