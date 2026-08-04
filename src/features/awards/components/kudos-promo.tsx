import Image from 'next/image'

/**
 * SunKudos promo banner — dark card with image background.
 * Content from Figma node 335:12023 (mms_D1_Sunkudos).
 * Background: #0F0F0F + kudos-bg.png. Size: 1152×500px at desktop.
 * CTA link wired in integration phase.
 */
export function KudosPromo() {
  return (
    <section
      className="relative overflow-hidden"
      style={{
        backgroundColor: '#0F0F0F',
        borderRadius: '16px',
        minHeight: '500px',
      }}
      aria-label="Sun* Kudos — phong trào ghi nhận"
    >
      {/* Background image (Figma: MM_MEDIA_Kudos Background) */}
      <div className="pointer-events-none absolute inset-0">
        <Image
          src="/awards/kudos-bg.png"
          alt=""
          fill
          className="object-cover"
          style={{ objectPosition: 'right center', opacity: 0.7 }}
          sizes="1152px"
        />
      </div>

      {/* Content layout: left text + right QR */}
      <div
        className="relative z-10 flex flex-col gap-8 p-16 md:flex-row md:items-center md:justify-between"
      >
        {/* Left: headline + description + CTA */}
        <div className="flex flex-col" style={{ gap: '32px', maxWidth: '470px' }}>
          {/* Text block */}
          <div className="flex flex-col" style={{ gap: '16px' }}>
            {/* "Phong trào ghi nhận" label */}
            <p
              className="font-montserrat font-bold"
              style={{ fontSize: '24px', lineHeight: '32px', color: '#FFFFFF' }}
            >
              Phong trào ghi nhận
            </p>
            {/* "Sun* Kudos" headline */}
            <h2
              className="font-montserrat font-bold"
              style={{
                fontSize: 'clamp(36px, 4vw, 57px)',
                lineHeight: '64px',
                letterSpacing: '-0.25px',
                color: '#FFEA9E',
              }}
            >
              Sun* Kudos
            </h2>
            {/* Body text */}
            <p
              className="font-montserrat font-bold"
              style={{
                fontSize: '16px',
                lineHeight: '24px',
                letterSpacing: '0.5px',
                color: '#FFFFFF',
                textAlign: 'justify',
              }}
            >
              <strong>ĐIỂM MỚI CỦA SAA 2025</strong>
              <br />
              Hoạt động ghi nhận và cảm ơn đồng nghiệp - lần đầu tiên được diễn ra dành cho tất cả
              Sunner. Hoạt động sẽ được triển khai vào tháng 11/2025, khuyến khích người Sun* chia
              sẻ những lời ghi nhận, cảm ơn đồng nghiệp trên hệ thống do BTC công bố. Đây sẽ là
              chất liệu để Hội đồng Heads tham khảo trong quá trình lựa chọn người đạt giải.
            </p>
          </div>

          {/* CTA button — href wired in integration phase */}
          <div className="flex items-center" style={{ gap: '24px' }}>
            <a
              href="#"
              className="inline-flex items-center justify-center rounded-lg font-montserrat font-bold transition-opacity hover:opacity-90"
              style={{
                backgroundColor: '#FFEA9E',
                color: '#00101A',
                fontSize: '16px',
                lineHeight: '24px',
                padding: '12px 24px',
              }}
              aria-label="Khám phá Sun* Kudos ngay"
            >
              Khám phá ngay
            </a>
            <div className="relative" style={{ width: '40px', height: '40px' }}>
              <Image
                src="/awards/icon-kudos.svg"
                alt="Sun* Kudos icon"
                fill
                className="object-contain"
              />
            </div>
          </div>
        </div>

        {/* Right: QR / app store */}
        <div className="hidden shrink-0 flex-col items-center gap-4 md:flex">
          <div className="relative" style={{ width: '140px', height: '140px' }}>
            <Image
              src="/awards/kudos-qr.svg"
              alt="Mã QR Sun* Kudos"
              fill
              className="object-contain"
            />
          </div>
          <p
            className="font-montserrat font-bold tracking-widest"
            style={{ fontSize: '14px', lineHeight: '20px', color: '#FFFFFF' }}
          >
            KUDOS
          </p>
        </div>
      </div>
    </section>
  )
}
