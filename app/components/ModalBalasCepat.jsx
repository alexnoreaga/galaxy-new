import React, { Suspense } from 'react';
import { Await } from '@remix-run/react';
import { AccordionBalasCepat } from './AccordionBalasCepat';

export const ModalBalasCepat = ({ setBukaModalBalasCepat, data }) => {
  const handleCloseModalBalasCepat = () => {
    setBukaModalBalasCepat(false);
  };

  return (
    <>
      <div>
        <div className="relative z-10" aria-labelledby="modal-title" role="dialog" aria-modal="true">
          <div className="fixed inset-0 bg-gray-800 bg-opacity-75 transition-opacity" onClick={handleCloseModalBalasCepat}></div>

          <div className="fixed inset-0 z-10 w-screen overflow-y-auto">
            <div className="flex min-h-full items-center justify-center p-4 text-center sm:items-center sm:p-0">
              <div className="relative transform overflow-hidden rounded-lg bg-white text-left shadow-xl transition-all sm:my-22 sm:w-full sm:max-w-screen-xl">
                <div className="bg-white px-4 pb-4 pt-5 sm:p-6 sm:pb-4">
                  <div className="sm:flex sm:items-start">
                    <div className="mx-auto flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full bg-blue-100 sm:mx-0 sm:h-10 sm:w-10">
                      <svg
                        onClick={handleCloseModalBalasCepat}
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 24 24"
                        strokeWidth={1.5}
                        stroke="currentColor"
                        className="w-6 h-6 text-blue-800"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M10.34 15.84c-.688-.06-1.386-.09-2.09-.09H7.5a4.5 4.5 0 1 1 0-9h.75c.704 0 1.402-.03 2.09-.09m0 9.18c.253.962.584 1.892.985 2.783.247.55.06 1.21-.463 1.511l-.657.38c-.551.318-1.26.117-1.527-.461a20.845 20.845 0 0 1-1.44-4.282m3.102.069a18.03 18.03 0 0 1-.59-4.59c0-1.586.205-3.124.59-4.59m0 9.18a23.848 23.848 0 0 1 8.835 2.535M10.34 6.66a23.847 23.847 0 0 0 8.835-2.535m0 0A23.74 23.74 0 0 0 18.795 3m.38 1.125a23.91 23.91 0 0 1 1.014 5.395m-1.014 8.855c-.118.38-.245.754-.38 1.125m.38-1.125a23.91 23.91 0 0 0 1.014-5.395m0-3.46c.495.413.811 1.035.811 1.73 0 .695-.316 1.317-.811 1.73m0-3.46a24.347 24.347 0 0 1 0 3.46"
                        />
                      </svg>
                    </div>
                    <div className="mt-3 text-center sm:ml-4 sm:mt-0 sm:text-left">
                      <h3 className="text-base font-semibold leading-6 text-gray-900" id="modal-title">
                        Balas Cepat
                      </h3>
                      <div className="mt-2">
                        <div className="flex flex-wrap">
                          <Suspense fallback={<div>Loading content...</div>}>
                            <Await resolve={data}>
                              {(resolvedData) =>
                                resolvedData.map((item, index) => (
                                  <AccordionBalasCepat
                                    key={index}
                                    content={item?.fields[0]?.value}
                                    title={item?.fields[1]?.value}
                                  />
                                ))
                              }
                            </Await>
                          </Suspense>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="bg-gray-50 px-4 py-3 sm:flex sm:flex-row-reverse sm:px-6">
                  <button
                    onClick={() => setBukaModalBalasCepat((prev) => !prev)}
                    type="button"
                    className="mt-3 inline-flex w-full justify-center rounded-md bg-white px-3 py-2 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50 sm:mt-0 sm:w-auto"
                  >
                    Close
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};
