import { motion } from 'framer-motion';

export default function FilePreview({ file }) {
     return (
          <>
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
                    className="max-w-[400px] max-h-[400px] rounded-lg bg-[#121212] border border-[#2B2B2B] shadow-xl p-2 fixed bottom-20 flex items-center justify-center overflow-hidden"
                    style={{ backdropFilter: "blur(10px)" }}
               >
                    {file.type.startsWith("image/") && (
                         <img
                              src={URL.createObjectURL(file)}
                              alt="file"
                              className="max-w-full max-h-full object-contain rounded-lg"
                              draggable={false}
                         />
                    )}

                    {file.type.startsWith("video/") && (
                         <video
                              controls
                              src={URL.createObjectURL(file)}
                              className="max-w-full max-h-full rounded-lg border-4 border-red-400 shadow-xl"
                              draggable={false}
                         />
                    )}
               </motion.div>
          </>
     );
}