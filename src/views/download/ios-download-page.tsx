"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

import { cn } from "@/lib/cn";
import {
  copyCurrentPageUrl,
  getIosDownloadContext,
  IOS_MOBILECONFIG_PATH,
  type IosDownloadContext
} from "@/lib/download/ios-download";

const COMMENTS = [
  { author: "jack", text: "Very good, easy to use" },
  {
    author: "Algernon",
    text: "I've been using this app for two years and it's 5 stars"
  },
  {
    author: "Lennon",
    text: "Very comfortable interface, recommended! !"
  },
  {
    author: "Ernest",
    text: "I believe that Prophet will do better and better"
  },
  {
    author: "Donahue",
    text: "There are many languages on it, I like it very much, it is very convenient"
  },
  {
    author: "Frederic",
    text: "The interface is clean and the market data is easy to read"
  },
  { author: "Geoffrey", text: "I like it very much, give a like" },
  {
    author: "Joseph",
    text: "A friend recommended it to me, it's very good, I appreciate it"
  },
  {
    author: "Raymond",
    text: "Great tool for following World Cup prediction markets"
  }
] as const;

const RATING_ROWS = [
  { label: "5", width: "90%" },
  { label: "4", width: "10%" },
  { label: "3", width: "4%" },
  { label: "2", width: "2%" },
  { label: "1", width: "1%" }
] as const;

const DEFAULT_CONTEXT: IosDownloadContext = {
  isMobile: false,
  isIos: false,
  isSafari: false,
  isWeChat: false,
  isQqInApp: false,
  needsInAppBrowserGuide: false,
  showCopyBar: false,
  downloadHref: null
};

export function IosDownloadPage() {
  const [context, setContext] = useState<IosDownloadContext>(DEFAULT_CONTEXT);
  const [showGuideOverlay, setShowGuideOverlay] = useState(false);
  const [showSafetyModal, setShowSafetyModal] = useState(false);
  const [copyMessage, setCopyMessage] = useState<string | null>(null);

  useEffect(() => {
    setContext(getIosDownloadContext(window.navigator.userAgent));
  }, []);

  const handlePageClick = useCallback(() => {
    if (context.needsInAppBrowserGuide) {
      setShowGuideOverlay(true);
    }
  }, [context.needsInAppBrowserGuide]);

  const handleCopyUrl = useCallback(async () => {
    const copied = await copyCurrentPageUrl();
    setCopyMessage(copied ? "Copied. Open in Safari to continue." : "Copy failed.");
    window.setTimeout(() => setCopyMessage(null), 2500);
  }, []);

  const downloadHref = useMemo(() => {
    if (context.showCopyBar) {
      return undefined;
    }
    if (context.downloadHref) {
      return context.downloadHref;
    }
    if (!context.isMobile) {
      return IOS_MOBILECONFIG_PATH;
    }
    return undefined;
  }, [context.downloadHref, context.isMobile, context.showCopyBar]);

  return (
    <div
      className={cn(
        "relative min-h-dvh cursor-pointer bg-[#00349a] pb-8",
        context.showCopyBar && "pb-24"
      )}
      onClick={handlePageClick}
    >
      <img
        src="/download/ios/bj.jpg"
        alt=""
        aria-hidden
        className="pointer-events-none fixed inset-0 -z-10 h-full w-full object-cover object-top"
      />

      <div className="relative mx-auto mt-20 w-[96%] max-w-[750px] rounded-t-[30px] bg-prophet-panel">
        {showSafetyModal ? (
          <div className="px-[5%] py-2.5" onClick={(event) => event.stopPropagation()}>
            <button
              type="button"
              className="w-full text-right text-sm font-semibold text-[#333]"
              onClick={() => setShowSafetyModal(false)}
            >
              close
            </button>
            <img
              src="/download/ios/0df0c_0_600_411.jpg"
              alt="Download step 1"
              className="h-auto w-full"
            />
            <p className="px-2.5 py-2.5 text-sm font-semibold">
              The first step , download the APP
            </p>
            <img
              src="/download/ios/0665a_1_600_411.jpg"
              alt="Download step 2"
              className="h-auto w-full"
            />
            <p className="px-2.5 py-2.5 text-sm font-semibold">
              The second step ,configure the APP
            </p>
            <img
              src="/download/ios/9179e_3_600_411.jpg"
              alt="Download step 3"
              className="h-auto w-full"
            />
            <p className="px-2.5 py-2.5 text-sm font-semibold">
              The third step ,Click the Install button in the upper right corner
            </p>
            <p className="px-2.5 py-5 text-sm font-semibold">
              The third step , Enter your password and install successful
            </p>
          </div>
        ) : (
          <>
        <main className="px-[5%] py-3">
          <section className="flex flex-wrap justify-between gap-3 border-b border-transparent pb-4">
            <div className="h-[92px] w-[92px] shrink-0 overflow-hidden rounded-[10px]">
              <img
                src="/download/ios/logo.png"
                alt="Prophet"
                width={92}
                height={92}
                className="h-full w-full object-cover"
              />
            </div>

            <div className="min-w-0 flex-1">
              <div className="mt-2 flex items-start justify-between gap-2">
                <strong className="block text-[20px] leading-snug text-[#111]">
                  Prophet
                </strong>
                <button
                  type="button"
                  className="inline-flex items-center text-right text-[13px] text-[#017afe]"
                  onClick={(event) => {
                    event.stopPropagation();
                    setShowSafetyModal(true);
                  }}
                >
                  <img
                    src="/download/ios/renzhen.png"
                    alt=""
                    width={17}
                    height={17}
                    className="mr-1 inline-block"
                    aria-hidden
                  />
                  Safety Certificate
                </button>
              </div>

              <div className="pt-5">
                {downloadHref ? (
                  <a
                    href={downloadHref}
                    className="inline-flex h-9 min-w-[104px] items-center justify-center rounded-full bg-[#017afe] px-5 text-[18px] text-white active:opacity-85"
                    onClick={(event) => event.stopPropagation()}
                  >
                    Get
                  </a>
                ) : (
                  <span className="inline-flex h-9 min-w-[104px] items-center justify-center rounded-full bg-[#017afe] px-5 text-[18px] text-white">
                    Get
                  </span>
                )}
              </div>
            </div>

            <div className="flex w-full justify-between pt-4">
              <div>
                <div className="text-[17px] font-bold text-[#8e8e93]">4.9 ★★★★★</div>
                <p className="text-[12px] text-[#d8d8d8]">19k scores</p>
              </div>
              <div className="text-center">
                <b className="block text-[17px] text-[#8e8e93]">42w+</b>
                <p className="text-[12px] text-[#d8d8d8]">installations</p>
              </div>
              <div className="text-right">
                <b className="block text-[17px] text-[#8e8e93]">4+</b>
                <p className="text-[12px] text-[#d8d8d8]">age</p>
              </div>
            </div>
          </section>

          <section className="flex flex-wrap items-start justify-between gap-4 border-y border-[#e5e5e5] py-[17px]">
            <div className="pl-2 text-center">
              <b className="block text-[48px] leading-none text-[#4c4c50]">5.0</b>
              <p className="text-[14px] font-bold text-[#8e8e93]">Out of 5 points</p>
            </div>
            <div className="min-w-0 flex-1">
              {RATING_ROWS.map((row) => (
                <div key={row.label} className="mb-1 flex items-center gap-2">
                  <span className="w-6 text-right text-[12px] text-[#8e8e93]">
                    {row.label}
                  </span>
                  <div className="h-[5px] flex-1 overflow-hidden rounded-full bg-[#e5e5e5]">
                    <div
                      className="h-full rounded-r-full bg-[#8e8e93]"
                      style={{ width: row.width }}
                    />
                  </div>
                </div>
              ))}
              <p className="mt-1 text-right text-[14px] text-[#8e8e93]">19k score</p>
            </div>
          </section>

          <section className="py-[17px]">
            <strong className="mb-3 block text-[20px] tracking-wide">
              Rating and Comments
            </strong>
            <ul>
              {COMMENTS.map((comment) => (
                <li
                  key={comment.author}
                  className="border-b border-[#e5e5e5] py-[6px] last:border-b-0"
                >
                  <span className="text-[12px] text-[#8e8e93]">{comment.author}</span>
                  <p className="text-left text-[12px] text-[#333]">{comment.text}</p>
                </li>
              ))}
              <li className="py-2 text-center">
                <button
                  type="button"
                  className="text-[12px] text-[#999]"
                  onClick={(event) => event.stopPropagation()}
                >
                  More comments
                </button>
              </li>
            </ul>
          </section>

          <section className="py-[17px]">
            <strong className="mb-3 block text-[20px] tracking-wide">information</strong>
            <ul>
              <li className="flex justify-between border-b border-[#e5e5e5] py-[6px]">
                <span className="text-[12px] text-[#8e8e93]">size</span>
                <p className="text-right text-[12px] text-[#333]">3.5 MB</p>
              </li>
              <li className="flex justify-between border-b border-[#e5e5e5] py-[6px]">
                <span className="text-[12px] text-[#8e8e93]">language</span>
                <p className="text-right text-[12px] text-[#333]">English</p>
              </li>
              <li className="flex justify-between border-b border-[#e5e5e5] py-[6px]">
                <span className="text-[12px] text-[#8e8e93]">age grading</span>
                <p className="text-right text-[12px] text-[#333]">Above 4 years old</p>
              </li>
              <li className="flex justify-between py-[6px]">
                <span className="text-[12px] text-[#8e8e93]">Copyright</span>
                <p className="text-right text-[12px] text-[#333]">© 2026 Prophet</p>
              </li>
            </ul>
          </section>
        </main>

        <footer className="bg-[#eee] px-[3%] py-[6px] text-[#a9a9a9]">
          <p className="text-[10px]">disclaimer：</p>
          <p className="indent-4 text-[10px]">
            The system of this network only provides the download and installation of
            the APP for the developers. The contents of the APP and matters related to
            the operation are the responsibility of the APP developers and have nothing
            to do with the system
          </p>
        </footer>
          </>
        )}
      </div>

      {showGuideOverlay ? (
        <div
          className="fixed inset-0 z-[11]"
          onClick={(event) => {
            event.stopPropagation();
            setShowGuideOverlay(false);
          }}
        >
          <img
            src="/download/ios/5cbc4_5_1242_2007.png"
            alt="Open in Safari"
            className="h-full w-full object-cover"
          />
        </div>
      ) : null}

      {context.showCopyBar ? (
        <div
          className="fixed inset-x-0 bottom-0 z-10 border-t border-[#ccc] bg-prophet-panel"
          onClick={(event) => event.stopPropagation()}
        >
          <div className="flex flex-col items-center gap-2 px-4 py-2.5">
            <button
              type="button"
              className="rounded-full bg-[#3399ff] px-5 py-2 text-center text-white"
              onClick={() => void handleCopyUrl()}
            >
              Click Copy to Browser to open
            </button>
            {copyMessage ? (
              <p className="text-center text-xs text-[#666]">{copyMessage}</p>
            ) : null}
          </div>
        </div>
      ) : null}
    </div>
  );
}
