'use client'

import Image from 'next/image'
import { useFormStatus } from 'react-dom'
import { signInWithGoogle } from '@/app/login/actions'
import { montserrat } from '../fonts'

function SubmitButton({ label, loadingLabel }: { label: string; loadingLabel: string }) {
  const { pending } = useFormStatus()

  return (
    <button
      type="submit"
      disabled={pending}
      aria-busy={pending}
      data-fig="662:14426"
      className={`${montserrat.className} flex h-[60px] w-[305px] max-w-full items-center justify-center gap-2 rounded-lg bg-[#FFEA9E] px-6 py-4 text-[22px] font-bold leading-7 text-[#00101A] transition hover:brightness-95 disabled:cursor-not-allowed disabled:opacity-70`}
    >
      <span>{pending ? loadingLabel : label}</span>
      {pending ? (
        <span
          aria-hidden
          className="h-6 w-6 animate-spin rounded-full border-2 border-[#00101A]/30 border-t-[#00101A]"
        />
      ) : (
        <Image src="/images/login/google.svg" alt="" width={24} height={24} />
      )}
    </button>
  )
}

/** Nút đăng nhập Google — submit form gọi server action signInWithGoogle. */
export function GoogleLoginButton({
  label,
  loadingLabel,
}: {
  label: string
  loadingLabel: string
}) {
  return (
    <form action={signInWithGoogle}>
      <SubmitButton label={label} loadingLabel={loadingLabel} />
    </form>
  )
}
