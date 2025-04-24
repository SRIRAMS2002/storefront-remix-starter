import { Link } from '@remix-run/react';
import { ShoppingBagIcon } from '@heroicons/react/24/outline';
import { SearchBar } from '~/components/header/SearchBar';
import { useScrollingUp } from '~/utils/use-scrolling-up';
import { classNames } from '~/utils/class-names';
import { useTranslation } from 'react-i18next';
import { UserIcon } from '@heroicons/react/24/solid';

export function Header({
  onCartIconClick,
  cartQuantity,
  isSignedIn, // <== passed as prop
  collections,
}: {
  onCartIconClick: () => void;
  cartQuantity: number;
  isSignedIn: boolean;
  collections: { id: string; slug: string; name: string }[];
}) {
  const isScrollingUp = useScrollingUp();
  const { t } = useTranslation();

  return (
    <header
      className={classNames(
        isScrollingUp ? 'sticky top-0 z-10 animate-dropIn' : '',
        'bg-gradient-to-r from-zinc-700 to-gray-900  transform shadow-xl',
      )}
    >
      <div className="bg-zinc-100 text-gray-600 shadow-inner text-center text-sm py-2 px-2 xl:px-0">
        <div className="max-w-6xl mx-2 md:mx-auto flex items-center justify-between">
          <div>
            <p className="hidden sm:block">
              {t('vendure.exclusive')}{' '}
              <a
                href="https://github.com/vendure-ecommerce/storefront-remix-starter"
                target="_blank"
                className="underline"
              >
                {t('vendure.repoLinkLabel')}
              </a>
            </p>
          </div>
          <div>
            <Link
              to={isSignedIn ? '/account' : '/sign-in'}
              className="flex space-x-1"
            >
              <UserIcon className="w-4 h-4" />
              <span>
                {isSignedIn ? t('account.myAccount') : t('account.signIn')}
              </span>
            </Link>
          </div>
        </div>
      </div>
      <div className="max-w-6xl mx-auto p-4 flex items-center space-x-4">
        <h1 className="text-white w-10">
          <Link to="/">
            <img
              src="/cube-logo-small.webp"
              width={40}
              height={31}
              alt={t('commmon.logoAlt')}
            />
          </Link>
        </h1>
        <div className="flex space-x-4 hidden sm:block">
          {collections.map((collection) => (
            <Link
              className="text-sm md:text-base text-gray-200 hover:text-white"
              to={`/collections/${collection.slug}`}
              prefetch="intent"
              key={collection.id}
            >
              {collection.name}
            </Link>
          ))}
        </div>
        <div className="flex-1 md:pr-8">
          <SearchBar />
        </div>
        <div className="">
          <button
            className="relative w-9 h-9 bg-white bg-opacity-20 rounded text-white p-1"
            onClick={onCartIconClick}
            aria-label="Open cart tray"
          >
            <ShoppingBagIcon />
            {cartQuantity ? (
              <div className="absolute rounded-full -top-2 -right-2 bg-primary-600 min-w-6 min-h-6 flex items-center justify-center text-xs p-1">
                {cartQuantity}
              </div>
            ) : null}
          </button>
        </div>
      </div>
    </header>
  );
}
