export interface ImagePreset {
  id: string;
  category: "Tin học & Công nghệ" | "Lớp học & Thầy cô" | "Khởi động & Đố vui" | "Khoa học & Đời sống";
  title: string;
  description: string;
  imageUrl: string;
}

export const EDUCATIONAL_IMAGE_PRESETS: ImagePreset[] = [
  // Tin học & Công nghệ
  {
    id: "cs-1",
    category: "Tin học & Công nghệ",
    title: "Phòng thực hành máy tính THCS",
    description: "Học sinh thao tác trên dàn máy tính hiện đại trong phòng tin học",
    imageUrl: "https://image.pollinations.ai/prompt/Vietnamese%20secondary%20school%20students%20in%20modern%20computer%20lab%20learning%20informatics%20clean%202D%20educational%20illustration?width=1280&height=720&nologo=true&seed=10101",
  },
  {
    id: "cs-2",
    category: "Tin học & Công nghệ",
    title: "Dữ liệu và Thông tin số",
    description: "Mạng lưới kết nối các con số nhị phân, dữ liệu và màn hình thông minh",
    imageUrl: "https://image.pollinations.ai/prompt/colorful%20infographic%20digital%20data%20stream%20binary%20code%20numbers%20letters%20cloud%20computing%20educational%20art?width=1280&height=720&nologo=true&seed=10202",
  },
  {
    id: "cs-3",
    category: "Tin học & Công nghệ",
    title: "An toàn thông tin & Mạng Internet",
    description: "Biểu tượng khiên bảo mật, khóa mã hóa và duyệt web an toàn",
    imageUrl: "https://image.pollinations.ai/prompt/cyber%20security%20shield%20lock%20and%20safe%20internet%20browsing%20concept%20for%20school%20students%20vibrant%20illustration?width=1280&height=720&nologo=true&seed=10303",
  },
  {
    id: "cs-4",
    category: "Tin học & Công nghệ",
    title: "Robot & Tư duy lập trình",
    description: "Chú robot thân thiện đồng hành cùng học sinh khám phá công nghệ",
    imageUrl: "https://image.pollinations.ai/prompt/friendly%20cute%20school%20robot%20teaching%20coding%20and%20algorithms%20to%20cheerful%20students%203D%20render%20style?width=1280&height=720&nologo=true&seed=10404",
  },
  {
    id: "cs-5",
    category: "Tin học & Công nghệ",
    title: "Tin nhắn điện thoại bí ẩn",
    description: "Màn hình smartphone hiển thị thông báo tin nhắn bất ngờ",
    imageUrl: "https://image.pollinations.ai/prompt/smartphone%20screen%20closeup%20displaying%20important%20text%20message%20notification%20cheerful%20student%20curious%20expression%20cartoon?width=1280&height=720&nologo=true&seed=10505",
  },

  // Lớp học & Thầy cô
  {
    id: "class-1",
    category: "Lớp học & Thầy cô",
    title: "Học sinh giơ tay hào hứng",
    description: "Không khí lớp học sôi nổi, nhiều học sinh giơ tay phát biểu",
    imageUrl: "https://image.pollinations.ai/prompt/Vietnamese%20middle%20school%20classroom%20students%20raising%20hands%20eagerly%20smiling%20teacher%20at%20chalkboard%20clean%20art?width=1280&height=720&nologo=true&seed=20101",
  },
  {
    id: "class-2",
    category: "Lớp học & Thầy cô",
    title: "Thảo luận nhóm sôi nổi",
    description: "Nhóm bạn học sinh cùng ngồi quanh bàn thảo luận bài học",
    imageUrl: "https://image.pollinations.ai/prompt/group%20of%20four%20secondary%20students%20collaborating%20around%20desk%20working%20on%20project%20bright%20warm%20classroom%20illustration?width=1280&height=720&nologo=true&seed=20202",
  },
  {
    id: "class-3",
    category: "Lớp học & Thầy cô",
    title: "Bảng tương tác thông minh",
    description: "Giáo viên tươi cười hướng dẫn trên bảng tương tác kỹ thuật số",
    imageUrl: "https://image.pollinations.ai/prompt/friendly%20teacher%20pointing%20to%20digital%20smartboard%20in%20modern%20classroom%20clear%20visuals%20inspiring%20education?width=1280&height=720&nologo=true&seed=20303",
  },
  {
    id: "class-4",
    category: "Lớp học & Thầy cô",
    title: "Giờ học thực hành sáng tạo",
    description: "Học sinh khám phá dụng cụ học tập và mô hình trực quan",
    imageUrl: "https://image.pollinations.ai/prompt/curious%20school%20students%20engaged%20in%20creative%20hands-on%20learning%20activity%20vibrant%20digital%20art?width=1280&height=720&nologo=true&seed=20404",
  },

  // Khởi động & Đố vui
  {
    id: "hook-1",
    category: "Khởi động & Đố vui",
    title: "Dấu hỏi chấm khổng lồ",
    description: "Học sinh ngạc nhiên suy ngẫm trước một câu hỏi hóc búa",
    imageUrl: "https://image.pollinations.ai/prompt/thoughtful%20student%20surrounded%20by%20giant%20glowing%20question%20marks%20puzzled%20expression%20fun%20comic%20style?width=1280&height=720&nologo=true&seed=30101",
  },
  {
    id: "hook-2",
    category: "Khởi động & Đố vui",
    title: "Ý tưởng lóe sáng (Bóng đèn Eureka)",
    description: "Bóng đèn vàng phát sáng tượng trưng cho phát hiện thú vị",
    imageUrl: "https://image.pollinations.ai/prompt/glowing%20golden%20lightbulb%20idea%20sparking%20above%20happy%20student%20character%20eureka%20moment%20educational%20vector?width=1280&height=720&nologo=true&seed=30202",
  },
  {
    id: "hook-3",
    category: "Khởi động & Đố vui",
    title: "Đồng hồ đếm ngược thời gian",
    description: "Đồng hồ và thời gian thúc giục sự tò mò giải đố",
    imageUrl: "https://image.pollinations.ai/prompt/dynamic%20ticking%20wall%20clock%20with%20time%20travel%20particles%20and%20numbers%20exciting%20quiz%20atmosphere?width=1280&height=720&nologo=true&seed=30303",
  },
  {
    id: "hook-4",
    category: "Khởi động & Đố vui",
    title: "Bảng câu hỏi khởi động",
    description: "Màn hình đặt ra câu hỏi gợi mở cho toàn thể học sinh",
    imageUrl: "https://image.pollinations.ai/prompt/clean%20modern%20quiz%20screen%20with%20stars%20and%20trophy%20badge%20welcoming%20lesson%20warmup%20challenge?width=1280&height=720&nologo=true&seed=30404",
  },

  // Khoa học & Đời sống
  {
    id: "sci-1",
    category: "Khoa học & Đời sống",
    title: "Khám phá khoa học tự nhiên",
    description: "Thí nghiệm khoa học, ống nghiệm sắc màu và kính hiển vi",
    imageUrl: "https://image.pollinations.ai/prompt/colorful%20science%20laboratory%20glassware%20microscope%20bubbles%20for%20secondary%20students%20educational%20art?width=1280&height=720&nologo=true&seed=40101",
  },
  {
    id: "sci-2",
    category: "Khoa học & Đời sống",
    title: "Vũ trụ và các vì sao",
    description: "Hệ mặt trời, các hành tinh và phi thuyền khám phá",
    imageUrl: "https://image.pollinations.ai/prompt/solar%20system%20planets%20and%20spaceship%20astronomy%20lesson%20illustration%20for%20middle%20school?width=1280&height=720&nologo=true&seed=40202",
  },
  {
    id: "sci-3",
    category: "Khoa học & Đời sống",
    title: "Toán học và hình học trực quan",
    description: "Các khối đa diện, thước đo góc và đồ thị toán học",
    imageUrl: "https://image.pollinations.ai/prompt/geometric%20shapes%20compass%20ruler%20and%20math%20formulas%20clean%20modern%20composition%20education?width=1280&height=720&nologo=true&seed=40303",
  },
];
