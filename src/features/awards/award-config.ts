/**
 * Canonical award definitions for SAA 2025 (MoMorph screen zFYDgyj_pD).
 *
 * Single source of truth (DRY) consumed by:
 *  - Prize page  (/awards)         → <AwardsShowcase awards={AWARDS} />
 *  - Homepage 6-card grid (screen 11, future) → same AWARDS import
 *
 * `slug` / `hashtagAnchor` are the deep-link contract: Homepage card → `/awards#{slug}`.
 * Slugs are unique + kebab-case and MUST stay stable.
 *
 * Content is VN-primary (long-form marketing copy, no EN source provided) and lives
 * here as typed constants rather than i18n keys — deliberate YAGNI: fabricating EN
 * translations would be inventing data. Localize when real EN copy exists.
 */
import type { Award } from './types'

export const AWARDS: Award[] = [
  {
    slug: 'top-talent',
    title: 'Top Talent',
    navLabel: 'Top Talent',
    icon: '/awards/icon-target.svg',
    quantity: 10,
    quantityUnit: 'Cá nhân',
    prize: '7.000.000 VNĐ',
    description:
      'Giải thưởng Top Talent vinh danh những cá nhân xuất sắc toàn diện – những người không ngừng khẳng định năng lực chuyên môn vững vàng, hiệu suất công việc vượt trội, luôn mang lại giá trị vượt kỳ vọng, được đánh giá cao bởi khách hàng và đồng đội. Với tinh thần sẵn sàng nhận mọi nhiệm vụ tổ chức giao phó, họ luôn là nguồn cảm hứng, thúc đẩy động lực và tạo ảnh hưởng tích cực đến cả tập thể.',
    hashtagAnchor: 'top-talent',
    imageLeft: true,
  },
  {
    slug: 'top-project',
    title: 'Top Project',
    navLabel: 'Top Project',
    icon: '/awards/icon-target.svg',
    quantity: 10,
    quantityUnit: 'Dự án',
    prize: '7.000.000 VNĐ',
    description:
      'Giải thưởng Top Project vinh danh các tập thể dự án xuất sắc với kết quả kinh doanh vượt kỳ vọng, hiệu quả vận hành tối ưu và tinh thần làm việc tận tâm. Đây là các dự án có độ phức tạp kỹ thuật cao, hiệu quả tối ưu hóa nguồn lực và chi phí tốt, đề xuất các ý tưởng có giá trị cho khách hàng, đem lại lợi nhuận vượt trội và nhận được phản hồi tích cực từ khách hàng. Các thành viên tuân thủ nghiêm ngặt các tiêu chuẩn phát triển nội bộ trong phát triển dự án, tạo nên một hình mẫu về sự xuất sắc và chuyên nghiệp.',
    hashtagAnchor: 'top-project',
    imageLeft: false,
  },
  {
    slug: 'top-project-leader',
    title: 'Top Project Leader',
    navLabel: 'Top Project\nLeader',
    icon: '/awards/icon-target.svg',
    quantity: 10,
    quantityUnit: 'Cá nhân',
    prize: '7.000.000 VNĐ',
    description:
      'Giải thưởng Top Project Leader vinh danh những nhà quản lý dự án xuất sắc – những người hội tụ năng lực quản lý vững vàng, khả năng truyền cảm hứng mạnh mẽ, và tư duy "Aim High – Be Agile" trong mọi bài toán và bối cảnh. Dưới sự dẫn dắt của họ, các thành viên không chỉ cùng nhau vượt qua thử thách và đạt được mục tiêu đề ra, mà còn giữ vững ngọn lửa nhiệt huyết, tinh thần Wasshoi, và trưởng thành để trở thành phiên bản tinh hoa – hạnh phúc hơn của chính mình.',
    hashtagAnchor: 'top-project-leader',
    imageLeft: true,
  },
  {
    slug: 'best-manager',
    title: 'Best Manager',
    navLabel: 'Best Manager',
    icon: '/awards/icon-target.svg',
    quantity: 10,
    quantityUnit: 'Cá nhân',
    prize: '7.000.000 VNĐ',
    description:
      'Giải thưởng Best Manager vinh danh những nhà lãnh đạo tiêu biểu – người đã dẫn dắt đội ngũ của mình tạo ra kết quả vượt kỳ vọng, tác động nổi bật đến hiệu quả kinh doanh và sự phát triển bền vững của tổ chức. Dưới sự lãnh đạo của họ, đội ngũ luôn chinh phục và làm chủ mọi mục tiêu bằng năng lực đa nhiệm, khả năng phối hợp hiệu quả, và tư duy ứng dụng công nghệ linh hoạt trong kỷ nguyên số. Họ truyền cảm hứng để tập thể trở nên tự tin tràn đầy năng lượng, sẵn sàng đón nhận, thậm chí dẫn dắt tạo ra những thay đổi có tính cách mạng.',
    hashtagAnchor: 'best-manager',
    imageLeft: false,
  },
  {
    slug: 'signature-2025-creator',
    title: 'Signature 2025 Creator',
    navLabel: 'Signature 2025\nCreator',
    icon: '/awards/icon-target.svg',
    quantity: 10,
    quantityUnit: 'Cá nhân',
    prize: '7.000.000 VNĐ',
    description:
      'Giải thưởng Signature 2025 Creator vinh danh những cá nhân có đóng góp nổi bật, tạo ra dấu ấn đặc biệt trong năm 2025 – những người mang trong mình tinh thần sáng tạo không ngừng, dám nghĩ dám làm và để lại những giá trị vượt thời gian cho tổ chức và cộng đồng Sun*.',
    hashtagAnchor: 'signature-2025-creator',
    imageLeft: true,
  },
  {
    slug: 'mvp',
    title: 'MVP',
    navLabel: 'MVP',
    icon: '/awards/icon-target.svg',
    quantity: 10,
    quantityUnit: 'Cá nhân',
    prize: '7.000.000 VNĐ',
    description:
      'Giải thưởng MVP (Most Valuable Person) vinh danh những cá nhân có đóng góp vượt trội và tác động mạnh mẽ nhất trong năm – những người không chỉ xuất sắc trong công việc chuyên môn mà còn truyền cảm hứng, nâng tầm cả đội ngũ xung quanh, trở thành biểu tượng của sự cống hiến và tinh thần đồng đội Sun*.',
    hashtagAnchor: 'mvp',
    imageLeft: false,
  },
]
