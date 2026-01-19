import { ButtonHTMLAttributes, ReactNode } from 'react';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  isLoading?: boolean;
  children: ReactNode;
}

const variants = {
  primary: 'bg-accent text-primary hover:bg-yellow-400 hover:shadow-lg hover:shadow-accent/30',
  secondary: 'border-2 border-accent text-accent hover:bg-accent hover:text-primary',
  ghost: 'text-gray-300 hover:text-accent hover:bg-mystic-800'
};

const sizes = {
  sm: 'py-1 px-4 text-sm',
  md: 'py-2 px-6 text-base',
  lg: 'py-3 px-8 text-lg'
};

const Button = ({
  variant = 'primary',
  size = 'md',
  isLoading = false,
  children,
  className = '',
  disabled,
  ...props
}: ButtonProps) => {
  return (
    <button
      className={`
        font-semibold rounded-lg transition-all duration-300 active:scale-95
        disabled:opacity-50 disabled:cursor-not-allowed
        ${variants[variant]}
        ${sizes[size]}
        ${className}
      `}
      disabled={disabled || isLoading}
      {...props}
    >
      {isLoading ? (
        <span className="flex items-center justify-center space-x-2">
          <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
              fill="none"
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            />
          </svg>
          <span>로딩중...</span>
        </span>
      ) : (
        children
      )}
    </button>
  );
};

export default Button;
