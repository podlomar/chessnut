import './style.css';

interface Props {
  children: React.ReactNode;
  onClick: () => void;
}

export const Button = ({ children, onClick }: Props) => {
  return (
    <button className="button" onClick={onClick}>
      {children}
    </button>
  );
};
