/**
 * Inline spinner shown while the openSecretBox RPC is in flight.
 * Matches the golden brand color (#FFEA9E) from Figma tokens.
 */
export function SecretBoxSpinner() {
  return (
    <div className="flex h-full w-full items-center justify-center">
      <span
        role="status"
        aria-label="Opening"
        className="inline-block h-12 w-12 animate-spin rounded-full border-4 border-[#FFEA9E] border-t-transparent"
      />
    </div>
  )
}
