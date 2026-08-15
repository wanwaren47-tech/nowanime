/**
 * IframeShell — renders the whole app inside a sandboxed iframe.
 * The sandbox omits `allow-top-navigation`, so any redirect attempted by
 * content inside stays contained: the user never leaves this page.
 */
const IframeShell = () => {
  const src = `${window.location.pathname}${
    window.location.search ? `${window.location.search}&` : "?"
  }embed=1${window.location.hash}`;

  return (
    <div className="fixed inset-0 w-full h-full bg-background">
      <iframe
        src={src}
        title="NowAnime"
        className="w-full h-full border-0 block"
        allow="autoplay; fullscreen; encrypted-media; picture-in-picture; clipboard-write"
        allowFullScreen
        sandbox="allow-scripts allow-same-origin allow-forms allow-modals allow-popups allow-popups-to-escape-sandbox allow-presentation allow-downloads"
      />
    </div>
  );
};

export default IframeShell;
