const renderMessageWithLinks = (text) => {
     
     const urlRegex = /((https?:\/\/)?(www\.)?[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}(\/[^\s]*)?)/g;
     const elements = [];
     let lastIndex = 0;

     let match;

     while ((match = urlRegex.exec(text)) !== null) {
          const start = match.index;

          if (start > lastIndex) {
               elements.push(
                    <span key={lastIndex}>{text.slice(lastIndex, start)}</span>
               );
          }

          const rawUrl = match[0];
          const href = rawUrl.startsWith('http') ? rawUrl : `https://${rawUrl}`;

          elements.push(
               <a
                    key={start}
                    href={href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-400 underline hover:text-blue-600"
               >
                    {rawUrl}
               </a>
          );

          lastIndex = start + rawUrl.length;
     }

     if (lastIndex < text.length) {
          elements.push(
               <span key={lastIndex}>{text.slice(lastIndex)}</span>
          );
     }

     return elements;
};

export default renderMessageWithLinks;