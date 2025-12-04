import clsx from 'clsx';
import './styles.css';

interface Props {
  className?: string;
  title?: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
}

export const Panel = ({ className, title, children, footer }: Props) => {
  return (
    <div className={clsx('panel', className)}>
      {title && <div className="panel__title">{title}</div>}
      <div className="panel__content">
        {children}
      </div>
      {footer && <div className="panel__footer">{footer}</div>}
    </div>
  );
};
