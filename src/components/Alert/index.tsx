import clsx from 'clsx';
import { Panel } from '../Panel';
import './styles.css';

type AlertVariant = 'info' | 'success' | 'warning' | 'error';

interface Props {
  variant?: AlertVariant;
  title?: string;
  children: React.ReactNode;
  className?: string;
}

const variantIcons: Record<AlertVariant, string> = {
  info: 'ℹ',
  success: '✓',
  warning: '⚠',
  error: '✕',
};

export const Alert = ({ variant = 'info', title, children, className }: Props) => {
  return (
    <Panel contentClassName={clsx('alert', `alert--${variant}`, className)}>
      <div className="alert__icon">
        {variantIcons[variant]}
      </div>
      <div className="alert__content">
        {title && <div className="alert__title">{title}</div>}
        <div className="alert__message">{children}</div>
      </div>
    </Panel>
  );
};
