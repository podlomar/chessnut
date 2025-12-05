import clsx from 'clsx';
import './style.css';

interface Props {
  primary?: boolean;
  disabled?: boolean;
  children: React.ReactNode;
  onClick: () => void;
}

export const Button = ({ children, onClick, primary = false, disabled = false }: Props) => {
  return (
    <button
      className={clsx('button', { 'button--primary': primary })}
      onClick={onClick}
      disabled={disabled}
    >
      {children}
    </button>
  );
};
