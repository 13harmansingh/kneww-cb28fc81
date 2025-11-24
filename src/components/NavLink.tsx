import { Link, LinkProps, useLocation } from 'react-router-dom';
import { cn } from '@/lib/utils';

interface NavLinkProps extends LinkProps {
  activeClassName?: string;
  end?: boolean;
}

/**
 * Enhanced Link component with active state styling
 * Useful for navigation menus and sidebars
 */
export function NavLink({ 
  to, 
  className, 
  activeClassName = 'text-primary font-semibold',
  end = false,
  children,
  ...props 
}: NavLinkProps) {
  const location = useLocation();
  
  const isActive = end 
    ? location.pathname === to
    : location.pathname.startsWith(to as string);

  return (
    <Link
      to={to}
      className={cn(
        className,
        isActive && activeClassName
      )}
      aria-current={isActive ? 'page' : undefined}
      {...props}
    >
      {children}
    </Link>
  );
}
