const showNotifications = (username, content, icon, image) => {
     if (Notification.permission === 'granted') {
          new Notification(username,
               {
                    body: image != null ? "image" : content,
                    icon: `http://localhost:5000${icon}`,
               }
          );
     } else {
          Notification.requestPermission().then(permission => {
               if (permission === 'granted') {
                    new Notification(username,
                         {
                              body: content || image ? "image" : content,
                              icon: `http://localhost:5000${icon}`,
                         }
                    );
               }
          });
     }
}

export default showNotifications;