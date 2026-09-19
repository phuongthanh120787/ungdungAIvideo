import { DocumentAnalysis, VideoScript } from "../types";

export interface SampleLesson {
  id: string;
  name: string;
  subject: string;
  grade: string;
  description: string;
  extractedText: string;
  analysis: DocumentAnalysis;
  defaultScript: VideoScript;
}

export const SAMPLE_LESSONS: SampleLesson[] = [
  {
    id: "tinhoc6-thong-tin-du-lieu",
    name: "Tin học 6: Thông tin và dữ liệu",
    subject: "Tin học",
    grade: "Lớp 6",
    description: "Sách giáo khoa Tin học 6 - Chủ đề 1: Máy tính và cộng đồng",
    extractedText: `BÀI 1: THÔNG TIN VÀ DỮ LIỆU
Môn: Tin học - Lớp 6 (Chương trình GDPT 2018)
Yêu cầu cần đạt:
- Nhận biết được sự khác nhau giữa thông tin và dữ liệu.
- Nêu được ví dụ minh hoạ về thông tin và vật mang tin.
- Giải thích được tầm quan trọng của thông tin trong quyết định của con người.

1. Thông tin và dữ liệu
Quan sát tình huống: An nhận được mẩu giấy có ghi các số: "16:00, 24/10, Sân bóng trường".
- Dòng chữ và các con số in trên giấy là gì? Chúng được gọi là dữ liệu (chữ viết, con số, ký hiệu).
- Khi An đọc và hiểu rằng: "Vào lúc 16 giờ ngày 24/10 có trận giao hữu bóng đá ở sân trường cần đến tham gia", đó chính là thông tin mà An tiếp nhận được.
Kết luận:
- Dữ liệu là các số, văn bản, hình ảnh, âm thanh,... được ghi lại trên vật mang tin.
- Thông tin là những hiểu biết của con người về thế giới xung quanh và về chính bản thân mình, có được qua việc tiếp nhận và xử lý dữ liệu.

2. Vật mang tin
- Vật mang tin là phương tiện dùng để lưu trữ và truyền đạt thông tin (giấy, thẻ nhớ, USB, bảng tin, màn hình máy tính,...).`,
    analysis: {
      lessonTitle: "Thông tin và dữ liệu",
      grade: "Lớp 6",
      subject: "Tin học",
      theme: "Chủ đề 1: Máy tính và cộng đồng",
      keyKnowledge: [
        "Phân biệt giữa dữ liệu (data) và thông tin (information)",
        "Các dạng dữ liệu cơ bản: chữ, số, hình ảnh, âm thanh",
        "Khái niệm vật mang tin và vai trò của thông tin trong ra quyết định",
      ],
      coreConcepts: ["Dữ liệu", "Thông tin", "Vật mang tin", "Xử lý dữ liệu"],
      suitableExamples: [
        "Tin nhắn ngắn gọn: 'Hãy gọi cho tôi lúc 16 giờ' nhưng thiếu ngày tháng",
        "Đèn tín hiệu giao thông màu đỏ (dữ liệu thị giác) báo hiệu 'phải dừng xe' (thông tin)",
        "Con số '38.5' trên nhiệt kế mang thông tin 'bạn đang bị sốt'",
      ],
      curiousProblem:
        "Cùng một dãy chữ số hay bức ảnh, liệu tất cả mọi người có cùng rút ra một thông tin giống nhau không? Dữ liệu và thông tin khác nhau ở điểm cốt lõi nào?",
      hasInsufficientInfo: false,
      warningMessage: "",
    },
    defaultScript: {
      lessonTitle: "Thông tin và dữ liệu",
      grade: "Lớp 6",
      subject: "Tin học",
      style: "Hoạt hình giáo dục",
      targetDuration: 45,
      scenes: [
        {
          id: "s-1",
          sceneNumber: 1,
          sceneName: "Tình huống bất ngờ",
          content: "Bạn An đang ngồi làm bài tập thì nhận được mẩu tin nhắn kỳ lạ trên điện thoại từ bạn Bình.",
          visualDescription: "Hoạt hình 2D sinh động, học sinh THCS cầm điện thoại, tin nhắn hiện rõ: 'Hãy gọi cho mình lúc 16 giờ nhé!'.",
          voiceover: "Chiều nay, An bất ngờ nhận được tin nhắn từ bạn thân: 'Hãy gọi cho mình lúc 16 giờ nhé!'.",
          duration: 8,
          keyVisualType: "message_phone",
        },
        {
          id: "s-2",
          sceneNumber: 2,
          sceneName: "Vấn đề xuất hiện",
          content: "An nhìn đồng hồ và hoang mang vì không biết gọi ngày nào, gọi việc gì hay qua ứng dụng nào.",
          visualDescription: "Đồng hồ quay tích tắc, dấu chấm hỏi to tướng xoay quanh đầu An với nét mặt ngơ ngác đáng yêu.",
          voiceover: "Ủa, nhưng 16 giờ ngày hôm nay hay ngày mai? Gọi điện thoại hay Zalo? Tin nhắn ngắn quá làm sao hiểu hết đây?",
          duration: 8,
          keyVisualType: "clock_confusion",
        },
        {
          id: "s-3",
          sceneNumber: 3,
          sceneName: "Các dạng dữ liệu xung quanh ta",
          content: "Xung quanh An hiện ra vô số chữ cái ABC, chữ số 123, bức ảnh chụp và tiếng chuông reng reng.",
          visualDescription: "Hiệu ứng đồ họa neon nhẹ nhàng: các dòng số, biểu tượng tin nhắn, file ghi âm và tệp ảnh bay lơ lửng.",
          voiceover: "Hằng ngày, chúng ta tiếp xúc với hàng triệu con số, dòng chữ, hình ảnh và âm thanh. Tất cả chúng được gọi chung là DỮ LIỆU!",
          duration: 9,
          keyVisualType: "data_types",
        },
        {
          id: "s-4",
          sceneNumber: 4,
          sceneName: "Kết nối vào bài học",
          content: "Bảng so sánh xuất hiện: Một bên là 'Dữ liệu thô', bên kia là 'Thông tin có ý nghĩa'.",
          visualDescription: "Mô hình mũi tên chuyển đổi: Dữ liệu qua bộ não xử lý biến thành thông tin chỉ dẫn hành động rõ ràng.",
          voiceover: "Nhưng dữ liệu và thông tin có phải là một không? Làm sao để biến những con số thô ráp thành thông tin hữu ích giúp chúng ta đưa ra quyết định?",
          duration: 9,
          keyVisualType: "data_vs_info",
        },
        {
          id: "s-5",
          sceneNumber: 5,
          sceneName: "Câu hỏi khởi động & Chuyển bài",
          content: "Màn hình lớp học sáng bừng, giáo viên và học sinh hào hứng bước vào giờ học mới.",
          visualDescription: "Bảng thông minh hiện chữ to rõ các câu hỏi gợi mở kèm đồ họa chiếc chìa khóa tri thức mở ra cánh cửa bài học.",
          voiceover: "Em hãy suy nghĩ: Thông tin và dữ liệu có giống nhau không? Cùng một dữ liệu, mọi người có thể nhận được cùng một thông tin không? Để tìm câu trả lời, chúng ta cùng khám phá bài học hôm nay!",
          duration: 11,
          keyVisualType: "quiz_hook",
        },
      ],
      warmupQuestions: [
        "Theo em, dữ liệu và thông tin có giống nhau hoàn toàn không?",
        "Cùng một dữ liệu là con số '39', em hãy đoán xem nó có thể mang những thông tin khác nhau nào?",
      ],
      transitionPhrase: "Để tìm câu trả lời, chúng ta cùng khám phá bài học hôm nay!",
    },
  },
  {
    id: "tinhoc7-thiet-bi-vao-ra",
    name: "Tin học 7: Thiết bị vào - Thiết bị ra",
    subject: "Tin học",
    grade: "Lớp 7",
    description: "Sách giáo khoa Tin học 7 - Chủ đề 1: Máy tính và đời sống",
    extractedText: `BÀI 2: THIẾT BỊ VÀO - RA VÀ THIẾT BỊ LƯU TRỮ
Môn: Tin học 7
Mục tiêu:
- Nhận biết và phân loại được các thiết bị vào, thiết bị ra phổ biến.
- Hiểu được chức năng trao đổi thông tin giữa người dùng và máy tính.
Ví dụ:
Khi gõ bàn phím (thiết bị vào), chữ xuất hiện trên màn hình (thiết bị ra).
Nếu mất chuột hoặc bàn phím, con người ra lệnh cho máy tính như thế nào?`,
    analysis: {
      lessonTitle: "Thiết bị vào và thiết bị ra",
      grade: "Lớp 7",
      subject: "Tin học",
      theme: "Chủ đề 1: Máy tính và đời sống",
      keyKnowledge: [
        "Khái niệm thiết bị vào (Input devices) và thiết bị ra (Output devices)",
        "Nguyên lý tương tác hai chiều giữa người dùng và máy tính",
        "Cách phân loại bàn phím, chuột, micro, màn hình, loa, máy in",
      ],
      coreConcepts: ["Thiết bị vào", "Thiết bị ra", "Giao tiếp người - máy"],
      suitableExamples: [
        "Một học sinh muốn ra lệnh cho máy tính nhưng chuột bị hỏng và không có bàn phím",
        "Màn hình cảm ứng trên điện thoại vừa là thiết bị vào vừa là thiết bị ra",
      ],
      curiousProblem:
        "Nếu chiếc máy tính hoàn toàn không có màn hình và loa, nó có còn hoạt động được không và chúng ta có biết nó đang nghĩ gì không?",
      hasInsufficientInfo: false,
      warningMessage: "",
    },
    defaultScript: {
      lessonTitle: "Thiết bị vào và thiết bị ra",
      grade: "Lớp 7",
      subject: "Tin học",
      style: "Lớp học hiện đại",
      targetDuration: 45,
      scenes: [
        {
          id: "s7-1",
          sceneNumber: 1,
          sceneName: "Sự cố trong giờ thực hành",
          content: "Minh ngồi trước bộ máy vi tính trong phòng thực hành Tin học, hí hửng bấm nút nguồn khởi động.",
          visualDescription: "Phòng máy tính THCS hiện đại, quạt chip kêu vù vù, màn hình máy tính bật sáng.",
          voiceover: "Trong giờ thực hành Tin học, Minh chuẩn bị gõ bài văn nhưng bỗng nhận ra... bàn phím và chuột đã biến mất!",
          duration: 8,
          keyVisualType: "classroom",
        },
        {
          id: "s7-2",
          sceneNumber: 2,
          sceneName: "Lúng túng tìm cách ra lệnh",
          content: "Minh thử nói vào máy tính, vẫy tay trước màn hình nhưng máy tính vẫn nằm yên bất động.",
          visualDescription: "Minh gãi đầu bối rối, máy tính hiện biểu cảm ngủ khò ngáy 'Zzz...'",
          voiceover: "Minh gọi: 'Máy tính ơi mở thư mục lên!' nhưng máy tính vẫn im lặng. Làm sao để máy tính hiểu ý chúng ta?",
          duration: 8,
          keyVisualType: "problem_hook",
        },
        {
          id: "s7-3",
          sceneNumber: 3,
          sceneName: "Cầu nối giữa người và máy tính",
          content: "Màn hình xuất hiện bàn phím, chuột, micro và màn hình, tai nghe, máy in xếp thành hai đội.",
          visualDescription: "Đồ họa hai đội thiết bị ngộ nghĩnh: Đội 'Đưa vào' và Đội 'Nhận ra' đối đầu vui nhộn.",
          voiceover: "Để con người và máy tính hiểu nhau, chúng ta cần những 'người phiên dịch' đặc biệt: Thiết bị vào và Thiết bị ra!",
          duration: 9,
          keyVisualType: "data_types",
        },
        {
          id: "s7-4",
          sceneNumber: 4,
          sceneName: "Câu đố về màn hình cảm ứng",
          content: "Một chiếc smartphone xuất hiện: ngón tay chạm vuốt và mắt nhìn thấy hình ảnh phản hồi.",
          visualDescription: "Cận cảnh màn hình cảm ứng điện thoại thông minh: vừa chạm (vào) vừa hiển thị (ra).",
          voiceover: "Vậy chiếc màn hình cảm ứng trên điện thoại của bạn là thiết bị vào hay thiết bị ra nhỉ?",
          duration: 9,
          keyVisualType: "data_vs_info",
        },
        {
          id: "s7-5",
          sceneNumber: 5,
          sceneName: "Câu hỏi khởi động",
          content: "Bảng câu hỏi xuất hiện trên nền lớp học rực rỡ.",
          visualDescription: "Các bạn học sinh cùng hào hứng suy nghĩ và thảo luận.",
          voiceover: "Màn hình cảm ứng thuộc loại thiết bị nào? Nếu không có bàn phím và chuột, còn cách nào đưa lệnh vào máy tính? Để tìm câu trả lời, chúng ta cùng khám phá bài học hôm nay!",
          duration: 11,
          keyVisualType: "quiz_hook",
        },
      ],
      warmupQuestions: [
        "Màn hình cảm ứng trên điện thoại thông minh là thiết bị vào hay thiết bị ra?",
        "Nếu mất hoàn toàn chuột và bàn phím, em có thể dùng cách nào khác để điều khiển máy tính?",
      ],
      transitionPhrase: "Để tìm câu trả lời, chúng ta cùng khám phá bài học hôm nay!",
    },
  },
  {
    id: "khtn6-te-bao",
    name: "Khoa học tự nhiên 6: Tế bào - Đơn vị cơ sở của sự sống",
    subject: "Khoa học tự nhiên",
    grade: "Lớp 6",
    description: "Sách giáo khoa KHTN 6 - Phân môn Sinh học",
    extractedText: `BÀI 12: TẾ BÀO - ĐƠN VỊ CƠ SỞ CỦA SỰ SỐNG
Môn: Khoa học tự nhiên 6
Mục tiêu:
- Nêu được khái niệm tế bào và nhận biết tế bào là đơn vị cấu trúc của mọi cơ thể sống.
- Nhận biết kích thước và hình dạng đa dạng của tế bào.
- So sánh cơ thể sống với ngôi nhà gạch: Ngôi nhà xây từ viên gạch, sinh vật tạo nên từ tế bào.`,
    analysis: {
      lessonTitle: "Tế bào - Đơn vị cơ sở của sự sống",
      grade: "Lớp 6",
      subject: "Khoa học tự nhiên",
      theme: "Chủ đề: Sinh thái và Sinh học",
      keyKnowledge: [
        "Khái niệm tế bào là đơn vị cấu tạo nên mọi sinh vật",
        "Kích thước hiển vi của tế bào và cách quan sát dưới kính hiển vi",
        "Sự phong phú về hình dạng tế bào thực vật, tế bào động vật",
      ],
      coreConcepts: ["Tế bào", "Kính hiển vi", "Đơn vị cơ sở của sự sống"],
      suitableExamples: [
        "Một ngôi nhà khổng lồ xây từ từng viên gạch nhỏ li ti",
        "Quan sát giọt nước ao hồ thấy hàng triệu sinh vật nhỏ bé bơi lội",
      ],
      curiousProblem:
        "Tại sao một cây cổ thụ khổng lồ và một chú kiến nhỏ xíu lại được tạo nên từ cùng một 'viên gạch bí mật'?",
      hasInsufficientInfo: false,
      warningMessage: "",
    },
    defaultScript: {
      lessonTitle: "Tế bào - Đơn vị cơ sở của sự sống",
      grade: "Lớp 6",
      subject: "Khoa học tự nhiên",
      style: "Hoạt hình 3D",
      targetDuration: 45,
      scenes: [
        {
          id: "sk-1",
          sceneNumber: 1,
          sceneName: "Bức tường gạch và sinh vật",
          content: "Bác thợ xây đang xếp từng viên gạch đỏ để xây nên một tòa nhà cao tầng tráng lệ.",
          visualDescription: "Animation 3D: Tòa nhà cao vút và zoom cận cảnh viên gạch nhỏ bé trên bàn tay.",
          voiceover: "Một tòa nhà cao tầng chọc trời được xây nên từ hàng triệu viên gạch nhỏ bé.",
          duration: 8,
          keyVisualType: "brick_wall",
        },
        {
          id: "sk-2",
          sceneNumber: 2,
          sceneName: "Điều kỳ diệu của sinh vật",
          content: "Hình ảnh một chú voi khổng lồ, một cây bàng cổ thụ và một bạn học sinh THCS.",
          visualDescription: "Các sinh vật sống động chuyển động trong thiên nhiên xanh mát.",
          voiceover: "Vậy còn cơ thể con người, chú voi khổng lồ hay cây đại thụ kia được xây nên từ những 'viên gạch' nào?",
          duration: 8,
          keyVisualType: "animals_plants",
        },
        {
          id: "sk-3",
          sceneNumber: 3,
          sceneName: "Zoom sâu dưới kính hiển vi",
          content: "Ống kính hiển vi phóng to hàng ngàn lần vào lá cây và tế bào sống lấp lánh.",
          visualDescription: "Hiệu ứng kính hiển vi: Cấu trúc lục lạp và tế bào sống động chuyển động nhịp nhàng.",
          voiceover: "Dưới mắt thường, chúng ta không thấy được. Nhưng dưới kính hiển vi, một thế giới kỳ diệu hiện ra: đó là TẾ BÀO!",
          duration: 9,
          keyVisualType: "microscope",
        },
        {
          id: "sk-4",
          sceneNumber: 4,
          sceneName: "Đặt vấn đề bí ẩn sự sống",
          content: "Tế bào phân chia từ 1 thành 2, từ 2 thành 4 khiến cơ thể lớn lên mỗi ngày.",
          visualDescription: "Đồ họa tế bào tự phân chia thần kỳ với các hạt năng lượng phát sáng.",
          voiceover: "Có phải mọi sinh vật đều có tế bào giống nhau? Làm thế nào mà những tế bào siêu nhỏ lại làm nên sự sống diệu kỳ?",
          duration: 9,
          keyVisualType: "cell_division",
        },
        {
          id: "sk-5",
          sceneNumber: 5,
          sceneName: "Câu hỏi khởi động",
          content: "Lớp học hiện ra với câu hỏi gợi mở của bài học mới.",
          visualDescription: "Bảng lớp học chiếu câu hỏi lớn kích thích sự tò mò của học sinh.",
          voiceover: "Nếu ví cơ thể là một ngôi nhà, tế bào đóng vai trò gì? Mọi sinh vật xung quanh ta có được tạo nên từ tế bào không? Để tìm câu trả lời, chúng ta cùng khám phá bài học hôm nay!",
          duration: 11,
          keyVisualType: "quiz_hook",
        },
      ],
      warmupQuestions: [
        "Nếu ví cơ thể sống là một ngôi nhà, em hãy đoán xem tế bào tương ứng với bộ phận nào của ngôi nhà?",
        "Theo em, có sinh vật nào chỉ được cấu tạo từ một tế bào duy nhất không?",
      ],
      transitionPhrase: "Để tìm câu trả lời, chúng ta cùng khám phá bài học hôm nay!",
    },
  },
];
