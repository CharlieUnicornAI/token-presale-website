import React, { useEffect, useState } from "react";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { useLocation } from "react-router-dom";
import { useTranslation } from "react-i18next";

import { useAppKit, useAppKitAccount } from "@reown/appkit/react";

const style = {
  link: "text-base font-normal z-10 hover:gradient-text transition-all duration-300 ease-in-out text-white",
};

const Navbar = () => {
  const { open } = useAppKit();
  const [active, setActive] = useState("home");
  const { pathname } = useLocation();
  const { address, isConnected, caipAddress, status } = useAppKitAccount();
  const { t } = useTranslation();

  const notify = () => toast.success("NO CONTENT FOUND");
  const downloadWhitepaper = () => {
    // Replace 'path-to-whitepaper.pdf' with your actual file path or URL
    const link = document.createElement("a");
    link.href = "/path-to-whitepaper.pdf"; // Adjust path as needed
    link.download = "whitepaper.pdf"; // Name of the downloaded file
    link.click();
  };

  useEffect(() => {
    if (pathname.includes("about")) {
      setActive("about");
    } else if (pathname.includes("staking")) {
      setActive("roadmap");
    } else {
      setActive("home");
    }
  }, [pathname]);

  return (
    <>
      <div className="w-[83%] mx-auto">
        <div className="[clip-path:polygon(0%_0.9em,_0.9em_0%,_100%_0%,_100%_calc(100%_-_0.9em),_calc(100%_-_0.9em)_100%,_0_100%)] w-full relative bg-[#444444] md:h-[120px] h-[350px] px-2">
          <div className="bg-[#1C1C1C] border-0 [clip-path:polygon(0%_0.9em,_0.9em_0%,_100%_0%,_100%_calc(100%_-_0.9em),_calc(100%_-_0.9em)_100%,_0_100%)] absolute inset-[1px] w-full flex flex-col md:flex-row items-center justify-between gap-4 md:gap-20 py-3 px-5">
            <div className="flex flex-col md:flex-row items-center gap-4 md:gap-20">
              <img
                src="logo (2).png"
                className="md:w-[100px] w-[120px]"
                alt="Logo"
              />
              <div className="flex flex-col md:flex-row gap-4 md:gap-7 md:text-left">
                <a
                  href="#"
                  className={`${style.link} ${
                    active === "home" && "gradient-text"
                  }`}
                  onClick={() => setActive("home")}
                >
                  {t("home")}
                </a>
                <a
                  href="https://charlieunicornai.eu/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`${style.link} ${
                    active === "about" && "gradient-text"
                  }`}
                  onClick={() => setActive("about")}
                >
                  {t("officialPage")}
                </a>
                <a
                  href="#tokenomics"
                  className={`${style.link} ${
                    active === "tokenomics" && "gradient-text"
                  }`}
                  onClick={() => setActive("tokenomics")}
                >
                  {t("tokenomics")}
                </a>
              </div>
            </div>
            <div className="relative [clip-path:polygon(0%_0.9em,_0.9em_0%,_100%_0%,_100%_calc(100%_-_0.9em),_calc(100%_-_0.9em)_100%,_0_100%)] bg-gradient h-[45px] w-[200px]  transition-all ease-in-out duration-300 hover:scale-105">
              <div className="bg-white inset-[3px] absolute [clip-path:polygon(0%_0.9em,_0.9em_0%,_100%_0%,_100%_calc(100%_-_0.9em),_calc(100%_-_0.9em)_100%,_0_100%)]">
                <button
                  className="absolute inset-[1px] flex items-center justify-center [clip-path:polygon(0%_0.9em,_0.9em_0%,_100%_0%,_100%_calc(100%_-_0.9em),_calc(100%_-_0.9em)_100%,_0_100%)] bg-gradient
                font-normal text-md text-white"
                  onClick={
                    isConnected ? () => open("Account") : () => open("Connect")
                  }
                >
                  {isConnected
                    ? address.substring(0, 4) +
                      "***" +
                      address.substring(address.length - 4, address.length)
                    : "Connect Wallet"}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default Navbar;
