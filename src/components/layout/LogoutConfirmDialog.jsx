import React, { Fragment } from 'react';
import { LogOut } from 'lucide-react';
import { Transition } from '@headlessui/react';

export const LogoutConfirmDialog = ({ isOpen, onCancel, onConfirm }) => (
  <Transition show={isOpen} as={Fragment}>
    <div className="fixed inset-0 z-[60] flex items-center justify-center px-4">
      <Transition.Child
        as={Fragment}
        enter="transition-opacity ease-out duration-200"
        enterFrom="opacity-0"
        enterTo="opacity-100"
        leave="transition-opacity ease-in duration-150"
        leaveFrom="opacity-100"
        leaveTo="opacity-0"
      >
        <div
          className="absolute inset-0 bg-ink-900/50 backdrop-blur-sm"
          onClick={onCancel}
          aria-hidden="true"
        />
      </Transition.Child>

      <Transition.Child
        as={Fragment}
        enter="transition ease-out duration-200"
        enterFrom="opacity-0 scale-95"
        enterTo="opacity-100 scale-100"
        leave="transition ease-in duration-150"
        leaveFrom="opacity-100 scale-100"
        leaveTo="opacity-0 scale-95"
      >
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="logout-dialog-title"
          className="relative w-full max-w-sm rounded-3xl border border-cream-300 bg-cream-50 p-6 text-center shadow-2xl shadow-ink-900/25"
        >
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-semantic-dangerLight text-semantic-danger">
            <LogOut className="h-5 w-5" strokeWidth={2} />
          </div>
          <h2 id="logout-dialog-title" className="mt-4 font-display text-h3 font-bold text-ink-900">
            Log Out dari akun?
          </h2>
          <div className="mt-6 grid grid-cols-2 gap-2.5">
            <button
              type="button"
              onClick={onCancel}
              className="h-11 rounded-2xl border border-cream-300 bg-cream-50 text-xs font-bold text-ink-600 transition-colors duration-200 hover:bg-cream-100 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ink-400"
            >
              Batal
            </button>
            <button
              type="button"
              data-testid="confirm-logout-btn"
              onClick={onConfirm}
              className="h-11 rounded-2xl bg-semantic-danger text-semantic-dangerLight text-xs font-bold shadow-sm transition-colors duration-200 hover:bg-semantic-danger/85 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-semantic-danger/50"
            >
              Ya, Log Out
            </button>
          </div>
        </div>
      </Transition.Child>
    </div>
  </Transition>
);
