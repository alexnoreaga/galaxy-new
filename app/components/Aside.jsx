export function Aside({children, heading, id = 'aside'}) {
  return (
    <div aria-modal className="overlay" id={id} role="dialog">
      <button
        className="close-outside"
        onClick={() => {
          history.go(-1);
          window.location.hash = '';
        }}
      />
      <aside>
        <header className="flex items-center justify-between px-5 py-4 border-b border-gray-100 flex-shrink-0">
          <h2 className="text-base font-semibold text-gray-900 uppercase tracking-wider">{heading}</h2>
          <CloseAside />
        </header>
        <main className="flex-1 overflow-hidden flex flex-col min-h-0">{children}</main>
      </aside>
    </div>
  );
}

function CloseAside() {
  return (
    <a
      href="#"
      onClick={() => history.go(-1)}
      className="flex items-center justify-center w-8 h-8 rounded-lg hover:bg-gray-100 text-gray-500 hover:text-gray-800 transition-colors no-underline"
      aria-label="Close"
    >
      <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
      </svg>
    </a>
  );
}
