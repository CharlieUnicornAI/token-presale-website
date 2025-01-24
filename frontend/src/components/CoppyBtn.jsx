/* eslint-disable react/prop-types */

import { AiOutlineCheck, AiOutlineCopy } from "react-icons/ai";
import { useState } from "react";

const CopyToClipboardButton = ({ textToCopy }) => {
  const [copySuccess, setCopySuccess] = useState(false);

  const copyTextToClipboard = (text) => {
    // Create a temporary textarea element
    const textarea = document.createElement("textarea");
    textarea.value = text;
    document.body.appendChild(textarea);

    // Select the text within the textarea
    textarea.select();
    textarea.setSelectionRange(0, textarea.value.length);

    // Copy the selected text to the clipboard
    document.execCommand("copy");

    // Clean up: remove the temporary textarea from the DOM
    document.body.removeChild(textarea);

    // Set copy success state to true and reset after 2 seconds
    setCopySuccess(true);
    setTimeout(() => {
      setCopySuccess(false);
    }, 2000);
  };

  return (
    <div className="relative flex items-center justify-center p-0 xl:p-2 rounded-xl bg-transparent  ">
      <button
        onClick={(e) => {
          e.preventDefault();
          copyTextToClipboard(textToCopy);
        }}
        className="flex justify-center items-center "
      >
        {copySuccess ? (
          <AiOutlineCheck className="text-white hover:text-[#c9c9c9] w-3 h-3 md:w-6 md:h-6" />
        ) : (
          <AiOutlineCopy className="text-white hover:text-[#cacaca] w-3 h-3 md:w-6 md:h-6" />
        )}
      </button>
    </div>
  );
};

export default CopyToClipboardButton;
