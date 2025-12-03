export const Footer = () => {
  const year = new Date().getFullYear();

  return (
    <footer className="footer">
      <div className="container">
        <p className="footer__text">Chessnut Play by <a href="https://www.linkedin.com/in/martin-podlouck%C3%BD-5b415268/">Martin Podloucký</a></p>
      </div>
    </footer>
  );
}
