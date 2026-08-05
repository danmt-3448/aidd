'use client'

import { useRouter } from 'next/navigation'
import { useSecretBox } from '../use-secret-box'
import { SecretBoxModal } from './secret-box-modal'
import { SecretBoxSpinner } from './secret-box-spinner'

/**
 * Connects the SecretBoxModal to live server state via useSecretBox().
 * Must be rendered inside a QueryProvider (see the /secret-box route).
 * onClose navigates back to /board per the clarified spec (J3-4YFIpMM).
 */
export function SecretBoxConnected() {
  const router = useRouter()
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

  function handleClose() {
    router.push('/board')
  }

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
        onClose={handleClose}
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
