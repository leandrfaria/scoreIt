import {createLocalizedPathnamesNavigation} from 'next-intl/navigation';
import {routing} from './routing';

// Lightweight wrappers around Next.js' navigation
// APIs that consider the routing configuration
export const {
  Link,
  redirect,
  usePathname,
  useRouter,
  getPathname
} = createLocalizedPathnamesNavigation(routing);
