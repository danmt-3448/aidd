'use client'

import { useSecretBox } from '../use-secret-box'
import { SecretBoxModal } from './secret-box-modal'
import { SecretBoxSpinner } from './secret-box-spinner'

/**
 * Connects the SecretBoxModal to live server state via useSecretBox().
 * Must be rendered inside a QueryProvider (see the /secret-box route).
 * Replaces the mock page shell as the production entry point.
 */
export function SecretBoxConnected() {
  const {
    unopened,
    currentBadge,
    isOpening,
    isLoading,
    stateError,
    openError,
    open,
    clearError,
  } = useSecretBox()

  if (isLoading) {
    return <SecretBoxSpinner />
  }

  if (stateError) {
    return (
      <p role="alert" className="text-center text-sm" style={{ color: '#FFEA9E' }}>
        Không tải được Secret Box. Vui lòng thử lại sau.
      </p>
    )
  }

  return (
    <div className="flex flex-col items-center gap-4">
      <SecretBoxModal
        unopened={unopened}
        currentBadge={currentBadge}
        isOpening={isOpening}
        onOpen={open}
      />
      {openError && (
        <p
          role="alert"
          className="cursor-pointer text-center text-sm"
          style={{ color: '#FFEA9E' }}
          onClick={clearError}
        >
          {openError}
        </p>
      )}
    </div>
  )
}
