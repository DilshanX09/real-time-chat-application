class Validator {

     static isEmailValid(email) {

          if (!email) return "Please type your email address";
          else if (email.length > 100) return "Email must contain 100 characters";

          const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

          if (!emailRegex.test(email)) return "Please type valid email address";
     }

     static isPasswordValid(password) {

          if (!password) return "Please type your password";
          else if (password.length > 20 || password.length < 8) return "Password must contain 8 & 20 characters";

          const passwordRegex = /^(?=.*\d)(?=.*[a-z])(?=.*[A-Z]).{8,32}$/;

          if (!passwordRegex.test(password)) return "Please type valid password";

     }

     static isUsernameValid(username) {

          if (!username) return "Please type your username";
          else if (username.length > 20 || username.length < 8) return "username must contain 8 & 20 characters";

          const usernameRegex = /^[a-zA-Z0-9_.]+$/;

          if (!usernameRegex.test(username)) return "Please type valid username";
     }
}

module.exports = Validator;