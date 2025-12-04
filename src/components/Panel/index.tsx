import clsx from 'clsx';
import './styles.css';

interface Props {
  className?: string;
  title?: string;
  children: React.ReactNode;
}

export const Panel = ({ className, title, children }: Props) => {
  return (
    <div className={clsx('panel', className)}>
      {title && <div className="panel__title">{title}</div>}
      <div className="panel__content">
        {children}
      </div>
    </div>
  );
};
